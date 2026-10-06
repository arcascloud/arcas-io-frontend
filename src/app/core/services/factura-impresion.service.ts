import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { EmpresasService } from './empresas.service';
import { numeroALetras } from '../utils/numeros-a-letras';
import { COURIER_OBLIQUE_AFM, COURIER_BOLD_OBLIQUE_AFM } from '../utils/courier-afm';

// ===========================================================================
// Impresión de facturas — FORMATO PARAMETRIZABLE (100% PDF)
//   El formato (TICKET / CARTA) se resuelve desde `timpresoras.formato` vía
//   GET /companies/impresoras. Ambos formatos se generan con pdfMake:
//     TICKET → PDF de 80mm (bobina térmica, tipografía monoespaciada)
//     CARTA  → PDF tamaño LETTER
//   Imprimir / Descargar / Compartir comparten el mismo motor: no hay
//   tamaños de hoja quemados en los componentes. Agregar un nuevo formato
//   = agregar un caso aquí.
// ===========================================================================

/** Formatos soportados (deben coincidir con el enum de timpresoras.formato) */
export type FormatoImpresion = 'TICKET' | 'CARTA';

/** Formato usado cuando la empresa no tiene impresoras configuradas */
const FORMATO_DEFAULT: FormatoImpresion = 'CARTA';

/** Ancho de la bobina térmica en mm (solo aplica al formato TICKET) */
const ANCHO_TICKET_MM = 80;

/** 1 mm = 2.834645669 puntos PDF */
const MM_A_PT = 2.834645669;

/** Margen lateral del ticket en puntos (2mm) */
const MARGEN_TICKET_PT = 5.67;

/** Desglose fiscal por tasa que devuelve GET /facturas/:id/ticket */
export interface FacturaImpuestos {
  exonerado?: number;
  excento?: number;
  gravado15?: number;
  gravado18?: number;
}

/** Datos necesarios para imprimir (salen de GET /facturacion/facturas/:id/ticket) */
export interface FacturaImpresionData {
  factura: any;
  detalles: any[];
  pagos: any[];
  empresa: any;
  correlativo?: any | null;
  impuestos?: FacturaImpuestos | null;
  /** Cajero que emitió la factura (tusuarios) y código de TPV (tusuarios_caja.codigo) */
  cajero?: { usuario?: string; nombre?: string; apellidos?: string } | null;
  tpv?: number | string | null;
  /** Sucursal de la factura (tsucursal) */
  sucursal?: { descripcion?: string; direccion?: string; telefono1?: string; telefono2?: string } | null;
}

@Injectable({ providedIn: 'root' })
export class FacturaImpresionService {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private empresas = inject(EmpresasService);

  /** Cache del catálogo de formas de pago (etiquetas de pagos) */
  private formasPago: Promise<{ label: string; value: number }[]> | null = null;

  /** Cache de la inicialización de pdfmake (fuentes Roboto + Courier) — se hace una sola vez */
  private pdfMakeInit: Promise<any> | null = null;
  /** Catálogo ya resuelto (para uso síncrono al construir el PDF) */
  private formasPagoList: { label: string; value: number }[] = [];

  // =========================================================================
  // RESOLUCIÓN DEL FORMATO
  // =========================================================================

  /**
   * Resuelve el formato de impresión desde `timpresoras.formato`.
   * Prioridad: impresora de la sucursal del documento → primera de la
   * empresa → FORMATO_DEFAULT (nunca lanza error: imprimir no debe fallar
   * por un problema de configuración, se cae al formato por defecto).
   */
  async getFormatoImpresion(idsucursal?: number): Promise<FormatoImpresion> {
    try {
      const empresaId = this.auth.currentUser()?.empresaId;
      if (!empresaId) return FORMATO_DEFAULT;
      const lista = await firstValueFrom(this.empresas.getAllImpresoras(empresaId));
      if (!Array.isArray(lista) || lista.length === 0) return FORMATO_DEFAULT;
      const suc = idsucursal ?? this.auth.currentUser()?.idsucursal;
      const imp = lista.find((i) => i.Idsucursal === suc) ?? lista[0];
      return imp?.formato === 'TICKET' ? 'TICKET' : 'CARTA';
    } catch {
      return FORMATO_DEFAULT;
    }
  }

  // =========================================================================
  // ACCIONES (todas respetan el formato parametrizado)
  // =========================================================================

