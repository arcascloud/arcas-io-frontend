import { Routes } from '@angular/router';

export const CONTABILIDAD_ROUTES: Routes = [
  { path: '', redirectTo: 'ctacontables', pathMatch: 'full' },

  // Catálogos genéricos
  { path: 'ctacontables', data: { nombre: 'ctacontables' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-generico').then((m) => m.CatalogoGenerico) },
  { path: 'ctacontables/editar/:id', data: { nombre: 'ctacontables' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-form').then((m) => m.CatalogoForm) },
  { path: 'grupocontable', data: { nombre: 'grupocontable' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-generico').then((m) => m.CatalogoGenerico) },
  { path: 'grupocontable/editar/:id', data: { nombre: 'grupocontable' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-form').then((m) => m.CatalogoForm) },
  { path: 'nivelcta', data: { nombre: 'nivelcta' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-generico').then((m) => m.CatalogoGenerico) },
  { path: 'nivelcta/editar/:id', data: { nombre: 'nivelcta' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-form').then((m) => m.CatalogoForm) },
  { path: 'naturalezacta', data: { nombre: 'naturalezacta' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-generico').then((m) => m.CatalogoGenerico) },
  { path: 'naturalezacta/editar/:id', data: { nombre: 'naturalezacta' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-form').then((m) => m.CatalogoForm) },
  { path: 'tipos-doc-fiscal', data: { nombre: 'tipos-doc-fiscal' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-generico').then((m) => m.CatalogoGenerico) },
  { path: 'tipos-doc-fiscal/editar/:id', data: { nombre: 'tipos-doc-fiscal' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-form').then((m) => m.CatalogoForm) },
  { path: 'impuestovecinal', data: { nombre: 'impuestovecinal' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-generico').then((m) => m.CatalogoGenerico) },
  { path: 'impuestovecinal/editar/:id', data: { nombre: 'impuestovecinal' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-form').then((m) => m.CatalogoForm) },
  { path: 'factordecambio', data: { nombre: 'factordecambio' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-generico').then((m) => m.CatalogoGenerico) },
  { path: 'factordecambio/editar/:id', data: { nombre: 'factordecambio' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-form').then((m) => m.CatalogoForm) },
  { path: 'cierrectable', data: { nombre: 'cierrectable' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-generico').then((m) => m.CatalogoGenerico) },
  { path: 'cierrectable/editar/:id', data: { nombre: 'cierrectable' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-form').then((m) => m.CatalogoForm) },
  { path: 'periodoctable', data: { nombre: 'periodoctable' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-generico').then((m) => m.CatalogoGenerico) },
  { path: 'periodoctable/editar/:id', data: { nombre: 'periodoctable' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-form').then((m) => m.CatalogoForm) },
  { path: 'saldoscta', data: { nombre: 'saldoscta' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-generico').then((m) => m.CatalogoGenerico) },
  { path: 'saldoscta/editar/:id', data: { nombre: 'saldoscta' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-form').then((m) => m.CatalogoForm) },
  { path: 'repliquidez', data: { nombre: 'repliquidez' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-generico').then((m) => m.CatalogoGenerico) },
  { path: 'repliquidez/editar/:id', data: { nombre: 'repliquidez' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-form').then((m) => m.CatalogoForm) },
  { path: 'repdiarios', data: { nombre: 'repdiarios' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-generico').then((m) => m.CatalogoGenerico) },
  { path: 'repdiarios/editar/:id', data: { nombre: 'repdiarios' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-form').then((m) => m.CatalogoForm) },
  { path: 'repbalances', data: { nombre: 'repbalances' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-generico').then((m) => m.CatalogoGenerico) },
  { path: 'repbalances/editar/:id', data: { nombre: 'repbalances' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-form').then((m) => m.CatalogoForm) },
  { path: 'movcta', data: { nombre: 'movcta' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-generico').then((m) => m.CatalogoGenerico) },
  { path: 'movcta/editar/:id', data: { nombre: 'movcta' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-form').then((m) => m.CatalogoForm) },

  // Maestro-detalle
  { path: 'plantillapdamae', data: { nombre: 'plantillapda' }, loadComponent: () => import('../facturacion/maestro-detalle/maestro-detalle').then((m) => m.MaestroDetalle) },
  { path: 'plantillapdamae/nuevo', data: { nombre: 'plantillapda' }, loadComponent: () => import('../facturacion/maestro-detalle/maestro-detalle-form').then((m) => m.MaestroDetalleForm) },
  { path: 'plantillapdamae/editar/:id', data: { nombre: 'plantillapda' }, loadComponent: () => import('../facturacion/maestro-detalle/maestro-detalle-form').then((m) => m.MaestroDetalleForm) },
  { path: 'plantillabalancesmae', data: { nombre: 'plantillabalances' }, loadComponent: () => import('../facturacion/maestro-detalle/maestro-detalle').then((m) => m.MaestroDetalle) },
  { path: 'plantillabalancesmae/nuevo', data: { nombre: 'plantillabalances' }, loadComponent: () => import('../facturacion/maestro-detalle/maestro-detalle-form').then((m) => m.MaestroDetalleForm) },
  { path: 'plantillabalancesmae/editar/:id', data: { nombre: 'plantillabalances' }, loadComponent: () => import('../facturacion/maestro-detalle/maestro-detalle-form').then((m) => m.MaestroDetalleForm) },
  { path: 'copdamae', data: { nombre: 'copda' }, loadComponent: () => import('../facturacion/maestro-detalle/maestro-detalle').then((m) => m.MaestroDetalle) },
  { path: 'copdamae/nuevo', data: { nombre: 'copda' }, loadComponent: () => import('../facturacion/maestro-detalle/maestro-detalle-form').then((m) => m.MaestroDetalleForm) },
  { path: 'copdamae/editar/:id', data: { nombre: 'copda' }, loadComponent: () => import('../facturacion/maestro-detalle/maestro-detalle-form').then((m) => m.MaestroDetalleForm) },

  { path: '**', redirectTo: 'ctacontables' },
];