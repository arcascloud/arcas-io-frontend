import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { DepartamentosService } from '../../core/services/departamentos.service';
import { CategoriasService } from '../../core/services/categorias.service';
import { TiendaFiltroService } from '../../core/services/tienda-filtro.service';
import { Departamento, Categoria } from '../../core/models/inventario.models';

/**
 * Componente de navegación lateral estilo Drill-Down (como Indufesa / e-commerce):
 * Muestra primero los departamentos. Al hacer clic en uno, se despliegan sus categorías
 * apiladas bajo el encabezado del departamento con un botón de retorno ("back-history").
 */
@Component({
  selector: 'app-sidebar-drilldown',
  standalone: true,
  imports: [CommonModule, ButtonModule, TooltipModule],
  templateUrl: './sidebar-drilldown.html',
  styleUrl: './sidebar-drilldown.scss',
})
export class SidebarDrilldownComponent implements OnInit {
  private deptosService = inject(DepartamentosService);
  private categoriasService = inject(CategoriasService);
  private router = inject(Router);
  private filtroService = inject(TiendaFiltroService);

  deptos = signal<Departamento[]>([]);
  categorias = signal<Categoria[]>([]);
  deptoActivo = signal<Departamento | null>(null);
  loading = signal<boolean>(false);

  /** Categorías filtradas pertenecientes al departamento activo */
  categoriasFiltradas = computed(() => {
    const depto = this.deptoActivo();
    if (!depto) return [];
    return this.categorias().filter((c) => c.deptoId === depto.deptoId);
  });

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
  }

  seleccionarDepto(depto: Departamento) {
    this.deptoActivo.set(depto);
    this.filtroService.setFiltroDepto(depto.deptoId, depto.descripcion);
    this.router.navigate(['/facturacion/tienda']);
  }

  filtrarDeptoCompleto() {
    const depto = this.deptoActivo();
    if (depto) {
      this.filtroService.setFiltroDepto(depto.deptoId, depto.descripcion);
      this.router.navigate(['/facturacion/tienda']);
    }
  }

  volver() {
    this.deptoActivo.set(null);
    this.filtroService.limpiarFiltros();
    this.router.navigate(['/facturacion/tienda']);
  }

  seleccionarCategoria(cat: Categoria) {
    const depto = this.deptoActivo();
    this.filtroService.setFiltros([cat.categoriaId], cat.deptoId, [cat.descripcion], depto?.descripcion);
    this.router.navigate(['/facturacion/tienda']);
  }
}
