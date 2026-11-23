import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { FacturaImpresionService } from '../../../core/services/factura-impresion.service';
import { CajaSesionService } from '../caja/caja-sesion.service';
import type { CajaSesion } from '../caja/caja-sesion.models';

interface Opcion {
  label: string;
  value: number;
}

interface PagoFactura {
  formapagoId: number | null;
  tarjetacreditoId: number | null;
  nrotarjeta: string;
  nroautorizacion: string;
  importe: number | undefined;
}

interface FacturaPendiente {
  facturaId: number;
  fecharegistro: string;
  nrofactura: number;
  nombrecliente: string | null;
  nrocliente: string | null;
  tipofactura: string;
  subTotal: string | number;
  descuento: string | number;
  impuesto: string | number;
  total: string | number;
  empresaId?: string | number;
  Idsucursal?: string | number;
  sn_pagada: string;
  sn_contabilizada: string;
  sn_anulada: string;
}

interface LineaFactura {
  nrofila: number;
  codbarra: string;
  descripcion: string;
  cantidad: string | number;
  precioventa: string | number;
  descuento: string | number;
  subTotal: string | number;
}

const FORMAPAGO_EFECTIVO = 1;

@Component({
  selector: 'app-caja-unica',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    TableModule,
    DialogModule,
    TooltipModule,
    TagModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './caja-unica.html',
  styleUrl: './caja-unica.scss',
})
export class CajaUnica implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private impresion = inject(FacturaImpresionService);
  private cajaSesion = inject(CajaSesionService);
  private msgs = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  readonly formatearMoneda = (n: number | string | null | undefined): string =>
    (Number(n) || 0).toLocaleString('es-HN', { style: 'currency', currency: 'HNL' });

  formatearFecha(value: string | Date | null | undefined): string {
    if (!value) return '';
    const s = String(value).substring(0, 10);
    const [anio, mes, dia] = s.split('-');
    return anio && mes && dia ? `${dia}/${mes}/${anio}` : s;
  }

  facturas = signal<FacturaPendiente[]>([]);
  busqueda = signal('');
  facturaSel = signal<FacturaPendiente | null>(null);
  detalles = signal<LineaFactura[]>([]);
  cargando = signal(false);
  cargandoDetalle = signal(false);
  guardando = signal(false);
  formaspago = signal<Opcion[]>([]);
  tarjetas = signal<Opcion[]>([]);
  pagos = signal<PagoFactura[]>([]);
  dialogPagos = signal(false);
  sesionCaja = signal<CajaSesion | null>(null);
  snImprimeFactura = signal(false);

  cajaAbierta = computed(() => this.sesionCaja() !== null);

  facturasFiltradas = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    return this.facturas().filter((f) => {
      if (f.sn_contabilizada !== 'N') return false;
      if (f.sn_pagada === 'S') return false;
      if (f.sn_anulada === 'S') return false;
      if (!texto) return true;
      const cliente = (f.nombrecliente ?? '').toLowerCase();
      const nro = String(f.nrofactura ?? '');
      return cliente.includes(texto) || nro.includes(texto);
    });
  });

  totales = computed(() => {
    const f = this.facturaSel();
    return {
      subTotal: Number(f?.subTotal) || 0,
      descuento: Number(f?.descuento) || 0,
      impuesto: Number(f?.impuesto) || 0,
      total: Number(f?.total) || 0,
    };
  });

  pagosConImporte = computed(() => this.pagos().filter((p) => (Number(p.importe) || 0) > 0));
  totalPagos = computed(() =>
    this.pagosConImporte().reduce((sum, p) => sum + (Number(p.importe) || 0), 0),
  );
  pendiente = computed(() => Math.max(0, this.totales().total - this.totalPagos()));
  cambioTotal = computed(() => Math.max(0, this.totalPagos() - this.totales().total));

  ngOnInit(): void {
    this.cargarSesionCaja();
    this.cargarOpciones();
    this.cargarFacturas();
  }

  cargarSesionCaja(): void {
    const user = this.auth.currentUser();
    if (!user?.empresaId || !user?.usuarioId) {
      this.sesionCaja.set(null);
      return;
    }
    this.cajaSesion
      .obtenerSesionActiva(Number(user.empresaId), undefined, Number(user.usuarioId))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (sesion) => this.sesionCaja.set(sesion),
        error: () => this.sesionCaja.set(null),
      });
  }

  cargarOpciones(): void {
    this.api
      .get<any[]>('/parametros/formas-pago')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((items) => {
        this.formaspago.set(
          (items ?? []).map((i) => ({ label: i.descripcion, value: Number(i.formapagoId) })),
        );
        this.inicializarPagos();
      });
    this.api
      .get<any[]>('/parametros/tarjetas-credito')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((items) => {
        this.tarjetas.set(
          (items ?? []).map((i) => ({ label: i.descripcion, value: Number(i.tarjetacreditoId) })),
        );
      });
    this.api
      .get<any>('/parametros/parametros/objeto?moduloId=3')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (p) => this.snImprimeFactura.set(p?.sn_imprimefactura === 'S'),
        error: () => this.snImprimeFactura.set(false),
      });
  }

  cargarFacturas(): void {
    this.cargando.set(true);
    this.api
      .get<any>('/facturacion/facturas')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const items = Array.isArray(res) ? res : (res?.value ?? []);
          this.facturas.set(items);
          this.cargando.set(false);
        },
        error: () => {
          this.cargando.set(false);
          this.msgs.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron cargar las facturas pendientes',
          });
        },
      });
  }

  seleccionar(factura: FacturaPendiente): void {
    this.facturaSel.set(factura);
    this.detalles.set([]);
    this.cargandoDetalle.set(true);
    this.api
      .get<any>(`/facturacion/facturas/${factura.facturaId}/ticket`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.detalles.set(Array.isArray(data?.detalles) ? data.detalles : []);
          this.cargandoDetalle.set(false);
        },
        error: () => {
          this.cargandoDetalle.set(false);
          this.msgs.add({
            severity: 'warn',
            summary: 'Detalle',
            detail: 'No se pudo cargar el detalle de la factura',
          });
        },
      });
  }

  inicializarPagos(): void {
    this.pagos.set(
      this.formaspago().map((fp) => ({
        formapagoId: fp.value,
        tarjetacreditoId: null,
        nrotarjeta: '',
        nroautorizacion: '',
        importe: undefined,
      })),
    );
  }

  agregarPago(): void {
    this.pagos.update((p) => [
      ...p,
      {
        formapagoId: null,
        tarjetacreditoId: null,
        nrotarjeta: '',
        nroautorizacion: '',
        importe: undefined,
      },
    ]);
  }

  quitarPago(idx: number): void {
    this.pagos.update((p) => p.filter((_, i) => i !== idx));
  }

  actualizarPago(idx: number, campo: keyof PagoFactura, valor: unknown): void {
    this.pagos.update((lista) =>
      lista.map((p, i) => (i === idx ? { ...p, [campo]: valor } : p)),
    );
  }

  esTarjeta(pago: PagoFactura): boolean {
    const fp = this.formaspago().find((f) => f.value === pago.formapagoId);
    return fp?.label?.toLowerCase().includes('tarjeta') ?? false;
  }

  esTransferencia(pago: PagoFactura): boolean {
    const fp = this.formaspago().find((f) => f.value === pago.formapagoId);
    return fp?.label?.toLowerCase().includes('transferencia') ?? false;
  }

  validarLuhn(numero: string): boolean {
    const digits = numero.replace(/\D/g, '');
    if (digits.length < 13 || digits.length > 19) return false;
    let suma = 0;
    let alternar = false;
    for (let i = digits.length - 1; i >= 0; i--) {
      let digito = parseInt(digits[i], 10);
      if (alternar) {
        digito *= 2;
        if (digito > 9) digito = Math.floor(digito / 10) + (digito % 10);
      }
      suma += digito;
      alternar = !alternar;
    }
    return suma % 10 === 0;
  }

  abrirPagos(): void {
    if (!this.cajaAbierta()) {
      this.msgs.add({
        severity: 'warn',
        summary: 'Caja cerrada',
        detail: 'Abra la caja en Facturación → Caja antes de cobrar',
      });
      return;
    }
    if (!this.facturaSel()) {
      this.msgs.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Seleccione una factura de la lista',
      });
      return;
    }
    if (this.totales().total <= 0) {
      this.msgs.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'El total de la factura es L 0.00',
      });
      return;
    }
    this.dialogPagos.set(true);
  }

  confirmarPago(): void {
    if (this.guardando()) return;
    const factura = this.facturaSel();
    if (!factura || !this.cajaAbierta()) {
      this.dialogPagos.set(false);
      this.msgs.add({
        severity: 'warn',
        summary: 'Caja cerrada',
        detail: 'Su sesión de caja ya no está abierta. Vuelva a abrir la caja antes de cobrar',
      });
      this.cargarSesionCaja();
      return;
    }

    const pagos = this.pagosConImporte();
    if (pagos.length === 0) {
      this.msgs.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Ingrese al menos una forma de pago con importe',
      });
      return;
    }
    for (const p of pagos) {
      if (this.esTarjeta(p)) {
        if (!p.nrotarjeta?.trim()) {
          this.msgs.add({
            severity: 'warn',
            summary: 'Validación',
            detail: 'Ingrese el número de tarjeta de crédito',
          });
          return;
        }
        if (p.nrotarjeta.replace(/\D/g, '').length < 13 || !this.validarLuhn(p.nrotarjeta)) {
          this.msgs.add({
            severity: 'warn',
            summary: 'Validación',
            detail: 'El número de tarjeta no es válido',
          });
          return;
        }
        if (!p.nroautorizacion?.trim()) {
          this.msgs.add({
            severity: 'warn',
            summary: 'Validación',
            detail: 'Ingrese el número de autorización de la tarjeta',
          });
          return;
        }
      }
      if (this.esTransferencia(p) && !p.nroautorizacion?.trim()) {
        this.msgs.add({
          severity: 'warn',
          summary: 'Validación',
          detail: 'Ingrese el número de autorización de la transferencia',
        });
        return;
      }
    }
    if (this.totalPagos() < this.totales().total) {
      this.msgs.add({
        severity: 'error',
        summary: 'Validación',
        detail: `Falta por pagar: ${this.formatearMoneda(this.pendiente())}`,
      });
      return;
    }

    const cajaId = Number(this.sesionCaja()?.cajaId) || 0;
    const totalEfectivo =
      Math.round(
        pagos
          .filter((p) => Number(p.formapagoId) === FORMAPAGO_EFECTIVO)
          .reduce((s, p) => s + (Number(p.importe) || 0), 0) * 100,
      ) / 100;
    const cambioEfectivo = Math.max(
      0,
      Math.round((totalEfectivo - this.totales().total) * 100) / 100,
    );
    this.guardando.set(true);
    const ops = pagos.map((p) => {
      const importe = Math.round((Number(p.importe) || 0) * 100) / 100;
      const esEfectivo = Number(p.formapagoId) === FORMAPAGO_EFECTIVO;
      return this.api.post('/facturacion/fac-caja', {
        facturaId: factura.facturaId,
        formapagoId: p.formapagoId,
        tarjetacreditoId: p.tarjetacreditoId || null,
        nrotarjeta: p.nrotarjeta || null,
        nroautorizacion: p.nroautorizacion || null,
        importe_efectivo: esEfectivo ? importe : 0,
        importe_otros: esEfectivo ? 0 : importe,
        importe_cambio: esEfectivo ? cambioEfectivo : 0,
        factordecambio: 1,
        cajaId,
      });
    });

    forkJoin(ops)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.api
            .put('/facturacion/facturas', factura.facturaId, {
              sn_pagada: 'S',
              efectivo_recibido: totalEfectivo,
              importe_cambio: cambioEfectivo,
            })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: () => this.finalizarCobro(factura),
              error: () => {
                this.guardando.set(false);
                this.msgs.add({
                  severity: 'warn',
                  summary: 'Advertencia',
                  detail: 'Los pagos se registraron, pero no se pudo marcar la factura como pagada',
                });
              },
            });
        },
        error: (err) => {
          this.guardando.set(false);
          this.msgs.add({
            severity: 'error',
            summary: 'Error',
            detail: err?.error?.message ?? 'No se pudo registrar el cobro',
          });
        },
      });
  }

  private finalizarCobro(factura: FacturaPendiente): void {
    const empresaId = Number(factura.empresaId) || Number(this.auth.currentUser()?.empresaId) || 0;
    const idsucursal =
      Number(factura.Idsucursal) || Number(this.auth.currentUser()?.idsucursal) || 1;

    const contabilizar$ =
      factura.sn_contabilizada === 'N'
        ? this.api
            .post<any>(
              '/contabilidad/integracion/factura',
              { documentoId: factura.facturaId },
              undefined,
              { empresaId, Idsucursal: idsucursal },
            )
            .pipe(
              catchError(() => {
                this.msgs.add({
                  severity: 'warn',
                  summary: 'Contabilidad',
                  detail: 'No se pudo contabilizar la factura',
                });
                return of(false);
              }),
            )
        : of(false);

    contabilizar$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (contabilizado) => {
        if (this.snImprimeFactura()) this.imprimirTicket(factura.facturaId);
        this.guardando.set(false);
        this.dialogPagos.set(false);
        this.msgs.add({
          severity: 'success',
          summary: 'Cobro registrado',
          detail: `Factura #${factura.nrofactura} pagada${contabilizado ? ' y contabilizada' : ''}`,
        });
        this.facturaSel.set(null);
        this.detalles.set([]);
        this.inicializarPagos();
        this.cargarFacturas();
      },
    });
  }

  private imprimirTicket(facturaId: number): void {
    this.api
      .get<any>(`/facturacion/facturas/${facturaId}/ticket`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) =>
          this.impresion.imprimir(data).catch(() => {
            this.msgs.add({
              severity: 'warn',
              summary: 'Impresión',
              detail: 'No se pudo imprimir el ticket',
            });
          }),
        error: () => {
          this.msgs.add({
            severity: 'warn',
            summary: 'Impresión',
            detail: 'No se pudieron cargar los datos del ticket',
          });
        },
      });
  }

  limpiar(): void {
    this.busqueda.set('');
    this.facturaSel.set(null);
    this.detalles.set([]);
    this.inicializarPagos();
  }
}
