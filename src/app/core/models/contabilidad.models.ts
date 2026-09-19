/**
 * Interfaces TypeScript para el módulo de Contabilidad
 * ERP Retail - Honduras
 */

// ========== Plan de Cuentas ==========

export interface CtaContable {
  cuentacontablesId: number;
  ctacontable: string;
  descripcion: string;
  naturaleza: 'D' | 'C';
  nivel: number;
  padre?: string;
  sn_operable: 'S' | 'N';
  tcogrupocontableId: number;
  sn_activo: 'S' | 'N';
  empresaId: number;
  Idsucursal?: number;
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: Date;
}

export interface GrupoContable {
  tcogrupocontableId: number;
  descripcion: string;
  sn_activo: 'S' | 'N';
  empresaId: number;
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: Date;
}

export interface NivelCta {
  nivelcontableId: number;
  nivel: string;
  sn_diario: 'S' | 'N';
  sn_activo: 'S' | 'N';
  empresaId: number;
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: Date;
}

export interface NaturalezaCta {
  naturalezaCtaId: number;
  descripcion: 'D' | 'C';
  empresaId: number;
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: Date;
}

// ========== Partidas de Diario (Comprobantes) ==========

export interface CopdaMae {
  copdamaeId: number;
  fecharegistro: Date;
  periodo: number;
  anio: number;
  moduloId: number;
  documentoId: number;
  fechadocumento: Date;
  factordecambio: number;
  nroreferencia: string;
  descripcion: string;
  sn_activo: 'S' | 'N';
  nropartida: number;
  Idsucursal: number;
  empresaId: number;
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: Date;
  // Transient (calculated)
  totalDebito?: number;
  totalCredito?: number;
  cuadrada?: boolean;
  detalles?: CopdaDet[];
}

export interface CopdaDet {
  copdadetId: number;
  copdamaeId: number;
  fecharegistro: Date;
  periodo?: number;
  anio?: number;
  nropartida?: number;
  moduloId: number;
  nrofila?: number;
  ctacontable?: string;
  descripcion?: string;
  debito: number;
  credito: number;
  factordecambio: number;
  sn_activo: 'S' | 'N';
  Idsucursal: number;
  empresaId: number;
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: Date;
}

// ========== Movimientos Contables ==========

export interface MovCta {
  movctascontablesId: number;
  monedaId: number;
  ctacontable: string;
  anio: number;
  periodo: number;
  sacum: number;
  debe: number;
  haber: number;
  saldo: number;
  fecultmov?: Date;
  ultnropda?: number;
  empresaId: number;
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: Date;
}

// ========== Saldos de Cuentas ==========

export interface SaldoCta {
  cosaldosctaId: number;
  anio?: number;
  ctacontable: string;
  saldoanterior: number;
  enero: number;
  febrero: number;
  marzo: number;
  abril: number;
  mayo: number;
  junio: number;
  julio: number;
  agosto: number;
  septiembre: number;
  octubre: number;
  noviembre: number;
  diciembre: number;
  empresaId: number;
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: Date;
}

// ========== Períodos Contables ==========

export interface PeriodoContable {
  periodoscontableId: number;
  nroanio: number;
  nromes: number;
  sn_abierto: 'S' | 'N';
  empresaId: number;
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: Date;
}

// ========== Cierre Contable ==========

export interface CierreContable {
  cierrectableId: number;
  periodo?: number;
  anio?: number;
  fechacierre: Date;
  observacion?: string;
  sn_activo: 'S' | 'N';
  empresaId: number;
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: Date;
}

// ========== Plantillas ==========

export interface PlantillaPdaMae {
  tcoplantillapdamaeId: number;
  descripcion: string;
  moduloId: number;
  sn_activo: 'S' | 'N';
  empresaId: number;
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: Date;
}

