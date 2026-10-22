import { Component, inject, signal, OnInit, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { PlanillaService } from '../../../core/services/planilla.service';
import { PlanillaEmpleado } from '../../../core/models/planilla.models';

/**
 * Lista de empleados para gestionar sus movimientos de ingreso y egreso.
 *
 * Es el punto de entrada del feature: cada fila abre el manager 1:N
 * (empleado-tipo-mov-manager) con el listado de sus afectaciones económicas.
 * No usa diálogos: el alta y la edición se hacen con el formulario inline
 * del manager.
 */
@Component({
  selector: 'app-empleado-tipo-mov-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TableModule, ButtonModule, InputTextModule, TagModule, TooltipModule],
  templateUrl: './empleado-tipo-mov-list.html',
  styleUrl: './empleado-tipo-mov-list.scss',
})
export class EmpleadoTipoMovList implements OnInit {
  private service = inject(PlanillaService);
  private router = inject(Router);
  private msgs = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  data = signal<PlanillaEmpleado[]>([]);
  cargando = signal(false);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.cargando.set(true);
    this.service
      .getEmpleados()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.data.set(res);
          this.cargando.set(false);
        },
        error: () => {
          this.cargando.set(false);
          this.msgs.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron cargar los empleados',
          });
        },
      });
  }

  abrirMovimientos(id: number): void {
    this.router.navigate(['/planilla/empleado-tipo-mov/editar', id]);
  }

  /** Pantalla de revisión del ISR (retención en la fuente) */
  irARetenciones(): void {
    this.router.navigate(['/planilla/retenciones']);
  }

  activoLbl(sn: string): string {
    return sn === 'S' ? 'Activo' : 'Inactivo';
  }

  activoSev(sn: string): 'success' | 'danger' {
    return sn === 'S' ? 'success' : 'danger';
  }
}
