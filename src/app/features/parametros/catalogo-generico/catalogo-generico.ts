import { Component, inject, signal, OnInit, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter, Subscription, switchMap, of, tap, catchError, forkJoin } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DrawerModule } from 'primeng/drawer';
import { MessageService } from 'primeng/api';
import { CatalogoParametrosService } from '../../../core/services/catalogo-parametros.service';
import { ContabilidadService } from '../../../core/services/contabilidad.service';
import { ApiService } from '../../../core/services/api.service';
import { CATALOGOS_PARAMETROS, CatalogoConfig, CampoCatalogo, DetalleEstadoCuenta, labelOpcion } from '../../../core/models/catalogo-parametros.models';
import { CopdaMae, CopdaDet } from '../../../core/models/contabilidad.models';

interface BloqueMes {
  periodo: number;
  mes: string;
  saldoAcum: string;
  movimientos: Record<string, any>[];
  movimientoMes: string;
  saldoActual: string;
}

const MESES_NOMBRE = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

@Component({
  selector: 'app-catalogo-generico',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule, SelectModule, TagModule, TooltipModule, DrawerModule],
  templateUrl: './catalogo-generico.html',
  styleUrl: './catalogo-generico.scss',
})
export class CatalogoGenerico implements OnInit, OnDestroy {
  private service = inject(CatalogoParametrosService);
  private contabilidad = inject(ContabilidadService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private msgs = inject(MessageService);
  private destroyRef = inject(DestroyRef);
  private api = inject(ApiService);

  config = signal<CatalogoConfig | null>(null);
  campos = signal<CampoCatalogo[]>([]);

  data = signal<any[]>([]);
  filtered = signal<any[]>([]);
  cargando = signal(false);

  /**
   * Opciones de los campos con cargaOpciones (por key de campo), para que la
   * lista muestre la ETIQUETA y no el valor crudo (ej: módulo 4 → "Facturación").
   * Mismo filtrado de `valores` que aplica catalogo-form.
   */
  opcionesCargadas = signal<Record<string, { label: string; value: any }[]>>({});

  q = signal('');
  /** Valores de los filtros de selección: { anio: 2026, periodo: 9, descripcion: 'x' } */
  filtrosValores = signal<Record<string, any>>({});

  /** Estado de cuenta en fila expandida: { '5': true } (key = id de la fila) */
  filasExpandidas = signal<Record<string, boolean>>({});
  /** Detalle (estado de cuenta) cacheado por id de fila */
  detalleCache = signal<Record<string, DetalleEstadoCuenta>>({});
  /** Filas con detalle en carga: { '5': true } */
  detalleCargando = signal<Record<string, boolean>>({});

  // ===== Drawer: partida contable desde el detalle del estado de cuenta =====
  drawerPartida = signal(false);
  partidaCargando = signal(false);
  partida = signal<CopdaMae | null>(null);
  partidaLineas = signal<CopdaDet[]>([]);

  private routeSub?: Subscription;
  private navSub?: Subscription;

  /** Opciones para un filtro select: estáticas de la config o únicas de los datos */
  opcionesFiltro(key: string): { label: string; value: any }[] {
    const f = this.config()?.filtros?.find(x => x.key === key);
    if (f?.opciones?.length) return f.opciones;

    const vals = [...new Set(
      this.data()
        .map(d => d?.[key])
        .filter(v => v != null && v !== ''),
    )];
    // Descendente para años, ascendente para períodos/números
    vals.sort((a: any, b: any) => (key === 'anio' ? b - a : a - b));
    return vals.map(v => ({ label: String(v), value: v }));
  }

  ngOnInit() {
    this.cargarConfig();

    // Escuchar navegaciones para recargar cuando se cambia de catalogo
    this.navSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.cargarConfig();
    });
  }

  ngOnDestroy() {
    this.routeSub?.unsubscribe();
    this.navSub?.unsubscribe();
  }

  private cargarConfig() {
    // Obtener el nombre del catalogo de la ruta actual
    let rutaActual = this.router.url;
    let nombre = '';

    // Extraer el nombre del catalogo de la URL
    // Ej: /inventario/categorias -> categorias
    // Ej: /contabilidad/ctacontables -> ctacontables
    const partes = rutaActual.split('/').filter(p => p);
    if (partes.length > 0) {
      nombre = partes[partes.length - 1];
    }

    const nuevoConfig = CATALOGOS_PARAMETROS[nombre];
    if (!nuevoConfig) {
      this.msgs.add({ severity: 'error', summary: 'Error', detail: `Catalogo desconocido: ${nombre}` });
      return;
    }

    // Solo recargar si cambio de catalogo
    if (this.config() && this.config()!.ruta === nuevoConfig.ruta) {
      return;
    }

    this.config.set(nuevoConfig);
    this.campos.set(nuevoConfig.campos);
    this.q.set('');
    this.filtrosValores.set({});
    this.cargarOpcionesColumnas(nuevoConfig.campos);

    // Si el catálogo lo pide, precargar año/período con el período contable abierto
    if (nuevoConfig.preCargarPeriodoAbierto) {
      this.precargarPeriodoAbierto();
    }

    this.load();
  }

  /** Carga coperiodoctable y deja anio/periodo preseleccionados con el período abierto (sn_abierto='S') */
  private precargarPeriodoAbierto(): void {
    this.contabilidad.getPeriodos()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (periodos) => {
          const abierto = periodos.find(p => p.sn_abierto === 'S');
          if (abierto) {
            this.filtrosValores.update(v => ({
              ...v,
              anio: abierto.nroanio,
              periodo: abierto.nromes,
            }));
            this.filtrar();
          }
        },
        error: () => {
          // Silencioso: si falla, simplemente no se preselecciona
        },
      });
  }

  /**
   * Carga las opciones de los campos con cargaOpciones (una sola vez por catálogo)
   * para que formatValor() muestre la etiqueta en la lista.
   */
  private cargarOpcionesColumnas(campos: CampoCatalogo[]) {
    this.opcionesCargadas.set({});
    for (const c of campos) {
      if (!c.cargaOpciones) continue;
      this.api.get<any>(c.cargaOpciones.url)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (res) => {
            // Respuesta tardía tras navegar a otro catálogo → ignorar
            if (!this.campos().some((x) => x.key === c.key && x.cargaOpciones?.url === c.cargaOpciones!.url)) return;
            let items: any[] = [];
            if (Array.isArray(res)) {
              items = res;
            } else if (res && typeof res === 'object') {
              const candidate = res.data ?? res.results ?? Object.values(res).find(Array.isArray) ?? [];
              items = Array.isArray(candidate) ? candidate : [];
            }
            let opts = items.map((i) => ({
              label: labelOpcion(i, c.cargaOpciones!),
              value: i[c.cargaOpciones!.valueCampo],
            }));
            const permitidos = c.cargaOpciones.valores;
            if (permitidos?.length) {
              opts = opts.filter((o) => permitidos.some((v) => String(v) === String(o.value)));
            }
            this.opcionesCargadas.update((m) => ({ ...m, [c.key]: opts }));
          },
        });
    }
  }

  load() {
    this.cargando.set(true);
    this.service.getAll<any>(this.config()!.ruta).subscribe({
      next: (res) => {
        this.data.set(res);
        this.filtrar();
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: `No se pudieron cargar ${this.config()!.titulo}` });
      },
    });
  }

  setFiltro(key: string, value: any) {
    this.filtrosValores.update(v => ({ ...v, [key]: value }));
    this.filtrar();
  }

  filtrar() {
    const q = this.q().toLowerCase();
    const filtros = this.filtrosValores();

    this.filtered.set(
      this.data().filter((item) => {
        // Filtros de selección (anio, periodo, descripcion, ...)
        for (const f of this.config()?.filtros || []) {
          const val = filtros[f.key];
          if (val == null || val === '') continue;

          const itemVal = item?.[f.key];
          if (f.tipo === 'texto') {
            if (!String(itemVal ?? '').toLowerCase().includes(String(val).toLowerCase())) return false;
          } else {
            if (String(itemVal) !== String(val)) return false;
          }
        }

        // Búsqueda libre
        if (!q) return true;
        return this.config()!.campos.some(
          (c) => String(item?.[c.key] ?? '').toLowerCase().includes(q),
        );
      }),
    );
  }

  buscar() {
    this.filtrar();
  }

  limpiarFiltros() {
    this.q.set('');
    this.filtrosValores.set({});
    // Si el catálogo precarga período abierto, limpiar también lo re-precarga
    if (this.config()?.preCargarPeriodoAbierto) {
      this.precargarPeriodoAbierto();
    } else {
      this.filtrar();
    }
  }

  nuevo() {
    this.router.navigate(['editar', 'nuevo'], { relativeTo: this.route });
  }

  editar(id: any) {
    if (id == null) return;
    this.router.navigate(['editar', id], { relativeTo: this.route });
  }

  activoLbl(sn: string): string {
    return sn === 'S' ? 'Activo' : 'Inactivo';
  }

  activoSev(sn: string): 'success' | 'danger' {
    return sn === 'S' ? 'success' : 'danger';
  }

  /**
   * Fila protegida: catálogo con `protegerCerrados` y registro cerrado (sn_abierto='N').
   * No se puede editar ni eliminar (candado en la tabla, bloqueo en el formulario).
   */
  esProtegido(item: any): boolean {
    return !!this.config()?.protegerCerrados && item?.['sn_abierto'] === 'N';
  }

  /**
   * Fila clickeable: abre el detalle (si el catálogo lo tiene configurado)
   * o el formulario de edición.
   */
  esClickeable(item: any): boolean {
    const c = this.config();
    if (!c) return false;
    if (c.detalle) return true;
    return !c.soloLectura && !this.esProtegido(item);
  }

  onFilaClick(item: any): void {
    const c = this.config();
    if (!c) return;
    if (c.detalle) {
      this.toggleDetalle(item);
      return;
    }
    if (!c.soloLectura && !this.esProtegido(item)) {
      this.editar(item[c.idKey]);
    }
  }

  /** Alterna la fila expandida (estado de cuenta). Carga el detalle solo la primera vez. */
  toggleDetalle(item: any): void {
    const c = this.config();
    if (!c?.detalle) return;
    const key = String(item?.[c.idKey]);
    const abierto = !!this.filasExpandidas()[key];
    if (abierto) {
      this.filasExpandidas.update((e) => ({ ...e, [key]: false }));
      return;
    }
    this.filasExpandidas.update((e) => ({ ...e, [key]: true }));
    if (!this.detalleCache()[key]) {
      this.cargarDetalle(key, item);
    }
  }

  expandida(item: any): boolean {
    const c = this.config();
    return !!c?.detalle && !!this.filasExpandidas()[String(item?.[c.idKey])];
  }

  /** Detalle (estado de cuenta) de la fila desde el cache */
  detalleDe(item: any): DetalleEstadoCuenta | null {
    const c = this.config();
    if (!c?.detalle) return null;
    return this.detalleCache()[String(item?.[c.idKey])] ?? null;
  }

  cargandoDetalle(item: any): boolean {
    const c = this.config();
    if (!c?.detalle) return false;
    return !!this.detalleCargando()[String(item?.[c.idKey])];
  }

  private cargarDetalle(key: string, item: any): void {
    const det = this.config()?.detalle;
    if (!det) return;

    const params: Record<string, string | number> = {};
    for (const k of det.params) {
      const v = item?.[k];
      if (v != null && v !== '') params[k] = v;
    }

    this.detalleCargando.update((c) => ({ ...c, [key]: true }));
    this.api.get<DetalleEstadoCuenta>(det.ruta, params)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.detalleCache.update((cache) => ({ ...cache, [key]: res }));
          this.detalleCargando.update((c) => ({ ...c, [key]: false }));
        },
        error: (err) => {
          this.detalleCargando.update((c) => ({ ...c, [key]: false }));
          this.msgs.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'No se pudo cargar el estado de cuenta' });
        },
      });
  }

  // ===== Encabezado / pie del estado de cuenta (fila expandida) =====

  /**
   * Abre el drawer con la partida contable (copdamae + copdadet) al hacer
   * click en el Nro. Partida dentro del detalle del estado de cuenta.
   */
  abrirPartida(mov: Record<string, any>): void {
    const partidaId = Number(mov?.['partidaId']);
    if (!partidaId) {
      this.msgs.add({ severity: 'warn', summary: 'Partida', detail: 'No se encontró el ID de la partida' });
      return;
    }
    this.partidaCargando.set(true);
    this.drawerPartida.set(true);
    forkJoin({
      mae: this.contabilidad.getPartida(partidaId),
      det: this.contabilidad.getDetallesPartida(partidaId),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ mae, det }) => {
          this.partida.set(mae);
          this.partidaLineas.set(det || []);
          this.partidaCargando.set(false);
        },
        error: (err) => {
          this.partidaCargando.set(false);
          this.msgs.add({
            severity: 'error',
            summary: 'Error',
            detail: err?.error?.message || 'No se pudo cargar la partida contable',
          });
        },
      });
  }

  cerrarPartida(): void {
    this.drawerPartida.set(false);
    this.partida.set(null);
    this.partidaLineas.set([]);
  }

  /** Total Debe / Haber de las líneas del drawer (para el pie) */
  partidaTotales(): { debito: number; credito: number } {
    let debito = 0;
    let credito = 0;
    for (const l of this.partidaLineas()) {
      debito += Number(l.debito) || 0;
      credito += Number(l.credito) || 0;
    }
    return { debito, credito };
  }

  /** Columnas dummy para reutilizar formatValor() en las líneas del drawer */
  colDebe(): CampoCatalogo {
    return { key: 'debito', label: 'Debe', tipo: 'numero', decimales: 2 };
  }

  colHaber(): CampoCatalogo {
    return { key: 'credito', label: 'Haber', tipo: 'numero', decimales: 2 };
  }

  /** Formato numérico simple (2 decimales) para los totales del drawer */
  formatNumero(v: any): string {
    const n = Number(v);
    if (isNaN(n)) return '-';
    return new Intl.NumberFormat('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  }

  /** Total de columnas de la tabla (para el colspan de la fila expandida) */
  colspanTabla(): number {
    const c = this.config();
    if (!c) return 1;
    return (c.detalle ? 1 : 0) + c.campos.length + (c.sinEstado ? 0 : 1) + (c.soloLectura ? 0 : 1);
  }

  /** Código de la cuenta en el encabezado (ej: 4-1-10-001) */
  ecCuenta(item: any): string {
    const det = this.config()?.detalle;
    return det ? String(item?.[det.tituloKey] ?? '') : '';
  }

  /** Descripción de la cuenta (viene del endpoint, en cache) */
  ecDescripcion(item: any): string {
    return this.detalleDe(item)?.descripcion ?? '';
  }

  /**
   * Base del acumulado. Prefiere `saldoAcumulado` del backend (cierre del año
   * anterior + netos de los períodos anteriores al filtro) y solo cae al
   * `saldoKey` de la fila si el endpoint no lo devolvió.
   */
  private saldoBase(item: any): number {
    const det = this.config()?.detalle;
    const data = this.detalleDe(item);
    if (data && data.saldoAcumulado != null) return Number(data.saldoAcumulado) || 0;
    return Number(item?.[det?.saldoKey ?? '']) || 0;
  }

  /** Saldo acumulado inicial: 15,781.00 (C) */
  ecSaldoAcum(item: any): string {
    const det = this.config()?.detalle;
    if (!det) return '-';
    const data = this.detalleDe(item);
    if (data && data.saldoAcumulado != null) return this.saldoTexto(data.saldoAcumulado);
    return this.saldoTexto(item?.[det.saldoKey]);
  }

  /** Saldo actual: saldoAcumulado + Σ(debe) - Σ(haber) → 52,430.00 (C) */
  ecSaldoActual(item: any): string {
    const det = this.config()?.detalle;
    const data = this.detalleDe(item);
    if (!det || !data) return '-';
    const acum = this.saldoBase(item);
    const total = acum + (Number(data.totales?.debito) || 0) - (Number(data.totales?.credito) || 0);
    return this.saldoTexto(total);
  }

  /** Estado de cuenta por mes: Saldo Acum + partidas + Movimiento mes + Saldo actual */
  bloquesMes(item: any): BloqueMes[] {
    const det = this.config()?.detalle;
    const data = this.detalleDe(item);
    if (!det || !data) return [];

    const r2 = (n: number) => Math.round(n * 100) / 100;
    let acum = this.saldoBase(item);

    const porPeriodo = new Map<number, Record<string, any>[]>();
    for (const m of data.movimientos) {
      const p = Number(m['periodo']);
      if (!porPeriodo.has(p)) porPeriodo.set(p, []);
      porPeriodo.get(p)!.push(m);
    }

    const bloques: BloqueMes[] = [];
    for (const p of [...porPeriodo.keys()].sort((a, b) => a - b)) {
      const movs = porPeriodo.get(p)!;
      const debito = movs.reduce((s, m) => s + (Number(m['debito']) || 0), 0);
      const credito = movs.reduce((s, m) => s + (Number(m['credito']) || 0), 0);
      const neto = r2(debito - credito);

      bloques.push({
        periodo: p,
        mes: MESES_NOMBRE[p - 1] ?? `Período ${p}`,
        saldoAcum: this.saldoTexto(acum),
        movimientos: movs,
        movimientoMes: this.saldoTexto(neto),
        saldoActual: this.saldoTexto(r2(acum + neto)),
      });
      acum = r2(acum + neto);
    }
    return bloques;
  }

  /**
   * Formatea un saldo con2 decimales + lado contable: 15,781.00 (C) / 52,430.00 (D).
   * Regla: negativo = acreedor (C), positivo = deudor (D), 0 sin sufijo.
   */
  private saldoTexto(v: any): string {
    const n = Number(v);
    if (isNaN(n)) return '-';
    const txt = new Intl.NumberFormat('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(n));
    if (n === 0) return txt;
    return `${txt} (${n < 0 ? 'C' : 'D'})`;
  }

  formatValor(item: any, col: any): string {
    const val = item[col.key];
    if (val == null || val === '') return '-';
    if (col.tipo === 'fecha') {
      // Mismo formato que el datepicker del formulario (dateFormat="dd/mm/yy" → 28/09/2026)
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
      }
      return '-';
    }
    // Columna de mes marcada `acumulado` (saldoscta): la celda YA guarda el
    // SALDO FINAL del mes según el estándar de saldos acumulados
    // (saldoanterior + neto acumulado con arrastre), calculado en el backend.
    // Se muestra tal cual, con su lado contable D/C — NO se vuelve a sumar
    // (hacía doble conteo: 2,200 en DB salía 3,400/5,600 en pantalla) y NO se
    // fuerza a 0.00 en meses sin cierre registrado (ocultaba agosto/septiembre).
    if (col.acumulado) return this.saldoTexto(val);
    // Columna marcada `lado` → es un saldo: 12,247.00 (C) / 63,042.00 (D)
    // (el backend entrega el signo, acá se deriva el lado contable).
    if (col.lado) return this.saldoTexto(val);
    if (col.tipo === 'numero') {
      // REGLA CONTABLE: siempre en positivo (la dirección D/C la da la naturaleza, no el signo)
      const n = Math.abs(Number(val));
      if (isNaN(n)) return String(val);
      // decimales explícitos (ej: 4 para tipo de cambio) > 'moneda' (2) > entero (0) / no entero (2)
      const decimales = col.decimales ?? (col.formato === 'moneda' ? 2 : (Number.isInteger(n) ? 0 : 2));
      // formato 'anio' → sin separador de millares (2026, no 2,026)
      return new Intl.NumberFormat('es-HN', {
        useGrouping: col.formato !== 'anio',
        minimumFractionDigits: decimales,
        maximumFractionDigits: decimales,
      }).format(n);
    }
    // select con opciones estáticas → mostrar la etiqueta (ej: D → Dólar, E → Euro, Y → Yen)
    if (col.tipo === 'select' && Array.isArray(col.opciones)) {
      const op = col.opciones.find((o: any) => String(o.value) === String(val));
      return op ? String(op.label) : String(val);
    }
    // select con cargaOpciones → etiqueta desde el mapa cargado (ej: módulo 4 → "Facturación")
    if (col.tipo === 'select' && col.cargaOpciones) {
      const op = (this.opcionesCargadas()[col.key] ?? []).find((o) => String(o.value) === String(val));
      return op ? String(op.label) : String(val);
    }
    return val;
  }
}
