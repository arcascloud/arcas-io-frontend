import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { MessageService } from 'primeng/api';
import { UsuarioModAuthService } from '../../../core/services/usuario-modauth.service';
import { UsuariosService } from '../../../core/services/usuarios.service';

@Component({
  selector: 'app-usuario-modauth-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, SelectModule, SelectButtonModule],
  templateUrl: './usuario-modauth-form.html',
  styleUrl: './usuario-modauth-form.scss',
})
export class UsuarioModAuthForm implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(UsuarioModAuthService);
  private usuariosService = inject(UsuariosService);
  private msgs = inject(MessageService);

  esEdicion = signal(false);
  cargando = signal(false);
  guardando = signal(false);
  titulo = signal('Nuevos permisos');

  usuarios = signal<{ usuario: string; nombre: string }[]>([]);

  private recordId = 0;

  readonly snOptions = [
    { label: 'Sí', value: 'S' },
    { label: 'No', value: 'N' },
  ];

  form!: FormGroup;

  ngOnInit() {
    this.form = this.fb.group({
      usuario: ['', Validators.required],
      sn_auth_anulaciones: ['N'],
      sn_auth_facturacion: ['N'],
      sn_auth_contabilizar: ['N'],
      sn_auth_devoluciones: ['N'],
      sn_auth_reversion: ['N'],
    });

    this.usuariosService.getAll().subscribe({ next: (d) => this.usuarios.set(d) });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.esEdicion.set(true);
      this.titulo.set('Editar permisos');
      this.recordId = Number(id);
      this.cargando.set(true);
      this.service.getOne(this.recordId).subscribe({
        next: (r) => {
          this.form.patchValue({
            usuario: r.usuario,
            sn_auth_anulaciones: r.sn_auth_anulaciones === 'S' ? 'S' : 'N',
            sn_auth_facturacion: r.sn_auth_facturacion === 'S' ? 'S' : 'N',
            sn_auth_contabilizar: r.sn_auth_contabilizar === 'S' ? 'S' : 'N',
            sn_auth_devoluciones: r.sn_auth_devoluciones === 'S' ? 'S' : 'N',
            sn_auth_reversion: r.sn_auth_reversion === 'S' ? 'S' : 'N',
          });
          this.form.get('usuario')?.disable();
          this.cargando.set(false);
        },
        error: () => {
          this.cargando.set(false);
          this.msgs.add({ severity: 'error', summary: 'Error', detail: 'Permisos no encontrados' });
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
    const dto = {
      usuario: raw.usuario,
      sn_auth_anulaciones: raw.sn_auth_anulaciones,
      sn_auth_facturacion: raw.sn_auth_facturacion,
      sn_auth_contabilizar: raw.sn_auth_contabilizar,
      sn_auth_devoluciones: raw.sn_auth_devoluciones,
      sn_auth_reversion: raw.sn_auth_reversion,
    };

    this.guardando.set(true);
    const op = this.esEdicion()
      ? this.service.update(this.recordId, dto)
      : this.service.create(dto);

    op.subscribe({
      next: () => {
        this.guardando.set(false);
        this.msgs.add({
          severity: 'success',
          summary: 'Guardado',
          detail: this.esEdicion() ? 'Permisos actualizados' : 'Permisos creados correctamente',
        });
        this.volver();
      },
      error: () => {
        this.guardando.set(false);
        this.msgs.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron guardar los permisos',
        });
      },
    });
  }
}