import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DrawerModule } from 'primeng/drawer';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { TooltipModule } from 'primeng/tooltip';
import { TiendaService } from '../../../core/services/tienda.service';
import { ProductoTienda } from '../../../core/models/tienda.models';
import { RestauranteService } from '../../../core/services/restaurante.service';
import { FacturaImpresionService } from '../../../core/services/factura-impresion.service';
import { ApiService } from '../../../core/services/api.service';
import { FORMAPAGO_TODOPAGO } from '../../../core/services/todopago.service';
import { ConfigISV, MesaVista, NUM_MESAS, OrdenItem, OrdenRestaurante, PagoOrden } from '../../../core/models/restaurante.models';

/** Productos sin existencia no se pueden agregar. Ponlo en false si los platos preparados no llevan kardex. */
const VALIDAR_EXISTENCIA = true;

/**
 * Pantalla de restaurante — 3 columnas: productos 55% | mesas 20% | orden 25%.
 * Las dos últimas viven dentro de un p-drawer fijo a la derecha (45% del ancho)
 * y, en pantallas angostas, el drawer pasa a ser un panel completo que se abre
 * con el botón flotante.
 */
@Component({
  selector: 'app-restaurante',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, DialogModule, DrawerModule,
    InputNumberModule, InputTextModule, SelectModule, TableModule,
    TagModule, ToastModule, ToggleButtonModule, TooltipModule,
  ],
  templateUrl: './restaurante.html',
  styleUrl: './restaurante.scss',
})
export class Restaurante implements OnInit {
  private srv = inject(RestauranteService);
  private tienda = inject(TiendaService);
  private api = inject(ApiService);
  private msg = inject(MessageService);
  private impresion = inject(FacturaImpresionService);
  private destroyRef = inject(DestroyRef);

  readonly mesasNumeros = Array.from({ length: NUM_MESAS }, (_, i) => i + 1);

  // ── Productos (columna 1) ──
  productos = signal<ProductoTienda[]>([]);
  cargandoProductos = signal(true);
  categoriaActiva = signal<string | null>(null);
  busqueda = signal('');

  categoriasLista = computed(() => {
    const base = ['Ron', 'Gaseosa', 'Cervezas', 'Platillos', 'Ensaladas', 'Whiski', 'Carnes', 'Sopas'];
    const dinamicas = this.productos().map((p) => p.categoria).filter(Boolean) as string[];
    const set = new Set([...base, ...dinamicas]);
    return Array.from(set);
  });

  productosFiltrados = computed(() => {
    const cat = this.categoriaActiva();
    const q = this.busqueda().trim().toLowerCase();
    const lista = this.productos();

    if (q) {
      return lista.filter((p) => {
        const matchCod = (p.codbarra || '').toLowerCase().includes(q);
        const matchDesc = (p.descripcion || '').toLowerCase().includes(q);
        return matchCod || matchDesc;
      });
    }

    return cat ? lista.filter((p) => p.categoria === cat) : lista;
  });

  buscarProducto() {
    // Reactivo con signal busqueda
  }

  private productoPorId = computed(() => new Map(this.productos().map((p) => [Number(p.produtoId), p])));

  // ── Órdenes y mesas (columna 2) ──
  ordenes = signal<OrdenRestaurante[]>([]);
  ordenActivaId = signal<number | null>(null);
  /** Mesa libre elegida por el usuario; la orden se crea SOLO después de elegir mesa. */
  mesaSeleccionada = signal<number | null>(null);
  ocupado = signal(false);
  ahora = signal(Date.now());

  ordenActiva = computed(() => this.ordenes().find((o) => o.pospedmaeId === this.ordenActivaId()) ?? null);

  mesas = computed<MesaVista[]>(() => {
    const porMesa = new Map(
      this.ordenes()
        .filter((o) => (o.nromesa ?? 0) >= 1)
        .map((o) => [o.nromesa as number, o]),
    );
    return this.mesasNumeros.map((nro) => ({ nro, orden: porMesa.get(nro) ?? null }));
  });

  /** Órdenes abiertas de hoy, mesa más baja primero. */
  pedidos = computed(() => [...this.ordenes()].sort((a, b) => (a.nromesa ?? 0) - (b.nromesa ?? 0)));

