import { Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Nombre de la empresa mostrado en el branding de los layouts.
 * Se obtiene de `tempresas` usando `environment.empresaId` (EMPRESA_ID).
 */
@Injectable({ providedIn: 'root' })
export class EmpresaBrandService {
  private readonly empresaId = Number(environment.empresaId);
  private readonly _nombre = signal(this.leerCache() ?? '');
  readonly nombre = this._nombre.asReadonly();

  constructor() {
    void this.cargar();
  }

  private async cargar(intento = 0): Promise<void> {
    if (!this.empresaId) return;

    try {
      const url = `${environment.apiUrl}/companies/${this.empresaId}?empresaId=${this.empresaId}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const empresa = await res.json();
      const nombre = String(empresa?.descripcion ?? '').trim();
      if (nombre) {
        this._nombre.set(nombre);
        this.guardarCache(nombre);
      }
    } catch {
      // Si el backend está reiniciando, reintenta sin mostrar toasts.
      if (intento < 2) {
        setTimeout(() => void this.cargar(intento + 1), 2000);
      }
    }
  }

  private get claveCache(): string {
    return `empresa_brand_nombre_${this.empresaId}`;
  }

  private leerCache(): string | null {
    try {
      return localStorage.getItem(this.claveCache);
    } catch {
      return null;
    }
  }

  private guardarCache(nombre: string) {
    try {
      localStorage.setItem(this.claveCache, nombre);
    } catch {
      // almacenamiento no disponible: se usa solo el valor en memoria
    }
  }
}
