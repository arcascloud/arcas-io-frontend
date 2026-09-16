import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Sucursal } from '../models/sucursal.models';

@Injectable({ providedIn: 'root' })
export class SucursalesService {
  private api = inject(ApiService);
  private path = '/sucursales';

  getAll(empresaId?: number): Observable<Sucursal[]> {
    return this.api.get<Sucursal[]>(this.path, empresaId ? { empresaId } : undefined);
  }

  getOne(id: number): Observable<Sucursal> {
    return this.api.getOne<Sucursal>(this.path, id);
  }

  create(dto: Partial<Sucursal>): Observable<Sucursal> {
    return this.api.post<Sucursal>(this.path, dto);
  }

  update(id: number, dto: Partial<Sucursal>): Observable<Sucursal> {
    return this.api.put<Sucursal>(this.path, id, dto);
  }
}
