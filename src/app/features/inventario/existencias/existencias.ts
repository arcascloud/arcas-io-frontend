import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataViewModule } from 'primeng/dataview';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { ExistenciasService } from '../../../core/services/existencias.service';
import { BodegasService } from '../../../core/services/bodegas.service';
import { ApiService } from '../../../core/services/api.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-existencias',
  standalone: true,
  imports: [CommonModule, FormsModule, DataViewModule, ButtonModule, InputTextModule, TagModule],
  templateUrl: './existencias.html',
  styleUrl: './existencias.scss',
})
export class Existencias implements OnInit {
  private service = inject(ExistenciasService);
  private bodegasService = inject(BodegasService);
  private api = inject(ApiService);
  private msgs = inject(MessageService);

  private imagenCache = new Map<string, string>();

  data = signal<any[]>([]);
  filtered = signal<any[]>([]);
  cargando = signal(false);

  q = signal('');

  ngOnInit() {
    this.load();
  }

  load() {
    this.cargando.set(true);
    forkJoin([
      this.service.getAll(),
      this.api.get<any[]>('/inventario/tienda/productos'),
      this.bodegasService.getAll()
    ]).subscribe({
      next: ([existencias, productos, bodegas]) => {
        this.data.set(existencias.map(e => ({
          ...e,
          producto: productos.find(p => p.produtoId === e.productoId),
          bodega: bodegas.find(b => b.bodegaId === e.bodegaId)
        })));
        this.filtrar();
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.msgs.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los datos',
        });
      },
    });
  }

  filtrar() {
    const q = this.q().toLowerCase();
    this.filtered.set(
      this.data().filter((e) => {
        if (!q) return true;
        return (e.producto?.codbarra?.toLowerCase().includes(q) ||
                e.producto?.descripcion?.toLowerCase().includes(q) ||
                e.bodega?.descripcion?.toLowerCase().includes(q));
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

  resolverImagen(imagen: string | null): string {
    if (!imagen) return '';
    const cacheKey = imagen.substring(0, 100);
    if (this.imagenCache.has(cacheKey)) return this.imagenCache.get(cacheKey)!;
    const result = /^data:/i.test(imagen) ? imagen : `data:image/png;base64,${imagen}`;
    this.imagenCache.set(cacheKey, result);
    return result;
  }

  getItemImagen(item: any): string {
    if (item.producto?.imagen) return this.resolverImagen(item.producto.imagen);
    return '';
  }

  moneda(n: number | undefined): string {
    return (n ?? 0).toLocaleString('es-HN', {
      style: 'currency',
      currency: 'HNL',
    });
  }
}