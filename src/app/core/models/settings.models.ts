export interface CampoSetting {
  key: string;
  label: string;
  tipo: 'texto' | 'numero' | 'select';
  opciones?: { label: string; value: string }[];
}

export interface SettingsConfig {
  ruta: string;
  titulo: string;
  subtitulo: string;
  campos: CampoSetting[];
}

export const SETTINGS: Record<string, SettingsConfig> = {
  'param-bco': {
    ruta: '/parametros/param-bco',
    titulo: 'Parámetros de Bancos',
    subtitulo: 'Configuración general del módulo de bancos',
    campos: [],
  },
  'param-con': {
    ruta: '/parametros/param-con',
    titulo: 'Parámetros de Contabilidad',
    subtitulo: 'Configuración general del módulo de contabilidad',
    campos: [
      { key: 'nropartida', label: 'Nro. Partida', tipo: 'numero' },
      { key: 'periodofiscal', label: 'Periodo Fiscal', tipo: 'numero' },
      { key: 'aniofiscal', label: 'Año Fiscal', tipo: 'numero' },
      { key: 'monedafiscalId', label: 'Moneda Fiscal', tipo: 'numero' },
      { key: 'mascaracta', label: 'Máscara de Cuenta', tipo: 'texto' },
      { key: 'nombrecontador', label: 'Contador', tipo: 'texto' },
      { key: 'nombregerente', label: 'Gerente', tipo: 'texto' },
      { key: 'nombreauditor', label: 'Auditor', tipo: 'texto' },
    ],
  },
  'param-cxc': {
    ruta: '/parametros/param-cxc',
    titulo: 'Parámetros de CxC',
    subtitulo: 'Configuración general de cuentas por cobrar',
    campos: [
      { key: 'nrocliente', label: 'Nro. Cliente', tipo: 'numero' },
      { key: 'interes', label: 'Interés (%)', tipo: 'numero' },
      { key: 'mora', label: 'Mora (%)', tipo: 'numero' },
      { key: 'diasPlazo', label: 'Días Plazo', tipo: 'numero' },
      { key: 'limitecredito', label: 'Límite Crédito', tipo: 'numero' },
      { key: 'ctacontable', label: 'Cuenta Contable', tipo: 'texto' },
    ],
  },
  'param-cxp': {
    ruta: '/parametros/param-cxp',
    titulo: 'Parámetros de CxP',
    subtitulo: 'Configuración general de cuentas por pagar',
    campos: [
      { key: 'nroproveedor', label: 'Nro. Proveedor', tipo: 'numero' },
      { key: 'interes', label: 'Interés (%)', tipo: 'numero' },
      { key: 'mora', label: 'Mora (%)', tipo: 'numero' },
      { key: 'diasPlazo', label: 'Días Plazo', tipo: 'numero' },
      { key: 'limitecredito', label: 'Límite Crédito', tipo: 'numero' },
      { key: 'ctacontable', label: 'Cuenta Contable', tipo: 'texto' },
    ],
  },
  'param-fac': {
    ruta: '/parametros/param-fac',
    titulo: 'Parámetros de Facturación',
    subtitulo: 'Configuración general de facturación',
    campos: [
      { key: 'bodegaId', label: 'Bodega', tipo: 'numero' },
      { key: 'nrofactura', label: 'Nro. Factura', tipo: 'numero' },
      { key: 'nrocotizacion', label: 'Nro. Cotización', tipo: 'numero' },
      { key: 'nroanulacion', label: 'Nro. Anulación', tipo: 'numero' },
      { key: 'impuestoId', label: 'Impuesto', tipo: 'numero' },
      { key: 'lineasFactura', label: 'Líneas Factura', tipo: 'numero' },
      { key: 'diasDevolucion', label: 'Días Devolución', tipo: 'numero' },
      { key: 'porcentajeDevolucion', label: '% Devolución', tipo: 'numero' },
      { key: 'nrodpdaventas', label: 'Nro. PDA Ventas', tipo: 'numero' },
      { key: 'nropdadevolucion', label: 'Nro. PDA Devolución', tipo: 'numero' },
      { key: 'nropdaanulacion', label: 'Nro. PDA Anulación', tipo: 'numero' },
      {
        key: 'sn_integrado_cxc',
        label: 'Integrado CxC',
        tipo: 'select',
        opciones: [
          { label: 'Sí', value: 'S' },
          { label: 'No', value: 'N' },
        ],
      },
      {
        key: 'sn_puntoventa',
        label: 'Punto de Venta',
        tipo: 'select',
        opciones: [
          { label: 'Sí', value: 'S' },
          { label: 'No', value: 'N' },
        ],
      },
      {
        key: 'sn_integrado_caja',
        label: 'Integrado Caja',
        tipo: 'select',
        opciones: [
          { label: 'Sí', value: 'S' },
          { label: 'No', value: 'N' },
        ],
      },
      {
        key: 'sn_anticipos',
        label: 'Anticipos',
        tipo: 'select',
        opciones: [
          { label: 'Sí', value: 'S' },
          { label: 'No', value: 'N' },
        ],
      },
      { key: 'mensajeFactura', label: 'Mensaje Factura', tipo: 'texto' },
      {
        key: 'sn_correlativoUnico',
        label: 'Correlativo Único',
        tipo: 'select',
        opciones: [
          { label: 'Sí', value: 'S' },
          { label: 'No', value: 'N' },
        ],
      },
      { key: 'mg_t', label: 'Margen T', tipo: 'numero' },
      { key: 'mg_b', label: 'Margen B', tipo: 'numero' },
      { key: 'mg_l', label: 'Margen L', tipo: 'numero' },
      { key: 'mg_d', label: 'Margen D', tipo: 'numero' },
      {
        key: 'sn_multiplezcajeros',
        label: 'Múltiples Cajeros',
        tipo: 'select',
        opciones: [
          { label: 'Sí', value: 'S' },
          { label: 'No', value: 'N' },
        ],
      },
      {
        key: 'sn_imprimefactura',
        label: 'Imprime Factura',
        tipo: 'select',
        opciones: [
          { label: 'Sí', value: 'S' },
          { label: 'No', value: 'N' },
        ],
      },
      { key: 'ImpresoraFactura', label: 'Impresora Factura', tipo: 'texto' },
      { key: 'ImpresoraComprobante', label: 'Impresora Comprobante', tipo: 'texto' },
      { key: 'ImpresoraMadera', label: 'Impresora Madera', tipo: 'texto' },
      { key: 'ImpresoraRecibo', label: 'Impresora Recibo', tipo: 'texto' },
      { key: 'DriverImpresora1', label: 'Driver Impresora 1', tipo: 'texto' },
      { key: 'DriverImpresora2', label: 'Driver Impresora 2', tipo: 'texto' },
      { key: 'DriverImpresora3', label: 'Driver Impresora 3', tipo: 'texto' },
      { key: 'DriverImpresora4', label: 'Driver Impresora 4', tipo: 'texto' },
      { key: 'Puerto1', label: 'Puerto 1', tipo: 'texto' },
      { key: 'Puerto2', label: 'Puerto 2', tipo: 'texto' },
      { key: 'Puerto3', label: 'Puerto 3', tipo: 'texto' },
      { key: 'Puerto4', label: 'Puerto 4', tipo: 'texto' },
      {
        key: 'sn_multipleempresa',
        label: 'Múltiple Empresa',
        tipo: 'select',
        opciones: [
          { label: 'Sí', value: 'S' },
          { label: 'No', value: 'N' },
        ],
      },
      {
        key: 'sn_impuestoincluido',
        label: 'Impuesto Incluido',
        tipo: 'select',
        opciones: [
          { label: 'Sí', value: 'S' },
          { label: 'No', value: 'N' },
        ],
      },
    ],
  },
  'param-inv': {
    ruta: '/parametros/param-inv',
    titulo: 'Parámetros de Inventario',
    subtitulo: 'Configuración general de inventario',
    campos: [
      { key: 'bodegaId', label: 'Bodega', tipo: 'numero' },
      { key: 'nrocompra', label: 'Nro. Compra', tipo: 'numero' },
      { key: 'nrotrasladoo', label: 'Nro. Traslado', tipo: 'numero' },
      { key: 'nroajuste', label: 'Nro. Ajuste', tipo: 'numero' },
      { key: 'nrofisico', label: 'Nro. Físico', tipo: 'numero' },
      { key: 'nrorequisicion', label: 'Nro. Requisición', tipo: 'numero' },
      { key: 'ImpuestoCompra', label: 'Impuesto Compra', tipo: 'numero' },
      { key: 'ImpuestoVenta', label: 'Impuesto Venta', tipo: 'numero' },
      { key: 'nropartida', label: 'Nro. Partida', tipo: 'numero' },
      {
        key: 'sn_requirelote',
        label: 'Requiere Lote',
        tipo: 'select',
        opciones: [
          { label: 'Sí', value: 'S' },
          { label: 'No', value: 'N' },
        ],
      },
      {
        key: 'sn_supermercado',
        label: 'Supermercado',
        tipo: 'select',
        opciones: [
          { label: 'Sí', value: 'S' },
          { label: 'No', value: 'N' },
        ],
      },
      {
        key: 'sn_multiplesprecios',
        label: 'Múltiples Precios',
        tipo: 'select',
        opciones: [
          { label: 'Sí', value: 'S' },
          { label: 'No', value: 'N' },
        ],
      },
    ],
  },
  'param-pap': {
    ruta: '/parametros/param-pap',
    titulo: 'Parámetros de Papelería',
    subtitulo: 'Configuración general de papelería',
    campos: [
      { key: 'moduloId', label: 'Módulo', tipo: 'numero' },
      { key: 'proforma', label: 'Proforma', tipo: 'texto' },
      { key: 'reporte', label: 'Reporte', tipo: 'texto' },
    ],
  },
  'param-pla': {
    ruta: '/parametros/param-pla',
    titulo: 'Parámetros de Planilla',
    subtitulo: 'Configuración general de planilla',
    campos: [
      { key: 'nropartida', label: 'Nro. Partida', tipo: 'numero' },
      { key: 'nroplanilla', label: 'Nro. Planilla', tipo: 'numero' },
      { key: 'techo', label: 'Techo', tipo: 'numero' },
      {
        key: 'sn_validatecho',
        label: 'Valida Techo',
        tipo: 'select',
        opciones: [
          { label: 'Sí', value: 'S' },
          { label: 'No', value: 'N' },
        ],
      },
      { key: 'diaslaborales', label: 'Días Laborales', tipo: 'numero' },
    ],
  },
  'param-pres': {
    ruta: '/parametros/param-pres',
    titulo: 'Parámetros de Préstamos',
    subtitulo: 'Configuración general de préstamos',
    campos: [
      { key: 'interes', label: 'Interés (%)', tipo: 'numero' },
      { key: 'mora', label: 'Mora (%)', tipo: 'numero' },
      { key: 'diasPlazo', label: 'Días Plazo', tipo: 'numero' },
      { key: 'limitecredito', label: 'Límite Crédito', tipo: 'numero' },
      { key: 'ctacontable', label: 'Cuenta Contable', tipo: 'texto' },
    ],
  },
  'param-ia': {
    ruta: '/parametros/param-ia',
    titulo: 'Configuración de IA',
    subtitulo: 'Proveedores y modelos de inteligencia artificial',
    campos: [
      {
        key: 'proveedor',
        label: 'Proveedor',
        tipo: 'select',
        opciones: [
          { label: 'ZenMux', value: 'zenmux' },
          { label: 'OpenAI', value: 'openai' },
          { label: 'Anthropic', value: 'anthropic' },
          { label: 'Otro', value: 'otro' },
        ],
      },
      { key: 'modelo', label: 'Modelo', tipo: 'texto' },
      { key: 'apiKey', label: 'API Key', tipo: 'texto' },
      { key: 'baseUrl', label: 'Base URL', tipo: 'texto' },
      { key: 'temperatura', label: 'Temperatura', tipo: 'numero' },
      { key: 'maxTokens', label: 'Max Tokens', tipo: 'numero' },
    ],
  },
};