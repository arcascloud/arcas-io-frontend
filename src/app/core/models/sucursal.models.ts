export interface Sucursal {
  idsucursal: number;
  descripcion: string;
  direccion?: string;
  telefono1?: string;
  telefono2?: string;
  sn_activo: 'S' | 'N';
  bodegaId?: number;
  empresaId: number;
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: string;
}