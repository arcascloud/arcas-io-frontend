import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { ContabilidadService } from '../../../core/services/contabilidad.service';
import { AuthService } from '../../../core/services/auth.service';
import { EmpresasService } from '../../../core/services/empresas.service';
import { LibroMayorItem } from '../../../core/models/contabilidad.models';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, HeadingLevel,
} from 'docx';

@Component({
  selector: 'app-libro-mayor',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule,
    InputNumberModule, InputTextModule, SelectModule, ToastModule,
    CardModule, TooltipModule, DialogModule,
  ],
  providers: [MessageService],
  templateUrl: './libro-mayor.html',
  styleUrl: './libro-mayor.scss',
})
export class LibroMayorComponent implements OnInit {
  private contabilidad = inject(ContabilidadService);
  private auth = inject(AuthService);
  private empresas = inject(EmpresasService);
  private sanitizer = inject(DomSanitizer);
  private messageService = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  // Visor PDF
  mostrarVisor = signal(false);
  pdfUrl = signal<SafeResourceUrl | null>(null);

  // Filtros
  periodo = signal(new Date().getMonth() + 1);
  anio = signal(new Date().getFullYear());
  nivelMaximo = signal<number>(99);

  // Niveles cargados desde API
  niveles = signal<{ label: string; value: number }[]>([]);

  // Estado
  cargando = signal(false);
  datos = signal<LibroMayorItem[]>([]);
  nombreEmpresa = signal('');
  expandido = signal<Set<string>>(new Set());

  // Meses
  readonly meses = [
    { label: 'Enero', value: 1 }, { label: 'Febrero', value: 2 }, { label: 'Marzo', value: 3 },
    { label: 'Abril', value: 4 }, { label: 'Mayo', value: 5 }, { label: 'Junio', value: 6 },
    { label: 'Julio', value: 7 }, { label: 'Agosto', value: 8 }, { label: 'Septiembre', value: 9 },
    { label: 'Octubre', value: 10 }, { label: 'Noviembre', value: 11 }, { label: 'Diciembre', value: 12 },
  ];

  // Datos filtrados
  datosFiltrados = computed(() => {
    const maxNivel = this.nivelMaximo();
    return this.datos().filter(d => {
      if (maxNivel !== 99 && (Number(d.nivel) || 0) > maxNivel) return false;
      return true;
    });
  });

  // Totales — siempre en positivo (regla contable: nunca saldos negativos)
  totalDebe = computed(() => this.datosFiltrados().reduce((sum, r) => sum + Math.abs(Number(r.debe) || 0), 0));
  totalHaber = computed(() => this.datosFiltrados().reduce((sum, r) => sum + Math.abs(Number(r.haber) || 0), 0));
  totalSaldoAcum = computed(() => this.datosFiltrados().reduce((sum, r) => sum + Math.abs(Number(r.saldoAcum) || 0), 0));
  totalSaldo = computed(() => this.datosFiltrados().reduce((sum, r) => sum + Math.abs(Number(r.saldo) || 0), 0));