export interface PlantillaPdaDet {
  tcoplantillapdadetId: number;
  tcoplantillapdamaeId: number;
  nrofila: number;
  ctacontable: string;
  descripcion?: string;
  moduloId?: number;
  ctamayorId?: string;
  naturaleza: 'D' | 'C';
  sn_activo: 'S' | 'N';
  empresaId?: number;
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: Date;
}

export interface PlantillaBalancesMae {
  cocdefbalmaId: number;
  descripcion: string;
  sn_activo: 'S' | 'N';
  empresaId: number;
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: Date;
}

export interface PlantillaBalancesDet {
  tcoplantillabalancesdetid: number;
  cocdefbalmaId: number;
  tipo?: string;
  ctacontable?: string;
  descripcion?: string;
  columna?: number;
  renglon?: number;
  sn_activo: 'S' | 'N';
  empresaId?: number;
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: Date;
}

// ========== Tipos de Documento Fiscal ==========

export interface TipoDocFiscal {
  tipodocumentofiscalId: number;
  descripcion: string;
  abreviatura: string;
  naturaleza: 'D' | 'C';
  moduloId: number;
  cuentacontableId: number;
  nrocorrelativo: number;
  sn_activo: 'S' | 'N';
  empresaId: number;
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: Date;
}

// ========== Factores de Cambio ==========

export interface FactorCambio {
  factordecambioId: number;
  fecharegistro: Date;
  preciocompra: number;
  precioventa: number;
  tipomoneda: 'D' | 'E' | 'Y';
  empresaId: number;
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: Date;
}

// ========== Reportes ==========

export interface ReporteLiquidez {
  tcorepliquidezId: number;
  descripcion?: string;
  objetivo?: string;
  sn_activo: 'S' | 'N';
  empresaId?: number;
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: Date;
}

export interface ReporteDiario {
  tcorepdiariosId: number;
  descripcion: string;
  reporte: string;
  sn_activo: 'S' | 'N';
  empresaId?: number;
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: Date;
}

export interface ReporteBalance {
  balcomId: number;
  ctacontable?: string;
  periodoA: number;
  anioA: number;
  saldoA: number;
  periodoB: number;
  anioB: number;
  saldoB: number;
  empresaId?: number;
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: Date;
}

// ========== Impuesto Vecinal ==========

export interface ImpuestoVecinal {
  impvecinalId: number;
  descripcion?: string;
  del: number;
  al: number;
  importe: number;
  sn_activo: 'S' | 'N';
  empresaId: number;
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: Date;
}

// ========== Interfaces para Reportes Generados ==========

export interface PartidaDiario {
  nropartida: number;
  fecha: Date;
  descripcion: string;
  referencia: string;
  lineas: LineaPartida[];
}

export interface LineaPartida {
  ctacontable: string;
  descripcionCta: string;
  debito: number;
  credito: number;
}

export interface BalanceComprobacion {
  ctacontable: string;
  descripcion: string;
  saldoAnterior: number;
  debeMes: number;
  haberMes: number;
  saldoDeudor: number;
  saldoAcreedor: number;
}

export interface EstadoResultado {
  renglon: number;
  descripcion: string;
  montoActual: number;
  montoAnterior?: number;
}

// ========== Request/Response DTOs ==========

export interface ContabilizarPartidaDto {
  empresaId: number;
  Idsucursal: number;
  periodo: number;
  anio: number;
  moduloId: number;
  documentoId: number;
  fechadocumento?: Date;
  nroreferencia: string;
  descripcion: string;
  factordecambio?: number;
  lineas: LineaPartidaDto[];
}

export interface LineaPartidaDto {
  ctacontable: string;
  descripcion?: string;
  debito: number;
  credito: number;
}

export interface CierreContableRequest {
  empresaId: number;
  periodo: number;
  anio: number;
  observacion?: string;
}

export interface ReporteRequest {
  empresaId: number;
  periodo: number;
  anio: number;
  fechaDesde?: Date;
  fechaHasta?: Date;
}
