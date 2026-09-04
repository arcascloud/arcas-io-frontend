export interface Categoria {
  categoriaId: number;
  descripcion: string;
  sn_activo: 'S' | 'N';
  empresaId: number;
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: string;
}

export interface Producto {
  produtoId: number;
  codbarra?: string;
  descripcion: string;
  descripcion_corta?: string;
  cstounit: number;
  cstoprom: number;
  precioventa: number;
  fecUltcom?: string;
  fecUltvta?: string;
  puntoretorno: number;
  categoriaId: number;
  sn_activo: 'S' | 'N';
  empresaId: number;
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: string;
  categoria?: Categoria;
}

export interface Proveedor {
  proveedorId: number;
  fecharegistro?: string;
  nroproveedor: string;
  nombres: string;
  apellidos: string;
  razonsocial?: string;
  dni?: string;
  sexo: 'M' | 'F';
  estadocivil: 'S' | 'C' | 'D' | 'V' | 'U';
  rtn?: string;
  limiteCredito: number;
  diasplazo: number;
  interes: number;
  moratorio: number;
  categoria: 'A' | 'B' | 'C' | 'D' | 'E';
  sn_activo: 'S' | 'N';
  empresaId: number;
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: string;
}

export interface Existencia {
  invexistenciaId: number;
  bodegaId: number;
  productoId: number;
  existencia: number;
  costounitario: number;
  precioventa: number;
  fecUltCompra?: string;
  fecUltVta?: string;
  empresaId: number;
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: string;
}

export interface Kardex {
  invkardexId: number;
  fecharegistro?: string;
  bodegaId: number;
  productoId: number;
  codbarra: string;
  FechaIngreso?: string;
  factordecambio: number;
  cantidad: number;
  existencia: number;
  costoUnitario: number;
  subTotal: number;
  saldoAnterior: number;
  saldoActual: number;
  costoTotal: number;
  costoUSD: number;
  subTotalUSD: number;
  nroreferencia: string;
  tipomov: 'E' | 'S';
  moduloId: number;
  empresaId: number;
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: string;
}

export interface Marca {
  marcaId: number;
  descripcion: string;
  sn_activo: 'S' | 'N';
  empresaId: number;
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: string;
}

export interface Modelo {
  modeloId: number;
  descripcion: string;
  sn_activo: 'S' | 'N';
  empresaId: number;
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: string;
}

export interface Color {
  colorId: number;
  descripcion: string;
  sn_activo: 'S' | 'N';
  empresaId: number;
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: string;
}

export interface UnidadMedida {
  unidadmedidaId: number;
  descripcion: string;
  sn_activo: 'S' | 'N';
  empresaId: number;
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: string;
}

export interface Embalaje {
  embalajeId: number;
  descripcion: string;
  sn_activo: 'S' | 'N';
  empresaId: number;
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: string;
}

export interface Bodega {
  bodegaId: number;
  descripcion: string;
  sn_activo: 'S' | 'N';
  empresaId: number;
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: string;
}

export interface Ubicacion {
  ubicacionId: number;
  descripcion: string;
  sn_activo: 'S' | 'N';
  empresaId: number;
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: string;
}

export interface Pasillo {
  pasilloId: number;
  descripcion: string;
  sn_activo: 'S' | 'N';
  empresaId: number;
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: string;
}

export interface Casa {
  casaId: number;
  descripcion: string;
  sn_activo: 'S' | 'N';
  empresaId: number;
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: string;
}

export interface Testante {
  testanteId: number;
  descripcion: string;
  sn_activo: 'S' | 'N';
  empresaId: number;
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: string;
}

export interface Tag {
  tagsId: number;
  descripcion: string;
  sn_activo: 'S' | 'N';
  empresaId: number;
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: string;
}

export interface TomaInventarioMae {
  invfisId: number;
  fecharegistro: string;
  bodegaId: number;
  concepto: string;
  sn_anulado: 'S' | 'N';
  empresaId: number;
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: string;
}

export interface TomaInventarioDet {
  nvfisdetId: number;
  fecharegistro: string;
  invfisId: number;
  bodegaId: number;
  nrofila: number;
  codbarra: string;
  descripcion: string;
  existencia: number;
  fisico: number;
  ajusteEntrada: number;
  ajusteSalida: number;
  costoUnitario: number;
  costoTotal: number;
  preciovta: number;
  sn_posteado: 'S' | 'N';
  sn_aplicado: 'S' | 'N';
  empresaId: number;
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: string;
}

export interface AjusteInventarioMae {
  invmovmaeid: number;
  fecharegistro: string;
  nroajuste: number;
  bodegaId: number;
  concepto: string;
  sn_entrada: 'S' | 'N';
  sn_anulado: 'S' | 'N';
  empresaId: number;
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: string;
}

export interface AjusteInventarioDet {
  invmovdetid: number;
  fecharegistro: string;
  invmovmaeid: number;
  nrofila: number;
  bodegaId: number;
  productoId: number;
  codbarra: string;
  cantidad: number;
  costoUnitario: number;
  costoTotal: number;
  verificador: number;
  sn_entrada: 'S' | 'N';
  sn_anulado: 'S' | 'N';
  empresaId: number;
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: string;
}

export interface RequisicionMae {
  invreqmaeid: number;
  fecharegistro: string;
  nrorequisicion: number;
  bodegaOrigenId: number;
  bodegaDestinoId: number;
  concepto: string;
  prioridad: 'B' | 'M' | 'A' | 'U';
  fechaEntrega: string | null;
  observaciones: string;
  sn_estado: 'P' | 'A' | 'R' | 'X';
  sn_anulado: 'S' | 'N';
  empresaId: number;
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: string;
}

export interface RequisicionDet {
  invreqdetid: number;
  fecharegistro: string;
  invreqmaeid: number;
  nrofila: number;
  productoId: number;
  codbarra: string;
  descripcion: string;
  cantidadSolicitada: number;
  cantidadEntregada: number;
  sn_estado: 'P' | 'A' | 'R';
  sn_anulado: 'S' | 'N';
  empresaId: number;
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: string;
}

export interface CompraMae {
  compraId: number;
  fecharegistro: string;
  TipoCompra: 'F' | 'O';
  bodegaId: number;
  proveedorId: number;
  documentoId: number;
  monedaId?: number;
  factorcambio?: number;
  nroreferencia?: string;
  subtotal: number;
  descuento: number;
  impuesto: number;
  total: number;
  sn_pagada: 'S' | 'N';
  sn_cotabilizada: 'S' | 'N';
  sn_anulada: 'S' | 'N';
  sn_procesada: 'S' | 'N';
  empresaId: number;
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: string;
  detalles?: CompraDet[];
}

export interface CompraDet {
  cxpcomprasdetId: number;
  fecharegistro: string;
  compraId: number;
  bodegaId: number;
  productoId?: number;
  nrofila: number;
  codbarra?: string;
  descripcion?: string;
  cantidad: number;
  precio: number;
  precioventa: number;
  preciovtaId?: number;
  subtotal: number;
  empresaId: number;
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: string;
}