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
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-anular-facturas',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule, TagModule, TooltipModule, DialogModule, ConfirmDialogModule],
  templateUrl: './anular-facturas.html',
  styleUrl: './anular-facturas.scss',
  providers: [ConfirmationService],
})
export class AnularFacturas implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  private msgs = inject(MessageService);
  private destroyRef = inject(DestroyRef);
  private confirm = inject(ConfirmationService);

  facturas = signal<any[]>([]);
  filtered = signal<any[]>([]);
  cargando = signal(false);
  q = signal('');
  anulando = signal(false);

  ngOnInit() {
    this.load();
  }

  load() {
    this.cargando.set(true);
    this.api.get<any>('/facturacion/facturas').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: any) => {
        const items = Array.isArray(res) ? res : (res?.value ?? []);
        this.facturas.set(items);
        this.filtrar();
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las facturas' });
      },
    });
  }

  filtrar() {
    const texto = this.q().toLowerCase().trim();
    if (!texto) {
      this.filtered.set(this.facturas());
      return;
    }
    this.filtered.set(
      this.facturas().filter((f) => {
        const nro = String(f.nrofactura ?? '');
        const cliente = (f.nombrecliente ?? '').toLowerCase();
        return nro.includes(texto) || cliente.includes(texto);
      }),
    );
  }

  buscar() { this.filtrar(); }
  limpiar() { this.q.set(''); this.filtrar(); }

  ver(id: number) {
    this.router.navigate(['/facturacion/consultas', id]);
  }

  fechaCorta(fecha: string | Date): string {
    if (!fecha) return '-';
    const d = new Date(fecha);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = String(d.getFullYear());
      return `${dd}/${mm}/${yyyy}`;
  }

  horaCorta(fecha: string | Date): string {
    if (!fecha) return '-';
    const d = new Date(fecha);
    return d.toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' });
  }

  moneda(n: number | undefined): string {
    return (n ?? 0).toLocaleString('es-HN', { style: 'currency', currency: 'HNL' });
  }

  getTipoLabel(tipo: string): string {
    return tipo === 'C' ? 'Credito' : 'Contado';
  }

  getTipoSeverity(tipo: string): string {
    return tipo === 'C' ? 'warn' : 'success';
  }

  getEstado(f: any): string {
    if (f.sn_anulada === 'S') return 'Anulada';
    if (f.sn_pagada === 'S') return 'Pagada';
    return 'Pendiente';
  }

  getEstadoSeverity(f: any): string {
    if (f.sn_anulada === 'S') return 'danger';
    if (f.sn_pagada === 'S') return 'success';
    return 'warn';
  }

  // ==================== VALIDACIONES ====================

  puedeAnular(f: any): { ok: boolean; razon?: string } {
    if (f.sn_anulada === 'S') {
      return { ok: false, razon: 'La factura ya esta anulada' };
    }
    if (f.sn_contabilizada === 'S') {
      return { ok: false, razon: 'La factura esta contabilizada y no se puede anular' };
    }
    return { ok: true };
  }

  // ==================== ANULAR ====================

  anular(f: any, $event?: Event) {
    $event?.stopPropagation();
    const validacion = this.puedeAnular(f);
    if (!validacion.ok) {
      this.msgs.add({ severity: 'warn', summary: 'No permitido', detail: validacion.razon });
      return;
    }

    const esCredito = f.tipofactura === 'C';
    let mensaje = `Desea anular la Factura #${f.nrofactura}?\n\nCliente: ${f.nombrecliente || 'Sin cliente'}\nTotal: ${this.moneda(f.total)}`;
    if (esCredito) {
      mensaje += '\n\nTipo: Credito — Se reversara kardex, existencias y movimientos CxC.';
    } else {
      mensaje += '\n\nTipo: Contado — Se reversara kardex y existencias.';
    }

    this.confirm.confirm({
      message: mensaje,
      header: 'Confirmar anulacion',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Si, anular',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.ejecutarAnulacion(f);
      },
    });
  }

  private ejecutarAnulacion(f: any) {
    this.anulando.set(true);
    const payload = {
      facturaId: f.facturaId,
      bodegaId: f.bodegaId,
      clienteId: f.clienteId,
      nrocliente: f.nrocliente,
      sn_excento: f.sn_excenta,
      factordecambio: Number(f.factordecambio) || 1,
      subTotal: Number(f.subTotal) || 0,
      impuesto: Number(f.impuesto) || 0,
      descuento: Number(f.descuento) || 0,
      total: Number(f.total) || 0,
      observacion: `Anulacion manual - Factura #${f.nrofactura}`,
      estado: 'S',
    };
    this.api.post<any>('/facturacion/facturas-anul', payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.anulando.set(false);
        this.msgs.add({ severity: 'success', summary: 'Factura anulada', detail: `Factura #${f.nrofactura} anulada correctamente. Kardex, existencias y movimientos reversados.` });
        this.load();
      },
      error: (err: any) => {
        this.anulando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo anular la factura' });
      },
    });
  }
}
