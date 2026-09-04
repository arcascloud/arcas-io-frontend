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
import { ProveedoresService } from '../../../core/services/proveedores.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-proveedor-form',
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
  templateUrl: './proveedor-form.html',
  styleUrl: './proveedor-form.scss',
})
export class ProveedorForm implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(ProveedoresService);
  private auth = inject(AuthService);
  private msgs = inject(MessageService);

  esEdicion = signal(false);
  cargando = signal(false);
  guardando = signal(false);
  titulo = signal('Nuevo proveedor');

  readonly snOptions = [
    { label: 'Activo', value: 'S' },
    { label: 'Inactivo', value: 'N' },
  ];

  readonly sexoOptions = [
    { label: 'Masculino', value: 'M' },
    { label: 'Femenino', value: 'F' },
  ];

  readonly estadoCivilOptions = [
    { label: 'Soltero', value: 'S' },
    { label: 'Casado', value: 'C' },
    { label: 'Divorciado', value: 'D' },
    { label: 'Viudo', value: 'V' },
    { label: 'Unión libre', value: 'U' },
  ];

  readonly categoriaOptions = [
    { label: 'A', value: 'A' },
    { label: 'B', value: 'B' },
    { label: 'C', value: 'C' },
    { label: 'D', value: 'D' },
    { label: 'E', value: 'E' },
  ];

  private proveedorId = 0;

  form!: FormGroup;

  ngOnInit() {
    this.form = this.fb.group({
      nroproveedor: ['', Validators.required],
      nombres: ['', Validators.required],
      apellidos: ['', Validators.required],
      razonsocial: [''],
      dni: [''],
      sexo: ['M' as 'M' | 'F'],
      estadocivil: ['S' as 'S' | 'C' | 'D' | 'V' | 'U'],
      rtn: [''],
      limiteCredito: [0],
      diasplazo: [0],
      interes: [0],
      moratorio: [0],
      categoria: ['A' as 'A' | 'B' | 'C' | 'D' | 'E'],
      sn_activo: ['S' as 'S' | 'N'],
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.esEdicion.set(true);
      this.titulo.set('Editar proveedor');
      this.proveedorId = Number(id);
      this.cargando.set(true);
      this.service.getOne(this.proveedorId).subscribe({
        next: (p) => {
          this.form.patchValue({
            nroproveedor: p.nroproveedor,
            nombres: p.nombres,
            apellidos: p.apellidos,
            razonsocial: p.razonsocial,
            dni: p.dni,
            sexo: p.sexo,
            estadocivil: p.estadocivil,
            rtn: p.rtn,
            limiteCredito: Number(p.limiteCredito),
            diasplazo: Number(p.diasplazo),
            interes: Number(p.interes),
            moratorio: Number(p.moratorio),
            categoria: p.categoria,
            sn_activo: p.sn_activo === 'S' ? 'S' : 'N',
          });
          this.cargando.set(false);
        },
        error: () => {
          this.cargando.set(false);
          this.msgs.add({ severity: 'error', summary: 'Error', detail: 'Proveedor no encontrado' });
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
      ? {
          nroproveedor: raw.nroproveedor,
          nombres: raw.nombres,
          apellidos: raw.apellidos,
          razonsocial: raw.razonsocial,
          dni: raw.dni,
          sexo: raw.sexo,
          estadocivil: raw.estadocivil,
          rtn: raw.rtn,
          limiteCredito: raw.limiteCredito,
          diasplazo: raw.diasplazo,
          interes: raw.interes,
          moratorio: raw.moratorio,
          categoria: raw.categoria,
          sn_activo: raw.sn_activo,
        }
      : {
          nroproveedor: raw.nroproveedor,
          nombres: raw.nombres,
          apellidos: raw.apellidos,
          razonsocial: raw.razonsocial,
          dni: raw.dni,
          sexo: raw.sexo,
          estadocivil: raw.estadocivil,
          rtn: raw.rtn,
          limiteCredito: raw.limiteCredito,
          diasplazo: raw.diasplazo,
          interes: raw.interes,
          moratorio: raw.moratorio,
          categoria: raw.categoria,
          empresaId: this.auth.currentUser()?.empresaId,
          sn_activo: 'S',
        };

    this.guardando.set(true);
    const op = this.esEdicion()
      ? this.service.update(this.proveedorId, payload as any)
      : this.service.create(payload as any);

    op.subscribe({
      next: () => {
        this.guardando.set(false);
        this.msgs.add({
          severity: 'success',
          summary: 'Guardado',
          detail: this.esEdicion() ? 'Proveedor actualizado' : 'Proveedor creado correctamente',
        });
        this.volver();
      },
      error: () => {
        this.guardando.set(false);
        this.msgs.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo guardar el proveedor',
        });
      },
    });
  }
}