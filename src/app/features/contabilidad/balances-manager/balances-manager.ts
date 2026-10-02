import {
  Component, OnInit, inject, signal, computed, DestroyRef, ChangeDetectionStrategy,
} from '@angular/core';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { AutoComplete, AutoCompleteCompleteEvent, AutoCompleteSelectEvent } from 'primeng/autocomplete';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { forkJoin, Observable, of, catchError } from 'rxjs';
import { ContabilidadService } from '../../../core/services/contabilidad.service';
import { AuthService } from '../../../core/services/auth.service';
import { CtaContable, PlantillaBalancesMae, PlantillaBalancesDet } from '../../../core/models/contabilidad.models';

type VistaTipo = 'lista' | 'crear' | 'editar' | 'ver';

/** Línea de detalle en el formulario */
interface LineaBalance {
  id: number;
  /** ID en BD (null = línea nueva aún no guardada) */
  dbId?: number | null;
  tipo: string;
  ctacontable: string;
  ctaNombre: string;
  /** Nivel contable de la cuenta (participa en el orden de presentación) */
  nivel: number;
  descripcion: string;
  columna: number | null;
  renglon: number | null;
}

/**
 * Orden de presentación de cuentas contables (selector y tabla de líneas):
 * siempre por cuenta contable ASC y nivel contable ASC.
 */
function ordenarPorCuenta<T extends { ctacontable?: string; nivel?: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const ctaA = a.ctacontable ?? '';
    const ctaB = b.ctacontable ?? '';
    if (ctaA !== ctaB) return ctaA < ctaB ? -1 : 1;
    return (a.nivel ?? 0) - (b.nivel ?? 0);
  });
}

