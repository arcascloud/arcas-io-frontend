export interface CxPHistorico {
  bcomovId: number;
  proveedorId: number;
  fecharegistro: string;
  nroproveedor: string;
  dni: string;
  proveedor: string;
  modulo: string;
  abreviatura: string;
  documentoId: number;
  nroreferencia: string;
  tipomov: string;
  importe: number;
  concepto: string;
  sn_doc_anulado: string;
  sn_contabilizado: string;
}

/** Tipos de información de contacto de un proveedor (tabla proveedorinfo) */
export type TipoInfoProveedor = 'CORREO' | 'CELULAR' | 'DIRECCION';

/**
 * Información de proveedor (proveedorinfo): correo, celular o dirección.
 * Unicidad: (proveedorId, tipo, empresaId) — un registro por tipo.
 * Baja lógica vía sn_activo.
 */
export interface ProveedorInfo {
  id: number;
  proveedorId: number;
  tipo: TipoInfoProveedor;
  descripcion: string | null;
  sn_activo: 'S' | 'N';
  empresaId?: number;
  usuarioCreated?: string;
  usuarioUpdated?: string | null;
  fechaUpdated?: string | null;
}

/**
 * Asignación de cartera contable a un proveedor (cxpcarteracta).
 * La tabla NO tiene sn_activo: las eliminaciones son físicas.
 * Nota: la columna sucursal en BD se llama "Idsucusal" (typo original).
 */
export interface ProveedorCartera {
  id: number;
  proveedorId: number;
  carteractaId: number;
  Idsucursal?: number;
  empresaId?: number;
  usuarioCreated?: string;
  fechaCreated?: string;
  usuarioUpdate?: string;
  fechaUpdate?: string;
}
