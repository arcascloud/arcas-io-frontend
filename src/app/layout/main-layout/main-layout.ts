import { Component, DestroyRef, inject, signal, computed } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SplitButtonModule } from 'primeng/splitbutton';
import { AvatarModule } from 'primeng/avatar';
import { PanelMenuModule } from 'primeng/panelmenu';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MenuItem } from 'primeng/api';
import { AuthService } from '../../core/services/auth.service';
import { MenuConfigService } from '../../core/services/menu-config.service';
import { Drawer, DrawerModule } from 'primeng/drawer';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    ButtonModule,
    AvatarModule,
    PanelMenuModule,
    ToastModule,
    ConfirmDialogModule,
    SplitButtonModule,
    TooltipModule,
    DrawerModule,
  ],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
})
export class MainLayout {
  private auth = inject(AuthService);
  private confirm = inject(ConfirmationService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private menuConfig = inject(MenuConfigService);

  mobileSidebarOpen = signal(false);
  sidebarHidden = signal(false);
  pinned = signal(false);

  visible: boolean = false;

  constructor() {
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

  private mapItem(item: import('../../core/services/menu-config.service').MenuItemConfig): MenuItem {
    const mi: MenuItem = { label: item.label, icon: `pi pi-${item.icon}` };
    if (item.route) mi.routerLink = [item.route];
    if (item.children?.length) {
      mi.expanded = false;
      mi.items = item.children.map((c) => this.mapItem(c));
    }
    return mi;
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

  cerrarSesion() {
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
