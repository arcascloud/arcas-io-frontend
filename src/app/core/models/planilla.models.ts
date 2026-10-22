export interface PlanillaEmpleado {
  empleadoId: number;
  fecharegistro: string;
  nombres: string;
  apellidos: string;
  nrodocumento: string;
  fechanacimiento: string;
  sexo: 'M' | 'F' | 'T';
  estadocivil: 'S' | 'C' | 'V' | 'D' | 'U';
  paisorigen?: number;
  paisresidencia?: number;
  nroseguro?: string;
  telefono: string;
  celular: string;
  email: string;
  profesionId?: number;
  puestoId?: number;
  deptoId?: number;
  sueldobruto: number;
  techoseguro: number;
  cuentabancaria?: string;
  lugardenacimiento?: string;
  sn_activo: 'S' | 'N';
  /** D = Diurna (8 h), M = Mixta (7 h), N = Nocturna (6 h). */
  sn_jornada?: 'D' | 'M' | 'N';
  tipoempId: number;
  Idsucursal: number;
  empresaId: number;
  fecha_alta?: string;
  fecha_baja?: string;
  foto?: string;
}

/** Catálogo de departamentos de la empresa (`ttipodeptoempresa`). */
export interface DeptoEmpresa {
  deptoId: number;
  descripcion: string;
  abreviatura?: string;
  /** Empleado jefe responsable del departamento. */
  empleadoId?: number | null;
  empresaId?: number;
  sn_activo?: string;
}

/** Departamento de planilla (`tpldeptos`): catálogo usado por el detalle de planilla. */
export interface PlDepto {
  tpldeptosId: number;
  descripcion: string;
  /** S = activo, N = inactivo. */
  sn_activo: 'S' | 'N';
  empleadoId?: number | null;
  empresaId?: number;
}

/** Mes del año (`tmeses`): catálogo global 1..12 para etiquetar períodos. */
export interface TMes {
  tmesId: number;
  descripcion: string;
}

/** Cabecera de autorización de pago de horas extras (`pleauthoraexmae`). */
export interface AutorizacionHorasExtras {
  pleauthoraexmaeid: number;
  fecha_registro?: string;
  anio_ejercicio: number;
  periodo: number;
  deptoId: number;
  solicitado_por: number;
  autorizado_por: number;
  fecha_desde?: string | null;
  fecha_hasta?: string | null;
  razon_justificacion?: string | null;
  empresaId?: number;
  detalles?: LineaAutorizacion[];
}

/** Línea del detalle: empleado autorizado (`pleauthoraexdet`). */
export interface LineaAutorizacion {
  pleauthoraexdetId?: number;
  pleauthoraexmaeid?: number;
  fecharegistro?: string;
  empleadoId: number;
  departamentoId?: number | null;
  /** S = paga las horas extras, N = excluido. */
  sn_pagar: 'S' | 'N';
  empresaId?: number;
}

/**
 * Tramo de horas extras (`tplhorasextras`): franja de horario de reloj y
 * porcentaje de recargo (25 = +25%).
 */
export interface TramoHorasExtras {
  horaextraId: number;
  descripcion: string;
  desde?: string | null;
  hasta?: string | null;
  tasa: number;
}

/** Minutos de un día de asistencia clasificados en un tramo. */
export interface HorasExtrasMinutosTramo {
  horaextraId: number;
  minutos: number;
}

/** Desglose de horas extras de un empleado dentro de un tramo. */
export interface HorasExtrasTramoDetalle extends TramoHorasExtras {
  minutos: number;
  horas: number;
  /** Importe cobrado = valor de la hora × horas × (1 + tasa/100). */
  importe: number;
  /** Recargo = valor de la hora × horas × (tasa/100). */
  recargo: number;
}

/** Asistencia evaluada dentro del rango de la autorización. */
export interface HorasExtrasAsistencia {
  asistenciaId: number;
  fecha: string;
  /** Salida programada: el corte de la jornada normal. */
  horasalida?: string | null;
  horarealSalida?: string | null;
  minutosExtras: number;
  /** Minutos que no cayeron en ningún tramo de la tabla. */
  sinTramo?: number;
  porTramo?: HorasExtrasMinutosTramo[];
}

/** Fila por empleado del reporte de horas extras. */
export interface HorasExtrasFila {
  pleauthoraexdetId: number;
  empleadoId: number;
  departamentoId?: number | null;
  sn_pagar: 'S' | 'N';
  /** Regla de pago: autorizado y `sn_pagar === 'S'`. */
  paga: boolean;
  nroempleado?: string;
  nombres?: string;
  apellidos?: string;
  /** D = Diurna (8h), M = Mixta (7h), N = Nocturna (6h). */
  sn_jornada?: string;
  horasJornada?: number;
  sueldobruto?: number;
  /** (sueldobruto / 30) / horasJornada. */
  valorHora?: number;
  diasAsistencia: number;
  diasConExtras: number;
  minutosExtras: number;
  horasExtras: number;
  /** Minutos extras no clasificados (horario fuera de la tabla). */
  minutosSinTramo?: number;
  /** Desglose por tramo (sólo los tramos con minutos > 0). */
  tramos?: HorasExtrasTramoDetalle[];
  /** valor de hora × horas × (1 + tasa/100), suma de los tramos. */
  importe?: number;
  recargo?: number;
  asistencias: HorasExtrasAsistencia[];
}

