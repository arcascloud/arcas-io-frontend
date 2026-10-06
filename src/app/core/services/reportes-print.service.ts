import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import jsPDF from 'jspdf';
import autoTable, { UserOptions, CellHookData } from 'jspdf-autotable';
import { Workbook, Worksheet } from 'exceljs';
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  PageNumber,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from 'docx';

import { AuthService } from './auth.service';
import { EmpresasService } from './empresas.service';
import { EmpresaDet } from '../models/empresa.models';

// ===========================================================================
// Reportes de contabilidad — diseño de impresión compartido
// Estilo: MINIMALISTA SOLO TEXTO
//   · Encabezado en 2 filas (elementos COMPARTIDOS en la misma línea):
//       fila 1: empresa (izquierda, grande) + título del reporte (centrado)
//       fila 2: RTN (izquierda) + criterio de filtro (centrado)
//     y filete sólido de ancho completo debajo.
//   · Fuente del encabezado: AUDIOWIDE (PDF: embebida desde assets;
//     Excel/Word: nombre de familia)
//   · Sin logo, sin dirección y sin teléfono
//   · Cuerpo: sin relleno, sin cuadrícula; separadores en LÍNEA DISCONTINUA
//     (debajo de la cabecera y encima de cada fila de totales)
//   · Importes en 0.00 se SUPRIMEN (celda vacía) en PDF, Word y Excel
//   · Totales: filete discontinuo superior + negrita
//   · Pie: usuario | Página X de Y | fecha
// Aplica a: Balance Dinámico, Balance Financiero, Libro Mayor, Libro Diario
//           y Balance de Comprobación.
// ===========================================================================

export type Alineacion = 'left' | 'center' | 'right';

export interface ColumnaPrint {
  titulo: string;
  alinear?: Alineacion;
  /** Ancho en mm (PDF) */
  pdf?: number;
  /** Ancho en twips (Word): 1440 twips = 1 pulgada */
  word?: number;
  /** Ancho en caracteres (Excel) */
  excel?: number;
}

export interface TablaPrint {
  columnas: ColumnaPrint[];
  /** Filas del cuerpo. Los números se formatean solos (1,234.56) en PDF/Word */
  filas: (string | number | null)[][];
  /** Índices (base 0) de filas intermedias que son de totales (filete + negrita) */
  filasTotales?: number[];
  /** Fila final de totales (filete superior + negrita) */
  filaTotales?: (string | number | null)[];
  /**
   * Alineación por columna SOLO para las filas de totales (PDF y Word).
   * Índice = columna; `undefined` = usa la alineación de la columna.
   * Ej.: alinear "TOTALES" a la derecha en la columna Descripción.
   */
  alineacionesTotales?: (Alineacion | undefined)[];
}

export interface EncabezadoPrint {
  titulo: string;
  empresa: string;
  /** RTN de la empresa (vacío si no lo tiene) — dirección y teléfono NO se imprimen */
  rtn: string;
  /** Período / rango / filtros aplicados */
  meta: string;
  usuario: string;
  fecha: string;
}

/** Orientación de página de los reportes */
export type Orientacion = 'portrait' | 'landscape';

const GRIS_CLARO = 'FF94A3B8';
const GRIS_OSCURO = 'FF475569';

@Injectable({ providedIn: 'root' })
export class ReportesPrintService {
  private auth = inject(AuthService);
  private empresas = inject(EmpresasService);

  /** Cache por empresa: nombre y RTN */
  private cacheBase = new Map<number, Promise<{ empresa: string; rtn: string }>>();

  // =========================================================================
  // Encabezado
  // =========================================================================

  /**
   * Compone el encabezado estándar de todos los reportes.
   * @param titulo Título del documento (ej. "LIBRO MAYOR")
   * @param meta Filtros aplicados (ej. "Del: 01/10/2026 al 04/10/2026")
   */
  async encabezado(titulo: string, meta?: string): Promise<EncabezadoPrint> {
    await this.prepararFuente(); // PDF: deja la fuente lista (se cachea)
    const empresaId = this.auth.currentUser()?.empresaId ?? 0;
    const base = await this.cargarBase(empresaId);
    return {
      titulo,
      empresa: base.empresa,
      rtn: base.rtn,
      meta: meta ?? '',
      usuario: this.usuario(),
      fecha: this.fecha(),
    };
  }

  private cargarBase(empresaId: number): Promise<{ empresa: string; rtn: string }> {
    let pendiente = this.cacheBase.get(empresaId);
    if (!pendiente) {
      pendiente = this.resolverBase(empresaId);
      this.cacheBase.set(empresaId, pendiente);
    }
    return pendiente;
  }

