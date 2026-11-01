import { Component, inject, signal, OnInit, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { timeout, catchError, of } from 'rxjs';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { CxcService } from '../../../core/services/cxc.service';
import { AuthService } from '../../../core/services/auth.service';
import { CxcHistorico, CxcCliente } from '../../../core/models/cxc.models';

@Component({
  selector: 'app-historico-manager',
  standalone: true,
  host: { class: 'historico-manager' },
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    TableModule,
    InputNumberModule,
    SelectModule,
    DatePickerModule,
    TagModule,
  ],
  templateUrl: './historico-manager.html',
  styleUrl: './historico-manager.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoricoManager implements OnInit {
  private service = inject(CxcService);
  private msgs = inject(MessageService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  // ===== FILTROS =====
  /** Nombre exacto del cliente (razón social) — el backend filtra por LIKE */
  cliente = signal<string | null>(null);
  clienteOpciones = signal<{ label: string; value: string }[]>([]);
  fechaDesde = signal<string | null>(null);
  fechaHasta = signal<string | null>(null);

  // ===== DATOS =====
  data = signal<CxcHistorico[]>([]);
  filtered = signal<CxcHistorico[]>([]);
  cargando = signal(false);
  totalRecords = signal(0);

  // ===== SELECCION =====
  selectedRow: CxcHistorico | null = null;

  // ===== PAGINACION =====
  page = signal(1);
  limit = signal(20);

  // ===== TIPOS DE MOVIMIENTO =====
  readonly tipoMovOptions = [
    { label: 'Debito', value: 'D' },
    { label: 'Credito', value: 'C' },
    { label: 'Interés/Mora', value: 'I' },
  ];

  ngOnInit() {
    this.cargarClientes();
    this.cargarHistorico();
  }

  private cargarClientes() {
    this.service.getClientes(1, 1000, '', 4).pipe(
      takeUntilDestroyed(this.destroyRef),
      timeout(15000),
      catchError(() => of({ data: [] as CxcCliente[], total: 0 })),
    ).subscribe((res) => {
      const opciones = (res?.data ?? [])
        .filter((c) => c.sn_activo !== 'N')
        .map((c) => {
          const label = (c.razonsocial && c.razonsocial.trim()) ||
            `${c.nombres ?? ''} ${c.apellidos ?? ''}`.trim();
          return { label, value: label };
        })
        .filter((o) => o.label !== '')
        .sort((a, b) => a.label.localeCompare(b.label, 'es'));
      this.clienteOpciones.set(opciones);
    });
  }

  private cargarHistorico() {
    this.cargando.set(true);
    this.service
      .getHistoricoConFiltros('', this.cliente() ?? '', this.fechaDesde(), this.fechaHasta())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        timeout(15000),
        catchError(() => of([])),
      )
      .subscribe({
        next: (res) => {
          const datos = res ?? [];
          this.data.set(datos);
          this.filtered.set(datos);
          this.totalRecords.set(datos.length);
          this.cargando.set(false);
        },
        error: () => {
          this.cargando.set(false);
          this.msgs.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron cargar los registros históricos',
          });
        },
      });
  }

  buscar() {
    this.cargarHistorico();
  }

  limpiarFiltros() {
    this.cliente.set(null);
    this.fechaDesde.set(null);
    this.fechaHasta.set(null);
    this.selectedRow = null;
    this.cargarHistorico();
  }

  getTipoMovLabel(tipo: string): string {
    const tipos: Record<string, string> = { C: 'Crédito', D: 'Débito', I: 'Interés/Mora' };
    return tipos[tipo] || tipo;
  }

  getTipoMovSeverity(tipo: string): 'success' | 'danger' | 'info' | 'warning' | 'help' {
    if (tipo === 'C') return 'info';
    if (tipo === 'I') return 'help';
    return 'danger';
  }

  moneda(val: any): string {
    const num = Number(val) || 0;
    if (isNaN(num)) return '0.00';
    const partes = num.toFixed(2).split('.');
    partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return partes.join('.');
  }

  getNombreCliente(item: CxcHistorico): string {
    return item.cliente || item.nrocliente || 'Sin nombre';
  }

  getFecha(fecha: string): string {
    if (!fecha) return '';
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return fecha;
    return d.toLocaleDateString('es-HN');
  }

  /**
   * Navega a movimientos pasando el registro completo via router state.
   * El objeto CxcHistorico queda disponible en history.state.movimiento
   * sin serializarse en la URL.
   */
  irAmovimientos(item: CxcHistorico) {
    this.router.navigate(['/cxc/movimientos'], {
      queryParams: { clienteId: item.clienteId },
      state: { movimiento: item },
    });
  }
}
