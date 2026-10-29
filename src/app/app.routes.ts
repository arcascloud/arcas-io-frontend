import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { erpLayoutGuard } from './core/guards/layout.guard';
import { MainPrivateLayout } from './layout/main-layout-private/main-layout-private';
import { MainLayoutPublic } from './layout/main-layout-public/main-layout-public';

/**
 * Hijos compartidos por AMBOS layouts (ERP y público/CRM).
 * La diferencia entre rutas está en el componente raíz
 * (MainPrivateLayout vs MainLayoutPublic) y en el redirect inicial.
 */
const sharedChildren: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'inventario',
    loadChildren: () =>
      import('./features/inventario/inventario.routes').then((m) => m.INVENTARIO_ROUTES),
  },
  {
    path: 'bancos',
    loadChildren: () => import('./features/bancos/bancos.routes').then((m) => m.BANCOS_ROUTES),
  },
  {
    path: 'facturacion',
    loadChildren: () =>
      import('./features/facturacion/facturacion.routes').then((m) => m.FACTURACION_ROUTES),
  },
  // Atajos raíz → módulo de facturación
  { path: 'tienda', redirectTo: 'facturacion/tienda', pathMatch: 'full' },
  { path: 'pedidos', redirectTo: 'facturacion/pedidos-virtual', pathMatch: 'full' },
  {
    path: 'cxc',
    loadChildren: () => import('./features/cxc/cxc.routes').then((m) => m.CXC_ROUTES),
  },
  {
    path: 'cxp',
    loadChildren: () => import('./features/cxp/cxp.routes').then((m) => m.CXP_ROUTES),
  },
  {
    path: 'planilla',
    loadChildren: () =>
      import('./features/planilla/planilla.routes').then((m) => m.PLANILLA_ROUTES),
  },
  {
    path: 'contabilidad',
    loadChildren: () =>
      import('./features/contabilidad/contabilidad.routes').then((m) => m.CONTABILIDAD_ROUTES),
  },
  {
    path: 'configuracion',
    loadChildren: () =>
      import('./features/configuracion/configuracion.routes').then(
        (m) => m.CONFIGURACION_ROUTES,
      ),
  },
  { path: '**', redirectTo: 'dashboard' },
];

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },

  // ══════════════════════════════════════════════════════════════
  // RUTA ERP — sn_cliente !== 'S' → main-layout-private
  // erpLayoutGuard filtra: sin sesión o sn_cliente='S' → false
  // (Angular prueba la siguiente ruta raíz = layout público)
  // ══════════════════════════════════════════════════════════════
  {
    path: '',
    component: MainPrivateLayout,
    canMatch: [erpLayoutGuard, authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      ...sharedChildren,
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // RUTA PÚBLICA / CRM — sn_cliente='S' o visitante sin sesión
  // → main-layout-public (la raíz entra a la tienda)
  // ══════════════════════════════════════════════════════════════
  {
    path: '',
    component: MainLayoutPublic,
    canMatch: [authGuard],
    children: [
      { path: '', redirectTo: 'facturacion/tienda', pathMatch: 'full' },
      ...sharedChildren,
    ],
  },
];
