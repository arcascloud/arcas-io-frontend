import { Injectable, DestroyRef, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { fromEvent, forkJoin, of, Observable } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from './api.service';
import { MenuConfigService, MenuItemConfig } from './menu-config.service';
import { CxcCliente } from '../models/cxc.models';
import { Proveedor, Producto } from '../models/inventario.models';
import { CtaContable } from '../models/contabilidad.models';

/** Destino navegable de la utilidad de navegación rápida */
export interface QuickNavItem {
  /** Etiqueta corta del chip derecho (Menú, Cliente, Producto, ...) */
  tipo: string;
  /** Texto principal */
  label: string;
  /** Línea secundaria: código, DNI, breadcrumb, etc. */
  detalle?: string;
  /** Ruta absoluta de destino */
  ruta: string;
  /** Clase de ícono PrimeNG (pi pi-xxx) */
  icono: string;
}

/**
 * Utilidad GLOBAL de navegación rápida.
 *
 * Se invoca con Ctrl+Alt+1 desde cualquier pantalla, formulario o control
 * de la aplicación (escucha en `document`, por lo que funciona aunque el
 * foco esté dentro de un input, textarea o tabla).
 *
 * Nota: Ctrl+1..8 está reservado por el navegador para cambiar de pestaña,
 * por eso el atajo es Ctrl+Alt+1.
 */
@Injectable({ providedIn: 'root' })
export class QuickNavService {
  private api = inject(ApiService);
  private router = inject(Router);
  private menuConfig = inject(MenuConfigService);
  private destroyRef = inject(DestroyRef);

  /** Estado del diálogo (abierto/cerrado) */
  readonly abierto = signal(false);

  private cuentasCache: Observable<CtaContable[]> | null = null;

  constructor() {
    fromEvent<KeyboardEvent>(document, 'keydown')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => this.onKeyDown(event));
  }

  // ── Teclado global ──────────────────────────────────────────────
  private onKeyDown(event: KeyboardEvent): void {
    if (!event.ctrlKey || !event.altKey) return;
    if (event.code !== 'Digit1' && event.code !== 'Numpad1') return;

    event.preventDefault();
    event.stopPropagation();
    this.alternar();
  }

  abrir(): void {
    this.abierto.set(true);
  }

  cerrar(): void {
    this.abierto.set(false);
  }

  alternar(): void {
    this.abierto.update((v) => !v);
  }

  // ── Pestaña MENÚ (fuente local, árbol de tusuariomnuitem) ───────
  /** Aplana el árbol del menú lateral en destinos navegables */
  menuItems(): QuickNavItem[] {
    const salida: QuickNavItem[] = [];
    const vistos = new Set<string>();

    const recorrer = (items: MenuItemConfig[], rutaPadre: string[]): void => {
      for (const item of items) {
        const ruta = [...rutaPadre, item.label];
        if (item.route && !vistos.has(item.route)) {
          vistos.add(item.route);
          salida.push({
            tipo: 'Menú',
            label: item.label,
            detalle: rutaPadre.length ? rutaPadre.join(' / ') : item.route,
            ruta: this.normalizarRuta(item.route),
            icono: item.icon ? `pi pi-${item.icon}` : 'pi pi-folder',
          });
        }
        if (item.children?.length) recorrer(item.children, ruta);
      }
    };

    recorrer(this.menuConfig.getMenuItems(), []);
    return salida;
  }

  /** Filtra el menú local por texto (sin HTTP) */
  filtrarMenu(termino: string): QuickNavItem[] {
    const q = this.normalizar(termino);
    const items = this.menuItems();
    if (!q) return items;
    return items.filter(
      (i) => this.normalizar(i.label).includes(q) || this.normalizar(i.detalle ?? '').includes(q),
    );
  }

  // ── Pestaña DATOS (búsqueda global en backend) ──────────────────
  /**
   * Busca en paralelo: clientes (CxC), proveedores (CxP),
   * productos (Inventario) y cuentas contables (Contabilidad).
   */
  buscarDatos(termino: string): Observable<QuickNavItem[]> {
    const q = termino.trim();
    if (q.length < 2) return of([]);

    const clientes$ = this.api
      .get<{ data: CxcCliente[]; total: number }>('/cxc/clientes', { q, page: 1, limit: 6 })
      .pipe(catchError(() => of({ data: [] as CxcCliente[], total: 0 })));

    const proveedores$ = this.api
      .get<{ data: Proveedor[]; total: number }>('/cxp/proveedores-pag', { q, page: 1, limit: 6 })
      .pipe(catchError(() => of({ data: [] as Proveedor[], total: 0 })));

    const productos$ = this.api
      .get<Producto[]>('/inventario/productos/buscar', { q })
      .pipe(catchError(() => of([] as Producto[])));

    const cuentas$ = this.cuentas().pipe(
      map((cs) =>
        cs
          .filter(
            (c) =>
              this.normalizar(c.ctacontable).includes(this.normalizar(q)) ||
              this.normalizar(c.descripcion).includes(this.normalizar(q)),
          )
          .slice(0, 6),
      ),
    );

    return forkJoin([clientes$, proveedores$, productos$, cuentas$]).pipe(
      map(([cl, pr, pi, ct]) => [
        ...cl.data.map((c) => this.itemCliente(c)),
        ...pr.data.map((p) => this.itemProveedor(p)),
        ...pi.map((p) => this.itemProducto(p)),
        ...ct.map((c) => this.itemCuenta(c)),
      ]),
    );
  }

  // ── Navegación ──────────────────────────────────────────────────
  navegar(item: QuickNavItem): boolean {
    const cruda = (item?.ruta ?? '').trim();
    if (!cruda) {
      console.error('[QuickNav] destino sin ruta:', item);
      return false;
    }
    const ruta = this.normalizarRuta(cruda);
    this.cerrar();
    this.router.navigateByUrl(ruta).then(
      (ok) => {
        if (!ok) console.warn('[QuickNav] navegación cancelada hacia:', ruta);
      },
      (err) => console.error('[QuickNav] error navegando a', ruta, err),
    );
    return true;
  }

  // ── Internos ────────────────────────────────────────────────────
  /** Catálogo de cuentas contables: una sola petición, cacheada */
  private cuentas(): Observable<CtaContable[]> {
    if (!this.cuentasCache) {
      this.cuentasCache = this.api.get<CtaContable[]>('/contabilidad/ctacontables').pipe(
        catchError(() => of([] as CtaContable[])),
        shareReplay(1),
      );
    }
    return this.cuentasCache;
  }

  private itemCliente(c: CxcCliente): QuickNavItem {
    const nombre = `${c.nombres ?? ''} ${c.apellidos ?? ''}`.trim() || c.razonsocial || 'Cliente';
    const ref = [c.nrocliente ? `#${c.nrocliente}` : '', c.dni || '', c.rtn || '']
      .filter(Boolean)
      .join(' · ');
    return {
      tipo: 'Cliente',
      label: nombre,
      detalle: ref || undefined,
      ruta: `/cxc/clientes/editar/${c.clienteId}`,
      icono: 'pi pi-user',
    };
  }

  private itemProveedor(p: Proveedor): QuickNavItem {
    const nombre = p.razonsocial?.trim() || `${p.nombres ?? ''} ${p.apellidos ?? ''}`.trim() || 'Proveedor';
    const ref = [p.nroproveedor ? `#${p.nroproveedor}` : '', p.rtn || '', p.dni || '']
      .filter(Boolean)
      .join(' · ');
    return {
      tipo: 'Proveedor',
      label: nombre,
      detalle: ref || undefined,
      ruta: `/cxp/proveedores/editar/${p.proveedorId}`,
      icono: 'pi pi-truck',
    };
  }

  private itemProducto(p: Producto): QuickNavItem {
    return {
      tipo: 'Producto',
      label: p.descripcion,
      detalle: p.codbarra || undefined,
      ruta: `/inventario/productos/editar/${p.produtoId}`,
      icono: 'pi pi-box',
    };
  }

  private itemCuenta(c: CtaContable): QuickNavItem {
    return {
      tipo: 'Cuenta',
      label: `${c.ctacontable} · ${c.descripcion}`,
      detalle: `Nivel ${c.nivel} · ${c.naturaleza === 'D' ? 'Deudora' : 'Acreedora'}`,
      ruta: '/contabilidad/ctacontables',
      icono: 'pi pi-book',
    };
  }

  private normalizarRuta(ruta: string): string {
    const limpia = (ruta ?? '').trim();
    if (!limpia) return '/dashboard';
    return limpia.startsWith('/') ? limpia : `/${limpia}`;
  }

  private normalizar(texto: string): string {
    return (texto ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }
}
