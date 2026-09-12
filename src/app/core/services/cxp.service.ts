import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Proveedor, CompraMae, CompraDet } from '../models/inventario.models';
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
}
