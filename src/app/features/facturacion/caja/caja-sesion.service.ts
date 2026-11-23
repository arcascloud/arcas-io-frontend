import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { Observable } from 'rxjs';
import { CajaSesion, CajaMovimiento, CajaCorte, CajaDisponible } from './caja-sesion.models';

@Injectable({ providedIn: 'root' })
export class CajaSesionService {
  private api = inject(ApiService);
  private basePath = '/facturacion/caja/sesiones';

  /** Cajas que el usuario autenticado puede operar (resueltas en backend desde tusuarios_caja) */
  cajasDisponibles(): Observable<CajaDisponible[]> {
    return this.api.get<CajaDisponible[]>('/facturacion/caja/cajas-disponibles');
  }

  /**
   * Abre turno. `empresaId` y `usuarioId` NO se envían: el backend los toma del JWT.
   * `cajaId` es opcional (si el usuario tiene una sola caja se resuelve automáticamente).
   */
  abrirSesion(dto: { cajaId?: number; monto_apertura: number }): Observable<CajaSesion> {
    return this.api.post<CajaSesion>(this.basePath, dto);
  }

  obtenerSesionActiva(empresaId: number, cajaId?: number, usuarioId?: number): Observable<CajaSesion | null> {
    const params: any = { empresaId };
    if (cajaId) params.cajaId = cajaId;
    if (usuarioId) params.usuarioId = usuarioId;
    return this.api.get<CajaSesion | null>(`${this.basePath}/activa`, params);
  }

  listarSesiones(empresaId: number, cajaId?: number, estado?: string): Observable<CajaSesion[]> {
    const params: any = { empresaId };
    if (cajaId) params.cajaId = cajaId;
    if (estado) params.estado = estado;
    return this.api.get<CajaSesion[]>(this.basePath, params);
  }

  obtenerSesion(id: number): Observable<CajaSesion> {
    return this.api.get<CajaSesion>(`${this.basePath}/${id}`);
  }

  registrarMovimiento(sesionId: number, dto: any): Observable<CajaMovimiento> {
    return this.api.post<CajaMovimiento>(`${this.basePath}/${sesionId}/movimientos`, dto);
  }

  generarCorteX(sesionId: number, dto: any): Observable<CajaCorte> {
    return this.api.post<CajaCorte>(`${this.basePath}/${sesionId}/corte-x`, dto);
  }

  cerrarSesion(sesionId: number, dto: any): Observable<CajaSesion> {
    return this.api.post<CajaSesion>(`${this.basePath}/${sesionId}/cerrar`, dto);
  }
}
