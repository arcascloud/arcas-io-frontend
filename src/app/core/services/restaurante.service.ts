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
 *
 * VENTA LIBRE = pedido sin mesa (nromesa = 0, nombrecliente = 'Venta Libre')
 * para locales con concepto mixto tienda de conveniencia + restaurante.
 * Ese nombre es el que distingue estas órdenes de los pedidos web/CRM de la
 * misma tabla (también con nromesa 0) — no existe columna de origen.
 */
export const VENTA_LIBRE = 'Venta Libre';

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
          return {
            tasa: pct > 0 ? pct / 100 : 0,
            incluido: param?.sn_impuestoincluido === 'S',
            // ttipoparametros (módulo 3).field = sn_imprimefactura → gate del ticket
            snImprimeFactura: param?.sn_imprimefactura === 'S',
          };
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
   * Órdenes abiertas del restaurante: sin facturadas, de HOY y con mesa asignada
   * (nromesa >= 1) **o** venta libre (nombrecliente = 'Venta Libre', nromesa 0).
   * Los pedidos "huérfanos" con mesa 0 —y los de la tienda virtual/CRM que
   * viven en la misma tabla con nromesa 0— quedan fuera por nombre, igual que
   * los de días anteriores.
   *
   * "Hoy" NO se calcula con new Date() del navegador: el backend guarda
   * fecharegistro como fecha de negocio a medianoche UTC (p.ej.
   * '2026-11-04T00:00:00.000Z') y en Honduras (UTC-6) eso se leía como
   * 03/11 → las órdenes del día desaparecían de la lista, la mesa se veía
   * libre y "Nueva orden" chocaba con el 400 "La mesa X ya tiene una orden
   * abierta". Se usa el MISMO criterio que valida el backend
   * (tempresas.fechasistema vía GET /parametros/fechas-sistema) comparando
   * cadenas YYYY-MM-DD, con el mismo `>=` de validarMesaLibre.
   */
  getOrdenesAbiertas(): Observable<OrdenRestaurante[]> {
    return forkJoin({
      lista: this.api.get<any[]>('/facturacion/pedidos'),
      estado: this.api
        .get<{ fechaSistema?: string | null }>('/parametros/fechas-sistema')
        .pipe(catchError(() => of(null as any))),
    }).pipe(
      map(({ lista, estado }) => {
        const hoy = (estado?.fechaSistema || '').slice(0, 10) || this.fechaLocal(new Date());
        return (lista ?? [])
          .filter((o) => {
            if (o.sn_facturado !== 'N') return false;

            const nromesa = o.nromesa != null ? Number(o.nromesa) : 0;
            const esVentaLibre = String(o.nombrecliente ?? '').trim().toUpperCase() === VENTA_LIBRE.toUpperCase();
            if (nromesa < 1 && !esVentaLibre) return false; // web/CRM/tienda u huérfanos

            const dia = this.fechaDia(o.fecharegistro);
            if (!dia) return false;
            return dia >= hoy;
          })
          .map((o) => this.normalizarOrden(o))
          .sort((a, b) => (a.nromesa ?? 0) - (b.nromesa ?? 0));
      }),
    );
  }

  /** Día 'YYYY-MM-DD' de un valor de fecharegistro (string ISO o Date) sin zonas horarias. */
  private fechaDia(f: any): string {
    if (!f) return '';
    if (typeof f === 'string') return f.slice(0, 10);
    const d = f instanceof Date ? f : new Date(f);
    return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
  }

  /** Día local del navegador 'YYYY-MM-DD' (respaldo si el estado de fecha falla). */
  private fechaLocal(d: Date): string {
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }

  /**
   * La orden nace YA con su mesa: nunca existe un pedido sin mesa (nromesa >= 1).
   * `nromesa < 1` (0) = VENTA LIBRE: pedido sin mesa para el concepto mixto
   * tienda/restaurante; se identifica por nombrecliente = 'Venta Libre'.
   */
  crearOrden(nromesa: number): Observable<OrdenRestaurante> {
    const esVentaLibre = !(nromesa >= 1);
    return this.api
      .post<OrdenRestaurante>('/facturacion/pedidos', {
        nombrecliente: esVentaLibre ? VENTA_LIBRE : `Mesa ${nromesa}`,
        nrotelefono: 'N/A',
        nromesa: esVentaLibre ? 0 : nromesa,
        sn_entregado: 'N',
      })
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

  /**
   * Cambia el estado de entrega de un ítem (toggle del mesero).
   * El backend sincroniza pospedmae.sn_entregado: 'S' cuando todos los ítems están en 'S'.
   */
  setItemEntregado(item: OrdenItem, entregado: boolean): Observable<OrdenItem> {
    return this.api
      .put<OrdenItem>('/facturacion/pedidos-det', item.pospeddetId, { sn_entregado: entregado ? 'S' : 'N' })
      .pipe(map((d) => this.normalizarItem(d)));
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

  /**
   * Convierte la orden en factura (reusa /pedidos/checkout).
   * `pagos` = filas de la tabla de formas de pago (misma estructura que
   * Nueva Factura / Pedidos): una fila en posfaccaja por cada pago.
   */
  facturar(orden: OrdenRestaurante, pagos: PagoOrden[]): Observable<FacturaResultado> {
    const conImporte = pagos.filter((p) => (Number(p.importe) || 0) > 0);
    const primero = conImporte[0];
    const totalPagado = conImporte.reduce((s, p) => s + (Number(p.importe) || 0), 0);
    const esTarjetaPrimero = !primero.esEfectivo && !!(primero.nrotarjeta || '').trim();
    const tipopago = primero.esEfectivo ? 'E' : esTarjetaPrimero ? 'T' : 'TR';

    return this.api.post<FacturaResultado>('/facturacion/pedidos/checkout', {
      pospedmaeId: orden.pospedmaeId,
      nombrecliente: orden.nombrecliente || `Mesa ${orden.nromesa ?? ''}`.trim(),
      formapagoId: primero.formapagoId ?? undefined,
      efectivo_recibido: totalPagado,
      tarjetacreditoId: esTarjetaPrimero ? (primero.tarjetacreditoId ?? undefined) : undefined,
      nrotarjeta: esTarjetaPrimero ? primero.nrotarjeta : undefined,
      nroautorizacion: primero.nroautorizacion || undefined,
      tipopago,
      pagos: conImporte.map((p) => ({
        formapagoId: p.formapagoId,
        tarjetacreditoId: p.tarjetacreditoId || undefined,
        nrotarjeta: p.nrotarjeta || undefined,
        nroautorizacion: p.nroautorizacion || undefined,
        importe: Number(p.importe) || 0,
        esEfectivo: p.esEfectivo,
      })),
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
      sn_entregado: d.sn_entregado === 'S' ? 'S' : 'N',
    };
  }
}
