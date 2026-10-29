import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, of, map, switchMap, catchError, shareReplay } from 'rxjs';
import { ApiService } from './api.service';
import {
  ConfigISV,
  FacturaResultado,
  OrdenItem,
  OrdenRestaurante,
  PagoOrden,
} from '../models/restaurante.models';

/**
 * Órdenes del restaurante sobre los endpoints de PEDIDOS que ya existen
 * (/facturacion/pedidos, /pedidos-det y /pedidos/checkout).
 * ApiService inyecta empresaId e Idsucursal, igual que en pedido-form.
 *
 * Requiere las columnas nuevas pospedmae.nromesa y pospedmae.sn_entregado
 * (ver CAMBIOS-BACKEND.md).
 */
@Injectable({ providedIn: 'root' })
export class RestauranteService {
  private api = inject(ApiService);
  private isv$: Observable<ConfigISV> | null = null;

  private round2 = (n: number) => Math.round(n * 100) / 100;

  /** ISV: mismo criterio que pedido-form (param-fac módulo 3 + catálogo de impuestos). */
  cargarISV(): Observable<ConfigISV> {
    if (!this.isv$) {
      this.isv$ = forkJoin({
        impuestos: this.api.get<any[]>('/parametros/impuestos').pipe(catchError(() => of([] as any[]))),
        param: this.api.get<any>('/parametros/parametros/objeto?moduloId=3').pipe(catchError(() => of(null))),
      }).pipe(
        map(({ impuestos, param }) => {
          const lista = impuestos ?? [];
          const impuestoId = Number(param?.impuestoId) || null;
          const activo =
            lista.find((i) => i.impuestoId === impuestoId && i.sn_activo === 'S') ??
            lista.find((i) => Number(i.moduloId) === 3 && i.sn_activo === 'S');
          const pct = Number(activo?.porcentaje) || 0;
          return { tasa: pct > 0 ? pct / 100 : 0, incluido: param?.sn_impuestoincluido === 'S' };
        }),
        shareReplay(1),
      );
    }
    return this.isv$;
  }

  /** Bruto e ISV de una línea (sin descuentos ni venta exenta en esta primera versión). */
  calcularLinea(cantidad: number, precio: number, cfg: ConfigISV): { bruto: number; impuesto: number } {
    const bruto = this.round2(cantidad * precio);
    const impuesto = cfg.incluido
      ? this.round2((bruto * cfg.tasa) / (1 + cfg.tasa))
      : this.round2(bruto * cfg.tasa);
    return { bruto, impuesto };
  }

  // ───────────────────────── Órdenes ─────────────────────────

  /**
   * Órdenes abiertas del restaurante: sin facturar, de HOY y con mesa asignada
   * (nromesa >= 1). Los pedidos "huérfanos" con mesa 0 o sin mesa —y los de días
   * anteriores— no interesan y quedan fuera, igual que los pedidos de la tienda
   * virtual que viven en la misma tabla.
   */
  getOrdenesAbiertas(): Observable<OrdenRestaurante[]> {
    return this.api.get<any[]>('/facturacion/pedidos').pipe(
      map((lista) => {
        const hoy = new Date();
        return (lista ?? [])
          .filter((o) => {
            if (o.sn_facturado !== 'N') return false;

            const nromesa = o.nromesa != null ? Number(o.nromesa) : 0;
            if (nromesa < 1) return false; // sin mesa real no es una orden de restaurante

            const f = o.fecharegistro ? new Date(o.fecharegistro) : null;
            if (!f || isNaN(f.getTime())) return false;
            return (
              f.getFullYear() === hoy.getFullYear() &&
              f.getMonth() === hoy.getMonth() &&
              f.getDate() === hoy.getDate()
            );
          })
          .map((o) => this.normalizarOrden(o))
          .sort((a, b) => (a.nromesa ?? 0) - (b.nromesa ?? 0));
      }),
    );
  }

  /** La orden nace YA con su mesa: nunca existe un pedido sin mesa (nromesa >= 1). */
  crearOrden(nromesa: number): Observable<OrdenRestaurante> {
    return this.api
      .post<OrdenRestaurante>('/facturacion/pedidos', {
        nombrecliente: `Mesa ${nromesa}`,
        nrotelefono: 'N/A',
        nromesa,
        sn_entregado: 'N',
      })
      .pipe(map((o) => this.normalizarOrden(o)));
  }

  marcarEntregada(ordenId: number): Observable<OrdenRestaurante> {
    return this.api
      .put<OrdenRestaurante>('/facturacion/pedidos', ordenId, { sn_entregado: 'S' })
      .pipe(map((o) => this.normalizarOrden(o)));
  }

