import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Existencia } from '../models/inventario.models';

@Injectable({ providedIn: 'root' })
export class ExistenciasService {
  private api = inject(ApiService);

  private path = '/inventario/existencias';

  /**
   * Obtiene todas las existencias del backend
   * @returns Observable con el listado completo de existencias
   */
  getAll(): Observable<Existencia[]> {
    return this.api.get<Existencia[]>(this.path);
  }

  /**
   * Obtiene una existencia por su ID
   * @param id - Identificador único de la existencia
   * @returns Observable con la existencia encontrada
   */
  getOne(id: number): Observable<Existencia> {
    return this.api.getOne<Existencia>(this.path, id);
  }
}
