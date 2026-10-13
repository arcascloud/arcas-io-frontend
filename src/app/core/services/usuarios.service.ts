import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Usuario, UsuarioInfo } from '../models/usuario.models';

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private api = inject(ApiService);

  private path = '/users';

  /**
   * Obtiene la lista de todos los usuarios registrados en el sistema.
   * @returns Observable con el arreglo de usuarios.
   */
  getAll(): Observable<Usuario[]> {
    return this.api.get<Usuario[]>(this.path);
  }

  /**
   * Obtiene un usuario específico por su identificador (usuario).
   * @param usuario - Identificador único del usuario (nombre de usuario o ID).
   * @returns Observable con el usuario encontrado.
   */
  getOne(usuario: string): Observable<Usuario> {
    return this.api.getOne<Usuario>(this.path, usuario);
  }

  /**
   * Crea un nuevo usuario en el sistema.
   * @param dto - Datos parciales del usuario a crear.
   * @returns Observable con el usuario creado.
   */
  create(dto: Partial<Usuario>): Observable<Usuario> {
    return this.api.post<Usuario>(this.path, dto);
  }

  /**
   * Actualiza los datos de un usuario existente.
   * @param usuario - Identificador único del usuario a actualizar.
   * @param dto - Datos parciales a actualizar en el usuario.
   * @returns Observable con el usuario actualizado.
   */
  update(usuario: string, dto: Partial<Usuario>): Observable<Usuario> {
    return this.api.put<Usuario>(this.path, usuario, dto);
  }

  /**
   * Obtiene la información extendida (`tusuariosinfoinfo`) de un usuario.
   * @param usuarioId - Identificador numérico del usuario.
   * @returns Observable con la información del usuario.
   */
  getInfo(usuarioId: number): Observable<UsuarioInfo> {
    return this.api.getOne<UsuarioInfo>(`${this.path}/info`, usuarioId);
  }

  /**
   * Actualiza la información extendida del usuario (vínculo con empleado, documento, etc.).
   * @param usuarioId - Identificador numérico del usuario.
   * @param dto - Campos a actualizar (ej: `empleadoId`, usar `null` para desvincular).
   * @returns Observable con la información actualizada.
   */
  updateInfo(usuarioId: number, dto: Partial<UsuarioInfo>): Observable<UsuarioInfo> {
    return this.api.put<UsuarioInfo>(`${this.path}/info`, usuarioId, dto);
  }
}
