import { Routes } from '@angular/router';
import { Consulta } from './consulta/consulta';

export const CXC_ROUTES: Routes = [
  { path: '', redirectTo: 'caja', pathMatch: 'full' },

  // Caja - componente dedicado
  {
    path: 'caja',
    loadComponent: () => import('./caja/caja').then((m) => m.Caja),
  },
  {
    path: 'caja/editar/:id',
    loadComponent: () => import('./caja/caja').then((m) => m.Caja),
  },

  // Clientes - Nuevo gestor con layout dividido
  {
    path: 'clientes',
    loadComponent: () => import('./clientes/clientes-manager').then((m) => m.ClientesManager),
  },
  {
    path: 'clientes/nuevo',
    loadComponent: () => import('./clientes/cliente-form').then((m) => m.ClienteForm),
  },
  {
    path: 'clientes/editar/:id',
    loadComponent: () => import('./clientes/cliente-form').then((m) => m.ClienteForm),
  },
  {
    path: 'prestamos',
    loadComponent: () =>
      import('./prestamos/prestamos-manager').then((m) => m.PrestamosManager),
  },

  // Consultas (solo lectura)
  {
    path: 'antiguedad-saldos',
    loadComponent: () =>
      import('./antiguedad-saldos/antiguedad-saldos').then((m) => m.AntiguedadSaldos),
  },
  {
    path: 'cartas-recordatorio',
    loadComponent: () =>
      import('./cartas-recordatorio/cartas-recordatorio').then((m) => m.CartasRecordatorio),
  },
  {
    path: 'movimientos',
    loadComponent: () =>
      import('./movimientos/movimientos-manager').then((m) => m.MovimientosManager),
  },
  {
    path: 'historico',
    component: Consulta,
    data: {
      consulta: { nombre: 'historico', titulo: 'Histórico', ruta: '/cxc/historico', idKey: 'historicoclienteId' },
    },
  },
  {
    path: 'saldo-favor',
    component: Consulta,
    data: {
      consulta: { nombre: 'saldo-favor', titulo: 'Saldo a Favor', ruta: '/cxc/saldo-favor', idKey: 'cxcsalfavId' },
    },
  },

  { path: '**', redirectTo: 'caja' },
];
