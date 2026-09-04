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
  [key: string]: any;
}

export interface CxcSaldoFavor {
  cxcsalfavId: number;
  [key: string]: any;
}