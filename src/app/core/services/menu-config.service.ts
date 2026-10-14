import { Injectable, inject, signal, effect } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService, RUTAS_CLIENTE } from './auth.service';

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
  /** Clase(s) del ícono: nombre corto PrimeIcons (`home` → `pi pi-home`) o
   *  clase completa Font Awesome (`fa-solid fa-box`) o PrimeIcons (`pi pi-home`) */
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

  private items = signal<MenuItemConfig[]>([]);
  /** Módulos (moduloId) con al menos un item de menú activo del usuario actual */
  private modulos = signal<Set<number>>(new Set());
  /** Promesa de carga del menú del usuario actual (evita carreras con el guard) */
  private promesaModulos: Promise<Set<number>> | null = null;
  private claveModulos = '';

  constructor() {
    // effect re-actúa cuando currentUser() cambia (login/logout)
    effect(() => {
      const user = this.auth.currentUser();
      if (!user) {
        this.items.set([]);
        this.modulos.set(new Set());
        this.promesaModulos = null;
        this.claveModulos = '';
        return;
      }
      this.cargarMenu(user.empresaId, user.usuario, user.tipoPersona === 'C');
    });
  }

  /**
   * Módulos permitidos del usuario actual (moduloId con items activos en
   * tusuariomnuitem). Espera la carga del menú si aún no terminó — lo usa
   * el authGuard para autorizar la ruta por módulo.
   */
  modulosPermitidos(): Promise<Set<number>> {
    const user = this.auth.currentUser();
    if (!user) return Promise.resolve(new Set<number>());
    const clave = `${user.usuario}|${user.empresaId}`;
    if (this.claveModulos === clave && this.promesaModulos) return this.promesaModulos;
    return this.cargarMenu(user.empresaId, user.usuario, user.tipoPersona === 'C');
  }

  private cargarMenu(empresaId: number, usuario: string, soloRutasCliente: boolean): Promise<Set<number>> {
    const clave = `${usuario}|${empresaId}`;
    // Ya hay una carga en curso/terminada para este usuario → reutilizar
    if (this.claveModulos === clave && this.promesaModulos) return this.promesaModulos;

    const params = new HttpParams()
      .set('empresaId', empresaId)
      .set('usuario', usuario);

    this.claveModulos = clave;
    this.promesaModulos = firstValueFrom(
      this.http.get<RawMnuItem[]>(`${environment.apiUrl}/users/menu-items`, { params }),
    )
      .then((rows) => {
        const mods = new Set<number>();
        for (const r of rows) {
          if (r.sn_activo === 'S') mods.add(r.moduloId);
        }
        const tree = this.buildTree(rows);
        this.items.set(soloRutasCliente ? this.filtrarRutasCliente(tree) : tree);
        this.modulos.set(mods);
        return mods;
      })
      .catch(() => {
        this.items.set([]);
        this.modulos.set(new Set());
        // Limpiar cache para que el próximo intento (re-login) no devuelva
        // la promesa vacía cacheada — causa del menú vacío tras token vencido.
        this.claveModulos = '';
        this.promesaModulos = null;
        return new Set<number>();
      });
    return this.promesaModulos;
  }

  /**
   * Filtra el menú para usuarios cliente (tipoPersona 'C'): conserva solo
   * los items cuya ruta esté en `RUTAS_CLIENTE`. Un contenedor sin ruta
   * permitida se conserva si algún hijo pasa el filtro (pero sin ruta
   * propia, para que solo expanda el submenú).
   */
  private filtrarRutasCliente(items: MenuItemConfig[]): MenuItemConfig[] {
    const resultado: MenuItemConfig[] = [];
    for (const item of items) {
      const hijos = item.children ? this.filtrarRutasCliente(item.children) : undefined;
      const hijosOk = hijos != null && hijos.length > 0;
      const rutaOk =
        item.route != null &&
        RUTAS_CLIENTE.some((r) => item.route === r || item.route!.startsWith(`${r}/`));

      if (rutaOk) {
        const copia: MenuItemConfig = { ...item };
        if (hijosOk) copia.children = hijos;
        resultado.push(copia);
      } else if (hijosOk) {
        resultado.push({
          label: item.label,
          icon: item.icon,
          children: hijos,
        });
      }
    }
    return resultado;
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
