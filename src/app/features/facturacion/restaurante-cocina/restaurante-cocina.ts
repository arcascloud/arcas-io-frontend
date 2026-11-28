import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, DOCUMENT } from '@angular/common';
import { forkJoin, Observable } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ApiService } from '../../../core/services/api.service';
import { RestauranteService } from '../../../core/services/restaurante.service';
import {
  EstadoCocina,
  LineaCocina,
  OrdenMesero,
  RANGO_ESTADO_COCINA,
  TarjetaCocina,
  etiquetaPuesto,
  siguienteEstadoCocina,
} from '../../../core/models/mesero.models';

/** Refresco de la pantalla (sección 8 del plan: 15 s; SSE queda para después). */
const REFRESCO_MS = 15_000;
/** Espera en cocina: ámbar desde 10 min y rojo desde 20 min (ajustable). */
const UMBRAL_AMBAR_MIN = 10;
const UMBRAL_ROJO_MIN = 20;
const CLAVE_SONIDO = 'rest-cocina-sonido';
/** Clase global que pinta el body de negro mientras el tablero está montado. */
const CLASE_BODY_NEGRO = 'cocina-body-negro';

/**
 * Tablero de cocina (fase 3): tres COLUMNAS con lista scrollable vertical —
 * col-1 Nuevos, col-2 Preparando, col-3 Listos.
 *
 * Cada tarjeta es un TICKET POR RONDA (pospedmaeId + ronda_uuid): lo que el
 * mesero envió junto avanza junto con un toque, pero también se puede avanzar
 * línea por línea. El servidor valida cada transición
 * (PENDIENTE → EN_PREPARACION → LISTO) y recalcula la cabecera; LISTO no avanza
 * desde aquí — la entrega la hace el mesero con su toggle.
 *
 * El tablero NO modifica la pantalla de escritorio ni la del mesero: todos
 * leen los mismos pospeddet.
 */
