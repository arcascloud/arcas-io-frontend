import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

/**
 * Opciones para escrituras (POST/PUT) al backend
 */
export interface ApiWriteOpts {
  /** Si es true, no se inyecta empresaId ni Idsucursal en el body */
  sinContexto?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  // Rutas cuyas tablas poseen la columna Idsucursal: se inyecta automáticamente.
  private static CON_SUCURSAL: string[] = [
    '/bancos/bancos',
    '/bancos/cuentas',
    '/contabilidad/copdamae',
    '/contabilidad/copdadet',
    '/contabilidad/ctacontables',
    '/contabilidad/cierrectable/realizar',
    '/contabilidad/cierredet',
    '/contabilidad/partida-inicial',
    '/cxc/caja-mae',
    '/cxc/caja-det',
    '/cxc/carteras-cliente',
    '/cxp/carteras-cta',
    '/facturacion/facturas',
    '/facturacion/facturas-det',
    '/planilla/empleados',
  ];

  // Rutas cuyas tablas NO poseen la columna empresaId.
  private static SIN_EMPRESA: string[] = [];

  /**
   * Construye HttpParams con empresaId del usuario actual
   * @param params - Parámetros adicionales a incluir en la query string
   * @returns HttpParams con empresaId y parámetros adicionales
   */
  private withEmpresa(params?: Record<string, string | number>): HttpParams {
    let p = new HttpParams();
    const empresaId = this.auth.currentUser()?.empresaId;
    if (empresaId) {
      p = p.set('empresaId', empresaId.toString());
    }
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        p = p.set(key, String(value));
      }
    }
    return p;
  }

  /**
   * Inyecta empresaId e Idsucursal del usuario en el cuerpo de altas/modificaciones.
   * @param path - Ruta del endpoint para verificar si requiere contexto
   * @param body - Cuerpo de la petición
   * @param opts - Opciones de escritura
   * @returns Body con contexto inyectado
   */
  private withContexto(path: string, body: unknown, opts?: ApiWriteOpts): unknown {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return body;
    }
    const out: Record<string, any> = { ...(body as Record<string, any>) };
    const user = this.auth.currentUser();

    if (!opts?.sinContexto && !ApiService.SIN_EMPRESA.includes(path)) {
      if (user?.empresaId != null && out['empresaId'] === undefined) {
        out['empresaId'] = user.empresaId;
      }
    }
    if (!opts?.sinContexto && ApiService.CON_SUCURSAL.includes(path)) {
      if (user?.idsucursal != null && out['Idsucursal'] === undefined) {
        out['Idsucursal'] = user.idsucursal;
      }
    }
    if (!opts?.sinContexto && out['usuarioCreated'] === undefined && user?.usuario) {
      out['usuarioCreated'] = user.usuario;
    }
    return out;
  }

  /**
   * Realiza una petición GET al backend
   * @param path - Ruta relativa del endpoint (ej: '/cxc/clientes')
   * @param params - Parámetros de query adicionales
   * @returns Observable con la respuesta tipada
   */
  get<T>(path: string, params?: Record<string, string | number>): Observable<T> {
    console.log('[ApiService] GET', path, 'params:', this.withEmpresa(params).toString());
    return this.http.get<T>(`${environment.apiUrl}${path}`, {
      params: this.withEmpresa(params),
    }).pipe(
      tap(res => console.log('[ApiService] GET response', path, res)),
    );
  }

  /**
   * Obtiene un registro por su ID
   * @param path - Ruta relativa del endpoint
   * @param id - Identificador del registro
   * @returns Observable con el registro tipado
   */
  getOne<T>(path: string, id: number | string): Observable<T> {
    return this.http.get<T>(`${environment.apiUrl}${path}/${id}`, {
      params: this.withEmpresa(),
    });
  }

  /**
   * Envía un registro nuevo al backend (POST)
   * @param path - Ruta relativa del endpoint
   * @param body - Datos del registro a crear
   * @param opts - Opciones de escritura (ej: sinContexto para omitir inyección de empresaId)
   * @returns Observable con la respuesta tipada
   */
  post<T>(path: string, body: unknown, opts?: ApiWriteOpts): Observable<T> {
    return this.http.post<T>(`${environment.apiUrl}${path}`, this.withContexto(path, body, opts));
  }

  /**
   * Actualiza un registro existente por ID (PUT)
   * @param path - Ruta relativa del endpoint
   * @param id - Identificador del registro a actualizar
   * @param body - Datos actualizados del registro
   * @param opts - Opciones de escritura
   * @returns Observable con la respuesta tipada
   */
  put<T>(path: string, id: number | string, body: unknown, opts?: ApiWriteOpts): Observable<T> {
    return this.http.put<T>(`${environment.apiUrl}${path}/${id}`, this.withContexto(path, body, opts), {
      params: this.withEmpresa(),
    });
  }

  /**
   * Actualiza un registro sin incluir el ID en la ruta (PUT a la ruta base)
   * @param path - Ruta relativa del endpoint
   * @param body - Datos actualizados del registro
   * @param opts - Opciones de escritura
   * @param params - Query params adicionales (ej: empresaId explícito; sobrescribe el auto-inyectado)
   * @returns Observable con la respuesta tipada
   */
  putBase<T>(path: string, body: unknown, opts?: ApiWriteOpts, params?: Record<string, string | number>): Observable<T> {
    return this.http.put<T>(`${environment.apiUrl}${path}`, this.withContexto(path, body, opts), {
      params: this.withEmpresa(params),
    });
  }

  /**
   * Elimina un registro por su ID
   * @param path - Ruta relativa del endpoint
   * @param id - Identificador del registro a eliminar
   * @returns Observable con la respuesta tipada
   */
  delete<T>(path: string, id: number | string): Observable<T> {
    return this.http.delete<T>(`${environment.apiUrl}${path}/${id}`, {
      params: this.withEmpresa(),
    });
  }
}
