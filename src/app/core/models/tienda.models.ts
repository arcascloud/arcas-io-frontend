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

export interface Carrito {
  poscotmaeId: number;
  Nombrecliente: string;
  direccion: string;
  atendio: string;
  gestorId: number;
  empresaId: number;
  sn_estadocarrito: string;
  fecharegistro: string;
}

export interface CarritoItem {
  poscotdetId: number;
  poscotmaeId: number;
  productoId: string;
  codbarra: string;
  cantidad: number;
  precio: number;
  subTotal: number;
  empresaId: number;
  descripcion?: string;
  imagen?: string | null;
}

export interface CheckoutPago {
  poscotmaeId: number;
  nombrecliente: string;
  direccion?: string;
  formapagoId: number;
  efectivo_recibido?: number;
  tarjetacreditoId?: number;
  nrotarjeta?: string;
  nroautorizacion?: string;
}

export interface CheckoutResponse {
  facturaId: number;
  nrofactura: number;
  total: number;
}
