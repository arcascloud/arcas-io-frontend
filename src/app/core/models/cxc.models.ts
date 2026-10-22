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
  nromovimiento?: number;
  fecharegistro?: string | null;
  clienteId: number;
  nrocliente?: string;
  moduloId?: number;
  documentoId?: number;
  /** D=Débito, C=Crédito, I=Interés/mora (generado por caja) */
  tipomov?: 'D' | 'C' | 'I' | string;
  nroreferencia?: string | null;
  importe?: number | string;
  concepto?: string | null;
  /** 'S' = movimiento contabilizado a partidas */
  sn_cotabilizada?: 'S' | 'N';
  /** 'S' = capturado manualmente por usuario; 'N' = automático (factura, caja, préstamo) */
  sn_doc_manual?: 'S' | 'N';
  sn_doc_anulado?: 'S' | 'N';
  /** Partida contable que asentó el movimiento (si la tiene, no se anula aquí) */
  partidaId?: number | null;
  carteracontableId?: number | null;
  empresaId?: number;
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

/**
 * Préstamo a cliente (cxcprestamos).
 * Nota: los nombres de propiedad de la entity mapean a columnas distintas en BD:
 * tasa → tasa_interes_anual, diascuotas → diasplazo,
 * moratorio → tasa_interes_moratorio_anual, gracia → diasgracia.
 */
export interface Prestamo {
  prestamoId: number;
  fecharegistro?: string;
  nroprestamo: string;
  clienteId: number;
  /** Importe solicitado del préstamo. */
  capital: number;
  /** Aporte del cliente que rebaja el monto solicitado. */
  prima?: number | null;
  /** Importe real = capital - prima (solo lectura; amortiza el plan). */
  capitalneto?: number | null;
  tasa: number;
  cuotas?: number | null;
  diascuotas?: number | null;
  moratorio?: number | null;
  gracia?: number | null;
  gestorId?: number | null;
  monedaId?: number | null;
  /** Fecha en que se aprobó el préstamo (default = fecha de registro). */
  fecha_aprobacion?: string | null;
  /** Fecha de la 1er cuota = fecha_aprobacion + 30 días. */
  fechaEfectiva?: string | null;
  /** Al abrir el préstamo = fechaEfectiva; luego, fecha del último cobro. */
  fechaUltPago?: string | null;
  /** Cuota a la que llegó el último pago (MAX(nrofila) de cuotas pagadas). */
  ultcuotapagada?: number | null;
  /** Saldo de capital neto pendiente = Σ capital de cuotas no pagadas. */
  saldoactual?: number | null;
  /** Valor de la cuota pactada (persiste en BD — columna vlrcuota de cxcprestamos). */
  vlrcuota?: number | null;
  /** Pre-aprobado (S/N). */
  sn_preaprobado?: 'S' | 'N';
  /** Aprobado (S/N). */
  sn_aprobado?: 'S' | 'N';
  sn_activo: 'S' | 'N';
  sn_contabilizado?: 'S' | 'N';
  /** ID de la partida contable generada al contabilizar (copdamae). */
  partidaId?: number | null;
  sn_anulado?: 'S' | 'N';
  Idsucursal?: number;
  empresaId: number;
  usuarioCreated?: string;
  usuarioUpdated?: string | null;
  fechaUpdated?: string | null;
}

/** Cuota del plan de pagos de un préstamo (cxcprestamospp). */
export interface PrestamoCuota {
  pppId: number;
  prestamoId: number;
  FechaPago: string;
  clienteId: number;
  nrofila: number;
  vlrcuota: number;
  capital: number;
  interes: number;
  mora: number;
  saldo: number;
  /** Días de mora al momento del cálculo/cobro (columna BD: diasmora). */
  diasvencido?: number | null;
  sn_pagada: 'S' | 'N';
  sn_anulada: 'S' | 'N';
  /** Caja (cxccajamae) que pagó esta cuota — permite reversa al anular. */
  cxccajaId?: number | null;
  empresaId: number;
  usuarioCreated?: string;
  usuarioUpdated?: string | null;
  fechaUpdated?: string | null;
}