  private async resolverBase(empresaId: number): Promise<{ empresa: string; rtn: string }> {
    if (!empresaId) return { empresa: 'Empresa', rtn: '' };

    let empresa = 'Empresa';
    let rtn = '';

    const [resEmpresa, resDet] = await Promise.allSettled([
      firstValueFrom(this.empresas.getOne(empresaId)),
      firstValueFrom(this.empresas.getAllDet(empresaId)),
    ]);

    if (resEmpresa.status === 'fulfilled' && resEmpresa.value?.descripcion) {
      empresa = resEmpresa.value.descripcion;
    }

    if (resDet.status === 'fulfilled' && Array.isArray(resDet.value)) {
      rtn = this.rtnDe(resDet.value);
    }

    return { empresa, rtn };
  }

  /** Invalida el cache de nombre/RTN de la empresa */
  invalidarCache(): void {
    this.cacheBase.clear();
  }

  /** "RTN: 0801..." — solo el RTN activo (dirección y teléfono ya NO se imprimen) */
  private rtnDe(dets: EmpresaDet[]): string {
    const valor = dets.find((d) => d.tipo === 'RTN' && d.sn_activo === 'S')?.descripcion?.trim();
    return valor ? `RTN: ${valor}` : '';
  }

  private usuario(): string {
    const user = this.auth.currentUser();
    return user?.nombre || user?.usuario || '';
  }

