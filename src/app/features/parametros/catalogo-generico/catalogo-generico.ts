import { Component, inject, signal, OnInit, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter, Subscription, switchMap, of, tap, catchError } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { CatalogoParametrosService } from '../../../core/services/catalogo-parametros.service';
import { ContabilidadService } from '../../../core/services/contabilidad.service';
import { CATALOGOS_PARAMETROS, CatalogoConfig, CampoCatalogo } from '../../../core/models/catalogo-parametros.models';

@Component({
  selector: 'app-catalogo-generico',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule, SelectModule, TagModule],
  templateUrl: './catalogo-generico.html',
  styleUrl: './catalogo-generico.scss',
})
export class CatalogoGenerico implements OnInit, OnDestroy {
  private service = inject(CatalogoParametrosService);
  private contabilidad = inject(ContabilidadService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private msgs = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  config = signal<CatalogoConfig | null>(null);
  campos = signal<CampoCatalogo[]>([]);

  data = signal<any[]>([]);
  filtered = signal<any[]>([]);
  cargando = signal(false);

  q = signal('');
  /** Valores de los filtros de selección: { anio: 2026, periodo: 9, descripcion: 'x' } */
  filtrosValores = signal<Record<string, any>>({});

  private routeSub?: Subscription;
  private navSub?: Subscription;

  /** Opciones para un filtro select: estáticas de la config o únicas de los datos */
  opcionesFiltro(key: string): { label: string; value: any }[] {
    const f = this.config()?.filtros?.find(x => x.key === key);
    if (f?.opciones?.length) return f.opciones;

    const vals = [...new Set(
      this.data()
        .map(d => d?.[key])
        .filter(v => v != null && v !== ''),
    )];
    // Descendente para años, ascendente para períodos/números
    vals.sort((a: any, b: any) => (key === 'anio' ? b - a : a - b));
    return vals.map(v => ({ label: String(v), value: v }));
  }

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
    this.filtrosValores.set({});

    // Si el catálogo lo pide, precargar año/período con el período contable abierto
    if (nuevoConfig.preCargarPeriodoAbierto) {
      this.precargarPeriodoAbierto();
    }

    this.load();
  }

  /** Carga coperiodoctable y deja anio/periodo preseleccionados con el período abierto (sn_abierto='S') */
  private precargarPeriodoAbierto(): void {
    this.contabilidad.getPeriodos()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (periodos) => {
          const abierto = periodos.find(p => p.sn_abierto === 'S');
          if (abierto) {
            this.filtrosValores.update(v => ({
              ...v,
              anio: abierto.nroanio,
              periodo: abierto.nromes,
            }));
            this.filtrar();
          }
        },
        error: () => {
          // Silencioso: si falla, simplemente no se preselecciona
        },
      });
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

  setFiltro(key: string, value: any) {
    this.filtrosValores.update(v => ({ ...v, [key]: value }));
    this.filtrar();
  }

  filtrar() {
    const q = this.q().toLowerCase();
    const filtros = this.filtrosValores();

    this.filtered.set(
      this.data().filter((item) => {
        // Filtros de selección (anio, periodo, descripcion, ...)
        for (const f of this.config()?.filtros || []) {
          const val = filtros[f.key];
          if (val == null || val === '') continue;

          const itemVal = item?.[f.key];
          if (f.tipo === 'texto') {
            if (!String(itemVal ?? '').toLowerCase().includes(String(val).toLowerCase())) return false;
          } else {
            if (String(itemVal) !== String(val)) return false;
          }
        }

        // Búsqueda libre
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
    this.filtrosValores.set({});
    // Si el catálogo precarga período abierto, limpiar también lo re-precarga
    if (this.config()?.preCargarPeriodoAbierto) {
      this.precargarPeriodoAbierto();
    } else {
      this.filtrar();
    }
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

  formatValor(item: any, col: any): string {
    const val = item[col.key];
    if (val == null || val === '') return '-';
    if (col.tipo === 'fecha' && col.formato) {
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
      }
      return '-';
    }
    if (col.tipo === 'numero') {
      // REGLA CONTABLE: siempre en positivo (la dirección D/C la da la naturaleza, no el signo)
      const n = Math.abs(Number(val));
      if (isNaN(n)) return String(val);
      // formato 'moneda' → 2 decimales; formato 'entero' o sin formato → sin decimales si es entero
      const decimales = col.formato === 'moneda' ? 2 : (Number.isInteger(n) ? 0 : 2);
      return new Intl.NumberFormat('es-HN', {
        minimumFractionDigits: decimales,
        maximumFractionDigits: decimales,
      }).format(n);
    }
    return val;
  }
}
