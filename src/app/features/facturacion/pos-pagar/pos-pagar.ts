import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { FacturaImpresionService } from '../../../core/services/factura-impresion.service';
import { PosRapidoService } from '../pos-rapido/pos-rapido.service';
import { PosRapidoState } from '../pos-rapido/pos-rapido.state';
import { moneda } from '../pos-rapido/pos-rapido.utils';
import { ClienteForm } from '../../cxc/clientes/cliente-form';

/**
 * Pantalla 2 del POS rápido (`/facturacion/pos-rapido/pagar`).
 *
 * Columna A: Resumen de artículos del carrito y totales.
 * Columna B: Datos de factura (copiado idéntico de `nueva-factura`) + formas de pago
 * integradas en tarjetas o en el diálogo de pagos múltiples.
 */
@Component({
  selector: 'app-pos-pagar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputNumberModule,
    InputTextModule,
    SelectModule,
    SelectButtonModule,
    TableModule,
    TagModule,
    ToastModule,
    TooltipModule,
  ],
  providers: [DialogService],
  templateUrl: './pos-pagar.html',
  styleUrl: './pos-pagar.scss',
})
export class PosPagar implements OnInit {
  readonly state = inject(PosRapidoState);
  private api = inject(ApiService);
  private service = inject(PosRapidoService);
  private impresion = inject(FacturaImpresionService);
  private router = inject(Router);
  private msgs = inject(MessageService);
  private dialogService = inject(DialogService);
  private destroyRef = inject(DestroyRef);

  private ref?: DynamicDialogRef;

  guardando = signal(false);
  dialogPagos = signal(false);

  readonly formatearMoneda = moneda;

  readonly tipoOptions = [
    { label: 'Contado', value: 'E' },
    { label: 'Crédito', value: 'C' },
  ];

  readonly snNombreOptions = [
    { label: 'No', value: 'N' },
    { label: 'Sí', value: 'S' },
  ];

  readonly snOptions = [
    { label: 'No', value: 'N' },
    { label: 'Sí', value: 'S' },
  ];

  readonly tipoConstanciaOpciones = [
    { label: 'Factura Negociable Exenta (FNE)', value: 'FNE' },
    { label: 'Orden de Compra Exenta (OCE)', value: 'OCE' },
    { label: 'Constancia Registro Exonerado (CRE)', value: 'CRE' },
    { label: 'Diplomáticos / Organismos (DIO)', value: 'DIO' },
  ];

  tasaPct = computed(() => Math.round(this.state.parametros().tasa * 100));

  ngOnInit(): void {
    console.log('[POS] PosPagar ngOnInit — filas:', this.state.filas().length);
    this.state.cargarContexto();
    if (this.state.filas().length === 0) {
      console.log('[POS] carrito vacío → regresa a pos-rapido');
      this.msgs.add({ severity: 'warn', summary: 'Carrito vacío', detail: 'Agregue artículos antes de pagar' });
      this.router.navigate(['/facturacion/pos-rapido']);
      return;
    }
    // Sincroniza Importe Excento en el formulario con el calculado por el state
    const t = this.state.totales();
    this.state.form.patchValue({ importe_excento: t.importeExcento }, { emitEvent: false });
  }

  // ── Helpers de formulario ──

  form = this.state.form;
  nombreClienteManual = this.state.nombreClienteManual;

  esContado(): boolean {
    return this.form.get('tipofactura')?.value === 'E';
  }

  onTipoFacturaChange(): void {
    this.state.onTipoFacturaChange();
  }

  onClienteChange(): void {
    this.state.onClienteChange();
  }

  recalcularExenta(): void {
    this.state.recalcularExenta();
    const t = this.state.totales();
    this.form.patchValue({ importe_excento: t.importeExcento }, { emitEvent: false });
  }

