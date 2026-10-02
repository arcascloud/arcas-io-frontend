import { Component, inject, signal, computed, OnInit, DestroyRef, HostListener } from '@angular/core';
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
import { ToolbarModule } from 'primeng/toolbar';
import { TagModule } from 'primeng/tag';
import { forkJoin } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../../core/services/api.service';
import { FacturacionService } from '../../../core/services/facturacion.service';
import { ProductosHelperList } from '../../helpers/productos';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { FooterHelper } from '../../helpers/footer';
import { Producto } from '../../../core/models/inventario.models';
import { AuthService } from '../../../core/services/auth.service';
import { QuickNavService } from '../../../core/services/quick-nav.service';
import { TooltipModule } from 'primeng/tooltip';
import { BadgeModule } from 'primeng/badge';
import { DividerModule } from 'primeng/divider';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';


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
  subTotal: number;
}

interface PagoFactura {
  formapagoId: number | null;
  tarjetacreditoId: number | null;
  nrotarjeta: string;
  nroautorizacion: string;
  importe: number;
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
  ],
  providers: [DialogService],
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

  ref: DynamicDialogRef | undefined;

  private readonly MODULO_FACTURACION = 4;

  form!: FormGroup;

  cargando = signal(false);
  guardando = signal(false);

  vsize = signal('small');
  clientes = signal<Opcion[]>([]);
  formaspago = signal<Opcion[]>([]);
  tarjetas = signal<Opcion[]>([]);

  productosArray: Producto[] = [];
  dialogProductos = signal(false);
  dialogPagos = signal(false);
  qProducto = signal('');
  productosFiltrados = signal<Producto[]>([]);

  filas = signal<FilaDet[]>([]);
  pagos = signal<PagoFactura[]>([]);
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
  private ofertasMap = new Map<number, { porcentaje: number; precioConDescuento: number; desc: string }>();

  /** IDs de descuentos que SÍ se acumulan con promos (ej: Tercera Edad) */
  private descAcumulables = new Set<number>();

  nombreClienteManual = signal('');
  dialogAtajos = signal(false);
  dialogSuspendidas = signal(false);
  ventasSuspendidas = signal<any[]>([]);
  zoomVisible = signal(false);
  zoomUrl = signal('');
  zoomX = signal(0);
  zoomY = signal(0);

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
    { label: 'Crédito', value: 'C' }
  ];

 readonly snNombreOptions = [
    { label: 'No', value: 'N' },
    { label: 'Si', value: 'S' }
  ];

  readonly snOptions = [
    { label: 'No', value: 'N' },
    { label: 'Sí', value: 'S' }
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
    this.api.get<any>('/parametros/parametros/objeto?moduloId=4').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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
    this.api.get<any[]>('/parametros/impuestos').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (items) => {
        this.impuestos = items ?? [];
        this.aplicarTasa();
      },
    });
  }

  private cargarParamFac() {
    this.api.get<any>('/parametros/parametros/objeto?moduloId=3').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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
    const empresaId = this.auth.currentUser()?.empresaId;
    const usuarioId = this.auth.currentUser()?.usuarioId;
    if (!empresaId || !usuarioId) return;

    this.api.get<any[]>('/parametros/gestores').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (items) => {
        console.log('[cargarGestor] empresaId:', empresaId, 'usuarioId:', usuarioId);
        console.log('[cargarGestor] gestores:', items);
        const gestor = (items ?? []).find(
          (g) => Number(g.empresaId) === empresaId && Number(g.usuarioId) === usuarioId,
        );
        console.log('[cargarGestor] gestor found:', gestor);
        if (gestor) {
          this.form.patchValue({ gestorId: gestor.gestorId });
        }
      },
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
    this.api.get<any[]>('/contabilidad/factordecambio').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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
      formapagoId: [null as number | null],
      bodegaId: [null as number | null],
      cajaId: [null as number | null],
      gestorId: [null as number | null],
      factordecambio: [0],
      tarjetacreditoId: [null as number | null],
      nrotarjeta: [''],
      nroreferencia: [''],
      nrocarnet: [''],
      diascredito: [0],
      fechavencimiento: [null as Date | null],
      sn_excenta: ['N'],
       snNombreOptions: ['N'],
      efectivo_recibido: [0],
    });
  }

  private cargarOpciones() {
    this.api.get<any>('/cxc/clientes').pipe(takeUntilDestroyed(this.destroyRef)).subscribe((res) => {
      this.clientesArray = res?.data ?? [];
      this.onTipoFacturaChange();
      this.clientes.set(
        this.clientesArray.map((c) => ({
          label: `${c.nrocliente ?? ''} - ${c.nombres ?? ''} ${c.apellidos ?? ''}`.trim(),
          value: c.clienteId,
        })),
      );
    });
    this.api.get<any[]>('/parametros/formas-pago').pipe(takeUntilDestroyed(this.destroyRef)).subscribe((items) => {
      this.formaspago.set((items ?? []).map((i) => ({ label: i.descripcion, value: i.formapagoId })));
      this.inicializarPagos();
    });
    this.api.get<any[]>('/parametros/tarjetas-credito').pipe(takeUntilDestroyed(this.destroyRef)).subscribe((items) => {
      this.tarjetas.set((items ?? []).map((i) => ({ label: i.descripcion, value: i.tarjetacreditoId })));
    });
    this.api.get<any[]>('/inventario/existencias').pipe(takeUntilDestroyed(this.destroyRef)).subscribe((items) => {
      const m = new Map<number, number>();
      for (const e of items ?? []) {
        const id = Number(e.productoId);
        m.set(id, (m.get(id) ?? 0) + Number(e.existencia ?? 0));
      }
      this.existenciasMap = m;

      this.api.get<any[]>('/inventario/productos').pipe(takeUntilDestroyed(this.destroyRef)).subscribe((prods) => {
        this.productosArray = ((prods ?? []) as Producto[]).filter((p) => m.has(Number(p.produtoId)));
        this.filtrarProductos();
      });
    });
    this.api.get<any[]>('/inventario/productos-img').pipe(takeUntilDestroyed(this.destroyRef)).subscribe((items) => {
      const m = new Map<number, string>();
      for (const i of items ?? []) {
        const id = Number(i.productoId);
        if (i.sn_activo === 'S' && i.img && !m.has(id)) {
          m.set(id, this.resolverImagen(i.img));
        }
      }
      this.imagenesMap = m;
    });
    this.api.get<any>('/facturacion/descuentos').pipe(takeUntilDestroyed(this.destroyRef)).subscribe((res) => {
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
      this.descuentos.set(items
        .filter((d: any) => d.sn_activo === 'S')
        .map((d: any) => ({ label: d.descripcion, value: d.descuentoId })));
    });

    // Cargar ofertas/promociones vigentes
    this.api.get<any>('/facturacion/combos-ofertas').pipe(takeUntilDestroyed(this.destroyRef)).subscribe((res) => {
      const ofertas = res?.value ?? res ?? [];
      this.ofertasMap.clear();
      for (const o of (Array.isArray(ofertas) ? ofertas : [])) {
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
  getOferta(productoId: number | null): { porcentaje: number; precioConDescuento: number; desc: string } | null {
    return productoId ? this.ofertasMap.get(productoId) ?? null : null;
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
      });
    }
  }

  private getClienteTienda(): any | null {
    return this.clientesArray.find((c: any) => (c.nrocliente ?? '').toUpperCase() === 'TIENDA') ?? null;
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
    } else {
      this.form.patchValue({ clienteId: null, nrocliente: '' });
      this.nombreClienteManual.set('');
    }
  }

  esContado(): boolean {
    return this.form.get('tipofactura')?.value === 'E';
  }

  onImgHover(url: string, event: MouseEvent) {
    this.zoomUrl.set(url);
    this.zoomX.set(event.clientX + 12);
    this.zoomY.set(event.clientY - 100);
    this.zoomVisible.set(true);
  }

  onImgMove(event: MouseEvent) {
    this.zoomX.set(event.clientX + 12);
    this.zoomY.set(event.clientY - 100);
  }

  onImgLeave() {
    this.zoomVisible.set(false);
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
        this.dialogPagos.set(true);
        break;
      case '7':
        event.preventDefault();
        if (this.esContado()) {
          this.dialogPagos.set(true);
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
      this.msgs.add({ severity: 'warn', summary: 'Suspender', detail: 'No hay artículos para suspender' });
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
      nrocarnet: raw.nrocarnet,
      filas: filas.map(f => ({ ...f })),
      totales: { ...this.totales() },
    };
    const suspendidas = this.leerVentasSuspendidas();
    suspendidas.push(venta);
    localStorage.setItem('ventasSuspendidas', JSON.stringify(suspendidas));
    this.ventasSuspendidas.set(suspendidas);
    this.msgs.add({ severity: 'success', summary: 'Venta suspendida', detail: `Venta con ${filas.length} artículo(s) guardada` });
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
      nrocarnet: venta.nrocarnet ?? '',
    });
    this.nombreClienteManual.set(venta.nombreClienteManual ?? '');
    this.filas.set((venta.filas ?? []).map((f: any) => ({ ...f })));
    this.contadorFila = Math.max(0, ...this.filas().map(f => f.fila));
    this.recalcularTotales();

    const suspendidas = this.leerVentasSuspendidas().filter(s => s.id !== venta.id);
    localStorage.setItem('ventasSuspendidas', JSON.stringify(suspendidas));
    this.ventasSuspendidas.set(suspendidas);
    this.dialogSuspendidas.set(false);
    this.msgs.add({ severity: 'success', summary: 'Venta restaurada', detail: 'Venta suspendida cargada' });
  }

  eliminarVentaSuspendida(venta: any) {
    const suspendidas = this.leerVentasSuspendidas().filter(s => s.id !== venta.id);
    localStorage.setItem('ventasSuspendidas', JSON.stringify(suspendidas));
    this.ventasSuspendidas.set(suspendidas);
  }

  onBuscarProducto(event: Event) {
    const texto = (event.target as HTMLInputElement).value ?? '';
    this.qProducto.set(texto);

    if (texto.length >= 13) {
      this.api.get<any>(`/inventario/productos/buscar`, { q: texto.trim() })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (res) => {
            const items = Array.isArray(res) ? res : (res?.value ?? []);
            const producto = items.find(
              (p: any) => (p.codbarra ?? '').trim().startsWith(texto.trim()),
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
      importe: 0,
      nroreferencia: '',
    }));
    this.pagos.set(pagosInit);
  }

  agregarPago() {
    this.pagos.update((p) => [
      ...p,
      { formapagoId: null, tarjetacreditoId: null, nrotarjeta: '', nroautorizacion: '', importe: 0, nroreferencia: '' },
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
      row.impuesto = exenta ? 0 : Math.round(((subConImp * this.tasaImpuesto) / (1 + this.tasaImpuesto)) * 100) / 100;
      row.subTotal = Math.round(subConImp * 100) / 100;
    } else {
      row.impuesto = exenta ? 0 : Math.round(brutoDesc * this.tasaImpuesto * 100) / 100;
      row.subTotal = Math.round((brutoDesc + row.impuesto) * 100) / 100;
    }

    this.filas.update((f) => [...f]);
    this.recalcularTotales();
  }

  recalcularExenta() {
    const exenta = this.form.get('sn_excenta')?.value === 'S';
    const ctrl = this.form.get('nrocarnet')!;
    if (exenta) {
      ctrl.setValidators([Validators.required]);
    } else {
      ctrl.clearValidators();
      ctrl.setValue('');
    }
    ctrl.updateValueAndValidity();
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
    for (const r of this.filas()) {
      bruto += (r.cantidad ?? 0) * (r.precioventa ?? 0);
      descuento += (r.cantidad ?? 0) * (r.precioventa ?? 0) * ((r.descuento ?? 0) / 100);
      impuesto += r.impuesto ?? 0;
    }
    const total = bruto - descuento + impuesto;
    const efectivo = this.form?.get('efectivo_recibido')?.value ?? 0;
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
    this.onTipoFacturaChange();
    this.recalcularTotales();
  }

  facturar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.msgs.add({ severity: 'warn', summary: 'Validación', detail: 'Complete los campos obligatorios de la factura' });
      return;
    }
    const filas = this.filas();
    if (filas.length === 0) {
      this.msgs.add({ severity: 'warn', summary: 'Validación', detail: 'Agregue al menos un artículo' });
      return;
    }

    const raw = this.form.getRawValue();
    const t = this.totales();
    const esCredito = raw.tipofactura === 'C';

    if (!esCredito) {
      if (raw.snNombreOptions === 'S' && !this.nombreClienteManual()?.trim()) {
        this.msgs.add({ severity: 'warn', summary: 'Validación', detail: 'Ingrese el nombre del cliente' });
        return;
      }
      const pagos = this.pagosConImporte();
      if (pagos.length === 0) {
        this.msgs.add({ severity: 'warn', summary: 'Validación', detail: 'Ingrese al menos una forma de pago con importe' });
        return;
      }
      for (const p of pagos) {
        if (this.esTarjeta(p)) {
          if (!p.nrotarjeta?.trim()) {
            this.msgs.add({ severity: 'warn', summary: 'Validación', detail: 'Ingrese el número de tarjeta de crédito' });
            return;
          }
          if (p.nrotarjeta.replace(/\D/g, '').length < 13) {
            this.msgs.add({ severity: 'warn', summary: 'Validación', detail: 'El número de tarjeta debe tener al menos 13 dígitos' });
            return;
          }
          if (!this.validarLuhn(p.nrotarjeta)) {
            this.msgs.add({ severity: 'warn', summary: 'Validación', detail: 'El número de tarjeta no es válido' });
            return;
          }
          if (!p.nroautorizacion?.trim()) {
            this.msgs.add({ severity: 'warn', summary: 'Validación', detail: 'Ingrese el número de autorización de la tarjeta' });
            return;
          }
        }
        if (this.esTransferencia(p) && !p.nroautorizacion?.trim()) {
          this.msgs.add({ severity: 'warn', summary: 'Validación', detail: 'Ingrese el número de autorización de la transferencia' });
          return;
        }
      }
      const totalPagos = this.totalPagos();
      if (totalPagos < t.total) {
        this.msgs.add({ severity: 'error', summary: 'Validación', detail: `Factura de contado debe ser pagada en su totalidad. Falta por pagar: ${this.moneda(t.total - totalPagos)}` });
        return;
      }
    }

    const clienteArr = this.clientesArray.find((c) => c.clienteId === raw.clienteId);
    const nombreCliente = (raw.tipofactura === 'E' && raw.snNombreOptions === 'S')
      ? this.nombreClienteManual()
      : (clienteArr ? `${clienteArr.nombres ?? ''} ${clienteArr.apellidos ?? ''}`.trim() : null);

    const mae = {
      tipofactura: raw.tipofactura,
      clienteId: raw.clienteId,
      nrocliente: raw.nrocliente,
      nombrecliente: nombreCliente,
      direccion: raw.direccion || null,
      factordecambio: raw.factordecambio ?? 0,
      subTotal: t.subTotal,
      impuesto: t.impuesto,
      descuento: t.descuento,
      total: t.total,
      efectivo_recibido: esCredito ? 0 : this.totalPagos(),
      importe_cambio: esCredito ? 0 : Math.round(this.cambioTotal() * 100) / 100,
      diascredito: raw.diascredito ?? 0,
      fechavencimiento: raw.fechavencimiento ? new Date(raw.fechavencimiento).toISOString() : null,
      bodegaId: raw.bodegaId,
      cajaId: raw.cajaId,
      gestorId: raw.gestorId || null,
      sn_excenta: raw.sn_excenta,
      nrocarnet: raw.nrocarnet || null,
      sn_pagada: esCredito ? 'N' : 'S',
      sn_anulada: 'N',
      sn_contabilizada: 'N',
    };

    this.guardando.set(true);
    this.service.createMae<any>('/facturacion/facturas', mae).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (fac) => {
        // Alerta si el rango CAI está por agotarse
        if (fac.alerta) {
          this.msgs.add({ severity: 'warn', summary: 'CAI — Autorización próxima a caducar', detail: fac.alerta, life: 10000 });
        }

        const detOps = filas.map((r, i) => {
            const pDescuento = r.descuento ?? 0;  // Porcentaje de descuento
            const cant = r.cantidad ?? 0;
            const precio = r.precioventa ?? 0;
            const descuentoMonto = Math.round(cant * precio * (pDescuento / 100) * 100) / 100;  // Monto calculado
            return this.service.createDet<any>('/facturacion/facturas-det', {
              facturaId: fac.facturaId,
              bodegaId: raw.bodegaId,
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
        forkJoin(detOps).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => {
            if (esCredito) {
              this.procesarKardexYFinalizar(fac, `Factura de crédito #${fac.nrofactura} creada`);
            } else {
              this.guardarPagosYFinalizar(fac, raw);
            }
          },
          error: (err) => {
            this.guardando.set(false);
            console.error('Error al guardar detalle de factura', err);
            this.msgs.add({ severity: 'error', summary: 'Error', detail: 'La factura se creó pero falló el detalle' });
          },
        });
      },
      error: (err) => {
        this.guardando.set(false);
        console.error('Error al guardar factura', err);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la factura' });
      },
    });
  }

  private guardarPagosYFinalizar(fac: any, raw: any) {
    const pagosList = this.pagosConImporte();
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
      forkJoin(pagoOps).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.procesarKardexYFinalizar(fac, `Factura #${fac.nrofactura} creada con ${pagosList.length} pago(s)`);
        },
        error: (err) => {
          this.guardando.set(false);
          console.error('Error al guardar formas de pago', err);
          this.msgs.add({ severity: 'warn', summary: 'Advertencia', detail: `Factura #${fac.nrofactura} creada, pero falló el registro de pagos` });
          this.nueva();
        },
      });
    } else {
      this.procesarKardexYFinalizar(fac, `Factura #${fac.nrofactura} creada`);
    }
  }

  private procesarKardexYFinalizar(fac: any, mensajeExito: string) {
    this.api.post<any>(`/facturacion/facturas/${fac.facturaId}/procesar-kardex`, {}).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.guardando.set(false);
        this.msgs.add({ severity: 'success', summary: 'Guardado', detail: mensajeExito });
        if (this.snImprimeFactura) {
          this.imprimirTicket(fac.facturaId);
        }
        this.nueva();
      },
      error: () => {
        this.guardando.set(false);
        this.msgs.add({ severity: 'warn', summary: 'Advertencia', detail: `Factura #${fac.nrofactura} creada, pero falló el registro de kardex` });
        this.nueva();
      },
    });
  }

  moneda(n: number | undefined): string {
    return (n ?? 0).toLocaleString('es-HN', { style: 'currency', currency: 'HNL' });
  }

  num(n: any): number {
    return Number(n) || 0;
  }

  private imprimirTicket(facturaId: number) {
    this.api.get<any>(`/facturacion/facturas/${facturaId}/ticket`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => this.abrirTicket(data),
        error: () => {
          this.msgs.add({ severity: 'warn', summary: 'Impresión', detail: 'No se pudieron cargar los datos del ticket' });
        },
      });
  }

  private abrirTicket(data: any) {
    const { factura: fac, detalles, pagos, empresa, correlativo } = data;
    const fecha = new Date(fac.fecharegistro).toLocaleDateString('es-HN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const hora = new Date(fac.fecharegistro).toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' });
    const condicion = fac.tipofactura === 'C' ? 'CRÉDITO' : 'CONTADO';
    const nroFactura = String(fac.nrofactura).padStart(8, '0');
    // Formatear número con prefijo del rango: 000-001-01-00120004
    let nroFacturaFmt = nroFactura;
    if (correlativo?.rangoDesde) {
      const partes = correlativo.rangoDesde.split('-');
      if (partes.length > 1) {
        const prefijo = partes.slice(0, -1).join('-') + '-';
        nroFacturaFmt = prefijo + nroFactura;
      }
    }

    const lineasHtml = (detalles || []).map((d: any) => {
      const desc = d.descripcion || `#${d.productoId}`;
      const cod = d.codbarra || '';
      const cant = Number(d.cantidad);
      const precio = Number(d.precioventa);
      const tot = Number(d.subTotal) || (cant * precio);
      const descuento = Number(d.descuento) || 0;
      const pDescuento = Number(d.p_descuento) || 0;
      const descLinea = pDescuento > 0 ? `<div class="linea-desc">Desc: -${Number(pDescuento.toFixed(0))}%</div>` : `<div class="linea-desc">Desc: 0%</div>`;
      return `<div class="linea-item"><div class="linea-desc">${desc}</div>${cod ? `<div class="linea-cod">Cod. ${cod}</div>` : ''}${descLinea}<div class="linea"><span>Cant. ${cant}</span><span>${this.formatNum(precio)}</span><span class="right">${this.formatNum(tot)}</span></div></div>`;
    }).join('');

    const pagosHtml = (pagos || []).filter((p: any) => Number(p.importe_otros) > 0 || Number(p.importe_efectivo) > 0).map((p: any) => {
      const importe = Number(p.importe_otros) || Number(p.importe_efectivo) || 0;
      const formaPago = this.formaspago().find((f) => f.value === p.formapagoId);
      let desc = formaPago?.label || `Pago #${p.formapagoId}`;

      if (desc.toLowerCase().includes('tarjeta') && p.nrotarjeta) {
        const last4 = p.nrotarjeta.toString().slice(-4);
        desc += ` ****${last4}`;
      }

      if (p.nroautorizacion) {
        desc += ` Aut: ${p.nroautorizacion}`;
      }

      return `<div class="linea"><span>${desc}</span><span class="right">${this.formatNum(importe)}</span></div>`;
    }).join('');

    const subtotal = Number(fac.subTotal) || 0;
    const impuesto = Number(fac.impuesto) || 0;
    const descuento = Number(fac.descuento) || 0;
    const total = Number(fac.total) || 0;
    const efectivo = Number(fac.efectivo_recibido) || 0;
    const cambio = Number(fac.importe_cambio) || 0;

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Factura ${nroFacturaFmt}</title>
<style>
  @page { size: 80mm auto; margin: 2mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Courier New', Courier, monospace; font-size: 11px; width: 76mm; color: #000; }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .linea { display: flex; justify-content: space-between; padding: 1px 0; }
  .linea-item { margin-bottom: 4px; padding-bottom: 4px; }
  .linea-desc { font-size: 9px; }
  .linea-cod { font-size: 7px; color: #555; }
  .right { text-align: right; }
  .sep { border-top: 1px dashed #000; margin: 3px 0; }
  .header { text-align: center; margin-bottom: 4px; }
  .header .nombre { font-size: 14px; font-weight: bold; }
  .header .info { font-size: 9px; }
  .factura-info { margin: 4px 0; }
  .factura-info .row { display: flex; justify-content: space-between; }
  .items { margin: 4px 0; }
  .totales { margin: 4px 0; }
  .footer { text-align: center; margin-top: 6px; font-size: 9px; }
</style>
</head>
<body>
  <div class="header">
    <div class="nombre">${empresa.nombre}</div>
    ${empresa.rtn ? `<div class="info">RTN: ${empresa.rtn}</div>` : ''}
    ${empresa.direccion ? `<div class="info">${empresa.direccion}</div>` : ''}
    ${empresa.telefono ? `<div class="info">Tel: ${empresa.telefono}</div>` : ''}
  </div>

  <div class="sep"></div>

  <div class="factura-info">
    <div class="row bold"><span>FACTURA # ${nroFacturaFmt}</span></div>
    <div class="row"><span>Fecha:</span><span>${fecha} ${hora}</span></div>
    <div class="row"><span>Cliente:</span><span>${(fac.nombrecliente || 'N/A').substring(0, 25)}</span></div>
    <div class="row"><span>Condición:</span><span>${condicion}</span></div>
    ${fac.direccion ? `<div class="row"><span>Dir:</span><span>${fac.direccion.substring(0, 25)}</span></div>` : ''}
  </div>

  ${correlativo ? `
  <div class="sep"></div>
  <div class="cai-info">
    <div class="center bold" style="font-size: 8px;">RANGO AUTORIZADO</div>
    <div style="font-size: 8px; text-align: center;">del ${correlativo.rangoDesde}</div>
    <div style="font-size: 8px; text-align: center;">al ${correlativo.rangoHasta}</div>
    <div class="center bold" style="font-size: 8px; margin-top: 2px;">CODIGO CAI</div>
    <div class="center" style="font-size: 7px; letter-spacing: 0.5px;">${correlativo.cai}</div>
  </div>
  ` : ''}

  <div class="sep"></div>

  <div class="items">
    <div class="linea bold"><span>ARTICULO</span><span>P.U.</span><span>TOTAL</span></div>
    ${lineasHtml}
  </div>

  <div class="sep"></div>

  <div class="totales">
    <div class="linea"><span>Subtotal:</span><span class="right">${this.formatNum(subtotal)}</span></div>
    ${descuento > 0 ? `<div class="linea"><span>Descuento:</span><span class="right">-${this.formatNum(descuento)}</span></div>` : ''}
    ${impuesto > 0 ? `<div class="linea"><span>ISV 15%:</span><span class="right">${this.formatNum(impuesto)}</span></div>` : ''}
    <div class="linea bold"><span>TOTAL:</span><span class="right">${this.formatNum(total)}</span></div>
  </div>

  <div class="sep"></div>

  ${pagosHtml ? `<div>${pagosHtml}</div><div class="sep"></div>` : ''}
  ${efectivo > 0 ? `<div class="linea"><span>Efectivo:</span><span class="right">${this.formatNum(efectivo)}</span></div>` : ''}
  ${cambio > 0 ? `<div class="linea"><span>Cambio:</span><span class="right">${this.formatNum(cambio)}</span></div>` : ''}

  <div class="footer">
    ${empresa.mensajeDevolucion ? `<div>${empresa.mensajeDevolucion}</div>` : ''}
    ${empresa.mensajeFactura ? `<div>${empresa.mensajeFactura}</div>` : ''}
    <div>Gracias por su compra</div>
  </div>
</body>
</html>`;

    const ventana = window.open('', '_blank', 'width=320,height=600');
    if (ventana) {
      ventana.document.write(html);
      ventana.document.close();
      ventana.focus();
      setTimeout(() => ventana.print(), 300);
    }
  }

  private formatNum(n: number): string {
    return n.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
