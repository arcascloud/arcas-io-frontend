import {
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  OnInit,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DrawerModule } from 'primeng/drawer';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { CajaSesionService } from '../caja/caja-sesion.service';
import type { CajaSesion } from '../caja/caja-sesion.models';
import { FacturaImpresionService } from '../../../core/services/factura-impresion.service';
import { PosAsesorNoPagoService } from './pos-asesor-no.service';
import { PosAsesorNoPagoState } from './pos-asesor-no-pago.state';
import type { AvisoPos, TarjetaProducto } from './pos-asesor-no.models';
import {
  TARJETAS_POR_PAGINA,
  esEscaneo,
  filtrarCatalogo,
  moneda,
} from './pos-asesor-no-pago.utils';

/**
 * POS de asesor — emite factura SIN COBRO.
 *
 * - Asigna correlativo y guarda cabecera + detalle en `posfacmae` / `posfacdet`.
 * - Procesa kardex (rebaja existencia + movimiento de salida).
 * - NO registra formas de pago, NO genera movimiento de CxC y NO contabiliza.
 */
@Component({
  selector: 'app-pos-asesor-no-pago',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    DrawerModule,
    InputTextModule,
    SelectModule,
    TagModule,
    ToastModule,
    TooltipModule,
    TableModule,
  ],
  templateUrl: './pos-asesor-no.html',
  styleUrl: './pos-asesor-no.scss',
})
export class PosAsesorNoPago implements OnInit {
  readonly state = inject(PosAsesorNoPagoState);
  private posService = inject(PosAsesorNoPagoService);
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private cajaSesion = inject(CajaSesionService);
  private router = inject(Router);
  private impresion = inject(FacturaImpresionService);
  private msgs = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  /** Referencia al input del escáner: se reenfoca tras cada acción */
  private scanInput = viewChild<ElementRef<HTMLInputElement>>('scanInput');

  // ── Datos del backend (solo lo propio de esta pantalla) ──
  cargando = signal(true);
  catalogo = signal<TarjetaProducto[]>([]);

  // ── Interacción ──
  consulta = signal('');
  limite = signal(TARJETAS_POR_PAGINA);
  ultimoAgregado = signal<number | null>(null);
  aviso = signal<AvisoPos | null>(null);
  scanOk = signal(false);
  drawerAbierto = signal(false);
  dialogEmitir = signal(false);
  guardando = signal(false);
  dialogAtajos = signal(false);
  /** Nombre del cliente (obligatorio). El código viene del p-select oculto. */
  nombreCliente = signal('');
  /** Turno ABIERTO del usuario (R3): sin él no se puede emitir factura */
  sesionCaja = signal<CajaSesion | null>(null);
  cajaAbierta = computed(() => this.sesionCaja() !== null);

  private avisoTimer?: ReturnType<typeof setTimeout>;
  private flashTimer?: ReturnType<typeof setTimeout>;
  private scanOkTimer?: ReturnType<typeof setTimeout>;

  // ── Derivados ──
  readonly formatearMoneda = moneda;

  catalogoFiltrado = computed(() => filtrarCatalogo(this.catalogo(), this.consulta()));
  catalogoVisible = computed(() => this.catalogoFiltrado().slice(0, this.limite()));
  hayMas = computed(() => this.catalogoFiltrado().length > this.limite());
  hayFiltro = computed(() => this.consulta().trim().length > 0);
  tasaPct = computed(() => Math.round(this.state.parametros().tasa * 100));
  /** Reduce el ancho del catálogo solo mientras el carrito está visible */
  conCarrito = computed(
    () => this.drawerAbierto() && this.state.filas().length > 0 && !this.isMobile(),
  );

