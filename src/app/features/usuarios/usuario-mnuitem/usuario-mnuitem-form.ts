import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { MessageService } from 'primeng/api';
import { UsuariosMnuItemService } from '../../../core/services/usuarios-mnuitem.service';
import { UsuariosService } from '../../../core/services/usuarios.service';
import { ModulosService } from '../../../core/services/modulos.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-usuario-mnuitem-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    SelectButtonModule,
  ],
  templateUrl: './usuario-mnuitem-form.html',
  styleUrl: './usuario-mnuitem-form.scss',
})
export class UsuarioMnuItemForm implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(UsuariosMnuItemService);
  private usuariosService = inject(UsuariosService);
  private modulosService = inject(ModulosService);
  private auth = inject(AuthService);
  private msgs = inject(MessageService);

  esEdicion = signal(false);
  cargando = signal(false);
  guardando = signal(false);
  titulo = signal('Nuevo menu item');

  usuarios = signal<{ usuario: string; nombre: string }[]>([]);
  modulos = signal<{ moduloId: number; descripcion: string }[]>([]);

  readonly snOptions = [
    { label: 'Activo', value: 'S' },
    { label: 'Inactivo', value: 'N' },
  ];

  private recordId = 0;

  form!: FormGroup;

  ngOnInit() {
    this.form = this.fb.group({
      usuario: ['', Validators.required],
      moduloId: [null as number | null, Validators.required],
      nameItem: ['', Validators.required],
      labelItem: ['', Validators.required],
      routerLink: [''],
      iconItem: [''],
      parentId: [0],
      levelId: [0],
      sn_activo: ['S', Validators.required],
    });

    this.usuariosService.getAll().subscribe({ next: (d) => this.usuarios.set(d) });
    this.modulosService.getAll().subscribe({ next: (d) => this.modulos.set(d) });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.esEdicion.set(true);
      this.titulo.set('Editar menu item');
      this.recordId = Number(id);
      this.cargando.set(true);
      this.service.getOne(this.recordId).subscribe({
        next: (r) => {
          this.form.patchValue({
            usuario: r.usuario,
            moduloId: r.moduloId,
            nameItem: r.nameItem,
            labelItem: r.labelItem,
            routerLink: r.routerLink ?? '',
            iconItem: r.iconItem ?? '',
            parentId: r.parentId,
            levelId: r.levelId,
            sn_activo: r.sn_activo === 'S' ? 'S' : 'N',
          });
          this.form.get('usuario')?.disable();
          this.form.get('moduloId')?.disable();
          this.cargando.set(false);
        },
        error: () => {
          this.cargando.set(false);
          this.msgs.add({ severity: 'error', summary: 'Error', detail: 'Item no encontrado' });
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
      nameItem: raw.nameItem,
      labelItem: raw.labelItem,
      routerLink: raw.routerLink,
      iconItem: raw.iconItem,
      parentId: Number(raw.parentId) || 0,
      levelId: Number(raw.levelId) || 0,
    };

    this.guardando.set(true);
    const op = this.esEdicion()
      ? this.service.update(this.recordId, data)
      : this.service.create({
          ...data,
          parent: 0,
          nameParent: '',
          empresaId: this.auth.currentUser()?.empresaId ?? 0,
          sn_activo: raw.sn_activo,
        });

    op.subscribe({
      next: () => {
        this.guardando.set(false);
        this.msgs.add({
          severity: 'success',
          summary: 'Guardado',
          detail: this.esEdicion() ? 'Item actualizado' : 'Item creado correctamente',
        });
        this.volver();
      },
      error: () => {
        this.guardando.set(false);
        this.msgs.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo guardar el item',
        });
      },
    });
  }
}