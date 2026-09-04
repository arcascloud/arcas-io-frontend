import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-pedidos-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule, TagModule, TooltipModule],
  templateUrl: './pedidos-list.html',
  styleUrl: './pedidos-list.scss',
})
export class PedidosList implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  private msgs = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  pedidos = signal<any[]>([]);
  filtered = signal<any[]>([]);
  cargando = signal(false);
  q = signal('');

  ngOnInit() {
    this.load();
  }

  load() {
    this.cargando.set(true);
    this.api.get<any>('/facturacion/pedidos').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: any) => {
        const items = Array.isArray(res) ? res : (res?.value ?? []);
        this.pedidos.set(items);
        this.filtrar();
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los pedidos' });
      },
    });
  }

  filtrar() {
    const texto = this.q().toLowerCase().trim();
    if (!texto) {
      this.filtered.set(this.pedidos());
      return;
    }
    this.filtered.set(
      this.pedidos().filter((p) => {
        const nro = String(p.pospedmaeId ?? '');
        const cliente = (p.nombrecliente ?? '').toLowerCase();
        const telefono = (p.nrotelefono ?? '').toLowerCase();
        return nro.includes(texto) || cliente.includes(texto) || telefono.includes(texto);
      }),
    );
  }

  buscar() { this.filtrar(); }
  limpiar() { this.q.set(''); this.filtrar(); }

  editar(id: number) {
    this.router.navigate(['/facturacion/pedidos/editar', id]);
  }

  nuevo() {
    this.router.navigate(['/facturacion/pedidos/editar', 'nuevo']);
  }

  fechaCorta(fecha: string | Date): string {
    if (!fecha) return '-';
    const d = new Date(fecha);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(-2);
    return `${dd}/${mm}/${yy}`;
  }

  horaCorta(fecha: string | Date): string {
    if (!fecha) return '-';
    const d = new Date(fecha);
    return d.toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' });
  }

  moneda(n: number | undefined): string {
    return (n ?? 0).toLocaleString('es-HN', { style: 'currency', currency: 'HNL' });
  }

  getEnvioLabel(val: string): string {
    return val === 'S' ? 'Si' : 'No';
  }

  getEnvioSeverity(val: string): string {
    return val === 'S' ? 'success' : 'secondary';
  }

  getFacturadoLabel(val: string): string {
    return val === 'S' ? 'Si' : 'No';
  }

  getFacturadoSeverity(val: string): string {
    return val === 'S' ? 'info' : 'warn';
  }
}
