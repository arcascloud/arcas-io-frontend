import { Component, inject, signal, OnInit, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { RequisicionInventarioService } from '../../../core/services/requisicion-inventario.service';
import { BodegasService } from '../../../core/services/bodegas.service';
import { ProductosService } from '../../../core/services/productos.service';
import { Bodega, Producto } from '../../../core/models/inventario.models';
import { ProductosHelperList } from '../../helpers/productos';
import { FooterHelper } from '../../helpers/footer';

@Component({
  selector: 'app-requisiciones',
  standalone: true,
  providers: [DialogService],
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    TableModule, ButtonModule, InputTextModule, InputNumberModule,
    SelectModule, TagModule, ToastModule, ConfirmDialogModule, TooltipModule,
    DatePickerModule, TextareaModule,
  ],
  templateUrl: './requisiciones.html',
  styleUrl: './requisiciones.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Requisiciones implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(RequisicionInventarioService);
  private bodegasService = inject(BodegasService);
  private productosService = inject(ProductosService);
  private msgs = inject(MessageService);
  private confirm = inject(ConfirmationService);
  private destroyRef = inject(DestroyRef);
  private dialogService = inject(DialogService);

  ref: DynamicDialogRef | undefined;

  requisiciones = signal<any[]>([]);
  detalles = signal<any[]>([]);
  bodegas = signal<Bodega[]>([]);
  productos = signal<Producto[]>([]);

  seleccionado = signal<any | null>(null);
  cargando = signal(false);
  cargandoDet = signal(false);
  guardando = signal(false);

  codBusqueda = signal('');

  prioridades = signal<{ label: string; value: string }[]>([
    { label: 'Baja', value: 'B' },
    { label: 'Media', value: 'M' },
    { label: 'Alta', value: 'A' },
    { label: 'Urgente', value: 'U' },
  ]);

  formMae = this.fb.group({
    bodegaOrigenId: [null as number | null, Validators.required],
    bodegaDestinoId: [null as number | null, Validators.required],
    concepto: ['', Validators.required],
    prioridad: ['M', Validators.required],
    fechaEntrega: [null as Date | null],
    observaciones: [''],
  });

  formDet = this.fb.group({
    codbarra: ['', Validators.required],
    productoId: [null as number | null],
    descripcion: [''],
    cantidadSolicitada: [1, [Validators.required, Validators.min(0.01)]],
  });

  ngOnInit() {
    this.cargarRequisiciones();
    this.cargarBodegas();
    this.cargarProductos();
  }

  cargarRequisiciones() {
    this.cargando.set(true);
    this.service.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => { this.requisiciones.set(data || []); this.cargando.set(false); },
      error: () => { this.cargando.set(false); this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las requisiciones' }); },
    });
  }

  cargarBodegas() {
    this.bodegasService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => this.bodegas.set(data || []),
    });
  }

  cargarProductos() {
    this.productosService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => this.productos.set(data || []),
    });
  }

  seleccionar(req: any) {
    this.seleccionado.set(req);
    this.formMae.patchValue({
      bodegaOrigenId: req.bodegaOrigenId || null,
      bodegaDestinoId: req.bodegaDestinoId || null,
      concepto: req.concepto || '',
      prioridad: req.prioridad || 'M',
      fechaEntrega: req.fechaEntrega ? new Date(req.fechaEntrega) : null,
      observaciones: req.observaciones || '',
    });
    this.cargarDetalles(req.invreqmaeid);
  }

  cargarDetalles(maeId: number) {
    this.cargandoDet.set(true);
    this.service.getDet(maeId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => { this.detalles.set(data || []); this.cargandoDet.set(false); },
      error: () => { this.cargandoDet.set(false); this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los items' }); },
    });
  }

  volver() {
    this.seleccionado.set(null);
    this.detalles.set([]);
  }

  nuevoMae() {
    this.formMae.reset({ bodegaOrigenId: null, bodegaDestinoId: null, concepto: '', prioridad: 'M', fechaEntrega: null, observaciones: '' });
    this.formDet.reset({ codbarra: '', productoId: null, descripcion: '', cantidadSolicitada: 1 });
    this.codBusqueda.set('');
    this.detalles.set([]);
    this.seleccionado.set({ invreqmaeid: 0, sn_procesado: 'N', sn_anulado: 'N', sn_estado: 'P', concepto: '' });
  }

  guardarMae() {
    if (this.formMae.invalid) return;
    const val = this.formMae.value;
    if (val.bodegaOrigenId === val.bodegaDestinoId) {
      this.msgs.add({ severity: 'warn', summary: 'Bodegas', detail: 'La bodega origen y destino deben ser diferentes' });
      return;
    }
    this.guardando.set(true);
    this.service.create({
      bodegaOrigenId: val.bodegaOrigenId || 0,
      bodegaDestinoId: val.bodegaDestinoId || 0,
      concepto: val.concepto || '',
      prioridad: (val.prioridad || 'M') as 'B' | 'M' | 'A' | 'U',
      fechaEntrega: val.fechaEntrega ? val.fechaEntrega.toISOString().slice(0, 10) : null,
      observaciones: val.observaciones || '',
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.guardando.set(false);
        this.msgs.add({ severity: 'success', summary: 'Creada', detail: 'Requisición creada' });
        this.seleccionado.set(res);
        this.cargarRequisiciones();
      },
      error: (err) => { this.guardando.set(false); this.msgs.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo crear' }); },
    });
  }

  onCodBarraInput(valor: string) {
    this.codBusqueda.set(valor);
    if (valor.length >= 12) {
      this.buscarProducto();
    }
  }

  buscarProducto() {
    const q = this.codBusqueda().trim();
    if (!q) return;
    const prod = this.productos().find(p => p.codbarra === q);
    if (prod) {
      this.formDet.patchValue({
        productoId: prod.produtoId,
        codbarra: prod.codbarra,
        descripcion: prod.descripcion,
      });
    } else {
      this.msgs.add({ severity: 'warn', summary: 'No encontrado', detail: 'Producto no encontrado por código de barras' });
    }
  }

  showHelperProductos() {
    this.ref = this.dialogService.open(ProductosHelperList, {
      header: 'Seleccionar un producto',
      width: '50vw',
      modal: true,
      contentStyle: { overflow: 'auto' },
      breakpoints: { '960px': '75vw', '640px': '90vw' },
      templates: { footer: FooterHelper },
    });
    this.ref.onClose.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((data: any) => {
      if (data && 'codbarra' in data) {
        this.agregarDirecto(data);
      }
    });
  }

  agregarDirecto(prod: any) {
    const mae = this.seleccionado();
    if (!mae || !mae.invreqmaeid) {
      this.msgs.add({ severity: 'warn', summary: 'Atención', detail: 'Primero guarde el encabezado de la requisición' });
      return;
    }
    this.guardando.set(true);
    this.service.createDet({
      invreqmaeid: mae.invreqmaeid,
      codbarra: prod.codbarra,
      cantidadSolicitada: 1,
      empresaId: mae.empresaId,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.guardando.set(false);
        this.msgs.add({ severity: 'success', summary: 'Agregado', detail: prod.descripcion });
        this.cargarDetalles(mae.invreqmaeid);
      },
      error: (err) => { this.guardando.set(false); this.msgs.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo agregar' }); },
    });
  }

  agregarItem() {
    if (this.formDet.invalid) return;
    const mae = this.seleccionado();
    if (!mae || !mae.invreqmaeid) {
      this.msgs.add({ severity: 'warn', summary: 'Atención', detail: 'Primero guarde el encabezado de la requisición' });
      return;
    }
    const val = this.formDet.value;
    this.guardando.set(true);
    this.service.createDet({
      invreqmaeid: mae.invreqmaeid,
      codbarra: val.codbarra || '',
      cantidadSolicitada: val.cantidadSolicitada || 0,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.guardando.set(false);
        this.msgs.add({ severity: 'success', summary: 'Agregado', detail: 'Item agregado' });
        this.formDet.reset({ codbarra: '', productoId: null, descripcion: '', cantidadSolicitada: 1 });
        this.codBusqueda.set('');
        this.cargarDetalles(mae.invreqmaeid);
      },
      error: (err) => { this.guardando.set(false); this.msgs.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo agregar' }); },
    });
  }

  eliminarItem(row: any) {
    this.confirm.confirm({
      message: `¿Eliminar item "${row.descripcion || row.codbarra}"?`,
      header: 'Confirmar',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.confirm.close();
        this.service.removeDet(row.invreqdetid).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => {
            this.msgs.add({ severity: 'success', summary: 'Eliminado' });
            this.cargarDetalles(this.seleccionado()!.invreqmaeid);
          },
          error: (err) => this.msgs.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo eliminar' }),
        });
      },
      reject: () => this.confirm.close(),
    });
  }

  procesar() {
    const mae = this.seleccionado();
    if (!mae) return;
    this.confirm.confirm({
      message: `¿Aprobar requisición #${mae.invreqmaeid}?`,
      header: 'Aprobar requisición',
      acceptLabel: 'Aprobar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.confirm.close();
        this.service.procesar(mae.invreqmaeid).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: (res) => {
            this.msgs.add({ severity: 'success', summary: 'Aprobada', detail: res?.message || 'Requisición aprobada' });
            this.cargarRequisiciones();
            this.cargarDetalles(mae.invreqmaeid);
          },
          error: (err) => this.msgs.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo procesar' }),
        });
      },
      reject: () => this.confirm.close(),
    });
  }

  anular() {
    const mae = this.seleccionado();
    if (!mae) return;
    this.confirm.confirm({
      message: `¿Anular requisición #${mae.invreqmaeid}?`,
      header: 'Anular requisición',
      acceptLabel: 'Anular',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.confirm.close();
        this.service.anular(mae.invreqmaeid).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: (res) => {
            this.msgs.add({ severity: 'success', summary: 'Anulada', detail: res?.message || 'Requisición anulada' });
            this.cargarRequisiciones();
            this.volver();
          },
          error: (err) => this.msgs.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo anular' }),
        });
      },
      reject: () => this.confirm.close(),
    });
  }

  esNuevo(): boolean {
    return !this.seleccionado()?.invreqmaeid;
  }

  esPendiente(): boolean {
    return this.seleccionado()?.sn_estado === 'P';
  }

  nombreBodega(id: number): string {
    return this.bodegas().find(b => b.bodegaId === id)?.descripcion || `Bodega ${id}`;
  }

  prioridadLabel(p: string): string {
    const map: Record<string, string> = { B: 'Baja', M: 'Media', A: 'Alta', U: 'Urgente' };
    return map[p] || p;
  }

  prioridadSeverity(p: string): string {
    const map: Record<string, string> = { B: 'info', M: 'warn', A: 'danger', U: 'danger' };
    return map[p] || 'secondary';
  }

  estadoLabel(estado: string): string {
    const map: Record<string, string> = { P: 'Pendiente', A: 'Aprobada', R: 'Recibida', X: 'Anulada' };
    return map[estado] || estado;
  }

  estadoSeverity(estado: string): string {
    const map: Record<string, string> = { P: 'warn', A: 'success', R: 'info', X: 'danger' };
    return map[estado] || 'secondary';
  }
}
