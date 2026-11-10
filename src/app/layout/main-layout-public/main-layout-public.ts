import { Component, DestroyRef, inject, signal, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { Popover } from 'primeng/popover';
import { DialogModule } from 'primeng/dialog';
import { PasswordModule } from 'primeng/password';
import { ConfirmationService, MessageService } from 'primeng/api';
import { QuickNavService } from '../../core/services/quick-nav.service';
import { TiendaService } from '../../features/facturacion/tienda/tienda.service';
import { ApiService } from '../../core/services/api.service';
import { ProductoTienda } from '../../core/models/tienda.models';
import { DrawerModule } from 'primeng/drawer';
import { QuickNav } from '../quick-nav/quick-nav';
import { SidebarDrilldownComponent } from '../sidebar-drilldown/sidebar-drilldown';
import { LoginDialog } from '../login-dialog/login-dialog';
import { RegistroDialog } from '../registro-dialog/registro-dialog';
import { OverlayBadgeModule } from 'primeng/overlaybadge';
import { CarritoStateService } from '../../core/services/carrito-state.service';
import { AvatarModule } from 'primeng/avatar';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-main-layout-public',
  standalone: true,
  imports: [
    RouterOutlet,
    FormsModule,
    ButtonModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
    AutoCompleteModule,
    DrawerModule,
    SidebarDrilldownComponent,
    QuickNav,
    LoginDialog,
    RegistroDialog,
    OverlayBadgeModule,
    AvatarModule,
    Popover,
    DialogModule,
    PasswordModule,
  ],
  templateUrl: './main-layout-public.html',
  styleUrl: './main-layout-public.scss',
})
export class MainLayoutPublic {
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private tiendaService = inject(TiendaService);
  private auth = inject(AuthService);
  private confirm = inject(ConfirmationService);
  private msgs = inject(MessageService);
  private api = inject(ApiService);
  readonly quickNav = inject(QuickNavService);
  readonly carritoState = inject(CarritoStateService);

  /** Menú de usuario del topbar (p-popover) */
  @ViewChild('popUsuario') popUsuario?: Popover;
  /** Diálogo de login (template ref #loginDlg) */
  @ViewChild('loginDlg') loginDlg?: LoginDialog;
  /** Diálogo de registro (template ref #registroDlg) */
  @ViewChild('registroDlg') registroDlg?: RegistroDialog;

  /** true si hay sesión activa (define el contenido del popover) */
  readonly usuario = this.auth.currentUser;

  /** true si la sesión activa es de un cliente (mismo criterio que authGuard) */
  readonly esCliente = (): boolean => {
    const u = this.usuario();
    return u != null && (u.tipoPersona === 'C' || u.sn_cliente === 'S');
  };

  /** Drawer de Departamentos (reemplaza al sidebar) */
  readonly menuVisible = signal(false);

