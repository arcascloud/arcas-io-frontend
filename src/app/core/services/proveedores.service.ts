import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Proveedor } from '../models/inventario.models';

@Injectable({ providedIn: 'root' })
export class ProveedoresService {
  private api = inject(ApiService);

  private path = '/inventario/proveedores';

  /**
   * Obtiene todos los proveedores del backend
   * @returns Observable con el listado completo de proveedores
   */
  getAll(): Observable<Proveedor[]> {
    return this.api.get<Proveedor[]>(this.path);
  }

  /**
   * Obtiene un proveedor por su ID
   * @param id - Identificador único del proveedor
   * @returns Observable con el proveedor encontrado
   */
  getOne(id: number): Observable<Proveedor> {
    return this.api.getOne<Proveedor>(this.path, id);
  }

  /**
   * Verifica si un DNI ya existe en proveedores de la empresa (DNI = llave maestra)
   * @param dni - DNI a verificar
   * @param excluirId - Proveedor a excluir (para edicion)
   * @returns true si el DNI ya esta asignado a otro proveedor
   */
  dniExiste(dni: string, excluirId?: number): Observable<{ existe: boolean; id: number | null; numero: string | null; nombre: string | null }> {
    return this.api.get(`${this.path}/dni-existe`, {
      dni,
      ...(excluirId ? { excluirId } : {}),
    });
  }

  /**
   * Crea un nuevo proveedor en el backend
   * @param dto - Datos parciales del proveedor a crear
   * @returns Observable con el proveedor creado
   */
  create(dto: Partial<Proveedor>): Observable<Proveedor> {
    return this.api.post<Proveedor>(this.path, dto);
  }

  /**
   * Actualiza un proveedor existente en el backend
   * @param id - Identificador único del proveedor a actualizar
   * @param dto - Datos parciales del proveedor a actualizar
   * @returns Observable con el proveedor actualizado
   */
  update(id: number, dto: Partial<Proveedor>): Observable<Proveedor> {
    return this.api.put<Proveedor>(this.path, id, dto);
  }
}
