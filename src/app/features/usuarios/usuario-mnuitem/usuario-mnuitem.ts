import { Component, inject, signal, OnInit, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TreeTableModule } from 'primeng/treetable';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TreeNode, ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { MultiSelectModule } from 'primeng/multiselect';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { UsuariosMnuItemService } from '../../../core/services/usuarios-mnuitem.service';
import { ModulosService } from '../../../core/services/modulos.service';
import { UsuariosService } from '../../../core/services/usuarios.service';
import { UsuariosMnuItem } from '../../../core/models/usuario.models';

/** Fila de datos de un nodo del árbol (usuario padre o item de menú). */
interface NodoItem {
  /** 'usuario' en el padre, 'item' en los hijos */
  tipo: 'usuario' | 'item';
  usuario: string;
  /** Nombre completo (solo fila usuario) */
  nombre?: string;
  /** tusuariomnuitemsId (solo filas item) */
  id?: number;
  label?: string;
  nameItem?: string;
  icon?: string;
  ruta?: string;
  moduloId?: number;
  moduloNombre?: string;
  levelId?: number;
  sn_activo?: 'S' | 'N';
  /** Cantidad de items visibles del usuario (fila usuario) */
  totalItems?: number;
}

@Component({
  selector: 'app-usuario-mnuitem',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TreeTableModule,
    ToggleSwitchModule,
    ButtonModule,
    MultiSelectModule,
    TagModule,
    TooltipModule,
  ],
  templateUrl: './usuario-mnuitem.html',
  styleUrl: './usuario-mnuitem.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsuarioMnuItem implements OnInit {
  private service = inject(UsuariosMnuItemService);
  private modulosService = inject(ModulosService);
  private usuariosService = inject(UsuariosService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private msgs = inject(MessageService);
  private confirm = inject(ConfirmationService);
  private destroyRef = inject(DestroyRef);

  /** Árbol completo (padres = usuarios, hijos = items de menú jerárquicos) */
  nodos = signal<TreeNode<NodoItem>[]>([]);
  cargando = signal(false);
  /** Login del usuario cuyo clonado de menú está en curso ('' = ninguno) */
  clonando = signal('');

  /** Valor sentinela de "Todos los usuarios" en el multiselect de usuarios */
  private readonly TODOS_USUARIOS = '*';
  /** Valor sentinela de "Todos los módulos" en el multiselect de módulos */
  private readonly TODOS_MODULOS = -1;

  /** Selección del filtro de usuarios (['*'] = todos) */
  filtroUsuarios = signal<string[]>([this.TODOS_USUARIOS]);
  /** Selección del filtro de módulos ([-1] = todos) */
  filtroModulos = signal<number[]>([this.TODOS_MODULOS]);
  usuariosOpciones = signal<{ label: string; value: string }[]>([]);
  modulosOpciones = signal<{ label: string; value: number }[]>([]);

  private items: UsuariosMnuItem[] = [];
  private modulosMap = new Map<number, string>();
  private nombresMap = new Map<string, string>();

  ngOnInit() {
    this.modulosService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (d) => {
        d.forEach((m) => this.modulosMap.set(m.moduloId, m.descripcion));
        this.construirArbol();
      },
    });

    this.usuariosService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (d) => {
        d.forEach((u) =>
          this.nombresMap.set(
            u.usuario,
            [u.nombre, u.apellidos].filter(Boolean).join(' ').trim() || u.nombre,
          ),
        );
        this.construirArbol();
      },
    });

    this.load();

    // Al volver del form (crear/editar) Angular reutiliza el componente;
    // recargar en cada NavigationEnd para ver los cambios
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.load());
  }

  load() {
    this.cargando.set(true);
    this.service.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.items = res || [];
        this.construirArbol();
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.msgs.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los items de menú',
        });
      },
    });
  }

  /**
   * Agrupa los items por usuario y arma los TreeNode: cada usuario es la fila
   * padre y sus hijos son su árbol de menú real (raíz → módulo → submenú…),
   * reconstruido desde `parentId` (igual que el sidebar en menu-config).
   * También arma las opciones de los dos multiselect (con "Todos" al inicio),
   * limitadas a los usuarios/módulos que realmente tienen items.
   */
  private construirArbol() {
    // Agrupar por usuario
    const grupos = new Map<string, UsuariosMnuItem[]>();
    for (const it of this.items) {
      const lista = grupos.get(it.usuario);
      if (lista) lista.push(it);
      else grupos.set(it.usuario, [it]);
    }

    // Opciones de los filtros: solo usuarios/módulos presentes en los items
    const usuarios = [...grupos.keys()].sort((a, b) => a.localeCompare(b));
    this.usuariosOpciones.set([
      { label: 'Todos', value: this.TODOS_USUARIOS },
      ...usuarios.map((u) => ({ label: u, value: u })),
    ]);
    const mods = [...new Set(this.items.map((i) => i.moduloId))].sort((a, b) => a - b);
    this.modulosOpciones.set([
      { label: 'Todos', value: this.TODOS_MODULOS },
      ...mods.map((id) => ({ label: this.modulosMap.get(id) ?? `#${id}`, value: id })),
    ]);

    // "Todos" es excluyente: si no está sentinela, el filtro está activo
    const usuariosSel = this.filtroUsuarios();
    const modsSel = this.filtroModulos();
    const filtrarUsuario = usuariosSel.length > 0 && !usuariosSel.includes(this.TODOS_USUARIOS);
    const filtrarModulo = modsSel.length > 0 && !modsSel.includes(this.TODOS_MODULOS);
    const hayFiltro = filtrarUsuario || filtrarModulo;

    const nodos: TreeNode<NodoItem>[] = [];

    for (const usuario of usuarios) {
      // Filtro de usuarios: solo las selecciones concretas
      if (filtrarUsuario && !usuariosSel.includes(usuario)) continue;

      const lista = grupos.get(usuario)!;
      const nombre = this.nombresMap.get(usuario) || usuario;

      // Con módulos seleccionados se poda conservando ancestros (raíz → módulo)
      let hijos = this.arbolDeUsuario(lista, hayFiltro);
      if (filtrarModulo) {
        hijos = this.podar(hijos, (d) => d.moduloId != null && modsSel.includes(d.moduloId));
      }
      if (!hijos.length) continue;

      nodos.push({
        key: `u-${usuario}`,
        expanded: true,
        data: {
          tipo: 'usuario',
          usuario,
          nombre,
          totalItems: this.contar(hijos),
        },
        children: hijos,
      });
    }

    this.nodos.set(nodos);
  }

  /** Construye el subárbol de menú de un usuario desde sus filas planas. */
  private arbolDeUsuario(items: UsuariosMnuItem[], hayFiltro: boolean): TreeNode<NodoItem>[] {
    const byId = new Map(items.map((i) => [i.tusuariomnuitemsId, i]));
    const hijosDe = new Map<number, UsuariosMnuItem[]>();
    const raices: UsuariosMnuItem[] = [];

    for (const it of items) {
      // Raíz real (parentId === id propio) u huérfano (padre inexistente) → raíz del árbol
      if (it.parentId === it.tusuariomnuitemsId || !byId.has(it.parentId)) {
        raices.push(it);
      } else {
        const lista = hijosDe.get(it.parentId);
        if (lista) lista.push(it);
        else hijosDe.set(it.parentId, [it]);
      }
    }

    // Mismo orden que usa el sidebar (menu-config.buildTree)
    const orden = (a: UsuariosMnuItem, b: UsuariosMnuItem) =>
      (a.zordenItem ?? 0) - (b.zordenItem ?? 0) ||
      (a.zordenMod ?? 0) - (b.zordenMod ?? 0) ||
      a.labelItem.localeCompare(b.labelItem);
    raices.sort(orden);
    for (const lista of hijosDe.values()) lista.sort(orden);

    const construir = (it: UsuariosMnuItem): TreeNode<NodoItem> => {
      const kids = (hijosDe.get(it.tusuariomnuitemsId) ?? []).map(construir);
      return {
        key: `i-${it.tusuariomnuitemsId}`,
        data: {
          tipo: 'item',
          usuario: it.usuario,
          id: it.tusuariomnuitemsId,
          label: it.labelItem,
          nameItem: it.nameItem,
          icon: it.iconItem,
          ruta: it.routerLink,
          moduloId: it.moduloId,
          moduloNombre: this.modulosMap.get(it.moduloId) ?? `#${it.moduloId}`,
          levelId: it.levelId,
          sn_activo: it.sn_activo,
        },
        children: kids.length ? kids : undefined,
        // Vista inicial: raíz abierta (muestra los módulos); con filtro todo expandido
        expanded: hayFiltro || (it.levelId ?? 1) <= 1,
      };
    };

    return raices.map(construir);
  }

  /**
   * Conserva solo las ramas que cumplen `test`: un nodo que coincide mantiene su
   * subárbol completo; uno que solo coincide por descendientes queda como
   * ancestro con las ramas podadas.
   */
  private podar(
    nodos: TreeNode<NodoItem>[],
    test: (d: NodoItem) => boolean,
  ): TreeNode<NodoItem>[] {
    const res: TreeNode<NodoItem>[] = [];
    for (const n of nodos) {
      const hijos = n.children ?? [];
      const hijosPodados = this.podar(hijos, test);
      if (test(n.data)) {
        res.push({ ...n, expanded: true, children: hijos.length ? hijos : undefined });
      } else if (hijosPodados.length) {
        res.push({ ...n, expanded: true, children: hijosPodados });
      }
    }
    return res;
  }

  /** Cuenta los nodos visibles (recursivo). */
  private contar(nodos: TreeNode<NodoItem>[]): number {
    let n = 0;
    for (const x of nodos) n += 1 + this.contar(x.children ?? []);
    return n;
  }

  /**
   * Cambio de la selección de usuarios: "Todos" es excluyente (elegir un
   * usuario concreto lo descarta, y viceversa); si se deselecciona todo se
   * vuelve a "Todos". Se normaliza el valor a array por si emite un escalar.
   */
  onFiltroUsuarios(sel: string[] | string | null) {
    const val = Array.isArray(sel) ? sel : sel == null ? [] : [sel];
    const ant = this.filtroUsuarios();
    if (!val.length) {
      this.filtroUsuarios.set([this.TODOS_USUARIOS]);
    } else if (val.includes(this.TODOS_USUARIOS) && !ant.includes(this.TODOS_USUARIOS)) {
      this.filtroUsuarios.set([this.TODOS_USUARIOS]);
    } else {
      const concretos = val.filter((v) => v !== this.TODOS_USUARIOS);
      this.filtroUsuarios.set(concretos.length ? concretos : [this.TODOS_USUARIOS]);
    }
    this.construirArbol();
  }

  /** Cambio de la selección de módulos: misma semántica de "Todos" que usuarios. */
  onFiltroModulos(sel: number[] | number | null) {
    const val = Array.isArray(sel) ? sel : sel == null ? [] : [sel];
    const ant = this.filtroModulos();
    if (!val.length) {
      this.filtroModulos.set([this.TODOS_MODULOS]);
    } else if (val.includes(this.TODOS_MODULOS) && !ant.includes(this.TODOS_MODULOS)) {
      this.filtroModulos.set([this.TODOS_MODULOS]);
    } else {
      const concretos = val.filter((v) => v !== this.TODOS_MODULOS);
      this.filtroModulos.set(concretos.length ? concretos : [this.TODOS_MODULOS]);
    }
    this.construirArbol();
  }

  nuevo() {
    this.router.navigate(['nuevo'], { relativeTo: this.route });
  }

  editar(id?: number, e?: Event) {
    e?.stopPropagation();
    if (!id) return;
    this.router.navigate(['editar', id], { relativeTo: this.route });
  }

  /** Clona el menú de la plantilla (admin) hacia el usuario de la fila. */
  clonarMenu(usuario: string, e?: Event) {
    e?.stopPropagation();
    this.confirm.confirm({
      message: `¿Clonar el menú de la plantilla (admin) hacia <strong>${usuario}</strong>? Solo se copiarán los items faltantes de sus módulos asignados: no se borra ni duplica nada.`,
      header: 'Clonar menú',
      icon: 'pi pi-copy',
      rejectButtonProps: {
        label: 'Cancelar',
        severity: 'secondary',
        variant: 'text',
        size: 'small',
        rounded: true,
      },
      acceptButtonProps: {
        label: 'Clonar',
        severity: 'success',
        variant: 'text',
        size: 'small',
        rounded: true,
      },
      accept: () => {
        this.clonando.set(usuario);
        this.service.clonarMenu(usuario).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: (r) => {
            this.clonando.set('');
            this.msgs.add({
              severity: r.itemsClonados > 0 ? 'success' : 'info',
              summary: r.itemsClonados > 0 ? 'Menú clonado' : 'Sin cambios',
              detail:
                r.itemsClonados > 0
                  ? `${r.itemsClonados} item(s) clonado(s) hacia ${usuario} (${r.modulosProcesados} módulo(s) asignado(s))`
                  : `${usuario} ya tenía los items de sus ${r.modulosProcesados} módulo(s)`,
            });
            this.load();
          },
          error: (err) => {
            this.clonando.set('');
            const msg = err?.error?.message;
            this.msgs.add({
              severity: 'error',
              summary: 'Error',
              detail: (Array.isArray(msg) ? msg.join(' · ') : msg) || 'No se pudo clonar el menú',
            });
          },
        });
      },
    });
  }

  /**
   * Activa/desactiva el item del menú desde el switch de la fila.
   * Actualización optimista: si el backend falla, se revierte.
   */
  toggleActivo(data: NodoItem, activo: boolean) {
    if (!data.id) return;

    const registro = this.items.find((i) => i.tusuariomnuitemsId === data.id);
    if (!registro) return;

    const anterior = registro.sn_activo;
    registro.sn_activo = activo ? 'S' : 'N';
    this.construirArbol();

    this.service
      .update(data.id, { sn_activo: registro.sn_activo })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.msgs.add({
            severity: 'success',
            summary: activo ? 'Item habilitado' : 'Item deshabilitado',
            detail: `"${data.label}" ${activo ? 'habilitado' : 'deshabilitado'} para ${data.usuario}`,
          });
        },
        error: () => {
          registro.sn_activo = anterior;
          this.construirArbol();
          this.msgs.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo actualizar el estado del item',
          });
        },
      });
  }

  eliminar(item: NodoItem, e?: Event) {
    e?.stopPropagation();
    if (!item.id) return;
    this.confirm.confirm({
      message: `¿Eliminar el item "${item.label}" (${item.usuario})? Esta acción no se puede deshacer.`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: {
        label: 'Cancelar',
        severity: 'secondary',
        variant: 'text',
        size: 'small',
        rounded: true,
      },
      acceptButtonProps: {
        label: 'Eliminar',
        severity: 'danger',
        variant: 'text',
        size: 'small',
        rounded: true,
      },
      accept: () => {
        this.service.delete(item.id!).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => {
            this.msgs.add({
              severity: 'success',
              summary: 'Eliminado',
              detail: 'Item eliminado correctamente',
            });
            this.load();
          },
          error: () => {
            this.msgs.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo eliminar el item',
            });
          },
        });
      },
    });
  }

  /** Clase de icono PrimeNG a partir de `iconItem` (la BD guarda "pi pi-xxx"). */
  iconoClase(icon?: string): string {
    if (!icon) return '';
    if (icon.startsWith('pi ')) return icon;
    return `pi pi-${icon.replace(/^pi-/, '')}`;
  }

  /** Severidad del tag de nivel (1=raíz, 2=módulo, 3=submenú, 4=sub-submenú). */
  nivelSev(n?: number): 'secondary' | 'info' | 'success' | 'warning' {
    switch (n) {
      case 1:
        return 'secondary';
      case 2:
        return 'info';
      case 3:
        return 'success';
      default:
        return 'warning';
    }
  }
}
