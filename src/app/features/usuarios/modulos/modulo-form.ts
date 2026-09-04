import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectButtonModule } from 'primeng/selectbutton';
import { MessageService } from 'primeng/api';
import { ModulosService } from '../../../core/services/modulos.service';

@Component({
  selector: 'app-modulo-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, InputTextModule, SelectButtonModule],
  templateUrl: './modulo-form.html',
  styleUrl: './modulo-form.scss',
})
export class ModuloForm implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(ModulosService);
  private msgs = inject(MessageService);

  esEdicion = signal(false);
  cargando = signal(false);
  guardando = signal(false);
  titulo = signal('Nuevo módulo');

  private moduloId = 0;

  readonly snOptions = [
    { label: 'Activo', value: 'S' },
    { label: 'Inactivo', value: 'N' },
  ];

  form!: FormGroup;

  ngOnInit() {
    this.form = this.fb.group({
      descripcion: ['', Validators.required],
      sn_activo: ['S', Validators.required],
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.esEdicion.set(true);
      this.titulo.set('Editar módulo');
      this.moduloId = Number(id);
      this.cargando.set(true);
      this.service.getOne(this.moduloId).subscribe({
        next: (m) => {
          this.form.patchValue({
            descripcion: m.descripcion,
            sn_activo: m.sn_activo === 'S' ? 'S' : 'N',
          });
          this.cargando.set(false);
        },
        error: () => {
          this.cargando.set(false);
          this.msgs.add({ severity: 'error', summary: 'Error', detail: 'Módulo no encontrado' });
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
    const payload = this.esEdicion()
      ? { descripcion: raw.descripcion, sn_activo: raw.sn_activo }
      : { descripcion: raw.descripcion, sn_activo: 'S' };

    this.guardando.set(true);
    const op = this.esEdicion()
      ? this.service.update(this.moduloId, payload)
      : this.service.create(payload);

    op.subscribe({
      next: () => {
        this.guardando.set(false);
        this.msgs.add({
          severity: 'success',
          summary: 'Guardado',
          detail: this.esEdicion() ? 'Módulo actualizado' : 'Módulo creado correctamente',
        });
        this.volver();
      },
      error: () => {
        this.guardando.set(false);
        this.msgs.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo guardar el módulo',
        });
      },
    });
  }
}