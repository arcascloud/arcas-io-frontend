import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DataViewModule } from 'primeng/dataview';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { InputMaskModule } from 'primeng/inputmask';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { MessageModule } from 'primeng/message';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { GalleriaModule } from 'primeng/galleria';
import { PedidosVirtualService } from './pedidos-virtual.service';
import { ProductoTienda, PedidoItem, CheckoutPedido } from '../../../core/models/pedido.models';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { FacturaImpresionService } from '../../../core/services/factura-impresion.service';
import { NavegacionService } from '../../../core/services/navegacion.service';

@Component({
  selector: 'app-pedidos-virtual',
  standalone: true,
  imports: [
    CommonModule, FormsModule, DataViewModule, ButtonModule, DialogModule,
    InputNumberModule, InputTextModule, InputMaskModule, SelectModule, TagModule, ToastModule,
    TooltipModule, MessageModule, GalleriaModule, TableModule,
  ],
  providers: [],
  templateUrl: './pedidos-virtual.html',
  styleUrl: './pedidos-virtual.scss',
})
export class PedidosVirtual implements OnInit {
  private pedidosService = inject(PedidosVirtualService);
  public auth = inject(AuthService);
  private messageService = inject(MessageService);
  private destroyRef = inject(DestroyRef);
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private navegacion = inject(NavegacionService);
  private router = inject(Router);
  private impresion = inject(FacturaImpresionService);

  dialogResumenVenta = signal(false);
  resumenVentaData = signal<any>(null);

  productos = signal<ProductoTienda[]>([]);
  pedidoItems = signal<PedidoItem[]>([]);
  pedidoId = signal<number | null>(null);
  busqueda = signal<string>('');
  layout = signal<'grid' | 'list'>('grid');
  cargando = signal(false);
  cargandoPedido = signal(false);

  dialogCheckout = signal(false);
  procesando = signal(false);
  tarjetasCredito = signal<{ label: string; value: number }[]>([]);
  formaspago = signal<{ label: string; value: number }[]>([]);
  tarjetaError = signal<string | null>(null);
  pedidoOpen = signal(false);

  // ==================== Galería de imágenes ====================
  dialogGaleria = signal(false);
  galeriaTitulo = signal('');
  galeriaImagenes = signal<string[]>([]);
  galeriaIndice = signal(0);
  galeriaCargando = signal(false);
  /** Cache productoId → imágenes (evita re-fetch al reabrir) */
  private galeriaCache = new Map<number, string[]>();

  /** Opciones responsive del Galleria (patrón doc PrimeNG) */
  readonly galeriaResponsiveOptions = [
    { breakpoint: '1024px', numVisible: 5 },
    { breakpoint: '768px', numVisible: 3 },
    { breakpoint: '560px', numVisible: 2 },
  ];

  //── Guardar pedido (facturación a futuro) ──
  dialogGuardarPedido = signal(false);
  guardandoPedido = signal(false);
  guardarNombre = signal('');
  guardarTelefono = signal('');
  /** Datos de cliente del pedido cargado (para precargar el diálogo) */
  private pedidoDatosCliente = signal<{ nombre: string; tel: string } | null>(null);

  // Image cache removed — browser handles caching natively

  /** Mapa productoId → precio con descuento de promo/oferta */
  private mapaOfertas = new Map<number, number>();
  /** Mapa productoId → porcentaje de descuento */
  private mapaDescuento = new Map<number, number>();

  //── ISV — mismo criterio que nueva-factura (param-fac módulo 3 + catálogo /parametros/impuestos) ──
  /** Tasa de ISV como decimal (ej. 0.15) */
  tasaImpuesto = 0;
  /** Tasa de ISV como porcentaje para mostrar en UI (ej. 15) */
  tasaImpuestoPct = 0;
  private impuestos: any[] = [];
  private impuestoId: number | null = null;

