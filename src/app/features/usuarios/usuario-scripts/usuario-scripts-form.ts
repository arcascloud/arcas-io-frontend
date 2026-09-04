import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { UsuariosScriptsService } from '../../../core/services/usuarios-scripts.service';
import { UsuariosService } from '../../../core/services/usuarios.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-usuario-scripts-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, InputTextModule, SelectModule],
  templateUrl: './usuario-scripts-form.html',
  styleUrl: './usuario-scripts-form.scss',
})
export class UsuarioScriptsForm implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(UsuariosScriptsService);
  private usuariosService = inject(UsuariosService);
  private auth = inject(AuthService);
  private msgs = inject(MessageService);

  guardando = signal(false);
  titulo = signal('Asignar Script');
  usuarios = signal<{ usuario: string; nombre: string }[]>([]);

  form!: FormGroup;

  ngOnInit() {
    this.form = this.fb.group({
      usuario: ['', Validators.required],
      script: ['', Validators.required],
    });

    this.usuariosService.getAll().subscribe({ next: (d) => this.usuarios.set(d) });
  }

  invalid(ctrl: string): boolean {
    const c = this.form.get(ctrl);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  cancel() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    this.guardando.set(true);
    this.service
      .create({
        usuario: raw.usuario,
        script: raw.script,
        empresaId: this.auth.currentUser()?.empresaId ?? 0,
      })
      .subscribe({
        next: () => {
          this.guardando.set(false);
          this.msgs.add({
            severity: 'success',
            summary: 'Guardado',
            detail: 'Script asignado correctamente',
          });
          this.cancel();
        },
        error: () => {
          this.guardando.set(false);
          this.msgs.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo asignar el script',
          });
        },
      });
  }
}