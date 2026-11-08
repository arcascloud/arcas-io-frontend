import { Component, inject, signal, OnInit, DestroyRef, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';
import { UsuarioRolesService } from '../../../core/services/usuario-roles.service';
import { UsuarioRol, TipoRol } from '../../../core/models/usuario.models';
import { UsuariosService } from '../../../core/services/usuarios.service';

@Component({
  selector: 'app-usuario-roles-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, SelectModule, TagModule, CheckboxModule],
  templateUrl: './usuario-roles-form.html',
  styleUrl: './usuario-roles-form.scss',
})
export class UsuarioRolesForm implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(UsuarioRolesService);
  private usuariosService = inject(UsuariosService);
  private msgs = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  esEdicion = signal(false);
  cargando = signal(false);
  guardando = signal(false);
  titulo = signal('Asignar roles');

  usuarios = signal<{ usuarioId: number; usuario: string; nombre: string; email?: string }[]>([]);
  tiposRol = signal<TipoRol[]>([]);

  private recordId = 0;

  form!: FormGroup;

  selectedUser = computed(() => {
    const id = this.form?.get('usuarioId')?.value;
    if (!id) return null;
    return this.usuarios().find((u) => u.usuarioId === Number(id)) || null;
  });

  selectedRol = computed(() => {
    const r = this.form?.get('rol')?.value;
    if (!r) return null;
    return this.tiposRol().find((t) => t.rol === r) || null;
  });

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.volver();
    } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      this.guardar();
    }
  }

  severidadRol(rol: string): 'danger' | 'warn' | 'info' | 'secondary' {
    switch (rol) {
      case 'admin':
        return 'danger';
      case 'supervisor':
        return 'warn';
      case 'contador':
        return 'info';
      default:
        return 'secondary';
    }
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.esEdicion.set(true);
      this.titulo.set('Editar asignación de rol');
      this.recordId = Number(id);
      this.form = this.fb.group({
        usuarioId: [null, Validators.required],
        rol: ['', Validators.required],
      });
    } else {
      this.esEdicion.set(false);
      this.titulo.set('Asignación múltiple de roles');
      this.form = this.fb.group({
        usuarioId: [null, Validators.required],
        roles: [[], Validators.required],
      });
    }

    this.usuariosService
      .getAll(true)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (d) => this.usuarios.set(d), error: () => {} });

    this.service
      .getTipos()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (d) => this.tiposRol.set(d), error: () => {} });

    if (id) {
      this.cargando.set(true);
      this.service
        .getOne(this.recordId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (r: UsuarioRol) => {
            this.form.patchValue({ usuarioId: r.usuarioId, rol: r.rol });
            this.form.get('usuarioId')?.disable();
            this.cargando.set(false);
          },
          error: () => {
            this.cargando.set(false);
            this.msgs.add({ severity: 'error', summary: 'Error', detail: 'Asignación no encontrada' });
            this.volver();
          },
        });
    }
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
    const usuarioId = Number(raw.usuarioId);

    if (this.esEdicion()) {
      const dto: Partial<UsuarioRol> = {
        usuarioId,
        rol: raw.rol,
      };
      this.guardando.set(true);
      this.service.update(this.recordId, dto).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.guardando.set(false);
          this.msgs.add({ severity: 'success', summary: 'Guardado', detail: 'Asignación actualizada' });
          this.volver();
        },
        error: (err) => {
          this.guardando.set(false);
          this.msgs.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.message || 'No se pudo guardar la asignación',
          });
        },
      });
    } else {
      const rolesSel: string[] = raw.roles || [];
      if (rolesSel.length === 0) {
        this.msgs.add({ severity: 'warn', summary: 'Atención', detail: 'Seleccione al menos un rol' });
        return;
      }

      this.guardando.set(true);
      const reqs = rolesSel.map((rol) => this.service.create({ usuarioId, rol }));

      forkJoin(reqs)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.guardando.set(false);
            this.msgs.add({
              severity: 'success',
              summary: 'Guardado',
              detail: `Roles asignados correctamente (${rolesSel.length})`,
            });
            this.volver();
          },
          error: (err) => {
            this.guardando.set(false);
            this.msgs.add({
              severity: 'error',
              summary: 'Error',
              detail: err.error?.message || 'No se pudieron asignar los roles',
            });
          },
        });
    }
  }
}
