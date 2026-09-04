import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class CatalogoParametrosService {
  private api = inject(ApiService);

  /**
   * Obtiene todos los registros de un catálogo genérico.
   * @param ruta - Ruta del catálogo a consultar (ej. '/parametros/estados').
   * @returns Observable con el arreglo de registros del catálogo.
   */
  getAll<T>(ruta: string): Observable<T[]> {
    return this.api.get<T[]>(ruta);
  }

  /**
   * Obtiene un registro de catálogo por ID.
   * @param ruta - Ruta del catálogo a consultar.
   * @param id - Identificador del registro a obtener.
   * @returns Observable con el registro encontrado.
   */
  getOne<T>(ruta: string, id: number | string): Observable<T> {
    return this.api.getOne<T>(ruta, id);
  }

  /**
   * Crea un registro en el catálogo.
   * @param ruta - Ruta del catálogo donde se creará el registro.
   * @param payload - Datos del registro a crear.
   * @param sinContexto - Indica si la petición se realiza sin contexto de empresa/sucursal. Por defecto `false`.
   * @returns Observable con el registro creado.
   */
  create<T>(ruta: string, payload: unknown, sinContexto = false): Observable<T> {
    return this.api.post<T>(ruta, payload, { sinContexto });
  }

  /**
   * Actualiza un registro en el catálogo.
   * @param ruta - Ruta del catálogo donde se actualizará el registro.
   * @param id - Identificador del registro a actualizar.
   * @param payload - Datos parciales a actualizar en el registro.
   * @param sinContexto - Indica si la petición se realiza sin contexto de empresa/sucursal. Por defecto `false`.
   * @returns Observable con el registro actualizado.
   */
  update<T>(ruta: string, id: number | string, payload: unknown, sinContexto = false): Observable<T> {
    return this.api.put<T>(ruta, id, payload, { sinContexto });
  }
}
