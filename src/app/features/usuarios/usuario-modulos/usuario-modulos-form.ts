import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { PickListModule } from 'primeng/picklist';
import { MessageService } from 'primeng/api';
import { UsuariosModuleService } from '../../../core/services/usuarios-module.service';
import { UsuariosService } from '../../../core/services/usuarios.service';
import { ModulosService } from '../../../core/services/modulos.service';
import { UsuariosModule } from '../../../core/models/usuario.models';

/** Ítem del PickList (tmodulos). */
interface ModuloItem {
  moduloId: number;
  descripcion: string;
}

@Component({
  selector: 'app-usuario-modulos-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, SelectModule, PickListModule],
  templateUrl: './usuario-modulos-form.html',
  styleUrl: './usuario-modulos-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsuarioModulosForm implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(UsuariosModuleService);
  private usuariosService = inject(UsuariosService);
  private modulosService = inject(ModulosService);
  private msgs = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  esEdicion = signal(false);
  cargando = signal(false);
  guardando = signal(false);
  titulo = signal('Nueva asignación de módulo');
  /** true cuando se intentó guardar sin módulos en el target del PickList */
  pickIntentado = signal(false);

  usuarios = signal<{ label: string; value: string }[]>([]);
  /** tmodulos completo */
  modulos = signal<ModuloItem[]>([]);
  /** asignaciones existentes (para excluir módulos ya asignados al usuario) */
  private asignaciones: UsuariosModule[] = [];

  /** PickList: disponibles (source) / elegidos (target) */
  sourceMods = signal<ModuloItem[]>([]);
  targetMods = signal<ModuloItem[]>([]);
  /** Módulos que el usuario YA tiene asignados (target inicial, no se re-guardan) */
  asignadosIniciales = signal<Set<number>>(new Set());

  /** Módulos nuevos en el target (se crearán al guardar) */
  readonly nuevosElegidos = computed(() => {
    const iniciales = this.asignadosIniciales();
    return this.targetMods().filter((m) => !iniciales.has(m.moduloId));
  });

  /** Módulos que estaban asignados y ahora están en source (se eliminarán al guardar) */
  readonly aEliminar = computed(() => {
    const iniciales = this.asignadosIniciales();
    const targetIds = new Set(this.targetMods().map((m) => m.moduloId));
    return [...iniciales].filter((id) => !targetIds.has(id));
  });

  private recordId = 0;
  /** Registro completo en modo edición (para conservar submenús al actualizar) */
  private registro: UsuariosModule | null = null;

  form!: FormGroup;

  /** Nombre del módulo actual (modo edición). */
  readonly moduloActualNombre = computed(() => {
    const id = this.form?.get('moduloId')?.value;
    return this.modulos().find((m) => m.moduloId === id)?.descripcion ?? (id ? `#${id}` : '—');
  });

  ngOnInit() {
    this.form = this.fb.group({
      usuario: ['', Validators.required],
      // En creación el módulo se elige en el PickList; el control queda para edición
      moduloId: [null as number | null],
    });

    this.usuariosService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (d) =>
        this.usuarios.set(
          (d || []).map((u) => ({
            label: `${u.usuario} — ${u.nombre} ${u.apellidos ?? ''}`.trim(),
            value: u.usuario,
          })),
        ),
    });

    this.modulosService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (d) => {
        const items: ModuloItem[] = (d || [])
          .map((m) => ({ moduloId: m.moduloId, descripcion: m.descripcion }))
          .sort((a, b) => a.descripcion.localeCompare(b.descripcion));
        this.modulos.set(items);
        this.refrescarPickList();
      },
    });

    // Al cambiar de usuario se recalculan los disponibles y se limpia la selección
    this.form.get('usuario')!.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.cargarAsignacionesUsuario();
    });

    // Preselección de usuario al crear desde el árbol (?usuario=admin)
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((p) => {
      const usuario = p['usuario'];
      if (usuario && !this.esEdicion()) {
        this.form.get('usuario')?.setValue(usuario);
      }
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.esEdicion.set(true);
      this.titulo.set('Editar asignación de módulo');
      this.recordId = Number(id);
      this.cargando.set(true);
      this.service.getOne(this.recordId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (r) => {
          this.registro = r;
          this.form.patchValue({
            usuario: r.usuario,
            moduloId: r.moduloId,
          });
          this.form.get('usuario')?.disable();
          this.cargando.set(false);
        },
        error: () => {
          this.cargando.set(false);
          this.msgs.add({ severity: 'error', summary: 'Error', detail: 'Asignación no encontrada' });
          this.volver();
        },
      });
    }
    // Modo creación: ?usuario=admin ya se preseleccionó vía queryParams
    // (el setValue dispara valueChanges → cargarAsignacionesUsuario)
  }

  /**
   * Carga las asignaciones del usuario seleccionado y recalcula el source
   * del PickList (tmodulos menos los ya asignados). El target se limpia.
   */
  private cargarAsignacionesUsuario() {
    if (this.esEdicion()) return;
    this.service
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.asignaciones = res || [];
          this.refrescarPickList();
        },
        error: () => this.refrescarPickList(),
      });
  }

  /** Reconstruye source (disponibles) y target (asignados existentes) según el usuario. */
  private refrescarPickList() {
    if (this.esEdicion()) return;
    const usuario = this.form.get('usuario')?.value;
    const todos = this.modulos();

    if (!usuario) {
      this.sourceMods.set(todos);
      this.targetMods.set([]);
      this.asignadosIniciales.set(new Set());
      return;
    }

    const asignados = this.asignaciones.filter((a) => a.usuario === usuario);
    const asignadosIds = new Set(asignados.map((a) => a.moduloId));

    // Disponibles = tmodulos sin asignar · Asignados = los que ya tiene el usuario
    this.sourceMods.set(todos.filter((m) => !asignadosIds.has(m.moduloId)));
    this.targetMods.set(todos.filter((m) => asignadosIds.has(m.moduloId)));
    this.asignadosIniciales.set(asignadosIds);
  }

  invalid(ctrl: string): boolean {
    const c = this.form.get(ctrl);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  volver() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();

    this.guardando.set(true);

    if (this.esEdicion()) {
      // Sin campos editables en el form: se conservan los valores actuales del registro
      this.service
        .update(this.recordId, {
          submnudatos: this.registro?.submnudatos,
          submnurocesos: this.registro?.submnurocesos,
          submnueportes: this.registro?.submnueportes,
        })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => this.finalizarGuardado('Asignación actualizada'),
          error: (err) => this.errorGuardado(err),
        });
      return;
    }

    // ── Creación/edición masiva: DELETE de los devueltos + POST de los nuevos ──
    const nuevos = this.nuevosElegidos();
    const eliminarIds = this.aEliminar();
    this.pickIntentado.set(true);

    if (nuevos.length === 0 && eliminarIds.length === 0) {
      this.guardando.set(false);
      this.msgs.add({
        severity: 'info',
        summary: 'Sin cambios',
        detail: 'No se modificaron las asignaciones del usuario',
      });
      return;
    }
    this.pickIntentado.set(false);

    // DELETEs: buscar tusuariosmoduloId de cada módulo a eliminar
    const deletes = eliminarIds
      .map((moduloId) => {
        const rec = this.asignaciones.find(
          (a) => a.usuario === raw.usuario && a.moduloId === moduloId,
        );
        return rec ? this.service.delete(rec.tusuariosmoduloId) : null;
      })
      .filter((obs) => obs !== null);

    // POSTs: crear módulos nuevos
    const creates = nuevos.map((m) =>
      this.service.create({
        usuario: raw.usuario,
        moduloId: m.moduloId,
        sn_activo: 'S' as const,
      }),
    );

    const ops = [...deletes, ...creates];

    forkJoin(ops).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (respuestas) => {
        const partes: string[] = [];
        if (creates.length > 0) partes.push(`${creates.length} módulo(s) asignado(s)`);
        if (deletes.length > 0) partes.push(`${deletes.length} módulo(s) removido(s)`);
        // itemsEliminados: items de menú borrados junto con cada módulo removido
        const removidos = (respuestas as Array<{ itemsEliminados?: number }>).reduce(
          (acc, r) => acc + (r?.itemsEliminados || 0),
          0,
        );
        if (removidos > 0) partes.push(`${removidos} item(s) de menú eliminado(s)`);
        // itemsClonados: menú de admin copiado al usuario en cada POST de módulo
        const clonados = (respuestas as Array<{ itemsClonados?: number }>).reduce(
          (acc, r) => acc + (r?.itemsClonados || 0),
          0,
        );
        if (clonados > 0) partes.push(`${clonados} item(s) de menú clonado(s)`);
        this.finalizarGuardado(`${partes.join(' · ')} a ${raw.usuario}`);
      },
      error: (err) => this.errorGuardado(err),
    });
  }

  private finalizarGuardado(detalle: string) {
    this.guardando.set(false);
    this.msgs.add({ severity: 'success', summary: 'Guardado', detail: detalle });
    this.volver();
  }

  private errorGuardado(err: any) {
    this.guardando.set(false);
    const msg = err?.error?.message;
    this.msgs.add({
      severity: 'error',
      summary: 'Error',
      detail: (Array.isArray(msg) ? msg.join(' · ') : msg) || 'No se pudo guardar la asignación',
    });
  }
}
