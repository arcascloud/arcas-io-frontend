import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Empresa, EmpresaDet } from '../models/empresa.models';

@Injectable({ providedIn: 'root' })
export class EmpresasService {
  private api = inject(ApiService);

  private path = '/companies';

  getAll(): Observable<Empresa[]> {
    return this.api.get<Empresa[]>(this.path);
  }

  getOne(id: number): Observable<Empresa> {
    return this.api.getOne<Empresa>(this.path, id);
  }

  create(dto: Partial<Empresa>): Observable<Empresa> {
    return this.api.post<Empresa>(this.path, dto);
  }

  update(id: number, dto: Partial<Empresa>): Observable<Empresa> {
    return this.api.put<Empresa>(this.path, id, dto);
  }

  // ===== EmpresaDet =====

  getAllDet(): Observable<EmpresaDet[]> {
    return this.api.get<EmpresaDet[]>(`${this.path}/det`);
  }

  createDet(dto: Partial<EmpresaDet>): Observable<EmpresaDet> {
    return this.api.post<EmpresaDet>(`${this.path}/det`, dto);
  }

  updateDet(id: number, dto: Partial<EmpresaDet>): Observable<EmpresaDet> {
    return this.api.put<EmpresaDet>(`${this.path}/det`, id, dto);
  }

  removeDet(id: number): Observable<any> {
    return this.api.delete<any>(`${this.path}/det`, id);
  }
}