  invalid(controlName: string): boolean {
    const c = this.form.get(controlName);
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  salir(): void {
    this.router.navigate(['/facturacion/pos-rapido']);
  }

  /** Quita un artículo desde la columna de resumen (conserva el resto) */
  quitarLinea(linea: any): void {
    this.state.eliminarLinea(linea);
    if (this.state.filas().length === 0) {
      this.msgs.add({ severity: 'warn', summary: 'Carrito vacío', detail: 'Agregue artículos antes de pagar' });
      this.router.navigate(['/facturacion/pos-rapido']);
    }
  }

  nueva(): void {
    this.state.limpiarVenta();
    this.router.navigate(['/facturacion/pos-rapido']);
  }

  abrirNuevoCliente(): void {
    this.ref = this.dialogService.open(ClienteForm, {
      header: 'Nuevo Cliente',
      width: '55vw',
      modal: true,
      data: { modo: 'facturacion' },
      breakpoints: { '960px': '75vw', '640px': '90vw' },
    });
    this.ref.onClose.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((nuevo: any) => {
      if (nuevo?.clienteId) {
        this.state.cargarContexto();
        setTimeout(() => {
          this.form.patchValue({ clienteId: nuevo.clienteId, nrocliente: nuevo.nrocliente ?? '' });
        }, 300);
      }
    });
  }

  // ── Diálogo de pagos múltiples ──

  abrirPagos(): void {
    if (this.state.pagos().length === 0) {
      this.state.inicializarPagos();
    }
    this.dialogPagos.set(true);
  }

  agregarPago(): void {
    this.state.agregarPago();
  }

  quitarPago(idx: number): void {
    this.state.quitarPago(idx);
  }

  pagosConImporte() {
    return this.state.pagosConImporte();
  }

  totalPagos(): number {
    return this.state.totalPagos();
  }

  pendiente(): number {
    return this.state.pendiente();
  }

  cambioTotal(): number {
    return this.state.cambioTotal();
  }

  esTarjeta(pago: any): boolean {
    return this.state.esTarjeta(pago);
  }

  esTransferencia(pago: any): boolean {
    return this.state.esTransferencia(pago);
  }

  cobroValido(): boolean {
    const t = this.state.totales();
    if (t.total <= 0) return false;
    if (this.esContado() && this.totalPagos() < t.total) return false;
    return true;
  }

  // ── Facturar (copia adaptada de nueva-factura.ts) ──

  facturar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.msgs.add({ severity: 'warn', summary: 'Validación', detail: 'Complete los campos obligatorios' });
      return;
    }
    const filas = this.state.filas();
    if (filas.length === 0) {
      this.msgs.add({ severity: 'warn', summary: 'Validación', detail: 'Agregue al menos un artículo' });
      return;
    }

    const raw = this.form.getRawValue();
    const t = this.state.totales();
    const esCredito = raw.tipofactura === 'C';

    if (t.total <= 0) {
      this.msgs.add({ severity: 'warn', summary: 'Validación', detail: 'El total de la factura es L 0.00' });
      return;
    }

    if (!esCredito) {
      if (raw.snNombreOptions === 'S' && !this.nombreClienteManual()?.trim()) {
        this.msgs.add({ severity: 'warn', summary: 'Validación', detail: 'Ingrese el nombre del cliente' });
        return;
      }
      const pagos = this.pagosConImporte();
      if (pagos.length === 0) {
        this.msgs.add({ severity: 'warn', summary: 'Validación', detail: 'Ingrese al menos una forma de pago con importe' });
        return;
      }
      for (const p of pagos) {
        if (this.esTarjeta(p)) {
          if (!p.nrotarjeta?.trim()) {
            this.msgs.add({ severity: 'warn', summary: 'Validación', detail: 'Ingrese el número de tarjeta' });
            return;
          }
          if (p.nrotarjeta.replace(/\D/g, '').length < 13) {
            this.msgs.add({ severity: 'warn', summary: 'Validación', detail: 'La tarjeta debe tener al menos 13 dígitos' });
            return;
          }
          if (!this.state.validarLuhn(p.nrotarjeta)) {
            this.msgs.add({ severity: 'warn', summary: 'Validación', detail: 'El número de tarjeta no es válido (Luhn)' });
            return;
          }
          if (!p.nroautorizacion?.trim()) {
            this.msgs.add({ severity: 'warn', summary: 'Validación', detail: 'Ingrese el número de autorización' });
            return;
          }
        }
        if (this.esTransferencia(p) && !p.nroautorizacion?.trim()) {
          this.msgs.add({ severity: 'warn', summary: 'Validación', detail: 'Ingrese el número de autorización de la transferencia' });
          return;
        }
      }
      if (this.totalPagos() < t.total) {
        this.msgs.add({
          severity: 'error',
          summary: 'Validación',
          detail: `Falta por pagar: ${this.formatearMoneda(t.total - this.totalPagos())}`,
        });
        return;
      }
    }

    const clienteArr = this.state.clientesArray.find((c) => c.clienteId === raw.clienteId);
    const nombreCliente =
      raw.tipofactura === 'E' && raw.snNombreOptions === 'S'
        ? this.nombreClienteManual()
        : clienteArr
          ? `${clienteArr.nombres ?? ''} ${clienteArr.apellidos ?? ''}`.trim()
          : null;

    const mae = {
      tipofactura: raw.tipofactura,
      clienteId: raw.clienteId,
      nrocliente: raw.nrocliente,
      nombrecliente: nombreCliente,
      rtn_cliente: raw.rtn_cliente || null,
      direccion: raw.direccion || null,
      factordecambio: raw.factordecambio ?? 0,
      subTotal: t.bruto,
      impuesto: t.impuesto,
      descuento: t.descuento,
      total: t.total,
      efectivo_recibido: esCredito ? 0 : this.totalPagos(),
      importe_cambio: esCredito ? 0 : this.state.redondear(this.cambioTotal()),
      diascredito: raw.diascredito ?? 0,
      fechavencimiento: raw.fechavencimiento ? new Date(raw.fechavencimiento).toISOString() : null,
      bodegaId: raw.bodegaId,
      cajaId: raw.cajaId,
      gestorId: raw.gestorId || null,
      sn_excenta: raw.sn_excenta,
      tipoconstancia: raw.tipoconstancia || 'FNE',
      nroconstancia: raw.nroconstancia || null,
      importe_excento: raw.importe_excento || t.importeExcento,
      sn_pagada: esCredito ? 'N' : 'S',
      sn_anulada: 'N',
      sn_contabilizada: 'N',
    };

