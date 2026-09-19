import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ContabilidadService } from '../../../core/services/contabilidad.service';
import { CopdaMae, CopdaDet, CtaContable, PeriodoContable } from '../../../core/models/contabilidad.models';

@Component({
  selector: 'app-partida-diario',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    TableModule, ButtonModule, InputTextModule, InputNumberModule,
    SelectModule, ToastModule, ConfirmDialogModule,
    DialogModule, TagModule, TooltipModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './partida-diario.html',
  styleUrl: './partida-diario.scss',
})
export class PartidaDiarioComponent implements OnInit {
  private fb = inject(FormBuilder);
  private contabilidad = inject(ContabilidadService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private destroyRef = inject(DestroyRef);

  // Estado
  partidas = signal<CopdaMae[]>([]);
  cuentas = signal<CtaContable[]>([]);
  periodos = signal<PeriodoContable[]>([]);
  partidaSeleccionada = signal<CopdaMae | null>(null);
  detallesPartida = signal<CopdaDet[]>([]);
  cargando = signal(false);
  dialogVisible = signal(false);
  dialogDetallesVisible = signal(false);
  esEdicion = signal(false);

  // Filtros
  filtroPeriodo = signal<number | null>(null);
  filtroAnio = signal<number | null>(null);
  filtroReferencia = signal('');

  // Formulario
  form!: FormGroup;
  formDetalles!: FormArray;

  // Computed
  partidasFiltradas = computed(() => {
    let resultado = this.partidas();
    const periodo = this.filtroPeriodo();
    const anio = this.filtroAnio();
    const ref = this.filtroReferencia();

    if (periodo != null) resultado = resultado.filter(p => p.periodo === periodo);
    if (anio != null) resultado = resultado.filter(p => p.anio === anio);
    if (ref) resultado = resultado.filter(p => p.nroreferencia?.toLowerCase().includes(ref.toLowerCase()));
    return resultado;
  });

  totalDebito = computed(() => {
    return this.formDetalles?.controls.reduce((sum, ctrl) => sum + (ctrl.get('debito')?.value || 0), 0) ?? 0;
  });

  totalCredito = computed(() => {
    return this.formDetalles?.controls.reduce((sum, ctrl) => sum + (ctrl.get('credito')?.value || 0), 0) ?? 0;
  });

  diferencia = computed(() => Math.round((this.totalDebito() - this.totalCredito()) * 100) / 100);

  partidaCuadrada = computed(() => this.diferencia() === 0 && this.totalDebito() > 0);

  ngOnInit(): void {
    this.initForm();
    this.cargarDatos();
  }

  private initForm(): void {
    this.formDetalles = this.fb.array([]);
    this.form = this.fb.group({
      periodo: [new Date().getMonth() + 1, Validators.required],
      anio: [new Date().getFullYear(), Validators.required],
      nroreferencia: ['', Validators.required],
      descripcion: ['', Validators.required],
      moduloId: [1, Validators.required],
      documentoId: [0],
      fechadocumento: [new Date()],
      factordecambio: [1],
    });
  }

  private cargarDatos(): void {
    this.contabilidad.getPartidas()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (data) => this.partidas.set(data), error: () => this.mostrarError('Error cargando partidas') });

