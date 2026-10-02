export interface CxcCliente {
  clienteId: number;
  nrocliente: string;
  fecharegistro?: string;
  fechanacimiento?: string;
  nombres: string;
  apellidos: string;
  razonsocial: string;
  dni: string;
  sexo: 'M' | 'F';
  estadocivil: 'S' | 'C' | 'D' | 'V' | 'U';
  rtn?: string;
  limiteCredito: number;
  diasplazo: number;
  interes: number;
  moratorio: number;
  sn_activo: 'S' | 'N';
  categoria: 'A' | 'B' | 'C' | 'D' | 'E';
  empresaId: number;
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: string;
}

export interface CxcMovimiento {
  clienteMovId: number;
  [key: string]: any;
}

export interface CxcHistorico {
  historicoclienteId: number;
  clienteId: number;
  fecharegistro: string;
  nrocliente: string;
  dni: string;
  cliente: string;
  modulo: string;
  abreviatura: string;
  documentoId: number;
  nroreferencia: string;
  tipomov: string;
  importe: number;
  concepto: string;
  sn_doc_anulado: string;
  sn_cotabilizada: string;
  clienteMovId: number;
}

export interface CxcSaldoFavor {
  cxcsalfavId: number;
  [key: string]: any;
}

/** Tipos de información de contacto del cliente (tabla cxccclientesinfo) */
export type TipoInfoCliente = 'CELULAR' | 'DIRECCION' | 'CORREO';

/**
 * Registro de información adicional del cliente (cxccclientesinfo).
 * Regla de negocio: un solo registro por (clienteid, tipo, empresaId).
 */
export interface CxcClienteInfo {
  id: number;
  clienteid: number;
  tipo: TipoInfoCliente;
  descripcion: string | null;
  sn_activo: 'S' | 'N';
  empresaId?: number | null;
  usuarioCreated?: string;
  usuarioUpdated?: string | null;
  fechaUpdated?: string | null;
}

/**
 * Asignación de cartera contable a un cliente (cxccarteracta).
 * La tabla NO tiene sn_activo: las eliminaciones son físicas.
 * Nota: la columna sucursal en BD se llama "Idsucusal" (typo original).
 */
export interface CxcCarteraCliente {
  id: number;
  clienteId: number;
  carteractaId: number;
  Idsucursal?: number;
  empresaId: number;
  usuarioCreated?: string;
  fechaCreated?: string;
  usuarioUpdate?: string;
  fechaUpdate?: string;
}