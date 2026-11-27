import { Injectable, computed, inject, signal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { CarritoItem, ProductoTienda } from '../models/tienda.models';
import { TiendaService } from '../../features/facturacion/tienda/tienda.service';
import { AuthService } from './auth.service';
import { esBajoDemanda } from '../utils/stock';

/**
 * Estado global del carrito de compras de la tienda virtual.
 * Permite que tanto tienda-virtual como el topbar (main-layout-public)
 * compartan los ítems, el id de cotización y la acción de agregar al carrito.
 */
@Injectable({ providedIn: 'root' })
export class CarritoStateService {
  private tiendaService = inject(TiendaService);
  private auth = inject(AuthService);
  private messageService = inject(MessageService);

  /** ID de la cotización/carrito activo */
  readonly carritoId = signal<number | null>(null);

  /** Ítems actuales del carrito */
  readonly carritoItems = signal<CarritoItem[]>([]);

  /** true mientras se sincronizan cambios del carrito con el backend */
  readonly cargandoCarrito = signal(false);

  /** Total de ítems en el carrito */
  readonly totalItems = computed(() =>
    this.carritoItems().reduce((sum, i) => sum + Number(i.cantidad), 0),
  );

  /** Importe total del carrito */
  readonly totalCarrito = computed(() =>
    this.carritoItems().reduce((sum, i) => sum + Number(i.subTotal), 0),
  );

  /** true cuando el sidebar del carrito está abierto */
  readonly carritoOpen = signal(false);

  private crearCarritoPromise: Promise<void> | null = null;

  /** Actualiza el total de ítems (compatibilidad; totalItems ya es computed de carritoItems) */
  setTotalItems(_cantidad: number): void {
    // Mantenido por compatibilidad; totalItems se deriva automáticamente de carritoItems.
  }

  /** Abre/cierra el carrito */
  abrir(): void {
    this.carritoOpen.set(true);
  }

  cerrar(): void {
    this.carritoOpen.set(false);
  }

  toggle(): void {
    this.carritoOpen.update((v) => !v);
  }

  async crearCarrito(): Promise<void> {
    if (this.carritoId()) return;
    if (this.crearCarritoPromise) return this.crearCarritoPromise;

    this.crearCarritoPromise = new Promise<void>((resolve) => {
      const user = this.auth.currentUser();
      const gestorId = user?.usuarioId || 1;
      const atendio = user?.nombre || 'Tienda Online';
      this.tiendaService.crearCarrito('Cliente Tienda', 'N/A', atendio, gestorId).subscribe({
        next: (carrito) => {
          this.carritoId.set(carrito.poscotmaeId);
          this.crearCarritoPromise = null;
          resolve();
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo crear el carrito',
          });
          this.crearCarritoPromise = null;
          resolve();
        },
      });
    });

    return this.crearCarritoPromise;
  }

  recargarItems(): void {
    const id = this.carritoId();
    if (!id) return;
    this.tiendaService.getCarritoItems(id).subscribe({
      next: (items) => {
        this.carritoItems.set(items);
        this.cargandoCarrito.set(false);
      },
      error: () => this.cargandoCarrito.set(false),
    });
  }

  async agregarAlCarrito(producto: ProductoTienda): Promise<void> {
    // Bajo demanda: se puede vender aunque la existencia sea 0
    if (producto.existencia <= 0 && !esBajoDemanda(producto)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin stock',
        detail: 'Producto sin existencia',
      });
      return;
    }

    if (!this.carritoId()) {
      await this.crearCarrito();
    }

    const carritoId = this.carritoId();
    if (!carritoId) return;

    const existing = this.carritoItems().find((i) => i.productoId === String(producto.produtoId));
    const nuevaCant = existing ? Number(existing.cantidad) + 1 : 1;
    if (nuevaCant > producto.existencia && !esBajoDemanda(producto)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Stock insuficiente',
        detail: `Solo quedan ${producto.existencia} unidades`,
      });
      return;
    }

    this.cargandoCarrito.set(true);
    const payload = {
      poscotmaeId: carritoId,
      productoId: String(producto.produtoId),
      codbarra: producto.codbarra || '',
      cantidad: nuevaCant,
      precio: Number(producto.precioventa),
      subTotal: Number(producto.precioventa) * nuevaCant,
    };

    const guardarItem = () => {
      this.tiendaService.agregarItem(payload).subscribe({
        next: () => {
          this.recargarItems();
          this.messageService.add({
            severity: 'success',
            summary: 'Agregado',
            detail: `${producto.descripcion} agregado al carrito`,
          });
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo agregar al carrito',
          });
          this.cargandoCarrito.set(false);
        },
      });
    };

    if (existing) {
      this.tiendaService.eliminarItem(existing.poscotdetId).subscribe({
        next: () => guardarItem(),
        error: () => this.cargandoCarrito.set(false),
      });
    } else {
      guardarItem();
    }
  }

  limpiarCarrito(): void {
    this.carritoItems.set([]);
    this.carritoId.set(null);
    this.cargandoCarrito.set(false);
  }
}
