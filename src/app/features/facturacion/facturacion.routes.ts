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
    path: 'nueva-factura',
    loadComponent: () =>
      import('./nueva-factura/nueva-factura').then((m) => m.NuevaFactura),
  },
  {
    path: 'tienda',
    loadComponent: () =>
      import('./tienda/tienda-virtual').then((m) => m.TiendaVirtual),
  },
  {
    path: 'pedidos-virtual',
    loadComponent: () =>
      import('./pedidos-virtual/pedidos-virtual').then((m) => m.PedidosVirtual),
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
    loadComponent: () =>
      import('./pedidos/pedidos-list').then((m) => m.PedidosList),
  },
  {
    path: 'pedidos/editar/:id',
    loadComponent: () =>
      import('./pedidos/pedido-form').then((m) => m.PedidoForm),
  },
  {
    path: 'combos',
    loadComponent: () =>
      import('./combos/combos-list').then((m) => m.CombosList),
  },
  {
    path: 'combos/editar/:id',
    loadComponent: () =>
      import('./combos/combos-form').then((m) => m.CombosForm),
  },
  {
    path: 'facturas-anul',
    loadComponent: () =>
      import('./anular-facturas/anular-facturas').then((m) => m.AnularFacturas),
  },
  {
    path: 'pago-confirmado',
    loadComponent: () =>
      import('./pago-confirmado/pago-confirmado').then((m) => m.PagoConfirmado),
  },
  {
    path: 'todopago',
    loadComponent: () =>
      import('./todopago/todopago').then((m) => m.TodoPago),
  },
  { path: '**', redirectTo: 'consultas' },
];
