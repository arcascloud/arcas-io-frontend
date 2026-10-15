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
  /** Si != null: la partida ES una contra (espejo) de la partida con este id (N/S, vigente) */
  partidaOrigenId?: number | null;
  /** Si != null: la partida ya fue contraedida; apunta a su contra partida (original queda S/S) */
  contrapdaId?: number | null;
  /** Fecha en que se creó la contra partida asociada */
  feccontrapda?: string | null;
  nropartida: number;
  Idsucursal: number;
  empresaId: number;
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: Date;
  // Transient (calculated)
  /**
   * `tcoplantillapdamaeId` que da el CONCEPTO de la partida, calculado en backend
   * por módulo (sin columna nueva en copdamae). null = sin plantilla aplicable.
   * NUNCA confiar en `documentoId` para resolver la plantilla.
   */
  plantillaId?: number | null;
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
  /**
   * Naturaleza CONTABLE de la cuenta según el catálogo (coctacontables.naturaleza).
   * D = cuenta deudora por naturaleza (Activo, Gasto), C = acreedora (Pasivo, Patrimonio, Ingreso).
   * Es un atributo ESTÁTICO: NO describe el saldo. Solo informativo/para filtrados.
   */
  naturaleza: 'D' | 'C';
  /**
   * Dirección REAL del saldo del período, calculada por operación contable:
   * D si saldo >= 0, C si saldo < 0. Es lo que se muestra en pantalla como D/C.
   */
  tiposaldo: 'D' | 'C';
  /** Dirección real del saldo acumulado del período anterior: D si >= 0, C si < 0. */
  tiposaldoAcum: 'D' | 'C';
  nivel: number;
  padre: string | null;
  sn_operable: string;
  debe: number;
  haber: number;
  /** Monto SIEMPRE en positivo; la dirección la indica `tiposaldo`. */
  saldo: number;
  /** Monto SIEMPRE en positivo; la dirección la indica `tiposaldoAcum`. */
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

/**
 * Carga de la partida inicial de operaciones.
 * El período NO viaja: lo define el backend con el período contable abierto.
 */
