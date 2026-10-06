import {
  Component,
  inject,
  signal,
  DestroyRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ContabilidadService } from '../../../core/services/contabilidad.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  ReportesPrintService,
  EncabezadoPrint,
  TablaPrint,
  ColumnaPrint,
} from '../../../core/services/reportes-print.service';
import {
  EstadoResultadoReporte,
  EstadoResultadoLinea,
} from '../../../core/models/contabilidad.models';

import jsPDF from 'jspdf';
import { Packer } from 'docx';

/**
 * Estado de Resultado (`/contabilidad/estado-resultado`).
 *
 * Genera UNA variante por vez (decisión usuario 05/10/2026, no columnas juntas):
 *   P = Período (mes) · A = Acumulado enero–mes · N = Año anterior (mismo mes).
 * Formato estándar multi-paso con subtotales (ver JSDoc de `generarEstadoResultado`
 * en el backend). Exporta PDF (visor + descarga), Excel y Word con membrete.
 */
@Component({
  selector: 'app-estado-resultado',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputNumberModule,
    SelectModule,
    ToastModule,
    DialogModule,
    TooltipModule,
  ],
  providers: [MessageService],
  templateUrl: './estado-resultado.html',
  styleUrl: './estado-resultado.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EstadoResultadoComponent {
  private contabilidad = inject(ContabilidadService);
  private auth = inject(AuthService);
  private print = inject(ReportesPrintService);
  private messageService = inject(MessageService);
  private destroyRef = inject(DestroyRef);
  private sanitizer = inject(DomSanitizer);

  // Visor PDF en pantalla
  mostrarVisor = signal(false);
  pdfUrl = signal<SafeResourceUrl | null>(null);

  // Filtros
  tipo = signal<'P' | 'A' | 'N'>('P');
  periodo = signal(new Date().getMonth() + 1);
  anio = signal(new Date().getFullYear());

  // Resultado
  reporte = signal<EstadoResultadoReporte | null>(null);
  cargando = signal(false);

  /** Variantes del reporte — se generan POR SEPARADO, una por vez. */
  readonly tipoOptions = [
    { label: 'Período (mes)', value: 'P' as const },
    { label: 'Acumulado (enero–mes)', value: 'A' as const },
    { label: 'Año anterior (mismo mes)', value: 'N' as const },
  ];

  readonly meses = [
    { label: 'Enero', value: 1 },
    { label: 'Febrero', value: 2 },
    { label: 'Marzo', value: 3 },
    { label: 'Abril', value: 4 },
    { label: 'Mayo', value: 5 },
    { label: 'Junio', value: 6 },
    { label: 'Julio', value: 7 },
    { label: 'Agosto', value: 8 },
    { label: 'Septiembre', value: 9 },
    { label: 'Octubre', value: 10 },
    { label: 'Noviembre', value: 11 },
    { label: 'Diciembre', value: 12 },
  ];

  generar(): void {
    const empresaId = this.auth.currentUser()?.empresaId;
    if (!empresaId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo identificar la empresa',
      });
      return;
    }

    this.cargando.set(true);
    this.contabilidad
      .generarEstadoResultado({
        empresaId,
        anio: this.anio(),
        periodo: this.periodo(),
        tipo: this.tipo(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (reporte) => {
          this.reporte.set(reporte);
          this.messageService.add({
            severity: 'success',
            summary: 'Generado',
            detail: `Estado de Resultado — ${reporte.etiqueta}`,
          });
          this.cargando.set(false);
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.message || 'No se pudo generar el Estado de Resultado',
          });
          this.cargando.set(false);
        },
      });
  }

  trackByRenglon = (_: number, l: EstadoResultadoLinea, i: number) =>
    `${l.tipo}-${l.ctacontable ?? l.titulo ?? ''}-${i}`;

  // ========== UTILIDADES DE IMPRESIÓN ==========

  private getTituloReporte(): string {
    return this.reporte()?.etiqueta || 'Estado de Resultado';
  }

  /**
   * Encabezado de los archivos exportados (logo + empresa + datos fiscales +
   * título + meta): PDF, Excel y Word.
   */
  private async encabezadoImpresion(): Promise<EncabezadoPrint> {
    return this.print.encabezado('ESTADO DE RESULTADO', this.getTituloReporte());
  }

  /**
   * Tabla imprimible compartida por PDF, Excel y Word (ReportesPrintService).
   * Los importes van como `number` para que el service los formatee igual en
   * los tres formatos (1,234.56) y en Excel queden como valores, no texto.
   */
  private tablaPrint(): TablaPrint {
    const rep = this.reporte();
    // Anchos explícitos: los títulos de sección ("INGRESOS OPERACIONALES",
    // "(+) IMPUTADOS…") deben caber en UNA línea en PDF/Word/Excel.
    // "Importe" queda SIN ancho fijo para absorber el resto del ancho de
    // página (portrait) en PDF y Word según el tamaño de papel.
    const columnas: ColumnaPrint[] = [
      { titulo: 'Concepto', alinear: 'left', pdf: 118, word: 5600, excel: 45 },
      { titulo: 'Cuenta', alinear: 'left', pdf: 30, word: 1700 },
      { titulo: 'Importe', alinear: 'right' },
    ];

    const filas: (string | number | null)[][] = (rep?.lineas ?? []).map((l) => {
      if (l.tipo === 'cuenta') {
        return [l.descripcion ?? '', l.ctacontable ?? '', Number(l.valor) || 0];
      }
      if (l.tipo === 'seccion') {
        return [l.titulo ?? '', '', null];
      }
      // total | resultado
      return [l.titulo ?? '', '', Number(l.valor) || 0];
    });

    return { columnas, filas };
  }

  // ========== EXPORTACIONES ==========

  /** Genera el PDF y lo muestra en pantalla (visor) */
  async exportPDF(): Promise<void> {
    if (!this.reporte()) return;
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

  /** Descarga el PDF generado desde el visor */
  async descargarPDF(): Promise<void> {
    if (!this.reporte()) return;
    const doc = await this.construirPDF();
    doc.save('estado-resultado.pdf');
    this.messageService.add({
      severity: 'success',
      summary: 'PDF descargado',
      detail: 'Estado de Resultado descargado',
    });
  }

  /**
   * PDF: letterhead con logo + tabla + firmas + encabezado repetido y pie
   * paginado en TODAS las páginas. Retrato (formato vertical del ER).
   */
  private async construirPDF(): Promise<jsPDF> {
    const enc = await this.encabezadoImpresion();
    const doc = new jsPDF('p', 'mm', 'letter'); // retrato
    const altoEnc = this.print.pdfEncabezado(doc, enc);

    this.print.pdfTabla(doc, this.tablaPrint(), altoEnc, altoEnc);

    // Bloque de firmas al final del contenido (agrega página si no cabe)
    const finalY = Number((doc as any).lastAutoTable?.finalY ?? altoEnc);
    this.agregarFirmasPDF(doc, finalY + 10, altoEnc);

    // Encabezado repetido (páginas 2+) + pie "Página X de Y"
    this.print.pdfPaginar(doc, enc, altoEnc);
    return doc;
  }

  /** Bloque de firmas al final del reporte (agrega página cuando no cabe) */
  private agregarFirmasPDF(doc: jsPDF, startY: number, altoEnc: number): void {
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const altoBloque = 22;
    let y = startY;

    if (y + altoBloque > pageH - 16) {
      doc.addPage();
      y = altoEnc + 6; // el encabezado de esta página lo dibuja pdfPaginar
    }

    const firmas = ['Elaborado por', 'Revisado por', 'Aprobado por'];
    const ancho = (pageW - 24) / firmas.length;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.4);
    firmas.forEach((label, i) => {
      const centro = 12 + ancho * i + ancho / 2;
      const anchoLinea = Math.min(ancho - 30, 70);
      doc.line(centro - anchoLinea / 2, y + 12, centro + anchoLinea / 2, y + 12);
      doc.text(label, centro, y + 17, { align: 'center' });
    });
  }

  /** Excel con letterhead (logo, empresa, datos fiscales) vía exceljs */
  async exportExcel(): Promise<void> {
    const rep = this.reporte();
    if (!rep) return;

    const enc = await this.encabezadoImpresion();
    const tab = this.tablaPrint();
    const wb = this.print.nuevoLibro();
    const ws = wb.addWorksheet('Estado de Resultado');
    const filaCabecera = this.print.excelEncabezado(wb, ws, enc, tab);
    this.print.excelTabla(ws, tab, filaCabecera, 'portrait');
    await this.print.descargarExcel(wb, 'estado-resultado.xlsx');

    this.messageService.add({
      severity: 'success',
      summary: 'Excel generado',
      detail: 'Estado de Resultado exportado en Excel',
    });
  }

  /** Word con letterhead repetido en cada página (header) vía docx */
  async exportWord(): Promise<void> {
    const rep = this.reporte();
    if (!rep) return;

    const enc = await this.encabezadoImpresion();
    const documento = this.print.wordDocumento(enc, 'portrait', [
      this.print.wordTabla(this.tablaPrint(), 'portrait'),
    ]);

    const blob = await Packer.toBlob(documento);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'estado-resultado.docx';
    a.click();
    URL.revokeObjectURL(url);

    this.messageService.add({
      severity: 'success',
      summary: 'Word generado',
      detail: 'Estado de Resultado exportado en Word',
    });
  }
}
