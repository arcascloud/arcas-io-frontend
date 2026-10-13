export interface ProductoTienda {
  produtoId: number;
  descripcion: string;
  descripcion_corta?: string;
  codbarra?: string;
  precioventa: number;
  imagen: string | null;
  existencia: number;
  categoria?: string;
  categoriaId: number;
}

export interface Pedido {
  pospedmaeId: number;
  nombrecliente: string;
  nrotelefono: string;
  clienteId?: number | null;
  nrocliente?: string | null;
  direccion_entrega?: string | null;
  rtn_cliente?: string | null;
  tipofactura?: 'E' | 'C';
  diascredito?: number;
  /** Cabecera = Σ detalle (recalculada por el backend en cada cambio) */
  subTotal?: number | string | null;
  impuesto?: number | string | null;
  descuento?: number | string | null;
  total?: number | string | null;
  sn_enviogratis: string;
  sn_facturado: string;
  sn_pagada?: string;
  facturaId: number | null;
  nrofactura?: number | null;
  bodegaId?: number;
  cajaId?: number;
  Idsucursal?: number;
  empresaId: number;
  fecharegistro: string;
}

export interface PedidoItem {
  pospeddetId: number;
  pospedmaeId: number;
  nrofila?: number | null;
  productoId: number;
  codbarra: string;
  cantidad: number;
  precioventa: number;
  subtotal: number;
  descuento: number;
  /** Porcentaje de descuento de la línea (el monto va en descuento) */
  p_descuento?: number;
  impuesto: number;
  facturaId?: number | null;
  bodegaId?: number | null;
  empresaId: number;
  descripcion?: string;
  imagen?: string | null;
}

export interface CheckoutPedido {
  pospedmaeId: number;
  nombrecliente: string;
  nrotelefono?: string;
  formapagoId: number;
  efectivo_recibido?: number;
  tarjetacreditoId?: number;
  nrotarjeta?: string;
  nroautorizacion?: string;
  tipopago?: string;
}

export interface CheckoutPedidoResponse {
  facturaId: number;
  nrofactura: number;
  total: number;
}
