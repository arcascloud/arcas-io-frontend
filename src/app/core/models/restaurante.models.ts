/** Cantidad de mesas del salón (luego se puede mover a un parámetro de empresa). */
export const NUM_MESAS = 20;

// Tipo-only (se erase en build): mesero.models importa OrdenItem desde aquí,
// evitamos un ciclo en runtime.
import type { EstadoCocina } from './mesero.models';

/** Nombre provisional de una orden que todavía no tiene mesa. */
export const NOMBRE_ORDEN_PENDIENTE = 'Orden de restaurante';

/** Una orden del restaurante = un pedido (pospedmae) con mesa asignada. */
export interface OrdenRestaurante {
  pospedmaeId: number;
  fecharegistro: string;
  /** Hora en que la orden/ronda fue enviada a cocina (reloj operativo). Se usa para el tiempo transcurrido del cliente. */
  enviado_at?: string | Date | null;
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
  /**
   * Mesero que tomó la orden: ttipogestores.gestorId (columna ya existente en
   * pospedmae). La pantalla de escritorio no lo lee; lo usa restaurante-mesero
   * para mostrar quién atiende la mesa.
   */
  gestorId?: number | null;
  /** Caja que cobra la orden (pospedmae.cajaId, ya existente). */
  cajaId?: number | null;
  /**
   * Columna nueva (fase 0 del plan de restaurante): estado del pedido.
   * Sin el DDL llega NULL y el consumidor usa sn_entregado como respaldo.
   */
  estado?: string | null;
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
  /**
   * Estado en cocina (pospeddet.estado_cocina). Llega en
   * GET /facturacion/pedidos-det/pedido/:id — SIN esto el mesero no puede
   * evaluar la leyenda ni habilitar el toggle.
   */
  estado_cocina?: EstadoCocina;
  /** Ronda de cocina a la que pertenece la línea (orden oficial del mesero: ronda_uuid ASC). */
  ronda_uuid?: string | null;
  /** Leyenda oficial del backend (mismo CASE): 'Entregado' | 'Entregar a mesa' | 'En preparación'. */
  leyenda?: string | null;
  /** Descripción resuelta desde productos (JOIN por codbarra), cuando la trae el backend. */
  descripcion?: string | null;
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
