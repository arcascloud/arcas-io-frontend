import { Routes } from '@angular/router';
import { CotizacionesList } from './cotizaciones-list/cotizaciones-list';
import { CotizacionesForm } from './cotizaciones-form/cotizaciones-form';

export const COTIZACIONES_ROUTES: Routes = [
  { path: '', component: CotizacionesList },
  { path: 'editar/:id', component: CotizacionesForm },
];
