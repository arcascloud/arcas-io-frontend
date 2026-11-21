import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageService } from 'primeng/api';
import { KardexService } from '../../../core/services/kardex.service';
import { Kardex as KardexMov } from '../../../core/models/inventario.models';

@Component({
  selector: 'app-kardex',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule, TagModule, DatePickerModule],
  templateUrl: './kardex.html',
  styleUrl: './kardex.scss',
})
export class Kardex implements OnInit {
  private service = inject(KardexService);
  private msgs = inject(MessageService);

  data = signal<KardexMov[]>([]);
  filtered = signal<KardexMov[]>([]);
  cargando = signal(false);

  // ── Filtros de búsqueda ──
  fechaDesde = signal<string | null>(null);
  fechaHasta = signal<string | null>(null);
  busqueda = signal('');

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
    const desde = this.fechaDesde();
    const hasta = this.fechaHasta();
    const q = this.busqueda().trim().toLowerCase();

    this.filtered.set(
      this.data().filter((k) => {
        if (desde || hasta) {
          const fecha = this.fechaDia(k.fecharegistro);
          if (desde && (!fecha || fecha < desde)) return false;
          if (hasta && (!fecha || fecha > hasta)) return false;
        }
        if (q) {
          const campos = [k.codbarra, k.nroreferencia, k.productoId].join(' ').toLowerCase();
          if (!campos.includes(q)) return false;
        }
        return true;
      }),
    );
  }

  buscar() {
    this.filtrar();
  }

  limpiarFiltros() {
    this.fechaDesde.set(null);
    this.fechaHasta.set(null);
    this.busqueda.set('');
    this.filtrar();
  }

  private fechaDia(valor: string | Date | null | undefined): string | null {
    if (!valor) return null;
    const s = typeof valor === 'string' ? valor : new Date(valor).toISOString();
    const m = s.match(/(\d{4})-(\d{2})-(\d{2})/);
    return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
  }

  moneda(n: number | undefined): string {
    return (n ?? 0).toLocaleString('es-HN', {
      style: 'currency',
      currency: 'HNL',
    });
  }
}