import { Component, inject, signal, OnInit, computed, ChangeDetectionStrategy, DestroyRef, effect, untracked } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
import { MessageService, ConfirmationService } from 'primeng/api';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { PaginatorModule } from 'primeng/paginator';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TableModule } from 'primeng/table';
import { CxcService } from '../../../core/services/cxc.service';
import { AuthService } from '../../../core/services/auth.service';
import { NavegacionService } from '../../../core/services/navegacion.service';
import { CatalogoParametrosService } from '../../../core/services/catalogo-parametros.service';
import { CxcCliente, CxcMovimiento } from '../../../core/models/cxc.models';

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
    TableModule,
  ],
  templateUrl: './movimientos-manager.html',
  styleUrl: './movimientos-manager.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MovimientosManager implements OnInit {
  private service = inject(CxcService);
  private msgs = inject(MessageService);
  private confirm = inject(ConfirmationService);
  private auth = inject(AuthService);
  private destroyRef = inject(DestroyRef);
  private catalogService = inject(CatalogoParametrosService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private nav = inject(NavegacionService);

  partidaId = signal<number | null>(null);
  readonly desdeHistorico = signal(false);

  data = signal<CxcCliente[]>([]);
  cargando = signal(false);
  selectedCliente = signal<CxcCliente | null>(null);
  q = signal('');
  page = signal(1);
  limit = signal(15);
  totalClientes = signal(0);

  private vieneDeHistorico = false;
  private _qAnterior = '';
  private _searchEffect = effect(() => {
    const q = this.q();
    if (q !== this._qAnterior) {
      this._qAnterior = q;
      this.page.set(1);
      untracked(() => this.loadClientes());
    }
  });

  movimientosData = signal<CxcMovimiento[]>([]);
  movimientosLoading = signal(false);
  movimientoSaving = signal(false);
  movimientoModel = signal<any>({
    clienteId: null,
    tipomov: 'D',
    sn_doc_manual: 'S',
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
  carterasOptions = signal<{ label: string; value: any }[]>([]);

  readonly tipoMovOptions = [
    { label: 'Debito', value: 'D' },
    { label: 'Credito', value: 'C' },
  ];

  readonly snDocManualOptions = [
    { label: 'Si - Documento manual', value: 'S' },
    { label: 'No - Generado por el sistema', value: 'N' },
  ];

  debitoReferencias = computed(() => {
    const movs = this.movimientosData();
    const mapa = new Map<string, { nroreferencia: string; saldo: number; documentoId: number | null }>();
    const docsPermitidos = new Set(this.documentosOptions().map(o => Number(o.value)));

    for (const m of movs) {
      if (m.sn_doc_anulado === 'S') continue;
      if (m.tipomov !== 'D' || !m.nroreferencia) continue;
      if (m.documentoId != null && !docsPermitidos.has(Number(m.documentoId))) continue;
      const ref = String(m.nroreferencia);
      const existente = mapa.get(ref);
      if (existente) {
        existente.saldo += Number(m.importe) || 0;
      } else {
        mapa.set(ref, {
          nroreferencia: ref,
          saldo: Number(m.importe) || 0,
          documentoId: m.documentoId != null ? Number(m.documentoId) : null,
        });
      }
    }

    for (const m of movs) {
      if (m.sn_doc_anulado === 'S') continue;
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

    const partidaParam = Number(this.route.snapshot.queryParamMap.get('partidaId'));
    if (!isNaN(partidaParam) && partidaParam > 0) this.partidaId.set(partidaParam);

    const movIdParam = this.route.snapshot.queryParamMap.get('movimientoId');
    if (movIdParam) {
      const movId = Number(movIdParam);
      if (!isNaN(movId) && movId > 0) {
        this.service.getMovimiento(movId).pipe(
          takeUntilDestroyed(this.destroyRef),
          timeout(10000),
          catchError(() => {
            this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el movimiento de origen' });
            this.loadClientes();
            return of(null);
          }),
        ).subscribe({
          next: (mov) => {
            const clienteId = mov ? Number(mov['clienteId']) : 0;
            if (clienteId > 0) {
              this.vieneDeHistorico = true;
              this.autoSelectCliente(clienteId, mov);
            } else {
              this.loadClientes();
            }
          },
        });
        return;
      }
    }

    const clienteIdParam = this.route.snapshot.queryParamMap.get('clienteId');
    const movimientoState = (history.state as any)?.movimiento ?? null;

    if (clienteIdParam) {
      const id = Number(clienteIdParam);
      if (!isNaN(id) && id > 0) {
        this.vieneDeHistorico = true;
        this.desdeHistorico.set(true);
        this.autoSelectCliente(id, movimientoState);
        return;
      }
    }

    this.loadClientes();
  }

  volverAPartida(): void {
    if (!this.partidaId()) return;
    this.router.navigate(['/contabilidad/copdamae'], {
      queryParams: { partidaId: this.partidaId() },
    });
  }

  volverAHistorico(): void {
    this.nav.volver(['/prestamos/historico']);
  }

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
            this.data.set([cliente]);
            this.totalClientes.set(1);
          } else {
            const lista = this.data();
            const existe = lista.find(c => c.clienteId === cliente.clienteId);
            if (!existe) {
              this.data.set([cliente, ...lista]);
            }
          }
          this.seleccionarCliente(cliente);
          if (movimiento) {
            this.precargarMovimiento(movimiento);
          }
        }
      },
    });
  }

  private precargarMovimiento(movimiento: any) {
    this.movimientoModel.set({
      clienteId: movimiento.clienteId,
      tipomov: movimiento.tipomov || 'D',
      sn_doc_manual: movimiento.sn_doc_manual === 'N' ? 'N' : 'S',
      concepto: movimiento.concepto || '',
      importe: Number(movimiento.importe) || 0,
      nroreferencia: movimiento.nroreferencia || '',
      fecharegistro: movimiento.fecharegistro || new Date().toISOString(),
    });
    this.documentoSelected.set(movimiento.documentoId ?? null);
  }

  loadClientes() {
    this.cargando.set(true);
    this.service.getClientes(this.page(), this.limit(), this.q(), 10).pipe(
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

  private readonly DOCS_APLICABLES_ND_NC = ['FAC', 'PPR', 'TCK', 'RHP', 'BDC', 'CDD', 'OCA'];

  loadDocumentos() {
    const user = this.auth.currentUser();
    this.catalogService.getAll<any>('/parametros/tcotipodocumentofiscal').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        const filtered = (res || []).filter((r: any) => {
          const activo = r.sn_activo === 'S' || r.activo === true || r.sn_activo === true;
          const mismaEmpresa = user?.empresaId ? Number(r.empresaId) === Number(user.empresaId) : true;
          const aplicaNdNc = this.DOCS_APLICABLES_ND_NC.includes(String(r.abreviatura || '').toUpperCase());
          return activo && mismaEmpresa && aplicaNdNc;
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

  loadCarteras() {
    const user = this.auth.currentUser();
    this.catalogService.getAll<any>('/contabilidad/carteras').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        const filtered = (res || []).filter((r: any) => {
          const activo = r.sn_activo === 'S' || r.activo === true || r.sn_activo === true;
          const mismaEmpresa = user?.empresaId ? Number(r.empresaId) === Number(user.empresaId) : true;
          const mismoModulo = Number(r.moduloId) === 4;
          return activo && mismaEmpresa && mismoModulo;
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

  private loadMovimientos(clienteId: number) {
    this.movimientosLoading.set(true);
    this.service.getMovimientosByCliente(clienteId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        const vigentes = (res || []).filter((m) => m?.sn_doc_anulado !== 'S');
        this.movimientosData.set(vigentes);
        this.movimientosLoading.set(false);
      },
      error: () => this.movimientosLoading.set(false),
    });
  }

  onMovimientoFechaChange(d: Date | null) {
    this.movimientoModel.set({ ...this.movimientoModel(), fecharegistro: d ? d.toISOString() : null });
  }

  onModoManualChange(valor: string) {
    this.movimientoModel.set({
      ...this.movimientoModel(),
      sn_doc_manual: valor === 'N' ? 'N' : 'S',
      nroreferencia: '',
    });
  }

  esManual(): boolean {
    return this.movimientoModel().sn_doc_manual !== 'N';
  }

  onRefSelect(nroReferencia: string) {
    const refSel = this.debitoReferencias().find(r => r.nroreferencia === nroReferencia);
    this.movimientoModel.set({
      ...this.movimientoModel(),
      nroreferencia: nroReferencia,
      importe: 0,
    });
    if (refSel?.documentoId != null) {
      this.documentoSelected.set(refSel.documentoId);
    }
  }

  cancelarMovimiento() {
    this.movimientoModel.set({
      clienteId: this.selectedCliente()?.clienteId ?? null,
      tipomov: 'D',
      sn_doc_manual: 'S',
      concepto: '',
      importe: 0,
      nroreferencia: '',
      fecharegistro: new Date().toISOString(),
      carteracontableId: null,
    });
    this.documentoSelected.set(null);
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

    if (!this.documentoSelected()) {
      this.msgs.add({
        severity: 'warn',
        summary: 'Documento Fiscal requerido',
        detail: 'Seleccione el tipo de documento fiscal de la referencia',
      });
      return;
    }

    if (typeof payload.importe !== 'number' || payload.importe <= 0) {
      this.msgs.add({ severity: 'warn', summary: 'Importe invalido', detail: 'El importe debe ser mayor que 0' });
      return;
    }

    const esManual = raw.sn_doc_manual !== 'N';
    const ref = String(payload.nroreferencia ?? '').trim();

    if (!ref) {
      this.msgs.add({
        severity: 'warn',
        summary: 'Referencia requerida',
        detail: esManual ? 'Ingrese el numero de documento' : 'Seleccione el documento de referencia',
      });
      return;
    }
    payload.nroreferencia = ref;

    if (!esManual && payload.tipomov === 'C') {
      const refSel = this.debitoReferencias().find(r => r.nroreferencia === ref);
      if (!refSel) {
        this.msgs.add({ severity: 'warn', summary: 'Referencia invalida', detail: `La referencia "${ref}" no corresponde a ningun debito existente` });
        return;
      }
      if (payload.importe > refSel.saldo) {
        this.msgs.add({
          severity: 'warn',
          summary: 'Excede el saldo',
          detail: `El importe (${this.moneda(payload.importe)}) supera el saldo pendiente de ${refSel.nroreferencia} (${this.moneda(refSel.saldo)})`,
        });
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
    payload.sn_doc_anulado = 'N';
    payload.sn_cotilizada = 'N';
    payload.sn_doc_manual = raw.sn_doc_manual === 'N' ? 'N' : 'S';
    payload.factordecambio = payload.factordecambio || 1;
    payload.documentoId = this.documentoSelected();
    if (payload.tipodocumentofiscalId == null) {
      payload.tipodocumentofiscalId = this.documentoSelected();
    }

    this.movimientoSaving.set(true);
    this.service.createMovimiento(payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.movimientoSaving.set(false);
        this.cancelarMovimiento();
        this.loadMovimientos(cliente.clienteId);
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
    const tipos: Record<string, string> = { 'C': 'Credito', 'A': 'Abono', 'D': 'Debito', 'I': 'Interés/Mora' };
    return tipos[tipo] || tipo;
  }

  getTipoMovSeverity(tipo: string): 'success' | 'danger' | 'warning' | 'info' {
    if (tipo === 'A') return 'success';
    if (tipo === 'C') return 'info';
    if (tipo === 'I') return 'warning';
    return 'danger';
  }

  fechaCorta(valor: string | null | undefined): string {
    if (!valor) return '—';
    const d = new Date(valor);
    if (isNaN(d.getTime())) return '—';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
  }

  getOrigenLabel(m: CxcMovimiento): string {
    return m.sn_doc_manual === 'S' ? 'Manual' : 'Automatico';
  }

  getOrigenSeverity(m: CxcMovimiento): 'success' | 'secondary' {
    return m.sn_doc_manual === 'S' ? 'success' : 'secondary';
  }

  totalDebitos(): number {
    return this.movimientosData()
      .filter(m => m.tipomov === 'D' && m.sn_doc_anulado !== 'S')
      .reduce((s, m) => s + (Number(m.importe) || 0), 0);
  }

  totalCreditos(): number {
    return this.movimientosData()
      .filter(m => (m.tipomov === 'C' || m.tipomov === 'I') && m.sn_doc_anulado !== 'S')
      .reduce((s, m) => s + (Number(m.importe) || 0), 0);
  }

  saldoCliente(): number {
    return this.totalDebitos() - this.totalCreditos();
  }

  bloqueoAnulacion(m: CxcMovimiento): string | null {
    if (m.sn_doc_anulado === 'S') return 'Movimiento ya anulado';
    if (m.sn_doc_manual !== 'S') return 'Movimiento automatico: se anula desde su documento origen';
    if (m.partidaId != null) return 'Movimiento con partida contable: requiere reversa de la partida';
    return null;
  }

  anularMovimiento(m: CxcMovimiento) {
    const motivo = this.bloqueoAnulacion(m);
    if (motivo) {
      this.msgs.add({ severity: 'warn', summary: 'No anulable', detail: motivo });
      return;
    }

    this.confirm.confirm({
      message: `¿Anular el movimiento #${m.nromovimiento} (${this.getTipoMovLabel(m.tipomov)}) por L ${this.moneda(m.importe)}?<br/>Referencia: ${m.nroreferencia || '—'}`,
      header: 'Confirmar anulacion',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Si, anular',
      rejectLabel: 'Cancelar',
      accept: () => this.ejecutarAnulacion(m),
    });
  }

  private ejecutarAnulacion(m: CxcMovimiento) {
    this.movimientosLoading.set(true);
    this.service.anularMovimiento(m.clienteMovId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.loadMovimientos(m.clienteId);
        this.msgs.add({ severity: 'success', summary: 'Movimiento anulado', detail: `Movimiento #${m.nromovimiento} anulado correctamente` });
      },
      error: (err) => {
        this.movimientosLoading.set(false);
        let detail = 'No se pudo anular el movimiento';
        if (err?.error?.message) detail = err.error.message;
        else if (err?.message) detail = err.message;
        this.msgs.add({ severity: 'error', summary: 'Error', detail });
      },
    });
  }
}
