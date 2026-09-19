import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { TabsModule } from 'primeng/tabs';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';
import { ContabilidadService } from '../../../core/services/contabilidad.service';

@Component({
  selector: 'app-reportes-contables',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule,
    InputNumberModule, SelectModule, ToastModule, TabsModule, CardModule,
  ],
  providers: [MessageService],
  templateUrl: './reportes-contables.html',
  styleUrl: './reportes-contables.scss',
})
export class ReportesContablesComponent implements OnInit {
  private contabilidad = inject(ContabilidadService);
  private messageService = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  // Filtros
  periodo = signal(new Date().getMonth() + 1);
  anio = signal(new Date().getFullYear());
  cargando = signal(false);

  // Datos de reportes
  balanceComprobacion = signal<any[]>([]);
  libroDiario = signal<any[]>([]);
  libroMayor = signal<any[]>([]);

  // Tab activa
  tabActiva = signal(0);

  // Meses
  readonly meses = [
    { label: 'Enero', value: 1 }, { label: 'Febrero', value: 2 }, { label: 'Marzo', value: 3 },
    { label: 'Abril', value: 4 }, { label: 'Mayo', value: 5 }, { label: 'Junio', value: 6 },
    { label: 'Julio', value: 7 }, { label: 'Agosto', value: 8 }, { label: 'Septiembre', value: 9 },
    { label: 'Octubre', value: 10 }, { label: 'Noviembre', value: 11 }, { label: 'Diciembre', value: 12 },
  ];

  // Totales computed
  totalDebe = computed(() => this.balanceComprobacion().reduce((sum, r) => sum + (r.debeMes || 0), 0));
  totalHaber = computed(() => this.balanceComprobacion().reduce((sum, r) => sum + (r.haberMes || 0), 0));
  totalSaldoDeudor = computed(() => this.balanceComprobacion().reduce((sum, r) => sum + (r.saldoDeudor || 0), 0));
  totalSaldoAcreedor = computed(() => this.balanceComprobacion().reduce((sum, r) => sum + (r.saldoAcreedor || 0), 0));

  totalPartidas = computed(() => this.libroDiario().length);
  totalLineasDiario = computed(() => this.libroDiario().reduce((sum, p) => sum + (p.lineas?.length || 0), 0));

  ngOnInit(): void {}

  generarBalanceComprobacion(): void {
    this.cargando.set(true);
    this.contabilidad.generarBalanceComprobacion({
      empresaId: 0,
      periodo: this.periodo(),
      anio: this.anio(),
    }).pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (data) => {
        this.balanceComprobacion.set(data);
        this.messageService.add({ severity: 'success', summary: 'Generado', detail: `Balance de comprobación: ${data.length} cuentas` });
        this.cargando.set(false);
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al generar balance' });
        this.cargando.set(false);
      },
    });
  }

  generarLibroDiario(): void {
    this.cargando.set(true);
    this.contabilidad.generarLibroDiario({
      empresaId: 0,
      periodo: this.periodo(),
      anio: this.anio(),
    }).pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (data) => {
        this.libroDiario.set(data);
        this.messageService.add({ severity: 'success', summary: 'Generado', detail: `Libro diario: ${data.length} partidas` });
        this.cargando.set(false);
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al generar libro diario' });
        this.cargando.set(false);
      },
    });
  }

  generarLibroMayor(): void {
    this.cargando.set(true);
    this.contabilidad.generarLibroMayor({
      empresaId: 0,
      periodo: this.periodo(),
      anio: this.anio(),
    }).pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (data) => {
        this.libroMayor.set(data);
        this.messageService.add({ severity: 'success', summary: 'Generado', detail: `Libro mayor: ${data.length} cuentas` });
        this.cargando.set(false);
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al generar libro mayor' });
        this.cargando.set(false);
      },
    });
  }

  generarTodos(): void {
    this.generarBalanceComprobacion();
    this.generarLibroDiario();
    this.generarLibroMayor();
  }

  getMesLabel(): string {
    return this.meses.find(m => m.value === this.periodo())?.label ?? '';
  }
}
