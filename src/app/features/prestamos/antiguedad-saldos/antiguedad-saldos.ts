import { Component, inject, signal, OnInit, computed, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { ToolbarModule } from 'primeng/toolbar';
import { CxcService } from '../../../core/services/cxc.service';

export interface AntiguedadItem {
  clienteId: number;
  nrocliente: string;
  cliente: string;
  dni: string;
  rtn?: string;
  total: number;
  corriente: number;
  vencido30: number;
  vencido60: number;
  vencido90: number;
}

@Component({
  selector: 'app-antiguedad-saldos',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule, TagModule, ToolbarModule],
  templateUrl: './antiguedad-saldos.html',
  styleUrl: './antiguedad-saldos.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AntiguedadSaldos implements OnInit {
  private service = inject(CxcService);
  private msgs = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  data = signal<AntiguedadItem[]>([]);
  cargando = signal(false);
  q = signal('');

  filtered = computed(() => {
    const search = this.q().toLowerCase();
    const items = this.data();
    if (!search) return items;
    return items.filter(item =>
      item.cliente.toLowerCase().includes(search) ||
      item.nrocliente.toLowerCase().includes(search) ||
      item.dni.includes(search)
    );
  });

  totalGeneral = computed(() => this.filtered().reduce((sum, item) => sum + item.total, 0));
  totalCorriente = computed(() => this.filtered().reduce((sum, item) => sum + item.corriente, 0));
  totalVencido30 = computed(() => this.filtered().reduce((sum, item) => sum + item.vencido30, 0));
  totalVencido60 = computed(() => this.filtered().reduce((sum, item) => sum + item.vencido60, 0));
  totalVencido90 = computed(() => this.filtered().reduce((sum, item) => sum + item.vencido90, 0));

  ngOnInit() {
    this.load();
  }

  load() {
    this.cargando.set(true);
    this.service.getAntiguedadSaldosPrestamosCuotas().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.data.set(res ?? []);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la antigüedad de saldos' });
      },
    });
  }

  moneda(n: number): string {
    const val = Number(n) || 0;
    const partes = val.toFixed(2).split('.');
    partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return partes.join('.');
  }

  getPorcentaje(valor: number, total: number): string {
    if (total === 0) return '0%';
    return `${((valor / total) * 100).toFixed(1)}%`;
  }

  getSeverity(item: AntiguedadItem): 'success' | 'warning' | 'danger' | 'info' {
    if (item.vencido90 > 0) return 'danger';
    if (item.vencido60 > 0) return 'warning';
    if (item.vencido30 > 0) return 'info';
    return 'success';
  }

  limpiarFiltros() {
    this.q.set('');
  }
}
