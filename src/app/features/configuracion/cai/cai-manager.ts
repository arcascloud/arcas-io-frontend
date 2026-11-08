import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MessageService, ConfirmationService } from 'primeng/api';
import { forkJoin, of } from 'rxjs';
import { EmpresasService } from '../../../core/services/empresas.service';
import { AuthService } from '../../../core/services/auth.service';
import { Cai, Correlativo, EstadoCorrelativo, Empresa } from '../../../core/models/empresa.models';
import { Sucursal } from '../../../core/models/sucursal.models';

/**
 * CAI Manager — control independiente de CAIs (tcai) y sus rangos (tcai_autorizado).
 * Layout split estilo clientes-manager: detalle a la izquierda, lista a la derecha.
 * Opera sobre la empresa activa del usuario logueado.
 */
@Component({
  selector: 'app-cai-manager',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    TooltipModule,
    SkeletonModule,
    TableModule,
    SelectModule,
    DatePickerModule,
    InputNumberModule,
    IconFieldModule,
    InputIconModule,
  ],
  templateUrl: './cai-manager.html',
  styleUrl: './cai-manager.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CaiManager implements OnInit {
  private service = inject(EmpresasService);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private msgs = inject(MessageService);
  private confirm = inject(ConfirmationService);
  private destroyRef = inject(DestroyRef);

  private _empresaId = signal<number | null>(this.auth.currentUser()?.empresaId ?? null);

  /** Empresa de trabajo (la que se está gestionando) */
  get empresaId(): number | null {
    return this._empresaId();
  }
  set empresaId(v: number | null) {
    this._empresaId.set(v);
  }

  // ===== EMPRESAS / SUCURSALES (formulario nuevo CAI) =====
  empresas = signal<Empresa[]>([]);
  sucursalesForm = signal<Sucursal[]>([]);

  // ===== LISTA =====
  cais = signal<Cai[]>([]);
  cargando = signal(false);
  q = signal('');

  /** CAI seleccionado para ver detalle (rangos) */
  selected = signal<Cai | null>(null);
  /** Modo del formulario maestro: 'none' = ver detalle */
  formMode = signal<'none' | 'nuevo' | 'editar'>('none');
  savingCai = signal(false);
  /** Id del CAI que se está editando (null = creando) */
  private editandoId: number | null = null;
  /** Empresa del CAI en edición (no se cambia) */
  private empresaEditandoId: number | null = null;

  readonly SN_ACTIVO_OPTIONS = [
    { label: 'Activo', value: 'S' },
    { label: 'Inactivo', value: 'N' },
  ];

  filtrados = computed(() => {
    const texto = this.q().toLowerCase().trim();
    const list = this.cais();
    if (!texto) return list;
    return list.filter(c => c.cai.toLowerCase().includes(texto));
  });

  caiForm = this.fb.group({
    cai: ['', [Validators.required, Validators.minLength(35)]],
    sn_activo: ['N'],
    empresaId: [null as number | null, Validators.required],
    Idsucursal: [null as number | null, Validators.required],
  });

  // ===== CORRELATIVOS (rangos del CAI seleccionado) =====
  correlativos = signal<Correlativo[]>([]);
  loadingCorr = signal(false);
  savingCorr = signal(false);
  corrEditando = signal<Correlativo | null>(null);
  sucursales = signal<Sucursal[]>([]);
  estadoCorrelativos = signal<EstadoCorrelativo[]>([]);

  corrForm = this.fb.group({
    Idsucursal: [null as number | null, Validators.required],
    rangoDesde: ['', Validators.required],
    rangoHasta: ['', Validators.required],
    nrofactura: [0, Validators.required],
    fechaLimite: [null as Date | null, Validators.required],
  });

  ngOnInit() {
    this.loadEmpresas();
    if (this.empresaId != null) {
      this.loadCais();
      this.loadSucursales();
      this.loadEstadoCorrelativos();
    }
  }

  loadEmpresas() {
    this.service.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => this.empresas.set(data ?? []),
      error: () => this.empresas.set([]),
    });
  }

  // ==================================================
  //  CAI — MAESTRO
  // ==================================================

  loadCais(seleccionarId?: number, sucursalPreseleccionada?: number) {
    this.cargando.set(true);
    this.service.getAllCai(this.empresaId!).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        const list = data ?? [];
        this.cais.set(list);
        this.cargando.set(false);
        if (seleccionarId != null) {
          const creado = list.find(c => c.caiId === seleccionarId);
          if (creado) {
            this.seleccionar(creado);
            if (sucursalPreseleccionada != null) {
              this.corrForm.patchValue({ Idsucursal: sucursalPreseleccionada });
              this.cargarNroFacturaSiguiente();
            }
            return;
          }
        }
        if (list.length > 0 && !this.selected() && this.formMode() === 'none') {
          this.seleccionar(list[0]);
        } else if (list.length === 0) {
          this.selected.set(null);
          this.correlativos.set([]);
        }
      },
      error: () => {
        this.cais.set([]);
        this.cargando.set(false);
      },
    });
  }

  seleccionar(cai: Cai) {
    this.formMode.set('none');
    this.selected.set(cai);
    this.caiForm.reset({ cai: cai.cai, sn_activo: cai.sn_activo, empresaId: cai.empresaId, Idsucursal: null });
    this.loadCorrelativos();
  }

  nuevo() {
    this.selected.set(null);
    this.correlativos.set([]);
    this.editandoId = null;
    this.empresaEditandoId = null;
    this.formMode.set('nuevo');
    const empId = this.empresaId;
    this.caiForm.reset({ cai: '', sn_activo: 'S', empresaId: empId, Idsucursal: null });
    this.cargarSucursalesForm(empId);
  }

  editarCai(cai: Cai) {
    this.selected.set(null);
    this.correlativos.set([]);
    this.editandoId = cai.caiId;
    this.empresaEditandoId = cai.empresaId;
    this.formMode.set('editar');
    this.caiForm.reset({ cai: cai.cai, sn_activo: cai.sn_activo, empresaId: cai.empresaId, Idsucursal: null });
  }

  cancelarForm() {
    this.formMode.set('none');
    this.editandoId = null;
    this.empresaEditandoId = null;
    this.caiForm.reset({ cai: '', sn_activo: 'N', empresaId: this.empresaId, Idsucursal: null });
    // Volver al primer CAI si había datos
    const list = this.cais();
    if (list.length > 0) {
      this.seleccionar(list[0]);
    }
  }

  /** Carga las sucursales para el select del formulario de nuevo CAI */
  cargarSucursalesForm(empresaId: number | null) {
    this.sucursalesForm.set([]);
    if (empresaId == null) return;
    this.service.getAllSucursales(empresaId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => this.sucursalesForm.set(data ?? []),
      error: () => this.sucursalesForm.set([]),
    });
  }

  /** Al cambiar la empresa en el formulario de nuevo CAI: recarga sucursales y limpia la sucursal */
  onEmpresaCaiChange() {
    const empId = this.caiForm.value.empresaId ?? null;
    this.caiForm.patchValue({ Idsucursal: null });
    this.cargarSucursalesForm(empId);
  }

  guardarCai() {
    const esEdicion = this.formMode() === 'editar';

    if (esEdicion) {
      if (this.caiForm.get('cai')?.invalid) {
        this.caiForm.get('cai')?.markAsTouched();
        return;
      }
    } else if (this.caiForm.invalid) {
      this.caiForm.markAllAsTouched();
      return;
    }

    const codigo = this.caiForm.value.cai || '';
    if (codigo.length < 35) {
      this.msgs.add({ severity: 'warn', summary: 'Validación', detail: 'El CAI debe tener al menos 35 caracteres' });
      return;
    }

    // Empresa: en edición no se cambia; en nuevo, la seleccionada en el formulario
    const empresaDestino = esEdicion ? this.empresaEditandoId : this.caiForm.value.empresaId;
    const sucursalDestino = esEdicion ? null : this.caiForm.value.Idsucursal;

    if (empresaDestino == null) {
      this.msgs.add({ severity: 'warn', summary: 'Validación', detail: 'Seleccione la empresa' });
      return;
    }

    this.savingCai.set(true);
    const dto: Partial<Cai> = {
      cai: codigo.toUpperCase(),
      sn_activo: this.caiForm.value.sn_activo || 'N',
      empresaId: empresaDestino,
    };

    const obs = esEdicion && this.editandoId != null
      ? this.service.updateCai(this.editandoId, dto)
      : this.service.createCai(dto);

    obs.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: any) => {
        this.msgs.add({ severity: 'success', summary: 'Guardado', detail: 'CAI guardado correctamente' });
        this.savingCai.set(false);
        this.formMode.set('none');
        this.editandoId = null;
        this.empresaEditandoId = null;
        this.caiForm.reset({ cai: '', sn_activo: 'N', empresaId: this.empresaId, Idsucursal: null });
        this.selected.set(null);
        this.correlativos.set([]);

        if (!esEdicion) {
          // Cambiar el contexto a la empresa del CAI creado
          this.empresaId = empresaDestino;
          this.loadSucursales();
          this.loadEstadoCorrelativos();
          this.loadCais(res?.caiId, sucursalDestino ?? undefined);
        } else {
          this.loadCais();
        }
      },
      error: (err: any) => {
        this.savingCai.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'No se pudo guardar' });
      },
    });
  }

  eliminarCai(cai: Cai) {
    this.confirm.confirm({
      message: '¿Eliminar este CAI y todos sus correlativos?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: { label: 'Cancelar', severity: 'secondary', variant: 'text', size: 'small', rounded: true },
      acceptButtonProps: { label: 'Eliminar', severity: 'danger', variant: 'text', size: 'small', rounded: true },
      accept: () => {
        // Cascada: primero los correlativos del CAI, luego el CAI
        this.service.getAllCorr(this.empresaId!).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: (corrs) => {
            const dels = (corrs ?? [])
              .filter(c => c.caiId === cai.caiId)
              .map(c => this.service.removeCorr(c.caiAutorizadoId, c.empresaId));
            (dels.length > 0 ? forkJoin(dels) : of([])).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
              next: () => this.procesarEliminacionCai(cai),
              error: (err: any) => this.msgs.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'No se pudieron eliminar los correlativos' }),
            });
          },
          error: (err: any) => this.msgs.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'No se pudieron leer los correlativos' }),
        });
      },
    });
  }

  private procesarEliminacionCai(cai: Cai) {
    this.service.removeCai(cai.caiId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.msgs.add({ severity: 'success', summary: 'Eliminado', detail: 'CAI eliminado' });
        this.selected.set(null);
        this.correlativos.set([]);
        this.loadCais();
      },
      error: (err: any) => this.msgs.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'No se pudo eliminar' }),
    });
  }

  // ==================================================
  //  CORRELATIVOS (detalle del CAI)
  // ==================================================

  loadCorrelativos() {
    const caiId = this.selected()?.caiId;
    if (caiId == null || this.empresaId == null) {
      this.correlativos.set([]);
      return;
    }
    this.loadingCorr.set(true);
    this.service.getAllCorr(this.empresaId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.correlativos.set((data ?? []).filter(c => c.caiId === caiId));
        this.loadingCorr.set(false);
      },
      error: () => {
        this.correlativos.set([]);
        this.loadingCorr.set(false);
      },
    });
  }

  guardarCorrelativo() {
    if (this.corrForm.invalid || this.empresaId == null) {
      this.corrForm.markAllAsTouched();
      return;
    }
    const caiId = this.selected()?.caiId;
    if (caiId == null) return;

    this.savingCorr.set(true);
    const formVal = this.corrForm.value;
    const fechaLimite = formVal.fechaLimite instanceof Date
      ? formVal.fechaLimite.toISOString()
      : formVal.fechaLimite;

    const dto: Partial<Correlativo> = {
      caiId,
      Idsucursal: formVal.Idsucursal!,
      rangoDesde: formVal.rangoDesde!,
      rangoHasta: formVal.rangoHasta!,
      nrofactura: formVal.nrofactura!,
      fechaLimite: fechaLimite!,
      empresaId: this.empresaId!,
    };

    const editando = this.corrEditando();
    const obs = editando
      ? this.service.updateCorr(editando.caiAutorizadoId, dto)
      : this.service.createCorr(dto);

    obs.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.msgs.add({ severity: 'success', summary: 'Guardado', detail: 'Correlativo guardado correctamente' });
        this.savingCorr.set(false);
        this.resetCorrForm();
        this.corrEditando.set(null);
        this.loadCorrelativos();
        this.loadEstadoCorrelativos();
      },
      error: (err: any) => {
        this.savingCorr.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'No se pudo guardar' });
      },
    });
  }

  editarCorr(corr: Correlativo) {
    this.corrEditando.set(corr);
    const fechaCorr = corr.fechaLimite ? new Date(corr.fechaLimite) : null;
    this.corrForm.patchValue({
      Idsucursal: corr.Idsucursal,
      rangoDesde: corr.rangoDesde,
      rangoHasta: corr.rangoHasta,
      nrofactura: corr.nrofactura,
      fechaLimite: fechaCorr,
    });
  }

  eliminarCorr(corr: Correlativo) {
    this.confirm.confirm({
      message: '¿Eliminar este correlativo?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: { label: 'Cancelar', severity: 'secondary', variant: 'text', size: 'small', rounded: true },
      acceptButtonProps: { label: 'Eliminar', severity: 'danger', variant: 'text', size: 'small', rounded: true },
      accept: () => {
        this.service.removeCorr(corr.caiAutorizadoId, corr.empresaId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => {
            this.msgs.add({ severity: 'success', summary: 'Eliminado', detail: 'Correlativo eliminado' });
            this.loadCorrelativos();
            this.loadEstadoCorrelativos();
          },
          error: (err: any) => this.msgs.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'No se pudo eliminar' }),
        });
      },
    });
  }

  cancelarCorr() {
    this.corrEditando.set(null);
    this.resetCorrForm();
  }

  resetCorrForm() {
    this.corrForm.reset({
      Idsucursal: null,
      rangoDesde: '',
      rangoHasta: '',
      nrofactura: 0,
      fechaLimite: null,
    });
  }

  cargarNroFacturaSiguiente() {
    const idsucursal = this.corrForm.value.Idsucursal;
    if (!idsucursal || this.empresaId == null) return;

    this.service.getNextNroFactura(this.empresaId, idsucursal)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => this.corrForm.patchValue({ nrofactura: res.nrofactura }),
        error: () => { /* sin correlativo previo: contador en 0 */ },
      });
  }

  onSucursalChange() {
    if (!this.corrEditando()) {
      this.cargarNroFacturaSiguiente();
    }
  }

  // ==================================================
  //  SUCURSALES + ESTADO (alertas de rangos)
  // ==================================================

  private loadSucursales() {
    this.service.getAllSucursales(this.empresaId!).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => this.sucursales.set(data ?? []),
      error: () => this.sucursales.set([]),
    });
  }

  loadEstadoCorrelativos() {
    this.service.getEstadoCorrelativo(this.empresaId!).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => this.estadoCorrelativos.set(data ?? []),
      error: () => this.estadoCorrelativos.set([]),
    });
  }

  getEstadoCorr(idsucursal: number): EstadoCorrelativo | undefined {
    return this.estadoCorrelativos().find(e => e.Idsucursal === idsucursal);
  }

  getRangoDisponible(idsucursal: number): string {
    const e = this.getEstadoCorr(idsucursal);
    if (!e) return '-';
    return `${e.disponible} de ${e.total}`;
  }

  getRangoPorcentaje(idsucursal: number): number {
    const e = this.getEstadoCorr(idsucursal);
    return e?.porcentaje ?? 0;
  }

  getRangoEstado(idsucursal: number): string {
    const e = this.getEstadoCorr(idsucursal);
    return e?.estado ?? 'OK';
  }

  getRangoEstadoSeverity(idsucursal: number): string {
    const estado = this.getRangoEstado(idsucursal);
    switch (estado) {
      case 'AGOTADO': return 'danger';
      case 'CRITICO': return 'danger';
      case 'ALERTA': return 'warn';
      default: return 'success';
    }
  }

  getRangoLabel(idsucursal: number): string {
    const estado = this.getRangoEstado(idsucursal);
    switch (estado) {
      case 'AGOTADO': return 'Rango agotado';
      case 'CRITICO': return 'Crítico (<10%)';
      case 'ALERTA': return 'Alerta (<20%)';
      default: return 'OK';
    }
  }

  // ==================================================
  //  HELPERS
  // ==================================================

  getEstadoLabel(activo: string): string {
    return activo === 'S' ? 'Activo' : 'Inactivo';
  }

  getEstadoSeverity(activo: string): string {
    return activo === 'S' ? 'success' : 'danger';
  }

  formatFecha(fecha: string | Date | undefined): string {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-HN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  getSucursalNombre(idsucursal: number): string {
    return this.sucursales().find(s => s.idsucursal === idsucursal)?.descripcion || `Suc. ${idsucursal}`;
  }

  limpiarFiltros() {
    this.q.set('');
  }
}
