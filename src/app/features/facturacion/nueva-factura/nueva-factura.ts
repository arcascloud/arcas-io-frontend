import { Component, inject, signal, computed, OnInit, DestroyRef, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToolbarModule } from 'primeng/toolbar';
import { TagModule } from 'primeng/tag';
import { forkJoin } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ApiService } from '../../../core/services/api.service';
import { FacturacionService } from '../../../core/services/facturacion.service';
import { ProductosHelperList } from '../../helpers/productos';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { FooterHelper } from '../../helpers/footer';
import { Producto } from '../../../core/models/inventario.models';
import { AuthService } from '../../../core/services/auth.service';
import { QuickNavService } from '../../../core/services/quick-nav.service';
import { FacturaImpresionService } from '../../../core/services/factura-impresion.service';
import {
  TodoPagoService,
  TodoPagoLink,
  FORMAPAGO_TODOPAGO,
} from '../../../core/services/todopago.service';
import { TooltipModule } from 'primeng/tooltip';
import { BadgeModule } from 'primeng/badge';
import { DividerModule } from 'primeng/divider';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { PopoverModule, Popover } from 'primeng/popover';

interface Opcion {
  label: string;
  value: any;
}

interface FilaDet {
  fila: number;
  productoId: number | null;
  codbarra: string;
  descripcion: string;
  imagenUrl?: string | null;
  estado?: 'ALTA' | 'BAJO' | 'AGOTADO' | string;
  cantidad: number;
  precioventa: number;
  descuento: number;
  impuesto: number;
  impuestoExcento?: number;
  subTotal: number;
}

interface PagoFactura {
  formapagoId: number | null;
  tarjetacreditoId: number | null;
  nrotarjeta: string;
  nroautorizacion: string;
  /** Importe del pago (HNL). Inicia vacío (undefined) para que el campo no muestre 0. */
  importe: number | undefined;
  nroreferencia: string;
}

