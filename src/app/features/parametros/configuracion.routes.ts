import { Routes } from '@angular/router';

export const CONFIGURACION_ROUTES: Routes = [
  { path: '', redirectTo: 'empresas', pathMatch: 'full' },
  {
    path: 'empresas',
    loadComponent: () =>
      import('./lista-empresas/lista-empresas').then((m) => m.ListaEmpresas),
  },
  {
    path: 'empresas/nuevo',
    loadComponent: () =>
      import('./lista-empresas/empresa-form').then((m) => m.EmpresaForm),
  },
  {
    path: 'empresas/editar/:id',
    loadComponent: () =>
      import('./lista-empresas/empresa-form').then((m) => m.EmpresaForm),
  },
  { path: '**', redirectTo: 'empresas' },
];