  private fecha(): string {
    return new Date().toLocaleString('es-HN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  // =========================================================================
  // Formato numérico compartido
  // =========================================================================

  /**
   * 1234.5 → "1,234.50" · -1234.5 → "-1,234.50".
   * Armado a mano para no depender del locale del navegador.
   */
  fmt(valor: number | string | null | undefined, decimales = 2): string {
    const num = Number(valor);
    if (valor == null || valor === '' || Number.isNaN(num)) return '';
    const negativo = num < 0;
    const [entero, dec] = Math.abs(num).toFixed(decimales).split('.');
    const miles = entero.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `${negativo ? '-' : ''}${miles}${dec ? `.${dec}` : ''}`;
  }

  /** Recorta el texto para que no desborde el ancho disponible */
  private cortar(texto: string, max: number): string {
    if (!texto) return '';
    return texto.length > max ? `${texto.slice(0, max - 1)}…` : texto;
  }

  /**
   * ¿El valor se muestra vacío por ser 0.00? — Regla de diseño: los importes
   * en cero NO aparecen en PDF, Word ni Excel.
   * Acepta números y textos numéricos ('0', '0.00'); los textos no numéricos
   * ('1-1-10', 'N3', '03/10/2026') jamás se suprimen.
   */
  private esCero(valor: string | number | null | undefined): boolean {
    if (valor == null || valor === '') return false;
    const num = typeof valor === 'number' ? valor : Number(String(valor).trim());
    if (Number.isNaN(num)) return false;
    return Math.abs(num) < 0.005; // redondea a 0.00 con 2 decimales
  }

  // =========================================================================
  // PDF
  // =========================================================================

  /** Base64 (VFS) de Audiowide-Regular.ttf — se carga una sola vez por sesión */
  private fuenteB64: string | null = null;
  /** Base64 (VFS) de Mukta-Regular.ttf — título, RTN y criterio del encabezado */
  private muktaB64: string | null = null;
  private fuenteCargando: Promise<void> | null = null;

  /**
   * Descarga las TTFs de assets (Audiowide para la empresa, Mukta para título/
   * RTN/criterio) y las deja en base64 listas para embeber en cada documento.
   * Si una falla, ese elemento usa helvetica.
   */
  private prepararFuente(): Promise<void> {
    if (!this.fuenteCargando) {
      this.fuenteCargando = Promise.all([
        this.cargarTtf('/assets/fonts/Audiowide/Audiowide-Regular.ttf').then((b64) => {
          if (b64) this.fuenteB64 = b64;
        }),
        this.cargarTtf('/assets/fonts/Mukta/Mukta-Regular.ttf').then((b64) => {
          if (b64) this.muktaB64 = b64;
        }),
      ]).then(() => undefined);
    }
    return this.fuenteCargando;
  }

  /** Descarga una TTF y la convierte a base64; null si falla */
  private async cargarTtf(url: string): Promise<string | null> {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const bytes = new Uint8Array(await res.arrayBuffer());
      let bin = '';
      for (let i = 0; i < bytes.length; i += 0x8000) {
        bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      }
      return btoa(bin);
    } catch {
      /* sin la fuente el reporte sigue siendo válido (helvetica) */
      return null;
    }
  }

  /** Registra las fuentes del encabezado en el documento; indica cuáles quedaron */
  private registrarFuente(doc: jsPDF): { audiowide: boolean; mukta: boolean } {
    const reg = (b64: string | null, archivo: string, familia: string): boolean => {
      if (!b64) return false;
      try {
        doc.addFileToVFS(archivo, b64);
        doc.addFont(archivo, familia, 'normal');
        return true;
      } catch {
        return false;
      }
    };
    return {
      audiowide: reg(this.fuenteB64, 'Audiowide-Regular.ttf', 'Audiowide'),
      mukta: reg(this.muktaB64, 'Mukta-Regular.ttf', 'Mukta'),
    };
  }

  /**
   * Dibuja el encabezado del reporte y devuelve el Y donde puede empezar el
   * contenido. Todas las tablas deben usar ese Y y dejar margen superior igual
   * para que las páginas nuevas no pisen el encabezado repetido.
   *
   * Diseño en 2 filas (elementos compartidos en la MISMA línea):
   *   fila 1: empresa a la izquierda (16pt, Audiowide) + título centrado (12.7pt, Mukta)
   *   fila 2: RTN a la izquierda (9pt, Mukta) + criterio de filtro centrado (9pt, Mukta)
   *   filete sólido de ancho completo.
   */
  pdfEncabezado(doc: jsPDF, enc: EncabezadoPrint): number {
    const pageW = doc.internal.pageSize.getWidth();
    const cx = pageW / 2;
    const margen = 10;
    const fuentes = this.registrarFuente(doc);
    const fontEmpresa = fuentes.audiowide ? 'Audiowide' : 'helvetica';
    const fontTexto = fuentes.mukta ? 'Mukta' : 'helvetica';

    // Fila 1 — empresa (izquierda, Audiowide) + título (centrado, Mukta)
    const yFila1 = 12;
    doc.setFont(fontEmpresa, 'normal');
    doc.setFontSize(16);
    doc.text(this.cortar(enc.empresa, 30), margen, yFila1);
    doc.setFont(fontTexto, 'normal');
    doc.setFontSize(12.7);
    doc.text(this.cortar(enc.titulo.toUpperCase(), 40), cx, yFila1, { align: 'center' });

    // Fila 2 — RTN (izquierda) + criterio de filtro (centrado), ambas en Mukta
    const yFila2 = yFila1 + 7.5;
    doc.setFontSize(9);
    if (enc.rtn) doc.text(this.cortar(enc.rtn, 70), margen, yFila2);
    const meta = this.cortar(enc.meta, 110);
    if (meta) doc.text(meta, cx, yFila2, { align: 'center' });

    // Filete inferior
    const yFilete = yFila2 + 7;
    doc.setDrawColor(90, 90, 90);
    doc.setLineWidth(0.4);
    doc.line(margen, yFilete, pageW - margen, yFilete);

    return yFilete + 4;
  }

  /** Pie de página: filete + usuario + "Página X de Y" + fecha */
  pdfPie(doc: jsPDF, enc: EncabezadoPrint, pagina: number, total: number): void {
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    doc.setDrawColor(160, 160, 160);
    doc.setLineWidth(0.3);
    doc.line(10, pageH - 12, pageW - 10, pageH - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(`Impreso por: ${enc.usuario}`, 10, pageH - 8);
    if (total > 1) doc.text(`Página ${pagina} de ${total}`, pageW / 2, pageH - 8, { align: 'center' });
    doc.text(enc.fecha, pageW - 10, pageH - 8, { align: 'right' });
  }

  /**
   * Recorre todas las páginas y dibuja encabezado repetido + pie paginado.
   * Llamar SIEMPRE al final, después de tablas y firmas.
   */
  pdfPaginar(doc: jsPDF, enc: EncabezadoPrint, altoEncabezado: number): void {
    const total = doc.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      doc.setPage(i);
      if (i > 1) this.pdfEncabezado(doc, enc);
      void altoEncabezado;
      this.pdfPie(doc, enc, i, total);
    }
  }

  /**
   * Tabla minimalista: cabecera con filete DISCONTINUO inferior, cuerpo sin
   * cuadrícula y fila de totales con filete DISCONTINUO superior + negrita.
   * Los importes en 0.00 salen vacíos (regla de diseño del ERP).
   */
  pdfTabla(doc: jsPDF, tab: TablaPrint, startY: number, altoEncabezado: number): void {
    const pageW = doc.internal.pageSize.getWidth();
    const margen = 10;
    const anchos = this.pdfAnchos(tab.columnas, pageW, margen);
    const alineaciones = tab.columnas.map((c) => c.alinear ?? this.alineacionPorDefecto(c));
    const alineacionesTotales = tab.alineacionesTotales ?? [];

    const filasTotales = new Set(tab.filasTotales ?? []);
    const cuerpo = tab.filas.map((f) => this.filaATexto(f));
    if (tab.filaTotales) {
      filasTotales.add(cuerpo.length);
      cuerpo.push(this.filaATexto(tab.filaTotales));
    }

    const opciones: UserOptions = {
      startY,
      head: [tab.columnas.map((c) => c.titulo)],
      body: cuerpo,
      theme: 'plain',
      styles: {
        font: 'helvetica',
        fontSize: 8,
        textColor: [35, 35, 35],
        cellPadding: { top: 1.5, bottom: 1.5, left: 1.5, right: 1.5 },
        lineWidth: 0,
        lineColor: [255, 255, 255],
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: false,
        textColor: [30, 30, 30],
        fontStyle: 'bold',
        cellPadding: { top: 2.2, bottom: 2.2, left: 1.5, right: 1.5 },
        // El filete bajo la cabecera se dibuja discontinuo en didDrawCell
        lineWidth: { top: 0, bottom: 0, left: 0, right: 0 },
        lineColor: [90, 90, 90],
      },
      margin: { left: margen, right: margen, top: altoEncabezado, bottom: 16 },
      columnStyles: anchos.reduce((acc: Record<number, any>, ancho, i) => {
        acc[i] = { halign: alineaciones[i], cellWidth: ancho };
        return acc;
      }, {}),
      didParseCell: (data: CellHookData) => {
        if (data.section === 'head') {
          data.cell.styles.halign = alineaciones[data.column.index] ?? 'left';
          return;
        }
        if (data.section === 'body' && filasTotales.has(data.row.index)) {
          data.cell.styles.fontStyle = 'bold';
          const alin = alineacionesTotales[data.column.index];
          if (alin) data.cell.styles.halign = alin;
        }
      },
      didDrawCell: (data: CellHookData) => {
        // Filetes DISCONTINUOS: bajo la cabecera y encima de cada fila de totales
        const c = data.cell as unknown as { x: number; y: number; width: number; height: number };
        if (data.section === 'head' && data.row.index === 0) {
          this.pdfLineaDiscontinua(doc, c.x, c.y + c.height, c.width);
        } else if (data.section === 'body' && filasTotales.has(data.row.index)) {
          this.pdfLineaDiscontinua(doc, c.x, c.y, c.width);
        }
      },
    };

    autoTable(doc, opciones);
  }

  /** Línea discontinua de 1 celda (separador de cabecera/totales en el PDF) */
  private pdfLineaDiscontinua(doc: jsPDF, x: number, y: number, ancho: number): void {
    doc.setLineDashPattern([1.1, 1.1], 0);
    doc.setLineWidth(0.3);
    doc.setDrawColor(90, 90, 90);
    doc.line(x, y, x + ancho, y);
    doc.setLineDashPattern([], 0);
  }

  /** Fila → texto (los números se formatean con 2 decimales; los 0.00 salen vacíos) */
  private filaATexto(fila: (string | number | null)[]): string[] {
    return fila.map((v) => (this.esCero(v) ? '' : typeof v === 'number' ? this.fmt(v) : v == null ? '' : String(v)));
  }

  private alineacionPorDefecto(col: ColumnaPrint): Alineacion {
    const t = col.titulo.toLowerCase();
    if (t === 'cuenta' || t.includes('descrip') || t === 'partida' || t === 'fecha' || t === 'nivel') {
      return t === 'nivel' ? 'center' : 'left';
    }
    return 'right';
  }

  /** ¿La columna es de texto largo (Descripción)? — gana 30% del ancho libre */
  private esColumnaDescripcion(col: ColumnaPrint | undefined): boolean {
    return !!col && col.titulo.toLowerCase().includes('descrip');
  }

  /**
   * Anchos de columna en mm que siempre caben en el ancho de página.
   * Reglas: 1ª columna sin ancho fijo → 30 mm (cuenta/código) · columna
   * "descripción" → 30% del resto · el resto se reparte en partes iguales.
   */
  private pdfAnchos(columnas: ColumnaPrint[], pageW: number, margen: number): number[] {
    const disponibles = pageW - margen * 2;
    const anchos: number[] = columnas.map((c) => c.pdf ?? 0);

    let fijos = 0;
    let libres: number[] = [];
    anchos.forEach((a, i) => (a > 0 ? (fijos += a) : libres.push(i)));

    if (libres.length > 0) {
      let resto = Math.max(disponibles - fijos, 40);

      if (libres.includes(0)) {
        const anchoCta = Math.min(30, Math.max(resto - 14 * Math.max(libres.length - 1, 1), 20));
        anchos[0] = anchoCta;
        resto -= anchoCta;
        libres = libres.filter((i) => i !== 0);
      }

      if (libres.includes(1) && this.esColumnaDescripcion(columnas[1])) {
        const anchoDesc = Math.round(resto * 0.3);
        anchos[1] = anchoDesc;
        resto -= anchoDesc;
        libres = libres.filter((i) => i !== 1);
      }

      if (libres.length > 0) {
        const iguales = Math.max(Math.round(resto / libres.length), 14);
        libres.forEach((i) => (anchos[i] = iguales));
      }
    }

    // Si quedó ancho sin repartir (p.ej. Descripción es la única columna libre
    // y las demás tienen ancho fijo), se le da a la columna de descripción para
    // que la tabla ocupe SIEMPRE todo el ancho útil de la página.
    const sobra = disponibles - anchos.reduce((s, a) => s + a, 0);
    if (sobra > 0) {
      const idxDesc = columnas.findIndex((c) => this.esColumnaDescripcion(c));
      anchos[idxDesc >= 0 ? idxDesc : anchos.length - 1] += sobra;
    }
    return anchos;
  }

  // =========================================================================
  // Excel (exceljs — xlsx CE ignora negritas, filetes y formatos)
  // =========================================================================

  nuevoLibro(): Workbook {
    const wb = new Workbook();
    wb.creator = this.usuario();
    wb.created = new Date();
    wb.modified = new Date();
    return wb;
  }

  /**
   * Encabezado de Excel en 2 filas con elementos COMPARTIDOS en la misma línea:
   *   fila 1: empresa (izquierda, grande, Audiowide) + título (centrado, Mukta)
   *   fila 2: RTN (izquierda, Mukta) + criterio de filtro (centrado, Mukta)
   * Devuelve la fila donde empieza la cabecera de la tabla.
   */
  excelEncabezado(wb: Workbook, ws: Worksheet, enc: EncabezadoPrint, tab: TablaPrint): number {
    void wb;
    const ncols = tab.columnas.length;

    // Anchos de columna (los re-aplica excelTabla, es idempotente)
    tab.columnas.forEach((col, i) => {
      ws.getColumn(i + 1).width =
        col.excel ?? (this.alineacionPorDefecto(col) === 'right' ? 16 : 14);
    });

    let fila = 1;

    const pintar = (
      row: ReturnType<Worksheet['getRow']>,
      col: number,
      texto: string,
      op: { font?: string; size: number; gris?: boolean; alinear: 'left' | 'center' | 'right' },
    ): void => {
      const cell = row.getCell(col);
      cell.value = texto || null;
      cell.font = {
        name: op.font ?? 'Calibri',
        size: op.size,
        color: { argb: op.gris ? GRIS_OSCURO : 'FF1E293B' },
      };
      cell.alignment = { horizontal: op.alinear, vertical: 'middle' };
      cell.fill = { type: 'pattern', pattern: 'none', fgColor: { argb: 'FFFFFFFF' } };
    };

    /** Fila con bloque izquierdo (columna 1) y bloque derecho centrado (columnas 2..N) */
    const filaCompartida = (
      izq: string,
      der: string,
      op: {
        sizeIzq: number;
        sizeDer?: number;
        grisIzq?: boolean;
        grisDer?: boolean;
        height: number;
        fontIzq?: string;
        fontDer?: string;
      },
    ): void => {
      const r = ws.getRow(fila);
      r.height = op.height;
      const sizeDer = op.sizeDer ?? op.sizeIzq;
      const fontIzq = op.fontIzq ?? 'Audiowide';
      const fontDer = op.fontDer ?? fontIzq;
      if (ncols < 2) {
        // Caso límite (una sola columna): ambos textos en la misma celda
        pintar(r, 1, der ? `${izq}     ${der}` : izq, { font: fontIzq, size: op.sizeIzq, alinear: 'left' });
      } else {
        for (let c = 1; c <= ncols; c++) pintar(r, c, '', { size: sizeDer, alinear: 'center' });
        pintar(r, 1, izq, { font: fontIzq, size: op.sizeIzq, gris: op.grisIzq, alinear: 'left' });
        pintar(r, 2, der, { font: fontDer, size: sizeDer, gris: op.grisDer, alinear: 'center' });
        ws.mergeCells(fila, 2, fila, ncols);
      }
      fila++;
    };

    /** Fila de texto único centrado en todas las columnas (ej. "Impreso por") */
    const filaCentrada = (texto: string, op: { size: number; gris?: boolean; height: number }): void => {
      const r = ws.getRow(fila);
      r.height = op.height;
      for (let c = 1; c <= ncols; c++) pintar(r, c, '', { size: op.size, alinear: 'center' });
      pintar(r, 1, texto, { size: op.size, gris: op.gris, alinear: 'center' });
      if (ncols > 1) ws.mergeCells(fila, 1, fila, ncols);
      fila++;
    };

    // 1) Fila 1 — empresa (izquierda, 21pt, Audiowide) + título (centrado, 13pt, Mukta)
    filaCompartida(enc.empresa, enc.titulo.toUpperCase(), { sizeIzq: 21, sizeDer: 13, height: 30, fontDer: 'Mukta' });

    // 2) Fila 2 — RTN (izquierda, 9pt) + criterio de filtro (centrado, 9pt), ambas en Mukta
    if (enc.rtn || enc.meta) {
      filaCompartida(enc.rtn, enc.meta, {
        sizeIzq: 9,
        sizeDer: 9,
        grisIzq: true,
        grisDer: true,
        height: 16,
        fontIzq: 'Mukta',
        fontDer: 'Mukta',
      });
    }

    // Excel no tiene pie de página: quién imprimió y cuándo van aquí
    filaCentrada(`Impreso por: ${enc.usuario} — ${enc.fecha}`, { size: 9, gris: true, height: 15 });

    ws.getRow(fila).height = 6;
    fila++;
    return fila;
  }

  /**
   * Tabla de Excel: cabecera con filete superior/inferior, cuerpo con formato
   * numérico y fila de totales. Congela la cabecera y configura impresión.
   * Devuelve la última fila usada.
   */
  excelTabla(ws: Worksheet, tab: TablaPrint, filaCabecera: number, orientacion: Orientacion = 'landscape'): number {
    const ncols = tab.columnas.length;

    // ---- Cabecera
    const cabecera = ws.getRow(filaCabecera);
    tab.columnas.forEach((col, i) => {
      const cell = cabecera.getCell(i + 1);
      cell.value = col.titulo;
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: GRIS_OSCURO } };
      cell.alignment = {
        horizontal: col.alinear ?? this.alineacionPorDefecto(col),
        vertical: 'middle',
        wrapText: true,
      };
      // Filete DISCONTINUO bajo la cabecera (sin línea superior)
      cell.border = {
        bottom: { style: 'dashed', color: { argb: GRIS_CLARO } },
      };
      if (col.excel) ws.getColumn(i + 1).width = col.excel;
      else ws.getColumn(i + 1).width = this.alineacionPorDefecto(col) === 'right' ? 16 : 14;
    });
    cabecera.height = 20;

