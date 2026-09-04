import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
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
export class CatalogoGenerico implements OnInit {
  private service = inject(CatalogoParametrosService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private msgs = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  config!: CatalogoConfig;
  campos = signal<CampoCatalogo[]>([]);

  data = signal<any[]>([]);
  filtered = signal<any[]>([]);
  cargando = signal(false);

  q = signal('');

  ngOnInit() {
    this.route.data.subscribe((data) => {
      const nombreParam = this.route.snapshot.paramMap.get('nombre') ?? '';
      const nombre = data['nombre'] ?? nombreParam;
      this.config = CATALOGOS_PARAMETROS[nombre];
      if (!this.config) {
        this.msgs.add({ severity: 'error', summary: 'Error', detail: `Catálogo desconocido: ${nombre}` });
        return;
      }
      this.campos.set(this.config.campos);
      this.q.set('');
      this.load();
    });
  }

  load() {
    this.cargando.set(true);
    this.service.getAll<any>(this.config.ruta).subscribe({
      next: (res) => {
        this.data.set(res);
        this.filtrar();
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: `No se pudieron cargar ${this.config.titulo}` });
      },
    });
  }

  filtrar() {
    const q = this.q().toLowerCase();
    this.filtered.set(
      this.data().filter((item) => {
        if (!q) return true;
        return this.config.campos.some(
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
