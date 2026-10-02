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
import { EmpresasService } from '../../../core/services/empresas.service';
import { EmpresaDet } from '../../../core/models/empresa.models';
import {
  PlantillaBalancesMae,
  NivelCta,
  BalanceDinamicoReporte,
  BalanceDinamicoLinea,
} from '../../../core/models/contabilidad.models';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
} from 'docx';

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
  private empresas = inject(EmpresasService);
  private messageService = inject(MessageService);
  private destroyRef = inject(DestroyRef);
  private sanitizer = inject(DomSanitizer);

  // Visor PDF en pantalla
  mostrarVisor = signal(false);
  pdfUrl = signal<SafeResourceUrl | null>(null);

  // Catálogos
  plantillas = signal<PlantillaBalancesMae[]>([]);
  niveles = signal<NivelCta[]>([]);
  // Datos fiscales de la empresa (tempresasdet): RTN, dirección, teléfono
  empresaDet = signal<EmpresaDet[]>([]);

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

    // Datos fiscales (RTN / dirección / teléfono) para el encabezado de impresión
    this.empresas
      .getAllDet()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (det) => this.empresaDet.set(det ?? []),
        error: () => {}, // opcionales: el reporte se imprime aunque falten
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

  private getNombreEmpresa(): string {
    return this.reporte()?.empresaName || 'Empresa';
  }

  private getUsuarioImpresion(): string {
    const user = this.auth.currentUser();
    return user?.nombre || user?.usuario || '';
  }

  private getFechaHoraImpresion(): string {
    return new Date().toLocaleString('es-HN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  /** Título del reporte: plantilla + período + nivel */
  private getTituloReporte(): string {
    const rep = this.reporte();
    if (!rep) return 'Balance Dinámico';
    let titulo = `Período: ${this.getMesLabel()} ${rep.anio}`;
    if (rep.nivelDetalle != null) titulo += ` — Nivel ${rep.nivelDetalle}`;
    return titulo;
  }

  /** Dato fiscal activo de la empresa por tipo (RTN, DIRECCION, TELEFONO…) */
  private datoEmpresa(tipo: EmpresaDet['tipo']): string {
    return (
      this.empresaDet()
        .find((d) => d.tipo === tipo && d.sn_activo === 'S')
        ?.descripcion?.trim() ?? ''
    );
  }

  /** Línea de datos fiscales para el encabezado de impresión */
  private lineaFiscal(): string {
    const partes: string[] = [];
    const rtn = this.datoEmpresa('RTN');
    if (rtn) partes.push(`RTN: ${rtn}`);
    const dir = this.datoEmpresa('DIRECCION');
    if (dir) partes.push(`Dir: ${dir}`);
    const tel = this.datoEmpresa('TELEFONO');
    if (tel) partes.push(`Tel: ${tel}`);
    return partes.join('   |   ');
  }

  /** Recorta el texto para que no desborde el ancho de la página */
  private cortar(texto: string, max: number): string {
    if (!texto) return '';
    return texto.length > max ? `${texto.slice(0, max - 1)}…` : texto;
  }

  /** Formato numérico es-HN con 2 decimales */
  private fmt(valor: number | null | undefined): string {
    if (valor == null) return '';
    return (Number(valor) || 0).toLocaleString('es-HN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  /** Encabezado de columnas de los documentos exportados: Cuenta | Descripción | Saldo Acum. | Parcial | Total */
  private encabezadoColumnas(): string[] {
    const cols = ['Cuenta', 'Descripción'];
    if (this.mostrarCol0()) cols.push(this.etiquetaColumna(0));
    for (const c of this.columnasVisibles()) cols.push(this.etiquetaColumna(c));
    return cols;
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

  private filasCuerpo(): string[][] {
    const rep = this.reporte();
    if (!rep) return [];
    const columnas = this.columnasVisibles();
    const conCol0 = this.mostrarCol0();

    return rep.lineas.map((l: BalanceDinamicoLinea) => {
      const fila = [l.ctacontable ?? '', l.descripcion ?? ''];
      if (conCol0) fila.push(this.fmt(l.col0 ?? 0));
      for (const col of columnas) {
        fila.push(l.columna === col ? this.fmt(l.valor) : '');
      }
      return fila;
    });
  }

  private filaTotales(): string[] {
    const fila = ['', 'TOTALES'];
    if (this.mostrarCol0()) fila.push(this.fmt(this.totalCol(0)));
    for (const col of this.columnasVisibles()) fila.push(this.fmt(this.totalCol(col)));
    return fila;
  }

  // ========== EXPORTACIONES ==========

  /** Genera el PDF y lo muestra en pantalla (visor) */
  exportPDF(): void {
    if (!this.reporte()) return;
    const doc = this.construirPDF();
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
  descargarPDF(): void {
    if (!this.reporte()) return;
    this.construirPDF().save('balance-dinamico.pdf');
    this.messageService.add({
      severity: 'success',
      summary: 'PDF descargado',
      detail: 'Balance dinámico descargado',
    });
  }

  private construirPDF(): jsPDF {
    const doc = new jsPDF('l', 'mm', 'letter'); // horizontal
    const pageW = doc.internal.pageSize.getWidth();
    const fecha = this.getFechaHoraImpresion();
    const altoEnc = this.altoEncabezadoPDF();

    const encabezado = this.encabezadoColumnas();
    const body = this.filasCuerpo();
    // La fila de TOTALES solo se muestra en Estado de Resultado (no en Balance)
    if (!this.reporte()?.esBalance) body.push(this.filaTotales());

    autoTable(doc, {
      startY: altoEnc,
      head: [encabezado],
      body,
      theme: 'plain',
      // Sin cuadrícula: se eliminan los bordes de celdas (antes gris 150,150,150
      // y cabecera gris oscuro 100,100,100)
      styles: {
        fontSize: 7,
        cellPadding: 1.2,
        lineWidth: 0,
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: false,
        textColor: [50, 50, 50],
        fontStyle: 'bold',
        lineWidth: 0,
      },
      // Alineación de títulos: Cuenta y Descripción a la izquierda;
      // Saldo Acum., Parcial y Totales a la derecha.
      // (columnStyles NO aplica a la cabecera en autoTable → se usa didParseCell)
      didParseCell: (data) => {
        if (data.section === 'head') {
          data.cell.styles.halign = data.column.index <= 1 ? 'left' : 'right';
        }
      },
      // top deja espacio para el encabezado repetido; bottom para el pie
      margin: { left: 10, right: 10, top: altoEnc, bottom: 16 },
      columnStyles: this.columnStylesPDF(pageW, encabezado.length),
      // El encabezado y el pie se dibujan después, en todas las páginas
    });

    // Bloque de firmas al final del contenido (agrega página si no cabe)
    const finalY = Number((doc as any).lastAutoTable?.finalY ?? altoEnc);
    this.agregarFirmasPDF(doc, finalY + 10);

    // Encabezado repetido + pie con "Página X de Y" en TODAS las páginas
    const total = doc.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      doc.setPage(i);
      this.encabezadoPaginaPDF(doc, fecha);
      this.piePaginaPDF(doc, i, total, fecha);
    }
    return doc;
  }

  /** Anchos de columna calculados para que siempre quepan en horizontal Letter */
  private columnStylesPDF(pageW: number, totalCols: number): Record<number, any> {
    const margenIzq = 10;
    const margenDer = 10;
    const anchoFijoCuenta = 30;

    // Columnas de valores = total − (Cuenta, Descripción)
    const ncolsVal = totalCols - 2;
    const fijo = anchoFijoCuenta + margenIzq + margenDer;
    const disponible = Math.max(pageW - fijo, 60);
    const anchoDesc = Math.round(disponible * 0.3);
    const anchoVal = Math.max((disponible - anchoDesc) / Math.max(ncolsVal, 1), 12);

    // Cuenta y Descripción a la izquierda; columnas de valor a la derecha
    const styles: Record<number, any> = {
      0: { halign: 'left', cellWidth: anchoFijoCuenta },
      1: { halign: 'left', cellWidth: anchoDesc },
    };
    for (let i = 2; i < totalCols; i++) {
      styles[i] = { halign: 'right', cellWidth: anchoVal };
    }
    return styles;
  }

  /** Altura del encabezado repetido (crece si hay línea de datos fiscales) */
  private altoEncabezadoPDF(): number {
    return this.lineaFiscal() ? 31 : 26.5;
  }

  /** Encabezado que se repite en cada página del PDF */
  private encabezadoPaginaPDF(doc: jsPDF, fecha: string): void {
    const pageW = doc.internal.pageSize.getWidth();
    const rep = this.reporte()!;
    let y = 11;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text((rep.balancename || 'BALANCE DINÁMICO').toUpperCase(), pageW / 2, y, {
      align: 'center',
    });

    y += 5.5;
    doc.setFontSize(9.5);
    doc.text(this.getNombreEmpresa(), pageW / 2, y, { align: 'center' });

    const fiscal = this.lineaFiscal();
    if (fiscal) {
      y += 4.5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(this.cortar(fiscal, 170), pageW / 2, y, { align: 'center' });
    }

    y += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(this.cortar(this.getTituloReporte(), 95), 12, y);
    doc.text(`Impreso por: ${this.getUsuarioImpresion()}   —   ${fecha}`, pageW - 12, y, {
      align: 'right',
    });

    y += 3;
    doc.setDrawColor(120, 120, 120);
    doc.setLineWidth(0.4);
    doc.line(12, y, pageW - 12, y);
  }

  /** Pie con usuario, fecha y paginación "Página X de Y" */
  private piePaginaPDF(doc: jsPDF, pagina: number, total: number, fecha: string): void {
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.3);
    doc.line(10, pageH - 12, pageW - 10, pageH - 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(`Impreso por: ${this.getUsuarioImpresion()}`, 10, pageH - 8);
    doc.text(`Página ${pagina} de ${total}`, pageW / 2, pageH - 8, { align: 'center' });
    doc.text(fecha, pageW - 10, pageH - 8, { align: 'right' });
  }

  /** Bloque de firmas al final del reporte (agrega página cuando no cabe) */
  private agregarFirmasPDF(doc: jsPDF, startY: number): void {
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const altoBloque = 22;
    let y = startY;

    if (y + altoBloque > pageH - 16) {
      doc.addPage();
      y = 40; // el encabezado de esta página se dibuja en el bucle final
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

  exportExcel(): void {
    const rep = this.reporte();
    if (!rep) return;

    const rows: any[][] = [];
    rows.push([this.getNombreEmpresa()]);
    rows.push([(rep.balancename || 'BALANCE DINÁMICO').toUpperCase()]);
    rows.push([this.getTituloReporte()]);
    rows.push([
      `Impreso por: ${this.getUsuarioImpresion()}   |   Fecha: ${this.getFechaHoraImpresion()}`,
    ]);
    rows.push([]);
    rows.push(this.encabezadoColumnas());

    const columnas = this.columnasVisibles();
    const conCol0 = this.mostrarCol0();

    for (const l of rep.lineas) {
      const fila: any[] = [l.ctacontable ?? '', l.descripcion ?? ''];
      if (conCol0) fila.push(Number(l.col0) || 0);
      for (const col of columnas) {
        fila.push(l.columna === col ? Number(l.valor) || 0 : null);
      }
      rows.push(fila);
    }

    // La fila de TOTALES solo se muestra en Estado de Resultado (no en Balance)
    if (!rep.esBalance) {
      rows.push([]);
      const totales: any[] = ['', 'TOTALES'];
      if (conCol0) totales.push(Number(this.totalCol(0)) || 0);
      for (const col of columnas) totales.push(Number(this.totalCol(col)) || 0);
      rows.push(totales);
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Balance Dinámico');

    const anchos = [{ wch: 15 }, { wch: 42 }];
    if (conCol0) anchos.push({ wch: 20 });
    for (let i = 0; i < columnas.length; i++) anchos.push({ wch: 17 });
    ws['!cols'] = anchos;

    XLSX.writeFile(wb, 'balance-dinamico.xlsx');
    this.messageService.add({
      severity: 'success',
      summary: 'Excel generado',
      detail: 'Balance dinámico exportado en Excel',
    });
  }

  exportWord(): void {
    const rep = this.reporte();
    if (!rep) return;

    const children: any[] = [];

    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: (rep.balancename || 'BALANCE DINÁMICO').toUpperCase(),
            bold: true,
            size: 28,
          }),
        ],
      }),
    );
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: this.getNombreEmpresa(), bold: true, size: 22 })],
      }),
    );
    children.push(
      new Paragraph({ children: [new TextRun({ text: this.getTituloReporte(), size: 18 })] }),
    );
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `Impreso por: ${this.getUsuarioImpresion()}`, size: 18 })],
      }),
    );
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Fecha impresión: ${this.getFechaHoraImpresion()}`, size: 18 }),
        ],
      }),
    );
    children.push(new Paragraph({ text: '' }));

    const encabezado = this.encabezadoColumnas();
    const columnas = this.columnasVisibles();
    const conCol0 = this.mostrarCol0();

    const headerRow = new TableRow({
      tableHeader: true,
      children: encabezado.map((h, i) =>
        this.celdaWord(h, {
          bold: true,
          // Cuenta y Descripción a la izquierda; Saldo Acum. / Parcial / Totales a la derecha
          align: i <= 1 ? AlignmentType.LEFT : AlignmentType.RIGHT,
        }),
      ),
    });

    const dataRows = rep.lineas.map((l: BalanceDinamicoLinea) => {
      const celdas: TableCell[] = [
        this.celdaWord(l.ctacontable ?? ''),
        this.celdaWord(l.descripcion ?? ''),
      ];
      if (conCol0)
        celdas.push(this.celdaWord(this.fmt(l.col0 ?? 0), { align: AlignmentType.RIGHT }));
      for (const col of columnas) {
        celdas.push(
          this.celdaWord(l.columna === col ? this.fmt(l.valor) : '', {
            align: AlignmentType.RIGHT,
          }),
        );
      }
      return new TableRow({ children: celdas });
    });

    // Fila totales — solo en Estado de Resultado (no en Balance)
    if (!rep.esBalance) {
      const celdasTot: TableCell[] = [
        this.celdaWord('', {}),
        this.celdaWord('TOTALES', { bold: true }),
      ];
      if (conCol0)
        celdasTot.push(
          this.celdaWord(this.fmt(this.totalCol(0)), { bold: true, align: AlignmentType.RIGHT }),
        );
      for (const col of columnas) {
        celdasTot.push(
          this.celdaWord(this.fmt(this.totalCol(col)), { bold: true, align: AlignmentType.RIGHT }),
        );
      }
      dataRows.push(new TableRow({ children: celdasTot }));
    }

    children.push(
      new Table({
        rows: [headerRow, ...dataRows],
        width: { size: 100, type: WidthType.PERCENTAGE },
      }),
    );

    children.push(new Paragraph({ text: '' }));
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Impreso por: ${this.getUsuarioImpresion()} | Fecha: ${this.getFechaHoraImpresion()}`,
            size: 16,
            color: '666666',
          }),
        ],
      }),
    );

    const doc = new Document({ sections: [{ children }] });

    Packer.toBlob(doc).then((blob) => {
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
    });
  }

  private celdaWord(
    texto: string,
    opts: { bold?: boolean; align?: (typeof AlignmentType)[keyof typeof AlignmentType] } = {},
  ): TableCell {
    return new TableCell({
      children: [
        new Paragraph({
          alignment: opts.align ?? AlignmentType.LEFT,
          children: [new TextRun({ text: texto, bold: opts.bold ?? false, size: 16 })],
        }),
      ],
    });
  }
}
