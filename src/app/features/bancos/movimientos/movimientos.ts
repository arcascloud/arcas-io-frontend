import { Component, inject, signal, OnInit, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ApiService } from '../../../core/services/api.service';
import { BcoMovimiento } from '../../../core/models/bancos.models';

@Component({
  selector: 'app-bancos-movimientos',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, RouterLink, TableModule, ButtonModule,
    InputTextModule, InputNumberModule, SelectModule, TagModule, TooltipModule,
    ToastModule, ConfirmDialogModule,
  ],
  templateUrl: './movimientos.html',
  styleUrl: './movimientos.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MovimientosBancos implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private msgs = inject(MessageService);
  private confirm = inject(ConfirmationService);
  private destroyRef = inject(DestroyRef);

  // Datos
  bancos = signal<any[]>([]);
  monedas = signal<any[]>([]);
  cuentas = signal<any[]>([]);
  movimientos = signal<BcoMovimiento[]>([]);
  factoresCambio = signal<any[]>([]);
  cuentaSeleccionada = signal<any | null>(null);
  cargando = signal(false);
  cargandoMovimientos = signal(false);
  guardando = signal(false);

  // Formulario
  form!: FormGroup;
  editando = signal(false);
  editId = signal<number | null>(null);

  readonly TIPO_MOV_OPTIONS = [
    { label: 'Depósito', value: 'DEPOSITO' },
    { label: 'Retiro', value: 'RETIRO' },
    { label: 'Transferencia', value: 'TRANSFERENCIA' },
    { label: 'Pago', value: 'PAGO' },
  ];

  readonly DC_OPTIONS = [
    { label: 'Débito', value: 'D' },
    { label: 'Crédito', value: 'C' },
  ];

  ngOnInit() {
    this.form = this.fb.group({
      tipomov: ['DEPOSITO', Validators.required],
      dc_debitocredito: ['D', Validators.required],
      nroreferencia: [''],
      importe: [0, [Validators.required, Validators.min(0.01)]],
      concepto: [''],
      factordecambio: [1],
    });
    this.cargarBancos();
    this.cargarMonedas();
    this.cargarFactoresCambio();
    this.cargarCuentas();
  }

  cargarBancos() {
    this.api.get<any[]>('/bancos/bancos').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => { this.bancos.set(data || []); },
    });
  }

  cargarMonedas() {
    this.api.get<any[]>('/parametros/monedas').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => { this.monedas.set(data || []); },
    });
  }

  cargarFactoresCambio() {
    this.api.get<any[]>('/contabilidad/factordecambio').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => { this.factoresCambio.set(data || []); },
    });
  }

  cargarCuentas() {
    this.cargando.set(true);
    this.api.get<any[]>('/bancos/cuentas').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.cuentas.set((data || []).map((c: any) => ({ ...c, bancoId: Number(c.bancoId) })));
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las cuentas' });
      },
    });
  }

  seleccionarCuenta(cuenta: any) {
    this.cuentaSeleccionada.set(cuenta);
    this.cargarMovimientos(cuenta.bcoctasId);
    this.limpiarForm();
    this.aplicarFactorCambio(cuenta.monedaId);
  }

  aplicarFactorCambio(monedaId: number) {
    // Lempira (monedaId=1) siempre es 1.00
    if (monedaId === 1) {
      this.form.patchValue({ factordecambio: 1 });
      return;
    }
    // Para otras monedas, buscar en factores de cambio por tipomoneda
    const mapa: Record<number, string> = { 2: 'D', 3: 'E' };
    const tipomoneda = mapa[monedaId];
    if (tipomoneda) {
      const factor = this.factoresCambio().find(f => f.tipomoneda === tipomoneda);
      if (factor) {
        this.form.patchValue({ factordecambio: Number(factor.preciocompra) });
      }
    }
  }

  cargarMovimientos(bcoctasId: number) {
    this.cargandoMovimientos.set(true);
    this.api.get<any[]>('/bancos/movimientos', { bcoctasId: String(bcoctasId) })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (data) => { this.movimientos.set(data || []); this.cargandoMovimientos.set(false); },
        error: () => {
          this.cargandoMovimientos.set(false);
          this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los movimientos' });
        },
      });
  }

  volver() {
    this.cuentaSeleccionada.set(null);
    this.movimientos.set([]);
    this.limpiarForm();
  }

  limpiarForm() {
    this.form.reset({
      tipomov: 'DEPOSITO',
      dc_debitocredito: 'D',
      nroreferencia: '',
      importe: 0,
      concepto: '',
      factordecambio: 1,
    });
    this.editando.set(false);
    this.editId.set(null);
  }

  nuevo() {
    this.limpiarForm();
  }

  editar(mov: BcoMovimiento) {
    this.editando.set(true);
    this.editId.set(mov.bcomovimientosId);
    this.form.reset({
      tipomov: mov.tipomov,
      dc_debitocredito: mov.dc_debitocredito,
      nroreferencia: mov.nroreferencia || '',
      importe: mov.importe,
      concepto: mov.concepto || '',
      factordecambio: mov.factordecambio || 1,
    });
  }

  guardar() {
    if (this.form.invalid || !this.cuentaSeleccionada()) return;
    const raw = this.form.getRawValue();
    const cuenta = this.cuentaSeleccionada()!;
    this.guardando.set(true);

    const payload = {
      bancoId: cuenta.bancoId,
      bcoctasId: cuenta.bcoctasId,
      moduloId: 1,
      tipomov: raw.tipomov,
      dc_debitocredito: raw.dc_debitocredito,
      nroreferencia: raw.nroreferencia || null,
      factordecambio: raw.factordecambio || 1,
      importe: raw.importe,
      concepto: raw.concepto || null,
      empresaId: cuenta.empresaId,
    };

    const req$ = this.editando() && this.editId()
      ? this.api.putBase(`/bancos/movimientos/${this.editId()}?empresaId=${cuenta.empresaId}`, payload)
      : this.api.post('/bancos/movimientos', payload);

    req$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.guardando.set(false);
        this.msgs.add({
          severity: 'success',
          summary: this.editando() ? 'Actualizado' : 'Creado',
          detail: this.editando() ? 'Movimiento actualizado' : 'Movimiento registrado',
        });
        this.limpiarForm();
        this.cargarMovimientos(cuenta.bcoctasId);
      },
      error: () => {
        this.guardando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el movimiento' });
      },
    });
  }

  eliminar(mov: BcoMovimiento) {
    this.confirm.confirm({
      message: '¿Anular este movimiento?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Anular',
      rejectLabel: 'Cancelar',
      rejectButtonProps: { severity: 'secondary', variant: 'text', size: 'small', rounded: true },
      acceptButtonProps: { severity: 'danger', variant: 'text', size: 'small', rounded: true },
      accept: () => {
        this.api.putBase(`/bancos/movimientos/${mov.bcomovimientosId}?empresaId=${mov.empresaId}`, { sn_doc_anulado: 'S' })
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.msgs.add({ severity: 'success', summary: 'Anulado', detail: 'Movimiento anulado' });
              this.cargarMovimientos(this.cuentaSeleccionada()!.bcoctasId);
            },
            error: () => {
              this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudo anular' });
            },
          });
      },
    });
  }

  // ── Helpers ─────────────────────────────────────────────

  tipoMovLabel(tipo: string): string {
    return this.TIPO_MOV_OPTIONS.find(o => o.value === tipo)?.label || tipo;
  }

  tipoMovSeverity(tipo: string): 'success' | 'warn' | 'info' | 'danger' {
    switch (tipo) {
      case 'DEPOSITO': return 'success';
      case 'RETIRO': return 'warn';
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

  monedaNombre(monedaId: number): string {
    return this.monedas().find(m => m.monedaId === monedaId)?.descripcion || `#${monedaId}`;
  }
}
