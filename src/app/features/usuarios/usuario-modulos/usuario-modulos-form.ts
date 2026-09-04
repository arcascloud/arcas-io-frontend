import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { MessageService } from 'primeng/api';
import { UsuariosModuleService } from '../../../core/services/usuarios-module.service';
import { UsuariosService } from '../../../core/services/usuarios.service';
import { ModulosService } from '../../../core/services/modulos.service';

@Component({
  selector: 'app-usuario-modulos-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, SelectModule, SelectButtonModule],
  templateUrl: './usuario-modulos-form.html',
  styleUrl: './usuario-modulos-form.scss',
})
export class UsuarioModulosForm implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(UsuariosModuleService);
  private usuariosService = inject(UsuariosService);
  private modulosService = inject(ModulosService);
  private msgs = inject(MessageService);

  esEdicion = signal(false);
  cargando = signal(false);
  guardando = signal(false);
  titulo = signal('Nueva asignación de módulo');

  usuarios = signal<{ usuario: string; nombre: string }[]>([]);
  modulos = signal<{ moduloId: number; descripcion: string }[]>([]);

  private recordId = 0;

  readonly snOptions = [
    { label: 'Sí', value: 'S' },
    { label: 'No', value: 'N' },
  ];

  form!: FormGroup;

  ngOnInit() {
    this.form = this.fb.group({
      usuario: ['', Validators.required],
      moduloId: [null as number | null, Validators.required],
      submnudatos: ['N'],
      submnurocesos: ['N'],
      submnueportes: ['N'],
    });

    this.usuariosService.getAll().subscribe({ next: (d) => this.usuarios.set(d) });
    this.modulosService.getAll().subscribe({ next: (d) => this.modulos.set(d) });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.esEdicion.set(true);
      this.titulo.set('Editar asignación de módulo');
      this.recordId = Number(id);
      this.cargando.set(true);
      this.service.getOne(this.recordId).subscribe({
        next: (r) => {
          this.form.patchValue({
            usuario: r.usuario,
            moduloId: r.moduloId,
            submnudatos: r.submnudatos === 'S' ? 'S' : 'N',
            submnurocesos: r.submnurocesos === 'S' ? 'S' : 'N',
            submnueportes: r.submnueportes === 'S' ? 'S' : 'N',
          });
          this.form.get('usuario')?.disable();
          this.form.get('moduloId')?.disable();
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
    const data = {
      usuario: raw.usuario,
      moduloId: raw.moduloId,
      submnudatos: raw.submnudatos,
      submnurocesos: raw.submnurocesos,
      submnueportes: raw.submnueportes,
    };

    this.guardando.set(true);
    const op = this.esEdicion()
      ? this.service.update(this.recordId, {
          submnudatos: data.submnudatos,
          submnurocesos: data.submnurocesos,
          submnueportes: data.submnueportes,
        })
      : this.service.create({ ...data, sn_activo: 'S' });

    op.subscribe({
      next: () => {
        this.guardando.set(false);
        this.msgs.add({
          severity: 'success',
          summary: 'Guardado',
          detail: this.esEdicion() ? 'Asignación actualizada' : 'Asignación creada correctamente',
        });
        this.volver();
      },
      error: () => {
        this.guardando.set(false);
        this.msgs.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo guardar la asignación',
        });
      },
    });
  }
}