  /**
   * Imprime la factura en el formato configurado en `timpresoras`.
   * Nota (pdfmake 0.3): `.print()` NO abre el diálogo de impresión del
   * navegador — solo marca OpenAction en el PDF y muestra una pestaña con el
   * blob. Para conservar el `window.print()` de antes se genera el blob y se
   * imprime desde un iframe oculto (patrón estándar en Chrome/Edge/Firefox).
   */
  async imprimir(data: FacturaImpresionData, idsucursal?: number): Promise<void> {
    const doc = await this.buildPdf(data, idsucursal);
    const pdfMake = await this.cargarPdfMake();
    const blob: Blob = await pdfMake.createPdf(doc).getBlob();
    this.imprimirBlobEnIframe(blob);
  }

  /** Descarga la factura como PDF en el formato configurado */
  async descargar(data: FacturaImpresionData, nombre?: string): Promise<void> {
    const doc = await this.buildPdf(data);
    const pdfMake = await this.cargarPdfMake();
    const id = data?.factura?.nrofactura ?? data?.factura?.facturaId;
    pdfMake.createPdf(doc).download(nombre || `factura-${id}.pdf`);
  }

  /** Devuelve el blob del PDF en el formato configurado (para compartir / adjuntar) */
  async getBlob(data: FacturaImpresionData): Promise<Blob> {
    const doc = await this.buildPdf(data);
    const pdfMake = await this.cargarPdfMake();
    // pdfmake 0.3: getBlob() devuelve una Promesa (el estilo callback de 0.2 ya no aplica)
    return pdfMake.createPdf(doc).getBlob();
  }

