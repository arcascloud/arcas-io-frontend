import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ProductoTienda, Carrito, CarritoItem, CheckoutPago, CheckoutResponse } from '../../../core/models/tienda.models';

@Injectable({ providedIn: 'root' })
export class TiendaService {
  private api = inject(ApiService);

  getProductos(): Observable<ProductoTienda[]> {
    return this.api.get<ProductoTienda[]>('/inventario/tienda/productos');
  }

  crearCarrito(nombre: string, direccion: string, atendio: string, gestorId: number): Observable<Carrito> {
    return this.api.post<Carrito>('/facturacion/cotizaciones', {
      Nombrecliente: nombre,
      direccion: direccion || 'N/A',
      atendio,
      gestorId,
    });
  }

  agregarItem(payload: {
    poscotmaeId: number;
    productoId: string;
    codbarra: string;
    cantidad: number;
    precio: number;
    subTotal: number;
  }): Observable<CarritoItem> {
    return this.api.post<CarritoItem>('/facturacion/cotizaciones-det', payload);
  }

  getCarritoItems(maeId: number): Observable<CarritoItem[]> {
    return this.api.get<CarritoItem[]>(`/facturacion/cotizaciones-det/mae/${maeId}`);
  }

  eliminarItem(detId: number): Observable<any> {
    return this.api.delete<any>('/facturacion/cotizaciones-det', detId);
  }

  eliminarCarrito(maeId: number): Observable<any> {
    return this.api.delete<any>('/facturacion/cotizaciones', maeId);
  }

  checkout(pago: CheckoutPago): Observable<CheckoutResponse> {
    return this.api.post<CheckoutResponse>('/facturacion/tienda/checkout', pago, { sinContexto: true });
  }
}
