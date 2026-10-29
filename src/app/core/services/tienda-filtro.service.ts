import { Injectable, signal } from '@angular/core';

/**
 * Servicio compartido para gestionar los filtros activos de categorías y departamento
 * en la tienda virtual, permitiendo la comunicación reactiva entre el sidebar drill-down
 * y la vista de productos sin necesidad de exponer parámetros GET en la URL.
 */
@Injectable({
  providedIn: 'root',
})
export class TiendaFiltroService {
  /** IDs de categorías seleccionadas actualmente para filtrar */
  readonly categoriaIds = signal<number[]>([]);

  /** ID de departamento seleccionado actualmente para filtrar */
  readonly deptoId = signal<number | null>(null);

  /** Nombres de las categorías seleccionadas */
  readonly categoriaNombres = signal<string[]>([]);

  /** Nombre del departamento seleccionado */
  readonly deptoNombre = signal<string | null>(null);

  /** Establece el filtro exclusivo por departamento (Caso 1: todo el depto) */
  setFiltroDepto(depId: number | null, depNombre: string | null) {
    this.deptoId.set(depId);
    this.deptoNombre.set(depNombre ?? null);
    this.categoriaIds.set([]);
    this.categoriaNombres.set([]);
  }

  /** Establece los filtros activos con departamento y categorías específicas (Caso 2) */
  setFiltros(catIds: number[], depId: number | null, catNombres?: string[], depNombre?: string | null) {
    this.categoriaIds.set(catIds ?? []);
    this.deptoId.set(depId);
    this.categoriaNombres.set(catNombres ?? []);
    this.deptoNombre.set(depNombre ?? null);
  }

  /** Limpia los filtros activos y muestra todos los productos (Caso 3.1) */
  limpiarFiltros() {
    this.categoriaIds.set([]);
    this.deptoId.set(null);
    this.categoriaNombres.set([]);
    this.deptoNombre.set(null);
  }
}
