import { Routes } from '@angular/router';
import { Consulta } from '../cxc/consulta/consulta';

export const BANCOS_ROUTES: Routes = [
  { path: '', redirectTo: 'bancos', pathMatch: 'full' },

  // Bancos Manager
  {
    path: 'bancos',
    loadComponent: () =>
      import('./bancos-manager/bancos-manager').then((m) => m.BancosManager),
  },
  {
    path: 'bancos/editar/:id',
    data: { nombre: 'bancos' },
    loadComponent: () =>
      import('../parametros/catalogo-generico/catalogo-form').then((m) => m.CatalogoForm),
  },
  {
    path: 'cuentas',
    data: { nombre: 'cuentas' },
    loadComponent: () =>
      import('../parametros/catalogo-generico/catalogo-generico').then((m) => m.CatalogoGenerico),
  },
  {
    path: 'cuentas/editar/:id',
    data: { nombre: 'cuentas' },
    loadComponent: () =>
      import('../parametros/catalogo-generico/catalogo-form').then((m) => m.CatalogoForm),
  },

  // Consultas (solo lectura)
  {
    path: 'conciliaciones',
    component: Consulta,
    data: {
      consulta: { nombre: 'conciliaciones', titulo: 'Conciliaciones', ruta: '/bancos/conciliaciones', idKey: 'bcoconcilacionId' },
    },
  },
  {
    path: 'direcciones',
    component: Consulta,
    data: {
      consulta: { nombre: 'direcciones', titulo: 'Direcciones', ruta: '/bancos/direcciones', idKey: 'bcosdireccionid' },
    },
  },
  {
    path: 'telefonos',
    component: Consulta,
    data: {
      consulta: { nombre: 'telefonos', titulo: 'Teléfonos', ruta: '/bancos/telefonos', idKey: 'bancotelefonoId' },
    },
  },

  { path: '**', redirectTo: 'bancos' },
];