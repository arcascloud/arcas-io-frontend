export interface Empresa {
  empresaId: number;
  descripcion: string;
  fechasistema?: string;
  msjfactura: string;
  msjdevfactura: string;
  sn_activo: string;
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: string;
}

export interface EmpresaDet {
  empresasdetId: number;
  tipo: 'TELEFONO' | 'DIRECCION' | 'CORREO' | 'RUC' | 'RTN' | 'WEBSITE' | 'REDESOCIAL' | 'CAI';
  descripcion: string;
  sn_activo: string;
  empresaId: number;
}

export interface Correlativo {
  poscorrelativosId: number;
  nrofactura: number;
  TCPIP?: string;
  Idsucursal: number;
  rangoDesde: string;
  rangoHasta: string;
  fechaLimite: string;
  empresaId: number;
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: string;
}

export interface EmpresaLogo {
  tempresaslogoId: number;
  img: string;
  sn_activo: string;
  empresaId: number;
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: string;
}

export interface Impresora {
  timpresorasId: number;
  descripcion: string;
  formato: 'TICKET' | 'CARTA';
  driver: string;
  puerto: string;
  modo_correlativo: 'A' | 'M';
  Idsucursal: number;
  empresaId: number;
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: string;
}

export interface EstadoCorrelativo {
  poscorrelativosId: number;
  Idsucursal: number;
  rangoDesde: string;
  rangoHasta: string;
  nrofactura: number;
  fechaLimite: string;
  total: number;
  usados: number;
  disponible: number;
  porcentaje: number;
  estado: 'OK' | 'ALERTA' | 'CRITICO' | 'AGOTADO';
}
