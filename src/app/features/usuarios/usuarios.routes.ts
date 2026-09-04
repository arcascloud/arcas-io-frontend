import { Routes } from '@angular/router';

export const USUARIOS_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'lista',
    pathMatch: 'full',
  },
  {
    path: 'lista',
    loadComponent: () =>
      import('./lista-usuarios/lista-usuarios').then((m) => m.ListaUsuarios),
  },
  {
    path: 'lista/nuevo',
    loadComponent: () =>
      import('./lista-usuarios/usuario-form').then((m) => m.UsuarioForm),
  },
  {
    path: 'lista/editar/:id',
    loadComponent: () =>
      import('./lista-usuarios/usuario-form').then((m) => m.UsuarioForm),
  },
  {
    path: 'modulos',
    loadComponent: () =>
      import('./modulos/modulos').then((m) => m.Modulos),
  },
  {
    path: 'modulos/nuevo',
    loadComponent: () =>
      import('./modulos/modulo-form').then((m) => m.ModuloForm),
  },
  {
    path: 'modulos/editar/:id',
    loadComponent: () =>
      import('./modulos/modulo-form').then((m) => m.ModuloForm),
  },
  {
    path: 'usuario-modulos',
    loadComponent: () =>
      import('./usuario-modulos/usuario-modulos').then((m) => m.UsuarioModulos),
  },
  {
    path: 'usuario-modulos/nuevo',
    loadComponent: () =>
      import('./usuario-modulos/usuario-modulos-form').then((m) => m.UsuarioModulosForm),
  },
  {
    path: 'usuario-modulos/editar/:id',
    loadComponent: () =>
      import('./usuario-modulos/usuario-modulos-form').then((m) => m.UsuarioModulosForm),
  },
  {
    path: 'usuario-mnuitem',
    loadComponent: () =>
      import('./usuario-mnuitem/usuario-mnuitem').then((m) => m.UsuarioMnuItem),
  },
  {
    path: 'usuario-mnuitem/nuevo',
    loadComponent: () =>
      import('./usuario-mnuitem/usuario-mnuitem-form').then((m) => m.UsuarioMnuItemForm),
  },
  {
    path: 'usuario-mnuitem/editar/:id',
    loadComponent: () =>
      import('./usuario-mnuitem/usuario-mnuitem-form').then((m) => m.UsuarioMnuItemForm),
  },
  {
    path: 'usuario-scripts',
    loadComponent: () =>
      import('./usuario-scripts/usuario-scripts').then((m) => m.UsuarioScripts),
  },
  {
    path: 'usuario-scripts/nuevo',
    loadComponent: () =>
      import('./usuario-scripts/usuario-scripts-form').then((m) => m.UsuarioScriptsForm),
  },
  {
    path: 'usuario-modauth',
    loadComponent: () =>
      import('./usuario-modauth/usuario-modauth').then((m) => m.UsuarioModAuthPage),
  },
  {
    path: 'usuario-modauth/nuevo',
    loadComponent: () =>
      import('./usuario-modauth/usuario-modauth-form').then((m) => m.UsuarioModAuthForm),
  },
  {
    path: 'usuario-modauth/editar/:id',
    loadComponent: () =>
      import('./usuario-modauth/usuario-modauth-form').then((m) => m.UsuarioModAuthForm),
  },
];
