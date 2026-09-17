import { Component, inject, signal, OnInit, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../../core/services/api.service';
import { BcoMovimiento } from '../../../core/models/bancos.models';
import { BcoCta } from '../../../core/models/bancos.models';

@Component({
  selector: 'app-historial-bancos',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule,
    SelectModule, TagModule, TooltipModule, ToastModule,
  ],
  templateUrl: './historial.html',
  styleUrl: './historial.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistorialBancos implements OnInit {
  private api = inject(ApiService);
  private msgs = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  // Datos
  bancos = signal<any[]>([]);
  cuentas = signal<BcoCta[]>([]);
  movimientos = signal<BcoMovimiento[]>([]);
  cuentaFiltro = signal<number | null>(null);
  cargando = signal(false);

  readonly TIPO_MOV_OPTIONS = [
    { label: 'Depósito', value: 'DEPOSITO' },
    { label: 'Retiro', value: 'RETIRO' },
    { label: 'Transferencia', value: 'TRANSFERENCIA' },
    { label: 'Pago', value: 'PAGO' },
  ];

  ngOnInit() {
    this.cargarBancos();
    this.cargarCuentas();
    this.cargarTodos();
  }

  cargarBancos() {
    this.api.get<any[]>('/bancos/bancos').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => { this.bancos.set(data || []); },
    });
  }

  cargarCuentas() {
    this.api.get<any[]>('/bancos/cuentas').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        const ctas = (data || []).map((c: any) => ({ ...c, bancoId: Number(c.bancoId) }));
        this.cuentas.set(ctas);
      },
    });
  }

  cargarTodos() {
    this.cargando.set(true);
    this.api.get<any[]>('/bancos/movimientos').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.movimientos.set((data || []).map((m: any) => ({
          ...m,
          importe: Number(m.importe),
        })));
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los movimientos' });
      },
    });
  }

  onFiltroChange() {
    const bcoctasId = this.cuentaFiltro();
    if (!bcoctasId) {
      this.cargarTodos();
      return;
    }
    this.cargando.set(true);
    this.api.get<any[]>('/bancos/movimientos', { bcoctasId: String(bcoctasId) })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (data) => {
          this.movimientos.set((data || []).map((m: any) => ({
            ...m,
            importe: Number(m.importe),
          })));
          this.cargando.set(false);
        },
        error: () => {
          this.cargando.set(false);
          this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los movimientos' });
        },
      });
  }

  // ── Helpers ─────────────────────────────────────────────

  tipoMovLabel(tipo: string): string {
    return this.TIPO_MOV_OPTIONS.find(o => o.value === tipo)?.label || tipo;
  }

  tipoMovSeverity(tipo: string): 'success' | 'warn' | 'info' | 'danger' {
    switch (tipo) {
      case 'DEPOSITO': return 'success';
      case 'RETIRO': return 'warn';
      case 'TRANSFERENCIA': return 'info';
      case 'PAGO': return 'danger';
      default: return 'info';
    }
  }

  dcLabel(dc: string): string {
    return dc === 'D' ? 'Débito' : 'Crédito';
  }

  dcSeverity(dc: string): 'danger' | 'success' {
    return dc === 'D' ? 'danger' : 'success';
  }

  formatFecha(fecha: string): string {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleString('es-HN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  formatCurrency(valor: number): string {
    return new Intl.NumberFormat('es-HN', { style: 'currency', currency: 'HNL' }).format(valor || 0);
  }

  bancoNombre(bancoId: number): string {
    return this.bancos().find(b => b.bancoId === bancoId)?.descripcion || `Banco #${bancoId}`;
  }

  bancoNombreCuenta(cuenta: BcoCta): string {
    return this.bancoNombre(cuenta.bancoId);
  }
}
