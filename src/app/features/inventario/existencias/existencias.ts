import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { ExistenciasService } from '../../../core/services/existencias.service';
import { BodegasService } from '../../../core/services/bodegas.service';
import { ApiService } from '../../../core/services/api.service';
import { forkJoin } from 'rxjs';

export interface ProductoExistencia {
  productoId: number;
  codbarra: string;
  descripcion: string;
  precioventa: number;
  imagen: string | null;
  disponibilidad: 'Alta' | 'Baja';
  bodegas: { bodegaId: number; descripcion: string; existencia: number }[];
}

@Component({
  selector: 'app-existencias',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule, TagModule],
  templateUrl: './existencias.html',
  styleUrl: './existencias.scss',
})
export class Existencias implements OnInit {
  private service = inject(ExistenciasService);
  private bodegasService = inject(BodegasService);
  private api = inject(ApiService);
  private msgs = inject(MessageService);

  data = signal<ProductoExistencia[]>([]);
  filtered = signal<ProductoExistencia[]>([]);
  cargando = signal(false);
  q = signal('');
  expandedRows = signal<Record<number, boolean>>({});

  // Zoom imagen
  zoomVisible = signal(false);
  zoomUrl = signal('');
  zoomX = signal(0);
  zoomY = signal(0);

  ngOnInit() {
    this.load();
  }

  load() {
    this.cargando.set(true);
    forkJoin([
      this.service.getAll(),
      this.api.get<any[]>('/inventario/tienda/productos'),
      this.bodegasService.getAll(),
    ]).subscribe({
      next: ([existencias, productos, bodegas]) => {
        const mapa = new Map<number, ProductoExistencia>();

        for (const e of existencias) {
          if (!mapa.has(e.productoId)) {
            const prod = productos.find((p: any) => p.produtoId === e.productoId);
            mapa.set(e.productoId, {
              productoId: e.productoId,
              codbarra: prod?.codbarra || '',
              descripcion: prod?.descripcion || '',
              precioventa: Number(prod?.precioventa) || 0,
              imagen: prod?.imagen || null,
              disponibilidad: 'Baja',
              bodegas: [],
            });
          }

          const bodega = bodegas.find((b: any) => b.bodegaId === e.bodegaId);
          const entry = mapa.get(e.productoId)!;
          entry.bodegas.push({
            bodegaId: e.bodegaId,
            descripcion: bodega?.descripcion || `Bodega ${e.bodegaId}`,
            existencia: Number(e.existencia) || 0,
          });
        }

        const totalExistencia = (p: ProductoExistencia) =>
          p.bodegas.reduce((sum, b) => sum + b.existencia, 0);

        for (const entry of mapa.values()) {
          entry.disponibilidad = totalExistencia(entry) >= 50 ? 'Alta' : 'Baja';
        }

        const resultado = Array.from(mapa.values());
        this.data.set(resultado);
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
        return (
          e.codbarra?.toLowerCase().includes(q) ||
          e.descripcion?.toLowerCase().includes(q) ||
          e.bodegas.some((b) => b.descripcion?.toLowerCase().includes(q))
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

  toggleRow(rowData: ProductoExistencia) {
    const key = rowData.productoId;
    const current = { ...this.expandedRows() };
    if (current[key]) {
      delete current[key];
    } else {
      current[key] = true;
    }
    this.expandedRows.set(current);
  }

  totalExistencia(p: ProductoExistencia): number {
    return p.bodegas.reduce((sum, b) => sum + b.existencia, 0);
  }

  resolverImagen(imagen: string | null): string {
    if (!imagen) return '';
    return /^data:/i.test(imagen) ? imagen : `data:image/png;base64,${imagen}`;
  }

  getItemImagen(item: ProductoExistencia): string {
    if (item.imagen) return this.resolverImagen(item.imagen);
    return '';
  }

  onImgHover(url: string, event: MouseEvent) {
    this.zoomUrl.set(url);
    this.zoomX.set(event.clientX + 12);
    this.zoomY.set(event.clientY - 100);
    this.zoomVisible.set(true);
  }

  onImgMove(event: MouseEvent) {
    this.zoomX.set(event.clientX + 12);
    this.zoomY.set(event.clientY - 100);
  }

  onImgLeave() {
    this.zoomVisible.set(false);
  }

  moneda(n: number | undefined): string {
    return (n ?? 0).toLocaleString('es-HN', {
      style: 'currency',
      currency: 'HNL',
    });
  }
}
