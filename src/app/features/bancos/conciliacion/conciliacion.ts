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
import { FileUploadModule } from 'primeng/fileupload';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { ToolbarModule } from 'primeng/toolbar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ApiService } from '../../../core/services/api.service';
import { BcoCta } from '../../../core/models/bancos.models';

interface LineaCsv {
  fecmovbco: Date | null;
  concepto: string;
  nrorefencia: string;
  importe: number;
  naturaleza: 'D' | 'C';
  sn_conciliado?: string;
  bcomovimientosId?: number;
  _seleccionada?: boolean;
}

interface ResumenMatching {
  totalRegistros: number;
  conciliados: number;
  diferencias: number;
  totalConciliado: number;
  totalDiferencia: number;
  totalEstadoCuenta: number;
}

@Component({
  selector: 'app-conciliacion-bancaria',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, RouterLink,
    TableModule, ButtonModule, InputTextModule, InputNumberModule,
    SelectModule, TagModule, TooltipModule, ToastModule,
    FileUploadModule, DatePickerModule, DialogModule, ToolbarModule,
    ConfirmDialogModule,
  ],
  templateUrl: './conciliacion.html',
  styleUrl: './conciliacion.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConciliacionBancaria implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private msgs = inject(MessageService);
  private confirm = inject(ConfirmationService);
  private destroyRef = inject(DestroyRef);

  // Datos
  bancos = signal<any[]>([]);
  monedas = signal<any[]>([]);
  cuentas = signal<BcoCta[]>([]);
  cuentasFiltradas = signal<BcoCta[]>([]);

  // Estado
  cargando = signal(false);
  cuentasCargadas = signal(false);
  paso = signal<'seleccion' | 'archivo' | 'preview' | 'resultado'>('seleccion');

  // Filtros
  filtroBanco = signal<number | null>(null);

  // Archivo CSV
  archivoSeleccionado = signal<File | null>(null);
  lineasCsv = signal<LineaCsv[]>([]);
  totalRegistrosCsv = signal(0);

  // Matching
  resumen = signal<ResumenMatching | null>(null);
  detalles = signal<LineaCsv[]>([]);

  // Formulario encabezado
  formEncabezado!: FormGroup;

  // Conciliaciones guardadas
  historial = signal<any[]>([]);

  ngOnInit() {
    this.formEncabezado = this.fb.group({
      ctabcoId: [null, Validators.required],
      fechaDesde: [null],
      fechaHasta: [null],
      saldoInicial: [0],
      saldoFinal: [0],
    });
    this.cargarBancos();
    this.cargarMonedas();
    this.cargarCuentas();
  }

  // ── Carga de datos ──

  private cargarBancos() {
    this.api.get<any[]>('/bancos/bancos').pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (res) => { this.bancos.set(res ?? []); },
    });
  }

  private cargarMonedas() {
    this.api.get<any[]>('/parametros/monedas').pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (res) => { this.monedas.set(res ?? []); },
    });
  }

  private cargarCuentas() {
    this.cargando.set(true);
    this.api.get<BcoCta[]>('/bancos/cuentas').pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (res) => {
        this.cuentas.set(res ?? []);
        this.cuentasFiltradas.set(res ?? []);
        this.cuentasCargadas.set(true);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las cuentas bancarias' });
      },
    });
  }

  // ── Selección de cuenta ──

  get cuentasFiltradasPorBanco(): BcoCta[] {
    const banId = this.filtroBanco();
    if (!banId) return this.cuentas();
    return this.cuentas().filter(c => c.bancoId === banId);
  }

  seleccionarCuenta(ctabcoId: number) {
    this.formEncabezado.patchValue({ ctabcoId });
    this.paso.set('archivo');
  }

  // ── Archivo CSV ──

  onArchivoSeleccionado(event: any) {
    const file = event.files?.[0];
    if (!file) return;
    this.archivoSeleccionado.set(file);
  }

  parsearArchivo() {
    const file = this.archivoSeleccionado();
    if (!file) return;

    this.cargando.set(true);
    const formData = new FormData();
    formData.append('file', file);

    this.api.post<any[]>('/bancos/conciliaciones/parsear-csv', formData, { sinContexto: true }).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (res) => {
        const lineas = (res ?? []).map((l: any) => ({
          ...l,
          fecmovbco: l.fecmovbco ? new Date(l.fecmovbco) : null,
          _seleccionada: true,
        }));
        this.lineasCsv.set(lineas);
        this.totalRegistrosCsv.set(lineas.length);
        this.paso.set('preview');
        this.cargando.set(false);
        this.msgs.add({ severity: 'success', summary: 'CSV parseado', detail: `${lineas.length} registros encontrados` });
      },
      error: () => {
        this.cargando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudo parsear el archivo CSV' });
      },
    });
  }

  // ── Matching ──

  ejecutarMatching() {
    const ctabcoId = this.formEncabezado.value.ctabcoId;
    const empresaId = this.api['auth']?.currentUser()?.empresaId;
    if (!ctabcoId || !empresaId) return;

    const lineasSeleccionadas = this.lineasCsv().filter(l => l._seleccionada);
    if (lineasSeleccionadas.length === 0) {
      this.msgs.add({ severity: 'warn', summary: 'Sin datos', detail: 'Seleccione al menos una línea del CSV' });
      return;
    }

    this.cargando.set(true);
    this.api.post<any>('/bancos/conciliaciones/matching', {
      bcoctasId: ctabcoId,
      empresaId,
      lineasCsv: lineasSeleccionadas,
    }, { sinContexto: true }).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (res) => {
        const detalles = (res?.detalles ?? []).map((d: any) => ({
          ...d,
          fecmovbco: d.fecmovbco ? new Date(d.fecmovbco) : null,
          _seleccionada: true,
        }));
        this.detalles.set(detalles);
        this.resumen.set(res?.resumen ?? null);
        this.paso.set('resultado');
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudo ejecutar el matching' });
      },
    });
  }

  // ── Guardar conciliación ──

  guardarConciliacion() {
    const ctabcoId = this.formEncabezado.value.ctabcoId;
    if (!ctabcoId) return;

    const detalles = this.detalles();
    if (detalles.length === 0) {
      this.msgs.add({ severity: 'warn', summary: 'Sin datos', detail: 'No hay detalles para guardar' });
      return;
    }

    this.confirm.confirm({
      message: `¿Guardar conciliación con ${detalles.length} registros?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Guardar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.cargando.set(true);
        this.api.post<any>('/bancos/conciliaciones', {
          ctabcoId,
          fechaDesde: this.formEncabezado.value.fechaDesde,
          fechaHasta: this.formEncabezado.value.fechaHasta,
          saldoInicial: this.formEncabezado.value.saldoInicial || 0,
          saldoFinal: this.formEncabezado.value.saldoFinal || 0,
          detalles: detalles.map(d => ({
            fecmovbco: d.fecmovbco,
            nrorefencia: d.nrorefencia,
            concepto: d.concepto,
            importe: d.importe,
            naturaleza: d.naturaleza,
            sn_conciliado: d.sn_conciliado || 'N',
            bcomovimientosId: d.bcomovimientosId || null,
          })),
        }).pipe(
          takeUntilDestroyed(this.destroyRef),
        ).subscribe({
          next: (res) => {
            this.cargando.set(false);
            this.msgs.add({ severity: 'success', summary: 'Guardado', detail: `Conciliación #${res?.bcoconcilacionId} guardada` });
            this.nueva();
          },
          error: () => {
            this.cargando.set(false);
            this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la conciliación' });
          },
        });
      },
    });
  }

  // ── Nueva conciliación ──

  nueva() {
    this.paso.set('seleccion');
    this.archivoSeleccionado.set(null);
    this.lineasCsv.set([]);
    this.detalles.set([]);
    this.resumen.set(null);
    this.totalRegistrosCsv.set(0);
    this.formEncabezado.reset({ ctabcoId: null, fechaDesde: null, fechaHasta: null, saldoInicial: 0, saldoFinal: 0 });
  }

  // ── Utilidades ──

  moneda(val: any): string {
    const num = Number(val) || 0;
    return num.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  getFecha(fecha: Date | string | null): string {
    if (!fecha) return '-';
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return String(fecha);
    return d.toLocaleDateString('es-HN');
  }

  toggleSeleccionLinea(linea: LineaCsv) {
    linea._seleccionada = !linea._seleccionada;
  }

  toggleSeleccionarTodas() {
    const todas = this.lineasCsv();
    const todasSeleccionadas = todas.every(l => l._seleccionada);
    todas.forEach(l => l._seleccionada = !todasSeleccionadas);
  }

  seleccionadasCount(): number {
    return this.lineasCsv().filter(l => l._seleccionada).length;
  }

  // ── Helpers para tabla resultado ──

  getDetalleBanco(det: any): string {
    if (!det.movimiento) return '-';
    const m = det.movimiento;
    return `${m.tipomov || ''} - Ref: ${m.nroreferencia || '-'} - ${this.moneda(m.importe)}`;
  }

  // ── Helpers bancos/cuentas ──

  bancoNombre(bancoId: number): string {
    return this.bancos().find(b => b.bancoId === bancoId)?.descripcion || `Banco #${bancoId}`;
  }

  monedaNombre(monedaId: number): string {
    return this.monedas().find(m => m.monedaId === monedaId)?.descripcion || `Moneda #${monedaId}`;
  }

  getCuentaNumero(ctabcoId: number): string {
    const c = this.cuentas().find(ct => (ct as any).bcoctasId === ctabcoId);
    return (c as any)?.nrocuenta || '-';
  }

  get cuentasUnicas(): { bancoId: number; bancoNombre: string }[] {
    const map = new Map<number, string>();
    this.cuentas().forEach(c => {
      if (!map.has(c.bancoId)) {
        map.set(c.bancoId, this.bancoNombre(c.bancoId));
      }
    });
    return Array.from(map.entries()).map(([bancoId, bancoNombre]) => ({ bancoId, bancoNombre }));
  }
}
