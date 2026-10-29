import { Injectable, signal } from '@angular/core';

/**
 * Estado global del carrito de compras de la tienda virtual.
 * Permite que el topbar (main-layout-public) muestre/abra el carrito
 * sin acoplarse al componente tienda-virtual.
 */
@Injectable({ providedIn: 'root' })
export class CarritoStateService {
  /** Total de ítems en el carrito */
  readonly totalItems = signal(0);

  /** true cuando el sidebar del carrito está abierto */
  readonly carritoOpen = signal(false);

  /** Actualiza el total de ítems desde tienda-virtual */
  setTotalItems(cantidad: number): void {
    this.totalItems.set(cantidad);
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
}