@Component({
  selector: 'app-balances-manager',
  standalone: true,
  imports: [
    FormsModule, ReactiveFormsModule,
    TableModule, AutoComplete, InputNumber, InputText, Select, Button, Tag, TooltipModule,
    ToastModule, ConfirmDialogModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './balances-manager.html',
  styleUrl: './balances-manager.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BalancesManager implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private contabilidad = inject(ContabilidadService);
  private auth = inject(AuthService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private destroyRef = inject(DestroyRef);
  private siguienteId = 1;
  /** IDs en BD de las líneas cargadas al abrir la plantilla (para detectar bajas) */
  private dbIdsOriginales: number[] = [];

  // ===== ESTADO =====
  plantillas = signal<PlantillaBalancesMae[]>([]);
  cuentas = signal<CtaContable[]>([]);
  plantillaSeleccionada = signal<PlantillaBalancesMae | null>(null);
  vista = signal<VistaTipo>('lista');
  cargando = signal(false);

  // ===== FILTROS =====
  filtroDescripcion = signal('');

  // ===== LÍNEAS DE DETALLE =====
  lineas = signal<LineaBalance[]>([]);
  sugerencias = signal<CtaContable[]>([]);
  seleccionada = signal<CtaContable | string | null>(null);

  // ===== OPCIONES =====
  tipoOptions = [
    { label: 'D - Débito', value: 'D' },
    { label: 'C - Crédito', value: 'C' },
  ];

  // ===== FORMULARIO =====
  form = this.fb.group({
    descripcion: this.fb.control('', [Validators.required, Validators.maxLength(50)]),
  });
  private estadoForm = toSignal(this.form.statusChanges, { initialValue: this.form.status });

  // ===== COMPUTED =====
  plantillasFiltradas = computed(() => {
    let r = this.plantillas();
    const desc = this.filtroDescripcion();
    if (desc) r = r.filter(p => p.descripcion?.toLowerCase().includes(desc.toLowerCase()));
    return r;
  });

  /**
   * Todas las cuentas del plan de cuentas: cualquier nivel (1, 2, 3, 4, 5, 6, 8…),
   * operables o no y activas o no. El detalle de la plantilla puede registrarlas todas.
   */
  cuentasDisponibles = computed(() => this.cuentas());

  /** Líneas presentadas siempre por cuenta contable ASC y nivel ASC */
  lineasOrdenadas = computed(() => ordenarPorCuenta(this.lineas()));

  puedeGuardar = computed(() =>
    this.estadoForm() === 'VALID' &&
    this.lineas().length >= 1
  );

  trackById = (_: number, l: LineaBalance) => l.id;

  // ===== CICLO DE VIDA =====
  ngOnInit(): void {
    this.cargarDatos();
  }

  private cargarDatos(): void {
    this.cargando.set(true);
    forkJoin({
      plantillas: this.contabilidad.getPlantillasBalances(),
      cuentas: this.contabilidad.getCuentas(),
    }).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.plantillas.set(data.plantillas);
          this.cuentas.set(data.cuentas);
          this.cargando.set(false);
        },
        error: () => { this.mostrarError('Error cargando datos'); this.cargando.set(false); },
      });
  }

  // ===== NAVEGACIÓN =====
  nuevaPlantilla(): void {
    this.plantillaSeleccionada.set(null);
    this.form.reset({ descripcion: '' });
    this.lineas.set([]);
    this.dbIdsOriginales = [];
    this.seleccionada.set(null);
    this.siguienteId = 1;
    this.vista.set('crear');
  }

  editarPlantilla(plantilla: PlantillaBalancesMae): void {
    this.plantillaSeleccionada.set(plantilla);
    this.form.reset({ descripcion: plantilla.descripcion });
    this.cargarDetalles(plantilla.cocdefbalmaId, 'editar');
  }

  verPlantilla(plantilla: PlantillaBalancesMae): void {
    this.plantillaSeleccionada.set(plantilla);
    this.cargarDetalles(plantilla.cocdefbalmaId, 'ver');
  }

  private cargarDetalles(plantillaId: number, modo: 'editar' | 'ver'): void {
    this.cargando.set(true);
    this.contabilidad.getDetallesPlantillaBalances(plantillaId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (detalles) => {
          this.dbIdsOriginales = detalles
            .map(d => d.tcoplantillabalancesdetid)
            .filter((id): id is number => id != null);
          this.lineas.set(detalles.map(d => ({
            id: this.siguienteId++,
            dbId: d.tcoplantillabalancesdetid ?? null,
            tipo: d.tipo ?? 'D',
            ctacontable: d.ctacontable ?? '',
            ctaNombre: this.getCuentaNombre(d.ctacontable ?? ''),
            nivel: this.getCuentaNivel(d.ctacontable ?? ''),
            descripcion: d.descripcion ?? '',
            columna: d.columna ?? null,
            renglon: d.renglon ?? null,
          })));
          this.vista.set(modo);
          this.cargando.set(false);
        },
        error: () => { this.mostrarError('Error cargando detalles'); this.cargando.set(false); },
      });
  }

  volver(): void {
    this.vista.set('lista');
    this.plantillaSeleccionada.set(null);
    this.lineas.set([]);
    this.dbIdsOriginales = [];
  }

  // ===== BÚSQUEDA DE CUENTAS =====
  buscar(e: AutoCompleteCompleteEvent): void {
    const q = e.query.trim().toLowerCase();
    // Orden de presentación: cuenta contable ASC y nivel ASC
    this.sugerencias.set(
      ordenarPorCuenta(
        this.cuentasDisponibles().filter(c =>
          c.ctacontable.toLowerCase().includes(q) ||
          c.descripcion.toLowerCase().includes(q),
        ),
      ),
    );
  }

  agregar(e: AutoCompleteSelectEvent): void {
    const cuenta = e.value as CtaContable;
    const linea: LineaBalance = {
      id: this.siguienteId++,
      dbId: null,
      tipo: 'D',
      ctacontable: cuenta.ctacontable,
      ctaNombre: cuenta.descripcion,
      nivel: cuenta.nivel,
      descripcion: cuenta.descripcion,
      columna: null,
      renglon: null,
    };
    this.lineas.update(ls => [...ls, linea]);
    setTimeout(() => this.seleccionada.set(null));
  }

  // ===== EDICIÓN DE LÍNEAS =====
  editar(id: number, cambios: Partial<LineaBalance>): void {
    this.lineas.update(ls => ls.map(l => l.id === id ? { ...l, ...cambios } : l));
  }

  quitar(id: number): void {
    this.lineas.update(ls => ls.filter(l => l.id !== id));
  }

  // ===== GUARDAR =====
  guardar(): void {
    if (!this.puedeGuardar()) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Verifique el formulario y que haya al menos 1 línea' });
      return;
    }

    const errorLineas = this.validarLineas();
    if (errorLineas) {
      this.mostrarError(errorLineas);
      return;
    }

    const fv = this.form.getRawValue();
    const esNuevo = this.vista() === 'crear';

    const maePayload = {
      descripcion: fv.descripcion,
      sn_activo: 'S' as const,
    };

    this.cargando.set(true);

    if (esNuevo) {
      this.contabilidad.createPlantillaBalancesMae(maePayload)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (maeCreado) => {
            this.guardarDetalles(maeCreado.cocdefbalmaId);
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al crear plantilla' });
            this.cargando.set(false);
          },
        });
    } else {
      const id = this.plantillaSeleccionada()!.cocdefbalmaId;
      this.contabilidad.updatePlantillaBalancesMae(id, maePayload)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => this.guardarDetalles(id),
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al actualizar plantilla' });
            this.cargando.set(false);
          },
        });
    }
  }

  /**
   * Guarda el detalle por diferencia: elimina las líneas que el usuario quitó,
   * actualiza in-place las existentes y crea las nuevas.
   * (Antes se borraban y se re-creaban todas, lo que chocaba contra la clave
   *  única de tcoplantillabalancesdet porque el borrado es suave: sn_activo='N'.)
   */
  private guardarDetalles(maeId: number): void {
    const lineasAct = this.lineas();
    const idsActuales = new Set(lineasAct.map(l => l.dbId).filter((id): id is number => id != null));
    const aEliminar = this.dbIdsOriginales.filter(id => !idsActuales.has(id));
    const aActualizar: { id: number; payload: Partial<PlantillaBalancesDet> }[] = [];
    const aCrear: Partial<PlantillaBalancesDet>[] = [];

    lineasAct.forEach(l => {
      const payload: Partial<PlantillaBalancesDet> = {
        tipo: l.tipo,
        ctacontable: l.ctacontable,
        descripcion: l.descripcion,
        columna: l.columna ?? undefined,
        // El renglón lo define el usuario: el sistema lo respeta y jamás
        // lo asigna ni lo renumera automáticamente.
        renglon: l.renglon,
      };
      if (l.dbId != null) {
        aActualizar.push({ id: l.dbId, payload });
      } else {
        aCrear.push({ ...payload, cocdefbalmaId: maeId });
      }
    });

    // Orden: bajas → actualizaciones → altas (libera cuentas antes de reutilizarlas)
    const operaciones: Array<() => Observable<unknown>> = [
      ...aEliminar.map(id => () => this.contabilidad.deletePlantillaBalancesDet(id)),
      ...aActualizar.map(({ id, payload }) => () => this.contabilidad.updatePlantillaBalancesDet(id, payload)),
      ...aCrear.map(payload => () => this.contabilidad.createPlantillaBalancesDet(payload)),
    ];

    if (operaciones.length === 0) {
      this.finalizarGuardado();
      return;
    }

    let indice = 0;
    let fallos = 0;
    const ejecutarSiguiente = (): void => {
      if (indice >= operaciones.length) {
        if (fallos > 0) {
          this.cargando.set(false);
          this.mostrarError(`No se pudieron guardar ${fallos} de ${operaciones.length} líneas. Corrija los datos e intente de nuevo.`);
        } else {
          this.finalizarGuardado();
        }
        return;
      }
      operaciones[indice++]()
        .pipe(
          catchError(() => { fallos++; return of(null); }),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe({ next: () => ejecutarSiguiente() });
    };
    ejecutarSiguiente();
  }

  /**
   * Valida las líneas antes de guardar:
   * - columna obligatoria y dentro del rango 1..4
   * - cuenta contable no repetida dentro de la plantilla
   */
  private validarLineas(): string | null {
    const vistos = new Set<string>();
    const lineas = this.lineas();
    for (let i = 0; i < lineas.length; i++) {
      const l = lineas[i];
      const ref = `línea ${i + 1} (${l.ctacontable || 'sin cuenta'})`;
      if (l.columna == null) {
        return `La columna es obligatoria en la ${ref}`;
      }
      if (!Number.isInteger(l.columna) || l.columna < 1 || l.columna > 4) {
        return `La columna debe estar entre 1 y 4 en la ${ref}`;
      }
      const clave = (l.ctacontable ?? '').trim().toUpperCase();
      if (clave && vistos.has(clave)) {
        return `La cuenta contable ${l.ctacontable} está repetida en la plantilla`;
      }
      vistos.add(clave);
    }
    return null;
  }

  private finalizarGuardado(): void {
    const esNuevo = this.vista() === 'crear';
    this.messageService.add({
      severity: 'success',
      summary: esNuevo ? 'Creada' : 'Actualizada',
      detail: `Plantilla ${esNuevo ? 'creada' : 'actualizada'} exitosamente`,
    });
    this.volver();
    this.cargarDatos();
    this.cargando.set(false);
  }

  // ===== ELIMINAR =====
  eliminarPlantilla(plantilla: PlantillaBalancesMae): void {
    this.confirmationService.confirm({
      message: `¿Está seguro de eliminar la plantilla "${plantilla.descripcion}"?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: { label: 'Cancelar', severity: 'secondary', variant: 'text', size: 'small', rounded: true },
      acceptButtonProps: { label: 'Eliminar', severity: 'danger', variant: 'text', size: 'small', rounded: true },
      accept: () => {
        this.contabilidad.deletePlantillaBalancesMae(plantilla.cocdefbalmaId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.messageService.add({ severity: 'success', summary: 'Eliminada', detail: 'Plantilla eliminada' });
              if (this.plantillaSeleccionada()?.cocdefbalmaId === plantilla.cocdefbalmaId) this.volver();
              this.cargarDatos();
            },
            error: () => this.mostrarError('Error al eliminar'),
          });
      },
    });
  }

  // ===== HELPERS =====
  getCuentaNombre(ctacontable: string): string {
    return this.cuentas().find(c => c.ctacontable === ctacontable)?.descripcion ?? '';
  }

  /** Nivel contable de una cuenta (999 = no encontrada, se ubica al final) */
  private getCuentaNivel(ctacontable: string): number {
    return this.cuentas().find(c => c.ctacontable === ctacontable)?.nivel ?? 999;
  }

  private mostrarError(msg: string): void {
    this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
  }
}
