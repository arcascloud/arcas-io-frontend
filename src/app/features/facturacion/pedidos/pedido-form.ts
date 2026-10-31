import { Component, OnInit, inject, signal, computed, DestroyRef, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { forkJoin, of, catchError } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { PopoverModule, Popover } from 'primeng/popover';
import { MessageService, ConfirmationService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { NavegacionService } from '../../../core/services/navegacion.service';
import { ProductosHelperList } from '../../helpers/productos';
import { FooterHelper } from '../../helpers/footer';
import { TodoPagoService, TodoPagoLink, FORMAPAGO_TODOPAGO } from '../../../core/services/todopago.service';

// ─────────────────────────────────────────────────────────────────────────────
// Formulario de PEDIDO — versión ERP (empleados).
// Diseño idéntico a NuevaFactura (grid xl:col-9 + panel lateral xl:col-3),
// pero opera sobre pedidos (pospedmae/pospeddet) y NO sobre facturas.
// El CRM (/facturacion/pedidos-virtual) queda intacto con su propio componente.
//
// Modelo de cálculo (coherente con checkoutPedido del backend):
//   fila.subtotal guardado = cantidad × precio (bruto, sin ISV)
//   fila.descuento guardado = monto (bruto × %desc)
//   fila.impuesto guardado  = (bruto − descuento) × tasa ISV
//   total pedido = Σ bruto + Σ ISV − Σ descuentos
// ─────────────────────────────────────────────────────────────────────────────

interface Opcion {
  label: string;
  value: any;
}

interface FilaPedido {
  fila: number;
  productoId: number | null;
  codbarra: string;
  descripcion: string;
  imagenUrl?: string | null;
  estado?: string;
  cantidad: number;
  precioventa: number;
  /** Porcentaje de descuento (promo/oferta) — el monto se calcula al recalcular */
  descuento: number;
  /** Monto de ISV de la línea (calculado) */
  impuesto: number;
  /** ISV que se dejó de cobrar si la venta es exenta (se acumula al importe excento) */
  impuestoExcento?: number;
  /** Lo que muestra la tabla: bruto − descuento + ISV */
  subTotal: number;
  /** Detalle existente (modo edición) */
  pospeddetId?: number | null;
}

/** Fila de la tabla de pagos — misma estructura que PagoFactura de Nueva Factura */
interface PagoPedido {
  formapagoId: number | null;
  tarjetacreditoId: number | null;
  nrotarjeta: string;
  nroautorizacion: string;
  importe: number;
  /** true si la forma de pago es efectivo (para importe_efectivo vs importe_otros) */
  esEfectivo: boolean;
}

@Component({
  selector: 'app-pedido-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    SelectButtonModule,
    TableModule,
    DialogModule,
    TagModule,
    TooltipModule,
    IconFieldModule,
    InputIconModule,
    PopoverModule,
    ConfirmDialogModule,
  ],
  // ConfirmationService local: aisla nuestro p-confirmdialog del global de main-layout
  providers: [DialogService, ConfirmationService],
  templateUrl: './pedido-form.html',
  styleUrl: './pedido-form.scss',
})
export class PedidoForm implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private msgs = inject(MessageService);
  private destroyRef = inject(DestroyRef);
  private navegacion = inject(NavegacionService);
  private todp = inject(TodoPagoService);
  private confirm = inject(ConfirmationService);

  ref: DynamicDialogRef | undefined;

  //── Estado del pedido ──
  pedidoId = signal<number | null>(null);
  snFacturado = signal('N');
  facturaId = signal<number | null>(null);
  /** Nro. fiscal de la factura generada (el que se muestra; fallback a facturaId) */
  nrofactura = signal<number | null>(null);
  /** true = hubo cambios sin guardar */
  private sucio = false;

  //── Datos del formulario (panel derecho) ──
  clienteId = signal<number | null>(null);
  nombreCliente = signal('');
  telefono = signal('');
  envioGratis = signal('N');

  //── Cabecera fiscal / crédito (paridad total con posfacmae — Nueva Factura) ──
  tipoFactura = signal<string>('E');
  rtnCliente = signal('');
  snExcenta = signal('N');
  tipoConstancia = signal('FNE');
  nroConstancia = signal('');
  importeExcento = signal(0);
  diasCredito = signal(0);
  fechaVencimiento = signal<Date | null>(null);
  gestorId = signal<number | null>(null);
  /** Gestores de VENTAS (ttipogestores módulo 3 = Facturación) activos — opciones del select del header */
  gestores = signal<Opcion[]>([]);

  /** Descuento global (catálogo /facturacion/descuentos) — mismo criterio que Nueva Factura */
  descuentos = signal<Opcion[]>([]);
  descuentoGlobalId = signal<number | null>(null);
  private descuentosMap = new Map<number, number>();
  private descAcumulables = new Set<number>();

  readonly tipoOptions: Opcion[] = [
    { label: 'Contado', value: 'E' },
    { label: 'Crédito', value: 'C' },
  ];

  readonly tipoConstanciaOpciones: Opcion[] = [
    { label: 'Orden Compra Excenta', value: 'OCE' },
    { label: 'Registro Exonerado SAG', value: 'SAG' },
    { label: 'Constancia Registro Exonerado', value: 'CEA' },
    { label: 'Factura NO excenta', value: 'FNE' },
  ];

  clientes = signal<Opcion[]>([]);
  private clientesArray: any[] = [];

  //── Líneas (tabla) ──
  filas = signal<FilaPedido[]>([]);
  private contadorFila = 0;

  // ARFM20261030 MEJORA consumida en pedido-form.html (<ng-template #footer>):
  // filas en blanco mínimas para que la tabla nunca quede "a media altura".
  readonly MIN_ROWS = 7;

  get emptyRows(): any[] {
    const missingRows = this.MIN_ROWS - this.filas().length;
    return missingRows > 0 ? new Array(missingRows) : [];
  }

  qProducto = signal('');
  cargando = signal(false);
  guardando = signal(false);

  //── Popover de existencia al hacer click en la imagen de la fila ──
  // (patrón Popover#datatable de PrimeNG v21, con "Buy" reemplazado por la existencia)
  @ViewChild('op') op?: Popover;
  productoSeleccionado = signal<FilaPedido | null>(null);

  totales = signal({ subTotal: 0, descuento: 0, impuesto: 0, total: 0 });

  //── Catálogos ──
  private productosArray: any[] = [];
  private existenciasMap = new Map<number, number>();
  private imagenesMap = new Map<number, string>();
  private ofertasMap = new Map<number, { porcentaje: number; precioConDescuento: number }>();

  //── ISV — mismo criterio que nueva-factura / CRM (param-fac módulo 3) ──
  private impuestos: any[] = [];
  private impuestoId: number | null = null;
  private tasaImpuesto = 0;
  tasaImpuestoPct = 0;
  /** true = el precio de venta YA incluye el ISV (param-fac sn_impuestoincluido) */
  private impuestoIncluido = false;

  //── Checkout (dialog) — tabla de múltiples pagos (igual que Nueva Factura) ──
  dialogPago = signal(false);
  procesando = signal(false);
  formaspago = signal<Opcion[]>([]);
  tarjetasCredito = signal<Opcion[]>([]);
  readonly formasPagoPermitidas = ['tarjeta', 'transferencia', 'todo pago', 'efectivo'];

  pagos = signal<PagoPedido[]>([]);

  //── TodoPago: link de pago de la factura generada por el checkout ──
  linkPago = signal<TodoPagoLink | null>(null);
  linkStatus = signal<string>('pending');
  linkCopiado = signal(false);
  private facturarConLink = false;
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  readonly snOptions: Opcion[] = [
    { label: 'No', value: 'N' },
    { label: 'Sí', value: 'S' },
  ];

  /** Pedido bloqueado: solo lectura (ya facturado) */
  soloLectura = computed(() => this.snFacturado() === 'S');

  //── Cálculos de la tabla de pagos (mismos que Nueva Factura) ──
  inicializarPagos() {
    const pagosInit: PagoPedido[] = this.formaspago().map((fp) => ({
      formapagoId: fp.value,
      tarjetacreditoId: null,
      nrotarjeta: '',
      nroautorizacion: '',
      importe: 0,
      esEfectivo: this.esEfectivoLabel(fp.label),
    }));
    this.pagos.set(pagosInit);
  }

  agregarPago() {
    this.pagos.update((p) => [
      ...p,
      {
        formapagoId: null,
        tarjetacreditoId: null,
        nrotarjeta: '',
        nroautorizacion: '',
        importe: 0,
        esEfectivo: false,
      },
    ]);
  }

  quitarPago(idx: number) {
    this.pagos.update((p) => p.filter((_, i) => i !== idx));
  }

  pagosConImporte(): PagoPedido[] {
    return this.pagos().filter((p) => (Number(p.importe) || 0) > 0);
  }

  totalPagos(): number {
    return this.pagosConImporte().reduce((sum, p) => sum + (Number(p.importe) || 0), 0);
  }

  cambioTotal(): number {
    return Math.max(0, this.totalPagos() - this.totales().total);
  }

  pendiente(): number {
    return Math.max(0, this.totales().total - this.totalPagos());
  }

  esTarjeta(pago: PagoPedido): boolean {
    const fp = this.formaspago().find((f) => f.value === pago.formapagoId);
    return fp?.label?.toLowerCase().includes('tarjeta') ?? false;
  }

  esTransferencia(pago: PagoPedido): boolean {
    const fp = this.formaspago().find((f) => f.value === pago.formapagoId);
    return fp?.label?.toLowerCase().includes('transferencia') ?? false;
  }

  esEfectivoLabel(label: string): boolean {
    return (label ?? '').toLowerCase().includes('efectivo');
  }

  constructor(public dialogService: DialogService) {}

  ngOnInit() {
    this.cargarCatalogos().then(() => {
      const id = this.route.snapshot.paramMap.get('id');
      if (id && id !== 'nuevo') {
        this.cargarPedido(Number(id));
      }
    });
    this.cargarISV();
    this.cargarPagos();
    this.cargarDescuentos();
    this.cargarParamCxc();
    this.cargarGestor();
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      if (this.dialogPago()) {
        this.dialogPago.set(false);
        return;
      }
      this.volver();
      return;
    }
    // Atajos (mismos que Nueva Factura)
    if (e.altKey && e.key === '1') {
      e.preventDefault();
      if (!this.soloLectura()) this.showHelperProductos();
    }
    if (e.altKey && e.key === '2') {
      e.preventDefault();
      if (!this.soloLectura()) this.abrirNuevoCliente();
    }
  }

  /** Cliente rápido desde el panel (vuelve con NavegacionService) */
  abrirNuevoCliente() {
    this.router.navigate(['/cxc/clientes/nuevo'], { queryParams: { modo: 'facturacion' } });
  }

  // ═════════════════════════════════════════════════════════════════════════
  // CARGA
  // ═════════════════════════════════════════════════════════════════════════

  /** Catálogo base en paralelo: clientes, productos, existencias, imágenes, ofertas */
  private cargarCatalogos(): Promise<void> {
    const clientes$ = this.api.get<any>('/cxc/clientes').pipe(catchError(() => of(null)));
    const existencias$ = this.api
      .get<any[]>('/inventario/existencias')
      .pipe(catchError(() => of([] as any[])));
    const productos$ = this.api
      .get<any[]>('/inventario/productos')
      .pipe(catchError(() => of([] as any[])));
    const imagenes$ = this.api
      .get<any[]>('/inventario/productos-img')
      .pipe(catchError(() => of([] as any[])));
    const ofertas$ = this.api
      .get<any>('/facturacion/combos-ofertas')
      .pipe(catchError(() => of(null)));

    return firstValueFrom(forkJoin([clientes$, existencias$, productos$, imagenes$, ofertas$]))
      .then(([resCli, existencias, productos, imagenes, resOfertas]) => {
        // Clientes
        this.clientesArray = resCli?.data ?? [];
        this.clientes.set(
          this.clientesArray.map((c) => ({
            label: `${c.nrocliente ?? ''} - ${c.nombres ?? ''} ${c.apellidos ?? ''}`.trim(),
            value: c.clienteId,
          })),
        );

        // Existencias por producto (suma por bodega)
        const m = new Map<number, number>();
        for (const e of existencias ?? []) {
          const id = Number(e.productoId);
          m.set(id, (m.get(id) ?? 0) + Number(e.existencia ?? 0));
        }
        this.existenciasMap = m;

        this.productosArray = productos ?? [];

        // Imágenes base64
        const img = new Map<number, string>();
        for (const i of imagenes ?? []) {
          const id = Number(i.productoId);
          if (i.sn_activo === 'S' && i.img && !img.has(id)) {
            img.set(id, this.resolverImagen(i.img));
          }
        }
        this.imagenesMap = img;

        // Ofertas / promociones
        const ofertas = resOfertas?.value ?? resOfertas ?? [];
        this.ofertasMap.clear();
        for (const o of Array.isArray(ofertas) ? ofertas : []) {
          this.ofertasMap.set(Number(o.productoId), {
            porcentaje: Number(o.porcentaje),
            precioConDescuento: Number(o.precioConDescuento),
          });
        }
      })
      .catch(() => undefined);
  }

  /** Carga un pedido existente + sus detalles (modo edición) */
  private cargarPedido(pedidoId: number) {
    this.cargando.set(true);
    forkJoin({
      pedido: this.api.get<any>(`/facturacion/pedidos/${pedidoId}`),
      detalles: this.api
        .get<any[]>(`/facturacion/pedidos-det/pedido/${pedidoId}`)
        .pipe(catchError(() => of([] as any[]))),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ pedido, detalles }) => {
          this.pedidoId.set(pedido.pospedmaeId);
          this.snFacturado.set(pedido.sn_facturado ?? 'N');
          this.facturaId.set(pedido.facturaId ?? null);
          this.nrofactura.set(pedido.nrofactura ?? null);
          this.clienteId.set(pedido.clienteId ?? null);
          this.nombreCliente.set(pedido.nombrecliente ?? '');
          this.telefono.set(pedido.nrotelefono ?? '');
          this.envioGratis.set(pedido.sn_enviogratis ?? 'N');
          // Cabecera fiscal / crédito (paridad con posfacmae)
          this.tipoFactura.set(pedido.tipofactura ?? 'E');
          this.rtnCliente.set(pedido.rtn_cliente ?? '');
          this.snExcenta.set(pedido.sn_excenta ?? 'N');
          this.tipoConstancia.set(pedido.tipoconstancia ?? 'FNE');
          this.nroConstancia.set(pedido.nroconstancia ?? '');
          this.importeExcento.set(Number(pedido.importe_excento) || 0);
          this.diasCredito.set(Number(pedido.diascredito) || 0);
          this.fechaVencimiento.set(
            pedido.fechavencimiento ? new Date(pedido.fechavencimiento) : null,
          );
          this.gestorId.set(pedido.gestorId ?? null);

          const nuevas: FilaPedido[] = (detalles ?? []).map((d) => this.filaDesdeDetalle(d));
          this.contadorFila = Math.max(0, ...nuevas.map((f) => f.fila));
          this.filas.set(nuevas);
          // Recalcular con la tasa real + banderas vigentes (exenta/descuento):
          // unificar el cálculo de las líneas con el criterio actual de param-fac
          for (const r of this.filas()) this.recalcularFila(r);
          this.recalcularTotales();
          this.sucio = false;
          this.cargando.set(false);
        },
        error: () => {
          this.cargando.set(false);
          this.msgs.add({ severity: 'error', summary: 'Error', detail: 'Pedido no encontrado' });
        },
      });
  }

  /** Convierte un pospeddet en fila de edición (enriquece descripción/imagen desde catálogo) */
  private filaDesdeDetalle(d: any): FilaPedido {
    const productoId = Number(d.productoId);
    const prod = this.productosArray.find(
      (p) => Number(p.produtoId ?? p.productoId) === productoId,
    );
    const cantidad = Number(d.cantidad) || 0;
    const precio = Number(d.precioventa) || 0;
    const bruto = cantidad * precio;
    const descMonto = Number(d.descuento) || 0;
    const impuesto = Number(d.impuesto) || 0;
    const descPct =
      d.p_descuento != null
        ? Number(d.p_descuento) || 0
        : bruto > 0
          ? Math.round((descMonto / bruto) * 10000) / 100
          : 0;
    const existencia = this.getExistencia(productoId);
    return {
      fila: ++this.contadorFila,
      pospeddetId: d.pospeddetId,
      productoId,
      codbarra: d.codbarra ?? '',
      descripcion: prod?.descripcion || `Producto #${productoId}`,
      imagenUrl: this.imagenesMap.get(productoId) ?? null,
      estado: this.calcularEstado(existencia),
      cantidad,
      precioventa: precio,
      descuento: descPct,
      impuesto,
      subTotal: Math.round((bruto - descMonto + impuesto) * 100) / 100,
    };
  }

  /** ISV: param-fac (módulo 3) + catálogo de impuestos — mismo criterio que nueva-factura */
  private cargarISV() {
    forkJoin({
      impuestos: this.api
        .get<any[]>('/parametros/impuestos')
        .pipe(catchError(() => of([] as any[]))),
      param: this.api
        .get<any>('/parametros/parametros/objeto?moduloId=3')
        .pipe(catchError(() => of(null))),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ impuestos, param }) => {
        this.impuestos = impuestos ?? [];
        this.impuestoId = Number(param?.impuestoId) || null;
        this.impuestoIncluido = param?.sn_impuestoincluido === 'S';
        this.aplicarTasa();
        // Si ya hay filas cargadas, recalcular con la tasa real
        for (const r of this.filas()) this.recalcularFila(r);
      });
  }

  private aplicarTasa() {
    if (!this.impuestos.length) return;
    const porId = this.impuestos.find(
      (i) => i.impuestoId === this.impuestoId && i.sn_activo === 'S',
    );
    const porModulo =
      porId || this.impuestos.find((i) => Number(i.moduloId) === 3 && i.sn_activo === 'S');
    if (porModulo && Number(porModulo.porcentaje) > 0) {
      this.tasaImpuestoPct = Number(porModulo.porcentaje);
      this.tasaImpuesto = this.tasaImpuestoPct / 100;
    }
  }

  /** Formas de pago y tarjetas (para el diálogo de checkout) */
  private cargarPagos() {
    forkJoin({
      formaspago: this.api
        .get<any[]>('/parametros/formas-pago')
        .pipe(catchError(() => of([] as any[]))),
      tarjetas: this.api
        .get<any[]>('/parametros/tarjetas-credito')
        .pipe(catchError(() => of([] as any[]))),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ formaspago, tarjetas }) => {
        // El ERP usa TODAS las formas de pago (a diferencia del CRM online que filtra)
        this.formaspago.set(
          (formaspago ?? []).map((f) => ({ label: f.descripcion, value: f.formapagoId })),
        );
        this.tarjetasCredito.set(
          (tarjetas ?? []).map((t) => ({ label: t.descripcion, value: t.tarjetacreditoId })),
        );
      });
  }

  /** Descuentos globales — mismo criterio que Nueva Factura */
  private cargarDescuentos() {
    this.api
      .get<any>('/facturacion/descuentos')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        const items = res?.value ?? res ?? [];
        this.descuentosMap.clear();
        this.descAcumulables.clear();
        for (const d of items) {
          this.descuentosMap.set(d.descuentoId, Number(d.porcentaje) || 0);
          // Detectar descuentos acumulables (tercera edad, vejez, etc.)
          const desc = (d.descripcion ?? '').toLowerCase();
          if (desc.includes('tercera') || desc.includes('vejez') || desc.includes('adulto mayor')) {
            this.descAcumulables.add(d.descuentoId);
          }
        }
        this.descuentos.set(
          items
            .filter((d: any) => d.sn_activo === 'S')
            .map((d: any) => ({ label: d.descripcion, value: d.descuentoId })),
        );
      });
  }

  /** Días de crédito + fecha de vencimiento (param CxC módulo 4) — igual que Nueva Factura */
  private cargarParamCxc() {
    this.api
      .get<any>('/parametros/parametros/objeto?moduloId=4')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (p) => {
          this.diasCredito.set(Number(p?.diasPlazo ?? 0));
          this.refrescarVencimiento();
        },
      });
  }

  private refrescarVencimiento() {
    const v = new Date();
    v.setDate(v.getDate() + this.diasCredito());
    this.fechaVencimiento.set(v);
  }

  /** Gestores de venta (ttipogestores módulo 3 = Facturación) + precarga del usuario — igual que Nueva Factura */
  private cargarGestor() {
    const usuarioId = this.auth.currentUser()?.usuarioId;
    if (!usuarioId) return;

    this.api
      .get<any[]>('/parametros/gestores')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          // Solo gestores de VENTAS: módulo 3 (Facturación) y activos (el backend ya filtra por empresa)
          const ventas = (items ?? []).filter(
            (g) => Number(g.moduloId) === 3 && g.sn_activo !== 'N' && !!g.nombre,
          );
          this.gestores.set(
            ventas.map((g) => ({ label: String(g.nombre), value: Number(g.gestorId) })),
          );
          // Precarga: si el usuario actual tiene gestor asignado en facturación, se preselecciona
          const propio = ventas.find((g) => Number(g.usuarioId) === usuarioId);
          if (propio) this.gestorId.set(Number(propio.gestorId));
        },
        error: () => this.gestores.set([]),
      });
  }

  // ═════════════════════════════════════════════════════════════════════════
  // LÍNEAS (tabla)
  // ═════════════════════════════════════════════════════════════════════════

  /** Escaneo de código de barras (≥13 dígitos) o Enter con búsqueda */
  onBuscarProducto(event: Event) {
    const texto = (event.target as HTMLInputElement).value ?? '';
    this.qProducto.set(texto);

    if (texto.length >= 13) {
      this.api
        .get<any>('/inventario/productos/buscar', { q: texto.trim() })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (res) => {
            const items = Array.isArray(res) ? res : (res?.value ?? []);
            const producto = items.find((p: any) =>
              (p.codbarra ?? '').trim().startsWith(texto.trim()),
            );
            if (producto) {
              this.agregarProducto(producto);
              this.qProducto.set('');
            } else {
              this.msgs.add({
                severity: 'warn',
                summary: 'No encontrado',
                detail: `No se encontró producto con código ${texto}`,
              });
            }
          },
        });
    }
  }

  /** Abre/cierra el popover de existencia al hacer click en la imagen de la fila */
  mostrarExistenciaImagen(event: Event, row: FilaPedido) {
    if (this.productoSeleccionado()?.fila === row.fila) {
      this.op?.hide();
      this.productoSeleccionado.set(null);
    } else {
      this.productoSeleccionado.set(row);
      this.op?.show(event);
      if (this.op?.container) {
        this.op.align();
      }
    }
  }

  ocultarPopoverExistencia() {
    this.op?.hide();
    this.productoSeleccionado.set(null);
  }

  /** Abre el helper de productos (DynamicDialog — mismo patrón que nueva-factura) */
  showHelperProductos() {
    this.ref = this.dialogService.open(ProductosHelperList, {
      header: 'Seleccionar un producto',
      width: '50vw',
      modal: true,
      contentStyle: { overflow: 'auto' },
      breakpoints: { '960px': '75vw', '640px': '90vw' },
      templates: { footer: FooterHelper },
    });

    this.ref.onClose.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((data: any) => {
      if (data && 'codbarra' in data) {
        this.agregarProducto(data);
        this.msgs.add({
          severity: 'info',
          summary: 'Producto seleccionado',
          detail: data?.descripcion,
          life: 3000,
        });
      }
    });
  }

  /** Agrega un producto como línea del pedido (o suma 1 si ya existe) */
  private agregarProducto(p: any) {
    const productoId = Number(p.produtoId ?? p.productoId) || null;
    const existencia = Number(p.existencia ?? this.existenciasMap.get(productoId ?? -1) ?? 0);
    const tieneRegistro = this.existenciasMap.has(productoId ?? -1);
    const estado = !tieneRegistro ? 'SIN_STOCK' : this.calcularEstado(existencia);

    if (estado === 'AGOTADO') {
      this.msgs.add({
        severity: 'warn',
        summary: 'Sin existencia',
        detail: `${p.descripcion} no tiene existencia disponible`,
      });
      return;
    }

    const existente = this.filas().find((f) => f.productoId === productoId);
    if (existente) {
      const nuevaCant = existente.cantidad + 1;
      if (tieneRegistro && nuevaCant > existencia) {
        this.msgs.add({
          severity: 'warn',
          summary: 'Stock insuficiente',
          detail: `Solo quedan ${existencia} unidades`,
        });
        return;
      }
      existente.cantidad = nuevaCant;
      this.recalcularFila(existente);
      this.sucio = true;
      return;
    }

    const oferta = this.ofertasMap.get(productoId ?? -1) ?? null;
    // Descuento: promo tiene prioridad, EXCEPTO tercera edad que se acumula
    const descGlobal = this.descuentoGlobalId();
    let descuento = oferta?.porcentaje ?? 0;
    if (oferta) {
      if (descGlobal && this.esDescuentoAcumulable()) {
        descuento += this.descuentosMap.get(descGlobal) ?? 0;
      }
    } else if (descGlobal) {
      descuento = this.descuentosMap.get(descGlobal) ?? 0;
    }

    const row: FilaPedido = {
      fila: ++this.contadorFila,
      productoId,
      codbarra: p.codbarra ?? '',
      descripcion: p.descripcion ?? '',
      imagenUrl: this.imagenesMap.get(productoId ?? -1) ?? null,
      estado,
      cantidad: 1,
      precioventa: Number(p.precioventa) || 0,
      descuento,
      impuesto: 0,
      subTotal: 0,
      pospeddetId: null,
    };
    this.filas.update((f) => [...f, row]);
    this.recalcularFila(row);
    this.sucio = true;
  }

  quitarFila(idx: number) {
    if (this.soloLectura()) return;
    this.filas.update((f) => f.filter((_, i) => i !== idx));
    this.recalcularTotales();
    this.sucio = true;
  }

  /** Cálculo de la línea — mismas fórmulas que Nueva Factura:
   *  precio incluye ISV (param-fac) o no; si la venta es exenta, el ISV
   *  no se cobra y se acumula en impuestoExcento (importe excento). */
  recalcularFila(row: FilaPedido) {
    const cantidad = row.cantidad ?? 0;
    const descPct = row.descuento ?? 0;
    const exenta = this.snExcenta() === 'S';
    const bruto = Math.round(cantidad * (row.precioventa ?? 0) * 100) / 100;

    if (this.impuestoIncluido) {
      const subConImp = bruto * (1 + this.tasaImpuesto) * (1 - descPct / 100);
      const isvCalculado =
        Math.round(((subConImp * this.tasaImpuesto) / (1 + this.tasaImpuesto)) * 100) / 100;
      row.impuesto = exenta ? 0 : isvCalculado;
      row.impuestoExcento = exenta ? isvCalculado : 0;
      row.subTotal = Math.round(subConImp * 100) / 100;
    } else {
      const brutoDesc = bruto * (1 - descPct / 100);
      const isvCalculado = Math.round(brutoDesc * this.tasaImpuesto * 100) / 100;
      row.impuesto = exenta ? 0 : isvCalculado;
      row.impuestoExcento = exenta ? isvCalculado : 0;
      row.subTotal = Math.round((brutoDesc + row.impuesto) * 100) / 100;
    }

    this.filas.update((f) => [...f]);
    this.recalcularTotales();
    this.sucio = true;
  }

  private recalcularTotales() {
    let bruto = 0;
    let descuento = 0;
    let impuesto = 0;
    let impuestoExcento = 0;
    for (const r of this.filas()) {
      const b = Math.round((r.cantidad ?? 0) * (r.precioventa ?? 0) * 100) / 100;
      bruto += b;
      descuento += Math.round(b * ((r.descuento ?? 0) / 100) * 100) / 100;
      impuesto += Number(r.impuesto) || 0;
      impuestoExcento += Number(r.impuestoExcento) || 0;
    }
    // Importe excento: ISV 15% que se dejó de cobrar — calculado (no editable)
    this.importeExcento.set(Math.round(impuestoExcento * 100) / 100);
    this.totales.set({
      subTotal: Math.round(bruto * 100) / 100,
      descuento: Math.round(descuento * 100) / 100,
      impuesto: Math.round(impuesto * 100) / 100,
      total: Math.round((bruto - descuento + impuesto) * 100) / 100,
    });
  }

  /** Exenta de ISV: al desactivar se limpia la constancia; recalcula todas las líneas */
  recalcularExenta() {
    if (this.snExcenta() !== 'S') {
      this.tipoConstancia.set('FNE');
      this.nroConstancia.set('');
      this.importeExcento.set(0);
    }
    for (const r of this.filas()) this.recalcularFila(r);
    this.sucio = true;
  }

  /** Cambio del descuento global — mismas reglas que Nueva Factura:
   *  promo tiene prioridad, salvo descuento acumulable (tercera edad). */
  onDescuentoGlobalChange() {
    const id = this.descuentoGlobalId();
    const porcentaje = id ? (this.descuentosMap.get(id) ?? 0) : 0;
    const acumulable = this.esDescuentoAcumulable();
    for (const r of this.filas()) {
      if (this.esOferta(r.productoId)) {
        if (acumulable) {
          const promo = this.getOferta(r.productoId)!.porcentaje;
          r.descuento = promo + porcentaje;
          this.recalcularFila(r);
        }
        // Si NO es acumulable, no tocar la fila (mantiene promo)
      } else {
        r.descuento = porcentaje;
        this.recalcularFila(r);
      }
    }
    this.sucio = true;
  }

  /** true si el descuento global seleccionado SÍ se acumula con promos */
  esDescuentoAcumulable(): boolean {
    const id = this.descuentoGlobalId();
    return id != null && this.descAcumulables.has(id);
  }

  // ═════════════════════════════════════════════════════════════════════════
  // ACCIONES DEL PANEL
  // ═════════════════════════════════════════════════════════════════════════

  onClienteChange(value: number | null) {
    this.clienteId.set(value);
    const c = this.clientesArray.find((i) => i.clienteId === value);
    if (c) {
      this.nombreCliente.set(
        `${c.nombres ?? ''} ${c.apellidos ?? ''}`.trim() || c.razonsocial || '',
      );
      // RTN: en crédito se lee del cliente; en contado queda limpio (manual)
      this.rtnCliente.set(this.tipoFactura() === 'C' ? (c.rtn ?? '') : '');
    }
    this.sucio = true;
  }

  /** Tipo factura (E/C): en crédito el RTN se carga del cliente */
  onTipoFacturaChange() {
    if (this.tipoFactura() === 'C') {
      const c = this.clientesArray.find((i) => i.clienteId === this.clienteId());
      this.rtnCliente.set(c?.rtn ?? '');
      this.refrescarVencimiento();
    } else {
      this.rtnCliente.set('');
    }
    this.sucio = true;
  }

  onRtnChange(v: string) {
    this.rtnCliente.set(v ?? '');
    this.sucio = true;
  }

  onTipoConstanciaChange(v: string) {
    this.tipoConstancia.set(v ?? 'FNE');
    this.sucio = true;
  }

  onNroConstanciaChange(v: string) {
    this.nroConstancia.set(v ?? '');
    this.sucio = true;
  }

  onNombreChange(v: string) {
    this.nombreCliente.set(v ?? '');
    this.sucio = true;
  }

  onTelChange(v: string) {
    this.telefono.set(v ?? '');
    this.sucio = true;
  }

  onEnvioChange(v: string) {
    this.envioGratis.set(v);
    this.sucio = true;
  }

  /** Nueva factura → limpia el formulario y queda en la misma pantalla */
  nueva() {
    if (this.soloLectura()) return;
    this.pedidoId.set(null);
    this.snFacturado.set('N');
    this.facturaId.set(null);
    this.nrofactura.set(null);
    this.clienteId.set(null);
    this.nombreCliente.set('');
    this.telefono.set('');
    this.envioGratis.set('N');
    this.tipoFactura.set('E');
    this.rtnCliente.set('');
    this.snExcenta.set('N');
    this.tipoConstancia.set('FNE');
    this.nroConstancia.set('');
    this.importeExcento.set(0);
    this.descuentoGlobalId.set(null);
    this.refrescarVencimiento();
    this.filas.set([]);
    this.contadorFila = 0;
    this.qProducto.set('');
    this.dialogPago.set(false);
    this.recalcularTotales();
    this.sucio = false;
  }

  volver() {
    this.navegacion.volver(['/facturacion/pedidos']);
  }

  /**
   * Persiste el pedido: crea (POST mae + detalles) o actualiza
   * (PUT mae + DELETE/POST de detalles). Devuelve true si quedó guardado.
   */
  private async asegurarGuardado(): Promise<boolean> {
    if (this.soloLectura()) {
      this.msgs.add({
        severity: 'warn',
        summary: 'Pedido facturado',
        detail: 'El pedido ya fue facturado y no se puede modificar',
      });
      return false;
    }
    if (!this.clienteId()) {
      this.msgs.add({ severity: 'warn', summary: 'Validación', detail: 'Seleccione el cliente' });
      return false;
    }
    if (!this.nombreCliente().trim()) {
      this.msgs.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Ingrese el nombre del cliente',
      });
      return false;
    }
    if (this.filas().length === 0) {
      this.msgs.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Agregue al menos un producto',
      });
      return false;
    }
    if (this.snExcenta() === 'S') {
      if (!this.tipoConstancia()) {
        this.msgs.add({
          severity: 'warn',
          summary: 'Validación',
          detail: 'Seleccione el tipo de constancia',
        });
        return false;
      }
      if (!this.nroConstancia().trim()) {
        this.msgs.add({
          severity: 'warn',
          summary: 'Validación',
          detail: 'Ingrese el número de constancia',
        });
        return false;
      }
    }

    this.guardando.set(true);
    try {
      const clienteSel = this.clientesArray.find((i) => i.clienteId === this.clienteId());
      const mae = {
        clienteId: this.clienteId(),
        nrocliente: clienteSel?.nrocliente ?? '',
        nombrecliente: this.nombreCliente().trim(),
        nrotelefono: this.telefono().trim() || 'N/A',
        sn_enviogratis: this.envioGratis(),
        // Cabecera fiscal / crédito (paridad con posfacmae)
        tipofactura: this.tipoFactura(),
        rtn_cliente: this.rtnCliente().trim(),
        sn_excenta: this.snExcenta(),
        tipoconstancia: this.tipoConstancia(),
        nroconstancia: this.snExcenta() === 'S' ? this.nroConstancia().trim() : '',
        importe_excento: this.importeExcento(),
        diascredito: this.diasCredito(),
        fechavencimiento: this.fechaVencimiento(),
        gestorId: this.gestorId(),
        sn_facturado: 'N',
      };

      if (!this.pedidoId()) {
        const pedido: any = await firstValueFrom(this.api.post<any>('/facturacion/pedidos', mae));
        this.pedidoId.set(pedido.pospedmaeId);
        await this.sincronizarDetalles([]);
      } else {
        // Solo re-sincroniza si hubo cambios en las líneas; el mae siempre se actualiza
        await firstValueFrom(this.api.put<any>('/facturacion/pedidos', this.pedidoId(), mae));
        if (this.sucio) {
          const existentes: any[] = await firstValueFrom(
            this.api
              .get<any[]>(`/facturacion/pedidos-det/pedido/${this.pedidoId()}`)
              .pipe(catchError(() => of([] as any[]))),
          );
          await this.sincronizarDetalles(existentes ?? []);
        }
      }

      this.sucio = false;
      this.guardando.set(false);
      return true;
    } catch (err) {
      console.error('Error al guardar pedido', err);
      this.guardando.set(false);
      this.msgs.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo guardar el pedido',
      });
      return false;
    }
  }

  /** Borra los detalles existentes y crea los de la tabla (secuencial, ids estables) */
  private async sincronizarDetalles(existentes: any[]): Promise<void> {
    const id = this.pedidoId()!;
    for (const d of existentes) {
      await firstValueFrom(this.api.delete<any>('/facturacion/pedidos-det', d.pospeddetId));
    }
    const filas = this.filas();
    for (let i = 0; i < filas.length; i++) {
      const r = filas[i];
      const bruto = Math.round((r.cantidad ?? 0) * (r.precioventa ?? 0) * 100) / 100;
      const descMonto = Math.round(bruto * ((r.descuento ?? 0) / 100) * 100) / 100;
      await firstValueFrom(
        this.api.post<any>('/facturacion/pedidos-det', {
          pospedmaeId: id,
          productoId: r.productoId,
          codbarra: r.codbarra || '',
          cantidad: r.cantidad,
          precioventa: r.precioventa,
          subtotal: bruto,
          descuento: descMonto,
          p_descuento: r.descuento ?? 0,
          impuesto: r.impuesto ?? 0,
          nrofila: i + 1,
        }),
      );
    }
  }

  /** Botón Guardar → guarda y vuelve al listado */
  async guardar() {
    const ok = await this.asegurarGuardado();
    if (!ok) return;
    const id = this.pedidoId();
    this.msgs.add({
      severity: 'success',
      summary: `Pedido #${id} guardado`,
      detail: 'Pedido listo para facturar',
    });
    this.router.navigate(['/facturacion/pedidos']);
  }

  /** Botón Facturar/Pagar → guarda (si hace falta) y según tipo:
   *  contado → diálogo de pago; crédito → facturar directo sin pagos */
  async facturar() {
    if (this.snFacturado() === 'S') {
      this.msgs.add({
        severity: 'warn',
        summary: 'Pedido facturado',
        detail: 'El pedido ya fue facturado',
      });
      return;
    }
    const ok = await this.asegurarGuardado();
    if (!ok) return;
    if (this.tipoFactura() === 'C') {
      this.checkoutCredito();
    } else {
      this.abrirDialogPago();
    }
  }

  /** Checkout a crédito: sin filas de caja ni pagos (backend genera movimiento CxC) */
  private checkoutCredito() {
    const id = this.pedidoId();
    if (!id) return;

    this.procesando.set(true);
    this.api
      .post<any>(
        '/facturacion/pedidos/checkout',
        {
          pospedmaeId: id,
          nombrecliente: this.nombreCliente().trim(),
          nrotelefono: this.telefono().trim() || 'N/A',
        },
        { sinContexto: true },
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resp) => {
          this.procesando.set(false);
          this.snFacturado.set('S');
          this.facturaId.set(resp.facturaId ?? null);
          this.nrofactura.set(resp.nrofactura ?? null);
          this.msgs.add({
            severity: 'success',
            summary: 'Pedido facturado a crédito',
            detail: `Factura #${resp.nrofactura} — ${this.moneda(Number(resp.total))}`,
          });
          this.router.navigate(['/facturacion/pedidos']);
        },
        error: (err) => {
          console.error('Error en checkout de pedido (crédito)', err);
          this.procesando.set(false);
          this.msgs.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo facturar el pedido',
          });
        },
      });
  }

  // ═════════════════════════════════════════════════════════════════════════
  // CHECKOUT (diálogo de pago)
  // ═════════════════════════════════════════════════════════════════════════

  private abrirDialogPago() {
    this.inicializarPagos();
    this.dialogPago.set(true);
  }

  /**
   * Validación de la tabla de pagos — DEBE ser método y NO computed(): las filas
   * son objetos planos ligados con ngModel, un computed() se congelaría en false
   * (misma lección que formularioPagoValido en pedidos-virtual / Nueva Factura).
   */
  formularioPagoValido(): boolean {
    const pagos = this.pagosConImporte();
    if (pagos.length === 0) return false;
    for (const p of pagos) {
      if (p.formapagoId == null) return false;
      if (this.esTarjeta(p)) {
        const num = p.nrotarjeta?.replace(/\s/g, '') || '';
        if (!(num.length >= 13 && this.validarLuhn(num) && p.tarjetacreditoId)) return false;
      }
      if (this.esTransferencia(p) && !p.nroautorizacion?.trim()) return false;
    }
    return this.totalPagos() >= this.totales().total;
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

  /** Resuelve si una fila de pago es efectivo según el catálogo de formas de pago */
  private esEfectivoFila(p: PagoPedido): boolean {
    const fp = this.formaspago().find((f) => f.value === p.formapagoId);
    return this.esEfectivoLabel(fp?.label ?? '');
  }

  /** Confirma el pago → POST /facturacion/pedidos/checkout (crea la factura + filas de caja) */
  procesarPago() {
    const pagos = this.pagosConImporte();
    const t = this.totales();

    if (pagos.length === 0) {
      this.msgs.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Ingrese importe en las formas de pago',
      });
      return;
    }
    for (const p of pagos) {
      if (this.esTarjeta(p)) {
        const num = p.nrotarjeta?.replace(/\s/g, '') || '';
        if (num.length < 13 || !this.validarLuhn(num)) {
          this.msgs.add({
            severity: 'warn',
            summary: 'Validación',
            detail: 'Número de tarjeta inválido',
          });
          return;
        }
        if (!p.tarjetacreditoId) {
          this.msgs.add({
            severity: 'warn',
            summary: 'Validación',
            detail: 'Seleccione el tipo de tarjeta',
          });
          return;
        }
      }
      if (this.esTransferencia(p) && !p.nroautorizacion?.trim()) {
        this.msgs.add({
          severity: 'warn',
          summary: 'Validación',
          detail: 'Ingrese el número de autorización',
        });
        return;
      }
    }
    const totalPagado = this.totalPagos();
    if (totalPagado < t.total) {
      this.msgs.add({
        severity: 'warn',
        summary: 'Validación',
        detail: `Falta por pagar: ${this.moneda(t.total - totalPagado)}`,
      });
      return;
    }

    const id = this.pedidoId();
    if (!id) return;
    const primero = pagos[0];
    const tipopago =
      primero.esEfectivo || this.esEfectivoFila(primero)
        ? 'E'
        : this.esTarjeta(primero)
          ? 'T'
          : 'TR';

    // ── TodoPago: si algún pago es por link, la factura nace pendiente y
    //    tras el checkout se genera el link (el TP no entra a posfaccaja) ──
    this.facturarConLink = pagos.some((p) => p.formapagoId === FORMAPAGO_TODOPAGO);

    this.procesando.set(true);
    this.api
      .post<any>(
        '/facturacion/pedidos/checkout',
        {
          pospedmaeId: id,
          nombrecliente: this.nombreCliente().trim(),
          nrotelefono: this.telefono().trim() || 'N/A',
          formapagoId: primero.formapagoId,
          efectivo_recibido: totalPagado,
          tarjetacreditoId: this.esTarjeta(primero)
            ? (primero.tarjetacreditoId ?? undefined)
            : undefined,
          nrotarjeta: this.esTarjeta(primero) ? primero.nrotarjeta || undefined : undefined,
          nroautorizacion: primero.nroautorizacion || undefined,
          tipopago,
          pagos: pagos.map((p) => ({
            formapagoId: p.formapagoId,
            tarjetacreditoId: p.tarjetacreditoId || undefined,
            nrotarjeta: p.nrotarjeta || undefined,
            nroautorizacion: p.nroautorizacion || undefined,
            importe: Number(p.importe) || 0,
            esEfectivo: this.esEfectivoFila(p),
          })),
        },
        { sinContexto: true },
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resp) => {
          this.procesando.set(false);
          this.dialogPago.set(false);
          this.snFacturado.set('S');
          this.facturaId.set(resp.facturaId ?? null);
          this.nrofactura.set(resp.nrofactura ?? null);
          this.msgs.add({
            severity: 'success',
            summary: 'Pedido facturado',
            detail: `Factura #${resp.nrofactura} — ${this.moneda(Number(resp.total))} — ${pagos.length} pago(s)`,
          });
          if (this.facturarConLink && resp.facturaId) {
            // Con pago TodoPago nos quedamos en la página para mostrar el link
            this.generarLinkPago(resp);
          } else {
            this.router.navigate(['/facturacion/pedidos']);
          }
        },
        error: (err) => {
          console.error('Error en checkout de pedido', err);
          this.procesando.set(false);
          this.msgs.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo facturar el pedido',
          });
        },
      });
  }

  // ═══════════════════ TodoPago — link de pago ═══════════════════

  /** Genera el link para la factura creada por el checkout y abre el diálogo headless */
  private generarLinkPago(fac: { facturaId: number; nrofactura?: number }) {
    this.todp
      .generarLink(fac.facturaId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (link) => {
          this.linkPago.set(link);
          this.linkStatus.set(link.status || 'pending');
          this.linkCopiado.set(false);
          this.iniciarPollingLink(link.operationId);
          // El toast queda reemplazado por el diálogo headless (llamativo)
          this.mostrarDialogoLink();
        },
        error: (err) => {
          console.error('Error al generar link de pago', err);
          this.msgs.add({
            severity: 'warn',
            summary: 'Link de pago',
            detail: `Factura #${fac.nrofactura} creada, pero no se pudo generar el link`,
          });
        },
      });
  }

  /** Consulta el estado cada 10 s mientras esté pendiente */
  private iniciarPollingLink(operationId: string) {
    this.detenerPollingLink();
    this.pollTimer = setInterval(() => {
      if (this.linkPago()?.operationId !== operationId) {
        this.detenerPollingLink();
        return;
      }
      this.todp
        .getStatus(operationId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (tx) => {
            this.linkStatus.set(tx.status);
            if (tx.status !== 'pending') {
              this.detenerPollingLink();
              if (tx.status === 'completed') {
                this.msgs.add({
                  severity: 'success',
                  summary: 'Pago confirmado',
                  detail: `Factura #${tx.nrofactura || tx.facturaid} pagada vía TodoPago`,
                  life: 8000,
                });
                // Reabre el diálogo headless con la variante "¡Pago confirmado!"
                this.mostrarDialogoLink();
              } else if (tx.status === 'failed' || tx.status === 'expired') {
                this.msgs.add({
                  severity: 'warn',
                  summary: 'Pago no completado',
                  detail: 'La transacción TodoPago finalizó sin completarse',
                  life: 8000,
                });
              }
            }
          },
          error: () => {
            /* el polling tolera fallos transitorios */
          },
        });
    }, 10000);
    this.destroyRef.onDestroy(() => this.detenerPollingLink());
  }

  private detenerPollingLink(): void {
    if (this.pollTimer !== null) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  /**
   * Diálogo headless (ConfirmDialog) llamativo para el link TodoPago.
   * El template decide la variante según linkStatus():
   *  - pending  → link generado (badge link + monto + url + acciones)
   *  - completed → ¡Pago confirmado! (badge check + monto + Entendido)
   */
  mostrarDialogoLink(): void {
    if (!this.linkPago()) return;
    this.confirm.confirm({
      key: 'tp-link',
      header: 'Link de pago TodoPago',
      message: 'Link de pago generado',
      icon: 'pi pi-link',
      modal: true,
      closable: true,
      closeOnEscape: true,
      dismissableMask: true,
      // Headless: sin botones por defecto (bug PrimeNG #17000 — el footer se oculta por CSS)
      acceptVisible: false,
      rejectVisible: false,
      // style/breakpoints van declarativos en <p-confirmdialog> (no existen en Confirmation)
    });
  }

  /** Estado visible de la card del link */
  labelEstadoLink(): string {
    switch (this.linkStatus()) {
      case 'completed':
        return 'Pagado';
      case 'failed':
        return 'Fallido';
      case 'expired':
        return 'Expirado';
      case 'reversed':
        return 'Reversado';
      default:
        return 'Pendiente';
    }
  }

  severityEstadoLink(): 'success' | 'warn' | 'danger' | 'info' {
    switch (this.linkStatus()) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'danger';
      case 'expired':
        return 'warn';
      case 'reversed':
        return 'danger';
      default:
        return 'info';
    }
  }

  async copiarLink(): Promise<void> {
    const url = this.linkPago()?.url;
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      this.linkCopiado.set(true);
      setTimeout(() => this.linkCopiado.set(false), 2500);
      this.msgs.add({
        severity: 'success',
        summary: 'Copiado',
        detail: 'Link copiado al portapapeles',
        life: 2500,
      });
    } catch {
      this.msgs.add({ severity: 'warn', summary: 'Copiar', detail: 'No se pudo copiar el link' });
    }
  }

  abrirLink(): void {
    const url = this.linkPago()?.url;
    if (url) window.open(url, '_blank', 'noopener');
  }

  cerrarLink(): void {
    this.detenerPollingLink();
    this.linkPago.set(null);
    this.linkStatus.set('pending');
  }

  /** Reconsulta el estado bajo demanda (botón "Estado") */
  consultarEstadoLink(): void {
    const link = this.linkPago();
    if (!link) return;
    this.todp
      .getStatus(link.operationId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (tx) => {
          this.linkStatus.set(tx.status);
          if (tx.status !== 'pending') this.detenerPollingLink();
          if (tx.status === 'completed') {
            this.msgs.add({
              severity: 'success',
              summary: 'Pago confirmado',
              detail: `Factura #${tx.nrofactura || tx.facturaid} pagada vía TodoPago`,
              life: 8000,
            });
            this.mostrarDialogoLink();
          }
        },
        error: () =>
          this.msgs.add({
            severity: 'warn',
            summary: 'Estado',
            detail: 'No se pudo consultar el estado',
          }),
      });
  }

  /** Auto-asignar el importe pendiente al elegir TodoPago como forma de pago */
  onFormaPagoChange(pago: PagoPedido): void {
    if (pago.formapagoId !== FORMAPAGO_TODOPAGO) return;
    const otros = this.pagosConImporte()
      .filter((p) => p !== pago && p.formapagoId !== FORMAPAGO_TODOPAGO)
      .reduce((s, p) => s + (Number(p.importe) || 0), 0);
    const pendiente = Math.round((this.totales().total - otros) * 100) / 100;
    if (pendiente > 0) pago.importe = pendiente;
  }

  // ═════════════════════════════════════════════════════════════════════════
  // UTILIDADES
  // ═════════════════════════════════════════════════════════════════════════

  private calcularEstado(existencia: number): string {
    if (existencia <= 0) return 'AGOTADO';
    if (existencia <= 5) return 'BAJO';
    return 'ALTA';
  }

  getSeverity(estado?: string) {
    switch (estado) {
      case 'ALTA':
        return 'success';
      case 'BAJO':
        return 'warn';
      case 'AGOTADO':
        return 'danger';
      case 'SIN_STOCK':
        return 'info';
      default:
        return 'secondary';
    }
  }

  getExistencia(productoId: number | null): number {
    return productoId ? (this.existenciasMap.get(productoId) ?? 0) : 0;
  }

  getOferta(productoId: number | null): { porcentaje: number; precioConDescuento: number } | null {
    return productoId ? (this.ofertasMap.get(productoId) ?? null) : null;
  }

  esOferta(productoId: number | null): boolean {
    return productoId ? this.ofertasMap.has(productoId) : false;
  }

  private resolverImagen(img: string): string {
    return /^data:/i.test(img) ? img : `data:image/png;base64,${img}`;
  }

  moneda(n: number | undefined): string {
    return (n ?? 0).toLocaleString('es-HN', { style: 'currency', currency: 'HNL' });
  }

  estadoPedidoLabel(): string {
    if (this.snFacturado() === 'S') return 'Facturado';
    return this.pedidoId() ? 'Pendiente' : 'Nuevo';
  }

  estadoPedidoSeverity(): 'success' | 'warn' | 'info' {
    if (this.snFacturado() === 'S') return 'success';
    return this.pedidoId() ? 'warn' : 'info';
  }
}
