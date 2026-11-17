import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, switchMap } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DynamicDialogModule, DialogService } from 'primeng/dynamicdialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';

import { ApiService } from '../../../core/services/api.service';
import { RestauranteService } from '../../../core/services/restaurante.service';
import { FacturaImpresionService } from '../../../core/services/factura-impresion.service';
import { TiendaService } from '../../../core/services/tienda.service';
import { FORMAPAGO_TODOPAGO } from '../../../core/services/todopago.service';
import { ConfigISV, OrdenItem, OrdenRestaurante, PagoOrden } from '../../../core/models/restaurante.models';
import { ProductoTienda } from '../../../core/models/tienda.models';
import { CAJAS_RESTAURANTE, OrdenMesero, etiquetaPuesto } from '../../../core/models/mesero.models';
import { esBajoDemanda } from '../../../core/utils/stock';
import { ProductosHelperList } from '../../helpers/productos';
import { FooterHelper } from '../../helpers/footer';

/** Caja recordada entre sesiones (se elige al entrar, sección 6 del plan). */
const CLAVE_CAJA = 'rest-caja';
/** La caja central ve TODAS las cuentas; Caja 2 y 3 solo las suyas. */
const CAJA_CENTRAL = CAJAS_RESTAURANTE[0].id;
/** Refresco de la bandeja: 15 s (pausado mientras hay un diálogo abierto). */
const REFRESCO_MS = 15_000;
/** Productos sin existencia no se pueden agregar (mismo criterio que el escritorio). */
const VALIDAR_EXISTENCIA = true;

type Anulacion =
  | { tipo: 'pedido'; orden: OrdenMesero; item?: undefined }
  | { tipo: 'linea'; orden: OrdenMesero; item: OrdenItem };

/**
 * Pantalla de caja del restaurante (fase 2): bandeja de cuentas abiertas por
 * caja, cobro con el diálogo de pagos (múltiples formas, Luhn, TodoPago,
 * ticket) y anulación con motivo. NO modifica la pantalla de escritorio.
 *
 * Reglas (sección 6 del PLAN-MEJORAS):
 *  - Caja central (1) ve todas las cuentas; Caja 2 y 3 solo las suyas (`cajaId`).
 *  - Lista por antigüedad con estado; la cuenta servida se destaca.
 *  - Reasignar a otra caja: solo desde la central.
 *  - Anular línea o cuenta, siempre con motivo (la tabla no tiene columna de
 *    motivo: se informa en el toast; sin DDL nuevo).
 *  - Venta libre siempre disponible: cuenta sin mesa (nromesa 0) para el
 *    concepto mixto tienda/restaurante; la caja es quien agrega los productos.
 */
@Component({
  selector: 'app-restaurante-caja',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    DynamicDialogModule,
    InputNumberModule,
    InputTextModule,
    SelectModule,
    TableModule,
    TagModule,
    TextareaModule,
    TooltipModule,
  ],
  templateUrl: './restaurante-caja.html',
  styleUrls: ['./restaurante-caja.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DialogService],
})
export class RestauranteCaja implements OnInit {
  private srv = inject(RestauranteService);
  private api = inject(ApiService);
  private tienda = inject(TiendaService);
  private msg = inject(MessageService);
  private impresion = inject(FacturaImpresionService);
  private dialogs = inject(DialogService);
  private destroyRef = inject(DestroyRef);

  /** Para el template (prohibido new Date() en la plantilla). */
  readonly etiquetaPuesto = etiquetaPuesto;

  /** Producto solicitado bajo demanda: no exige existencia para agregarlo */
  readonly esBajoDemanda = esBajoDemanda;
  readonly opcionesCaja = CAJAS_RESTAURANTE.map((c) => ({ label: c.nombre, value: c.id }));

  // ── Bandeja ──
  ordenes = signal<OrdenMesero[]>([]);
  cajaSel = signal<number>(this.cajaRecordada());
  nombresGestor = signal<Record<number, string>>({});
  cargando = signal(true);
  actualizadoEn = signal<number | null>(null);
  ocupado = signal(false);

  // ── Catálogo (descripción/precio/existencia de las líneas) ──
  productos = signal<ProductoTienda[]>([]);

  // ── Detalle de la cuenta ──
  dialogDetalle = signal(false);
  ordenSel = signal<OrdenMesero | null>(null);
  items = signal<OrdenItem[]>([]);
  cajaNueva = signal<number | null>(null);

