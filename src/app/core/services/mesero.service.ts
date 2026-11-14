import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { FacturacionService } from './facturacion.service';
import { OrdenMesero, RondaPayload } from '../models/mesero.models';

/**
 * Llamadas NUEVAS del flujo mesero. Todo lo demás (órdenes abiertas, ítems,
 * ISV, marcar entregado) se reutiliza de RestauranteService sin cambios.
 */
@Injectable({ providedIn: 'root' })
export class MeseroService {
  private fac = inject(FacturacionService);

  /**
   * Envía una ronda de productos: el servidor abre la orden del puesto si no existe
   * (o agrega a la abierta), crea las líneas en estado PENDIENTE, recalcula totales
   * y deja la orden en ENVIADO hacia la caja indicada — todo en una transacción.
   *
   * La orden SIEMPRE lleva cliente (`nombrecliente`) y mesero (`gestorId` →
   * ttipogestores): no se crean tablas ni columnas nuevas para eso.
   */
  enviarRonda(payload: RondaPayload): Observable<OrdenMesero> {
    return this.fac.createMae<OrdenMesero>('/facturacion/restaurante/rondas', payload);
  }
}
