import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Bodega } from '../models/inventario.models';

@Injectable({ providedIn: 'root' })
export class BodegasService {
  private api = inject(ApiService);

  private path = '/inventario/bodegas';

  /**
   * Obtiene todas las bodegas del backend
   * @returns Observable con el listado completo de bodegas
   */
  getAll(): Observable<Bodega[]> {
    return this.api.get<Bodega[]>(this.path);
  }

  /**
   * Obtiene una bodega por su ID
   * @param id - Identificador único de la bodega
   * @returns Observable con la bodega encontrada
   */
  getOne(id: number): Observable<Bodega> {
    return this.api.getOne<Bodega>(this.path, id);
  }

  /**
   * Crea una nueva bodega en el backend
   * @param dto - Datos parciales de la bodega a crear
   * @returns Observable con la bodega creada
   */
  create(dto: Partial<Bodega>): Observable<Bodega> {
    return this.api.post<Bodega>(this.path, dto);
  }

  /**
   * Actualiza una bodega existente en el backend
   * @param id - Identificador único de la bodega a actualizar
   * @param dto - Datos parciales de la bodega a actualizar
   * @returns Observable con la bodega actualizada
   */
  update(id: number, dto: Partial<Bodega>): Observable<Bodega> {
    return this.api.put<Bodega>(this.path, id, dto);
  }
}
