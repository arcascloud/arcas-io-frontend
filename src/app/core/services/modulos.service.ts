import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Modulo } from '../models/usuario.models';

@Injectable({ providedIn: 'root' })
export class ModulosService {
  private api = inject(ApiService);

  private path = '/modulos';

  /**
   * Obtiene la lista de todos los módulos del sistema.
   * @returns Observable con el arreglo de módulos.
   */
  getAll(): Observable<Modulo[]> {
    return this.api.get<Modulo[]>(this.path);
  }

  /**
   * Obtiene un módulo específico por su ID.
   * @param id - Identificador numérico del módulo.
   * @returns Observable con el módulo encontrado.
   */
  getOne(id: number): Observable<Modulo> {
    return this.api.getOne<Modulo>(this.path, id);
  }

  /**
   * Crea un nuevo módulo en el sistema.
   * @param dto - Datos parciales del módulo a crear.
   * @returns Observable con el módulo creado.
   */
  create(dto: Partial<Modulo>): Observable<Modulo> {
    return this.api.post<Modulo>(this.path, dto);
  }

  /**
   * Actualiza los datos de un módulo existente.
   * @param id - Identificador numérico del módulo a actualizar.
   * @param dto - Datos parciales a actualizar en el módulo.
   * @returns Observable con el módulo actualizado.
   */
  update(id: number, dto: Partial<Modulo>): Observable<Modulo> {
    return this.api.put<Modulo>(this.path, id, dto);
  }

  /**
   * Elimina un módulo del sistema por su ID.
   * @param id - Identificador numérico del módulo a eliminar.
   * @returns Observable que se completa cuando la eliminación finaliza.
   */
  delete(id: number): Observable<void> {
    return this.api.delete<void>(this.path, id);
  }
}
