import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { TipoParametro } from '../models/parametro-unificado.model';

@Injectable({ providedIn: 'root' })
export class ParametroUnificadoService {
  private api = inject(ApiService);
  private readonly BASE = '/parametros/parametros';

  /** Listar parámetros por empresa y módulo */
  getAll(moduloId?: number): Observable<TipoParametro[]> {
    const params: Record<string, string> = {};
    if (moduloId) params['moduloId'] = String(moduloId);
    return this.api.get(this.BASE, params);
  }

  /** Obtener como objeto { field: valor } */
  getAsObject(moduloId: number): Observable<Record<string, string>> {
    return this.api.get(`${this.BASE}/objeto`, { moduloId: String(moduloId) });
  }

  /** Obtener un valor específico */
  getValor(moduloId: number, field: string, defaultValue?: string): Observable<string> {
    return this.api.get(`${this.BASE}/valor`, {
      moduloId: String(moduloId),
      field,
      ...(defaultValue ? { default: defaultValue } : {}),
    }).pipe(map((r: any) => r.valor ?? defaultValue ?? '0'));
  }

  /** Upsert un parámetro (usa query params para moduloId) */
  upsert(
    moduloId: number,
    field: string,
    valor: string,
    tipo: string = 'STRING',
    descripcion?: string,
    grupo?: string,
  ): Observable<any> {
    return this.api.putBase(`${this.BASE}/upsert?moduloId=${moduloId}`, { field, valor, tipo, descripcion, grupo });
  }

  /** Upsert lote de parámetros de un módulo */
  upsertLote(moduloId: number, parametros: { field: string; valor: string; tipo?: string }[]): Observable<any> {
    return this.api.putBase(`${this.BASE}/lote?moduloId=${moduloId}`, { parametros });
  }

  /** Eliminar (desactivar) un parámetro */
  remove(id: number): Observable<any> {
    return this.api.putBase(`${this.BASE}/${id}`, { sn_activo: 'N' });
  }
}
