import { Injectable, effect, inject, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';
import { EmpresasService } from './empresas.service';
import { Empresa } from '../models/empresa.models';

/** Imagen de respaldo cuando la empresa no tiene logo en `tempresaslogo`. */
const LOGO_FALLBACK = 'assets/images/logo1.png';

/**
 * Branding de la empresa (nombre + logo) mostrado en los layouts.
 * Se obtiene de `tempresas` / `tempresaslogo` según el `empresaId` del
 * usuario logueado (con respaldo a `environment.empresaId` sin sesión).
 */
@Injectable({ providedIn: 'root' })
export class EmpresaBrandService {
  private readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly empresas = inject(EmpresasService);

  /** Empresa forzada por un layout (ej. el público usa `environment.empresaId`). */
  private readonly _empresaIdForzado = signal<number | null>(null);

  private readonly _nombre = signal(this.leerCache(this.empresaIdActual()) ?? '');
  private readonly _logo = signal(LOGO_FALLBACK);

  /** Nombre de la empresa actual (reactivo). */
  readonly nombre = this._nombre.asReadonly();
  /** Logo de la empresa actual como data URL (reactivo). */
  readonly logo = this._logo.asReadonly();

  /**
   * Fuerza el `empresaId` a usar (ignora al usuario logueado).
   * El layout público lo fija con `environment.empresaId` (definido en `.env`);
   * pasar `null` restaura el comportamiento basado en el usuario.
   */
  fijarEmpresaId(empresaId: number | null): void {
    this._empresaIdForzado.set(empresaId);
  }

  /** Reacciona a login/logout o cambio de empresa del usuario. */
  private readonly _sync = effect(() => {
    const empresaId = this.empresaIdActual();
    if (!empresaId) {
      this._nombre.set('');
      this._logo.set(LOGO_FALLBACK);
      return;
    }
    const cache = this.leerCache(empresaId);
    if (cache) this._nombre.set(cache);
    this.cargar(empresaId);
  });

  /** empresaId efectivo: forzado por el layout; si no, el del usuario; sin sesión, el del environment. */
  private empresaIdActual(): number {
    const forzado = this._empresaIdForzado();
    if (forzado != null) return forzado;
    const user = this.auth.currentUser();
    return Number(user?.empresaId) || Number(environment.empresaId) || 0;
  }

  private cargar(empresaId: number): void {
    this.api.getOne<Empresa>('/companies', empresaId).subscribe({
      next: (empresa) => {
        const nombre = String(empresa?.descripcion ?? '').trim();
        if (nombre) {
          this._nombre.set(nombre);
          this.guardarCache(empresaId, nombre);
        }
      },
      error: () => {
        // Backend reiniciando o sin red: se conserva el caché/valor previo.
      },
    });

    this.empresas.getLogo(empresaId).subscribe({
      next: (logo) => this._logo.set(this.resolverLogo(logo?.img ?? null)),
      error: () => this._logo.set(LOGO_FALLBACK),
    });
  }

  /** Normaliza el base64 de `tempresaslogo.img` a un data URL válido. */
  private resolverLogo(img: string | null): string {
    if (!img) return LOGO_FALLBACK;
    if (img.startsWith('data:')) return img;
    const mime = img.startsWith('/9j/')
      ? 'image/jpeg'
      : img.startsWith('R0lGOD')
        ? 'image/gif'
        : 'image/png';
    return `data:${mime};base64,${img}`;
  }

  private claveCache(empresaId: number): string {
    return `empresa_brand_nombre_${empresaId}`;
  }

  private leerCache(empresaId: number): string | null {
    if (!empresaId) return null;
    try {
      return localStorage.getItem(this.claveCache(empresaId));
    } catch {
      return null;
    }
  }

  private guardarCache(empresaId: number, nombre: string): void {
    try {
      localStorage.setItem(this.claveCache(empresaId), nombre);
    } catch {
      // almacenamiento no disponible: se usa solo el valor en memoria
    }
  }
}
