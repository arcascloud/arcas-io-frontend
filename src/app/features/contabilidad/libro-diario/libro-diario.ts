import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { ContabilidadService } from '../../../core/services/contabilidad.service';
import { PartidaDiario } from '../../../core/models/contabilidad.models';
import { AuthService } from '../../../core/services/auth.service';
import {
  ReportesPrintService,
  EncabezadoPrint,
  TablaPrint,
  ColumnaPrint,
} from '../../../core/services/reportes-print.service';

import jsPDF from 'jspdf';
import { Packer, Paragraph, TextRun, Table } from 'docx';

@Component({
  selector: 'app-libro-diario',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule,
    InputTextModule, DatePickerModule, ToastModule, TooltipModule, TagModule, CardModule,
    DialogModule,
  ],
  providers: [MessageService],
  templateUrl: './libro-diario.html',
  styleUrl: './libro-diario.scss',
})
export class LibroDiarioComponent implements OnInit {
  private contabilidad = inject(ContabilidadService);
  private auth = inject(AuthService);
  private print = inject(ReportesPrintService);
  private sanitizer = inject(DomSanitizer);
  private messageService = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  // Estado
  partidas = signal<PartidaDiario[]>([]);
  cargando = signal(false);
  expandido = signal<Set<number>>(new Set());

  // Visor PDF
  mostrarVisor = signal(false);
  pdfUrl = signal<SafeResourceUrl | null>(null);

  // Filtros
  auxiliar = signal('');
  fechaDesde = signal<Date | null>(null);
  fechaHasta = signal<Date | null>(null);

