/**
 * Modelos del POS visual (pos-rapido).
 *
 * El componente demuestra el patrón "escáner fijo arriba, catálogo visual
 * abajo": la zona grande del formulario alterna entre un grid de tarjetas de
 * producto (reposo) y la tabla del carrito (operación), sin que el input del
 * lector de código de barras pierda nunca el foco.
 */

export type EstadoStock = 'ALTA' | 'BAJO' | 'AGOTADO';

/** Opción simple para selects del catálogo (formas de pago, etc.) */
export interface OpcionPos {
  label: string;
  value: number | string;
}

/** Tarjeta del catálogo visual */
export interface TarjetaProducto {
  productoId: number;
  codbarra: string;
  descripcion: string;
  /** Precio de lista vigente (ya con la oferta aplicada si la hay) */
  precio: number;
  /** Precio original cuando hay oferta; null si no hay promo */
  precioOriginal: number | null;
  /** Porcentaje de descuento de la promo vigente */
  ofertaPct: number | null;
  imagenUrl: string | null;
  existencia: number;
  stockMinimo: number;
  estado: EstadoStock;
}

/** Línea del carrito / ticket */
export interface LineaPos {
  fila: number;
  productoId: number;
  codbarra: string;
  descripcion: string;
  imagenUrl: string | null;
  /** Precio unitario de lista (sin ISV añadido) */
  precio: number;
  cantidad: number;
  /** Porcentaje de descuento vigente sobre el bruto (promo y/o global) */
  descuentoPct: number;
  /** Porcentaje de promo del producto base (se conserva para el descuento global) */
  ofertaPct: number;
  /** Monto de ISV de la línea (0 cuando la venta es exenta) */
  impuesto: number;
  /** ISV que se dejó de cobrar — solo se llena cuando sn_excenta = 'S' */
  impuestoExcento: number;
  /** Lo que se cobra por la línea: bruto − descuento + ISV */
  subTotal: number;
  existencia: number;
  estado: EstadoStock;
}

/** Totales del ticket */
export interface TotalesPos {
  bruto: number;
  descuento: number;
  impuesto: number;
  total: number;
  /** Suma de cantidades */
  items: number;
  /** Suma del ISV dejado de cobrar (ventas exentas) */
  importeExcento: number;
}

/** Fila del diálogo de cobro (múltiples pagos por venta) */
export interface FilaCobro {
  formapagoId: number | null;
  tarjetacreditoId: number | null;
  nrotarjeta: string;
  /** Inicia vacío para que el campo no muestre 0.00 */
  importe: number | undefined;
  nroautorizacion: string;
}

/** Aviso flotante interno (sin depender de MessageService) */
export interface AvisoPos {
  texto: string;
  tipo: 'ok' | 'warn' | 'info';
}

/** Parámetros de cálculo de ISV que llegan de /parametros */
export interface ParametrosImpuesto {
  tasa: number;
  precioIncluyeImpuesto: boolean;
}
