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
import { ActivatedRoute, Router } from '@angular/router';
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
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  /** Partida contable de origen (viaja en la URL al abrir desde copdamae) */
  partidaId = signal<number | null>(null);

  // Estado
  periodos = signal<PeriodoContable[]>([]);
  cierres = signal<CierreContable[]>([]);
  cargando = signal(false);

  // Filtros / Formulario
  periodoSeleccionado = signal<number>(new Date().getMonth() + 1);
  anioSeleccionado = signal<number>(new Date().getFullYear());
  observacion = signal('');

  /** Período/año marcado como origen (llega desde partida en copdamae) */
  origenPeriodo = signal<number | null>(null);
  origenAnio = signal<number | null>(null);

  // Meses
  readonly meses = [
    { label: 'Enero', value: 1 }, { label: 'Febrero', value: 2 }, { label: 'Marzo', value: 3 },
    { label: 'Abril', value: 4 }, { label: 'Mayo', value: 5 }, { label: 'Junio', value: 6 },
    { label: 'Julio', value: 7 }, { label: 'Agosto', value: 8 }, { label: 'Septiembre', value: 9 },
    { label: 'Octubre', value: 10 }, { label: 'Noviembre', value: 11 }, { label: 'Diciembre', value: 12 },
  ];

  ngOnInit(): void {
    // Partida contable de origen (botón "Volver a la partida")
    const partida = Number(this.route.snapshot.queryParamMap.get('partidaId'));
    if (!isNaN(partida) && partida > 0) this.partidaId.set(partida);

    // Trazabilidad contable: ?periodo=&anio= (llega desde partida de cierre en copdamae)
    const periodo = Number(this.route.snapshot.queryParamMap.get('periodo'));
    const anio = Number(this.route.snapshot.queryParamMap.get('anio'));
    if (periodo >= 1 && periodo <= 12) {
      this.periodoSeleccionado.set(periodo);
      this.origenPeriodo.set(periodo);
    }
    if (anio >= 2000 && anio <= 2100) {
      this.anioSeleccionado.set(anio);
      this.origenAnio.set(anio);
    }
    this.cargarDatos();
  }

  /** Marca la fila del período que originó la partida contable. */
  esOrigen(periodo: PeriodoContable): boolean {
    const p = this.origenPeriodo();
    const a = this.origenAnio();
    return p != null && a != null && periodo.nromes === p && periodo.nroanio === a;
  }

  /** Regresa a la partida contable de origen desde la que se abrió este cierre. */
  volverAPartida(): void {
    if (!this.partidaId()) return;
    this.router.navigate(['/contabilidad/copdamae'], {
      queryParams: { partidaId: this.partidaId() },
    });
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

    // Cierre secuencial: no cerrar si quedan períodos anteriores abiertos
    const anterioresAbiertos = this.periodos()
      .filter(p => p.sn_abierto === 'S' && (p.nroanio < anio || (p.nroanio === anio && p.nromes < periodo)))
      .sort((a, b) => a.nroanio - b.nroanio || a.nromes - b.nromes);
    if (anterioresAbiertos.length > 0) {
      const lista = anterioresAbiertos.map(p => `${p.nromes}/${p.nroanio}`).join(', ');
      this.messageService.add({
        severity: 'warn',
        summary: 'Cierre no permitido',
        detail: `Primero deben cerrarse los períodos anteriores abiertos: ${lista}`,
      });
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
    return periodo.sn_abierto === 'S' ? 'success' : 'warning';
  }

  getMesLabel(mes: number): string {
    return this.meses.find(m => m.value === mes)?.label ?? '';
  }

  isPeriodoActual(periodo: number, anio: number): boolean {
    const now = new Date();
    return periodo === now.getMonth() + 1 && anio === now.getFullYear();
  }
}