  /** true si el viewport es móvil (≤768px) — decide si el drawer es modal (overlay) o empuja el contenido */
  readonly esMobile = signal(
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 768px)').matches : false,
  );

  // ==================== Buscador de productos en el topbar ====================

  /** Texto tipeado en el buscador del topbar */
  busquedaTopbar = signal('');
  /** Sugerencias mostradas en el dropdown (mismo filtrado que tienda-virtual) */
  sugerenciasTopbar = signal<ProductoTienda[]>([]);
  /** Catálogo de productos — se carga de forma perezosa en el primer tipeo */
  private productosTopbar = signal<ProductoTienda[]>([]);
  /** true mientras se carga el catálogo (evita requests duplicados) */
  private catalogoCargando = false;
  /** true cuando el catálogo ya se cargó al menos una vez */
  private catalogoListo = false;
  /** true si se presionó Enter y aún no se resolvió por onSelect (fallback a texto libre) */
  private enterPendiente = false;

  /**
   * Filtra productos por descripción/código de barra (misma lógica que
   * `tienda-virtual.filterProductos`). En la primera llamada carga el
   * catálogo reusando el caché de TiendaService (TTL 1 min + localStorage).
   */
  filterProductos(event: { query: string }) {
    if (!this.catalogoListo && !this.catalogoCargando) {
      this.catalogoCargando = true;
      this.tiendaService
        .getProductos(false, 'tienda')
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data) => {
            this.productosTopbar.set(data);
            this.catalogoListo = true;
            this.catalogoCargando = false;
            this.aplicarFiltroTopbar(event);
          },
          error: () => {
            this.catalogoCargando = false;
            this.sugerenciasTopbar.set([]);
          },
        });
      return;
    }
    this.aplicarFiltroTopbar(event);
  }

  private aplicarFiltroTopbar(event: { query: string }) {
    const query = (event.query || '').toLowerCase().trim();
    const lista = this.productosTopbar();
    if (!query) {
      this.sugerenciasTopbar.set(lista.slice(0, 10));
      return;
    }
    const filtrados = lista.filter(
      (p) =>
        p.descripcion?.toLowerCase().includes(query) ||
        p.codbarra?.toLowerCase().includes(query),
    );
    this.sugerenciasTopbar.set(filtrados.slice(0, 10));
  }

  /**
   * Enter en el buscador: PrimeNG emite `onInputKeydown` ANTES de procesar
   * la tecla. Si hay una opción enfocada, `onSelect` se emite
   * sincrónicamente y limpia el flag; si no, al siguiente tick navegamos
   * con el texto libre.
   */
  onTopbarKeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter' && event.key !== 'NumpadEnter') return;
    this.enterPendiente = true;
    setTimeout(() => {
      if (this.enterPendiente) {
        this.enterPendiente = false;
        this.irATienda(this.busquedaTopbar());
      }
    });
  }

  /** Selección de una sugerencia → envía el producto como parámetro de búsqueda a la tienda */
  onProductoSelect(event: any) {
    this.enterPendiente = false;
    const prod: ProductoTienda | undefined = event?.value;
    this.irATienda(prod?.descripcion || this.busquedaTopbar());
  }

  /** Sincroniza el estado del dropdown al limpiar el input */
  onTopbarClear() {
    this.sugerenciasTopbar.set([]);
    this.enterPendiente = false;
  }

  /** Navega a la tienda virtual enviando el texto en el query param `buscar` */
  private irATienda(texto: string) {
    const q = (texto || '').trim();
    if (!q) return;
    this.busquedaTopbar.set('');
    this.sugerenciasTopbar.set([]);
    this.router.navigate(['/facturacion/tienda'], { queryParams: { buscar: q } });
  }

  resolverImagenTopbar(imagen: string | null): string {
    if (!imagen) return '';
    return /^data:/i.test(imagen) ? imagen : `data:image/png;base64,${imagen}`;
  }

  formatearPrecioTopbar(precio: number | string): string {
    return `L ${Number(precio).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  // ==================== Menú de usuario (p-popover) ====================

  /** Abre/cierra el popover anclado al botón de usuario del topbar */
  alternarUsuario(event: Event) {
    this.popUsuario?.toggle(event);
  }

  /** "Iniciar sesión" (sin sesión) → abre el LoginDialog y cierra el popover */
  loginDesdePopover() {
    this.popUsuario?.hide();
    this.loginDlg?.abrir();
  }

  /** "Registrarse" (sin sesión) → abre el RegistroDialog y cierra el popover */
  registroDesdePopover() {
    this.popUsuario?.hide();
    this.registroDlg?.abrir();
  }

  /** "Pedidos" (solo clientes con sesión) → navega al CRM de pedidos */
  irAPedidosDesdePopover() {
    this.popUsuario?.hide();
    this.router.navigate(['/facturacion/pedidos-virtual']);
  }

  /** "Consultar Facturas" → navega a consulta de facturas filtradas por usuario */
  irAConsultaFacturasDesdePopover() {
    this.popUsuario?.hide();
    const usuario = this.auth.currentUser()?.usuario;
    this.router.navigate(['/facturacion/consultas'], { queryParams: { usuario } });
  }

  /** "Cerrar sesión" (con sesión) → confirmación y logout ( AuthService limpia todo) */
  cerrarSesionDesdePopover() {
    this.popUsuario?.hide();
    this.confirm.confirm({
      header: 'Cerrar sesión',
      message: '¿Estás seguro de cerrar la sesión actual?',
      icon: 'pi pi-sign-out',
      acceptLabel: 'Sí, cerrar sesión',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-text p-button-success p-button-rounded',
      rejectButtonStyleClass: 'p-button-text p-button-secondary p-button-rounded',
      accept: () => this.auth.logout(),
    });
  }

  // ==================== Cambiar Contraseña ====================

  dialogCambiarPassword: boolean = false;
  passwordNueva: string = '';
  passwordConfirm: string = '';
  cambiandoPassword: boolean = false;

  abrirCambiarPassword() {
    this.popUsuario?.hide();
    this.passwordNueva = '';
    this.passwordConfirm = '';
    this.dialogCambiarPassword = true;
  }

  get pwdLargo(): boolean {
    return this.passwordNueva.length >= 8;
  }
  get pwdMayuscula(): boolean {
    return /[A-ZÁÉÍÓÚÜÑ]/.test(this.passwordNueva);
  }
  get pwdDigito(): boolean {
    return /[0-9]/.test(this.passwordNueva);
  }
  get pwdEspecial(): boolean {
    return /[.,!@#$%^&*()=+~/?;:ñÑ]/.test(this.passwordNueva);
  }
  get pwdValida(): boolean {
    return this.pwdLargo && this.pwdMayuscula && this.pwdDigito && this.pwdEspecial;
  }

  guardarPassword() {
    const nueva = this.passwordNueva.trim();
    const confirm = this.passwordConfirm.trim();
    if (!this.pwdValida) {
      this.msgs.add({ severity: 'warn', summary: 'Contraseña no cumple requisitos', detail: 'Debe tener al menos 8 caracteres, una mayúscula, un número y un carácter especial.' });
      return;
    }
    if (nueva !== confirm) {
      this.msgs.add({ severity: 'warn', summary: 'No coinciden', detail: 'La confirmación de contraseña no coincide.' });
      return;
    }

    this.cambiandoPassword = true;
    this.api.putBase('/users/password/actualizar', { passwordNueva: nueva })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.cambiandoPassword = false;
          this.dialogCambiarPassword = false;
          this.msgs.add({ severity: 'success', summary: 'Contraseña actualizada', detail: 'Tu contraseña ha sido cambiada exitosamente' });
        },
        error: (err) => {
          this.cambiandoPassword = false;
          const msg = err.error?.message || 'No se pudo actualizar la contraseña';
          this.msgs.add({ severity: 'error', summary: 'Error', detail: msg });
        },
      });
  }

  constructor() {
    // Actualizar esMobile al redimensionar (el drawer pasa de overlay a empuje).
    // Si el drawer está abierto al cruzar el breakpoint, se cierra: PrimeNG solo
    // crea/destruye la máscara en show()/hide() según `modal` vigente y cambiarlo
    // con el drawer abierto dejaría una máscara huérfana tapando la pantalla.
    if (typeof window !== 'undefined') {
      const mq = window.matchMedia('(max-width: 768px)');
      const onMqChange = (e: MediaQueryListEvent) => {
        const aplicar = () => this.esMobile.set(e.matches);
        if (this.menuVisible()) {
          // Cerrar primero y diferir el cambio de `modal` hasta que PrimeNG
          // termine la animación de cierre (onAfterLeave → hide()): si `modal`
          // cambia a false con la máscara aún presente, hide() omite
          // disableModality() y la máscara queda huérfana tapando la pantalla.
          this.menuVisible.set(false);
          window.setTimeout(aplicar, 500);
        } else if (document.querySelector('.p-drawer-mask')) {
          // El drawer se está cerrando aún (animación de salida en curso):
          // esperar a que se limpie la máscara antes de cambiar `modal`.
          window.setTimeout(aplicar, 500);
        } else {
          aplicar();
        }
      };
      mq.addEventListener('change', onMqChange);
      this.destroyRef.onDestroy(() => mq.removeEventListener('change', onMqChange));
    }

    // Al navegar (ej. elegir categoría), cerrar el drawer en móvil
    this.router.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      if (event instanceof NavigationEnd && window.innerWidth <= 768) {
        this.menuVisible.set(false);
      }
    });
  }
}
