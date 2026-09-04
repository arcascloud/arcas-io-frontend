import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Tag } from '../models/inventario.models';

@Injectable({ providedIn: 'root' })
export class TagsService {
  private api = inject(ApiService);

  private path = '/inventario/tags';

  /**
   * Obtiene todas las etiquetas del backend
   * @returns Observable con el listado completo de etiquetas
   */
  getAll(): Observable<Tag[]> {
    return this.api.get<Tag[]>(this.path);
  }

  /**
   * Obtiene una etiqueta por su ID
   * @param id - Identificador único de la etiqueta
   * @returns Observable con la etiqueta encontrada
   */
  getOne(id: number): Observable<Tag> {
    return this.api.getOne<Tag>(this.path, id);
  }

  /**
   * Crea una nueva etiqueta en el backend
   * @param dto - Datos parciales de la etiqueta a crear
   * @returns Observable con la etiqueta creada
   */
  create(dto: Partial<Tag>): Observable<Tag> {
    return this.api.post<Tag>(this.path, dto);
  }

  /**
   * Actualiza una etiqueta existente en el backend
   * @param id - Identificador único de la etiqueta a actualizar
   * @param dto - Datos parciales de la etiqueta a actualizar
   * @returns Observable con la etiqueta actualizada
   */
  update(id: number, dto: Partial<Tag>): Observable<Tag> {
    return this.api.put<Tag>(this.path, id, dto);
  }
}
