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
}

export interface PagoOrden {
  formapagoId: number;
  efectivo_recibido?: number;
}

export interface FacturaResultado {
  facturaId: number;
  nrofactura: number;
  total: number;
}
