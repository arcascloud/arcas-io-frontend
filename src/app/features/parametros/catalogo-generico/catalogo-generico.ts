import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { CatalogoParametrosService } from '../../../core/services/catalogo-parametros.service';
import { CATALOGOS_PARAMETROS, CatalogoConfig, CampoCatalogo } from '../../../core/models/catalogo-parametros.models';

@Component({
  selector: 'app-catalogo-generico',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule, TagModule],
  templateUrl: './catalogo-generico.html',
  styleUrl: './catalogo-generico.scss',
})
export class CatalogoGenerico implements OnInit, OnDestroy {
  private service = inject(CatalogoParametrosService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private msgs = inject(MessageService);

  config = signal<CatalogoConfig | null>(null);
  campos = signal<CampoCatalogo[]>([]);

  data = signal<any[]>([]);
  filtered = signal<any[]>([]);
  cargando = signal(false);

  q = signal('');

  private routeSub?: Subscription;
  private navSub?: Subscription;

  ngOnInit() {
    this.cargarConfig();

    // Escuchar navegaciones para recargar cuando se cambia de catalogo
    this.navSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.cargarConfig();
    });
  }

  ngOnDestroy() {
    this.routeSub?.unsubscribe();
    this.navSub?.unsubscribe();
  }

  private cargarConfig() {
    // Obtener el nombre del catalogo de la ruta actual
    let rutaActual = this.router.url;
    let nombre = '';

    // Extraer el nombre del catalogo de la URL
    // Ej: /inventario/categorias -> categorias
    // Ej: /contabilidad/ctacontables -> ctacontables
    const partes = rutaActual.split('/').filter(p => p);
    if (partes.length > 0) {
      nombre = partes[partes.length - 1];
    }

    const nuevoConfig = CATALOGOS_PARAMETROS[nombre];
    if (!nuevoConfig) {
      this.msgs.add({ severity: 'error', summary: 'Error', detail: `Catalogo desconocido: ${nombre}` });
      return;
    }

    // Solo recargar si cambio de catalogo
    if (this.config() && this.config()!.ruta === nuevoConfig.ruta) {
      return;
    }

    this.config.set(nuevoConfig);
    this.campos.set(nuevoConfig.campos);
    this.q.set('');
    this.load();
  }

  load() {
    this.cargando.set(true);
    this.service.getAll<any>(this.config()!.ruta).subscribe({
      next: (res) => {
        this.data.set(res);
        this.filtrar();
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: `No se pudieron cargar ${this.config()!.titulo}` });
      },
    });
  }

  filtrar() {
    const q = this.q().toLowerCase();
    this.filtered.set(
      this.data().filter((item) => {
        if (!q) return true;
        return this.config()!.campos.some(
          (c) => String(item?.[c.key] ?? '').toLowerCase().includes(q),
        );
      }),
    );
  }

  buscar() {
    this.filtrar();
  }

  limpiarFiltros() {
    this.q.set('');
    this.filtrar();
  }

  nuevo() {
    this.router.navigate(['editar', 'nuevo'], { relativeTo: this.route });
  }

  editar(id: any) {
    if (id == null) return;
    this.router.navigate(['editar', id], { relativeTo: this.route });
  }

  activoLbl(sn: string): string {
    return sn === 'S' ? 'Activo' : 'Inactivo';
  }

  activoSev(sn: string): 'success' | 'danger' {
    return sn === 'S' ? 'success' : 'danger';
  }
}
