import { Component, DestroyRef, inject, signal, computed, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SplitButtonModule } from 'primeng/splitbutton';
import { AvatarModule } from 'primeng/avatar';
import { PanelMenuModule } from 'primeng/panelmenu';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SelectButtonModule } from 'primeng/selectbutton';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { TooltipModule } from 'primeng/tooltip';
import { Popover, PopoverModule } from 'primeng/popover';
import { DialogModule } from 'primeng/dialog';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { AuthService } from '../../core/services/auth.service';
import { EmpresaBrandService } from '../../core/services/empresa-brand.service';
import { MenuConfigService } from '../../core/services/menu-config.service';
import { QuickNavService } from '../../core/services/quick-nav.service';
import { ApiService } from '../../core/services/api.service';
import { Drawer, DrawerModule } from 'primeng/drawer';
import { QuickNav } from '../quick-nav/quick-nav';
import { LoginDialog } from '../login-dialog/login-dialog';
import { RegistroDialog } from '../registro-dialog/registro-dialog';

interface Opcion {
  label: string;
  value: any;
}


@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    FormsModule,
    ButtonModule,
    AvatarModule,
    PanelMenuModule,
    ToastModule,
    ConfirmDialogModule,
    SplitButtonModule,
    SelectButtonModule,
    CheckboxModule,
    InputTextModule,
    PasswordModule,
    TooltipModule,
    DrawerModule,
    PopoverModule,
    DialogModule,
    QuickNav,
    LoginDialog,
    RegistroDialog,
  ],
  templateUrl: './main-layout-private.html',
  styleUrl: './main-layout-private.scss',
})
export class MainPrivateLayout {
  private auth = inject(AuthService);
  private confirm = inject(ConfirmationService);
  private msgs = inject(MessageService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private menuConfig = inject(MenuConfigService);
  private api = inject(ApiService);
  /** Instancia del servicio de navegación rápida (botón del topbar) */
  readonly quickNav = inject(QuickNavService);
  /** Nombre de la empresa (tempresas según environment.empresaId) */
  readonly empresaNombre = inject(EmpresaBrandService).nombre;

  /** Menú de usuario del topbar (p-popover) */
  @ViewChild('popUsuario') popUsuario?: Popover;
  @ViewChild('loginDlg') loginDlg?: LoginDialog;
  @ViewChild('registroDlg') registroDlg?: RegistroDialog;

  mobileSidebarOpen = signal(false);
  sidebarHidden = signal(false);
  pinned = signal(false);

  /** Tipo de persona que identifica el usuario en el topbar: 'C' = Cliente, 'E' = Empleado */
  readonly tipoPersonaOptions: Opcion[] = [
    { label: 'Cliente', value: 'C' },
    { label: 'Empleado', value: 'E' },
  ];

  tipoPersona = signal<string>('C');

  onTipoPersonaChange(valor: string) {
    this.tipoPersona.set(valor);
  }

  visible: boolean = false;

  // ==================== Login en drawer (Cuenta) ====================

  /** Clave de localStorage para "recordar lo que indiqué el usuario" */
  private static readonly CLAVE_RECORDAR = 'drawer_login_preferencias';

  loginUsuario = signal('');
  loginPassword = signal('');
  loginLoading = signal(false);
  loginError = signal('');
  recordar = signal(false);

  /** true si la persona identificada es cliente (sincronizado con el toggle Cliente/Empleado del topbar) */
  get esCliente(): boolean {
    return this.tipoPersona() === 'C';
  }

  readonly esClienteLogueado = (): boolean => {
    const u = this.user();
    return u != null && (u.tipoPersona === 'C' || u.sn_cliente === 'S');
  };

  /** Checkbox "Es cliente": marca/desmarca y sincroniza el tipo de persona del topbar */
  onEsClienteChange(esCliente: boolean) {
    this.tipoPersona.set(esCliente ? 'C' : 'E');
    this.guardarPreferencias();
  }

  /** Checkbox "Recordar lo que indiqué": persiste o limpia la selección */
  onRecordarChange(recordar: boolean) {
    this.recordar.set(recordar);
    this.guardarPreferencias();
  }

  /** Guarda (o limpia) en localStorage el usuario + tipo de persona indicado */
  private guardarPreferencias() {
    if (this.recordar()) {
      localStorage.setItem(
        MainPrivateLayout.CLAVE_RECORDAR,
        JSON.stringify({
          usuario: this.loginUsuario(),
          tipoPersona: this.tipoPersona(),
        }),
      );
    } else {
      localStorage.removeItem(MainPrivateLayout.CLAVE_RECORDAR);
    }
  }

  /** Restaura la selección guardada al iniciar (si el usuario pidió recordar) */
  private cargarPreferencias() {
    try {
      const raw = localStorage.getItem(MainPrivateLayout.CLAVE_RECORDAR);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data?.usuario) this.loginUsuario.set(String(data.usuario));
      if (data?.tipoPersona === 'C' || data?.tipoPersona === 'E') {
        this.tipoPersona.set(data.tipoPersona);
      }
      this.recordar.set(true);
    } catch {
      // JSON inválido → se ignora y queda sin recordar
    }
  }

