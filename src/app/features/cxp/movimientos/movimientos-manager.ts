import { Component, inject, signal, OnInit, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
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
import { CxpService } from '../../../core/services/cxp.service';
import { AuthService } from '../../../core/services/auth.service';
import { CatalogoParametrosService } from '../../../core/services/catalogo-parametros.service';
import { Proveedor } from '../../../core/models/inventario.models';

@Component({
  selector: 'app-cxp-movimientos-manager',
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
  templateUrl: './movimientos-manager.html',
  styleUrl: './movimientos-manager.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxpMovimientosManager implements OnInit {
  private service = inject(CxpService);
  private msgs = inject(MessageService);
  private auth = inject(AuthService);
  private destroyRef = inject(DestroyRef);
  private catalogService = inject(CatalogoParametrosService);

  data = signal<Proveedor[]>([]);
  cargando = signal(false);
  selectedProveedor = signal<Proveedor | null>(null);
  q = signal('');
  page = signal(1);
  limit = signal(15);
  totalProveedores = signal(0);

  movimientosData = signal<any[]>([]);
  movimientosLoading = signal(false);
  movimientoSaving = signal(false);
  movimientoModel = signal<any>({
    proveedorId: null,
    tipomov: 'D',
    descripcion1: '',
    importe: 0,
    nroreferencia: '',
    fecharegistro: new Date().toISOString(),
  });

  movimientoFecha: Date | null = new Date();

  documentosOptions = signal<{ label: string; value: any }[]>([]);
  documentoSelected = signal<any>(null);

  readonly tipoMovOptions = [
    { label: 'Débito', value: 'D' },
    { label: 'Crédito', value: 'C' },
  ];

  get debitoReferencias(): string[] {
    const refs = this.movimientosData()
      .filter((m: any) => m.tipomov === 'D' && m.nroreferencia)
      .map((m: any) => String(m.nroreferencia));
    return [...new Set(refs)];
  }

  ngOnInit() {
    this.loadProveedores();
    this.loadDocumentos();
  }

  loadProveedores() {
    this.cargando.set(true);
    this.service.getProveedoresPag(this.page(), this.limit(), this.q()).pipe(
      takeUntilDestroyed(this.destroyRef),
      timeout(10000),
      catchError(() => of({ data: [], total: 0 }))
    ).subscribe({
      next: (res) => {
        this.data.set(res.data);
        this.totalProveedores.set(res.total);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  onPageChange(event: any) {
    this.page.set(event.page + 1);
    this.limit.set(event.rows);
    this.loadProveedores();
  }

  limpiarFiltros() {
    this.q.set('');
    this.loadProveedores();
  }

  seleccionarProveedor(proveedor: Proveedor) {
    this.selectedProveedor.set(proveedor);
    this.loadMovimientos(proveedor.proveedorId);
  }

  getProveedorNombre(p: Proveedor): string {
    return `${p.nombres || ''} ${p.apellidos || ''}`.trim();
  }

  moneda(val: number): string {
    if (val == null || isNaN(val)) return '0.00';
    const partes = val.toFixed(2).split('.');
    partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return partes.join('.');
  }

  loadDocumentos() {
    const user = this.auth.currentUser();
    this.catalogService.getAll<any>('/parametros/tcotipodocumentofiscal').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        const filtered = (res || []).filter((r: any) => {
          const activo = r.sn_activo === 'S' || r.activo === true || r.sn_activo === true;
          const mismaEmpresa = user?.empresaId ? Number(r.empresaId) === Number(user.empresaId) : true;
          return activo && mismaEmpresa;
        });
        const opts = filtered.map((r: any) => ({
          label: r.descripcion || r.nombre || r.descripcioncorta || String(r.tipodocumentofiscalId || r.documentoId || r.id),
          value: r.tipodocumentofiscalId ?? r.documentoId ?? r.id,
        }));
        this.documentosOptions.set(opts);
      },
      error: () => this.documentosOptions.set([]),
    });
  }

  private loadMovimientos(proveedorId: number) {
    this.movimientosLoading.set(true);
    this.service.getMovimientosByProveedor(proveedorId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.movimientosData.set(res);
        this.movimientosLoading.set(false);
      },
      error: () => this.movimientosLoading.set(false),
    });
  }

  cancelarMovimiento() {
    this.movimientoModel.set({
      tipomov: 'D',
      descripcion1: '',
      importe: 0,
      nroreferencia: '',
      fecharegistro: new Date().toISOString(),
    });
    this.movimientoFecha = new Date();
    this.documentoSelected.set(null);
  }

  guardarMovimiento() {
    const proveedor = this.selectedProveedor();
    if (!proveedor) {
      this.msgs.add({ severity: 'warn', summary: 'Seleccione', detail: 'Seleccione un proveedor antes de crear un movimiento' });
      return;
    }

    const raw = { ...this.movimientoModel() };
    const payload: any = {
      ...raw,
      proveedorId: proveedor.proveedorId,
      codproveedor: proveedor.nroproveedor,
      importe: Number(raw.importe) || 0,
      tipomov: raw.tipomov || 'D',
      fecharegistro: this.movimientoFecha ? this.movimientoFecha.toISOString() : new Date().toISOString(),
    };

    if (!payload.descripcion1 || !payload.proveedorId) {
      this.msgs.add({ severity: 'warn', summary: 'Datos incompletos', detail: 'Complete concepto y proveedor' });
      return;
    }

    if (typeof payload.importe !== 'number' || payload.importe <= 0) {
      this.msgs.add({ severity: 'warn', summary: 'Importe inválido', detail: 'El importe debe ser mayor que 0' });
      return;
    }

    if (payload.tipomov === 'D') {
      if (!payload.nroreferencia || payload.nroreferencia.trim() === '') {
        this.msgs.add({ severity: 'warn', summary: 'Referencia requerida', detail: 'Ingrese el número de factura o préstamo de referencia' });
        return;
      }
      const refStr = String(payload.nroreferencia).trim();
      if (this.debitoReferencias.includes(refStr)) {
        this.msgs.add({ severity: 'warn', summary: 'Referencia duplicada', detail: `Ya existe un débito con referencia "${refStr}". No se pueden crear débitos duplicados.` });
        return;
      }
    }

    if (payload.tipomov === 'C') {
      if (!payload.nroreferencia || payload.nroreferencia.trim() === '') {
        this.msgs.add({ severity: 'warn', summary: 'Referencia requerida', detail: 'Seleccione el documento de débito al que aplica el abono' });
        return;
      }
      if (!this.debitoReferencias.includes(String(payload.nroreferencia))) {
        this.msgs.add({ severity: 'warn', summary: 'Referencia inválida', detail: `La referencia "${payload.nroreferencia}" no corresponde a ningún débito existente` });
        return;
      }
    }

    const user = this.auth.currentUser();
    if (user) {
      payload.empresaId = payload.empresaId ?? user.empresaId;
      if (user.idsucursal != null) payload.Idsucursal = payload.Idsucursal ?? user.idsucursal;
      payload.usuarioCreated = payload.usuarioCreated ?? user.usuario ?? user.nombre;
    }

    payload.moduloId = payload.moduloId ?? 5;
    payload.documentoId = payload.documentoId ?? 3;
    payload.sn_doc_anulado = 'N';
    payload.sn_contabilizado = 'N';
    payload.sn_chq = 'N';
    payload.sn_chq_anulado = 'N';
    payload.sn_conciliado = 'N';
    payload.factordecambio = payload.factordecambio || 1;

    if (this.documentoSelected()) {
      payload.tipodocumentofiscalId = payload.tipodocumentofiscalId ?? this.documentoSelected();
      payload.documentoId = payload.documentoId ?? this.documentoSelected();
    }

    this.movimientoSaving.set(true);
    this.service.createMovimiento(payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.movimientosData.set([...this.movimientosData(), res]);
        this.movimientoSaving.set(false);
        this.cancelarMovimiento();
        this.msgs.add({ severity: 'success', summary: 'Guardado', detail: 'Movimiento registrado correctamente' });
      },
      error: (err) => {
        let detail = 'No se pudo guardar el movimiento';
        if (err?.error?.message) detail = err.error.message;
        else if (err?.message) detail = err.message;
        this.movimientoSaving.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail });
      },
    });
  }

  getTipoMovLabel(tipo: string): string {
    const tipos: Record<string, string> = { 'C': 'Crédito', 'A': 'Abono', 'D': 'Débito' };
    return tipos[tipo] || tipo;
  }

  getTipoMovSeverity(tipo: string): 'success' | 'danger' | 'warning' | 'info' {
    if (tipo === 'A') return 'success';
    if (tipo === 'C') return 'info';
    return 'danger';
  }
}
