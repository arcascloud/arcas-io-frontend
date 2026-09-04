import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Modelo } from '../models/inventario.models';

@Injectable({ providedIn: 'root' })
export class ModelosService {
  private api = inject(ApiService);

  private path = '/inventario/modelos';

  /**
   * Obtiene todos los modelos del backend
   * @returns Observable con el listado completo de modelos
   */
  getAll(): Observable<Modelo[]> {
    return this.api.get<Modelo[]>(this.path);
  }

  /**
   * Obtiene un modelo por su ID
   * @param id - Identificador único del modelo
   * @returns Observable con el modelo encontrado
   */
  getOne(id: number): Observable<Modelo> {
    return this.api.getOne<Modelo>(this.path, id);
  }

  /**
   * Crea un nuevo modelo en el backend
   * @param dto - Datos parciales del modelo a crear
   * @returns Observable con el modelo creado
   */
  create(dto: Partial<Modelo>): Observable<Modelo> {
    return this.api.post<Modelo>(this.path, dto);
  }

  /**
   * Actualiza un modelo existente en el backend
   * @param id - Identificador único del modelo a actualizar
   * @param dto - Datos parciales del modelo a actualizar
   * @returns Observable con el modelo actualizado
   */
  update(id: number, dto: Partial<Modelo>): Observable<Modelo> {
    return this.api.put<Modelo>(this.path, id, dto);
  }
}
