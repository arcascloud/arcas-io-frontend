import { Routes } from '@angular/router';

export const PRESTAMOS_ROUTES: Routes = [

  // Caja Préstamos - réplica de Caja para cobros a préstamos
  {
    path: 'caja-prestamos',
    loadComponent: () =>
      import('./caja-prestamos/caja-prestamos').then((m) => m.CajaPrestamos),
  },
  {
    path: 'caja-prestamos/editar/:id',
    loadComponent: () =>
      import('./caja-prestamos/caja-prestamos').then((m) => m.CajaPrestamos),
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
    loadComponent: () =>
      import('./historico/historico-manager').then((m) => m.HistoricoManager),
  },


  // Carteras contables por cliente (catálogo genérico