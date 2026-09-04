import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { PlanillaEmpleado } from '../models/planilla.models';

@Injectable({ providedIn: 'root' })
export class PlanillaService {
  private api = inject(ApiService);

  private empleados = '/planilla/empleados';

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
}
