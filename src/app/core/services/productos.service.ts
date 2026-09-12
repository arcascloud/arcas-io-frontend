import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Producto, ProductoDet, ProductoImg } from '../models/inventario.models';

@Injectable({ providedIn: 'root' })
export class ProductosService {
  private api = inject(ApiService);

  private path = '/inventario/productos';

  /**
   * Obtiene todos los productos del backend
   * @returns Observable con el listado completo de productos
   */
  getAll(): Observable<Producto[]> {
    return this.api.get<Producto[]>(this.path);
  }

  /**
   * Obtiene un producto por su ID
   * @param id - Identificador único del producto
   * @returns Observable con el producto encontrado
   */
  getOne(id: number): Observable<Producto> {
    return this.api.getOne<Producto>(this.path, id);
  }

  /**
   * Crea un nuevo producto en el backend
   * @param dto - Datos parciales del producto a crear
   * @returns Observable con el producto creado
   */
  create(dto: Partial<Producto>): Observable<Producto> {
    return this.api.post<Producto>(this.path, dto);
  }

  /**
   * Actualiza un producto existente en el backend
   * @param id - Identificador único del producto a actualizar
   * @param dto - Datos parciales del producto a actualizar
   * @returns Observable con el producto actualizado
   */
  update(id: number, dto: Partial<Producto>): Observable<Producto> {
    return this.api.put<Producto>(this.path, id, dto);
  }

  search(termino: string): Observable<Producto[]> {
    return this.api.get<Producto[]>('/inventario/productos/buscar', { q: termino });
  }

  // ── ProductoDet (atributos específicos) ──────────────────────────

  getDetAll(): Observable<ProductoDet[]> {
    return this.api.get<ProductoDet[]>('/inventario/productos-det');
  }

  getDetByProducto(produtoId: number): Observable<ProductoDet[]> {
    return this.api.get<ProductoDet[]>('/inventario/productos-det', { produtoId });
  }

  createDet(dto: Partial<ProductoDet>): Observable<ProductoDet> {
    return this.api.post<ProductoDet>('/inventario/productos-det', dto);
  }

  updateDet(id: number, dto: Partial<ProductoDet>): Observable<ProductoDet> {
    return this.api.put<ProductoDet>('/inventario/productos-det', id, dto);
  }

  deleteDet(id: number): Observable<void> {
    return this.api.delete<void>('/inventario/productos-det', id);
  }

  // ── ProductoImg (imágenes del producto) ──────────────────────────

  getImgAll(): Observable<ProductoImg[]> {
    return this.api.get<ProductoImg[]>('/inventario/productos-img');
  }

  getImgByProducto(productoId: number): Observable<ProductoImg[]> {
    return this.api.get<ProductoImg[]>('/inventario/productos-img', { productoId });
  }

  createImg(dto: Partial<ProductoImg>): Observable<ProductoImg> {
    return this.api.post<ProductoImg>('/inventario/productos-img', dto);
  }

  updateImg(id: number, dto: Partial<ProductoImg>): Observable<ProductoImg> {
    return this.api.put<ProductoImg>('/inventario/productos-img', id, dto);
  }

  deleteImg(id: number): Observable<void> {
    return this.api.delete<void>('/inventario/productos-img', id);
  }
}
