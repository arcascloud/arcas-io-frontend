import { Routes } from '@angular/router';
import { Consulta } from '../cxc/consulta/consulta';

export const CXP_ROUTES: Routes = [
  { path: '', redirectTo: 'proveedores', pathMatch: 'full' },

  // Proveedores (maestro/detalle, igual que Clientes CxC)
  {
    path: 'proveedores',
    loadComponent: () => import('./proveedores/proveedores-manager').then((m) => m.ProveedoresManager),
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
    loadComponent: () => import('./historico/historico-manager').then((m) => m.CxpHistoricoManager),
  },

  // Carteras contables por proveedor (catálogo genérico)
  {
    path: 'carteras-cta',
    data: { nombre: 'carteras-cta' },
    loadComponent: () => import('../parametros/catalogo-generico/catalogo-generico').then((m) => m.CatalogoGenerico),
  },
  {
    path: 'carteras-cta/editar/:id',
    data: { nombre: 'carteras-cta' },
    loadComponent: () => import('../parametros/catalogo-generico/catalogo-form').then((m) => m.CatalogoForm),
  },

  // Información de proveedores - correos, celulares y direcciones (catálogo genérico)
  {
    path: 'proveedor-info',
    data: { nombre: 'proveedor-info' },
    loadComponent: () => import('../parametros/catalogo-generico/catalogo-generico').then((m) => m.CatalogoGenerico),
  },
  {
    path: 'proveedor-info/editar/:id',
    data: { nombre: 'proveedor-info' },
    loadComponent: () => import('../parametros/catalogo-generico/catalogo-form').then((m) => m.CatalogoForm),
  },

  { path: '**', redirectTo: 'proveedores' },
];