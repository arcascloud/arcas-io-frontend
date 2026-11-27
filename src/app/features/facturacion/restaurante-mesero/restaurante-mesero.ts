import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { SelectModule } from 'primeng/select';
import { TabsModule } from 'primeng/tabs';
import { ToastModule } from 'primeng/toast';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { TooltipModule } from 'primeng/tooltip';
import { ApiService } from '../../../core/services/api.service';
import { TiendaService } from '../../../core/services/tienda.service';
import { ProductoTienda } from '../../../core/models/tienda.models';
import { esBajoDemanda } from '../../../core/utils/stock';
import { RestauranteService } from '../../../core/services/restaurante.service';
import { ConfigISV } from '../../../core/models/restaurante.models';
import { MeseroService } from '../../../core/services/mesero.service';
import { CajasService } from '../../../core/services/cajas.service';
import {
  CAJAS_RESTAURANTE,
  CajaDestino,
  ItemMesero,
  LineaBorrador,
  MESERO_VALIDAR_EXISTENCIA,
  NUM_KIOSKOS,
  NUM_MESAS,
  OpcionGestor,
  OrdenMesero,
  EstadoPuesto,
  Puesto,
  PuestoVista,
  TipoPuesto,
  crearPuesto,
  etiquetaPuesto,
  nuevoRondaId,
} from '../../../core/models/mesero.models';

type Vista = 'puestos' | 'menu';
type Filtro = 'todos' | 'libres' | 'ocupadas' | 'listas';

const CLAVE_CAJA = 'arcas.mesero.caja';
const REFRESCO_MS = 15_000;

/**
 * Toma de pedidos para el mesero — pensada para teléfono, a una mano.
 *
 *   1. Puestos  → casillas grandes de mesas / kioskos. Un toque en una libre abre el menú.
 *   2. Menú     → productos con "+" / "− n +" en la misma fila. El pedido se arma en el
 *                 teléfono y NO toca el servidor hasta enviar (cero esperas por producto).
 *   3. Enviar   → una sola llamada manda la ronda a la caja elegida y a cocina. La orden
 *                 SIEMPRE nace con el nombre del cliente y el mesero (gestorId → ttipogestores).
 *
 * Pantalla nueva e independiente: no cambia restaurante.ts/html/scss (desktop).
 */
@Component({
  selector: 'app-restaurante-mesero',
  standalone: true,
  imports: [
    FormsModule,
    ButtonModule,
    DrawerModule,
    SelectModule,
    TabsModule,
    ToastModule,
    ToggleButtonModule,
    TooltipModule,
  ],
  templateUrl: './restaurante-mesero.html',
  styleUrl: './restaurante-mesero.scss',
})
export class RestauranteMesero implements OnInit {
  private srv = inject(RestauranteService);
  private mesero = inject(MeseroService);
  private tienda = inject(TiendaService);
  private api = inject(ApiService);
  private cajasSrv = inject(CajasService);
  private msg = inject(MessageService);
  private location = inject(Location);
  private destroyRef = inject(DestroyRef);

  /**
   * Cajas de la empresa: catálogo DINÁMICO desde `cxccajeros` (GET /cxc/cajeros).
   * Arranca con la constante de respaldo y se reemplaza al llegar la API.
   */
  cajas = signal<CajaDestino[]>(CAJAS_RESTAURANTE);

  /** Producto solicitado bajo demanda: no exige existencia para agregarlo al pedido */
  readonly esBajoDemanda = esBajoDemanda;
  private readonly mesas = Array.from({ length: NUM_MESAS }, (_, i) => crearPuesto('M', i + 1));
  private readonly kioskos = Array.from({ length: NUM_KIOSKOS }, (_, i) => crearPuesto('K', i + 1));

  vista = signal<Vista>('puestos');

  // ───────────────────────── 1 · Puestos ─────────────────────────
  tipoVista = signal<TipoPuesto>('M');
  filtro = signal<Filtro>('todos');
  ordenes = signal<OrdenMesero[]>([]);
  cargandoOrdenes = signal(true);
  sinConexion = signal(false);
  ahora = signal(Date.now());

  private primeraCarga = true;
  private porNromesa = computed(() => {
    const m = new Map<number, OrdenMesero>();
    for (const o of this.ordenes()) {
      const n = o.nromesa ?? 0;
      if (n >= 1) m.set(n, o);
    }
    return m;
  });

