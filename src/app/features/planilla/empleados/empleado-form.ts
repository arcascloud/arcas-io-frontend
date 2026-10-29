import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
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
import { NavegacionService } from '../../../core/services/navegacion.service';

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
  private service = inject(PlanillaService);
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private msgs = inject(MessageService);
  private nav = inject(NavegacionService);
  private destroyRef = inject(DestroyRef);

  esEdicion = signal(false);
  cargando = signal(false);
  guardando = signal(false);
  /** Procesando el lote "Dar derechos laborales" */
  aplicando = signal(false);
  titulo = signal('Nuevo empleado');

  paises = signal<{ label: string; value: any }[]>([]);
  profesiones = signal<{ label: string; value: any }[]>([]);
  puestos = signal<{ label: string; value: any }[]>([]);
  sucursales = signal<{ label: string; value: any }[]>([]);
  deptos = signal<{ label: string; value: any }[]>([]);
  tipoEmpleado = signal<{ label: string; value: any }[]>([]);
  jefes = signal<{ label: string; value: any }[]>([]);
  /** Mapa deptoId → empleadoId (jefe del departamento) */
  private deptoJefeMap = new Map<number, number>();

  fotoUrl = signal<string | null>(null);
  fotoFile: File | null = null;

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

  /** Horas de la jornada diaria (base del valor de la hora en horas extras). */
  readonly jornadaOptions = [
    { label: 'Diurna (8 h)', value: 'D' },
    { label: 'Mixta (7 h)', value: 'M' },
    { label: 'Nocturna (6 h)', value: 'N' },
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
      profesionId: [null as number | null],
      puestoId: [null as number | null],
      sueldobruto: [0],
      nroseguro: [''],
      celular: [''],
      telefono: [''],
      email: ['', Validators.required],
      tipoempId: [0, Validators.required],
      techoseguro: [0],
      Idsucursal: [null as number | null],
      deptoId: [null as number | null],
      jefeId: [null as number | null],
      cuentabancaria: [''],
      fecha_alta: [null as Date | null],
      fecha_baja: [null as Date | null],
      paisorigen: [null as number | null],
      paisresidencia: [null as number | null],
      lugardenacimiento: [''],
      sn_jornada: ['D' as 'D' | 'M' | 'N'],
      sn_activo: ['S' as 'S' | 'N'],
    });

    this.cargarOpciones();

    // Al cambiar departamento, auto-setear jefe inmediato desde ttipodeptoempresa.empleadoId
    this.form.get('deptoId')!.valueChanges.subscribe((deptoId: number | null) => {
      if (deptoId != null) {
        const jefe = this.deptoJefeMap.get(deptoId);
        this.form.patchValue({ jefeId: jefe ?? null }, { emitEvent: false });
      } else {
        this.form.patchValue({ jefeId: null }, { emitEvent: false });
      }
    });

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
            profesionId: e.profesionId,
            puestoId: e.puestoId,
            sueldobruto: Number(e.sueldobruto),
            nroseguro: e.nroseguro,
            celular: e.celular,
            telefono: e.telefono,
            email: e.email,
            tipoempId: e.tipoempId,
            techoseguro: Number(e.techoseguro),
            Idsucursal: e.Idsucursal,
            deptoId: (e as any).deptoId ?? null,
            jefeId: (e as any).jefeId ?? null,
            cuentabancaria: e.cuentabancaria,
            fecha_alta: (e as any).fecha_alta ? new Date((e as any).fecha_alta) : null,
            fecha_baja: (e as any).fecha_baja ? new Date((e as any).fecha_baja) : null,
            paisorigen: e.paisorigen,
            paisresidencia: e.paisresidencia,
            lugardenacimiento: e.lugardenacimiento,
            sn_jornada: e.sn_jornada ?? 'D',
            sn_activo: e.sn_activo === 'S' ? 'S' : 'N',
          });
          const fotoRaw = (e as any).foto;
          if (fotoRaw) {
            if (typeof fotoRaw === 'string') {
              this.fotoUrl.set('data:image/jpeg;base64,' + fotoRaw);
            } else if (fotoRaw.type === 'Buffer' && Array.isArray(fotoRaw.data)) {
              const bytes = new Uint8Array(fotoRaw.data);
              let binary = '';
              for (let i = 0; i < bytes.length; i++) {
                binary += String.fromCharCode(bytes[i]);
              }
              this.fotoUrl.set('data:image/jpeg;base64,' + btoa(binary));
            }
          }
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
    this.api.get<any[]>('/sucursales').subscribe((items) => {
      this.sucursales.set((items ?? []).map((i) => ({ label: String(i.descripcion), value: i.Idsucursal })));
    });
    this.api.get<any[]>('/parametros/departamentos-empresa').subscribe((items) => {
      this.deptoJefeMap.clear();
      for (const i of items ?? []) {
        this.deptoJefeMap.set(i.deptoId, i.empleadoId);
      }
      this.deptos.set((items ?? []).map((i) => ({ label: String(i.descripcion), value: i.deptoId })));
    });
    this.api.get<any[]>('/planilla/tipo-empleado').subscribe((items) => {
      this.tipoEmpleado.set((items ?? []).map((i) => ({ label: String(i.descripcion), value: i.tipoempleadoId })));
    });
    this.api.get<any[]>('/planilla/empleados').subscribe((items) => {
      this.jefes.set((items ?? []).map((i) => ({
        label: `${i.apellidos} ${i.nombres}`,
        value: i.empleadoId,
      })));
    });
  }

  onFotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    this.fotoFile = file;
    const reader = new FileReader();
    reader.onload = () => this.fotoUrl.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  quitarFoto() {
    this.fotoFile = null;
    this.fotoUrl.set(null);
  }

  invalid(ctrl: string): boolean {
    const c = this.form.get(ctrl);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  volver() {
    this.nav.volver(['/planilla/empleados']);
  }

  /**
   * Botón "Dar derechos laborales".
   * Registra en pletipomov los tipos de movimiento con sn_obligatoria='S'.
   * La retención en la fuente (ISR) no toma el importe del catálogo: se
   * calcula con la tabla progresiva tcoisr sobre el ingreso anual del
   * empleado (sueldobruto × meses desde fecha_alta hasta fecha de sistema).
   */
  darDerechosLaborales(): void {
    if (!this.empleadoId) {
      this.msgs.add({
        severity: 'warn',
        summary: 'Empleado sin guardar',
        detail: 'Guarde el empleado antes de darle los derechos laborales.',
      });
      return;
    }

    this.aplicando.set(true);
    this.api
      .post<any>('/planilla/empleado-tipo-mov/derechos-laborales', {
        empleadoId: this.empleadoId,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.aplicando.set(false);
          this.msgs.add({
            severity: 'success',
            summary: 'Derechos laborales',
            detail: res?.mensaje ?? 'Proceso completado',
          });
            const aport = res?.aportaciones;
            if (aport?.movimientos?.length) {
              const t = aport.totales;
              const n = (v: any) => Number(v).toFixed(2);
              const detalle = aport.movimientos
                .map((m: any) => {
                  // RAP: dos fondos con bases distintas (vivienda sobre excedente + reserva sobre salario)
                  if (m.excedente != null) {
                    return (
                      `${m.abreviatura}: emp L ${n(m.empleado)}` +
                      ` (vivienda ${m.pctVivienda}% sobre excedente L ${n(m.excedente)})` +
                      ` / pat L ${n(m.patron)}` +
                      ` (vivienda L ${n(m.viviendaPatrono)} + reserva ${m.pctReserva}% L ${n(m.reservaPatrono)})`
                    );
                  }
                  // IHSS: desglose Salud + IVM
                  return (
                    `${m.abreviatura}: emp L ${n(m.empleado)}` +
                    (m.salud != null && m.ivm != null
                      ? ` (Salud ${n(m.salud)} + IVM ${n(m.ivm)})`
                      : '') +
                    ` / pat L ${n(m.patron)}`
                  );
                })
                .join(' · ');
              this.msgs.add({
                severity: 'info',
                summary: 'Aportaciones (mensual)',
                detail:
                  `${detalle} → empleado L ${n(t.empleado)}` +
                  ` + patrono L ${n(t.patrono)} = total L ${n(t.total)}.`,
              });
            }
            const prest = res?.prestaciones;
            if (prest?.movimientos?.length) {
              const n = (v: any) => Number(v).toFixed(2);
              const detalle = prest.movimientos
                .map(
                  (m: any) =>
                    `${m.abreviatura}: L ${n(m.monto)}` +
                    ` (salario L ${n(m.sueldobruto)} × ${m.meses}/12` +
                    `${m.proporcional ? ' · proporcional' : ' · año completo'})`,
                )
                .join(' · ');
              this.msgs.add({
                severity: 'info',
                summary: 'Prestaciones (anual)',
                detail: `${detalle} = total L ${n(prest.totales.monto)}.`,
              });
            }
            const isr = res?.isr;
            if (isr?.debeRetener) {
              this.msgs.add({
                severity: 'info',
                summary: 'Retención en la fuente (ISR)',
                detail:
                  `Ingreso anual L ${Number(isr.ingresoAnual).toFixed(2)} en ${isr.meses} mes(es). ` +
                  `ISR anual a retener: L ${Number(isr.isr).toFixed(2)}.`,
              });
            }
            const vec = res?.vecinal;
            if (vec?.debeRetener) {
              this.msgs.add({
                severity: 'info',
                summary: 'Impuesto Vecinal',
                detail:
                  `Ingreso anual L ${Number(vec.ingresoAnual).toFixed(2)} en ${vec.meses} mes(es) ` +
                  `(ventana 1 jun–31 may). Vecinal anual a retener: L ${Number(vec.vecinal).toFixed(2)}.`,
              });
            }
        },
        error: (err: any) => {
          this.aplicando.set(false);
          const msg = err?.error?.message;
          this.msgs.add({
            severity: 'error',
            summary: 'No se pudieron dar los derechos',
            detail: Array.isArray(msg) ? msg.join(' · ') : msg || 'Error inesperado',
          });
        },
      });
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    raw.paisorigen = raw.paisorigen ?? null;
    raw.paisresidencia = raw.paisresidencia ?? null;
    raw.deptoId = raw.deptoId ?? null;
    raw.jefeId = raw.jefeId ?? null;
    raw.Idsucursal = raw.Idsucursal ?? null;
    raw.fecha_alta = raw.fecha_alta ? raw.fecha_alta.toISOString() : null;
    raw.fecha_baja = raw.fecha_baja ? raw.fecha_baja.toISOString() : null;

    // Enviar foto como base64 puro (sin prefijo data:image)
    if (this.fotoUrl()) {
      raw.foto = this.fotoUrl()!.replace(/^data:image\/[a-z]+;base64,/, '');
    } else {
      raw.foto = null;
    }

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
