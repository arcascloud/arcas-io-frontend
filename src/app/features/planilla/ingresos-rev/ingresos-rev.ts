import { Component, inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../../core/services/api.service';

type ClaveIngreso = 'comision' | 'bono' | 'horaEx' | 'diaFest' | 'decimo13' | 'decimo14';

/** Definición de columna que envía el backend (catálogo detectado). */
interface DefCol {
  clave: ClaveIngreso;
  tipomovId: number | null;
  abreviatura: string;
  descripcion: string;
  /** true = concepto anual (décimos). El formato L/% lo decide `Celda.esMonto`. */
  esAnual: boolean;
}

/** Estado de un concepto de ingreso para un empleado. */
interface Celda {
  importe: number | string | null;
  tipoimporte: string | null;
  /** true = importe en Lempiras; false = porcentaje que aplica planilla */
  esMonto: boolean;
  sinRegistrar: boolean;
  calculado: number | string | null;
  descuadra: boolean;
}

interface EmpleadoRow {
  empleadoId: number;
  nroempleado: string;
  nrodocumento: string;
  nombre: string;
  fecha_alta: string | null;
  sueldobruto: number | string;
  ingresos: Record<ClaveIngreso, Celda>;
  totalAnual: number | string;
}

interface TotalCol {
  conRegistro: number;
  sinRegistrar: number;
  descuadra: number;
  total: number | string;
}

interface Resumen {
  fecha: string;
  /** Período que rige COMISION/BONO: abierto, o fecha de sistema si no hay abierto */
  periodo: { anio: number; mes: number; fuente: 'abierto' | 'fechasistema' } | null;
  columnas: DefCol[];
  empleados: EmpleadoRow[];
  totales: {
    empleados: number;
    porColumna: Record<ClaveIngreso, TotalCol>;
    totalAnual: number | string;
  } | null;
}

@Component({
  selector: 'app-ingresos-resumen',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, TableModule, TooltipModule],
  templateUrl: './ingresos-rev.html',
  styleUrl: './ingresos-rev.scss',
})
export class IngresosRev implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  private msgs = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  cargando = signal(false);
  datos = signal<Resumen | null>(null);
  /** Texto del buscador (se copia a la signal en cada input) */
  filtro = signal('');
  /** Filtra a los empleados con alguna celda sin registrar o descuadrada */
  soloPendientes = signal(false);

  columnas = computed<DefCol[]>(() => this.datos()?.columnas ?? []);

  /** Filas visibles según búsqueda y filtro de pendientes */
  visibles = computed<EmpleadoRow[]>(() => {
    const d = this.datos();
    if (!d) return [];
    const q = this.filtro().trim().toLowerCase();
    return d.empleados.filter((e) => {
      if (this.soloPendientes() && !this.tienePendiente(e)) return false;
      if (!q) return true;
      return (
        e.nombre.toLowerCase().includes(q) ||
        (e.nroempleado || '').toLowerCase().includes(q) ||
        (e.nrodocumento || '').toLowerCase().includes(q)
      );
    });
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.api
      .get<Resumen>('/planilla/ingresos-rev/revisar')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (d) => {
          this.datos.set(d);
          this.cargando.set(false);
        },
        error: (err: any) => {
          this.cargando.set(false);
          const msg = err?.error?.message;
          this.msgs.add({
            severity: 'error',
            summary: 'No se pudo cargar',
            detail: Array.isArray(msg) ? msg.join(' · ') : msg || 'Error inesperado',
          });
        },
      });
  }

  /** ¿Tiene al menos una celda sin registrar o descuadrada? */
  tienePendiente(e: EmpleadoRow): boolean {
    return this.columnas().some((c) => {
      const cel = e.ingresos[c.clave];
      return cel != null && (cel.sinRegistrar || cel.descuadra);
    });
  }

  toggleSoloPendientes(): void {
    this.soloPendientes.update((v) => !v);
  }

  limpiarFiltro(): void {
    this.filtro.set('');
    this.soloPendientes.set(false);
  }

  /** Celda de una columna para una fila (siempre existe, pero se protege) */
  celda(row: EmpleadoRow, clave: ClaveIngreso): Celda | null {
    return row.ingresos?.[clave] ?? null;
  }

  /** Total agregado de una columna; '—' si la columna no existe en el catálogo */
  totalCol(clave: ClaveIngreso): TotalCol | null {
    return this.datos()?.totales?.porColumna?.[clave] ?? null;
  }

  /** Formatea un importe en lempiras con 2 decimales */
  fmtL(v: number | string | null | undefined): string {
    if (v == null || v === '') return '—';
    const n = Number(v);
    if (!isFinite(n)) return '—';
    return n.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  /** Porcentaje de planilla con 2 decimales */
  fmtPct(v: number | string | null | undefined): string {
    if (v == null || v === '') return '—';
    const n = Number(v);
    if (!isFinite(n)) return '—';
    return n.toFixed(2);
  }

  /** dd/mm/yyyy — usa hora local (la API devuelve UTC) */
  fmtFecha(v: string | null | undefined): string {
    if (!v) return '—';
    const d = new Date(v);
    if (isNaN(d.getTime())) return '—';
    return `${this.p2(d.getDate())}/${this.p2(d.getMonth() + 1)}/${d.getFullYear()}`;
  }

  fechaSistema(): string {
    return this.fmtFecha(this.datos()?.fecha ?? null);
  }

  /**
   * Período que rige COMISION / BONO.
   * `abierto` → "10/2026"; sin período contable abierto se avisa explícitamente
   * porque los valores mostrados son los de la fecha de sistema.
   */
  fmtPeriodo(): string {
    const p = this.datos()?.periodo;
    if (!p) return '—';
    const base = `${this.p2(p.mes)}/${p.anio}`;
    return p.fuente === 'abierto' ? base : `${base} ⚠ sin período abierto`;
  }

  /** true = no hay período contable abierto y se muestra por fecha de sistema */
  sinPeriodoAbierto(): boolean {
    return this.datos()?.periodo?.fuente === 'fechasistema';
  }

  /** Cantidad total de celdas pendientes (sin registrar + descuadradas) */
  pendientes(): number {
    const t = this.datos()?.totales;
    if (!t) return 0;
    return this.columnas().reduce(
      (s, c) => s + (t.porColumna[c.clave]?.sinRegistrar ?? 0) + (t.porColumna[c.clave]?.descuadra ?? 0),
      0,
    );
  }

  verEmpleado(e: EmpleadoRow): void {
    this.router.navigate(['/planilla/empleado-tipo-mov/editar', e.empleadoId]);
  }

  irAEmpleados(): void {
    this.router.navigate(['/planilla/empleados']);
  }

  private p2(n: number): string {
    return n < 10 ? '0' + n : String(n);
  }
}
