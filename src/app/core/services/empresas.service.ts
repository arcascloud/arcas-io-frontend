import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Empresa, EmpresaDet, Correlativo, EmpresaLogo, Impresora, EstadoCorrelativo } from '../models/empresa.models';
import { Sucursal } from '../models/sucursal.models';

@Injectable({ providedIn: 'root' })
export class EmpresasService {
  private api = inject(ApiService);

  private path = '/companies';

  // ===== Empresas =====

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

  getAllDet(empresaId?: number): Observable<EmpresaDet[]> {
    return this.api.get<EmpresaDet[]>(`${this.path}/det`, empresaId ? { empresaId } : undefined);
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

  // ===== Correlativos (CAI) =====

  getAllCorr(empresaId: number): Observable<Correlativo[]> {
    return this.api.get<Correlativo[]>(`${this.path}/correlativos`, { empresaId });
  }

  createCorr(dto: Partial<Correlativo>): Observable<Correlativo> {
    return this.api.post<Correlativo>(`${this.path}/correlativos`, dto);
  }

  updateCorr(id: number, dto: Partial<Correlativo>): Observable<Correlativo> {
    return this.api.put<Correlativo>(`${this.path}/correlativos`, id, dto);
  }

  removeCorr(id: number, empresaId: number): Observable<any> {
    return this.api.delete<any>(`${this.path}/correlativos`, id);
  }

  getNextNroFactura(empresaId: number, idsucursal: number): Observable<{ nrofactura: number }> {
    return this.api.get<{ nrofactura: number }>(`${this.path}/correlativos/siguiente-nro`, { empresaId, idsucursal });
  }

  getEstadoCorrelativo(empresaId: number): Observable<EstadoCorrelativo[]> {
    return this.api.get<EstadoCorrelativo[]>(`${this.path}/correlativos/estado`, { empresaId });
  }

  // ===== Sucursales =====

  getAllSucursales(empresaId: number): Observable<Sucursal[]> {
    return this.api.get<Sucursal[]>(`${this.path}/sucursales`, { empresaId });
  }

  createSucursal(dto: Partial<Sucursal>): Observable<Sucursal> {
    return this.api.post<Sucursal>(`${this.path}/sucursales`, dto);
  }

  updateSucursal(id: number, dto: Partial<Sucursal>): Observable<Sucursal> {
    return this.api.put<Sucursal>(`${this.path}/sucursales`, id, dto);
  }

  // ===== Logo =====

  getLogo(empresaId: number): Observable<EmpresaLogo | null> {
    return this.api.get<EmpresaLogo | null>(`${this.path}/logo`, { empresaId });
  }

  createLogo(dto: Partial<EmpresaLogo>): Observable<EmpresaLogo> {
    return this.api.post<EmpresaLogo>(`${this.path}/logo`, dto);
  }

  updateLogo(id: number, dto: Partial<EmpresaLogo>): Observable<EmpresaLogo> {
    return this.api.put<EmpresaLogo>(`${this.path}/logo`, id, dto);
  }

  removeLogo(id: number): Observable<any> {
    return this.api.delete<any>(`${this.path}/logo`, id);
  }

  // ===== Impresoras =====

  getAllImpresoras(empresaId: number): Observable<Impresora[]> {
    return this.api.get<Impresora[]>(`${this.path}/impresoras`, { empresaId });
  }

  createImpresora(dto: Partial<Impresora>): Observable<Impresora> {
    return this.api.post<Impresora>(`${this.path}/impresoras`, dto);
  }

  updateImpresora(id: number, dto: Partial<Impresora>): Observable<Impresora> {
    return this.api.put<Impresora>(`${this.path}/impresoras`, id, dto);
  }

  removeImpresora(id: number): Observable<any> {
    return this.api.delete<any>(`${this.path}/impresoras`, id);
  }
}
