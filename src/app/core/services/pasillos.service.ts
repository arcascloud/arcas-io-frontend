import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Pasillo } from '../models/inventario.models';

@Injectable({ providedIn: 'root' })
export class PasillosService {
  private api = inject(ApiService);

  private path = '/inventario/pasillos';

  /**
   * Obtiene todos los pasillos del backend
   * @returns Observable con el listado completo de pasillos
   */
  getAll(): Observable<Pasillo[]> {
    return this.api.get<Pasillo[]>(this.path);
  }

  /**
   * Obtiene un pasillo por su ID
   * @param id - Identificador único del pasillo
   * @returns Observable con el pasillo encontrado
   */
  getOne(id: number): Observable<Pasillo> {
    return this.api.getOne<Pasillo>(this.path, id);
  }

  /**
   * Crea un nuevo pasillo en el backend
   * @param dto - Datos parciales del pasillo a crear
   * @returns Observable con el pasillo creado
   */
  create(dto: Partial<Pasillo>): Observable<Pasillo> {
    return this.api.post<Pasillo>(this.path, dto);
  }

  /**
   * Actualiza un pasillo existente en el backend
   * @param id - Identificador único del pasillo a actualizar
   * @param dto - Datos parciales del pasillo a actualizar
   * @returns Observable con el pasillo actualizado
   */
  update(id: number, dto: Partial<Pasillo>): Observable<Pasillo> {
    return this.api.put<Pasillo>(this.path, id, dto);
  }
}
