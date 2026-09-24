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
import { EmpresasService } from '../../../core/services/empresas.service';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, HeadingLevel,
} from 'docx';

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
  private empresas = inject(EmpresasService);
  private sanitizer = inject(DomSanitizer);
  private messageService = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  // Estado
  partidas = signal<PartidaDiario[]>([]);
  cargando = signal(false);
  expandido = signal<Set<number>>(new Set());
  nombreEmpresa = signal('');

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

    // Cargar nombre de empresa
    const empresaId = this.auth.currentUser()?.empresaId;
    if (empresaId) {
      this.empresas.getOne(empresaId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({ next: (e) => this.nombreEmpresa.set(e.descripcion) });
    }

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

  private getNombreEmpresa(): string {
    return this.nombreEmpresa() || 'Empresa';
  }

  private getUsuarioImpresion(): string {
    const user = this.auth.currentUser();
    return user?.nombre || user?.usuario || '';
  }

  private getFechaHoraImpresion(): string {
    return new Date().toLocaleString('es-HN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  }

  // ========== EXPORTACIONES ==========

  exportPDF(): void {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageW = doc.internal.pageSize.getWidth();

    // Encabezado
    doc.setFontSize(14);
    doc.text('LIBRO DIARIO', pageW / 2, 12, { align: 'center' });

    doc.setFontSize(10);
    doc.text(this.getNombreEmpresa(), pageW / 2, 19, { align: 'center' });

    doc.setFontSize(9);
    doc.text(`Rango: ${this.getRangoFechas()}`, 14, 26);
    doc.text(`Impreso por: ${this.getUsuarioImpresion()}`, 14, 31);
    doc.text(`Fecha impresión: ${this.getFechaHoraImpresion()}`, pageW - 14, 31, { align: 'right' });

    // Línea separadora gris
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.3);
    doc.line(14, 33, pageW - 14, 33);

    let y = 38;
    for (const partida of this.partidas()) {
      if (y > 250) {
        this.agregarPiePDF(doc);
        doc.addPage();
        y = 15;
      }

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`Partida #${partida.nropartida}  |  ${this.formatFechaCorta(partida.fecha)}  |  ${partida.descripcion}`, 14, y);
      y += 5;

      const body = partida.lineas.map(l => [
        l.ctacontable,
        l.descripcionCta || l.descripcion || '',
        l.debito.toFixed(2),
        l.credito.toFixed(2),
      ]);

      body.push(['', 'TOTALES', (partida.totalDebito || 0).toFixed(2), (partida.totalCredito || 0).toFixed(2)]);

      autoTable(doc, {
        startY: y,
        head: [['Cta Contable', 'Descripción', 'Débito', 'Crédito']],
        body,
        theme: 'plain',
        styles: {
          fontSize: 8,
          lineWidth: 0.1,
          lineColor: [150, 150, 150],
        },
        headStyles: {
          fillColor: false,
          textColor: [50, 50, 50],
          fontStyle: 'bold',
          lineWidth: 0.3,
          lineColor: [100, 100, 100],
        },
        margin: { left: 14, right: 14 },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 'auto' },
          2: { halign: 'right', cellWidth: 30 },
          3: { halign: 'right', cellWidth: 30 },
        },
        didDrawPage: () => {
          this.agregarPiePDF(doc);
        },
      });

      y = (doc as any).lastAutoTable.finalY + 8;
    }

    this.agregarPiePDF(doc);

    // Generar blob y mostrar en visor
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

  descargarPDF(): void {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageW = doc.internal.pageSize.getWidth();

    doc.setFontSize(14);
    doc.text('LIBRO DIARIO', pageW / 2, 12, { align: 'center' });
    doc.setFontSize(10);
    doc.text(this.getNombreEmpresa(), pageW / 2, 19, { align: 'center' });
    doc.setFontSize(9);
    doc.text(`Rango: ${this.getRangoFechas()}`, 14, 26);
    doc.text(`Impreso por: ${this.getUsuarioImpresion()}`, 14, 31);
    doc.text(`Fecha impresión: ${this.getFechaHoraImpresion()}`, pageW - 14, 31, { align: 'right' });
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.3);
    doc.line(14, 33, pageW - 14, 33);

    let y = 38;
    for (const partida of this.partidas()) {
      if (y > 250) {
        this.agregarPiePDF(doc);
        doc.addPage();
        y = 15;
      }

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`Partida #${partida.nropartida}  |  ${this.formatFechaCorta(partida.fecha)}  |  ${partida.descripcion}`, 14, y);
      y += 5;

      const body = partida.lineas.map(l => [
        l.ctacontable,
        l.descripcionCta || l.descripcion || '',
        l.debito.toFixed(2),
        l.credito.toFixed(2),
      ]);

      body.push(['', 'TOTALES', (partida.totalDebito || 0).toFixed(2), (partida.totalCredito || 0).toFixed(2)]);

      autoTable(doc, {
        startY: y,
        head: [['Cta Contable', 'Descripción', 'Débito', 'Crédito']],
        body,
        theme: 'plain',
        styles: { fontSize: 8, lineWidth: 0.1, lineColor: [150, 150, 150] },
        headStyles: { fillColor: false, textColor: [50, 50, 50], fontStyle: 'bold', lineWidth: 0.3, lineColor: [100, 100, 100] },
        margin: { left: 14, right: 14 },
        columnStyles: { 0: { cellWidth: 30 }, 1: { cellWidth: 'auto' }, 2: { halign: 'right', cellWidth: 30 }, 3: { halign: 'right', cellWidth: 30 } },
        didDrawPage: () => { this.agregarPiePDF(doc); },
      });

      y = (doc as any).lastAutoTable.finalY + 8;
    }

    this.agregarPiePDF(doc);
    doc.save('libro-diario.pdf');
    this.messageService.add({ severity: 'success', summary: 'PDF descargado', detail: 'Libro Diario descargado' });
  }

  private agregarPiePDF(doc: jsPDF): void {
    const pageH = doc.internal.pageSize.getHeight();
    const pageW = doc.internal.pageSize.getWidth();

    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.3);
    doc.line(14, pageH - 12, pageW - 14, pageH - 12);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(`Impreso por: ${this.getUsuarioImpresion()}`, 14, pageH - 8);
    doc.text(`${this.getFechaHoraImpresion()}`, pageW - 14, pageH - 8, { align: 'right' });
  }

  exportExcel(): void {
    const rows: any[][] = [];

    // Encabezado
    rows.push([this.getNombreEmpresa()]);
    rows.push(['LIBRO DIARIO']);
    rows.push([`Rango: ${this.getRangoFechas()}`]);
    rows.push([`Impreso por: ${this.getUsuarioImpresion()}   |   Fecha: ${this.getFechaHoraImpresion()}`]);
    rows.push([]);

    // Columnas
    rows.push(['Partida', 'Fecha', 'Cta Contable', 'Descripción', 'Débito', 'Crédito']);

    for (const partida of this.partidas()) {
      for (const l of partida.lineas) {
        rows.push([
          partida.nropartida,
          this.formatFechaCorta(partida.fecha),
          l.ctacontable,
          l.descripcionCta || l.descripcion || '',
          l.debito,
          l.credito,
        ]);
      }
      rows.push(['', '', '', 'TOTALES', partida.totalDebito || 0, partida.totalCredito || 0]);
      rows.push([]);
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Libro Diario');

    ws['!cols'] = [
      { wch: 10 }, { wch: 12 }, { wch: 15 }, { wch: 40 }, { wch: 15 }, { wch: 15 },
    ];

    XLSX.writeFile(wb, 'libro-diario.xlsx');
    this.messageService.add({ severity: 'success', summary: 'Excel generado', detail: 'Libro Diario exportado en Excel' });
  }

  exportWord(): void {
    const children: any[] = [];

    // Encabezado
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'LIBRO DIARIO', bold: true, size: 28 })],
    }));
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: this.getNombreEmpresa(), bold: true, size: 22 })],
    }));
    children.push(new Paragraph({
      children: [new TextRun({ text: `Rango: ${this.getRangoFechas()}`, size: 18 })],
    }));
    children.push(new Paragraph({
      children: [new TextRun({ text: `Impreso por: ${this.getUsuarioImpresion()}`, size: 18 })],
    }));
    children.push(new Paragraph({
      children: [new TextRun({ text: `Fecha impresión: ${this.getFechaHoraImpresion()}`, size: 18 })],
    }));
    children.push(new Paragraph({ text: '' }));

    for (const partida of this.partidas()) {
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({
          text: `Partida #${partida.nropartida} - ${this.formatFechaCorta(partida.fecha)} - ${partida.descripcion}`,
          bold: true, size: 20,
        })],
      }));

      const headerRow = new TableRow({
        tableHeader: true,
        children: ['Cta Contable', 'Descripción', 'Débito', 'Crédito'].map(h =>
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 18 })] })],
          })
        ),
      });

      const rows = partida.lineas.map(l =>
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: l.ctacontable, size: 18 })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: l.descripcionCta || l.descripcion || '', size: 18 })] })] }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: l.debito.toFixed(2), size: 18 })], alignment: AlignmentType.RIGHT })],
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: l.credito.toFixed(2), size: 18 })], alignment: AlignmentType.RIGHT })],
            }),
          ],
        })
      );

      rows.push(new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '', size: 18 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'TOTALES', bold: true, size: 18 })] })] }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: (partida.totalDebito || 0).toFixed(2), bold: true, size: 18 })], alignment: AlignmentType.RIGHT })],
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: (partida.totalCredito || 0).toFixed(2), bold: true, size: 18 })], alignment: AlignmentType.RIGHT })],
          }),
        ],
      }));

      const table = new Table({
        rows: [headerRow, ...rows],
        width: { size: 100, type: WidthType.PERCENTAGE },
      });

      children.push(table);
      children.push(new Paragraph({ text: '' }));
    }

    // Pie
    children.push(new Paragraph({ text: '' }));
    children.push(new Paragraph({
      children: [new TextRun({ text: `Impreso por: ${this.getUsuarioImpresion()} | Fecha: ${this.getFechaHoraImpresion()}`, size: 16, color: '666666' })],
    }));

    const doc = new Document({
      sections: [{ children }],
    });

    Packer.toBlob(doc).then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'libro-diario.docx';
      a.click();
      URL.revokeObjectURL(url);
      this.messageService.add({ severity: 'success', summary: 'Word generado', detail: 'Libro Diario exportado en Word' });
    });
  }

  // ========== UTILIDADES ==========

  private formatFecha(fecha: Date): string {
    return fecha.toISOString().split('T')[0];
  }

  formatFechaCorta(fecha: Date | string): string {
    const d = new Date(fecha);
    return d.toLocaleDateString('es-HN');
  }

  getRangoFechas(): string {
    const desde = this.fechaDesde() ? this.formatFechaCorta(this.fechaDesde()!) : 'Inicio';
    const hasta = this.fechaHasta() ? this.formatFechaCorta(this.fechaHasta()!) : 'Hoy';
    return `${desde} al ${hasta}`;
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
