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
import { BcoCta } from '../../../core/models/bancos.models';

interface ChequeRecord {
  bcomovimientosId: number;
  fecharegistro: string;
  nrochq: string;
  importe: number;
  concepto: string;
  sn_doc_anulado: string;
  bcoctasId: number;
  nrocuenta: string;
  bancoNombre: string;
  bancoId: number;
}

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
  cheques = signal<ChequeRecord[]>([]);
  cuentaFiltro = signal<number | null>(null);
  cargando = signal(false);

  ngOnInit() {
    this.cargarBancos();
    this.cargarCuentas();
    this.cargarCheques();
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

  cargarCheques() {
    this.cargando.set(true);
    const params: any = {};
    if (this.cuentaFiltro()) {
      params.bcoctasId = String(this.cuentaFiltro());
    }
    this.api.get<any[]>('/bancos/cheques', params).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.cheques.set((data || []).map((c: any) => ({
          ...c,
          importe: Number(c.importe),
        })));
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los cheques' });
      },
    });
  }

  onFiltroChange() {
    this.cargarCheques();
  }

  // ── Anular ─────────────────────────────────────────────

  anular(cheque: ChequeRecord) {
    this.confirm.confirm({
      message: `¿Está seguro de anular el cheque N.° ${cheque.nrochq} por importe de ${this.formatCurrency(cheque.importe)}? Esta acción revertirá el pago en Cuentas por Pagar.`,
      header: 'Confirmar anulación de cheque',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: { label: 'Cancelar', severity: 'secondary', variant: 'text', size: 'small', rounded: true },
      acceptButtonProps: { label: 'Anular Cheque', severity: 'danger', variant: 'text', size: 'small', rounded: true },
      accept: () => {
        this.api.putBase(`/bancos/movimientos/${cheque.bcomovimientosId}/anular`, {})
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (res: any) => {
              this.msgs.add({ severity: 'success', summary: 'Cheque Anulado', detail: res.mensaje || 'Cheque anulado correctamente' });
              this.cargarCheques();
            },
            error: (err) => {
              const msg = err?.error?.message;
              const detalle = (Array.isArray(msg) ? msg.join(' · ') : msg) || err?.error?.error || 'No se pudo anular el cheque';
              this.msgs.add({ severity: 'error', summary: 'Error al anular', detail: detalle });
            },
          });
      },
    });
  }

  // ── Helpers ─────────────────────────────────────────────

  beneficiarioDe(cheque: ChequeRecord): string {
    const match = cheque.concepto?.match(/^Pago a favor de (.+?), facturas:/);
    return match ? match[1] : cheque.concepto || '';
  }

  formatFecha(fecha: string): string {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-HN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
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
