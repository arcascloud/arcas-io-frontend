import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageService } from 'primeng/api';
import { PlanillaService } from '../../../core/services/planilla.service';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-empleado-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    SelectButtonModule,
    DatePickerModule,
  ],
  templateUrl: './empleado-form.html',
  styleUrl: './empleado-form.scss',
})
export class EmpleadoForm implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(PlanillaService);
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private msgs = inject(MessageService);

  esEdicion = signal(false);
  cargando = signal(false);
  guardando = signal(false);
  titulo = signal('Nuevo empleado');

  paises = signal<{ label: string; value: any }[]>([]);
  profesiones = signal<{ label: string; value: any }[]>([]);
  puestos = signal<{ label: string; value: any }[]>([]);

  readonly snOptions = [
    { label: 'Activo', value: 'S' },
    { label: 'Inactivo', value: 'N' },
  ];

  readonly sexoOptions = [
    { label: 'Masculino', value: 'M' },
    { label: 'Femenino', value: 'F' },
    { label: 'Otro', value: 'T' },
  ];

  readonly estadoCivilOptions = [
    { label: 'Soltero', value: 'S' },
    { label: 'Casado', value: 'C' },
    { label: 'Viudo', value: 'V' },
    { label: 'Divorciado', value: 'D' },
    { label: 'Unión libre', value: 'U' },
  ];

  private empleadoId = 0;

  form!: FormGroup;

  ngOnInit() {
    this.form = this.fb.group({
      nombres: ['', Validators.required],
      apellidos: ['', Validators.required],
      nrodocumento: ['', Validators.required],
      fechanacimiento: [null as Date | null],
      sexo: ['M' as 'M' | 'F' | 'T'],
      estadocivil: ['S' as 'S' | 'C' | 'V' | 'D' | 'U'],
      paisorigen: [null as number | null],
      paisresidencia: [null as number | null],
      nroseguro: [''],
      telefono: [''],
      celular: [''],
      email: [''],
      profesionId: [null as number | null],
      puestoId: [null as number | null],
      sueldobruto: [0],
      techoseguro: [0],
      cuentabancaria: [''],
      lugardenacimiento: [''],
      tipoempId: [0, Validators.required],
      sn_activo: ['S' as 'S' | 'N'],
    });

    this.cargarOpciones();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.esEdicion.set(true);
      this.titulo.set('Editar empleado');
      this.empleadoId = Number(id);
      this.cargando.set(true);
      this.service.getEmpleado(this.empleadoId).subscribe({
        next: (e) => {
          this.form.patchValue({
            nombres: e.nombres,
            apellidos: e.apellidos,
            nrodocumento: e.nrodocumento,
            fechanacimiento: e.fechanacimiento ? new Date(e.fechanacimiento) : null,
            sexo: e.sexo,
            estadocivil: e.estadocivil,
            paisorigen: e.paisorigen,
            paisresidencia: e.paisresidencia,
            nroseguro: e.nroseguro,
            telefono: e.telefono,
            celular: e.celular,
            email: e.email,
            profesionId: e.profesionId,
            puestoId: e.puestoId,
            sueldobruto: Number(e.sueldobruto),
            techoseguro: Number(e.techoseguro),
            cuentabancaria: e.cuentabancaria,
            lugardenacimiento: e.lugardenacimiento,
            tipoempId: e.tipoempId,
            sn_activo: e.sn_activo === 'S' ? 'S' : 'N',
          });
          this.cargando.set(false);
        },
        error: () => {
          this.cargando.set(false);
          this.msgs.add({ severity: 'error', summary: 'Error', detail: 'Empleado no encontrado' });
          this.volver();
        },
      });
    }
  }

  private cargarOpciones() {
    this.api.get<any[]>('/parametros/paises').subscribe((items) => {
      this.paises.set((items ?? []).map((i) => ({ label: String(i.descripcion ?? i.paisId), value: i.paisId })));
    });
    this.api.get<any[]>('/planilla/profesiones').subscribe((items) => {
      this.profesiones.set((items ?? []).map((i) => ({ label: String(i.descripcion), value: i.profesionId })));
    });
    this.api.get<any[]>('/planilla/puestos').subscribe((items) => {
      this.puestos.set((items ?? []).map((i) => ({ label: String(i.descripcion), value: i.puestosId })));
    });
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
    raw.paisorigen = raw.paisorigen ?? null;
    raw.paisresidencia = raw.paisresidencia ?? null;

    const payload = this.esEdicion()
      ? { ...raw }
      : {
          ...raw,
          empresaId: this.auth.currentUser()?.empresaId,
          sn_activo: 'S',
        };

    this.guardando.set(true);
    const op = this.esEdicion()
      ? this.service.updateEmpleado(this.empleadoId, payload as any)
      : this.service.createEmpleado(payload as any);

    op.subscribe({
      next: () => {
        this.guardando.set(false);
        this.msgs.add({
          severity: 'success',
          summary: 'Guardado',
          detail: this.esEdicion() ? 'Empleado actualizado' : 'Empleado creado correctamente',
        });
        this.volver();
      },
      error: () => {
        this.guardando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el empleado' });
      },
    });
  }
}