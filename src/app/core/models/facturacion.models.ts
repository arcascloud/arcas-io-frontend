import { CampoCatalogo } from './catalogo-parametros.models';

export interface CampoDetalle {
  key: string;
  label: string;
  tipo: 'texto' | 'numero' | 'fecha' | 'select';
  opciones?: { label: string; value: string }[];
  cargaOpciones?: { url: string; labelCampo: string; valueCampo: string };
  requerido?: boolean;
  oculto?: boolean;
  filtro?: boolean;
}

export interface CampoMae {
  key: string;
  label: string;
  tipo: 'texto' | 'numero' | 'select' | 'fecha';
  opciones?: { label: string; value: string }[];
  cargaOpciones?: { url: string; labelCampo: string; valueCampo: string };
  filtroAbreviaturas?: string[];
  requerido?: boolean;
  principal?: boolean;
  defaultValue?: any;
  oculto?: boolean;
  selector?: string;
  soloLectura?: boolean;
  filtro?: boolean;
}

export interface MaestroDetalleConfig {
  nombre: string;
  titulo: string;
  subtitulo: string;
  icono: string;
  rutaMae: string;
  rutaDet: string;
  rutaDetById?: string;
  idKeyMae: string;
  idKeyDet: string;
  fkDet: string;
  camposMae: CampoMae[];
  camposDet: CampoDetalle[];
  soloLectura?: boolean;
  tituloLista: (item: any) => string;
  filasLista: (item: any) => { label: string; value: any }[];
}

