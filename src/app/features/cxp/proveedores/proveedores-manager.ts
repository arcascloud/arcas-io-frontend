import {
  Component,
  inject,
  signal,
  OnInit,
  computed,
  ChangeDetectionStrategy,
  DestroyRef,
  effect,
  untracked,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { timeout, catchError, of } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { TabsModule } from 'primeng/tabs';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService, ConfirmationService } from 'primeng/api';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { CxpService } from '../../../core/services/cxp.service';
import { ContabilidadService } from '../../../core/services/contabilidad.service';
import { AuthService } from '../../../core/services/auth.service';
import { Proveedor } from '../../../core/models/inventario.models';
import { ProveedorInfo, ProveedorCartera, TipoInfoProveedor } from '../../../core/models/cxp.models';
import { CxpProveedorForm } from './proveedor-form';

/** Movimiento CxP (cxpmovimientos) — estado de cuenta del proveedor */
interface CxPMovimiento {
  bcomovId: number;
  fecharegistro: string;
  tipomov: 'D' | 'C';
  nroreferencia: string;
  concepto?: string;
  importe: number | string;
  sn_doc_anulado?: 'S' | 'N';
}

/**
 * Proveedores (CxP) — layout Maestro/Detalle idéntico a Clientes (CxC):
 * columna izquierda con el detalle en tabs, columna derecha con la lista
 * paginada y el buscador.
 */
