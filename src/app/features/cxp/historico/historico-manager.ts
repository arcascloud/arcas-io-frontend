import { Component, inject, signal, OnInit, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { timeout, catchError, of } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { CxpService } from '../../../core/services/cxp.service';
import { ReportesPrintService, TablaPrint, ColumnaPrint } from '../../../core/services/reportes-print.service';
import { CxPHistorico } from '../../../core/models/cxp.models';
import { Proveedor } from '../../../core/models/inventario.models';

@Component({
  selector: 'app-cxp-historico-manager',
  standalone: true,
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
export class CxpHistoricoManager implements OnInit {
  private service = inject(CxpService);
  private msgs = inject(MessageService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  private print = inject(ReportesPrintService);

  // ===== FILTROS =====
  /** Nombre exacto del proveedor (razón social) — el backend filtra por LIKE */
  proveedor = signal<string | null>(null);
  proveedorOpciones = signal<{ label: string; value: string }[]>([]);
  fechaDesde = signal<string | null>(null);
  fechaHasta = signal<string | null>(null);

  // ===== DATOS =====
  data = signal<CxPHistorico[]>([]);
  filtered = signal<CxPHistorico[]>([]);
  cargando = signal(false);
  totalRecords = signal(0);

  // ===== SELECCION =====
  selectedRow: CxPHistorico | null = null;

  // ===== PAGINACION =====
  page = signal(1);
  limit = signal(20);

  // ===== TIPOS DE MOVIMIENTO =====
  readonly tipoMovOptions = [
    { label: 'Debito', value: 'D' },
    { label: 'Credito', value: 'C' },
  ];

  ngOnInit() {
    this.cargarProveedores();
    this.cargarHistorico();
  }

  private cargarProveedores() {
    this.service.getProveedores().pipe(
      takeUntilDestroyed(this.destroyRef),
      timeout(15000),
      catchError(() => of([] as Proveedor[])),
    ).subscribe((lista) => {
      const opciones = (lista ?? [])
        .filter((p) => p.sn_activo !== 'N')
        .map((p) => {
          const label = (p.razonsocial && p.razonsocial.trim()) ||
            `${p.nombres ?? ''} ${p.apellidos ?? ''}`.trim();
          return { label, value: label };
        })
        .filter((o) => o.label !== '')
        .sort((a, b) => a.label.localeCompare(b.label, 'es'));
      this.proveedorOpciones.set(opciones);
    });
  }

  private cargarHistorico() {
    this.cargando.set(true);
    this.service.getHistoricoConFiltros(
      '',
      this.proveedor() ?? '',
      this.fechaDesde(),
      this.fechaHasta(),
    ).pipe(
      takeUntilDestroyed(this.destroyRef),
      timeout(15000),
      catchError(() => of([]))
    ).subscribe({
      next: (res) => {
        const datos = res ?? [];
        this.data.set(datos);
        this.filtered.set(datos);
        this.totalRecords.set(datos.length);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los registros historicos' });
      },
    });
  }

  buscar() {
    this.cargarHistorico();
  }

  limpiarFiltros() {
    this.proveedor.set(null);
    this.fechaDesde.set(null);
    this.fechaHasta.set(null);
    this.selectedRow = null;
    this.cargarHistorico();
  }

  getTipoMovLabel(tipo: string): string {
    const tipos: Record<string, string> = { 'C': 'Credito', 'D': 'Debito' };
    return tipos[tipo] || tipo;
  }

  getTipoMovSeverity(tipo: string): 'success' | 'danger' | 'info' {
    if (tipo === 'C') return 'info';
    return 'danger';
  }

  moneda(val: any): string {
    const num = Number(val) || 0;
    if (isNaN(num)) return '0.00';
    const partes = num.toFixed(2).split('.');
    partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return partes.join('.');
  }

  getNombreProveedor(item: CxPHistorico): string {
    return item.proveedor || item.nroproveedor || 'Sin nombre';
  }

  getFecha(fecha: string): string {
    if (!fecha) return '';
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return fecha;
    return d.toLocaleDateString('es-HN');
  }

  irAMovimientos(item: CxPHistorico) {
    this.router.navigate(['/cxp/movimientos'], {
      queryParams: { proveedorId: item.proveedorId },
      state: { movimiento: item },
    });
  }

  // ===== IMPRESIÓN (mismo patrón que reportes/cxp-movimientos) =====

  private metaStr(): string {
    const proveedor = this.proveedor() ? `Proveedor: ${this.proveedor()}` : 'Todos los proveedores';
    const fd = this.fechaDesde();
    const fh = this.fechaHasta();
    const desde = fd ? this.getFecha(fd) : '';
    const hasta = fh ? this.getFecha(fh) : '';
    const rango = desde || hasta ? `Del: ${desde || 'Inicio'} al ${hasta || 'Fin'}` : 'Todos los períodos';
    return `${rango} | ${proveedor}`;
  }

  private buildTablaPrint(): TablaPrint {
    const columnas: ColumnaPrint[] = [
      { titulo: 'Fecha', alinear: 'center', pdf: 14, word: 900, excel: 10 },
      { titulo: 'Nro. Proveedor', alinear: 'center', pdf: 17, word: 1100, excel: 12 },
      { titulo: 'Proveedor', alinear: 'left', pdf: 50, word: 2400, excel: 30 },
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
      item.nroproveedor || '',
      item.proveedor || '',
      item.modulo || '',
      item.nroreferencia || '',
      this.getTipoMovLabel(item.tipomov),
      item.concepto || '',
      item.sn_doc_anulado === 'S' ? 'Sí' : 'No',
      item.sn_contabilizado === 'S' ? 'Sí' : 'No',
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
    const enc = await this.print.encabezado('HISTÓRICO DE MOVIMIENTOS DE CUENTAS POR PAGAR (CxP)', this.metaStr());
    const tab = this.buildTablaPrint();
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });
    const altoEnc = this.print.pdfEncabezado(doc, enc);
    this.print.pdfTabla(doc, tab, altoEnc, altoEnc);
    this.print.pdfPaginar(doc, enc, altoEnc);
    doc.save(`cxp-historico-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  async exportarExcel() {
    const enc = await this.print.encabezado('HISTÓRICO DE MOVIMIENTOS DE CUENTAS POR PAGAR (CxP)', this.metaStr());
    const tab = this.buildTablaPrint();
    const wb = this.print.nuevoLibro();
    const ws = wb.addWorksheet('Histórico CxP');
    const filaTab = this.print.excelEncabezado(wb, ws, enc, tab);
    this.print.excelTabla(ws, tab, filaTab, 'landscape');
    await this.print.descargarExcel(wb, `cxp-historico-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  async exportarWord() {
    const enc = await this.print.encabezado('HISTÓRICO DE MOVIMIENTOS DE CUENTAS POR PAGAR (CxP)', this.metaStr());
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
    a.download = `cxp-historico-${new Date().toISOString().slice(0, 10)}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
