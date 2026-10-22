import { Component, DestroyRef, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, defaultIfEmpty, forkJoin } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PlanillaService } from '../../../core/services/planilla.service';
import { NavegacionService } from '../../../core/services/navegacion.service';
import {
  DeptoEmpresa,
  HorasExtrasFila,
  HorasExtrasReporte,
  LineaAutorizacion,
  PlanillaEmpleado,
} from '../../../core/models/planilla.models';

interface FormAutorizacion {
  deptoId: number | null;
  solicitado_por: number | null;
  autorizado_por: number | null;
  fecha_desde: Date | null;
  fecha_hasta: Date | null;
  razon_justificacion: string;
}

const FORM_INICIAL: FormAutorizacion = {
  deptoId: null,
  solicitado_por: null,
  autorizado_por: null,
  fecha_desde: null,
  fecha_hasta: null,
  razon_justificacion: '',
};

/**
 * Autorización de pago de horas extras (maestro / detalle).
 *
 * Maestro: departamento, jefe que SOLICITA, gerente que APRUEBA, rango de
 * fechas y motivo. Detalle: empleados autorizados con su marca `sn_pagar`.
 *
 * Las horas extras se pagan SOLO a los empleados autorizados cuya asistencia
 * caiga dentro del rango seleccionado y cuya marca sea `S` (paga).
 */
