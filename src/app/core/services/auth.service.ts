import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of, map, interval, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MessageService } from 'primeng/api';
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
  refresh_token?: string;
  usuario: AuthUser;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private msg = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  private user = signal<AuthUser | null>(this.loadUser());

  /** Indica si el usuario está autenticado */
  readonly isAuthenticated = computed(() => !!this.user());
  /** Usuario autenticado actual (solo lectura) */
  readonly currentUser = this.user.asReadonly();

  /** Minutos restantes del token antes de expirar (0 si no hay token o ya expiró) */
  readonly minutosRestantesToken = signal<number>(0);

  /** Marca interna para no avisar dos veces seguidas si el refresh falla */
  private avisoExpiracionMostrado = false;

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

  constructor() {
    // Verificar token cada 30 segundos
    interval(30_000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.verificarExpiracionToken());
    // Verificación inicial
    this.verificarExpiracionToken();
  }

  login(usuario: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, {
      usuario,
      password,
    }).pipe(
      tap((res) => this.guardarSesion(res)),
    );
  }

  loginRaw(body: Record<string, unknown>): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, body).pipe(
      tap((res) => this.guardarSesion(res)),
    );
  }

  /** Guarda usuario + tokens (Bearer cross-site y refresh silencioso) */
  private guardarSesion(res: LoginResponse): void {
    localStorage.setItem('user', JSON.stringify(res.usuario));
    if (res.access_token) localStorage.setItem('token', res.access_token);
    if (res.refresh_token) localStorage.setItem('refresh_token', res.refresh_token);
    this.user.set(res.usuario);
    this.avisoExpiracionMostrado = false;
    this.verificarExpiracionToken();
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

  /**
   * Renueva el access_token usando el refresh_token guardado.
   * Retorna true si éxito, false si falla (token inválido/expirado).
   */
  refreshToken(): Observable<boolean> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return of(false);

    return this.http.post<{ access_token: string; refresh_token: string }>(
      `${environment.apiUrl}/auth/refresh`,
      { refresh_token: refreshToken },
    ).pipe(
      tap((res) => {
        if (res.access_token) localStorage.setItem('token', res.access_token);
        if (res.refresh_token) localStorage.setItem('refresh_token', res.refresh_token);
        this.avisoExpiracionMostrado = false;
      }),
      map(() => true),
      catchError(() => of(false)),
    );
  }

  /** Verifica la expiración del token y avisa / renueva según corresponda */
  private verificarExpiracionToken(): void {
    const token = localStorage.getItem('token');
    if (!token) {
      this.minutosRestantesToken.set(0);
      return;
    }
    const exp = this.extraerExpiracionJWT(token);
    if (!exp) {
      this.minutosRestantesToken.set(0);
      return;
    }
    const ahora = Math.floor(Date.now() / 1000);
    const diffMin = Math.max(0, Math.ceil((exp - ahora) / 60));
    this.minutosRestantesToken.set(diffMin);

    // Si falta 1 minuto o menos y no avisamos, mostramos alerta
    if (diffMin <= 1 && diffMin > 0 && !this.avisoExpiracionMostrado) {
      this.avisoExpiracionMostrado = true;
      this.msg.add({
        severity: 'warn',
        summary: 'Sesión por expirar',
        detail: 'Su sesión expira en menos de 1 minuto. Se intentará renovar automáticamente.',
        life: 10_000,
      });
    }

    // Si ya expiró o falta menos de 30s, intentamos renovar
    if (diffMin <= 0) {
      this.renovarTokenSilencioso();
    }
  }

  /** Intenta renovar el token silenciosamente; si falla, hace logout */
  private renovarTokenSilencioso(): void {
    this.refreshToken().subscribe({
      next: (ok) => {
        if (!ok) {
          this.msg.add({
            severity: 'error',
            summary: 'Sesión expirada',
            detail: 'No se pudo renovar la sesión. Por favor, vuelva a iniciar sesión.',
            life: 8_000,
          });
          this.logout();
        } else {
          this.msg.add({
            severity: 'success',
            summary: 'Sesión renovada',
            detail: 'Su sesión se ha renovado correctamente.',
            life: 4_000,
          });
          this.verificarExpiracionToken(); // Recalcula minutos con el nuevo token
        }
      },
      error: () => {
        this.msg.add({
          severity: 'error',
          summary: 'Sesión expirada',
          detail: 'Error de red al renovar sesión. Por favor, vuelva a iniciar sesión.',
          life: 8_000,
        });
        this.logout();
      },
    });
  }

  /** Extrae el campo 'exp' (unix timestamp) del payload del JWT */
  private extraerExpiracionJWT(token: string): number | null {
    try {
      const partes = token.split('.');
      if (partes.length !== 3) return null;
      const payload = JSON.parse(atob(partes[1].replace(/-/g, '+').replace(/_/g, '/')));
      return payload.exp ?? null;
    } catch {
      return null;
    }
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
    this.minutosRestantesToken.set(0);
    this.avisoExpiracionMostrado = false;
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
