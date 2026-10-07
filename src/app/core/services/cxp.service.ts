import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Proveedor, CompraMae, CompraDet } from '../models/inventario.models';
import { ProveedorInfo, ProveedorCartera } from '../models/cxp.models';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class CxpService {
  private api = inject(ApiService);
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  private proveedores = '/cxp/proveedores';

  getProveedores(): Observable<Proveedor[]> {
    return this.api.get<Proveedor[]>(this.proveedores);
  }

  getProveedoresPag(page: number, limit: number, q: string): Observable<{ data: Proveedor[]; total: number }> {
    let url = `${this.proveedores}-pag?page=${page}&limit=${limit}`;
    if (q && q.trim()) url += `&q=${encodeURIComponent(q.trim())}`;
    return this.api.get<{ data: Proveedor[]; total: number }>(url);
  }

  getProveedor(id: number): Observable<Proveedor> {
    return this.api.getOne<Proveedor>(this.proveedores, id);
  }

  /** Verifica si un DNI ya existe en proveedores de la empresa (DNI = llave maestra) */
  dniExiste(dni: string, excluirId?: number): Observable<{ existe: boolean; id: number | null; numero: string | null; nombre: string | null }> {
    return this.api.get(`${this.proveedores}/dni-existe`, {
      dni,
      ...(excluirId ? { excluirId } : {}),
    });
  }

  createProveedor(payload: unknown): Observable<Proveedor> {
    return this.api.post<Proveedor>(this.proveedores, payload);
  }

  updateProveedor(id: number, payload: unknown): Observable<Proveedor> {
    return this.api.put<Proveedor>(this.proveedores, id, payload);
  }

  // ── Compras CRUD ──

  getCompras(): Observable<CompraMae[]> {
    return this.api.get<CompraMae[]>('/cxp/compras');
  }

  getCompra(id: number): Observable<CompraMae> {
    return this.api.getOne<CompraMae>('/cxp/compras', id);
  }

  getDetallesByCompra(compraId: number): Observable<CompraDet[]> {
    return this.api.get<CompraDet[]>(`/cxp/compras/${compraId}/detalles`);
  }

  createCompra(payload: any): Observable<CompraMae> {
    return this.api.post<CompraMae>('/cxp/compras', payload);
  }

  updateCompra(id: number, payload: unknown): Observable<CompraMae> {
    return this.api.put<CompraMae>('/cxp/compras', id, payload);
  }

  anularCompra(id: number): Observable<any> {
    const empresaId = this.auth.currentUser()?.empresaId;
    let params = new HttpParams();
    if (empresaId) params = params.set('empresaId', empresaId.toString());
    return this.http.put<any>(`${environment.apiUrl}/cxp/compras/${id}/anular`, {}, { params });
  }

  procesarCompra(id: number): Observable<any> {
    const empresaId = this.auth.currentUser()?.empresaId;
    let params = new HttpParams();
    if (empresaId) params = params.set('empresaId', empresaId.toString());
    return this.http.put<any>(`${environment.apiUrl}/cxp/compras/${id}/procesar`, {}, { params });
  }

  // ── Compra Detalle ──

  getComprasDet(): Observable<CompraDet[]> {
    return this.api.get<CompraDet[]>('/cxp/compras-det');
  }

  createCompraDet(payload: unknown): Observable<CompraDet> {
    return this.api.post<CompraDet>('/cxp/compras-det', payload);
  }

  updateCompraDet(id: number, payload: unknown): Observable<CompraDet> {
    return this.api.put<CompraDet>('/cxp/compras-det', id, payload);
  }

  getPrecioVta(id: number): Observable<any> {
    return this.api.getOne<any>('/parametros/precios-vta', id);
  }

  deleteCompraDet(id: number): Observable<any> {
    return this.api.delete<any>('/cxp/compras-det', id);
  }

  // ── Movimientos ──

  getMovimientos(): Observable<any[]> {
    return this.api.get<any[]>('/cxp/movimientos');
  }

  getMovimientosByProveedor(proveedorId: number): Observable<any[]> {
    return this.api.get<any[]>(`/cxp/movimientos/proveedor/${proveedorId}`);
  }

  /** Movimiento CxP por su id (cxpmovId) — trazabilidad de partidas contables. */
  getMovimiento(id: number): Observable<any> {
    return this.api.get<any>(`/cxp/movimientos/${id}`);
  }

  createMovimiento(payload: unknown): Observable<any> {
    return this.api.post<any>('/cxp/movimientos', payload);
  }

  // ── Históricos ──

  getHistoricos(): Observable<any[]> {
    return this.api.get<any[]>('/cxp/historicos');
  }

  getHistoricoConFiltros(
    dni?: string,
    proveedor?: string,
    fechaDesde?: string,
    fechaHasta?: string,
  ): Observable<any[]> {
    const params: Record<string, string> = {};
    if (dni && dni.trim()) params['dni'] = dni.trim();
    if (proveedor && proveedor.trim()) params['proveedor'] = proveedor.trim();
    if (fechaDesde && fechaDesde.trim()) params['fechaDesde'] = fechaDesde.trim();
    if (fechaHasta && fechaHasta.trim()) params['fechaHasta'] = fechaHasta.trim();
    return this.api.get<any[]>('/cxp/historicos/filtros', params);
  }

  getSaldosAv(): Observable<any[]> {
    return this.api.get<any[]>('/cxp/saldos-av');
  }

  // ── Información de proveedor (proveedorinfo: correo/celular/dirección) ──

  /**
   * Información de contacto de un proveedor (máx. un registro por tipo).
   * @param proveedorId - Identificador del proveedor
   * @returns Observable con los registros de proveedorinfo
   */
  getProveedorInfo(proveedorId: number): Observable<ProveedorInfo[]> {
    return this.api.get<ProveedorInfo[]>(`/cxp/proveedor-info/proveedor/${proveedorId}`);
  }

  /**
   * Crea un registro de información de proveedor.
   * @param payload - Datos (proveedorId, tipo, descripcion, sn_activo, empresaId)
   * @returns Observable con el registro creado
   */
  createProveedorInfo(payload: unknown): Observable<ProveedorInfo> {
    return this.api.post<ProveedorInfo>('/cxp/proveedor-info', payload);
  }

  /**
   * Actualiza un registro de información de proveedor.
   * @param id - Identificador del registro (proveedorinfo.id)
   * @param payload - Campos a actualizar
   * @returns Observable con el registro actualizado
   */
  updateProveedorInfo(id: number, payload: unknown): Observable<ProveedorInfo> {
    return this.api.put<ProveedorInfo>('/cxp/proveedor-info', id, payload);
  }

  /**
   * Desactiva lógicamente un registro (sn_activo = N).
   * @param id - Identificador del registro (proveedorinfo.id)
   * @returns Observable con el registro desactivado
   */
  removeProveedorInfo(id: number): Observable<ProveedorInfo> {
    return this.api.putBase<ProveedorInfo>(`/cxp/proveedor-info/${id}/remove`, {});
  }

  // ── Cartera contable por proveedor (cxpcarteracta) ──

  /**
   * Todas las asignaciones de cartera contable de la empresa.
   * El filtro por proveedor se hace en el componente (el endpoint no expone proveedorId).
   * @returns Observable con las asignaciones de cxpcarteracta
   */
  getCarterasProveedor(): Observable<ProveedorCartera[]> {
    return this.api.get<ProveedorCartera[]>('/cxp/carteras-cta');
  }

  /**
   * Asigna una cartera contable a un proveedor.
   * @param payload - Datos (proveedorId, carteractaId, empresaId, Idsucursal)
   * @returns Observable con la asignación creada
   */
  createCarteraProveedor(payload: unknown): Observable<ProveedorCartera> {
    return this.api.post<ProveedorCartera>('/cxp/carteras-cta', payload);
  }

  /**
   * Elimina (físico) la asignación de cartera contable de un proveedor.
   * @param id - Identificador de la asignación (cxpcarteracta.id)
   * @returns Observable con el resultado
   */
  removeCarteraProveedor(id: number): Observable<{ id: number; eliminado: boolean }> {
    return this.api.putBase<{ id: number; eliminado: boolean }>(`/cxp/carteras-cta/${id}/remove`, {});
  }
}
