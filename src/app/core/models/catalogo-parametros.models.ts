export interface CampoCatalogo {
  key: string;
  label: string;
  tipo: 'texto' | 'numero' | 'select' | 'fecha';
  opciones?: { label: string; value: string | number }[];
  cargaOpciones?: { url: string; labelCampo: string; valueCampo: string };
  requerido?: boolean;
  principal?: boolean;
  formato?: string;
  frozen?: boolean;
  /** No se muestra en el formulario (ej: ID que asigna el backend). Sí aparece en la lista */
  ocultoForm?: boolean;
  /** El valor de este campo no puede ser menor al del campo indicado (key). Ej: precioventa >= preciocompra */
  minCampo?: string;
  /** Cifras decimales para mostrar en formulario y lista (ej: 4 para tipo de cambio 26.9745) */
  decimales?: number;
  /**
   * En la lista el valor se muestra como SALDO ACUMULADO a fin de mes
   * (saldoanterior + netos de los meses anteriores + mes actual) con lado (C)/(D).
   * Ej: columnas Enero…Diciembre de saldoscta.
   */
  acumulado?: boolean;
  /**
   * En la lista el valor es un SALDO (acumulado o actual): se imprime en
   * positivo con el lado contable (C)/(D) derivado del signo. Ej:
   * "12,247.00 (C)" / "63,042.00 (D)". 0.00 va sin sufijo.
   * Ej: columnas Saldo Acum. y Saldo de movcta, Saldo Acumulado de saldoscta.
   */
  lado?: boolean;
}

/** Filtro de selección en la barra de filtros del catálogo genérico */
export interface CampoFiltroCatalogo {
  key: string;
  label: string;
  /** texto = input libre; select = desplegable (opciones estáticas o únicas de los datos) */
  tipo: 'texto' | 'select';
  /** Opciones fijas para tipo select. Si se omite, se derivan de los datos cargados. */
  opciones?: { label: string; value: string | number }[];
  /**
   * Fila de la barra de filtros (default 1). `2` = va en la segunda fila,
   * a ancho completo, debajo de los filtros y de los botones Buscar/Limpiar.
   * Ej: Descripción de movcta.
   */
  fila?: number;
}

/** Config del diálogo de detalle (estado de cuenta) del catálogo genérico */
export interface CatalogoDetalleConfig {
  /** Endpoint GET que recibe los parámetros indicados en `params` desde la fila seleccionada */
  ruta: string;
  /** Claves de la fila a enviar como query string (ej: ['ctacontable', 'anio']) */
  params: string[];
  /** Clave de la fila con el código mostrado en el encabezado (ej: ctacontable) */
  tituloKey: string;
  /** Clave de la fila con el saldo acumulado inicial (ej: saldoanterior) */
  saldoKey: string;
  /** Columnas del reporte de detalle */
  columnas: CampoCatalogo[];
  /** Título del diálogo (default: 'Estado de Cuenta') */
  titulo?: string;
}

/** Respuesta del endpoint de detalle (estado de cuenta por partida) */
export interface DetalleEstadoCuenta {
  descripcion: string;
  movimientos: Record<string, any>[];
  totales: { debito: number; credito: number };
  /**
   * Saldo acumulado inicial calculado por el backend:
   * saldoanterior (cierre del año anterior) + Σ(debito-credito) de los
   * períodos ANTERIORES al filtro. Para movcta (fila = cuenta+año+período)
   * es la base correcta; `sacum` de la fila puede venir en 0 (cocierredet vacía).
   */
  saldoAcumulado?: number;
}

export interface CatalogoConfig {
  ruta: string;
  titulo: string;
  subtitulo?: string;
  idKey: string;
  icono: string;
  campos: CampoCatalogo[];
  /** Filtros de selección adicionales (Año, Período, Descripción, etc.) */
  filtros?: CampoFiltroCatalogo[];
  incluyeEmpresaId?: boolean;
  sinEstado?: boolean;
  soloLectura?: boolean;
  /**
   * Filas protegidas: las que cumplen la condición (por defecto sn_abierto='N')
   * se muestran con candado y no se pueden editar/eliminar.
   */
  protegerCerrados?: boolean;
  /** Mensaje mostrado en el formulario cuando el registro está protegido */
  proteccionMensaje?: string;
  /** Precargar filtros 'anio' y 'periodo' con el período contable abierto (coperiodoctable.sn_abierto='S') */
  preCargarPeriodoAbierto?: boolean;
  /** Diálogo de detalle (estado de cuenta) al hacer clic en una fila o con el botón 👁 */
  detalle?: CatalogoDetalleConfig;
}

