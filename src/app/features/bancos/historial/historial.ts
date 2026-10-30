import { Component, inject, signal, OnInit, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../../core/services/api.service';
import { BcoMovimiento } from '../../../core/models/bancos.models';
import { BcoCta } from '../../../core/models/bancos.models';

@Component({
  selector: 'app-historial-bancos',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule,
    SelectModule, TagModule, TooltipModule, ToastModule,
  ],
  templateUrl: './historial.html',
  styleUrl: './historial.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistorialBancos implements OnInit {
  private api = inject(ApiService);
  private msgs = inject(MessageService);
  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  /** Partida contable de origen (viaja en la URL al abrir desde copdamae) */
  partidaId = signal<number | null>(null);

  // Datos
  bancos = signal<any[]>([]);
  cuentas = signal<BcoCta[]>([]);
  movimientos = signal<BcoMovimiento[]>([]);
  cuentaFiltro = signal<number | null>(null);
  cargando = signal(false);

  /** Trazabilidad: id del movimiento origen (llega desde partida en copdamae) */
  movOrigenId = signal<number | null>(null);
  /** Primera fila del paginador para dejar visible el movimiento origen */
  primeraFila = signal(0);

  private readonly rowsPagina = 15;

  /**
   * Tipos de movimiento: catálogo vivo desde `GET /bancos/ccdocs` (bcosccdocs).
   * El fallback estático solo aplica si la API falla.
   */
  tipoMovOptions = signal<{ label: string; value: string }[]>([
    { label: 'Depósito', value: 'DEPOSITO' },
    { label: 'Retiro', value: 'RETIRO' },
    { label: 'Transferencia', value: 'TRANSFERENCIA' },
    { label: 'Pago', value: 'PAGO' },
    { label: 'Nota de Debito', value: 'NOTA_DEBITO' },
    { label: 'Nota de Credito', value: 'NOTA_CREDITO' },
  ]);

  ngOnInit() {
    this.cargarBancos();
    this.cargarCuentas();
    this.cargarTiposMov();

    // Partida contable de origen (botón "Volver a la partida")
    const partidaParam = Number(this.route.snapshot.queryParamMap.get('partidaId'));
    if (!isNaN(partidaParam) && partidaParam > 0) this.partidaId.set(partidaParam);

    // Trazabilidad contable: ?movimientoId=<bcomovimientosId>
    const movId = Number(this.route.snapshot.queryParamMap.get('movimientoId'));
    if (!isNaN(movId) && movId > 0) {
      this.movOrigenId.set(movId);
      this.api.get<BcoMovimiento>(`/bancos/movimientos/${movId}`).pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.movOrigenId.set(null);
          this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el movimiento de origen' });
          this.cargarTodos();
          return of(null);
        }),
      ).subscribe({
        next: (mov) => {
          if (mov?.bcoctasId) {
            this.cuentaFiltro.set(Number(mov.bcoctasId));
            this.onFiltroChange();
          } else {
            this.cargarTodos();
          }
        },
      });
      return;
    }

    this.cargarTodos();
  }

  /** Regresa a la partida contable de origen desde la que se abrió este movimiento. */
  volverAPartida(): void {
    if (!this.partidaId()) return;
    this.router.navigate(['/contabilidad/copdamae'], {
      queryParams: { partidaId: this.partidaId() },
    });
  }

  cargarBancos() {
    this.api.get<any[]>('/bancos/bancos').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => { this.bancos.set(data || []); },
    });
  }

  cargarCuentas() {
    this.api.get<any[]>('/bancos/cuentas').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        const ctas = (data || []).map((c: any) => ({ ...c, bancoId: Number(c.bancoId) }));
        this.cuentas.set(ctas);
      },
    });
  }

  /** Carga el catálogo de tipos de movimiento desde bcosccdocs (solo activos). */
  cargarTiposMov() {
    this.api.get<any[]>('/bancos/ccdocs').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        const opciones = (data || [])
          .filter(d => d.sn_activo !== 'N' && d.abreviatura)
          .map(d => ({ label: d.descripcion || d.abreviatura, value: d.abreviatura }));
        if (opciones.length) this.tipoMovOptions.set(opciones);
      },
      // Sin catálogo → se conserva el fallback estático
      error: () => {},
    });
  }

  cargarTodos() {
    this.cargando.set(true);
    this.api.get<any[]>('/bancos/movimientos').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.movimientos.set((data || []).map((m: any) => ({
          ...m,
          importe: Number(m.importe),
        })));
        this.cargando.set(false);
        this.aplicarPaginaOrigen();
      },
      error: () => {
        this.cargando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los movimientos' });
      },
    });
  }

  onFiltroChange() {
    const bcoctasId = this.cuentaFiltro();
    if (!bcoctasId) {
      this.cargarTodos();
      return;
    }
    this.cargando.set(true);
    this.api.get<any[]>('/bancos/movimientos', { bcoctasId: String(bcoctasId) })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (data) => {
          this.movimientos.set((data || []).map((m: any) => ({
            ...m,
            importe: Number(m.importe),
          })));
          this.cargando.set(false);
          this.aplicarPaginaOrigen();
        },
        error: () => {
          this.cargando.set(false);
          this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los movimientos' });
        },
      });
  }

  /**
   * Posiciona el paginador en la página que contiene el movimiento origen
   * y desplaza la vista hasta la fila resaltada.
   */
  private aplicarPaginaOrigen(): void {
    const id = this.movOrigenId();
    if (!id) {
      this.primeraFila.set(0);
      return;
    }
    const idx = this.movimientos().findIndex(m => Number(m.bcomovimientosId) === id);
    if (idx < 0) {
      this.primeraFila.set(0);
      this.msgs.add({
        severity: 'warn',
        summary: 'Movimiento no encontrado',
        detail: `El movimiento #${id} no se encuentra en la cuenta seleccionada`,
      });
      return;
    }
    this.primeraFila.set(Math.floor(idx / this.rowsPagina) * this.rowsPagina);
    setTimeout(() => {
      document.querySelector('.row-origen')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 300);
  }

  // ── Helpers ─────────────────────────────────────────────

  tipoMovLabel(tipo: string): string {
    return this.tipoMovOptions().find(o => o.value === tipo)?.label || tipo;
  }

  tipoMovSeverity(tipo: string): 'success' | 'warn' | 'info' | 'danger' {
    switch (tipo) {
      case 'DEPOSITO': return 'success';
      case 'NOTA_CREDITO': return 'success';
      case 'RETIRO': return 'warn';
      case 'NOTA_DEBITO': return 'warn';
      case 'TRANSFERENCIA': return 'info';
      case 'PAGO': return 'danger';
      default: return 'info';
    }
  }

  dcLabel(dc: string): string {
    return dc === 'D' ? 'Débito' : 'Crédito';
  }

  dcSeverity(dc: string): 'danger' | 'success' {
    return dc === 'D' ? 'danger' : 'success';
  }

  formatFecha(fecha: string): string {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleString('es-HN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  formatCurrency(valor: number): string {
    return new Intl.NumberFormat('es-HN', { style: 'currency', currency: 'HNL' }).format(valor || 0);
  }

  bancoNombre(bancoId: number): string {
    return this.bancos().find(b => b.bancoId === bancoId)?.descripcion || `Banco #${bancoId}`;
  }

  bancoNombreCuenta(cuenta: BcoCta): string {
    return this.bancoNombre(cuenta.bancoId);
  }
}
