import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { UsuariosScripts } from '../models/usuario.models';

@Injectable({ providedIn: 'root' })
export class UsuariosScriptsService {
  private api = inject(ApiService);

  private path = '/users/scripts';

  /**
   * Obtiene la lista de todos los scripts asignados a usuarios.
   * @returns Observable con el arreglo de scripts de usuario.
   */
  getAll(): Observable<UsuariosScripts[]> {
    return this.api.get<UsuariosScripts[]>(this.path);
  }

  /**
   * Obtiene un script de usuario específico por su ID.
   * @param id - Identificador numérico del script de usuario.
   * @returns Observable con el script de usuario encontrado.
   */
  getOne(id: number): Observable<UsuariosScripts> {
    return this.api.getOne<UsuariosScripts>(this.path, id);
  }

  /**
   * Crea un nuevo script de usuario en el sistema.
   * @param dto - Datos parciales del script de usuario a crear.
   * @returns Observable con el script de usuario creado.
   */
  create(dto: Partial<UsuariosScripts>): Observable<UsuariosScripts> {
    return this.api.post<UsuariosScripts>(this.path, dto);
  }

  /**
   * Actualiza los datos de un script de usuario existente.
   * @param id - Identificador numérico del script de usuario a actualizar.
   * @param dto - Datos parciales a actualizar en el script de usuario.
   * @returns Observable con el script de usuario actualizado.
   */
  update(id: number, dto: Partial<UsuariosScripts>): Observable<UsuariosScripts> {
    return this.api.put<UsuariosScripts>(this.path, id, dto);
  }

  /**
   * Elimina un script de usuario del sistema por su ID.
   * @param id - Identificador numérico del script de usuario a eliminar.
   * @returns Observable que se completa cuando la eliminación finaliza.
   */
  delete(id: number): Observable<void> {
    return this.api.delete<void>(this.path, id);
  }
}
