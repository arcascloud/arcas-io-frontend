import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { PlanillaService } from '../../../core/services/planilla.service';
import { ApiService } from '../../../core/services/api.service';
import { PlanillaEmpleado } from '../../../core/models/planilla.models';

interface PlTipoMov {
  pletipomovId: number;
  empleadoId: number;
  tipomovId: number;
  aplicacion: string;
  tipoimporte: string;
  importe: number | string;
  /** Aporte a cargo del patrono */
  imppatron?: number | string;
  sn_activo: string;
  empresaId: number;
  descripcionTipo?: string;
  abreviaturaTipo?: string;
  tipomov?: string;
}

@Component({
  selector: 'app-empleado-tipo-mov-manager',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    SelectButtonModule,
    TableModule,
    TagModule,
    TooltipModule,
  ],
  templateUrl: './empleado-tipo-mov-manager.html',
  styleUrl: './empleado-tipo-mov-manager.scss',
})
export class EmpleadoTipoMovManager implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(PlanillaService);
  private api = inject(ApiService);
  private msgs = inject(MessageService);

  cargando = signal(false);
  guardando = signal(false);
  empleado = signal<PlanillaEmpleado | null>(null);
  movimientos = signal<PlTipoMov[]>([]);
  tipoMovOpciones = signal<{ label: string; value: number; tipomov: string }[]>([]);

  /** Mapa tipomovId → metadata (descripcion, abreviatura, tipomov E/I) */
  private tipoMovMap = new Map<
    number,
    { descripcion: string; abreviatura: string; tipomov: string }
  >();

  form!: FormGroup;
  editandoId = signal<number | null>(null);

  /** Aplicación del movimiento: cada cuánto se aplica (enum S/H/M/A/Q) */
  readonly aplicacionOptions = [
    { label: 'Hora', value: 'H' },
    { label: 'Quincenal', value: 'Q' },
    { label: 'Semanal', value: 'S' },
    { label: 'Mensual', value: 'M' },
    { label: 'Anual', value: 'A' },
  ];

  readonly tipoImporteOptions = [
    { label: 'Aportación', value: 'A' },
    { label: 'Progresiva', value: 'P' },
    { label: 'Retención', value: 'R' },
  ];

  readonly estadoOptions = [
    { label: 'Sí', value: 'S' },
    { label: 'No', value: 'N' },
  ];

  /** Agrupa movimientos por tipo (Ingreso / Egreso) */
  ingresos = computed(() =>
    this.movimientos().filter((m) => this.tipoMovMap.get(m.tipomovId)?.tipomov === 'I'),
  );
  egresos = computed(() =>
    this.movimientos().filter((m) => this.tipoMovMap.get(m.tipomovId)?.tipomov !== 'I'),
  );

  /**
   * Ficha del empleado para los encabezados de Ingresos / Egresos.
   * Muestra nombre, DNI, salario y (cuando el salario supera el techo) el
   * techo de seguridad, para poder validar los cálculos de un vistazo.
   */
  fichaEmpleado = computed(() => {
    const e = this.empleado();
    if (!e) return null;
    const salario = Number(e.sueldobruto ?? 0);
    const techo = Number(e.techoseguro ?? 0);
    return {
      nombre: `${e.apellidos} ${e.nombres}`.trim(),
      dni: e.nrodocumento,
      salario,
      techo,
      /** El salario supera el techo → IHSS se calcula sobre el tope */
      aplicaTecho: techo > 0 && salario > techo,
    };
  });

  private empleadoId = 0;

  ngOnInit(): void {
    this.buildForm();
    this.empleadoId = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarEmpleado();
    // cargarTipoMov() encadena la carga de movimientos para evitar
    // una condición de carrera con el mapa de tipos de movimiento.
    this.cargarTipoMov();
  }

  private buildForm() {
    this.form = this.fb.group({
      tipomovId: [null, Validators.required],
      aplicacion: ['M', Validators.required],
      tipoimporte: ['A', Validators.required],
      importe: [0, [Validators.required, Validators.min(0)]],
      imppatron: [0, [Validators.min(0)]],
      sn_activo: ['S', Validators.required],
    });
  }

  private cargarEmpleado() {
    this.cargando.set(true);
    this.service.getEmpleado(this.empleadoId).subscribe({
      next: (emp) => {
        this.empleado.set(emp);
        this.cargando.set(false);
      },
      error: () => {
        this.msgs.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar el empleado',
        });
        this.cargando.set(false);
      },
    });
  }

  private cargarTipoMov() {
    this.api.get<any[]>('/planilla/tipo-mov').subscribe({
      next: (items) => {
        this.tipoMovMap.clear();
        const opciones: { label: string; value: number; tipomov: string }[] = [];
        for (const item of items) {
          if (item.sn_activo !== 'S') continue;
          this.tipoMovMap.set(item.tipomovId, {
            descripcion: item.descripcion,
            abreviatura: item.abreviatura,
            tipomov: item.tipomov,
          });
          const tipoLabel = item.tipomov === 'I' ? 'Ingreso' : 'Egreso';
          opciones.push({
            label: `${item.descripcion} (${tipoLabel})`,
            value: item.tipomovId,
            tipomov: item.tipomov,
          });
        }
        this.tipoMovOpciones.set(opciones);
        // Encadena: los movimientos se enriquecen con este mapa.
        this.cargarMovimientos();
      },
      error: () => {
        this.msgs.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar tipos de movimiento',
        });
        this.cargarMovimientos();
      },
    });
  }

  private cargarMovimientos() {
    this.api
      .get<PlTipoMov[]>(`/planilla/empleado-tipo-mov?empleadoId=${this.empleadoId}`)
      .subscribe({
        next: (items) => {
          // Enriquece con descripción/abreviatura del tipo. Se muestran
          // activos e inactivos para poder reactivarlos desde el formulario.
          this.movimientos.set(
            items.map((m) => ({
              ...m,
              descripcionTipo: this.tipoMovMap.get(m.tipomovId)?.descripcion ?? '',
              abreviaturaTipo: this.tipoMovMap.get(m.tipomovId)?.abreviatura ?? '',
              tipomov: this.tipoMovMap.get(m.tipomovId)?.tipomov ?? 'E',
            })),
          );
        },
        error: () => {
          this.msgs.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron cargar los movimientos',
          });
        },
      });
  }

  tipoMovLabel(id: number): string {
    return this.tipoMovMap.get(id)?.descripcion ?? `Tipo ${id}`;
  }

  esIngreso(tipomovId: number): boolean {
    return this.tipoMovMap.get(tipomovId)?.tipomov === 'I';
  }

  aplicacionLabel(s: string): string {
    return this.aplicacionOptions.find((o) => o.value === s)?.label ?? (s || '—');
  }

  /** Destaca las aplicaciones anuales (p. ej. la retención ISR) */
  aplicacionSeverity(s: string): string {
    return s === 'A' ? 'warn' : 'success';
  }

  tipoImporteLabel(s: string): string {
    return (
      this.tipoImporteOptions.find((o) => o.value === s)?.label ?? (s || '—')
    );
  }

  estadoLabel(s: string): string {
    return s === 'S' ? 'Activo' : 'Inactivo';
  }

  formatearImporte(v: number | string): string {
    return Number(v).toFixed(2);
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.msgs.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Revise los campos marcados',
      });
      return;
    }

    const raw = this.form.getRawValue();
    const body = {
      empleadoId: this.empleadoId,
      tipomovId: raw.tipomovId,
      aplicacion: raw.aplicacion,
      tipoimporte: raw.tipoimporte,
      importe: raw.importe,
      imppatron: raw.imppatron,
      sn_activo: raw.sn_activo,
    };

    this.guardando.set(true);
    const editId = this.editandoId();
    const op = editId
      ? this.api.put<any>('/planilla/empleado-tipo-mov', editId, body)
      : this.api.post<any>('/planilla/empleado-tipo-mov', body);

    op.subscribe({
      next: () => {
        this.guardando.set(false);
        this.msgs.add({
          severity: 'success',
          summary: 'Guardado',
          detail: editId ? 'Movimiento actualizado' : 'Movimiento agregado',
        });
        this.limpiarFormulario();
        this.cargarMovimientos();
      },
      error: (err: any) => {
        this.guardando.set(false);
        const msg = err?.error?.message;
        this.msgs.add({
          severity: 'error',
          summary: 'No se pudo guardar',
          detail: Array.isArray(msg) ? msg.join(' · ') : msg || 'Error inesperado',
        });
      },
    });
  }

  editar(item: PlTipoMov) {
    this.editandoId.set(item.pletipomovId);
    this.form.patchValue({
      tipomovId: item.tipomovId,
      aplicacion: item.aplicacion ?? 'M',
      tipoimporte: item.tipoimporte,
      importe: Number(item.importe),
      imppatron: Number(item.imppatron ?? 0),
      sn_activo: item.sn_activo ?? 'S',
    });
  }

  eliminar(item: PlTipoMov) {
    this.api.delete<any>('/planilla/empleado-tipo-mov', item.pletipomovId).subscribe({
      next: () => {
        this.msgs.add({
          severity: 'success',
          summary: 'Eliminado',
          detail: 'Movimiento eliminado',
        });
        this.cargarMovimientos();
      },
      error: (err: any) => {
        const msg = err?.error?.message;
        this.msgs.add({
          severity: 'error',
          summary: 'No se pudo eliminar',
          detail: Array.isArray(msg) ? msg.join(' · ') : msg || 'Error inesperado',
        });
      },
    });
  }

  limpiarFormulario() {
    this.editandoId.set(null);
    this.form.reset({
      tipomovId: null,
      aplicacion: 'M',
      tipoimporte: 'A',
      importe: 0,
      imppatron: 0,
      sn_activo: 'S',
    });
  }

  volver() {
    this.router.navigate(['/planilla/empleado-tipo-mov']);
  }

  editarEmpleado() {
    this.router.navigate(['/planilla/empleados/editar', this.empleadoId]);
  }

  invalid(ctrl: string): boolean {
    const c = this.form.get(ctrl);
    return !!c && c.invalid && (c.dirty || c.touched);
  }
}
