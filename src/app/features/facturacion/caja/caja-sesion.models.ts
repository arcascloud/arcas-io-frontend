/**
 * Caja que el usuario autenticado puede operar.
 * Fuente backend: GET /facturacion/caja/cajas-disponibles
 * (tusuarios_caja → fallback cxccajeros.usuario → admin/supervisor todas).
 */
export interface CajaDisponible {
  cajaId: number;
  usuario: string;
  nombre: string;
  /** true si la asignación viene de tusuarios_caja */
  asignada: boolean;
}

export interface CajaSesion {
  id: number;
  empresaId: number;
  cajaId: number;
  usuarioId: number;
  estado: 'ABIERTA' | 'CERRADA';
  fecha_apertura: string;
  monto_apertura: number;
  fecha_cierre?: string | null;
  monto_sistema_cierre?: number | null;
  monto_declarado_cierre?: number | null;
  diferencia_cierre?: number | null;
  observacion_cierre?: string | null;
  usuarioCreated: string;
  movimientos?: CajaMovimiento[];
  cortes?: CajaCorte[];
}

export interface CajaMovimiento {
  id: number;
  empresaId: number;
  sesionId: number;
  tipo:
    | 'APERTURA'
    | 'VENTA_EFECTIVO'
    | 'DEVOLUCION_EFECTIVO'
    | 'INGRESO_EFECTIVO'
    | 'RETIRO_EFECTIVO'
    | 'COBRO_TARJETA'
    | 'COBRO_TRANSFERENCIA'
    | 'APERTURA_GAVETA_MANUAL';
  signo: number; // 1, -1, 0
  monto: number;
  metodo_pago: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'OTRO';
  referencia_tipo?: string;
  referencia_id?: number;
  motivo?: string;
  autorizado_por?: string;
  usuarioCreated: string;
  fechaCreated: string;
}

export interface CajaCorte {
  id: number;
  empresaId: number;
  sesionId: number;
  tipo_corte: 'CORTE_X' | 'CORTE_Z';
  numero_correlativo: number;
  fecha_corte: string;
  fondo_inicial: number;
  total_entradas_efectivo: number;
  total_salidas_efectivo: number;
  saldo_efectivo_sistema: number;
  total_otros_medios: number;
  efectivo_contado?: number;
  diferencia?: number;
  observaciones?: string;
  usuarioCreated: string;
  fechaCreated: string;
}
