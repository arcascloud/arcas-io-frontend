import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { MainLayout } from './layout/main-layout/main-layout';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: '',
    component: MainLayout,
    canMatch: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'inventario',
        loadChildren: () => import('./features/inventario/inventario.routes').then((m) => m.INVENTARIO_ROUTES),
      },
      {
        path: 'bancos',
        loadChildren: () => import('./features/bancos/bancos.routes').then((m) => m.BANCOS_ROUTES),
      },
      {
        path: 'facturacion',
        loadChildren: () => import('./features/facturacion/facturacion.routes').then((m) => m.FACTURACION_ROUTES),
      },
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
        loadChildren: () => import('./features/planilla/planilla.routes').then((m) => m.PLANILLA_ROUTES),
      },
      {
        path: 'contabilidad',
        loadChildren: () => import('./features/contabilidad/contabilidad.routes').then((m) => m.CONTABILIDAD_ROUTES),
      },
      {
        path: 'configuracion',
        loadChildren: () => import('./features/configuracion/configuracion.routes').then((m) => m.CONFIGURACION_ROUTES),
      },
      { path: '**', redirectTo: 'dashboard' },
    ],
  },
];
