import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Casa } from '../models/inventario.models';

@Injectable({ providedIn: 'root' })
export class CasasService {
  private api = inject(ApiService);

  private path = '/inventario/casas';

  /**
   * Obtiene todas las casas del backend
   * @returns Observable con el listado completo de casas
   */
  getAll(): Observable<Casa[]> {
    return this.api.get<Casa[]>(this.path);
  }

  /**
   * Obtiene una casa por su ID
   * @param id - Identificador único de la casa
   * @returns Observable con la casa encontrada
   */
  getOne(id: number): Observable<Casa> {
    return this.api.getOne<Casa>(this.path, id);
  }

  /**
   * Crea una nueva casa en el backend
   * @param dto - Datos parciales de la casa a crear
   * @returns Observable con la casa creada
   */
  create(dto: Partial<Casa>): Observable<Casa> {
    return this.api.post<Casa>(this.path, dto);
  }

  /**
   * Actualiza una casa existente en el backend
   * @param id - Identificador único de la casa a actualizar
   * @param dto - Datos parciales de la casa a actualizar
   * @returns Observable con la casa actualizada
   */
  update(id: number, dto: Partial<Casa>): Observable<Casa> {
    return this.api.put<Casa>(this.path, id, dto);
  }
}