export const CATALOGOS_PARAMETROS: Record<string, CatalogoConfig> = {
  estados: {
    ruta: '/parametros/estados',
    titulo: 'Estados',
    subtitulo: 'Tipos de estado',
    idKey: 'estadoId',
    icono: 'flag',
    campos: [
      { key: 'descripcion', label: 'Descripción', tipo: 'texto', requerido: true, principal: true },
    ],
  },
  meses: {
    ruta: '/parametros/meses',
    titulo: 'Meses',
    subtitulo: 'Meses del año',
    idKey: 'ttipomesId',
    icono: 'calendar',
    incluyeEmpresaId: false,
    sinEstado: true,
    campos: [{ key: 'mes', label: 'Mes', tipo: 'texto', requerido: true, principal: true }],
  },
  'formas-pago': {
    ruta: '/parametros/formas-pago',
    titulo: 'Formas de Pago',
    subtitulo: 'Tipos de forma de pago',
    idKey: 'formapagoId',
    icono: 'credit-card',
    campos: [
      { key: 'descripcion', label: 'Descripción', tipo: 'texto', requerido: true, principal: true },
    ],
  },
  monedas: {
    ruta: '/parametros/monedas',
    titulo: 'Monedas',
    subtitulo: 'Tipos de moneda',
    idKey: 'monedaId',
    icono: 'dollar',
    campos: [
      { key: 'descripcion', label: 'Descripción', tipo: 'texto', requerido: true, principal: true },
      { key: 'simbolo', label: 'Símbolo', tipo: 'texto', requerido: true },
    ],
  },
  impuestos: {
    ruta: '/parametros/impuestos',
    titulo: 'Impuestos',
    subtitulo: 'Tipos de impuesto',
    idKey: 'impuestoId',
    icono: 'percentage',
    campos: [
      { key: 'descripcion', label: 'Descripción', tipo: 'texto', requerido: true, principal: true },
      { key: 'moduloId', label: 'Módulo', tipo: 'numero', requerido: true },
      { key: 'porcentaje', label: 'Porcentaje', tipo: 'numero', requerido: true },
    ],
  },
  paises: {
    ruta: '/parametros/paises',
    titulo: 'Países',
    subtitulo: 'Tipos de país',
    idKey: 'paisId',
    icono: 'globe',
    campos: [
      { key: 'descripcion', label: 'Descripción', tipo: 'texto', requerido: true, principal: true },
    ],
  },
  'departamentos-pais': {
    ruta: '/parametros/departamentos-pais',
    titulo: 'Departamentos (País)',
    subtitulo: 'Tipos de departamento por país',
    idKey: 'ttipodeptopaisId',
    icono: 'map',
    campos: [
      { key: 'descripcion', label: 'Descripción', tipo: 'texto', requerido: true, principal: true },
    ],
  },
  'departamentos-empresa': {
    ruta: '/parametros/departamentos-empresa',
    titulo: 'Departamentos Empresa',
    subtitulo: 'Tipos de departamento de la empresa',
    idKey: 'departamentostempresasId',
    icono: 'building',
    campos: [
      { key: 'descripcion', label: 'Descripción', tipo: 'texto', requerido: true, principal: true },
      { key: 'cuentacontableId', label: 'Cuenta Contable', tipo: 'numero' },
    ],
  },
  direcciones: {
    ruta: '/parametros/direcciones',
    titulo: 'Direcciones',
    subtitulo: 'Tipos de dirección',
    idKey: 'direccionId',
    icono: 'map-marker',
    campos: [
      { key: 'descripcion', label: 'Descripción', tipo: 'texto', requerido: true, principal: true },
    ],
  },
  telefonos: {
    ruta: '/parametros/telefonos',
    titulo: 'Teléfonos',
    subtitulo: 'Tipos de teléfono',
    idKey: 'telefonoId',
    icono: 'phone',
    campos: [
      { key: 'descripcion', label: 'Descripción', tipo: 'texto', requerido: true, principal: true },
    ],
  },
  'tarjetas-credito': {
    ruta: '/parametros/tarjetas-credito',
    titulo: 'Tarjetas de Crédito',
    subtitulo: 'Tipos de tarjeta de crédito',
    idKey: 'tarjetacreditoId',
    icono: 'credit-card',
    campos: [
      { key: 'descripcion', label: 'Descripción', tipo: 'texto', requerido: true, principal: true },
    ],
  },
  pasatiempos: {
    ruta: '/parametros/pasatiempos',
    titulo: 'Pasatiempos',
    subtitulo: 'Tipos de pasatiempo',
    idKey: 'pasatiempoId',
    icono: 'heart',
    campos: [
      { key: 'descripcion', label: 'Descripción', tipo: 'texto', requerido: true, principal: true },
    ],
  },
  zonas: {
    ruta: '/parametros/zonas',
    titulo: 'Zonas',
    subtitulo: 'Tipos de zona',
    idKey: 'tzonadId',
    icono: 'map',
    campos: [
      { key: 'descripcion', label: 'Descripción', tipo: 'texto', requerido: true, principal: true },
    ],
  },
  gestores: {
    ruta: '/parametros/gestores',
    titulo: 'Gestores',
    subtitulo: 'Gestores de cartera',
    idKey: 'gestorId',
    icono: 'user',
    campos: [
      { key: 'moduloId', label: 'Módulo', tipo: 'numero', requerido: true },
      { key: 'empleadoId', label: 'Empleado', tipo: 'numero', requerido: true },
      {
        key: 'sn_vendedor',
        label: '¿Vendedor?',
        tipo: 'select',
        opciones: [
          { label: 'Sí', value: 'S' },
          { label: 'No', value: 'N' },
        ],
        requerido: true,
      },
    ],
  },
  proformas: {
    ruta: '/parametros/proformas',
    titulo: 'Proformas',
    subtitulo: 'Formatos de proforma',
    idKey: 'proformaId',
    icono: 'file',
    campos: [
      { key: 'Alto', label: 'Alto', tipo: 'texto', requerido: true, principal: true },
      { key: 'bajo', label: 'Bajo', tipo: 'texto', requerido: true },
      { key: 'izquierda', label: 'Izquierda', tipo: 'texto', requerido: true },
      { key: 'derecho', label: 'Derecho', tipo: 'texto', requerido: true },
    ],
  },
  'zonas-vta-cob': {
    ruta: '/parametros/zonas-vta-cob',
    titulo: 'Zonas Venta/Cobro',
    subtitulo: 'Zonas de venta y cobro',
    idKey: 'ttipozonasvtacobId',
    icono: 'map',
    campos: [
      { key: 'descripcion', label: 'Descripción', tipo: 'texto', requerido: true, principal: true },
      { key: 'tzonadId', label: 'Zona', tipo: 'numero', requerido: true },
      { key: 'gestorId', label: 'Gestor', tipo: 'numero' },
    ],
  },
  correlativos: {
    ruta: '/facturacion/correlativos',
    titulo: 'Correlativos',
    subtitulo: 'Correlativo de facturación',
    idKey: 'poscorrelativosId',
    icono: 'hashtag',
    sinEstado: true,
    campos: [
      {
        key: 'nrofactura',
        label: 'Nro. Factura',
        tipo: 'numero',
        requerido: true,
        principal: true,
      },
      { key: 'TCPIP', label: 'TCP/IP', tipo: 'texto', requerido: true },
    ],
  },
  precios: {
    ruta: '/facturacion/precios',
    titulo: 'Precios de Venta',
    subtitulo: 'Tipos de precio de venta',
    idKey: 'preciovtaId',
    icono: 'dollar',
    campos: [
      { key: 'descripcion', label: 'Descripción', tipo: 'texto', requerido: true, principal: true },
      { key: 'porcentaje', label: 'Porcentaje', tipo: 'numero' },
    ],
  },
  descuentos: {
    ruta: '/facturacion/descuentos',
    titulo: 'Descuentos',
    subtitulo: 'Tipos de descuento',
    idKey: 'descuentoId',
    icono: 'percent',
    campos: [
      { key: 'descripcion', label: 'Descripción', tipo: 'texto', requerido: true, principal: true },
      { key: 'porcentaje', label: 'Porcentaje', tipo: 'numero' },
    ],
  },
  cajeros: {
    ruta: '/cxc/cajeros',
    titulo: 'Cajeros',
    subtitulo: 'Cajas / cajeros',
    idKey: 'cajaId',
    icono: 'money-bill',
    campos: [{ key: 'usuario', label: 'Usuario', tipo: 'texto', requerido: true, principal: true }],
  },
  'dias-cobro': {
    ruta: '/cxc/dias-cobro',
    titulo: 'Días de Cobro',
    subtitulo: 'Plazos de días de cobro',
    idKey: 'tdiascobrosId',
    icono: 'calendar',
    campos: [
      { key: 'descripcion', label: 'Descripción', tipo: 'texto', requerido: true, principal: true },
    ],
  },
  bancos: {
    ruta: '/bancos/bancos',
    titulo: 'Bancos',
    subtitulo: 'Catálogo de bancos',
    idKey: 'bancoId',
    icono: 'building-columns',
    campos: [
      { key: 'descripcion', label: 'Descripción', tipo: 'texto', requerido: true, principal: true },
    ],
  },
  cuentas: {
    ruta: '/bancos/cuentas',
    titulo: 'Cuentas Bancarias',
    subtitulo: 'Cuentas por banco',
    idKey: 'bcoctasId',
    icono: 'wallet',
    campos: [
      {
        key: 'bancoId',
        label: 'Banco',
        tipo: 'select',
        cargaOpciones: { url: '/bancos/bancos', labelCampo: 'descripcion', valueCampo: 'bancoId' },
        requerido: true,
      },
      { key: 'nrocuenta', label: 'Nro. Cuenta', tipo: 'texto', requerido: true, principal: true },
      {
        key: 'monedaId',
        label: 'Moneda',
        tipo: 'select',
        cargaOpciones: {
          url: '/parametros/monedas',
          labelCampo: 'descripcion',
          valueCampo: 'monedaId',
        },
        requerido: true,
      },
    ],
  },
  puestos: {
    ruta: '/planilla/puestos',
    titulo: 'Puestos',
    subtitulo: 'Puestos de trabajo',
    idKey: 'puestosId',
    icono: 'briefcase',
    sinEstado: true,
    campos: [
      { key: 'descripcion', label: 'Descripción', tipo: 'texto', requerido: true, principal: true },
    ],
  },
  profesiones: {
    ruta: '/planilla/profesiones',
    titulo: 'Profesiones',
    subtitulo: 'Profesiones de empleados',
    idKey: 'profesionId',
    icono: 'graduation-cap',
    campos: [
      { key: 'descripcion', label: 'Descripción', tipo: 'texto', requerido: true, principal: true },
    ],
  },
  deducciones: {
    ruta: '/planilla/deducciones',
    titulo: 'Deducciones',
    subtitulo: 'Tipos de deducción',
    idKey: 'deduccioneId',
    icono: 'minus',
    campos: [
      { key: 'descripcion', label: 'Descripción', tipo: 'texto', requerido: true, principal: true },
      {
        key: 'sn_porcentual',
        label: 'Porcentual',
        tipo: 'select',
        opciones: [
          { label: 'Sí', value: 'S' },
          { label: 'No', value: 'N' },
        ],
      },
      {
        key: 'sn_obligatoria',
        label: 'Obligatoria',
        tipo: 'select',
        opciones: [
          { label: 'Sí', value: 'S' },
          { label: 'No', value: 'N' },
        ],
      },
      { key: 'porcentaje', label: 'Porcentaje', tipo: 'numero' },
    ],
  },
  ingresos: {
    ruta: '/planilla/ingresos',
    titulo: 'Ingresos',
    subtitulo: 'Tipos de ingreso',
    idKey: 'tingresoId',
    icono: 'plus',
    campos: [
      { key: 'descripcion', label: 'Descripción', tipo: 'texto', requerido: true, principal: true },
      {
        key: 'sn_porcentual',
        label: 'Porcentual',
        tipo: 'select',
        opciones: [
          { label: 'Sí', value: 'S' },
          { label: 'No', value: 'N' },
        ],
      },
      {
        key: 'sn_obligatoria',
        label: 'Obligatoria',
        tipo: 'select',
        opciones: [
          { label: 'Sí', value: 'S' },
          { label: 'No', value: 'N' },
        ],
      },
      { key: 'porcentaje', label: 'Porcentaje', tipo: 'numero' },
    ],
  },
  titulaciones: {
    ruta: '/planilla/titulaciones',
    titulo: 'Titulaciones',
    subtitulo: 'Titulaciones por empleado',
    idKey: 'emptitulacionId',
    icono: 'award',
    campos: [
      {
        key: 'empleadoId',
        label: 'Empleado',
        tipo: 'select',
        cargaOpciones: {
          url: '/planilla/empleados',
          labelCampo: 'nombres',
          valueCampo: 'empleadoId',
        },
        requerido: true,
      },
      { key: 'descripcion', label: 'Descripción', tipo: 'texto', requerido: true, principal: true },
    ],
  },
  certificaciones: {
    ruta: '/planilla/certificaciones',
    titulo: 'Certificaciones',
    subtitulo: 'Certificaciones por empleado',
    idKey: 'empcertificacionId',
    icono: 'id-card',
    campos: [
      {
        key: 'empleadoId',
        label: 'Empleado',
        tipo: 'select',
        cargaOpciones: {
          url: '/planilla/empleados',
          labelCampo: 'nombres',
          valueCampo: 'empleadoId',
        },
      },
      { key: 'descripcion', label: 'Descripción', tipo: 'texto', requerido: true, principal: true },
    ],
  },
  asistencia: {
    ruta: '/planilla/asistencia',
    titulo: 'Asistencia',
    subtitulo: 'Marcación de empleados',
    idKey: 'plempleadosasistenciaId',
    icono: 'clock',
    campos: [
      {
        key: 'empleadoId',
        label: 'Empleado',
        tipo: 'select',
        cargaOpciones: {
          url: '/planilla/empleados',
          labelCampo: 'nombres',
          valueCampo: 'empleadoId',
        },
        requerido: true,
      },
      { key: 'horaentrada', label: 'Hora Entrada', tipo: 'texto' },
      { key: 'horaalmuerzo', label: 'Hora Almuerzo', tipo: 'texto' },
      { key: 'horaretorno', label: 'Hora Retorno', tipo: 'texto' },
      { key: 'horarealSalida', label: 'Hora Real Salida', tipo: 'texto' },
      { key: 'horasalida', label: 'Hora Salida', tipo: 'texto' },
    ],
  },
  comisiones: {
    ruta: '/planilla/comisiones',
    titulo: 'Comisiones',
    subtitulo: 'Comisiones por empleado',
    idKey: 'emplcomId',
    icono: 'money-bill-wave',
    campos: [
      {
        key: 'empleadoId',
        label: 'Empleado',
        tipo: 'select',
        cargaOpciones: {
          url: '/planilla/empleados',
          labelCampo: 'nombres',
          valueCampo: 'empleadoId',
        },
        requerido: true,
      },
      { key: 'comisionId', label: 'Comisión', tipo: 'numero', requerido: true },
      {
        key: 'tipocomision',
        label: 'Tipo Comisión',
        tipo: 'select',
        opciones: [
          { label: 'Fija', value: 'F' },
          { label: 'Porcentual', value: 'P' },
        ],
      },
      {
        key: 'sn_quincenal',
        label: 'Quincenal',
        tipo: 'select',
        opciones: [
          { label: 'Sí', value: 'S' },
          { label: 'No', value: 'N' },
        ],
      },
    ],
  },
  'deducciones-emp': {
    ruta: '/planilla/deducciones-emp',
    titulo: 'Deducciones por Empleado',
    subtitulo: 'Deducciones asignadas a empleados',
    idKey: 'empdeduccionId',
    icono: 'minus-circle',
    campos: [
      {
        key: 'empleadoId',
        label: 'Empleado',
        tipo: 'select',
        cargaOpciones: {
          url: '/planilla/empleados',
          labelCampo: 'nombres',
          valueCampo: 'empleadoId',
        },
        requerido: true,
      },
      {
        key: 'deduccionId',
        label: 'Deducción',
        tipo: 'select',
        cargaOpciones: {
          url: '/planilla/deducciones',
          labelCampo: 'descripcion',
          valueCampo: 'deduccioneId',
        },
        requerido: true,
      },
      {
        key: 'tipodeduccion',
        label: 'Tipo Deducción',
        tipo: 'select',
        opciones: [
          { label: 'Fija', value: 'F' },
          { label: 'Porcentual', value: 'P' },
        ],
      },
      {
        key: 'sn_quincenal',
        label: 'Quincenal',
        tipo: 'select',
        opciones: [
          { label: 'Sí', value: 'S' },
          { label: 'No', value: 'N' },
        ],
      },
      { key: 'porcentaje', label: 'Porcentaje', tipo: 'numero' },
    ],
  },
  grupocontable: {
    ruta: '/contabilidad/grupocontable',
    titulo: 'Grupo Contable',
    subtitulo: 'Grupos contables',
    idKey: 'tcogrupocontableId',
    icono: 'sitemap',
    campos: [
      { key: 'descripcion', label: 'Descripción', tipo: 'texto', requerido: true, principal: true },
    ],
  },
  carteras: {
    ruta: '/contabilidad/carteras',
    titulo: 'Carteras Contables',
    subtitulo: 'Carteras de cuentas contables',
    idKey: 'tcocarteraId',
    icono: 'folder-open',
    campos: [
      { key: 'descripcion', label: 'Descripción', tipo: 'texto', requerido: true, principal: true },
      {
        key: 'moduloId',
        label: 'Módulo',
        tipo: 'select',
        cargaOpciones: { url: '/modulos', labelCampo: 'descripcion', valueCampo: 'moduloId' },
      },
      {
        key: 'ctacontable',
        label: 'Cuenta Contable',
        tipo: 'select',
        cargaOpciones: {
          url: '/contabilidad/ctacontables',
          labelCampo: 'descripcion',
          valueCampo: 'ctacontable',
        },
      },
    ],
  },
  cierredet: {
    ruta: '/contabilidad/cierredet',
    titulo: 'Detalle de Cierre Contable',
    subtitulo: 'Saldos de cierre por cuenta',
    idKey: 'cocierredetId',
    icono: 'lock',
    sinEstado: true,
    soloLectura: true,
    campos: [
      {
        key: 'cocierremaeId',
        label: 'Cierre Maestro',
        tipo: 'select',
        requerido: true,
        principal: true,
        cargaOpciones: {
          url: '/contabilidad/cierrectable',
          labelCampo: 'observacion',
          valueCampo: 'cierrectableId',
        },
      },
      { key: 'anio', label: 'Año', tipo: 'numero', requerido: true },
      { key: 'periodo', label: 'Período', tipo: 'numero', requerido: true },
      {
        key: 'ctacontable',
        label: 'Cuenta Contable',
        tipo: 'select',
        requerido: true,
        cargaOpciones: {
          url: '/contabilidad/ctacontables',
          labelCampo: 'descripcion',
          valueCampo: 'ctacontable',
        },
      },
      { key: 'saldo', label: 'Saldo', tipo: 'numero' },
      {
        key: 'tiposaldo',
        label: 'Tipo Saldo',
        tipo: 'select',
        opciones: [
          { label: 'Deudor (D)', value: 'D' },
          { label: 'Acreedor (C)', value: 'C' },
        ],
      },
    ],
  },
  'carteras-cta': {
    ruta: '/cxp/carteras-cta',
    titulo: 'Carteras Contables por Proveedor',
    subtitulo: 'Asignación de cartera contable a proveedores',
    idKey: 'id',
    icono: 'folder-open',
    sinEstado: true,
    campos: [
      {
        key: 'proveedorId',
        label: 'Proveedor',
        tipo: 'select',
        requerido: true,
        principal: true,
        cargaOpciones: {
          url: '/cxp/proveedores',
          labelCampo: 'razonsocial',
          valueCampo: 'proveedorId',
        },
      },
      {
        key: 'carteractaId',
        label: 'Cartera Contable',
        tipo: 'select',
        requerido: true,
        cargaOpciones: {
          url: '/contabilidad/carteras',
          labelCampo: 'descripcion',
          valueCampo: 'tcocarteraId',
        },
      },
    ],
  },
  'proveedor-info': {
    ruta: '/cxp/proveedor-info',
    titulo: 'Información de Proveedores',
    subtitulo: 'Correos, celulares y direcciones de contacto',
    idKey: 'id',
    icono: 'address-book',
    campos: [
      {
        key: 'proveedorId',
        label: 'Proveedor',
        tipo: 'select',
        requerido: true,
        principal: true,
        cargaOpciones: {
          url: '/cxp/proveedores',
          labelCampo: 'razonsocial',
          valueCampo: 'proveedorId',
        },
      },
      {
        key: 'tipo',
        label: 'Tipo',
        tipo: 'select',
        requerido: true,
        opciones: [
          { label: 'Correo', value: 'CORREO' },
          { label: 'Celular', value: 'CELULAR' },
          { label: 'Dirección', value: 'DIRECCION' },
        ],
      },
      {
        key: 'descripcion',
        label: 'Descripción',
        tipo: 'texto',
      },
    ],
  },
  'carteras-cliente': {
    ruta: '/cxc/carteras-cliente',
    titulo: 'Carteras Contables por Cliente',
    subtitulo: 'Asignación de cartera contable a clientes',
    idKey: 'id',
    icono: 'folder-open',
    sinEstado: true,
    campos: [
      {
        key: 'clienteId',
        label: 'Cliente',
        tipo: 'select',
        requerido: true,
        principal: true,
        cargaOpciones: {
          url: '/cxc/clientes?limit=1000',
          labelCampo: 'razonsocial',
          valueCampo: 'clienteId',
        },
      },
      {
        key: 'carteractaId',
        label: 'Cartera Contable',
        tipo: 'select',
        requerido: true,
        cargaOpciones: {
          url: '/contabilidad/carteras',
          labelCampo: 'descripcion',
          valueCampo: 'tcocarteraId',
        },
      },
    ],
  },
  'clientes-info': {
    ruta: '/cxc/clientes-info',
    titulo: 'Información de Clientes',
    subtitulo: 'Celulares, direcciones y correos de contacto',
    idKey: 'id',
    icono: 'address-book',
    campos: [
      {
        key: 'clienteid',
        label: 'Cliente',
        tipo: 'select',
        requerido: true,
        principal: true,
        cargaOpciones: {
          url: '/cxc/clientes?limit=1000',
          labelCampo: 'razonsocial',
          valueCampo: 'clienteId',
        },
      },
      {
        key: 'tipo',
        label: 'Tipo',
        tipo: 'select',
        requerido: true,
        opciones: [
          { label: 'Celular', value: 'CELULAR' },
          { label: 'Dirección', value: 'DIRECCION' },
          { label: 'Correo', value: 'CORREO' },
        ],
      },
      {
        key: 'descripcion',
        label: 'Descripción',
        tipo: 'texto',
      },
    ],
  },
  nivelcta: {
    ruta: '/contabilidad/nivelcta',
    titulo: 'Niveles Contables',
    subtitulo: 'Niveles de cuentas contables',
    idKey: 'nivelcontableId',
    icono: 'layer-group',
    campos: [
      {
        key: 'nivel',
        label: 'Nivel',
        tipo: 'select',
        requerido: true,
        principal: true,
        opciones: [
          { label: '1', value: '1' },
          { label: '2', value: '2' },
          { label: '3', value: '3' },
          { label: '4', value: '4' },
          { label: '5', value: '5' },
          { label: '6', value: '6' },
          { label: '7', value: '7' },
          { label: '8', value: '8' },
        ],
      },
      {
        key: 'sn_diario',
        label: 'Diario',
        tipo: 'select',
        opciones: [
          { label: 'Sí', value: 'S' },
          { label: 'No', value: 'N' },
        ],
      },
    ],
  },
  naturalezacta: {
    ruta: '/contabilidad/naturalezacta',
    titulo: 'Naturaleza de Cuenta',
    subtitulo: 'Naturaleza débito/crédito',
    idKey: 'naturalezaCtaId',
    icono: 'balance-scale',
    sinEstado: true,
    campos: [
      {
        key: 'descripcion',
        label: 'Naturaleza',
        tipo: 'select',
        requerido: true,
        principal: true,
        opciones: [
          { label: 'Débito', value: 'D' },
          { label: 'Crédito', value: 'C' },
        ],
      },
    ],
  },
  'tipos-doc-fiscal': {
    ruta: '/contabilidad/tipos-doc-fiscal',
    titulo: 'Tipos de Documento Fiscal',
    subtitulo: 'Tipos de documento fiscal',
    idKey: 'tipodocumentofiscalId',
    icono: 'file-signature',
    campos: [
      { key: 'descripcion', label: 'Descripción', tipo: 'texto', requerido: true, principal: true },
      { key: 'abreviatura', label: 'Abreviatura', tipo: 'texto' },
      {
        key: 'naturaleza',
        label: 'Naturaleza',
        tipo: 'select',
        opciones: [
          { label: 'Débito', value: 'D' },
          { label: 'Crédito', value: 'C' },
        ],
      },
      {
        key: 'cuentacontableId',
        label: 'Cuenta Contable',
        tipo: 'select',
        cargaOpciones: {
          url: '/contabilidad/ctacontables',
          labelCampo: 'ctacontable',
          valueCampo: 'cuentacontablesId',
        },
      },
      { key: 'nrocorrelativo', label: 'Nro. Correlativo', tipo: 'numero' },
    ],
  },
  impuestovecinal: {
    ruta: '/contabilidad/impuestovecinal',
    titulo: 'Impuesto Vecinal',
    subtitulo: 'Tramos de impuesto vecinal',
    idKey: 'impvecinalId',
    icono: 'landmark',
    campos: [
      { key: 'descripcion', label: 'Descripción', tipo: 'texto', requerido: true, principal: true },
      { key: 'del', label: 'Desde', tipo: 'numero', formato: 'moneda' },
      { key: 'al', label: 'Hasta', tipo: 'numero', formato: 'moneda' },
      { key: 'importe', label: 'Importe', tipo: 'numero', formato: 'moneda' },
    ],
  },
  isr: {
    ruta: '/contabilidad/isr',
    titulo: 'ISR (Retención en la Fuente)',
    subtitulo: 'Rangos de impuesto sobre la renta',
    idKey: 'tcoisrId',
    icono: 'percent',
    campos: [
      { key: 'descripcion', label: 'Descripción', tipo: 'texto', requerido: true, principal: true },
      { key: 'del', label: 'Desde', tipo: 'numero', formato: 'moneda' },
      { key: 'al', label: 'Hasta', tipo: 'numero', formato: 'moneda' },
      { key: 'importe', label: 'Importe', tipo: 'numero', formato: 'moneda' },
    ],
  },
  factordecambio: {
    ruta: '/contabilidad/factordecambio',
    titulo: 'Factor de Cambio',
    subtitulo: 'Tasas de cambio',
    idKey: 'factordecambioId',
    icono: 'dollar',
    sinEstado: true,
    campos: [
      {
        key: 'factordecambioId',
        label: 'ID',
        tipo: 'numero',
        requerido: true,
        principal: true,
        ocultoForm: true,
      },
      { key: 'fecharegistro', label: 'Fecha', tipo: 'fecha' },
      { key: 'preciocompra', label: 'Precio Compra', tipo: 'numero', decimales: 4 },
      {
        key: 'precioventa',
        label: 'Precio Venta',
        tipo: 'numero',
        minCampo: 'preciocompra',
        decimales: 4,
      },
      {
        key: 'tipomoneda',
        label: 'Tipo Moneda',
        tipo: 'select',
        opciones: [
          { label: 'Dólar', value: 'D' },
          { label: 'Euro', value: 'E' },
          { label: 'Yen', value: 'Y' },
        ],
      },
    ],
  },
  cierrectable: {
    ruta: '/contabilidad/cierrectable',
    titulo: 'Cierres',
    subtitulo: 'Cierres contables',
    idKey: 'cierrectableId',
    icono: 'lock',
    soloLectura: true,
    campos: [
      { key: 'periodo', label: 'Periodo', tipo: 'numero' },
      { key: 'anio', label: 'Año', tipo: 'numero', formato: 'anio' },
      { key: 'fechacierre', label: 'Fecha Cierre', tipo: 'fecha' },
      { key: 'observacion', label: 'Observación', tipo: 'texto' },
    ],
  },
  periodoctable: {
    ruta: '/contabilidad/periodoctable',
    titulo: 'Periodos Contables',
    subtitulo: 'Periodos por año/mes',
    idKey: 'periodoscontableId',
    icono: 'calendar-check',
    sinEstado: true,
    protegerCerrados: true,
    proteccionMensaje:
      'Período cerrado — registro protegido. No es modificable ni puede reabrirse bajo ninguna circunstancia. Los cierres se realizan desde Cierre Contable.',
    campos: [
      { key: 'nroanio', label: 'Año', tipo: 'numero', formato: 'anio', requerido: true },
      { key: 'nromes', label: 'Mes', tipo: 'numero', requerido: true },
      {
        key: 'sn_abierto',
        label: 'Abierto',
        tipo: 'select',
        opciones: [
          { label: 'Sí', value: 'S' },
          { label: 'No', value: 'N' },
        ],
      },
    ],
  },
  ctacontables: {
    ruta: '/contabilidad/ctacontables',
    titulo: 'Cuentas Contables',
    subtitulo: 'Catálogo de cuentas contables',
    idKey: 'cuentacontablesId',
    icono: 'list',
    campos: [
      // Fila 1: Cuenta | Nivel
      { key: 'ctacontable', label: 'Cuenta', tipo: 'texto', requerido: true, principal: true },
      { key: 'nivel', label: 'Nivel', tipo: 'numero', requerido: true },
      // Fila 2: Descripción | Padre
      { key: 'descripcion', label: 'Descripción', tipo: 'texto', requerido: true },
      { key: 'padre', label: 'Padre', tipo: 'texto' },
      // Fila 3: Grupo Contable | Operable
      {
        key: 'tcogrupocontableId',
        label: 'Grupo Contable',
        tipo: 'select',
        cargaOpciones: {
          url: '/contabilidad/grupocontable',
          labelCampo: 'descripcion',
          valueCampo: 'tcogrupocontableId',
        },
        requerido: true,
      },
      {
        key: 'sn_operable',
        label: 'Operable',
        tipo: 'select',
        opciones: [
          { label: 'Sí', value: 'S' },
          { label: 'No', value: 'N' },
        ],
        requerido: true,
      },
      // Fila 4: Naturaleza | Estado (sn_activo se agrega automático)
      {
        key: 'naturaleza',
        label: 'Naturaleza',
        tipo: 'select',
        opciones: [
          { label: 'Débito', value: 'D' },
          { label: 'Crédito', value: 'C' },
        ],
        requerido: true,
      },
    ],
  },
  saldoscta: {
    ruta: '/contabilidad/saldoscta',
    titulo: 'Saldos anuales',
    subtitulo: 'Saldos acumulado por año',
    idKey: 'cosaldosctaId',
    icono: 'chart-line',
    sinEstado: true,
    soloLectura: true,
    // Año como filtro de búsqueda (dropdown con los años existentes en los datos)
    filtros: [{ key: 'anio', label: 'Año', tipo: 'select' }],
    // Estado de cuenta por partida (estilo libro diario) al seleccionar una fila
    detalle: {
      ruta: '/contabilidad/saldoscta-detalle',
      params: ['ctacontable', 'anio'],
      tituloKey: 'ctacontable',
      saldoKey: 'saldoanterior',
      titulo: 'Estado de Cuenta',
      columnas: [
        { key: 'nropartida', label: 'Nro Partida', tipo: 'numero' },
        { key: 'fecharegistro', label: 'Fecha Registro', tipo: 'fecha' },
        { key: 'debito', label: 'Debe', tipo: 'numero', decimales: 2 },
        { key: 'credito', label: 'Haber', tipo: 'numero', decimales: 2 },
      ],
    },
    campos: [
      {
        key: 'ctacontable',
        label: 'Cuenta',
        tipo: 'texto',
        requerido: true,
        principal: true,
        frozen: true,
      },
      { key: 'saldoanterior', label: 'Saldo Acumulado', tipo: 'numero', decimales: 2, lado: true },
      { key: 'enero', label: 'Enero', tipo: 'numero', decimales: 2, acumulado: true },
      { key: 'febrero', label: 'Febrero', tipo: 'numero', decimales: 2, acumulado: true },
      { key: 'marzo', label: 'Marzo', tipo: 'numero', decimales: 2, acumulado: true },
      { key: 'abril', label: 'Abril', tipo: 'numero', decimales: 2, acumulado: true },
      { key: 'mayo', label: 'Mayo', tipo: 'numero', decimales: 2, acumulado: true },
      { key: 'junio', label: 'Junio', tipo: 'numero', decimales: 2, acumulado: true },
      { key: 'julio', label: 'Julio', tipo: 'numero', decimales: 2, acumulado: true },
      { key: 'agosto', label: 'Agosto', tipo: 'numero', decimales: 2, acumulado: true },
      { key: 'septiembre', label: 'Septiembre', tipo: 'numero', decimales: 2, acumulado: true },
      { key: 'octubre', label: 'Octubre', tipo: 'numero', decimales: 2, acumulado: true },
      { key: 'noviembre', label: 'Noviembre', tipo: 'numero', decimales: 2, acumulado: true },
      { key: 'diciembre', label: 'Diciembre', tipo: 'numero', decimales: 2, acumulado: true },
    ],
  },
  repliquidez: {
    ruta: '/contabilidad/repliquidez',
    titulo: 'Reporte de Liquidez',
    subtitulo: 'Definición de reporte de liquidez',
    idKey: 'tcorepliquidezId',
    icono: 'water',
    campos: [
      { key: 'descripcion', label: 'Descripción', tipo: 'texto', requerido: true, principal: true },
      { key: 'objetivo', label: 'Objetivo', tipo: 'texto' },
    ],
  },
  repdiarios: {
    ruta: '/contabilidad/repdiarios',
    titulo: 'Reportes Diarios',
    subtitulo: 'Definición de reportes diarios',
    idKey: 'tcorepdiariosId',
    icono: 'newspaper',
    campos: [
      { key: 'descripcion', label: 'Descripción', tipo: 'texto', requerido: true, principal: true },
      { key: 'reporte', label: 'Reporte', tipo: 'texto' },
    ],
  },
  repbalances: {
    ruta: '/contabilidad/repbalances',
    titulo: 'Reportes de Balances',
    subtitulo: 'Comparación de saldos por periodo',
    idKey: 'balcomId',
    icono: 'chart-bar',
    sinEstado: true,
    campos: [
      { key: 'ctacontable', label: 'Cuenta', tipo: 'texto' },
      { key: 'periodoA', label: 'Periodo A', tipo: 'numero', requerido: true },
      { key: 'anioA', label: 'Año A', tipo: 'numero', formato: 'anio', requerido: true },
      { key: 'saldoA', label: 'Saldo A', tipo: 'numero' },
      { key: 'periodoB', label: 'Periodo B', tipo: 'numero', requerido: true },
      { key: 'anioB', label: 'Año B', tipo: 'numero', formato: 'anio', requerido: true },
      { key: 'saldoB', label: 'Saldo B', tipo: 'numero' },
    ],
  },
  movcta: {
    ruta: '/contabilidad/movcta',
    titulo: 'Movimientos de Cuentas',
    subtitulo: 'Movimientos por periodos',
    idKey: 'movctascontablesId',
    icono: 'arrows-spin',
    soloLectura: true,
    sinEstado: true,
    preCargarPeriodoAbierto: true,
    // Fila expandida: partidas del período de esa fila (cuenta + año + período)
    // + Nro. Partida clickeable → drawer con la partida contable.
    // 'sacum' = saldo acumulado ANTES de ese período → base de los bloques.
    detalle: {
      ruta: '/contabilidad/saldoscta-detalle',
      params: ['ctacontable', 'anio', 'periodo'],
      tituloKey: 'ctacontable',
      saldoKey: 'sacum',
      titulo: 'Estado de Cuenta',
      columnas: [
        { key: 'nropartida', label: 'Nro Partida', tipo: 'numero' },
        { key: 'fecharegistro', label: 'Fecha Registro', tipo: 'fecha' },
        { key: 'debito', label: 'Debe', tipo: 'numero', decimales: 2 },
        { key: 'credito', label: 'Haber', tipo: 'numero', decimales: 2 },
      ],
    },
    filtros: [
      { key: 'anio', label: 'Año', tipo: 'select' },
      {
        key: 'periodo',
        label: 'Período',
        tipo: 'select',
        opciones: [
          { label: 'Enero', value: 1 },
          { label: 'Febrero', value: 2 },
          { label: 'Marzo', value: 3 },
          { label: 'Abril', value: 4 },
          { label: 'Mayo', value: 5 },
          { label: 'Junio', value: 6 },
          { label: 'Julio', value: 7 },
          { label: 'Agosto', value: 8 },
          { label: 'Septiembre', value: 9 },
          { label: 'Octubre', value: 10 },
          { label: 'Noviembre', value: 11 },
          { label: 'Diciembre', value: 12 },
        ],
      },
      { key: 'descripcion', label: 'Descripción', tipo: 'texto', fila: 2 },
    ],
    campos: [
      { key: 'ctacontable', label: 'Cuenta', tipo: 'texto', requerido: true, principal: true },
      { key: 'descripcion', label: 'Descripción', tipo: 'texto' },
      { key: 'anio', label: 'Año', tipo: 'numero', formato: 'anio' },
      { key: 'periodo', label: 'Periodo', tipo: 'numero', formato: 'entero' },
      { key: 'sacum', label: 'Saldo Acum.', tipo: 'numero', formato: 'moneda', lado: true },
      { key: 'debe', label: 'Debe', tipo: 'numero', formato: 'moneda' },
      { key: 'haber', label: 'Haber', tipo: 'numero', formato: 'moneda' },
      { key: 'saldo', label: 'Saldo', tipo: 'numero', formato: 'moneda', lado: true },
    ],
  },

  // ─── Inventario ──────────────────────────────────────────
  categorias: {
    ruta: '/inventario/categorias',
    titulo: 'Categorías',
    subtitulo: 'Categorías de productos',
    idKey: 'categoriaId',
    icono: 'pi-tags',
    campos: [
      { key: 'descripcion', label: 'Descripción', tipo: 'texto', requerido: true, principal: true },
    ],
  },
  marcas: {
    ruta: '/inventario/marcas',
    titulo: 'Marcas',
    subtitulo: 'Marcas de productos',
    idKey: 'marcaId',
    icono: 'pi-bookmark',
    campos: [
      { key: 'descripcion', label: 'Descripción', tipo: 'texto', requerido: true, principal: true },
    ],
  },
  modelos: {
    ruta: '/inventario/modelos',
    titulo: 'Modelos',
    subtitulo: 'Modelos de productos',
    idKey: 'modeloId',
    icono: 'pi-box',
    campos: [
      { key: 'descripcion', label: 'Descripción', tipo: 'texto', requerido: true, principal: true },
    ],
  },
  colores: {
    ruta: '/inventario/colores',
    titulo: 'Colores',
    subtitulo: 'Colores de productos',
    idKey: 'colorId',
    icono: 'pi-palette',
    campos: [
      { key: 'descripcion', label: 'Descripción', tipo: 'texto', requerido: true, principal: true },
    ],
  },
  'unidades-medida': {
    ruta: '/inventario/unidades-medida',
    titulo: 'Unidades de Medida',
    subtitulo: 'Unidades de medida',
    idKey: 'unidadmedidaId',
    icono: 'pi-arrows-h',
    campos: [
      { key: 'descripcion', label: 'Descripción', tipo: 'texto', requerido: true, principal: true },
    ],
  },
  embalajes: {
    ruta: '/inventario/embalajes',
    titulo: 'Embalajes',
    subtitulo: 'Tipos de embalaje',
    idKey: 'embalajeId',
    icono: 'pi-shopping-bag',
    campos: [
      { key: 'descripcion', label: 'Descripción', tipo: 'texto', requerido: true, principal: true },
    ],
  },
  bodegas: {
    ruta: '/inventario/bodegas',
    titulo: 'Bodegas',
    subtitulo: 'Bodegas',
    idKey: 'bodegaId',
    icono: 'pi-building',
    campos: [
      { key: 'descripcion', label: 'Descripción', tipo: 'texto', requerido: true, principal: true },
    ],
  },
  ubicaciones: {
    ruta: '/inventario/ubicaciones',
    titulo: 'Ubicaciones',
    subtitulo: 'Ubicaciones',
    idKey: 'ubicacionId',
    icono: 'pi-map-marker',
    campos: [
      { key: 'descripcion', label: 'Descripción', tipo: 'texto', requerido: true, principal: true },
    ],
  },
  pasillos: {
    ruta: '/inventario/pasillos',
    titulo: 'Pasillos',
    subtitulo: 'Pasillos',
    idKey: 'pasilloId',
    icono: 'pi-directions',
    campos: [
      { key: 'descripcion', label: 'Descripción', tipo: 'texto', requerido: true, principal: true },
    ],
  },
  casas: {
    ruta: '/inventario/casas',
    titulo: 'Casas',
    subtitulo: 'Casas',
    idKey: 'casaId',
    icono: 'pi-home',
    campos: [
      { key: 'descripcion', label: 'Descripción', tipo: 'texto', requerido: true, principal: true },
    ],
  },
  testantes: {
    ruta: '/inventario/testantes',
    titulo: 'Testantes',
    subtitulo: 'Testantes',
    idKey: 'testanteId',
    icono: 'pi-verified',
    campos: [
      { key: 'descripcion', label: 'Descripción', tipo: 'texto', requerido: true, principal: true },
    ],
  },
  tags: {
    ruta: '/inventario/tags',
    titulo: 'Tags',
    subtitulo: 'Tags de productos',
    idKey: 'tagsId',
    icono: 'pi-hashtag',
    campos: [
      { key: 'descripcion', label: 'Descripción', tipo: 'texto', requerido: true, principal: true },
    ],
  },
};
