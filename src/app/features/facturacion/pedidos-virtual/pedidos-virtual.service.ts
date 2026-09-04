import { Injectable, inject } from '@angular/core';
import { Observable, of, tap, shareReplay } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ProductoTienda, Pedido, PedidoItem, CheckoutPedido, CheckoutPedidoResponse } from '../../../core/models/pedido.models';

const PRODUCTOS_CACHE_KEY = 'pedidos_productos_v1';
const PRODUCTOS_CACHE_TTL = 5 * 60 * 1000;

interface ProductosCache {
  data: ProductoTienda[];
  timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class PedidosVirtualService {
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

  crearPedido(nombrecliente: string, nrotelefono: string): Observable<Pedido> {
    return this.api.post<Pedido>('/facturacion/pedidos', {
      nombrecliente,
      nrotelefono: nrotelefono || 'N/A',
      sn_enviogratis: 'N',
      sn_facturado: 'N',
    });
  }

  agregarItem(payload: {
    pospedmaeId: number;
    productoId: number;
    codbarra: string;
    cantidad: number;
    precioventa: number;
    subtotal: number;
    descuento: number;
    impuesto: number;
    nrofila: number;
  }): Observable<PedidoItem> {
    return this.api.post<PedidoItem>('/facturacion/pedidos-det', payload);
  }

  getPedidoItems(pedidoId: number): Observable<PedidoItem[]> {
    return this.api.get<PedidoItem[]>(`/facturacion/pedidos-det/pedido/${pedidoId}`);
  }

  eliminarItem(detId: number): Observable<any> {
    return this.api.delete<any>('/facturacion/pedidos-det', detId);
  }

  eliminarPedido(pedidoId: number): Observable<any> {
    return this.api.delete<any>('/facturacion/pedidos', pedidoId);
  }

  checkout(pago: CheckoutPedido): Observable<CheckoutPedidoResponse> {
    return this.api.post<CheckoutPedidoResponse>('/facturacion/pedidos/checkout', pago, { sinContexto: true });
  }

  getPedido(pedidoId: number): Observable<Pedido> {
    return this.api.get<Pedido>(`/facturacion/pedidos/${pedidoId}`);
  }

  getPedidoItemsByPedidoId(pedidoId: number): Observable<PedidoItem[]> {
    return this.api.get<PedidoItem[]>(`/facturacion/pedidos-det/pedido/${pedidoId}`);
  }
}