@Component({
  selector: 'app-horas-extras-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    TableModule,
    SelectModule,
    DatePickerModule,
    TagModule,
    TooltipModule,
    ConfirmDialogModule,
  ],
  templateUrl: './horas-extras-form.html',
  styleUrl: './horas-extras-form.scss',
})
export class HorasExtrasForm implements OnInit {
  private service = inject(PlanillaService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private msgs = inject(MessageService);
  private confirmation = inject(ConfirmationService);
  private navegacion = inject(NavegacionService);
  private destroyRef = inject(DestroyRef);

  readonly OPCIONES_PAGAR: { label: string; value: 'S' | 'N' }[] = [
    { label: 'Sí, paga', value: 'S' },
    { label: 'No, excluido', value: 'N' },
  ];

  id = signal<number | null>(null);
  cargando = signal(false);
  guardando = signal(false);
  calculando = signal(false);

  form = signal<FormAutorizacion>({ ...FORM_INICIAL });

  deptos = signal<DeptoEmpresa[]>([]);
  empleados = signal<PlanillaEmpleado[]>([]);

  /** Líneas en edición (incluye las nuevas sin id y las existentes). */
  lineas = signal<LineaAutorizacion[]>([]);
  /** Snapshot de las líneas guardadas en BD, para calcular el diff. */
  originales = signal<LineaAutorizacion[]>([]);
  /** Empleado elegido en el combo "Agregar". */
  empleadoAAgregar = signal<number | null>(null);

  reporte = signal<HorasExtrasReporte | null>(null);

  private mapaDeptos = signal<Record<number, string>>({});
  private mapaEmpleados = signal<Record<number, string>>({});

  esEdicion = computed(() => this.id() != null);

  opcionesDeptos = computed(() =>
    this.deptos()
      .filter((d) => !d.sn_activo || d.sn_activo === 'S')
      .map((d) => ({ label: d.descripcion, value: d.deptoId })),
  );

  opcionesEmpleados = computed(() =>
    this.empleados()
      .filter((e) => e.sn_activo === 'S')
      .map((e) => ({ label: `${e.apellidos}, ${e.nombres}`, value: e.empleadoId })),
  );

  /** Empleados que todavía no fueron agregados a la autorización. */
  opcionesDisponibles = computed(() => {
    const agregados = new Set(this.lineas().map((l) => l.empleadoId));
    return this.opcionesEmpleados().filter((o) => !agregados.has(o.value));
  });

  periodoLabel = computed(() => {
    const f = this.form();
    return f.fecha_desde && f.fecha_hasta
      ? `${this.fmtFecha(this.iso(f.fecha_desde))} — ${this.fmtFecha(this.iso(f.fecha_hasta))}`
      : 'Rango sin definir';
  });

  private periodoBase: { anio_ejercicio: number; periodo: number } | null = null;

  ngOnInit(): void {
    this.service
      .getDeptos()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.deptos.set(res);
          this.mapaDeptos.set(
            this.indexar(res.map((d) => ({ id: d.deptoId, nombre: d.descripcion }))),
          );
        },
        error: () => this.deptos.set([]),
      });

    this.service
      .getEmpleados()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.empleados.set(res);
          this.mapaEmpleados.set(
            this.indexar(
              res.map((e) => ({ id: e.empleadoId, nombre: `${e.apellidos}, ${e.nombres}` })),
            ),
          );
        },
        error: () => this.empleados.set([]),
      });

    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const crudo = params.get('id');
      const id = crudo && crudo !== 'nuevo' ? Number(crudo) : null;
      this.id.set(id);
      this.form.set({ ...FORM_INICIAL });
      this.lineas.set([]);
      this.originales.set([]);
      this.reporte.set(null);
      this.periodoBase = null;
      if (id) this.cargar(id);
    });
  }

  private cargar(id: number): void {
    this.cargando.set(true);
    this.service
      .getAutorizacion(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.form.set({
            deptoId: res.deptoId ?? null,
            solicitado_por: res.solicitado_por ?? null,
            autorizado_por: res.autorizado_por ?? null,
            fecha_desde: this.parseFecha(res.fecha_desde),
            fecha_hasta: this.parseFecha(res.fecha_hasta),
            razon_justificacion: res.razon_justificacion ?? '',
          });
          const lineas = res.detalles ?? [];
          this.lineas.set(lineas.map((l) => ({ ...l })));
          this.originales.set(lineas.map((l) => ({ ...l })));
          this.periodoBase = { anio_ejercicio: res.anio_ejercicio, periodo: res.periodo };
          this.cargando.set(false);
        },
        error: () => {
          this.cargando.set(false);
          this.msgs.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo cargar la autorización',
          });
        },
      });
  }

  /* ── Edición del maestro ─────────────────────────────────────────────── */

  actualizar(parcial: Partial<FormAutorizacion>): void {
    this.form.update((f) => ({ ...f, ...parcial }));
    // Un cambio en el rango invalida el reporte calculado.
    if ('fecha_desde' in parcial || 'fecha_hasta' in parcial) this.reporte.set(null);
  }

  /* ── Detalle de empleados ────────────────────────────────────────────── */

  agregarLinea(): void {
    const empleadoId = this.empleadoAAgregar();
    if (empleadoId == null) return;
    if (this.lineas().some((l) => l.empleadoId === empleadoId)) return;

    const empleado = this.empleados().find((e) => e.empleadoId === empleadoId);
    const original = this.originales().find((l) => l.empleadoId === empleadoId);
    // Si existía y sólo se quitó en memoria, se RESTAURA (evita borrar+y crear
    // en el mismo guardado, que chocaría con el UNIQUE de la tabla).
    if (original) {
      this.lineas.update((ls) => [...ls, { ...original }]);
    } else {
      const departamentoId =
        empleado?.deptoId ?? this.form().deptoId ?? undefined;
      this.lineas.update((ls) => [
        ...ls,
        { empleadoId, departamentoId, sn_pagar: 'S' },
      ]);
    }
    this.empleadoAAgregar.set(null);
    this.reporte.set(null);
  }

  quitarLinea(linea: LineaAutorizacion): void {
    this.lineas.update((ls) => ls.filter((l) => l !== linea));
    this.reporte.set(null);
  }

  marcarPagar(linea: LineaAutorizacion, valor: 'S' | 'N'): void {
    this.lineas.update((ls) =>
      ls.map((l) => (l === linea ? { ...l, sn_pagar: valor } : l)),
    );
    this.reporte.set(null);
  }

  fila(linea: LineaAutorizacion): string {
    const idx = this.lineas().indexOf(linea);
    return idx >= 0 ? String(idx + 1) : '';
  }

  /** Posición (1..n) de una fila dentro del reporte calculado. */
  posEnReporte(fila: HorasExtrasFila): number {
    const filas = this.reporte()?.filas ?? [];
    return filas.indexOf(fila) + 1;
  }

  nombreEmpleado(id: number): string {
    return this.mapaEmpleados()[id] ?? `Empleado ${id}`;
  }

  nombreDepto(id: number | null | undefined): string {
    if (id == null) return '—';
    return this.mapaDeptos()[id] ?? `Depto ${id}`;
  }

  /** Formato monetario del proyecto: L 1,234.56 (es-HN). */
  fmtL(valor: number | null | undefined): string {
    return `L ${Number(valor ?? 0).toLocaleString('es-HN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  /* ── Horas extras a pagar ────────────────────────────────────────────── */

  puedeCalcular(): boolean {
    const f = this.form();
    return this.id() != null && f.fecha_desde != null && f.fecha_hasta != null;
  }

  calcular(): void {
    const id = this.id();
    if (id == null) return;
    if (!this.form().fecha_desde || !this.form().fecha_hasta) {
      this.msgs.add({
        severity: 'warn',
        summary: 'Rango requerido',
        detail: 'Defina fecha desde y fecha hasta antes de calcular las horas extras',
      });
      return;
    }
    this.calculando.set(true);
    this.service
      .getHorasExtras(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.reporte.set(res);
          this.calculando.set(false);
        },
        error: () => {
          this.calculando.set(false);
        },
      });
  }

  /* ── Guardar / eliminar ──────────────────────────────────────────────── */

  guardar(): void {
    const f = this.form();

    if (!f.deptoId || !f.solicitado_por || !f.autorizado_por) {
      this.msgs.add({
        severity: 'warn',
        summary: 'Campos requeridos',
        detail: 'Indique el departamento, el jefe que solicita y el gerente que aprueba',
      });
      return;
    }
    if (!f.fecha_desde || !f.fecha_hasta) {
      this.msgs.add({
        severity: 'warn',
        summary: 'Rango requerido',
        detail: 'Indique la fecha desde y la fecha hasta del período autorizado',
      });
      return;
    }
    if (this.iso(f.fecha_desde) > this.iso(f.fecha_hasta)) {
      this.msgs.add({
        severity: 'warn',
        summary: 'Rango inválido',
        detail: 'La fecha desde no puede ser posterior a la fecha hasta',
      });
      return;
    }
    if (this.lineas().length === 0) {
      this.msgs.add({
        severity: 'warn',
        summary: 'Sin empleados',
        detail: 'Agregue al menos un empleado autorizado a la solicitud',
      });
      return;
    }

    const payload: Record<string, unknown> = {
      deptoId: f.deptoId,
      solicitado_por: f.solicitado_por,
      autorizado_por: f.autorizado_por,
      fecha_desde: this.iso(f.fecha_desde),
      fecha_hasta: this.iso(f.fecha_hasta),
      razon_justificacion: f.razon_justificacion || null,
    };
    if (this.periodoBase && this.esEdicion()) {
      payload['anio_ejercicio'] = this.periodoBase.anio_ejercicio;
      payload['periodo'] = this.periodoBase.periodo;
    }

    this.guardando.set(true);

    if (!this.esEdicion()) {
      // Cabecera + líneas en UNA petición: el backend valida las líneas antes
      // de insertar la cabecera y no deja registros huérfanos.
      this.service
        .createAutorizacion({
          ...payload,
          detalles: this.lineas().map((l) => ({
            empleadoId: l.empleadoId,
            departamentoId: l.departamentoId ?? undefined,
            sn_pagar: l.sn_pagar,
          })),
        })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (res) => {
            this.guardando.set(false);
            this.msgs.add({
              severity: 'success',
              summary: 'Creada',
              detail: `Autorización #${res.pleauthoraexmaeid} registrada`,
            });
            this.router.navigate(['/planilla/horas-extras/editar', res.pleauthoraexmaeid]);
          },
          error: () => {
            this.guardando.set(false);
          },
        });
      return;
    }

    const id = this.id()!;
    const operaciones = this.armarOperaciones(id, payload);
    forkJoin(operaciones.length ? operaciones : [])
      .pipe(defaultIfEmpty([]), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.guardando.set(false);
          this.msgs.add({
            severity: 'success',
            summary: 'Guardado',
            detail: 'Autorización actualizada correctamente',
          });
          this.cargar(id);
        },
        error: () => {
          this.guardando.set(false);
        },
      });
  }

  /** Diff entre las líneas en memoria y las guardadas en BD. */
  private armarOperaciones(
    id: number,
    payload: Record<string, unknown>,
  ): Observable<unknown>[] {
    const ops: Observable<unknown>[] = [
      this.service.updateAutorizacion(id, payload).pipe(defaultIfEmpty(null)),
    ];

    const originales = this.originales();
    const actuales = this.lineas();

    // 1) Eliminar primero (para no chocar con el UNIQUE de empleado+mae)
    const idsActuales = new Set<number>();
    for (const l of actuales) {
      if (l.pleauthoraexdetId != null) idsActuales.add(l.pleauthoraexdetId);
    }
    for (const o of originales) {
      if (o.pleauthoraexdetId != null && !idsActuales.has(o.pleauthoraexdetId)) {
        ops.push(this.service.deleteLinea(o.pleauthoraexdetId).pipe(defaultIfEmpty(null)));
      }
    }

    // 2) Crear las nuevas
    for (const l of actuales) {
      if (l.pleauthoraexdetId == null) {
        ops.push(
          this.service
            .createLinea({
              pleauthoraexmaeid: id,
              empleadoId: l.empleadoId,
              departamentoId: l.departamentoId ?? undefined,
              sn_pagar: l.sn_pagar,
            })
            .pipe(defaultIfEmpty(null)),
        );
      }
    }

    // 3) Actualizar las que cambiaron la marca de pago
    for (const l of actuales) {
      if (l.pleauthoraexdetId == null) continue;
      const previa = originales.find((o) => o.pleauthoraexdetId === l.pleauthoraexdetId);
      if (previa && previa.sn_pagar !== l.sn_pagar) {
        ops.push(
          this.service
            .updateLinea(l.pleauthoraexdetId, { sn_pagar: l.sn_pagar })
            .pipe(defaultIfEmpty(null)),
        );
      }
    }

    return ops;
  }

  eliminar(): void {
    const id = this.id();
    if (id == null) return;
    this.confirmation.confirm({
      message: `¿Está seguro de eliminar la autorización <strong>#${id}</strong>? Se quitarán también las líneas de empleados.`,
      header: 'Eliminar autorización',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: {
        label: 'Cancelar',
        severity: 'secondary',
        variant: 'text',
        size: 'small',
        rounded: true,
      },
      acceptButtonProps: {
        label: 'Eliminar',
        severity: 'danger',
        variant: 'text',
        size: 'small',
        rounded: true,
      },
      accept: () => {
        this.service
          .deleteAutorizacion(id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.msgs.add({
                severity: 'success',
                summary: 'Eliminada',
                detail: `Autorización #${id} eliminada`,
              });
              this.volver();
            },
            error: () => {
              /* el interceptor global ya mostró el error */
            },
          });
      },
    });
  }

  volver(): void {
    this.navegacion.volver(['/planilla/horas-extras']);
  }

  /* ── Utilidades ──────────────────────────────────────────────────────── */

  /** Fecha local `YYYY-MM-DD` (evita el desfase UTC de `toISOString`). */
  private iso(fecha: Date | null): string {
    if (!fecha) return '';
    const anio = fecha.getFullYear();
    const mes = `${fecha.getMonth() + 1}`.padStart(2, '0');
    const dia = `${fecha.getDate()}`.padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  private parseFecha(valor?: string | null): Date | null {
    if (!valor) return null;
    const partes = valor.substring(0, 10).split('-').map(Number);
    if (partes.length !== 3 || !partes[0] || !partes[1] || !partes[2]) return null;
    return new Date(partes[0], partes[1] - 1, partes[2]);
  }

  fmtFecha(valor: string | null | undefined): string {
    if (!valor) return '—';
    const partes = valor.substring(0, 10).split('-');
    if (partes.length !== 3) return valor;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  /** Convierte `HH:MM:SS` a `HH:MM`. */
  fmtHora(valor: string | null | undefined): string {
    if (!valor) return '—';
    const partes = valor.split(':');
    return `${partes[0]}:${partes[1] ?? '00'}`;
  }

  snPagarLabel(sn: string): string {
    return sn === 'S' ? 'Sí, paga' : 'No, excluido';
  }

  snPagarSev(sn: string): 'success' | 'danger' {
    return sn === 'S' ? 'success' : 'danger';
  }

  totales() {
    return this.reporte()?.totales ?? null;
  }

  private indexar(
    items: { id: number; nombre: string }[],
  ): Record<number, string> {
    const mapa: Record<number, string> = {};
    for (const i of items) mapa[i.id] = i.nombre;
    return mapa;
  }
}
