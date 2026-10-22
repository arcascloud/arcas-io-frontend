import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Departamento } from '../models/inventario.models';

/**
 * Servicio del catálogo de departamentos de inventario (`tinvdeptos`).
 * El backend inyecta `empresaId` automáticamente en GET y POST/PUT.
 */
@Injectable({ providedIn: 'root' })
export class DepartamentosService {
  private api = inject(ApiService);

  private path = '/inventario/deptos';

  /**
   * Obtiene todos los departamentos de la empresa
   * @returns Observable con el listado (ordenado por `zorden`)
   */
  getAll(): Observable<Departamento[]> {
    return this.api.get<Departamento[]>(this.path);
  }

  /**
   * Obtiene un departamento por su ID
   * @param id - Identificador único del departamento
   * @returns Observable con el departamento encontrado
   */
  getOne(id: number): Observable<Departamento> {
    return this.api.getOne<Departamento>(this.path, id);
  }

  /**
   * Crea un nuevo departamento
   * @param dto - Datos del departamento a crear
   * @returns Observable con el departamento creado
   */
  create(dto: Partial<Departamento>): Observable<Departamento> {
    return this.api.post<Departamento>(this.path, dto);
  }

  /**
   * Actualiza un departamento existente
   * @param id - Identificador único del departamento
   * @param dto - Campos a actualizar
   * @returns Observable con el departamento actualizado
   */
  update(id: number, dto: Partial<Departamento>): Observable<Departamento> {
    return this.api.put<Departamento>(this.path, id, dto);
  }
}