    this.guardando.set(true);
    this.api
      .post<any>('/facturacion/facturas', mae)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (fac) => {
          if (fac.alerta) {
            this.msgs.add({
              severity: 'warn',
              summary: 'CAI Próximo a caducar',
              detail: fac.alerta,
              life: 10000,
            });
          }

          const detOps = filas.map((r, i) => {
            const pDescuento = r.descuentoPct ?? 0;
            const cant = r.cantidad ?? 0;
            const precio = r.precio ?? 0;
            const descuentoMonto = this.state.redondear(cant * precio * (pDescuento / 100));
            return this.api.post<any>('/facturacion/facturas-det', {
              facturaId: fac.facturaId,
              bodegaId: fac.bodegaId ?? raw.bodegaId,
              nrofila: i + 1,
              productoId: r.productoId,
              codbarra: r.codbarra || '',
              cantidad: cant,
              precioventa: precio,
              impuesto: r.impuesto ?? 0,
              subTotal: r.subTotal,
              descuento: descuentoMonto,
              p_descuento: pDescuento,
              sn_anulada: 'N',
            });
          });

          forkJoin(detOps)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: () => {
                if (esCredito) {
                  this.procesarKardexYFinalizar(fac, `Factura de crédito #${fac.nrofactura} creada`);
                } else {
                  this.guardarPagosYFinalizar(fac, raw);
                }
              },
              error: () => {
                this.guardando.set(false);
                this.msgs.add({ severity: 'error', summary: 'Error', detail: 'La factura se creó pero falló el detalle' });
              },
            });
        },
        error: () => {
          this.guardando.set(false);
          this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la factura' });
        },
      });
  }

  private guardarPagosYFinalizar(fac: any, raw: any) {
    const pagosList = this.pagosConImporte();
    if (pagosList.length > 0) {
      const pagoOps = pagosList.map((p) =>
        this.api.post<any>('/facturacion/fac-caja', {
          facturaId: fac.facturaId,
          formapagoId: p.formapagoId,
          tarjetacreditoId: p.tarjetacreditoId || null,
          nrotarjeta: p.nrotarjeta || null,
          nroautorizacion: p.nroautorizacion || null,
          importe_otros: Number(p.importe) || 0,
          importe_efectivo: 0,
          importe_cambio: 0,
          factordecambio: raw.factordecambio ?? 0,
          cajaId: raw.cajaId,
        }),
      );
      forkJoin(pagoOps)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.procesarKardexYFinalizar(fac, `Factura #${fac.nrofactura} creada con ${pagosList.length} pago(s)`);
          },
          error: () => {
            this.guardando.set(false);
            this.msgs.add({ severity: 'warn', summary: 'Advertencia', detail: `Factura #${fac.nrofactura} creada, pero falló el registro de pagos` });
            this.nueva();
          },
        });
    } else {
      this.procesarKardexYFinalizar(fac, `Factura #${fac.nrofactura} creada`);
    }
  }

  private procesarKardexYFinalizar(fac: any, mensajeExito: string) {
    this.api
      .post<any>(`/facturacion/facturas/${fac.facturaId}/procesar-kardex`, {})
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.guardando.set(false);
          this.msgs.add({ severity: 'success', summary: 'Guardado', detail: mensajeExito });
          // El ticket se imprime ANTES de navegar: `nueva()` destruye este
          // componente y takeUntilDestroyed cancelaría la petición del ticket.
          if (this.state.snImprimeFactura) {
            this.imprimirTicket(fac.facturaId).finally(() => this.nueva());
          } else {
            this.nueva();
          }
        },
        error: () => {
          this.guardando.set(false);
          this.msgs.add({ severity: 'warn', summary: 'Advertencia', detail: `Factura #${fac.nrofactura} creada, pero falló el registro de kardex` });
          this.nueva();
        },
      });
  }

  /** Descarga el ticket y lo envía a impresión; resuelve cuando termina (o falla) */
  private imprimirTicket(facturaId: number): Promise<void> {
    return new Promise<void>((resolve) => {
      this.api
        .get<any>(`/facturacion/facturas/${facturaId}/ticket`)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data) =>
            this.impresion
              .imprimir(data)
              .catch(() => {
                this.msgs.add({ severity: 'warn', summary: 'Impresión', detail: 'No se pudo imprimir el ticket' });
              })
              .finally(() => resolve()),
          error: () => {
            this.msgs.add({ severity: 'warn', summary: 'Impresión', detail: 'No se pudieron cargar los datos del ticket' });
            resolve();
          },
        });
    });
  }
}
