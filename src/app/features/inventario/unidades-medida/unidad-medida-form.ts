import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { UnidadesMedidaService } from '../../../core/services/unidades-medida.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-unidad-medida-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, InputTextModule, SelectModule],
  templateUrl: './unidad-medida-form.html',
  styleUrl: './unidad-medida-form.scss',
})
export class UnidadMedidaForm implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(UnidadesMedidaService);
  private auth = inject(AuthService);
  private msgs = inject(MessageService);

  esEdicion = signal(false);
  cargando = signal(false);
  guardando = signal(false);
  titulo = signal('Nueva unidad de medida');

  readonly snOptions = [
    { label: 'Activo', value: 'S' },
    { label: 'Inactivo', value: 'N' },
  ];

  private unidadmedidaId = 0;

  form!: FormGroup;

  ngOnInit() {
    this.form = this.fb.group({
      descripcion: ['', Validators.required],
      sn_activo: ['S' as 'S' | 'N'],
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.esEdicion.set(true);
      this.titulo.set('Editar unidad de medida');
      this.unidadmedidaId = Number(id);
      this.cargando.set(true);
      this.service.getOne(this.unidadmedidaId).subscribe({
        next: (c) => {
          this.form.patchValue({
            descripcion: c.descripcion,
            sn_activo: c.sn_activo === 'S' ? 'S' : 'N',
          });
          this.cargando.set(false);
        },
        error: () => {
          this.cargando.set(false);
          this.msgs.add({ severity: 'error', summary: 'Error', detail: 'Unidad de medida no encontrada' });
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
      : { descripcion: raw.descripcion, empresaId: this.auth.currentUser()?.empresaId, sn_activo: 'S' };

    this.guardando.set(true);
    const op = this.esEdicion()
      ? this.service.update(this.unidadmedidaId, payload as any)
      : this.service.create(payload as any);

    op.subscribe({
      next: () => {
        this.guardando.set(false);
        this.msgs.add({
          severity: 'success',
          summary: 'Guardado',
          detail: this.esEdicion() ? 'Unidad de medida actualizada' : 'Unidad de medida creada correctamente',
        });
        this.volver();
      },
      error: () => {
        this.guardando.set(false);
        this.msgs.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo guardar la unidad de medida',
        });
      },
    });
  }
}