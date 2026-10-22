import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  AutorizacionHorasExtras,
  DeptoEmpresa,
  HorasExtrasPlanillaResultado,
  HorasExtrasReporte,
  LineaAutorizacion,
  PlanillaEmpleado,
  PlanillaGeneradaResultado,
  PlanillaMae,
  PlDepto,
  TMes,
} from '../models/planilla.models';

@Injectable({ providedIn: 'root' })
export class PlanillaService {
  private api = inject(ApiService);

  private empleados = '/planilla/empleados';
  private authoraex = '/planilla/authoraex';
  private deptos = '/parametros/departamentos-empresa';

  /**
   * Obtiene la lista de todos los empleados registrados en planilla.
   * @returns Observable con la lista de empleados
   */
  getEmpleados(): Observable<PlanillaEmpleado[]> {
    return this.api.get<PlanillaEmpleado[]>(this.empleados);
  }

  /**
   * Obtiene un empleado por su ID.
   * @param id - Identificador único del empleado
   * @returns Observable con el empleado encontrado
   */
  getEmpleado(id: number): Observable<PlanillaEmpleado> {
    return this.api.getOne<PlanillaEmpleado>(this.empleados, id);
  }

  /**
   * Crea un nuevo empleado en el sistema de planilla.
   * @param payload - Datos del empleado a crear
   * @returns Observable con el empleado creado
   */
  createEmpleado(payload: unknown): Observable<PlanillaEmpleado> {
    return this.api.post<PlanillaEmpleado>(this.empleados, payload);
  }

  /**
   * Actualiza los datos de un empleado existente.
   * @param id - Identificador único del empleado
   * @param payload - Datos a actualizar del empleado
   * @returns Observable con el empleado actualizado
   */
  updateEmpleado(id: number, payload: unknown): Observable<PlanillaEmpleado> {
    return this.api.put<PlanillaEmpleado>(this.empleados, id, payload);
  }

  /* ─────────────────────────── Autorización de horas extras ─────────────── */

  /** Catálogo de departamentos de la empresa (`ttipodeptoempresa`). */
  getDeptos(): Observable<DeptoEmpresa[]> {
    return this.api.get<DeptoEmpresa[]>(this.deptos);
  }

  /** Departamentos de planilla (`tpldeptos`) de la empresa. */
  getPlDeptos(): Observable<PlDepto[]> {
    return this.api.get<PlDepto[]>('/planilla/deptos');
  }

  /** Catálogo global de meses (`tmeses`, 1..12). */
  getMeses(): Observable<TMes[]> {
    return this.api.get<TMes[]>('/planilla/tmeses');
  }

  /** Listado de autorizaciones de horas extras. */
  getAutorizaciones(): Observable<AutorizacionHorasExtras[]> {
    return this.api.get<AutorizacionHorasExtras[]>(this.authoraex);
  }

  /** Autorización con su detalle de empleados. */
  getAutorizacion(id: number): Observable<AutorizacionHorasExtras> {
    return this.api.getOne<AutorizacionHorasExtras>(this.authoraex, id);
  }

  /**
   * Crea la autorización. Si `detalles` viene, el backend las valida ANTES de
   * insertar la cabecera (no deja registros huérfanos).
   */
  createAutorizacion(payload: unknown): Observable<AutorizacionHorasExtras> {
    return this.api.post<AutorizacionHorasExtras>(this.authoraex, payload);
  }

  updateAutorizacion(id: number, payload: unknown): Observable<AutorizacionHorasExtras> {
    return this.api.put<AutorizacionHorasExtras>(this.authoraex, id, payload);
  }

  deleteAutorizacion(id: number): Observable<unknown> {
    return this.api.delete<unknown>(this.authoraex, id);
  }

  /** Agrega una línea (empleado autorizado) a una autorización existente. */
  createLinea(payload: unknown): Observable<LineaAutorizacion> {
    return this.api.post<LineaAutorizacion>(`${this.authoraex}/det`, payload);
  }

  updateLinea(id: number, payload: unknown): Observable<LineaAutorizacion> {
    return this.api.put<LineaAutorizacion>(`${this.authoraex}/det`, id, payload);
  }

  deleteLinea(id: number): Observable<unknown> {
    return this.api.delete<unknown>(`${this.authoraex}/det`, id);
  }

  /**
   * Horas extras a pagar: evalúa la asistencia de cada empleado autorizado
   * dentro del rango `fecha_desde` / `fecha_hasta`.
   */
  getHorasExtras(id: number): Observable<HorasExtrasReporte> {
    return this.api.get<HorasExtrasReporte>(`${this.authoraex}/${id}/horas-extras`);
  }

  /**
   * Integra las horas extras MENSUALES con la planilla del período:
   * suma las autorizaciones del `anio`/`periodo` de la planilla (deduplicando
   * por día) y escribe el importe en `plepladet.importe_chorasextras` y en el
   * rubro `PAGO-HORA-EX` de `pletipomov`.
   *
   * @param id - Identificador de la planilla (`pleplamae`)
   */
  calcularHorasExtrasPlanilla(id: number): Observable<HorasExtrasPlanillaResultado> {
    return this.api.post<HorasExtrasPlanillaResultado>(
      `/planilla/planillas/${id}/calcular-horas-extras`,
      {},
    );
  }

  /**
   * Genera la planilla con todos los cálculos (IHSS, RAP, RTF y vecinal ÷12,
   * otras deducciones, comisiones por tramo, bonos, horas extras y neto).
   * Reemplaza todas las líneas de la planilla por los empleados activos.
   * Si el mes coincide con `13AVO_APLICA_EN_DICIEMBRE` / `14AVO_APLICARA_EN_JUNIO`
   * crea (o regenera) también la planilla especial del décimo.
   *
   * @param id - Identificador de la planilla (`pleplamae`)
   */
  generarPlanilla(id: number): Observable<PlanillaGeneradaResultado> {
    return this.api.post<PlanillaGeneradaResultado>(
      `/planilla/planillas/${id}/generar`,
      {},
    );
  }

  /**
   * Paso 2 del flujo — Autorizar pago de planilla (`sn_autorizada='S'`).
   * No mueve dinero: es la aprobación previa que habilita contabilizar.
   */
  autorizarPlanilla(id: number): Observable<PlanillaMae> {
    return this.api.post<PlanillaMae>(`/planilla/planillas/${id}/autorizar`, {});
  }

  /**
   * Paso 3 del flujo — Contabilizar planilla (`sn_contabilizada='S'`).
   * El BACKEND valida los fondos de la cuenta bancaria seleccionada
   * (saldo ≥ total a pagar); si faltan fondos responde 400 con el detalle
   * y el toast global muestra el error.
   */
  contabilizarPlanilla(id: number): Observable<PlanillaMae> {
    return this.api.post<PlanillaMae>(`/planilla/planillas/${id}/contabilizar`, {});
  }
}
