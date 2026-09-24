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
import { forkJoin } from 'rxjs';
import { ContabilidadService } from '../../../core/services/contabilidad.service';
import { AuthService } from '../../../core/services/auth.service';
import { CtaContable, PlantillaBalancesMae, PlantillaBalancesDet } from '../../../core/models/contabilidad.models';

type VistaTipo = 'lista' | 'crear' | 'editar' | 'ver';

/** Línea de detalle en el formulario */
interface LineaBalance {
  id: number;
  tipo: string;
  ctacontable: string;
  ctaNombre: string;
  descripcion: string;
  columna: number | null;
  renglon: number | null;
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

  cuentasMovimiento = computed(() => this.cuentas().filter(c => c.sn_operable === 'S'));

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
          this.lineas.set(detalles.map(d => ({
            id: this.siguienteId++,
            tipo: d.tipo ?? 'D',
            ctacontable: d.ctacontable ?? '',
            ctaNombre: this.getCuentaNombre(d.ctacontable ?? ''),
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
  }

  // ===== BÚSQUEDA DE CUENTAS =====
  buscar(e: AutoCompleteCompleteEvent): void {
    const q = e.query.trim().toLowerCase();
    this.sugerencias.set(
      this.cuentasMovimiento().filter(c =>
        c.ctacontable.toLowerCase().includes(q) ||
        c.descripcion.toLowerCase().includes(q)
      ),
    );
  }

  agregar(e: AutoCompleteSelectEvent): void {
    const cuenta = e.value as CtaContable;
    const linea: LineaBalance = {
      id: this.siguienteId++,
      tipo: 'D',
      ctacontable: cuenta.ctacontable,
      ctaNombre: cuenta.descripcion,
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
          next: () => this.eliminarDetallesExistentes(id),
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al actualizar plantilla' });
            this.cargando.set(false);
          },
        });
    }
  }

  private eliminarDetallesExistentes(maeId: number): void {
    this.contabilidad.getDetallesPlantillaBalances(maeId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (detallesExistentes) => {
          if (detallesExistentes.length === 0) {
            this.guardarDetalles(maeId);
            return;
          }
          let completados = 0;
          let fallos = 0;
          const total = detallesExistentes.length;
          const avanzar = () => {
            completados++;
            if (completados < total) return;
            if (fallos > 0) {
              this.cargando.set(false);
              this.mostrarError(`No se pudieron eliminar ${fallos} de ${total} líneas existentes. Intente de nuevo.`);
              return;
            }
            this.guardarDetalles(maeId);
          };
          for (const det of detallesExistentes) {
            this.contabilidad.deletePlantillaBalancesDet(det.tcoplantillabalancesdetid)
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe({
                next: () => avanzar(),
                error: () => { fallos++; avanzar(); },
              });
          }
        },
        error: () => this.guardarDetalles(maeId),
      });
  }

  private guardarDetalles(maeId: number): void {
    const lineasEnv = this.lineas();
    if (lineasEnv.length === 0) {
      this.finalizarGuardado();
      return;
    }

    let guardados = 0;
    const total = lineasEnv.length;

    for (let i = 0; i < lineasEnv.length; i++) {
      const l = lineasEnv[i];
      const detPayload = {
        cocdefbalmaId: maeId,
        tipo: l.tipo,
        ctacontable: l.ctacontable,
        descripcion: l.descripcion,
        columna: l.columna,
        renglon: i + 1,
      };

      this.contabilidad.createPlantillaBalancesDet(detPayload)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            guardados++;
            if (guardados === total) this.finalizarGuardado();
          },
          error: (err) => {
            guardados++;
            this.mostrarError(`Error guardando línea: ${err.error?.message || ''}`);
            if (guardados === total) this.finalizarGuardado();
          },
        });
    }
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

  private mostrarError(msg: string): void {
    this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
  }
}