export const MAESTRO_DETALLE: Record<string, MaestroDetalleConfig> = {
  facturas: {
    nombre: 'facturas',
    titulo: 'Consulta de Facturas',
    subtitulo: 'Documentos de facturación',
    icono: 'file',
    soloLectura: true,
    rutaMae: '/facturacion/facturas',
    rutaDet: '/facturacion/facturas-det',
    rutaDetById: '/facturacion/facturas-det/factura',
    idKeyMae: 'facturaId',
    idKeyDet: 'posfacdetId',
    fkDet: 'facturaId',
    camposMae: [
      { key: 'nrofactura', label: 'Nro. Factura', tipo: 'numero', requerido: true },
      {
        key: 'tipofactura',
        label: 'Tipo',
        tipo: 'select',
        opciones: [
          { label: 'Efectivo', value: 'E' },
          { label: 'Crédito', value: 'C' },
        ],
        requerido: true,
      },
      {
        key: 'clienteId',
        label: 'Cliente',
        tipo: 'select',
        cargaOpciones: { url: '/cxc/clientes', labelCampo: 'nombres', valueCampo: 'clienteId' },
        requerido: true,
      },
      { key: 'nrocliente', label: 'Nro. Cliente', tipo: 'texto', requerido: true },
      { key: 'nombrecliente', label: 'Nombre Cliente', tipo: 'texto' },
      { key: 'direccion', label: 'Dirección', tipo: 'texto' },
      { key: 'factordecambio', label: 'Factor de Cambio', tipo: 'numero' },
      { key: 'subTotal', label: 'SubTotal', tipo: 'numero' },
      { key: 'impuesto', label: 'Impuesto', tipo: 'numero' },
      { key: 'descuento', label: 'Descuento', tipo: 'numero' },
      { key: 'total', label: 'Total', tipo: 'numero' },
      { key: 'efectivo_recibido', label: 'Efectivo Recibido', tipo: 'numero' },
      { key: 'importe_cambio', label: 'Cambio', tipo: 'numero' },
      { key: 'diascredito', label: 'Días Crédito', tipo: 'numero' },
      { key: 'fechavencimiento', label: 'Vencimiento', tipo: 'fecha' },
      {
        key: 'bodegaId',
        label: 'Bodega',
        tipo: 'select',
        cargaOpciones: { url: '/inventario/bodegas', labelCampo: 'descripcion', valueCampo: 'bodegaId' },
        requerido: true,
      },
      {
        key: 'cajaId',
        label: 'Caja',
        tipo: 'select',
        cargaOpciones: { url: '/cxc/cajeros', labelCampo: 'usuario', valueCampo: 'cajaId' },
        requerido: true,
      },
      {
        key: 'gestorId',
        label: 'Gestor',
        tipo: 'select',
        cargaOpciones: { url: '/parametros/gestores', labelCampo: 'nombre', valueCampo: 'g_gestorId' },
        requerido: true,
      },
      {
        key: 'sn_excenta',
        label: 'Exenta',
        tipo: 'select',
        opciones: [
          { label: 'Sí', value: 'S' },
          { label: 'No', value: 'N' },
        ],
      },
      { key: 'nrocarnet', label: 'Nro. Carnet', tipo: 'texto' },
      {
        key: 'sn_pagada',
        label: 'Pagada',
        tipo: 'select',
        opciones: [
          { label: 'Sí', value: 'S' },
          { label: 'No', value: 'N' },
        ],
      },
      {
        key: 'sn_anulada',
        label: 'Anulada',
        tipo: 'select',
        opciones: [
          { label: 'Sí', value: 'S' },
          { label: 'No', value: 'N' },
        ],
      },
      {
        key: 'sn_contabilizada',
        label: 'Contabilizada',
        tipo: 'select',
        opciones: [
          { label: 'Sí', value: 'S' },
          { label: 'No', value: 'N' },
        ],
      },
    ],
    camposDet: [
      { key: 'nrofila', label: 'Fila', tipo: 'numero' },
      { key: 'productoId', label: 'Producto', tipo: 'numero', requerido: true },
      { key: 'codbarra', label: 'Código', tipo: 'texto' },
      { key: 'cantidad', label: 'Cantidad', tipo: 'numero', requerido: true },
      { key: 'precioventa', label: 'Precio', tipo: 'numero' },
      { key: 'impuesto', label: 'Impuesto', tipo: 'numero' },
      { key: 'subTotal', label: 'SubTotal', tipo: 'numero' },
      { key: 'descuento', label: 'Descuento', tipo: 'numero' },
    ],
    tituloLista: (i) => `Factura #${i.nrofactura}`,
    filasLista: (i) => [
      { label: 'Fecha', value: i.fecharegistro ? new Date(i.fecharegistro).toLocaleString() : '-' },
      { label: 'Cliente', value: i.nombrecliente || i.nrocliente || '-' },
      { label: 'Total', value: i.total ?? 0 },
    ],
  },
  cotizaciones: {
    nombre: 'cotizaciones',
    titulo: 'Cotizaciones',
    subtitulo: 'Cotizaciones de venta',
    icono: 'file-edit',
    rutaMae: '/facturacion/cotizaciones',
    rutaDet: '/facturacion/cotizaciones-det',
    rutaDetById: '/facturacion/cotizaciones-det/mae',
    idKeyMae: 'poscotmaeId',
    idKeyDet: 'poscotdetId',
    fkDet: 'poscotmaeId',
    camposMae: [
      { key: 'Nombrecliente', label: 'Nombre Cliente', tipo: 'texto', requerido: true },
      { key: 'direccion', label: 'Dirección', tipo: 'texto', requerido: true },
      { key: 'atendio', label: 'Atendió', tipo: 'texto', requerido: true },
      {
        key: 'gestorId',
        label: 'Gestor',
        tipo: 'select',
        cargaOpciones: { url: '/parametros/gestores', labelCampo: 'nombre', valueCampo: 'g_gestorId' },
        requerido: true,
      },
    ],
    camposDet: [
      { key: 'productoId', label: 'Producto', tipo: 'texto', requerido: true },
      { key: 'codbarra', label: 'Código', tipo: 'texto' },
      { key: 'cantidad', label: 'Cantidad', tipo: 'numero', requerido: true },
      { key: 'precio', label: 'Precio', tipo: 'numero' },
      { key: 'subTotal', label: 'SubTotal', tipo: 'numero' },
    ],
    tituloLista: (i) => `Cotización #${i.poscotmaeId}`,
    filasLista: (i) => [
      { label: 'Fecha', value: i.fecharegistro ? new Date(i.fecharegistro).toLocaleString() : '-' },
      { label: 'Cliente', value: i.Nombrecliente || '-' },
      { label: 'Atendió', value: i.atendio || '-' },
    ],
  },
  pedidos: {
    nombre: 'pedidos',
    titulo: 'Pedidos',
    subtitulo: 'Pedidos de clientes',
    icono: 'shopping-cart',
    rutaMae: '/facturacion/pedidos',
    rutaDet: '/facturacion/pedidos-det',
    rutaDetById: '/facturacion/pedidos-det/pedido',
    idKeyMae: 'pospedmaeId',
    idKeyDet: 'pospeddetId',
    fkDet: 'pospedmaeId',
    camposMae: [
      { key: 'nombrecliente', label: 'Nombre Cliente', tipo: 'texto', requerido: true },
      { key: 'nrotelefono', label: 'Nro. Teléfono', tipo: 'texto', requerido: true },
      {
        key: 'sn_enviogratis',
        label: 'Envío Gratis',
        tipo: 'select',
        opciones: [
          { label: 'Sí', value: 'S' },
          { label: 'No', value: 'N' },
        ],
      },
      {
        key: 'sn_facturado',
        label: 'Facturado',
        tipo: 'select',
        opciones: [
          { label: 'Sí', value: 'S' },
          { label: 'No', value: 'N' },
        ],
      },
      { key: 'facturaId', label: 'Factura', tipo: 'numero' },
    ],
    camposDet: [
      { key: 'nrofila', label: 'Fila', tipo: 'numero' },
      { key: 'productoId', label: 'Producto', tipo: 'numero', requerido: true },
      { key: 'codbarra', label: 'Código', tipo: 'texto' },
      { key: 'cantidad', label: 'Cantidad', tipo: 'numero', requerido: true },
      { key: 'precioventa', label: 'Precio', tipo: 'numero' },
      { key: 'subtotal', label: 'SubTotal', tipo: 'numero' },
      { key: 'descuento', label: 'Descuento', tipo: 'numero' },
      { key: 'impuesto', label: 'Impuesto', tipo: 'numero' },
    ],
    tituloLista: (i) => `Pedido #${i.pospedmaeId}`,
    filasLista: (i) => [
      { label: 'Fecha', value: i.fecharegistro ? new Date(i.fecharegistro).toLocaleString() : '-' },
      { label: 'Cliente', value: i.nombrecliente || '-' },
      { label: 'Teléfono', value: i.nrotelefono || '-' },
    ],
  },
  combos: {
    nombre: 'combos',
    titulo: 'Combos',
    subtitulo: 'Combos de productos',
    icono: 'boxes',
    rutaMae: '/facturacion/combos',
    rutaDet: '/facturacion/combos-det',
    idKeyMae: 'poscbomaeId',
    idKeyDet: 'poscbodetId',
    fkDet: 'poscbomaeId',
    camposMae: [
      { key: 'descripcion', label: 'Descripción', tipo: 'texto' },
      { key: 'fec_vig_desde', label: 'Vigente Desde', tipo: 'fecha' },
      { key: 'fec_vig_hasta', label: 'Vigente Hasta', tipo: 'fecha' },
    ],
    camposDet: [
      { key: 'productoId', label: 'Producto', tipo: 'numero', requerido: true },
      { key: 'codbarra', label: 'Código', tipo: 'texto' },
      { key: 'cantidad', label: 'Cantidad', tipo: 'numero' },
      { key: 'precioventa', label: 'Precio', tipo: 'numero' },
    ],
    tituloLista: (i) => i.descripcion || `Combo #${i.poscbomaeId}`,
    filasLista: (i) => [
      { label: 'Vigente desde', value: i.fec_vig_desde ? new Date(i.fec_vig_desde).toLocaleDateString() : '-' },
      { label: 'Vigente hasta', value: i.fec_vig_hasta ? new Date(i.fec_vig_hasta).toLocaleDateString() : '-' },
    ],
  },
  caja: {
    nombre: 'caja',
    titulo: 'Caja',
    subtitulo: 'Abonos a cuenta de clientes',
    icono: 'money-bill-wave',
    rutaMae: '/cxc/caja-mae',
    rutaDet: '/cxc/caja-det',
    idKeyMae: 'cxccajaId',
    idKeyDet: 'cxccajadetId',
    fkDet: 'cxccajaId',
    camposMae: [
      { key: 'moduloId', label: 'Módulo', tipo: 'numero', defaultValue: 4, oculto: true },
      {
        key: 'clienteId',
        label: 'Cliente',
        tipo: 'select',
        cargaOpciones: { url: '/cxc/clientes-con-saldo', labelCampo: 'cliente', valueCampo: 'clienteId' },
        requerido: true,
        selector: 'abrirClientes',
        filtro: true,
      },
      { key: 'nrocliente', label: 'Nro. Cliente', tipo: 'texto', oculto: true },
      { key: 'nombrecliente', label: 'Nombre Cliente', tipo: 'texto', soloLectura: true },
      { key: 'concepto', label: 'Concepto', tipo: 'texto' },
      {
        key: 'documentoId',
        label: 'Tipo de documento fiscal',
        tipo: 'select',
        cargaOpciones: { url: '/parametros/tcotipodocumentofiscal', labelCampo: 'descripcion', valueCampo: 'tipodocumentofiscalId' },
        filtroAbreviaturas: ['FAC', 'NDB', 'PRE'],
      },
      { key: 'nrodocumento', label: 'Nro. Documento', tipo: 'select' },
      { key: 'tipomov', label: 'Tipo Mov.', tipo: 'texto', defaultValue: 'C', oculto: true },
      { key: 'sn_cotabilizada', label: 'Contabilizada', tipo: 'texto', defaultValue: 'N', oculto: true },
      { key: 'sn_anulado', label: 'Anulado', tipo: 'texto', defaultValue: 'N', oculto: true },
      { key: 'fec_anulacion', label: 'Fec. Anulación', tipo: 'fecha', defaultValue: null, oculto: true },
      { key: 'partidaId', label: 'Partida', tipo: 'numero', defaultValue: 0, oculto: true },
    ],
    camposDet: [
      { key: 'nrofila', label: 'Fila', tipo: 'numero', oculto: true },
      {
        key: 'formapagoId',
        label: 'Forma de Pago',
        tipo: 'select',
        cargaOpciones: { url: '/parametros/formas-pago', labelCampo: 'descripcion', valueCampo: 'formapagoId' },
        requerido: true,
        filtro: true,
      },
      { key: 'importe', label: 'Importe', tipo: 'numero', requerido: true },
      {
        key: 'tarjetacreditoId',
        label: 'Tarjeta',
        tipo: 'select',
        cargaOpciones: { url: '/parametros/tarjetas-credito', labelCampo: 'descripcion', valueCampo: 'tarjetacreditoId' },
        filtro: true,
      },
      { key: 'nrotarjeta', label: 'Nro. Tarjeta', tipo: 'texto' },
      { key: 'nroautorizacion', label: 'Autorización', tipo: 'texto' },
      { key: 'factordecambio', label: 'Factor Cambio', tipo: 'numero', oculto: true },
    ],
    tituloLista: (i) => `Caja #${i.cxccajaId}`,
    filasLista: (i) => [
      { label: 'Fecha', value: i.fecharegistro ? new Date(i.fecharegistro).toLocaleString() : '-' },
      { label: 'Cliente', value: i.nrocliente || '-' },
      { label: 'Documento', value: i.nrodocumento || '-' },
    ],
  },
  prestamos: {
    nombre: 'prestamos',
    titulo: 'Préstamos',
    subtitulo: 'Préstamos y plan de pagos',
    icono: 'hand-holding-usd',
    rutaMae: '/cxc/prestamos',
    rutaDet: '/cxc/prestamo-pp',
    idKeyMae: 'prestamoId',
    idKeyDet: 'pppId',
    fkDet: 'prestamoId',
    camposMae: [
      { key: 'nroprestamo', label: 'Nro. Préstamo', tipo: 'numero', requerido: true },
      {
        key: 'clienteId',
        label: 'Cliente',
        tipo: 'select',
        cargaOpciones: { url: '/cxc/clientes', labelCampo: 'nombres', valueCampo: 'clienteId' },
        requerido: true,
      },
      { key: 'capital', label: 'Capital', tipo: 'numero' },
      { key: 'prima', label: 'Prima', tipo: 'numero' },
      { key: 'capitalneto', label: 'Capital Neto', tipo: 'numero' },
      { key: 'tasa', label: 'Tasa', tipo: 'numero' },
      { key: 'cuotas', label: 'Cuotas', tipo: 'numero' },
      { key: 'diascuotas', label: 'Días Cuota', tipo: 'numero' },
      { key: 'moratorio', label: 'Moratorio', tipo: 'numero' },
      {
        key: 'gestorId',
        label: 'Gestor',
        tipo: 'select',
        cargaOpciones: { url: '/parametros/gestores', labelCampo: 'nombre', valueCampo: 'g_gestorId' },
      },
      {
        key: 'monedaId',
        label: 'Moneda',
        tipo: 'select',
        cargaOpciones: { url: '/parametros/monedas', labelCampo: 'descripcion', valueCampo: 'monedaId' },
      },
      { key: 'gracia', label: 'Gracia', tipo: 'numero' },
      { key: 'ultcuotapagada', label: 'Últ. Cuota Pagada', tipo: 'numero' },
      {
        key: 'sn_activo',
        label: 'Activo',
        tipo: 'select',
        opciones: [
          { label: 'Sí', value: 'S' },
          { label: 'No', value: 'N' },
        ],
      },
      { key: 'sn_contabilizado', label: 'Contabilizado', tipo: 'numero' },
    ],
    camposDet: [
      { key: 'FechaPago', label: 'Fecha Pago', tipo: 'fecha', requerido: true },
      { key: 'clienteId', label: 'Cliente', tipo: 'numero' },
      { key: 'nrofila', label: 'Fila', tipo: 'numero' },
      { key: 'vlrcuota', label: 'Valor Cuota', tipo: 'numero' },
      { key: 'capital', label: 'Capital', tipo: 'numero' },
      { key: 'interes', label: 'Interés', tipo: 'numero' },
      { key: 'mora', label: 'Mora', tipo: 'numero' },
      { key: 'saldo', label: 'Saldo', tipo: 'numero' },
      { key: 'diasvencido', label: 'Días Vencido', tipo: 'numero' },
      { key: 'sn_pagada', label: 'Pagada', tipo: 'texto' },
      { key: 'sn_anulada', label: 'Anulada', tipo: 'texto' },
    ],
    tituloLista: (i) => `Préstamo #${i.nroprestamo ?? i.prestamoId}`,
    filasLista: (i) => [
      { label: 'Fecha', value: i.fecharegistro ? new Date(i.fecharegistro).toLocaleString() : '-' },
      { label: 'Cliente', value: i.clienteId ?? '-' },
      { label: 'Capital', value: i.capital ?? 0 },
    ],
  },
  planillas: {
    nombre: 'planillas',
    titulo: 'Planillas',
    subtitulo: 'Planillas de pago por periodo',
    icono: 'money-check',
    rutaMae: '/planilla/planillas',
    rutaDet: '/planilla/planilla-det',
    idKeyMae: 'planillaId',
    idKeyDet: 'plepladetId',
    fkDet: 'planillaId',
    camposMae: [
      { key: 'periodo', label: 'Periodo', tipo: 'numero', requerido: true },
      { key: 'anio', label: 'Año', tipo: 'numero', requerido: true },
      {
        key: 'bcoctasId',
        label: 'Cuenta Bancaria',
        tipo: 'select',
        cargaOpciones: { url: '/bancos/cuentas', labelCampo: 'nrocuenta', valueCampo: 'bcoctasId' },
        requerido: true,
      },
      { key: 'items', label: 'Items', tipo: 'numero' },
      {
        key: 'sn_pagada',
        label: 'Pagada',
        tipo: 'select',
        opciones: [
          { label: 'Sí', value: 'S' },
          { label: 'No', value: 'N' },
        ],
      },
      {
        key: 'sn_anulada',
        label: 'Anulada',
        tipo: 'select',
        opciones: [
          { label: 'Sí', value: 'S' },
          { label: 'No', value: 'N' },
        ],
      },
      { key: 'totalapagar', label: 'Total a Pagar', tipo: 'numero' },
    ],
    camposDet: [
      { key: 'empleadoId', label: 'Empleado', tipo: 'numero', requerido: true },
      { key: 'departamentoId', label: 'Departamento', tipo: 'numero' },
      { key: 'sueldobruto', label: 'Sueldo Bruto', tipo: 'numero' },
      { key: 'importe_dihss', label: 'DHSS', tipo: 'numero' },
      { key: 'importe_drap', label: 'RAP', tipo: 'numero' },
      { key: 'importe_drtf', label: 'RTF', tipo: 'numero' },
      { key: 'importe_dotras', label: 'Otras Ded.', tipo: 'numero' },
      { key: 'importe_ccomision', label: 'Comisiones', tipo: 'numero' },
      { key: 'importe_chorasextras', label: 'H. Extras', tipo: 'numero' },
      { key: 'importe_cbonos', label: 'Bonos', tipo: 'numero' },
      { key: 'sueldoneto', label: 'Sueldo Neto', tipo: 'numero' },
      { key: 'sn_pagar', label: 'Pagar', tipo: 'texto' },
    ],
    tituloLista: (i) => `Planilla ${i.periodo}/${i.anio}`,
    filasLista: (i) => [
      { label: 'Periodo', value: `${i.periodo}/${i.anio}` },
      { label: 'Items', value: i.items ?? 0 },
      { label: 'Total a Pagar', value: i.totalapagar ?? 0 },
    ],
  },
  plantillapda: {
    nombre: 'plantillapda',
    titulo: 'Plantillas PDA',
    subtitulo: 'Plantillas de partida de diario automática',
    icono: 'file-edit',
    rutaMae: '/contabilidad/plantillapdamae',
    rutaDet: '/contabilidad/plantillapdadet',
    idKeyMae: 'tcoplantillapdamaeId',
    idKeyDet: 'tcoplantillapdadetId',
    fkDet: 'tcoplantillapdamaeId',
    camposMae: [
      { key: 'descripcion', label: 'Descripción', tipo: 'texto', requerido: true, principal: true },
      { key: 'moduloId', label: 'Módulo', tipo: 'numero', requerido: true },
    ],
    camposDet: [
      { key: 'nrofila', label: 'Fila', tipo: 'numero' },
      { key: 'ctacontable', label: 'Cuenta', tipo: 'texto' },
      { key: 'descripcion', label: 'Descripción', tipo: 'texto' },
      { key: 'moduloId', label: 'Módulo', tipo: 'numero' },
      { key: 'naturaleza', label: 'Naturaleza', tipo: 'texto' },
    ],
    tituloLista: (i) => i.descripcion || `Plantilla #${i.tcoplantillapdamaeId}`,
    filasLista: (i) => [
      { label: 'Módulo', value: i.moduloId ?? '-' },
    ],
  },
  plantillabalances: {
    nombre: 'plantillabalances',
    titulo: 'Plantillas de Balances',
    subtitulo: 'Definición de reportes de balance',
    icono: 'chart-pie',
    rutaMae: '/contabilidad/plantillabalancesmae',
    rutaDet: '/contabilidad/plantillabalancesdet',
    idKeyMae: 'cocdefbalmaId',
    idKeyDet: 'tcoplantillabalancesdetid',
    fkDet: 'cocdefbalmaId',
    camposMae: [
      { key: 'descripcion', label: 'Descripción', tipo: 'texto', requerido: true, principal: true },
    ],
    camposDet: [
      { key: 'tipo', label: 'Tipo', tipo: 'texto' },
      { key: 'ctacontable', label: 'Cuenta', tipo: 'texto' },
      { key: 'descripcion', label: 'Descripción', tipo: 'texto' },
      { key: 'columna', label: 'Columna', tipo: 'numero' },
      { key: 'renglon', label: 'Renglón', tipo: 'numero' },
      { key: 'sn_activo', label: 'Activo', tipo: 'texto' },
    ],
    tituloLista: (i) => i.descripcion || `Plantilla #${i.cocdefbalmaId}`,
    filasLista: (i) => [
      { label: 'Descripción', value: i.descripcion || '-' },
    ],
  },
  copda: {
    nombre: 'copda',
    titulo: 'Partidas de Diario',
    subtitulo: 'Partidas de diario automáticas',
    icono: 'receipt',
    rutaMae: '/contabilidad/copdamae',
    rutaDet: '/contabilidad/copdadet',
    idKeyMae: 'partidaId',
    idKeyDet: 'copdadetId',
    fkDet: 'partidaId',
    camposMae: [
      { key: 'periodo', label: 'Periodo', tipo: 'numero', requerido: true },
      { key: 'anio', label: 'Año', tipo: 'numero', requerido: true },
      { key: 'moduloId', label: 'Módulo', tipo: 'numero', requerido: true },
      { key: 'documentoId', label: 'Documento', tipo: 'numero', requerido: true },
      { key: 'fechadocumento', label: 'Fecha Doc.', tipo: 'fecha' },
      { key: 'factordecambio', label: 'Factor Cambio', tipo: 'numero' },
      { key: 'nroreferencia', label: 'Nro. Referencia', tipo: 'texto' },
      { key: 'descripcion', label: 'Descripción', tipo: 'texto' },
      { key: 'nropartida', label: 'Nro. Partida', tipo: 'numero' },
    ],
    camposDet: [
      { key: 'periodo', label: 'Periodo', tipo: 'numero' },
      { key: 'anio', label: 'Año', tipo: 'numero' },
      { key: 'nropartida', label: 'Nro. Partida', tipo: 'numero' },
      { key: 'moduloId', label: 'Módulo', tipo: 'numero' },
      { key: 'nrofila', label: 'Fila', tipo: 'numero' },
      { key: 'ctacontable', label: 'Cuenta', tipo: 'texto' },
      { key: 'descripcion', label: 'Descripción', tipo: 'texto' },
      { key: 'debito', label: 'Débito', tipo: 'numero' },
      { key: 'credito', label: 'Crédito', tipo: 'numero' },
      { key: 'factordecambio', label: 'Factor', tipo: 'numero' },
    ],
    tituloLista: (i) => `Partida #${i.nropartida ?? i.partidaId}`,
    filasLista: (i) => [
      { label: 'Fecha', value: i.fechadocumento ? new Date(i.fechadocumento).toLocaleDateString() : '-' },
      { label: 'Descripción', value: i.descripcion || '-' },
      { label: 'Referencia', value: i.nroreferencia || '-' },
    ],
  },
  'facturas-anul': {
    nombre: 'facturas-anul',
    titulo: 'Anular Factura',
    subtitulo: 'Registro de facturas anuladas',
    icono: 'file-times',
    soloLectura: true,
    rutaMae: '/facturacion/facturas-anul',
    rutaDet: '/facturacion/facturas-det-anul',
    idKeyMae: 'posfacmaeanulId',
    idKeyDet: 'posfacdetanulacionId',
    fkDet: 'posfacmaeanulId',
    camposMae: [
      { key: 'facturaId', label: 'Nro. Factura', tipo: 'numero', requerido: true },
      {
        key: 'bodegaId',
        label: 'Bodega',
        tipo: 'select',
        cargaOpciones: { url: '/inventario/bodegas', labelCampo: 'descripcion', valueCampo: 'bodegaId' },
      },
      {
        key: 'clienteId',
        label: 'Cliente',
        tipo: 'select',
        cargaOpciones: { url: '/cxc/clientes', labelCampo: 'nombres', valueCampo: 'clienteId' },
        requerido: true,
      },
      { key: 'nrocliente', label: 'Nro. Cliente', tipo: 'texto', requerido: true },
      {
        key: 'sn_excento',
        label: 'Exenta',
        tipo: 'select',
        opciones: [
          { label: 'Sí', value: 'S' },
          { label: 'No', value: 'N' },
        ],
      },
      { key: 'factordecambio', label: 'Factor de Cambio', tipo: 'numero' },
      { key: 'subTotal', label: 'SubTotal', tipo: 'numero' },
      { key: 'impuesto', label: 'Impuesto', tipo: 'numero' },
      { key: 'descuento', label: 'Descuento', tipo: 'numero' },
      { key: 'total', label: 'Total', tipo: 'numero' },
      { key: 'observacion', label: 'Observación', tipo: 'texto' },
      {
        key: 'estado',
        label: 'Estado',
        tipo: 'select',
        opciones: [
          { label: 'Sí', value: 'S' },
          { label: 'No', value: 'N' },
        ],
      },
    ],
    camposDet: [
      { key: 'bodegaId', label: 'Bodega', tipo: 'numero' },
      { key: 'productoId', label: 'Producto', tipo: 'numero', requerido: true },
      { key: 'codbarra', label: 'Código', tipo: 'texto' },
      { key: 'cantidad', label: 'Cantidad', tipo: 'numero', requerido: true },
      { key: 'precio', label: 'Precio', tipo: 'numero' },
      { key: 'subTotal', label: 'SubTotal', tipo: 'numero' },
    ],
    tituloLista: (i) => `Anulación de Factura #${i.facturaId}`,
    filasLista: (i) => [
      { label: 'Fecha', value: i.fecharegistro ? new Date(i.fecharegistro).toLocaleString() : '-' },
      { label: 'Cliente', value: i.nrocliente || '-' },
      { label: 'Total', value: i.total ?? 0 },
    ],
  },
};