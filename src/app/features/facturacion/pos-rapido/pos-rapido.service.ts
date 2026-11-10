import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import type { OpcionPos, ParametrosImpuesto, TarjetaProducto } from './pos-rapido.models';
import { aNumero, estadoStock, TASA_ISV_DEFECTO } from './pos-rapido.utils';

/** Respuesta de /inventario/productos (puede venir como array o envuelta en value/data) */
type RespuestaLista = any[] | { value?: any[]; data?: any[] } | null;

/** Producto de /inventario/productos tal como lo devuelve el backend */
interface ProductoApi {
  produtoId?: number;
  productoId?: number;
  codbarra?: string;
  codigo_sku?: string;
  descripcion?: string;
  precioventa?: number | string;
  stockMinimo?: number | string;
  sn_activo?: string;
}

/** Fila de /inventario/existencias */
interface ExistenciaApi {
  productoId?: number | string;
  existencia?: number | string;
}

/** Fila de /inventario/productos-img */
interface ProductoImgApi {
  productoId?: number | string;
  img?: string;
  sn_activo?: string;
}

/** Fila de /facturacion/combos-ofertas */
interface OfertaApi {
  productoId?: number | string;
  porcentaje?: number | string;
  precioConDescuento?: number | string;
}

/** Fila de /parametros/formas-pago */
interface FormaPagoApi {
  formapagoId?: number | string;
  descripcion?: string;
}

/** Desenvuelve listas que el backend devuelve como array o como { value/data: [] } */
function lista<T>(res: RespuestaLista): T[] {
  if (Array.isArray(res)) return res as T[];
  if (Array.isArray(res?.value)) return res.value as T[];
  if (Array.isArray(res?.data)) return res.data as T[];
  return [];
}

/**
 * Acceso a datos del POS visual.
 *
 * Concentra las llamadas al backend para que el componente solo se ocupe de
 * la interacción (escáner, catálogo, carrito).
 */
@Injectable({ providedIn: 'root' })
export class PosRapidoService {
  private api = inject(ApiService);

  /**
   * Catálogo completo con existencia agregada, imagen y oferta vigente.
   * Todo se resuelve en una sola tanda de peticiones en paralelo.
   */
  cargarCatalogo(): Observable<TarjetaProducto[]> {
    return forkJoin({
      productos: this.api
        .get<RespuestaLista>('/inventario/productos')
        .pipe(catchError(() => of(null))),
      existencias: this.api
        .get<RespuestaLista>('/inventario/existencias')
        .pipe(catchError(() => of(null))),
      imagenes: this.api
        .get<RespuestaLista>('/inventario/productos-img')
        .pipe(catchError(() => of(null))),
      ofertas: this.api
        .get<RespuestaLista>('/facturacion/combos-ofertas')
        .pipe(catchError(() => of(null))),
    }).pipe(
      map(({ productos, existencias, imagenes, ofertas }) =>
        this.construirCatalogo(
          lista<ProductoApi>(productos),
          lista<ExistenciaApi>(existencias),
          lista<ProductoImgApi>(imagenes),
          lista<OfertaApi>(ofertas),
        ),
      ),
    );
  }

  /** Tasa de ISV vigente y si el precio de venta ya la incluye */
  cargarParametrosImpuesto(): Observable<ParametrosImpuesto> {
    return forkJoin({
      impuestos: this.api
        .get<RespuestaLista>('/parametros/impuestos')
        .pipe(catchError(() => of(null))),
      param: this.api
        .get<any>('/parametros/parametros/objeto?moduloId=3')
        .pipe(catchError(() => of(null))),
    }).pipe(
      map(({ impuestos, param }) => {
        const impuestoId = aNumero(param?.impuestoId);
        const activos = lista<any>(impuestos).filter((i) => i?.sn_activo === 'S');
        const porId = activos.find((i) => aNumero(i?.impuestoId) === impuestoId);
        const porModulo = porId ?? activos.find((i) => aNumero(i?.moduloId) === 3);
        const pct = aNumero(porModulo?.porcentaje);
        return {
          tasa: pct > 0 ? pct / 100 : TASA_ISV_DEFECTO,
          precioIncluyeImpuesto: param?.sn_impuestoincluido === 'S',
        };
      }),
    );
  }