    // ---- Cuerpo
    const filasTotales = new Set(tab.filasTotales ?? []);
    let fila = filaCabecera + 1;
    tab.filas.forEach((datos, idx) => {
      const r = ws.getRow(fila);
      const esTotal = filasTotales.has(idx);
      this.escribirFilaExcel(r, datos, tab.columnas, esTotal, tab.alineacionesTotales);
      fila++;
    });

    // ---- Fila final de totales
    if (tab.filaTotales) {
      this.escribirFilaExcel(ws.getRow(fila), tab.filaTotales, tab.columnas, true, tab.alineacionesTotales);
      fila++;
    }
    const ultimaFila = fila - 1;

    // ---- Congelar cabecera + impresión
    ws.views = [
      {
        state: 'frozen',
        ySplit: filaCabecera,
        xSplit: 0,
        activeCell: `A${filaCabecera + 1}`,
      },
    ];
    ws.pageSetup = {
      orientation: orientacion,
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
      printTitlesRow: `${filaCabecera}:${filaCabecera}`,
    };

    // Autofilter solo cuando no hay totales (evita ocultarlos al filtrar)
    if (!tab.filaTotales && filasTotales.size === 0 && tab.filas.length > 0) {
      ws.autoFilter = {
        from: { row: filaCabecera, column: 1 },
        to: { row: ultimaFila, column: ncols },
      };
    }

