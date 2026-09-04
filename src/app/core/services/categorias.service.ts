import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Categoria } from '../models/inventario.models';

@Injectable({ providedIn: 'root' })
export class CategoriasService {
  private api = inject(ApiService);

  private path = '/inventario/categorias';

  /**
   * Obtiene todas las categorías del backend
   * @returns Observable con el listado completo de categorías
   */
  getAll(): Observable<Categoria[]> {
    return this.api.get<Categoria[]>(this.path);
  }

  /**
   * Obtiene una categoría por su ID
   * @param id - Identificador único de la categoría
   * @returns Observable con la categoría encontrada
   */
  getOne(id: number): Observable<Categoria> {
    return this.api.getOne<Categoria>(this.path, id);
  }

  /**
   * Crea una nueva categoría en el backend
   * @param dto - Datos parciales de la categoría a crear
   * @returns Observable con la categoría creada
   */
  create(dto: Partial<Categoria>): Observable<Categoria> {
    return this.api.post<Categoria>(this.path, dto);
  }

  /**
   * Actualiza una categoría existente en el backend
   * @param id - Identificador único de la categoría a actualizar
   * @param dto - Datos parciales de la categoría a actualizar
   * @returns Observable con la categoría actualizada
   */
  update(id: number, dto: Partial<Categoria>): Observable<Categoria> {
    return this.api.put<Categoria>(this.path, id, dto);
  }
}
