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
}

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
   * Cierra la sesión del usuario, limpia localStorage y redirige a login
   */
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.token.set(null);
    this.user.set(null);
    this.router.navigate(['/login']);
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
