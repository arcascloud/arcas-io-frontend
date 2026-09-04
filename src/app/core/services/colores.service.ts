import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Color } from '../models/inventario.models';

@Injectable({ providedIn: 'root' })
export class ColoresService {
  private api = inject(ApiService);

  private path = '/inventario/colores';

  /**
   * Obtiene todos los colores del backend
   * @returns Observable con el listado completo de colores
   */
  getAll(): Observable<Color[]> {
    return this.api.get<Color[]>(this.path);
  }

  /**
   * Obtiene un color por su ID
   * @param id - Identificador único del color
   * @returns Observable con el color encontrado
   */
  getOne(id: number): Observable<Color> {
    return this.api.getOne<Color>(this.path, id);
  }

  /**
   * Crea un nuevo color en el backend
   * @param dto - Datos parciales del color a crear
   * @returns Observable con el color creado
   */
  create(dto: Partial<Color>): Observable<Color> {
    return this.api.post<Color>(this.path, dto);
  }

  /**
   * Actualiza un color existente en el backend
   * @param id - Identificador único del color a actualizar
   * @param dto - Datos parciales del color a actualizar
   * @returns Observable con el color actualizado
   */
  update(id: number, dto: Partial<Color>): Observable<Color> {
    return this.api.put<Color>(this.path, id, dto);
  }
}
