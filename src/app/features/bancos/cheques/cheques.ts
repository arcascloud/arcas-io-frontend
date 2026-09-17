import { Component, inject, signal, OnInit, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
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
import { MessageService } from 'primeng/api';
import { ApiService } from '../../../core/services/api.service';
import { CompraPendientePago, ChequeEmitido, BcoCta } from '../../../core/models/bancos.models';
import { numeroALetras } from '../../../core/utils/numeros-a-letras';

@Component({
  selector: 'app-bancos-cheques',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, RouterLink, TableModule, ButtonModule,
    InputTextModule, InputNumberModule, SelectModule, TagModule, TooltipModule,
    ToastModule, DialogModule,
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
  cuentaSeleccionada = signal<BcoCta | null>(null);
  cargando = signal(false);
  emitando = signal(false);
  busqueda = signal('');
  mostrarImpresion = signal(false);
  chequeAImprimir = signal<ChequeEmitido | null>(null);
  dialogConfirmVisible = signal(false);
  confirmMessage = signal('');

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
      this.cargarFacturasPendientes();
    } else {
      this.cuentaSeleccionada.set(null);
      this.facturas.set([]);
    }
  }

  cargarFacturasPendientes() {
    this.cargando.set(true);
    this.api.get<any[]>('/cxp/compras-pag').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.facturas.set((data || []).map((f: any) => {
          const total = Number(f.total);
          const saldo = f.saldo != null ? Number(f.saldo) : total;
          return {
            ...f,
            total,
            _selected: false,
            _montoPago: saldo,
          };
        }));
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las facturas pendientes' });
      },
    });
  }

  // ── Selección ───────────────────────────────────────────

  get facturasSeleccionadas(): CompraPendientePago[] {
    return this.facturas().filter(f => f._selected);
  }

  get totalSeleccionado(): number {
    return this.facturasSeleccionadas.reduce((sum, f) => sum + (f._montoPago || f.total), 0);
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
      factura._montoPago = factura.saldo ?? factura.total;
    }
    this.facturas.update(facturas => [...facturas]);
  }

  onMontoPagoChange(factura: CompraPendientePago, valor: number) {
    if (valor > 0 && valor <= factura.total) {
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
      _montoPago: checked ? (f.saldo ?? f.total) : f._montoPago,
    })));
  }

  // ── Emisión ─────────────────────────────────────────────

  confirmarEmision() {
    const grupos = this.proveedoresSeleccionados;
    if (grupos.length === 0) {
      this.msgs.add({ severity: 'warn', summary: 'Atención', detail: 'Seleccione al menos una factura para pagar' });
      return;
    }

    const total = this.totalSeleccionado;
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
        this.msgs.add({ severity: 'success', summary: 'Éxito', detail: res.mensaje });
        this.facturas.set([]);
        this.cargarFacturasPendientes();
      },
      error: (err) => {
        this.emitando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al emitir cheques' });
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
