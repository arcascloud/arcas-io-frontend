import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { CheckboxModule } from 'primeng/checkbox';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DepartamentosService } from '../../core/services/departamentos.service';
import { CategoriasService } from '../../core/services/categorias.service';
import { MarcasService } from '../../core/services/marcas.service';
import { TiendaService } from '../../features/facturacion/tienda/tienda.service';
import { TiendaFiltroService } from '../../core/services/tienda-filtro.service';
import { Departamento, Categoria, Marca } from '../../core/models/inventario.models';

/**
 * Componente de navegación lateral estilo Drill-Down (como Indufesa / e-commerce):
 * 1) Departamentos → 2) Categorías del departamento → 3) Filtro de marcas (checkbox)
 * después de seleccionar cualquier categoría.
 */
@Component({
  selector: 'app-sidebar-drilldown',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, TooltipModule, CheckboxModule],
  templateUrl: './sidebar-drilldown.html',
  styleUrl: './sidebar-drilldown.scss',
})
export class SidebarDrilldownComponent implements OnInit {
  private deptosService = inject(DepartamentosService);
  private categoriasService = inject(CategoriasService);
  private marcasService = inject(MarcasService);
  private tiendaService = inject(TiendaService);
  private router = inject(Router);
  private filtroService = inject(TiendaFiltroService);
  private destroyRef = inject(DestroyRef);

  deptos = signal<Departamento[]>([]);
  categorias = signal<Categoria[]>([]);
  marcasCatalogo = signal<Marca[]>([]);
  /** Productos de la tienda (caché) — se usan para derivar marcas disponibles por categoría */
  private productosTienda = signal<{ categoriaId: number; marcaId?: number }[]>([]);
  deptoActivo = signal<Departamento | null>(null);
  /** Categoría seleccionada — activa la vista 3 (filtro de marcas) */
  categoriaActiva = signal<Categoria | null>(null);
  loading = signal<boolean>(false);

  /** Categorías filtradas pertenecientes al departamento activo */
  categoriasFiltradas = computed(() => {
    const depto = this.deptoActivo();
    if (!depto) return [];
    return this.categorias().filter((c) => c.deptoId === depto.deptoId);
  });

  /**
   * Marcas disponibles para la categoría activa: marcas activas del catálogo
   * que tengan al menos un producto en esa categoría.
   */
  marcasDisponibles = computed(() => {
    const cat = this.categoriaActiva();
    if (!cat) return [];
    const marcaIdsEnCat = new Set(
      this.productosTienda()
        .filter((p) => Number(p.categoriaId) === Number(cat.categoriaId) && p.marcaId != null && Number(p.marcaId) > 0)
        .map((p) => Number(p.marcaId)),
    );
    if (marcaIdsEnCat.size === 0) return [];
    return this.marcasCatalogo()
      .filter((m) => m.sn_activo === 'S' && marcaIdsEnCat.has(Number(m.marcaId)))
      .sort((a, b) => a.descripcion.localeCompare(b.descripcion));
  });

  /** IDs de marcas marcadas (two-way con p-checkbox dinámico) */
  marcasSeleccionadas = signal<number[]>([]);

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.loading.set(true);
    this.deptosService.getAll().subscribe({
      next: (d) => this.deptos.set(d),
      error: (e) => console.error('Error cargando departamentos:', e),
    });

    this.categoriasService.getAll().subscribe({
      next: (c) => {
        this.categorias.set(c);
        this.loading.set(false);
      },
      error: (e) => {
        console.error('Error cargando categorías:', e);
        this.loading.set(false);
      },
    });

    this.marcasService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (m) => this.marcasCatalogo.set(m),
      error: (e) => console.error('Error cargando marcas:', e),
    });

    // Caché de TiendaService (TTL 1 min) — misma fuente que la vista de productos
    this.tiendaService.getProductos(false, 'tienda').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (prods) => this.productosTienda.set(prods),
      error: (e) => console.error('Error cargando productos para marcas:', e),
    });
  }

  seleccionarDepto(depto: Departamento) {
    this.deptoActivo.set(depto);
    this.categoriaActiva.set(null);
    this.marcasSeleccionadas.set([]);
    this.filtroService.setFiltroDepto(depto.deptoId, depto.descripcion);
    this.router.navigate(['/facturacion/tienda']);
  }

  filtrarDeptoCompleto() {
    const depto = this.deptoActivo();
    if (depto) {
      this.categoriaActiva.set(null);
      this.marcasSeleccionadas.set([]);
      this.filtroService.setFiltroDepto(depto.deptoId, depto.descripcion);
      this.router.navigate(['/facturacion/tienda']);
    }
  }

  /** Volver: marcas → categorías (limpia filtro de marcas) */
  volverACategorias() {
    this.categoriaActiva.set(null);
    this.marcasSeleccionadas.set([]);
    this.filtroService.setFiltroMarcas([]);
  }

  volver() {
    // Si estamos en la vista de marcas, primero retrocede a categorías
    if (this.categoriaActiva()) {
      this.volverACategorias();
      return;
    }
    this.deptoActivo.set(null);
    this.categoriaActiva.set(null);
    this.marcasSeleccionadas.set([]);
    this.filtroService.limpiarFiltros();
    this.router.navigate(['/facturacion/tienda']);
  }

  seleccionarCategoria(cat: Categoria) {
    const depto = this.deptoActivo();
    this.categoriaActiva.set(cat);
    this.marcasSeleccionadas.set([]);
    this.filtroService.setFiltros([cat.categoriaId], cat.deptoId, [cat.descripcion], depto?.descripcion);
    this.router.navigate(['/facturacion/tienda']);
  }

  /** Cambio en cualquier checkbox de marca → actualiza el filtro reactivamente */
  onMarcasChange(ids: number[] | null | undefined) {
    const seleccion = Array.isArray(ids) ? ids.map(Number) : [];
    this.marcasSeleccionadas.set(seleccion);
    this.filtroService.setFiltroMarcas(seleccion);
  }

  trackByMarca = (_: number, m: Marca) => m.marcaId;
}