@Component({
  selector: 'app-restaurante-cocina',
  standalone: true,
  imports: [CommonModule, ButtonModule, TooltipModule],
  templateUrl: './restaurante-cocina.html',
  styleUrls: ['./restaurante-cocina.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestauranteCocina implements OnInit {
  private srv = inject(RestauranteService);
  private api = inject(ApiService);
  private msg = inject(MessageService);
  private destroyRef = inject(DestroyRef);
  private doc = inject(DOCUMENT);

  /** Para el template (prohibido llamar new Date() en la plantilla). */
  readonly etiquetaPuesto = etiquetaPuesto;
  readonly siguienteEstadoCocina = siguienteEstadoCocina;

  lineas = signal<LineaCocina[]>([]);
  pedidos = signal<OrdenMesero[]>([]);
  /** ttipogestores.gestorId → nombre del mesero (cargado una sola vez). */
  nombresGestor = signal<Record<number, string>>({});
  cargando = signal(true);
  ocupado = signal(false);
  sonidoActivo = signal(false);
  ahora = signal(Date.now());
  actualizadoEn = signal<number | null>(null);
  error = signal<string | null>(null);

  private clavesConocidas = new Set<string>();
  private primeraCarga = true;
  /** Secuencia de carga: descarta respuestas obsoletas cuando se solapan (refresco 15 s + post-acción). */
  private seqCarga = 0;

  /**
   * Tarjetas agrupadas por (orden, ronda). El estado de la tarjeta es la línea
   * "más atrás" del grupo: una ronda con partes avanzados no desaparece de la
   * columna desde la que arrancó hasta que todas avanzan.
   */
  tarjetas = computed<TarjetaCocina[]>(() => {
    const porPedido = new Map<number, OrdenMesero>(this.pedidos().map((p) => [p.pospedmaeId, p]));
    const mapa = new Map<string, TarjetaCocina>();
    for (const l of this.lineas()) {
      const pedido = porPedido.get(l.pospedmaeId);
      if (!pedido) continue; // pedido no visible (facturado / no es del restaurante)
      const estado = (l.estado_cocina ?? 'ENTREGADO') as EstadoCocina;
      if (estado === 'ENTREGADO') continue;
      const key = `${l.pospedmaeId}-${l.ronda_uuid ?? `f${l.pospeddetId}`}`;
      let t = mapa.get(key);
      if (!t) {
        t = { key, pedido, rondaUuid: l.ronda_uuid ?? null, lineas: [], enviadoAt: null, estado };
        mapa.set(key, t);
      }
      t.lineas.push(l);
      if (RANGO_ESTADO_COCINA[estado] < RANGO_ESTADO_COCINA[t.estado]) t.estado = estado;
      const env = l.enviado_at ?? '';
      if (env && (!t.enviadoAt || env < t.enviadoAt)) t.enviadoAt = env;
    }
    return [...mapa.values()].sort((a, b) => (a.enviadoAt ?? '').localeCompare(b.enviadoAt ?? ''));
  });

  nuevos = computed(() => this.tarjetas().filter((t) => t.estado === 'PENDIENTE'));
  enPreparacion = computed(() => this.tarjetas().filter((t) => t.estado === 'EN_PREPARACION'));
  listos = computed(() => this.tarjetas().filter((t) => t.estado === 'LISTO'));

  ngOnInit(): void {
    // Fondo negro del body/contenedor mientras el tablero está montado
    this.doc.body.classList.add(CLASE_BODY_NEGRO);
    this.sonidoActivo.set(localStorage.getItem(CLAVE_SONIDO) === 'S');
    this.cargarGestores();
    this.cargar();
    // Refresco + reloj de espera (la pantalla puede estar encendida todo el día)
    const timer = setInterval(() => {
      this.cargar();
      this.ahora.set(Date.now());
    }, REFRESCO_MS);
    this.destroyRef.onDestroy(() => {
      clearInterval(timer);
      this.doc.body.classList.remove(CLASE_BODY_NEGRO);
    });
  }

  // ───────────────────────── Carga ─────────────────────────

  cargar(): void {
    const seq = ++this.seqCarga;
    forkJoin({
      lineas: this.srv.getLineasCocina(),
      pedidos: this.srv.getOrdenesAbiertas(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ lineas, pedidos }) => {
          if (seq !== this.seqCarga) return; // respuesta obsoleta: otra carga más nueva ya corre
          this.lineas.set(lineas);
          // getOrdenesAbiertas está tipeado como OrdenRestaurante; el JSON trae
          // además estado/cajaId/gestorId (que esta pantalla sí lee).
          this.pedidos.set(pedidos as OrdenMesero[]);
          this.actualizadoEn.set(Date.now());
          this.cargando.set(false);
          this.error.set(null);
          this.detectarNuevos();
        },
        error: () => {
          if (seq !== this.seqCarga) return;
          this.cargando.set(false);
          // Silencioso en el refresco automático: no spamear toasts cada 15 s
          if (!this.actualizadoEn()) this.error.set('No se pudo cargar el tablero de cocina');
        },
      });
  }

  refrescar(): void {
    this.error.set(null);
    this.cargar();
    this.msg.add({ severity: 'info', summary: 'Cocina', detail: 'Tablero actualizado' });
  }

  /** Aviso sonoro solo cuando entra un ticket nuevo (nunca en la primera carga). */
  private detectarNuevos(): void {
    const actuales = this.tarjetas();
    const claves = new Set(actuales.map((t) => t.key));
    const hayNuevas = actuales.some((t) => !this.clavesConocidas.has(t.key));
    const primera = this.primeraCarga;
    this.primeraCarga = false;
    this.clavesConocidas = claves;
    if (!primera && hayNuevas && this.sonidoActivo()) this.pitar();
  }

  private cargarGestores(): void {
    this.api
      .get<any[]>('/parametros/gestores')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          // Mismo criterio que el mesero: ttipogestores de módulo 3 activos
          const mapa: Record<number, string> = {};
          for (const g of items ?? []) {
            if (Number(g.moduloId) === 3 && g.sn_activo !== 'N' && g.nombre && g.gestorId != null) {
              mapa[Number(g.gestorId)] = String(g.nombre);
            }
          }
          this.nombresGestor.set(mapa);
        },
        error: () => this.nombresGestor.set({}),
      });
  }

  // ───────────────────────── Avance (un toque) ─────────────────────────

  avanzarTarjeta(t: TarjetaCocina): void {
    const pasos = t.lineas
      .map((l) => ({ l, sig: siguienteEstadoCocina(l.estado_cocina) }))
      .filter((x): x is { l: LineaCocina; sig: EstadoCocina } => x.sig != null);
    if (!pasos.length || this.ocupado()) return;
    this.ejecutar(pasos.map((x) => this.srv.setEstadoCocina(x.l, x.sig)));
  }

  avanzarLinea(l: LineaCocina): void {
    const sig = siguienteEstadoCocina(l.estado_cocina);
    if (!sig || this.ocupado()) return;
    this.ejecutar([this.srv.setEstadoCocina(l, sig)]);
  }

  private ejecutar(peticiones: Observable<LineaCocina>[]): void {
    this.ocupado.set(true);
    forkJoin(peticiones).subscribe({
      next: () => {
        this.ocupado.set(false);
        this.cargar();
      },
      error: (e) => {
        this.ocupado.set(false);
        this.cargar(); // parte pudo haber avanzado: refrescar siempre
        this.msg.add({
          severity: 'error',
          summary: 'Cocina',
          detail: (typeof e?.error?.message === 'string' && e.error.message) || 'No se pudo actualizar el estado',
        });
      },
    });
  }

  // ───────────────────────── Helpers de vista ─────────────────────────

  puedeAvanzar(t: TarjetaCocina): boolean {
    return t.lineas.some((l) => siguienteEstadoCocina(l.estado_cocina) != null);
  }

  etiquetaBoton(t: TarjetaCocina): string {
    const n = t.lineas.filter((l) => siguienteEstadoCocina(l.estado_cocina) != null).length;
    return t.estado === 'PENDIENTE' ? `Preparar (${n})` : `Marcar listo (${n})`;
  }

  minutosEspera(t: TarjetaCocina): number {
    if (!t.enviadoAt) return 0;
    const ts = Date.parse(t.enviadoAt);
    if (isNaN(ts)) return 0;
    return Math.max(0, Math.floor((this.ahora() - ts) / 60_000));
  }

  nivelEspera(t: TarjetaCocina): '' | 'ambar' | 'rojo' {
    const m = this.minutosEspera(t);
    if (m >= UMBRAL_ROJO_MIN) return 'rojo';
    if (m >= UMBRAL_AMBAR_MIN) return 'ambar';
    return '';
  }

  /** 'HH:MM' local de la hora de envío a cocina. */
  horaEnvio(t: TarjetaCocina): string {
    if (!t.enviadoAt) return '—';
    const ts = Date.parse(t.enviadoAt);
    if (isNaN(ts)) return '—';
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  hora(ts: number): string {
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(
      d.getSeconds(),
    ).padStart(2, '0')}`;
  }

  nombreMesero(t: TarjetaCocina): string {
    const id = t.pedido.gestorId;
    return id != null ? this.nombresGestor()[id] ?? `Mesero #${id}` : 'Sin mesero';
  }

  cantidadLineas(t: TarjetaCocina): number {
    return t.lineas.length;
  }

  // ───────────────────────── Sonido ─────────────────────────

  toggleSonido(): void {
    const v = !this.sonidoActivo();
    this.sonidoActivo.set(v);
    localStorage.setItem(CLAVE_SONIDO, v ? 'S' : 'N');
    if (v) this.pitar(); // prueba de sonido al activar
  }

  /** Beep corto con Web Audio (sin archivos; el navegador lo permite tras un toque). */
  private pitar(): void {
    try {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.onended = () => ctx.close().catch(() => undefined);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch {
      // sin audio disponible: se ignora
    }
  }
}