@Component({
  selector: 'app-proveedores-manager',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    TooltipModule,
    TabsModule,
    SkeletonModule,
    SelectModule,
    TableModule,
    PaginatorModule,
    IconFieldModule,
    InputIconModule,
    CxpProveedorForm,
  ],
  templateUrl: './proveedores-manager.html',
  styleUrl: './proveedores-manager.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProveedoresManager implements OnInit {
  private service = inject(CxpService);
  private contabilidad = inject(ContabilidadService);
  private msgs = inject(MessageService);
  private confirm = inject(ConfirmationService);
  private auth = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  // ===== INFORMACIÓN ADICIONAL (proveedorinfo) =====
  readonly infoTipoOptions = [
    { label: 'Correo', value: 'CORREO' as TipoInfoProveedor },
    { label: 'Celular', value: 'CELULAR' as TipoInfoProveedor },
    { label: 'Dirección', value: 'DIRECCION' as TipoInfoProveedor },
  ];

  readonly infoEstadoOptions = [
    { label: 'Activo', value: 'S' as const },
    { label: 'Inactivo', value: 'N' as const },
  ];

  infoData = signal<ProveedorInfo[]>([]);
  infoLoading = signal(false);
  infoSaving = signal(false);

  infoModel = signal<{
    id: number | null;
    tipo: TipoInfoProveedor | '';
    descripcion: string;
    sn_activo: 'S' | 'N';
  }>({
    id: null,
    tipo: '',
    descripcion: '',
    sn_activo: 'S',
  });

  // ===== CARTERA CONTABLE POR PROVEEDOR (cxpcarteracta) =====

  /** Módulo de CxP en el catálogo de carteras contables (tcocarteras.moduloId) */
  private readonly MODULO_CXP = 5;

  /** Catálogo de carteras contables (tcocarteras) — se carga una sola vez */
  carterasCatalogo = signal<{ label: string; value: number; ctacontable?: string | null }[]>([]);
  /** Mapa coctacontables: código (ctacontable) -> descripción — se carga una sola vez */
  cuentasContables = signal<Map<string, string>>(new Map());
  /** Carteras ya asignadas al proveedor seleccionado */
  carterasProveedor = signal<ProveedorCartera[]>([]);
  carteraSeleccionada = signal<number | null>(null);
  carteraLoading = signal(false);
  carteraSaving = signal(false);

  /** Opciones del select: solo carteras que el proveedor todavía no tiene asignadas */
  carterasDisponibles = computed(() => {
    const asignadas = new Set(this.carterasProveedor().map((c) => c.carteractaId));
    return this.carterasCatalogo().filter((o) => !asignadas.has(o.value));
  });

  // ===== LISTA / PAGINACIÓN =====
  data = signal<Proveedor[]>([]);
  totalProveedores = signal(0);
  page = signal(1);
  limit = signal(10);
  cargando = signal(false);

  q = signal('');

  // Effect: resetea página y recarga cuando cambia el filtro (q)
  private _searchEffect = effect(() => {
    this.q();
    this.page.set(1);
    untracked(() => this.loadProveedores());
  });

  // ===== SELECCIÓN / TABS =====
  selectedProveedor = signal<Proveedor | null>(null);
  nuevoProveedor = signal(false);
  activeTabValue = signal<string>('0');

  @ViewChild('proveedorFormRef') proveedorFormRef?: CxpProveedorForm;

  estadoCuentaData = signal<CxPMovimiento[]>([]);
  estadoCuentaLoading = signal(false);

  /** Saldo pendiente: D (débito) suma, C (crédito) resta */
  saldoPendiente = computed(() =>
    this.estadoCuentaData().reduce((sum, m) => {
      if (m.sn_doc_anulado === 'S') return sum;
      const importe = Number(m.importe || 0);
      return m.tipomov === 'D' ? sum + importe : sum - importe;
    }, 0),
  );

  ngOnInit() {
    // Sin loadProveedores() aquí: el _searchEffect lo ejecuta automáticamente
    this.cargarCatalogoCarteras();
    this.cargarCuentasContables();
  }

  // ===== LISTA =====

  loadProveedores() {
    this.cargando.set(true);
    this.service
      .getProveedoresPag(this.page(), this.limit(), this.q())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        timeout(10000),
        catchError(() => of({ data: [], total: 0 })),
      )
      .subscribe({
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
    this.resetSeleccion();
  }

  nuevo() {
    this.selectedProveedor.set(null);
    this.nuevoProveedor.set(true);
    this.resetTabs();

    setTimeout(() => {
      this.proveedorFormRef?.focusPrimerCampo();
    }, 200);
  }

  onFormSaved() {
    this.nuevoProveedor.set(false);
    this.selectedProveedor.set(null);
    this.resetSeleccion();
    this.loadProveedores();
  }

  onFormCancelled() {
    this.nuevoProveedor.set(false);
    this.resetSeleccion();
  }

  editarProveedor(proveedor: Proveedor, event: Event) {
    event.stopPropagation();
    this.seleccionarProveedor(proveedor);
  }

  seleccionarProveedor(proveedor: Proveedor) {
    this.nuevoProveedor.set(false);
    this.selectedProveedor.set(proveedor);
    this.resetTabs();
    this.cargarDatosProveedor(proveedor.proveedorId);
  }

  private resetSeleccion() {
    this.selectedProveedor.set(null);
    this.nuevoProveedor.set(false);
    this.resetTabs();
  }

  private resetTabs() {
    this.activeTabValue.set('0');
    this.estadoCuentaData.set([]);
    this.infoData.set([]);
    this.limpiarModelInfo();
    this.carterasProveedor.set([]);
    this.carteraSeleccionada.set(null);
  }

  private cargarDatosProveedor(proveedorId: number) {
    this.cargarInfoProveedor(proveedorId);
    this.cargarCarterasProveedor(proveedorId);

    this.estadoCuentaLoading.set(true);
    this.service
      .getMovimientosByProveedor(proveedorId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.estadoCuentaData.set((res ?? []) as CxPMovimiento[]);
          this.estadoCuentaLoading.set(false);
        },
        error: () => this.estadoCuentaLoading.set(false),
      });
  }

  // ===== CATÁLOGOS =====

  /** Catálogo de carteras contables (una sola vez), filtrado por módulo CxP */
  private cargarCatalogoCarteras() {
    this.contabilidad.getCarteras().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        // En Proveedores (CxP) solo aplican carteras con moduloId = 5.
        // sn_activo !== 'N' descarta carteras dadas de baja (softDelete).
        const opts = (res ?? [])
          .filter((c) => c.moduloId === this.MODULO_CXP && c.sn_activo !== 'N')
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

  /** Catálogo de cuentas contables (coctacontables) para mostrar descripciones */
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

  // ===== INFORMACIÓN ADICIONAL (proveedorinfo) =====

  private limpiarModelInfo() {
    this.infoModel.set({ id: null, tipo: '', descripcion: '', sn_activo: 'S' });
  }

  private cargarInfoProveedor(proveedorId: number) {
    this.limpiarModelInfo();
    this.infoLoading.set(true);
    this.service.getProveedorInfo(proveedorId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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

  editarInfo(row: ProveedorInfo) {
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
    const proveedor = this.selectedProveedor();
    if (!proveedor) {
      this.msgs.add({ severity: 'warn', summary: 'Seleccione', detail: 'Seleccione un proveedor antes de guardar' });
      return;
    }

    const raw = this.infoModel();
    if (!raw.tipo) {
      this.msgs.add({ severity: 'warn', summary: 'Datos incompletos', detail: 'Seleccione el tipo de información' });
      return;
    }

    const descripcion = (raw.descripcion ?? '').trim();
    if (!descripcion) {
      this.msgs.add({ severity: 'warn', summary: 'Datos incompletos', detail: 'Escriba el valor de la información' });
      return;
    }

    // La BD tiene UNIQUE (proveedorId, tipo, empresaId): un solo registro por tipo
    const duplicado = this.infoData().find((r) => r.tipo === raw.tipo && r.id !== raw.id);
    if (duplicado) {
      this.msgs.add({
        severity: 'warn',
        summary: 'Tipo duplicado',
        detail: `El proveedor ya tiene un registro de tipo ${this.infoTipoLabel(raw.tipo)}`,
      });
      return;
    }

    const payload = {
      tipo: raw.tipo,
      descripcion,
      sn_activo: raw.sn_activo,
    };

    this.infoSaving.set(true);
    const op =
      raw.id != null
        ? this.service.updateProveedorInfo(raw.id, payload)
        : this.service.createProveedorInfo({ ...payload, proveedorId: proveedor.proveedorId });

    op.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.infoSaving.set(false);
        this.limpiarModelInfo();
        this.msgs.add({ severity: 'success', summary: 'Guardado', detail: 'Información guardada correctamente' });
        this.cargarInfoProveedor(proveedor.proveedorId);
      },
      error: (err) => {
        this.infoSaving.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: this.mensajeError(err, 'No se pudo guardar la información') });
      },
    });
  }

  eliminarInfo(row: ProveedorInfo) {
    this.confirm.confirm({
      message: '¿Está seguro de desactivar este registro de información?',
      header: 'Confirmación',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: {
        label: 'Cancelar',
        severity: 'secondary',
        variant: 'text',
        size: 'small',
        rounded: true,
      },
      acceptButtonProps: {
        label: 'Confirmar',
        severity: 'danger',
        variant: 'text',
        size: 'small',
        rounded: true,
      },
      accept: () => {
        const proveedor = this.selectedProveedor();
        this.service.removeProveedorInfo(row.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => {
            this.msgs.add({ severity: 'success', summary: 'Eliminado', detail: 'Registro desactivado correctamente' });
            if (this.infoModel().id === row.id) this.limpiarModelInfo();
            if (proveedor) this.cargarInfoProveedor(proveedor.proveedorId);
          },
          error: (err) => {
            this.msgs.add({ severity: 'error', summary: 'Error', detail: this.mensajeError(err, 'No se pudo eliminar el registro') });
          },
        });
      },
    });
  }

  infoTipoLabel(tipo: TipoInfoProveedor | ''): string {
    if (!tipo) return '—';
    return this.infoTipoOptions.find((o) => o.value === tipo)?.label ?? tipo;
  }

  // ===== CARTERA CONTABLE POR PROVEEDOR (cxpcarteracta) =====

  private cargarCarterasProveedor(proveedorId: number) {
    this.carteraSeleccionada.set(null);
    this.carteraLoading.set(true);
    this.service.getCarterasProveedor().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.carterasProveedor.set((res ?? []).filter((c) => c.proveedorId === proveedorId));
        this.carteraLoading.set(false);
      },
      error: () => {
        this.carterasProveedor.set([]);
        this.carteraLoading.set(false);
      },
    });
  }

  agregarCartera() {
    const proveedor = this.selectedProveedor();
    if (!proveedor) {
      this.msgs.add({ severity: 'warn', summary: 'Seleccione', detail: 'Seleccione un proveedor antes de asignar una cartera' });
      return;
    }

    const carteractaId = this.carteraSeleccionada();
    if (!carteractaId) {
      this.msgs.add({ severity: 'warn', summary: 'Datos incompletos', detail: 'Seleccione una cartera contable' });
      return;
    }

    // Unicidad en BD: (proveedorId, carteractaId, Idsucursal, empresaId)
    if (this.carterasProveedor().some((c) => c.carteractaId === carteractaId)) {
      this.msgs.add({ severity: 'warn', summary: 'Duplicada', detail: 'El proveedor ya tiene asignada esta cartera contable' });
      return;
    }

    this.carteraSaving.set(true);
    this.service.createCarteraProveedor({ proveedorId: proveedor.proveedorId, carteractaId }).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.carteraSaving.set(false);
        this.carteraSeleccionada.set(null);
        this.msgs.add({ severity: 'success', summary: 'Asignada', detail: 'Cartera contable asignada correctamente' });
        this.cargarCarterasProveedor(proveedor.proveedorId);
      },
      error: (err) => {
        this.carteraSaving.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: this.mensajeError(err, 'No se pudo asignar la cartera contable') });
      },
    });
  }

  eliminarCartera(row: ProveedorCartera) {
    this.confirm.confirm({
      message: `¿Está seguro de quitar la cartera contable "${this.nombreCartera(row.carteractaId)}" del proveedor?`,
      header: 'Confirmación',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: {
        label: 'Cancelar',
        severity: 'secondary',
        variant: 'text',
        size: 'small',
        rounded: true,
      },
      acceptButtonProps: {
        label: 'Confirmar',
        severity: 'danger',
        variant: 'text',
        size: 'small',
        rounded: true,
      },
      accept: () => {
        const proveedor = this.selectedProveedor();
        this.service.removeCarteraProveedor(row.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => {
            this.msgs.add({ severity: 'success', summary: 'Eliminada', detail: 'Cartera contable quitada del proveedor' });
            if (proveedor) this.cargarCarterasProveedor(proveedor.proveedorId);
          },
          error: (err) => {
            this.msgs.add({ severity: 'error', summary: 'Error', detail: this.mensajeError(err, 'No se pudo quitar la cartera contable') });
          },
        });
      },
    });
  }

  /** Nombre legible de una cartera contable a partir de su ID */
  nombreCartera(carteractaId: number): string {
    const found = this.carterasCatalogo().find((o) => o.value === carteractaId);
    return found ? found.label : `Cartera ${carteractaId}`;
  }

  /** Cuenta contable (tcocarteras.ctacontable) de una cartera; null si no está en el catálogo */
  ctaCartera(carteractaId: number): string | null {
    const found = this.carterasCatalogo().find((o) => o.value === carteractaId);
    return found?.ctacontable ?? null;
  }

  /** Descripción de la cuenta contable (coctacontables.descripcion) de una cartera asignada */
  descripcionCtaCartera(carteractaId: number): string | null {
    const cta = this.ctaCartera(carteractaId);
    if (!cta) return null;
    return this.cuentasContables().get(cta) ?? null;
  }

  // ===== ESTADO DE CUENTA =====

  getTipoMovLabel(tipo: string): string {
    const tipos: Record<string, string> = {
      'C': 'Credito',
      'A': 'Abono',
      'D': 'Debito',
    };
    return tipos[tipo] || tipo;
  }

  getTipoMovSeverity(tipo: string): 'success' | 'danger' | 'warning' | 'info' {
    if (tipo === 'A') return 'success';
    if (tipo === 'C') return 'info';
    return 'danger';
  }

  // ===== UTILIDADES =====

  getProveedorNombre(p: Proveedor): string {
    const nombres = p.nombres || '';
    const apellidos = p.apellidos || '';
    const full = `${nombres} ${apellidos}`.trim();
    return full || p.razonsocial || p.nroproveedor || 'Sin nombre';
  }

  moneda(n: number | string | undefined): string {
    const val = Number(n) || 0;
    if (isNaN(val)) return '0.00';
    const partes = val.toFixed(2).split('.');
    partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return partes.join('.');
  }

  activoLbl(sn: string): string {
    return sn === 'S' ? 'Activo' : 'Inactivo';
  }

  activoSev(sn: string): 'success' | 'danger' {
    return sn === 'S' ? 'success' : 'danger';
  }

  /** Extrae el mensaje de error del backend (o uno genérico) */
  private mensajeError(err: any, fallback: string): string {
    if (err?.error?.message) return err.error.message;
    if (typeof err?.error === 'string') return err.error;
    if (err?.message) return err.message;
    return fallback;
  }
}
