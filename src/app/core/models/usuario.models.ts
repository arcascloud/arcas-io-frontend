export interface Usuario {
  usuario: string;
  usuarioId: number;
  nombre: string;
  password?: string;
  email: string;
  sn_activo: 'S' | 'N';
  Idsucursal: number;
  empresaId: number;
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: Date;
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
  sn_activo: 'S' | 'N';
  empresaId: number;
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: Date;
}