  // ── Cobro ──
  dialogPago = signal(false);
  isv = signal<ConfigISV>({ tasa: 0, incluido: false, snImprimeFactura: false });
  formasPago = signal<{ label: string; value: number }[]>([]);
  tarjetasCredito = signal<{ label: string; value: number }[]>([]);
  pagos = signal<PagoOrden[]>([]);

  // ── Anulación con motivo ──
  dialogAnul = signal(false);
  anul = signal<Anulacion | null>(null);
  motivo = signal('');

  private porProducto = computed(() => new Map(this.productos().map((p) => [Number(p.produtoId), p])));

  /** Cuentas de ESTA caja, ordenadas por antigüedad (más vieja primero). */
  ordenesVista = computed<OrdenMesero[]>(() => {
    const sel = this.cajaSel();
    const lista =
      sel === CAJA_CENTRAL
        ? [...this.ordenes()]
        : this.ordenes().filter((o) => (o.cajaId ?? null) === sel);
    return lista.sort((a, b) => {
      const fa = typeof a.fecharegistro === 'string' ? a.fecharegistro : '';
      const fb = typeof b.fecharegistro === 'string' ? b.fecharegistro : '';
      if (fa !== fb) return fa.localeCompare(fb);
      return a.pospedmaeId - b.pospedmaeId; // mismo día: se creó antes el de menor id
    });
  });

  servidasCount = computed(() => this.ordenesVista().filter((o) => o.sn_entregado === 'S').length);

  ngOnInit(): void {
    this.srv.cargarISV().subscribe((cfg) => this.isv.set(cfg));
    this.cargar();
    this.cargarGestores();
    this.cargarProductos();
    this.srv.getFormasPago().subscribe((f) => this.formasPago.set(f));
    this.api.get<{ tarjetacreditoId: number; descripcion: string }[]>('/parametros/tarjetas-credito').subscribe({
      next: (data) =>
        this.tarjetasCredito.set((data ?? []).map((t) => ({ label: t.descripcion, value: t.tarjetacreditoId }))),
      error: () => this.tarjetasCredito.set([]),
    });

    // Refresco de la bandeja: pausado mientras hay un diálogo abierto para no
    // pisar lo que el cajero está escribiendo.
    const timer = setInterval(() => {
      if (this.dialogDetalle() || this.dialogPago() || this.dialogAnul()) return;
      this.cargar();
    }, REFRESCO_MS);
    this.destroyRef.onDestroy(() => clearInterval(timer));
  }

  // ───────────────────────── Carga ─────────────────────────

