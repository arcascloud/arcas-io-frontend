import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Fecma, Fecdet, FecmaPayload, FecdetPayload, AutorizacionFec, EstadoFechaSistema } from '../models/fec.models';

/**
 * CRUD de fechas autorizadas (tfecma / tfecdet).
 *
 * `empresaId` e `Idsucursal` los inyecta `ApiService` automáticamente.
 * Los endpoints de escritura están restringidos en backend a los roles
 * admin y supervisor (ROLES_FECHAS).
 */
@Injectable({ providedIn: 'root' })
export class FecService {
  private api = inject(ApiService);

  private path = '/parametros/fechas';
  private pathDet = '/parametros/fechas-det';

  // ── Maestro (tfecma) ────────────────────────────────────────────────

  /** Lista los maestros con su detalle. */
  getAll(): Observable<Fecma[]> {
    return this.api.get<Fecma[]>(this.path);
  }

  /** Obtiene un maestro con su detalle. */
  getOne(id: number): Observable<Fecma> {
    return this.api.getOne<Fecma>(this.path, id);
  }

  /**
   * Crea maestro + detalle en UNA transacción (si algo falla no persiste nada).
   * @param payload Rango de vigencia y usuarios habilitados.
   */
  create(payload: FecmaPayload): Observable<Fecma> {
    return this.api.post<Fecma>(this.path, payload);
  }

  /**
   * Actualiza maestro y, si `payload.detalles` viene definido, REEMPLAZA
   * el detalle completo (también en transacción).
   */
  update(id: number, payload: Partial<FecmaPayload>): Observable<Fecma> {
    return this.api.put<Fecma>(this.path, id, payload);
  }

  /** Elimina el maestro (cascada sobre su detalle). */
  delete(id: number): Observable<{ eliminado: boolean; tfecmaId: number }> {
    return this.api.delete<{ eliminado: boolean; tfecmaId: number }>(this.path, id);
  }

  // ── Detalle (tfecdet) ───────────────────────────────────────────────

  /** Lista líneas de detalle, opcionalmente filtradas por maestro. */
  getAllDet(fecmaeId?: number): Observable<Fecdet[]> {
    const params = fecmaeId != null ? { fecmaeId } : undefined;
    return this.api.get<Fecdet[]>(this.pathDet, params);
  }

  /** Agrega un usuario al detalle de un maestro. */
  createDet(payload: FecdetPayload): Observable<Fecdet> {
    return this.api.post<Fecdet>(this.pathDet, payload);
  }

  /** Modifica una línea de detalle (usuario, sn_permitido o maestro). */
  updateDet(id: number, payload: Partial<FecdetPayload>): Observable<Fecdet> {
    return this.api.put<Fecdet>(this.pathDet, id, payload);
  }

  /** Elimina una línea de detalle. */
  deleteDet(id: number): Observable<{ eliminado: boolean; fecdetId: number }> {
    return this.api.delete<{ eliminado: boolean; fecdetId: number }>(this.pathDet, id);
  }

  // ── Regla de negocio ────────────────────────────────────────────────

  /**
   * ¿Puede `usuario` registrar datos en `fecha`?
   *
   * Devuelve `autorizado: true` si la fecha cae dentro del rango de un
   * maestro de la empresa Y el usuario está en su detalle con
   * `sn_permitido = 'S'`. Si `fecha` se omite usa la fecha del sistema.
   *
   * Es la consulta que deben invocar los demás módulos (facturación,
   * contabilidad, inventario) antes de permitir una escritura sobre un
   * período cerrado.
   *
   * @param usuario Login del usuario a consultar.
   * @param fecha Fecha a validar (`YYYY-MM-DD` o Date). Opcional.
   */
  autorizar(usuario: string, fecha?: string | Date): Observable<AutorizacionFec> {
    const params: Record<string, string | number> = { usuario };
    if (fecha != null) params['fecha'] = typeof fecha === 'string'
      ? fecha
      : (fecha as Date).toISOString().slice(0, 10);
    return this.api.get<AutorizacionFec>(`${this.path}/autorizar`, params);
  }

  // ══════════════════ Fecha del Sistema del ERP ══════════════════

  /**
   * Estado de `tempresas.fechasistema` vs la fecha del servidor.
   *
   * GET: siempre accesible (aunque el sistema esté desalineado), para que la
   * pantalla pueda mostrar la discrepancia y ofrecer la corrección.
   */
  getEstadoFechaSistema(): Observable<EstadoFechaSistema> {
    return this.api.get<EstadoFechaSistema>(`${this.path}-sistema`);
  }

  /**
   * Corrige la Fecha del Sistema del ERP (`YYYY-MM-DD`).
   *
   * Única escritura exenta del bloqueo por fecha desalineada; requiere los
   * roles admin / supervisor / contador.
   */
  actualizarFechaSistema(fecha: string): Observable<EstadoFechaSistema> {
    return this.api.putBase<EstadoFechaSistema>(`${this.path}-sistema`, { fechasistema: fecha });
  }
}
