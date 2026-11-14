import { OrdenItem, OrdenRestaurante, NUM_MESAS } from './restaurante.models';

/**
 * Modelos del flujo mesero → caja → cocina.
 * Archivo NUEVO: no modifica restaurante.models.ts. Los campos extra (estado,
 * cajaId, estado_cocina) llegan en el mismo JSON de los endpoints de pedidos
 * una vez aplicado el DDL del plan; mientras no existan se tratan como opcionales.
 *
 * IDENTIDAD EN LA ORDEN (sin crear tablas ni columnas nuevas):
 *  - Mesero  → `pospedmae.gestorId` → `ttipogestores` (catálogo existente).
 *  - Cliente → `pospedmae.nombrecliente` (columna existente).
 */

/** Los kioskos viajan en `nromesa` como 100 + n, para no chocar con las mesas 1..NUM_MESAS. */
export const KIOSKO_BASE = 100;
export const NUM_KIOSKOS = 20;
export { NUM_MESAS };

/** Productos sin existencia no se pueden pedir. false si los platos preparados no llevan kardex. */
export const MESERO_VALIDAR_EXISTENCIA = true;

/** Cajas a las que el mesero puede enviar. La primera es la central y es la predeterminada. */
export interface CajaDestino {
  id: number;
  nombre: string;
}
export const CAJAS_RESTAURANTE: CajaDestino[] = [
  { id: 1, nombre: 'Caja central' },
  { id: 2, nombre: 'Caja 2' },
  { id: 3, nombre: 'Caja 3' },
];

export type EstadoOrden = 'ABIERTO' | 'ENVIADO' | 'EN_PREPARACION' | 'LISTO' | 'ENTREGADO' | 'COBRADO' | 'ANULADO';
export type EstadoCocina = 'PENDIENTE' | 'EN_PREPARACION' | 'LISTO' | 'ENTREGADO';

/** Opción del select de meseros: se carga desde GET /parametros/gestores (ttipogestores). */
export interface OpcionGestor {
  label: string;
  value: number;
}

export type OrdenMesero = OrdenRestaurante & {
  estado?: EstadoOrden;
  cajaId?: number | null;
  /** Mesero que tomó la orden: ttipogestores.gestorId (columna ya existente en pospedmae). */
  gestorId?: number | null;
};
export type ItemMesero = OrdenItem & { estado_cocina?: EstadoCocina };

export type TipoPuesto = 'M' | 'K';

/** Lo que ve el mesero en cada casilla de la pantalla de puestos. */
export type EstadoPuesto = 'libre' | 'enCocina' | 'lista' | 'servida';

export interface Puesto {
  /** Valor que se guarda en pospedmae.nromesa */
  nromesa: number;
  tipo: TipoPuesto;
  numero: number;
  etiqueta: string;
}

export interface PuestoVista {
  puesto: Puesto;
  orden: OrdenMesero | null;
  estado: EstadoPuesto;
}

/** Línea que el mesero va armando antes de enviar (vive solo en el teléfono). */
export interface LineaBorrador {
  productoId: number;
  codbarra: string;
  descripcion: string;
  precio: number;
  cantidad: number;
  imagen: string | null;
  existencia: number;
}

/** Cuerpo de POST /facturacion/restaurante/rondas */
export interface RondaPayload {
  /** Identifica el envío: si el teléfono reintenta tras un corte, el servidor no duplica la ronda. */
  rondaId: string;
  nromesa: number;
  cajaId: number;
  /** Mesero (ttipogestores.gestorId). En una cuenta abierta el servidor conserva el original. */
  gestorId: number | null;
  /** Nombre del cliente anotado en la orden (pospedmae.nombrecliente). */
  nombrecliente: string;
  lineas: { productoId: number; cantidad: number }[];
}

export function crearPuesto(tipo: TipoPuesto, numero: number): Puesto {
  return tipo === 'M'
    ? { nromesa: numero, tipo, numero, etiqueta: `Mesa ${numero}` }
    : { nromesa: KIOSKO_BASE + numero, tipo, numero, etiqueta: `Kiosko ${numero}` };
}

/** Etiqueta de cualquier valor de nromesa: 'Mesa 3', 'Kiosko 2' o 'Venta libre'. */
export function etiquetaPuesto(nromesa: number | null | undefined): string {
  const n = nromesa ?? 0;
  if (n >= KIOSKO_BASE + 1) return `Kiosko ${n - KIOSKO_BASE}`;
  return n >= 1 ? `Mesa ${n}` : 'Venta libre';
}

export function nuevoRondaId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// ───────────────────────── Cocina (fase 3) ─────────────────────────

/**
 * Línea del tablero de cocina: GET /facturacion/pedidos-det/abiertos devuelve
 * solo PENDIENTE/EN_PREPARACION/LISTO, con la descripción del producto resuelta
 * en el servidor (la tarjeta no debe cargar el catálogo entero).
 */
export type LineaCocina = ItemMesero & {
  descripcion?: string | null;
  /** Cada ronda del mesero es una tarjeta distinta en cocina. */
  ronda_uuid?: string | null;
  enviado_at?: string | null;
  listo_at?: string | null;
};

/** Prioridad del estado: la línea "más atrás" de un grupo manda (para agrupar tarjetas). */
export const RANGO_ESTADO_COCINA: Record<EstadoCocina, number> = {
  PENDIENTE: 0,
  EN_PREPARACION: 1,
  LISTO: 2,
  ENTREGADO: 3,
};

/**
 * Siguiente estado de cocina con un toque. LISTO no avanza desde aquí: la
 * entrega (ENTREGADO) la hace el mesero con el toggle que ya existe.
 */
export function siguienteEstadoCocina(e: EstadoCocina | null | undefined): EstadoCocina | null {
  if (e === 'PENDIENTE') return 'EN_PREPARACION';
  if (e === 'EN_PREPARACION') return 'LISTO';
  return null;
}

/**
 * Tarjeta del tablero = un ticket por (orden, ronda): todas las líneas que el
 * mesero envió juntas. Contra la lista de pedidos abiertos se resuelve el
 * puesto (nromesa), el cliente (nombrecliente) y el mesero (gestorId).
 */
export interface TarjetaCocina {
  /** `${pospedmaeId}-${rondaUuid}` (respaldo: pospeddetId si no trae ronda). */
  key: string;
  pedido: OrdenMesero;
  rondaUuid: string | null;
  lineas: LineaCocina[];
  /** enviado_at más antiguo de la tarjeta (hora de llegada a cocina). */
  enviadoAt: string | null;
  /** Estado del ticket: la línea más atrás del grupo. */
  estado: EstadoCocina;
}
