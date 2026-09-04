import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Testante } from '../models/inventario.models';

@Injectable({ providedIn: 'root' })
export class TestantesService {
  private api = inject(ApiService);

  private path = '/inventario/testantes';

  /**
   * Obtiene todos los testantes del backend
   * @returns Observable con el listado completo de testantes
   */
  getAll(): Observable<Testante[]> {
    return this.api.get<Testante[]>(this.path);
  }

  /**
   * Obtiene un testante por su ID
   * @param id - Identificador único del testante
   * @returns Observable con el testante encontrado
   */
  getOne(id: number): Observable<Testante> {
    return this.api.getOne<Testante>(this.path, id);
  }

  /**
   * Crea un nuevo testante en el backend
   * @param dto - Datos parciales del testante a crear
   * @returns Observable con el testante creado
   */
  create(dto: Partial<Testante>): Observable<Testante> {
    return this.api.post<Testante>(this.path, dto);
  }

  /**
   * Actualiza un testante existente en el backend
   * @param id - Identificador único del testante a actualizar
   * @param dto - Datos parciales del testante a actualizar
   * @returns Observable con el testante actualizado
   */
  update(id: number, dto: Partial<Testante>): Observable<Testante> {
    return this.api.put<Testante>(this.path, id, dto);
  }
}
