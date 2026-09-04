import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Sucursal } from '../models/sucursal.models';

@Injectable({ providedIn: 'root' })
export class SucursalesService {
  private api = inject(ApiService);

  private path = '/sucursales';

  /**
   * Obtiene la lista de sucursales, opcionalmente filtradas por empresa.
   * @param empresaId - ID de la empresa para filtrar las sucursales. Si no se proporciona, retorna todas las sucursales.
   * @returns Observable con el arreglo de sucursales.
   */
  getAll(empresaId?: number): Observable<Sucursal[]> {
    return this.api.get<Sucursal[]>(this.path, empresaId ? { empresaId } : undefined);
  }
}
