import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DrawerModule } from 'primeng/drawer';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { TiendaService } from '../../../core/services/tienda.service';
import { ProductoTienda } from '../../../core/models/tienda.models';
import { RestauranteService } from '../../../core/services/restaurante.service';
import { ConfigISV, MesaVista, NUM_MESAS, OrdenItem, OrdenRestaurante } from '../../../core/models/restaurante.models';

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
    InputNumberModule, SelectModule, TagModule, ToastModule, TooltipModule,
  ],
  templateUrl: './restaurante.html',
  styleUrl: './restaurante.scss',
})
export class Restaurante implements OnInit {
  private srv = inject(RestauranteService);
  private tienda = inject(TiendaService);
  private msg = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  readonly mesasNumeros = Array.from({ length: NUM_MESAS }, (_, i) => i + 1);

  // ── Productos (columna 1) ──
  productos = signal<ProductoTienda[]>([]);
  cargandoProductos = signal(true);
  categoriaActiva = signal<string | null>(null);

  categorias = computed(() => {
    const cats = new Set(this.productos().map((p) => p.categoria).filter(Boolean) as string[]);
    return Array.from(cats);
  });

  productosFiltrados = computed(() => {
    const cat = this.categoriaActiva();
    const lista = this.productos();
    return cat ? lista.filter((p) => p.categoria === cat) : lista;
  });

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

  /** Config de ISV (tasa e indicador de precio con ISV incluido) */
  isv = signal<ConfigISV>({ tasa: 0, incluido: false });

  // ── Cobro ──
  dialogPago = signal(false);
  formasPago = signal<{ label: string; value: number }[]>([]);
  pagoFormapagoId: number | null = null;
  pagoEfectivo: number | null = null;

  ngOnInit() {
    this.configurarResponsive();
    this.srv.cargarISV().subscribe((cfg) => this.isv.set(cfg));
    this.cargarProductos();
    this.cargarOrdenes();
    this.srv.getFormasPago().subscribe((f) => {
      this.formasPago.set(f);
      this.pagoFormapagoId = f[0]?.value ?? null;
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

  marcarEntregada(orden: OrdenRestaurante) {
    if (this.ocupado()) return;
    this.ocupado.set(true);
    this.srv.marcarEntregada(orden.pospedmaeId).subscribe({
      next: () => {
        this.reemplazarOrden({ ...orden, sn_entregado: 'S' });
        this.ocupado.set(false);
        this.msg.add({ severity: 'success', summary: `Mesa ${orden.nromesa}`, detail: 'Pedido entregado.' });
      },
      error: (e) => this.fallo(e, 'No se pudo marcar como entregada'),
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
      this.msg.add({ severity: 'warn', summary: 'Sin orden', detail: 'Cree una orden o elija una mesa ocupada.' });
      return;
    }
    if (!(orden.nromesa >= 1)) {
      this.msg.add({ severity: 'warn', summary: 'Sin mesa', detail: 'La orden no tiene mesa asignada.' });
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
    this.pagoEfectivo = null;
    this.dialogPago.set(true);
  }

  cambio(): number {
    const total = this.ordenActiva()?.total ?? 0;
    return Math.max(0, Math.round(((this.pagoEfectivo ?? 0) - total) * 100) / 100);
  }

  confirmarPago() {
    const orden = this.ordenActiva();
    if (!orden || this.pagoFormapagoId == null || this.ocupado()) return;
    this.ocupado.set(true);
    this.srv
      .facturar(orden, { formapagoId: this.pagoFormapagoId, efectivo_recibido: this.pagoEfectivo ?? undefined })
      .subscribe({
        next: (f) => {
          // La orden ya está facturada: la mesa vuelve a quedar libre
          this.ordenes.update((l) => l.filter((x) => x.pospedmaeId !== orden.pospedmaeId));
          this.ordenActivaId.set(null);
          this.items.set([]);
          this.dialogPago.set(false);
          this.ocupado.set(false);
          this.msg.add({
            severity: 'success',
            summary: `Factura #${f.nrofactura}`,
            detail: `Mesa ${orden.nromesa} cobrada: ${this.formatearPrecio(f.total)}`,
          });
        },
        error: (e) => this.fallo(e, 'No se pudo facturar la orden'),
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

  private error(detalle: string) {
    this.msg.add({ severity: 'error', summary: 'Error', detail: detalle });
  }

  private fallo(e: any, detalle: string) {
    this.ocupado.set(false);
    this.error(e?.error?.message && typeof e.error.message === 'string' ? e.error.message : detalle);
  }
}
