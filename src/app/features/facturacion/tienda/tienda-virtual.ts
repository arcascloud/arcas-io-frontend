import { Component, OnInit, inject, signal, computed, model, DestroyRef, NgZone, ViewChild, effect, ChangeDetectorRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter, forkJoin } from 'rxjs';
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
import { MessageService, MenuItem } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { GalleriaModule } from 'primeng/galleria';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MultiSelectModule } from 'primeng/multiselect';
import { TiendaService } from './tienda.service';
import { TiendaFiltroService } from '../../../core/services/tienda-filtro.service';
import { CategoriasService } from '../../../core/services/categorias.service';
import { ProductoTienda, CarritoItem, CheckoutPago } from '../../../core/models/tienda.models';
import { Categoria } from '../../../core/models/inventario.models';
import { AuthService } from '../../../core/services/auth.service';
import { CarritoStateService } from '../../../core/services/carrito-state.service';
import { ApiService } from '../../../core/services/api.service';
import { UsuariosService } from '../../../core/services/usuarios.service';
import { TableModule } from 'primeng/table';
import { FacturaImpresionService } from '../../../core/services/factura-impresion.service';
import { LoginDialog } from '../../../layout/login-dialog/login-dialog';
import { RegistroDialog } from '../../../layout/registro-dialog/registro-dialog';

