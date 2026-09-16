import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Correlativo } from '../models/empresa.models';

@Injectable({ providedIn: 'root' })
export class CorrelativosService {
  private api = inject(ApiService);
  private path = '/facturacion/correlativos';

  getAll(): Observable<Correlativo[]> {
    return this.api.get<Correlativo[]>(this.path);
  }

  create(dto: Partial<Correlativo>): Observable<Correlativo> {
    return this.api.post<Correlativo>(this.path, dto);
  }

  update(id: number, dto: Partial<Correlativo>): Observable<Correlativo> {
    return this.api.put<Correlativo>(this.path, id, dto);
  }
}
