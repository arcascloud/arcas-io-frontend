import { Injectable, inject } from '@angular/core';
import { Observable, of, tap, shareReplay } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ProductoTienda, Pedido, PedidoItem, CheckoutPedido, CheckoutPedidoResponse } from '../../../core/models/pedido.models';

/**
 * Origen de la solicitud → clave de caché distinta (para evitar colisiones
 * con /facturacion/tienda que comparten el endpoint /inventario/tienda/productos).
 *  - 'tienda': => lógica parametrizada (tipo_de_giro_tienda='C'), SOLO pedidos-virtual
 *  - 'all': => sin filtro, sirve para diagnostico/testing (no se usa en la app)
 */
type OrigenCache = 'tienda' | 'all';

interface CacheEntry {
  data: ProductoTienda[];
  ts: number;
}

@Injectable({ providedIn: 'root' })
export class PedidosVirtualService {
  private api = inject(ApiService);
  private readonly TTL = 60 * 1000; // 1 minuto
  private cacheStore = new Map<OrigenCache, CacheEntry>();

  /** Productos para pedidos-virtual (con imagen y stock). Filtro parametrizado 'C'. */
  getProductos(forceRefresh = false): Observable<ProductoTienda[]> {
    const key: OrigenCache = 'tienda'; // pedidos-virtual aplica el filtro 'C' parametrizado

    if (!forceRefresh) {
      const hit = this.cacheStore.get(key);
      if (hit && Date.now() - hit.ts <= this.TTL) {
        return of(hit.data).pipe(shareReplay(1));
      }
    }

    const src = this.api.get<ProductoTienda[]>('/inventario/tienda/productos', { origen: key })
      .pipe(tap((data) => this.save(key, data)), shareReplay(1));
    return src;
  }

  invalidateCache() {
    this.cacheStore.clear();
    try {
      const store = localStorage as unknown as Storage;
      for (let i = store.length - 1; i >= 0; i--) {
        const k = store.key(i);
        if (k && (k.startsWith('pedidos_productos_v1_') || k === 'pedidos_productos_v1')) {
          store.removeItem(k);
        }
      }
    } catch {
      /* ignore */
    }
  }

  private save(key: OrigenCache, data: ProductoTienda[]) {
    try {
      this.cacheStore.set(key, { data, ts: Date.now() });
      localStorage.setItem(`pedidos_productos_v1_${key}`, JSON.stringify({ data, ts: Date.now() }));
    } catch { /* ignore */ }
  }

  // ===================== Pedido =====================

  getPedido(pedidoId: number): Observable<Pedido & { items?: PedidoItem[] }> {
    return this.api.get<Pedido & { items: PedidoItem[] }>(`/facturacion/pedidos/${pedidoId}`);
  }

  getPedidoItems(pospedmaeId: number): Observable<PedidoItem[]> {
    return this.api.get<PedidoItem[]>(`/facturacion/pedidos-det/pedido/${pospedmaeId}`);
  }

  agregarItem(payload: any): Observable<any> {
    return this.api.post<void>('/facturacion/pedidos-det', payload).pipe(
      tap(() => this.invalidateCache()),
    );
  }

  eliminarItem(pospeddetId: number): Observable<any> {
    // ApiService.delete(path, id) agrega /${id}: la ruta va SIN el id
    return this.api.delete('/facturacion/pedidos-det', pospeddetId).pipe(
      tap(() => this.invalidateCache()),
    );
  }

  crearPedido(nombrecliente: string, telefono: string): Observable<{ pospedmaeId: number }> {
    return this.api.post<{ pospedmaeId: number }>('/facturacion/pedidos', {
      nombrecliente: nombrecliente || 'Cliente Tienda',
      nrotelefono: telefono || 'N/A',
    });
  }

  actualizarPedido(id: number, payload: any): Observable<any> {
    return this.api.put<void>('/facturacion/pedidos', id, payload).pipe(
      tap(() => this.invalidateCache()),
    );
  }

  checkout(p: any): Observable<CheckoutPedidoResponse> {
    return this.api.post<CheckoutPedidoResponse>('/facturacion/pedidos/checkout', p);
  }
}