    this.contabilidad.getCuentas()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (data) => this.cuentas.set(data), error: () => this.mostrarError('Error cargando cuentas') });

    this.contabilidad.getPeriodos()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (data) => this.periodos.set(data), error: () => {} });
  }

  // ========== CRUD Partidas ==========

  nuevaPartida(): void {
    this.esEdicion.set(false);
    this.form.reset({
      periodo: new Date().getMonth() + 1,
      anio: new Date().getFullYear(),
      nroreferencia: '',
      descripcion: '',
      moduloId: 1,
      documentoId: 0,
      fechadocumento: new Date(),
      factordecambio: 1,
    });
    this.formDetalles.clear();
    this.agregarLinea();
    this.agregarLinea();
    this.dialogVisible.set(true);
  }

  editarPartida(partida: CopdaMae): void {
    this.esEdicion.set(true);
    this.partidaSeleccionada.set(partida);
    this.form.patchValue({
      periodo: partida.periodo,
      anio: partida.anio,
      nroreferencia: partida.nroreferencia,
      descripcion: partida.descripcion,
      moduloId: partida.moduloId,
      documentoId: partida.documentoId,
      fechadocumento: partida.fechadocumento,
      factordecambio: partida.factordecambio,
    });

    // Cargar detalles
    this.contabilidad.getDetallesPartida(partida.copdamaeId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (detalles) => {
          this.formDetalles.clear();
          detalles.forEach(det => {
            this.formDetalles.push(this.fb.group({
              ctacontable: [det.ctacontable, Validators.required],
              descripcion: [det.descripcion],
              debito: [det.debito || 0],
              credito: [det.credito || 0],
            }));
          });
          this.detallesPartida.set(detalles);
        },
      });
    this.dialogVisible.set(true);
  }

  verDetalles(partida: CopdaMae): void {
    this.partidaSeleccionada.set(partida);
    this.contabilidad.getDetallesPartida(partida.copdamaeId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (det) => { this.detallesPartida.set(det); this.dialogDetallesVisible.set(true); } });
  }

  // ========== Líneas de detalle ==========

  agregarLinea(): void {
    this.formDetalles.push(this.fb.group({
      ctacontable: ['', Validators.required],
      descripcion: [''],
      debito: [0],
      credito: [0],
    }));
  }

  eliminarLinea(index: number): void {
    if (this.formDetalles.length > 2) {
      this.formDetalles.removeAt(index);
    } else {
      this.messageService.add({ severity: 'warn', summary: 'Mínimo', detail: 'Una partida debe tener al menos 2 líneas' });
    }
  }

  // ========== Contabilizar ==========

  contabilizar(): void {
    if (!this.form.valid || !this.partidaCuadrada()) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Verifique el formulario y que la partida esté cuadrada' });
      return;
    }

    const formValue = this.form.value;
    const lineas = this.formDetalles.controls.map(ctrl => ({
      ctacontable: ctrl.get('ctacontable')?.value,
      descripcion: ctrl.get('descripcion')?.value || formValue.descripcion,
      debito: ctrl.get('debito')?.value || 0,
      credito: ctrl.get('credito')?.value || 0,
    }));

    this.cargando.set(true);
    this.contabilidad.contabilizarPartida({
      empresaId: 0, // Se inyecta automáticamente
      Idsucursal: 0,
      periodo: formValue.periodo,
      anio: formValue.anio,
      moduloId: formValue.moduloId,
      documentoId: formValue.documentoId || 0,
      fechadocumento: formValue.fechadocumento,
      nroreferencia: formValue.nroreferencia,
      descripcion: formValue.descripcion,
      factordecambio: formValue.factordecambio,
      lineas,
    }).pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (result) => {
        this.messageService.add({ severity: 'success', summary: 'Contabilizado', detail: `Partida #${result.nropartida} creada exitosamente` });
        this.dialogVisible.set(false);
        this.cargarDatos();
        this.cargando.set(false);
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al contabilizar' });
        this.cargando.set(false);
      },
    });
  }

  eliminarPartida(partida: CopdaMae): void {
    this.confirmationService.confirm({
      message: `¿Está seguro de eliminar la Partida #${partida.nropartida}?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.contabilidad.eliminarPartida(partida.copdamaeId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.messageService.add({ severity: 'success', summary: 'Eliminada', detail: 'Partida eliminada' });
              this.cargarDatos();
            },
            error: () => this.mostrarError('Error al eliminar'),
          });
      },
    });
  }

  // ========== Helpers ==========

  getCuentaDescripcion(ctacontable: string): string {
    return this.cuentas().find(c => c.ctacontable === ctacontable)?.descripcion ?? '';
  }

  getPeriodoLabel(periodo: number): string {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return meses[periodo - 1] ?? '';
  }

  getModuloLabel(moduloId: number): string {
    const modulos: Record<number, string> = { 1: 'Gen', 2: 'Fac', 3: 'Inv', 4: 'CxC', 5: 'CxP', 6: 'Bco', 7: 'Pla', 8: 'Con' };
    return modulos[moduloId] ?? `M${moduloId}`;
  }

  private mostrarError(msg: string): void {
    this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
  }
}
