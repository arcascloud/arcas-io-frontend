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
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Chart, registerables, ChartConfiguration } from 'chart.js';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';

import { ProductosService } from '../../../core/services/productos.service';
import { ExistenciasService } from '../../../core/services/existencias.service';
import { CategoriasService } from '../../../core/services/categorias.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  Producto,
  Existencia,
  Categoria,
  ProductoEstrategiaAnalisis,
  DashboardInventarioKpis,
  EstrategiaInventarioTipo,
} from '../../../core/models/inventario.models';

Chart.register(...registerables);

/** Colores coherentes con los design tokens --c-* del ERP */
const PALETA = {
  primario: '#3d8bff',
  exito: '#2fd48a',
  advertencia: '#f68f30',
  peligro: '#e77b6d',
  uva: '#8b5cf6',
  cian: '#2cacd5',
  amarillo: '#eab308',
  borde: '#2c4d6f',
  texto: '#dbe7f0',
  textoMuted: '#8aa9c9',
  superficie: '#1e2e3b',
  rejilla: 'rgba(57, 73, 91, 0.4)',
};

interface OpcionFiltro {
  label: string;
  value: string;
}

@Component({
  selector: 'app-dashboard-id2',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SelectModule,
    ButtonModule,
    TooltipModule,
    TableModule,
    TagModule,
    InputTextModule,
    InputNumberModule,
  ],
  templateUrl: './dashboard-id2.html',
  styleUrl: './dashboard-id2.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardId2Component implements OnInit, OnDestroy {
  private productosService = inject(ProductosService);
  private existenciasService = inject(ExistenciasService);
  private categoriasService = inject(CategoriasService);
  private auth = inject(AuthService);
  private destroyRef = inject(DestroyRef);
  private injector = inject(Injector);

  // Estados reactivos (Signals)
  readonly cargando = signal(false);
  readonly tabActivo = signal<'kpis' | 'caso1' | 'caso2' | 'caso3' | 'recomendador'>('kpis');
  readonly terminoBusqueda = signal<string>('');
  readonly filtroCategoria = signal<string>('TODAS');
  readonly filtroEstrategia = signal<string>('TODAS');
  readonly productos = signal<ProductoEstrategiaAnalisis[]>([]);

  // Simulador de Financiamiento en Cuotas (Caso 1)
  readonly plazoCuotas = signal<number>(6); // 3, 6, 12 meses
  readonly tasaMensualPct = signal<number>(2.5); // 2.5% mensual
  readonly primaPct = signal<number>(20); // 20% prima
  readonly simuladorCostoPieza = signal<number>(8500); // L. 8,500 de ejemplo

  // Simulador de Combo y Venta Cruzada (Caso 2)
  readonly comboDescuentoPct = signal<number>(15);

  // Lista de Gráficos Chart.js
  private charts: Chart[] = [];

  // Opciones de Filtros
  readonly opcionesEstrategia: OpcionFiltro[] = [
    { label: 'Todas las estrategias', value: 'TODAS' },
    { label: 'Caso 1 · Alto Costo / Alta Ganancia', value: 'alto_costo' },
    { label: 'Caso 2 · Poco Uso / Venta Cruzada', value: 'poco_uso' },
    { label: 'Caso 3 · Sin Rotación / Liquidación', value: 'sin_rotacion' },
    { label: 'Rotación Regular', value: 'normal' },
  ];

  readonly opcionesPlazos = [
    { label: '3 cuotas mensuales', value: 3 },
    { label: '6 cuotas mensuales', value: 6 },
    { label: '12 cuotas mensuales', value: 12 },
  ];

  // Opciones computadas de categorías
  readonly opcionesCategorias = computed<OpcionFiltro[]>(() => {
    const cats = new Set<string>();
    for (const p of this.productos()) {
      if (p.categoria) cats.add(p.categoria);
    }
    const res: OpcionFiltro[] = [{ label: 'Todas las categorías', value: 'TODAS' }];
    for (const c of Array.from(cats).sort()) {
      res.push({ label: c, value: c });
    }
    return res;
  });

  // KPIs computados globales
  readonly kpis = computed<DashboardInventarioKpis>(() => {
    const list = this.productos();
    let totalCap = 0;
    let capInmov = 0;
    let sumaRotacion = 0;
    let riesgocount = 0;
    let altoCostoCount = 0;
    let pocoUsoCount = 0;
    let sinRotCount = 0;
    let ahorroReorden = 0;

    for (const p of list) {
      const cap = p.capitalInmovilizado;
      totalCap += cap;
      sumaRotacion += p.rotacionAnual;

      if (p.diasSinMovimiento >= 60) {
        capInmov += cap;
        riesgocount++;
      }

      if (p.estrategiaTipo === 'alto_costo') {
        altoCostoCount++;
        // Al mantener stock 0 o 1 en vez de lote tradicional de 3 unidades, ahorra 2x costo
        if (p.existencia > 1) {
          ahorroReorden += (p.existencia - 1) * p.costoUnitario;
        }
      } else if (p.estrategiaTipo === 'poco_uso') {
        pocoUsoCount++;
      } else if (p.estrategiaTipo === 'sin_rotacion') {
        sinRotCount++;
      }
    }

    const count = list.length || 1;
    const pctInmov = totalCap > 0 ? (capInmov / totalCap) * 100 : 0;
    const rotGlobal = sumaRotacion / count;

    return {
      indiceRotacionGlobal: Number(rotGlobal.toFixed(2)),
      capitalTotalInventario: totalCap,
      capitalInmovilizado: capInmov,
      pctCapitalInmovilizado: Number(pctInmov.toFixed(1)),
      productosEnRiesgoCount: riesgocount,
      productosAltoCostoCount: altoCostoCount,
      productosPocoUsoCount: pocoUsoCount,
      productosSinRotacionCount: sinRotCount,
      ahorroEstimadoReorden: ahorroReorden,
    };
  });

  // Filtrado de productos para la tabla y diagnósticos
  readonly productosFiltrados = computed<ProductoEstrategiaAnalisis[]>(() => {
    const term = this.terminoBusqueda().toLowerCase().trim();
    const cat = this.filtroCategoria();
    const est = this.filtroEstrategia();

    return this.productos().filter((p) => {
      const matchTerm =
        !term ||
        p.descripcion.toLowerCase().includes(term) ||
        (p.codbarra && p.codbarra.toLowerCase().includes(term)) ||
        (p.sku && p.sku.toLowerCase().includes(term));

      const matchCat = cat === 'TODAS' || p.categoria === cat;
      const matchEst = est === 'TODAS' || p.estrategiaTipo === est;

      return matchTerm && matchCat && matchEst;
    });
  });

  // Listas segmentadas para cada caso
  readonly listaCaso1 = computed(() =>
    this.productos().filter((p) => p.estrategiaTipo === 'alto_costo')
  );

  readonly listaCaso2 = computed(() =>
    this.productos().filter((p) => p.estrategiaTipo === 'poco_uso')
  );

  readonly listaCaso3 = computed(() =>
    this.productos().filter((p) => p.estrategiaTipo === 'sin_rotacion')
  );

  // Cálculos reactivos del simulador de financiamiento (Caso 1)
  readonly calculoFinanciamiento = computed(() => {
    const costo = this.simuladorCostoPieza();
    const pctPrima = this.primaPct();
    const plazo = this.plazoCuotas();
    const tasa = this.tasaMensualPct() / 100;

    const prima = (costo * pctPrima) / 100;
    const saldoFinanciar = Math.max(0, costo - prima);

    // Sistema de amortización francés / cuota nivelada
    let cuota = 0;
    if (tasa > 0) {
      cuota = (saldoFinanciar * (tasa * Math.pow(1 + tasa, plazo))) / (Math.pow(1 + tasa, plazo) - 1);
    } else {
      cuota = saldoFinanciar / (plazo || 1);
    }

    const totalAPagar = prima + cuota * plazo;
    const interesesTotales = totalAPagar - costo;

    return {
      costo,
      prima,
      saldoFinanciar,
      plazo,
      cuotaMensual: Number(cuota.toFixed(2)),
      totalAPagar: Number(totalAPagar.toFixed(2)),
      interesesTotales: Number(interesesTotales.toFixed(2)),
    };
  });

  // Efecto que redibuja gráficos al cambiar de tab o al actualizar datos
  private _renderEffect = effect(() => {
    const tab = this.tabActivo();
    const prods = this.productos();
    if (!prods.length) return;

    if (tab === 'kpis') {
      afterNextRender(() => this.renderizarGraficosKpis(), { injector: this.injector });
    } else if (tab === 'caso3') {
      afterNextRender(() => this.renderizarGraficoLiquidacion(), { injector: this.injector });
    }
  });

  ngOnInit(): void {
    this.cargarDatos();
  }

  ngOnDestroy(): void {
    this.destruirGraficos();
  }

  cambiarTab(tab: 'kpis' | 'caso1' | 'caso2' | 'caso3' | 'recomendador'): void {
    this.tabActivo.set(tab);
  }

  cargarDatos(): void {
    this.cargando.set(true);

    forkJoin({
      prods: this.productosService.getAll().pipe(catchError(() => of([] as Producto[]))),
      exist: this.existenciasService.getAll().pipe(catchError(() => of([] as Existencia[]))),
      cats: this.categoriasService.getAll().pipe(catchError(() => of([] as Categoria[]))),
    }).subscribe({
      next: ({ prods, exist, cats }) => {
        this.procesarInventario(prods, exist, cats);
        this.cargando.set(false);
      },
      error: () => {
        this.procesarInventario([], [], []);
        this.cargando.set(false);
      },
    });
  }

  private procesarInventario(
    prods: Producto[],
    exist: Existencia[],
    cats: Categoria[]
  ): void {
    const mapExist = new Map<number, Existencia>();
    for (const e of exist) {
      mapExist.set(e.productoId, e);
    }

    const mapCat = new Map<number, string>();
    for (const c of cats) {
      mapCat.set(c.categoriaId, c.descripcion);
    }

    const resultado: ProductoEstrategiaAnalisis[] = [];

    // 1. Integrar productos reales de la base de datos
    for (const p of prods) {
      const ex = mapExist.get(p.produtoId);
      const stock = ex ? Number(ex.existencia) || 0 : 0;
      const costo = Number(p.cstounit) || (ex ? Number(ex.costounitario) : 0) || 50;
      const venta = Number(p.precioventa) || (ex ? Number(ex.precioventa) : 0) || costo * 1.35;
      const catNombre = mapCat.get(p.categoriaId) || 'General';

      // Calcular margen
      const margen = venta > 0 ? ((venta - costo) / venta) * 100 : 0;

      // Calcular días sin movimiento estimado con base en datos o determinístico
      let diasSinMov = 45;
      if (p.fecUltvta) {
        const diffMs = Date.now() - new Date(p.fecUltvta).getTime();
        diasSinMov = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      } else {
        diasSinMov = 30 + ((p.produtoId * 17) % 240);
      }

      // Rotación anual estimada = (ventas anuales estimadas / inventario promedio)
      const rotacionAnual = diasSinMov > 0 ? Number((365 / (diasSinMov + 15)).toFixed(2)) : 6.5;

      const item = this.clasificarProductoEstrategia({
        productoId: p.produtoId,
        codbarra: p.codbarra || `PRD-${p.produtoId}`,
        sku: p.codigo_sku || `SKU-${p.produtoId}`,
        descripcion: p.descripcion,
        categoria: catNombre,
        costoUnitario: costo,
        precioVenta: venta,
        margenPct: Number(margen.toFixed(1)),
        existencia: stock,
        diasSinMovimiento: diasSinMov,
        rotacionAnual,
      });

      resultado.push(item);
    }

    // 2. Garantizar los productos muestra estratégicos solicitados para ilustrar los 3 casos
    this.incorporarMuestrasEstrategicas(resultado);

    this.productos.set(resultado);
  }

  /**
   * Clasifica un producto en los 3 casos solicitados por el arquitecto:
   * 1. Alto costo y alta ganancia unitaria (cuerpo aceleración, alternador, etc.)
   * 2. Poco uso frecuente, costo bajo/medio (cargador de batería, cables pasa-corriente, etc.)
   * 3. Producto que simplemente no rota (obsolescencia, baja rotación, DSI > 90d)
   */
  private clasificarProductoEstrategia(raw: {
    productoId: number;
    codbarra: string;
    sku: string;
    descripcion: string;
    categoria: string;
    costoUnitario: number;
    precioVenta: number;
    margenPct: number;
    existencia: number;
    diasSinMovimiento: number;
    rotacionAnual: number;
  }): ProductoEstrategiaAnalisis {
    const { costoUnitario, precioVenta, margenPct, existencia, diasSinMovimiento, rotacionAnual } = raw;
    const capitalInmovilizado = costoUnitario * existencia;

    // Matriz ABC (según costo y capital)
    let clasificacionAbc: 'A' | 'B' | 'C' = 'B';
    if (costoUnitario >= 2500 || capitalInmovilizado >= 15000) {
      clasificacionAbc = 'A';
    } else if (costoUnitario < 600 && capitalInmovilizado < 5000) {
      clasificacionAbc = 'C';
    }

    // Matriz XYZ (según rotación)
    let clasificacionXyz: 'X' | 'Y' | 'Z' = 'Y';
    if (rotacionAnual >= 4.0 && diasSinMovimiento < 45) {
      clasificacionXyz = 'X'; // Demanda constante
    } else if (rotacionAnual < 1.5 || diasSinMovimiento > 90) {
      clasificacionXyz = 'Z'; // Demanda errática / nula
    }

    // LÓGICA DE LOS TRES CASOS ESTRATÉGICOS:
    let estrategiaTipo: EstrategiaInventarioTipo = 'normal';
    let estrategiaTitulo = 'Rotación Normal Balanceada';
    let sugerenciaAccion = 'Monitorear niveles de reposición estándar';
    let tacticaClave = 'Punto de reorden automático según consumo promedio';
    let descuentoLiquidacionPct: number | undefined;
    let precioLiquidacion: number | undefined;
    let posibleComboCon: string | undefined;

    // CASO 1: Alto costo y alta ganancia unitaria (Capital inmovilizado, no falta de demanda)
    if (costoUnitario >= 2800 && margenPct >= 28) {
      estrategiaTipo = 'alto_costo';
      estrategiaTitulo = 'Caso 1 · Alto Costo y Alta Ganancia';
      sugerenciaAccion = 'Venta Bajo Pedido (Stock 0) / Stock Consignado + Servicio Instalado';
      tacticaClave = 'Drop-shipping interno (24-72h SLA), paquete de taller y financiamiento a cuotas';
    }
    // CASO 3: Producto que simplemente no rota (Días sin mov >= 90 o Z con stock acumulado)
    else if (diasSinMovimiento >= 90 || (rotacionAnual < 1.0 && existencia > 0)) {
      estrategiaTipo = 'sin_rotacion';
      estrategiaTitulo = 'Caso 3 · Producto Sin Rotación';

      if (diasSinMovimiento >= 270) {
        descuentoLiquidacionPct = 30;
        tacticaClave = 'Liquidación -30% o Remate en Lote Mayorista a Talleres';
      } else if (diasSinMovimiento >= 180) {
        descuentoLiquidacionPct = 20;
        tacticaClave = 'Liquidación -20% escalonado y canal Tienda Virtual (Marketplace)';
      } else {
        descuentoLiquidacionPct = 10;
        tacticaClave = 'Liquidación inicial -10% y canje por ítems A con proveedor';
      }

      precioLiquidacion = Number((precioVenta * (1 - descuentoLiquidacionPct / 100)).toFixed(2));
      sugerenciaAccion = `Aplicar liquidación escalonada del ${descuentoLiquidacionPct}% o venta B2B por lote`;
    }
    // CASO 2: Poco uso frecuente, costo bajo o medio (Falla de visibilidad / momento de compra)
    else if (
      (costoUnitario < 2800 && (rotacionAnual <= 2.2 || diasSinMovimiento >= 60)) ||
      raw.descripcion.toLowerCase().includes('cargador') ||
      raw.descripcion.toLowerCase().includes('cable') ||
      raw.descripcion.toLowerCase().includes('aditivo') ||
      raw.descripcion.toLowerCase().includes('herramienta')
    ) {
      estrategiaTipo = 'poco_uso';
      estrategiaTitulo = 'Caso 2 · Poco Uso Frecuente (Costo Bajo/Medio)';
      sugerenciaAccion = 'Gatillar Venta Cruzada en Caja POS, Alquiler de Taller o Combos Estacionales';
      tacticaClave = 'Combo Batería + Cargador / Kit de Emergencia Vial en épocas de lluvia o pre-vacaciones';
      posibleComboCon = 'Batería 12V / Insumos de Taller';
    }

    // Punto de reorden dinámico:
    // Caso 1: Min stock = 0 o 1
    // Caso 2: Min stock = 2 a 4
    // Caso 3: Min stock = 0 (Congelar compras)
    // Normal: Min stock basado en rotación
    let puntoReordenDinamico = 2;
    if (estrategiaTipo === 'alto_costo') {
      puntoReordenDinamico = 1; // Nunca compras en lote para piezas de alta gama
    } else if (estrategiaTipo === 'sin_rotacion') {
      puntoReordenDinamico = 0; // Congelado total
    } else if (estrategiaTipo === 'poco_uso') {
      puntoReordenDinamico = 2;
    } else {
      puntoReordenDinamico = Math.max(3, Math.round(rotacionAnual * 1.5));
    }

    return {
      ...raw,
      capitalInmovilizado,
      clasificacionAbc,
      clasificacionXyz,
      estrategiaTipo,
      estrategiaTitulo,
      sugerenciaAccion,
      tacticaClave,
      descuentoLiquidacionPct,
      precioLiquidacion,
      posibleComboCon,
      puntoReordenDinamico,
      esConsignado: estrategiaTipo === 'alto_costo' && existencia > 0,
      esBajoPedido: estrategiaTipo === 'alto_costo' && existencia <= 1,
    };
  }

  /**
   * Garantiza que los ejemplos paradigmáticos del usuario estén presentes
   * para dar vida instantánea y claridad didáctica al dashboard.
   */
  private incorporarMuestrasEstrategicas(lista: ProductoEstrategiaAnalisis[]): void {
    const nombresExistentes = new Set(lista.map((x) => x.descripcion.toLowerCase()));

    const muestras: Array<Parameters<typeof this.clasificarProductoEstrategia>[0]> = [
      {
        productoId: 9001,
        codbarra: '74210009001',
        sku: 'AUT-THROT-01',
        descripcion: 'Cuerpo de Aceleración Electrónico OEM 2.4L',
        categoria: 'Sensores e Inyección',
        costoUnitario: 5200,
        precioVenta: 8950,
        margenPct: 41.9,
        existencia: 3,
        diasSinMovimiento: 125,
        rotacionAnual: 0.8,
      },
      {
        productoId: 9002,
        codbarra: '74210009002',
        sku: 'AUT-TURBO-GT',
        descripcion: 'Turbocargador Variable Common Rail Hilux/DMax',
        categoria: 'Motor y Potencia',
        costoUnitario: 14500,
        precioVenta: 22800,
        margenPct: 36.4,
        existencia: 2,
        diasSinMovimiento: 110,
        rotacionAnual: 0.6,
      },
      {
        productoId: 9003,
        codbarra: '74210009003',
        sku: 'ACC-CHRG-10A',
        descripcion: 'Cargador Inteligente de Batería 12V 10A con Microprocesador',
        categoria: 'Accesorios y Eléctrico',
        costoUnitario: 680,
        precioVenta: 1350,
        margenPct: 49.6,
        existencia: 14,
        diasSinMovimiento: 88,
        rotacionAnual: 1.4,
      },
      {
        productoId: 9004,
        codbarra: '74210009004',
        sku: 'ACC-CABL-500',
        descripcion: 'Cables Pasa-Corriente 500A Trabajo Pesado 3.5m',
        categoria: 'Accesorios y Emergencia',
        costoUnitario: 290,
        precioVenta: 650,
        margenPct: 55.4,
        existencia: 22,
        diasSinMovimiento: 65,
        rotacionAnual: 1.8,
      },
      {
        productoId: 9005,
        codbarra: '74210009005',
        sku: 'OBS-TERM-BRZ',
        descripcion: 'Termostato Mecánico Bronce Serie Antigua (1998-2003)',
        categoria: 'Enfriamiento Motor',
        costoUnitario: 340,
        precioVenta: 690,
        margenPct: 50.7,
        existencia: 18,
        diasSinMovimiento: 295,
        rotacionAnual: 0.2,
      },
      {
        productoId: 9006,
        codbarra: '74210009006',
        sku: 'OBS-FLT-DISC',
        descripcion: 'Filtro de Aceite Metálico Descontinuado Serie Z',
        categoria: 'Filtración',
        costoUnitario: 115,
        precioVenta: 260,
        margenPct: 55.8,
        existencia: 36,
        diasSinMovimiento: 215,
        rotacionAnual: 0.3,
      },
      {
        productoId: 9007,
        codbarra: '74210009007',
        sku: 'BAT-AGM-75AH',
        descripcion: 'Batería Libre Mantenimiento AGM 12V 75Ah 800CCA',
        categoria: 'Baterías y Acumuladores',
        costoUnitario: 1950,
        precioVenta: 3100,
        margenPct: 37.1,
        existencia: 28,
        diasSinMovimiento: 12,
        rotacionAnual: 7.8,
      },
      {
        productoId: 9008,
        codbarra: '74210009008',
        sku: 'LUB-SN-5W30',
        descripcion: 'Aceite Motor Sintético 5W-30 Full Galón',
        categoria: 'Lubricantes y Fluidos',
        costoUnitario: 580,
        precioVenta: 920,
        margenPct: 37.0,
        existencia: 95,
        diasSinMovimiento: 6,
        rotacionAnual: 14.2,
      },
    ];

    for (const m of muestras) {
      if (!nombresExistentes.has(m.descripcion.toLowerCase())) {
        lista.unshift(this.clasificarProductoEstrategia(m));
      }
    }
  }

  // =========================================================================
  // Renderizado de Gráficos con Chart.js
  // =========================================================================

  private destruirGraficos(): void {
    for (const c of this.charts) {
      try {
        c.destroy();
      } catch {}
    }
    this.charts = [];
  }

  private renderizarGraficosKpis(): void {
    this.destruirGraficos();

    const prods = this.productos();
    if (!prods.length) return;

    // 1. Gráfico de Antigüedad (Días sin Movimiento / Aging)
    const elAntiguedad = document.getElementById('chartAntiguedad') as HTMLCanvasElement;
    if (elAntiguedad) {
      let m0_30 = 0;
      let m31_60 = 0;
      let m61_90 = 0;
      let m91_180 = 0;
      let m180_mas = 0;

      for (const p of prods) {
        const cap = p.capitalInmovilizado;
        if (p.diasSinMovimiento <= 30) m0_30 += cap;
        else if (p.diasSinMovimiento <= 60) m31_60 += cap;
        else if (p.diasSinMovimiento <= 90) m61_90 += cap;
        else if (p.diasSinMovimiento <= 180) m91_180 += cap;
        else m180_mas += cap;
      }

      const c1 = new Chart(elAntiguedad, {
        type: 'bar',
        data: {
          labels: ['0-30 días', '31-60 días', '61-90 días', '91-180 días (Alerta)', '+180 días (Crítico)'],
          datasets: [
            {
              label: 'Capital Inmovilizado (HNL)',
              data: [m0_30, m31_60, m61_90, m91_180, m180_mas],
              backgroundColor: [
                PALETA.exito,
                PALETA.cian,
                PALETA.amarillo,
                PALETA.advertencia,
                PALETA.peligro,
              ],
              borderRadius: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => ` Capital: L ${Number(ctx.raw).toLocaleString('es-HN', { minimumFractionDigits: 2 })}`,
              },
            },
          },
          scales: {
            y: {
              grid: { color: PALETA.rejilla },
              ticks: {
                color: PALETA.textoMuted,
                callback: (v) => `L ${Number(v).toLocaleString('es-HN')}`,
              },
            },
            x: {
              grid: { display: false },
              ticks: { color: PALETA.textoMuted },
            },
          },
        },
      });
      this.charts.push(c1);
    }

    // 2. Gráfico Matriz ABC (Composición de Capital)
    const elAbc = document.getElementById('chartAbc') as HTMLCanvasElement;
    if (elAbc) {
      let capA = 0;
      let capB = 0;
      let capC = 0;
      for (const p of prods) {
        if (p.clasificacionAbc === 'A') capA += p.capitalInmovilizado;
        else if (p.clasificacionAbc === 'B') capB += p.capitalInmovilizado;
        else capC += p.capitalInmovilizado;
      }

      const c2 = new Chart(elAbc, {
        type: 'doughnut',
        data: {
          labels: ['A (Alto Valor)', 'B (Medio)', 'C (Bajo Valor / Ocioso)'],
          datasets: [
            {
              data: [capA, capB, capC],
              backgroundColor: [PALETA.primario, PALETA.cian, PALETA.peligro],
              borderWidth: 2,
              borderColor: PALETA.superficie,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: PALETA.texto, font: { size: 11 } },
            },
            tooltip: {
              callbacks: {
                label: (ctx) => ` ${ctx.label}: L ${Number(ctx.raw).toLocaleString('es-HN', { minimumFractionDigits: 2 })}`,
              },
            },
          },
          cutout: '68%',
        },
      });
      this.charts.push(c2);
    }

    // 3. Gráfico Distribución por Estrategia (Casos 1, 2, 3)
    const elEstrategias = document.getElementById('chartEstrategias') as HTMLCanvasElement;
    if (elEstrategias) {
      let capCaso1 = 0;
      let capCaso2 = 0;
      let capCaso3 = 0;
      let capNormal = 0;

      for (const p of prods) {
        if (p.estrategiaTipo === 'alto_costo') capCaso1 += p.capitalInmovilizado;
        else if (p.estrategiaTipo === 'poco_uso') capCaso2 += p.capitalInmovilizado;
        else if (p.estrategiaTipo === 'sin_rotacion') capCaso3 += p.capitalInmovilizado;
        else capNormal += p.capitalInmovilizado;
      }

      const c3 = new Chart(elEstrategias, {
        type: 'pie',
        data: {
          labels: [
            'Caso 1 · Alto Costo (Bajo pedido/Consignación)',
            'Caso 2 · Poco Uso (Combos/Venta caja)',
            'Caso 3 · Sin Rotación (Liquidación)',
            'Inventario Regular',
          ],
          datasets: [
            {
              data: [capCaso1, capCaso2, capCaso3, capNormal],
              backgroundColor: [PALETA.uva, PALETA.cian, PALETA.peligro, PALETA.exito],
              borderWidth: 2,
              borderColor: PALETA.superficie,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: PALETA.texto, font: { size: 11 } },
            },
          },
        },
      });
      this.charts.push(c3);
    }
  }

  private renderizarGraficoLiquidacion(): void {
    const elLiq = document.getElementById('chartLiquidacionEscalonada') as HTMLCanvasElement;
    if (!elLiq) return;

    const lista = this.listaCaso3();
    let liq10 = 0;
    let liq20 = 0;
    let liq30 = 0;

    for (const p of lista) {
      if (p.descuentoLiquidacionPct === 30) liq30 += p.capitalInmovilizado;
      else if (p.descuentoLiquidacionPct === 20) liq20 += p.capitalInmovilizado;
      else liq10 += p.capitalInmovilizado;
    }

    const c = new Chart(elLiq, {
      type: 'bar',
      data: {
        labels: ['Tramo 90 días (-10%)', 'Tramo 180 días (-20%)', 'Tramo 270+ días (-30% / Lotes)'],
        datasets: [
          {
            label: 'Capital por Recuperar (HNL)',
            data: [liq10, liq20, liq30],
            backgroundColor: [PALETA.amarillo, PALETA.advertencia, PALETA.peligro],
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` Capital: L ${Number(ctx.raw).toLocaleString('es-HN', { minimumFractionDigits: 2 })}`,
            },
          },
        },
        scales: {
          y: {
            grid: { color: PALETA.rejilla },
            ticks: {
              color: PALETA.textoMuted,
              callback: (v) => `L ${Number(v).toLocaleString('es-HN')}`,
            },
          },
          x: {
            ticks: { color: PALETA.textoMuted },
            grid: { display: false },
          },
        },
      },
    });
    this.charts.push(c);
  }

  // Helpers de Formato
  fmt(val: number | null | undefined): string {
    const num = Number(val) || 0;
    return `L ${num.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  pct(val: number | null | undefined): string {
    const num = Number(val) || 0;
    return `${num.toFixed(1)}%`;
  }

  severityEstrategia(tipo: EstrategiaInventarioTipo): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (tipo) {
      case 'alto_costo':
        return 'info';
      case 'poco_uso':
        return 'warn';
      case 'sin_rotacion':
        return 'danger';
      case 'normal':
      default:
        return 'success';
    }
  }
}
