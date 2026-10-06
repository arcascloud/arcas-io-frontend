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
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  BalanceFinancieroReporte,
  BalanceFinancieroFila,
} from '../../../core/models/contabilidad.models';

import jsPDF from 'jspdf';
import { Packer } from 'docx';

@Component({
  selector: 'app-balance-financiero',
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
  templateUrl: './balance-financiero.html',
  styleUrl: './balance-financiero.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BalanceFinancieroComponent implements OnInit {
  private contabilidad = inject(ContabilidadService);
  private auth = inject(AuthService);
  private print = inject(ReportesPrintService);
  private messageService = inject(MessageService);
  private destroyRef = inject(DestroyRef);
  private sanitizer = inject(DomSanitizer);

  // Visor PDF
  mostrarVisor = signal(false);
  pdfUrl = signal<SafeResourceUrl | null>(null);

  // Filtros
  periodo = signal(new Date().getMonth() + 1);
  anio = signal(new Date().getFullYear());
  nivelMaximo = signal<number>(99);

  // Estado
  cargando = signal(false);
  reporte = signal<BalanceFinancieroReporte | null>(null);

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

  // Niveles (hasta 6, el máximo del catálogo)
  readonly niveles: { label: string; value: number }[] = [
    { label: 'Todos los niveles', value: 99 },
    { label: 'Nivel 1', value: 1 },
    { label: 'Nivel 2', value: 2 },
    { label: 'Nivel 3', value: 3 },
    { label: 'Nivel 4', value: 4 },
    { label: 'Nivel 5', value: 5 },
    { label: 'Nivel 6', value: 6 },
  ];

  // Filas del reporte (con filtro de nivel)
  filas = computed<BalanceFinancieroFila[]>(() => {
    const rep = this.reporte();
    if (!rep) return [];
    const max = this.nivelMaximo();
    return max === 99 ? rep.filas : rep.filas.filter((f) => (Number(f.nivel) || 0) <= max);
  });

  ngOnInit(): void {
    this.buscar();
  }

  buscar(): void {
    const empresaId = this.auth.currentUser()?.empresaId;
    if (!empresaId) return;
    this.cargando.set(true);
    this.contabilidad
      .generarBalanceFinanciero({
        empresaId,
        anio: this.anio(),
        periodo: this.periodo(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.reporte.set(data);
          this.messageService.add({
            severity: 'success',
            summary: 'Generado',
            detail: `Balance Financiero: ${data.filas.length} cuentas`,
          });
          this.cargando.set(false);
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.message || 'Error al generar balance financiero',
          });
          this.cargando.set(false);
        },
      });
  }

  limpiar(): void {
    this.reporte.set(null);
  }

  getMesLabel(): string {
    return this.meses.find((m) => m.value === this.periodo())?.label ?? '';
  }

  /** Indentación visual según nivel de cuenta */
  getIndentacion(nivel: number): string {
    return `${Math.max((Number(nivel) || 1) - 1, 0) * 1.5}rem`;
  }

  /** Clase CSS según nivel */
  getNivelClass(nivel: number): string {
    return `nivel-${nivel}`;
  }

  /**
   * Formateo de número **con signo**. Al no existir la columna D/C, el signo
   * (negativo = acreedor) es la única forma de leer la dirección del saldo.
   */
  formatNumber(value: number): string {
    const num = Number(value) || 0;
    const abs = Math.abs(num).toLocaleString('es-HN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return num < 0 ? `-${abs}` : abs;
  }

  /** Indica si el saldo firmado es acreedor (negativo) para marcarlo */
  esAcreedor(saldo: number): boolean {
    return Number(saldo || 0) < 0;
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
    return this.print.encabezado('BALANCE FINANCIERO', this.metaImpresion());
  }

  /** Encabezado de columnas del reporte (Padre y D/C fuera por decisión) */
  private readonly columnas: ColumnaPrint[] = [
    { titulo: 'Cuenta', alinear: 'left' },
    { titulo: 'Descripción', alinear: 'left' },
    { titulo: 'Nivel', alinear: 'center' },
    { titulo: 'Saldo Acum.', alinear: 'right' },
    { titulo: 'Parcial', alinear: 'right' },
    { titulo: 'Total', alinear: 'right' },
  ];

  /**
   * Tabla imprimible compartida por PDF, Excel y Word. Los importes van como
   * `number` (formato y numFmt los aplica el service) y los totales
   * Activos/Pasivos/Capital se agregan como filas finales resaltadas.
   */
  private tablaPrint(): TablaPrint {
    const filas: (string | number | null)[][] = this.filas().map((f) => [
      f.ctacontable ?? '',
      f.descripcion ?? '',
      `N${f.nivel ?? ''}`,
      Number(f.sacum) || 0,
      Number(f.parcial) || 0,
      Number(f.total) || 0,
    ]);

    const tab: TablaPrint = { columnas: this.columnas, filas };

    const t = this.reporte()?.totales;
    if (t) {
      const grupos: [string, number][] = [
        ['ACTIVOS', Number(t.activos.saldo) || 0],
        ['PASIVOS', Number(t.pasivos.saldo) || 0],
        ['CAPITAL', Number(t.capital.saldo) || 0],
      ];
      tab.filasTotales = [];
      for (const [label, saldo] of grupos) {
        tab.filasTotales.push(filas.length);
        filas.push([label, '', '', '', '', saldo]);
      }
    }
    return tab;
  }

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

  async descargarPDF(): Promise<void> {
    if (!this.reporte()) return;
    const doc = await this.construirPDF();
    doc.save('balance-financiero.pdf');
    this.messageService.add({
      severity: 'success',
      summary: 'PDF descargado',
      detail: 'Balance Financiero descargado',
    });
  }

  /** PDF: letterhead con logo + tabla minimalista + encabezado/pie por página */
  private async construirPDF(): Promise<jsPDF> {
    const enc = await this.encabezadoImpresion();
    const doc = new jsPDF('l', 'mm', 'letter');
    const altoEnc = this.print.pdfEncabezado(doc, enc);

    this.print.pdfTabla(doc, this.tablaPrint(), altoEnc, altoEnc);
    this.print.pdfPaginar(doc, enc, altoEnc);
    return doc;
  }

  /** Excel con letterhead (logo, empresa, datos fiscales) vía exceljs */
  async exportExcel(): Promise<void> {
    const rep = this.reporte();
    if (!rep) return;

    const enc = await this.encabezadoImpresion();
    const tab = this.tablaPrint();
    const wb = this.print.nuevoLibro();
    const ws = wb.addWorksheet('Balance Financiero');
    const filaCabecera = this.print.excelEncabezado(wb, ws, enc, tab);
    this.print.excelTabla(ws, tab, filaCabecera, 'landscape');
    await this.print.descargarExcel(wb, 'balance-financiero.xlsx');

    this.messageService.add({
      severity: 'success',
      summary: 'Excel generado',
      detail: 'Balance Financiero exportado en Excel',
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
    a.download = 'balance-financiero.docx';
    a.click();
    URL.revokeObjectURL(url);

    this.messageService.add({
      severity: 'success',
      summary: 'Word generado',
      detail: 'Balance Financiero exportado en Word',
    });
  }

  imprimir(): void {
    window.print();
  }
}
