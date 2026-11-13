import { Component, inject, signal, computed, OnInit, DestroyRef, ChangeDetectionStrategy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DrawerModule } from 'primeng/drawer';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../../core/services/api.service';
import { CompraPendientePago, ChequeEmitido, BcoCta, BcoMovimiento } from '../../../core/models/bancos.models';
import { numeroALetras } from '../../../core/utils/numeros-a-letras';

@Component({
  selector: 'app-bancos-cheques',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, RouterLink, TableModule, ButtonModule,
    InputTextModule, InputNumberModule, SelectModule, TagModule, TooltipModule,
    ToastModule, DialogModule, DrawerModule,
  ],
  templateUrl: './cheques.html',
  styleUrl: './cheques.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChequesBancos implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private msgs = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  // Datos
  bancos = signal<any[]>([]);
  cuentas = signal<BcoCta[]>([]);
  facturas = signal<CompraPendientePago[]>([]);
  chequesGenerados = signal<ChequeEmitido[]>([]);
  movimientos = signal<BcoMovimiento[]>([]);
  cuentaSeleccionada = signal<BcoCta | null>(null);
  cargando = signal(false);
  cargandoMovimientos = signal(false);
  emitando = signal(false);
  busqueda = signal('');
  mostrarImpresion = signal(false);
  chequeAImprimir = signal<ChequeEmitido | null>(null);
  dialogConfirmVisible = signal(false);
  confirmMessage = signal('');
  drawerResumenVisible = signal(false);
  /** Posición izquierda del drawer (15px a la derecha del botón "Ver Resumen"). */
  drawerLeft = signal<string>('auto');

  @ViewChild('btnVerResumen') private btnVerResumen?: ElementRef<HTMLElement>;

  // Formulario
  form!: FormGroup;

  ngOnInit() {
    this.form = this.fb.group({
      bcoctasId: [null, Validators.required],
    });
    this.cargarBancos();
    this.cargarCuentas();
  }

  cargarBancos() {
    this.api.get<any[]>('/bancos/bancos').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => { this.bancos.set(data || []); },
    });
  }

  cargarCuentas() {
    this.cargando.set(true);
    this.api.get<any[]>('/bancos/cuentas').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        const ctas = (data || [])
          .filter((c: any) => c.sn_activo === 'S' && c.monedaId === 1) // Solo Lempiras
          .map((c: any) => ({ ...c, bancoId: Number(c.bancoId) }));
        this.cuentas.set(ctas);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las cuentas' });
      },
    });
  }

  onCuentaChange(event: any) {
    const cuentaId = event.value;
    if (cuentaId) {
      const cuenta = this.cuentas().find(c => c.bcoctasId === cuentaId);
      this.cuentaSeleccionada.set(cuenta || null);
      this.cargarMovimientos(cuentaId);
      this.cargarFacturasPendientes();
    } else {
      this.cuentaSeleccionada.set(null);
      this.facturas.set([]);
      this.movimientos.set([]);
    }
  }

  cargarMovimientos(bcoctasId: number) {
    this.cargandoMovimientos.set(true);
    this.api.get<any[]>('/bancos/movimientos', { bcoctasId: String(bcoctasId) })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (data) => { this.movimientos.set(data || []); this.cargandoMovimientos.set(false); },
        error: () => { this.cargandoMovimientos.set(false); },
      });
  }

  cargarFacturasPendientes() {
    this.cargando.set(true);
    this.api.get<any[]>('/cxp/compras-pag').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.facturas.set((data || []).map((f: any) => ({
          ...f,
          total: Number(f.total),
          _selected: false,
          // Inicia vacío (undefined) para que el campo no muestre 0;
          // se completa con el saldo al marcar la factura (toggleFactura).
          _montoPago: undefined,
        })));
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las facturas pendientes' });
      },
    });
  }

  // ── Selección ───────────────────────────────────────────

  /**
   * Abre el drawer de resumen centrado horizontalmente y desplegado de top a
   * bottom de pantalla, SIN tapar el botón "Ver Resumen": si el panel centrado
   * lo alcanzaría (con 15px de margen), se corre a la izquierda del botón.
   */
  abrirResumen() {
    const vw = window.innerWidth;
    const ancho = Math.min(420, Math.round(vw * 0.9));
    let left = Math.round((vw - ancho) / 2);

    const el = this.btnVerResumen?.nativeElement;
    if (el) {
      const r = el.getBoundingClientRect();
      const margen = 15;
      const tapa = left < r.right + margen && left + ancho > r.left - margen;
      if (tapa) {
        const porIzq = r.left - margen - ancho;
        left = porIzq >= 0
          ? Math.round(porIzq)
          : Math.round(Math.min(r.right + margen, vw - ancho));
      }
    }

    this.drawerLeft.set(`${Math.max(0, left)}px`);
    this.drawerResumenVisible.set(true);
  }

  get facturasSeleccionadas(): CompraPendientePago[] {
    return this.facturas().filter(f => f._selected);
  }

  get totalSeleccionado(): number {
    return this.facturasSeleccionadas.reduce((sum, f) => sum + (f._montoPago || f.total), 0);
  }

  /**
   * Saldo de la cuenta seleccionada: Σ Débitos − Σ Créditos,
   * excluyendo movimientos anulados.
   */
  readonly saldoCuenta = computed(() => {
    return this.movimientos()
      .filter(m => m.sn_doc_anulado !== 'S')
      .reduce((suma, m) => suma + (m.dc_debitocredito === 'D' ? Number(m.importe) : -Number(m.importe)), 0);
  });

  /** true cuando el total a pagar excede el saldo de la cuenta */
  readonly saldoInsuficiente = computed(() => {
    const total = this.totalSeleccionado;
    return total > 0 && this.saldoCuenta() < total;
  });

  saldoTexto(): string {
    if (this.cargandoMovimientos()) return 'Cargando…';
    return this.formatCurrency(this.saldoCuenta());
  }

  // Agrupar por proveedor
  get proveedoresSeleccionados(): { proveedorId: number; codproveedor: string; proveedorNombre: string; facturas: CompraPendientePago[]; total: number }[] {
    const mapa = new Map<number, { proveedorId: number; codproveedor: string; proveedorNombre: string; facturas: CompraPendientePago[]; total: number }>();
    for (const f of this.facturasSeleccionadas) {
      if (!mapa.has(f.proveedorId)) {
        mapa.set(f.proveedorId, { proveedorId: f.proveedorId, codproveedor: f.codproveedor, proveedorNombre: f.proveedorNombre, facturas: [], total: 0 });
      }
      const grp = mapa.get(f.proveedorId)!;
      grp.facturas.push(f);
      grp.total += (f._montoPago || f.total);
    }
    return Array.from(mapa.values());
  }

  toggleFactura(factura: CompraPendientePago) {
    factura._selected = !factura._selected;
    if (factura._selected && !factura._montoPago) {
      factura._montoPago = Number(factura.saldo ?? factura.total);
    }
    this.facturas.update(facturas => [...facturas]);
  }

  onMontoPagoChange(factura: CompraPendientePago, valor: number | null) {
    // Campo limpiado por el usuario → queda vacío (undefined), sin forzar 0.01
    if (valor == null) {
      factura._montoPago = undefined;
    } else if (valor > 0 && valor <= factura.total) {
      factura._montoPago = valor;
    } else if (valor > factura.total) {
      factura._montoPago = factura.total;
    } else {
      factura._montoPago = 0.01;
    }
    this.facturas.update(facturas => [...facturas]);
  }

  toggleTodas(event: any) {
    const checked = event.target.checked;
    this.facturas.update(facturas => facturas.map(f => ({
      ...f,
      _selected: checked,
      _montoPago: checked ? Number(f.saldo ?? f.total) : f._montoPago,
    })));
  }

  // ── Emisión ─────────────────────────────────────────────

  confirmarEmision() {
    const grupos = this.proveedoresSeleccionados;
    if (grupos.length === 0) {
      this.msgs.add({ severity: 'warn', summary: 'Atención', detail: 'Seleccione al menos una factura para pagar' });
      return;
    }

    // Validación de saldo antes de abrir el diálogo de confirmación
    const total = this.totalSeleccionado;
    if (this.saldoCuenta() < total) {
      this.msgs.add({
        severity: 'warn',
        summary: 'Saldo insuficiente',
        detail: `Saldo actual ${this.formatCurrency(this.saldoCuenta())} — total a pagar ${this.formatCurrency(total)}`,
      });
      return;
    }

    const texto = grupos.map(g => `${g.proveedorNombre}: L ${g.total.toFixed(2)}`).join('\n');

    this.confirmMessage.set(`Se emitirán ${grupos.length} cheque(s) por un total de L ${total.toFixed(2)}:\n\n${texto}`);
    this.dialogConfirmVisible.set(true);
  }

  aceptarConfirmacion() {
    this.dialogConfirmVisible.set(false);
    this.emitirCheques();
  }

  cancelarConfirmacion() {
    this.dialogConfirmVisible.set(false);
  }

  emitirCheques() {
    const cuenta = this.cuentaSeleccionada();
    if (!cuenta) return;

    this.emitando.set(true);
    const grupos = this.proveedoresSeleccionados;

    // 1 solo request con todos los proveedores
    this.api.post<any>('/bancos/cheques/emitir', {
      bcoctasId: cuenta.bcoctasId,
      bancoId: cuenta.bancoId,
      grupos: grupos.map(grupo => ({
        proveedorId: grupo.proveedorId,
        codproveedor: grupo.codproveedor,
        beneficiario: grupo.proveedorNombre,
        facturas: grupo.facturas.map(f => ({
          compraId: f.compraId,
          saldo: f._montoPago || f.total,
          nroReferencia: f.nroreferencia,
        })),
      })),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.emitando.set(false);
        this.chequesGenerados.set(res.cheques || []);
        this.drawerResumenVisible.set(false);
        this.msgs.add({ severity: 'success', summary: 'Éxito', detail: res.mensaje });
        this.facturas.set([]);
        this.cargarFacturasPendientes();
      },
      error: (err) => {
        this.emitando.set(false);
        const msg = err?.error?.message;
        const detalle =
          (Array.isArray(msg) ? msg.join(' · ') : msg) ||
          err?.error?.error ||
          'Error al emitir cheques';
        this.msgs.add({ severity: 'error', summary: 'No se pudo emitir', detail: detalle });
      },
    });
  }

  // ── Impresión ───────────────────────────────────────────

  imprimirCheque(cheque: ChequeEmitido) {
    this.chequeAImprimir.set(cheque);
    this.mostrarImpresion.set(true);
  }

  cerrarImpresion() {
    this.mostrarImpresion.set(false);
    this.chequeAImprimir.set(null);
  }

  windowPrint() {
    window.print();
  }

  numeroALetrasValor(num: number): string {
    return numeroALetras(num);
  }

  formatCurrency(valor: number): string {
    return new Intl.NumberFormat('es-HN', { style: 'currency', currency: 'HNL' }).format(valor || 0);
  }

  formatFecha(fecha: string): string {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-HN');
  }

  bancoNombre(bancoId: number): string {
    return this.bancos().find(b => b.bancoId === bancoId)?.descripcion || `Banco #${bancoId}`;
  }

  // ── Helpers ─────────────────────────────────────────────

  get fechaHoy(): string {
    return new Date().toLocaleDateString('es-HN', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  get fechaHoyCorta(): string {
    return new Date().toLocaleDateString('es-HN');
  }
}
