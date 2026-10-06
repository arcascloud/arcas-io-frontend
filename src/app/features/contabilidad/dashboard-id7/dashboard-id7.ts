import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  DestroyRef,
  Injector,
  inject,
  signal,
  effect,
  afterNextRender,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables, ChartConfiguration } from 'chart.js';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ContabilidadService } from '../../../core/services/contabilidad.service';
import {
  DashboardData,
  DashboardComparativo,
} from '../../../core/models/contabilidad.models';

Chart.register(...registerables);

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

/** Colores de las series (coherentes con los tokens --c-* del tema). */
const C = {
  activos: '#10b981',
  activosSuave: '#6ee7b7',
  pasivos: '#f59e0b',
  capital: '#3b82f6',
  ingreso: '#10b981',
  ingresoAnt: '#6ee7b7',
  gasto: '#ef4444',
  gastoAnt: '#fca5a5',
  cobrado: '#10b981',
  porCobrar: '#f59e0b',
  pagado: '#10b981',
  pendiente: '#ef4444',
  eje: '#64748b',
  rejilla: '#e2e8f0',
};

interface Opcion {
  label: string;
  value: number;
}

/**
 * Dashboard del Módulo 7 (Contabilidad) — ruta `/contabilidad/dashboardId7`.
 *
 * 7 widgets (chart.js puro, sin ng2-charts):
 *  1. Pastel: Activos / Pasivos / Capital del período seleccionado (segmentos 1+2+3)
 *  1b. Doughnut: Resultados del período (segmentos 4+5) — APARTE del pastel
 *  2. Barras: cuentas nivel 2 de Activos y Pasivos
 *  3. Comparativo de Ingresos: mes actual vs mes anterior
 *  4. Comparativo de Gastos: mes actual vs mes anterior
 *  5. CxC: recuperado (suma del haber) vs por cobrar
 *  6. CxP: pagado (suma del haber) vs pendiente + compras sin pagar
 */