  ngOnInit(): void {
    const hoy = new Date();
    this.fechaDesde.set(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
    this.fechaHasta.set(hoy);

    this.buscar();
  }

  buscar(): void {
    this.cargando.set(true);
    const empresaId = this.auth.currentUser()?.empresaId ?? 0;

    const request: any = { empresaId };
    if (this.auxiliar()) request.ctacontable = this.auxiliar();
    if (this.fechaDesde()) request.fechaDesde = this.formatFecha(this.fechaDesde()!);
    if (this.fechaHasta()) request.fechaHasta = this.formatFecha(this.fechaHasta()!);

    this.contabilidad.generarLibroDiario(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.partidas.set(data);
          this.cargando.set(false);
          if (data.length === 0) {
            this.messageService.add({ severity: 'info', summary: 'Sin datos', detail: 'No se encontraron partidas para los filtros seleccionados' });
          }
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al cargar el libro diario' });
          this.cargando.set(false);
        },
      });
  }

  limpiar(): void {
    this.auxiliar.set('');
    this.fechaDesde.set(null);
    this.fechaHasta.set(null);
  }

  toggleFila(nropartida: number): void {
    const set = new Set(this.expandido());
    if (set.has(nropartida)) {
      set.delete(nropartida);
    } else {
      set.add(nropartida);
    }
    this.expandido.set(set);
  }

  isExpandido(nropartida: number): boolean {
    return this.expandido().has(nropartida);
  }

  expandirTodo(): void {
    const set = new Set(this.partidas().map(p => p.nropartida));
    this.expandido.set(set);
  }

  colapsarTodo(): void {
    this.expandido.set(new Set());
  }

  // ========== UTILIDADES DE IMPRESIÓN ==========

  /** Rango de fechas y auxiliar aplicados (línea meta de la impresión) */
  private metaImpresion(): string {
    let meta = `Del: ${this.getRangoFechas()}`;
    if (this.auxiliar()) meta += ` — Auxiliar: ${this.auxiliar()}`;
    return meta;
  }

  /** Encabezado de los archivos exportados (PDF, Excel y Word) */
  private async encabezadoImpresion(): Promise<EncabezadoPrint> {
    return this.print.encabezado('LIBRO DIARIO', this.metaImpresion());
  }

  /** Columnas PDF/Word: una tabla por partida (Cta, Descripción, Débito, Crédito) */
  private readonly columnas: ColumnaPrint[] = [
    { titulo: 'Cta Contable', alinear: 'left', pdf: 30, word: 1700 },
    { titulo: 'Descripción', alinear: 'left' },
    { titulo: 'Débito', alinear: 'right', pdf: 34, word: 1750 },
    { titulo: 'Crédito', alinear: 'right', pdf: 34, word: 1750 },
  ];

  /** Columnas Excel: plano con Partida y Fecha por línea */
  private readonly columnasExcel: ColumnaPrint[] = [
    { titulo: 'Partida', alinear: 'left', excel: 10 },
    { titulo: 'Fecha', alinear: 'left', excel: 13 },
    { titulo: 'Cta Contable', alinear: 'left', excel: 15 },
    { titulo: 'Descripción', alinear: 'left', excel: 40 },
    { titulo: 'Débito', alinear: 'right', excel: 15 },
    { titulo: 'Crédito', alinear: 'right', excel: 15 },
  ];

  /** Tabla de UNA partida (PDF y Word): líneas + totales de la partida */
  private tablaPartida(partida: PartidaDiario): TablaPrint {
    return {
      columnas: this.columnas,
      filas: partida.lineas.map((l) => [
        l.ctacontable,
        l.descripcionCta || l.descripcion || '',
        Number(l.debito) || 0,
        Number(l.credito) || 0,
      ]),
      filaTotales: [
        '',
        'TOTALES',
        Number(partida.totalDebito) || 0,
        Number(partida.totalCredito) || 0,
      ],
      // "TOTALES" a la derecha de Descripción, pegado a los importes
      alineacionesTotales: [undefined, 'right', undefined, undefined],
    };
  }

  /** Tabla única de Excel: todas las partidas con sus líneas */
  private tablaExcel(): TablaPrint {
    const filas: (string | number | null)[][] = [];
    const filasTotales: number[] = [];

    this.partidas().forEach((p, i) => {
      if (i > 0) filas.push(['', '', '', '', '', '']);
      for (const l of p.lineas) {
        filas.push([
          p.nropartida,
          this.formatFechaCorta(p.fecha),
          l.ctacontable,
          l.descripcionCta || l.descripcion || '',
          Number(l.debito) || 0,
          Number(l.credito) || 0,
        ]);
      }
      filasTotales.push(filas.length);
      filas.push([
        '',
        '',
        '',
        'TOTALES',
        Number(p.totalDebito) || 0,
        Number(p.totalCredito) || 0,
      ]);
    });

    return {
      columnas: this.columnasExcel,
      filas,
      filasTotales,
      // "TOTALES" a la derecha de Descripción, pegado a los importes
      alineacionesTotales: [undefined, undefined, undefined, 'right', undefined, undefined],
    };
  }

  // ========== EXPORTACIONES ==========

  /** Genera el PDF y lo muestra en pantalla (visor) */
  async exportPDF(): Promise<void> {
    if (!this.partidas().length) return;
    const doc = await this.construirPDF();
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    this.pdfUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
    this.mostrarVisor.set(true);
  }

  cerrarVisor(): void {
    if (this.pdfUrl()) {
      URL.revokeObjectURL(this.pdfUrl() as any);
    }
    this.pdfUrl.set(null);
    this.mostrarVisor.set(false);
  }

  async descargarPDF(): Promise<void> {
    if (!this.partidas().length) return;
    const doc = await this.construirPDF();
    doc.save('libro-diario.pdf');
    this.messageService.add({ severity: 'success', summary: 'PDF descargado', detail: 'Libro Diario descargado' });
  }

  /**
   * PDF: encabezado compartido + bloque de partida con etiquetas alineadas
   * (`Partida No.:` / `Fecha......:` / `Concepto...:`) + tabla por partida
   * (filetes discontinuos, importes en 0.00 suprimidos y totales de la
   * partida) + encabezado/pie paginados.
   */
  private async construirPDF(): Promise<jsPDF> {
    const enc = await this.encabezadoImpresion();
    const doc = new jsPDF('p', 'mm', 'a4');
    const altoEnc = this.print.pdfEncabezado(doc, enc);
    const limite = doc.internal.pageSize.getHeight() - 22;
    const anchoUtil = doc.internal.pageSize.getWidth() - 20;

    let y = altoEnc;
    for (const partida of this.partidas()) {
      const concepto = doc.splitTextToSize(`Concepto...: ${partida.descripcion}`, anchoUtil) as string[];

      // Reserva: 2 líneas fijas + concepto + línea en blanco + cabecera + 1 fila
      const altoBloque = 4.5 * (2 + concepto.length) + 2 + 16;
      if (y + altoBloque > limite) {
        doc.addPage();
        y = altoEnc;
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Partida No.: ${String(partida.nropartida).padStart(10, '0')}`, 10, y);
      y += 4.5;
      doc.text(`Fecha......: ${this.formatFechaCorta(partida.fecha)}`, 10, y);
      y += 4.5;
      for (const linea of concepto) {
        doc.text(linea, 10, y);
        y += 4.5;
      }
      y += 2; // línea en blanco antes de la tabla

      this.print.pdfTabla(doc, this.tablaPartida(partida), y, altoEnc);
      y = ((doc as any).lastAutoTable?.finalY ?? y) + 9;
    }

    this.print.pdfPaginar(doc, enc, altoEnc);
    return doc;
  }

  /** Excel con letterhead (logo, empresa, datos fiscales) vía exceljs */
  async exportExcel(): Promise<void> {
    if (!this.partidas().length) return;

    const enc = await this.encabezadoImpresion();
    const tab = this.tablaExcel();
    const wb = this.print.nuevoLibro();
    const ws = wb.addWorksheet('Libro Diario');
    const filaCabecera = this.print.excelEncabezado(wb, ws, enc, tab);
    this.print.excelTabla(ws, tab, filaCabecera, 'landscape');
    await this.print.descargarExcel(wb, 'libro-diario.xlsx');

    this.messageService.add({ severity: 'success', summary: 'Excel generado', detail: 'Libro Diario exportado en Excel' });
  }

  /** Word: encabezado compartido repetido en cada página + bloque de partida */
  async exportWord(): Promise<void> {
    if (!this.partidas().length) return;

    const enc = await this.encabezadoImpresion();
    const children: (Paragraph | Table)[] = [];

    for (const partida of this.partidas()) {
      children.push(
        new Paragraph({
          spacing: { before: 280, after: 0 },
          children: [
            new TextRun({
              text: `Partida No.: ${String(partida.nropartida).padStart(10, '0')}`,
              bold: true,
              size: 20,
            }),
          ],
        }),
        new Paragraph({
          spacing: { after: 0 },
          children: [new TextRun({ text: `Fecha......: ${this.formatFechaCorta(partida.fecha)}`, size: 20 })],
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: `Concepto...: ${partida.descripcion}`, size: 20 })],
        }),
      );
      children.push(this.print.wordTabla(this.tablaPartida(partida), 'portrait'));
    }

    const documento = this.print.wordDocumento(enc, 'portrait', children);

    const blob = await Packer.toBlob(documento);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'libro-diario.docx';
    a.click();
    URL.revokeObjectURL(url);

    this.messageService.add({ severity: 'success', summary: 'Word generado', detail: 'Libro Diario exportado en Word' });
  }

  // ========== UTILIDADES ==========

  private formatFecha(fecha: Date): string {
    return fecha.toISOString().split('T')[0];
  }

  formatFechaCorta(fecha: Date | string): string {
    const d = new Date(fecha);
    return d.toLocaleDateString('es-HN');
  }

  /** Rango de fechas del criterio: "1/10/2026 al 4/10/2026" (sin ceros a la izquierda) */
  getRangoFechas(): string {
    const desde = this.fechaDesde() ? this.fechaSinCero(this.fechaDesde()!) : 'Inicio';
    const hasta = this.fechaHasta() ? this.fechaSinCero(this.fechaHasta()!) : 'Hoy';
    return `${desde} al ${hasta}`;
  }

  /** Fecha d/m/aaaa SIN ceros a la izquierda (formato del criterio del encabezado) */
  private fechaSinCero(fecha: Date): string {
    return `${fecha.getDate()}/${fecha.getMonth() + 1}/${fecha.getFullYear()}`;
  }

  get granTotalDebito(): number {
    return this.partidas().reduce((s, p) => s + (p.totalDebito || 0), 0);
  }

  get granTotalCredito(): number {
    return this.partidas().reduce((s, p) => s + (p.totalCredito || 0), 0);
  }

  get totalPartidas(): number {
    return this.partidas().length;
  }
}
