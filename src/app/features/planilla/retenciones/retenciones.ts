import { Component, inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../../core/services/api.service';

/** Tramo de una tabla de retención: tcoisr (%) o tcoimpuestovecinal (por mil) */
interface Tramo {
  descripcion: string;
  del: number | string;
  al: number | string;
  importe: number | string;
}

interface Movimiento {
  tipomovId: number;
  descripcion: string;
  abreviatura: string;
}

/**
 * Fila por empleado. Los campos llegan PLANOS desde la API (no anidados):
 * `isr`, `isrMeses`, `isrIngresoAnual`, `vecinal`, `vecMeses`, …
 */
interface EmpleadoRow {
  empleadoId: number;
  nroempleado: string;
  nrodocumento: string;
  nombre: string;
  fecha_alta: string | null;
  sueldobruto: number | string;
  // ISR — año calendario, tasa en %
  isrMeses: number;
  isrIngresoAnual: number | string;
  isr: number | string;
  isrDebeRetener: boolean;
  isrRegistrado: number | string | null;
  isrSinRegistrar: boolean;
  // Vecinal — ventana 1 jun → 31 may, tasa por mil
  vecMeses: number;
  vecIngresoAnual: number | string;
  vecinal: number | string;
  vecDebeRetener: boolean;
  vecRegistrado: number | string | null;
  vecSinRegistrar: boolean;
  totalRetenciones: number | string;
}

interface GrupoTotales {
  conRetencion: number;
  exentos: number;
  total: number | string;
  sinRegistrar: number;
}

interface Totales {
  empleados: number;
  isr: GrupoTotales;
  vecinal: GrupoTotales;
  totalRetenciones: number | string;
}

interface RevisionRetenciones {
  fecha: string;
  tramos: { isr: Tramo[]; vecinal: Tramo[] };
  movimientos: { isr: Movimiento | null; vecinal: Movimiento | null };
  empleados: EmpleadoRow[];
  totales: Totales | null;
}

@Component({
  selector: 'app-retenciones-revision',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, TableModule, TagModule, TooltipModule],
  templateUrl: './retenciones.html',
  styleUrl: './retenciones.scss',
})
export class RetencionesRevision implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  private msgs = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  cargando = signal(false);
  datos = signal<RevisionRetenciones | null>(null);
  /** Texto del buscador (se copia a la signal en cada input) */
  filtro = signal('');
  /** Filtra sólo a los empleados que retienen alguna de las dos */
  soloRetienen = signal(false);

  movIsr = computed(() => this.datos()?.movimientos.isr ?? null);
  movVecinal = computed(() => this.datos()?.movimientos.vecinal ?? null);

  /** Filas visibles según búsqueda y filtro de retención */
  visibles = computed<EmpleadoRow[]>(() => {
    const d = this.datos();
    if (!d) return [];
    const q = this.filtro().trim().toLowerCase();
    return d.empleados.filter((e) => {
      if (this.soloRetienen() && !e.isrDebeRetener && !e.vecDebeRetener) return false;
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
      .get<RevisionRetenciones>('/planilla/retenciones/revisacion')
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

  toggleSoloRetienen(): void {
    this.soloRetienen.update((v) => !v);
  }

  limpiarFiltro(): void {
    this.filtro.set('');
    this.soloRetienen.set(false);
  }

  /** Formatea un importe en lempiras con 2 decimales */
  fmtL(v: number | string | null | undefined): string {
    if (v == null || v === '') return '—';
    const n = Number(v);
    if (!isFinite(n)) return '—';
    return n.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  /** dd/mm/yyyy — usa hora local (la API devuelve UTC) */
  fmtFecha(v: string | null | undefined): string {
    if (!v) return '—';
    const d = new Date(v);
    if (isNaN(d.getTime())) return '—';
    return `${this.p2(d.getDate())}/${this.p2(d.getMonth() + 1)}/${d.getFullYear()}`;
  }

  /** "1 mes" / "5 meses" — evita el "1 mes(es)" */
  fmtMeses(n: number | null | undefined): string {
    if (n == null) return '—';
    return `${n} ${n === 1 ? 'mes' : 'meses'}`;
  }

  fechaSistema(): string {
    return this.fmtFecha(this.datos()?.fecha ?? null);
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
