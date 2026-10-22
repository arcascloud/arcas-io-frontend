import { Routes } from '@angular/router';

export const PLANILLA_ROUTES: Routes = [
  { path: '', redirectTo: 'empleados', pathMatch: 'full' },

  // Empleados (CRUD dedicado)
  {
    path: 'empleados',
    loadComponent: () => import('./empleados/empleados').then((m) => m.Empleados),
  },
  {
    path: 'empleados/nuevo',
    loadComponent: () => import('./empleados/empleado-form').then((m) => m.EmpleadoForm),
  },
  {
    path: 'empleados/editar/:id',
    loadComponent: () => import('./empleados/empleado-form').then((m) => m.EmpleadoForm),
  },

  // Catálogos genéricos
  {
    path: 'puestos',
    data: { nombre: 'puestos' },
    loadComponent: () =>
      import('../parametros/catalogo-generico/catalogo-generico').then((m) => m.CatalogoGenerico),
  },
  {
    path: 'puestos/editar/:id',
    data: { nombre: 'puestos' },
    loadComponent: () =>
      import('../parametros/catalogo-generico/catalogo-form').then((m) => m.CatalogoForm),
  },
  {
    path: 'profesiones',
    data: { nombre: 'profesiones' },
    loadComponent: () =>
      import('../parametros/catalogo-generico/catalogo-generico').then((m) => m.CatalogoGenerico),
  },
  {
    path: 'profesiones/editar/:id',
    data: { nombre: 'profesiones' },
    loadComponent: () =>
      import('../parametros/catalogo-generico/catalogo-form').then((m) => m.CatalogoForm),
  },
  {
    path: 'tipo-mov',
    data: { nombre: 'tipo-mov' },
    loadComponent: () =>
      import('../parametros/catalogo-generico/catalogo-generico').then((m) => m.CatalogoGenerico),
  },
  {
    path: 'tipo-mov/editar/:id',
    data: { nombre: 'tipo-mov' },
    loadComponent: () =>
      import('../parametros/catalogo-generico/catalogo-form').then((m) => m.CatalogoForm),
  },
  {
    path: 'ingresos',
    data: { nombre: 'ingresos' },
    loadComponent: () =>
      import('../parametros/catalogo-generico/catalogo-generico').then((m) => m.CatalogoGenerico),
  },
  {
    path: 'ingresos/editar/:id',
    data: { nombre: 'ingresos' },
    loadComponent: () =>
      import('../parametros/catalogo-generico/catalogo-form').then((m) => m.CatalogoForm),
  },
  {
    path: 'titulaciones',
    data: { nombre: 'titulaciones' },
    loadComponent: () =>
      import('../parametros/catalogo-generico/catalogo-generico').then((m) => m.CatalogoGenerico),
  },
  {
    path: 'titulaciones/editar/:id',
    data: { nombre: 'titulaciones' },
    loadComponent: () =>
      import('../parametros/catalogo-generico/catalogo-form').then((m) => m.CatalogoForm),
  },
  {
    path: 'certificaciones',
    data: { nombre: 'certificaciones' },
    loadComponent: () =>
      import('../parametros/catalogo-generico/catalogo-generico').then((m) => m.CatalogoGenerico),
  },
  {
    path: 'certificaciones/editar/:id',
    data: { nombre: 'certificaciones' },
    loadComponent: () =>
      import('../parametros/catalogo-generico/catalogo-form').then((m) => m.CatalogoForm),
  },
  {
    path: 'asistencia',
    data: { nombre: 'asistencia' },
    loadComponent: () =>
      import('../parametros/catalogo-generico/catalogo-generico').then((m) => m.CatalogoGenerico),
  },
  {
    path: 'asistencia/editar/:id',
    data: { nombre: 'asistencia' },
    loadComponent: () =>
      import('../parametros/catalogo-generico/catalogo-form').then((m) => m.CatalogoForm),
  },
  {
    path: 'ple-ingresos',
    data: { nombre: 'ple-ingresos' },
    loadComponent: () =>
      import('../parametros/catalogo-generico/catalogo-generico').then((m) => m.CatalogoGenerico),
  },
  {
    path: 'ple-ingresos/editar/:id',
    data: { nombre: 'ple-ingresos' },
    loadComponent: () =>
      import('../parametros/catalogo-generico/catalogo-form').then((m) => m.CatalogoForm),
  },
  {
    path: 'deducciones-emp',
    data: { nombre: 'deducciones-emp' },
    loadComponent: () =>
      import('../parametros/catalogo-generico/catalogo-generico').then((m) => m.CatalogoGenerico),
  },
  {
    path: 'deducciones-emp/editar/:id',
    data: { nombre: 'deducciones-emp' },
    loadComponent: () =>
      import('../parametros/catalogo-generico/catalogo-form').then((m) => m.CatalogoForm),
  },
  {
    path: 'empleado-tipo-mov',
    loadComponent: () =>
      import('./empleado-tipo-mov/empleado-tipo-mov-list').then((m) => m.EmpleadoTipoMovList),
  },
  {
    path: 'empleado-tipo-mov/editar/:id',
    loadComponent: () =>
      import('./empleado-tipo-mov/empleado-tipo-mov-manager').then((m) => m.EmpleadoTipoMovManager),
  },
  {
    path: 'retenciones',
    loadComponent: () => import('./retenciones/retenciones').then((m) => m.RetencionesRevision),
  },
  {
    path: 'ingresos-rev',
    loadComponent: () => import('./ingresos-rev/ingresos-rev').then((m) => m.IngresosRev),
  },

  // Planillas (pagar-planilla: lista + form con Generar planilla / Horas extras)
  {
    path: 'planillas',
    data: { nombre: 'planillas' },
    loadComponent: () => import('./pagar-planilla/pagar-planilla').then((m) => m.PagarPlanilla),
  },
  {
    path: 'planillas/nuevo',
    data: { nombre: 'planillas' },
    loadComponent: () =>
      import('./pagar-planilla/pagar-planilla-form').then((m) => m.PagarPlanillaForm),
  },
  {
    path: 'planillas/editar/:id',
    data: { nombre: 'planillas' },
    loadComponent: () =>
      import('./pagar-planilla/pagar-planilla-form').then((m) => m.PagarPlanillaForm),
  },

  // Autorización de pago de horas extras (maestro / detalle)
  {
    path: 'horas-extras',
    loadComponent: () =>
      import('./horas-extras/horas-extras-list').then((m) => m.HorasExtrasList),
  },
  {
    path: 'horas-extras/nuevo',
    loadComponent: () =>
      import('./horas-extras/horas-extras-form').then((m) => m.HorasExtrasForm),
  },
  {
    path: 'horas-extras/editar/:id',
    loadComponent: () =>
      import('./horas-extras/horas-extras-form').then((m) => m.HorasExtrasForm),
  },

  { path: '**', redirectTo: 'empleados' },
];
