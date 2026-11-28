import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { Kardex } from '../models/inventario.models';

@Injectable({ providedIn: 'root' })
export class KardexService {
  private api = inject(ApiService);

  private path = '/inventario/kardex';

  /**
   * Obtiene todos los registros de kardex del backend
   * @returns Observable con el listado completo de movimientos de kardex
   */
  getAll(): Observable<Kardex[]> {
    return this.api.get<Kardex[]>(this.path);
  }

  /**
   * Obtiene un registro de kardex por su ID
   * @param id - Identificador único del registro de kardex
   * @returns Observable con el registro de kardex encontrado
   */
  getOne(id: number): Observable<Kardex> {
    return this.api.getOne<Kardex>(this.path, id);
  }

  /** Indica si el producto ya tiene movimientos en kardex. */
  tieneMovimientos(productoId: number): Observable<boolean> {
    return this.api
      .get<{ total: number }>(`${this.path}/consulta`, {
        productoId,
        limit: 1,
      })
      .pipe(map((r) => Number(r?.total ?? 0) > 0));
  }
}