  /** Formas de pago activas del catálogo */
  cargarFormasPago(): Observable<OpcionPos[]> {
    return this.api.get<RespuestaLista>('/parametros/formas-pago').pipe(
      catchError(() => of(null)),
      map((res) =>
        lista<FormaPagoApi>(res).map((f) => ({
          label: String(f.descripcion ?? 'Forma de pago'),
          value: aNumero(f.formapagoId),
        })),
      ),
    );
  }

  /** Tarjetas de crédito del catálogo (para pagos con tarjeta) */
  cargarTarjetas(): Observable<OpcionPos[]> {
    return this.api.get<RespuestaLista>('/parametros/tarjetas-credito').pipe(
      catchError(() => of(null)),
      map((res) =>
        lista<{ tarjetacreditoId?: number | string; descripcion?: string }>(res).map((t) => ({
          label: String(t.descripcion ?? 'Tarjeta'),
          value: aNumero(t.tarjetacreditoId),
        })),
      ),
    );
  }

  /** Búsqueda directa al backend para códigos que no están en el catálogo cargado */
  buscarPorCodigo(texto: string): Observable<any[]> {
    return this.api.get<RespuestaLista>('/inventario/productos/buscar', { q: texto.trim() }).pipe(
      catchError(() => of(null)),
      map((res) => lista<any>(res)),
    );
  }

  private construirCatalogo(
    productos: ProductoApi[],
    existencias: ExistenciaApi[],
    imagenes: ProductoImgApi[],
    ofertas: OfertaApi[],
  ): TarjetaProducto[] {
    const stockPorProducto = new Map<number, number>();
    for (const e of existencias) {
      const id = aNumero(e.productoId);
      if (id) stockPorProducto.set(id, (stockPorProducto.get(id) ?? 0) + aNumero(e.existencia));
    }

    const imagenPorProducto = new Map<number, string>();
    for (const i of imagenes) {
      const id = aNumero(i.productoId);
      if (id && i.img && i.sn_activo !== 'N' && !imagenPorProducto.has(id)) {
        imagenPorProducto.set(id, this.resolverImagen(i.img));
      }
    }

    const ofertaPorProducto = new Map<number, { porcentaje: number; precio: number }>();
    for (const o of ofertas) {
      const id = aNumero(o.productoId);
      if (id) {
        ofertaPorProducto.set(id, {
          porcentaje: aNumero(o.porcentaje),
          precio: aNumero(o.precioConDescuento),
        });
      }
    }

    const catalogo: TarjetaProducto[] = [];
    for (const p of productos) {
      if (p.sn_activo === 'N') continue;
      const productoId = aNumero(p.produtoId ?? p.productoId);
      if (!productoId) continue;

      const existencia = stockPorProducto.get(productoId) ?? 0;
      const stockMinimo = aNumero(p.stockMinimo);
      const oferta = ofertaPorProducto.get(productoId);
      const precioLista = aNumero(p.precioventa);
      const precioOferta = oferta && oferta.precio > 0 ? oferta.precio : null;

      catalogo.push({
        productoId,
        codbarra: String(p.codbarra ?? p.codigo_sku ?? ''),
        descripcion: String(p.descripcion ?? `Producto #${productoId}`),
        precio: precioOferta ?? precioLista,
        precioOriginal: precioOferta != null ? precioLista : null,
        ofertaPct: oferta && oferta.porcentaje > 0 ? oferta.porcentaje : null,
        imagenUrl: imagenPorProducto.get(productoId) ?? null,
        existencia,
        stockMinimo,
        estado: estadoStock(existencia, stockMinimo),
      });
    }

    return catalogo.sort((a, b) => a.descripcion.localeCompare(b.descripcion, 'es'));
  }

  /** Las imágenes llegan como base64 crudo o como data URL ya armada */
  private resolverImagen(img: string): string {
    return /^data:/i.test(img) ? img : `data:image/png;base64,${img}`;
  }
}
