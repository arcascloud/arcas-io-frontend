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
  sn_enviogratis: string;
  sn_facturado: string;
  facturaId: number | null;
  empresaId: number;
  fecharegistro: string;
}

export interface PedidoItem {
  pospeddetId: number;
  pospedmaeId: number;
  nrofila: number;
  productoId: number;
  codbarra: string;
  cantidad: number;
  precioventa: number;
  subtotal: number;
  descuento: number;
  impuesto: number;
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
