import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { UsuarioModAuth } from '../models/usuario.models';

@Injectable({ providedIn: 'root' })
export class UsuarioModAuthService {
  private api = inject(ApiService);

  private path = '/users/mod-auth';

  /**
   * Obtiene la lista de todas las autorizaciones de módulo asignadas a usuarios.
   * @returns Observable con el arreglo de autorizaciones de módulo de usuario.
   */
  getAll(): Observable<UsuarioModAuth[]> {
    return this.api.get<UsuarioModAuth[]>(this.path);
  }

  /**
   * Obtiene una autorización de módulo de usuario específica por su ID.
   * @param id - Identificador numérico de la autorización de módulo de usuario.
   * @returns Observable con la autorización de módulo de usuario encontrada.
   */
  getOne(id: number): Observable<UsuarioModAuth> {
    return this.api.getOne<UsuarioModAuth>(this.path, id);
  }

  /**
   * Crea una nueva autorización de módulo de usuario en el sistema.
   * @param dto - Datos parciales de la autorización de módulo de usuario a crear.
   * @returns Observable con la autorización de módulo de usuario creada.
   */
  create(dto: Partial<UsuarioModAuth>): Observable<UsuarioModAuth> {
    return this.api.post<UsuarioModAuth>(this.path, dto);
  }

  /**
   * Actualiza los datos de una autorización de módulo de usuario existente.
   * @param id - Identificador numérico de la autorización de módulo de usuario a actualizar.
   * @param dto - Datos parciales a actualizar en la autorización de módulo de usuario.
   * @returns Observable con la autorización de módulo de usuario actualizada.
   */
  update(id: number, dto: Partial<UsuarioModAuth>): Observable<UsuarioModAuth> {
    return this.api.put<UsuarioModAuth>(this.path, id, dto);
  }

  /**
   * Elimina una autorización de módulo de usuario del sistema por su ID.
   * @param id - Identificador numérico de la autorización de módulo de usuario a eliminar.
   * @returns Observable que se completa cuando la eliminación finaliza.
   */
  delete(id: number): Observable<void> {
    return this.api.delete<void>(this.path, id);
  }
}
