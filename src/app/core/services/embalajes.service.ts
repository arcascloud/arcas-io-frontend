import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Embalaje } from '../models/inventario.models';

@Injectable({ providedIn: 'root' })
export class EmbalajesService {
  private api = inject(ApiService);

  private path = '/inventario/embalajes';

  /**
   * Obtiene todos los embalajes del backend
   * @returns Observable con el listado completo de embalajes
   */
  getAll(): Observable<Embalaje[]> {
    return this.api.get<Embalaje[]>(this.path);
  }

  /**
   * Obtiene un embalaje por su ID
   * @param id - Identificador único del embalaje
   * @returns Observable con el embalaje encontrado
   */
  getOne(id: number): Observable<Embalaje> {
    return this.api.getOne<Embalaje>(this.path, id);
  }

  /**
   * Crea un nuevo embalaje en el backend
   * @param dto - Datos parciales del embalaje a crear
   * @returns Observable con el embalaje creado
   */
  create(dto: Partial<Embalaje>): Observable<Embalaje> {
    return this.api.post<Embalaje>(this.path, dto);
  }

  /**
   * Actualiza un embalaje existente en el backend
   * @param id - Identificador único del embalaje a actualizar
   * @param dto - Datos parciales del embalaje a actualizar
   * @returns Observable con el embalaje actualizado
   */
  update(id: number, dto: Partial<Embalaje>): Observable<Embalaje> {
    return this.api.put<Embalaje>(this.path, id, dto);
  }
}
