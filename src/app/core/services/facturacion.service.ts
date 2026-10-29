import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { DashboardVentas } from '../models/facturacion.models';

@Injectable({ providedIn: 'root' })
export class FacturacionService {
  private api = inject(ApiService);

  /**
   * Obtiene la lista de registros maestros de una ruta específica.
   * Método genérico reutilizable para cualquier módulo (caja, facturas, compras, etc.).
   * @param ruta - Ruta del endpoint maestro (ej. 'caja-mae', 'facturas-mae')
   * @returns Observable con la lista de registros maestros tipados
   */
  getMae<T>(ruta: string): Observable<T[]> {
    return this.api.get<T[]>(ruta);
  }

  /**
   * Obtiene un registro maestro por su ID de una ruta específica.
   * @param ruta - Ruta del endpoint maestro
   * @param id - Identificador único del registro
   * @returns Observable con el registro maestro encontrado
   */
  getMaeOne<T>(ruta: string, id: number): Observable<T> {
    return this.api.getOne<T>(ruta, id);
  }

  /**
   * Crea un nuevo registro maestro en una ruta específica.
   * @param ruta - Ruta del endpoint maestro
   * @param payload - Datos del registro maestro a crear
   * @returns Observable con el registro maestro creado
   */
  createMae<T>(ruta: string, payload: unknown): Observable<T> {
    return this.api.post<T>(ruta, payload);
  }

  /**
   * Actualiza un registro maestro existente en una ruta específica.
   * @param ruta - Ruta del endpoint maestro
   * @param id - Identificador único del registro
   * @param payload - Datos a actualizar del registro
   * @returns Observable con el registro maestro actualizado
   */
  updateMae<T>(ruta: string, id: number, payload: unknown): Observable<T> {
    return this.api.put<T>(ruta, id, payload);
  }

  /**
   * Obtiene la lista de registros de detalle de una ruta específica.
   * Método genérico reutilizable para el detalle de cualquier módulo.
   * @param ruta - Ruta del endpoint de detalle (ej. 'caja-det', 'facturas-det')
   * @returns Observable con la lista de registros de detalle tipados
   */
  getDet<T>(ruta: string): Observable<T[]> {
    return this.api.get<T[]>(ruta);
  }

  /**
   * Crea un nuevo registro de detalle en una ruta específica.
   * @param ruta - Ruta del endpoint de detalle
   * @param payload - Datos del registro de detalle a crear
   * @returns Observable con el registro de detalle creado
   */
  createDet<T>(ruta: string, payload: unknown): Observable<T> {
    return this.api.post<T>(ruta, payload);
  }

  /**
   * Actualiza un registro de detalle existente en una ruta específica.
   * @param ruta - Ruta del endpoint de detalle
   * @param id - Identificador único del registro
   * @param payload - Datos a actualizar del registro
   * @returns Observable con el registro de detalle actualizado
   */
  updateDet<T>(ruta: string, id: number, payload: unknown): Observable<T> {
    return this.api.put<T>(ruta, id, payload);
  }

  /**
   * Dashboard de ventas y KPIs (dashboardId3).
   * Los filtros nulos/undefined se omiten (ApiService manda 'undefined' si no se filtra).
   * @param params - anio, mes (1-12), sucursalId y categoriaId opcionales
   */
  getDashboardVentas(params: {
    anio?: number | null;
    mes?: number | null;
    sucursalId?: number | null;
    categoriaId?: number | null;
  }): Observable<DashboardVentas> {
    const p: Record<string, string | number> = {};
    if (params?.anio != null) p['anio'] = params.anio;
    if (params?.mes != null) p['mes'] = params.mes;
    if (params?.sucursalId != null) p['sucursalId'] = params.sucursalId;
    if (params?.categoriaId != null) p['categoriaId'] = params.categoriaId;
    return this.api.get<DashboardVentas>('/facturacion/dashboard', p);
  }
}
