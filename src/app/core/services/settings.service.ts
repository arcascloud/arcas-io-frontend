import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private api = inject(ApiService);

  /**
   * Obtiene configuración de parámetros por ruta.
   * @param ruta - Ruta del recurso de configuración a consultar.
   * @returns Observable con la configuración obtenida.
   */
  get(ruta: string): Observable<any> {
    return this.api.get<any>(ruta);
  }

  /**
   * Guarda o actualiza configuración de parámetros.
   * @param ruta - Ruta del recurso de configuración a guardar o actualizar.
   * @param payload - Datos de configuración a persistir.
   * @returns Observable con la configuración resultante.
   */
  upsert(ruta: string, payload: unknown): Observable<any> {
    return this.api.putBase<any>(ruta, payload);
  }
}
