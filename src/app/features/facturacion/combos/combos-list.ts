import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DataViewModule } from 'primeng/dataview';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { FacturacionService } from '../../../core/services/facturacion.service';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-combos-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, DataViewModule, ButtonModule, InputTextModule,
    TagModule, TooltipModule, ToastModule,
  ],
  templateUrl: './combos-list.html',
  styleUrl: './combos-list.scss',
})
export class CombosList implements OnInit {
  private service = inject(FacturacionService);
  private api = inject(ApiService);
  private router = inject(Router);
  private msgs = inject(MessageService);

  data = signal<any[]>([]);
  filtered = signal<any[]>([]);
  cargando = signal(false);
  cargandoItems = signal(false);
  q = signal('');

  comboSeleccionado = signal<any | null>(null);
  comboItems = signal<any[]>([]);

  private imgCache = new Map<string, string>();

  ngOnInit() {
    this.load();
  }

  load() {
    this.cargando.set(true);
    this.service.getMae<any>('/facturacion/combos').subscribe({
      next: (res) => {
        this.data.set(res);
        this.filtrar();
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los combos' });
      },
    });
  }

  filtrar() {
    const q = this.q().toLowerCase();
    this.filtered.set(
      this.data().filter((i) => {
        if (!q) return true;
        return JSON.stringify(i).toLowerCase().includes(q);
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
    this.router.navigate(['/facturacion/combos/editar/nuevo']);
  }

  editar(id: number, event: Event) {
    event.stopPropagation();
    this.router.navigate(['/facturacion/combos/editar', id]);
  }

  seleccionarCombo(item: any) {
    if (this.comboSeleccionado()?.poscbomaeId === item.poscbomaeId) {
      this.comboSeleccionado.set(null);
      this.comboItems.set([]);
      return;
    }
    this.comboSeleccionado.set(item);
    this.cargarItems(item.poscbomaeId);
  }

  cargarItems(maeId: number) {
    this.cargandoItems.set(true);
    this.comboItems.set([]);
    this.api.get<any>(`/facturacion/combos-det/mae/${maeId}`).subscribe({
      next: (items) => {
        this.comboItems.set(items ?? []);
        this.cargandoItems.set(false);
      },
      error: () => {
        this.cargandoItems.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los items del combo' });
      },
    });
  }

  titulo(item: any): string {
    return item.descripcion || `Combo #${item.poscbomaeId}`;
  }

  filas(item: any) {
    return [
      { label: 'Vigente desde', value: item.fec_vig_desde ? new Date(item.fec_vig_desde).toLocaleDateString() : '-' },
      { label: 'Vigente hasta', value: item.fec_vig_hasta ? new Date(item.fec_vig_hasta).toLocaleDateString() : '-' },
    ];
  }

  resolverImagen(img: string | null): string {
    if (!img) return '';
    const key = img.substring(0, 100);
    if (this.imgCache.has(key)) return this.imgCache.get(key)!;
    const result = /^data:/i.test(img) ? img : `data:image/png;base64,${img}`;
    this.imgCache.set(key, result);
    return result;
  }

  formatearPrecio(precio: number | string): string {
    return `L ${Number(precio).toFixed(2)}`;
  }
}
