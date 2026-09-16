export interface TipoParametro {
  ttipoparametrosId: number;
  field: string;
  tipo: 'NUMBER' | 'STRING';
  valor: string;
  sn_activo: 'S' | 'N';
  moduloId: number;
  Idsucursal: number;
  empresaId: number;
  usuarioCreated: string;
  fechaCreated: Date;
  usuarioUpdate: string;
  fechaUpdate: Date;
}

/** IDs de módulos (tmodulos) */
export const MODULO_IDS = {
  CONFIGURACION: 1,
  INVENTARIOS: 2,
  FACTURACION: 3,
  CXC: 4,
  CXP: 5,
  BANCOS: 6,
  CONTABILIDAD: 7,
  PLANILLA: 8,
  MENU: 9,
} as const;

export const MODULO_LABELS: Record<number, string> = {
  [MODULO_IDS.CONFIGURACION]: 'Configuración',
  [MODULO_IDS.INVENTARIOS]: 'Inventarios',
  [MODULO_IDS.FACTURACION]: 'Facturación',
  [MODULO_IDS.CXC]: 'CxC',
  [MODULO_IDS.CXP]: 'CxP',
  [MODULO_IDS.BANCOS]: 'Bancos',
  [MODULO_IDS.CONTABILIDAD]: 'Contabilidad',
  [MODULO_IDS.PLANILLA]: 'Planilla',
  [MODULO_IDS.MENU]: 'Papelería',
};
