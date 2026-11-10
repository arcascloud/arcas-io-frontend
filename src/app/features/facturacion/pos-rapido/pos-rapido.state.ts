import { Injectable, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { PosRapidoService } from './pos-rapido.service';
import type {
  EstadoStock,
  FilaCobro,
  LineaPos,
  OpcionPos,
  ParametrosImpuesto,
  TarjetaProducto,
} from './pos-rapido.models';
import {
  TASA_ISV_DEFECTO,
  aNumero,
  calcularLinea,
  calcularTotales,
  estadoStock,
  redondear,
} from './pos-rapido.utils';

/** Resultado de agregar un producto al carrito (para que el UI avise) */
export type ResultadoAgregar = 'ok' | 'agotado' | 'sin-existencia' | 'max-existencia';

/**
 * Estado compartido del POS rápido entre la pantalla 1 (escáner + catálogo)
 * y la pantalla 2 (datos de factura + formas de pago en `/pos-rapido/pagar`).
 *
 * Patrón raíz tipo `CarritoStateService`: la pantalla 1 escribe (carrito,
 * descuento global), la pantalla 2 lee y factura; al facturar se limpia todo
 * y se vuelve a la pantalla 1.
 */
@Injectable({ providedIn: 'root' })
export class PosRapidoState {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private posService = inject(PosRapidoService);
  private fb = inject(FormBuilder);

  // ── Parámetros y catálogos ──
  parametros = signal<ParametrosImpuesto>({
    tasa: TASA_ISV_DEFECTO,
    precioIncluyeImpuesto: false,
  });
  formaspago = signal<OpcionPos[]>([]);
  tarjetas = signal<OpcionPos[]>([]);
  descuentos = signal<OpcionPos[]>([]);
  gestores = signal<OpcionPos[]>([]);
  /** Opciones del select de clientes (label = "nrocliente - nombres apellidos") */
  clientes = signal<OpcionPos[]>([]);
  /** Clientes crudos para resolver nombre/RTN al facturar */
  clientesArray: any[] = [];

  // ── Contexto de facturación ──
  clienteTienda = signal<any | null>(null);
  bodegaId = signal<number | null>(null);
  cajaId = signal<number | null>(null);
  factordecambio = signal(0);
  snImprimeFactura = false;

  private descuentosMap = new Map<number, number>();
  private descAcumulables = new Set<number>();
  private contextoCargado = false;

  // ── Carrito ──
  filas = signal<LineaPos[]>([]);
  private contadorFila = 0;

  // ── Formas de pago (pantalla 2) ──
  pagos = signal<FilaCobro[]>([]);

  // ── Formulario de facturación (pantalla 2, se conserva al volver) ──
  form: FormGroup;
  nombreClienteManual = signal('');
  descuentoGlobalId = signal<number | null>(null);

  // ── Derivados ──
  descuentoGlobal = computed(() => {
    const id = this.descuentoGlobalId();
    if (id == null) return 0;
    const pct = this.descuentosMap.get(id) ?? 0;
    const acumulable = this.descAcumulables.has(id);
    let total = 0;
    for (const fila of this.filas()) {
      const base = fila.cantidad * fila.precio;
      if (fila.ofertaPct > 0) {
        total += acumulable ? fila.ofertaPct + pct : fila.ofertaPct;
      } else {
        total += pct;
      }
    }
    return total / Math.max(1, this.filas().length);
  });

  // ── Derivados ──
  totales = computed(() => calcularTotales(this.filas()));
  cantidadItems = computed(() => this.totales().items);

  carritoPorProducto = computed(() => {
    const mapa = new Map<number, number>();
    for (const fila of this.filas()) {
      mapa.set(fila.productoId, (mapa.get(fila.productoId) ?? 0) + fila.cantidad);
    }
    return mapa;
  });

  constructor() {
    this.form = this.fb.group({
      tipofactura: ['E'],
      clienteId: [null as number | null, Validators.required],
      nrocliente: ['', Validators.required],
      rtn_cliente: [''],
      formapagoId: [null as number | null],
      bodegaId: [null as number | null],
      cajaId: [null as number | null],
      gestorId: [null as number | null],
      factordecambio: [0],
      tarjetacreditoId: [null as number | null],
      nrotarjeta: [''],
      nroreferencia: [''],
      tipoconstancia: ['FNE'],
      nroconstancia: [''],
      diascredito: [0],
      fechavencimiento: [null as Date | null],
      sn_excenta: ['N'],
      snNombreOptions: ['N'],
      efectivo_recibido: [0],
    });
    this.cargarContexto();
  }

  // ═══════════════════════════════════════════════════════════════════
  // CONTEXTO — una sola tanda idempotente (puede correr en ambas pantallas)
  // ═══════════════════════════════════════════════════════════════════

  cargarContexto(): void {
    if (this.contextoCargado) return;
    this.contextoCargado = true;

    this.posService.cargarParametrosImpuesto().subscribe({
      next: (params) => this.parametros.set(params),
      error: () => this.parametros.set({ tasa: TASA_ISV_DEFECTO, precioIncluyeImpuesto: false }),
    });

    this.posService.cargarFormasPago().subscribe({
      next: (formas) => {
        this.formaspago.set(formas);
        if (this.pagos().length === 0) this.inicializarPagos();
      },
    });

    this.posService.cargarTarjetas().subscribe({
      next: (tarjetas) => this.tarjetas.set(tarjetas),
    });

    // Parámetros módulo 3 (Facturación): bodega, caja y si imprime ticket
    this.api.get<any>('/parametros/parametros/objeto?moduloId=3').subscribe({
      next: (p) => {
        const bodega = Number(p?.bodegaId) || null;
        const caja = Number(p?.cajaId) || null;
        if (bodega) this.bodegaId.set(bodega);
        if (caja) this.cajaId.set(caja);
        this.snImprimeFactura = p?.sn_imprimefactura === 'S';
        this.form.patchValue({ bodegaId: this.bodegaId(), cajaId: this.cajaId() }, { emitEvent: false });

        // La caja por defecto: parámetro del módulo 4 (CxC) tiene prioridad
        this.api.get<any>('/parametros/parametros/objeto?moduloId=4').subscribe({
          next: (p4) => {
            const c4 = Number(p4?.cajaId) || null;
            if (c4) {
              this.cajaId.set(c4);
              this.form.patchValue({ cajaId: c4 }, { emitEvent: false });
            }
            // Días de grazo de crédito para facturas a crédito
            const dias = Number(p4?.diasPlazo ?? 0);
            const v = new Date();
            v.setDate(v.getDate() + dias);
            this.form.patchValue({ diascredito: dias, fechavencimiento: v }, { emitEvent: false });
          },
        });
      },
    });

    this.api.get<any[]>('/contabilidad/factordecambio').subscribe({
      next: (items) => {
        const lista = items ?? [];
        const enDolares = lista.find((i) => (i.tipomoneda ?? 'D') === 'D') ?? lista[0];
        if (enDolares) {
          const factor = Number(enDolares.precioventa) || Number(enDolares.preciocompra) || 0;
          this.factordecambio.set(factor);
          this.form.patchValue({ factordecambio: factor }, { emitEvent: false });
        }
      },
    });

    // Clientes: opciones del select + cliente TIENDA
    this.api.get<any>('/cxc/clientes').subscribe({
      next: (res) => {
        this.clientesArray = res?.data ?? (Array.isArray(res) ? res : []);
        this.clienteTienda.set(
          this.clientesArray.find(
            (c: any) => (c?.nrocliente ?? '').toUpperCase() === 'TIENDA',
          ) ?? null,
        );
        this.clientes.set(
          this.clientesArray.map((c: any) => ({
            label: `${c.nrocliente ?? ''} - ${c.nombres ?? ''} ${c.apellidos ?? ''}`.trim(),
            value: c.clienteId as number,
          })),
        );
        // En contado el select queda con TIENDA seleccionado
        const tienda = this.clienteTienda();
        if (tienda && this.form.get('tipofactura')?.value === 'E') {
          this.form.patchValue(
            { clienteId: tienda.clienteId, nrocliente: tienda.nrocliente ?? 'TIENDA' },
            { emitEvent: false },
          );
        }
      },
    });

    // Gestores de ventas (módulo 3) — precarga el del usuario actual
    const usuarioId = this.auth.currentUser()?.usuarioId ?? null;
    this.api.get<any[]>('/parametros/gestores').subscribe({
      next: (items) => {
        const ventas = (items ?? []).filter(
          (g) => Number(g.moduloId) === 3 && g.sn_activo !== 'N' && !!g.nombre,
        );
        this.gestores.set(
          ventas.map((g) => ({ label: String(g.nombre), value: Number(g.gestorId) })),
        );
        const propio = usuarioId ? ventas.find((g) => Number(g.usuarioId) === usuarioId) : null;
        this.form.patchValue({ gestorId: propio ? Number(propio.gestorId) : null }, { emitEvent: false });
      },
      error: () => this.gestores.set([]),
    });

    // Descuentos globales (catálogo + porcentajes + acumulables)
    this.api.get<any>('/facturacion/descuentos').subscribe({
      next: (res) => {
        const items = res?.value ?? res ?? [];
        this.descuentosMap.clear();
        this.descAcumulables.clear();
        for (const d of items) {
          this.descuentosMap.set(d.descuentoId, Number(d.porcentaje) || 0);
          const desc = (d.descripcion ?? '').toLowerCase();
          if (desc.includes('tercera') || desc.includes('vejez') || desc.includes('adulto mayor')) {
            this.descAcumulables.add(d.descuentoId);
          }
        }
        this.descuentos.set(
          (items as any[])
            .filter((d) => d.sn_activo === 'S')
            .map((d) => ({ label: d.descripcion, value: d.descuentoId })),
        );
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // CARRITO
  // ═══════════════════════════════════════════════════════════════════

  agregarProducto(producto: TarjetaProducto): ResultadoAgregar {
    if (producto.estado === 'AGOTADO' || producto.existencia <= 0) return 'agotado';

    const existentes = this.filas().filter((f) => f.productoId === producto.productoId);
    const cantidadActual = existentes.reduce((s, f) => s + f.cantidad, 0);

    if (existentes.length > 0) {
      if (cantidadActual + 1 > producto.existencia) return 'max-existencia';
      this.filas.update((filas) =>
        filas.map((f) => {
          if (f.productoId !== producto.productoId || f !== existentes[0]) return f;
          return this.recalcularLinea({ ...f, cantidad: f.cantidad + 1 });
        }),
      );
    } else {
      if (1 > producto.existencia) return 'sin-existencia';
      this.contadorFila++;
      const nueva: LineaPos = {
        fila: this.contadorFila,
        productoId: producto.productoId,
        codbarra: producto.codbarra,
        descripcion: producto.descripcion,
        imagenUrl: producto.imagenUrl,
        precio: producto.precio,
        cantidad: 1,
        descuentoPct: producto.ofertaPct ?? 0,
        ofertaPct: producto.ofertaPct ?? 0,
        impuesto: 0,
        impuestoExcento: 0,
        subTotal: 0,
        existencia: producto.existencia,
        estado: producto.estado,
      };
      this.filas.update((f) => [...f, this.recalcularLinea(nueva)]);
    }
    return 'ok';
  }

  cambiarCantidad(fila: LineaPos, cantidad: number | undefined | null): 'ok' | 'max-existencia' {
    const cant = Math.max(0, Math.floor(aNumero(cantidad)));
    if (cant <= 0) {
      this.eliminarLinea(fila);
      return 'ok';
    }
    if (cant > fila.existencia) {
      this.filas.update((filas) =>
        filas.map((f) =>
          f.fila === fila.fila
            ? this.recalcularLinea({ ...f, cantidad: fila.existencia })
            : f,
        ),
      );
      return 'max-existencia';
    }
    this.filas.update((filas) =>
      filas.map((f) => (f.fila === fila.fila ? this.recalcularLinea({ ...f, cantidad: cant }) : f)),
    );
    return 'ok';
  }

  eliminarLinea(fila: LineaPos): void {
    this.filas.update((filas) => filas.filter((f) => f.fila !== fila.fila));
  }

  vaciarCarrito(): boolean {
    if (this.filas().length === 0) return false;
    this.filas.set([]);
    this.contadorFila = 0;
    this.descuentoGlobalId.set(null);
    return true;
  }

  private recalcularLinea(linea: LineaPos): LineaPos {
    const exenta = this.form.get('sn_excenta')?.value === 'S';
    const { impuesto, impuestoExcento, subTotal } = calcularLinea(
      linea.cantidad,
      linea.precio,
      linea.descuentoPct,
      this.parametros(),
      exenta,
    );
    return { ...linea, impuesto, impuestoExcento, subTotal };
  }

  // ═══════════════════════════════════════════════════════════════════
  // DESCUENTO GLOBAL Y EXENTA (recalculan las líneas del carrito)
  // ═══════════════════════════════════════════════════════════════════

  aplicarDescuentoGlobal(id: number | null): void {
    this.descuentoGlobalId.set(id);
    const pct = id != null ? (this.descuentosMap.get(id) ?? 0) : 0;
    const acumulable = id != null && this.descAcumulables.has(id);
    this.filas.update((filas) =>
      filas.map((f) => {
        let nuevo: number;
        if (f.ofertaPct > 0) {
          // El producto ya tiene promo: solo se suma si el descuento es acumulable
          nuevo = acumulable ? f.ofertaPct + pct : f.ofertaPct;
        } else {
          nuevo = pct;
        }
        if (nuevo === f.descuentoPct) return f;
        return this.recalcularLinea({ ...f, descuentoPct: nuevo });
      }),
    );
  }

  /**
   * Alterna exenta de ISV: ajusta validadores de la constancia y recalcula
   * todas las líneas (ISV cobrado = 0, ISV dejado de cobrar en importe_excento).
   */
  recalcularExenta(): void {
    const exenta = this.form.get('sn_excenta')?.value === 'S';
    const ctrl = this.form.get('nroconstancia')!;
    const tipoCtrl = this.form.get('tipoconstancia')!;
    if (exenta) {
      ctrl.setValidators([Validators.required]);
      tipoCtrl.setValidators([Validators.required]);
    } else {
      ctrl.clearValidators();
      ctrl.setValue('');
      tipoCtrl.clearValidators();
      tipoCtrl.setValue('FNE');
    }
    ctrl.updateValueAndValidity();
    tipoCtrl.updateValueAndValidity();
    this.filas.update((filas) => filas.map((f) => this.recalcularLinea(f)));
  }

  // ═══════════════════════════════════════════════════════════════════
  // FORMAS DE PAGO
  // ═══════════════════════════════════════════════════════════════════

  inicializarPagos(): void {
    const pagosInit: FilaCobro[] = this.formaspago().map((fp) => ({
      formapagoId: fp.value as number,
      tarjetacreditoId: null,
      nrotarjeta: '',
      nroautorizacion: '',
      importe: undefined,
    }));
    this.pagos.set(pagosInit);
  }

  agregarPago(): void {
    this.pagos.update((p) => [
      ...p,
      { formapagoId: null, tarjetacreditoId: null, nrotarjeta: '', nroautorizacion: '', importe: undefined },
    ]);
  }

  quitarPago(idx: number): void {
    this.pagos.update((p) => p.filter((_, i) => i !== idx));
  }

  /** Métodos (no computeds): ngModel muta los objetos in-place en zoneless */
  pagosConImporte(): FilaCobro[] {
    return this.pagos().filter((p) => (Number(p.importe) || 0) > 0);
  }

  totalPagos(): number {
    return this.pagosConImporte().reduce((sum, p) => sum + (Number(p.importe) || 0), 0);
  }

  pendiente(): number {
    return Math.max(0, this.totales().total - this.totalPagos());
  }

  cambioTotal(): number {
    return Math.max(0, this.totalPagos() - this.totales().total);
  }

  esTarjeta(pago: FilaCobro): boolean {
    const fp = this.formaspago().find((f) => f.value === pago.formapagoId);
    return fp?.label?.toLowerCase().includes('tarjeta') ?? false;
  }

  esTransferencia(pago: FilaCobro): boolean {
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

  // ═══════════════════════════════════════════════════════════════════
  // FACTURA — helpers compartidos con la pantalla 2
  // ═══════════════════════════════════════════════════════════════════

  esContado(): boolean {
    return this.form.get('tipofactura')?.value === 'E';
  }

  onTipoFacturaChange(): void {
    const esContado = this.esContado();
    if (esContado) {
      const tienda = this.clienteTienda();
      if (tienda) {
        this.form.patchValue(
          { clienteId: tienda.clienteId, nrocliente: tienda.nrocliente ?? 'TIENDA' },
          { emitEvent: false },
        );
      }
      this.form.patchValue({ rtn_cliente: '' }, { emitEvent: false });
    } else {
      this.form.patchValue({ clienteId: null, nrocliente: '', rtn_cliente: '' }, { emitEvent: false });
      this.nombreClienteManual.set('');
    }
  }

  onClienteChange(): void {
    const clienteId = this.form.get('clienteId')?.value;
    const c = this.clientesArray.find((i) => i.clienteId === clienteId);
    if (c) {
      this.form.patchValue(
        {
          nrocliente: c.nrocliente ?? '',
          rtn_cliente: this.esContado() ? '' : (c.rtn ?? ''),
        },
        { emitEvent: false },
      );
    }
  }

  /** Limpia carrito, pagos, formulario y descuentos tras facturar */
  limpiarVenta(): void {
    const bodegaId = this.bodegaId();
    const cajaId = this.cajaId();
    const gestorId = this.form.get('gestorId')?.value;
    const factordecambio = this.factordecambio();

    this.filas.set([]);
    this.contadorFila = 0;
    this.descuentoGlobalId.set(null);
    this.nombreClienteManual.set('');
    this.form.reset({
      tipofactura: 'E',
      snNombreOptions: 'N',
      sn_excenta: 'N',
      tipoconstancia: 'FNE',
      nroconstancia: '',
      factordecambio,
      diascredito: this.form.get('diascredito')?.value ?? 0,
      fechavencimiento: this.form.get('fechavencimiento')?.value ?? null,
      efectivo_recibido: 0,
      bodegaId,
      cajaId,
      gestorId,
    }, { emitEvent: false });
    this.onTipoFacturaChange();
    this.inicializarPagos();
  }

  /** Redondeo monetario reutilizado por los componentes */
  redondear(valor: number): number {
    return redondear(valor);
  }

  /** Clasifica stock — reexportado para el template del catálogo */
  estadoStock(existencia: number, stockMinimo = 0): EstadoStock {
    return estadoStock(existencia, stockMinimo);
  }
}
