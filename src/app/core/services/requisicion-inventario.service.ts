import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { RequisicionMae, RequisicionDet } from '../models/inventario.models';

@Injectable({ providedIn: 'root' })
export class RequisicionInventarioService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private path = '/inventario/requisiciones';

  private get empresaId(): string {
    return this.auth.currentUser()?.empresaId?.toString() || '';
  }

  getAll(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}${this.path}`, {
      params: new HttpParams().set('empresaId', this.empresaId),
    });
  }

  getOne(id: number): Observable<RequisicionMae> {
    return this.http.get<RequisicionMae>(`${environment.apiUrl}${this.path}/${id}`, {
      params: new HttpParams().set('empresaId', this.empresaId),
    });
  }

  getDet(id: number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}${this.path}/${id}/det`, {
      params: new HttpParams().set('empresaId', this.empresaId),
    });
  }

  create(dto: Partial<RequisicionMae>): Observable<RequisicionMae> {
    return this.http.post<RequisicionMae>(`${environment.apiUrl}${this.path}`, dto);
  }

  update(id: number, dto: Partial<RequisicionMae>): Observable<RequisicionMae> {
    return this.http.put<RequisicionMae>(`${environment.apiUrl}${this.path}/${id}`, dto, {
      params: new HttpParams().set('empresaId', this.empresaId),
    });
  }

  remove(id: number): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}${this.path}/${id}`, {
      params: new HttpParams().set('empresaId', this.empresaId),
    });
  }

  createDet(dto: Partial<RequisicionDet>): Observable<RequisicionDet> {
    return this.http.post<RequisicionDet>(`${environment.apiUrl}${this.path}/det`, dto);
  }

  updateDet(id: number, dto: Partial<RequisicionDet>): Observable<RequisicionDet> {
    return this.http.put<RequisicionDet>(`${environment.apiUrl}${this.path}/det/${id}`, dto, {
      params: new HttpParams().set('empresaId', this.empresaId),
    });
  }

  removeDet(id: number): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}${this.path}/det/${id}`, {
      params: new HttpParams().set('empresaId', this.empresaId),
    });
  }

  procesar(id: number): Observable<any> {
    return this.http.post<any>(
      `${environment.apiUrl}${this.path}/${id}/procesar`,
      {},
      { params: new HttpParams().set('empresaId', this.empresaId) },
    );
  }

  anular(id: number): Observable<any> {
    return this.http.post<any>(
      `${environment.apiUrl}${this.path}/${id}/anular`,
      {},
      { params: new HttpParams().set('empresaId', this.empresaId) },
    );
  }
}
