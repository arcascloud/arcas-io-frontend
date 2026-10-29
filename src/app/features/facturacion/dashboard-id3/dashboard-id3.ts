import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  DestroyRef,
  Injector,
  inject,
  signal,
  computed,
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
import { FacturacionService } from '../../../core/services/facturacion.service';
import {
  DashboardVentas,
  OpcionSel,
} from '../../../core/models/facturacion.models';

Chart.register(...registerables);

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

/** Colores de las series (coherentes con los tokens --c-* del tema). */
const C = {
  contado: '#10b981',
  credito: '#f59e0b',
  acumulado: '#3b82f6',
  ventas: '#10b981',
  vendedor: '#10b981',
  vendedorAlt: '#6ee7b7',
  margen: '#10b981',
  margenBajo: '#ef4444',
  pareto: '#10b981',
  paretoLinea: '#f59e0b',
  eje: '#64748b',
  rejilla: '#e2e8f0',
};

/**
 * Dashboard de Facturación (KPIs de ventas) — ruta `/facturacion/dashboardId3`.
 *
 * 7 componentes (chart.js puro, sin ng2-charts):
 *  A. Ventas al Contado vs. Crédito (doughnut + 2 tarjetas KPI)
 *  B. Ventas por Vendedor (barras horizontales + tabla de ticket/participación)
 *  C. Ventas por Meses — ventana de 12 meses con MoM y YoY (barras apiladas + línea acumulada)
 *  D. Facturas vencidas / Antigüedad de Saldos (AR Aging) + DSO
 *  E. Utilidad Bruta (ventas − COGS) y margen % por categoría
 *  F. Top 25 productos con diagrama de Pareto (acumulado al 80%)
 *  G. Bottom 25 productos (baja rotación / "dormidos")
 *
 * Filtros interactivos: Año, Mes, Sucursal/Canal y Categoría de producto.
 */