  /**
   * Abre el diálogo de impresión del navegador con un PDF en blob.
   * Monta un iframe de 0×0 con el PDF y llama a `print()` en su contenido:
   * es la forma confiable de disparar la impresión sin abrir pestañas
   * visibles. Si `print()` falla, se respalda abriendo el PDF en pestaña.
   */
  private imprimirBlobEnIframe(blob: Blob): void {
    const url = URL.createObjectURL(blob);
    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.setAttribute('tabindex', '-1');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.src = url;
    document.body.appendChild(iframe);

    let limpio = false;
    const limpiar = () => {
      if (limpio) return;
      limpio = true;
      URL.revokeObjectURL(url);
      iframe.remove();
    };

    iframe.addEventListener('load', () => {
      // El visor PDF del navegador necesita un instante antes de aceptar print()
      setTimeout(() => {
        try {
          iframe.contentWindow?.addEventListener('afterprint', limpiar, { once: true });
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch {
          // Respaldo: abrir el PDF en pestaña para impresión manual
          try {
            window.open(url, '_blank');
          } catch {
            /* popup bloqueado: se limpia igual en el respaldo inferior */
          }
          setTimeout(limpiar, 60000);
        }
      }, 300);
    });

    // afterprint llega en la ventana principal o en la del iframe (varía según navegador)
    window.addEventListener('afterprint', limpiar, { once: true });
    // Respaldo por si afterprint nunca llega (5 min: el diálogo ya cerró)
    setTimeout(limpiar, 300000);
  }

  /**
   * Construye el PDF según el formato parametrizado.
   * Precarga el catálogo de formas de pago (etiquetas en los pagos).
   */
  private async buildPdf(data: FacturaImpresionData, idsucursal?: number): Promise<any> {
    const suc = idsucursal ?? data?.factura?.Idsucursal;
    const formato = await this.getFormatoImpresion(suc);
    this.formasPagoList = await this.cargarFormasPago();
    return formato === 'TICKET' ? this.buildTicketPdf(data) : this.buildCartaPdf(data);
  }

  // =========================================================================
  // FORMATO TICKET — PDF de 80mm (bobina térmica)
  // =========================================================================

  private buildTicketPdf(data: FacturaImpresionData): any {
    const f = data?.factura;
    const dets = data?.detalles ?? [];
    const emp = data?.empresa ?? {};
    const pagos = data?.pagos ?? [];
    const corr = data?.correlativo ?? null;

    const ancho = Math.round(ANCHO_TICKET_MM * MM_A_PT * 100) / 100; // 226.77pt
    const anchoUtil = Math.round((ancho - 2 * MARGEN_TICKET_PT) * 100) / 100; // ~215pt

    // Número de factura con prefijo del rango: 000-001-01-00120004
    const nroBase = String(f?.nrofactura ?? '').padStart(8, '0');
    let nroFmt = nroBase;
    if (corr?.rangoDesde) {
      const partes = corr.rangoDesde.split('-');
      if (partes.length > 1) nroFmt = partes.slice(0, -1).join('-') + '-' + nroBase;
    }

    const fecha = f?.fecharegistro
      ? new Date(f.fecharegistro).toLocaleDateString('es-HN', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : '-';
    const hora = f?.fecharegistro
      ? new Date(f.fecharegistro).toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' })
      : '-';
    const condicion = f?.tipofactura === 'C' ? 'CRÉDITO' : 'CONTADO';

    // ----- Encabezado empresa -----
    const suc = data?.sucursal ?? {};

    // Teléfonos del encabezado: "Mobil: <suc.telefono1>, Telefonos: <empresa>"
    const telParts: string[] = [];
    if (suc.telefono1) telParts.push('Mobil: ' + suc.telefono1);
    if (emp.telefono) telParts.push('Telefonos: ' + emp.telefono);
    const lineaTelefonos = telParts.join(', ');

    const content: any[] = [
      { text: emp.nombre || 'EMPRESA', bold: true, fontSize: 12, alignment: 'center', margin: [0, 0, 0, 2] },
      // Nombre de la sucursal centrado (nuevo)
      ...(suc.descripcion ? [{ text: suc.descripcion, fontSize: 9, alignment: 'center', margin: [0, 0, 0, 1] }] : []),
      ...(emp.rtn ? [{ text: 'RTN: ' + emp.rtn, bold: true, fontSize: 7.5, alignment: 'center' }] : []),
      ...(emp.direccion ? [{ text: emp.direccion, fontSize: 7.5, alignment: 'center' }] : []),
      ...(lineaTelefonos ? [{ text: lineaTelefonos, fontSize: 7.5, alignment: 'center' }] : []),
      // Atención al cliente (nuevo) — tempresasdet tipo CORREO
      ...(emp.correo ? [{ text: 'Atención al cliente: ' + emp.correo, fontSize: 7.5, alignment: 'center' }] : []),
      this.sepTicket(anchoUtil),
      // Bloque Sucursal (nuevo): tsucursal descripción / dirección / teléfonos
      ...(data?.sucursal != null
        ? [
            { text: 'Sucursal', bold: true, fontSize: 7.5, alignment: 'center', margin: [0, 1, 0, 1] },
            ...(suc.descripcion ? [{ text: suc.descripcion, fontSize: 7.5, alignment: 'center' }] : []),
            ...(suc.direccion ? [{ text: suc.direccion, fontSize: 7.5, alignment: 'center' }] : []),
            ...([suc.telefono1, suc.telefono2].filter(Boolean).length
              ? [{ text: [suc.telefono1, suc.telefono2].filter(Boolean).join(', '), fontSize: 7.5, alignment: 'center' }]
              : []),
          ]
        : []),
      this.sepTicket(anchoUtil),
    ];

    // ----- Datos de la factura -----
    content.push(
      this.filaTicket('FACTURA No.:', nroFmt, true, 9),
      this.filaTicket('Fecha Emi..:', `${fecha}  Hora Emi: ${hora}`),
      this.filaTicket('Cliente:', String(f?.nombrecliente || 'N/A').substring(0, 30)),
      this.filaTicket('Condición:', condicion),
      this.filaTicket('RTN Cliente:', f?.rtn_cliente ? String(f.rtn_cliente) : ''),
      ...(f?.direccion ? [this.filaTicket('Dir:', String(f.direccion).substring(0, 30))] : []),
      this.sepTicket(anchoUtil),
    );

    // ----- Código CAI / Fecha límite / Rango autorizado -----
    if (corr) {
      const fechaLimiteFmt = corr.fechaLimite
        ? new Date(corr.fechaLimite).toLocaleDateString('es-HN', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : '';
      content.push(
        { text: 'Código CAI', bold: true, fontSize: 6.5, alignment: 'center', margin: [0, 2, 0, 0] },
        { text: corr.cai || '', fontSize: 6.5, alignment: 'center', characterSpacing: 0.5 },
        ...(fechaLimiteFmt
          ? [{ text: 'Fecha límite de emisión:  ' + fechaLimiteFmt, fontSize: 6.5, alignment: 'center', margin: [0, 1, 0, 0] }]
          : []),
        { text: 'Rango autorizado', bold: true, fontSize: 6.5, alignment: 'center', margin: [0, 2, 0, 0] },
        { text: `del ${corr.rangoDesde} al ${corr.rangoHasta}`, fontSize: 6.5, alignment: 'center' },
        this.sepTicket(anchoUtil),
      );
    }

    // ----- Cajero / TPV (tusuarios nombre+apellidos + tusuarios_caja.codigo) -----
    const nombreCajero = [data?.cajero?.nombre, data?.cajero?.apellidos].filter(Boolean).join(' ').trim();
    const tpvTxt = data?.tpv != null && data?.tpv !== '' ? String(data.tpv) : '';
    if (nombreCajero || tpvTxt) {
      content.push(
        ...(nombreCajero ? [{ text: 'Cajero: ' + nombreCajero, fontSize: 7.5, margin: [0, 1, 0, 1] }] : []),
        ...(tpvTxt ? [{ text: '   TPV: #' + tpvTxt, fontSize: 7.5, margin: [0, 1, 0, 1] }] : []),
        this.sepTicket(anchoUtil),
      );
    }

    // ----- Detalle de artículos -----
    const body: any[] = [
      [
        { text: 'ARTÍCULO', bold: true, fontSize: 7 },
        { text: 'CANT × P.U.', bold: true, fontSize: 7, alignment: 'right' },
        { text: 'TOTAL', bold: true, fontSize: 7, alignment: 'right' },
      ],
      ...dets.map((d: any) => {
        const cant = Number(d.cantidad);
        const precio = Number(d.precioventa);
        const tot = Number(d.subTotal) || cant * precio;
        const pDesc = Number(d.p_descuento) || 0;
        const desc = d.descripcion || `#${d.productoId}`;
        const cod = d.codbarra ? ` (${d.codbarra})` : '';
        return [
          { text: [
            { text: desc + cod + '\n', fontSize: 7.5 },
            ...(pDesc > 0 ? [{ text: `Desc: -${Number(pDesc.toFixed(0))}%`, fontSize: 6.5, color: '#555555' }] : []),
          ] },
          { text: `${cant} × ${this.formatNum(precio)}`, fontSize: 7.5, alignment: 'right' },
          { text: this.formatNum(tot), fontSize: 7.5, alignment: 'right' },
        ];
      }),
    ];
    content.push(
      { table: { widths: ['*', 58, 52], body }, layout: 'noBorders', margin: [0, 2, 0, 2] },
      this.sepTicket(anchoUtil),
    );

    // ----- Totales (desglose fiscal por tasa) -----
    const subtotal = Number(f?.subTotal) || 0;
    const descuento = Number(f?.descuento) || 0;
    const total = Number(f?.total) || 0;
    const imp = this.desgloseFiscal(f, data);
    const efectivoPagos = pagos.reduce((s: number, p: any) => s + (Number(p.importe_efectivo) || 0), 0);
    const efectivo = Number(f?.efectivo_recibido) || efectivoPagos;
    const cambio = Number(f?.importe_cambio) || 0;
    const letras = this.totalEnLetras(total);

    content.push(
      this.filaTicket('Subtotal:', 'L ' + this.formatNum(subtotal)),
      this.filaTicket('-Rebajas y Descuentos:', 'L ' + this.formatNum(descuento)),
      this.filaTicket('Importe Exonerado:', 'L ' + this.formatNum(imp.exonerado)),
      this.filaTicket('Importe Excento:', 'L ' + this.formatNum(imp.excento)),
      this.filaTicket('Importe Gravado 15%:', 'L ' + this.formatNum(imp.gravado15)),
      this.filaTicket('Importe Gravado 18%:', 'L ' + this.formatNum(imp.gravado18)),
      this.filaTicket('Total a pagar:', 'L ' + this.formatNum(total), true, 10),
      this.sepTicket(anchoUtil),
    );

    // ----- Pagos (otros medios: tarjeta, transferencia, etc.) -----
    const otrosPagos = pagos.filter((p: any) => Number(p.importe_otros) > 0);
    if (otrosPagos.length > 0) {
      content.push({ text: 'PAGOS', bold: true, fontSize: 7, margin: [0, 2, 0, 0] });
      for (const p of otrosPagos) {
        let desc = this.etiquetaFormaPago(p.formapagoId);
        if (desc.toLowerCase().includes('tarjeta') && p.nrotarjeta) {
          desc += ' ****' + String(p.nrotarjeta).slice(-4);
        }
        if (p.nroautorizacion) desc += ' Aut: ' + p.nroautorizacion;
        content.push(this.filaTicket(desc, this.formatNum(Number(p.importe_otros) || 0)));
      }
      content.push(this.sepTicket(anchoUtil));
    }

    // ----- Efectivo y cambio (siempre visibles) -----
    content.push(
      this.filaTicket('PAGO EN EFECTIVO:', this.formatNum(efectivo)),
      this.sepTicket(anchoUtil),
      this.filaTicket('Cambio:', this.formatNum(cambio)),
      { text: 'Total en Letras:', fontSize: 7, margin: [0, 5, 0, 1] },
      { text: letras, bold: true, fontSize: 7.5, margin: [0, 0, 0, 2] },
    );

    // ----- Constancias: siempre 3 líneas (OCE/CEA/SAG); número si coincide, FNE en blanco -----
    const constancias = this.constanciasDe(f);

    // ----- Pie legal -----
    content.push(
      { text: 'Original: OBLIGADO TRIBUTARIO', fontSize: 6.5, alignment: 'center', color: '#555555' },
      { text: 'Copia al contribuyente emisor', fontSize: 6.5, alignment: 'center', color: '#555555' },
      ...constancias.flatMap((c) => [
        { text: c.titulo, fontSize: 7, margin: [0, 4, 0, 1] },
        { text: c.numero || ' ', fontSize: 7, margin: [0, 0, 0, 1] },
        this.sepTicket(anchoUtil),
      ]),
      { text: '¡Gracias por su compra!', fontSize: 7, alignment: 'center', bold: true, margin: [0, 3, 0, 0] },
      ...(emp.mensajeDevolucion ? [{ text: emp.mensajeDevolucion, fontSize: 6.5, alignment: 'center', color: '#555555' }] : []),
      ...(emp.mensajeFactura ? [{ text: emp.mensajeFactura, fontSize: 6.5, alignment: 'center', color: '#555555' }] : []),
    );

    const extrasTicket = (nombreCajero || tpvTxt ? 26 : 0) + constancias.length * 30;
    const letrasLineas = 2 + Math.ceil(letras.length / 44);
    return {
      pageSize: { width: ancho, height: this.alturaTicketPdf(dets.length, otrosPagos.length, !!corr, letrasLineas, extrasTicket) },
      pageMargins: [MARGEN_TICKET_PT, MARGEN_TICKET_PT, MARGEN_TICKET_PT, MARGEN_TICKET_PT],
      content,
      defaultStyle: { font: 'Courier', fontSize: 8 },
    };
  }

  /**
   * Altura estimada del ticket en puntos (el PDF es de una sola página;
   * se calcula para que la bobina no sobre ni falte).
   * Base: encabezado + datos + totales (8 líneas) + efectivo/cambio + pie legal.
   * `extras`: bloque Cajero/TPV + bloques de constancia.
   */
  private alturaTicketPdf(items: number, pagos: number, corr: boolean, letrasLineas: number, extras = 0): number {
    let alto = 370;
    if (corr) alto += 62;
    alto += extras;
    alto += items * 26;
    alto += pagos * 11;
    alto += letrasLineas * 11; // "Total en Letras" + texto (con salto de línea)
    return Math.max(420, Math.ceil(alto));
  }

  /**
   * Bloques de constancia: SIEMPRE imprime las 3 líneas (OCE, CEA, SAG).
   * Solo se llena el número cuando `tipoconstancia` coincide con la línea;
   * en FNE (factura no exenta) las 3 quedan en blanco para llenar manual.
   */
  private constanciasDe(f: any): { titulo: string; numero: string }[] {
    const lineas: { tipo: string; titulo: string }[] = [
      { tipo: 'OCE', titulo: '# Correlativo orden de compra excenta' },
      { tipo: 'CEA', titulo: '# Correlativo constancia registro exonerado' },
      { tipo: 'SAG', titulo: '# Identifacion registro de SAG' },
    ];
    const tipo = String(f?.tipoconstancia || '').toUpperCase();
    const nro = String(f?.nroconstancia || '').trim();
    return lineas.map((l) => ({ titulo: l.titulo, numero: l.tipo === tipo ? nro : '' }));
  }

  /**
   * Desglose fiscal por tasa. Viene del backend (GET /facturas/:id/ticket →
   * `impuestos`); si falta (cache vieja / respuesta sin desglose), el ISV
   * total se atribuye a la tasa 15% para no perderlo.
   */
  private desgloseFiscal(f: any, data: FacturaImpresionData): FacturaImpuestos {
    const imp = data?.impuestos;
    if (imp && (imp.gravado15 != null || imp.gravado18 != null)) {
      return {
        exonerado: Number(imp.exonerado) || 0,
        excento: Number(imp.excento) || 0,
        gravado15: Number(imp.gravado15) || 0,
        gravado18: Number(imp.gravado18) || 0,
      };
    }
    return { exonerado: 0, excento: 0, gravado15: Number(f?.impuesto) || 0, gravado18: 0 };
  }

  /**
   * Total en letras formato ticket: "CINCUENTA Y NUEVE MIL OCHOCIENTOS CON 00/100"
   * (usa el utilitario compartido y le quita la palabra LEMPIRAS / agrega CON).
   */
  private totalEnLetras(valor: number): string {
    const base = numeroALetras(valor).replace(/\s*LEMPIRAS$/i, '').trim();
    if (/\d{2}\/100$/.test(base)) return base.replace(/(\d{2}\/100)$/, 'CON $1');
    return base + ' CON 00/100';
  }

  /** Fila etiqueta/valor del ticket (monoespaciada, valor a la derecha) */
  private filaTicket(izq: string, der: string, bold = false, size = 8): any {
    return {
      columns: [
        { text: izq, width: '*' },
        { text: der, width: 'auto', alignment: 'right' },
      ],
      bold,
      fontSize: size,
      margin: [0, 1, 0, 1],
    };
  }

  /** Separador punteado del ticket (dashed) */
  private sepTicket(ancho: number): any {
    return {
      canvas: [{ type: 'line', x1: 0, y1: 0, x2: ancho, y2: 0, lineWidth: 0.5, lineColor: '#000000', dashPattern: [2, 2] }],
      margin: [0, 3, 0, 3],
    };
  }

  // =========================================================================
  // FORMATO CARTA — PDF pdfMake (LETTER)
  // =========================================================================

  private buildCartaPdf(data: FacturaImpresionData): any {
    const f = data?.factura;
    const dets = data?.detalles ?? [];
    const emp = data?.empresa ?? {};
    const pagos = data?.pagos ?? [];
    const corr = data?.correlativo ?? null;
    const nombreCajero = [data?.cajero?.nombre, data?.cajero?.apellidos].filter(Boolean).join(' ').trim();
    const tpvTxt = data?.tpv != null && data?.tpv !== '' ? String(data.tpv) : '';

    // Totales / desglose fiscal (mismo bloque que el formato TICKET)
    const subtotal = Number(f?.subTotal) || 0;
    const descuento = Number(f?.descuento) || 0;
    const total = Number(f?.total) || 0;
    const imp = this.desgloseFiscal(f, data);
    const efectivoPagos = pagos.reduce((s: number, p: any) => s + (Number(p.importe_efectivo) || 0), 0);
    const efectivo = Number(f?.efectivo_recibido) || efectivoPagos;
    const cambio = Number(f?.importe_cambio) || 0;
    const letras = this.totalEnLetras(total);

    const detRows = dets.map((d: any, i: number) => [
      '' + (i + 1),
      d.descripcion || d.codbarra || '',
      '' + Number(d.cantidad),
      'L ' + Number(d.precioventa).toFixed(2),
      (Number(d.descuento) || 0) > 0 ? '-' + Number(d.descuento).toFixed(0) + '%' : '0%',
      'L ' + Number(d.subTotal).toFixed(2),
    ]);

    return {
      pageSize: 'LETTER',
      pageMargins: [40, 60, 40, 60],
      content: [
        { text: emp.nombre || 'EMPRESA', style: 'header', alignment: 'center' },
        { text: emp.rtn ? 'RTN: ' + emp.rtn : '', alignment: 'center', fontSize: 9 },
        { text: emp.direccion || '', alignment: 'center', fontSize: 9 },
        { text: emp.telefono ? 'Tel: ' + emp.telefono : '', alignment: 'center', fontSize: 9 },
        { text: '\n' },
        { columns: [
          { text: '', width: '*' },
          { text: [
            { text: this.getEstadoLabel(f) + '\n', bold: true, fontSize: 12, color: '#10b981' },
            { text: 'FACTURA ', bold: true, fontSize: 16 },
            { text: '#' + (f?.nrofactura || ''), fontSize: 16 },
            '\n',
            { text: 'Fecha: ', bold: true }, this.fechaLarga(f?.fecharegistro) + '\n',
            { text: 'Hora: ', bold: true }, this.horaCorta(f?.fecharegistro) + '\n',
            { text: 'Tipo: ', bold: true }, (f?.tipofactura === 'C' ? 'Credito' : 'Contado'),
            '\n',
            ...(corr ? [
              { text: 'RANGO AUTORIZADO: ', bold: true }, `del ${corr.rangoDesde} al ${corr.rangoHasta}`, '\n',
              { text: 'CAI: ', bold: true }, corr.cai || '-',
            ] : []),
            ...(nombreCajero ? [
              '\n', { text: 'Cajero: ', bold: true },
              nombreCajero + (tpvTxt ? '   TPV: #' + tpvTxt : ''),
            ] : []),
          ], width: '*', alignment: 'right' },
        ] },
        { text: '\n' },
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#e2e8f0' }] },
        { text: '\n' },
        { columns: [
          { text: [
            { text: 'CLIENTE\n', bold: true, fontSize: 10 },
            f?.nombrecliente || 'Sin cliente', '\n',
            f?.direccion || '',
          ], width: '*' },
          { text: [
            { text: 'DIRECCION DE ENTREGA\n', bold: true, fontSize: 10 },
            f?.direccion || 'N/A',
          ], width: '*' },
        ] },
        { text: '\n' },
        {
          table: {
            headerRows: 1,
            widths: [30, '*', 50, 70, 50, 70],
            body: [
              [
                { text: '#', style: 'tableHeader' },
                { text: 'Producto', style: 'tableHeader' },
                { text: 'Cant.', style: 'tableHeader', alignment: 'right' },
                { text: 'Precio', style: 'tableHeader', alignment: 'right' },
                { text: 'Desc.', style: 'tableHeader', alignment: 'right' },
                { text: 'Subtotal', style: 'tableHeader', alignment: 'right' },
              ],
              ...detRows,
            ],
          },
          layout: 'lightHorizontalLines',
        },
        { text: '\n' },
        {
          alignment: 'right',
          columns: [
            { width: '*', text: '' },
            { width: 250, text: [
              { text: 'Subtotal: ', bold: true }, 'L ' + subtotal.toFixed(2),
              '\n', { text: '-Rebajas y Descuentos: ', bold: true }, 'L ' + descuento.toFixed(2),
              '\n', { text: 'Importe Exonerado: ', bold: true }, 'L ' + imp.exonerado.toFixed(2),
              '\n', { text: 'Importe Excento: ', bold: true }, 'L ' + imp.excento.toFixed(2),
              '\n', { text: 'Importe Gravado 15%: ', bold: true }, 'L ' + imp.gravado15.toFixed(2),
              '\n', { text: 'Importe Gravado 18%: ', bold: true }, 'L ' + imp.gravado18.toFixed(2),
              '\n', { text: 'Total a pagar: ', bold: true, fontSize: 14 }, { text: 'L ' + total.toFixed(2), bold: true, fontSize: 14, color: '#10b981' },
            ] },
          ],
        },
        { text: '\n' },
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#e2e8f0' }] },
        { text: '\n' },
        { text: 'PAGOS', bold: true, fontSize: 10 },
        ...pagos.map((p: any) => ({
          text: this.etiquetaFormaPago(p.formapagoId) + ': L ' +
            (Number(p.importe_otros) > 0 ? Number(p.importe_otros).toFixed(2) : Number(p.importe_efectivo ?? 0).toFixed(2)),
          fontSize: 9,
        })),
        { text: 'Pago en efectivo: L ' + efectivo.toFixed(2) + '    Cambio: L ' + cambio.toFixed(2), fontSize: 9 },
        { text: '\n' },
        { text: [
          { text: 'Total en Letras: ', bold: true },
          letras,
        ], fontSize: 9 },
        ...this.constanciasDe(f).flatMap((c) => [
          { text: c.titulo, bold: true, fontSize: 9, alignment: 'center', margin: [0, 8, 0, 2] },
          { text: c.numero || ' ', fontSize: 9, alignment: 'center' },
          { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: '#e2e8f0' }], margin: [0, 4, 0, 4] },
        ]),
        { text: 'Original: OBLIGADO TRIBUTARIO    Copia al contribuyente emisor', fontSize: 8, alignment: 'center', color: '#64748b', margin: [0, 6, 0, 0] },
        { text: '\u00a1Gracias por su compra!', bold: true, fontSize: 11, alignment: 'center' },
        { text: emp.mensajeDevolucion || '', alignment: 'center', fontSize: 8, italics: true, color: '#64748b' },
        { text: emp.mensajeFactura || '', alignment: 'center', fontSize: 8, italics: true, color: '#64748b' },
      ],
      styles: {
        header: { fontSize: 18, bold: true },
        tableHeader: { bold: true, fontSize: 9, color: 'white', fillColor: '#10b981' },
      },
      defaultStyle: { fontSize: 10 },
    };
  }

  // =========================================================================
  // UTILIDADES
  // =========================================================================

  /**
   * Inicializa pdfmake (v0.3) con sus fuentes oficiales.
   * En pdfmake 0.3 la asignación `pdfMake.vfs = ...` ya NO funciona (propiedad
   * de legado): el motor lee `virtualfs` y `fonts`, que se cargan con estos
   * métodos. Sin ellos el ticket lanza "Font 'Courier' ... is not defined" y
   * la carta "File 'Roboto-Regular.ttf' not found in virtual file system".
   */
  private cargarPdfMake(): Promise<any> {
    if (!this.pdfMakeInit) {
      this.pdfMakeInit = this.inicializarPdfMake();
    }
    return this.pdfMakeInit;
  }

  private async inicializarPdfMake(): Promise<any> {
    const pdfMake: any = (await import('pdfmake/build/pdfmake')).default;

    // Roboto (TTF en base64) — fuente por defecto del formato CARTA
    const pdfFontsMod: any = await import('pdfmake/build/vfs_fonts');
    const pdfFonts = pdfFontsMod.default ?? pdfFontsMod;
    pdfMake.addVirtualFileSystem(pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : pdfFonts);

    // Courier estándar (AFM) — tipografía monoespaciada del TICKET.
    // El contenedor incluye Courier.afm + Courier-Bold.afm y el mapeo
    // fonts.Courier (normal/bold/italics/bolditalics).
    const courierMod: any = await import('pdfmake/build/standard-fonts/Courier');
    pdfMake.addFontContainer(courierMod.default ?? courierMod);

    // Courier-Oblique / Courier-BoldOblique: no vienen en el contenedor oficial
    // y son necesarios para los mensajes en itálica del ticket.
    pdfMake.addVirtualFileSystem({
      'data/Courier-Oblique.afm': { data: COURIER_OBLIQUE_AFM, encoding: 'utf8' },
      'data/Courier-BoldOblique.afm': { data: COURIER_BOLD_OBLIQUE_AFM, encoding: 'utf8' },
    });

    return pdfMake;
  }

  /** Etiqueta de la forma de pago (usa el catálogo precargado en buildPdf) */
  private etiquetaFormaPago(formapagoId: number): string {
    const fp = this.formasPagoList.find((f) => f.value === formapagoId);
    return fp?.label || `Pago #${formapagoId}`;
  }

  private cargarFormasPago(): Promise<{ label: string; value: number }[]> {
    if (!this.formasPago) {
      this.formasPago = firstValueFrom(this.api.get<any[]>('/parametros/formas-pago'))
        .then((items) => (items ?? []).map((i) => ({ label: i.descripcion, value: i.formapagoId })))
        .catch(() => []);
    }
    return this.formasPago;
  }

  private getEstadoLabel(f: any): string {
    if (f?.sn_anulada === 'S') return 'Anulada';
    if (f?.sn_pagada === 'S') return 'Pagada';
    return 'Pendiente';
  }

  private fechaLarga(fecha: string | Date): string {
    if (!fecha) return '-';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-HN', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  private horaCorta(fecha: string | Date): string {
    if (!fecha) return '-';
    const d = new Date(fecha);
    return d.toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' });
  }

  private formatNum(n: number): string {
    return Number(n).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
