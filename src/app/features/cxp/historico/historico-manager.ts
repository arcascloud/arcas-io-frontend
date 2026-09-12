import { Component, inject, signal, OnInit, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { timeout, catchError, of } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { CxpService } from '../../../core/services/cxp.service';
import { CxPHistorico } from '../../../core/models/cxp.models';

@Component({
  selector: 'app-cxp-historico-manager',
  standalone: true,
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
export class CxpHistoricoManager implements OnInit {
  private service = inject(CxpService);
  private msgs = inject(MessageService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);

  // ===== FILTROS =====
  dni = signal('');
  proveedor = signal('');
  fechaDesde = signal<string | null>(null);
  fechaHasta = signal<string | null>(null);

  // ===== DATOS =====
  data = signal<CxPHistorico[]>([]);
  filtered = signal<CxPHistorico[]>([]);
  cargando = signal(false);
  totalRecords = signal(0);

  // ===== SELECCION =====
  selectedRow: CxPHistorico | null = null;

  // ===== PAGINACION =====
  page = signal(1);
  limit = signal(20);

  // ===== TIPOS DE MOVIMIENTO =====
  readonly tipoMovOptions = [
    { label: 'Debito', value: 'D' },
    { label: 'Credito', value: 'C' },
  ];

  ngOnInit() {
    this.cargarHistorico();
  }

  private cargarHistorico() {
    this.cargando.set(true);
    this.service.getHistoricoConFiltros(
      this.dni(),
      this.proveedor(),
      this.fechaDesde(),
      this.fechaHasta(),
    ).pipe(
      takeUntilDestroyed(this.destroyRef),
      timeout(15000),
      catchError(() => of([]))
    ).subscribe({
      next: (res) => {
        const datos = res ?? [];
        this.data.set(datos);
        this.filtered.set(datos);
        this.totalRecords.set(datos.length);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los registros historicos' });
      },
    });
  }

  buscar() {
    this.cargarHistorico();
  }

  limpiarFiltros() {
    this.dni.set('');
    this.proveedor.set('');
    this.fechaDesde.set(null);
    this.fechaHasta.set(null);
    this.selectedRow = null;
    this.cargarHistorico();
  }

  getTipoMovLabel(tipo: string): string {
    const tipos: Record<string, string> = { 'C': 'Credito', 'D': 'Debito' };
    return tipos[tipo] || tipo;
  }

  getTipoMovSeverity(tipo: string): 'success' | 'danger' | 'info' {
    if (tipo === 'C') return 'info';
    return 'danger';
  }

  moneda(val: any): string {
    const num = Number(val) || 0;
    if (isNaN(num)) return '0.00';
    const partes = num.toFixed(2).split('.');
    partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return partes.join('.');
  }

  getNombreProveedor(item: CxPHistorico): string {
    return item.proveedor || item.nroproveedor || 'Sin nombre';
  }

  getFecha(fecha: string): string {
    if (!fecha) return '';
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return fecha;
    return d.toLocaleDateString('es-HN');
  }

  irAMovimientos(item: CxPHistorico) {
    this.router.navigate(['/cxp/movimientos'], {
      queryParams: { proveedorId: item.proveedorId },
      state: { movimiento: item },
    });
  }
}
