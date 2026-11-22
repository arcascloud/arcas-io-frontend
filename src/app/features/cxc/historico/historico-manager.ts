import { Component, inject, signal, OnInit, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { timeout, catchError, of } from 'rxjs';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { CxcService } from '../../../core/services/cxc.service';
import { AuthService } from '../../../core/services/auth.service';
import { ReportesPrintService, TablaPrint, ColumnaPrint } from '../../../core/services/reportes-print.service';
import { CxcHistorico, CxcCliente } from '../../../core/models/cxc.models';

@Component({
  selector: 'app-historico-manager',
  standalone: true,
  host: { class: 'historico-manager' },
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    TableModule,
    InputNumberModule,
    SelectModule,
    DatePickerModule,
    TagModule,
  ],
  templateUrl: './historico-manager.html',
  styleUrl: './historico-manager.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoricoManager implements OnInit {
  private service = inject(CxcService);
  private msgs = inject(MessageService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private print = inject(ReportesPrintService);

  // ===== FILTROS =====
  /** Nombre exacto del cliente (razón social) — el backend filtra por LIKE */
  cliente = signal<string | null>(null);
  clienteOpciones = signal<{ label: string; value: string }[]>([]);
  fechaDesde = signal<string | null>(null);
  fechaHasta = signal<string | null>(null);

  // ===== DATOS =====
  data = signal<CxcHistorico[]>([]);
  filtered = signal<CxcHistorico[]>([]);
  cargando = signal(false);
  totalRecords = signal(0);

  // ===== SELECCION =====
  selectedRow: CxcHistorico | null = null;

  // ===== PAGINACION =====
  page = signal(1);
  limit = signal(20);

  // ===== TIPOS DE MOVIMIENTO =====
  readonly tipoMovOptions = [
    { label: 'Debito', value: 'D' },
    { label: 'Credito', value: 'C' },
    { label: 'Interés/Mora', value: 'I' },
  ];

  ngOnInit() {
    this.cargarClientes();
    this.cargarHistorico();
  }

  private cargarClientes() {
    this.service.getClientes(1, 1000, '', 4).pipe(
      takeUntilDestroyed(this.destroyRef),
      timeout(15000),
      catchError(() => of({ data: [] as CxcCliente[], total: 0 })),
    ).subscribe((res) => {
      const opciones = (res?.data ?? [])
        .filter((c) => c.sn_activo !== 'N')
        .map((c) => {
          const label = (c.razonsocial && c.razonsocial.trim()) ||
            `${c.nombres ?? ''} ${c.apellidos ?? ''}`.trim();
          return { label, value: label };
        })
        .filter((o) => o.label !== '')
        .sort((a, b) => a.label.localeCompare(b.label, 'es'));
      this.clienteOpciones.set(opciones);
    });
  }

  private cargarHistorico() {
    this.cargando.set(true);
    this.service
      .getHistoricoConFiltros('', this.cliente() ?? '', this.fechaDesde(), this.fechaHasta())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        timeout(15000),
        catchError(() => of([])),
      )
      .subscribe({
        next: (res) => {
          const datos = res ?? [];
          this.data.set(datos);
          this.filtered.set(datos);
          this.totalRecords.set(datos.length);
          this.cargando.set(false);
        },
        error: () => {
          this.cargando.set(false);
          this.msgs.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron cargar los registros históricos',
          });
        },
      });
  }

  buscar() {
    this.cargarHistorico();
  }

  limpiarFiltros() {
    this.cliente.set(null);
    this.fechaDesde.set(null);
    this.fechaHasta.set(null);
    this.selectedRow = null;
    this.cargarHistorico();
  }

  getTipoMovLabel(tipo: string): string {
    const tipos: Record<string, string> = { C: 'Crédito', D: 'Débito', I: 'Interés/Mora' };
    return tipos[tipo] || tipo;
  }

  getTipoMovSeverity(tipo: string): 'success' | 'danger' | 'info' | 'warning' | 'help' {
    if (tipo === 'C') return 'info';
    if (tipo === 'I') return 'help';
    return 'danger';
  }

  moneda(val: any): string {
    const num = Number(val) || 0;
    if (isNaN(num)) return '0.00';
    const partes = num.toFixed(2).split('.');
    partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return partes.join('.');
  }

  getNombreCliente(item: CxcHistorico): string {
    return item.cliente || item.nrocliente || 'Sin nombre';
  }

  getFecha(fecha: string): string {
    if (!fecha) return '';
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return fecha;
    return d.toLocaleDateString('es-HN');
  }

  /**
   * Navega a movimientos pasando el registro completo via router state.
   * El objeto CxcHistorico queda disponible en history.state.movimiento
   * sin serializarse en la URL.
   */
  irAmovimientos(item: CxcHistorico) {
    this.router.navigate(['/cxc/movimientos'], {
      queryParams: { clienteId: item.clienteId },
      state: { movimiento: item },
    });
  }

  // ===== IMPRESIÓN (mismo patrón que reportes/cxc/movimientos) =====

  private metaStr(): string {
    const cliente = this.cliente() ? `Cliente: ${this.cliente()}` : 'Todos los clientes';
    const fd = this.fechaDesde();
    const fh = this.fechaHasta();
    const desde = fd ? this.getFecha(fd) : '';
    const hasta = fh ? this.getFecha(fh) : '';
    const rango = desde || hasta ? `Del: ${desde || 'Inicio'} al ${hasta || 'Fin'}` : 'Todos los períodos';
    return `${rango} | ${cliente}`;
  }

  private buildTablaPrint(): TablaPrint {
    const columnas: ColumnaPrint[] = [
      { titulo: 'Fecha', alinear: 'center', pdf: 14, word: 900, excel: 10 },
      { titulo: 'Nro. Cliente', alinear: 'center', pdf: 15, word: 1000, excel: 11 },
      { titulo: 'Cliente', alinear: 'left', pdf: 50, word: 2400, excel: 30 },
      { titulo: 'Módulo', alinear: 'left', pdf: 18, word: 1100, excel: 14 },
      { titulo: 'Ref.', alinear: 'left', pdf: 16, word: 1000, excel: 11 },
      { titulo: 'Tipo', alinear: 'center', pdf: 15, word: 900, excel: 10 },
      { titulo: 'Concepto', alinear: 'left', excel: 40 },
      { titulo: 'Anulado', alinear: 'center', pdf: 14, word: 800, excel: 9 },
      { titulo: 'Contab.', alinear: 'center', pdf: 14, word: 800, excel: 9 },
      { titulo: 'Importe', alinear: 'right', pdf: 22, word: 1400, excel: 13 },
    ];

    const items = this.filtered();
    const filas: (string | number | null)[][] = items.map((item) => [
      this.getFecha(item.fecharegistro),
      item.nrocliente || '',
      item.cliente || '',
      item.modulo || '',
      item.nroreferencia || '',
      this.getTipoMovLabel(item.tipomov),
      item.concepto || '',
      item.sn_doc_anulado === 'S' ? 'Sí' : 'No',
      item.sn_cotabilizada === 'S' ? 'Sí' : 'No',
      Number(item.importe ?? 0),
    ]);

    const total = items.reduce((s, i) => s + (Number(i.importe) || 0), 0);

    return {
      columnas,
      filas,
      filaTotales: ['', '', '', '', '', '', `TOTAL (${items.length} movimientos)`, '', '', total],
      alineacionesTotales: [
        undefined, undefined, undefined, undefined, undefined,
        undefined, 'right', undefined, undefined, undefined,
      ],
    };
  }

  async exportarPdf() {
    const enc = await this.print.encabezado('HISTÓRICO DE MOVIMIENTOS DE CUENTAS POR COBRAR (CxC)', this.metaStr());
    const tab = this.buildTablaPrint();
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });
    const altoEnc = this.print.pdfEncabezado(doc, enc);
    this.print.pdfTabla(doc, tab, altoEnc, altoEnc);
    this.print.pdfPaginar(doc, enc, altoEnc);
    doc.save(`cxc-historico-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  async exportarExcel() {
    const enc = await this.print.encabezado('HISTÓRICO DE MOVIMIENTOS DE CUENTAS POR COBRAR (CxC)', this.metaStr());
    const tab = this.buildTablaPrint();
    const wb = this.print.nuevoLibro();
    const ws = wb.addWorksheet('Histórico CxC');
    const filaTab = this.print.excelEncabezado(wb, ws, enc, tab);
    this.print.excelTabla(ws, tab, filaTab, 'landscape');
    await this.print.descargarExcel(wb, `cxc-historico-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  async exportarWord() {
    const enc = await this.print.encabezado('HISTÓRICO DE MOVIMIENTOS DE CUENTAS POR COBRAR (CxC)', this.metaStr());
    const tab = this.buildTablaPrint();
    const children = [
      ...this.print.wordEncabezado(enc, 'landscape'),
      this.print.wordTabla(tab, 'landscape'),
    ];
    const doc = this.print.wordDocumento(enc, 'landscape', children);
    const { Packer } = await import('docx');
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cxc-historico-${new Date().toISOString().slice(0, 10)}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
