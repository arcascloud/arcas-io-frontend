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
    path: 'movimientos',
    loadComponent: () =>
      import('./movimientos/movimientos').then((m) => m.MovimientosBancos),
  },
  {
    path: 'cheques',
    loadComponent: () =>
      import('./cheques/cheques').then((m) => m.ChequesBancos),
  },
  {
    path: 'cheques/reimpresionchq',
    loadComponent: () =>
      import('./reimpresion-chq/reimpresion-chq').then((m) => m.ReimpresionChq),
  },
  {
    path: 'cheques/particulares',
    loadComponent: () =>
      import('./cheques-particulares/cheques-particulares').then((m) => m.ChequesParticulares),
  },
  {
    path: 'historial',
    loadComponent: () =>
      import('./historial/historial').then((m) => m.HistorialBancos),
  },
  {
    path: 'anular-movimientos',
    loadComponent: () =>
      import('./anular-movimientos/anular-movimientos').then((m) => m.AnularMovimientos),
  },
  {
    path: 'conciliacion',
    loadComponent: () =>
      import('./conciliacion/conciliacion').then((m) => m.ConciliacionBancaria),
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