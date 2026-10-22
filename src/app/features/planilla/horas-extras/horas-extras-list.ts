import { Component, DestroyRef, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PlanillaService } from '../../../core/services/planilla.service';
import {
  AutorizacionHorasExtras,
  DeptoEmpresa,
  PlanillaEmpleado,
} from '../../../core/models/planilla.models';

/**
 * Listado de autorizaciones de pago de horas extras.
 *
 * Regla de negocio: sólo se pagan horas extras a los empleados autorizados
 * cuya asistencia caiga dentro del rango (fecha_desde / fecha_hasta).
 */
@Component({
  selector: 'app-horas-extras-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TooltipModule,
    ConfirmDialogModule,
  ],
  templateUrl: './horas-extras-list.html',
  styleUrl: './horas-extras-list.scss',
})
export class HorasExtrasList implements OnInit {
  private service = inject(PlanillaService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private msgs = inject(MessageService);
  private confirmation = inject(ConfirmationService);
  private destroyRef = inject(DestroyRef);

  data = signal<AutorizacionHorasExtras[]>([]);
  cargando = signal(false);
  q = signal('');

  private mapaDeptos = signal<Record<number, string>>({});
  private mapaEmpleados = signal<Record<number, string>>({});

  /** Filas visibles según el texto de búsqueda. */
  filtrados = computed(() => {
    const texto = this.q().trim().toLowerCase();
    const lista = this.data();
    if (!texto) return lista;
    return lista.filter((a) => {
      const compuesto = [
        a.pleauthoraexmaeid,
        this.nombreDepto(a.deptoId),
        this.nombreEmpleado(a.solicitado_por),
        this.nombreEmpleado(a.autorizado_por),
        `${a.periodo}/${a.anio_ejercicio}`,
        a.razon_justificacion ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return compuesto.includes(texto);
    });
  });

  ngOnInit(): void {
    this.service
      .getDeptos()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => this.mapaDeptos.set(this.indexarNombre(res, 'deptoId', 'descripcion')),
        error: () => this.mapaDeptos.set({}),
      });

    this.service
      .getEmpleados()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) =>
          this.mapaEmpleados.set(
            this.indexarNombre(
              res.map((e) => ({
                id: e.empleadoId,
                nombre: `${e.apellidos}, ${e.nombres}`,
              })),
              'id',
              'nombre',
            ),
          ),
        error: () => this.mapaEmpleados.set({}),
      });

    this.load();
  }

  load(): void {
    this.cargando.set(true);
    this.service
      .getAutorizaciones()
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
            detail: 'No se pudieron cargar las autorizaciones de horas extras',
          });
        },
      });
  }

  nuevo(): void {
    this.router.navigate(['nuevo'], { relativeTo: this.route });
  }

  editar(id: number): void {
    this.router.navigate(['editar', id], { relativeTo: this.route });
  }

  eliminar(item: AutorizacionHorasExtras): void {
    this.confirmation.confirm({
      message: `¿Está seguro de eliminar la autorización <strong>#${item.pleauthoraexmaeid}</strong>? Se quitarán también las líneas de empleados.`,
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
          .deleteAutorizacion(item.pleauthoraexmaeid)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.msgs.add({
                severity: 'success',
                summary: 'Eliminada',
                detail: `Autorización #${item.pleauthoraexmaeid} eliminada`,
              });
              this.load();
            },
            error: () => {
              /* el interceptor global ya mostró el error */
            },
          });
      },
    });
  }

  nombreDepto(id: number): string {
    return this.mapaDeptos()[id] ?? `Depto ${id}`;
  }

  nombreEmpleado(id: number): string {
    return this.mapaEmpleados()[id] ?? `Empleado ${id}`;
  }

  rango(item: AutorizacionHorasExtras): string {
    if (!item.fecha_desde || !item.fecha_hasta) return '—';
    return `${this.fmtFecha(item.fecha_desde)} al ${this.fmtFecha(item.fecha_hasta)}`;
  }

  fmtFecha(valor: string): string {
    const partes = (valor ?? '').substring(0, 10).split('-');
    if (partes.length !== 3) return valor;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  fmtHora(valor: string | null | undefined): string {
    if (!valor) return '—';
    const partes = valor.split(':');
    return `${partes[0]}:${partes[1] ?? '00'}`;
  }

  limpiar(): void {
    this.q.set('');
  }

  private indexarNombre<T>(items: T[], key: string, campo: string): Record<number, string> {
    const mapa: Record<number, string> = {};
    for (const item of items) {
      const crudo = item as unknown as Record<string, unknown>;
      mapa[Number(crudo[key])] = String(crudo[campo] ?? '');
    }
    return mapa;
  }
}
