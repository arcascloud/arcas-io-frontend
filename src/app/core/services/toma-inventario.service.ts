import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { TomaInventarioMae, TomaInventarioDet } from '../models/inventario.models';

@Injectable({ providedIn: 'root' })
export class TomaInventarioService {
  private api = inject(ApiService);
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private path = '/inventario/toma-inventario';

  getAll(): Observable<any> {
    return this.api.get<any>(this.path);
  }

  getOne(id: number): Observable<TomaInventarioMae> {
    return this.api.getOne<TomaInventarioMae>(this.path, id);
  }

  getDet(id: number): Observable<any> {
    return this.api.get<any>(`${this.path}/${id}/det`);
  }

  create(dto: Partial<TomaInventarioMae>): Observable<TomaInventarioMae> {
    return this.api.post<TomaInventarioMae>(this.path, dto);
  }

  update(id: number, dto: Partial<TomaInventarioMae>): Observable<TomaInventarioMae> {
    return this.api.put<TomaInventarioMae>(this.path, id, dto);
  }

  remove(id: number): Observable<any> {
    return this.api.delete<any>(this.path, id);
  }

  createDet(dto: Partial<TomaInventarioDet>): Observable<TomaInventarioDet> {
    return this.api.post<TomaInventarioDet>(`${this.path}/det`, dto);
  }

  updateDet(id: number, dto: Partial<TomaInventarioDet>): Observable<TomaInventarioDet> {
    return this.api.put<TomaInventarioDet>(`${this.path}/det`, id, dto);
  }

  removeDet(id: number): Observable<any> {
    return this.api.delete<any>(`${this.path}/det`, id);
  }

  procesar(id: number, bodegaId: number): Observable<any> {
    const empresaId = this.auth.currentUser()?.empresaId;
    const params = new HttpParams().set('empresaId', empresaId?.toString() || '');
    return this.http.post<any>(
      `${environment.apiUrl}${this.path}/${id}/procesar`,
      { bodegaId },
      { params },
    );
  }

  cargarExistencia(detId: number): Observable<TomaInventarioDet> {
    return this.api.post<TomaInventarioDet>(`${this.path}/det/${detId}/cargar-existencia`, {});
  }

  importar(id: number, items: any[]): Observable<any> {
    const empresaId = this.auth.currentUser()?.empresaId;
    const params = new HttpParams().set('empresaId', empresaId?.toString() || '');
    return this.http.post<any>(
      `${environment.apiUrl}${this.path}/importar/${id}`,
      { items },
      { params },
    );
  }
}
