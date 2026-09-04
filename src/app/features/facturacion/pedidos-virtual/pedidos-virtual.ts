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
import { PedidosVirtualService } from './pedidos-virtual.service';
import { ProductoTienda, PedidoItem, CheckoutPedido } from '../../../core/models/pedido.models';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-pedidos-virtual',
  standalone: true,
  imports: [
    CommonModule, FormsModule, DataViewModule, ButtonModule, DialogModule,
    InputNumberModule, InputTextModule, InputMaskModule, SelectModule, TagModule, ToastModule,
    TooltipModule, MessageModule,
  ],
  providers: [],
  templateUrl: './pedidos-virtual.html',
  styleUrl: './pedidos-virtual.scss',
})
export class PedidosVirtual implements OnInit {
  private pedidosService = inject(PedidosVirtualService);
  private auth = inject(AuthService);
  private messageService = inject(MessageService);
  private destroyRef = inject(DestroyRef);
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);

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

  private imagenCache = new Map<string, string>();

  categorias = computed(() => {
    const cats = new Set(this.productos().map(p => p.categoria).filter(Boolean));
    return [{ label: 'Todos', value: null }, ...Array.from(cats).map(c => ({ label: c!, value: c! }))];
  });
  categoriaFiltro = signal<string | null>(null);
  ordenarPor = signal<string>('default');

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
  totalPedido = computed(() => this.pedidoItems().reduce((sum, i) => sum + Number(i.subtotal), 0));

  checkout: CheckoutPedido & { nrotarjeta?: string; tarjetacreditoId?: number; fechaexpiracion?: string; cvv?: string } = {
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
    this.cargarFormasPago();
    this.cargarTarjetasCredito();

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'nuevo') {
      this.cargarPedidoExistente(Number(id));
    }
  }

  cargarPedidoExistente(pedidoId: number) {
    this.cargando.set(true);
    this.pedidosService.getPedido(pedidoId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (pedido) => {
          this.pedidoId.set(pedido.pospedmaeId);
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
    this.pedidosService.getProductos()
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
      impuesto: 0,
      nrofila,
    };

    if (existing) {
      this.pedidosService.eliminarItem(existing.pospeddetId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.pedidosService.agregarItem(payload)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: () => this.recargarItems(),
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
    this.pedidosService.eliminarItem(item.pospeddetId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.pedidosService.agregarItem({
          pospedmaeId: this.pedidoId()!,
          productoId: item.productoId,
          codbarra: item.codbarra,
          cantidad: nuevaCant,
          precioventa: precio,
          subtotal: precio * nuevaCant,
          descuento: 0,
          impuesto: 0,
          nrofila: item.nrofila,
        }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.recargarItems());
      });
  }

  decrementar(item: PedidoItem) {
    if (Number(item.cantidad) <= 1) {
      this.eliminarDelPedido(item);
      return;
    }
    const precio = Number(item.precioventa);
    const nuevaCant = Number(item.cantidad) - 1;
    this.pedidosService.eliminarItem(item.pospeddetId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.pedidosService.agregarItem({
          pospedmaeId: this.pedidoId()!,
          productoId: item.productoId,
          codbarra: item.codbarra,
          cantidad: nuevaCant,
          precioventa: precio,
          subtotal: precio * nuevaCant,
          descuento: 0,
          impuesto: 0,
          nrofila: item.nrofila,
        }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.recargarItems());
      });
  }

  eliminarDelPedido(item: PedidoItem) {
    this.pedidosService.eliminarItem(item.pospeddetId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.recargarItems());
  }

  abrirCheckout() {
    if (this.pedidoItems().length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'Pedido vacío', detail: 'Agrega productos antes de facturar' });
      return;
    }
    this.checkout = {
      pospedmaeId: this.pedidoId()!,
      nombrecliente: 'Cliente Pedido',
      nrotelefono: '',
      formapagoId: this.formaspago().length > 0 ? this.formaspago()[0].value : 0,
      efectivo_recibido: this.totalPedido(),
      nrotarjeta: '',
      tarjetacreditoId: this.tarjetasCredito().length > 0 ? this.tarjetasCredito()[0].value : undefined,
      fechaexpiracion: '',
      cvv: '',
      tipopago: '',
    };
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
            detail: `Factura #${resp.nrofactura} — Total: L ${resp.total.toFixed(2)}`,
          });
          this.limpiarTodo();
          this.pedidosService.invalidateCache();
          this.procesando.set(false);
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo procesar el pedido' });
          this.procesando.set(false);
        },
      });
  }

  limpiarTodo() {
    this.pedidoItems.set([]);
    this.pedidoId.set(null);
    this.dialogCheckout.set(false);
  }

  resolverImagen(imagen: string | null): string {
    if (!imagen) return '';
    const cacheKey = imagen.substring(0, 100);
    if (this.imagenCache.has(cacheKey)) return this.imagenCache.get(cacheKey)!;
    const result = /^data:/i.test(imagen) ? imagen : `data:image/png;base64,${imagen}`;
    this.imagenCache.set(cacheKey, result);
    return result;
  }

  getItemImagen(item: PedidoItem): string {
    if (item.imagen) return this.resolverImagen(item.imagen);
    const prod = this.productos().find(p => p.produtoId === Number(item.productoId));
    return prod?.imagen ? this.resolverImagen(prod.imagen) : '';
  }

  formatearPrecio(precio: number | string): string {
    return `L ${Number(precio).toFixed(2)}`;
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

  getSeverity(stock: number): 'success' | 'warn' | 'danger' {
    if (stock > 10) return 'success';
    if (stock > 0) return 'warn';
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