  cargar(): void {
    this.srv.getOrdenesAbiertas().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (lista) => {
        this.ordenes.set(lista as OrdenMesero[]);
        this.cargando.set(false);
        this.actualizadoEn.set(Date.now());
      },
      error: () => {
        this.cargando.set(false);
        if (!this.actualizadoEn()) this.msg.add({ severity: 'error', summary: 'Caja', detail: 'No se pudieron cargar las cuentas' });
      },
    });
  }

  private cargarGestores(): void {
    this.api
      .get<any[]>('/parametros/gestores')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          // Mismo criterio que el mesero: ttipogestores de módulo 3 activos
          const mapa: Record<number, string> = {};
          for (const g of items ?? []) {
            if (Number(g.moduloId) === 3 && g.sn_activo !== 'N' && g.nombre && g.gestorId != null) {
              mapa[Number(g.gestorId)] = String(g.nombre);
            }
          }
          this.nombresGestor.set(mapa);
        },
        error: () => this.nombresGestor.set({}),
      });
  }

  private cargarProductos(): void {
    this.tienda
      .getProductos(true)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (p) => this.productos.set(p ?? []),
        error: () => this.productos.set([]),
      });
  }

  // ───────────────────────── Bandeja ─────────────────────────

  setCaja(id: number): void {
    this.cajaSel.set(Number(id));
    try {
      localStorage.setItem(CLAVE_CAJA, String(id));
    } catch {
      /* almacenamiento no disponible: solo queda en memoria */
    }
  }

  esCentral(): boolean {
    return this.cajaSel() === CAJA_CENTRAL;
  }

  nombreCaja(id: number | null | undefined): string {
    if (id == null) return '—';
    return CAJAS_RESTAURANTE.find((c) => c.id === id)?.nombre ?? `Caja ${id}`;
  }

  nombreMesero(o: OrdenRestaurante): string {
    const id = (o as OrdenMesero).gestorId;
    return id != null ? this.nombresGestor()[id] ?? `Mesero #${id}` : 'Sin mesero';
  }

  /** Etiqueta del estado para el chip de la lista. */
  tagEstado(o: OrdenMesero): { label: string; severity: 'success' | 'info' | 'warn' | 'secondary' } {
    if (o.sn_facturado === 'S') return { label: 'Cobrada', severity: 'secondary' };
    if (o.sn_entregado === 'S') return { label: 'Servida', severity: 'success' };
    switch (o.estado) {
      case 'LISTO':
        return { label: 'Lista', severity: 'success' };
      case 'EN_PREPARACION':
        return { label: 'En cocina', severity: 'warn' };
      case 'ENVIADO':
        return { label: 'Enviado', severity: 'info' };
      default:
        return { label: 'Abierta', severity: 'secondary' };
    }
  }

  /** Hora de apertura cuando fecharegistro trae hora real; '—' si es solo fecha. */
  horaApertura(o: OrdenRestaurante): string {
    const f = typeof o.fecharegistro === 'string' ? o.fecharegistro : '';
    const m = /T(\d{2}):(\d{2})/.exec(f);
    if (!m || (m[1] === '00' && m[2] === '00')) return '—';
    return `${m[1]}:${m[2]}`;
  }

  esVentaLibre(o: OrdenRestaurante | null): boolean {
    return !!o && (o.nromesa ?? 0) < 1;
  }

  /**
   * Venta libre: cuenta sin mesa (nromesa 0) — siempre disponible. La cuenta
   * nace en la caja seleccionada (POST no trae cajaId → PUT inmediato).
   */
  ventaLibre(): void {
    if (this.ocupado()) return;
    this.ocupado.set(true);
    this.srv
      .crearOrden(0)
      .pipe(
        switchMap((o) =>
          this.api
            .put<OrdenRestaurante>('/facturacion/pedidos', o.pospedmaeId, { cajaId: this.cajaSel() })
            .pipe(switchMap(() => this.srv.getOrden(o.pospedmaeId))),
        ),
      )
      .subscribe({
        next: (o0) => {
          const o = this.aMesero(o0);
          this.ordenes.update((l) => [...l, o]);
          this.ocupado.set(false);
          this.msg.add({
            severity: 'success',
            summary: 'Venta libre',
            detail: `Cuenta #${o.pospedmaeId} abierta en ${this.nombreCaja(this.cajaSel())}`,
          });
          this.abrirDetalle(o);
        },
        error: (e) => this.fallo(e, 'No se pudo abrir la venta libre'),
      });
  }

  // ───────────────────────── Detalle de la cuenta ─────────────────────────

  abrirDetalle(o: OrdenMesero): void {
    if (this.ocupado()) return;
    this.ocupado.set(true);
    forkJoin({ orden: this.srv.getOrden(o.pospedmaeId), items: this.srv.getItems(o.pospedmaeId) }).subscribe({
      next: ({ orden, items }) => {
        this.ordenSel.set(this.aMesero(orden));
        this.items.set(items);
        this.cajaNueva.set(orden.cajaId);
        this.reemplazarOrden(orden);
        this.ocupado.set(false);
        this.dialogDetalle.set(true);
      },
      error: (e) => this.fallo(e, 'No se pudo cargar la cuenta'),
    });
  }

  refrescarDetalle(): void {
    const orden = this.ordenSel();
    if (!orden) return;
    forkJoin({ orden: this.srv.getOrden(orden.pospedmaeId), items: this.srv.getItems(orden.pospedmaeId) }).subscribe({
      next: ({ orden: act, items }) => {
        this.ordenSel.set(this.aMesero(act));
        this.items.set(items);
        this.reemplazarOrden(act);
        this.ocupado.set(false);
      },
      error: (e) => this.fallo(e, 'No se pudo refrescar la cuenta'),
    });
  }

  private reemplazarOrden(o: OrdenRestaurante): void {
    this.ordenes.update((l) => l.map((x) => (x.pospedmaeId === o.pospedmaeId ? ({ ...x, ...o } as OrdenMesero) : x)));
  }

  descripcionItem(i: OrdenItem): string {
    const p = this.porProducto().get(i.productoId);
    return p?.descripcion || i.codbarra || `Producto #${i.productoId}`;
  }

  /** Total de la línea: si el precio ya incluye ISV, el bruto es el total. */
  totalLinea(i: OrdenItem): number {
    return this.isv().incluido ? i.subtotal : i.subtotal + i.impuesto;
  }

  totalCuenta(): number {
    return this.ordenSel()?.total ?? 0;
  }

  // ── Ítems (solo venta libre agrega/cambia cantidad; anular línea siempre) ──

  incrementar(item: OrdenItem): void {
    const orden = this.ordenSel();
    if (!orden || !this.esVentaLibre(orden) || this.ocupado()) return;
    const p = this.porProducto().get(item.productoId);
    const nueva = item.cantidad + 1;
    if (VALIDAR_EXISTENCIA && p && nueva > Number(p.existencia) && !this.esBajoDemanda(p)) {
      this.msg.add({ severity: 'warn', summary: 'Sin existencia', detail: `${this.descripcionItem(item)}: solo hay ${p.existencia}.` });
      return;
    }
    this.mutar(this.srv.cambiarCantidad(item, nueva));
  }

  decrementar(item: OrdenItem): void {
    const orden = this.ordenSel();
    if (!orden || !this.esVentaLibre(orden) || this.ocupado()) return;
    if (item.cantidad <= 1) return this.abrirAnulacion('linea', orden, item);
    this.mutar(this.srv.cambiarCantidad(item, item.cantidad - 1));
  }

  /** Helper de productos (DynamicDialog) — solo para cuentas de venta libre. */
  showHelperProductos(): void {
    const orden = this.ordenSel();
    if (!orden || !this.esVentaLibre(orden) || this.ocupado()) return;
    const ref = this.dialogs.open(ProductosHelperList, {
      header: 'Seleccionar un producto',
      width: '50vw',
      modal: true,
      contentStyle: { overflow: 'auto' },
      breakpoints: { '960px': '75vw', '640px': '90vw' },
      templates: { footer: FooterHelper },
    });
    ref.onClose.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((data: any) => {
      if (data && 'codbarra' in data) this.agregarProducto(data);
    });
  }

  private agregarProducto(p: any): void {
    const orden = this.ordenSel();
    if (!orden || this.ocupado()) return;
    const productoId = Number(p.produtoId ?? p.productoId) || 0;
    const cat = this.porProducto().get(productoId);
    const existente = this.items().find((i) => i.productoId === productoId);
    const nuevaCantidad = (existente?.cantidad ?? 0) + 1;
    const existencia = Number(p.existencia ?? cat?.existencia);
    const bajoDemanda = this.esBajoDemanda(p) || this.esBajoDemanda(cat);
    if (VALIDAR_EXISTENCIA && !Number.isNaN(existencia) && existencia >= 0 && nuevaCantidad > existencia && !bajoDemanda) {
      this.msg.add({ severity: 'warn', summary: 'Sin existencia', detail: `${p.descripcion}: solo hay ${existencia}.` });
      return;
    }
    this.ocupado.set(true);
    const peticion = existente
      ? this.srv.cambiarCantidad(existente, nuevaCantidad)
      : this.srv.agregarItem(
          orden.pospedmaeId,
          { productoId, codbarra: p.codbarra ?? '', precio: Number(p.precioventa ?? cat?.precioventa ?? 0) },
          Math.max(0, ...this.items().map((i) => i.nrofila)) + 1,
        );
    peticion.subscribe({
      next: () => this.refrescarDetalle(),
      error: (e) => this.fallo(e, 'No se pudo agregar el producto'),
    });
  }

  private mutar(peticion: ReturnType<RestauranteService['quitarItem']>): void {
    if (this.ocupado()) return;
    this.ocupado.set(true);
    peticion.subscribe({
      next: () => this.refrescarDetalle(),
      error: (e) => this.fallo(e, 'No se pudo actualizar la cuenta'),
    });
  }

  // ───────────────────────── Reasignar caja (solo central) ─────────────────────────

  reasignar(): void {
    const o = this.ordenSel();
    const nueva = this.cajaNueva();
    if (!o || nueva == null || nueva === o.cajaId || this.ocupado() || !this.esCentral()) return;
    this.ocupado.set(true);
    this.api
      .put<OrdenRestaurante>('/facturacion/pedidos', o.pospedmaeId, { cajaId: nueva })
      .pipe(switchMap(() => this.srv.getOrden(o.pospedmaeId)))
      .subscribe({
        next: (act0) => {
          const act = this.aMesero(act0);
          this.ordenSel.set(act);
          this.reemplazarOrden(act);
          this.ocupado.set(false);
          this.msg.add({
            severity: 'success',
            summary: 'Caja reasignada',
            detail: `Cuenta #${act.pospedmaeId} → ${this.nombreCaja(nueva)}`,
          });
        },
        error: (e) => this.fallo(e, 'No se pudo reasignar la caja'),
      });
  }

  // ───────────────────────── Anulación con motivo ─────────────────────────

  /**
   * Anula una línea o la cuenta completa. El motivo es obligatorio; como la
   * tabla no tiene columna de motivo (sin DDL), se informa en el toast.
   */
  abrirAnulacion(tipo: 'pedido' | 'linea', orden: OrdenMesero, item?: OrdenItem): void {
    if (this.ocupado()) return;
    this.dialogPago.set(false); // nunca anular con el cobro abierto
    this.motivo.set('');
    this.anul.set(tipo === 'pedido' ? { tipo, orden } : { tipo, orden, item: item as OrdenItem });
    this.dialogAnul.set(true);
  }

  confirmarAnulacion(): void {
    const a = this.anul();
    const m = this.motivo().trim();
    if (!a || !m || this.ocupado()) return;
    this.ocupado.set(true);
    const peticion = a.tipo === 'pedido' ? this.srv.cancelarOrden(a.orden.pospedmaeId) : this.srv.quitarItem(a.item!);
    peticion.subscribe({
      next: () => {
        this.ocupado.set(false);
        this.dialogAnul.set(false);
        if (a.tipo === 'pedido') {
          this.ordenes.update((l) => l.filter((x) => x.pospedmaeId !== a.orden.pospedmaeId));
          if (this.ordenSel()?.pospedmaeId === a.orden.pospedmaeId) {
            this.ordenSel.set(null);
            this.items.set([]);
            this.dialogDetalle.set(false);
          }
          this.msg.add({
            severity: 'success',
            summary: `Cuenta #${a.orden.pospedmaeId} anulada`,
            detail: `Motivo: ${m}`,
          });
        } else {
          this.items.update((l) => l.filter((x) => x.pospeddetId !== a.item!.pospeddetId));
          this.refrescarDetalle();
          this.msg.add({ severity: 'success', summary: 'Línea anulada', detail: `Motivo: ${m}` });
        }
        this.motivo.set('');
        this.anul.set(null);
      },
      error: (e) => this.fallo(e, 'No se pudo anular'),
    });
  }

  // ───────────────────────── Cobro (mismo flujo que el escritorio) ─────────────────────────

  /** Carga la cuenta y su detalle, y abre el diálogo de pagos. */
  cobrar(o: OrdenMesero): void {
    if (this.ocupado()) return;
    this.ocupado.set(true);
    forkJoin({ orden: this.srv.getOrden(o.pospedmaeId), items: this.srv.getItems(o.pospedmaeId) }).subscribe({
      next: ({ orden, items }) => {
        this.ordenSel.set(this.aMesero(orden));
        this.items.set(items);
        this.reemplazarOrden(orden);
        this.ocupado.set(false);
        if (!items.length) {
          this.msg.add({ severity: 'warn', summary: 'Orden vacía', detail: 'Agregue productos antes de cobrar.' });
          return;
        }
        this.inicializarPagos();
        this.dialogPago.set(true);
      },
      error: (e) => this.fallo(e, 'No se pudo cargar la cuenta'),
    });
  }

  /** Cobrar desde el pie del detalle (cuenta ya cargada). */
  cobrarSeleccionada(): void {
    const o = this.ordenSel();
    if (o) this.cobrar(o);
  }

  /** Anular la cuenta desde el pie del detalle. */
  anularCuentaSel(): void {
    const o = this.ordenSel();
    if (o) this.abrirAnulacion('pedido', o);
  }

  /** Una fila por cada forma de pago del catálogo (igual que Nueva Factura). */
  inicializarPagos(): void {
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

  agregarPago(): void {
    this.pagos.update((p) => [
      ...p,
      { formapagoId: null, tarjetacreditoId: null, nrotarjeta: '', nroautorizacion: '', importe: 0, esEfectivo: false },
    ]);
  }

  quitarPago(idx: number): void {
    this.pagos.update((p) => p.filter((_, i) => i !== idx));
  }

  pagosConImporte(): PagoOrden[] {
    return this.pagos().filter((p) => (Number(p.importe) || 0) > 0);
  }

  totalPagos(): number {
    return this.pagosConImporte().reduce((s, p) => s + (Number(p.importe) || 0), 0);
  }

  cambioTotal(): number {
    return Math.max(0, Math.round((this.totalPagos() - this.totalCuenta()) * 100) / 100);
  }

  pendiente(): number {
    return Math.max(0, Math.round((this.totalCuenta() - this.totalPagos()) * 100) / 100);
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

  /** Al cambiar la forma de pago: limpia campos que no aplican y auto-pago TodoPago. */
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
    const pend = Math.round((this.totalCuenta() - otros) * 100) / 100;
    if (pend > 0) pago.importe = pend;
  }

  /**
   * Validación de la tabla de pagos — método y NO computed(): las filas son
   * objetos planos ligados con ngModel y un computed() se congelaría en false.
   */
  formularioPagoValido(): boolean {
    const total = this.totalCuenta();
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

  confirmarPago(): void {
    const orden = this.ordenSel();
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
    const total = this.totalCuenta();
    if (this.totalPagos() < total) {
      this.msg.add({
        severity: 'error',
        summary: 'Validación',
        detail: `La cuenta debe pagarse en su totalidad. Falta por pagar: ${this.moneda(total - this.totalPagos())}`,
      });
      return;
    }

    const pagosEnviar = pagos.map((p) => ({ ...p, esEfectivo: this.esEfectivoFila(p) }));

    this.ocupado.set(true);
    this.srv.facturar(orden, pagosEnviar).subscribe({
      next: (f) => {
        this.ordenes.update((l) => l.filter((x) => x.pospedmaeId !== orden.pospedmaeId));
        this.ordenSel.set(null);
        this.items.set([]);
        this.dialogPago.set(false);
        this.dialogDetalle.set(false);
        this.ocupado.set(false);
        this.cargar();
        this.msg.add({
          severity: f.conLink ? 'info' : 'success',
          summary: `Factura #${f.nrofactura}`,
          detail: f.conLink
            ? `${this.etiquetaPuesto(orden.nromesa)}: pago TodoPago pendiente de confirmación`
            : `${this.etiquetaPuesto(orden.nromesa)} cobrada: ${this.moneda(f.total)} (${pagosEnviar.length} pago(s))`,
        });
        // Ticket solo si ttipoparametros (módulo 3).sn_imprimefactura = 'S'
        if (this.isv().snImprimeFactura && f.facturaId) this.imprimirTicket(f.facturaId);
      },
      error: (e) => this.fallo(e, 'No se pudo facturar la cuenta'),
    });
  }

  /** Ticket — misma carga y motor que Nueva Factura y el escritorio. */
  private imprimirTicket(facturaId: number): void {
    this.api
      .get<any>(`/facturacion/facturas/${facturaId}/ticket`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) =>
          this.impresion.imprimir(data).catch(() =>
            this.msg.add({ severity: 'warn', summary: 'Impresión', detail: 'No se pudo imprimir la factura' }),
          ),
        error: () =>
          this.msg.add({ severity: 'warn', summary: 'Impresión', detail: 'No se pudieron cargar los datos del ticket' }),
      });
  }

  // ───────────────────────── Helpers de vista ─────────────────────────

  /** Moneda local con locale es-HN — mismo formato que Nueva Factura. */
  moneda(n: number | undefined): string {
    return (n ?? 0).toLocaleString('es-HN', { style: 'currency', currency: 'HNL' });
  }

  hora(ts: number): string {
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(
      d.getSeconds(),
    ).padStart(2, '0')}`;
  }

  /** Nombre de la cuenta para los diálogos. */
  tituloCuenta(o: OrdenMesero | null): string {
    if (!o) return 'Cuenta';
    return `${this.etiquetaPuesto(o.nromesa)} · Cuenta #${o.pospedmaeId}`;
  }

  /**
   * getOrden/getOrdenesAbiertas están tipeados como OrdenRestaurante (la
   * pantalla de escritorio no lee estado/cajaId/gestorId), pero el JSON sí los
   * trae: aquí se trata la fila como OrdenMesero.
   */
  private aMesero(o: OrdenRestaurante): OrdenMesero {
    return o as OrdenMesero;
  }

  private cajaRecordada(): number {
    try {
      const v = Number(localStorage.getItem(CLAVE_CAJA));
      return CAJAS_RESTAURANTE.some((c) => c.id === v) ? v : CAJA_CENTRAL;
    } catch {
      return CAJA_CENTRAL;
    }
  }

  private fallo(e: any, detalle: string): void {
    this.ocupado.set(false);
    this.msg.add({
      severity: 'error',
      summary: 'Error',
      detail: typeof e?.error?.message === 'string' ? e.error.message : detalle,
    });
  }
}