  // ── Detalle de la orden (columna 3) ──
  items = signal<OrdenItem[]>([]);
  cantidadPorProducto = computed(() => {
    const m = new Map<number, number>();
    for (const i of this.items()) m.set(i.productoId, (m.get(i.productoId) ?? 0) + i.cantidad);
    return m;
  });

  // ── Drawer / responsive ──
  drawerVisible = signal(true);
  estrecha = signal(false);
  totalItemsOrden = computed(() => this.items().reduce((s, i) => s + i.cantidad, 0));

  /** Config de ISV (tasa, precio con ISV incluido) y sn_imprimefactura (param-fac módulo 3) */
  isv = signal<ConfigISV>({ tasa: 0, incluido: false, snImprimeFactura: false });

  // ── Cobro (tabla de múltiples pagos, igual que Nueva Factura / Pedidos) ──
  dialogPago = signal(false);
  formasPago = signal<{ label: string; value: number }[]>([]);
  tarjetasCredito = signal<{ label: string; value: number }[]>([]);
  pagos = signal<PagoOrden[]>([]);

  ngOnInit() {
    this.configurarResponsive();
    this.srv.cargarISV().subscribe((cfg) => this.isv.set(cfg));
    this.cargarProductos();
    this.cargarOrdenes();
    this.srv.getFormasPago().subscribe((f) => this.formasPago.set(f));
    this.api.get<{ tarjetacreditoId: number; descripcion: string }[]>('/parametros/tarjetas-credito').subscribe({
      next: (data) =>
        this.tarjetasCredito.set(
          (data ?? []).map((t) => ({ label: t.descripcion, value: t.tarjetacreditoId })),
        ),
    });

    // Refresca el "hace X min" de la lista de entregas pendientes
    const timer = setInterval(() => this.ahora.set(Date.now()), 30_000);
    this.destroyRef.onDestroy(() => clearInterval(timer));
  }

  // ───────────────────────── Carga ─────────────────────────

  private cargarProductos() {
    this.tienda.getProductos(true).subscribe({
      next: (p) => {
        const lista = (p ?? []).filter((prod) => prod.tipo_giro === 'R');
        this.productos.set(lista);
        this.cargandoProductos.set(false);
      },
      error: () => {
        this.cargandoProductos.set(false);
        this.error('No se pudieron cargar los productos');
      },
    });
  }

  private cargarOrdenes() {
    this.srv.getOrdenesAbiertas().subscribe({
      next: (lista) => this.ordenes.set(lista),
      error: () => this.error('No se pudieron cargar las órdenes abiertas'),
    });
  }

