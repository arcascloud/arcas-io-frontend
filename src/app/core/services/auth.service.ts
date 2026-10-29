import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of, map } from 'rxjs';
import { environment } from '../../../environments/environment';

/** Datos del usuario autenticado */
export interface AuthUser {
  usuarioId: number;
  usuario: string;
  nombre: string;
  email: string;
  empresaId: number;
  idsucursal: number;
  rol?: string;
  roles?: string[];
  tipoPersona?: 'C' | 'E';
  sn_cliente?: 'S' | 'N';
}

export const RUTAS_CLIENTE: readonly string[] = [
  '/tienda',
  '/pedidos',
  '/facturacion/tienda',
  '/facturacion/pedidos-virtual',
];

export const RUTAS_PUBLICAS: readonly string[] = [
  '/tienda',
  '/facturacion/tienda',
];

export const ROLES_CONTABILIDAD = ['admin', 'supervisor', 'contador'];
export const ROLES_FECHAS = ['admin', 'supervisor', 'contador'];

export interface LoginResponse {
  access_token?: string;
  usuario: AuthUser;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private user = signal<AuthUser | null>(this.loadUser());

  /** Indica si el usuario está autenticado */
  readonly isAuthenticated = computed(() => !!this.user());
  /** Usuario autenticado actual (solo lectura) */
  readonly currentUser = this.user.asReadonly();

  readonly esRolContabilidad = computed(() => {
    const u = this.user();
    if (!u) return false;
    const roles = u.roles ?? (u.rol ? [u.rol] : []);
    return roles.some((r) => ROLES_CONTABILIDAD.includes(r));
  });

  readonly esRolFechas = computed(() => {
    const u = this.user();
    if (!u) return false;
    const roles = u.roles ?? (u.rol ? [u.rol] : []);
    return roles.some((r) => ROLES_FECHAS.includes(r));
  });

  readonly esCliente = computed(() => this.user()?.tipoPersona === 'C');

  readonly esERP = computed(() => {
    const u = this.user();
    if (!u) return false;
    return u.sn_cliente !== 'S';
  });

  login(usuario: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, {
      usuario,
      password,
    }).pipe(
      tap((res) => {
        localStorage.setItem('user', JSON.stringify(res.usuario));
        this.user.set(res.usuario);
      }),
    );
  }

  loginRaw(body: Record<string, unknown>): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, body).pipe(
      tap((res) => {
        localStorage.setItem('user', JSON.stringify(res.usuario));
        this.user.set(res.usuario);
      }),
    );
  }

  checkStatus(): Observable<boolean> {
    if (!this.user()) return of(false);

    return this.http.get<AuthUser>(`${environment.apiUrl}/auth/me`).pipe(
      tap((user) => {
        this.user.set(user);
        localStorage.setItem('user', JSON.stringify(user));
      }),
      map(() => true),
      catchError(() => {
        this.limpiarSesion();
        this.user.set(null);
        return of(false);
      })
    );
  }

  logout(): void {
    this.http.post(`${environment.apiUrl}/auth/logout`, {}).subscribe({
      next: () => this.finalizarLogout(),
      error: () => this.finalizarLogout(),
    });
  }

  private finalizarLogout(): void {
    this.limpiarSesion();
    this.user.set(null);
    const destino: string[] =
      environment.VALIDAR_SESSION === 'N'
        ? ['/facturacion/tienda']
        : ['/login'];
    this.router.navigate(destino);
  }

  private limpiarSesion(): void {
    try {
      localStorage.clear();
    } catch {}
    try {
      sessionStorage.clear();
    } catch {}
    document.cookie.split(';').forEach((cookie) => {
      const eq = cookie.indexOf('=');
      const nombre = (eq > 0 ? cookie.substring(0, eq) : cookie).trim();
      if (nombre) {
        document.cookie = `${nombre}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      }
    });
  }

  private loadUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
