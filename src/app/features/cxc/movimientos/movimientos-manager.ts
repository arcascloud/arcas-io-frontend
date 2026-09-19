import { Component, inject, signal, OnInit, computed, ChangeDetectionStrategy, DestroyRef, effect, untracked } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { CxcService } from '../../../core/services/cxc.service';
import { AuthService } from '../../../core/services/auth.service';
import { CatalogoParametrosService } from '../../../core/services/catalogo-parametros.service';
import { CxcCliente } from '../../../core/models/cxc.models';

@Component({
  selector: 'app-movimientos-manager',
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
    IconFieldModule,
    InputIconModule,
  ],
  templateUrl: './movimientos-manager.html',
  styleUrl: './movimientos-manager.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MovimientosManager implements OnInit {
  private service = inject(CxcService);
  private msgs = inject(MessageService);
  private auth = inject(AuthService);
  private destroyRef = inject(DestroyRef);
  private catalogService = inject(CatalogoParametrosService);
  private route = inject(ActivatedRoute);

  // ===== CLIENTES =====
  data = signal<CxcCliente[]>([]);
  cargando = signal(false);
  selectedCliente = signal<CxcCliente | null>(null);
  q = signal('');
  page = signal(1);
  limit = signal(15);
  totalClientes = signal(0);

  /** Flag para saber si la ruta viene de historico (con cliente preseleccionado) */
  private vieneDeHistorico = false;

  // Effect: recargar SOLO cuando el usuario cambia el filtro de búsqueda (q)
  // NO se dispara en la carga inicial (controlado por ngOnInit)
  private _qAnterior = '';
  private _searchEffect = effect(() => {
    const q = this.q();
    if (q !== this._qAnterior) {
      this._qAnterior = q;
      this.page.set(1);
      untracked(() => this.loadClientes());
    }
  });

  // ===== MOVIMIENTOS =====
  movimientosData = signal<any[]>([]);
  movimientosLoading = signal(false);
  movimientoSaving = signal(false);
  movimientoModel = signal<any>({
    clienteId: null,
    tipomov: 'D',
    concepto: '',
    importe: 0,
    nroreferencia: '',
    fecharegistro: new Date().toISOString(),
  });

  movimientoFecha = computed(() => {
    const f = this.movimientoModel().fecharegistro;
    if (!f) return null;
    const d = new Date(f);
    return isNaN(d.getTime()) ? null : d;
  });

  // Documentos fiscales
  documentosOptions = signal<{ label: string; value: any }[]>([]);
  documentoSelected = signal<any>(null);

  readonly tipoMovOptions = [
    { label: 'Debito', value: 'D' },
    { label: 'Credito', value: 'C' },
  ];

  // Referencias de debitos existentes con saldo (para credito)
  debitoReferencias = computed(() => {
    const movs = this.movimientosData();
    const mapa = new Map<string, { nroreferencia: string; saldo: number }>();

    // 1ra pasada: acumular debitos
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

    // 2da pasada: restar creditos
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

  // Documentos pendientes de pago del cliente (para débito) - ELIMINADO: se usa debitoReferencias para ambos

  ngOnInit() {
    this.loadDocumentos();

    // Leer clienteId de query params y movimiento completo de router state
    const clienteIdParam = this.route.snapshot.queryParamMap.get('clienteId');
    const movimientoState = (history.state as any)?.movimiento ?? null;

    if (clienteIdParam) {
      const id = Number(clienteIdParam);
      if (!isNaN(id) && id > 0) {
        // Viene de historico: auto-cargar SOLO este cliente
        this.vieneDeHistorico = true;
        this.autoSelectCliente(id, movimientoState);
        return;
      }
    }

    // Carga normal: cargar lista completa de clientes
    this.loadClientes();
  }

  /**
   * Carga un cliente directamente por ID y lo selecciona.
   * Si viene de historico (vieneDeHistorico=true), solo pone este cliente en data()
   * sin cargar la lista completa. Si no, agrega el cliente a la lista existente.
   */
  private autoSelectCliente(clienteId: number, movimiento?: any) {
    this.cargando.set(true);
    this.service.getCliente(clienteId).pipe(
      takeUntilDestroyed(this.destroyRef),
      timeout(10000),
      catchError(() => {
        this.cargando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el cliente' });
        return of(null);
      })
    ).subscribe({
      next: (cliente) => {
        this.cargando.set(false);
        if (cliente) {
          if (this.vieneDeHistorico) {
            // Solo este cliente en la lista (columna derecha)
            this.data.set([cliente]);
            this.totalClientes.set(1);
          } else {
            // Agregar el cliente a la lista si no está
            const lista = this.data();
            const existe = lista.find(c => c.clienteId === cliente.clienteId);
            if (!existe) {
              this.data.set([cliente, ...lista]);
            }
          }
          this.seleccionarCliente(cliente);

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
   * en historico-manager (carga automatica, sin volver a seleccionar cliente).
   */
  private precargarMovimiento(movimiento: any) {
    this.movimientoModel.set({
      clienteId: movimiento.clienteId,
      tipomov: movimiento.tipomov || 'D',
      concepto: movimiento.concepto || '',
      importe: Number(movimiento.importe) || 0,
      nroreferencia: movimiento.nroreferencia || '',
      fecharegistro: movimiento.fecharegistro || new Date().toISOString(),
    });
    this.documentoSelected.set(movimiento.documentoId ?? null);
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
    this.selectedCliente.set(null);
    this.movimientosData.set([]);
  }

  seleccionarCliente(cliente: CxcCliente) {
    this.selectedCliente.set(cliente);
    this.loadMovimientos(cliente.clienteId);
  }

  getClienteNombre(c: CxcCliente): string {
    const nombres = c.nombres || '';
    const apellidos = c.apellidos || '';
    const full = `${nombres} ${apellidos}`.trim();
    return full || c.razonsocial || c.nrocliente || 'Sin nombre';
  }

  moneda(val: any): string {
    const num = Number(val) || 0;
    if (isNaN(num)) return '0.00';
    const partes = num.toFixed(2).split('.');
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

  // ===== MOVIMIENTOS =====
  private loadMovimientos(clienteId: number) {
    this.movimientosLoading.set(true);
    this.service.getMovimientosByCliente(clienteId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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

  onRefSelect(nroReferencia: string) {
    this.movimientoModel.set({
      ...this.movimientoModel(),
      nroreferencia: nroReferencia,
      importe: 0,
    });
  }

  cancelarMovimiento() {
    this.movimientoModel.set({
      clienteId: this.selectedCliente()?.clienteId ?? null,
      tipomov: 'D',
      concepto: '',
      importe: 0,
      nroreferencia: '',
      fecharegistro: new Date().toISOString(),
    });
    this.documentoSelected.set(null);
    this.selectedCliente.set(null);
    this.movimientosData.set([]);
  }

  guardarMovimiento() {
    const cliente = this.selectedCliente();
    if (!cliente) {
      this.msgs.add({ severity: 'warn', summary: 'Seleccione', detail: 'Seleccione un cliente antes de crear un movimiento' });
      return;
    }

    const raw = { ...this.movimientoModel() };
    const payload: any = {
      ...raw,
      clienteId: cliente.clienteId,
      importe: Number(raw.importe) || 0,
      tipomov: raw.tipomov || 'D',
    };

    try {
      if (payload.fecharegistro) {
        const d = new Date(payload.fecharegistro);
        if (!isNaN(d.getTime())) payload.fecharegistro = d.toISOString();
      }
    } catch (e) { }

    if (!payload.concepto || !payload.clienteId) {
      this.msgs.add({ severity: 'warn', summary: 'Datos incompletos', detail: 'Complete concepto y cliente' });
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
      const refsDisponibles = this.debitoReferencias().map(r => r.nroreferencia);
      if (!refsDisponibles.includes(String(payload.nroreferencia))) {
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

    payload.nrocliente = payload.nrocliente ?? cliente.nrocliente;
    payload.moduloId = payload.moduloId ?? 4;
    payload.documentoId = payload.documentoId ?? 3;
    payload.sn_doc_anulado = 'N';
    payload.sn_cotabilizada = 'N';
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
        console.error('[MovimientosManager] Error guardando movimiento', err);
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
}
