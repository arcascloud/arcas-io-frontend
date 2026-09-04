export interface Empresa {
  empresaId: number;
  descripcion: string;
  msjfactura: string;
  msjdevfactura: string;
  sn_activo: string;
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: string;
}

export interface EmpresaDet {
  empresasdetId: number;
  tipo: 'TELEFONO' | 'DIRECCION' | 'CORREO' | 'RUC' | 'RTN' | 'WEBSITE' | 'REDESOCIAL';
  descripcion: string;
  sn_activo: string;
  empresaId: number;
}
