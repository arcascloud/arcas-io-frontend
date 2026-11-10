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
import { PosRapidoService } from './pos-rapido.service';
import { PosRapidoState } from './pos-rapido.state';
import type { AvisoPos, TarjetaProducto } from './pos-rapido.models';
import {
  TARJETAS_POR_PAGINA,
  esEscaneo,
  filtrarCatalogo,
  moneda,
} from './pos-rapido.utils';

/**
 * POS visual — patrón "escáner fijo arriba, catálogo abajo".
 *
 * Regla de oro: el input del lector de código de barras vive en el header y
 * NUNCA se desmonta. El carrito se muestra en un `p-drawer` lateral (lógica
 * tienda-virtual: auto-abre con el primer ítem) y el pie fijo mantiene los
 * totales + resumen de pago siempre visibles.
 *
 * El cobro (datos de factura + formas de pago) vive en la pantalla 2:
 * `/facturacion/pos-rapido/pagar` (componente `PosPagar`).
 * El estado compartido está en `PosRapidoState`.
 */
@Component({
  selector: 'app-pos-rapido',
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
  templateUrl: './pos-rapido.html',
  styleUrl: './pos-rapido.scss',
})
export class PosRapido implements OnInit {
  readonly state = inject(PosRapidoState);
  private posService = inject(PosRapidoService);
  private router = inject(Router);
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
  /** Feedback visual verde en la barra del escáner al agregar un producto */
  scanOk = signal(false);
  /** p-drawer del carrito — auto-abre con el primer ítem, badge lo alterna */
  drawerAbierto = signal(false);
  dialogAtajos = signal(false);

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

  /** Catálogo de atajos (ALT + 9) */
  readonly atajos = [
    { tecla: 'ESC', accion: 'Limpiar búsqueda / cerrar carrito' },
    { tecla: 'ALT + 1', accion: 'Enfocar el lector de código' },
    { tecla: 'ALT + 2', accion: 'Abrir / cerrar el carrito' },
    { tecla: 'ALT + 3', accion: 'Ir a pagar' },
    { tecla: 'ALT + 4', accion: 'Vaciar el carrito' },
    { tecla: 'ALT + 9', accion: 'Ver ventana de atajos' },
  ];

  constructor() {
    // El lector queda armado apenas se pinta la pantalla
    afterNextRender(() => this.enfocarEscaner());
  }

  ngOnInit(): void {
    this.state.cargarContexto();
    this.cargarCatalogo();
    // Regreso desde la pantalla 2 con artículos → el carrito queda visible
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

  // ═══════════════════════════════════════════════════════════════════
  // ESCÁNER — el input del header es el único punto de entrada de texto
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Cada tecla del lector (o del cajero) pasa por aquí.
   * Mientras haya texto, el catálogo se filtra; al completarse un código
   * se agrega el producto al carrito.
   */
  onEscanear(event: Event): void {
    const texto = (event.target as HTMLInputElement).value ?? '';
    this.consulta.set(texto);
    this.limite.set(TARJETAS_POR_PAGINA);

    if (esEscaneo(texto)) {
      this.agregarPorCodigo(texto);
    }
  }

  onEnterEscaner(event: Event): void {
    const texto = ((event.target as HTMLInputElement).value ?? '').trim();
    if (!texto) return;

    // Enter con un único resultado filtrado = agregarlo
    const filtrados = this.catalogoFiltrado();
    if (filtrados.length === 1) {
      this.agregar(filtrados[0]);
      return;
    }
    if (/^\d+$/.test(texto)) {
      this.agregarPorCodigo(texto);
    }
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

    // Código fuera del catálogo cargado → se pregunta al backend
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

  /** Convierte una fila cruda del backend en tarjeta de catálogo */
  private desdeApi(p: any): TarjetaProducto {
    const productoId = Number(p?.produtoId ?? p?.productoId) || 0;
    const enCatalogo = this.catalogo().find((c) => c.productoId === productoId);
    if (enCatalogo) return enCatalogo;

    const existencia = Number(p?.existencia) || 0;
    const stockMinimo = Number(p?.stockMinimo) || 0;
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
      estado: existencia <= 0 ? 'AGOTADO' : existencia <= stockMinimo ? 'BAJO' : 'ALTA',
    };
  }

  // ═══════════════════════════════════════════════════════════════════
  // CARRITO — la lógica vive en PosRapidoState; aquí solo la interacción
  // ═══════════════════════════════════════════════════════════════════

  agregar(producto: TarjetaProducto): void {
    const vacioAntes = this.state.filas().length === 0;
    const resultado = this.state.agregarProducto(producto);

    switch (resultado) {
      case 'agotado':
        this.notificar(`${producto.descripcion}: sin existencia`, 'warn');
        this.limpiarBusqueda();
        return;
      case 'max-existencia':
        this.notificar(
          `Existencia máxima: ${producto.existencia} de ${producto.descripcion}`,
          'warn',
        );
        this.limpiarBusqueda();
        return;
      case 'sin-existencia':
        this.notificar(`Sin existencia de ${producto.descripcion}`, 'warn');
        this.limpiarBusqueda();
        return;
    }

    // Primer ítem de la venta → el drawer del carrito se abre solo
    if (vacioAntes) this.drawerAbierto.set(true);

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
    if (res === 'max-existencia') {
      this.notificar(`Solo hay ${linea.existencia} de ${linea.descripcion}`, 'warn');
    }
    if (this.state.filas().length === 0) this.drawerAbierto.set(false);
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
  // PIE FIJO — totales + resumen de pago + botón Pagar
  // ═══════════════════════════════════════════════════════════════════

  /** Pasa a la pantalla 2 (datos de factura + formas de pago) */
  irAPagar(): void {

   
   if (this.state.filas().length === 0) {
      this.notificar('Agregue al menos un artículo', 'warn');
      return;
    }
    if (this.state.totales().total <= 0) {
      this.notificar('No se puede pagar: el total es L 0.00', 'warn');
      return;
    }
    this.drawerAbierto.set(false);
    this.router
      .navigate(['/facturacion/pos-rapido/pagar'])
      .then((ok) => console.log('[POS] navegación a pagar:', ok))
      .catch((err) => console.error('[POS] ERROR navegando a pagar:', err));
  }

  // ═══════════════════════════════════════════════════════════════════
  // AVISOS
  // ═══════════════════════════════════════════════════════════════════

  notificar(texto: string, tipo: 'ok' | 'warn' | 'info' = 'info'): void {
    this.aviso.set({ texto, tipo });
    if (this.avisoTimer) clearTimeout(this.avisoTimer);
    this.avisoTimer = setTimeout(() => this.aviso.set(null), 3500);
  }

  // ═══════════════════════════════════════════════════════════════════
  // ATAJOS
  // ═══════════════════════════════════════════════════════════════════

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    const el = event.target as HTMLElement;
    const tag = el?.tagName?.toLowerCase();
    const esEscaner = el === this.scanInput()?.nativeElement;
    // Otros inputs/selects no capturan; el lector SÍ (siempre tiene el foco)
    if ((tag === 'input' || tag === 'textarea' || tag === 'select') && !esEscaner) return;
    if (this.dialogAtajos()) return;
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
        this.irAPagar();
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