export interface CrearPartidaInicialRequest {
  Idsucursal?: number;
  /** Auxiliar / módulo de origen (default 7 = CONTABILIDAD) */
  moduloId?: number;
  descripcion?: string;
  nroreferencia?: string;
  lineas: LineaPartidaDto[];
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

// ========== Reporte de Balance Financiero ==========

export interface BalanceFinancieroRequest {
  empresaId: number;
  anio?: number;
  periodo?: number;
}

export interface BalanceFinancieroFila {
  ctacontable: string;
  descripcion: string;
  nivel: number;
  /** No se muestra en la tabla (columna eliminada por decisión de diseño) */
  padre: string;
  /** 'S' operativa/detalle · 'N' mayor. Define qué columna (Parcial/Total) se llena */
  sn_operable: string;
  /** 'D' deudora · 'C' acreedora. NO se muestra en la tabla; gobierna los signos */
  naturaleza: string;
  /** Lado del acumulado anterior (cierre previo o signo/naturaleza) — columna eliminada */
  tiposaldo: string;
  /**
   * Saldo acumulado de los períodos anteriores. **Positivo** cuando el lado
   * anterior es acreedor (`tiposaldo = 'C'`), para que sume con su Parcial.
   */
  sacum: number;
  /** Débitos del período (mayorizado) */
  debe: number;
  /** Créditos del período (mayorizado) */
  haber: number;
  /**
   * PARCIAL — solo `sn_operable = 'S'` con saldo del período distinto de 0:
   * `debe - haber`, **invertido** (`haber - debe`) en naturaleza C, de modo
   * que `sacum + parcial` reproduzca el saldo del período.
   */
  parcial: number;
  /**
   * TOTAL — solo `sn_operable = 'N'`: `saldoAnterior + (debe - haber)`
   * (el movimiento SIEMPRE se suma firmado) y `ABS(...)` en naturaleza C
   * para expresarlo en el lado propio de la cuenta.
   */
  total: number;
  /** Saldo del período en `coctamov` (solo cuentas con movimiento en el mes) */
  saldo: number;
}

export interface BalanceFinancieroTotal {
  saldo: number;
  tiposaldo: string;
}

export interface BalanceFinancieroReporte {
  empresaName: string;
  anio: number;
  periodo: number;
  filas: BalanceFinancieroFila[];
  totales: {
    activos: BalanceFinancieroTotal;
    pasivos: BalanceFinancieroTotal;
    capital: BalanceFinancieroTotal;
  };
}

// ===================== Estado de Resultado =====================

/**
 * Línea del Estado de Resultado (formato estándar multi-paso con subtotales):
 *  - `seccion`  → cabecera de grupo (ej: "INGRESOS OPERACIONALES")
 *  - `cuenta`   → cuenta individual con su valor firmado por naturaleza ER
 *  - `total`    → subtotal de la sección
 *  - `resultado`→ subtotal intermedio/final (Utilidad bruta, operativa, del período)
 */
export interface EstadoResultadoLinea {
  tipo: 'seccion' | 'cuenta' | 'total' | 'resultado';
  titulo?: string;
  ctacontable?: string;
  descripcion?: string;
  valor?: number;
}

/** Request del reporte: UNA variante por vez (decisión 05/10/2026). */
export interface EstadoResultadoRequest {
  empresaId: number;
  anio: number;
  periodo: number;
  /** P = Período (mes), A = Acumulado enero–mes, N = Año anterior (mismo mes) */
  tipo: 'P' | 'A' | 'N';
}

/** Respuesta del reporte de Estado de Resultado. */
export interface EstadoResultadoReporte {
  tipo: 'P' | 'A' | 'N';
  anio: number;
  periodo: number;
  /** Etiqueta legible del alcance (ej: "Acumulado: enero – octubre 2026"). */
  etiqueta: string;
  lineas: EstadoResultadoLinea[];
  subtotales: {
    ingresos: number;
    costoVentas: number;
    costoProduccion: number;
    utilidadBruta: number;
    gastos: number;
    utilidadOperativa: number;
    imputados: number;
    cuentasOrden: number;
    resultadoEjercicio: number;
    utilidad: number;
  };
}

// ===================== Dashboard Módulo 7 =====================

/** Widget 1 — Composición patrimonial (pastel), saldos firmados del mes. */
export interface DashboardResumen {
  activos: number;
  pasivos: number;
  capital: number;
}

/**
 * Widget 1b — Resultados del período (segmentos 4 Ingresos + 5/6/7 Gastos y
 * Costos tras la reestructuración 05/10/2026), APARTE del pastel patrimonial
 * (decisión 05/10/2026). `utilidad > 0` = ganancia, `< 0` = pérdida.
 */
export interface DashboardResultados {
  ingresos: number;
  gastos: number;
  utilidad: number;
}

/** Widget 2 — Cuentas nivel 2 de Activos y Pasivos (barras). */
export interface DashboardNivel2 {
  ctacontable: string;
  descripcion: string;
  grupo: 'Activos' | 'Pasivos';
  valor: number;
}

/** Widgets 3/4 — Comparativo Ingresos/Gastos: mes actual vs mes anterior. */
export interface DashboardComparativo {
  ctacontable: string;
  descripcion: string;
  actual: number;
  anterior: number;
}

/** Widget 5 — CxC: facturado (D) vs recuperado (suma del haber, C). */
export interface DashboardCxc {
  facturado: number;
  recuperado: number;
  saldo: number;
  docsPendientes: number;
  docsPendientesSaldo: number;
  clientesConSaldo: number;
}

/** Widget 6 — CxP: debitado (D) vs pagado (suma del haber, C) + compras sin pagar. */
export interface DashboardCxp {
  debitado: number;
  pagado: number;
  saldo: number;
  docsPendientes: number;
  docsPendientesSaldo: number;
  comprasPendientes: number;
  comprasPendientesTotal: number;
}

export interface DashboardData {
  anio: number;
  periodo: number;
  periodoMax: number;
  periodoAnterior: number;
  etiquetaPeriodo: string;
  etiquetaAnterior: string;
  resumen: DashboardResumen;
  resultados: DashboardResultados;
  nivel2: DashboardNivel2[];
  ingresos: DashboardComparativo[];
  gastos: DashboardComparativo[];
  cxc: DashboardCxc;
  cxp: DashboardCxp;
}