  ngOnInit(): void {
    const empresaId = this.auth.currentUser()?.empresaId;
    if (empresaId) {
      this.empresas.getOne(empresaId).pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(e => this.nombreEmpresa.set(e.descripcion));
    }

    // Cargar niveles contables desde API
    this.contabilidad.getNiveles().pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (niveles) => {
          const activos = niveles
            .filter(n => n.sn_activo === 'S')
            .sort((a, b) => Number(a.nivel) - Number(b.nivel));
          const maxNivel = activos.length > 0 ? Number(activos[activos.length - 1].nivel) : 6;
          const opciones = [
            { label: `Todos (N1–N${maxNivel})`, value: 99 },
            ...activos.map(n => ({ label: `Nivel ${n.nivel}`, value: Number(n.nivel) })),
          ];
          this.niveles.set(opciones);
          this.nivelMaximo.set(99);
        },
        error: () => {
          // Fallback si falla la API
          this.niveles.set([
            { label: 'Todos', value: 99 },
            { label: 'Nivel 1', value: 1 }, { label: 'Nivel 2', value: 2 },
            { label: 'Nivel 3', value: 3 }, { label: 'Nivel 4', value: 4 },
            { label: 'Nivel 5', value: 5 }, { label: 'Nivel 6', value: 6 },
          ]);
        },
      });
  }

  buscar(): void {
    this.cargando.set(true);
    this.contabilidad.generarLibroMayor({
      empresaId: this.auth.currentUser()?.empresaId ?? 0,
      periodo: this.periodo(),
      anio: this.anio(),
    }).pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (data) => {
        this.datos.set(data);
        this.expandido.set(new Set());
        this.messageService.add({
          severity: 'success',
          summary: 'Generado',
          detail: `Libro Mayor: ${data.length} cuentas`,
        });
        this.cargando.set(false);
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'Error al generar libro mayor',
        });
        this.cargando.set(false);
      },
    });
  }

  limpiar(): void {
    this.datos.set([]);
  }

  getMesLabel(): string {
    return this.meses.find(m => m.value === this.periodo())?.label ?? '';
  }

  /** Indentación visual según nivel de cuenta */
  getIndentacion(nivel: number): string {
    return `${(nivel - 1) * 1.5}rem`;
  }

  /** Clase CSS según nivel */
  getNivelClass(nivel: number): string {
    return `nivel-${nivel}`;
  }

  /** Formateo de número — SIEMPRE en positivo (regla contable: nunca saldos negativos) */
  formatNumber(value: number): string {
    const num = Math.abs(Number(value) || 0);
    return num.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

  private getTituloPeriodo(): string {
    return `Libro Mayor — ${this.getMesLabel()} ${this.anio()}`;
  }

  private getBodyRows(): string[][] {
    return this.datosFiltrados().map(d => [
      d.ctacontable ?? '',
      d.descripcion ?? '',
      `N${d.nivel ?? ''}`,
      (Number(d.saldoAcum) || 0).toFixed(2),
      d.debe > 0 ? (Number(d.debe) || 0).toFixed(2) : '-',
      d.haber > 0 ? (Number(d.haber) || 0).toFixed(2) : '-',
      (Number(d.saldo) || 0).toFixed(2),
    ]);
  }

  private getTotalesRow(): string[] {
    return [
      'TOTALES', '', '',
      (Number(this.totalSaldoAcum()) || 0).toFixed(2),
      (Number(this.totalDebe()) || 0).toFixed(2),
      (Number(this.totalHaber()) || 0).toFixed(2),
      (Number(this.totalSaldo()) || 0).toFixed(2),
    ];
  }

  // ========== EXPORTACIONES ==========

  exportPDF(): void {
    const doc = new jsPDF('l', 'mm', 'letter'); // landscape
    const pageW = doc.internal.pageSize.getWidth();

    // Encabezado
    doc.setFontSize(14);
    doc.text('LIBRO MAYOR', pageW / 2, 12, { align: 'center' });
    doc.setFontSize(10);
    doc.text(this.getNombreEmpresa(), pageW / 2, 18, { align: 'center' });
    doc.setFontSize(9);
    doc.text(this.getTituloPeriodo(), 14, 25);
    doc.text(`Impreso por: ${this.getUsuarioImpresion()}`, 14, 30);
    doc.text(`Fecha impresión: ${this.getFechaHoraImpresion()}`, pageW - 14, 30, { align: 'right' });

    // Línea separadora
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.3);
    doc.line(14, 33, pageW - 14, 33);

    const head = [['Cuenta', 'Descripción', 'Nivel', 'Saldo Acum.', 'Debe', 'Haber', 'Saldo (D/C)']];
    const body = this.getBodyRows();
    body.push(this.getTotalesRow());

    autoTable(doc, {
      startY: 36,
      head,
      body,
      theme: 'plain',
      styles: { fontSize: 8, lineWidth: 0.1, lineColor: [150, 150, 150] },
      headStyles: {
        fillColor: false,
        textColor: [50, 50, 50],
        fontStyle: 'bold',
        lineWidth: 0.3,
        lineColor: [100, 100, 100],
      },
      margin: { left: 14, right: 14 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 'auto' },
        2: { halign: 'center', cellWidth: 15 },
        3: { halign: 'right', cellWidth: 30 },
        4: { halign: 'right', cellWidth: 30 },
        5: { halign: 'right', cellWidth: 30 },
        6: { halign: 'right', cellWidth: 30 },
      },
      didDrawPage: () => { this.agregarPiePDF(doc); },
    });

    this.agregarPiePDF(doc);

    // Visor
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
    const doc = new jsPDF('l', 'mm', 'letter');
    const pageW = doc.internal.pageSize.getWidth();

    doc.setFontSize(14);
    doc.text('LIBRO MAYOR', pageW / 2, 12, { align: 'center' });
    doc.setFontSize(10);
    doc.text(this.getNombreEmpresa(), pageW / 2, 18, { align: 'center' });
    doc.setFontSize(9);
    doc.text(this.getTituloPeriodo(), 14, 25);
    doc.text(`Impreso por: ${this.getUsuarioImpresion()}`, 14, 30);
    doc.text(`Fecha impresión: ${this.getFechaHoraImpresion()}`, pageW - 14, 30, { align: 'right' });
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.3);
    doc.line(14, 33, pageW - 14, 33);

    const head = [['Cuenta', 'Descripción', 'Nivel', 'Saldo Acum.', 'Debe', 'Haber', 'Saldo (D/C)']];
    const body = this.getBodyRows();
    body.push(this.getTotalesRow());

    autoTable(doc, {
      startY: 36,
      head,
      body,
      theme: 'plain',
      styles: { fontSize: 8, lineWidth: 0.1, lineColor: [150, 150, 150] },
      headStyles: { fillColor: false, textColor: [50, 50, 50], fontStyle: 'bold', lineWidth: 0.3, lineColor: [100, 100, 100] },
      margin: { left: 14, right: 14 },
      columnStyles: {
        0: { cellWidth: 25 }, 1: { cellWidth: 'auto' }, 2: { halign: 'center', cellWidth: 15 },
        3: { halign: 'right', cellWidth: 30 }, 4: { halign: 'right', cellWidth: 30 },
        5: { halign: 'right', cellWidth: 30 }, 6: { halign: 'right', cellWidth: 30 },
      },
      didDrawPage: () => { this.agregarPiePDF(doc); },
    });

    this.agregarPiePDF(doc);
    doc.save('libro-mayor.pdf');
    this.messageService.add({ severity: 'success', summary: 'PDF descargado', detail: 'Libro Mayor descargado' });
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

    rows.push([this.getNombreEmpresa()]);
    rows.push(['LIBRO MAYOR']);
    rows.push([this.getTituloPeriodo()]);
    rows.push([`Impreso por: ${this.getUsuarioImpresion()}   |   Fecha: ${this.getFechaHoraImpresion()}`]);
    rows.push([]);
    rows.push(['Cuenta', 'Descripción', 'Nivel', 'Saldo Acum.', 'Debe', 'Haber', 'Saldo (D/C)']);

    for (const d of this.datosFiltrados()) {
      rows.push([
        d.ctacontable ?? '',
        d.descripcion ?? '',
        `N${d.nivel ?? ''}`,
        Number(d.saldoAcum) || 0,
        Number(d.debe) || 0,
        Number(d.haber) || 0,
        Number(d.saldo) || 0,
      ]);
    }

    rows.push([]);
    const t = this.getTotalesRow();
    rows.push([t[0], t[1], t[2], Number(t[3]) || 0, Number(t[4]) || 0, Number(t[5]) || 0, Number(t[6]) || 0]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Libro Mayor');

    ws['!cols'] = [
      { wch: 15 }, { wch: 35 }, { wch: 8 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 },
    ];

    XLSX.writeFile(wb, 'libro-mayor.xlsx');
    this.messageService.add({ severity: 'success', summary: 'Excel generado', detail: 'Libro Mayor exportado en Excel' });
  }

  exportWord(): void {
    const children: any[] = [];

    // Encabezado
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'LIBRO MAYOR', bold: true, size: 28 })],
    }));
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: this.getNombreEmpresa(), bold: true, size: 22 })],
    }));
    children.push(new Paragraph({
      children: [new TextRun({ text: this.getTituloPeriodo(), size: 18 })],
    }));
    children.push(new Paragraph({
      children: [new TextRun({ text: `Impreso por: ${this.getUsuarioImpresion()}`, size: 18 })],
    }));
    children.push(new Paragraph({
      children: [new TextRun({ text: `Fecha impresión: ${this.getFechaHoraImpresion()}`, size: 18 })],
    }));
    children.push(new Paragraph({ text: '' }));

    // Tabla
    const headerRow = new TableRow({
      tableHeader: true,
      children: ['Cuenta', 'Descripción', 'Nivel', 'Saldo Acum.', 'Debe', 'Haber', 'Saldo (D/C)'].map(h =>
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 18 })] })],
        })
      ),
    });

    const dataRows = this.datosFiltrados().map(d =>
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: d.ctacontable ?? '', size: 18 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: d.descripcion ?? '', size: 18 })] })] }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `N${d.nivel ?? ''}`, size: 18 })] })] }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: (Number(d.saldoAcum) || 0).toFixed(2), size: 18 })] })] }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: d.debe > 0 ? (Number(d.debe) || 0).toFixed(2) : '-', size: 18 })] })] }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: d.haber > 0 ? (Number(d.haber) || 0).toFixed(2) : '-', size: 18 })] })] }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: (Number(d.saldo) || 0).toFixed(2), size: 18 })] })] }),
        ],
      })
    );

    // Fila totales
    const t = this.getTotalesRow();
    dataRows.push(new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'TOTALES', bold: true, size: 18 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '', size: 18 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '', size: 18 })] })] }),
        new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: t[3], bold: true, size: 18 })] })] }),
        new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: t[4], bold: true, size: 18 })] })] }),
        new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: t[5], bold: true, size: 18 })] })] }),
        new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: t[6], bold: true, size: 18 })] })] }),
      ],
    }));

    const table = new Table({
      rows: [headerRow, ...dataRows],
      width: { size: 100, type: WidthType.PERCENTAGE },
    });

    children.push(table);

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
      a.download = 'libro-mayor.docx';
      a.click();
      URL.revokeObjectURL(url);
      this.messageService.add({ severity: 'success', summary: 'Word generado', detail: 'Libro Mayor exportado en Word' });
    });
  }

  imprimir(): void {
    window.print();
  }
}
