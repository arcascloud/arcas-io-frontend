import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { TabsModule } from 'primeng/tabs';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { SkeletonModule } from 'primeng/skeleton';
import { PaginatorModule } from 'primeng/paginator';
import { MessageService, ConfirmationService } from 'primeng/api';
import { EmpresasService } from '../../../core/services/empresas.service';
import { Empresa, EmpresaDet, EmpresaLogo, Impresora } from '../../../core/models/empresa.models';
import { Sucursal } from '../../../core/models/sucursal.models';

@Component({
  selector: 'app-empresas-manager',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    ButtonModule, InputTextModule, TextareaModule, SelectModule,
    TagModule, TooltipModule, TabsModule, TableModule,
    ToastModule, IconFieldModule, InputIconModule, ConfirmDialog,
    SkeletonModule, PaginatorModule,
  ],
  templateUrl: './empresas-manager.html',
  styleUrl: './empresas-manager.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmpresasManager implements OnInit {
  private fb = inject(FormBuilder);
  private empresasService = inject(EmpresasService);
  private msgs = inject(MessageService);
  private confirm = inject(ConfirmationService);
  private destroyRef = inject(DestroyRef);

  // ===== Listado =====
  empresas = signal<Empresa[]>([]);
  empresaSeleccionada = signal<Empresa | null>(null);
  cargando = signal(false);
  q = signal('');

  // ===== Tabs =====
  activeTabValue = signal('0');

  // ===== Empresa form =====
  saving = signal(false);
  empresaForm = this.fb.group({
    descripcion: ['', Validators.required],
    msjfactura: ['LA FACTURA ES BENEFICIO DE TODOS'],
    msjdevfactura: ['NO SE ACEPTAN DEVOLUCIONES O CAMBIOS DESPUES DE 15 DIAS'],
    msjcotizacion: ['NO SE ACEPTAN DEVOLUCIONES O CAMBIOS DESPUES DE 15 DIAS'],
    sn_activo: ['S'],
  });

  SN_ACTIVO_OPTIONS = [
    { label: 'Activo', value: 'S' },
    { label: 'Inactivo', value: 'N' },
  ];

  // ===== Datos específicos (EmpresaDet) =====
  empresaDet = signal<EmpresaDet[]>([]);
  savingDet = signal(false);
  loadingDet = signal(false);
  detForm = this.fb.group({
    tipo: ['RTN', Validators.required],
    descripcion: ['', Validators.required],
  });

  TIPO_OPTIONS = [
    { label: 'RTN', value: 'RTN' },
    { label: 'Telefono', value: 'TELEFONO' },
    { label: 'Direccion', value: 'DIRECCION' },
    { label: 'Correo', value: 'CORREO' },
    { label: 'RUC', value: 'RUC' },
    { label: 'Website', value: 'WEBSITE' },
    { label: 'Red Social', value: 'REDESOCIAL' },
  ];

  detEditando = signal<EmpresaDet | null>(null);

  // ===== Sucursales =====
  sucursales = signal<Sucursal[]>([]);
  savingSuc = signal(false);
  loadingSuc = signal(false);
  sucForm = this.fb.group({
    descripcion: ['', Validators.required],
    sn_activo: ['S'],
  });
  sucEditando = signal<Sucursal | null>(null);

  // ===== Logo =====
  logo = signal<EmpresaLogo | null>(null);
  savingLogo = signal(false);
  logoPreview = signal<string | null>(null);
  logoFile: File | null = null;

  // ===== Impresoras =====
  impresoras = signal<Impresora[]>([]);
  savingImp = signal(false);
  loadingImp = signal(false);
  impEditando = signal<Impresora | null>(null);
  impForm = this.fb.group({
    descripcion: [''],
    formato: ['TICKET'],
    driver: [''],
    puerto: [''],
    modo_correlativo: ['A'],
    Idsucursal: [null as number | null, Validators.required],
  });

  FORMATO_OPTIONS = [
    { label: 'Ticket', value: 'TICKET' },
    { label: 'Carta', value: 'CARTA' },
  ];

  MODO_CORRELATIVO_OPTIONS = [
    { label: 'Automático', value: 'A' },
    { label: 'Manual', value: 'M' },
  ];

  // ===== Filtros =====
  empresasFiltradas = signal<Empresa[]>([]);

  // ===== Paginación (client-side) =====
  page = signal(1);
  limit = signal(10);
  totalEmpresas = computed(() => this.empresasFiltradas().length);
  empresasPaginadas = computed(() => {
    const start = (this.page() - 1) * this.limit();
    return this.empresasFiltradas().slice(start, start + this.limit());
  });

  // ===== Datos para selects =====
  rtnTelefono = signal('');
  rtnDireccion = signal('');
  rtnCorreo = signal('');
  rtnWeb = signal('');

  ngOnInit() {
    this.load();
  }

  // ==================================================
  //  EMPRESAS
  // ==================================================

  load() {
    this.cargando.set(true);
    this.empresasService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.empresas.set(data ?? []);
        this.empresasFiltradas.set(data ?? []);
        this.page.set(1);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las empresas' });
      },
    });
  }

  seleccionar(emp: Empresa) {
    this.empresaSeleccionada.set(emp);
    this.activeTabValue.set('0');
    this.empresaForm.patchValue({
      descripcion: emp.descripcion,
      msjfactura: emp.msjfactura,
      msjdevfactura: emp.msjdevfactura,
      msjcotizacion: emp.msjcotizacion,
      sn_activo: emp.sn_activo,
    });
    this.loadDet(emp.empresaId);
    this.loadSucursales(emp.empresaId);
    this.loadLogo(emp.empresaId);
    this.loadImpresoras(emp.empresaId);
  }

  /** Botón lápiz de la ficha: evita que el click burbujee a la tarjeta */
  editarEmpresa(emp: Empresa, event: Event) {
    event.stopPropagation();
    this.seleccionar(emp);
  }

  onPageChange(event: { page: number; rows: number }) {
    this.page.set(event.page + 1);
    this.limit.set(event.rows);
  }

  nueva() {
    this.empresaSeleccionada.set(null);
    this.activeTabValue.set('0');
    this.empresaForm.reset({
      descripcion: '',
      msjfactura: 'LA FACTURA ES BENEFICIO DE TODOS',
      msjdevfactura: 'NO SE ACEPTAN DEVOLUCIONES O CAMBIOS DESPUES DE 15 DIAS',
      msjcotizacion: 'NO SE ACEPTAN DEVOLUCIONES O CAMBIOS DESPUES DE 15 DIAS',
      sn_activo: 'S',
    });
    this.empresaDet.set([]);
    this.sucursales.set([]);
    this.limpiarDatosEmpresa();
    this.logo.set(null);
    this.logoPreview.set(null);
    this.logoFile = null;
    this.impresoras.set([]);
  }

  filtrar() {
    this.page.set(1);
    const texto = this.q().toLowerCase();
    if (!texto) {
      this.empresasFiltradas.set(this.empresas());
      return;
    }
    this.empresasFiltradas.set(
      this.empresas().filter((e) =>
        e.descripcion.toLowerCase().includes(texto) ||
        String(e.empresaId).includes(texto)
      )
    );
  }

  limpiarFiltros() {
    this.q.set('');
    this.page.set(1);
    this.empresasFiltradas.set(this.empresas());
  }

  guardarEmpresa() {
    if (this.empresaForm.invalid) {
      this.empresaForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const dto = { ...this.empresaForm.value } as Partial<Empresa>;
    const emp = this.empresaSeleccionada();

    const obs = emp
      ? this.empresasService.update(emp.empresaId, dto)
      : this.empresasService.create(dto);

    obs.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: any) => {
        this.msgs.add({ severity: 'success', summary: emp ? 'Actualizada' : 'Creada', detail: 'Empresa guardada correctamente' });
        this.saving.set(false);
        this.load();
        if (!emp && res?.empresaId) {
          this.empresasService.getOne(res.empresaId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((nueva) => {
            this.seleccionar(nueva);
          });
        }
      },
      error: (err: any) => {
        this.saving.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'No se pudo guardar' });
      },
    });
  }

  // ==================================================
  //  DATOS ESPECÍFICOS (EmpresaDet)
  // ==================================================

  loadDet(empresaId: number) {
    this.loadingDet.set(true);
    this.empresasService.getAllDet(empresaId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        const todos = data ?? [];
        this.empresaDet.set(todos.filter(d => d.tipo !== 'CAI'));
        this.extraerDatosEmpresa(todos);
        this.loadingDet.set(false);
      },
      error: () => {
        this.empresaDet.set([]);
        this.limpiarDatosEmpresa();
        this.loadingDet.set(false);
      },
    });
  }

  extraerDatosEmpresa(dets: EmpresaDet[]) {
    const buscar = (tipo: string) => dets.find(d => d.tipo === tipo);
    this.rtnTelefono.set(buscar('TELEFONO')?.descripcion || '');
    this.rtnDireccion.set(buscar('DIRECCION')?.descripcion || '');
    this.rtnCorreo.set(buscar('CORREO')?.descripcion || '');
    this.rtnWeb.set(buscar('WEBSITE')?.descripcion || '');
  }

  limpiarDatosEmpresa() {
    this.rtnTelefono.set('');
    this.rtnDireccion.set('');
    this.rtnCorreo.set('');
    this.rtnWeb.set('');
  }

  guardarDet() {
    if (this.detForm.invalid || !this.empresaSeleccionada()) return;
    this.savingDet.set(true);
    const dto = { ...this.detForm.value, empresaId: this.empresaSeleccionada()!.empresaId } as Partial<EmpresaDet>;
    const editando = this.detEditando();

    const obs = editando
      ? this.empresasService.updateDet(editando.empresasdetId, dto)
      : this.empresasService.createDet(dto);

    obs.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.msgs.add({ severity: 'success', summary: 'Guardado', detail: 'Dato guardado correctamente' });
        this.savingDet.set(false);
        this.detForm.reset({ tipo: 'RTN', descripcion: '' });
        this.detEditando.set(null);
        this.loadDet(this.empresaSeleccionada()!.empresaId);
      },
      error: (err: any) => {
        this.savingDet.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'No se pudo guardar' });
      },
    });
  }

  editarDet(det: EmpresaDet) {
    this.detEditando.set(det);
    this.detForm.patchValue({ tipo: det.tipo, descripcion: det.descripcion });
  }

  eliminarDet(det: EmpresaDet) {
    this.confirm.confirm({
      message: '¿Eliminar este registro?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: { label: 'Cancelar', severity: 'secondary', variant: 'text', size: 'small', rounded: true },
      acceptButtonProps: { label: 'Eliminar', severity: 'danger', variant: 'text', size: 'small', rounded: true },
      accept: () => {
        this.empresasService.removeDet(det.empresasdetId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => {
            this.msgs.add({ severity: 'success', summary: 'Eliminado', detail: 'Dato eliminado' });
            this.loadDet(this.empresaSeleccionada()!.empresaId);
          },
          error: (err: any) => this.msgs.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'No se pudo eliminar' }),
        });
      },
    });
  }

  cancelarDet() {
    this.detEditando.set(null);
    this.detForm.reset({ tipo: 'RTN', descripcion: '' });
  }

  // ==================================================
  //  SUCURSALES
  // ==================================================

  loadSucursales(empresaId: number) {
    this.loadingSuc.set(true);
    this.empresasService.getAllSucursales(empresaId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.sucursales.set(data ?? []);
        this.loadingSuc.set(false);
      },
      error: () => {
        this.sucursales.set([]);
        this.loadingSuc.set(false);
      },
    });
  }

  guardarSucursal() {
    if (this.sucForm.invalid || !this.empresaSeleccionada()) return;
    this.savingSuc.set(true);
    const dto = { ...this.sucForm.value, empresaId: this.empresaSeleccionada()!.empresaId } as Partial<Sucursal>;
    const editando = this.sucEditando();

    const obs = editando
      ? this.empresasService.updateSucursal(editando.idsucursal, dto)
      : this.empresasService.createSucursal(dto);

    obs.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.msgs.add({ severity: 'success', summary: 'Guardada', detail: 'Sucursal guardada correctamente' });
        this.savingSuc.set(false);
        this.sucForm.reset({ descripcion: '', sn_activo: 'S' });
        this.sucEditando.set(null);
        this.loadSucursales(this.empresaSeleccionada()!.empresaId);
      },
      error: (err: any) => {
        this.savingSuc.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'No se pudo guardar' });
      },
    });
  }

  editarSuc(suc: Sucursal) {
    this.sucEditando.set(suc);
    this.sucForm.patchValue({ descripcion: suc.descripcion, sn_activo: suc.sn_activo });
  }

  cancelarSuc() {
    this.sucEditando.set(null);
    this.sucForm.reset({ descripcion: '', sn_activo: 'S' });
  }

  // ==================================================
  //  LOGO
  // ==================================================

  loadLogo(empresaId: number) {
    this.empresasService.getLogo(empresaId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.logo.set(data);
        this.logoPreview.set(data?.img || null);
      },
      error: () => {
        this.logo.set(null);
        this.logoPreview.set(null);
      },
    });
  }

  onLogoSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    this.logoFile = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.logoPreview.set(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  guardarLogo() {
    if (!this.empresaSeleccionada() || !this.logoPreview()) return;
    this.savingLogo.set(true);

    const dto: Partial<EmpresaLogo> = {
      img: this.logoPreview()!,
      empresaId: this.empresaSeleccionada()!.empresaId,
    };

    const obs = this.logo()
      ? this.empresasService.updateLogo(this.logo()!.tempresaslogoId, { img: dto.img })
      : this.empresasService.createLogo(dto);

    obs.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.msgs.add({ severity: 'success', summary: 'Guardado', detail: 'Logo guardado correctamente' });
        this.savingLogo.set(false);
        if (!this.logo() && res) this.logo.set(res);
      },
      error: (err: any) => {
        this.savingLogo.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'No se pudo guardar el logo' });
      },
    });
  }

  eliminarLogo() {
    if (!this.logo()) return;
    this.confirm.confirm({
      message: '¿Eliminar el logo de la empresa?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: { label: 'Cancelar', severity: 'secondary', variant: 'text', size: 'small', rounded: true },
      acceptButtonProps: { label: 'Eliminar', severity: 'danger', variant: 'text', size: 'small', rounded: true },
      accept: () => {
        this.empresasService.removeLogo(this.logo()!.tempresaslogoId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => {
            this.msgs.add({ severity: 'success', summary: 'Eliminado', detail: 'Logo eliminado' });
            this.logo.set(null);
            this.logoPreview.set(null);
            this.logoFile = null;
          },
          error: (err: any) => this.msgs.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'No se pudo eliminar' }),
        });
      },
    });
  }

  // ==================================================
  //  IMPRESORAS
  // ==================================================

  loadImpresoras(empresaId: number) {
    this.loadingImp.set(true);
    this.empresasService.getAllImpresoras(empresaId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.impresoras.set(data ?? []);
        this.loadingImp.set(false);
      },
      error: () => {
        this.impresoras.set([]);
        this.loadingImp.set(false);
      },
    });
  }

  guardarImpresora() {
    if (this.impForm.invalid || !this.empresaSeleccionada()) return;
    this.savingImp.set(true);
    const dto = { ...this.impForm.value, empresaId: this.empresaSeleccionada()!.empresaId } as Partial<Impresora>;
    const editando = this.impEditando();

    const obs = editando
      ? this.empresasService.updateImpresora(editando.timpresorasId, dto)
      : this.empresasService.createImpresora(dto);

    obs.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.msgs.add({ severity: 'success', summary: 'Guardada', detail: 'Impresora guardada correctamente' });
        this.savingImp.set(false);
        this.impForm.reset({ descripcion: '', formato: 'TICKET', driver: '', puerto: '', modo_correlativo: 'A', Idsucursal: null });
        this.impEditando.set(null);
        this.loadImpresoras(this.empresaSeleccionada()!.empresaId);
      },
      error: (err: any) => {
        this.savingImp.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'No se pudo guardar' });
      },
    });
  }

  editarImp(imp: Impresora) {
    this.impEditando.set(imp);
    this.impForm.patchValue({
      descripcion: imp.descripcion,
      formato: imp.formato,
      driver: imp.driver,
      puerto: imp.puerto,
      modo_correlativo: imp.modo_correlativo || 'A',
      Idsucursal: imp.Idsucursal,
    });
  }

  eliminarImp(imp: Impresora) {
    this.confirm.confirm({
      message: '¿Eliminar esta impresora?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: { label: 'Cancelar', severity: 'secondary', variant: 'text', size: 'small', rounded: true },
      acceptButtonProps: { label: 'Eliminar', severity: 'danger', variant: 'text', size: 'small', rounded: true },
      accept: () => {
        this.empresasService.removeImpresora(imp.timpresorasId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => {
            this.msgs.add({ severity: 'success', summary: 'Eliminada', detail: 'Impresora eliminada' });
            this.loadImpresoras(this.empresaSeleccionada()!.empresaId);
          },
          error: (err: any) => this.msgs.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'No se pudo eliminar' }),
        });
      },
    });
  }

  cancelarImp() {
    this.impEditando.set(null);
    this.impForm.reset({ descripcion: '', formato: 'TICKET', driver: '', puerto: '', modo_correlativo: 'A', Idsucursal: null });
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

  getRtn(): string {
    return this.empresaDet().find(d => d.tipo === 'RTN')?.descripcion || '-';
  }

  getTelefono(): string {
    return this.empresaDet().find(d => d.tipo === 'TELEFONO')?.descripcion || '-';
  }

  getSucursalNombre(idsucursal: number): string {
    return this.sucursales().find(s => s.idsucursal === idsucursal)?.descripcion || `Suc. ${idsucursal}`;
  }

  // Validación de RTN hondureño (14 dígitos)
  validarRtn(control: AbstractControl): ValidationErrors | null {
    const val = control.value?.replace(/[\s\-]/g, '');
    if (!val) return null;
    if (!/^\d{14}$/.test(val)) return { rtnInvalido: true };
    return null;
  }
}