  readonly atajos = [
    { tecla: 'ESC', accion: 'Limpiar búsqueda / cerrar carrito' },
    { tecla: 'ALT + 1', accion: 'Enfocar el lector de código' },
    { tecla: 'ALT + 2', accion: 'Abrir / cerrar el carrito' },
    { tecla: 'ALT + 3', accion: 'Emitir factura (sin cobro)' },
    { tecla: 'ALT + 4', accion: 'Vaciar el carrito' },
    { tecla: 'ALT + 9', accion: 'Ver ventana de atajos' },
  ];

  constructor() {
    afterNextRender(() => this.enfocarEscaner());
  }

  ngOnInit(): void {
    this.state.cargarContexto();
    this.cargarSesionCaja();
    this.cargarCatalogo();
    const raw = this.state.form.getRawValue();
    this.nombreCliente.set(String(raw.nombrecliente ?? ''));
    if (this.state.filas().length > 0) this.drawerAbierto.set(true);
  }

  private cargarCatalogo(): void {
    this.cargando.set(true);
    this.posService
      .cargarCatalogo()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (catalogo) => {
          this.catalogo.set(catalogo);
          this.cargando.set(false);
        },
        error: () => {
          this.cargando.set(false);
          this.notificar('No se pudo cargar el catálogo de productos', 'warn');
        },
      });
  }

  /** Consulta el turno ABIERTO del usuario (R3). Lo revalida antes de cada emisión. */
  cargarSesionCaja(): void {
    const user = this.auth.currentUser();
    if (!user?.empresaId || !user?.usuarioId) {
      this.sesionCaja.set(null);
      return;
    }
    this.cajaSesion
      .obtenerSesionActiva(Number(user.empresaId), undefined, Number(user.usuarioId))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (sesion) => this.sesionCaja.set(sesion),
        error: () => this.sesionCaja.set(null),
      });
  }

  irACaja(): void {
    this.router.navigate(['/facturacion/caja']);
  }

  // ═══════════════════════════════════════════════════════════════════
  // ESCÁNER
  // ═══════════════════════════════════════════════════════════════════

  onEscanear(event: Event): void {
    const texto = (event.target as HTMLInputElement).value ?? '';
    this.consulta.set(texto);
    this.limite.set(TARJETAS_POR_PAGINA);
    if (esEscaneo(texto)) this.agregarPorCodigo(texto);
  }

  onEnterEscaner(event: Event): void {
    const texto = ((event.target as HTMLInputElement).value ?? '').trim();
    if (!texto) return;
    const filtrados = this.catalogoFiltrado();
    if (filtrados.length === 1) {
      this.agregar(filtrados[0]);
      return;
    }
    if (/^\d+$/.test(texto)) this.agregarPorCodigo(texto);
  }

  limpiarBusqueda(): void {
    this.consulta.set('');
    this.limite.set(TARJETAS_POR_PAGINA);
    const el = this.scanInput()?.nativeElement;
    if (el) el.value = '';
    this.enfocarEscaner();
  }

  enfocarEscaner(): void {
    const el = this.scanInput()?.nativeElement;
    if (el && document.activeElement !== el) {
      el.focus();
      el.select();
    }
  }

  verMas(): void {
    this.limite.update((n) => n + TARJETAS_POR_PAGINA);
  }

  private agregarPorCodigo(codigo: string): void {
    const buscado = codigo.trim().toLowerCase();
    const local = this.catalogo().find((p) => p.codbarra.toLowerCase() === buscado);
    if (local) {
      this.agregar(local);
      return;
    }
    this.posService
      .buscarPorCodigo(codigo)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          const encontrado =
            items.find((p) => String(p?.codbarra ?? '').trim().toLowerCase() === buscado) ?? items[0];
          if (!encontrado) {
            this.notificar(`Código ${codigo.trim()} no encontrado`, 'warn');
            this.limpiarBusqueda();
            return;
          }
          this.agregar(this.desdeApi(encontrado));
        },
        error: () => {
          this.notificar(`Código ${codigo.trim()} no encontrado`, 'warn');
          this.limpiarBusqueda();
        },
      });
  }

  private desdeApi(p: any): TarjetaProducto {
    const productoId = Number(p?.produtoId ?? p?.productoId) || 0;
    const enCatalogo = this.catalogo().find((c) => c.productoId === productoId);
    if (enCatalogo) return enCatalogo;

    const existencia = Number(p?.existencia) || 0;
    const stockMinimo = Number(p?.stockMinimo) || 0;
    const bajoDemanda = p?.sn_solicitado_bajo_demanda === 'S';
    return {
      productoId,
      codbarra: String(p?.codbarra ?? ''),
      descripcion: String(p?.descripcion ?? `Producto #${productoId}`),
      precio: Number(p?.precioventa) || 0,
      precioOriginal: null,
      ofertaPct: null,
      imagenUrl: null,
      existencia,
      stockMinimo,
      estado: existencia <= 0 ? (bajoDemanda ? 'BAJO' : 'AGOTADO') : existencia <= stockMinimo ? 'BAJO' : 'ALTA',
      sn_solicitado_bajo_demanda: bajoDemanda ? 'S' : 'N',
    };
  }

  // ═══════════════════════════════════════════════════════════════════
  // CARRITO
  // ═══════════════════════════════════════════════════════════════════

  agregar(producto: TarjetaProducto): void {
    const resultado = this.state.agregarProducto(producto);
    switch (resultado) {
      case 'agotado':
        this.notificar(`${producto.descripcion}: sin existencia`, 'warn');
        this.limpiarBusqueda();
        return;
      case 'max-existencia':
        this.notificar(`Existencia máxima: ${producto.existencia} de ${producto.descripcion}`, 'warn');
        this.limpiarBusqueda();
        return;
      case 'sin-existencia':
        this.notificar(`Sin existencia de ${producto.descripcion}`, 'warn');
        this.limpiarBusqueda();
        return;
    }

    this.drawerAbierto.set(true);
    this.ultimoAgregado.set(producto.productoId);
    if (this.flashTimer) clearTimeout(this.flashTimer);
    this.flashTimer = setTimeout(() => this.ultimoAgregado.set(null), 900);
    this.scanOk.set(true);
    if (this.scanOkTimer) clearTimeout(this.scanOkTimer);
    this.scanOkTimer = setTimeout(() => this.scanOk.set(false), 450);
    this.limpiarBusqueda();
  }

  cambiarCantidad(linea: any, cantidad: number | undefined | null): void {
    const res = this.state.cambiarCantidad(linea, cantidad);
    if (res === 'max-existencia') this.notificar(`Solo hay ${linea.existencia} de ${linea.descripcion}`, 'warn');
    this.drawerAbierto.set(this.state.filas().length > 0);
  }

  cambiarQuantity(linea: any, cantidad: number): void {
    this.cambiarCantidad(linea, cantidad);
  }

  eliminarLinea(linea: any): void {
    this.state.eliminarLinea(linea);
    if (this.state.filas().length === 0) this.drawerAbierto.set(false);
  }

  vaciarCarrito(): void {
    if (this.state.vaciarCarrito()) {
      this.notificar('Carrito vaciado', 'info');
      this.drawerAbierto.set(false);
      this.enfocarEscaner();
    }
  }

  toggleDrawer(): void {
    this.drawerAbierto.update((v) => !v);
    if (this.drawerAbierto()) return;
    this.enfocarEscaner();
  }

  // ═══════════════════════════════════════════════════════════════════
  // EMISIÓN SIN COBRO
  // ═══════════════════════════════════════════════════════════════════

  abrirEmitir(): void {
    if (!this.cajaAbierta()) {
      this.notificar('No hay sesión de caja abierta. Abra la caja en Facturación → Caja antes de emitir.', 'warn');
      return;
    }
    if (this.state.filas().length === 0) {
      this.notificar('Agregue al menos un artículo', 'warn');
      return;
    }
    if (this.state.totales().total <= 0) {
      this.notificar('No se puede emitir: el total es L 0.00', 'warn');
      return;
    }
    this.drawerAbierto.set(false);
    this.dialogEmitir.set(true);
  }

  /** Cierra el diálogo de emisión y devuelve el carrito a primer plano */
  cerrarDialogoEmitir(): void {
    this.dialogEmitir.set(false);
    if (this.state.filas().length > 0) this.drawerAbierto.set(true);
  }

  /** PrimeNG cierra con ESC o la X: restaura el carrito igual que Cancelar */
  onEmitirVisibleChange(visible: boolean): void {
    if (visible) this.dialogEmitir.set(true);
    else this.cerrarDialogoEmitir();
  }

  /** El p-select sigue vigente (código fijo de tienda), solo se oculta en el diálogo */
  onClienteSeleccionado(clienteId: number | null): void {
    this.state.form.patchValue({ clienteId }, { emitEvent: false });
    this.state.onClienteChange();
  }

  onNombreClienteChange(valor: string): void {
    const texto = String(valor ?? '');
    this.nombreCliente.set(texto);
    this.state.form.patchValue({ nombrecliente: texto }, { emitEvent: false });
  }

  emitirFactura(): void {
    if (this.guardando()) return;
    if (!this.cajaAbierta()) {
      this.notificar('Su sesión de caja ya no está abierta. Vuelva a abrir la caja antes de emitir.', 'warn');
      this.dialogEmitir.set(false);
      this.cargarSesionCaja();
      return;
    }
    const raw = this.state.form.getRawValue();
    const clienteId = Number(raw.clienteId) || 0;
    if (!clienteId) {
      this.notificar('Seleccione el cliente', 'warn');
      return;
    }
    const nombrecliente = this.nombreCliente().trim();
    if (!nombrecliente) {
      this.notificar('Ingrese el nombre del cliente', 'warn');
      return;
    }

    const totales = this.state.totales();
    const cliente = this.state.clientesArray.find((c: any) => c.clienteId === clienteId);

    const mae = {
      tipofactura: 'E',
      clienteId,
      nrocliente: raw.nrocliente || cliente?.nrocliente || '',
      nombrecliente,
      rtn_cliente: raw.rtn_cliente || cliente?.rtn || null,
      direccion: cliente?.direccion || null,
      factordecambio: raw.factordecambio ?? 0,
      subTotal: totales.bruto,
      impuesto: totales.impuesto,
      descuento: totales.descuento,
      total: totales.total,
      efectivo_recibido: 0,
      importe_cambio: 0,
      bodegaId: Number(raw.bodegaId) || 1,
      cajaId: Number(this.sesionCaja()?.cajaId) || Number(raw.cajaId) || 1,
      gestorId: raw.gestorId || null,
      sn_excenta: raw.sn_excenta || 'N',
      tipoconstancia: raw.tipoconstancia || 'FNE',
      nroconstancia: raw.nroconstancia || null,
      importe_excento: totales.importeExcento,
      sn_pagada: 'N',
      sn_anulada: 'N',
      sn_contabilizada: 'N',
      // Flag de emisión de asesor: el backend omite turno, CxC y contabilidad
      sn_solo_emision: 'S',
    };

    this.guardando.set(true);
    this.api
      .post<any>('/facturacion/facturas', mae)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (fac) => {
          const detOps = this.state.filas().map((r, i) => {
            const descPct = r.descuentoPct ?? 0;
            return this.api.post<any>('/facturacion/facturas-det', {
              facturaId: fac.facturaId,
              bodegaId: fac.bodegaId ?? raw.bodegaId,
              nrofila: i + 1,
              productoId: r.productoId,
              codbarra: r.codbarra || '',
              cantidad: r.cantidad,
              precioventa: r.precio,
              impuesto: r.impuesto ?? 0,
              subTotal: r.subTotal,
              descuento: this.state.redondear(r.cantidad * r.precio * (descPct / 100)),
              p_descuento: descPct,
              sn_anulada: 'N',
            });
          });

          forkJoin(detOps)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: () => {
                // Kardex SÍ: rebaja existencia y registra salida.
                // La contabilidad NO: `omitirContabilidad=S`.
                this.api
                  .post<any>(
                    `/facturacion/facturas/${fac.facturaId}/procesar-kardex`,
                    {},
                    undefined,
                    { omitirContabilidad: 'S' },
                  )
                  .pipe(takeUntilDestroyed(this.destroyRef))
                  .subscribe({
                    next: () => this.finalizar(fac),
                    error: () => {
                      this.guardando.set(false);
                      this.msgs.add({
                        severity: 'warn',
                        summary: 'Kardex',
                        detail: `Factura #${fac.nrofactura} emitida, pero falló el kardex`,
                      });
                      this.finalizar(fac);
                    },
                  });
              },
              error: () => {
                this.guardando.set(false);
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
          this.msgs.add({
            severity: 'error',
            summary: 'Error',
            detail: err?.error?.message ?? 'No se pudo emitir la factura',
          });
        },
      });
  }

  private finalizar(fac: any): void {
    const nrofactura = fac.nrofactura ?? fac.facturaId;
    const mensaje = `Factura #${nrofactura} emitida sin cobro`;
    if (this.state.snImprimeFactura) {
      this.imprimirTicket(fac.facturaId).finally(() => this.reiniciar(mensaje));
    } else {
      this.reiniciar(mensaje);
    }
  }

  private reiniciar(mensaje: string): void {
    this.guardando.set(false);
    this.dialogEmitir.set(false);
    this.state.limpiarVenta();
    this.nombreCliente.set('');
    this.state.form.patchValue({ nombrecliente: '' }, { emitEvent: false });
    this.notificar(mensaje, 'ok');
    this.enfocarEscaner();
  }

  private imprimirTicket(facturaId: number): Promise<void> {
    return new Promise<void>((resolve) => {
      this.api
        .get<any>(`/facturacion/facturas/${facturaId}/ticket`)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data) =>
            this.impresion
              .imprimir(data)
              .catch(() => this.notificar('No se pudo imprimir el ticket', 'warn'))
              .finally(() => resolve()),
          error: () => {
            this.notificar('No se pudieron cargar los datos del ticket', 'warn');
            resolve();
          },
        });
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // AVISOS Y ATAJOS
  // ═══════════════════════════════════════════════════════════════════

  notificar(texto: string, tipo: 'ok' | 'warn' | 'info' = 'info'): void {
    this.aviso.set({ texto, tipo });
    if (this.avisoTimer) clearTimeout(this.avisoTimer);
    this.avisoTimer = setTimeout(() => this.aviso.set(null), 3500);
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    const el = event.target as HTMLElement;
    const tag = el?.tagName?.toLowerCase();
    const esEscaner = el === this.scanInput()?.nativeElement;
    if ((tag === 'input' || tag === 'textarea' || tag === 'select') && !esEscaner) return;
    if (this.dialogAtajos() || this.dialogEmitir()) return;
    if (event.ctrlKey || event.metaKey) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      if (this.drawerAbierto()) {
        this.drawerAbierto.set(false);
        this.enfocarEscaner();
      } else if (this.hayFiltro()) {
        this.limpiarBusqueda();
      }
      return;
    }

    if (!event.altKey) return;
    switch (event.key) {
      case '1':
        event.preventDefault();
        this.limpiarBusqueda();
        break;
      case '2':
        event.preventDefault();
        this.toggleDrawer();
        break;
      case '3':
        event.preventDefault();
        this.abrirEmitir();
        break;
      case '4':
        event.preventDefault();
        this.vaciarCarrito();
        break;
      case '9':
        event.preventDefault();
        this.dialogAtajos.set(true);
        break;
    }
  }

  isMobile(): boolean {
    return typeof window !== 'undefined' && window.innerWidth <= 768;
  }
}