@Component({
  selector: 'app-dashboard-id7',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectModule, ButtonModule, TooltipModule],
  templateUrl: './dashboard-id7.html',
  styleUrl: './dashboard-id7.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardId7Component implements OnInit, OnDestroy {
  private contabilidad = inject(ContabilidadService);
  private destroyRef = inject(DestroyRef);
  private injector = inject(Injector);

  readonly datos = signal<DashboardData | null>(null);
  readonly cargando = signal(false);
  readonly anioSel = signal<number | null>(null);
  readonly periodoSel = signal<number | null>(null);
  readonly aniosOps = signal<Opcion[]>([]);
  readonly periodosOps = signal<Opcion[]>([]);

  private charts: Chart[] = [];

  /** Tras cada carga: pinta los canvas y (re)crea los 6 charts. */
  private _render = effect(() => {
    const d = this.datos();
    if (!d) return;
    afterNextRender(() => this.renderizar(d), { injector: this.injector });
  });

  ngOnInit(): void {
    this.cargar();
  }

  ngOnDestroy(): void {
    this.destruirCharts();
  }

  cargar(): void {
    this.cargando.set(true);
    const anio = this.anioSel() ?? undefined;
    const periodo = this.periodoSel() ?? undefined;
    this.contabilidad
      .getDashboard(anio, periodo)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (d) => this.aplicar(d),
        error: () => this.cargando.set(false),
      });
  }

  cambiarAnio(anio: number | null): void {
    if (anio == null || anio === this.anioSel()) return;
    this.anioSel.set(anio);
    this.periodoSel.set(null); // el período vuelve al default del backend
    this.cargar();
  }

  cambiarPeriodo(periodo: number | null): void {
    if (periodo == null || periodo === this.periodoSel()) return;
    this.periodoSel.set(periodo);
    this.cargar();
  }

  /** Valor absoluto para la leyenda del pastel (las magnitudes suman el balance). */
  abs(n: number): number {
    return Math.abs(Number(n) || 0);
  }

  /** Formato 1,234.56 en es-HN. */
  fmt(n: number): string {
    return new Intl.NumberFormat('es-HN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(n) || 0);
  }

  private aplicar(d: DashboardData): void {
    this.datos.set(d);
    this.anioSel.set(d.anio);
    this.periodoSel.set(d.periodo);

    const anios: Opcion[] = [];
    for (let a = d.anio - 3; a <= d.anio + 1; a++) anios.push({ label: String(a), value: a });
    this.aniosOps.set(anios);

    const periodos: Opcion[] = [];
    for (let p = 1; p <= d.periodoMax; p++) {
      periodos.push({ label: `${MESES[p - 1]} ${d.anio}`, value: p });
    }
    this.periodosOps.set(periodos);

    this.cargando.set(false);
  }

  // ===================== Charts =====================

  private canvas(id: string): HTMLCanvasElement | null {
    return document.getElementById(id) as HTMLCanvasElement | null;
  }

  private baseOptions(): ChartConfiguration['options'] {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { boxWidth: 12, font: { size: 11 }, color: C.eje },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${this.fmt(Number(ctx.parsed.y ?? ctx.parsed.x ?? ctx.parsed))}`,
          },
        },
      },
    };
  }

  private renderizar(d: DashboardData): void {
    this.destruirCharts();
    this.graficoPatrimonio(d);
    this.graficoResultados(d);
    this.graficoNivel2(d);
    this.graficoComparativo('chartIngresos', d.ingresos, d.etiquetaPeriodo, d.etiquetaAnterior, C.ingreso, C.ingresoAnt);
    this.graficoComparativo('chartGastos', d.gastos, d.etiquetaPeriodo, d.etiquetaAnterior, C.gasto, C.gastoAnt);
    this.graficoCxc(d);
    this.graficoCxp(d);
  }

  /** Widget 1 — pastel de composición patrimonial. */
  private graficoPatrimonio(d: DashboardData): void {
    const el = this.canvas('chartPatrimonio');
    if (!el) return;
    const data = [this.abs(d.resumen.activos), this.abs(d.resumen.pasivos), this.abs(d.resumen.capital)];
    if (data.every((v) => v === 0)) return;
    this.charts.push(
      new Chart(el, {
        type: 'pie',
        data: {
          labels: ['Activos', 'Pasivos', 'Capital'],
          datasets: [
            {
              data,
              backgroundColor: [C.activos, C.pasivos, C.capital],
              borderColor: '#ffffff',
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 }, color: C.eje } },
            tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${this.fmt(Number(ctx.parsed))}` } },
          },
        },
      }),
    );
  }

  /**
   * Widget 1b — doughnut de Resultados del período (Ingresos vs Gastos y Costos,
   * segmentos 4-7 tras la reestructuración del plan de cuentas 05/10/2026), aparte
   * del pastel patrimonial. Si no hay actividad de resultado en el mes, el card
   * muestra el estado "sin datos" (el HTML decide; aquí no se pinta).
   */
  private graficoResultados(d: DashboardData): void {
    const el = this.canvas('chartResultados');
    if (!el) return;
    const data = [this.abs(d.resultados.ingresos), this.abs(d.resultados.gastos)];
    if (data.every((v) => v === 0)) return;
    this.charts.push(
      new Chart(el, {
        type: 'doughnut',
        data: {
          labels: ['Ingresos', 'Gastos y Costos'],
          datasets: [
            {
              data,
              backgroundColor: [C.ingreso, C.gasto],
              borderColor: '#ffffff',
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '55%',
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 }, color: C.eje } },
            tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${this.fmt(Number(ctx.parsed))}` } },
          },
        },
      }),
    );
  }

  /** Widget 2 — barras verticales de cuentas nivel 2 (Activos vs Pasivos). */
  private graficoNivel2(d: DashboardData): void {
    const el = this.canvas('chartNivel2');
    if (!el || !d.nivel2.length) return;
    this.charts.push(
      new Chart(el, {
        type: 'bar',
        data: {
          labels: d.nivel2.map((n) => n.ctacontable),
          datasets: [
            {
              label: 'Saldo del período',
              data: d.nivel2.map((n) => n.valor),
              backgroundColor: d.nivel2.map((n) => (n.grupo === 'Activos' ? C.activos : C.pasivos)),
              borderRadius: 4,
            },
          ],
        },
        options: {
          ...this.baseOptions(),
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                title: (items) => {
                  const n = d.nivel2[items[0].dataIndex];
                  return `${n.ctacontable} · ${n.descripcion}`;
                },
                label: (ctx) => ` ${this.fmt(Number(ctx.parsed.y))}`,
              },
            },
          },
          scales: {
            x: { ticks: { color: C.eje, font: { size: 11 } }, grid: { display: false } },
            y: {
              ticks: { color: C.eje, font: { size: 10 }, callback: (v) => this.compacto(Number(v)) },
              grid: { color: C.rejilla },
            },
          },
        },
      }),
    );
  }

  /** Widgets 3/4 — barras horizontales agrupadas: mes actual vs mes anterior. */
  private graficoComparativo(
    id: string,
    filas: DashboardComparativo[],
    etiquetaActual: string,
    etiquetaAnterior: string,
    colorActual: string,
    colorAnterior: string,
  ): void {
    const el = this.canvas(id);
    if (!el || !filas.length) return;
    this.charts.push(
      new Chart(el, {
        type: 'bar',
        data: {
          labels: filas.map((f) => f.ctacontable),
          datasets: [
            {
              label: etiquetaActual,
              data: filas.map((f) => f.actual),
              backgroundColor: colorActual,
              borderRadius: 3,
            },
            {
              label: etiquetaAnterior,
              data: filas.map((f) => f.anterior),
              backgroundColor: colorAnterior,
              borderRadius: 3,
            },
          ],
        },
        options: {
          ...this.baseOptions(),
          indexAxis: 'y',
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 }, color: C.eje } },
            tooltip: {
              callbacks: {
                title: (items) => {
                  const f = filas[items[0].dataIndex];
                  return `${f.ctacontable} · ${f.descripcion}`;
                },
                label: (ctx) => ` ${ctx.dataset.label}: ${this.fmt(Number(ctx.parsed.x))}`,
              },
            },
          },
          scales: {
            x: {
              ticks: { color: C.eje, font: { size: 10 }, callback: (v) => this.compacto(Number(v)) },
              grid: { color: C.rejilla },
            },
            y: { ticks: { color: C.eje, font: { size: 11 } }, grid: { display: false } },
          },
        },
      }),
    );
  }

  /** Widget 5 — CxC: recuperado vs por cobrar (doughnut). */
  private graficoCxc(d: DashboardData): void {
    const el = this.canvas('chartCxc');
    if (!el) return;
    const porCobrar = Math.max(d.cxc.saldo, 0);
    if (d.cxc.recuperado === 0 && porCobrar === 0) return;
    this.charts.push(
      new Chart(el, {
        type: 'doughnut',
        data: {
          labels: ['Recuperado (haber)', 'Por cobrar'],
          datasets: [
            {
              data: [d.cxc.recuperado, porCobrar],
              backgroundColor: [C.cobrado, C.porCobrar],
              borderColor: '#ffffff',
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '58%',
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 }, color: C.eje } },
            tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${this.fmt(Number(ctx.parsed))}` } },
          },
        },
      }),
    );
  }

  /** Widget 6 — CxP: pagado vs pendiente (doughnut). */
  private graficoCxp(d: DashboardData): void {
    const el = this.canvas('chartCxp');
    if (!el) return;
    const pendiente = Math.max(d.cxp.saldo, 0);
    if (d.cxp.pagado === 0 && pendiente === 0) return;
    this.charts.push(
      new Chart(el, {
        type: 'doughnut',
        data: {
          labels: ['Pagado (haber)', 'Pendiente de pago'],
          datasets: [
            {
              data: [d.cxp.pagado, pendiente],
              backgroundColor: [C.pagado, C.pendiente],
              borderColor: '#ffffff',
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '58%',
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 }, color: C.eje } },
            tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${this.fmt(Number(ctx.parsed))}` } },
          },
        },
      }),
    );
  }

  /** Formato compacto para ejes (1.2M, 345K). */
  private compacto(n: number): string {
    return new Intl.NumberFormat('es-HN', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(n);
  }

  private destruirCharts(): void {
    for (const chart of this.charts) chart.destroy();
    this.charts = [];
  }
}
