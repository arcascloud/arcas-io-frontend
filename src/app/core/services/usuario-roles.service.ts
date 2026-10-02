import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { UsuarioRol, TipoRol } from '../models/usuario.models';

/**
 * CRUD de asignaciones de rol de usuario (tusuarios_rol)
 * y catálogo de roles disponibles (ttipo_rol).
 */
@Injectable({ providedIn: 'root' })
export class UsuarioRolesService {
  private api = inject(ApiService);

  private path = '/users/roles';

  /** Lista las asignaciones de rol de la empresa (con nombre del usuario). */
  getAll(): Observable<UsuarioRol[]> {
    return this.api.get<UsuarioRol[]>(this.path);
  }

  /** Obtiene una asignación de rol por su ID. */
  getOne(id: number): Observable<UsuarioRol> {
    return this.api.getOne<UsuarioRol>(this.path, id);
  }

  /** Catálogo de roles disponibles (ttipo_rol) para el selector. */
  getTipos(): Observable<TipoRol[]> {
    return this.api.get<TipoRol[]>(`${this.path}/tipos`);
  }

  /** Asigna un rol a un usuario. */
  create(dto: Partial<UsuarioRol>): Observable<UsuarioRol> {
    return this.api.post<UsuarioRol>(this.path, dto);
  }

  /** Actualiza una asignación de rol existente. */
  update(id: number, dto: Partial<UsuarioRol>): Observable<UsuarioRol> {
    return this.api.put<UsuarioRol>(this.path, id, dto);
  }

  /** Elimina una asignación de rol. */
  delete(id: number): Observable<void> {
    return this.api.delete<void>(this.path, id);
  }
}
