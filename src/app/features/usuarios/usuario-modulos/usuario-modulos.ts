import { Component, inject, signal, OnInit, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TreeTableModule } from 'primeng/treetable';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TreeNode } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { UsuariosModuleService } from '../../../core/services/usuarios-module.service';
import { ModulosService } from '../../../core/services/modulos.service';
import { UsuariosService } from '../../../core/services/usuarios.service';
import { UsuariosModule } from '../../../core/models/usuario.models';

/** Fila de datos de un nodo del árbol (usuario o módulo hijo). */
interface NodoModulo {
  /** 'usuario' en el padre, 'modulo' en los hijos */
  tipo: 'usuario' | 'modulo';
  usuario: string;
  nombre: string;
  id?: number;
  moduloId?: number;
  moduloNombre?: string;
  submnudatos?: 'S' | 'N';
  submnurocesos?: 'S' | 'N';
  submnueportes?: 'S' | 'N';
  sn_activo?: 'S' | 'N';
  totalModulos?: number;
}

@Component({
  selector: 'app-usuario-modulos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TreeTableModule,
    ToggleSwitchModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    TooltipModule,
  ],
  templateUrl: './usuario-modulos.html',
  styleUrl: './usuario-modulos.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsuarioModulos implements OnInit {
  private service = inject(UsuariosModuleService);
  private modulosService = inject(ModulosService);
  private usuariosService = inject(UsuariosService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private msgs = inject(MessageService);

  private destroyRef = inject(DestroyRef);

  /** Árbol completo (padres = usuarios, hijos = módulos asignados) */
  nodos = signal<TreeNode<NodoModulo>[]>([]);
  cargando = signal(false);

  q = signal('');

  private asignaciones: UsuariosModule[] = [];
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
        this.asignaciones = res || [];
        this.construirArbol();
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.msgs.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las asignaciones',
        });
      },
    });
  }

  /** Agrupa las asignaciones por usuario y arma los TreeNode agrupados/filtrados. */
  private construirArbol() {
    const q = this.q().toLowerCase().trim();

    // Agrupar por usuario preservando orden alfabético
    const grupos = new Map<string, UsuariosModule[]>();
    for (const a of this.asignaciones) {
      const lista = grupos.get(a.usuario);
      if (lista) lista.push(a);
      else grupos.set(a.usuario, [a]);
    }

    const usuariosOrdenados = [...grupos.keys()].sort((a, b) => a.localeCompare(b));

    const nodos: TreeNode<NodoModulo>[] = [];

    for (const usuario of usuariosOrdenados) {
      const nombre = this.nombresMap.get(usuario) || usuario;
      const mods = grupos.get(usuario)!;

      const hijos: TreeNode<NodoModulo>[] = mods
        .map((a) => ({
          key: `m-${a.tusuariosmoduloId}`,
          data: {
            tipo: 'modulo' as const,
            usuario,
            nombre,
            id: a.tusuariosmoduloId,
            moduloId: a.moduloId,
            moduloNombre: this.modulosMap.get(a.moduloId) ?? `#${a.moduloId}`,
            submnudatos: a.submnudatos,
            submnurocesos: a.submnurocesos,
            submnueportes: a.submnueportes,
            sn_activo: a.sn_activo,
          },
        }))
        .sort((x, y) =>
          (x.data!.moduloNombre || '').localeCompare(y.data!.moduloNombre || ''),
        );

      // Filtro: si hay texto, coincidencia en usuario/nombre o en al menos un módulo
      let hijosVisibles = hijos;
      if (q) {
        const coincideUsuario =
          usuario.toLowerCase().includes(q) || nombre.toLowerCase().includes(q);
        hijosVisibles = coincideUsuario
          ? hijos
          : hijos.filter((h) => (h.data!.moduloNombre || '').toLowerCase().includes(q));
        if (hijosVisibles.length === 0 && !coincideUsuario) continue;
      }

      nodos.push({
        key: `u-${usuario}`,
        expanded: true,
        data: {
          tipo: 'usuario',
          usuario,
          nombre,
          totalModulos: hijosVisibles.length,
        },
        children: hijosVisibles,
      });
    }

    this.nodos.set(nodos);
  }

  buscar() {
    this.construirArbol();
  }

  limpiarFiltros() {
    this.q.set('');
    this.construirArbol();
  }

  nuevo(usuario?: string) {
    if (usuario) {
      this.router.navigate(['nuevo'], {
        relativeTo: this.route,
        queryParams: { usuario },
      });
    } else {
      this.router.navigate(['nuevo'], { relativeTo: this.route });
    }
  }

  /**
   * Activa/desactiva la asignación del módulo desde el switch de la fila.
   * Actualización optimista sobre `asignaciones` + árbol reconstruido;
   * si el backend falla, se revierte y se reconstruye de nuevo.
   */
  toggleActivo(data: NodoModulo, activo: boolean) {
    if (!data.id) return;

    const registro = this.asignaciones.find((a) => a.tusuariosmoduloId === data.id);
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
            summary: activo ? 'Módulo habilitado' : 'Módulo deshabilitado',
            detail: `"${data.moduloNombre}" ${activo ? 'habilitado' : 'deshabilitado'} para ${data.usuario}`,
          });
        },
        error: () => {
          registro.sn_activo = anterior;
          this.construirArbol();
          this.msgs.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo actualizar el estado de la asignación',
          });
        },
      });
  }
}
