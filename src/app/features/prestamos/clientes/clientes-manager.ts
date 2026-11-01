import { Component, inject, signal, OnInit, computed, ChangeDetectionStrategy, DestroyRef, effect, untracked, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { timeout, catchError, of } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DataViewModule } from 'primeng/dataview';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { TabsModule } from 'primeng/tabs';
import { AccordionModule } from 'primeng/accordion';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService, ConfirmationService } from 'primeng/api';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { DatePickerModule } from 'primeng/datepicker';
import { PaginatorModule } from 'primeng/paginator';
import { CxcService } from '../../../core/services/cxc.service';
import { ContabilidadService } from '../../../core/services/contabilidad.service';
import { AuthService } from '../../../core/services/auth.service';
import { CxcCliente, CxcClienteInfo, CxcCarteraCliente, TipoInfoCliente } from '../../../core/models/cxc.models';
import { ClienteForm } from './cliente-form';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

@Component({
  selector: 'app-clientes-manager',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    DataViewModule,
    TagModule,
    TooltipModule,
    TabsModule,
    AccordionModule,
    SkeletonModule,
    SelectModule,
    TableModule,
    DatePickerModule,
    PaginatorModule,
    IconFieldModule,
    InputIconModule, 
    ClienteForm,
  ],
  templateUrl: './clientes-manager.html',
  styleUrl: './clientes-manager.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientesManager implements OnInit {
  private service = inject(CxcService);
  private contabilidad = inject(ContabilidadService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private msgs = inject(MessageService);
  private confirm = inject(ConfirmationService);
  private auth = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  readonly referenciaTipoOptions = [
    { label: 'Personal', value: 'Personal' },
    { label: 'Comercial', value: 'Comercial' },
    { label: 'Bancaria', value: 'Bancaria' },
    { label: 'Familiar', value: 'Familiar' },
  ];

  readonly referenciaParentescoOptions = [
    { label: 'Padre/Madre', value: 'Padre/Madre' },
    { label: 'Hermano/a', value: 'Hermano/a' },
    { label: 'Cónyuge', value: 'Cónyuge' },
    { label: 'Amigo/a', value: 'Amigo/a' },
    { label: 'Otro', value: 'Otro' },
  ];

  readonly parienteParentescoOptions = [
    { label: 'Padre', value: 'Padre' },
    { label: 'Madre', value: 'Madre' },
    { label: 'Hermano', value: 'Hermano' },
    { label: 'Hermana', value: 'Hermana' },
    { label: 'Hijo/a', value: 'Hijo/a' },
    { label: 'Cónyuge', value: 'Cónyuge' },
    { label: 'Abuelo/a', value: 'Abuelo/a' },
    { label: 'Tío/a', value: 'Tío/a' },
    { label: 'Otro', value: 'Otro' },
  ];

  readonly infoTipoOptions = [
    { label: 'Celular', value: 'CELULAR' },
    { label: 'Dirección', value: 'DIRECCION' },
    { label: 'Correo', value: 'CORREO' },
  ];

  readonly infoEstadoOptions = [
    { label: 'Activo', value: 'S' },
    { label: 'Inactivo', value: 'N' },
  ];

  infoData = signal<CxcClienteInfo[]>([]);
  infoLoading = signal(false);
  infoSaving = signal(false);

  infoModel = signal<{
    id: number | null;
    tipo: TipoInfoCliente | '';
    descripcion: string;
    sn_activo: 'S' | 'N';
  }>({
    id: null,
    tipo: '',
    descripcion: '',
    sn_activo: 'S',
  });

  private readonly MODULO_CXC = 4;

  carterasCatalogo = signal<{ label: string; value: number; ctacontable?: string | null }[]>([]);
  cuentasContables = signal<Map<string, string>>(new Map());
  carterasCliente = signal<CxcCarteraCliente[]>([]);
  carteraSeleccionada = signal<number | null>(null);
  carteraLoading = signal(false);
  carteraSaving = signal(false);

  carterasDisponibles = computed(() => {
    const asignadas = new Set(this.carterasCliente().map((c) => c.carteractaId));
    return this.carterasCatalogo().filter((o) => !asignadas.has(o.value));
  });

  showForm = signal(false);
  editingCliente = signal<CxcCliente | null>(null);

  private _searchEffect = effect(() => {
    this.q();
    this.page.set(1);
    untracked(() => this.loadClientes());
  });

  data = signal<CxcCliente[]>([]);
  totalClientes = signal(0);
  page = signal(1);
  limit = signal(10);
  cargando = signal(false);

  q = signal('');

  referenciaSaving = signal(false);
  referenciaModel = signal<any>({
    clienteId: null,
    nombres: '',
    apellidos: '',
    telefono: '',
    celular: '',
    tipo: '',
    parentesco: '',
    direccion1: '',
    lugarTrabajo: '',
    fechanacimiento: null,
    dni: '',
  });

  referenciaFecha = computed(() => {
    const f = this.referenciaModel().fechanacimiento;
    if (!f) return null;
    const d = new Date(f);
    return isNaN(d.getTime()) ? null : d;
  });

  onReferenciaFechaChange(d: Date | null) {
    this.referenciaModel.set({ ...this.referenciaModel(), fechanacimiento: d ? d.toISOString() : null });
  }

  parienteSaving = signal(false);
  parienteModel = signal<any>({
    clienteId: null,
    dni: '',
    nombres: '',
    apellidos: '',
    parentesco: '',
    telefono: '',
  });

  selectedCliente = signal<CxcCliente | null>(null);
  nuevoCliente = signal(false);

  @ViewChild('clienteFormRef') clienteFormRef?: any;

  estadoCuentaData = signal<any[]>([]);
  estadoCuentaLoading = signal(false);

  referenciasData = signal<any[]>([]);
  referenciasLoading = signal(false);

  parientesData = signal<any[]>([]);
  parientesLoading = signal(false);

  activeTabValue = signal<string>('0');

  saldoPendiente = computed(() =>
    this.estadoCuentaData().reduce((sum, m) => {
      const importe = Number(m.importe || 0);
      if (m.tipomov === 'D') return sum + importe;
      if (m.tipomov === 'I') return sum;
      return sum - importe;
    }, 0)
  );

  ngOnInit() {
    this.cargarCatalogoCarteras();
    this.cargarCuentasContables();
  }

  private cargarCuentasContables() {
    this.contabilidad.getCuentas().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        const mapa = new Map<string, string>();
        for (const c of res ?? []) {
          if (c?.ctacontable) mapa.set(c.ctacontable, c.descripcion || '');
        }
        this.cuentasContables.set(mapa);
      },
      error: () => this.cuentasContables.set(new Map()),
    });
  }

  private cargarCatalogoCarteras() {
    this.contabilidad.getCarteras().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        const opts = (res ?? [])
          .filter((c) => c.moduloId === this.MODULO_CXC && c.sn_activo !== 'N')
          .map((c) => ({
            label: c.descripcion || `Cartera ${c.tcocarteraId}`,
            value: c.tcocarteraId,
            ctacontable: c.ctacontable ?? null,
          }));
        this.carterasCatalogo.set(opts);
      },
      error: () => this.carterasCatalogo.set([]),
    });
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

  cancelarReferencia() {
    this.referenciaModel.set({
      nombres: '',
      apellidos: '',
      telefono: '',
      celular: '',
      tipo: '',
      parentesco: '',
      direccion1: '',
      lugarTrabajo: '',
      fechanacimiento: null,
      dni: '',
    });
  }

  guardarReferencia() {
    const cliente = this.selectedCliente();
    if (!cliente) {
      this.msgs.add({ severity: 'warn', summary: 'Seleccione', detail: 'Seleccione un cliente antes de crear una referencia' });
      return;
    }

    const raw = { ...this.referenciaModel() };
    const payload: any = {
      clienteId: cliente.clienteId,
      nombres: raw.nombres,
      apellidos: raw.apellidos,
      dni: raw.dni,
      fechanacimiento: raw.fechanacimiento,
      telefono1: raw.telefono,
      telefono2: raw.celular,
      direccion1: raw.direccion1,
      lugarTrabajo: raw.lugarTrabajo,
    };

    if (!payload.nombres || !payload.telefono1) {
      this.msgs.add({ severity: 'warn', summary: 'Datos incompletos', detail: 'Complete nombre y telefono' });
      return;
    }

    const user = this.auth.currentUser();
    if (user) {
      payload.empresaId = payload.empresaId ?? user.empresaId;
      if (user.idsucursal != null) payload.Idsucursal = payload.Idsucursal ?? user.idsucursal;
      payload.usuarioCreated = payload.usuarioCreated ?? user.usuario ?? user.nombre;
    }

    this.referenciaSaving.set(true);
    this.service.createReferencia(payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.referenciasData.set([...(this.referenciasData() || []), res]);
        this.referenciaSaving.set(false);
        this.referenciaModel.set({ nombres: '', telefono: '', celular: '', tipo: '', parentesco: '' });
        this.msgs.add({ severity: 'success', summary: 'Guardado', detail: 'Referencia registrada correctamente' });
      },
      error: (err) => {
        let detail = 'No se pudo guardar la referencia';
        if (err?.error?.message) detail = err.error.message;
        else if (err?.message) detail = err.message;
        this.referenciaSaving.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail });
      },
    });
  }

  cancelarPariente() {
    this.parienteModel.set({ dni: '', nombres: '', apellidos: '', parentesco: '', telefono: '' });
  }

  guardarPariente() {
    const cliente = this.selectedCliente();
    if (!cliente) {
      this.msgs.add({ severity: 'warn', summary: 'Seleccione', detail: 'Seleccione un cliente antes de crear un pariente' });
      return;
    }

    const raw = { ...this.parienteModel() };
    const payload: any = { ...raw, clienteId: cliente.clienteId };

    if (!payload.nombres || !payload.apellidos || !payload.parentesco || !payload.telefono) {
      this.msgs.add({ severity: 'warn', summary: 'Datos incompletos', detail: 'Complete todos los campos' });
      return;
    }

    const user = this.auth.currentUser();
    if (user) {
      payload.empresaId = payload.empresaId ?? user.empresaId;
      if (user.idsucursal != null) payload.Idsucursal = payload.Idsucursal ?? user.idsucursal;
      payload.usuarioCreated = payload.usuarioCreated ?? user.usuario ?? user.nombre;
    }

    this.parienteSaving.set(true);
    this.service.createPariente(payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.parientesData.set([...(this.parientesData() || []), res]);
        this.parienteSaving.set(false);
        this.parienteModel.set({ dni: '', nombres: '', apellidos: '', parentesco: '', telefono: '' });
        this.msgs.add({ severity: 'success', summary: 'Guardado', detail: 'Pariente registrado correctamente' });
      },
      error: (err) => {
        let detail = 'No se pudo guardar el pariente';
        if (err?.error?.message) detail = err.error.message;
        else if (err?.message) detail = err.message;
        this.parienteSaving.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail });
      },
    });
  }

  private limpiarModelInfo() {
    this.infoModel.set({ id: null, tipo: '', descripcion: '', sn_activo: 'S' });
  }

  private cargarInfoCliente(clienteId: number) {
    this.limpiarModelInfo();
    this.infoLoading.set(true);
    this.service.getClienteInfoByCliente(clienteId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.infoData.set(res ?? []);
        this.infoLoading.set(false);
      },
      error: () => {
        this.infoData.set([]);
        this.infoLoading.set(false);
      },
    });
  }

  editarInfo(row: CxcClienteInfo) {
    this.infoModel.set({
      id: row.id,
      tipo: row.tipo,
      descripcion: row.descripcion ?? '',
      sn_activo: row.sn_activo === 'N' ? 'N' : 'S',
    });
  }

  cancelarInfo() {
    this.limpiarModelInfo();
  }

  guardarInfo() {
    const cliente = this.selectedCliente();
    if (!cliente) return;
    const raw = this.infoModel();
    if (!raw.tipo || !(raw.descripcion ?? '').trim()) return;

    const payload = { tipo: raw.tipo, descripcion: (raw.descripcion ?? '').trim(), sn_activo: raw.sn_activo };
    this.infoSaving.set(true);
    const op = raw.id != null
      ? this.service.updateClienteInfo(raw.id, payload)
      : this.service.createClienteInfo({ ...payload, clienteid: cliente.clienteId });

    op.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.infoSaving.set(false);
        this.limpiarModelInfo();
        this.msgs.add({ severity: 'success', summary: 'Guardado' });
        this.cargarInfoCliente(cliente.clienteId);
      },
      error: (err) => {
        this.infoSaving.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Error' });
      },
    });
  }

  eliminarInfo(row: CxcClienteInfo) {
    this.confirm.confirm({
      message: '¿Está seguro de desactivar este registro?',
      accept: () => {
        const cliente = this.selectedCliente();
        this.service.removeClienteInfo(row.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => {
            if (this.infoModel().id === row.id) this.limpiarModelInfo();
            if (cliente) this.cargarInfoCliente(cliente.clienteId);
          },
        });
      },
    });
  }

  infoTipoLabel(tipo: string): string {
    const mapa: Record<string, string> = { CELULAR: 'Celular', DIRECCION: 'Dirección', CORREO: 'Correo' };
    return mapa[tipo] || tipo;
  }

  private cargarCarterasCliente(clienteId: number) {
    this.carteraSeleccionada.set(null);
    this.carteraLoading.set(true);
    this.service.getCarterasCliente().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.carterasCliente.set((res ?? []).filter((c) => c.clienteId === clienteId));
        this.carteraLoading.set(false);
      },
      error: () => {
        this.carterasCliente.set([]);
        this.carteraLoading.set(false);
      },
    });
  }

  agregarCartera() {
    const cliente = this.selectedCliente();
    const carteractaId = this.carteraSeleccionada();
    if (!cliente || !carteractaId) return;

    this.carteraSaving.set(true);
    this.service.createCarteraCliente({ clienteId: cliente.clienteId, carteractaId }).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.carteraSaving.set(false);
        this.carteraSeleccionada.set(null);
        this.cargarCarterasCliente(cliente.clienteId);
      },
      error: () => this.carteraSaving.set(false),
    });
  }

  eliminarCartera(row: CxcCarteraCliente) {
    this.confirm.confirm({
      message: '¿Quitar cartera contable?',
      accept: () => {
        const cliente = this.selectedCliente();
        this.service.removeCarteraCliente(row.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => { if (cliente) this.cargarCarterasCliente(cliente.clienteId); },
        });
      },
    });
  }

  nombreCartera(carteractaId: number): string {
    return this.carterasCatalogo().find((o) => o.value === carteractaId)?.label || `Cartera ${carteractaId}`;
  }

  ctaCartera(carteractaId: number): string | null {
    return this.carterasCatalogo().find((o) => o.value === carteractaId)?.ctacontable ?? null;
  }

  descripcionCtaCartera(carteractaId: number): string | null {
    const cta = this.ctaCartera(carteractaId);
    return cta ? this.cuentasContables().get(cta) ?? null : null;
  }

  limpiarFiltros() {
    this.q.set('');
    this.selectedCliente.set(null);
    this.nuevoCliente.set(false);
    this.showForm.set(false);
    this.editingCliente.set(null);
    this.activeTabValue.set('0');
    this.estadoCuentaData.set([]);
    this.referenciasData.set([]);
    this.parientesData.set([]);
    this.infoData.set([]);
    this.limpiarModelInfo();
    this.carterasCliente.set([]);
    this.carteraSeleccionada.set(null);
  }

  nuevo() {
    this.selectedCliente.set(null);
    this.nuevoCliente.set(true);
    this.activeTabValue.set('0');
    this.estadoCuentaData.set([]);
    this.referenciasData.set([]);
    this.parientesData.set([]);
    this.infoData.set([]);
    this.limpiarModelInfo();
    this.carterasCliente.set([]);
    this.carteraSeleccionada.set(null);

    setTimeout(() => {
      this.clienteFormRef?.nativeElement?.focusPrimerCampo();
    }, 200);
  }

  onFormSaved() {
    this.nuevoCliente.set(false);
    this.showForm.set(false);
    this.editingCliente.set(null);
    this.loadClientes();
  }

  onFormCancelled() {
    this.nuevoCliente.set(false);
    this.showForm.set(false);
    this.editingCliente.set(null);
  }

  editarCliente(cliente: CxcCliente, event: Event) {
    event.stopPropagation();
    this.seleccionarCliente(cliente);
  }

  seleccionarCliente(cliente: CxcCliente) {
    this.nuevoCliente.set(false);
    this.selectedCliente.set(cliente);
    this.activeTabValue.set('0');
    this.estadoCuentaData.set([]);
    this.referenciasData.set([]);
    this.parientesData.set([]);
    this.cargarDatosCliente(cliente.clienteId);
  }

  private cargarDatosCliente(clienteId: number) {
    this.cargarInfoCliente(clienteId);
    this.cargarCarterasCliente(clienteId);

    this.estadoCuentaLoading.set(true);
    this.service.getMovimientosByCliente(clienteId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        const vigentes = (res || []).filter((m: any) => m?.sn_doc_anulado !== 'S');
        this.estadoCuentaData.set(vigentes);
        this.estadoCuentaLoading.set(false);
      },
      error: () => this.estadoCuentaLoading.set(false),
    });

    this.referenciasLoading.set(true);
    this.service.getReferenciasByCliente(clienteId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => { this.referenciasData.set(res); this.referenciasLoading.set(false); },
      error: () => this.referenciasLoading.set(false),
    });

    this.parientesLoading.set(true);
    this.service.getParientesByCliente(clienteId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => { this.parientesData.set(res); this.parientesLoading.set(false); },
      error: () => this.parientesLoading.set(false),
    });
  }

  onTabChange(index: string) {
    this.activeTabValue.set(index);
  }

  getClienteNombre(c: CxcCliente): string {
    const nombres = c.nombres || '';
    const apellidos = c.apellidos || '';
    const full = `${nombres} ${apellidos}`.trim();
    return full || c.razonsocial || c.nrocliente || 'Sin nombre';
  }

  getTipoMovLabel(tipo: string): string {
    const tipos: Record<string, string> = { 'C': 'Credito', 'A': 'Abono', 'D': 'Debito', 'I': 'Interes/Mora' };
    return tipos[tipo] || tipo;
  }

  getTipoMovSeverity(tipo: string): 'success' | 'danger' | 'warning' | 'info' {
    if (tipo === 'A') return 'success';
    if (tipo === 'C') return 'info';
    if (tipo === 'I') return 'warning';
    return 'danger';
  }

  moneda(n: number | undefined): string {
    const val = Number(n) || 0;
    if (isNaN(val)) return '0.00';
    const partes = val.toFixed(2).split('.');
    partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return partes.join('.');
  }

  getSaldoPendiente(): number {
    return this.saldoPendiente();
  }
}