export interface HorasExtrasTotales {
  empleadosAutorizados: number;
  empleadosQuePagan: number;
  diasConExtras: number;
  minutosExtras: number;
  horasExtras: number;
  minutosExtrasPagados?: number;
  horasExtrasPagadas: number;
  /** Importe a pagar (todos los empleados autorizados). */
  importe?: number;
  /** Importe a pagar sólo de los con `sn_pagar = 'S'`. */
  importePagado?: number;
  recargo?: number;
  recargoPagado?: number;
}

/** Respuesta de `GET /planilla/authoraex/:id/horas-extras`. */
export interface HorasExtrasReporte extends AutorizacionHorasExtras {
  desde?: string;
  hasta?: string;
  /** Tramos vigentes (`tplhorasextras`) usados para clasificar. */
  tramos?: TramoHorasExtras[];
  filas: HorasExtrasFila[];
  totales: HorasExtrasTotales;
}

/** Empleado con horas extras que NO tiene línea en la planilla. */
export interface EmpleadoSinLineaPlanilla {
  empleadoId: number;
  nroempleado: string;
  nombre: string;
  importe: number;
}

/** Detalle del cálculo mensual de horas extras por empleado. */
export interface HorasExtrasPlanillaDetalle {
  empleadoId: number;
  nroempleado: string;
  nombre: string;
  sn_jornada: string;
  horasJornada: number;
  sueldobruto: number;
  valorHora: number;
  diasConExtras: number;
  minutosExtras: number;
  horasExtras: number;
  minutosSinTramo: number;
  importe: number;
  recargo: number;
  tramos: HorasExtrasTramoDetalle[];
}

/**
 * Respuesta de `POST /planilla/planillas/:id/calcular-horas-extras`.
 * Integra el importe mensual de horas extras en `plepladet.importe_chorasextras`
 * y en el rubro `PAGO-HORA-EX` de `pletipomov`.
 */
export interface HorasExtrasPlanillaResultado {
  planillaId: number;
  nroplanilla: string;
  anio: number;
  periodo: number;
  periodoTexto: string;
  autorizaciones: number;
  diasEvaluados: number;
  empleadosCalculados: number;
  lineasActualizadas: number;
  movimientosActualizados: number;
  horasTotales: number;
  minutosTotales: number;
  importeTotal: number;
  recargoTotal: number;
  minutosSinTramo: number;
  empleadosSinLinea: EmpleadoSinLineaPlanilla[];
  detalle: HorasExtrasPlanillaDetalle[];
}

/** Totales del cálculo al generar una planilla. */
export interface PlanillaGeneradaTotales {
  sueldobruto: number;
  ihss: number;
  rap: number;
  rtf: number;
  vecinal: number;
  dotras: number;
  comision: number;
  horasExtras: number;
  bonos: number;
  neto: number;
}

/** Planilla especial del décimo (13avo/14avo) creada o regenerada automáticamente. */
export interface PlanillaGeneradaDecimo {
  aplicado: boolean;
  tipo?: '13AVO' | '14AVO';
  nroplanilla?: string;
  planillaEspecialId?: number | null;
  empleados?: number;
  total?: number;
}

/**
 * Respuesta de `POST /planilla/planillas/:id/generar`.
 * Reemplaza todas las líneas de la planilla con los cálculos completos
 * (IHSS, RAP, RTF y vecinal ÷12, otras deducciones, comisiones por tramo,
 * bonos, horas extras y neto) y, si el mes corresponde, crea o regenera la
 * planilla especial del décimo (ESP-13AVO / ESP-14AVO).
 */
export interface PlanillaGeneradaResultado {
  planillaId: number;
  periodoTexto: string;
  empleadosCalculados: number;
  lineasCreadas: number;
  totales: PlanillaGeneradaTotales;
  decimo: PlanillaGeneradaDecimo;
}

/**
 * Cabecera de planilla (`pleplamae`) con los flags de estado del flujo
 * Generar → Autorizar pago → Contabilizar (columnas agregadas 20/10/2026).
 * `partidaId` queda en 0 hasta integrar la partida contable.
 */
export interface PlanillaMae {
  planillaId: number;
  nroplanilla: string;
  periodo: number;
  anio: number;
  bcoctasId: number;
  items: number;
  totalapagar: number;
  sn_autorizada: 'S' | 'N';
  sn_contabilizada: 'S' | 'N';
  partidaId: number;
  sn_pagada: 'S' | 'N';
  sn_anulada: 'S' | 'N';
  empresaId: number;
}