import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ContabilidadService } from '../../../core/services/contabilidad.service';
import { PeriodoContable, CierreContable } from '../../../core/models/contabilidad.models';

@Component({
  selector: 'app-cierre-contable',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule,
    InputNumberModule, InputTextModule, SelectModule, ToastModule,
    ConfirmDialogModule, TagModule, TooltipModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './cierre-contable.html',
  styleUrl: './cierre-contable.scss',
})
export class CierreContableComponent implements OnInit {
  private contabilidad = inject(ContabilidadService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private destroyRef = inject(DestroyRef);

  // Estado
  periodos = signal<PeriodoContable[]>([]);
  cierres = signal<CierreContable[]>([]);
  cargando = signal(false);

  // Filtros / Formulario
  periodoSeleccionado = signal<number>(new Date().getMonth() + 1);
  anioSeleccionado = signal<number>(new Date().getFullYear());
  observacion = signal('');

  // Meses
  readonly meses = [
    { label: 'Enero', value: 1 }, { label: 'Febrero', value: 2 }, { label: 'Marzo', value: 3 },
    { label: 'Abril', value: 4 }, { label: 'Mayo', value: 5 }, { label: 'Junio', value: 6 },
    { label: 'Julio', value: 7 }, { label: 'Agosto', value: 8 }, { label: 'Septiembre', value: 9 },
    { label: 'Octubre', value: 10 }, { label: 'Noviembre', value: 11 }, { label: 'Diciembre', value: 12 },
  ];

  ngOnInit(): void {
    this.cargarDatos();
  }

  private cargarDatos(): void {
    this.cargando.set(true);

    this.contabilidad.getPeriodos()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => { this.periodos.set(data); this.cargando.set(false); },
        error: () => { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error cargando períodos' }); this.cargando.set(false); },
      });

    this.contabilidad.getCierres()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (data) => this.cierres.set(data) });
  }

  realizarCierre(): void {
    const periodo = this.periodoSeleccionado();
    const anio = this.anioSeleccionado();

    // Verificar si ya existe un cierre para este período
    const yaCerrado = this.periodos().find(p => p.nroanio === anio && p.nromes === periodo && p.sn_abierto === 'N');
    if (yaCerrado) {
      this.messageService.add({ severity: 'warn', summary: 'Ya cerrado', detail: `El período ${periodo}/${anio} ya está cerrado` });
      return;
    }

    this.confirmationService.confirm({
      message: `¿Está seguro de cerrar el período ${this.meses.find(m => m.value === periodo)?.label} ${anio}? Esta acción bloqueará todos los movimientos contables de este período.`,
      header: 'Confirmar cierre contable',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Cerrar período',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.cargando.set(true);
        this.contabilidad.realizarCierre({
          periodo,
          anio,
          observacion: this.observacion() || `Cierre ${periodo}/${anio}`,
        }).pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Cierre realizado', detail: `Período ${periodo}/${anio} cerrado exitosamente` });
            this.observacion.set('');
            this.cargarDatos();
            this.cargando.set(false);
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al realizar cierre' });
            this.cargando.set(false);
          },
        });
      },
    });
  }

  getEstadoPeriodo(periodo: PeriodoContable): string {
    return periodo.sn_abierto === 'S' ? 'Abierto' : 'Cerrado';
  }

  getSeverityPeriodo(periodo: PeriodoContable): string {
    return periodo.sn_abierto === 'S' ? 'success' : 'danger';
  }

  getMesLabel(mes: number): string {
    return this.meses.find(m => m.value === mes)?.label ?? '';
  }

  isPeriodoActual(periodo: number, anio: number): boolean {
    const now = new Date();
    return periodo === now.getMonth() + 1 && anio === now.getFullYear();
  }
}
