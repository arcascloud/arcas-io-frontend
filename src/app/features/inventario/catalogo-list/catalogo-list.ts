import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { CatalogoParametrosService } from '../../../core/services/catalogo-parametros.service';

export interface CampoColumna {
  key: string;
  label: string;
}

export interface CatalogoConfig {
  titulo: string;
  subtitulo: string;
  ruta: string;
  idKey: string;
  icono: string;
  tituloNuevo: string;
  campos: CampoColumna[];
  sinEstado?: boolean;
}

@Component({
  selector: 'app-catalogo-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule, TagModule, TooltipModule],
  templateUrl: './catalogo-list.html',
  styleUrl: './catalogo-list.scss',
})
export class CatalogoList implements OnInit {
  private catalogoService = inject(CatalogoParametrosService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private msgs = inject(MessageService);

  config = signal<CatalogoConfig>({
    titulo: '',
    subtitulo: '',
    ruta: '',
    idKey: '',
    icono: '',
    tituloNuevo: '',
    campos: [],
  });

  data = signal<any[]>([]);
  filtered = signal<any[]>([]);
  cargando = signal(false);
  busqueda = signal('');

  ngOnInit() {
    this.route.paramMap.subscribe(() => {
      const data = this.route.snapshot.data?.['catalogo'] as CatalogoConfig;
      if (data) {
        this.config.set(data);
      }
      this.busqueda.set('');
      this.load();
    });
  }

  load() {
    this.cargando.set(true);
    this.catalogoService.getAll<any>(this.config().ruta).subscribe({
      next: (res) => {
        this.data.set(res);
        this.filtrar();
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.msgs.add({
          severity: 'error',
          summary: 'Error',
          detail: `No se pudieron cargar ${this.config().titulo}`,
        });
      },
    });
  }

  filtrar() {
    const q = this.busqueda().toLowerCase();
    this.filtered.set(
      this.data().filter((item) => {
        if (!q) return true;
        return this.config().campos.some(
          (c) => String(item?.[c.key] ?? '').toLowerCase().includes(q),
        );
      }),
    );
  }

  buscar() {
    this.filtrar();
  }

  limpiarFiltros() {
    this.busqueda.set('');
    this.filtrar();
  }

  nuevo() {
    this.router.navigate(['nuevo'], { relativeTo: this.route });
  }

  editar(id: number) {
    this.router.navigate(['editar', id], { relativeTo: this.route });
  }

  activoLbl(sn: string): string {
    return sn === 'S' ? 'Activo' : 'Inactivo';
  }

  activoSev(sn: string): 'success' | 'danger' {
    return sn === 'S' ? 'success' : 'danger';
  }
}
