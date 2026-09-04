import { Routes } from '@angular/router';

export const PLANILLA_ROUTES: Routes = [
  { path: '', redirectTo: 'empleados', pathMatch: 'full' },

  // Empleados (CRUD dedicado)
  {
    path: 'empleados',
    loadComponent: () =>
      import('./empleados/empleados').then((m) => m.Empleados),
  },
  {
    path: 'empleados/nuevo',
    loadComponent: () =>
      import('./empleados/empleado-form').then((m) => m.EmpleadoForm),
  },
  {
    path: 'empleados/editar/:id',
    loadComponent: () =>
      import('./empleados/empleado-form').then((m) => m.EmpleadoForm),
  },

  // Catálogos genéricos
  { path: 'puestos', data: { nombre: 'puestos' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-generico').then((m) => m.CatalogoGenerico) },
  { path: 'puestos/editar/:id', data: { nombre: 'puestos' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-form').then((m) => m.CatalogoForm) },
  { path: 'profesiones', data: { nombre: 'profesiones' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-generico').then((m) => m.CatalogoGenerico) },
  { path: 'profesiones/editar/:id', data: { nombre: 'profesiones' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-form').then((m) => m.CatalogoForm) },
  { path: 'deducciones', data: { nombre: 'deducciones' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-generico').then((m) => m.CatalogoGenerico) },
  { path: 'deducciones/editar/:id', data: { nombre: 'deducciones' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-form').then((m) => m.CatalogoForm) },
  { path: 'ingresos', data: { nombre: 'ingresos' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-generico').then((m) => m.CatalogoGenerico) },
  { path: 'ingresos/editar/:id', data: { nombre: 'ingresos' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-form').then((m) => m.CatalogoForm) },
  { path: 'titulaciones', data: { nombre: 'titulaciones' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-generico').then((m) => m.CatalogoGenerico) },
  { path: 'titulaciones/editar/:id', data: { nombre: 'titulaciones' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-form').then((m) => m.CatalogoForm) },
  { path: 'certificaciones', data: { nombre: 'certificaciones' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-generico').then((m) => m.CatalogoGenerico) },
  { path: 'certificaciones/editar/:id', data: { nombre: 'certificaciones' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-form').then((m) => m.CatalogoForm) },
  { path: 'asistencia', data: { nombre: 'asistencia' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-generico').then((m) => m.CatalogoGenerico) },
  { path: 'asistencia/editar/:id', data: { nombre: 'asistencia' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-form').then((m) => m.CatalogoForm) },
  { path: 'comisiones', data: { nombre: 'comisiones' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-generico').then((m) => m.CatalogoGenerico) },
  { path: 'comisiones/editar/:id', data: { nombre: 'comisiones' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-form').then((m) => m.CatalogoForm) },
  { path: 'deducciones-emp', data: { nombre: 'deducciones-emp' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-generico').then((m) => m.CatalogoGenerico) },
  { path: 'deducciones-emp/editar/:id', data: { nombre: 'deducciones-emp' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-form').then((m) => m.CatalogoForm) },

  // Planillas (maestro-detalle)
  {
    path: 'planillas',
    data: { nombre: 'planillas' },
    loadComponent: () =>
      import('../facturacion/maestro-detalle/maestro-detalle').then((m) => m.MaestroDetalle),
  },
  {
    path: 'planillas/nuevo',
    data: { nombre: 'planillas' },
    loadComponent: () =>
      import('../facturacion/maestro-detalle/maestro-detalle-form').then((m) => m.MaestroDetalleForm),
  },
  {
    path: 'planillas/editar/:id',
    data: { nombre: 'planillas' },
    loadComponent: () =>
      import('../facturacion/maestro-detalle/maestro-detalle-form').then((m) => m.MaestroDetalleForm),
  },

  { path: '**', redirectTo: 'empleados' },
];