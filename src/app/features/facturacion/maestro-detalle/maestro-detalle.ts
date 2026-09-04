import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { DataViewModule } from 'primeng/dataview';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { FacturacionService } from '../../../core/services/facturacion.service';
import { MAESTRO_DETALLE, MaestroDetalleConfig } from '../../../core/models/facturacion.models';

@Component({
  selector: 'app-maestro-detalle',
  standalone: true,
  imports: [CommonModule, FormsModule, DataViewModule, ButtonModule, InputTextModule],
  templateUrl: './maestro-detalle.html',
  styleUrl: './maestro-detalle.scss',
})
export class MaestroDetalle implements OnInit {
  private service = inject(FacturacionService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private msgs = inject(MessageService);

  config!: MaestroDetalleConfig;

  data = signal<any[]>([]);
  filtered = signal<any[]>([]);
  cargando = signal(false);
  layout: 'list' | 'grid' = 'list';

  q = signal('');

  ngOnInit() {
    const nombre = this.route.snapshot.data['nombre'] ?? '';
    this.config = MAESTRO_DETALLE[nombre];
    if (!this.config) {
      this.msgs.add({ severity: 'error', summary: 'Error', detail: `Módulo desconocido: ${nombre}` });
      return;
    }
    this.load();
  }

  load() {
    this.cargando.set(true);
    this.service.getMae<any>(this.config.rutaMae).subscribe({
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
    if (this.config.soloLectura) return;
    this.router.navigate(['editar', 'nuevo'], { relativeTo: this.route });
  }

  editar(id: number) {
    if (this.config.soloLectura) return;
    this.router.navigate(['editar', id], { relativeTo: this.route });
  }

  moneda(n: number | undefined): string {
    return (n ?? 0).toLocaleString('es-HN', { style: 'currency', currency: 'HNL' });
  }
}