@Component({
  selector: 'app-dashboard-id3',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectModule, ButtonModule, TooltipModule],
  templateUrl: './dashboard-id3.html',
  styleUrl: './dashboard-id3.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardId3Component implements OnInit, OnDestroy {
  private facturacion = inject(FacturacionService);
  private destroyRef = inject(DestroyRef);
  private injector = inject(Injector);

  readonly datos = signal<DashboardVentas | null>(null);
  readonly cargando = signal(false);

  // ===== Filtros =====
  readonly anioSel = signal<number | null>(null);
  readonly mesSel = signal<number | null>(null);
  readonly sucursalSel = signal<number | null>(null);
  readonly categoriaSel = signal<number | null>(null);

  readonly anioOps = signal<OpcionSel[]>([]);
  readonly mesOps = signal<OpcionSel[]>([]);
  readonly sucursalOps = signal<OpcionSel[]>([]);
  readonly categoriaOps = signal<OpcionSel[]>([]);

  // ===== Estados vacíos =====
  readonly tieneVentas = computed(() => (this.datos()?.resumen.ventasTotales ?? 0) > 0);
  readonly tieneVendedores = computed(() => (this.datos()?.vendedores.length ?? 0) > 0);
  readonly tieneCategorias = computed(() => (this.datos()?.categoriaMargen.length ?? 0) > 0);
  readonly tieneTop = computed(() =>
    (this.datos()?.topProductos ?? []).some((p) => p.ingresos > 0),
  );
  readonly tienePareto = computed(() => this.tieneTop());
  readonly tieneCartera = computed(() => (this.datos()?.aging.carteraTotal ?? 0) > 0);

  private charts: Chart[] = [];

  /** Tras cada carga: pinta los canvas y (re)crea los charts. */
  private _render = effect(() => {
    const d = this.datos();
    if (!d) return;
    afterNextRender(() => this.renderizar(d), { injector: this.injector });
  });

  ngOnInit(): void {
    this.mesOps.set([
      { label: 'Todo el año', value: null },
      ...MESES.map((m, i) => ({ label: m, value: i + 1 })),
    ]);
    this.cargar();
  }

  ngOnDestroy(): void {
    this.destruirCharts();
  }

  cargar(): void {
    this.cargando.set(true);
    this.facturacion
      .getDashboardVentas({
        anio: this.anioSel(),
        mes: this.mesSel(),
        sucursalId: this.sucursalSel(),
        categoriaId: this.categoriaSel(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (d) => this.aplicar(d),
        error: () => this.cargando.set(false),
      });
  }

  buscar(): void {
    this.cargar();
  }

  limpiarFiltros(): void {
    this.anioSel.set(null);
    this.mesSel.set(null);
    this.sucursalSel.set(null);
    this.categoriaSel.set(null);
    this.cargar();
  }

  private aplicar(d: DashboardVentas): void {
    this.datos.set(d);
    this.cargando.set(false);

    const anios: OpcionSel[] = [{ label: 'Todos', value: null }];
    const disponibles = d.opciones.anios?.length ? d.opciones.anios : [d.referencia.anio];
    for (const a of [...new Set(disponibles)].sort((x, y) => y - x)) {
      anios.push({ label: String(a), value: a });
    }
    this.anioOps.set(anios);

    this.sucursalOps.set([
      { label: 'Todas las sucursales', value: null },
      ...d.opciones.sucursales.map((s) => ({ label: s.descripcion, value: s.Idsucursal })),
    ]);
    this.categoriaOps.set([
      { label: 'Todas las categorías', value: null },
      ...d.opciones.categorias.map((c) => ({ label: c.descripcion, value: c.categoriaId })),
    ]);
  }

  // ===== Formatos =====

  fmt(n: number | null | undefined): string {
    if (n == null) return '—';
    return new Intl.NumberFormat('es-HN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(n) || 0);
  }

  fmtEntero(n: number | null | undefined): string {
    if (n == null) return '—';
    return new Intl.NumberFormat('es-HN').format(Number(n) || 0);
  }

  pct(n: number | null | undefined): string {
    if (n == null) return '—';
    return `${new Intl.NumberFormat('es-HN', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(Number(n) || 0)}%`;
  }

  /** Formato con signo para MoM/YoY (+12.5% / −8.0%). */
  pctSigno(n: number | null | undefined): string {
    if (n == null) return '—';
    const v = Number(n) || 0;
    return `${v > 0 ? '+' : ''}${this.pct(v)}`;
  }

  claseVariacion(n: number | null | undefined): string {
    if (n == null) return 'neutro';
    if (n > 0) return 'positivo';
    if (n < 0) return 'negativo';
    return 'neutro';
  }

  fecha(n: string | null): string {
    if (!n) return '—';
    const d = new Date(n);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('es-HN');
  }

  /** % acumulado de ingresos del Top 25 hasta la fila `i` (solo filas con ingresos > 0). */
  acumuladoTop(i: number, d: DashboardVentas): string {
    const total = d.topProductos.reduce((s, p) => s + p.ingresos, 0);
    if (total <= 0) return '—';
    let acum = 0;
    for (let k = 0; k <= i; k++) acum += d.topProductos[k]?.ingresos ?? 0;
    return this.pct(Math.round((acum / total) * 1000) / 10);
  }

  /** Formato compacto para ejes (1.2M, 345K). */
  private compacto(n: number): string {
    return new Intl.NumberFormat('es-HN', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(n);
  }

  // ===== Charts =====

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
      },
    };
  }

  private renderizar(d: DashboardVentas): void {
    this.destruirCharts();
    this.graficoContadoCredito(d);
    this.graficoVendedores(d);
    this.graficoMeses(d);
    this.graficoMargen(d);
    this.graficoPareto(d);
  }

  /** Widget A — doughnut Contado vs Crédito. */
  private graficoContadoCredito(d: DashboardVentas): void {
    const el = this.canvas('chartContadoCredito');
    if (!el) return;
    const cc = d.contadoCredito;
    if (cc.contado === 0 && cc.credito === 0) return;
    this.charts.push(
      new Chart(el, {
        type: 'doughnut',
        data: {
          labels: ['Contado', 'Crédito'],
          datasets: [
            {
              data: [cc.contado, cc.credito],
              backgroundColor: [C.contado, C.credito],
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
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const total = cc.contado + cc.credito;
                  const p = total > 0 ? (Number(ctx.parsed) / total) * 100 : 0;
                  return ` ${ctx.label}: ${this.fmt(Number(ctx.parsed))} (${this.pct(p)})`;
                },
              },
            },
          },
        },
      }),
    );
  }

  /** Widget B — barras horizontales de ventas por vendedor. */
  private graficoVendedores(d: DashboardVentas): void {
    const el = this.canvas('chartVendedores');
    if (!el || !d.vendedores.length) return;
    const v = d.vendedores;
    this.charts.push(
      new Chart(el, {
        type: 'bar',
        data: {
          labels: v.map((x) => x.nombre),
          datasets: [
            {
              label: 'Ventas',
              data: v.map((x) => x.ventas),
              backgroundColor: v.map((_, i) => (i % 2 === 0 ? C.vendedor : C.vendedorAlt)),
              borderRadius: 4,
            },
          ],
        },
        options: {
          ...this.baseOptions(),
          indexAxis: 'y',
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const row = v[ctx.dataIndex];
                  return [
                    ` Ventas: ${this.fmt(row.ventas)}`,
                    ` Comprobantes: ${row.comprobantes}`,
                    ` Ticket promedio: ${this.fmt(row.ticketPromedio)}`,
                    ` Participación: ${this.pct(row.pctParticipacion)}`,
                  ];
                },
              },
            },
          },
          scales: {
            x: {
              ticks: { color: C.eje, font: { size: 10 }, callback: (val) => this.compacto(Number(val)) },
              grid: { color: C.rejilla },
            },
            y: { ticks: { color: C.eje, font: { size: 11 } }, grid: { display: false } },
          },
        },
      }),
    );
  }

  /** Widget C — barras apiladas Contado/Crédito + línea de acumulado en 12 meses. */
  private graficoMeses(d: DashboardVentas): void {
    const el = this.canvas('chartMeses');
    if (!el || !d.meses.length) return;
    this.charts.push(
      new Chart(el, {
        data: {
          labels: d.meses.map((m) => m.etiqueta),
          datasets: [
            {
              type: 'bar',
              label: 'Contado',
              data: d.meses.map((m) => m.contado),
              backgroundColor: C.contado,
              borderRadius: 3,
              stack: 's',
              yAxisID: 'y',
            },
            {
              type: 'bar',
              label: 'Crédito',
              data: d.meses.map((m) => m.credito),
              backgroundColor: C.credito,
              borderRadius: 3,
              stack: 's',
              yAxisID: 'y',
            },
            {
              type: 'line',
              label: 'Acumulado',
              data: d.meses.map((m) => m.acumulado),
              borderColor: C.acumulado,
              backgroundColor: C.acumulado,
              borderWidth: 2,
              pointRadius: 2,
              tension: 0.3,
              yAxisID: 'y1',
            },
          ],
        },
        options: {
          ...this.baseOptions(),
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 }, color: C.eje } },
            tooltip: {
              callbacks: {
                label: (ctx) => ` ${ctx.dataset.label}: ${this.fmt(Number(ctx.parsed.y))}`,
              },
            },
          },
          scales: {
            x: {
              stacked: true,
              ticks: { color: C.eje, font: { size: 10 } },
              grid: { display: false },
            },
            y: {
              stacked: true,
              position: 'left',
              ticks: { color: C.eje, font: { size: 10 }, callback: (v) => this.compacto(Number(v)) },
              grid: { color: C.rejilla },
            },
            y1: {
              position: 'right',
              ticks: { color: C.acumulado, font: { size: 10 }, callback: (v) => this.compacto(Number(v)) },
              grid: { display: false },
            },
          },
        },
      } as unknown as ChartConfiguration),
    );
  }

  /** Widget E — barras del margen bruto (%) por categoría. */
  private graficoMargen(d: DashboardVentas): void {
    const el = this.canvas('chartMargen');
    if (!el || !d.categoriaMargen.length) return;
    const cats = d.categoriaMargen;
    this.charts.push(
      new Chart(el, {
        type: 'bar',
        data: {
          labels: cats.map((c) => c.categoria),
          datasets: [
            {
              label: 'Margen bruto %',
              data: cats.map((c) => c.margen ?? 0),
              backgroundColor: cats.map((c) => ((c.margen ?? 0) >= 0 ? C.margen : C.margenBajo)),
              borderRadius: 4,
            },
          ],
        },
        options: {
          ...this.baseOptions(),
          indexAxis: 'y',
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const c = cats[ctx.dataIndex];
                  return [
                    ` Margen: ${this.pct(c.margen)}`,
                    ` Ventas: ${this.fmt(c.ventas)}`,
                    ` COGS: ${this.fmt(c.cogs)}`,
                    ` Utilidad: ${this.fmt(c.utilidad)}`,
                  ];
                },
              },
            },
          },
          scales: {
            x: {
              ticks: { color: C.eje, font: { size: 10 }, callback: (v) => `${v}%` },
              grid: { color: C.rejilla },
            },
            y: { ticks: { color: C.eje, font: { size: 11 } }, grid: { display: false } },
          },
        },
      }),
    );
  }

  /** Widget F — Pareto: barras de ingresos por producto + línea de % acumulado. */
  private graficoPareto(d: DashboardVentas): void {
    const el = this.canvas('chartPareto');
    if (!el) return;
    const items = d.topProductos.filter((p) => p.ingresos > 0);
    if (!items.length) return;
    const total = items.reduce((s, p) => s + p.ingresos, 0);
    let acum = 0;
    const acumulado = items.map((p) => {
      acum += p.ingresos;
      return total > 0 ? Math.round((acum / total) * 1000) / 10 : 0;
    });
    this.charts.push(
      new Chart(el, {
        data: {
          labels: items.map((p) => p.descripcion),
          datasets: [
            {
              type: 'bar',
              label: 'Ingresos',
              data: items.map((p) => p.ingresos),
              backgroundColor: C.pareto,
              borderRadius: 3,
              yAxisID: 'y',
            },
            {
              type: 'line',
              label: '% acumulado',
              data: acumulado,
              borderColor: C.paretoLinea,
              backgroundColor: C.paretoLinea,
              borderWidth: 2,
              pointRadius: 2,
              tension: 0.2,
              yAxisID: 'y1',
            },
          ],
        },
        options: {
          ...this.baseOptions(),
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 }, color: C.eje } },
            tooltip: {
              callbacks: {
                label: (ctx) =>
                  ctx.dataset.yAxisID === 'y1'
                    ? ` Acumulado: ${this.pct(Number(ctx.parsed.y))}`
                    : ` Ingresos: ${this.fmt(Number(ctx.parsed.y))}`,
              },
            },
          },
          scales: {
            x: {
              ticks: { color: C.eje, font: { size: 10 }, maxRotation: 60, minRotation: 45 },
              grid: { display: false },
            },
            y: {
              ticks: { color: C.eje, font: { size: 10 }, callback: (v) => this.compacto(Number(v)) },
              grid: { color: C.rejilla },
            },
            y1: {
              position: 'right',
              min: 0,
              max: 100,
              ticks: { color: C.paretoLinea, font: { size: 10 }, callback: (v) => `${v}%` },
              grid: { display: false },
            },
          },
        },
      } as unknown as ChartConfiguration),
    );
  }

  private destruirCharts(): void {
    for (const chart of this.charts) chart.destroy();
    this.charts = [];
  }
}
