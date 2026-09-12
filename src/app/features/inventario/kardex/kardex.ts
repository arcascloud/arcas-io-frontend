import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { KardexService } from '../../../core/services/kardex.service';
import { Kardex as KardexMov } from '../../../core/models/inventario.models';

@Component({
  selector: 'app-kardex',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule, TagModule],
  templateUrl: './kardex.html',
  styleUrl: './kardex.scss',
})
export class Kardex implements OnInit {
  private service = inject(KardexService);
  private msgs = inject(MessageService);

  data = signal<KardexMov[]>([]);
  filtered = signal<KardexMov[]>([]);
  cargando = signal(false);

  q = signal('');

  ngOnInit() {
    this.load();
  }

  load() {
    this.cargando.set(true);
    this.service.getAll().subscribe({
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
          detail: 'No se pudieron cargar los movimientos de kardex',
        });
      },
    });
  }

  filtrar() {
    const q = this.q().toLowerCase();
    this.filtered.set(
      this.data().filter((k) => {
        if (!q) return true;
        return (
          k.codbarra?.toLowerCase().includes(q) ||
          k.nroreferencia?.toLowerCase().includes(q) ||
          String(k.productoId).includes(q)
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

  moneda(n: number | undefined): string {
    return (n ?? 0).toLocaleString('es-HN', {
      style: 'currency',
      currency: 'HNL',
    });
  }
}