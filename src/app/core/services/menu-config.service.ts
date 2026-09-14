import { Injectable, inject, signal, effect, DestroyRef } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

/** Registro crudo que viene de tusuariomnuitem */
interface RawMnuItem {
  tusuariomnuitemsId: number;
  empresaId: number;
  moduloId: number;
  usuario: string;
  parent: number;
  parentId: number;
  levelId: number;
  nameParent: string;
  nameItem: string;
  labelItem: string;
  iconItem: string;
  routerLink: string;
  sn_activo: string;
  /** Orden del item (desde tusuariomnuitem.zorden) */
  zordenItem: number;
  /** Orden del módulo padre (desde tmodulos.zorden) */
  zordenMod: number;
}

/** Configuración de un elemento del menú lateral */
export interface MenuItemConfig {
  /** Texto visible del menú */
  label: string;
  /** Clase del ícono (Font Awesome sin prefijo 'fa-') */
  icon: string;
  /** Ruta de navegación (si tiene ruta, es un enlace directo) */
  route?: string;
  /** Roles que pueden ver este elemento (si se omite, es visible para todos) */
  roles?: string[];
  /** Submenús anidados */
  children?: MenuItemConfig[];
}

@Injectable({ providedIn: 'root' })
export class MenuConfigService {
  private auth = inject(AuthService);
  private http = inject(HttpClient);
  private destroyRef = inject(DestroyRef);

  private items = signal<MenuItemConfig[]>([]);

  constructor() {
    // effect re-actúa cuando currentUser() cambia (login/logout)
    effect(() => {
      const user = this.auth.currentUser();
      if (!user) {
        this.items.set([]);
        return;
      }
      this.cargarMenu(user.empresaId, user.usuario);
    });
  }

  private cargarMenu(empresaId: number, usuario: string) {
    const params = new HttpParams()
      .set('empresaId', empresaId)
      .set('usuario', usuario);

    this.http.get<RawMnuItem[]>(`${environment.apiUrl}/users/menu-items`, { params })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (rows) => this.items.set(this.buildTree(rows)),
        error: () => this.items.set([]),
      });
  }

  /** Construye la estructura jerárquica del menú desde filas planas de la BD */
  private buildTree(rows: RawMnuItem[]): MenuItemConfig[] {
    // Filtrar solo activos
    const activos = rows.filter((r) => r.sn_activo === 'S');

    // Mapa id → fila
    const byId = new Map<number, RawMnuItem>();
    for (const row of activos) byId.set(row.tusuariomnuitemsId, row);

    // Mapa parentId → hijos (usando parentId, NO parent que es self-reference)
    const childrenMap = new Map<number, RawMnuItem[]>();
    for (const row of activos) {
      // Si parentId === tusuariomnuitemsId, es raíz (self-reference)
      if (row.parentId === row.tusuariomnuitemsId) continue;
      if (!childrenMap.has(row.parentId)) childrenMap.set(row.parentId, []);
      childrenMap.get(row.parentId)!.push(row);
    }

    // Función recursiva para convertir una fila a MenuItemConfig
    const toConfig = (row: RawMnuItem): MenuItemConfig => {
      // El DB guarda "pi pi-xxx", mapItem agrega "pi pi-" → strip para no duplicar
      const icon = row.iconItem?.replace(/^pi pi-/, '') ?? '';
      const config: MenuItemConfig = {
        label: row.labelItem,
        icon,
      };
      if (row.routerLink) config.route = row.routerLink;

      // Buscar hijos: parentId de los hijos = tusuariomnuitemsId de este item
      const kids = childrenMap.get(row.tusuariomnuitemsId);
      if (kids && kids.length > 0) {
        kids.sort((a, b) => (a.zordenItem ?? 0) - (b.zordenItem ?? 0) || (a.zordenMod ?? 0) - (b.zordenMod ?? 0) || a.labelItem.localeCompare(b.labelItem));
        config.children = kids.map(toConfig);
      }

      return config;
    };

    // Raíz: item levelId=1 cuyo parentId = a su propio tusuariomnuitemsId
    const roots: MenuItemConfig[] = [];
    const root = activos.find((r) => r.levelId === 1 && r.parentId === r.tusuariomnuitemsId);
    if (root) {
      const kids = childrenMap.get(root.tusuariomnuitemsId);
      if (kids) {
        kids.sort((a, b) => (a.zordenItem ?? 0) - (b.zordenItem ?? 0) || (a.zordenMod ?? 0) - (b.zordenMod ?? 0) || a.labelItem.localeCompare(b.labelItem));
        for (const kid of kids) roots.push(toConfig(kid));
      }
    }

    return roots;
  }

  /** Obtiene los elementos del menú */
  getMenuItems(): MenuItemConfig[] {
    return this.items();
  }
}
