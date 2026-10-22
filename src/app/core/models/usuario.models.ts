export interface Usuario {
  usuario: string;
  usuarioId: number;
  nombre: string;
  apellidos?: string;
  password?: string;
  email: string;
  sn_activo: 'S' | 'N';
  Idsucursal: number;
  empresaId: number;
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: Date;
}

/**
 * Información extendida del usuario (`tusuariosinfoinfo`).
 * Solo se declaran los campos que consume el formulario de usuario.
 */
export interface UsuarioInfo {
  usuarioId: number;
  usuario: string;
  nrodocumento: string;
  tipodoc?: string;
  sexo?: 'M' | 'F';
  fecnac?: string | Date | null;
  empleadoId?: number | null;
  sn_cliente?: 'S' | 'N';
}

export interface UsuariosModule {
  tusuariosmoduloId: number;
  empresaId: number;
  moduloId: number;
  usuario: string;
  sn_activo: 'S' | 'N';
  submnudatos: 'S' | 'N';
  submnurocesos: 'S' | 'N';
  submnueportes: 'S' | 'N';
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: Date;
}

export interface UsuariosMnuItem {
  tusuariomnuitemsId: number;
  empresaId: number;
  moduloId: number;
  usuario: string;
  parent: number;
  parentId: number;
  levelId: number;
  nameParent: string;
  nameItem: string;
  labelItem: string;
  iconItem?: string;
  routerLink?: string;
  sn_activo: 'S' | 'N';
  /** Orden del item dentro de su nivel (alias del backend: `zorden` como `zordenItem`) */
  zordenItem?: number;
  /** Orden del módulo (alias del backend: `tmodulos.zorden` como `zordenMod`) */
  zordenMod?: number;
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: Date;
}

export interface UsuariosScripts {
  tusuarioscriptsId: number;
  usuario: string;
  script: string;
  empresaId: number;
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: Date;
}

export interface UsuarioModAuth {
  usuariomodauthId: number;
  usuario: string;
  descripcion?: string;
  sn_auth_devoluciones: 'S' | 'N';
  sn_auth_reversion: 'S' | 'N';
  sn_auth_anulaciones: 'S' | 'N';
  sn_auth_facturacion: 'S' | 'N';
  sn_auth_contabilizar: 'S' | 'N';
  fechaoperativa?: Date;
  empresaId: number;
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: Date;
}

export interface Modulo {
  moduloId: number;
  descripcion: string;
  abreviatura?: string;
  descripcion_contable?: string;
  sn_auxiliar_contable?: 'S' | 'N';
  sn_activo: 'S' | 'N';
  empresaId: number;
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: Date;
}

/** Asignación de rol de usuario (tusuarios_rol) */
export interface UsuarioRol {
  rol_id: number;
  usuarioId: number;
  rol: string;
  empresaId: number;
  usuarioCreated: string;
  fechaCreated?: Date | null;
  usuarioUpdated?: string | null;
  fechaUpdate?: Date | null;
  /** Nombre completo del usuario (enriquecido por el backend) */
  nombreUsuario?: string;
  /** Login del usuario (enriquecido por el backend) */
  loginUsuario?: string;
}

/** Catálogo de roles disponibles (ttipo_rol) */
export interface TipoRol {
  id_rol: number;
  rol: string;
  empresaId?: number | null;
  usuarioCreated?: string | null;
  fechaCreated?: Date | null;
  usuarioUpdate?: string | null;
  fechaUpdate?: Date | null;
}
