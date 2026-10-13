import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { TodoPagoService, TodoPagoTransaccion } from '../../../core/services/todopago.service';

/**
 * Página de retorno del link de pago TodoPago (URL_OK / sandbox).
 * Recibe ?Answer=<publicRequestKey>&Order=<operationId> y confirma el pago:
 * transacción completed + factura sn_pagada='S' + registro en posfaccaja.
 */
@Component({
  selector: 'app-pago-confirmado',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, TagModule, ProgressSpinnerModule],
  providers: [MessageService],
  templateUrl: './pago-confirmado.html',
  styleUrl: './pago-confirmado.scss',
})
export class PagoConfirmado implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private todp = inject(TodoPagoService);
  private msgs = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  cargando = signal(true);
  resultado = signal<TodoPagoTransaccion | null>(null);
  error = signal<string | null>(null);

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    const answer = params.get('Answer') || '';
    const order = params.get('Order') || '';

    if (!answer) {
      this.error.set('Falta la referencia de la transacción (parámetro Answer)');
      this.cargando.set(false);
      return;
    }

    this.todp.confirmar(answer, answer, order || undefined)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (tx) => {
          this.resultado.set(tx);
          this.cargando.set(false);
          if (tx.status === 'completed') {
            this.msgs.add({
              severity: 'success',
              summary: 'Pago confirmado',
              detail: `Factura #${tx.nrofactura || tx.facturaid} pagada vía TodoPago`,
            });
          }
        },
        error: (err) => {
          this.error.set(err?.error?.message || 'No se pudo confirmar el pago');
          this.cargando.set(false);
        },
      });
  }

  get exito(): boolean {
    return this.resultado()?.status === 'completed';
  }

  moneda(n: number | null | undefined): string {
    return (n ?? 0).toLocaleString('es-HN', { style: 'currency', currency: 'HNL' });
  }

  irAFacturas(): void {
    this.router.navigate(['/facturacion/consultas']);
  }

  irANueva(): void {
    this.router.navigate(['/facturacion/nueva-factura']);
  }

  reintentar(): void {
    this.cargando.set(true);
    this.error.set(null);
    const params = this.route.snapshot.queryParamMap;
    const answer = params.get('Answer') || '';
    const order = params.get('Order') || '';
    this.todp.confirmar(answer, answer, order || undefined)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (tx) => {
          this.resultado.set(tx);
          this.cargando.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.message || 'No se pudo confirmar el pago');
          this.cargando.set(false);
        },
      });
  }
}
