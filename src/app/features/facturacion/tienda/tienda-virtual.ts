import { Component, OnInit, inject, signal, computed, DestroyRef, NgZone } from '@angular/core';
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
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { TiendaService } from './tienda.service';
import { ProductoTienda, CarritoItem, CheckoutPago } from '../../../core/models/tienda.models';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-tienda-virtual',
  standalone: true,
  imports: [
    CommonModule, FormsModule, DataViewModule, ButtonModule, DialogModule,
    InputNumberModule, InputTextModule, InputMaskModule, SelectModule, TagModule, ToastModule,
    BadgeModule, TooltipModule, MessageModule,
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
  private api = inject(ApiService);

  productos = signal<ProductoTienda[]>([]);
  carritoItems = signal<CarritoItem[]>([]);
  carritoId = signal<number | null>(null);
  busqueda = signal<string>('');
  layout = signal<'grid' | 'list'>('grid');
  cargando = signal(false);
  cargandoCarrito = signal(false);

  dialogCheckout = signal(false);
  procesando = signal(false);
  tarjetasCredito = signal<{ label: string; value: number }[]>([]);
  tarjetaError = signal<string | null>(null);
  carritoOpen = signal(false);

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

  totalItems = computed(() => this.carritoItems().reduce((sum, i) => sum + Number(i.cantidad), 0));
  totalCarrito = computed(() => this.carritoItems().reduce((sum, i) => sum + Number(i.subTotal), 0));

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
    this.cargarProductos();
    this.cargarTarjetasCredito();
  }

  cargarProductos() {
    this.cargando.set(true);
    this.tiendaService.getProductos()
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
      this.tiendaService.crearCarrito('Cliente Tienda', '', 'Tienda Virtual', 1)
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

  abrirCheckout() {
    if (this.carritoItems().length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'Carrito vacío', detail: 'Agrega productos antes de pagar' });
      return;
    }
    this.checkout = {
      poscotmaeId: this.carritoId()!,
      nombrecliente: 'Cliente Tienda',
      direccion: '',
      formapagoId: 2,
      efectivo_recibido: this.totalCarrito(),
      nrotarjeta: '',
      tarjetacreditoId: this.tarjetasCredito().length > 0 ? this.tarjetasCredito()[0].value : undefined,
      fechaexpiracion: '',
      cvv: '',
    };
    this.dialogCheckout.set(true);
  }

  procesarPago() {
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
          this.limpiarTodo();
          this.tiendaService.invalidateCache();
          this.procesando.set(false);
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo procesar el pago' });
          this.procesando.set(false);
        },
      });
  }

  limpiarTodo() {
    this.carritoItems.set([]);
    this.carritoId.set(null);
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

  getItemImagen(item: CarritoItem): string {
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
  trackByItemId = (_: number, i: CarritoItem) => i.poscotdetId;
}
