import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { UsuariosMnuItem } from '../models/usuario.models';

@Injectable({ providedIn: 'root' })
export class UsuariosMnuItemService {
  private api = inject(ApiService);

  private path = '/users/menu-items';

  /**
   * Obtiene la lista de todos los elementos de menú asignados a usuarios.
   * @returns Observable con el arreglo de elementos de menú de usuario.
   */
  getAll(): Observable<UsuariosMnuItem[]> {
    return this.api.get<UsuariosMnuItem[]>(this.path);
  }

  /**
   * Obtiene un elemento de menú de usuario específico por su ID.
   * @param id - Identificador numérico del elemento de menú de usuario.
   * @returns Observable con el elemento de menú de usuario encontrado.
   */
  getOne(id: number): Observable<UsuariosMnuItem> {
    return this.api.getOne<UsuariosMnuItem>(this.path, id);
  }

  /**
   * Crea un nuevo elemento de menú de usuario en el sistema.
   * @param dto - Datos parciales del elemento de menú de usuario a crear.
   * @returns Observable con el elemento de menú de usuario creado.
   */
  create(dto: Partial<UsuariosMnuItem>): Observable<UsuariosMnuItem> {
    return this.api.post<UsuariosMnuItem>(this.path, dto);
  }

  /**
   * Actualiza los datos de un elemento de menú de usuario existente.
   * @param id - Identificador numérico del elemento de menú de usuario a actualizar.
   * @param dto - Datos parciales a actualizar en el elemento de menú de usuario.
   * @returns Observable con el elemento de menú de usuario actualizado.
   */
  update(id: number, dto: Partial<UsuariosMnuItem>): Observable<UsuariosMnuItem> {
    return this.api.put<UsuariosMnuItem>(this.path, id, dto);
  }

  /**
   * Elimina un elemento de menú del sistema por su ID.
   * @param id - Identificador numérico del elemento de menú a eliminar.
   * @returns Observable que se completa cuando la eliminación finaliza.
   */
  delete(id: number): Observable<void> {
    return this.api.delete<void>(this.path, id);
  }

  /**
   * Clona los items de menú de la plantilla (admin) hacia el usuario indicado
   * para todos los módulos que tiene asignados. Solo rellena huecos
   * (no borra ni duplica).
   * @param usuario - Login del usuario destino.
   * @returns Observable con el resultado: módulos procesados e items clonados.
   */
  clonarMenu(usuario: string): Observable<{
    usuario: string;
    modulosProcesados: number;
    itemsClonados: number;
  }> {
    return this.api.post<{ usuario: string; modulosProcesados: number; itemsClonados: number }>(
      `${this.path}/clonar`,
      { usuario },
    );
  }
}