  /** Solo se puede cancelar una orden sin líneas (el backend borra cabecera y detalle). */
  cancelarOrden(ordenId: number): Observable<unknown> {
    return this.api.delete('/facturacion/pedidos', ordenId);
  }

  getOrden(ordenId: number): Observable<OrdenRestaurante> {
    return this.api
      .get<OrdenRestaurante>(`/facturacion/pedidos/${ordenId}`)
      .pipe(map((o) => this.normalizarOrden(o)));
  }

  // ───────────────────────── Líneas ─────────────────────────

  getItems(ordenId: number): Observable<OrdenItem[]> {
    return this.api
      .get<OrdenItem[]>(`/facturacion/pedidos-det/pedido/${ordenId}`)
      .pipe(map((lista) => (lista ?? []).map((d) => this.normalizarItem(d)).sort((a, b) => a.nrofila - b.nrofila)));
  }

  agregarItem(
    ordenId: number,
    producto: { productoId: number; codbarra: string; precio: number },
    nrofila: number,
  ): Observable<OrdenItem> {
    return this.cargarISV().pipe(
      switchMap((cfg) => {
        const { bruto, impuesto } = this.calcularLinea(1, producto.precio, cfg);
        return this.api.post<OrdenItem>('/facturacion/pedidos-det', {
          pospedmaeId: ordenId,
          productoId: producto.productoId,
          codbarra: producto.codbarra || '',
          cantidad: 1,
          precioventa: producto.precio,
          subtotal: bruto,
          descuento: 0,
          p_descuento: 0,
          impuesto,
          nrofila,
        });
      }),
      map((d) => this.normalizarItem(d)),
    );
  }

  cambiarCantidad(item: OrdenItem, cantidad: number): Observable<OrdenItem> {
    return this.cargarISV().pipe(
      switchMap((cfg) => {
        const { bruto, impuesto } = this.calcularLinea(cantidad, item.precioventa, cfg);
        return this.api.put<OrdenItem>('/facturacion/pedidos-det', item.pospeddetId, {
          cantidad,
          subtotal: bruto,
          impuesto,
        });
      }),
      map((d) => this.normalizarItem(d)),
    );
  }

  quitarItem(item: OrdenItem): Observable<unknown> {
    return this.api.delete('/facturacion/pedidos-det', item.pospeddetId);
  }

  // ───────────────────────── Cobro ─────────────────────────

  /** Convierte la orden en factura (reusa /pedidos/checkout). */
  facturar(orden: OrdenRestaurante, pago: PagoOrden): Observable<FacturaResultado> {
    return this.api.post<FacturaResultado>('/facturacion/pedidos/checkout', {
      pospedmaeId: orden.pospedmaeId,
      nombrecliente: orden.nombrecliente || `Mesa ${orden.nromesa ?? ''}`.trim(),
      formapagoId: pago.formapagoId,
      efectivo_recibido: pago.efectivo_recibido,
    });
  }

  getFormasPago(): Observable<{ label: string; value: number }[]> {
    return this.api
      .get<any[]>('/parametros/formas-pago')
      .pipe(map((lista) => (lista ?? []).map((f) => ({ label: f.descripcion, value: f.formapagoId }))));
  }

  // ───────────────────────── Normalización ─────────────────────────
  // MySQL devuelve los DECIMAL como string: se convierten una sola vez aquí.

  private normalizarOrden(o: any): OrdenRestaurante {
    return {
      pospedmaeId: Number(o.pospedmaeId),
      fecharegistro: o.fecharegistro,
      nombrecliente: o.nombrecliente ?? '',
      nromesa: o.nromesa == null ? null : Number(o.nromesa),
      sn_entregado: o.sn_entregado === 'S' ? 'S' : 'N',
      sn_facturado: o.sn_facturado === 'S' ? 'S' : 'N',
      subTotal: Number(o.subTotal) || 0,
      impuesto: Number(o.impuesto) || 0,
      total: Number(o.total) || 0,
    };
  }

  private normalizarItem(d: any): OrdenItem {
    return {
      pospeddetId: Number(d.pospeddetId),
      pospedmaeId: Number(d.pospedmaeId),
      productoId: Number(d.productoId),
      codbarra: d.codbarra ?? '',
      cantidad: Number(d.cantidad) || 0,
      precioventa: Number(d.precioventa) || 0,
      impuesto: Number(d.impuesto) || 0,
      subtotal: Number(d.subtotal) || 0,
      nrofila: Number(d.nrofila) || 0,
    };
  }
}
