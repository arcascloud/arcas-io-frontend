import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Marca } from '../models/inventario.models';

@Injectable({ providedIn: 'root' })
export class MarcasService {
  private api = inject(ApiService);

  private path = '/inventario/marcas';

  /**
   * Obtiene todas las marcas del backend
   * @returns Observable con el listado completo de marcas
   */
  getAll(): Observable<Marca[]> {
    return this.api.get<Marca[]>(this.path);
  }

  /**
   * Obtiene una marca por su ID
   * @param id - Identificador único de la marca
   * @returns Observable con la marca encontrada
   */
  getOne(id: number): Observable<Marca> {
    return this.api.getOne<Marca>(this.path, id);
  }

  /**
   * Crea una nueva marca en el backend
   * @param dto - Datos parciales de la marca a crear
   * @returns Observable con la marca creada
   */
  create(dto: Partial<Marca>): Observable<Marca> {
    return this.api.post<Marca>(this.path, dto);
  }

  /**
   * Actualiza una marca existente en el backend
   * @param id - Identificador único de la marca a actualizar
   * @param dto - Datos parciales de la marca a actualizar
   * @returns Observable con la marca actualizada
   */
  update(id: number, dto: Partial<Marca>): Observable<Marca> {
    return this.api.put<Marca>(this.path, id, dto);
  }
}
