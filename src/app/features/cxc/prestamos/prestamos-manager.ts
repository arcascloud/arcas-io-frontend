import { Component, inject, signal, OnInit, computed, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { timeout, catchError, of } from 'rxjs';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DataViewModule } from 'primeng/dataview';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { CardModule } from 'primeng/card';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService } from 'primeng/api';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { PaginatorModule } from 'primeng/paginator';
import { CxcService } from '../../../core/services/cxc.service';
import { AuthService } from '../../../core/services/auth.service';
import { CxcCliente } from '../../../core/models/cxc.models';

@Component({
  selector: 'app-prestamos-manager',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ToolbarModule,
    ButtonModule,
    InputTextModule,
    DataViewModule,
    TagModule,
    TooltipModule,
    CardModule,
    SkeletonModule,
    InputNumberModule,
    SelectModule,
    DatePickerModule,
    PaginatorModule,
  ],
  templateUrl: './prestamos-manager.html',
  styleUrl: './prestamos-manager.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrestamosManager implements OnInit {
  private service = inject(CxcService);
  private msgs = inject(MessageService);
  private auth = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  // ===== CLIENTES =====
  data = signal<CxcCliente[]>([]);
  cargando = signal(false);
  selectedCliente = signal<CxcCliente | null>(null);
  q = signal('');
  page = signal(1);
  limit = signal(15);
  totalClientes = signal(0);

  // ===== PRÉSTAMOS =====
  prestamosData = signal<any[]>([]);
  prestamosLoading = signal(false);
  prestamoSaving = signal(false);
  prestamoModel = signal<any>({
    clienteId: null,
    nroprestamo: null,
    capital: 0,
    cuotas: 1,
    tasa: 0,
    vlrcuota: 0,
    fecharegistro: new Date().toISOString(),
    sn_activo: 'S',
  });

  prestamoFecha = computed(() => {
    const f = this.prestamoModel().fecharegistro;
    if (!f) return null;
    const d = new Date(f);
    return isNaN(d.getTime()) ? null : d;
  });

  planPago = signal<any[]>([]);
  showPlanPago = signal(false);

  readonly estadoOptions = [
    { label: 'Activo', value: 'S' },
    { label: 'Inactivo', value: 'N' },
  ];

  ngOnInit() {
    this.loadClientes();
  }

  // ===== CLIENTES =====
  loadClientes() {
    this.cargando.set(true);
    this.service.getClientes(this.page(), this.limit(), this.q()).pipe(
      takeUntilDestroyed(this.destroyRef),
      timeout(10000),
      catchError(() => of({ data: [], total: 0 }))
    ).subscribe({
      next: (res) => {
        this.data.set(res.data);
        this.totalClientes.set(res.total);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  onPageChange(event: any) {
    this.page.set(event.page + 1);
    this.limit.set(event.rows);
    this.loadClientes();
  }

  limpiarFiltros() {
    this.q.set('');
    this.loadClientes();
  }

  seleccionarCliente(cliente: CxcCliente) {
    this.selectedCliente.set(cliente);
    this.loadPrestamos(cliente.clienteId);
  }

  getClienteNombre(c: CxcCliente): string {
    return `${c.nombres || ''} ${c.apellidos || ''}`.trim();
  }

  moneda(val: number): string {
    if (val == null || isNaN(val)) return 'L 0.00';
    const partes = val.toFixed(2).split('.');
    partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return 'L ' + partes.join('.');
  }

  // ===== PRÉSTAMOS =====
  private loadPrestamos(clienteId: number) {
    this.prestamosLoading.set(true);
    this.service.getPrestamosByCliente(clienteId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.prestamosData.set(res);
        this.prestamosLoading.set(false);
      },
      error: () => this.prestamosLoading.set(false),
    });
  }

  onPrestamoFechaChange(d: Date | null) {
    this.prestamoModel.set({ ...this.prestamoModel(), fecharegistro: d ? d.toISOString() : null });
  }

  calcularCuota() {
    const raw = this.prestamoModel();
    const capital = Number(raw.capital) || 0;
    const cuotas = Number(raw.cuotas) || 0;
    const tasaAnual = Number(raw.tasa) || 0;
    if (capital <= 0 || cuotas <= 0 || tasaAnual <= 0) return;
    const tasaMensual = tasaAnual / 100 / 12;
    const factor = tasaMensual / (1 - Math.pow(1 + tasaMensual, -cuotas));
    const cuotaFija = Math.round(capital * factor * 100) / 100;
    this.prestamoModel.set({ ...this.prestamoModel(), vlrcuota: cuotaFija });
  }

  cancelarPrestamo() {
    this.prestamoModel.set({
      nroprestamo: null,
      capital: 0,
      cuotas: 1,
      tasa: 0,
      vlrcuota: 0,
      fecharegistro: new Date().toISOString(),
      sn_activo: 'S',
    });
  }

  guardarPrestamo() {
    const cliente = this.selectedCliente();
    if (!cliente) {
      this.msgs.add({ severity: 'warn', summary: 'Seleccione', detail: 'Seleccione un cliente antes de crear un préstamo' });
      return;
    }

    const raw = { ...this.prestamoModel() };
    const payload: any = {
      ...raw,
      clienteId: cliente.clienteId,
      capital: Number(raw.capital) || 0,
      cuotas: Number(raw.cuotas) || 1,
      tasa: Number(raw.tasa) || 0,
      vlrcuota: Number(raw.vlrcuota) || 0,
      nroprestamo: raw.nroprestamo || '',
      sn_activo: raw.sn_activo || 'S',
      sn_contabilizado: 'N',
    };

    try {
      if (payload.fecharegistro) {
        const d = new Date(payload.fecharegistro);
        if (!isNaN(d.getTime())) payload.fecharegistro = d.toISOString();
      }
    } catch (e) { }

    if (!payload.capital || payload.capital <= 0) {
      this.msgs.add({ severity: 'warn', summary: 'Datos incompletos', detail: 'El capital debe ser mayor a 0' });
      return;
    }
    if (!payload.cuotas || payload.cuotas <= 0) {
      this.msgs.add({ severity: 'warn', summary: 'Datos incompletos', detail: 'Las cuotas deben ser mayor a 0' });
      return;
    }

    const user = this.auth.currentUser();
    if (user) {
      payload.empresaId = payload.empresaId ?? user.empresaId;
      if (user.idsucursal != null) payload.Idsucursal = payload.Idsucursal ?? user.idsucursal;
      payload.usuarioCreated = payload.usuarioCreated ?? user.usuario ?? user.nombre;
    }

    this.prestamoSaving.set(true);
    this.service.createPrestamo(payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.prestamosData.set([...this.prestamosData(), res]);
        this.cancelarPrestamo();
        this.msgs.add({ severity: 'success', summary: 'Guardado', detail: 'Préstamo registrado correctamente' });

        const plan = this.planPago();
        if (plan.length > 0 && res?.prestamoId) {
          this.guardarPlanPagoConPrestamo(res.prestamoId, plan, cliente.clienteId);
        } else {
          this.prestamoSaving.set(false);
          this.showPlanPago.set(false);
          this.planPago.set([]);
        }
      },
      error: (err) => {
        console.error('[PrestamosManager] Error guardando préstamo', err);
        let detail = 'No se pudo guardar el préstamo';
        if (err?.error?.message) detail = err.error.message;
        else if (err?.message) detail = err.message;
        this.prestamoSaving.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail });
      },
    });
  }

  private guardarPlanPagoConPrestamo(prestamoId: number, plan: any[], clienteId: number) {
    const user = this.auth.currentUser();
    const requests = plan.map((fila) => {
      const payload = {
        ...fila,
        prestamoId,
        clienteId,
        empresaId: user?.empresaId,
        usuarioCreated: user?.usuario || user?.nombre,
      };
      return this.service.createPrestamoPP(payload);
    });

    let completadas = 0;
    let errores = 0;
    const total = plan.length;

    requests.forEach((req) => {
      req.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          completadas++;
          if (completadas + errores === total) {
            this.prestamoSaving.set(false);
            this.showPlanPago.set(false);
            this.planPago.set([]);
            this.msgs.add({ severity: 'success', summary: 'Plan de pago', detail: `${completadas} cuotas guardadas` });
          }
        },
        error: () => {
          errores++;
          if (completadas + errores === total) {
            this.prestamoSaving.set(false);
            this.showPlanPago.set(false);
            this.planPago.set([]);
            this.msgs.add({ severity: errores > 0 ? 'warn' : 'success', summary: 'Plan de pago', detail: `${completadas} guardadas, ${errores} errores` });
          }
        },
      });
    });
  }

  generarPlanPago() {
    const raw = this.prestamoModel();
    const capital = Number(raw.capital) || 0;
    const cuotas = Number(raw.cuotas) || 0;
    const tasaAnual = Number(raw.tasa) || 0;

    if (capital <= 0) {
      this.msgs.add({ severity: 'warn', summary: 'Datos incompletos', detail: 'El capital debe ser mayor a 0' });
      return;
    }
    if (cuotas <= 0) {
      this.msgs.add({ severity: 'warn', summary: 'Datos incompletos', detail: 'Las cuotas deben ser mayor a 0' });
      return;
    }
    if (tasaAnual <= 0) {
      this.msgs.add({ severity: 'warn', summary: 'Datos incompletos', detail: 'La tasa de interés debe ser mayor a 0' });
      return;
    }

    const now = new Date();
    const user = this.auth.currentUser();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const nroprestamo = `${yyyy}${mm}${dd}${user?.empresaId ?? ''}${user?.usuarioId ?? ''}${ss}`;

    const tasaMensual = tasaAnual / 100 / 12;
    const factor = tasaMensual / (1 - Math.pow(1 + tasaMensual, -cuotas));
    const cuotaFija = capital * factor;

    const plan: any[] = [];
    let saldo = capital;
    const fechaBase = raw.fecharegistro ? new Date(raw.fecharegistro) : new Date();

    for (let i = 1; i <= cuotas; i++) {
      const interes = saldo * tasaMensual;
      const capitalPago = cuotaFija - interes;
      saldo = saldo - capitalPago;

      const fechaPago = new Date(fechaBase);
      fechaPago.setMonth(fechaPago.getMonth() + i);

      plan.push({
        nrofila: i,
        FechaPago: fechaPago.toISOString(),
        vlrcuota: Math.round(cuotaFija * 100) / 100,
        capital: Math.round(capitalPago * 100) / 100,
        interes: Math.round(interes * 100) / 100,
        mora: 0,
        saldo: Math.round(Math.abs(saldo) * 100) / 100,
        sn_pagada: 'N',
        sn_anulada: 'N',
      });
    }

    this.planPago.set(plan);
    this.showPlanPago.set(true);
    this.prestamoModel.set({
      ...this.prestamoModel(),
      nroprestamo,
      vlrcuota: Math.round(cuotaFija * 100) / 100,
    });
  }

  cancelarPlanPago() {
    this.showPlanPago.set(false);
    this.planPago.set([]);
  }
}