  categorias = computed(() => {
    // Derivación explícita: categoría -> {descripción, giro}.
    // Los productos ya vienen filtrados por el backend a giro='C', pero quedan autónomas
    // del filtro porgiro para que la lista sea inequívoca y no dependa de la lógica de la url.
    const map = new Map<number, { descripcion: string; giro: string }>();
    for (const p of this.productos()) {
      if (!p.categoriaId) continue;
      const prev = map.get(p.categoriaId);
      if (!prev) {
        map.set(p.categoriaId, { descripcion: p.categoria || '', giro: (p as any).tipo_giro || '' });
      } else {
        prev.descripcion = p.categoria || prev.descripcion;
        prev.giro = (p as any).tipo_giro || prev.giro;
      }
    }

    // Solo categorías de giro parametrizado ('C' para estos dos componentes).
    const items = Array.from(map.values())
      .filter((x) => x.giro === 'C')
      .sort((a, b) => a.descripcion.localeCompare(b.descripcion))
      .map((x) => ({ label: x.descripcion, value: x.descripcion }));
    return [{ label: 'Todos', value: null }, ...items];
  });
  categoriaFiltro = signal<string | null>(null);
  ordenarPor = signal<string>('default');
  soloOfertas = signal(false);

  readonly opcionesOrden = [
    { label: 'Destacados', value: 'default' },
    { label: 'Menor precio', value: 'precio-asc' },
    { label: 'Mayor precio', value: 'precio-desc' },
    { label: 'Nombre A-Z', value: 'nombre-asc' },
    { label: 'Nombre Z-A', value: 'nombre-desc' },
  ];

  readonly formasPagoPermitidas = ['tarjeta', 'transferencia', 'todo pago'];

  productosFiltrados = computed(() => {
    let lista = this.productos();
    const cat = this.categoriaFiltro();
    const busq = this.busqueda().toLowerCase();
    const orden = this.ordenarPor();
    const soloOfertas = this.soloOfertas();

    if (soloOfertas) lista = lista.filter(p => this.esOferta(p));
    if (cat) lista = lista.filter(p => p.categoria === cat);
    if (busq) lista = lista.filter(p =>
      p.descripcion?.toLowerCase().includes(busq) ||
      p.codbarra?.toLowerCase().includes(busq)
    );

    const copia = [...lista];
    switch (orden) {
      case 'precio-asc': copia.sort((a, b) => Number(a.precioventa) - Number(b.precioventa)); break;
      case 'precio-desc': copia.sort((a, b) => Number(b.precioventa) - Number(a.precioventa)); break;
      case 'nombre-asc': copia.sort((a, b) => (a.descripcion || '').localeCompare(b.descripcion || '')); break;
      case 'nombre-desc': copia.sort((a, b) => (b.descripcion || '').localeCompare(a.descripcion || '')); break;
    }
    return copia;
  });

  totalItems = computed(() => this.pedidoItems().reduce((sum, i) => sum + Number(i.cantidad), 0));
  /** Σ subtotales brutos de las líneas (sin ISV) */
  subtotalPedido = computed(() => this.pedidoItems().reduce((sum, i) => sum + Number(i.subtotal), 0));
  /** Σ ISV de las líneas */
  isvPedido = computed(() => this.pedidoItems().reduce((sum, i) => sum + Number(i.impuesto ?? 0), 0));
  /** Total = Σ(subtotal + impuesto − descuento) — misma fórmula que checkoutPedido en backend */
  totalPedido = computed(() => this.pedidoItems().reduce((sum, i) =>
    sum + Number(i.subtotal) + Number(i.impuesto ?? 0) - Number(i.descuento ?? 0), 0));

  /**
   * Valida el formulario de pago — DEBE ser método y NO computed(): `checkout` es un objeto
   * plano ligado con ngModel, así que un computed() no leería ninguna signal, se evaluaría
   * una sola vez al abrir el diálogo (campos vacíos → false) y quedaría congelado para
   * siempre, dejando el botón "Confirmar Factura" inhabilitado sin importar lo que se escriba.
   */
  formularioPagoValido(): boolean {
    if (!this.checkout.nombrecliente) return false;
    if (this.esTarjeta()) {
      const num = this.checkout.nrotarjeta?.replace(/\s/g, '') || '';
      return num.length >= 13
        && this.validarLuhn(num)
        && !!this.checkout.fechaexpiracion && /^\d{2}\/\d{2}$/.test(this.checkout.fechaexpiracion)
        && !!this.checkout.cvv && this.checkout.cvv.length >= 3
        && !!this.checkout.tarjetacreditoId;
    }
    if (this.esTransferencia()) {
      return !!this.checkout.nroautorizacion && this.checkout.nroautorizacion.trim().length > 0;
    }
    return true;
  }

