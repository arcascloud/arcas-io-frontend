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
    zorden: number;
    /** true = la cuenta ya registra historial (movimiento/cierre) → edición restringida */
    sn_protegida?: boolean;
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
  partidaId: number;
  fecharegistro: Date;
  periodo: number;
  anio: number;
  moduloId: number;
  documentoId: number;
  fechadocumento: Date;
  factordecambio: number;
  nroreferencia: string;
  descripcion: string;
  /** 'S' = partida anulada, 'N' = vigente */
  sn_anulada: 'S' | 'N';
  /** 'S' = la partida está posteada en coctamov/coctasaldos (estado actual) */
  sn_contabilizada: 'S' | 'N';
  /** 'S' = su período contable está cerrado → inmutable (bloqueado en backend con 403) */
  sn_cerrada: 'S' | 'N';
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
  partidaId: number;
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
  /** 'S' = línea anulada, 'N' = vigente */
  sn_anulada: 'S' | 'N';
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

/** Línea del Libro Mayor con mayorización escalonada */
export interface LibroMayorItem {
  ctacontable: string;
  descripcion: string;
  /** Naturaleza de la cuenta: D = deudora, C = acreedora. El saldo SIEMPRE es positivo. */
  naturaleza: 'D' | 'C';
  nivel: number;
  padre: string | null;
  sn_operable: string;
  debe: number;
  haber: number;
  saldo: number;
  saldoAcum: number;
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

export interface CierreDet {
  cocierredetId: number;
  cocierremaeId: number;
  anio: number;
  periodo: number;
  ctacontable: string;
  saldo?: number;
  /** D (deudor) / C (acreedor) */
  tiposaldo?: string;
  Idsucursal: number;
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

// ========== Carteras Contables ==========

export interface Cartera {
  tcocarteraId: number;
  moduloId?: number;
  descripcion?: string;
  ctacontable?: string;
  sn_activo: 'S' | 'N';
  empresaId?: number;
  usuarioCreated?: string;
}

// ========== Interfaces para Reportes Generados ==========

export interface PartidaDiario {
  nropartida: number;
  fecha: Date;
  descripcion: string;
  referencia: string;
  lineas: LineaPartida[];
  totalDebito: number;
  totalCredito: number;
}

export interface LineaPartida {
  ctacontable: string;
  descripcion: string;
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
  empresaId?: number;
  periodo: number;
  anio: number;
  observacion?: string;
}

export interface ReporteRequest {
  empresaId: number;
  periodo?: number;
  anio?: number;
  ctacontable?: string;
  fechaDesde?: Date;
  fechaHasta?: Date;
}

// ========== Reporte de Balances Dinámico ==========

export interface BalanceDinamicoRequest {
  empresaId: number;
  plantillaId: number;
  nivelDetalle?: number;
  periodo?: number;
  anio?: number;
}

export interface BalanceDinamicoLinea {
  empresaName: string;
  balancename: string;
  ctacontable: string;
  descripcion: string;
  columna: number;
  renglon: number;
  tipo: string;
  nivel: number | null;
  /** Saldo acumulado ANTES del período (solo balances) */
  acum: number;
  /** Débitos del período (mayorizado) */
  debe: number;
  /** Créditos del período (mayorizado) */
  haber: number;
  /** Saldo Acumulado + (Débitos - Créditos) del período → va en columna `columna` */
  valor: number;
  /** Columna 0: saldo acumulado antes del período (null si es estado de resultado) */
  col0: number | null;
}

export interface BalanceDinamicoReporte {
  empresaName: string;
  balancename: string;
  plantillaId: number;
  nivelDetalle: number | null;
  periodo: number | null;
  anio: number | null;
  /** true = balance (cuentas 1/2/3), false = estado de resultado (4/5/6/7) */
  esBalance: boolean;
  /** true = mostrar Columna 0 (solo balances) */
  mostrarCol0: boolean;
  /** Columnas 1..7 efectivamente usadas por la plantilla */
  columnasUsadas: number[];
  lineas: BalanceDinamicoLinea[];
  /** Totales por columna: key "0" (si aplica), "1".."7" */
  totales: Record<string, number>;
}
