export interface FacturaItem {
  codbarra: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
}

export interface FacturaData {
  nroFactura: string;
  fecha: string;
  proveedor: string;
  rtn: string;
  items: FacturaItem[];
  subtotal: number;
  impuesto: number;
  total: number;
  confianza: number;
  textoCrudo: string;
}

function parsearNumero(str: string): number {
  if (!str) return 0;
  const limpio = str.replace(/[L\$\s]/g, '').replace(/,/g, '');
  const num = parseFloat(limpio);
  return isNaN(num) ? 0 : Math.round(num * 100) / 100;
}

function buscarPatron(texto: string, patrones: RegExp[]): string {
  for (const patron of patrones) {
    const match = texto.match(patron);
    if (match?.[1]) return match[1].trim();
  }
  return '';
}

function buscarNumeroFactura(texto: string): string {
  const completo = texto.match(/(\d{3}-\d{3}-\d{5,})/);
  if (completo?.[1]) return completo[1].replace(/\s+/g, '');
  const match = texto.match(/(?:N[°º*.\s]*|n[ro°.]*\s*)\s*factura\s*[:\-]?\s*([\d\-\.]+)/i);
  if (match?.[1]) {
    let numero = match[1].trim().replace(/\s+/g, '');
    if (numero.endsWith('-')) {
      const despues = texto.slice((match.index || 0) + match[0].length);
      const continuacion = despues.match(/RTN[:\s]*[\d\-\.]+\s+(\d{7,})/) || despues.match(/^\s*(\d{7,})/);
      if (continuacion?.[1]) numero += continuacion[1].trim();
    }
    return numero;
  }
  return '';
}

// ── ETL: Extraer bloque DETALLE entre cabecera y totales ──
function extraerBloqueDetalle(ocrText: string): string {
  const patronTabla = /DETALLE[\s\S]*?(?:Código|Descripción)[\s\S]*?\n([\s\S]*?)(?:Subtotal|ISV|IVA|Total)/i;
  const matchTabla = ocrText.match(patronTabla);
  return matchTabla ? matchTabla[1] : ocrText;
}

// Detecta si una línea es basura OCR
function esLineaBasura(linea: string): boolean {
  const trim = linea.trim();
  if (trim.length < 3) return true;
  const alfanumericos = trim.replace(/[^a-zA-Z0-9]/g, '').length;
  if (alfanumericos < 2) return true;
  if (/^[\s\-\._qQoO]+$/.test(trim)) return true;
  if (/\b\w{1,2}\s+[\-\s]+$/.test(trim)) return true;
  if (/\s-\s-\s*$/.test(trim)) return true;
  return false;
}

// ── ETL: Parsear ítems con buffer y descarte de basura ──
function extraerItems(ocrText: string): FacturaItem[] {
  const textoDetalle = extraerBloqueDetalle(ocrText);
  const lineas = textoDetalle
    .replace(/\|\s*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .split('\n')
    .map(linea => linea.trim())
    .filter(linea => linea.length > 0);

  const productos: FacturaItem[] = [];
  let buffer = '';

  for (const linea of lineas) {
    if (esLineaBasura(linea)) { buffer = ''; continue; }
    if (buffer && esLineaBasura(buffer)) buffer = '';
    
    buffer += (buffer ? ' ' : '') + linea;

    const regexValores = /\s+(\d+)\s+([\d.,]+)\s+([\d.,]+)$/;
    const matchValores = buffer.match(regexValores);

    if (matchValores) {
      const cantidad = parseInt(matchValores[1], 10);
      const subtotal = parseFloat(matchValores[3].replace(',', '.'));
      const precioOCR = parseFloat(matchValores[2].replace(',', '.'));
      
      const precioUnitario = cantidad > 0
        ? Math.round((subtotal / cantidad) * 100) / 100
        : precioOCR;

      const encabezado = buffer.replace(regexValores, '').trim();
      const espacioIdx = encabezado.indexOf(' ');
      
      const codbarra = espacioIdx !== -1 ? encabezado.substring(0, espacioIdx).trim() : '';
      const descripcion = espacioIdx !== -1 ? encabezado.substring(espacioIdx + 1).trim() : encabezado;

      if (cantidad >= 1 && precioUnitario > 0) {
        if (!productos.some(e => e.descripcion === descripcion && e.cantidad === cantidad))
          productos.push({ codbarra, descripcion, cantidad, precioUnitario });
      }
      buffer = '';
    }
  }
  return productos;
}

function buscarProveedor(texto: string): string {
  const keywordMatch = texto.match(/(?:raz[oó]n\s*social|proveedor|empresa|emisor|nombre\s*(?:comercial)?)\s*[:\-]?\s*(.+?)(?:\n|$)/i);
  if (keywordMatch?.[1]) return keywordMatch[1].trim();
  
  const lineas = texto.split('\n');
  for (const linea of lineas) {
      const trim = linea.trim();
      // Filtro más agresivo: ignorar líneas con fechas, "Factura", "RTN", "Vencimiento", etc.
      if (trim.length > 10 && 
          !/rtn:|factura|fecha:|vencimiento:|detalle:|subtotal:|isv:|total:|p\s*pp|\d{2}\/\d{2}/i.test(trim)) {
          return trim;
      }
  }
  return '';
}

export function parsearFactura(texto: string, confianza: number): FacturaData {
  const datos: FacturaData = {
    nroFactura: buscarNumeroFactura(texto),
    fecha: buscarPatron(texto, [
      /fecha[\s\S]*?(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
      /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/
    ]),
    proveedor: buscarProveedor(texto),
    rtn: buscarPatron(texto, [/(?:ID\s*\/?\s*RIF|rtn|r\.?t\.?n\.?|c\.?i\.?|rif|ced\.?|nit)\s*[:\-]?\s*([\d\-\.]+)/i]),
    items: extraerItems(texto),
    subtotal: parsearNumero(buscarPatron(texto, [/sub\s*total\s*[:\-]?\s*\$?\s*L?\s*([\d,\.]+)/i])),
    impuesto: parsearNumero(buscarPatron(texto, [/(?:isv|iva|impuesto)\s*(?:\(?\d+\.?\d*\s*%?\)?)?\s*[:\-]?\s*\$?\s*L?\s*([\d,\.]+)/i])),
    total: parsearNumero(buscarPatron(texto, [/total\s*a\s*pagar\s*[:\-]?\s*\$?\s*L?\s*([\d,\.]+)/i])),
    confianza,
    textoCrudo: texto,
  };
  return datos;
}
