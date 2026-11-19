import { Routes } from '@angular/router';

export const REPORTES_ROUTES: Routes = [
  { path: '', redirectTo: 'facturacion/facturas-rango', pathMatch: 'full' },
  {
    path: 'facturacion/facturas-rango',
    loadComponent: () =>
      import('./facturacion/facturas-rango/facturas-rango').then((m) => m.FacturasRangoReport),
  },
  {
    path: 'facturacion/facturas-gestor',
    loadComponent: () =>
      import('./facturacion/facturas-gestor/facturas-gestor').then((m) => m.FacturasGestorReport),
  },
  {
    path: 'facturacion/facturas-anuladas',
    loadComponent: () =>
      import('./facturacion/facturas-anuladas/facturas-anuladas').then((m) => m.FacturasAnuladasReport),
  },
  {
    path: 'facturacion/facturas-por-tipo',
    loadComponent: () =>
      import('./facturacion/facturas-por-tipo/facturas-por-tipo').then((m) => m.FacturasPorTipoReport),
  },
  {
    path: 'facturacion/facturas-por-forma-pago',
    loadComponent: () =>
      import('./facturacion/facturas-por-forma-pago/facturas-por-forma-pago').then((m) => m.FacturasPorFormaPagoReport),
  },
  {
    path: 'cxc/cxc-movimientos',
    loadComponent: () =>
      import('./cxc/cxc-movimientos/cxc-movimientos').then((m) => m.CxcMovimientosReport),
  },
  {
    path: 'cxp/cxp-movimientos',
    loadComponent: () =>
      import('./cxp/cxp-movimientos/cxp-movimientos').then((m) => m.CxpMovimientosReport),
  },
];
