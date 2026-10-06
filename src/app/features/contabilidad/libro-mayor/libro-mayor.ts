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
import {
  ReportesPrintService,
  EncabezadoPrint,
  TablaPrint,
  ColumnaPrint,
} from '../../../core/services/reportes-print.service';
import { LibroMayorItem } from '../../../core/models/contabilidad.models';

import jsPDF from 'jspdf';
import { Packer } from 'docx';

@Component({
  selector: 'app-libro-mayor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputNumberModule,
    InputTextModule,
    SelectModule,
    ToastModule,
    CardModule,
    TooltipModule,
    DialogModule,
  ],
  providers: [MessageService],
  templateUrl: './libro-mayor.html',
  styleUrl: './libro-mayor.scss',
})
export class LibroMayorComponent implements OnInit {
  private contabilidad = inject(ContabilidadService);
  private auth = inject(AuthService);
  private print = inject(ReportesPrintService);
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
  expandido = signal<Set<string>>(new Set());

  // Meses
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

  // Datos filtrados
  datosFiltrados = computed(() => {
    const maxNivel = this.nivelMaximo();
    return this.datos().filter((d) => {
      if (maxNivel !== 99 && (Number(d.nivel) || 0) > maxNivel) return false;
      return true;
    });
  });

  /**
   * Filas "finales" del conjunto filtrado: no tienen hijas visibles.
   * Evita duplicar montos, ya que las cuentas padre ya agregan a sus hijas
   * (sin esto, el total salía exactamente doble).
   */
  private filasFinalesDe(filas: LibroMayorItem[]): LibroMayorItem[] {
    const conHijas = new Set(filas.map((f) => f.padre).filter((p) => p != null));
    return filas.filter((f) => !conHijas.has(f.ctacontable));
  }

  // Totales — solo cuentas finales (jerarquía sin duplicar)
  finales = computed(() => this.filasFinalesDe(this.datosFiltrados()));
  totalDebe = computed(() =>
    this.finales().reduce((sum, r) => sum + Math.abs(Number(r.debe) || 0), 0),
  );
  totalHaber = computed(() =>
    this.finales().reduce((sum, r) => sum + Math.abs(Number(r.haber) || 0), 0),
  );

  /**
   * Acumulado neto firmado.
   * El signo sale de `tiposaldoAcum` (dirección real calculada por operación
   * contable), NO de `naturaleza` (atributo estático del catálogo): una cuenta
   * de activo con saldo acreedor debe restar, no sumar.
   */
  acumFirmado = computed(() =>
    this.finales().reduce(
      (sum, r) =>
        sum +
        ((r.tiposaldoAcum ?? r.naturaleza) === 'C' ? -1 : 1) * Math.abs(Number(r.saldoAcum) || 0),
      0,
    ),
  );

  /** Saldo acumulado del total (siempre positivo). */
  totalSaldoAcum = computed(() => Math.abs(this.acumFirmado()));

  /**
   * Naturaleza del total: deudor si el acumulado firmado es deudor;
   * si no hay acumulado (o cancela), manda el movimiento neto del período.
   */
  esDeudor = computed(() => {
    const acum = this.acumFirmado();
    return acum !== 0 ? acum > 0 : this.totalDebe() >= this.totalHaber();
  });

  /**
   * Saldo final del total — regla contable:
   * - Deudor:  acumulado + debe − haber
   * - Acreedor: acumulado + haber − debe
   */
  totalSaldo = computed(() => {
    const acum = Math.abs(this.acumFirmado());
    return this.esDeudor()
      ? acum + this.totalDebe() - this.totalHaber()
      : acum + this.totalHaber() - this.totalDebe();
  });