  private todasMesas = computed(() => this.mesas.map((p) => this.vistaDe(p)));
  private todosKioskos = computed(() => this.kioskos.map((p) => this.vistaDe(p)));
  private puestosDelTipo = computed(() =>
    this.tipoVista() === 'M' ? this.todasMesas() : this.todosKioskos(),
  );

  puestosVisibles = computed(() => {
    const f = this.filtro();
    const lista = this.puestosDelTipo();
    if (f === 'libres') return lista.filter((p) => p.estado === 'libre');
    if (f === 'ocupadas') return lista.filter((p) => p.estado !== 'libre');
    if (f === 'listas') return lista.filter((p) => p.estado === 'lista');
    return lista;
  });

  conteos = computed(() => {
    const l = this.puestosDelTipo();
    return {
      todos: l.length,
      libres: l.filter((p) => p.estado === 'libre').length,
      ocupadas: l.filter((p) => p.estado !== 'libre').length,
      listas: l.filter((p) => p.estado === 'lista').length,
    };
  });

  /** Pedidos listos para servir en todo el salón (mesas + kioskos). */
  listasTotal = computed(
    () => [...this.todasMesas(), ...this.todosKioskos()].filter((p) => p.estado === 'lista').length,
  );

  private vistaDe(p: Puesto): PuestoVista {
    const orden = this.porNromesa().get(p.nromesa) ?? null;
    return { puesto: p, orden, estado: orden ? this.estadoDe(orden) : 'libre' };
  }

  /** Sin columna `estado` (backend aún sin DDL) se deduce del sn_entregado de siempre. */
  private estadoDe(o: OrdenMesero): EstadoPuesto {
    switch (o.estado) {
      case 'LISTO':
        return 'lista';
      case 'ENTREGADO':
        return 'servida';
      case 'ABIERTO':
      case 'ENVIADO':
      case 'EN_PREPARACION':
        return 'enCocina';
      default:
        return o.sn_entregado === 'S' ? 'servida' : 'enCocina';
    }
  }

  minutos(o: OrdenMesero): number {
    const t = Date.parse(String(o.enviado_at ?? o.fecharegistro));
    return Number.isNaN(t) ? 0 : Math.max(0, Math.floor((this.ahora() - t) / 60000));
  }

  textoEstado(pv: PuestoVista): string {
    switch (pv.estado) {
      case 'libre':
        return 'Libre';
      case 'lista':
        return 'Servir';
      case 'servida':
        return 'Servida';
      default:
        return pv.orden ? `${this.minutos(pv.orden)} min` : 'En cocina';
    }
  }

  ariaPuesto(pv: PuestoVista): string {
    const estado: Record<EstadoPuesto, string> = {
      libre: 'libre',
      enCocina: 'en cocina',
      lista: 'lista para servir',
      servida: 'servida',
    };
    return `${pv.puesto.etiqueta}, ${estado[pv.estado]}`;
  }

  irAListas() {
    this.tipoVista.set(this.todasMesas().some((p) => p.estado === 'lista') ? 'M' : 'K');
    this.filtro.set('listas');
  }

  /** Vuelve la selección de mesero a cero para elegir otro desde el inicio. */
  limpiarMesero() {
    this.gestorId.set(null);
  }

  /** p-tabs emite string | number | undefined: se normaliza a 'M' | 'K'. */
  cambiarTipoVista(valor: string | number | undefined) {
    this.tipoVista.set(valor === 'K' ? 'K' : 'M');
  }

  salir() {
    this.location.back();
  }

  // ───────────────────────── 2 · Menú ─────────────────────────
  productos = signal<ProductoTienda[]>([]);
  cargandoProductos = signal(true);
  categoriaActiva = signal<string | null>(null);
  busqueda = signal('');
  buscando = signal(false);

  puestoActivo = signal<Puesto | null>(null);
  borrador = signal<LineaBorrador[]>([]);
  /** Se renueva al iniciar cada pedido; un reintento de envío reutiliza el mismo. */
  private rondaId = nuevoRondaId();
  cajaId = signal<number>(CAJAS_RESTAURANTE[0].id);

  // ── Identidad de la orden: cliente + mesero (sin tablas nuevas) ──
  /** Meseros = gestores de ventas (ttipogestores módulo 3), mismos que Nueva Factura / Pedido. */
  gestores = signal<OpcionGestor[]>([]);
  /** gestorId seleccionado para una cuenta NUEVA; precargado con el gestor del usuario logueado. */
  gestorId = signal<number | null>(null);
  /** Nombre del cliente para una cuenta NUEVA (pospedmae.nombrecliente). */
  nombreCliente = signal('');

