import { Injectable, inject } from '@angular/core';
import { Observable, of, tap, shareReplay } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ProductoTienda, CarritoItem, CheckoutPago, CheckoutResponse } from '../../../core/models/tienda.models';

/**
 * Origen de la solicitud -> clave de caché distinta (para evitar colisiones
 * entre /facturacion/tienda y /facturacion/restaurante que comparten el endpoint).
 *  - 'tienda': => lógica parametrizada (tipo_de_giro_tienda='C'), SOLO este componente
 *  - 'restaurante': => lógica R original (sin filtro), NUNCA se modifica
 */
type OrigenCache = 'tienda' | 'restaurante' | 'all';

interface CacheEntry {
  data: ProductoTienda[];
  ts: number;
}

@Injectable({ providedIn: 'root' })
export class TiendaService {
  private api = inject(ApiService);
  private readonly TTL = 60 * 1000; // 1 minuto
  private cacheStore = new Map<OrigenCache, CacheEntry>();

  /** Productos para tienda virtual (con imagen y stock). Filtro por origen parametrizado 'C'. */
  getProductos(
    forceRefresh = false,
    origen: OrigenCache = 'all',
  ): Observable<ProductoTienda[]> {
    const key = origen || 'all';

    if (!forceRefresh) {
      const hit = this.cacheStore.get(key);
      if (hit && Date.now() - hit.ts <= this.TTL) {
        return of(hit.data).pipe(shareReplay(1));
      }
    }

    const src = this.api.get<ProductoTienda[]>(
      '/inventario/tienda/productos',
      key === 'all' ? undefined : { origen: key },
    ).pipe(
      tap((data) => this.save(key, data)),
      shareReplay(1),
    );
    return src;
  }

  invalidateCache() {
    this.cacheStore.clear();
    try {
      const store = localStorage as unknown as Storage;
      for (let i = store.length - 1; i >= 0; i--) {
        const k = store.key(i);
        if (k && k.startsWith('tienda_productos_v1_')) store.removeItem(k);
      }
    } catch {
      /* ignore */
    }
  }

  private save(key: OrigenCache, data: ProductoTienda[]) {
    try {
      this.cacheStore.set(key, { data, ts: Date.now() });
      localStorage.setItem(
        `tienda_productos_v1_${key}`,
        JSON.stringify({ data, ts: Date.now() }),
      );
    } catch {
      /* localStorage deshabilitado */
    }
  }

  // ===================== Carrito =====================

  getCarritoItems(carritoId: number): Observable<CarritoItem[]> {
    return this.api.get<CarritoItem[]>(`/facturacion/cotizaciones-det/mae/${carritoId}`);
  }

  crearCarrito(
    nombrecliente: string,
    direccion: string,
    atendio: string,
    gestorId: number,
  ): Observable<{ poscotmaeId: number }> {
    return this.api.post<{ poscotmaeId: number }>('/facturacion/cotizaciones', {
      Nombrecliente: nombrecliente || 'Cliente Tienda',
      direccion: direccion || 'N/A',
      atendio: atendio || 'Tienda Online',
      gestorId: Number(gestorId) || 1,
    });
  }

  agregarItem(payload: any): Observable<void> {
    return this.api.post<void>('/facturacion/cotizaciones-det', payload).pipe(
      tap(() => this.invalidateCache()),
    );
  }

  eliminarItem(poscotdetId: number): Observable<any> {
    return this.api.delete('/facturacion/cotizaciones-det', poscotdetId).pipe(
      tap(() => this.invalidateCache()),
    );
  }

  checkout(p: any): Observable<CheckoutResponse> {
    return this.api.post<CheckoutResponse>('/facturacion/tienda/checkout', p);
  }
}
