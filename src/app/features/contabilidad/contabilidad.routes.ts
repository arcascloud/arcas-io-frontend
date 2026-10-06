import { Routes } from '@angular/router';

export const CONTABILIDAD_ROUTES: Routes = [
  { path: '', redirectTo: 'ctacontables', pathMatch: 'full' },

  // ===== Componentes especializados =====
  { path: 'dashboardId7', loadComponent: () => import('./dashboard-id7/dashboard-id7').then((m) => m.DashboardId7Component) },
  { path: 'reportes', loadComponent: () => import('./reportes/reportes-contables').then((m) => m.ReportesContablesComponent) },
  { path: 'balance-dinamico', loadComponent: () => import('./balance-dinamico/balance-dinamico').then((m) => m.BalanceDinamicoComponent) },
  { path: 'balance-financiero', loadComponent: () => import('./balance-financiero/balance-financiero').then((m) => m.BalanceFinancieroComponent) },
  { path: 'estado-resultado', loadComponent: () => import('./estado-resultado/estado-resultado').then((m) => m.EstadoResultadoComponent) },
  { path: 'cierre-contable', loadComponent: () => import('./cierre-contable/cierre-contable').then((m) => m.CierreContableComponent) },
  { path: 'reversar-cierre', loadComponent: () => import('./reversar-cierre/reversar-cierre').then((m) => m.ReversarCierreComponent) },

  // ===== Cuentas Contables (componente dedicado) =====
  { path: 'ctacontables', loadComponent: () => import('./ctacontables/ctacontables-list').then((m) => m.CtacontablesListComponent) },

  // ===== Catálogos genéricos =====
  { path: 'grupocontable', data: { nombre: 'grupocontable' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-generico').then((m) => m.CatalogoGenerico) },
  { path: 'grupocontable/editar/:id', data: { nombre: 'grupocontable' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-form').then((m) => m.CatalogoForm) },
  { path: 'carteras', data: { nombre: 'carteras' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-generico').then((m) => m.CatalogoGenerico) },
  { path: 'carteras/editar/:id', data: { nombre: 'carteras' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-form').then((m) => m.CatalogoForm) },
  { path: 'cierredet', data: { nombre: 'cierredet' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-generico').then((m) => m.CatalogoGenerico) },
  { path: 'cierredet/editar/:id', data: { nombre: 'cierredet' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-form').then((m) => m.CatalogoForm) },
  { path: 'nivelcta', data: { nombre: 'nivelcta' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-generico').then((m) => m.CatalogoGenerico) },
  { path: 'nivelcta/editar/:id', data: { nombre: 'nivelcta' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-form').then((m) => m.CatalogoForm) },
  { path: 'naturalezacta', data: { nombre: 'naturalezacta' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-generico').then((m) => m.CatalogoGenerico) },
  { path: 'naturalezacta/editar/:id', data: { nombre: 'naturalezacta' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-form').then((m) => m.CatalogoForm) },
  { path: 'meses', data: { nombre: 'meses' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-generico').then((m) => m.CatalogoGenerico) },
  { path: 'meses/editar/:id', data: { nombre: 'meses' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-form').then((m) => m.CatalogoForm) },
  { path: 'tipos-doc-fiscal', data: { nombre: 'tipos-doc-fiscal' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-generico').then((m) => m.CatalogoGenerico) },
  { path: 'tipos-doc-fiscal/editar/:id', data: { nombre: 'tipos-doc-fiscal' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-form').then((m) => m.CatalogoForm) },
  { path: 'impuestovecinal', data: { nombre: 'impuestovecinal' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-generico').then((m) => m.CatalogoGenerico) },
  { path: 'impuestovecinal/editar/:id', data: { nombre: 'impuestovecinal' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-form').then((m) => m.CatalogoForm) },
  { path: 'isr', data: { nombre: 'isr' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-generico').then((m) => m.CatalogoGenerico) },
  { path: 'isr/editar/:id', data: { nombre: 'isr' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-form').then((m) => m.CatalogoForm) },
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
  { path: 'repdiarios', loadComponent: () => import('./libro-diario/libro-diario').then((m) => m.LibroDiarioComponent) },
  { path: 'libro-mayor', loadComponent: () => import('./libro-mayor/libro-mayor').then((m) => m.LibroMayorComponent) },
  { path: 'reclasificacion-cuentas', loadComponent: () => import('./reclasificacion-cuentas/reclasificacion-cuentas').then((m) => m.ReclasificacionCuentasComponent) },
  { path: 'repbalances', data: { nombre: 'repbalances' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-generico').then((m) => m.CatalogoGenerico) },
  { path: 'repbalances/editar/:id', data: { nombre: 'repbalances' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-form').then((m) => m.CatalogoForm) },
  { path: 'movcta', data: { nombre: 'movcta' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-generico').then((m) => m.CatalogoGenerico) },

  // ===== Maestro-detalle =====
  { path: 'plantillapdamae', data: { nombre: 'plantillapda' }, loadComponent: () => import('../facturacion/maestro-detalle/maestro-detalle').then((m) => m.MaestroDetalle) },
  { path: 'plantillapdamae/nuevo', data: { nombre: 'plantillapda' }, loadComponent: () => import('../facturacion/maestro-detalle/maestro-detalle-form').then((m) => m.MaestroDetalleForm) },
  { path: 'plantillapdamae/editar/:id', data: { nombre: 'plantillapda' }, loadComponent: () => import('../facturacion/maestro-detalle/maestro-detalle-form').then((m) => m.MaestroDetalleForm) },
  { path: 'plantillabalancesmae', data: { nombre: 'plantillabalances' }, loadComponent: () => import('../facturacion/maestro-detalle/maestro-detalle').then((m) => m.MaestroDetalle) },
  { path: 'plantillabalancesmae/nuevo', data: { nombre: 'plantillabalances' }, loadComponent: () => import('../facturacion/maestro-detalle/maestro-detalle-form').then((m) => m.MaestroDetalleForm) },
  { path: 'plantillabalancesmae/editar/:id', data: { nombre: 'plantillabalances' }, loadComponent: () => import('../facturacion/maestro-detalle/maestro-detalle-form').then((m) => m.MaestroDetalleForm) },
  { path: 'copdamae', loadComponent: () => import('./copdamae-manager/copdamae-manager').then((m) => m.CopdamaeManager) },
  { path: 'plantillapda', loadComponent: () => import('./plantilla-pda-manager/plantilla-pda-manager').then((m) => m.PlantillaPdaManager) },
  { path: 'plantillabalances', loadComponent: () => import('./balances-manager/balances-manager').then((m) => m.BalancesManager) },
  { path: 'copdamae-old', data: { nombre: 'copda' }, loadComponent: () => import('../facturacion/maestro-detalle/maestro-detalle').then((m) => m.MaestroDetalle) },
  { path: 'copdamae-old/nuevo', data: { nombre: 'copda' }, loadComponent: () => import('../facturacion/maestro-detalle/maestro-detalle-form').then((m) => m.MaestroDetalleForm) },
  { path: 'copdamae-old/editar/:id', data: { nombre: 'copda' }, loadComponent: () => import('../facturacion/maestro-detalle/maestro-detalle-form').then((m) => m.MaestroDetalleForm) },

  { path: '**', redirectTo: 'ctacontables' },
];