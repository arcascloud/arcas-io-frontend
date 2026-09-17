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
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ApiService } from '../../../core/services/api.service';
import { BcoMovimiento, BcoCta } from '../../../core/models/bancos.models';

@Component({
  selector: 'app-anular-movimientos',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule,
    SelectModule, TagModule, TooltipModule, ToastModule, ConfirmDialogModule,
  ],
  templateUrl: './anular-movimientos.html',
  styleUrl: './anular-movimientos.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnularMovimientos implements OnInit {
  private api = inject(ApiService);
  private msgs = inject(MessageService);
  private confirm = inject(ConfirmationService);
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

  // ── Anular ─────────────────────────────────────────────

  anular(mov: BcoMovimiento) {
    this.confirm.confirm({
      message: `¿Anular el movimiento #${mov.bcomovimientosId}?`,
      header: 'Confirmar anulación',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: { label: 'Cancelar', severity: 'secondary', variant: 'text', size: 'small', rounded: true },
      acceptButtonProps: { label: 'Anular', severity: 'danger', variant: 'text', size: 'small', rounded: true },
      accept: () => {
        this.api.putBase(`/bancos/movimientos/${mov.bcomovimientosId}/anular?empresaId=${mov.empresaId}`, {})
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (res: any) => {
              this.msgs.add({ severity: 'success', summary: 'Anulado', detail: res.mensaje || 'Movimiento anulado correctamente' });
              this.onFiltroChange();
            },
            error: () => {
              this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudo anular el movimiento' });
            },
          });
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
