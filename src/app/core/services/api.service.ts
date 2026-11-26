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
  /**
   * Si es true, NO se inyecta empresaId en la QUERY (GET/PUT).
   * Catálogos multi-empresa: la lista/edición no se filtran por la
   * empresa de la sesión (ej: sucursales de todas las empresas).
   */
  sinEmpresa?: boolean;
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
    '/facturacion/fac-caja',
    '/facturacion/pedidos',
    '/facturacion/pedidos-det',
    '/facturacion/pedidos/checkout',
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
    // Sesión activa → empresaId del usuario; visitante sin sesión (tienda
    // pública) → fallback a environment.empresaId.
    const empresaId = this.auth.currentUser()?.empresaId ?? environment.empresaId;
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
   * Query params con empresaId (inyección automática) u opcionales.
   * Con `sinEmpresa` solo se propagan los params explícitos (catálogo multi-empresa).
   */
  private withEmpresaQuery(
    params?: Record<string, string | number>,
    sinEmpresa?: boolean,
  ): HttpParams {
    if (sinEmpresa) {
      let p = new HttpParams();
      if (params) {
        for (const [key, value] of Object.entries(params)) {
          p = p.set(key, String(value));
        }
      }
      return p;
    }
    return this.withEmpresa(params);
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

    if (!opts?.sinContexto && !opts?.sinEmpresa && !ApiService.SIN_EMPRESA.includes(path)) {
      // Sesión activa → empresaId del usuario; sin sesión → environment.empresaId
      const empresaId = user?.empresaId ?? environment.empresaId;
      if (empresaId != null && out['empresaId'] === undefined) {
        out['empresaId'] = empresaId;
      }
    }
    if (!opts?.sinContexto && ApiService.CON_SUCURSAL.includes(path)) {
      const idsucursal = Number(user?.idsucursal) || 1;
      if (out['Idsucursal'] === undefined || !Number(out['Idsucursal'])) {
        out['Idsucursal'] = idsucursal;
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
   * @param opts - `sinEmpresa` omite la inyección de empresaId en la query
   * @returns Observable con la respuesta tipada
   */
  get<T>(path: string, params?: Record<string, string | number>, opts?: ApiWriteOpts): Observable<T> {
    const query = this.withEmpresaQuery(params, opts?.sinEmpresa);
    console.log('[ApiService] GET', path, 'params:', query.toString());
    return this.http.get<T>(`${environment.apiUrl}${path}`, {
      params: query,
    }).pipe(
      tap(res => console.log('[ApiService] GET response', path, res)),
    );
  }

  /**
   * Obtiene un registro por su ID
   * @param path - Ruta relativa del endpoint
   * @param id - Identificador del registro
   * @param opts - `sinEmpresa` omite la inyección de empresaId en la query
   * @returns Observable con el registro tipado
   */
  getOne<T>(path: string, id: number | string, opts?: ApiWriteOpts): Observable<T> {
    return this.http.get<T>(`${environment.apiUrl}${path}/${id}`, {
      params: this.withEmpresaQuery(undefined, opts?.sinEmpresa),
    });
  }

  /**
   * Envía un registro nuevo al backend (POST)
   * @param path - Ruta relativa del endpoint
   * @param body - Datos del registro a crear
   * @param opts - Opciones de escritura (ej: sinContexto para omitir inyección de empresaId)
   * @returns Observable con la respuesta tipada
   */
  post<T>(
    path: string,
    body: unknown,
    opts?: ApiWriteOpts,
    params?: Record<string, string | number>,
  ): Observable<T> {
    return this.http.post<T>(`${environment.apiUrl}${path}`, this.withContexto(path, body, opts), {
      params: params ? this.withEmpresa(params) : undefined,
    });
  }

  /**
   * Actualiza un registro existente por ID (PUT)
   * @param path - Ruta relativa del endpoint
   * @param id - Identificador del registro a actualizar
   * @param body - Datos actualizados del registro
   * @param opts - Opciones de escritura
   * @param params - Query params adicionales (ej: empresaId explícito; sobrescribe el auto-inyectado)
   * @returns Observable con la respuesta tipada
   */
  put<T>(path: string, id: number | string, body: unknown, opts?: ApiWriteOpts, params?: Record<string, string | number>): Observable<T> {
    return this.http.put<T>(`${environment.apiUrl}${path}/${id}`, this.withContexto(path, body, opts), {
      params: this.withEmpresaQuery(params, opts?.sinEmpresa),
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
   * @param params - Query params adicionales (ej: empresaId explícito; sobrescribe el auto-inyectado)
   * @returns Observable con la respuesta tipada
   */
  delete<T>(path: string, id: number | string, params?: Record<string, string | number>): Observable<T> {
    return this.http.delete<T>(`${environment.apiUrl}${path}/${id}`, {
      params: this.withEmpresa(params),
    });
  }
}
