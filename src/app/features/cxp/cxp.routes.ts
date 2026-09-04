import { Routes } from '@angular/router';
import { Consulta } from '../cxc/consulta/consulta';

export const CXP_ROUTES: Routes = [
  { path: '', redirectTo: 'proveedores', pathMatch: 'full' },

  // Proveedores
  {
    path: 'proveedores',
    loadComponent: () => import('./proveedores/proveedores').then((m) => m.CxpProveedores),
  },
  {
    path: 'proveedores/nuevo',
    loadComponent: () => import('./proveedores/proveedor-form').then((m) => m.CxpProveedorForm),
  },
  {
    path: 'proveedores/editar/:id',
    loadComponent: () => import('./proveedores/proveedor-form').then((m) => m.CxpProveedorForm),
  },

  // Compras
  {
    path: 'compras',
    loadComponent: () => import('./compras/compras-manager').then((m) => m.ComprasManager),
  },

  // Movimientos
  {
    path: 'movimientos',
    loadComponent: () => import('./movimientos/movimientos-manager').then((m) => m.CxpMovimientosManager),
  },
  {
    path: 'historicos',
    component: Consulta,
    data: {
      consulta: { nombre: 'historicos', titulo: 'Históricos', ruta: '/cxp/historicos', idKey: 'cxphistoId' },
    },
  },
  {
    path: 'saldos-av',
    component: Consulta,
    data: {
      consulta: { nombre: 'saldos-av', titulo: 'Saldos a favor', ruta: '/cxp/saldos-av', idKey: 'cxpsalfavId' },
    },
  },

  { path: '**', redirectTo: 'proveedores' },
];