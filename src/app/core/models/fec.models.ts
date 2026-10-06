/**
 * Fechas autorizadas (tfecma / tfecdet).
 *
 * Define un rango de vigencia y los usuarios habilitados para registrar
 * datos en períodos cerrados dentro de ese rango.
 */

/** Línea del detalle: usuario habilitado dentro de un rango. */
export interface Fecdet {
  fecdetId: number;
  fecmaeId: number;
  /** Login del usuario (tusuarios.usuario) */
  usuario: string;
  sn_permitido: 'S' | 'N';
  empresaId: number;
  usuarioCreated: string;
  fechaCreated: Date | string;
  usuarioUpdate: string;
  fechaUpdate: Date | string | null;
}

/** Maestro del rango de vigencia, con su detalle. */
export interface Fecma {
  tfecmaId: number;
  fechasistema: Date | string;
  fec_vig_desde: Date | string;
  fec_vig_hasta: Date | string;
  empresaId: number;
  usuarioCreated: string;
  fechaCreated: Date | string;
  usuarioUpdate: string;
  fechaUpdate: Date | string | null;
  detalles: Fecdet[];
}

/** Payload de alta (maestro + detalle) — se guarda en una transacción. */
export interface FecmaPayload {
  fec_vig_desde: Date | string;
  fec_vig_hasta: Date | string;
  empresaId?: number;
  detalles: { usuario: string; sn_permitido?: 'S' | 'N' }[];
}

/** Payload de baja de una línea de detalle suelta. */
export interface FecdetPayload {
  fecmaeId: number;
  usuario: string;
  sn_permitido?: 'S' | 'N';
  empresaId?: number;
}

/** Respuesta del chequeo de autorización para escribir en una fecha. */
export interface AutorizacionFec {
  autorizado: boolean;
  motivo: string;
  fecmaeId?: number;
  fec_vig_desde?: Date | string;
  fec_vig_hasta?: Date | string;
}

/**
 * Estado de la Fecha del Sistema del ERP (`tempresas.fechasistema`)
 * frente a la fecha del servidor (`CURDATE()` de MySQL).
 *
 * Mientras `coincide` sea `false` el backend bloquea toda escritura
 * (409 con `code: 'FECHA_SISTEMA'`), salvo usuarios con rango vigente en tfecdet.
 */
export interface EstadoFechaSistema {
  /** `YYYY-MM-DD`, o `null` si la empresa no existe en tempresas */
  fechaSistema: string | null;
  /** `YYYY-MM-DD` */
  fechaServidor: string;
  coincide: boolean;
}
