import { Injectable, inject } from '@angular/core';
import { Observable, of, tap, shareReplay } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ProductoTienda, Carrito, CarritoItem, CheckoutPago, CheckoutResponse } from '../../../core/models/tienda.models';

const PRODUCTOS_CACHE_KEY = 'tienda_productos_v1';
const PRODUCTOS_CACHE_TTL = 5 * 60 * 1000; // 5 minutos

interface ProductosCache {
  data: ProductoTienda[];
  timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class TiendaService {
  private api = inject(ApiService);
  private productosCache$: Observable<ProductoTienda[]> | null = null;

  getProductos(): Observable<ProductoTienda[]> {
    if (this.productosCache$) return this.productosCache$;

    const cached = this.leerCache();
    if (cached) {
      this.productosCache$ = of(cached).pipe(shareReplay(1));
      return this.productosCache$;
    }

    this.productosCache$ = this.api.get<ProductoTienda[]>('/inventario/tienda/productos').pipe(
      tap(data => this.escribirCache(data)),
      shareReplay(1),
    );
    return this.productosCache$;
  }

  invalidateCache() {
    this.productosCache$ = null;
    try { localStorage.removeItem(PRODUCTOS_CACHE_KEY); } catch {}
  }

  private leerCache(): ProductoTienda[] | null {
    try {
      const raw = localStorage.getItem(PRODUCTOS_CACHE_KEY);
      if (!raw) return null;
      const cache: ProductosCache = JSON.parse(raw);
      if (Date.now() - cache.timestamp > PRODUCTOS_CACHE_TTL) {
        localStorage.removeItem(PRODUCTOS_CACHE_KEY);
        return null;
      }
      return cache.data;
    } catch {
      return null;
    }
  }

  private escribirCache(data: ProductoTienda[]) {
    try {
      const cache: ProductosCache = { data, timestamp: Date.now() };
      localStorage.setItem(PRODUCTOS_CACHE_KEY, JSON.stringify(cache));
    } catch {}
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
