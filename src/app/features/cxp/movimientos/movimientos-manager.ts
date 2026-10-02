import { Component, inject, signal, OnInit, computed, ChangeDetectionStrategy, DestroyRef, effect, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  /** Partida contable de origen (viaja en la URL al abrir desde copdamae) */
  partidaId = signal<number | null>(null);

  // ===== PROVEEDORES =====
  data = signal<Proveedor[]>([]);
  cargando = signal(false);
  selectedProveedor = signal<Proveedor | null>(null);
  q = signal('');
  page = signal(1);
  limit = signal(15);
  totalProveedores = signal(0);

  // Effect para resetear pagina y recargar cuando cambie el filtro (q)
  private _qAnterior = '';
  private _searchEffect = effect(() => {
    const q = this.q();
    if (q !== this._qAnterior) {
      this._qAnterior = q;
      this.page.set(1);
      untracked(() => this.loadProveedores());
    }
  });

  // ===== MOVIMIENTOS =====
  movimientosData = signal<any[]>([]);
  movimientosLoading = signal(false);
  movimientoSaving = signal(false);
  movimientoModel = signal<any>({
    proveedorId: null,
    tipomov: 'D',
    concepto: '',
    importe: 0,
    nroreferencia: '',
    fecharegistro: new Date().toISOString(),
    carteracontableId: null,
  });

  movimientoFecha = computed(() => {
    const f = this.movimientoModel().fecharegistro;
    if (!f) return null;
    const d = new Date(f);
    return isNaN(d.getTime()) ? null : d;
  });

  documentosOptions = signal<{ label: string; value: any }[]>([]);
  documentoSelected = signal<any>(null);

  // Carteras contables
  carterasOptions = signal<{ label: string; value: any }[]>([]);

  readonly tipoMovOptions = [
    { label: 'Debito', value: 'D' },
    { label: 'Credito', value: 'C' },
  ];

  vieneDeHistorico = false;

  // Referencias de debitos existentes con saldo
  debitoReferencias = computed(() => {
    const movs = this.movimientosData();
    const mapa = new Map<string, { nroreferencia: string; saldo: number }>();

    for (const m of movs) {
      if (m.tipomov !== 'D' || !m.nroreferencia) continue;
      const ref = String(m.nroreferencia);
      const existente = mapa.get(ref);
      if (existente) {
        existente.saldo += Number(m.importe) || 0;
      } else {
        mapa.set(ref, { nroreferencia: ref, saldo: Number(m.importe) || 0 });
      }
    }

    for (const m of movs) {
      if (m.tipomov !== 'C' || !m.nroreferencia) continue;
      const ref = String(m.nroreferencia);
      const existente = mapa.get(ref);
      if (existente) {
        existente.saldo -= Number(m.importe) || 0;
      }
    }

    return Array.from(mapa.values()).filter(d => d.saldo > 0);
  });

  ngOnInit() {
    this.loadDocumentos();
    this.loadCarteras();

    // Partida contable de origen (botón "Volver a la partida")
    const partidaParam = Number(this.route.snapshot.queryParamMap.get('partidaId'));
    if (!isNaN(partidaParam) && partidaParam > 0) this.partidaId.set(partidaParam);

    // Trazabilidad contable: ?movimientoId=<cxpmovId> (llega desde partida en copdamae)
    const movIdParam = this.route.snapshot.queryParamMap.get('movimientoId');
    if (movIdParam) {
      const movId = Number(movIdParam);
      if (!isNaN(movId) && movId > 0) {
        this.service.getMovimiento(movId).pipe(
          takeUntilDestroyed(this.destroyRef),
          timeout(10000),
          catchError(() => {
            this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el movimiento de origen' });
            this.loadProveedores();
            return of(null);
          }),
        ).subscribe({
          next: (mov) => {
            const proveedorId = mov ? Number(mov['proveedorId']) : 0;
            if (proveedorId > 0) {
              this.vieneDeHistorico = true;
              this.autoSelectProveedor(proveedorId, mov);
            } else {
              this.loadProveedores();
            }
          },
        });
        return;
      }
    }

    // Leer proveedorId de query params y movimiento completo de router state
    const proveedorIdParam = this.route.snapshot.queryParamMap.get('proveedorId');
    const movimientoState = (history.state as any)?.movimiento ?? null;

    if (proveedorIdParam) {
      const id = Number(proveedorIdParam);
      if (!isNaN(id) && id > 0) {
        // Viene de historico: auto-cargar SOLO este proveedor
        this.vieneDeHistorico = true;
        this.autoSelectProveedor(id, movimientoState);
        return;
      }
    }

    // Carga normal: cargar lista completa de proveedores
    this.loadProveedores();
  }

  /** Regresa a la partida contable de origen desde la que se abrió este movimiento. */
  volverAPartida(): void {
    if (!this.partidaId()) return;
    this.router.navigate(['/contabilidad/copdamae'], {
      queryParams: { partidaId: this.partidaId() },
    });
  }

  // ===== PROVEEDORES =====
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
    this.selectedProveedor.set(null);
    this.movimientosData.set([]);
  }

  seleccionarProveedor(proveedor: Proveedor) {
    this.selectedProveedor.set(proveedor);
    this.loadMovimientos(proveedor.proveedorId);
  }

  /**
   * Carga un proveedor directamente por ID y lo selecciona.
   * Si viene de historico (vieneDeHistorico=true), solo pone este proveedor en data()
   * sin cargar la lista completa. Si no, agrega el proveedor a la lista existente.
   */
  private autoSelectProveedor(proveedorId: number, movimiento?: any) {
    this.cargando.set(true);
    this.service.getProveedor(proveedorId).pipe(
      takeUntilDestroyed(this.destroyRef),
      timeout(10000),
      catchError(() => {
        this.cargando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el proveedor' });
        return of(null);
      })
    ).subscribe({
      next: (proveedor) => {
        this.cargando.set(false);
        if (proveedor) {
          if (this.vieneDeHistorico) {
            // Solo este proveedor en la lista (columna derecha)
            this.data.set([proveedor]);
            this.totalProveedores.set(1);
          } else {
            // Agregar el proveedor a la lista si no esta
            const lista = this.data();
            const existe = lista.find(p => p.proveedorId === proveedor.proveedorId);
            if (!existe) {
              this.data.set([proveedor, ...lista]);
            }
          }
          this.seleccionarProveedor(proveedor);

          // Prellenar formulario de movimiento si viene desde historico
          if (movimiento) {
            this.precargarMovimiento(movimiento);
          }
        }
      },
    });
  }

  /**
   * Precarga "Datos del Movimiento" con el registro seleccionado
   * en historico-manager (carga automatica, sin volver a seleccionar proveedor).
   */
  private precargarMovimiento(movimiento: any) {
    this.movimientoModel.set({
      proveedorId: movimiento.proveedorId,
      tipomov: movimiento.tipomov || 'D',
      concepto: movimiento.concepto || '',
      importe: Number(movimiento.importe) || 0,
      nroreferencia: movimiento.nroreferencia || '',
      fecharegistro: movimiento.fecharegistro || new Date().toISOString(),
    });
    this.documentoSelected.set(movimiento.documentoId ?? null);
  }

  getProveedorNombre(p: Proveedor): string {
    const nombres = p.nombres || '';
    const apellidos = p.apellidos || '';
    const full = `${nombres} ${apellidos}`.trim();
    return full || p.razonsocial || p.nroproveedor || 'Sin nombre';
  }

  moneda(val: number): string {
    if (val == null || isNaN(val)) return '0.00';
    const partes = val.toFixed(2).split('.');
    partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return partes.join('.');
  }

  // ===== DOCUMENTOS FISCALES =====
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

  // ===== CARTERAS CONTABLES =====
  loadCarteras() {
    const user = this.auth.currentUser();
    this.catalogService.getAll<any>('/contabilidad/carteras').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        const filtered = (res || []).filter((r: any) => {
          const activo = r.sn_activo === 'S' || r.activo === true || r.sn_activo === true;
          const mismaEmpresa = user?.empresaId ? Number(r.empresaId) === Number(user.empresaId) : true;
          return activo && mismaEmpresa;
        });
        const opts = filtered.map((r: any) => ({
          label: r.descripcion || String(r.tcocarteraId || r.id),
          value: r.tcocarteraId ?? r.id,
        }));
        this.carterasOptions.set(opts);
      },
      error: () => this.carterasOptions.set([]),
    });
  }

  // ===== MOVIMIENTOS =====
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

  onMovimientoFechaChange(d: Date | null) {
    this.movimientoModel.set({ ...this.movimientoModel(), fecharegistro: d ? d.toISOString() : null });
  }

  cancelarMovimiento() {
    this.movimientoModel.set({
      proveedorId: this.selectedProveedor()?.proveedorId ?? null,
      tipomov: 'D',
      concepto: '',
      importe: 0,
      nroreferencia: '',
      fecharegistro: new Date().toISOString(),
      carteracontableId: null,
    });
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
      fecharegistro: this.movimientoFecha() ? this.movimientoFecha()!.toISOString() : new Date().toISOString(),
    };

    if (!payload.concepto || !payload.proveedorId) {
      this.msgs.add({ severity: 'warn', summary: 'Datos incompletos', detail: 'Complete concepto y proveedor' });
      return;
    }

    if (typeof payload.importe !== 'number' || payload.importe <= 0) {
      this.msgs.add({ severity: 'warn', summary: 'Importe invalido', detail: 'El importe debe ser mayor que 0' });
      return;
    }

    // Validar debito: referencia obligatoria
    if (payload.tipomov === 'D') {
      if (!payload.nroreferencia || payload.nroreferencia.trim() === '') {
        this.msgs.add({ severity: 'warn', summary: 'Referencia requerida', detail: 'Ingrese el numero de factura o prestamo de referencia' });
        return;
      }
    }

    // Validar credito: referencia obligatoria, debe existir como debito
    if (payload.tipomov === 'C') {
      if (!payload.nroreferencia || payload.nroreferencia.trim() === '') {
        this.msgs.add({ severity: 'warn', summary: 'Referencia requerida', detail: 'Seleccione el documento de debito al que aplica el abono' });
        return;
      }
      if (!this.debitoReferencias().map(r => r.nroreferencia).includes(String(payload.nroreferencia))) {
        this.msgs.add({ severity: 'warn', summary: 'Referencia invalida', detail: `La referencia "${payload.nroreferencia}" no corresponde a ningun debito existente` });
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
    const tipos: Record<string, string> = { 'C': 'Credito', 'A': 'Abono', 'D': 'Debito' };
    return tipos[tipo] || tipo;
  }

  getTipoMovSeverity(tipo: string): 'success' | 'danger' | 'warning' | 'info' {
    if (tipo === 'A') return 'success';
    if (tipo === 'C') return 'info';
    return 'danger';
  }

  onRefSelect(nroReferencia: string) {
    this.movimientoModel.set({
      ...this.movimientoModel(),
      nroreferencia: nroReferencia,
      importe: 0,
    });
  }
}