  /** Mesero válido: `gestorId` distinto de null Y mayor que 0 (0 o null = sin mesero). */
  hayMesero = computed(() => {
    const g = this.gestorId();
    return g != null && Number(g) > 0;
  });

  categorias = computed(() =>
    Array.from(
      new Set(
        this.productos()
          .map((p) => p.categoria)
          .filter((c): c is string => !!c),
      ),
    ).sort((a, b) => a.localeCompare(b, 'es')),
  );

  productosFiltrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    const cat = this.categoriaActiva();
    const lista = this.productos();
    if (q) {
      return lista.filter(
        (p) =>
          (p.descripcion || '').toLowerCase().includes(q) ||
          (p.codbarra || '').toLowerCase().includes(q),
      );
    }
    return cat ? lista.filter((p) => p.categoria === cat) : lista;
  });

  private productoPorId = computed(
    () => new Map(this.productos().map((p) => [Number(p.produtoId), p])),
  );

  /** Para templates: true si el producto está marcado como bajo demanda (no exige existencia). */
  productoBajoDemanda(productoId: number): boolean {
    return this.esBajoDemanda(this.productoPorId().get(productoId));
  }

  cantidadEnBorrador = computed(
    () => new Map(this.borrador().map((l) => [l.productoId, l.cantidad])),
  );
  totalLineas = computed(() => this.borrador().reduce((s, l) => s + l.cantidad, 0));
  totalBorrador = computed(() => this.borrador().reduce((s, l) => s + l.precio * l.cantidad, 0));

  ordenActiva = computed(() => {
    const p = this.puestoActivo();
    return p ? (this.porNromesa().get(p.nromesa) ?? null) : null;
  });

  cajaNombre = computed(() => this.cajas().find((c) => c.id === this.cajaId())?.nombre ?? 'Caja');

  iniciarMenu(puesto: Puesto) {
    this.puestoActivo.set(puesto);
    this.borrador.set([]);
    this.rondaId = nuevoRondaId();
    this.categoriaActiva.set(null);
    this.busqueda.set('');
    this.buscando.set(false);
    this.nombreCliente.set('');
    // Una cuenta se cobra en una sola caja: si la mesa ya tiene orden, se respeta su caja.
    // Cliente y mesero de una cuenta abierta también se conservan (se muestran en solo lectura).
    this.cajaId.set(this.porNromesa().get(puesto.nromesa)?.cajaId ?? this.cajaRecordada());
    this.vista.set('menu');
  }

  /** Mesero obligatorio: se debe elegir antes de abrir una mesa o kiosko. */
  elegirMesero(id: number | null) {
    this.gestorId.set(id);
  }

  /** Aviso compartido: no se puede tomar ni enviar un pedido sin mesero válido. */
  private avisarSinMesero() {
    this.msg.add({
      severity: 'warn',
      summary: 'Selecciona el mesero',
      detail: this.gestores().length
        ? 'Elige el mesero antes de tomar un pedido.'
        : 'No hay gestores (meseros) configurados.',
    });
  }

  abrirPuesto(pv: PuestoVista) {
    if (pv.estado === 'libre' || !pv.orden) {
      if (!this.hayMesero()) {
        this.avisarSinMesero();
        return;
      }
      this.iniciarMenu(pv.puesto);
    } else {
      if (pv.orden.gestorId != null && Number(pv.orden.gestorId) > 0) {
        this.gestorId.set(Number(pv.orden.gestorId));
      } else if (!this.hayMesero()) {
        this.avisarSinMesero();
        return;
      }
      this.abrirDetalle(pv);
    }
  }

  alternarBusqueda() {
    this.buscando.update((b) => !b);
    if (!this.buscando()) this.busqueda.set('');
  }

  alBuscar(ev: Event) {
    this.busqueda.set((ev.target as HTMLInputElement).value);
  }

  alEscribirCliente(ev: Event) {
    this.nombreCliente.set((ev.target as HTMLInputElement).value);
  }

  /** Nombre del mesero de una orden, resuelto contra ttipogestores (vacío si no trae gestor). */
  meseroDe(o: OrdenMesero): string {
    if (o.gestorId == null) return '';
    return this.gestores().find((g) => g.value === o.gestorId)?.label ?? '';
  }

  sumar(p: ProductoTienda) {
    const id = Number(p.produtoId);
    const actual = this.cantidadEnBorrador().get(id) ?? 0;
    const max = Number(p.existencia);
    if (MESERO_VALIDAR_EXISTENCIA && actual + 1 > max && !this.esBajoDemanda(p)) {
      this.msg.add({
        severity: 'warn',
        summary: 'Sin existencia',
        detail: `${p.descripcion}: solo hay ${max}.`,
      });
      return;
    }
    this.borrador.update((lineas) => {
      if (actual > 0)
        return lineas.map((l) => (l.productoId === id ? { ...l, cantidad: l.cantidad + 1 } : l));
      return [
        ...lineas,
        {
          productoId: id,
          codbarra: p.codbarra ?? '',
          descripcion: p.descripcion,
          precio: Number(p.precioventa),
          cantidad: 1,
          imagen: p.imagen ?? null,
          existencia: max,
        },
      ];
    });
  }

  /** "+" desde la hoja de revisión: la línea ya trae su existencia. */
  sumarLinea(l: LineaBorrador) {
    const p = this.productoPorId().get(l.productoId);
    if (MESERO_VALIDAR_EXISTENCIA && l.cantidad + 1 > l.existencia && !this.esBajoDemanda(p)) return;
    this.borrador.update((lineas) =>
      lineas.map((x) => (x.productoId === l.productoId ? { ...x, cantidad: x.cantidad + 1 } : x)),
    );
  }

  restar(productoId: number) {
    this.borrador.update((lineas) =>
      lineas
        .map((l) => (l.productoId === productoId ? { ...l, cantidad: l.cantidad - 1 } : l))
        .filter((l) => l.cantidad > 0),
    );
  }

  quitar(productoId: number) {
    this.borrador.update((lineas) => lineas.filter((l) => l.productoId !== productoId));
    if (this.borrador().length === 0) this.sheetPedido.set(false);
  }

  /** Mismo manejo de imagen que la pantalla de restaurante actual. */
  resolverImagen(imagen: string | null): string {
    if (!imagen) return '';
    return /^data:/i.test(imagen) ? imagen : `data:image/png;base64,${imagen}`;
  }

  formatearPrecio(n: number | string): string {
    return `L ${Number(n).toFixed(2)}`;
  }

  // ───────────────────────── 3 · Hojas laterales (derecha) ─────────────────────────
  sheetPedido = signal(false);
  sheetDescartar = signal(false);
  sheetDetalle = signal(false);
  enviando = signal(false);

  volverAPuestos() {
    if (this.borrador().length > 0) {
      this.sheetDescartar.set(true);
      return;
    }
    this.cerrarMenu();
  }

  descartarYVolver() {
    this.sheetDescartar.set(false);
    this.cerrarMenu();
  }

  private cerrarMenu() {
    this.borrador.set([]);
    this.puestoActivo.set(null);
    this.sheetPedido.set(false);
    this.vista.set('puestos');
  }

  elegirCaja(id: number) {
    this.cajaId.set(id);
  }

  enviar() {
    const puesto = this.puestoActivo();
    const lineas = this.borrador();
    if (!puesto || lineas.length === 0 || this.enviando()) return;

    // Sin mesero válido (null o 0) no se envía NINGÚN pedido, ni cuenta nueva ni ronda extra.
    if (!this.hayMesero()) {
      this.avisarSinMesero();
      return;
    }

    const orden = this.ordenActiva();
    const cliente = (orden?.nombrecliente ?? this.nombreCliente()).trim();
    const gestor = orden?.gestorId ?? this.gestorId();

    // Cuenta NUEVA: la orden siempre nace con el nombre del cliente y el mesero.
    if (!orden) {
      if (!cliente) {
        this.error('Escriba el nombre del cliente.');
        return;
      }
      if (gestor == null || Number(gestor) <= 0) {
        this.avisarSinMesero();
        return;
      }
    }

    this.enviando.set(true);
    this.mesero
      .enviarRonda({
        rondaId: this.rondaId,
        nromesa: puesto.nromesa,
        cajaId: this.cajaId(),
        gestorId: gestor ?? null,
        nombrecliente: cliente || puesto.etiqueta,
        lineas: lineas.map((l) => ({ productoId: l.productoId, cantidad: l.cantidad })),
      })
      .subscribe({
        next: (ordenEnv) => {
          this.ordenes.update((l) =>
            l.some((o) => o.pospedmaeId === ordenEnv.pospedmaeId)
              ? l.map((o) => (o.pospedmaeId === ordenEnv.pospedmaeId ? { ...o, ...ordenEnv } : o))
              : [...l, ordenEnv],
          );
          this.recordarCaja(this.cajaId());
          this.msg.add({
            severity: 'success',
            summary: puesto.etiqueta,
            detail: `Enviado a ${this.cajaNombre()} y a cocina.`,
            life: 3500,
          });
          this.enviando.set(false);
          this.cerrarMenu();
        },
        error: (e) => {
          // El borrador se conserva: el mesero reintenta sin volver a tomar el pedido.
          this.enviando.set(false);
          this.error(
            this.mensajeDe(e, 'No se pudo enviar el pedido. Revise la conexión y reintente.'),
          );
        },
      });
  }

  // ── Detalle de un puesto ocupado (columna "Orden" — mismo diseño que el escritorio) ──
  detalleClave = signal<number | null>(null);
  itemsDetalle = signal<ItemMesero[]>([]);
  cargandoDetalle = signal(false);
  /** Mutaciones de línea (± / quitar / entregar): bloquea botones mientras vuelva el servidor. */
  ocupando = signal(false);
  isv = signal<ConfigISV>({ tasa: 0, incluido: false, snImprimeFactura: false });

  detalle = computed(() => {
    const k = this.detalleClave();
    if (k == null) return null;
    return (
      [...this.todasMesas(), ...this.todosKioskos()].find((p) => p.puesto.nromesa === k) ?? null
    );
  });

  private abrirDetalle(pv: PuestoVista) {
    if (!pv.orden) return;
    this.detalleClave.set(pv.puesto.nromesa);
    this.itemsDetalle.set([]);
    this.cargarItems(pv.orden);
    this.sheetDetalle.set(true);
  }

  private cargarItems(o: OrdenMesero) {
    this.cargandoDetalle.set(true);
    this.srv
      .getItems(o.pospedmaeId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (lista) => {
          this.itemsDetalle.set(lista as ItemMesero[]);
          this.cargandoDetalle.set(false);
        },
        error: () => {
          this.cargandoDetalle.set(false);
          this.error('No se pudo cargar el pedido');
        },
      });
  }

  /**
   * Refresco SILENCIOSO de la hoja abierta (sin spinner): si cocina avanza un
   * ítem a LISTO mientras el mesero tiene la cuenta desplegada, la etiqueta y el
   * botón "entregar" deben actualizarse sin tener que cerrar y reabrir la hoja.
   */
  private refrescarDetalle() {
    const o = this.detalle()?.orden;
    if (!o) return;
    this.srv
      .getItems(o.pospedmaeId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (lista) => this.itemsDetalle.set(lista as ItemMesero[]),
        error: () => {
          /* el refresco es best-effort: el próximo ciclo reintenta */
        },
      });
  }

  /**
   * Estado GENERAL de la cuenta (cabecera de la hoja): permanece "En curso"
   * mientras el cliente no pague; la entrega por ítem y la cocina son estados
   * de la LÍNEA, no de la cuenta.
   */
  estadoGeneral(o: OrdenMesero): string {
    return o.sn_facturado === 'S' ? 'Cobrada' : 'En curso';
  }

  agregarDesdeDetalle() {
    const orden = this.detalle()?.orden;
    if (orden?.gestorId != null && Number(orden.gestorId) > 0) {
      this.gestorId.set(Number(orden.gestorId));
    }
    if (!this.hayMesero()) {
      this.avisarSinMesero();
      return;
    }
    const d = this.detalle();
    this.sheetDetalle.set(false);
    if (d) this.iniciarMenu(d.puesto);
  }

  /** Etiqueta de cabecera: 'Mesa N', 'Kiosko N' o 'Venta libre' (misma que el escritorio). */
  etiquetaMesa(o: OrdenMesero): string {
    return etiquetaPuesto(o.nromesa);
  }

  /** Total de la línea: si el precio ya incluye ISV, el bruto es el total; si no, se suma el ISV. */
  totalLinea(item: ItemMesero): number {
    return this.isv().incluido ? item.subtotal : item.subtotal + item.impuesto;
  }

  /** Etiqueta del toggle APAGADO — MISMO CASE que la consulta oficial de estado
   *  (frontend y backend):
   *    sn_entregado = 'S'            → 'Entregado'
   *    estado_cocina = 'LISTO'       → 'Entregar a mesa' (puesto K: 'Entregar a kiosko')
   *    cualquier otro estado         → 'En preparación' */
  etiquetaToggle(item: ItemMesero): string {
    if (item.sn_entregado === 'S') return 'Entregado';
    if (item.estado_cocina === 'LISTO') {
      return this.detalle()?.puesto.tipo === 'K' ? 'Entregar a kiosko' : 'Entregar a mesa';
    }
    return 'En preparación';
  }

  /** Regla aprobada (validada también en backend): el mesero solo puede cambiar
   *  sn_entregado — ida o vuelta — cuando estado_cocina = 'LISTO'. */
  toggleHabilitado(item: ItemMesero): boolean {
    return item.estado_cocina === 'LISTO';
  }

  infoItem(item: ItemMesero) {
    const p = this.productoPorId().get(item.productoId);
    return {
      nombre: p?.descripcion || p?.codbarra || `Producto #${item.productoId}`,
      imagen: this.resolverImagen(p?.imagen ?? null),
    };
  }

  /** Una vez entregada (sn_entregado='S'), la línea ya no se puede modificar ni eliminar. */
  lineaModificable(item: ItemMesero): boolean {
    return item.sn_entregado !== 'S';
  }

  sumarItem(item: ItemMesero) {
    const p = this.productoPorId().get(item.productoId);
    if (MESERO_VALIDAR_EXISTENCIA && p && item.cantidad + 1 > Number(p.existencia) && !this.esBajoDemanda(p)) {
      this.msg.add({
        severity: 'warn',
        summary: 'Sin existencia',
        detail: `Solo hay ${p.existencia}.`,
      });
      return;
    }
    this.mutarItem(this.srv.cambiarCantidad(item, item.cantidad + 1));
  }

  restarItem(item: ItemMesero) {
    if (item.cantidad <= 1) return this.quitarDeOrden(item);
    this.mutarItem(this.srv.cambiarCantidad(item, item.cantidad - 1));
  }

  quitarDeOrden(item: ItemMesero) {
    this.mutarItem(this.srv.quitarItem(item));
  }

  /**
   * Entrega por ítem (toggle del mesero): el backend guarda el estado de la línea
   * y sincroniza la cabecera — la cuenta queda 'entregada' sola con el último ítem.
   */
  toggleEntregado(item: ItemMesero, entregado: boolean) {
    this.mutarItem(this.srv.setItemEntregado(item, entregado));
  }

  private mutarItem(peticion: Observable<unknown>) {
    if (this.ocupando()) return;
    this.ocupando.set(true);
    peticion.subscribe({
      next: () => {
        this.cargarOrdenes(true);
        this.refrescarDetalle();
        this.ocupando.set(false);
      },
      error: (e) => this.mutarFallo(e),
    });
  }

  private mutarFallo(e: any) {
    this.ocupando.set(false);
    this.error(
      typeof e?.error?.message === 'string' ? e.error.message : 'No se pudo actualizar la cuenta',
    );
  }

  /** Cancela la cuenta vacía — mismo criterio que el escritorio (solo sin líneas). */
  cancelarOrdenVacia() {
    const o = this.detalle()?.orden;
    if (!o || this.ocupando()) return;
    this.ocupando.set(true);
    this.srv.cancelarOrden(o.pospedmaeId).subscribe({
      next: () => {
        this.ocupando.set(false);
        this.sheetDetalle.set(false);
        this.detalleClave.set(null);
        this.itemsDetalle.set([]);
        this.cargarOrdenes(true);
        this.msg.add({
          severity: 'success',
          summary: 'Orden cancelada',
          detail: `Orden #${o.pospedmaeId} cancelada.`,
        });
      },
      error: (e) => this.mutarFallo(e),
    });
  }

  // ───────────────────────── Carga y refresco ─────────────────────────
  ngOnInit() {
    this.cargarProductos();
    this.cargarCajas();
    this.cargarGestores();
    this.cargarOrdenes();
    this.srv
      .cargarISV()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((cfg) => this.isv.set(cfg));

    // Sin tiempo real todavía: se refresca cada 15 s y al volver a la app (pausado con la pantalla oculta).
    if (typeof document === 'undefined') return;
    const timer = setInterval(() => {
      this.ahora.set(Date.now());
      if (!document.hidden && !this.enviando() && !this.ocupando()) {
        this.cargarOrdenes(true);
        this.refrescarDetalle();
      }
    }, REFRESCO_MS);
    const alVolver = () => {
      if (!document.hidden) {
        this.cargarOrdenes(true);
        this.refrescarDetalle();
      }
    };
    document.addEventListener('visibilitychange', alVolver);
    this.destroyRef.onDestroy(() => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', alVolver);
    });
  }

  /**
   * Cajas dinámicas: `cxccajeros` (un registro activo = una caja).
   * Mantiene la caja recordada si sigue existiendo; si desapareció, cae en la
   * primera de la lista.
   */
  private cargarCajas() {
    this.cajasSrv
      .getCajas()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (lista) => {
          if (!lista.length) return;
          this.cajas.set(lista.map((c) => ({ id: c.id, nombre: c.nombre })));
          if (!lista.some((c) => c.id === this.cajaId())) {
            this.cajaId.set(this.cajaRecordada());
          }
        },
      });
  }

  /**
   * Meseros = gestores de ventas (ttipogestores módulo 3, activos) — mismo criterio
   * que Nueva Factura y Pedido. NO se preselecciona ninguno: el mesero debe elegirse
   * explícitamente antes de poder tomar un pedido (gestorId 0/null = sin mesero).
   */
  private cargarGestores() {
    this.api
      .get<any[]>('/parametros/gestores')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          const ventas = (items ?? []).filter(
            (g) => Number(g.moduloId) === 3 && g.sn_activo !== 'N' && !!g.nombre,
          );
          this.gestores.set(
            ventas.map((g) => ({ label: String(g.nombre), value: Number(g.gestorId) })),
          );
        },
        error: () => this.gestores.set([]),
      });
  }

  private cargarProductos() {
    this.tienda
      .getProductos(true)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (p) => {
          this.productos.set((p ?? []).filter((prod) => prod.tipo_giro === 'R'));
          this.cargandoProductos.set(false);
        },
        error: () => {
          this.cargandoProductos.set(false);
          this.error('No se pudieron cargar los productos');
        },
      });
  }

  cargarOrdenes(silencioso = false) {
    this.srv
      .getOrdenesAbiertas()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (lista) => {
          const nuevas = lista as OrdenMesero[];
          this.avisarNuevasListas(nuevas);
          this.ordenes.set(nuevas);
          this.cargandoOrdenes.set(false);
          this.sinConexion.set(false);
        },
        error: () => {
          this.cargandoOrdenes.set(false);
          this.sinConexion.set(true);
          if (!silencioso) this.error('No se pudieron cargar las órdenes');
        },
      });
  }

  /** Aviso cuando cocina deja lista una orden mientras el mesero está en otra pantalla. */
  private avisarNuevasListas(nuevas: OrdenMesero[]) {
    if (!this.primeraCarga) {
      const antes = new Set(
        this.ordenes()
          .filter((o) => this.estadoDe(o) === 'lista')
          .map((o) => o.pospedmaeId),
      );
      for (const o of nuevas) {
        if (this.estadoDe(o) === 'lista' && !antes.has(o.pospedmaeId)) {
          this.msg.add({
            severity: 'success',
            summary: etiquetaPuesto(o.nromesa),
            detail: 'Pedido listo para servir',
            life: 6000,
          });
        }
      }
    }
    this.primeraCarga = false;
  }

  // ───────────────────────── Utilidades ─────────────────────────
  private cajaRecordada(): number {
    try {
      const guardada = Number(localStorage.getItem(CLAVE_CAJA));
      if (this.cajas().some((c) => c.id === guardada)) return guardada;
    } catch {
      /* almacenamiento no disponible: se usa la caja central */
    }
    return this.cajas()[0]?.id ?? CAJAS_RESTAURANTE[0].id;
  }

  private recordarCaja(id: number) {
    try {
      localStorage.setItem(CLAVE_CAJA, String(id));
    } catch {
      /* sin almacenamiento: no pasa nada */
    }
  }

  private mensajeDe(e: any, porDefecto: string): string {
    return e?.error?.message && typeof e.error.message === 'string' ? e.error.message : porDefecto;
  }

  private error(detalle: string) {
    this.msg.add({ severity: 'error', summary: 'Error', detail: detalle });
  }
}
