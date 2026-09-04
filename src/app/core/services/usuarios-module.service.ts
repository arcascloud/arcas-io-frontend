import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { UsuariosModule } from '../models/usuario.models';

@Injectable({ providedIn: 'root' })
export class UsuariosModuleService {
  private api = inject(ApiService);

  private path = '/users/modules';

  /**
   * Obtiene la lista de todos los módulos asignados a usuarios.
   * @returns Observable con el arreglo de módulos de usuario.
   */
  getAll(): Observable<UsuariosModule[]> {
    return this.api.get<UsuariosModule[]>(this.path);
  }

  /**
   * Obtiene un módulo de usuario específico por su ID.
   * @param id - Identificador numérico del módulo de usuario.
   * @returns Observable con el módulo de usuario encontrado.
   */
  getOne(id: number): Observable<UsuariosModule> {
    return this.api.getOne<UsuariosModule>(this.path, id);
  }

  /**
   * Crea un nuevo módulo de usuario en el sistema.
   * @param dto - Datos parciales del módulo de usuario a crear.
   * @returns Observable con el módulo de usuario creado.
   */
  create(dto: Partial<UsuariosModule>): Observable<UsuariosModule> {
    return this.api.post<UsuariosModule>(this.path, dto);
  }

  /**
   * Actualiza los datos de un módulo de usuario existente.
   * @param id - Identificador numérico del módulo de usuario a actualizar.
   * @param dto - Datos parciales a actualizar en el módulo de usuario.
   * @returns Observable con el módulo de usuario actualizado.
   */
  update(id: number, dto: Partial<UsuariosModule>): Observable<UsuariosModule> {
    return this.api.put<UsuariosModule>(this.path, id, dto);
  }

  /**
   * Elimina un módulo de usuario del sistema por su ID.
   * @param id - Identificador numérico del módulo de usuario a eliminar.
   * @returns Observable que se completa cuando la eliminación finaliza.
   */
  delete(id: number): Observable<void> {
    return this.api.delete<void>(this.path, id);
  }
}
