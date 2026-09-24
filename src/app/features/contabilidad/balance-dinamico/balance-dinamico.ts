import { Component, OnInit, inject, signal, computed, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ContabilidadService } from '../../../core/services/contabilidad.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  PlantillaBalancesMae, NivelCta, BalanceDinamicoReporte,
} from '../../../core/models/contabilidad.models';

@Component({
  selector: 'app-balance-dinamico',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule,
    InputNumberModule, SelectModule, ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './balance-dinamico.html',
  styleUrl: './balance-dinamico.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BalanceDinamicoComponent implements OnInit {
  private contabilidad = inject(ContabilidadService);
  private auth = inject(AuthService);
  private messageService = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  // Catálogos
  plantillas = signal<PlantillaBalancesMae[]>([]);
  niveles = signal<NivelCta[]>([]);

  // Filtros
  plantillaId = signal<number | null>(null);
  nivelDetalle = signal<number | null>(null);
  periodo = signal(new Date().getMonth() + 1);
  anio = signal(new Date().getFullYear());

  // Resultado
  reporte = signal<BalanceDinamicoReporte | null>(null);
  cargando = signal(false);

  // Opciones para selects
  plantillaOptions = computed(() =>
    this.plantillas().map(p => ({ label: p.descripcion, value: p.cocdefbalmaId }))
  );

  nivelOptions = computed(() => {
    const niveles = this.niveles()
      .filter(n => n.sn_activo === 'S')
      .sort((a, b) => Number(a.nivel) - Number(b.nivel));
    return [
      { label: 'Todos (sin filtro)', value: null as number | null },
      ...niveles.map(n => ({ label: `Nivel ${n.nivel}`, value: Number(n.nivel) })),
    ];
  });

  readonly meses = [
    { label: 'Enero', value: 1 }, { label: 'Febrero', value: 2 }, { label: 'Marzo', value: 3 },
    { label: 'Abril', value: 4 }, { label: 'Mayo', value: 5 }, { label: 'Junio', value: 6 },
    { label: 'Julio', value: 7 }, { label: 'Agosto', value: 8 }, { label: 'Septiembre', value: 9 },
    { label: 'Octubre', value: 10 }, { label: 'Noviembre', value: 11 }, { label: 'Diciembre', value: 12 },
  ];

  // Columnas a mostrar: Col0 (si aplica) + columnas usadas 1..7
  columnasVisibles = computed(() => {
    const r = this.reporte();
    if (!r) return [];
    return r.columnasUsadas;
  });

  mostrarCol0 = computed(() => this.reporte()?.mostrarCol0 ?? false);

  lineasOrdenadas = computed(() => this.reporte()?.lineas ?? []);

  ngOnInit(): void {
    this.cargarCatalogos();
  }

  private cargarCatalogos(): void {
    this.contabilidad.getPlantillasBalances()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (plantillas) => {
          this.plantillas.set(plantillas.filter(p => p.sn_activo === 'S'));
          const activas = plantillas.filter(p => p.sn_activo === 'S');
          if (activas.length > 0 && this.plantillaId() == null) {
            this.plantillaId.set(activas[0].cocdefbalmaId);
          }
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las plantillas' }),
      });

    this.contabilidad.getNiveles()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (niveles) => this.niveles.set(niveles),
        error: () => {},
      });
  }

  generar(): void {
    const plantillaId = this.plantillaId();
    if (!plantillaId) {
      this.messageService.add({ severity: 'warn', summary: 'Requerido', detail: 'Seleccione una plantilla de balance' });
      return;
    }

    const empresaId = this.auth.currentUser()?.empresaId;
    if (!empresaId) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo identificar la empresa' });
      return;
    }

    this.cargando.set(true);
    this.contabilidad.generarBalanceDinamico({
      empresaId,
      plantillaId,
      nivelDetalle: this.nivelDetalle() ?? undefined,
      periodo: this.periodo(),
      anio: this.anio(),
    }).pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (reporte) => {
        this.reporte.set(reporte);
        this.messageService.add({
          severity: 'success',
          summary: 'Generado',
          detail: `Balance "${reporte.balancename}": ${reporte.lineas.length} líneas`,
        });
        this.cargando.set(false);
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'No se pudo generar el reporte',
        });
        this.cargando.set(false);
      },
    });
  }

  getMesLabel(): string {
    return this.meses.find(m => m.value === this.periodo())?.label ?? '';
  }

  /** Valor a mostrar en la celda de columna N (vacío si la línea va en otra columna) */
  valorCelda(linea: { columna: number; valor: number }, col: number): number | null {
    return linea.columna === col ? linea.valor : null;
  }

  /** Total de una columna */
  totalCol(col: number): number {
    return this.reporte()?.totales[String(col)] ?? 0;
  }

  trackByRenglon = (_: number, l: { renglon: number; ctacontable: string }) => `${l.renglon}-${l.ctacontable}`;
}
