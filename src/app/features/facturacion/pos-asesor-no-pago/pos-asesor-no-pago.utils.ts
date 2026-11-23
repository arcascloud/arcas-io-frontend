import type {
  EstadoStock,
  LineaPos,
  ParametrosImpuesto,
  TarjetaProducto,
  TotalesPos,
} from './pos-asesor-no.models';

/** Tasa de ISV por defecto cuando /parametros no responde */
export const TASA_ISV_DEFECTO = 0.15;

/** Tarjetas visibles por página del catálogo (evita renderizar miles de nodos) */
export const TARJETAS_POR_PAGINA = 48;

/** Dígitos mínimos para considerar que el lector disparó un código completo */
export const MIN_DIGITOS_ESCANEO = 13;

/** Redondeo monetario a 2 decimales */
export function redondear(valor: number): number {
  return Math.round(valor * 100) / 100;
}

/** Formato de moneda HNL */
export function moneda(valor: number | undefined | null): string {
  return (Number(valor) || 0).toLocaleString('es-HN', {
    style: 'currency',
    currency: 'HNL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Clasifica el estado de stock de un producto */
export function estadoStock(existencia: number, stockMinimo = 0): EstadoStock {
  if (!(existencia > 0)) return 'AGOTADO';
  return existencia <= stockMinimo ? 'BAJO' : 'ALTA';
}

/**
 * Calcula ISV, ISV exento y subtotal de una línea.
 *
 * `precioIncluyeImpuesto` refleja el parámetro sn_impuestoincluido: cuando el
 * precio de venta ya trae el ISV, este solo se desglosa (no se suma de nuevo)
 * para que el total no quede inflado.
 *
 * `exenta` (sn_excenta = 'S') anula el ISV cobrado y lo registra en
 * `impuestoExcento` (el importe de la constancia).
 */
export function calcularLinea(
  cantidad: number,
  precio: number,
  descuentoPct: number,
  params: ParametrosImpuesto,
  exenta = false,
): { impuesto: number; impuestoExcento: number; subTotal: number } {
  const bruto = redondear(cantidad * precio);
  const base = redondear(bruto * (1 - descuentoPct / 100));

  if (params.precioIncluyeImpuesto) {
    const desglose = redondear((base * params.tasa) / (1 + params.tasa));
    return {
      impuesto: exenta ? 0 : desglose,
      impuestoExcento: exenta ? desglose : 0,
      subTotal: base,
    };
  }

  const isv = redondear(base * params.tasa);
  return {
    impuesto: exenta ? 0 : isv,
    impuestoExcento: exenta ? isv : 0,
    subTotal: redondear(base + (exenta ? 0 : isv)),
  };
}

/**
 * Totales del ticket a partir de las líneas ya calculadas.
 *
 * Cuando `precioIncluyeImpuesto` es true, el precio de venta YA trae el ISV:
 * el `bruto` mostrado debe ser la base neta (sin impuesto) para que la
 * identidad `Subtotal - Descuento + Impuesto = Gran Total` sea válida.
 * Ejemplo: 21.00 / 1.15 = 18.26 + 2.74 = 21.00.
 */
export function calcularTotales(filas: LineaPos[], params?: ParametrosImpuesto): TotalesPos {
  const incluido = params?.precioIncluyeImpuesto === true;
  const factor = incluido && params && params.tasa > 0 ? 1 + params.tasa : 1;

  let bruto = 0;
  let descuento = 0;
  let impuesto = 0;
  let importeExcento = 0;
  let total = 0;
  let items = 0;

  for (const fila of filas) {
    const brutoFila = redondear(fila.cantidad * fila.precio);
    const descuentoFila = redondear(brutoFila * (fila.descuentoPct / 100));
    if (!incluido) bruto += brutoFila;
    descuento += incluido ? redondear(descuentoFila / factor) : descuentoFila;
    impuesto += fila.impuesto;
    importeExcento += fila.impuestoExcento ?? 0;
    total += fila.subTotal;
    items += fila.cantidad;
  }

  const totalR = redondear(total);
  const impuestoR = redondear(impuesto);
  const descuentoR = redondear(descuento);

  return {
    // Forzar la identidad evita diferencias de 0.01 por redondeo por línea.
    bruto: incluido ? redondear(totalR - impuestoR + descuentoR) : redondear(bruto),
    descuento: descuentoR,
    impuesto: impuestoR,
    total: totalR,
    items,
    importeExcento: redondear(importeExcento),
  };
}

/** ¿El texto tecleado tiene pinta de ser un código escaneado completo? */
export function esEscaneo(texto: string): boolean {
  const limpio = texto.replace(/\s/g, '');
  return limpio.length >= MIN_DIGITOS_ESCANEO && /^\d+$/.test(limpio);
}

/** Filtra el catálogo por código de barras o descripción */
export function filtrarCatalogo(productos: TarjetaProducto[], consulta: string): TarjetaProducto[] {
  const q = consulta.trim().toLowerCase();
  if (!q) return productos;
  return productos.filter(
    (p) =>
      p.codbarra.toLowerCase().includes(q) ||
      p.descripcion.toLowerCase().includes(q) ||
      String(p.productoId) === q,
  );
}

/** Normaliza valores numéricos que pueden llegar como texto o null */
export function aNumero(valor: unknown, porDefecto = 0): number {
  const n = Number(valor);
  return Number.isFinite(n) ? n : porDefecto;
}