  /** Ingreso desde el drawer: reemplaza token/usuario de la sesión */
  login() {
    this.loginError.set('');
    const usuario = this.loginUsuario().trim();
    const password = this.loginPassword();
    if (!usuario || !password) {
      this.loginError.set('Ingrese usuario y contraseña');
      return;
    }

    this.loginLoading.set(true);
    this.auth.login(usuario, password).subscribe({
      next: (res) => {
        this.loginLoading.set(false);
        this.loginPassword.set('');
        this.loginUsuario.set(usuario);
        this.guardarPreferencias(); // si "recordar" está activo, persiste usuario + tipo
        this.visible = false;
        this.msgs.add({
          severity: 'success',
          summary: 'Sesión iniciada',
          detail: `Bienvenido ${res.usuario?.nombre || usuario}`,
        });
      },
      error: (err) => {
        this.loginLoading.set(false);
        const msg = Array.isArray(err.error?.message)
          ? err.error.message.join(', ')
          : err.error?.message || 'Credenciales incorrectas';
        this.loginError.set(msg);
      },
    });
  }

  constructor() {
    this.cargarPreferencias();
    this.destroyRef.onDestroy(() =>
      this.router.events.subscribe((event) => {
        if (event instanceof NavigationEnd && window.innerWidth <= 768) {
          this.mobileSidebarOpen.set(false);
        }
      }),
    );
  }

  readonly user = this.auth.currentUser;

  menuItems = computed<MenuItem[]>(() =>
    this.menuConfig.getMenuItems().map((item) => this.mapItem(item)),
  );

  private mapItem(
    item: import('../../core/services/menu-config.service').MenuItemConfig,
  ): MenuItem {
    const mi: MenuItem = { label: item.label, icon: this.resolverIcono(item.icon) };
    if (item.route) mi.routerLink = [item.route];
    if (item.children?.length) {
      mi.expanded = false;
      mi.items = item.children.map((c) => this.mapItem(c));
    }
    return mi;
  }

  /**
   * Resuelve el ícono del MenuItem sin romper clases completas:
   *  - `'fa-solid fa-box'` / `'pi pi-home'` (con espacio) → se usa tal cual
   *  - `'fa-box'` (solo una clase FA) → se completa con `fa-solid`
   *  - `'pi-home'` → se completa con `pi `
   *  - `'home'` (nombre corto) → `pi pi-home` (compatibilidad con el formato viejo)
   */
  private resolverIcono(icon: string): string {
    const i = (icon ?? '').trim();
    if (!i) return '';
    if (i.includes(' ')) return i;
    if (i.startsWith('fa-')) return `fa-solid ${i}`;
    if (i.startsWith('pi-')) return `pi ${i}`;
    return `pi pi-${i}`;
  }

  userMenuItems: MenuItem[] = [
    { separator: true },
    { label: 'Cerrar Sesión', icon: 'pi pi-sign-out', command: () => this.cerrarSesion() },
  ];

  toggleSidebar() {
    if (window.innerWidth <= 768) {
      this.mobileSidebarOpen.update((v) => !v);
      return;
    }
    this.sidebarHidden.update((v) => !v);
  }

  onMenuClick(event: MouseEvent) {
    if (window.innerWidth > 768) return;
    const target = event.target as HTMLElement;
    const esNavegacion = !!target.closest('a[href]');
    if (esNavegacion) {
      this.mobileSidebarOpen.set(false);
    }
  }

  togglePin() {
    this.pinned.update((v) => !v);
    if (this.pinned()) {
      this.sidebarHidden.set(false);
    }
  }

  get toggleIcon(): string {
    if (window.innerWidth <= 768) {
      return this.mobileSidebarOpen() ? 'pi pi-angle-left' : 'pi pi-bars';
    }
    return this.sidebarHidden() ? 'pi pi-angle-right' : 'pi pi-angle-left';
  }

  get initials(): string {
    const n = this.user()?.nombre || '';
    return n
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  // ==================== Menú de usuario (p-popover) ====================

  alternarUsuario(event: Event) {
    this.popUsuario?.toggle(event);
  }

  loginDesdePopover() {
    this.popUsuario?.hide();
    this.loginDlg?.abrir();
  }

  registroDesdePopover() {
    this.popUsuario?.hide();
    this.registroDlg?.abrir();
  }

  irAPedidosDesdePopover() {
    this.popUsuario?.hide();
    this.router.navigate(['/facturacion/pedidos-virtual']);
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
      this.msgs.add({
        severity: 'warn',
        summary: 'Contraseña no cumple requisitos',
        detail:
          'Debe tener al menos 8 caracteres, una mayúscula, un número y un carácter especial.',
      });
      return;
    }
    if (nueva !== confirm) {
      this.msgs.add({
        severity: 'warn',
        summary: 'No coinciden',
        detail: 'La confirmación de contraseña no coincide.',
      });
      return;
    }

    this.cambiandoPassword = true;
    this.api
      .putBase('/users/password/actualizar', { passwordNueva: nueva })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.cambiandoPassword = false;
          this.dialogCambiarPassword = false;
          this.msgs.add({
            severity: 'success',
            summary: 'Contraseña actualizada',
            detail: 'Tu contraseña ha sido cambiada exitosamente',
          });
        },
        error: (err) => {
          this.cambiandoPassword = false;
          const msg = err.error?.message || 'No se pudo actualizar la contraseña';
          this.msgs.add({ severity: 'error', summary: 'Error', detail: msg });
        },
      });
  }

  cerrarSesion() {
    this.cerrarSesionDesdePopover();
  }

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
}