@Component({
  selector: 'app-nueva-factura',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    BadgeModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    SelectButtonModule,
    TableModule,
    DialogModule,
    ToolbarModule,
    TagModule,
    TooltipModule,
    DividerModule,
    InputIconModule,
    IconFieldModule,
    PopoverModule,
    ConfirmDialogModule,
  ],
  // ConfirmationService local: aisla nuestro p-confirmdialog del global de main-layout
  providers: [DialogService, ConfirmationService],
  templateUrl: './nueva-factura.html',
  styleUrl: './nueva-factura.scss',
})
export class NuevaFactura implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private api = inject(ApiService);
  private service = inject(FacturacionService);
  private msgs = inject(MessageService);
  private destroyRef = inject(DestroyRef);
  private auth = inject(AuthService);
  private quickNav = inject(QuickNavService);
  private impresion = inject(FacturaImpresionService);
  private todp = inject(TodoPagoService);
  private confirm = inject(ConfirmationService);

  ref: DynamicDialogRef | undefined;

  private readonly MODULO_FACTURACION = 4;

  form!: FormGroup;

  cargando = signal(false);
  guardando = signal(false);

  vsize = signal('small');
  clientes = signal<Opcion[]>([]);
  formaspago = signal<Opcion[]>([]);
  tarjetas = signal<Opcion[]>([]);
  /** Gestores de VENTAS (ttipogestores módulo 3 = Facturación) activos de la empresa */
  gestores = signal<Opcion[]>([]);

  productosArray: Producto[] = [];
  dialogProductos = signal(false);
  dialogPagos = signal(false);
  qProducto = signal('');
  productosFiltrados = signal<Producto[]>([]);

  filas = signal<FilaDet[]>([]);
  pagos = signal<PagoFactura[]>([]);

  // ARFM20261030 MEJORA consumida en nueva-factura.html (<ng-template #footer>):
  // filas en blanco mínimas para que la tabla nunca quede "a media altura".
  readonly MIN_ROWS = 7;

  get emptyRows(): any[] {
    const missingRows = this.MIN_ROWS - this.filas().length;
    return missingRows > 0 ? new Array(missingRows) : [];
  }

  // ── TodoPago: link de pago de la última factura facturada ──
  linkPago = signal<TodoPagoLink | null>(null);
  linkStatus = signal<string>('pending');
  linkCopiado = signal(false);
  /** Nro. fiscal de la última factura con link (para mostrar en el diálogo headless) */
  nroFacturaLink = signal<number | null>(null);
  private facturarConLink = false;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  pagosLength = computed(() => this.pagos().length);
  descuentos = signal<Opcion[]>([]);
  descuentoGlobalId = signal<number | null>(null);

  varCodBarra = signal('');
  varProducto = signal('');
  varPrecioVenta = signal(0);

  totales = signal({ subTotal: 0, descuento: 0, impuesto: 0, total: 0, cambio: 0 });

  private contadorFila = 0;
  private tasaImpuesto = 0.15;
  private impuestoIncluido = false;
  private impuestos: any[] = [];
  private impuestoId: number | null = null;

  private existenciasMap = new Map<number, number>();
  private imagenesMap = new Map<number, string>();

  private clientesArray: any[] = [];
  private snImprimeFactura = false;
  private descuentosMap = new Map<number, number>();

  /** Mapa productoId → { porcentaje, precioConDescuento } para ofertas/promos vigentes */
  private ofertasMap = new Map<
    number,
    { porcentaje: number; precioConDescuento: number; desc: string }
  >();

  /** IDs de descuentos que SÍ se acumulan con promos (ej: Tercera Edad) */
  private descAcumulables = new Set<number>();

  nombreClienteManual = signal('');
  dialogAtajos = signal(false);
  dialogSuspendidas = signal(false);
  ventasSuspendidas = signal<any[]>([]);

  // ARFM20261030 Popover de existencia al hacer click en la imagen de la fila
  // (patrón Popover#datatable de PrimeNG v21 — reemplaza al hover-zoom anterior)
  @ViewChild('op') op?: Popover;
  productoSeleccionado = signal<FilaDet | null>(null);

  readonly atajos = [
    { tecla: 'ESC', accion: 'Cancelar factura actual' },
    { tecla: 'ALT + 1', accion: 'Buscar producto' },
    { tecla: 'ALT + 2', accion: 'Buscar cliente' },
    { tecla: 'ALT + 3', accion: 'Suspender venta actual' },
    { tecla: 'ALT + 4', accion: 'Ver ventas suspendidas' },
    { tecla: 'ALT + 5', accion: 'Editar monto a pagar' },
    { tecla: 'ALT + 6', accion: 'Agregar forma de pago' },
    { tecla: 'ALT + 7', accion: 'Pago y completar factura' },
    { tecla: 'ALT + 8', accion: 'Finalizar sin pago (crédito)' },
    { tecla: 'ALT + 9', accion: 'Ver ventana de atajos' },
  ];

  readonly tipoOptions = [
    { label: 'Contado', value: 'E' },
    { label: 'Crédito', value: 'C' },
  ];

  readonly snNombreOptions = [
    { label: 'No', value: 'N' },
    { label: 'Si', value: 'S' },
  ];

  readonly snOptions = [
    { label: 'No', value: 'N' },
    { label: 'Sí', value: 'S' },
  ];

  readonly tipoConstanciaOpciones = [
    { label: 'Orden Compra Excenta', value: 'OCE' },
    { label: 'Registro Exonerado SAG', value: 'SAG' },
    { label: 'Constancia Registro Exonerado', value: 'CEA' },
    { label: 'Factura NO excenta', value: 'FNE' },
  ];

  constructor(public dialogService: DialogService) {}

  ngOnInit() {
    this.buildForm();
    this.cargarOpciones();
    this.cargarFactorCambio();
    this.cargarParamCxc();
    this.cargarImpuestos();
    this.cargarParamFac();
    this.recalcularTotales();
  }

  private cargarParamCxc() {
    this.api
      .get<any>('/parametros/parametros/objeto?moduloId=4')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (p) => {
          const dias = Number(p?.diasPlazo ?? 0);
          const v = new Date();
          v.setDate(v.getDate() + dias);
          this.form.patchValue({
            diascredito: dias,
            fechavencimiento: v,
          });
        },
      });
  }

  private cargarImpuestos() {
    this.api
      .get<any[]>('/parametros/impuestos')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          this.impuestos = items ?? [];
          this.aplicarTasa();
        },
      });
  }

  private cargarParamFac() {
    this.api
      .get<any>('/parametros/parametros/objeto?moduloId=3')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (p) => {
          this.impuestoIncluido = p?.sn_impuestoincluido === 'S';
          this.impuestoId = Number(p?.impuestoId) || null;
          this.snImprimeFactura = p?.sn_imprimefactura === 'S';

          const bodegaId = Number(p?.bodegaId) || null;
          const cajaId = Number(p?.cajaId) || null;

          if (bodegaId) {
            this.form.patchValue({ bodegaId });
          }
          if (cajaId) {
            this.form.patchValue({ cajaId });
          }

          // Caja por defecto: parámetro del módulo 4 (CxC).
          // La bodega NO se toma de parámetros: la resuelve el backend desde la
          // sucursal del usuario (tusuario.Idsucursal → tsucursal.bodegaId)
          this.api
            .get<any>('/parametros/parametros/objeto?moduloId=4')
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((p4) => {
              const c4 = Number(p4?.cajaId) || null;
              if (c4) this.form.patchValue({ cajaId: c4 });
            });

          this.aplicarTasa();
          this.cargarGestor();
        },
        error: () => {
          this.impuestoIncluido = false;
          this.impuestoId = null;
        },
      });
  }

  private cargarGestor() {
    const usuarioId = this.auth.currentUser()?.usuarioId;
    if (!usuarioId) return;

    this.api
      .get<any[]>('/parametros/gestores')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          // Solo gestores de VENTAS: módulo 3 (Facturación) y activos.
          // (El backend ya filtra por empresa.)
          const ventas = (items ?? []).filter(
            (g) => Number(g.moduloId) === 3 && g.sn_activo !== 'N' && !!g.nombre,
          );
          this.gestores.set(
            ventas.map((g) => ({ label: String(g.nombre), value: Number(g.gestorId) })),
          );
          // Precarga: si el usuario actual tiene gestor asignado en facturación, se preselecciona
          const propio = ventas.find((g) => Number(g.usuarioId) === usuarioId);
          this.form.patchValue({ gestorId: propio ? Number(propio.gestorId) : null });
        },
        error: () => this.gestores.set([]),
      });
  }

  private aplicarTasa() {
    if (!this.impuestos.length) return;
    const porId = this.impuestos.find(
      (i) => i.impuestoId === this.impuestoId && i.sn_activo === 'S',
    );
    const porModulo =
      porId ||
      this.impuestos.find(
        (i) => Number(i.moduloId) === this.MODULO_FACTURACION && i.sn_activo === 'S',
      );
    if (porModulo && Number(porModulo.porcentaje) > 0) {
      this.tasaImpuesto = Number(porModulo.porcentaje) / 100;
    }
    if (this.filas().length) {
      for (const r of this.filas()) {
        this.recalcularFila(r);
      }
    }
  }

  private cargarFactorCambio() {
    this.api
      .get<any[]>('/contabilidad/factordecambio')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          const lista = items ?? [];
          const enDolares = lista.find((i) => (i.tipomoneda ?? 'D') === 'D') ?? lista[0];
          if (enDolares) {
            this.form.patchValue({
              factordecambio: Number(enDolares.precioventa) || Number(enDolares.preciocompra) || 0,
            });
          }
        },
      });
  }

  private buildForm() {
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
      importe_excento: [0],
      diascredito: [0],
      fechavencimiento: [null as Date | null],
      sn_excenta: ['N'],
      snNombreOptions: ['N'],
      efectivo_recibido: [0],
    });
  }

  private cargarOpciones() {
    this.api
      .get<any>('/cxc/clientes')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.clientesArray = res?.data ?? [];
        this.onTipoFacturaChange();
        this.clientes.set(
          this.clientesArray.map((c) => ({
            label: `${c.nrocliente ?? ''} - ${c.nombres ?? ''} ${c.apellidos ?? ''}`.trim(),
            value: c.clienteId,
          })),
        );
      });
    this.api
      .get<any[]>('/parametros/formas-pago')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((items) => {
        this.formaspago.set(
          (items ?? []).map((i) => ({ label: i.descripcion, value: i.formapagoId })),
        );
        this.inicializarPagos();
      });
    this.api
      .get<any[]>('/parametros/tarjetas-credito')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((items) => {
        this.tarjetas.set(
          (items ?? []).map((i) => ({ label: i.descripcion, value: i.tarjetacreditoId })),
        );
      });
    this.api
      .get<any[]>('/inventario/existencias')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((items) => {
        const m = new Map<number, number>();
        for (const e of items ?? []) {
          const id = Number(e.productoId);
          m.set(id, (m.get(id) ?? 0) + Number(e.existencia ?? 0));
        }
        this.existenciasMap = m;

        this.api
          .get<any[]>('/inventario/productos')
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((prods) => {
            this.productosArray = ((prods ?? []) as Producto[]).filter((p) =>
              m.has(Number(p.produtoId)),
            );
            this.filtrarProductos();
          });
      });
    this.api
      .get<any[]>('/inventario/productos-img')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((items) => {
        const m = new Map<number, string>();
        for (const i of items ?? []) {
          const id = Number(i.productoId);
          if (i.sn_activo === 'S' && i.img && !m.has(id)) {
            m.set(id, this.resolverImagen(i.img));
          }
        }
        this.imagenesMap = m;
      });
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

    // Cargar ofertas/promociones vigentes
    this.api
      .get<any>('/facturacion/combos-ofertas')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        const ofertas = res?.value ?? res ?? [];
        this.ofertasMap.clear();
        for (const o of Array.isArray(ofertas) ? ofertas : []) {
          this.ofertasMap.set(Number(o.productoId), {
            porcentaje: Number(o.porcentaje),
            precioConDescuento: Number(o.precioConDescuento),
            desc: o.descuentoDesc ?? `${o.porcentaje}%`,
          });
        }
      });
  }

  private resolverImagen(img: string): string {
    return /^data:/i.test(img) ? img : `data:image/png;base64,${img}`;
  }

  /** Retorna info de oferta/promo del producto, null si no tiene */
  getOferta(
    productoId: number | null,
  ): { porcentaje: number; precioConDescuento: number; desc: string } | null {
    return productoId ? (this.ofertasMap.get(productoId) ?? null) : null;
  }

  /** Verifica si el producto tiene oferta/promo vigente */
  esOferta(productoId: number | null): boolean {
    return productoId ? this.ofertasMap.has(productoId) : false;
  }

  /** Verifica si el descuento global es acumulable con promos (ej: tercera edad) */
  esDescuentoAcumulable(): boolean {
    const id = this.descuentoGlobalId();
    return id != null && this.descAcumulables.has(id);
  }

  filtrarProductos() {
    const q = this.qProducto().toLowerCase().trim();
    this.productosFiltrados.set(
      q
        ? this.productosArray.filter(
            (p) =>
              (p.codbarra ?? '').toLowerCase().includes(q) ||
              (p.descripcion ?? '').toLowerCase().includes(q),
          )
        : this.productosArray,
    );
  }

  invalid(ctrl: string): boolean {
    const c = this.form.get(ctrl);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  onClienteChange() {
    const clienteId = this.form.get('clienteId')?.value;
    const c = this.clientesArray.find((i) => i.clienteId === clienteId);
    if (c) {
      this.form.patchValue({
        nrocliente: c.nrocliente ?? '',
        nombrecliente: `${c.nombres ?? ''} ${c.apellidos ?? ''}`.trim() || null,
        // cxccclientesdir eliminada: la dirección ya no se resuelve desde catálogo
        direccion: '',
        // RTN: en crédito se lee del cliente; en contado queda limpio
        rtn_cliente: this.esContado() ? '' : (c.rtn ?? ''),
      });
    }
  }

  private getClienteTienda(): any | null {
    return (
      this.clientesArray.find((c: any) => (c.nrocliente ?? '').toUpperCase() === 'TIENDA') ?? null
    );
  }

  onTipoFacturaChange() {
    const esContado = this.form.get('tipofactura')?.value === 'E';
    if (esContado) {
      const tienda = this.getClienteTienda();
      if (tienda) {
        this.form.patchValue({
          clienteId: tienda.clienteId,
          nrocliente: tienda.nrocliente ?? 'TIENDA',
        });
      }
      // Contado: RTN siempre en limpio (se carga manualmente si se necesita)
      this.form.patchValue({ rtn_cliente: '' });
    } else {
      this.form.patchValue({ clienteId: null, nrocliente: '', rtn_cliente: '' });
      this.nombreClienteManual.set('');
    }
  }

  esContado(): boolean {
    return this.form.get('tipofactura')?.value === 'E';
  }

  /** Abre/cierra el popover de existencia al hacer click en la imagen de la fila */
  mostrarExistenciaImagen(event: Event, row: FilaDet) {
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

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    const el = event.target as HTMLElement;
    const tag = el?.tagName?.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
    if (this.dialogProductos() || this.dialogAtajos()) return;
    // Ctrl+Alt+1 = navegación rápida global (QuickNav) → no capturar combos con Ctrl
    if (event.ctrlKey || event.metaKey) return;
    // Cuadro de navegación rápido abierto → Escape lo cierra él, no resetear la factura
    if (this.quickNav.abierto()) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      if (this.dialogPagos()) {
        this.dialogPagos.set(false);
      } else if (this.dialogSuspendidas()) {
        this.dialogSuspendidas.set(false);
      } else {
        this.nueva();
      }
      return;
    }

    if (!event.altKey) return;

    switch (event.key) {
      case '1':
        event.preventDefault();
        this.showHelperProductos();
        break;
      case '2':
        event.preventDefault();
        if (!this.esContado()) {
          document.getElementById('clienteId')?.focus();
        }
        break;
      case '3':
        event.preventDefault();
        this.suspenderVenta();
        break;
      case '4':
        event.preventDefault();
        this.cargarVentasSuspendidas();
        break;
      case '5':
      case '6':
        event.preventDefault();
        this.abrirPagos();
        break;
      case '7':
        event.preventDefault();
        if (this.esContado()) {
          this.abrirPagos();
        } else {
          this.facturar();
        }
        break;
      case '8':
        event.preventDefault();
        this.facturar();
        break;
      case '9':
        event.preventDefault();
        this.dialogAtajos.set(true);
        break;
    }
  }

  private suspenderVenta() {
    const filas = this.filas();
    if (filas.length === 0) {
      this.msgs.add({
        severity: 'warn',
        summary: 'Suspender',
        detail: 'No hay artículos para suspender',
      });
      return;
    }
    const raw = this.form.getRawValue();
    const venta = {
      id: Date.now(),
      fecha: new Date().toISOString(),
      tipofactura: raw.tipofactura,
      snNombreOptions: raw.snNombreOptions,
      clienteId: raw.clienteId,
      nrocliente: raw.nrocliente,
      nombreClienteManual: this.nombreClienteManual(),
      sn_excenta: raw.sn_excenta,
      tipoconstancia: raw.tipoconstancia,
      nroconstancia: raw.nroconstancia,
      importe_excento: raw.importe_excento,
      filas: filas.map((f) => ({ ...f })),
      totales: { ...this.totales() },
    };
    const suspendidas = this.leerVentasSuspendidas();
    suspendidas.push(venta);
    localStorage.setItem('ventasSuspendidas', JSON.stringify(suspendidas));
    this.ventasSuspendidas.set(suspendidas);
    this.msgs.add({
      severity: 'success',
      summary: 'Venta suspendida',
      detail: `Venta con ${filas.length} artículo(s) guardada`,
    });
    this.nueva();
  }

  cargarVentasSuspendidas() {
    const suspendidas = this.leerVentasSuspendidas();
    this.ventasSuspendidas.set(suspendidas);
    this.dialogSuspendidas.set(true);
  }

  private leerVentasSuspendidas(): any[] {
    try {
      return JSON.parse(localStorage.getItem('ventasSuspendidas') || '[]');
    } catch {
      return [];
    }
  }

  restaurarVenta(venta: any) {
    this.form.patchValue({
      tipofactura: venta.tipofactura ?? 'E',
      snNombreOptions: venta.snNombreOptions ?? 'N',
      clienteId: venta.clienteId,
      nrocliente: venta.nrocliente ?? '',
      sn_excenta: venta.sn_excenta ?? 'N',
      tipoconstancia: venta.tipoconstancia ?? 'FNE',
      nroconstancia: venta.nroconstancia ?? '',
      importe_excento: venta.importe_excento ?? 0,
    });
    this.nombreClienteManual.set(venta.nombreClienteManual ?? '');
    this.filas.set((venta.filas ?? []).map((f: any) => ({ ...f })));
    this.contadorFila = Math.max(0, ...this.filas().map((f) => f.fila));
    this.recalcularTotales();

    const suspendidas = this.leerVentasSuspendidas().filter((s) => s.id !== venta.id);
    localStorage.setItem('ventasSuspendidas', JSON.stringify(suspendidas));
    this.ventasSuspendidas.set(suspendidas);
    this.dialogSuspendidas.set(false);
    this.msgs.add({
      severity: 'success',
      summary: 'Venta restaurada',
      detail: 'Venta suspendida cargada',
    });
  }

  eliminarVentaSuspendida(venta: any) {
    const suspendidas = this.leerVentasSuspendidas().filter((s) => s.id !== venta.id);
    localStorage.setItem('ventasSuspendidas', JSON.stringify(suspendidas));
    this.ventasSuspendidas.set(suspendidas);
  }

  onBuscarProducto(event: Event) {
    const texto = (event.target as HTMLInputElement).value ?? '';
    this.qProducto.set(texto);

    if (texto.length >= 13) {
      this.api
        .get<any>(`/inventario/productos/buscar`, { q: texto.trim() })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (res) => {
            const items = Array.isArray(res) ? res : (res?.value ?? []);
            const producto = items.find((p: any) =>
              (p.codbarra ?? '').trim().startsWith(texto.trim()),
            );
            if (producto) {
              this.agregarProductoDirecto(producto);
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

  private agregarProductoDirecto(p: Producto) {
    const productoId = Number(p.produtoId) || null;
    const tieneRegistro = this.existenciasMap.has(productoId ?? -1);
    const existencia = Number(this.existenciasMap.get(productoId ?? -1) ?? 0);

    if (tieneRegistro && existencia <= 0) {
      this.msgs.add({
        severity: 'warn',
        summary: 'Sin existencia',
        detail: `${p.descripcion} no tiene existencia disponible`,
      });
      return;
    }

    const estado = !tieneRegistro ? 'SIN_STOCK' : existencia <= 0 ? 'AGOTADO' : 'ALTA';
    // Descuento: promo tiene prioridad, EXCEPTO tercera edad que se acumula
    const oferta = this.getOferta(productoId);
    const descuentoGlobal = this.descuentoGlobalId();
    let descuento = 0;
    if (oferta) {
      descuento = oferta.porcentaje;
      // Si el descuento global es acumulable (tercera edad), sumar ambos
      if (descuentoGlobal && this.esDescuentoAcumulable()) {
        descuento += this.descuentosMap.get(descuentoGlobal) ?? 0;
      }
    } else if (descuentoGlobal) {
      descuento = this.descuentosMap.get(descuentoGlobal) ?? 0;
    }

    this.varCodBarra.set(p.codbarra ?? '');
    this.varProducto.set(p.descripcion ?? '');
    this.varPrecioVenta.set(Number(p.precioventa) || 0);

    const row: FilaDet = {
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
    };

    this.filas.update((f) => [...f, row]);
    this.recalcularFila(row);
  }

  abrirProductos() {
    this.qProducto.set('');
    this.filtrarProductos();
    this.dialogProductos.set(true);
  }

  agregar() {
    this.abrirProductos();
  }

  seleccionarProducto(p: any) {
    const productoId = Number(p.produtoId) || null;
    const existencia = Number(p.existencia ?? this.existenciasMap.get(productoId ?? -1) ?? 0);
    const stockMin = Number(p.stockMinimo ?? 0);
    const estado = existencia <= 0 ? 'AGOTADO' : existencia <= stockMin ? 'BAJO' : 'ALTA';

    if (estado === 'AGOTADO') {
      this.msgs.add({
        severity: 'warn',
        summary: 'Sin existencia',
        detail: `${p.descripcion} no tiene existencia disponible`,
      });
      return;
    }

    this.varCodBarra.set(p.codbarra ?? '');
    this.varProducto.set(p.descripcion ?? '');
    this.varPrecioVenta.set(Number(p.precioventa) || 0);
    this.dialogProductos.set(false);

    // Descuento: promo tiene prioridad, EXCEPTO tercera edad que se acumula
    const oferta = this.getOferta(productoId);
    const descuentoGlobal = this.descuentoGlobalId();
    let descuento = 0;
    if (oferta) {
      descuento = oferta.porcentaje;
      if (descuentoGlobal && this.esDescuentoAcumulable()) {
        descuento += this.descuentosMap.get(descuentoGlobal) ?? 0;
      }
    } else if (descuentoGlobal) {
      descuento = this.descuentosMap.get(descuentoGlobal) ?? 0;
    }

    const row: FilaDet = {
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
    };

    this.filas.update((f) => [...f, row]);
    this.recalcularFila(row);
  }

  quitarFila(idx: number) {
    this.filas.update((f) => f.filter((_, i) => i !== idx));
    this.recalcularTotales();
  }

  inicializarPagos() {
    const pagosInit: PagoFactura[] = this.formaspago().map((fp) => ({
      formapagoId: fp.value,
      tarjetacreditoId: null,
      nrotarjeta: '',
      nroautorizacion: '',
      importe: undefined,
      nroreferencia: '',
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
        importe: undefined,
        nroreferencia: '',
      },
    ]);
  }

  quitarPago(idx: number) {
    this.pagos.update((p) => p.filter((_, i) => i !== idx));
  }

  pagosConImporte(): PagoFactura[] {
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

  /** true si el total de la factura es L 0.00 — no se permite pagar/facturar */
  totalEnCero(): boolean {
    return Math.round((this.totales().total || 0) * 100) / 100 <= 0;
  }

  /**
   * Abre el diálogo de formas de pago. Si el total de la factura es L 0.00
   * muestra una alerta explicativa y NO abre (los botones NO se deshabilitan:
   * un botón gris sin explicación genera llamadas al call center).
   */
  abrirPagos(): void {
    if (this.totalEnCero()) {
      this.msgs.add({
        severity: 'warn',
        summary: 'No se puede pagar',
        detail: 'El total de la factura es L 0.00. Agregue productos para continuar.',
      });
      return;
    }
    this.dialogPagos.set(true);
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

  recalcularFila(row: FilaDet) {
    const cantidad = row.cantidad ?? 0;
    const descuento = row.descuento ?? 0;
    const exenta = this.form.get('sn_excenta')?.value === 'S';
    const bruto = cantidad * (row.precioventa ?? 0);
    const brutoDesc = bruto * (1 - descuento / 100);

    if (this.impuestoIncluido) {
      const subConImp = bruto * (1 + this.tasaImpuesto) * (1 - descuento / 100);
      // ISV que se dejó de cobrar (15%) — se guarda en importe_excento cuando la venta es exenta
      const isvCalculado =
        Math.round(((subConImp * this.tasaImpuesto) / (1 + this.tasaImpuesto)) * 100) / 100;
      row.impuesto = exenta ? 0 : isvCalculado;
      row.impuestoExcento = exenta ? isvCalculado : 0;
      row.subTotal = Math.round(subConImp * 100) / 100;
    } else {
      const isvCalculado = Math.round(brutoDesc * this.tasaImpuesto * 100) / 100;
      row.impuesto = exenta ? 0 : isvCalculado;
      row.impuestoExcento = exenta ? isvCalculado : 0;
      row.subTotal = Math.round((brutoDesc + row.impuesto) * 100) / 100;
    }

    this.filas.update((f) => [...f]);
    this.recalcularTotales();
  }

  recalcularExenta() {
    const exenta = this.form.get('sn_excenta')?.value === 'S';
    const ctrl = this.form.get('nroconstancia')!;
    const tipoCtrl = this.form.get('tipoconstancia')!;
    const exentoCtrl = this.form.get('importe_excento')!;
    if (exenta) {
      ctrl.setValidators([Validators.required]);
      tipoCtrl.setValidators([Validators.required]);
    } else {
      ctrl.clearValidators();
      ctrl.setValue('');
      tipoCtrl.clearValidators();
      tipoCtrl.setValue('FNE');
      exentoCtrl.setValue(0);
    }
    ctrl.updateValueAndValidity();
    tipoCtrl.updateValueAndValidity();
    for (const r of this.filas()) {
      this.recalcularFila(r);
    }
  }

  onDescuentoGlobalChange() {
    const id = this.descuentoGlobalId();
    const porcentaje = id ? (this.descuentosMap.get(id) ?? 0) : 0;
    const acumulable = this.esDescuentoAcumulable();
    for (const r of this.filas()) {
      if (this.esOferta(r.productoId)) {
        if (acumulable) {
          // Recalcular: promo + tercera edad
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
  }

  recalcularTotales() {
    let bruto = 0;
    let descuento = 0;
    let impuesto = 0;
    let impuestoExcento = 0;
    for (const r of this.filas()) {
      bruto += (r.cantidad ?? 0) * (r.precioventa ?? 0);
      descuento += (r.cantidad ?? 0) * (r.precioventa ?? 0) * ((r.descuento ?? 0) / 100);
      impuesto += r.impuesto ?? 0;
      impuestoExcento += r.impuestoExcento ?? 0;
    }
    const total = bruto - descuento + impuesto;
    const efectivo = this.form?.get('efectivo_recibido')?.value ?? 0;
    // Importe exento: ISV 15% que se dejó de cobrar — se llena automáticamente (campo no editable)
    this.form?.get('importe_excento')?.setValue(Math.round(impuestoExcento * 100) / 100);
    this.totales.set({
      subTotal: Math.round(bruto * 100) / 100,
      descuento: Math.round(descuento * 100) / 100,
      impuesto: Math.round(impuesto * 100) / 100,
      total: Math.round(total * 100) / 100,
      cambio: Math.max(0, Number(efectivo) - total),
    });
  }

  getSeverity(estado: string) {
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

  salir() {
    this.router.navigate(['/facturacion/facturas']);
  }

  abrirNuevoCliente() {
    this.router.navigate(['/cxc/clientes/nuevo'], { queryParams: { modo: 'facturacion' } });
  }

  nueva() {
    const bodegaId = this.form.get('bodegaId')?.value;
    const cajaId = this.form.get('cajaId')?.value;
    const gestorId = this.form.get('gestorId')?.value;

    this.dialogPagos.set(false);
    this.descuentoGlobalId.set(null);
    this.form.reset({
      tipofactura: 'E',
      snNombreOptions: 'N',
      sn_excenta: 'N',
      factordecambio: 0,
      diascredito: 0,
      efectivo_recibido: 0,
      rtn_cliente: '',
      bodegaId,
      cajaId,
      gestorId,
    });
    this.filas.set([]);
    this.inicializarPagos();
    this.contadorFila = 0;
    this.varCodBarra.set('');
    this.varProducto.set('');
    this.varPrecioVenta.set(0);
    this.nombreClienteManual.set('');
    this.facturarConLink = false;
    this.onTipoFacturaChange();
    this.recalcularTotales();
  }

  facturar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.msgs.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Complete los campos obligatorios de la factura',
      });
      return;
    }
    const filas = this.filas();
    if (filas.length === 0) {
      this.msgs.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Agregue al menos un artículo',
      });
      return;
    }

    const raw = this.form.getRawValue();
    const t = this.totales();
    const esCredito = raw.tipofactura === 'C';

    // No se permite pagar/facturar con total de factura en L 0.00
    if (this.totalEnCero()) {
      this.msgs.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'No se puede pagar: el total de la factura es L 0.00',
      });
      return;
    }

    if (!esCredito) {
      if (raw.snNombreOptions === 'S' && !this.nombreClienteManual()?.trim()) {
        this.msgs.add({
          severity: 'warn',
          summary: 'Validación',
          detail: 'Ingrese el nombre del cliente',
        });
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
          if (p.nrotarjeta.replace(/\D/g, '').length < 13) {
            this.msgs.add({
              severity: 'warn',
              summary: 'Validación',
              detail: 'El número de tarjeta debe tener al menos 13 dígitos',
            });
            return;
          }
          if (!this.validarLuhn(p.nrotarjeta)) {
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
      const totalPagos = this.totalPagos();
      if (totalPagos < t.total) {
        this.msgs.add({
          severity: 'error',
          summary: 'Validación',
          detail: `Factura de contado debe ser pagada en su totalidad. Falta por pagar: ${this.moneda(t.total - totalPagos)}`,
        });
        return;
      }
    }

    // ── TodoPago: detectar pago por link en el diálogo de formas de pago ──
    const pagosTP = !esCredito
      ? this.pagosConImporte().filter((p) => p.formapagoId === FORMAPAGO_TODOPAGO)
      : [];
    const conLink = pagosTP.length > 0;
    this.facturarConLink = conLink;

    const clienteArr = this.clientesArray.find((c) => c.clienteId === raw.clienteId);
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
      subTotal: t.subTotal,
      impuesto: t.impuesto,
      descuento: t.descuento,
      total: t.total,
      // Con link TodoPago el pago efectivo es lo no-TP (el link aún no se confirma)
      efectivo_recibido: esCredito
        ? 0
        : conLink
          ? this.totalPagos() - pagosTP.reduce((s, p) => s + (Number(p.importe) || 0), 0)
          : this.totalPagos(),
      importe_cambio: esCredito || conLink ? 0 : Math.round(this.cambioTotal() * 100) / 100,
      diascredito: raw.diascredito ?? 0,
      fechavencimiento: raw.fechavencimiento ? new Date(raw.fechavencimiento).toISOString() : null,
      bodegaId: raw.bodegaId,
      cajaId: raw.cajaId,
      gestorId: raw.gestorId || null,
      sn_excenta: raw.sn_excenta,
      tipoconstancia: raw.tipoconstancia || 'FNE',
      nroconstancia: raw.nroconstancia || null,
      importe_excento: raw.importe_excento || 0,
      // Con link TodoPago la factura queda pendiente hasta la confirmación del pago
      sn_pagada: esCredito || conLink ? 'N' : 'S',
      sn_anulada: 'N',
      sn_contabilizada: 'N',
    };

    this.guardando.set(true);
    this.service
      .createMae<any>('/facturacion/facturas', mae)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (fac) => {
          // Alerta si el rango CAI está por agotarse
          if (fac.alerta) {
            this.msgs.add({
              severity: 'warn',
              summary: 'CAI — Autorización próxima a caducar',
              detail: fac.alerta,
              life: 10000,
            });
          }

          const detOps = filas.map((r, i) => {
            const pDescuento = r.descuento ?? 0; // Porcentaje de descuento
            const cant = r.cantidad ?? 0;
            const precio = r.precioventa ?? 0;
            const descuentoMonto = Math.round(cant * precio * (pDescuento / 100) * 100) / 100; // Monto calculado
            return this.service.createDet<any>('/facturacion/facturas-det', {
              facturaId: fac.facturaId,
              // La bodega resuelta por el backend (sucursal del usuario) tiene prioridad
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
                  this.procesarKardexYFinalizar(
                    fac,
                    `Factura de crédito #${fac.nrofactura} creada`,
                  );
                } else {
                  this.guardarPagosYFinalizar(fac, raw);
                }
              },
              error: (err) => {
                this.guardando.set(false);
                console.error('Error al guardar detalle de factura', err);
                this.msgs.add({
                  severity: 'error',
                  summary: 'Error',
                  detail: 'La factura se creó pero falló el detalle',
                });
              },
            });
        },
        error: (err) => {
          this.guardando.set(false);
          console.error('Error al guardar factura', err);
          this.msgs.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo guardar la factura',
          });
        },
      });
  }

  private guardarPagosYFinalizar(fac: any, raw: any) {
    // El pago TodoPagoLink NO se registra en posfaccaja ahora:
    // se inserta recién cuando el link se confirma (callback/confirmar)
    const pagosList = this.pagosConImporte().filter((p) => p.formapagoId !== FORMAPAGO_TODOPAGO);
    if (pagosList.length > 0) {
      const pagoOps = pagosList.map((p) =>
        this.service.createDet<any>('/facturacion/fac-caja', {
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
            this.procesarKardexYFinalizar(
              fac,
              `Factura #${fac.nrofactura} creada con ${pagosList.length} pago(s)`,
            );
          },
          error: (err) => {
            this.guardando.set(false);
            console.error('Error al guardar formas de pago', err);
            this.msgs.add({
              severity: 'warn',
              summary: 'Advertencia',
              detail: `Factura #${fac.nrofactura} creada, pero falló el registro de pagos`,
            });
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
          if (this.snImprimeFactura) {
            this.imprimirTicket(fac.facturaId);
          }
          if (this.facturarConLink) {
            this.generarLinkPago(fac);
          } else {
            this.nueva();
          }
        },
        error: () => {
          this.guardando.set(false);
          this.msgs.add({
            severity: 'warn',
            summary: 'Advertencia',
            detail: `Factura #${fac.nrofactura} creada, pero falló el registro de kardex`,
          });
          if (this.facturarConLink) {
            this.generarLinkPago(fac);
          } else {
            this.nueva();
          }
        },
      });
  }

  // ═══════════════════ TodoPago — link de pago ═══════════════════

  /** Genera el link para la factura recién creada y abre el diálogo headless */
  private generarLinkPago(fac: any) {
    this.todp
      .generarLink(fac.facturaId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (link) => {
          this.linkPago.set(link);
          this.linkStatus.set(link.status || 'pending');
          this.linkCopiado.set(false);
          this.nroFacturaLink.set(fac.nrofactura ?? null);
          this.iniciarPollingLink(link.operationId);
          this.nueva();
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
          this.nueva();
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

  /** Reconsulta el estado bajo demanda (botón "Ver estado") */
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
  onFormaPagoChange(pago: PagoFactura): void {
    if (pago.formapagoId !== FORMAPAGO_TODOPAGO) return;
    const otros = this.pagosConImporte()
      .filter((p) => p !== pago && p.formapagoId !== FORMAPAGO_TODOPAGO)
      .reduce((s, p) => s + (Number(p.importe) || 0), 0);
    const pendiente = Math.round((this.totales().total - otros) * 100) / 100;
    if (pendiente > 0) pago.importe = pendiente;
  }

  moneda(n: number | undefined): string {
    return (n ?? 0).toLocaleString('es-HN', { style: 'currency', currency: 'HNL' });
  }

  num(n: any): number {
    return Number(n) || 0;
  }

  private imprimirTicket(facturaId: number) {
    this.api
      .get<any>(`/facturacion/facturas/${facturaId}/ticket`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        // El formato (TICKET/CARTA) lo resuelve el servicio desde timpresoras
        next: (data) =>
          this.impresion.imprimir(data).catch(() => {
            this.msgs.add({
              severity: 'warn',
              summary: 'Impresión',
              detail: 'No se pudo imprimir la factura',
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

  showHelperProductos() {
    this.ref = this.dialogService.open(ProductosHelperList, {
      header: 'Seleccionar un producto',
      width: '50vw',
      modal: true,
      contentStyle: { overflow: 'auto' },
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
      templates: {
        footer: FooterHelper,
      },
    });

    this.ref.onClose.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((data: any) => {
      if ('codbarra' in data) {
        this.seleccionarProducto(data);
        this.msgs.add({
          severity: 'info',
          summary: 'Producto seleccionado',
          detail: data?.descripcion,
          life: 3000,
        });
      }
    });
  }
}
