import { Component, inject, signal, OnInit, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../../core/services/api.service';
import { BcoCta } from '../../../core/models/bancos.models';
import { numeroALetras } from '../../../core/utils/numeros-a-letras';

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
}

@Component({
  selector: 'app-reimpresion-chq',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink, TableModule, ButtonModule, InputTextModule,
    SelectModule, TagModule, TooltipModule, ToastModule, DialogModule,
  ],
  templateUrl: './reimpresion-chq.html',
  styleUrl: './reimpresion-chq.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReimpresionChq implements OnInit {
  private api = inject(ApiService);
  private msgs = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  // Datos
  cuentas = signal<BcoCta[]>([]);
  cheques = signal<ChequeRecord[]>([]);
  bancos = signal<any[]>([]);
  cuentaFiltro = signal<number | null>(null);
  cargando = signal(false);

  // Impresión
  mostrarImpresion = signal(false);
  chequeSeleccionado = signal<ChequeRecord | null>(null);

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
      next: (data) => { this.cuentas.set(data || []); },
    });
  }

  cargarCheques() {
    this.cargando.set(true);
    const params: any = {};
    if (this.cuentaFiltro()) params.bcoctasId = String(this.cuentaFiltro());

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

  bancoNombre(bancoId: number): string {
    return this.bancos().find(b => b.bancoId === bancoId)?.descripcion || `Banco #${bancoId}`;
  }

  // ── Impresión ───────────────────────────────────────────

  imprimirCheque(cheque: ChequeRecord) {
    this.chequeSeleccionado.set(cheque);
    this.mostrarImpresion.set(true);
  }

  cerrarImpresion() {
    this.mostrarImpresion.set(false);
    this.chequeSeleccionado.set(null);
  }

  windowPrint() {
    window.print();
  }

  numeroALetrasValor(num: number): string {
    return numeroALetras(num);
  }

  formatCurrency(valor: number): string {
    return new Intl.NumberFormat('es-HN', { style: 'currency', currency: 'HNL' }).format(valor || 0);
  }

  formatFecha(fecha: string): string {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-HN');
  }

  beneficiarioDe(cheque: ChequeRecord): string {
    const match = cheque.concepto?.match(/^Pago a favor de (.+?), facturas:/);
    return match ? match[1] : cheque.concepto || '';
  }

  get fechaHoy(): string {
    return new Date().toLocaleDateString('es-HN', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  // Beneficiario del cheque: extraer del concepto "Pago proveedor XXX - Chq YYY"
  get beneficiario(): string {
    const cheque = this.chequeSeleccionado();
    if (!cheque) return '';
    const match = cheque.concepto?.match(/^Pago proveedor (.+?) - Chq/);
    return match ? match[1] : cheque.concepto || '';
  }
}
