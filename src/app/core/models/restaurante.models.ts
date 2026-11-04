/** Cantidad de mesas del salón (luego se puede mover a un parámetro de empresa). */
export const NUM_MESAS = 15;

/** Nombre provisional de una orden que todavía no tiene mesa. */
export const NOMBRE_ORDEN_PENDIENTE = 'Orden de restaurante';

/** Una orden del restaurante = un pedido (pospedmae) con mesa asignada. */
export interface OrdenRestaurante {
  pospedmaeId: number;
  fecharegistro: string;
  nombrecliente: string;
  /** null = orden creada pero todavía sin mesa */
  nromesa: number | null;
  /** 'S' cuando el pedido ya fue llevado a la mesa */
  sn_entregado: 'S' | 'N';
  /** 'S' cuando ya se convirtió en factura (la mesa queda libre) */
  sn_facturado: 'S' | 'N';
  subTotal: number;
  impuesto: number;
  total: number;
}

/** Línea de la orden (pospeddet). */
export interface OrdenItem {
  pospeddetId: number;
  pospedmaeId: number;
  productoId: number;
  codbarra: string;
  cantidad: number;
  precioventa: number;
  impuesto: number;
  /** Bruto de la línea: cantidad × precio (igual que pedido-form) */
  subtotal: number;
  nrofila: number;
  /** 'S' = entregado a la mesa; 'N' = pendiente (en cocina) */
  sn_entregado: 'S' | 'N';
}

export interface MesaVista {
  nro: number;
  orden: OrdenRestaurante | null;
}

export interface ConfigISV {
  /** 0.15 = 15% */
  tasa: number;
  /** true = el precio de venta ya incluye ISV */
  incluido: boolean;
  /**
   * ttipoparametros (módulo 3).field = sn_imprimefactura: si es 'S' se
   * imprime el ticket al cobrar; si no, no se imprime nada en pantalla.
   */
  snImprimeFactura: boolean;
}

/** Fila de la tabla de pagos — misma estructura que PagoPedido/PagoFactura */
export interface PagoOrden {
  formapagoId: number | null;
  tarjetacreditoId: number | null;
  nrotarjeta: string;
  nroautorizacion: string;
  importe: number;
  /** true si la forma de pago es efectivo (importe_efectivo vs importe_otros) */
  esEfectivo: boolean;
}

export interface FacturaResultado {
  facturaId: number;
  nrofactura: number;
  total: number;
  /** true = pago por link TodoPago: la factura nace pendiente de confirmación */
  conLink?: boolean;
}
