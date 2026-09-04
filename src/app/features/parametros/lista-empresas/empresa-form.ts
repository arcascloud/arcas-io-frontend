import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
import { EmpresasService } from '../../../core/services/empresas.service';
import { EmpresaDet } from '../../../core/models/empresa.models';

@Component({
  selector: 'app-empresa-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    SelectButtonModule,
    SelectModule,
    TableModule,
    DialogModule,
  ],
  templateUrl: './empresa-form.html',
  styleUrl: './empresa-form.scss',
})
export class EmpresaForm implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(EmpresasService);
  private msgs = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  esEdicion = signal(false);
  cargando = signal(false);
  guardando = signal(false);
  titulo = signal('Nueva empresa');

  private empresaId = 0;

  detalles = signal<EmpresaDet[]>([]);
  dialogDet = signal(false);
  detEditando = signal<EmpresaDet | null>(null);
  detForm!: FormGroup;
  guardandoDet = signal(false);

  readonly snOptions = [
    { label: 'Activo', value: 'S' },
    { label: 'Inactivo', value: 'N' },
  ];

  readonly tipoOptions = [
    { label: 'RTN', value: 'RTN' },
    { label: 'Dirección', value: 'DIRECCION' },
    { label: 'Teléfono', value: 'TELEFONO' },
    { label: 'Correo', value: 'CORREO' },
    { label: 'RUC', value: 'RUC' },
    { label: 'Website', value: 'WEBSITE' },
    { label: 'Red Social', value: 'REDESOCIAL' },
  ];

  form!: FormGroup;

  ngOnInit() {
    this.form = this.fb.group({
      descripcion: ['', Validators.required],
      msjfactura: [''],
      msjdevfactura: [''],
      sn_activo: ['S', Validators.required],
    });

    this.detForm = this.fb.group({
      tipo: ['RTN', Validators.required],
      descripcion: ['', Validators.required],
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.esEdicion.set(true);
      this.titulo.set('Editar empresa');
      this.empresaId = Number(id);
      this.cargando.set(true);
      this.service.getOne(this.empresaId).subscribe({
        next: (e) => {
          this.form.patchValue({
            descripcion: e.descripcion,
            msjfactura: e.msjfactura,
            msjdevfactura: e.msjdevfactura,
            sn_activo: e.sn_activo === 'S' ? 'S' : 'N',
          });
          this.cargando.set(false);
          this.cargarDetalles();
        },
        error: () => {
          this.cargando.set(false);
          this.msgs.add({ severity: 'error', summary: 'Error', detail: 'Empresa no encontrada' });
          this.volver();
        },
      });
    }
  }

  private cargarDetalles() {
    this.service.getAllDet().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (items) => this.detalles.set(items),
    });
  }

  invalid(ctrl: string): boolean {
    const c = this.form.get(ctrl);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  invalidDet(ctrl: string): boolean {
    const c = this.detForm.get(ctrl);
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
      ? {
          descripcion: raw.descripcion,
          msjfactura: raw.msjfactura,
          msjdevfactura: raw.msjdevfactura,
          sn_activo: raw.sn_activo,
        }
      : {
          descripcion: raw.descripcion,
          msjfactura: raw.msjfactura,
          msjdevfactura: raw.msjdevfactura,
        };

    this.guardando.set(true);
    const op = this.esEdicion()
      ? this.service.update(this.empresaId, payload)
      : this.service.create(payload);

    op.subscribe({
      next: (res) => {
        if (!this.esEdicion() && res.empresaId) {
          this.empresaId = res.empresaId;
          this.esEdicion.set(true);
          this.titulo.set('Editar empresa');
        }
        this.guardando.set(false);
        this.msgs.add({
          severity: 'success',
          summary: 'Guardado',
          detail: this.esEdicion() ? 'Empresa actualizada' : 'Empresa creada correctamente',
        });
        if (!this.esEdicion()) this.volver();
      },
      error: () => {
        this.guardando.set(false);
        this.msgs.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo guardar la empresa',
        });
      },
    });
  }

  abrirDet(det?: EmpresaDet) {
    this.detEditando.set(det || null);
    if (det) {
      this.detForm.patchValue({ tipo: det.tipo, descripcion: det.descripcion });
    } else {
      this.detForm.reset({ tipo: 'RTN', descripcion: '' });
    }
    this.dialogDet.set(true);
  }

  guardarDet() {
    if (this.detForm.invalid) {
      this.detForm.markAllAsTouched();
      return;
    }
    const raw = this.detForm.getRawValue();
    this.guardandoDet.set(true);

    const edit = this.detEditando();
    const op = edit
      ? this.service.updateDet(edit.empresasdetId, raw)
      : this.service.createDet(raw);

    op.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.guardandoDet.set(false);
        this.dialogDet.set(false);
        this.msgs.add({ severity: 'success', summary: 'Guardado', detail: edit ? 'Dato actualizado' : 'Dato agregado' });
        this.cargarDetalles();
      },
      error: () => {
        this.guardandoDet.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar' });
      },
    });
  }

  eliminarDet(det: EmpresaDet) {
    this.service.removeDet(det.empresasdetId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.msgs.add({ severity: 'success', summary: 'Eliminado', detail: `${det.tipo} eliminado` });
        this.cargarDetalles();
      },
      error: () => {
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar' });
      },
    });
  }

  tipoLabel(tipo: string): string {
    return this.tipoOptions.find((o) => o.value === tipo)?.label || tipo;
  }
}