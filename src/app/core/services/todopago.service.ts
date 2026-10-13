import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';

/** Config retornada por GET /todopago/config */
export interface TodoPagoConfig {
  enabled: boolean;
  sandbox: boolean;
  hasMerchant: boolean;
  hasApiKey: boolean;
  formapagoId: number;
  urlOk: string;
}

/** Link de pago generado */
export interface TodoPagoLink {
  transaccionId: number;
  url: string;
  publicRequestKey: string;
  operationId: string;
  sandbox: boolean;
  monto: number;
  status: string;
}

/** Transacción consultada */
export interface TodoPagoTransaccion {
  id: number;
  facturaid: number;
  operation_id: string;
  public_request_key: string | null;
  status: 'pending' | 'completed' | 'failed' | 'expired' | 'reversed';
  monto: number;
  metodo: string | null;
  fecha_creacion: string;
  fecha_confirmacion: string | null;
  alreadyProcessed?: boolean;
  nrofactura?: string | number;
  url?: string | null;
  sandbox?: boolean;
}

/** Link pendiente (GET /todopago/links-pendientes) — transacción + datos de la factura */
export interface TodoPagoLinkPendiente extends TodoPagoTransaccion {
  nrofactura: number | string | null;
  nombrecliente: string | null;
  totalFactura: number | null;
  empresaId: number | null;
  snPagada: string | null;
  snAnulada: string | null;
}

/** ttipoformapago.formapagoId de 'TodoPagoLink' */
export const FORMAPAGO_TODOPAGO = 6;

@Injectable({ providedIn: 'root' })
export class TodoPagoService {
  private api = inject(ApiService);
  private http = inject(HttpClient);

  private get base(): string {
    return `${environment.apiUrl}/todopago`;
  }

  /** GET /todopago/config — estado de la configuración */
  getConfig(): Observable<TodoPagoConfig> {
    return this.api.get<TodoPagoConfig>('/todopago/config');
  }

  /** POST /todopago/generar-link/:facturaId — genera el link de pago */
  generarLink(facturaId: number): Observable<TodoPagoLink> {
    return this.api.post<TodoPagoLink>(`/todopago/generar-link/${facturaId}`, {});
  }

  /** GET /todopago/status/:operationId — estado de la transacción */
  getStatus(operationId: string): Observable<TodoPagoTransaccion> {
    return this.api.get<TodoPagoTransaccion>(
      `/todopago/status/${encodeURIComponent(operationId)}`,
    );
  }

  /** GET /todopago/transacciones/:facturaId — historial de la factura */
  getTransacciones(facturaId: number): Observable<TodoPagoTransaccion[]> {
    return this.api.get<TodoPagoTransaccion[]>(`/todopago/transacciones/${facturaId}`);
  }

  /** GET /todopago/links-pendientes — links pendientes con datos de factura (empresaId auto-inyectado) */
  getLinksPendientes(): Observable<TodoPagoLinkPendiente[]> {
    return this.api.get<TodoPagoLinkPendiente[]>('/todopago/links-pendientes');
  }

  /**
   * POST /todopago/confirmar — callback público (página de confirmación).
   * Usa HttpClient directo (sin contexto de empresa ni auth requerida).
   */
  confirmar(publicRequestKey: string, answerKey?: string, order?: string): Observable<TodoPagoTransaccion> {
    return this.http.post<TodoPagoTransaccion>(
      `${this.base}/confirmar`,
      {
        PublicRequestKey: publicRequestKey,
        AnswerKey: answerKey || publicRequestKey,
        Order: order,
      },
      { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) },
    );
  }
}