  private configurarResponsive() {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 992px)');
    const aplicar = (angosta: boolean) => {
      this.estrecha.set(angosta);
      this.drawerVisible.set(!angosta); // ancho: siempre visible; angosto: se abre con el botón flotante
    };
    aplicar(mq.matches);
    const handler = (e: MediaQueryListEvent) => aplicar(e.matches);
    mq.addEventListener('change', handler);
    this.destroyRef.onDestroy(() => mq.removeEventListener('change', handler));
  }

  // ───────────────────────── Flujo de la orden ─────────────────────────

  /**
   * La orden solo nace DESPUÉS de elegir mesa libre: se crea con nromesa >= 1,
   * así nunca quedan pedidos "huérfanos" con mesa 0 (y la mesa sale verde ya).
   */
  nuevaOrden() {
    if (this.ocupado()) return;
    const nromesa = this.mesaSeleccionada();
    if (nromesa == null) {
      this.msg.add({
        severity: 'info',
        summary: 'Elija una mesa',
        detail: 'Primero seleccione una mesa libre y luego pulse "Nueva orden".',
      });
      return;
    }
    this.ocupado.set(true);
    this.srv.crearOrden(nromesa).subscribe({
      next: (o) => {
        this.ordenes.update((l) => [...l, o]);
        this.ordenActivaId.set(o.pospedmaeId);
        this.mesaSeleccionada.set(null);
        this.items.set([]);
        this.ocupado.set(false);
        this.msg.add({ severity: 'success', summary: `Mesa ${nromesa}`, detail: `Orden #${o.pospedmaeId} abierta.` });
      },
      error: (e) => this.fallo(e, 'No se pudo crear la orden'),
    });
  }

  /**
   * Venta libre: pedido SIN mesa (nromesa = 0) para locales con concepto mixto
   * tienda/restaurante. Cada pulso abre un pedido nuevo (tickets paralelos en
   * la lista "Pedidos"); si la orden activa ya es una venta libre SIN productos
   * no se crea otra (evita duplicados por doble clic).
   */
  ventaLibre() {
    if (this.ocupado()) return;

    const actual = this.ordenActiva();
    if (actual && (actual.nromesa ?? 0) < 1 && this.items().length === 0) {
      this.msg.add({
        severity: 'info',
        summary: `Venta libre #${actual.pospedmaeId}`,
        detail: 'Ya hay una venta libre abierta y sin productos.',
      });
      return;
    }

    this.ocupado.set(true);
    this.srv.crearOrden(0).subscribe({
      next: (o) => {
        this.ordenes.update((l) => [...l, o]);
        this.ordenActivaId.set(o.pospedmaeId);
        this.mesaSeleccionada.set(null);
        this.items.set([]);
        this.ocupado.set(false);
        this.msg.add({
          severity: 'success',
          summary: 'Venta libre',
          detail: `Pedido #${o.pospedmaeId} abierto sin mesa.`,
        });
      },
      error: (e) => this.fallo(e, 'No se pudo abrir la venta libre'),
    });
  }

  /** Etiqueta de cabecera/lista: 'Mesa 3' para mesas, 'Venta libre' sin mesa. */
  etiquetaMesa(o: OrdenRestaurante): string {
    return (o.nromesa ?? 0) >= 1 ? `Mesa ${o.nromesa}` : 'Venta libre';
  }

  /** Mesa con orden → abrir su orden. Mesa libre → seleccionarla (para "Nueva orden"). */
  clickMesa(mesa: MesaVista) {
    if (this.ocupado()) return;
    if (mesa.orden) {
      this.mesaSeleccionada.set(null);
      this.seleccionarOrden(mesa.orden.pospedmaeId);
      return;
    }
    this.mesaSeleccionada.set(this.mesaSeleccionada() === mesa.nro ? null : mesa.nro);
  }

  seleccionarOrden(id: number) {
    this.ordenActivaId.set(id);
    this.items.set([]);
    this.srv.getItems(id).subscribe({
      next: (lista) => this.items.set(lista),
      error: () => this.error('No se pudo cargar la orden'),
    });
  }

  cancelarOrdenVacia() {
    const o = this.ordenActiva();
    if (!o || this.items().length || this.ocupado()) return;
    this.ocupado.set(true);
    this.srv.cancelarOrden(o.pospedmaeId).subscribe({
      next: () => {
        this.ordenes.update((l) => l.filter((x) => x.pospedmaeId !== o.pospedmaeId));
        this.ordenActivaId.set(null);
        this.ocupado.set(false);
      },
      error: (e) => this.fallo(e, 'No se pudo cancelar la orden'),
    });
  }

  // ───────────────────────── Líneas ─────────────────────────

  agregarProducto(p: ProductoTienda) {
    const orden = this.ordenActiva();
    if (!orden) {
      this.msg.add({
        severity: 'warn',
        summary: 'Sin orden',
        detail: 'Cree una orden ("Nueva orden" en una mesa, o "Venta libre").',
      });
      return;
    }
    if (this.ocupado()) return;

    const existente = this.items().find((i) => i.productoId === Number(p.produtoId));
    const nuevaCantidad = (existente?.cantidad ?? 0) + 1;
    if (VALIDAR_EXISTENCIA && nuevaCantidad > Number(p.existencia)) {
      this.msg.add({ severity: 'warn', summary: 'Sin existencia', detail: `${p.descripcion}: solo hay ${p.existencia}.` });
      return;
    }

    this.ocupado.set(true);
    const peticion = existente
      ? this.srv.cambiarCantidad(existente, nuevaCantidad)
      : this.srv.agregarItem(
          orden.pospedmaeId,
          { productoId: Number(p.produtoId), codbarra: p.codbarra ?? '', precio: Number(p.precioventa) },
          Math.max(0, ...this.items().map((i) => i.nrofila)) + 1,
        );
    peticion.subscribe({
      next: () => this.refrescarActiva(),
      error: (e) => this.fallo(e, 'No se pudo agregar el producto'),
    });
  }

  incrementar(item: OrdenItem) {
    const p = this.productoPorId().get(item.productoId);
    if (VALIDAR_EXISTENCIA && p && item.cantidad + 1 > Number(p.existencia)) {
      this.msg.add({ severity: 'warn', summary: 'Sin existencia', detail: `Solo hay ${p.existencia}.` });
      return;
    }
    this.mutarItem(this.srv.cambiarCantidad(item, item.cantidad + 1));
  }

  decrementar(item: OrdenItem) {
    if (item.cantidad <= 1) return this.quitar(item);
    this.mutarItem(this.srv.cambiarCantidad(item, item.cantidad - 1));
  }

  quitar(item: OrdenItem) {
    this.mutarItem(this.srv.quitarItem(item));
  }

  /**
   * Entrega por ítem (toggle del mesero): el backend guarda el estado de la línea
   * y sincroniza la cabecera — la orden queda 'entregada' sola con el último ítem.
   */
  toggleEntregado(item: OrdenItem, entregado: boolean) {
    this.mutarItem(this.srv.setItemEntregado(item, entregado));
  }

  private mutarItem(peticion: ReturnType<RestauranteService['quitarItem']>) {
    if (this.ocupado()) return;
    this.ocupado.set(true);
    peticion.subscribe({
      next: () => this.refrescarActiva(),
      error: (e) => this.fallo(e, 'No se pudo actualizar la orden'),
    });
  }

  /** El backend recalcula los totales; la pantalla siempre muestra lo que quedó guardado. */
  private refrescarActiva() {
    const id = this.ordenActivaId();
    if (id == null) return this.ocupado.set(false);
    forkJoin({ orden: this.srv.getOrden(id), items: this.srv.getItems(id) }).subscribe({
      next: ({ orden, items }) => {
        this.reemplazarOrden(orden);
        this.items.set(items);
        this.ocupado.set(false);
      },
      error: (e) => this.fallo(e, 'No se pudo refrescar la orden'),
    });
  }

  private reemplazarOrden(o: OrdenRestaurante) {
    this.ordenes.update((l) => l.map((x) => (x.pospedmaeId === o.pospedmaeId ? { ...x, ...o } : x)));
  }

  // ───────────────────────── Cobro ─────────────────────────

  abrirPago() {
    if (!this.items().length) {
      this.msg.add({ severity: 'warn', summary: 'Orden vacía', detail: 'Agregue productos antes de cobrar.' });
      return;
    }
    this.inicializarPagos();
    this.dialogPago.set(true);
  }

  // ── Tabla de pagos (misma estructura que Nueva Factura / Pedidos) ──

  /** Una fila por cada forma de pago del catálogo (efectivo, tarjeta, transferencia, todopago…) */
  inicializarPagos() {
    this.pagos.set(
      this.formasPago().map((fp) => ({
        formapagoId: fp.value,
        tarjetacreditoId: null,
        nrotarjeta: '',
        nroautorizacion: '',
        importe: 0,
        esEfectivo: this.esEfectivoLabel(fp.label),
      })),
    );
  }

  agregarPago() {
    this.pagos.update((p) => [
      ...p,
      { formapagoId: null, tarjetacreditoId: null, nrotarjeta: '', nroautorizacion: '', importe: 0, esEfectivo: false },
    ]);
  }

  quitarPago(idx: number) {
    this.pagos.update((p) => p.filter((_, i) => i !== idx));
  }

  pagosConImporte(): PagoOrden[] {
    return this.pagos().filter((p) => (Number(p.importe) || 0) > 0);
  }

  /** Total de la orden activa */
  totalOrden(): number {
    return this.ordenActiva()?.total ?? 0;
  }

  totalPagos(): number {
    return this.pagosConImporte().reduce((sum, p) => sum + (Number(p.importe) || 0), 0);
  }

  cambioTotal(): number {
    return Math.max(0, Math.round((this.totalPagos() - this.totalOrden()) * 100) / 100);
  }

  pendiente(): number {
    return Math.max(0, Math.round((this.totalOrden() - this.totalPagos()) * 100) / 100);
  }

  esTarjeta(pago: PagoOrden): boolean {
    const fp = this.formasPago().find((f) => f.value === pago.formapagoId);
    return fp?.label?.toLowerCase().includes('tarjeta') ?? false;
  }

  esTransferencia(pago: PagoOrden): boolean {
    const fp = this.formasPago().find((f) => f.value === pago.formapagoId);
    return fp?.label?.toLowerCase().includes('transferencia') ?? false;
  }

  esEfectivoLabel(label: string): boolean {
    return (label ?? '').toLowerCase().includes('efectivo');
  }

  private esEfectivoFila(p: PagoOrden): boolean {
    const fp = this.formasPago().find((f) => f.value === p.formapagoId);
    return this.esEfectivoLabel(fp?.label ?? '');
  }

  validarLuhn(numero: string): boolean {
    const digits = (numero || '').replace(/\D/g, '');
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

  /**
   * Al cambiar la forma de pago: limpia los campos que no aplican y, si es
   * TodoPago, auto-asigna el importe pendiente (mismo flujo que Pedidos).
   */
  onFormaPagoChange(pago: PagoOrden): void {
    pago.esEfectivo = this.esEfectivoFila(pago);
    if (pago.esEfectivo) {
      pago.tarjetacreditoId = null;
      pago.nrotarjeta = '';
      pago.nroautorizacion = '';
    }
    if (pago.formapagoId !== FORMAPAGO_TODOPAGO) return;
    const otros = this.pagosConImporte()
      .filter((p) => p !== pago && p.formapagoId !== FORMAPAGO_TODOPAGO)
      .reduce((s, p) => s + (Number(p.importe) || 0), 0);
    const pend = Math.round((this.totalOrden() - otros) * 100) / 100;
    if (pend > 0) pago.importe = pend;
  }

  /**
   * Validación de la tabla de pagos — DEBE ser método y NO computed(): las filas
   * son objetos planos ligados con ngModel y un computed() se congelaría en false.
   */
  formularioPagoValido(): boolean {
    const total = this.totalOrden();
    if (total <= 0) return false;
    const pagos = this.pagosConImporte();
    if (pagos.length === 0) return false;
    for (const p of pagos) {
      if (p.formapagoId == null) return false;
      if (this.esTarjeta(p)) {
        const num = (p.nrotarjeta || '').replace(/\s/g, '');
        if (!(num.length >= 13 && this.validarLuhn(num) && p.tarjetacreditoId)) return false;
      }
      if (this.esTransferencia(p) && !p.nroautorizacion?.trim()) return false;
    }
    return this.totalPagos() >= total;
  }

  confirmarPago() {
    const orden = this.ordenActiva();
    if (!orden || this.ocupado()) return;

    const pagos = this.pagosConImporte();
    if (pagos.length === 0) {
      this.msg.add({ severity: 'warn', summary: 'Validación', detail: 'Ingrese importe en las formas de pago' });
      return;
    }
    for (const p of pagos) {
      if (p.formapagoId == null) {
        this.msg.add({ severity: 'warn', summary: 'Validación', detail: 'Seleccione la forma de pago' });
        return;
      }
      if (this.esTarjeta(p)) {
        const num = (p.nrotarjeta || '').replace(/\s/g, '');
        if (num.length < 13) {
          this.msg.add({ severity: 'warn', summary: 'Validación', detail: 'El número de tarjeta debe tener al menos 13 dígitos' });
          return;
        }
        if (!this.validarLuhn(num)) {
          this.msg.add({ severity: 'warn', summary: 'Validación', detail: 'El número de tarjeta no es válido' });
          return;
        }
        if (!p.tarjetacreditoId) {
          this.msg.add({ severity: 'warn', summary: 'Validación', detail: 'Seleccione el tipo de tarjeta' });
          return;
        }
        if (!p.nroautorizacion?.trim()) {
          this.msg.add({ severity: 'warn', summary: 'Validación', detail: 'Ingrese el número de autorización de la tarjeta' });
          return;
        }
      }
      if (this.esTransferencia(p) && !p.nroautorizacion?.trim()) {
        this.msg.add({ severity: 'warn', summary: 'Validación', detail: 'Ingrese el número de autorización de la transferencia' });
        return;
      }
    }
    const total = this.totalOrden();
    if (this.totalPagos() < total) {
      this.msg.add({
        severity: 'error',
        summary: 'Validación',
        detail: `La orden debe pagarse en su totalidad. Falta por pagar: ${this.moneda(total - this.totalPagos())}`,
      });
      return;
    }

    const pagosEnviar = pagos.map((p) => ({ ...p, esEfectivo: this.esEfectivoFila(p) }));

    this.ocupado.set(true);
    this.srv.facturar(orden, pagosEnviar).subscribe({
      next: (f) => {
        // La orden ya está facturada: la mesa vuelve a quedar libre
        this.ordenes.update((l) => l.filter((x) => x.pospedmaeId !== orden.pospedmaeId));
        this.ordenActivaId.set(null);
        this.items.set([]);
        this.dialogPago.set(false);
        this.ocupado.set(false);
        this.msg.add({
          severity: f.conLink ? 'info' : 'success',
          summary: `Factura #${f.nrofactura}`,
          detail: f.conLink
            ? `${this.etiquetaMesa(orden)}: pago TodoPago pendiente de confirmación`
            : `${this.etiquetaMesa(orden)} cobrada: ${this.moneda(f.total)} (${pagosEnviar.length} pago(s))`,
        });
        // Ticket solo si ttipoparametros (módulo 3).sn_imprimefactura = 'S':
        // mismo motor que Nueva Factura (GET /facturas/:id/ticket +
        // FacturaImpresionService, formato TICKET/CARTA desde timpresoras).
        // Si el parámetro no está en 'S', no se imprime nada en pantalla.
        if (this.isv().snImprimeFactura && f.facturaId) {
          this.imprimirTicket(f.facturaId);
        }
      },
      error: (e) => {
        this.ocupado.set(false);
        this.fallo(e, 'No se pudo facturar la orden');
      },
    });
  }

  /**
   * Ticket de la factura cobrada — misma carga y mismo motor que Nueva Factura
   * (nueva-factura.ts → imprimirTicket): GET del ticket + FacturaImpresionService.
   */
  private imprimirTicket(facturaId: number) {
    this.api
      .get<any>(`/facturacion/facturas/${facturaId}/ticket`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) =>
          this.impresion.imprimir(data).catch(() => {
        this.cargarProductos();
        this.msg.add({
              severity: 'warn',
              summary: 'Impresión',
              detail: 'No se pudo imprimir la factura',
            });
          }),
        error: () => {
          this.msg.add({
            severity: 'warn',
            summary: 'Impresión',
            detail: 'No se pudieron cargar los datos del ticket',
          });
        },
      });
  }

  // ───────────────────────── Helpers de vista ─────────────────────────

  /** Clases del botón redondo de cada mesa: libre (gris), con orden (verde), seleccionada. */
  claseMesa(m: MesaVista): string {
    const c = ['mesa-btn'];
    if (m.orden) {
      c.push('mesa-ocupada');
      if (m.orden.pospedmaeId === this.ordenActivaId()) c.push('mesa-activa');
    } else if (this.mesaSeleccionada() === m.nro) {
      c.push('mesa-seleccionada');
    }
    return c.join(' ');
  }

  tituloMesa(m: MesaVista): string {
    if (m.orden) return `Mesa ${m.nro} · Orden #${m.orden.pospedmaeId}`;
    return this.mesaSeleccionada() === m.nro ? `Mesa ${m.nro} seleccionada` : `Mesa ${m.nro} libre`;
  }

  /** Total de la línea: si el precio ya incluye ISV, el bruto es el total; si no, se suma el ISV. */
  totalLinea(item: OrdenItem): number {
    return this.isv().incluido ? item.subtotal : item.subtotal + item.impuesto;
  }

  minutos(o: OrdenRestaurante): number {
    const t = Date.parse(o.fecharegistro);
    return Number.isNaN(t) ? 0 : Math.max(0, Math.floor((this.ahora() - t) / 60000));
  }

  infoItem(item: OrdenItem) {
    const p = this.productoPorId().get(item.productoId);
    return { nombre: p?.descripcion || p?.codbarra || `Producto #${item.productoId}`, imagen: this.resolverImagen(p?.imagen ?? null) };
  }

  resolverImagen(imagen: string | null): string {
    if (!imagen) return '';
    return /^data:/i.test(imagen) ? imagen : `data:image/png;base64,${imagen}`;
  }

  formatearPrecio(n: number | string): string {
    return `L ${Number(n).toFixed(2)}`;
  }

  /** Moneda local con locale es-HN — mismo formato que Nueva Factura */
  moneda(n: number | undefined): string {
    return (n ?? 0).toLocaleString('es-HN', { style: 'currency', currency: 'HNL' });
  }

  private error(detalle: string) {
    this.msg.add({ severity: 'error', summary: 'Error', detail: detalle });
  }

  private fallo(e: any, detalle: string) {
    this.ocupado.set(false);
    this.error(e?.error?.message && typeof e.error.message === 'string' ? e.error.message : detalle);
  }
}
