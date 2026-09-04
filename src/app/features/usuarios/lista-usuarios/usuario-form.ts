import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { UsuariosService } from '../../../core/services/usuarios.service';
import { EmpresasService } from '../../../core/services/empresas.service';
import { SucursalesService } from '../../../core/services/sucursales.service';
import { AuthService } from '../../../core/services/auth.service';
import { Empresa } from '../../../core/models/empresa.models';
import { Sucursal } from '../../../core/models/sucursal.models';

@Component({
  selector: 'app-usuario-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    SelectButtonModule,
    SelectModule,
  ],
  templateUrl: './usuario-form.html',
  styleUrl: './usuario-form.scss',
})
export class UsuarioForm implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(UsuariosService);
  private empresasSvc = inject(EmpresasService);
  private sucursalesSvc = inject(SucursalesService);
  private auth = inject(AuthService);
  private msgs = inject(MessageService);

  esEdicion = signal(false);
  cargando = signal(false);
  guardando = signal(false);
  titulo = signal('Nuevo usuario');
  errorPassword = signal('');
  empresas = signal<Empresa[]>([]);
  sucursales = signal<Sucursal[]>([]);
  empresasCargando = signal(false);
  sucursalesCargando = signal(false);

  readonly snOptions = [
    { label: 'Activo', value: 'S' },
    { label: 'Inactivo', value: 'N' },
  ];

  private usuarioId = '';

  form!: FormGroup;

  ngOnInit() {
    this.form = this.fb.group({
      usuario: ['', Validators.required],
      nombre: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: [''],
      sn_activo: ['S' as 'S' | 'N'],
      empresaId: [null as number | null, Validators.required],
      Idsucursal: [null as number | null, Validators.required],
    });

    this.cargarEmpresas();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.esEdicion.set(true);
      this.titulo.set('Editar usuario');
      this.usuarioId = id;
      this.cargando.set(true);
      this.service.getOne(id).subscribe({
        next: (u) => {
          this.form.patchValue({
            usuario: u.usuario,
            nombre: u.nombre,
            email: u.email,
            sn_activo: u.sn_activo,
            empresaId: u.empresaId,
          });
          this.cargarSucursales(u.empresaId, u.Idsucursal);
          this.cargando.set(false);
        },
        error: () => {
          this.cargando.set(false);
          this.msgs.add({ severity: 'error', summary: 'Error', detail: 'Usuario no encontrado' });
          this.volver();
        },
      });
    } else {
      const empresaId = this.auth.currentUser()?.empresaId;
      if (empresaId) {
        this.form.get('empresaId')?.setValue(empresaId);
        this.cargarSucursales(empresaId);
      }
    }
  }

  private cargarEmpresas() {
    this.empresasCargando.set(true);
    this.empresasSvc.getAll().subscribe({
      next: (list) => {
        const actual = this.auth.currentUser()?.empresaId;
        this.empresas.set(list.filter((e) => e.sn_activo === 'S' || e.empresaId === actual));
        this.empresasCargando.set(false);
      },
      error: () => {
        this.empresasCargando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las empresas' });
      },
    });
  }

  private cargarSucursales(empresaId: number, seleccionarId?: number) {
    this.sucursalesCargando.set(true);
    this.sucursalesSvc.getAll(empresaId).subscribe({
      next: (list) => {
        this.sucursales.set(list.filter((s) => s.sn_activo === 'S'));
        if (seleccionarId !== undefined) {
          this.form.get('Idsucursal')?.patchValue(seleccionarId);
        }
        this.sucursalesCargando.set(false);
      },
      error: () => {
        this.sucursales.set([]);
        this.sucursalesCargando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las sucursales' });
      },
    });
  }

  onEmpresaChange(event: { value: number }) {
    this.form.get('Idsucursal')?.reset();
    if (event.value) {
      this.cargarSucursales(event.value);
    }
  }

  invalid(ctrl: string): boolean {
    const c = this.form.get(ctrl);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  volver() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  validarPassword(pw: string): boolean {
    if (!pw && !this.esEdicion()) {
      this.form.get('password')?.setErrors({ required: true });
      this.errorPassword.set('');
      return false;
    }
    if (!pw) {
      this.errorPassword.set('');
      return true;
    }
    if (pw.length < 8) {
      this.errorPassword.set('Debe tener al menos 8 caracteres');
      return false;
    }
    if (!/[A-Z]/.test(pw)) {
      this.errorPassword.set('Debe contener una letra mayúscula');
      return false;
    }
    if (!/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\;'/]/.test(pw)) {
      this.errorPassword.set('Debe contener un carácter especial');
      return false;
    }
    this.errorPassword.set('');
    return true;
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    if (!this.validarPassword(raw.password || '')) return;

    this.guardando.set(true);

    if (this.esEdicion()) {
      const dto: Record<string, unknown> = {
        nombre: raw.nombre,
        email: raw.email,
        sn_activo: raw.sn_activo,
        Idsucursal: raw.Idsucursal,
      };
      if (raw.password) {
        dto['password'] = raw.password;
      }
      this.service.update(this.usuarioId, dto as any).subscribe({
        next: () => {
          this.guardando.set(false);
          this.msgs.add({ severity: 'success', summary: 'Guardado', detail: 'Usuario actualizado' });
          this.volver();
        },
        error: () => {
          this.guardando.set(false);
          this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el usuario' });
        },
      });
    } else {
      this.service
        .create({
          usuario: raw.usuario,
          nombre: raw.nombre,
          email: raw.email,
          password: raw.password,
          empresaId: raw.empresaId,
          Idsucursal: raw.Idsucursal,
          sn_activo: 'S',
        } as any)
        .subscribe({
          next: () => {
            this.guardando.set(false);
            this.msgs.add({ severity: 'success', summary: 'Guardado', detail: 'Usuario creado correctamente' });
            this.volver();
          },
          error: () => {
            this.guardando.set(false);
            this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el usuario' });
          },
        });
    }
  }
}