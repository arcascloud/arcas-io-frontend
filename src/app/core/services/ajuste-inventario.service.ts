import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { AjusteInventarioMae, AjusteInventarioDet } from '../models/inventario.models';

@Injectable({ providedIn: 'root' })
export class AjusteInventarioService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private path = '/inventario/ajustes-inventario';

  getAll(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}${this.path}`, {
      params: new HttpParams().set('empresaId', this.auth.currentUser()?.empresaId?.toString() || ''),
    });
  }

  getOne(id: number): Observable<AjusteInventarioMae> {
    return this.http.get<AjusteInventarioMae>(`${environment.apiUrl}${this.path}/${id}`, {
      params: new HttpParams().set('empresaId', this.auth.currentUser()?.empresaId?.toString() || ''),
    });
  }

  getDet(id: number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}${this.path}/${id}/det`, {
      params: new HttpParams().set('empresaId', this.auth.currentUser()?.empresaId?.toString() || ''),
    });
  }

  create(dto: Partial<AjusteInventarioMae>): Observable<AjusteInventarioMae> {
    return this.http.post<AjusteInventarioMae>(`${environment.apiUrl}${this.path}`, dto);
  }

  update(id: number, dto: Partial<AjusteInventarioMae>): Observable<AjusteInventarioMae> {
    return this.http.put<AjusteInventarioMae>(`${environment.apiUrl}${this.path}/${id}`, dto, {
      params: new HttpParams().set('empresaId', this.auth.currentUser()?.empresaId?.toString() || ''),
    });
  }

  remove(id: number): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}${this.path}/${id}`, {
      params: new HttpParams().set('empresaId', this.auth.currentUser()?.empresaId?.toString() || ''),
    });
  }

  createDet(dto: Partial<AjusteInventarioDet>): Observable<AjusteInventarioDet> {
    return this.http.post<AjusteInventarioDet>(`${environment.apiUrl}${this.path}/det`, dto);
  }

  updateDet(id: number, dto: Partial<AjusteInventarioDet>): Observable<AjusteInventarioDet> {
    return this.http.put<AjusteInventarioDet>(`${environment.apiUrl}${this.path}/det/${id}`, dto, {
      params: new HttpParams().set('empresaId', this.auth.currentUser()?.empresaId?.toString() || ''),
    });
  }

  removeDet(id: number): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}${this.path}/det/${id}`, {
      params: new HttpParams().set('empresaId', this.auth.currentUser()?.empresaId?.toString() || ''),
    });
  }

  procesar(id: number): Observable<any> {
    const empresaId = this.auth.currentUser()?.empresaId;
    const params = new HttpParams().set('empresaId', empresaId?.toString() || '');
    return this.http.post<any>(
      `${environment.apiUrl}${this.path}/${id}/procesar`,
      {},
      { params },
    );
  }
}
