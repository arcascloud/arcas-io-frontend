import { Routes } from '@angular/router';

export const CONFIGURACION_ROUTES: Routes = [
  { path: '', redirectTo: 'empresas', pathMatch: 'full' },

  // Empresas
  {
    path: 'empresas',
    loadComponent: () =>
      import('./empresas/empresas-manager').then((m) => m.EmpresasManager),
  },

  // Usuarios
  {
    path: 'usuarios',
    loadComponent: () =>
      import('../usuarios/lista-usuarios/lista-usuarios').then((m) => m.ListaUsuarios),
  },
  {
    path: 'usuarios/nuevo',
    loadComponent: () =>
      import('../usuarios/lista-usuarios/usuario-form').then((m) => m.UsuarioForm),
  },
  {
    path: 'usuarios/editar/:id',
    loadComponent: () =>
      import('../usuarios/lista-usuarios/usuario-form').then((m) => m.UsuarioForm),
  },
  {
    path: 'usuarios/modulos',
    loadComponent: () =>
      import('../usuarios/modulos/modulos').then((m) => m.Modulos),
  },
  {
    path: 'usuarios/modulos/nuevo',
    loadComponent: () =>
      import('../usuarios/modulos/modulo-form').then((m) => m.ModuloForm),
  },
  {
    path: 'usuarios/modulos/editar/:id',
    loadComponent: () =>
      import('../usuarios/modulos/modulo-form').then((m) => m.ModuloForm),
  },
  {
    path: 'usuarios/usuario-modulos',
    loadComponent: () =>
      import('../usuarios/usuario-modulos/usuario-modulos').then((m) => m.UsuarioModulos),
  },
  {
    path: 'usuarios/usuario-modulos/nuevo',
    loadComponent: () =>
      import('../usuarios/usuario-modulos/usuario-modulos-form').then((m) => m.UsuarioModulosForm),
  },
  {
    path: 'usuarios/usuario-modulos/editar/:id',
    loadComponent: () =>
      import('../usuarios/usuario-modulos/usuario-modulos-form').then((m) => m.UsuarioModulosForm),
  },
  {
    path: 'usuarios/usuario-mnuitem',
    loadComponent: () =>
      import('../usuarios/usuario-mnuitem/usuario-mnuitem').then((m) => m.UsuarioMnuItem),
  },
  {
    path: 'usuarios/usuario-mnuitem/nuevo',
    loadComponent: () =>
      import('../usuarios/usuario-mnuitem/usuario-mnuitem-form').then((m) => m.UsuarioMnuItemForm),
  },
  {
    path: 'usuarios/usuario-mnuitem/editar/:id',
    loadComponent: () =>
      import('../usuarios/usuario-mnuitem/usuario-mnuitem-form').then((m) => m.UsuarioMnuItemForm),
  },
  {
    path: 'usuarios/usuario-scripts',
    loadComponent: () =>
      import('../usuarios/usuario-scripts/usuario-scripts').then((m) => m.UsuarioScripts),
  },
  {
    path: 'usuarios/usuario-scripts/nuevo',
    loadComponent: () =>
      import('../usuarios/usuario-scripts/usuario-scripts-form').then((m) => m.UsuarioScriptsForm),
  },
  {
    path: 'usuarios/usuario-modauth',
    loadComponent: () =>
      import('../usuarios/usuario-modauth/usuario-modauth').then((m) => m.UsuarioModAuthPage),
  },
  {
    path: 'usuarios/usuario-modauth/nuevo',
    loadComponent: () =>
      import('../usuarios/usuario-modauth/usuario-modauth-form').then((m) => m.UsuarioModAuthForm),
  },
  {
    path: 'usuarios/usuario-modauth/editar/:id',
    loadComponent: () =>
      import('../usuarios/usuario-modauth/usuario-modauth-form').then((m) => m.UsuarioModAuthForm),
  },
  {
    path: 'usuarios/usuario-roles',
    loadComponent: () =>
      import('../usuarios/usuario-roles/usuario-roles').then((m) => m.UsuarioRolesPage),
  },
  {
    path: 'usuarios/usuario-roles/nuevo',
    loadComponent: () =>
      import('../usuarios/usuario-roles/usuario-roles-form').then((m) => m.UsuarioRolesForm),
  },
  {
    path: 'usuarios/usuario-roles/editar/:id',
    loadComponent: () =>
      import('../usuarios/usuario-roles/usuario-roles-form').then((m) => m.UsuarioRolesForm),
  },

  // Parámetros (catálogos genéricos configurables)
  {
    path: 'parametros/:nombre',
    loadComponent: () =>
      import('../parametros/catalogo-generico/catalogo-generico').then((m) => m.CatalogoGenerico),
  },
  {
    path: 'parametros/:nombre/editar/:id',
    loadComponent: () =>
      import('../parametros/catalogo-generico/catalogo-form').then((m) => m.CatalogoForm),
  },

  // Settings por módulo (una sola fila por empresa)
  {
    path: 'settings/:tipo',
    loadComponent: () =>
      import('./settings/settings').then((m) => m.Settings),
  },

  // Parámetros por módulo
  {
    path: 'param-modulos',
    loadComponent: () =>
      import('../parametros/param-manager-modulos/param-manager-modulos').then((m) => m.ParamManagerModulos),
  },

  { path: '**', redirectTo: 'empresas' },
];
