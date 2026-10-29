import { Injectable, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { TreeNode } from 'primeng/api';
import { DepartamentosService } from './departamentos.service';
import { CategoriasService } from './categorias.service';

export interface CategoriaTreeNode extends TreeNode {
  key?: string;
  label?: string;
  data?: any;
  icon?: string;
  children?: CategoriaTreeNode[];
  selectable?: boolean; // false para padres oculta el checkbox automáticamente en p-tree
}

/**
 * Servicio para construir el árbol de categorías agrupadas por departamento
 * basado en la relación entre `tinvcategoria` y `tinvdeptos`, diseñado como signal
 * para integración en layouts y componentes (ej. main-layout.ts).
 */
@Injectable({
  providedIn: 'root',
})
export class CategoriaTreeMenuService {
  private deptosService = inject(DepartamentosService);
  private categoriasService = inject(CategoriasService);

  /** Signal principal que contiene los nodos del árbol estructurados */
  readonly treeNodes = signal<CategoriaTreeNode[]>([]);
  
  /** Signal de estado de carga */
  readonly loading = signal<boolean>(false);

  /** Signal para los elementos seleccionados en el árbol */
  readonly selectedNodes = signal<TreeNode | TreeNode[] | null>(null);

  constructor() {
    this.cargarArbolCategorias();
  }

  /**
   * Carga los departamentos y categorías filtrando por empresa y usuario,
   * emulando la consulta SQL y asignando `selectable: false` a los nodos padres
   * para ocultar sus checkboxes según la documentación de PrimeNG.
   */
  cargarArbolCategorias() {
    this.loading.set(true);

    forkJoin({
      deptos: this.deptosService.getAll(),
      categorias: this.categoriasService.getAll(),
    }).subscribe({
      next: ({ deptos, categorias }) => {
        const nodos: CategoriaTreeNode[] = deptos
          .map((depto) => {
            const deptoId = depto.deptoId;
            const deptoCategorias = categorias.filter((cat) => cat.deptoId === deptoId);

            // Aplicando la lógica INNER JOIN (solo departamentos que tienen categorías)
            if (deptoCategorias.length === 0) return null;

            const children: CategoriaTreeNode[] = deptoCategorias.map((cat) => ({
              key: `${deptoId}-${cat.categoriaId}`, // keyItem equivalente a CONCAT(deptoId, '-', categoriaId)
              label: cat.descripcion,
              data: {
                categoriaId: cat.categoriaId,
                deptoId: deptoId,
                departamento: depto.descripcion,
                categoria: cat.descripcion,
              },
              icon: 'pi pi-tag',
              selectable: true, // Hijo con checkbox habilitado
            }));

            const padre: CategoriaTreeNode = {
              key: String(deptoId),
              label: depto.descripcion,
              icon: 'pi pi-folder',
              expanded: true,
              selectable: false, // 🚨 CLAVE: Esto oculta el checkbox en el nodo padre (departamento)
              children: children,
            };

            return padre;
          })
          .filter((n): n is CategoriaTreeNode => n !== null);

        this.treeNodes.set(nodos);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar el árbol de categorías por departamento:', err);
        this.loading.set(false);
      },
    });
  }
}
