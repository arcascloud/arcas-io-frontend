import {
  Component,
  inject,
  signal,
  OnInit,
  computed,
  ChangeDetectionStrategy,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TabsModule } from 'primeng/tabs';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { CxpService } from '../../../core/services/cxp.service';
import { AuthService } from '../../../core/services/auth.service';
import { ContabilidadService } from '../../../core/services/contabilidad.service';
import {
  ProveedorInfo,
  ProveedorCartera,
  TipoInfoProveedor,
} from '../../../core/models/cxp.models';

@Component({
  selector: 'app-cxp-proveedor-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    SelectButtonModule,
    TabsModule,
    TableModule,
    TagModule,
    TooltipModule,
  ],
  templateUrl: './proveedor-form.html',
  styleUrl: './proveedor-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxpProveedorForm implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(CxpService);
  private auth = inject(AuthService);
  private msgs = inject(MessageService);
  private confirm = inject(ConfirmationService);
  private contabilidad = inject(ContabilidadService);
  private destroyRef = inject(DestroyRef);

  esEdicion = signal(false);
  cargando = signal(false);
  guardando = signal(false);
  titulo = signal('Nuevo proveedor');
  /** Tab activa: '0' Datos | '1' Inf. Adicional | '2' Carteras */
  activeTabValue = signal<string>('0');

  readonly snOptions = [
    { label: 'Activo', value: 'S' },
    { label: 'Inactivo', value: 'N' },
  ];

  readonly sexoOptions = [
    { label: 'Masculino', value: 'M' },
    { label: 'Femenino', value: 'F' },
  ];

  readonly estadoCivilOptions = [
    { label: 'Soltero', value: 'S' },
    { label: 'Casado', value: 'C' },
    { label: 'Divorciado', value: 'D' },
    { label: 'Viudo', value: 'V' },
    { label: 'Unión libre', value: 'U' },
  ];

  readonly categoriaOptions = [
    { label: 'A', value: 'A' },
    { label: 'B', value: 'B' },
    { label: 'C', value: 'C' },
    { label: 'D', value: 'D' },
    { label: 'E', value: 'E' },
  ];

  // ===== INFO DE PROVEEDOR (proveedorinfo) =====

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

  private proveedorId = 0;

  form!: FormGroup;

  ngOnInit() {
    this.form = this.fb.group({
      nroproveedor: ['', Validators.required],
      nombres: ['', Validators.required],
      apellidos: ['', Validators.required],
      razonsocial: [''],
      dni: [''],
      sexo: ['M' as 'M' | 'F'],
      estadocivil: ['S' as 'S' | 'C' | 'D' | 'V' | 'U'],
      rtn: [''],
      limiteCredito: [0],
      diasplazo: [0],
      interes: [0],
      moratorio: [0],
      categoria: ['A' as 'A' | 'B' | 'C' | 'D' | 'E'],
      sn_activo: ['S' as 'S' | 'N'],
    });

    // Catálogos independientes del proveedor (se cargan una sola vez)
    this.cargarCatalogoCarteras();
    this.cargarCuentasContables();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.esEdicion.set(true);
      this.titulo.set('Editar proveedor');
      this.proveedorId = Number(id);
      this.cargando.set(true);
      this.service.getProveedor(this.proveedorId).subscribe({
        next: (p) => {
          this.form.patchValue({
            nroproveedor: p.nroproveedor,
            nombres: p.nombres,
            apellidos: p.apellidos,
            razonsocial: p.razonsocial,
            dni: p.dni,
            sexo: p.sexo,
            estadocivil: p.estadocivil,
            rtn: p.rtn,
            limiteCredito: Number(p.limiteCredito),
            diasplazo: Number(p.diasplazo),
            interes: Number(p.interes),
            moratorio: Number(p.moratorio),
            categoria: p.categoria,
            sn_activo: p.sn_activo === 'S' ? 'S' : 'N',
          });
          this.cargando.set(false);
          // Tabs de detalle solo disponibles con proveedor guardado
          this.cargarInfoProveedor();
          this.cargarCarterasProveedor();
        },
        error: () => {
          this.cargando.set(false);
          this.msgs.add({ severity: 'error', summary: 'Error', detail: 'Proveedor no encontrado' });
          this.volver();
        },
      });
    }
  }

  invalid(ctrl: string): boolean {
    const c = this.form.get(ctrl);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  volver() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();

    const payload = this.esEdicion()
      ? { ...raw }
      : {
          ...raw,
          empresaId: this.auth.currentUser()?.empresaId,
          sn_activo: 'S',
        };

    this.guardando.set(true);
    const op = this.esEdicion()
      ? this.service.updateProveedor(this.proveedorId, payload as any)
      : this.service.createProveedor(payload as any);

    op.subscribe({
      next: () => {
        this.guardando.set(false);
        this.msgs.add({
          severity: 'success',
          summary: 'Guardado',
          detail: this.esEdicion() ? 'Proveedor actualizado' : 'Proveedor creado correctamente',
        });
        this.volver();
      },
      error: () => {
        this.guardando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el proveedor' });
      },
    });
  }

  // ===== INFO DE PROVEEDOR (proveedorinfo) =====

  private cargarInfoProveedor() {
    this.infoLoading.set(true);
    this.service
      .getProveedorInfo(this.proveedorId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
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

  infoTipoLabel(tipo: TipoInfoProveedor | ''): string {
    if (!tipo) return '—';
    return this.infoTipoOptions.find((o) => o.value === tipo)?.label ?? tipo;
  }

  editarInfo(row: ProveedorInfo) {
    this.infoModel.set({
      id: row.id,
      tipo: row.tipo,
      descripcion: row.descripcion ?? '',
      sn_activo: row.sn_activo,
    });
  }

  cancelarInfo() {
    this.limpiarModelInfo();
  }

  limpiarModelInfo() {
    this.infoModel.set({ id: null, tipo: '', descripcion: '', sn_activo: 'S' });
  }

  guardarInfo() {
    if (!this.esEdicion()) {
      this.msgs.add({
        severity: 'warn',
        summary: 'Proveedor',
        detail: 'Guarde el proveedor antes de agregar información de contacto',
      });
      return;
    }

    const model = this.infoModel();
    if (!model.tipo) {
      this.msgs.add({ severity: 'warn', summary: 'Datos incompletos', detail: 'Seleccione el tipo de información' });
      return;
    }

    this.infoSaving.set(true);

    if (model.id != null) {
      this.service
        .updateProveedorInfo(model.id, {
          tipo: model.tipo,
          descripcion: model.descripcion || null,
          sn_activo: model.sn_activo,
        })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.infoSaving.set(false);
            this.limpiarModelInfo();
            this.msgs.add({
              severity: 'success',
              summary: 'Actualizado',
              detail: 'Registro de información actualizado',
            });
            this.cargarInfoProveedor();
          },
          error: (err) => {
            this.infoSaving.set(false);
            this.msgs.add({ severity: 'error', summary: 'Error', detail: this.mensajeError(err, 'No se pudo actualizar') });
          },
        });
      return;
    }

    this.service
      .createProveedorInfo({
        proveedorId: this.proveedorId,
        tipo: model.tipo,
        descripcion: model.descripcion || undefined,
        sn_activo: model.sn_activo,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.infoSaving.set(false);
          this.limpiarModelInfo();
          this.msgs.add({ severity: 'success', summary: 'Creado', detail: 'Registro de información creado' });
          this.cargarInfoProveedor();
        },
        error: (err) => {
          this.infoSaving.set(false);
          this.msgs.add({ severity: 'error', summary: 'Error', detail: this.mensajeError(err, 'No se pudo crear el registro') });
        },
      });
  }

  eliminarInfo(row: ProveedorInfo) {
    this.confirm.confirm({
      message: `¿Está seguro de desactivar el registro de tipo "${this.infoTipoLabel(row.tipo)}"?`,
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
        this.service
          .removeProveedorInfo(row.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.msgs.add({
                severity: 'success',
                summary: 'Desactivado',
                detail: 'Registro de información desactivado',
              });
              this.cargarInfoProveedor();
            },
            error: (err) => {
              this.msgs.add({ severity: 'error', summary: 'Error', detail: this.mensajeError(err, 'No se pudo desactivar') });
            },
          });
      },
    });
  }

  // ===== CARTERA CONTABLE POR PROVEEDOR (cxpcarteracta) =====

  /** Carga el catálogo de carteras contables (una sola vez), filtrado por módulo CxP */
  private cargarCatalogoCarteras() {
    this.contabilidad.getCarteras().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        // En Proveedores (CxP) solo aplican carteras con moduloId = 5 (CxP es módulo 5).
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

  /** Carga el catálogo de cuentas contables (coctacontables) para mostrar descripciones */
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

  private cargarCarterasProveedor() {
    this.carteraSeleccionada.set(null);
    this.carteraLoading.set(true);
    this.service
      .getCarterasProveedor()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.carterasProveedor.set((res ?? []).filter((c) => c.proveedorId === this.proveedorId));
          this.carteraLoading.set(false);
        },
        error: () => {
          this.carterasProveedor.set([]);
          this.carteraLoading.set(false);
        },
      });
  }

  agregarCartera() {
    if (!this.esEdicion()) {
      this.msgs.add({
        severity: 'warn',
        summary: 'Proveedor',
        detail: 'Guarde el proveedor antes de asignar una cartera contable',
      });
      return;
    }

    const carteractaId = this.carteraSeleccionada();
    if (!carteractaId) {
      this.msgs.add({ severity: 'warn', summary: 'Datos incompletos', detail: 'Seleccione una cartera contable' });
      return;
    }

    // Unicidad en BD: (proveedorId, carteractaId, Idsucusal, empresaId)
    if (this.carterasProveedor().some((c) => c.carteractaId === carteractaId)) {
      this.msgs.add({
        severity: 'warn',
        summary: 'Duplicada',
        detail: 'El proveedor ya tiene asignada esta cartera contable',
      });
      return;
    }

    this.carteraSaving.set(true);
    this.service
      .createCarteraProveedor({ proveedorId: this.proveedorId, carteractaId })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.carteraSaving.set(false);
          this.carteraSeleccionada.set(null);
          this.msgs.add({
            severity: 'success',
            summary: 'Asignada',
            detail: 'Cartera contable asignada correctamente',
          });
          this.cargarCarterasProveedor();
        },
        error: (err) => {
          this.carteraSaving.set(false);
          this.msgs.add({
            severity: 'error',
            summary: 'Error',
            detail: this.mensajeError(err, 'No se pudo asignar la cartera contable'),
          });
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
        this.service
          .removeCarteraProveedor(row.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.msgs.add({
                severity: 'success',
                summary: 'Eliminada',
                detail: 'Cartera contable quitada del proveedor',
              });
              this.cargarCarterasProveedor();
            },
            error: (err) => {
              this.msgs.add({
                severity: 'error',
                summary: 'Error',
                detail: this.mensajeError(err, 'No se pudo quitar la cartera contable'),
              });
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

  /** Extrae el mensaje de error del backend (o uno genérico) */
  private mensajeError(err: any, fallback: string): string {
    if (err?.error?.message) return err.error.message;
    if (typeof err?.error === 'string') return err.error;
    if (err?.message) return err.message;
    return fallback;
  }
}
