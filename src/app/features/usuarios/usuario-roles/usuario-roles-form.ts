import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { UsuarioRolesService } from '../../../core/services/usuario-roles.service';
import { UsuarioRol, TipoRol } from '../../../core/models/usuario.models';
import { UsuariosService } from '../../../core/services/usuarios.service';

@Component({
  selector: 'app-usuario-roles-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, SelectModule],
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
  titulo = signal('Asignar rol');

  usuarios = signal<{ usuarioId: number; usuario: string; nombre: string }[]>([]);
  tiposRol = signal<TipoRol[]>([]);

  private recordId = 0;

  form!: FormGroup;

  ngOnInit() {
    this.form = this.fb.group({
      usuarioId: [null, Validators.required],
      rol: ['', Validators.required],
    });

    this.usuariosService
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (d) => this.usuarios.set(d), error: () => {} });

    this.service
      .getTipos()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (d) => this.tiposRol.set(d), error: () => {} });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.esEdicion.set(true);
      this.titulo.set('Editar asignación de rol');
      this.recordId = Number(id);
      this.cargando.set(true);
      this.service
        .getOne(this.recordId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (r: UsuarioRol) => {
            this.form.patchValue({ usuarioId: r.usuarioId, rol: r.rol });
            // La asignación usuario+rol es única: no se edita el usuario
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
    const dto: Partial<UsuarioRol> = {
      usuarioId: Number(raw.usuarioId),
      rol: raw.rol,
    };

    this.guardando.set(true);
    const op = this.esEdicion()
      ? this.service.update(this.recordId, dto)
      : this.service.create(dto);

    op.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.guardando.set(false);
        this.msgs.add({
          severity: 'success',
          summary: 'Guardado',
          detail: this.esEdicion() ? 'Asignación actualizada' : 'Rol asignado correctamente',
        });
        this.volver();
      },
      error: (err) => {
        this.guardando.set(false);
        this.msgs.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'No se pudo guardar la asignación de rol',
        });
      },
    });
  }
}
