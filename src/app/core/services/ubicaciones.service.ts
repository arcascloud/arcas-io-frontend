import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Ubicacion } from '../models/inventario.models';

@Injectable({ providedIn: 'root' })
export class UbicacionesService {
  private api = inject(ApiService);

  private path = '/inventario/ubicaciones';

  /**
   * Obtiene todas las ubicaciones del backend
   * @returns Observable con el listado completo de ubicaciones
   */
  getAll(): Observable<Ubicacion[]> {
    return this.api.get<Ubicacion[]>(this.path);
  }

  /**
   * Obtiene una ubicación por su ID
   * @param id - Identificador único de la ubicación
   * @returns Observable con la ubicación encontrada
   */
  getOne(id: number): Observable<Ubicacion> {
    return this.api.getOne<Ubicacion>(this.path, id);
  }

  /**
   * Crea una nueva ubicación en el backend
   * @param dto - Datos parciales de la ubicación a crear
   * @returns Observable con la ubicación creada
   */
  create(dto: Partial<Ubicacion>): Observable<Ubicacion> {
    return this.api.post<Ubicacion>(this.path, dto);
  }

  /**
   * Actualiza una ubicación existente en el backend
   * @param id - Identificador único de la ubicación a actualizar
   * @param dto - Datos parciales de la ubicación a actualizar
   * @returns Observable con la ubicación actualizada
   */
  update(id: number, dto: Partial<Ubicacion>): Observable<Ubicacion> {
    return this.api.put<Ubicacion>(this.path, id, dto);
  }
}
