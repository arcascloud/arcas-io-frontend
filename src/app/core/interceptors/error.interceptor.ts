import { HttpInterceptorFn, HttpErrorResponse, HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError, Observable, map, switchMap, finalize, shareReplay } from 'rxjs';
import { MessageService } from 'primeng/api';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

/** 401 compartido: si llegan varios en paralelo solo se refresca una vez */
let refreshEnCurso: Observable<string> | null = null;

function refrescarToken(http: HttpClient): Observable<string> {
  if (!refreshEnCurso) {
    refreshEnCurso = http
      .post<{ access_token?: string }>(`${environment.apiUrl}/auth/refresh`, {
        refresh_token: localStorage.getItem('refresh_token'),
      })
      .pipe(
        map((res) => {
          if (!res.access_token) throw new Error('Refresh sin access_token');
          localStorage.setItem('token', res.access_token);
          return res.access_token;
        }),
        finalize(() => {
          refreshEnCurso = null;
        }),
        shareReplay(1),
      );
  }
  return refreshEnCurso;
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const msgs = inject(MessageService);
  const http = inject(HttpClient);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // ── 401: refrescar token y reintentar UNA vez ──
      // La cookie SameSite=Lax no viaja en XHR cross-site (frontend ≠ onrender),
      // así que el canal real es el Bearer. `ja_token` dura 15 min: al vencer,
      // /auth/refresh (con el refresh_token de 7 días) emite uno nuevo y la
      // petición original se reintenta. Solo si el refresh falla → logout.
      if (error.status === 401) {
        const url = req.url;
        const esLogin = url.includes('/auth/login');
        const esRefresh = url.includes('/auth/refresh');
        const esLogout = url.includes('/auth/logout');
        const yaReintentado = req.headers.has('X-Auth-Retry');

        if (
          !esLogin &&
          !esRefresh &&
          !esLogout &&
          !yaReintentado &&
          localStorage.getItem('refresh_token')
        ) {
          return refrescarToken(http).pipe(
            switchMap((token) =>
              next(
                req.clone({
                  setHeaders: {
                    Authorization: `Bearer ${token}`,
                    'X-Auth-Retry': '1',
                  },
                }),
              ),
            ),
            catchError(() => {
              // Refresh inválido/vencido → sesión muerta
              auth.logout();
              return throwError(() => error);
            }),
          );
        }

        // Sin refresh posible. Login: el formulario muestra "Credenciales
        // incorrectas" (navegar al logout aquí revotaba a la tienda).
        // Logout: su propio callback ya finaliza la sesión (evita bucle).
        if (!esLogin && !esLogout) {
          auth.logout();
        }
        return throwError(() => error);
      }

      // Para cualquier otro error, sacamos el mensaje que provea el Backend NestJS o un mensaje genérico
      let detail = 'Ocurrió un error en el servidor.';

      if (typeof error.error === 'string') {
        detail = error.error;
      } else if (error.error?.message) {
        // NestJS suele devolver { statusCode: 4xx, message: "..." }
        detail = Array.isArray(error.error.message)
          ? error.error.message.join(', ') // Si es error de class-validator de Nest
          : error.error.message;
      }

      // Mostrar notificación estándar en todo el ERP
      if (error.error?.code === 'FECHA_SISTEMA') {
        // La Fecha del Sistema del ERP no coincide con la del servidor:
        // el backend bloqueó la operación. Mensaje propio (el genérico de 409
        // no explica cómo desbloquearse).
        msgs.add({ severity: 'error', summary: 'Fecha del Sistema desactualizada', detail });
      } else if (error.status === 404) {
        msgs.add({ severity: 'warn', summary: 'No encontrado', detail });
      } else if (error.status === 409) {
        msgs.add({ severity: 'error', summary: 'Conflicto de Datos', detail });
      } else if (error.status === 403) {
        msgs.add({ severity: 'error', summary: 'Acceso Denegado', detail: 'No tienes permisos para esta acción.' });
      } else {
        msgs.add({ severity: 'error', summary: 'Error', detail });
      }
      return throwError(() => error);
    }),
  );
};
