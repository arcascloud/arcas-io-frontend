import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
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

/**
 * Reversión de cierre contable / reapertura de período.
 * Proceso SEPARADO del cierre: deshace la partida de cierre, revierte
 * coctamov/coctasaldos, elimina el espejo de saldos (cocierredet/cocierremae),
 * libera el candado sn_cerrada de las partidas y reabre el período.
 */
@Component({
  selector: 'app-reversar-cierre',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule,
    InputNumberModule, InputTextModule, SelectModule, ToastModule,
    ConfirmDialogModule, TagModule, TooltipModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './reversar-cierre.html',
  styleUrl: './reversar-cierre.scss',
})
export class ReversarCierreComponent implements OnInit {
  private contabilidad = inject(ContabilidadService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Estado
  periodos = signal<PeriodoContable[]>([]);
  cierres = signal<CierreContable[]>([]);
  cargando = signal(false);

  // Formulario
  periodoSeleccionado = signal<number>(new Date().getMonth() + 1);
  anioSeleccionado = signal<number>(new Date().getFullYear());
  motivo = signal('');

  // Meses
  readonly meses = [
    { label: 'Enero', value: 1 }, { label: 'Febrero', value: 2 }, { label: 'Marzo', value: 3 },
    { label: 'Abril', value: 4 }, { label: 'Mayo', value: 5 }, { label: 'Junio', value: 6 },
    { label: 'Julio', value: 7 }, { label: 'Agosto', value: 8 }, { label: 'Septiembre', value: 9 },
    { label: 'Octubre', value: 10 }, { label: 'Noviembre', value: 11 }, { label: 'Diciembre', value: 12 },
  ];

  ngOnInit(): void {
    // Preselección cuando se llega desde Cierre Contable (?periodo=X&anio=Y)
    const p = this.route.snapshot.queryParamMap.get('periodo');
    const a = this.route.snapshot.queryParamMap.get('anio');
    if (p) this.periodoSeleccionado.set(Number(p));
    if (a) this.anioSeleccionado.set(Number(a));

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

  revertir(): void {
    const periodo = this.periodoSeleccionado();
    const anio = this.anioSeleccionado();

    // 1. El período debe existir y estar cerrado
    const per = this.periodos().find(p => p.nroanio === anio && p.nromes === periodo);
    if (!per) {
      this.messageService.add({ severity: 'warn', summary: 'Período inexistente', detail: `No existe el período ${periodo}/${anio}` });
      return;
    }
    if (per.sn_abierto !== 'N') {
      this.messageService.add({ severity: 'warn', summary: 'Período abierto', detail: `El período ${periodo}/${anio} no está cerrado: no hay cierre que revertir` });
      return;
    }

    // 2. Secuencia inversa: no reabrir si quedan períodos posteriores cerrados
    const posterioresCerrados = this.periodos()
      .filter(p => p.sn_abierto === 'N' && (p.nroanio > anio || (p.nroanio === anio && p.nromes > periodo)))
      .sort((a, b) => a.nroanio - b.nroanio || a.nromes - b.nromes);
    if (posterioresCerrados.length > 0) {
      const lista = posterioresCerrados.map(p => `${p.nromes}/${p.nroanio}`).join(', ');
      this.messageService.add({
        severity: 'warn',
        summary: 'Reversión no permitida',
        detail: `Primero deben revertirse los cierres de los períodos posteriores: ${lista}`,
      });
      return;
    }

    this.confirmationService.confirm({
      message:
        `¿Está seguro de REVERTIR el cierre de <strong>${this.getMesLabel(periodo)} ${anio}</strong>?<br><br>` +
        'Esta acción:<br>' +
        '· Eliminará la partida de cierre<br>' +
        '· Revertirá los movimientos y salidos contables de este período<br>' +
        '· Liberará el candado de todas las partidas del período<br>' +
        '· Reabrirá el período para nuevo registro',
      header: 'Confirmar reversión de cierre',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Revertir cierre',
      rejectLabel: 'Cancelar',
      acceptButtonProps: {
        label: 'Revertir cierre',
        severity: 'danger',
        variant: 'text',
        size: 'small',
        rounded: true,
      },
      rejectButtonProps: {
        label: 'Cancelar',
        severity: 'secondary',
        variant: 'text',
        size: 'small',
        rounded: true,
      },
      accept: () => {
        this.cargando.set(true);
        this.contabilidad.revertirCierre({
          periodo,
          anio,
          observacion: this.motivo() || `Reversión de cierre ${periodo}/${anio}`,
        }).pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (res) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Cierre revertido',
              detail: `Período ${periodo}/${anio} reabierto. Movimientos revertidos: ${res.movimientosRevertidos ?? 0}`,
            });
            this.motivo.set('');
            this.cargarDatos();
            this.cargando.set(false);
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al revertir el cierre' });
            this.cargando.set(false);
          },
        });
      },
    });
  }

  /** Selecciona el período desde la tabla y dispara la reversión */
  seleccionarYRevertir(periodo: PeriodoContable): void {
    this.periodoSeleccionado.set(periodo.nromes);
    this.anioSeleccionado.set(periodo.nroanio);
    this.revertir();
  }

  cerrados(): PeriodoContable[] {
    return this.periodos()
      .filter(p => p.sn_abierto === 'N')
      .sort((a, b) => b.nroanio - a.nroanio || b.nromes - a.nromes);
  }

  /** El último cerrado es el único reversible (los posteriores bloquean) */
  esUltimoCerrado(p: PeriodoContable): boolean {
    const lista = this.cerrados();
    return lista.length > 0 && lista[0].nroanio === p.nroanio && lista[0].nromes === p.nromes;
  }

  getMesLabel(mes: number): string {
    return this.meses.find(m => m.value === mes)?.label ?? '';
  }

  volver(): void {
    this.router.navigate(['/contabilidad/cierre-contable']);
  }
}
