import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
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
  PlantillaBalancesMae,
  NivelCta,
  BalanceDinamicoReporte,
  BalanceDinamicoLinea,
} from '../../../core/models/contabilidad.models';

import jsPDF from 'jspdf';
import { Packer } from 'docx';

@Component({
  selector: 'app-balance-dinamico',
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
  templateUrl: './balance-dinamico.html',
  styleUrl: './balance-dinamico.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BalanceDinamicoComponent implements OnInit {
  private contabilidad = inject(ContabilidadService);
  private auth = inject(AuthService);
  private print = inject(ReportesPrintService);
  private messageService = inject(MessageService);
  private destroyRef = inject(DestroyRef);
  private sanitizer = inject(DomSanitizer);

  // Visor PDF en pantalla
  mostrarVisor = signal(false);
  pdfUrl = signal<SafeResourceUrl | null>(null);

  // Catálogos
  plantillas = signal<PlantillaBalancesMae[]>([]);
  niveles = signal<NivelCta[]>([]);

  // Filtros
  plantillaId = signal<number | null>(null);
  nivelDetalle = signal<number | null>(null);
  periodo = signal(new Date().getMonth() + 1);
  anio = signal(new Date().getFullYear());

  // Resultado
  reporte = signal<BalanceDinamicoReporte | null>(null);
  cargando = signal(false);

  // Opciones para selects
  plantillaOptions = computed(() =>
    this.plantillas().map((p) => ({ label: p.descripcion, value: p.cocdefbalmaId })),
  );

  nivelOptions = computed(() => {
    const niveles = this.niveles()
      .filter((n) => n.sn_activo === 'S')
      .sort((a, b) => Number(a.nivel) - Number(b.nivel));
    return [
      { label: 'Todos (sin filtro)', value: null as number | null },
      ...niveles.map((n) => ({ label: `Nivel ${n.nivel}`, value: Number(n.nivel) })),
    ];
  });

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

  // Columnas a mostrar: Col0 (si aplica) + columnas usadas 1..7
  columnasVisibles = computed(() => {
    const r = this.reporte();
    if (!r) return [];
    return r.columnasUsadas;
  });

  mostrarCol0 = computed(() => this.reporte()?.mostrarCol0 ?? false);

  lineasOrdenadas = computed(() => this.reporte()?.lineas ?? []);

  ngOnInit(): void {
    this.cargarCatalogos();
  }

  private cargarCatalogos(): void {
    this.contabilidad
      .getPlantillasBalances()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (plantillas) => {
          this.plantillas.set(plantillas.filter((p) => p.sn_activo === 'S'));
          const activas = plantillas.filter((p) => p.sn_activo === 'S');
          if (activas.length > 0 && this.plantillaId() == null) {
            this.plantillaId.set(activas[0].cocdefbalmaId);
          }
        },
        error: () =>
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron cargar las plantillas',
          }),
      });

    this.contabilidad
      .getNiveles()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (niveles) => this.niveles.set(niveles),
        error: () => {},
      });
  }

  generar(): void {
    const plantillaId = this.plantillaId();
    if (!plantillaId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Requerido',
        detail: 'Seleccione una plantilla de balance',
      });
      return;
    }

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
      .generarBalanceDinamico({
        empresaId,
        plantillaId,
        nivelDetalle: this.nivelDetalle() ?? undefined,
        periodo: this.periodo(),
        anio: this.anio(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (reporte) => {
          this.reporte.set(reporte);
          this.messageService.add({
            severity: 'success',
            summary: 'Generado',
            detail: `Balance "${reporte.balancename}": ${reporte.lineas.length} líneas`,
          });
          this.cargando.set(false);
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.message || 'No se pudo generar el reporte',
          });
          this.cargando.set(false);
        },
      });
  }

  getMesLabel(): string {
    return this.meses.find((m) => m.value === this.periodo())?.label ?? '';
  }

  /** Valor a mostrar en la celda de columna N (vacío si la línea va en otra columna) */
  valorCelda(linea: { columna: number; valor: number }, col: number): number | null {
    return linea.columna === col ? linea.valor : null;
  }

  /** Total de una columna */
  totalCol(col: number): number {
    return this.reporte()?.totales[String(col)] ?? 0;
  }

  trackByRenglon = (_: number, l: { renglon: number; ctacontable: string }) =>
    `${l.renglon}-${l.ctacontable}`;

  // ========== UTILIDADES DE IMPRESIÓN ==========

  /** Título del reporte: plantilla + período + nivel */
  private getTituloReporte(): string {
    const rep = this.reporte();
    if (!rep) return 'Balance Dinámico';
    let titulo = `Período: ${this.getMesLabel()} ${rep.anio}`;
    if (rep.nivelDetalle != null) titulo += ` — Nivel ${rep.nivelDetalle}`;
    return titulo;
  }

  /**
   * Encabezado de los archivos exportados (logo + empresa + datos fiscales +
   * nombre del libro + meta): PDF, Excel y Word.
   */
  private async encabezadoImpresion(): Promise<EncabezadoPrint> {
    const rep = this.reporte();
    return this.print.encabezado(rep?.balancename || 'BALANCE DINÁMICO', this.getTituloReporte());
  }

  /** Etiqueta de cada columna del balance en el output: Saldo Acum. / Parcial / Total */
  private etiquetaColumna(col: number): string {
    switch (col) {
      case 0:
        return 'Saldo Acum.';
      case 1:
        return 'Parcial';
      case 2:
        return 'Total';
      case 3:
        return 'Total';
      case 4:
        return 'Total';
      default:
        return `Col ${col}`;
    }
  }

  /**
   * Tabla imprimible compartida por PDF, Excel y Word (ReportesPrintService).
   * Los importes van como `number` para que el service los formatee igual en
   * los tres formatos (1,234.56) y en Excel queden como valores, no texto.
   */
  private tablaPrint(): TablaPrint {
    const rep = this.reporte();
    const columnas: ColumnaPrint[] = [
      { titulo: 'Cuenta', alinear: 'left' },
      { titulo: 'Descripción', alinear: 'left' },
    ];
    if (this.mostrarCol0()) columnas.push({ titulo: this.etiquetaColumna(0), alinear: 'right' });
    for (const col of this.columnasVisibles()) {
      columnas.push({ titulo: this.etiquetaColumna(col), alinear: 'right' });
    }

    const filas: (string | number | null)[][] = (rep?.lineas ?? []).map(
      (l: BalanceDinamicoLinea) => {
        const fila: (string | number | null)[] = [l.ctacontable ?? '', l.descripcion ?? ''];
        if (this.mostrarCol0()) fila.push(Number(l.col0) || 0);
        for (const col of this.columnasVisibles()) {
          fila.push(l.columna === col ? Number(l.valor) : null);
        }
        return fila;
      },
    );

    const tab: TablaPrint = { columnas, filas };
    // La fila de TOTALES solo se muestra en Estado de Resultado (no en Balance)
    if (rep && !rep.esBalance) {
      const totales: (string | number | null)[] = ['', 'TOTALES'];
      if (this.mostrarCol0()) totales.push(Number(this.totalCol(0)) || 0);
      for (const col of this.columnasVisibles()) totales.push(Number(this.totalCol(col)) || 0);
      tab.filaTotales = totales;
    }
    return tab;
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
    doc.save('balance-dinamico.pdf');
    this.messageService.add({
      severity: 'success',
      summary: 'PDF descargado',
      detail: 'Balance dinámico descargado',
    });
  }

  /**
   * PDF: letterhead con logo + tabla minimalista + firmas + encabezado
   * repetido y pie paginado en TODAS las páginas.
   */
  private async construirPDF(): Promise<jsPDF> {
    const enc = await this.encabezadoImpresion();
    const doc = new jsPDF('l', 'mm', 'letter'); // horizontal
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
    const ws = wb.addWorksheet('Balance Dinámico');
    const filaCabecera = this.print.excelEncabezado(wb, ws, enc, tab);
    this.print.excelTabla(ws, tab, filaCabecera, 'landscape');
    await this.print.descargarExcel(wb, 'balance-dinamico.xlsx');

    this.messageService.add({
      severity: 'success',
      summary: 'Excel generado',
      detail: 'Balance dinámico exportado en Excel',
    });
  }

  /** Word con letterhead repetido en cada página (header) vía docx */
  async exportWord(): Promise<void> {
    const rep = this.reporte();
    if (!rep) return;

    const enc = await this.encabezadoImpresion();
    const documento = this.print.wordDocumento(enc, 'landscape', [
      this.print.wordTabla(this.tablaPrint(), 'landscape'),
    ]);

    const blob = await Packer.toBlob(documento);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'balance-dinamico.docx';
    a.click();
    URL.revokeObjectURL(url);

    this.messageService.add({
      severity: 'success',
      summary: 'Word generado',
      detail: 'Balance dinámico exportado en Word',
    });
  }
}