  checkout: CheckoutPedido & { nrotarjeta?: string; tarjetacreditoId?: number; fechaexpiracion?: string; cvv?: string; nroautorizacion?: string } = {
    pospedmaeId: 0,
    nombrecliente: '',
    nrotelefono: '',
    formapagoId: 0,
    efectivo_recibido: 0,
    nrotarjeta: '',
    tarjetacreditoId: undefined,
    fechaexpiracion: '',
    cvv: '',
    tipopago: '',
  };

  ngOnInit() {
    this.cargarProductos();
    this.cargarOfertas();
    this.cargarFormasPago();
    this.cargarTarjetasCredito();
    this.cargarImpuestosISV();
    this.cargarParamFacISV();

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'nuevo') {
      this.cargarPedidoExistente(Number(id));
    }
  }

  /** Vuelve al listado de pedidos (con fallback si no hay historial) */
  volver() {
    this.navegacion.volver(['/facturacion/pedidos']);
  }

  cargarPedidoExistente(pedidoId: number) {
    this.cargando.set(true);
    this.pedidosService.getPedido(pedidoId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (pedido) => {
          this.pedidoId.set(pedido.pospedmaeId);
          this.pedidoDatosCliente.set({ nombre: pedido.nombrecliente || '', tel: pedido.nrotelefono || '' });
          this.pedidosService.getPedidoItems(pedido.pospedmaeId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: (items) => {
                this.pedidoItems.set(items);
                this.cargando.set(false);
              },
              error: () => {
                this.cargando.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los items del pedido' });
              },
            });
        },
        error: () => {
          this.cargando.set(false);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Pedido no encontrado' });
        },
      });
  }

  cargarProductos() {
    this.cargando.set(true);
    this.pedidosService.getProductos(true)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.productos.set(data);
          this.cargando.set(false);
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los productos' });
          this.cargando.set(false);
        },
      });
  }

  /** Carga productos en oferta/promoción desde un solo endpoint */
  cargarOfertas() {
    this.api.get<any>('/facturacion/combos-ofertas')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const ofertas = res?.value ?? res ?? [];
          for (const o of (Array.isArray(ofertas) ? ofertas : [])) {
            const pid = Number(o.productoId);
            this.mapaOfertas.set(pid, Number(o.precioConDescuento));
            this.mapaDescuento.set(pid, Number(o.porcentaje));
          }
        },
        error: () => {},
      });
  }

  /** Retorna el precio con descuento si el producto está en oferta, null si no */
  getPrecioOferta(producto: ProductoTienda): number | null {
    return this.mapaOfertas.get(Number(producto.produtoId)) ?? null;
  }

  /** Retorna el porcentaje de descuento si el producto está en oferta, 0 si no */
  getPorcentajeDescuento(producto: ProductoTienda): number {
    return this.mapaDescuento.get(Number(producto.produtoId)) ?? 0;
  }

  /** Verifica si el producto está en una oferta/promoción */
  esOferta(producto: ProductoTienda): boolean {
    return this.mapaOfertas.has(Number(producto.produtoId));
  }

  cargarFormasPago() {
    this.api.get<{ formapagoId: number; descripcion: string }[]>('/parametros/formas-pago')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          const permitidas = data.filter(f =>
            this.formasPagoPermitidas.some(p => f.descripcion.toLowerCase().includes(p))
          );
          this.formaspago.set(permitidas.map(f => ({ label: f.descripcion, value: f.formapagoId })));
        },
        error: () => {},
      });
  }

  cargarTarjetasCredito() {
    this.api.get<{ tarjetacreditoId: number; descripcion: string }[]>('/parametros/tarjetas-credito')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.tarjetasCredito.set(data.map(t => ({ label: t.descripcion, value: t.tarjetacreditoId })));
        },
        error: () => {},
      });
  }

  /** Catálogo de impuestos (módulo Facturación): ISV 15%, 18%, etc. */
  private cargarImpuestosISV() {
    this.api.get<any[]>('/parametros/impuestos')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          this.impuestos = items ?? [];
          this.aplicarTasa();
        },
        error: () => {},
      });
  }

  /** Param-fac (módulo 3): impuesto configurado para facturación */
  private cargarParamFacISV() {
    this.api.get<any>('/parametros/parametros/objeto?moduloId=3')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (p) => {
          this.impuestoId = Number(p?.impuestoId) || null;
          this.aplicarTasa();
        },
        error: () => {},
      });
  }

  /** Resuelve la tasa: por impuestoId del param-fac, o fallback al primer impuesto activo del módulo 3 (igual que nueva-factura) */
  private aplicarTasa() {
    if (!this.impuestos.length) return;
    const porId = this.impuestos.find(i => i.impuestoId === this.impuestoId && i.sn_activo === 'S');
    const porModulo = porId || this.impuestos.find(i => Number(i.moduloId) === 3 && i.sn_activo === 'S');
    if (porModulo && Number(porModulo.porcentaje) > 0) {
      this.tasaImpuestoPct = Number(porModulo.porcentaje);
      this.tasaImpuesto = this.tasaImpuestoPct / 100;
    }
  }

  /** ISV de una línea — round(bruto × tasa, 2); pedidos no manejan descuento ni exenta */
  private calcularImpuesto(bruto: number): number {
    if (this.tasaImpuesto <= 0) return 0;
    return Math.round(bruto * this.tasaImpuesto * 100) / 100;
  }

  async agregarAlPedido(producto: ProductoTienda) {
    if (producto.existencia <= 0) {
      this.messageService.add({ severity: 'warn', summary: 'Sin stock', detail: 'Producto sin existencia' });
      return;
    }

    if (!this.pedidoId()) {
      await this.crearPedido();
    }

    const existing = this.pedidoItems().find(i => i.productoId === Number(producto.produtoId));
    const nuevaCant = existing ? existing.cantidad + 1 : 1;
    if (nuevaCant > producto.existencia) {
      this.messageService.add({ severity: 'warn', summary: 'Stock insuficiente', detail: `Solo quedan ${producto.existencia} unidades` });
      return;
    }

    this.cargandoPedido.set(true);
    const nrofila = this.pedidoItems().length + 1;
    const precio = Number(producto.precioventa);
    const subtotal = precio * nuevaCant;

    const payload = {
      pospedmaeId: this.pedidoId()!,
      productoId: Number(producto.produtoId),
      codbarra: producto.codbarra || '',
      cantidad: nuevaCant,
      precioventa: precio,
      subtotal,
      descuento: 0,
      impuesto: this.calcularImpuesto(subtotal),
      nrofila,
    };

    if (existing) {
      this.pedidosService.eliminarItem(existing.pospeddetId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.pedidosService.agregarItem(payload)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: () => {
                this.recargarItems();
                this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: `${producto.descripcion} — ${nuevaCant} unidades en el pedido` });
              },
              error: () => this.cargandoPedido.set(false),
            });
        });
    } else {
      this.pedidosService.agregarItem(payload)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.recargarItems();
            this.messageService.add({ severity: 'success', summary: 'Agregado', detail: `${producto.descripcion} agregado al pedido` });
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo agregar al pedido' });
            this.cargandoPedido.set(false);
          },
        });
    }
  }

  async crearPedido() {
    return new Promise<void>((resolve) => {
      this.pedidosService.crearPedido('Cliente Pedido', '')
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (pedido) => {
            this.pedidoId.set(pedido.pospedmaeId);
            resolve();
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el pedido' });
            resolve();
          },
        });
    });
  }

  recargarItems() {
    if (!this.pedidoId()) return;
    this.pedidosService.getPedidoItems(this.pedidoId()!)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          this.pedidoItems.set(items);
          this.cargandoPedido.set(false);
        },
        error: () => this.cargandoPedido.set(false),
      });
  }

  incrementar(item: PedidoItem) {
    const prod = this.productos().find(p => p.produtoId === Number(item.productoId));
    if (prod && Number(item.cantidad) >= prod.existencia) {
      this.messageService.add({ severity: 'warn', summary: 'Stock insuficiente', detail: `Solo quedan ${prod.existencia} unidades` });
      return;
    }
    const precio = Number(item.precioventa);
    const nuevaCant = Number(item.cantidad) + 1;
    const subtotal = precio * nuevaCant;
    this.pedidosService.eliminarItem(item.pospeddetId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.pedidosService.agregarItem({
          pospedmaeId: this.pedidoId()!,
          productoId: item.productoId,
          codbarra: item.codbarra,
          cantidad: nuevaCant,
          precioventa: precio,
          subtotal,
          descuento: 0,
          impuesto: this.calcularImpuesto(subtotal),
          nrofila: item.nrofila,
        }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
          this.recargarItems();
          this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: `${item.descripcion || item.codbarra} — ${nuevaCant} unidades en el pedido` });
        });
      });
  }

  decrementar(item: PedidoItem) {
    if (Number(item.cantidad) <= 1) {
      this.eliminarDelPedido(item);
      return;
    }
    const precio = Number(item.precioventa);
    const nuevaCant = Number(item.cantidad) - 1;
    const subtotal = precio * nuevaCant;
    this.pedidosService.eliminarItem(item.pospeddetId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.pedidosService.agregarItem({
          pospedmaeId: this.pedidoId()!,
          productoId: item.productoId,
          codbarra: item.codbarra,
          cantidad: nuevaCant,
          precioventa: precio,
          subtotal,
          descuento: 0,
          impuesto: this.calcularImpuesto(subtotal),
          nrofila: item.nrofila,
        }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.recargarItems());
      });
  }

  eliminarDelPedido(item: PedidoItem) {
    this.pedidosService.eliminarItem(item.pospeddetId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.recargarItems());
  }

  /** Abre el diálogo para guardar el pedido con datos del cliente (facturación a futuro) */
  abrirGuardarPedido() {
    if (!this.pedidoId() || this.pedidoItems().length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'Pedido vacío', detail: 'Agrega productos antes de guardar' });
      return;
    }
    const user = this.auth.currentUser();
    this.guardarNombre.set(user?.nombre || 'Cliente Tienda');
    this.guardarTelefono.set('Registrado');
    this.dialogGuardarPedido.set(true);
  }

  /**
   * Persiste nombre/teléfono del pedido (PUT) y navega al listado:
   * el pedido queda registrado con su cliente para facturarlo a futuro
   * desde /facturacion/pedidos → Editar → Facturar pedido.
   */
  guardarPedido() {
    const nombre = this.guardarNombre().trim();
    if (!nombre) {
      this.messageService.add({ severity: 'warn', summary: 'Campo requerido', detail: 'Ingresa el nombre del cliente' });
      return;
    }
    const id = this.pedidoId()!;
    this.guardandoPedido.set(true);
    this.pedidosService.actualizarPedido(id, {
      nombrecliente: nombre,
      nrotelefono: this.guardarTelefono().trim() || 'N/A',
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.guardandoPedido.set(false);
          this.messageService.add({
            severity: 'success',
            summary: `Pedido #${id} guardado`,
            detail: 'Podés facturarlo desde el listado de pedidos',
          });
          this.limpiarTodo();
          this.router.navigate(['/facturacion/pedidos']);
        },
        error: () => {
          this.guardandoPedido.set(false);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el pedido' });
        },
      });
  }

  abrirCheckout() {
    if (this.pedidoItems().length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'Pedido vacío', detail: 'Agrega productos antes de facturar' });
      return;
    }
    const user = this.auth.currentUser();
    this.checkout = {
      pospedmaeId: this.pedidoId()!,
      nombrecliente: user?.nombre || 'Cliente Tienda',
      nrotelefono: 'Registrado',
      formapagoId: this.formaspago().length > 0 ? this.formaspago()[0].value : 0,
      efectivo_recibido: this.totalPedido(),
      nrotarjeta: '',
      tarjetacreditoId: this.tarjetasCredito().length > 0 ? this.tarjetasCredito()[0].value : undefined,
      fechaexpiracion: '',
      cvv: '',
      nroautorizacion: '',
      tipopago: '',
    };
    this.onFormaPagoChange();
    this.tarjetaError.set(null);
    this.dialogCheckout.set(true);
  }

  onFormaPagoChange() {
    const fp = this.formaspago().find(f => f.value === this.checkout.formapagoId);
    if (fp) {
      const desc = fp.label.toLowerCase();
      if (desc.includes('tarjeta')) {
        this.checkout.tipopago = 'T';
      } else if (desc.includes('transferencia')) {
        this.checkout.tipopago = 'TR';
      } else {
        this.checkout.tipopago = 'E';
      }
    }
  }

  esTarjeta(): boolean {
    return this.checkout.tipopago === 'T';
  }

  esTransferencia(): boolean {
    return this.checkout.tipopago === 'TR';
  }

  procesarPago() {
    if (!this.checkout.nombrecliente) {
      this.messageService.add({ severity: 'warn', summary: 'Campo requerido', detail: 'Ingresa el nombre del cliente' });
      return;
    }

    if (this.esTarjeta()) {
      if (!this.checkout.nrotarjeta || this.checkout.nrotarjeta.replace(/\s/g, '').length < 13) {
        this.messageService.add({ severity: 'warn', summary: 'Campo requerido', detail: 'Ingresa el número de tarjeta completo' });
        return;
      }
      if (!this.validarLuhn(this.checkout.nrotarjeta)) {
        this.messageService.add({ severity: 'warn', summary: 'Tarjeta inválida', detail: 'El número de tarjeta no es válido' });
        return;
      }
      if (!this.checkout.fechaexpiracion || !/^\d{2}\/\d{2}$/.test(this.checkout.fechaexpiracion)) {
        this.messageService.add({ severity: 'warn', summary: 'Campo requerido', detail: 'Ingresa la fecha de expiración (MM/YY)' });
        return;
      }
      if (!this.checkout.cvv || this.checkout.cvv.length < 3) {
        this.messageService.add({ severity: 'warn', summary: 'Campo requerido', detail: 'Ingresa el CVV (mínimo 3 dígitos)' });
        return;
      }
      if (!this.checkout.tarjetacreditoId) {
        this.messageService.add({ severity: 'warn', summary: 'Campo requerido', detail: 'Selecciona el tipo de tarjeta' });
        return;
      }
    }

    if (this.esTransferencia() && !this.checkout.nroautorizacion) {
      this.messageService.add({ severity: 'warn', summary: 'Campo requerido', detail: 'Ingresa el número de autorización de la transferencia' });
      return;
    }

    this.procesando.set(true);
    this.pedidosService.checkout({
      pospedmaeId: this.checkout.pospedmaeId,
      nombrecliente: this.checkout.nombrecliente,
      nrotelefono: this.checkout.nrotelefono,
      formapagoId: this.checkout.formapagoId,
      efectivo_recibido: this.totalPedido(),
      tarjetacreditoId: this.checkout.tarjetacreditoId,
      nrotarjeta: this.checkout.nrotarjeta,
      nroautorizacion: this.checkout.nroautorizacion,
      tipopago: this.checkout.tipopago,
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resp) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Pedido facturado',
            detail: `Factura #${resp.nrofactura} — Total: L ${Number(resp.total).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          });
          this.dialogCheckout.set(false);
          this.pedidosService.invalidateCache();
          this.procesando.set(false);

          this.api.get<any>(`/facturacion/facturas/${resp.facturaId}/ticket`)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: (ticketData) => {
                this.resumenVentaData.set(ticketData);
                this.dialogResumenVenta.set(true);
                this.limpiarTodo();
              },
              error: () => {
                this.limpiarTodo();
              }
            });
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo procesar el pedido' });
          this.procesando.set(false);
        },
      });
  }

  descargarPdfResumen() {
    const data = this.resumenVentaData();
    if (data) {
      this.impresion.descargar(data).catch(() => {
        this.messageService.add({ severity: 'warn', summary: 'PDF', detail: 'No se pudo generar el PDF' });
      });
    }
  }

  imprimirPdfResumen() {
    const data = this.resumenVentaData();
    if (data) {
      this.impresion.imprimir(data).catch(() => {
        this.messageService.add({ severity: 'warn', summary: 'Impresión', detail: 'No se pudo imprimir' });
      });
    }
  }

  cerrarResumenVenta() {
    this.dialogResumenVenta.set(false);
    this.resumenVentaData.set(null);
  }

  limpiarTodo() {
    this.pedidoItems.set([]);
    this.pedidoId.set(null);
    this.dialogCheckout.set(false);
    this.dialogGuardarPedido.set(false);
    this.pedidoDatosCliente.set(null);
    this.guardarNombre.set('');
    this.guardarTelefono.set('');
  }

  resolverImagen(imagen: string | null): string {
    if (!imagen) return '';
    return /^data:/i.test(imagen) ? imagen : `data:image/png;base64,${imagen}`;
  }

  getItemImagen(item: PedidoItem): string {
    if (item.imagen) return this.resolverImagen(item.imagen);
    const prod = this.productos().find(p => p.produtoId === Number(item.productoId));
    return prod?.imagen ? this.resolverImagen(prod.imagen) : '';
  }

  // ==================== Galería de imágenes ====================
  abrirGaleria(producto: ProductoTienda): void {
    const principal: string[] = producto.imagen ? [this.resolverImagen(producto.imagen)] : [];
    const id = Number(producto.produtoId);

    this.galeriaTitulo.set(producto.descripcion || producto.codbarra || 'Producto');
    this.galeriaIndice.set(0);
    this.galeriaImagenes.set(principal);
    this.galeriaCargando.set(false);
    this.dialogGaleria.set(true);

    const cacheado = this.galeriaCache.get(id);
    if (cacheado && cacheado.length) {
      this.galeriaImagenes.set(cacheado);
      return;
    }

    this.galeriaCargando.set(true);
    this.api
      .get<{ productoId: number; img: string; sn_activo?: string }[]>('/inventario/productos-img', { productoId: id })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const vistos = new Set<string>();
          const imgs: string[] = [];
          for (const r of Array.isArray(res) ? res : []) {
            if (!r?.img || r.sn_activo === 'N') continue;
            const url = this.resolverImagen(r.img);
            if (!vistos.has(url)) {
              vistos.add(url);
              imgs.push(url);
            }
          }
          // La imagen principal (la de la card) va primero
          const ordenadas = principal.length
            ? [principal[0], ...imgs.filter(u => u !== principal[0])]
            : imgs;
          if (ordenadas.length) this.galeriaCache.set(id, ordenadas);
          this.galeriaImagenes.set(ordenadas);
          this.galeriaCargando.set(false);
        },
        error: () => {
          this.galeriaCargando.set(false);
          this.messageService.add({ severity: 'error', summary: 'Galería', detail: 'No se pudieron cargar las imágenes' });
        },
      });
  }

  /** Formato Lempiras con separador de miles y 2 decimales (ej: L 1,250.00) */
  formatearPrecio(precio: number | string): string {
    return `L ${Number(precio).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

  getSeverity(stock: number): 'secondary' | 'warn' | 'danger' {
    if (stock > 26) return 'secondary';
    if (stock > 5 && stock <=25) return 'warn';
    return 'danger';
  }

  isMobile(): boolean {
    return typeof window !== 'undefined' && window.innerWidth <= 768;
  }

  validarTarjetaBlur() {
    const valor = this.checkout.nrotarjeta?.replace(/\s/g, '');
    if (!valor) {
      this.tarjetaError.set(null);
      return;
    }
    if (valor.length < 13) {
      this.tarjetaError.set('El número de tarjeta debe tener al menos 13 dígitos');
      return;
    }
    if (!this.validarLuhn(valor)) {
      this.tarjetaError.set('El número de tarjeta no es válido');
      return;
    }
    this.tarjetaError.set(null);
  }

  trackByProductoId = (_: number, p: ProductoTienda) => p.produtoId;
  trackByItemId = (_: number, i: PedidoItem) => i.pospeddetId;
}