  ngOnInit(): void {
    // Cargar niveles contables desde API
    this.contabilidad
      .getNiveles()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (niveles) => {
          const activos = niveles
            .filter((n) => n.sn_activo === 'S')
            .sort((a, b) => Number(a.nivel) - Number(b.nivel));
          const maxNivel = activos.length > 0 ? Number(activos[activos.length - 1].nivel) : 6;
          const opciones = [
            { label: `Todos (N1–N${maxNivel})`, value: 99 },
            ...activos.map((n) => ({ label: `Nivel ${n.nivel}`, value: Number(n.nivel) })),
          ];
          this.niveles.set(opciones);
          this.nivelMaximo.set(99);
        },
        error: () => {
          // Fallback si falla la API
          this.niveles.set([
            { label: 'Todos', value: 99 },
            { label: 'Nivel 1', value: 1 },
            { label: 'Nivel 2', value: 2 },
            { label: 'Nivel 3', value: 3 },
            { label: 'Nivel 4', value: 4 },
            { label: 'Nivel 5', value: 5 },
            { label: 'Nivel 6', value: 6 },
          ]);
        },
      });
  }

  buscar(): void {
    this.cargando.set(true);
    this.contabilidad
      .generarLibroMayor({
        empresaId: this.auth.currentUser()?.empresaId ?? 0,
        periodo: this.periodo(),
        anio: this.anio(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
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
    return this.meses.find((m) => m.value === this.periodo())?.label ?? '';
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

  /** Período y nivel aplicados (línea meta de la impresión) */
  private metaImpresion(): string {
    let meta = `Período: ${this.getMesLabel()} ${this.anio()}`;
    if (this.nivelMaximo() !== 99) meta += ` — Nivel ${this.nivelMaximo()}`;
    return meta;
  }

  /** Encabezado de los archivos exportados (PDF, Excel y Word) */
  private async encabezadoImpresion(): Promise<EncabezadoPrint> {
    return this.print.encabezado('LIBRO MAYOR', this.metaImpresion());
  }

  /**
   * Importe para PDF/Word: separador de miles con coma y 2 decimales con punto
   * (ej. 999,999,999.99). Se arma a mano en vez de usar `toLocaleString`
   * para que el formato no dependa del locale del navegador.
   * Siempre en positivo: la dirección (D/C) se informa en la misma celda.
   */
  private fmt(valor: number): string {
    const [entero, dec] = Math.abs(Number(valor) || 0).toFixed(2).split('.');
    return `${entero.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${dec}`;
  }

  /** Celda combinada "importe (D/C)" — PDF y Word. El importe 0.00 se suprime (celda vacía) */
  private dc(valor: number, tipo: string | null | undefined): string {
    if (Math.abs(Number(valor) || 0) < 0.005) return '';
    return `${this.fmt(valor)} (${tipo ?? ''})`;
  }

  /** Columnas PDF/Word (7): importe y D/C combinados en la misma celda */
  private readonly columnasPdf: ColumnaPrint[] = [
    { titulo: 'Cuenta', alinear: 'left' },
    { titulo: 'Descripción', alinear: 'left' },
    { titulo: 'Nivel', alinear: 'center', pdf: 15, word: 700 },
    { titulo: 'Saldo Acum. (D/C)', alinear: 'right', pdf: 32, word: 1900 },
    { titulo: 'Debe', alinear: 'right', pdf: 28, word: 1450 },
    { titulo: 'Haber', alinear: 'right', pdf: 28, word: 1450 },
    { titulo: 'Saldo (D/C)', alinear: 'right', pdf: 32, word: 1900 },
  ];

  /**
   * Columnas Excel (9): D/C en columna aparte y saldos numéricos puros
   * (se conserva el comportamiento numérico con el que siempre se exportó).
   */
  private readonly columnasExcel: ColumnaPrint[] = [
    { titulo: 'Cuenta', alinear: 'left', excel: 15 },
    { titulo: 'Descripción', alinear: 'left', excel: 35 },
    { titulo: 'Nivel', alinear: 'center', excel: 8 },
    { titulo: 'Saldo Acum.', alinear: 'right', excel: 18 },
    { titulo: 'D/C', alinear: 'center', excel: 6 },
    { titulo: 'Debe', alinear: 'right', excel: 18 },
    { titulo: 'Haber', alinear: 'right', excel: 18 },
    { titulo: 'Saldo', alinear: 'right', excel: 18 },
    { titulo: 'D/C', alinear: 'center', excel: 6 },
  ];

  /** Tabla imprimible para PDF y Word (variantes con "(D)"/"(C)" combinados) */
  private tablaPdfWord(): TablaPrint {
    const filas: (string | number | null)[][] = this.datosFiltrados().map((d) => [
      d.ctacontable ?? '',
      d.descripcion ?? '',
      `N${d.nivel ?? ''}`,
      this.dc(d.saldoAcum, d.tiposaldoAcum ?? d.naturaleza),
      // Importes en 0.00 → celda vacía (regla de diseño de los reportes)
      d.debe > 0 ? this.fmt(d.debe) : '',
      d.haber > 0 ? this.fmt(d.haber) : '',
      this.dc(d.saldo, d.tiposaldo ?? d.naturaleza),
    ]);

    return {
      columnas: this.columnasPdf,
      filas,
      filaTotales: [
        'TOTALES',
        '',
        '',
        this.dc(this.totalSaldoAcum(), this.esDeudor() ? 'D' : 'C'),
        this.fmt(this.totalDebe()),
        this.fmt(this.totalHaber()),
        this.dc(this.totalSaldo(), this.esDeudor() ? 'D' : 'C'),
      ],
    };
  }

  /** Tabla para Excel (variantes numéricas + D/C en columna aparte) */
  private tablaExcel(): TablaPrint {
    const filas: (string | number | null)[][] = this.datosFiltrados().map((d) => [
      d.ctacontable ?? '',
      d.descripcion ?? '',
      `N${d.nivel ?? ''}`,
      Number(d.saldoAcum) || 0,
      d.tiposaldoAcum ?? d.naturaleza ?? '',
      Number(d.debe) || 0,
      Number(d.haber) || 0,
      Number(d.saldo) || 0,
      d.tiposaldo ?? d.naturaleza ?? '',
    ]);

    return {
      columnas: this.columnasExcel,
      filas,
      filaTotales: [
        'TOTALES',
        '',
        '',
        Number(this.totalSaldoAcum()) || 0,
        this.esDeudor() ? 'D' : 'C',
        Number(this.totalDebe()) || 0,
        Number(this.totalHaber()) || 0,
        Number(this.totalSaldo()) || 0,
        this.esDeudor() ? 'D' : 'C',
      ],
    };
  }

  // ========== EXPORTACIONES ==========

  /** Genera el PDF y lo muestra en pantalla (visor) */
  async exportPDF(): Promise<void> {
    if (!this.datosFiltrados().length) return;
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
    if (!this.datosFiltrados().length) return;
    const doc = await this.construirPDF();
    doc.save('libro-mayor.pdf');
    this.messageService.add({
      severity: 'success',
      summary: 'PDF descargado',
      detail: 'Libro Mayor descargado',
    });
  }

  /** PDF: letterhead con logo + tabla minimalista + encabezado/pie por página */
  private async construirPDF(): Promise<jsPDF> {
    const enc = await this.encabezadoImpresion();
    const doc = new jsPDF('l', 'mm', 'letter');
    const altoEnc = this.print.pdfEncabezado(doc, enc);

    this.print.pdfTabla(doc, this.tablaPdfWord(), altoEnc, altoEnc);
    this.print.pdfPaginar(doc, enc, altoEnc);
    return doc;
  }

  /** Excel con letterhead (logo, empresa, datos fiscales) vía exceljs */
  async exportExcel(): Promise<void> {
    if (!this.datosFiltrados().length) return;

    const enc = await this.encabezadoImpresion();
    const tab = this.tablaExcel();
    const wb = this.print.nuevoLibro();
    const ws = wb.addWorksheet('Libro Mayor');
    const filaCabecera = this.print.excelEncabezado(wb, ws, enc, tab);
    this.print.excelTabla(ws, tab, filaCabecera, 'landscape');
    await this.print.descargarExcel(wb, 'libro-mayor.xlsx');

    this.messageService.add({
      severity: 'success',
      summary: 'Excel generado',
      detail: 'Libro Mayor exportado en Excel',
    });
  }

  /** Word con letterhead repetido en cada página (header) vía docx */
  async exportWord(): Promise<void> {
    if (!this.datosFiltrados().length) return;

    const enc = await this.encabezadoImpresion();
    const documento = this.print.wordDocumento(enc, 'landscape', [
      this.print.wordTabla(this.tablaPdfWord(), 'landscape'),
    ]);

    const blob = await Packer.toBlob(documento);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'libro-mayor.docx';
    a.click();
    URL.revokeObjectURL(url);

    this.messageService.add({
      severity: 'success',
      summary: 'Word generado',
      detail: 'Libro Mayor exportado en Word',
    });
  }

  imprimir(): void {
    window.print();
  }
}
