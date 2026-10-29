import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

/** Datos del usuario autenticado */
export interface AuthUser {
  /** ID del usuario */
  usuarioId: number;
  /** Nombre de usuario para login */
  usuario: string;
  /** Nombre completo del usuario */
  nombre: string;
  /** Correo electrónico */
  email: string;
  /** ID de la empresa a la que pertenece */
  empresaId: number;
  /** ID de la sucursal del usuario */
  idsucursal: number;
  /** Rol del usuario (ej: 'admin', 'contador') */
  rol?: string;
  /** Roles del usuario (ttipo_rol vía tusuarios_rol) */
  roles?: string[];
  /**
   * Tipo de persona que determinó el backend al iniciar sesión (por datos,
   * no por el checkbox del formulario): 'C' = cliente (solo rutas de
   * tienda/pedidos), 'E' = empleado (acceso completo al ERP).
   */
  tipoPersona?: 'C' | 'E';
  /**
   * Flag de `tusuariosinfo`:
   * - `'S'` → usuario CRM/cliente → `main-layout-public`
   * - `'N'` → usuario ERP → `main-layout-private`
   */
  sn_cliente?: 'S' | 'N';
}

/**
 * Rutas permitidas para usuarios cliente (`tipoPersona === 'C'`).
 * El guard de autenticación y el filtro de menú usan esta lista como
 * única fuente de verdad.
 */
export const RUTAS_CLIENTE: readonly string[] = [
  '/tienda',
  '/pedidos',
  '/facturacion/tienda',
  '/facturacion/pedidos-virtual',
];

/**
 * Rutas públicas: accesibles SIN sesión (la tienda se puede navegar como
 * visitante; el botón "Pagar" se habilita solo con sesión activa).
 */
export const RUTAS_PUBLICAS: readonly string[] = [
  '/tienda',
  '/facturacion/tienda',
];

/** Roles con permiso de administrar cuentas contables (sn_operable / cuentas con historial) */
export const ROLES_CONTABILIDAD = ['admin', 'supervisor', 'contador'];

/** Roles con permiso de administrar fechas autorizadas (tfecma/tfecdet) y de corregir la Fecha del Sistema del ERP */
export const ROLES_FECHAS = ['admin', 'supervisor', 'contador'];

/** Respuesta del endpoint de login */
export interface LoginResponse {
  /** Token JWT de autenticación */
  access_token: string;
  /** Datos del usuario autenticado */
  usuario: AuthUser;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private token = signal<string | null>(localStorage.getItem('token'));
  private user = signal<AuthUser | null>(this.loadUser());

  /** Indica si el usuario está autenticado (token presente) */
  readonly isAuthenticated = computed(() => !!this.token());
  /** Usuario autenticado actual (solo lectura) */
  readonly currentUser = this.user.asReadonly();
  /** Token JWT actual (solo lectura) */
  readonly tokenValue = this.token.asReadonly();
  /** true si el usuario tiene un rol privilegiado en contabilidad (admin/supervisor/contador) */
  readonly esRolContabilidad = computed(() => {
    const u = this.user();
    if (!u) return false;
    const roles = u.roles ?? (u.rol ? [u.rol] : []);
    return roles.some((r) => ROLES_CONTABILIDAD.includes(r));
  });

  /** true si el usuario puede administrar fechas autorizadas y la Fecha del Sistema (admin/supervisor/contador) */
  readonly esRolFechas = computed(() => {
    const u = this.user();
    if (!u) return false;
    const roles = u.roles ?? (u.rol ? [u.rol] : []);
    return roles.some((r) => ROLES_FECHAS.includes(r));
  });

  /** true si la sesión actual pertenece a un cliente (tipoPersona 'C' según datos del backend) */
  readonly esCliente = computed(() => this.user()?.tipoPersona === 'C');

  /**
   * true si el usuario es ERP → `main-layout-private`.
   * Regla: `sn_cliente !== 'S'` (vacío/undefined se considera ERP por defecto
   * para no romper sesiones antiguas guardadas en localStorage).
   */
  readonly esERP = computed(() => {
    const u = this.user();
    if (!u) return false;
    return u.sn_cliente !== 'S';
  });

  /**
   * Autentica al usuario con credenciales
   * @param usuario - Nombre de usuario
   * @param password - Contraseña
   * @returns Observable con el token JWT y datos del usuario
   */
  login(usuario: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, {
      usuario,
      password,
    }).pipe(
      tap((res) => {
        localStorage.setItem('token', res.access_token);
        localStorage.setItem('user', JSON.stringify(res.usuario));
        this.token.set(res.access_token);
        this.user.set(res.usuario);
      }),
    );
  }

  /**
   * Autentica al usuario con un body completo (para login con campos adicionales)
   * @param body - Cuerpo de la petición con usuario, password y otros campos
   * @returns Observable con el token JWT y datos del usuario
   */
  loginRaw(body: Record<string, unknown>): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, body).pipe(
      tap((res) => {
        localStorage.setItem('token', res.access_token);
        localStorage.setItem('user', JSON.stringify(res.usuario));
        this.token.set(res.access_token);
        this.user.set(res.usuario);
      }),
    );
  }

  /**
   * Verifica si hay una sesión activa (token y usuario presentes en localStorage)
   * @returns Observable que emite true si la sesión es válida, false en caso contrario
   */
  checkStatus(): Observable<boolean> {
    return new Observable<boolean>((observer) => {
      const token = this.token();
      const user = this.user();
      const valid = !!token && !!user;
      observer.next(valid);
      observer.complete();
    });
  }

  /**
   * Cierra la sesión de quien sea:
   * 1. Limpieza TOTAL — localStorage, sessionStorage y cookies (evita
   *    falsos positivos de sesión al re-ingresar).
   * 2. Destino según `VALIDAR_SESSION`:
   *    - `'N'` → `facturacion/tienda` (NUNCA /login ni /dashboard)
   *    - `'S'` → `/login` (NUNCA la tienda)
   */
  logout(): void {
    this.limpiarSesion();
    this.token.set(null);
    this.user.set(null);
    const destino: string[] =
      environment.VALIDAR_SESSION === 'N'
        ? ['/facturacion/tienda']
        : ['/login'];
    this.router.navigate(destino);
  }

  /**
   * Elimina TODO rastro de sesión: localStorage completo (token, usuario,
   * preferencias, contraseña recordada, carrito, ventas suspendidas…),
   * sessionStorage y todas las cookies del documento.
   */
  private limpiarSesion(): void {
    try {
      localStorage.clear();
    } catch {
      // storage no disponible → se ignora
    }
    try {
      sessionStorage.clear();
    } catch {
      // storage no disponible → se ignora
    }
    document.cookie.split(';').forEach((cookie) => {
      const eq = cookie.indexOf('=');
      const nombre = (eq > 0 ? cookie.substring(0, eq) : cookie).trim();
      if (nombre) {
        document.cookie = `${nombre}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      }
    });
  }

  /**
   * Carga el usuario desde localStorage al iniciar la aplicación
   * @returns Usuario autenticado o null si no hay sesión guardada
   */
  private loadUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
