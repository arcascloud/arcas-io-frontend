import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { UnidadMedida } from '../models/inventario.models';

@Injectable({ providedIn: 'root' })
export class UnidadesMedidaService {
  private api = inject(ApiService);

  private path = '/inventario/unidades-medida';

  /**
   * Obtiene todas las unidades de medida del backend
   * @returns Observable con el listado completo de unidades de medida
   */
  getAll(): Observable<UnidadMedida[]> {
    return this.api.get<UnidadMedida[]>(this.path);
  }

  /**
   * Obtiene una unidad de medida por su ID
   * @param id - Identificador único de la unidad de medida
   * @returns Observable con la unidad de medida encontrada
   */
  getOne(id: number): Observable<UnidadMedida> {
    return this.api.getOne<UnidadMedida>(this.path, id);
  }

  /**
   * Crea una nueva unidad de medida en el backend
   * @param dto - Datos parciales de la unidad de medida a crear
   * @returns Observable con la unidad de medida creada
   */
  create(dto: Partial<UnidadMedida>): Observable<UnidadMedida> {
    return this.api.post<UnidadMedida>(this.path, dto);
  }

  /**
   * Actualiza una unidad de medida existente en el backend
   * @param id - Identificador único de la unidad de medida a actualizar
   * @param dto - Datos parciales de la unidad de medida a actualizar
   * @returns Observable con la unidad de medida actualizada
   */
  update(id: number, dto: Partial<UnidadMedida>): Observable<UnidadMedida> {
    return this.api.put<UnidadMedida>(this.path, id, dto);
  }
}
