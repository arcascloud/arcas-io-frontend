import { Routes } from '@angular/router';
export const FACTURACION_ROUTES: Routes = [
  { path: '', redirectTo: 'consultas', pathMatch: 'full' },
  {
    path: 'precios',
    data: { nombre: 'precios' },
    loadComponent: () =>
      import('../parametros/catalogo-generico/catalogo-generico').then((m) => m.CatalogoGenerico),
  },
  {
    path: 'precios/editar/:id',
    data: { nombre: 'precios' },
    loadComponent: () =>
      import('../parametros/catalogo-generico/catalogo-form').then((m) => m.CatalogoForm),
  },
  {
    path: 'descuentos',
    data: { nombre: 'descuentos' },
    loadComponent: () =>
      import('../parametros/catalogo-generico/catalogo-generico').then((m) => m.CatalogoGenerico),
  },
  {
    path: 'descuentos/editar/:id',
    data: { nombre: 'descuentos' },
    loadComponent: () =>
      import('../parametros/catalogo-generico/catalogo-form').then((m) => m.CatalogoForm),
  },
  {
    path: 'caja',
    loadComponent: () => import('./caja/caja-manager').then((m) => m.CajaManagerComponent),
  },
  {
    path: 'caja-unica',
    loadComponent: () => import('./caja-unica/caja-unica').then((m) => m.CajaUnica),
  },
  {
    path: 'nueva-factura',
    loadComponent: () => import('./nueva-factura/nueva-factura').then((m) => m.NuevaFactura),
  },
  {
    path: 'pos-rapido',
    loadComponent: () => import('./pos-rapido/pos-rapido').then((m) => m.PosRapido),
  },
  {
    path: 'pos-rapido/pagar',
    loadComponent: () => import('./pos-pagar/pos-pagar').then((m) => m.PosPagar),
  },
  {
    path: 'pos-asesor',
    loadComponent: () =>
      import('./pos-asesor-no-pago/pos-asesor-no-pago').then((m) => m.PosAsesorNoPago),
  },
  {
    path: 'tienda',
    loadComponent: () => import('./tienda/tienda-virtual').then((m) => m.TiendaVirtual),
  },
  {
    path: 'pedidos-virtual',
    loadComponent: () => import('./pedidos-virtual/pedidos-virtual').then((m) => m.PedidosVirtual),
  },
  {
    path: 'pedidos-virtual/:id',
    loadComponent: () => import('./pedidos-virtual/pedidos-virtual').then((m) => m.PedidosVirtual),
  },
  {
    path: 'dashboardId3',
    loadComponent: () =>
      import('./dashboard-id3/dashboard-id3').then((m) => m.DashboardId3Component),
  },
  {
    path: 'consultas',
    loadComponent: () =>
      import('./consulta-facturas/consulta-facturas').then((m) => m.ConsultaFacturas),
  },
  {
    path: 'consultas/:id',
    loadComponent: () =>
      import('./consulta-facturas/consulta-factura-detalle').then((m) => m.ConsultaFacturaDetalle),
  },
  {
    path: 'cotizaciones',
    loadComponent: () =>
      import('./cotizaciones/cotizaciones-list/cotizaciones-list').then((m) => m.CotizacionesList),
  },
  {
    path: 'cotizaciones/editar/:id',
    loadComponent: () =>
      import('./cotizaciones/cotizaciones-form/cotizaciones-form').then((m) => m.CotizacionesForm),
  },
  {
    path: 'pedidos',
    loadComponent: () => import('./pedidos/pedidos-list').then((m) => m.PedidosList),
  },
  {
    path: 'pedidos/editar/:id',
    loadComponent: () => import('./pedidos/pedido-form').then((m) => m.PedidoForm),
  },
  {
    path: 'combos',
    loadComponent: () => import('./combos/combos-list').then((m) => m.CombosList),
  },
  {
    path: 'combos/editar/:id',
    loadComponent: () => import('./combos/combos-form').then((m) => m.CombosForm),
  },
  {
    path: 'facturas-anul',
    loadComponent: () => import('./anular-facturas/anular-facturas').then((m) => m.AnularFacturas),
  },
  {
    path: 'pago-confirmado',
    loadComponent: () => import('./pago-confirmado/pago-confirmado').then((m) => m.PagoConfirmado),
  },
  {
    path: 'todopago',
    loadComponent: () => import('./todopago/todopago').then((m) => m.TodoPago),
  },
  {
    path: 'restaurante',
    loadComponent: () => import('./restaurante/restaurante').then((m) => m.Restaurante),
  },
  {
    path: 'restaurante-mesero',
    loadComponent: () =>
      import('./restaurante-mesero/restaurante-mesero').then((m) => m.RestauranteMesero),
  },
  {
    path: 'restaurante-caja',
    loadComponent: () =>
      import('./restaurante-caja/restaurante-caja').then((m) => m.RestauranteCaja),
  },
  {
    path: 'restaurante-cocina',
    loadComponent: () =>
      import('./restaurante-cocina/restaurante-cocina').then((m) => m.RestauranteCocina),
  },
  {
    path: 'reportes/facturas-rango',
    loadComponent: () =>
      import('../reportes/facturacion/facturas-rango/facturas-rango').then(
        (m) => m.FacturasRangoReport,
      ),
  },
  {
    path: 'reportes/facturas-gestor',
    loadComponent: () =>
      import('../reportes/facturacion/facturas-gestor/facturas-gestor').then(
        (m) => m.FacturasGestorReport,
      ),
  },
  {
    path: 'reportes/facturas-anuladas',
    loadComponent: () =>
      import('../reportes/facturacion/facturas-anuladas/facturas-anuladas').then(
        (m) => m.FacturasAnuladasReport,
      ),
  },
  {
    path: 'reportes/facturas-por-tipo',
    loadComponent: () =>
      import('../reportes/facturacion/facturas-por-tipo/facturas-por-tipo').then(
        (m) => m.FacturasPorTipoReport,
      ),
  },
  {
    path: 'reportes/facturas-por-forma-pago',
    loadComponent: () =>
      import('../reportes/facturacion/facturas-por-forma-pago/facturas-por-forma-pago').then(
        (m) => m.FacturasPorFormaPagoReport,
      ),
  },
  { path: '**', redirectTo: 'consultas' },
];
