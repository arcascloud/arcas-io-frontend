import {
  Component, OnInit, inject, signal, computed, DestroyRef, ChangeDetectionStrategy,
  ElementRef, Injector, afterNextRender, viewChild,
} from '@angular/core';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { AutoComplete, AutoCompleteCompleteEvent, AutoCompleteSelectEvent } from 'primeng/autocomplete';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { forkJoin } from 'rxjs';
import { ContabilidadService } from '../../../core/services/contabilidad.service';
import { AuthService } from '../../../core/services/auth.service';
import { ModulosService } from '../../../core/services/modulos.service';
import { CtaContable, PlantillaPdaMae, PlantillaPdaDet } from '../../../core/models/contabilidad.models';
import { Modulo } from '../../../core/models/usuario.models';

type VistaTipo = 'lista' | 'crear' | 'editar' | 'ver';

/** Línea de detalle en el formulario */
interface LineaPlantilla {
  id: number;
  nrofila: number;
  ctacontable: string;
  ctaNombre: string;
  descripcion: string;
  naturaleza: 'D' | 'C';
}

@Component({
  selector: 'app-plantilla-pda-manager',
  standalone: true,
  imports: [
    FormsModule, ReactiveFormsModule,
    TableModule, AutoComplete, InputText, Select, Button, Tag, TooltipModule,
    ToastModule, ConfirmDialogModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './plantilla-pda-manager.html',
  styleUrl: './plantilla-pda-manager.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlantillaPdaManager implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private contabilidad = inject(ContabilidadService);
  private auth = inject(AuthService);
  private modulosService = inject(ModulosService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private destroyRef = inject(DestroyRef);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private injector = inject(Injector);
  private buscadorEl = viewChild('buscador', { read: ElementRef });
  private siguienteId = 1;

  // ===== ESTADO =====
  plantillas = signal<PlantillaPdaMae[]>([]);
  cuentas = signal<CtaContable[]>([]);
  modulos = signal<Modulo[]>([]);
  plantillaSeleccionada = signal<PlantillaPdaMae | null>(null);
  vista = signal<VistaTipo>('lista');
  cargando = signal(false);

  // ===== FILTROS =====
  filtroModulo = signal<number | null>(null);
  filtroDescripcion = signal('');

  // ===== LÍNEAS DE DETALLE =====
  lineas = signal<LineaPlantilla[]>([]);
  sugerencias = signal<CtaContable[]>([]);
  seleccionada = signal<CtaContable | string | null>(null);

  // ===== OPCIONES DE SELECTS =====
  modulosOptions = computed(() =>
    this.modulos()
      .filter(m => m.sn_activo === 'S' && m.sn_auxiliar_contable === 'S')
      .map(m => ({ label: m.descripcion_contable || m.descripcion, value: m.moduloId }))
      .sort((a, b) => a.label.localeCompare(b.label))
  );

  naturalezaOptions = [
    { label: 'Débito (D)', value: 'D' },
    { label: 'Crédito (C)', value: 'C' },
  ];

  // ===== FORMULARIO =====
  form = this.fb.group({
    descripcion: this.fb.control('', [Validators.required, Validators.maxLength(50)]),
    moduloId: this.fb.control<number | null>(null, Validators.required),
  });
  private estadoForm = toSignal(this.form.statusChanges, { initialValue: this.form.status });

  // ===== COMPUTED =====
  plantillasFiltradas = computed(() => {
    let r = this.plantillas();
    const modulo = this.filtroModulo();
    const desc = this.filtroDescripcion();
    if (modulo != null) r = r.filter(p => p.moduloId === modulo);
    if (desc) r = r.filter(p => p.descripcion?.toLowerCase().includes(desc.toLowerCase()));
    return r;
  });

  /** Solo cuentas de movimiento (sn_operable === 'S') */
  cuentasMovimiento = computed(() => this.cuentas().filter(c => c.sn_operable === 'S'));

  puedeGuardar = computed(() =>
    this.estadoForm() === 'VALID' &&
    this.lineas().length >= 1
  );

  trackById = (_: number, l: LineaPlantilla) => l.id;

  // ===== CICLO DE VIDA =====
  ngOnInit(): void {
    this.cargarDatos();
  }

  private cargarDatos(): void {
    this.cargando.set(true);
    forkJoin({
      plantillas: this.contabilidad.getPlantillasPda(),
      cuentas: this.contabilidad.getCuentas(),
      modulos: this.modulosService.getAll(),
    }).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.plantillas.set(data.plantillas);
          this.cuentas.set(data.cuentas);
          this.modulos.set(data.modulos);
          this.cargando.set(false);
        },
        error: () => { this.mostrarError('Error cargando datos'); this.cargando.set(false); },
      });
  }

  // ===== NAVEGACIÓN =====
  nuevaPlantilla(): void {
    this.plantillaSeleccionada.set(null);
    this.form.reset({ descripcion: '', moduloId: null });
    this.lineas.set([]);
    this.seleccionada.set(null);
    this.siguienteId = 1;
    this.vista.set('crear');
  }

  editarPlantilla(plantilla: PlantillaPdaMae): void {
    this.plantillaSeleccionada.set(plantilla);
    this.form.reset({
      descripcion: plantilla.descripcion,
      moduloId: plantilla.moduloId,
    });
    this.cargarDetalles(plantilla.tcoplantillapdamaeId, 'editar');
  }

  verPlantilla(plantilla: PlantillaPdaMae): void {
    this.plantillaSeleccionada.set(plantilla);
    this.cargarDetalles(plantilla.tcoplantillapdamaeId, 'ver');
  }

  private cargarDetalles(plantillaId: number, modo: 'editar' | 'ver'): void {
    this.cargando.set(true);
    this.contabilidad.getDetallesPlantillaPda(plantillaId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (detalles) => {
          this.lineas.set(detalles.map(d => ({
            id: this.siguienteId++,
            nrofila: d.nrofila || this.siguienteId,
            ctacontable: d.ctacontable ?? '',
            ctaNombre: this.getCuentaNombre(d.ctacontable ?? ''),
            descripcion: d.descripcion ?? '',
            naturaleza: (d.naturaleza || 'D') as 'D' | 'C',
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
  }

  // ===== BÚSQUEDA DE CUENTAS (autocomplete) =====
  /** Filtra cuentas de movimiento por código o nombre (excluye las ya usadas en el detalle) */
  buscar(e: AutoCompleteCompleteEvent): void {
    const q = e.query.trim().toLowerCase();
    const usadas = new Set(this.lineas().map(l => l.ctacontable));
    this.sugerencias.set(
      this.cuentasMovimiento().filter(c =>
        !usadas.has(c.ctacontable) &&
        (c.ctacontable.toLowerCase().includes(q) ||
        c.descripcion.toLowerCase().includes(q)),
      ),
    );
  }

  /**
   * Agrega una línea con la cuenta seleccionada.
   * REGLA: una cuenta contable solo puede ingresar UNA vez en el detalle de la plantilla.
   */
  agregar(e: AutoCompleteSelectEvent): void {
    const cuenta = e.value as CtaContable;

    // Una cuenta ya ingresada no puede repetirse en el detalle
    if (this.lineas().some(l => l.ctacontable === cuenta.ctacontable)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cuenta duplicada',
        detail: `La cuenta ${cuenta.ctacontable} - ${cuenta.descripcion} ya fue ingresada en el detalle`,
      });
      setTimeout(() => this.seleccionada.set(null));
      return;
    }

    const linea: LineaPlantilla = {
      id: this.siguienteId++,
      nrofila: this.lineas().length + 1,
      ctacontable: cuenta.ctacontable,
      ctaNombre: cuenta.descripcion,
      descripcion: cuenta.descripcion,
      naturaleza: 'D',
    };
    this.lineas.update(ls => [...ls, linea]);
    setTimeout(() => this.seleccionada.set(null));

    afterNextRender(() => {
      this.host.nativeElement
        .querySelector<HTMLInputElement>(`[data-linea="${linea.id}"] input`)
        ?.focus();
    }, { injector: this.injector });
  }

  // ===== EDICIÓN DE LÍNEAS =====
  editar(id: number, cambios: Partial<LineaPlantilla>): void {
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

    // Auditoría final: ninguna cuenta puede repetirse en el detalle (también lo valida el backend)
    const duplicadas = this.ctasRepetidas();
    if (duplicadas.length > 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Cuentas duplicadas',
        detail: `Cuenta(s) repetida(s) en el detalle: ${duplicadas.join(', ')}`,
      });
      return;
    }

    const fv = this.form.getRawValue();
    const user = this.auth.currentUser();
    const esNuevo = this.vista() === 'crear';

    const maePayload = {
      descripcion: fv.descripcion,
      moduloId: fv.moduloId!,
      sn_activo: 'S' as const,
    };

    this.cargando.set(true);

    if (esNuevo) {
      this.contabilidad.createPlantillaPdaMae(maePayload)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (maeCreado) => {
            this.guardarDetalles(maeCreado.tcoplantillapdamaeId, fv.descripcion, fv.moduloId!);
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al crear plantilla' });
            this.cargando.set(false);
          },
        });
    } else {
      const id = this.plantillaSeleccionada()!.tcoplantillapdamaeId;
      this.contabilidad.updatePlantillaPdaMae(id, maePayload)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            // Eliminar detalles existentes y recrear
            this.eliminarDetallesExistentes(id, fv.descripcion, fv.moduloId!);
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al actualizar plantilla' });
            this.cargando.set(false);
          },
        });
    }
  }

  private eliminarDetallesExistentes(maeId: number, descripcion: string, moduloId: number): void {
    this.contabilidad.getDetallesPlantillaPda(maeId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (detallesExistentes) => {
          if (detallesExistentes.length === 0) {
            this.guardarDetalles(maeId, descripcion, moduloId);
            return;
          }
          let eliminados = 0;
          const total = detallesExistentes.length;
          for (const det of detallesExistentes) {
            this.contabilidad.deletePlantillaPdaDet(det.tcoplantillapdadetId)
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe({
                next: () => {
                  eliminados++;
                  if (eliminados === total) this.guardarDetalles(maeId, descripcion, moduloId);
                },
                error: () => {
                  eliminados++;
                  if (eliminados === total) this.guardarDetalles(maeId, descripcion, moduloId);
                },
              });
          }
        },
        error: () => this.guardarDetalles(maeId, descripcion, moduloId),
      });
  }

  private guardarDetalles(maeId: number, descripcion: string, moduloId: number): void {
    const lineasEnv = this.lineas();
    if (lineasEnv.length === 0) {
      this.finalizarGuardado(descripcion, moduloId);
      return;
    }

    let guardados = 0;
    const total = lineasEnv.length;

    for (let i = 0; i < lineasEnv.length; i++) {
      const l = lineasEnv[i];
      const detPayload = {
        tcoplantillapdamaeId: maeId,
        nrofila: i + 1,
        ctacontable: l.ctacontable,
        descripcion: l.descripcion,
        naturaleza: l.naturaleza,
        moduloId,
      };

      this.contabilidad.createPlantillaPdaDet(detPayload)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            guardados++;
            if (guardados === total) this.finalizarGuardado(descripcion, moduloId);
          },
          error: (err) => {
            guardados++;
            this.mostrarError(`Error guardando línea: ${err.error?.message || ''}`);
            if (guardados === total) this.finalizarGuardado(descripcion, moduloId);
          },
        });
    }
  }

  private finalizarGuardado(descripcion: string, moduloId: number): void {
    const esNuevo = this.vista() === 'crear';
    this.messageService.add({
      severity: 'success',
      summary: esNuevo ? 'Creada' : 'Actualizada',
      detail: `Plantilla "${descripcion}" ${esNuevo ? 'creada' : 'actualizada'} exitosamente`,
    });
    this.volver();
    this.cargarDatos();
    this.cargando.set(false);
  }

  // ===== ELIMINAR =====
  eliminarPlantilla(plantilla: PlantillaPdaMae): void {
    this.confirmationService.confirm({
      message: `¿Está seguro de eliminar la plantilla "${plantilla.descripcion}"?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: { label: 'Cancelar', severity: 'secondary', variant: 'text', size: 'small', rounded: true },
      acceptButtonProps: { label: 'Eliminar', severity: 'danger', variant: 'text', size: 'small', rounded: true },
      accept: () => {
        this.contabilidad.deletePlantillaPdaMae(plantilla.tcoplantillapdamaeId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.messageService.add({ severity: 'success', summary: 'Eliminada', detail: 'Plantilla eliminada' });
              if (this.plantillaSeleccionada()?.tcoplantillapdamaeId === plantilla.tcoplantillapdamaeId) this.volver();
              this.cargarDatos();
            },
            error: () => this.mostrarError('Error al eliminar'),
          });
      },
    });
  }

  // ===== HELPERS =====

  /** Cuentas contables que aparecen más de una vez en el detalle (debe venir vacío) */
  ctasRepetidas(): string[] {
    const vistos = new Set<string>();
    const repetidas: string[] = [];
    for (const l of this.lineas()) {
      const cta = l.ctacontable?.trim();
      if (!cta) continue;
      if (vistos.has(cta)) {
        if (!repetidas.includes(cta)) repetidas.push(cta);
      } else {
        vistos.add(cta);
      }
    }
    return repetidas;
  }

  getCuentaNombre(ctacontable: string): string {
    return this.cuentas().find(c => c.ctacontable === ctacontable)?.descripcion ?? '';
  }

  getModuloLabel(moduloId: number): string {
    const m = this.modulos().find(mod => mod.moduloId === moduloId);
    return m?.descripcion_contable || m?.descripcion || `M${moduloId}`;
  }

  private mostrarError(msg: string): void {
    this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
  }
}