    return ultimaFila;
  }

  private escribirFilaExcel(
    row: ReturnType<Worksheet['getRow']>,
    datos: (string | number | null)[],
    columnas: ColumnaPrint[],
    esTotal: boolean,
    alineacionesTotales?: (Alineacion | undefined)[],
  ): void {
    columnas.forEach((col, i) => {
      const cell = row.getCell(i + 1);
      // Importes 0.00 → celda vacía (regla de diseño del ERP)
      let valor: string | number | null = this.esCero(datos[i]) ? null : (datos[i] ?? null);
      if (valor === '') valor = null;
      cell.value = valor;
      const alinear = alineacionesTotales?.[i] ?? col.alinear ?? this.alineacionPorDefecto(col);
      cell.font = { name: 'Calibri', size: 10, bold: esTotal, color: { argb: GRIS_OSCURO } };
      cell.alignment = { horizontal: alinear, vertical: 'middle' };
      if (typeof valor === 'number') cell.numFmt = '#,##0.00;[Red]-#,##0.00';
      if (esTotal) {
        // Filete DISCONTINUO sobre los totales
        cell.border = { top: { style: 'dashed', color: { argb: GRIS_CLARO } } };
      }
    });
    row.commit?.();
  }

  /** Descarga el workbook como .xlsx */
  async descargarExcel(wb: Workbook, nombreArchivo: string): Promise<void> {
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo;
    a.click();
    URL.revokeObjectURL(url);
  }

  // =========================================================================
  // Word (docx)
  // =========================================================================

  /**
   * Encabezado de Word, repetido en cada página, en 2 filas con elementos
   * COMPARTIDOS en la misma línea:
   *   fila 1: empresa (izquierda, grande, Audiowide) + título (centrado, Mukta)
   *   fila 2: RTN (izquierda, Mukta) + criterio de filtro (centrado, Mukta)
   * Usa una tabla sin bordes de 3 columnas (izq / centro / der) con las
   * columnas laterales del mismo ancho para que el bloque centrado quede en el
   * centro exacto de la página. Sin logo, sin dirección y sin teléfono.
   */
  wordEncabezado(enc: EncabezadoPrint, orientacion: Orientacion = 'portrait'): (Paragraph | Table)[] {
    const ancho = orientacion === 'landscape' ? 13840 : 10240;
    const lateral = 3400;
    const central = ancho - lateral * 2;

    const sinBordes = {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
    };

    const celda = (
      texto: string,
      anchoCelda: number,
      alinear: (typeof AlignmentType)[keyof typeof AlignmentType],
      size: number,
      gris = false,
      fuente = 'Audiowide',
    ): TableCell =>
      new TableCell({
        borders: sinBordes,
        verticalAlign: VerticalAlign.CENTER,
        width: { size: anchoCelda, type: WidthType.DXA },
        children: [
          new Paragraph({
            alignment: alinear,
            spacing: { before: 0, after: 0 },
            children: texto
              ? [new TextRun({ text: texto, size, font: fuente, ...(gris ? { color: '475569' } : {}) })]
              : [],
          }),
        ],
      });

    const filas: TableRow[] = [
      // Fila 1 — empresa (izq. 42 = 21pt, Audiowide) + título (centrado, 26 = 13pt, Mukta)
      new TableRow({
        children: [
          celda(enc.empresa, lateral, AlignmentType.LEFT, 42),
          celda(enc.titulo.toUpperCase(), central, AlignmentType.CENTER, 26, false, 'Mukta'),
          celda('', lateral, AlignmentType.RIGHT, 18),
        ],
      }),
    ];

    // Fila 2 — RTN (izq. 18 = 9pt) + criterio de filtro (centrado, 18 = 9pt), ambas en Mukta
    if (enc.rtn || enc.meta) {
      filas.push(
        new TableRow({
          children: [
            celda(enc.rtn, lateral, AlignmentType.LEFT, 18, true, 'Mukta'),
            celda(enc.meta, central, AlignmentType.CENTER, 18, true, 'Mukta'),
            celda('', lateral, AlignmentType.RIGHT, 18),
          ],
        }),
      );
    }

    const tabla = new Table({
      width: { size: ancho, type: WidthType.DXA },
      columnWidths: [lateral, central, lateral],
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
        insideHorizontal: { style: BorderStyle.NONE },
        insideVertical: { style: BorderStyle.NONE },
      },
      rows: filas,
    });

    return [
      tabla,
      // Filete inferior del encabezado
      new Paragraph({
        spacing: { before: 60, after: 120 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '5A5A5A', space: 1 } },
        children: [],
      }),
    ];
  }

  /** Pie con usuario, paginación y fecha */
  wordPie(enc: EncabezadoPrint, orientacion: Orientacion): (Paragraph | Table)[] {
    const ancho = orientacion === 'landscape' ? 13840 : 10240;
    const tercio = Math.round(ancho / 3);

    const celda = (texto: string, alinear: (typeof AlignmentType)[keyof typeof AlignmentType], conPagina = false): TableCell =>
      new TableCell({
        // docx exige color SIN alfa (6 dígitos) → '94A3B8' = GRIS_CLARO
        borders: { top: { style: BorderStyle.SINGLE, size: 4, color: '94A3B8' } },
        width: { size: tercio, type: WidthType.DXA },
        children: [
          new Paragraph({
            alignment: alinear,
            children: conPagina
              ? [
                  new TextRun({ text: 'Página ', size: 14, color: '64748B' }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 14, color: '64748B' }),
                  new TextRun({ text: ' de ', size: 14, color: '64748B' }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 14, color: '64748B' }),
                ]
              : [new TextRun({ text: texto, size: 14, color: '64748B' })],
          }),
        ],
      });

    const tabla = new Table({
      width: { size: ancho, type: WidthType.DXA },
      columnWidths: [tercio, tercio, ancho - tercio * 2],
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
        insideHorizontal: { style: BorderStyle.NONE },
        insideVertical: { style: BorderStyle.NONE },
      },
      rows: [
        new TableRow({
          children: [
            celda(`Impreso por: ${enc.usuario}`, AlignmentType.LEFT),
            celda('', AlignmentType.CENTER, true),
            celda(enc.fecha, AlignmentType.RIGHT),
          ],
        }),
      ],
    });

    return [tabla];
  }

  /**
   * Tabla minimalista de Word: filete DISCONTINUO bajo la cabecera, filete
   * DISCONTINUO sobre los totales y sin bordes en el cuerpo.
   */
  wordTabla(tab: TablaPrint, orientacion: Orientacion): Table {
    // Ancho útil real = página − márgenes izq/der (1000 twips c/u)
    const ancho = orientacion === 'landscape' ? 13840 : 10240;
    const anchos = this.wordAnchos(tab.columnas, ancho);
    const filasTotales = new Set(tab.filasTotales ?? []);

    const celda = (
      texto: string,
      alinear: (typeof AlignmentType)[keyof typeof AlignmentType],
      opts: { bold?: boolean; borde?: 'cabecera' | 'total' } = {},
    ): TableCell => {
      const bordes: any = {};
      if (opts.borde === 'cabecera') {
        bordes.bottom = { style: BorderStyle.DASHED, size: 6, color: '5A5A5A' };
      } else if (opts.borde === 'total') {
        bordes.top = { style: BorderStyle.DASHED, size: 6, color: '5A5A5A' };
      }
      return new TableCell({
        borders: bordes,
        children: [
          new Paragraph({
            alignment: alinear,
            spacing: { before: 20, after: 20 },
            children: [new TextRun({ text: texto, bold: opts.bold ?? false, size: 16 })],
          }),
        ],
      });
    };

    const alinearCol = (col: ColumnaPrint): (typeof AlignmentType)[keyof typeof AlignmentType] => {
      const a = col.alinear ?? this.alineacionPorDefecto(col);
      return a === 'right' ? AlignmentType.RIGHT : a === 'center' ? AlignmentType.CENTER : AlignmentType.LEFT;
    };

    /** Alineación de una celda de la fila de totales (override por columna) */
    const alinearTotal = (col: ColumnaPrint, i: number): (typeof AlignmentType)[keyof typeof AlignmentType] => {
      const a = tab.alineacionesTotales?.[i];
      if (!a) return alinearCol(col);
      return a === 'right' ? AlignmentType.RIGHT : a === 'center' ? AlignmentType.CENTER : AlignmentType.LEFT;
    };

    const filas: TableRow[] = [
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: tab.columnas.map((col) => celda(col.titulo, alinearCol(col), { bold: true, borde: 'cabecera' })),
      }),
    ];

    tab.filas.forEach((datos, idx) => {
      const esTotal = filasTotales.has(idx);
      const texto = this.filaATexto(datos);
      filas.push(
        new TableRow({
          cantSplit: true,
          children: tab.columnas.map((col, i) =>
            celda(texto[i], esTotal ? alinearTotal(col, i) : alinearCol(col), {
              bold: esTotal,
              borde: esTotal ? 'total' : undefined,
            }),
          ),
        }),
      );
    });

    if (tab.filaTotales) {
      const texto = this.filaATexto(tab.filaTotales);
      filas.push(
        new TableRow({
          cantSplit: true,
          children: tab.columnas.map((col, i) =>
            celda(texto[i], alinearTotal(col, i), { bold: true, borde: 'total' }),
          ),
        }),
      );
    }

    return new Table({
      rows: filas,
      columnWidths: anchos,
      width: { size: ancho, type: WidthType.DXA },
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
        insideHorizontal: { style: BorderStyle.NONE },
        insideVertical: { style: BorderStyle.NONE },
      },
    });
  }

  private wordAnchos(columnas: ColumnaPrint[], total: number): number[] {
    const anchos: number[] = columnas.map((c) => c.word ?? 0);

    let fijos = 0;
    let libres: number[] = [];
    anchos.forEach((a, i) => (a > 0 ? (fijos += a) : libres.push(i)));

    if (libres.length > 0) {
      let resto = Math.max(total - fijos, 1000);

      if (libres.includes(0)) {
        const anchoCta = Math.min(1500, Math.max(resto - 700 * Math.max(libres.length - 1, 1), 900));
        anchos[0] = anchoCta;
        resto -= anchoCta;
        libres = libres.filter((i) => i !== 0);
      }

      if (libres.includes(1) && this.esColumnaDescripcion(columnas[1])) {
        const anchoDesc = Math.round(resto * 0.35);
        anchos[1] = anchoDesc;
        resto -= anchoDesc;
        libres = libres.filter((i) => i !== 1);
      }

      if (libres.length > 0) {
        const iguales = Math.max(Math.round(resto / libres.length), 700);
        libres.forEach((i) => (anchos[i] = iguales));
      }
    }

    // Ancho sin repartir → columna de descripción (la tabla ocupa todo el útil)
    const sobra = total - anchos.reduce((s, a) => s + a, 0);
    if (sobra > 0) {
      const idxDesc = columnas.findIndex((c) => this.esColumnaDescripcion(c));
      anchos[idxDesc >= 0 ? idxDesc : anchos.length - 1] += sobra;
    }
    return anchos;
  }

  /** Documento Word con encabezado, paginación y orientación configuradas */
  wordDocumento(enc: EncabezadoPrint, orientacion: Orientacion, children: (Paragraph | Table)[]): Document {
    const page =
      orientacion === 'landscape'
        ? { width: 15840, height: 12240, orientation: 'landscape' as const }
        : { width: 12240, height: 15840, orientation: 'portrait' as const };

    return new Document({
      sections: [
        {
          properties: {
            page: {
              size: page,
              margin: { top: 1000, right: 1000, bottom: 900, left: 1000 },
            },
          },
          headers: { default: new Header({ children: this.wordEncabezado(enc, orientacion) }) },
          footers: { default: new Footer({ children: this.wordPie(enc, orientacion) }) },
          children,
        },
      ],
    });
  }
}
