import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const msgs = inject(MessageService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Evitamos mostrar Toast para un 401: logout() limpia signals +
      // localStorage + navega a /login (el interceptor ya no debe hacerlo a mano).
      if (error.status === 401) {
        auth.logout();
      } else {
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
      }
      return throwError(() => error);
    }),
  );
};
