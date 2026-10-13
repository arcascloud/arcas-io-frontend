import { inject } from '@angular/core';
import { CanMatchFn, Router, UrlTree } from '@angular/router';
import { MessageService } from 'primeng/api';
import {
  AuthService,
  RUTAS_CLIENTE,
  RUTAS_PUBLICAS,
} from '../services/auth.service';
import { MenuConfigService } from '../services/menu-config.service';

/**
 * Rutas accesibles sin necesidad de módulo asignado (11/10/2026):
 * - /dashboard: pantalla de inicio para cualquier sesión activa
 * - tienda/pedidos: públicas por diseño (RUTAS_PUBLICAS) + sus atajos raíz
 */
const RUTAS_LIBRES: readonly string[] = [
  '/dashboard',
  '/tienda',
  '/pedidos',
  ...RUTAS_PUBLICAS,
];

/**
 * Segmento de ruta (1er nivel del FE) → moduloId de tmodulos.
 * Fuente de verdad: datos reales de tusuariomnuitem — el menú de
 * /configuracion vive en el módulo 11 (CORRELATIVOS) y /dashboard en 9 (MENU).
 * Debe mantenerse alineado con MAPA_MODULOS de jwt-auth.guard.ts (backend).
 */
export const MODULOS_POR_SEGMENTO: Record<string, number> = {
  dashboard: 9,
  inventario: 2,
  facturacion: 3,
  cxc: 4,
  cxp: 5,
  bancos: 6,
  contabilidad: 7,
  planilla: 8,
  configuracion: 11,
};

/** Ruta intentada a partir de los segments del guard (ej: '/facturacion/tienda') */
function rutaIntentada(segments: { path: string }[]): string {
  return '/' + segments.map((s) => s.path).join('/');
}

export const authGuard: CanMatchFn = async (_route, segments) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const menuService = inject(MenuConfigService);
  const msgs = inject(MessageService);

  const isAuthenticated = await new Promise<boolean>((resolve) => {
    authService.checkStatus().subscribe(resolve);
  });

  const ruta = rutaIntentada(segments);

  // Sin sesión: la tienda es pública (browse de visitante); todo lo demás → login
  if (!isAuthenticated) {
    const publica = RUTAS_PUBLICAS.some((r) => ruta === r || ruta.startsWith(r + '/'));
    if (publica) {
      return true;
    }
    router.navigateByUrl('/login');
    return false;
  }

  // Clientes (tipoPersona 'C' según datos del backend): solo rutas de
  // tienda/pedidos; cualquier otra URL redirige a la tienda virtual.
  if (authService.currentUser()?.tipoPersona === 'C') {
    const permitida = RUTAS_CLIENTE.some(
      (r) => ruta === r || ruta.startsWith(r + '/'),
    );
    if (!permitida) {
      return router.createUrlTree(['/facturacion/tienda']);
    }
    return true;
  }

  // Rutas libres (dashboard, tienda pública, atajos)
  if (RUTAS_LIBRES.some((r) => ruta === r || ruta.startsWith(r + '/'))) {
    return true;
  }

  // Autorización por módulo: la ruta debe pertenecer a un módulo que el
  // usuario tenga asignado en tusuariomnuitem (mismo criterio que el backend).
  const segmento = ruta.split('/')[1] ?? '';
  const moduloId = MODULOS_POR_SEGMENTO[segmento];
  if (moduloId == null) {
    // Segmento desconocido: el wildcard de rutas redirige a dashboard
    return true;
  }

  const modulos = await menuService.modulosPermitidos();
  if (modulos.has(moduloId)) {
    return true;
  }

  msgs.add({
    severity: 'warn',
    summary: 'Acceso denegado',
    detail: `No tiene permiso para el módulo "${segmento}".`,
  });
  const destino: UrlTree = router.createUrlTree(['/dashboard']);
  return destino;
};