@Component({
  selector: 'app-tienda-virtual',
  standalone: true,
  imports: [
    CommonModule, FormsModule, DataViewModule, ButtonModule, DialogModule,
    InputNumberModule, InputTextModule, InputMaskModule, SelectModule, TagModule, ToastModule,
    BadgeModule, TooltipModule, MessageModule, GalleriaModule, BreadcrumbModule, MultiSelectModule,
    LoginDialog, RegistroDialog, TableModule,
  ],
  providers: [],
  templateUrl: './tienda-virtual.html',
  styleUrl: './tienda-virtual.scss',
})
export class TiendaVirtual implements OnInit {
  private tiendaService = inject(TiendaService);
  private auth = inject(AuthService);
  private messageService = inject(MessageService);
  private destroyRef = inject(DestroyRef);
  private carritoState = inject(CarritoStateService);
  private api = inject(ApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  readonly filtroService = inject(TiendaFiltroService);
  private categoriasService = inject(CategoriasService);
  private impresion = inject(FacturaImpresionService);
  private usuariosService = inject(UsuariosService);
  private cdr = inject(ChangeDetectorRef);

  dialogResumenVenta = signal(false);
  resumenVentaData = signal<any>(null);

  /** true si hay sesión activa — el botón "Pagar" solo se habilita autenticado (tienda es pública) */
  readonly autenticado = this.auth.isAuthenticated;

  /** Login/registro en diálogo: el visitante agrega al carrito libre, pero pagar exige sesión */
  @ViewChild('loginGate') loginGate?: LoginDialog;
  @ViewChild('registroGate') registroGate?: RegistroDialog;

  allCategorias = signal<Categoria[]>([]);

  readonly breadcrumbHome: MenuItem = {
    icon: 'pi pi-home',
    command: () => this.resetFiltros(),
  };

  breadcrumbItems = computed<MenuItem[]>(() => {
    const catNombres = this.filtroService.categoriaNombres();
    const depNombre = this.filtroService.deptoNombre();
    const items: MenuItem[] = [];

    if (depNombre) {
      items.push({ label: depNombre });
    }
    if (catNombres && catNombres.length > 0) {
      items.push({ label: catNombres.join(', ') });
    }
    if (items.length === 0) {
      items.push({ label: 'Todos los productos' });
    }
    return items;
  });

  resetFiltros() {
    this.filtroService.limpiarFiltros();
    this.busqueda.set('');
  }

  onCategoriasChange(categoriaIds: any) {
    const ids = Array.isArray(categoriaIds) ? categoriaIds.map(Number) : (categoriaIds != null && categoriaIds !== '' ? [Number(categoriaIds)] : []);
    const cats = this.allCategorias().filter(c => ids.includes(Number(c.categoriaId)));
    const nombres = cats.length > 0 ? cats.map(c => c.descripcion) : this.productos().filter(p => ids.includes(Number(p.categoriaId))).map(p => p.categoria).filter((n): n is string => !!n);
    this.filtroService.setFiltros(
      ids,
      this.filtroService.deptoId(),
      nombres,
      this.filtroService.deptoNombre()
    );
  }

  productos = signal<ProductoTienda[]>([]);
  carritoItems = signal<CarritoItem[]>([]);
  carritoId = signal<number | null>(null);
  busqueda = signal<string>('');

  categoriaIdFiltro = signal<number | null>(null);
  deptoIdFiltro = signal<number | null>(null);
  layout = signal<'grid' | 'list'>('grid');
  cargando = signal(false);
  cargandoCarrito = signal(false);

  // model() en vez de signal(): [(visible)] de PrimeNG es binding de dos vías —
  // con signal() plano, visibleChange() SOBREESCRIBE la señal con un booleano
  // y el siguiente .set(true) truena ("no abre el diálogo").
  dialogCheckout = model(false);
  procesando = signal(false);
  tarjetasCredito = signal<{ label: string; value: number }[]>([]);
  tarjetaError = signal<string | null>(null);
  /** Señal del carrito compartida con el topbar (CarritoStateService) */
  readonly carritoOpen = this.carritoState.carritoOpen;

  // ==================== Galería de imágenes ====================
  dialogGaleria = model(false);
  galeriaTitulo = signal('');
  galeriaImagenes = signal<string[]>([]);
  galeriaIndice = signal(0);
  galeriaCargando = signal(false);
  /** Cache productoId → imágenes (evita re-fetch al reabrir) */
  private galeriaCache = new Map<number, string[]>();
  private galeriaSub: any = null;

  /** Opciones responsive del Galleria (patrón doc PrimeNG) */
  readonly galeriaResponsiveOptions = [
    { breakpoint: '1024px', numVisible: 5 },
    { breakpoint: '768px', numVisible: 4 },
    { breakpoint: '560px', numVisible: 3 },
  ];

  /** Mapa productoId → precio con descuento de promo/oferta */
  private mapaOfertas = new Map<number, number>();
  /** Mapa productoId → porcentaje de descuento */
  private mapaDescuento = new Map<number, number>();

  // Image cache removed — browser handles caching natively

  categorias = computed(() => {
    const depId = this.filtroService.deptoId();
    let cats = this.allCategorias();
    if (depId) {
      cats = cats.filter((c) => Number(c.deptoId) === Number(depId));
    }
    return cats
      .filter((x) => x.sn_activo === 'S')
      .sort((a, b) => a.descripcion.localeCompare(b.descripcion))
      .map((x) => ({ label: x.descripcion, value: x.categoriaId }));
  });
  ordenarPor = signal<string>('default');
  soloOfertas = signal(false);

  readonly opcionesOrden = [
    { label: 'Destacados', value: 'default' },
    { label: 'Menor precio', value: 'precio-asc' },
    { label: 'Mayor precio', value: 'precio-desc' },
    { label: 'Nombre A-Z', value: 'nombre-asc' },
    { label: 'Nombre Z-A', value: 'nombre-desc' },
  ];

  productosFiltrados = computed(() => {
    let lista = this.productos();
    const catIds = this.filtroService.categoriaIds();
    const depId = this.filtroService.deptoId();
    const busq = this.busqueda().toLowerCase();
    const orden = this.ordenarPor();
    const soloOfertas = this.soloOfertas();

    if (soloOfertas) lista = lista.filter(p => this.esOferta(p));
    if (catIds && catIds.length > 0) {
      lista = lista.filter(p => catIds.map(Number).includes(Number(p.categoriaId)));
    }
    if (depId) {
      lista = lista.filter(p => Number(p.deptoId) === Number(depId) || Number(p.categoriaDeptoId) === Number(depId));
    }
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

  totalItems = computed(() => this.carritoItems().reduce((sum, i) => sum + Number(i.cantidad), 0));
  totalCarrito = computed(() => this.carritoItems().reduce((sum, i) => sum + Number(i.subTotal), 0));

  /** Sincroniza totalItems al servicio compartido para que el topbar lo muestre */
  private _syncCarrito = effect(() => {
    this.carritoState.setTotalItems(this.totalItems());
  });

  checkout: CheckoutPago & { nrotarjeta?: string; tarjetacreditoId?: number; fechaexpiracion?: string; cvv?: string } = {
    poscotmaeId: 0,
    nombrecliente: '',
    direccion: '',
    formapagoId: 2,
    efectivo_recibido: 0,
    nrotarjeta: '',
    tarjetacreditoId: undefined,
    fechaexpiracion: '',
    cvv: '',
  };

  ngOnInit() {
    // Búsqueda enviada desde el buscador global del topbar (?buscar=texto)
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const buscar = params.get('buscar');
        if (buscar) this.busqueda.set(buscar);
      });
    this.categoriasService.getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (cats) => this.allCategorias.set(cats),
        error: () => {},
      });
    this.cargarProductos();
    this.cargarTarjetasCredito();
    this.cargarOfertas();
  }

  cargarProductos() {
    this.cargando.set(true);
    this.tiendaService.getProductos(true, 'tienda')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.productos.set(data);
          this.cargando.set(false);
          this.cdr.markForCheck();
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los productos' });
          this.cargando.set(false);
          this.cdr.markForCheck();
        },
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

  async agregarAlCarrito(producto: ProductoTienda) {
    if (producto.existencia <= 0) {
      this.messageService.add({ severity: 'warn', summary: 'Sin stock', detail: 'Producto sin existencia' });
      return;
    }

    if (!this.carritoId()) {
      await this.crearCarrito();
    }

    const existing = this.carritoItems().find(i => i.productoId === String(producto.produtoId));
    const nuevaCant = existing ? existing.cantidad + 1 : 1;
    if (nuevaCant > producto.existencia) {
      this.messageService.add({ severity: 'warn', summary: 'Stock insuficiente', detail: `Solo quedan ${producto.existencia} unidades` });
      return;
    }

    this.cargandoCarrito.set(true);
    const payload = {
      poscotmaeId: this.carritoId()!,
      productoId: String(producto.produtoId),
      codbarra: producto.codbarra || '',
      cantidad: nuevaCant,
      precio: Number(producto.precioventa),
      subTotal: Number(producto.precioventa) * nuevaCant,
    };

    if (existing) {
      this.tiendaService.eliminarItem(existing.poscotdetId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.tiendaService.agregarItem(payload)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: () => this.recargarItems(),
              error: () => this.cargandoCarrito.set(false),
            });
        });
    } else {
      this.tiendaService.agregarItem(payload)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.recargarItems();
            this.messageService.add({ severity: 'success', summary: 'Agregado', detail: `${producto.descripcion} agregado al carrito` });
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo agregar al carrito' });
            this.cargandoCarrito.set(false);
          },
        });
    }
  }

  async crearCarrito() {
    return new Promise<void>((resolve) => {
      const user = this.auth.currentUser();
      const gestorId = user?.usuarioId || 1;
      const atendio = user?.nombre || 'Tienda Online';
      this.tiendaService.crearCarrito('Cliente Tienda', 'N/A', atendio, gestorId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (carrito) => {
            this.carritoId.set(carrito.poscotmaeId);
            resolve();
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el carrito' });
            resolve();
          },
        });
    });
  }

  recargarItems() {
    if (!this.carritoId()) return;
    this.tiendaService.getCarritoItems(this.carritoId()!)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          this.carritoItems.set(items);
          this.cargandoCarrito.set(false);
        },
        error: () => this.cargandoCarrito.set(false),
      });
  }

  incrementar(item: CarritoItem) {
    const prod = this.productos().find(p => p.produtoId === Number(item.productoId));
    if (prod && Number(item.cantidad) >= prod.existencia) {
      this.messageService.add({ severity: 'warn', summary: 'Stock insuficiente', detail: `Solo quedan ${prod.existencia} unidades` });
      return;
    }
    const precio = Number(item.precio);
    const nuevaCant = Number(item.cantidad) + 1;
    this.tiendaService.eliminarItem(item.poscotdetId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.tiendaService.agregarItem({
          poscotmaeId: this.carritoId()!,
          productoId: item.productoId,
          codbarra: item.codbarra,
          cantidad: nuevaCant,
          precio,
          subTotal: precio * nuevaCant,
        }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.recargarItems());
      });
  }

  decrementar(item: CarritoItem) {
    if (Number(item.cantidad) <= 1) {
      this.eliminarDelCarrito(item);
      return;
    }
    const precio = Number(item.precio);
    const nuevaCant = Number(item.cantidad) - 1;
    this.tiendaService.eliminarItem(item.poscotdetId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.tiendaService.agregarItem({
          poscotmaeId: this.carritoId()!,
          productoId: item.productoId,
          codbarra: item.codbarra,
          cantidad: nuevaCant,
          precio,
          subTotal: precio * nuevaCant,
        }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.recargarItems());
      });
  }

  eliminarDelCarrito(item: CarritoItem) {
    this.tiendaService.eliminarItem(item.poscotdetId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.recargarItems());
  }

  // Modal de confirmación "Vaciar carrito" — NO se usa ConfirmationService de
  // PrimeNG porque en zoneless su estado interno no dispara change detection
  // y el modal no se dibuja. Un p-dialog + señal funciona siempre.
  dialogVaciar = model(false);

  confirmarVaciarCarrito() {
    const items = this.carritoItems();
    if (!items.length || this.cargandoCarrito()) return;
    this.dialogVaciar.set(true);
  }

  /** Elimina TODOS los items del carrito en paralelo (forkJoin) */
  vaciarCarrito() {
    const items = this.carritoItems();
    if (!items.length) return;
    this.dialogVaciar.set(false);
    this.cargandoCarrito.set(true);
    forkJoin(items.map(i => this.tiendaService.eliminarItem(i.poscotdetId)))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.carritoItems.set([]);
          this.cargandoCarrito.set(false);
          this.messageService.add({
            severity: 'info',
            summary: 'Carrito vaciado',
            detail: 'Se eliminaron todos los productos del carrito',
          });
        },
        error: () => {
          this.cargandoCarrito.set(false);
          this.recargarItems();
        },
      });
  }

  abrirCheckout() {
    // Tienda pública: visitantes navegan y agregan al carrito libre, pero
    // pagar exige sesión → se abre el diálogo de login (con opción a registro).
    // Tras login exitoso el LoginDialog emite `loginExito` → se retoma el checkout.
    if (!this.auth.isAuthenticated()) {
      this.loginGate?.abrir();
      return;
    }
    if (this.carritoItems().length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'Carrito vacío', detail: 'Agrega productos antes de pagar' });
      return;
    }

    const user = this.auth.currentUser();
    const nombreCompleto = user?.nombre || user?.usuario || 'Cliente Tienda';
    const esEmpleado = user?.tipoPersona === 'E' || user?.sn_cliente !== 'S';

    if (esEmpleado) {
      this.checkout = {
        poscotmaeId: this.carritoId()!,
        nombrecliente: nombreCompleto,
        direccion: 'direccion-interna',
        formapagoId: 2,
        efectivo_recibido: this.totalCarrito(),
        nrotarjeta: '',
        tarjetacreditoId: this.tarjetasCredito().length > 0 ? this.tarjetasCredito()[0].value : undefined,
        fechaexpiracion: '',
        cvv: '',
      };
      this.dialogCheckout.set(true);
      this.cdr.markForCheck();
    } else {
      if (user?.usuarioId) {
        this.usuariosService.getInfo(user.usuarioId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (info) => {
              this.checkout = {
                poscotmaeId: this.carritoId()!,
                nombrecliente: nombreCompleto,
                direccion: info?.direccion || '',
                formapagoId: 2,
                efectivo_recibido: this.totalCarrito(),
                nrotarjeta: '',
                tarjetacreditoId: this.tarjetasCredito().length > 0 ? this.tarjetasCredito()[0].value : undefined,
                fechaexpiracion: '',
                cvv: '',
              };
              this.dialogCheckout.set(true);
              this.cdr.markForCheck();
            },
            error: () => {
              this.checkout = {
                poscotmaeId: this.carritoId()!,
                nombrecliente: nombreCompleto,
                direccion: '',
                formapagoId: 2,
                efectivo_recibido: this.totalCarrito(),
                nrotarjeta: '',
                tarjetacreditoId: this.tarjetasCredito().length > 0 ? this.tarjetasCredito()[0].value : undefined,
                fechaexpiracion: '',
                cvv: '',
              };
              this.dialogCheckout.set(true);
              this.cdr.markForCheck();
            },
          });
      } else {
        this.checkout = {
          poscotmaeId: this.carritoId()!,
          nombrecliente: nombreCompleto,
          direccion: '',
          formapagoId: 2,
          efectivo_recibido: this.totalCarrito(),
          nrotarjeta: '',
          tarjetacreditoId: this.tarjetasCredito().length > 0 ? this.tarjetasCredito()[0].value : undefined,
          fechaexpiracion: '',
          cvv: '',
        };
        this.dialogCheckout.set(true);
        this.cdr.markForCheck();
      }
    }
  }

  procesarPago() {
    // Defensa: el checkout solo procede con sesión activa
    if (!this.auth.isAuthenticated()) {
      this.messageService.add({ severity: 'warn', summary: 'Sesión requerida', detail: 'Inicie sesión para poder pagar' });
      return;
    }
    if (!this.checkout.nombrecliente) {
      this.messageService.add({ severity: 'warn', summary: 'Campo requerido', detail: 'Ingresa el nombre del cliente' });
      return;
    }
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

    this.procesando.set(true);
    this.tiendaService.checkout({
      poscotmaeId: this.checkout.poscotmaeId,
      nombrecliente: this.checkout.nombrecliente,
      direccion: this.checkout.direccion,
      formapagoId: 2,
      efectivo_recibido: this.totalCarrito(),
      tarjetacreditoId: this.checkout.tarjetacreditoId,
      nrotarjeta: this.checkout.nrotarjeta,
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resp) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Venta procesada',
            detail: `Factura #${resp.nrofactura} — Total: L ${resp.total.toFixed(2)}`,
          });
          this.dialogCheckout.set(false);
          this.tiendaService.invalidateCache();
          this.cargarProductos();
          this.procesando.set(false);
          this.cdr.markForCheck();

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
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo procesar el pago' });
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
    this.carritoItems.set([]);
    this.carritoId.set(null);
    this.dialogCheckout.set(false);
  }

  resolverImagen(imagen: string | null): string {
    if (!imagen) return '';
    return /^data:/i.test(imagen) ? imagen : `data:image/png;base64,${imagen}`;
  }

  getItemImagen(item: CarritoItem): string {
    if (item.imagen) return this.resolverImagen(item.imagen);
    const prod = this.productos().find(p => p.produtoId === Number(item.productoId));
    return prod?.imagen ? this.resolverImagen(prod.imagen) : '';
  }

  // ==================== Galería de imágenes ====================
  galeriaNumVisible(): number {
    if (typeof window === 'undefined') return 5;
    const w = window.innerWidth;
    if (w <= 560) return 3;
    if (w <= 768) return 4;
    return 5;
  }

  abrirGaleria(producto: ProductoTienda): void {
    if (this.galeriaSub) {
      this.galeriaSub.unsubscribe();
      this.galeriaSub = null;
    }

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
    this.galeriaSub = this.api
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
  trackByItemId = (_: number, i: CarritoItem) => i.poscotdetId;
}
