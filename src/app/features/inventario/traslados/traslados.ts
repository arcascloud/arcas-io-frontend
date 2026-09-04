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
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ApiService } from '../../../core/services/api.service';
import { BodegasService } from '../../../core/services/bodegas.service';
import { ProductosService } from '../../../core/services/productos.service';
import { Bodega, Producto } from '../../../core/models/inventario.models';
import { ProductosHelperList } from '../../helpers/productos';
import { FooterHelper } from '../../helpers/footer';

@Component({
  selector: 'app-traslados',
  standalone: true,
  providers: [DialogService],
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    TableModule, ButtonModule, InputTextModule, InputNumberModule,
    SelectModule, TagModule, ToastModule, ConfirmDialogModule, TooltipModule,
  ],
  templateUrl: './traslados.html',
  styleUrl: './traslados.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Traslados implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private bodegasService = inject(BodegasService);
  private productosService = inject(ProductosService);
  private msgs = inject(MessageService);
  private confirm = inject(ConfirmationService);
  private destroyRef = inject(DestroyRef);
  private dialogService = inject(DialogService);

  ref: DynamicDialogRef | undefined;

  private pathMae = '/inventario/traslados-mae';
  private pathDet = '/inventario/traslados-mae/det';

  traslados = signal<any[]>([]);
  detalles = signal<any[]>([]);
  bodegas = signal<Bodega[]>([]);
  productos = signal<Producto[]>([]);

  seleccionado = signal<any | null>(null);
  cargando = signal(false);
  cargandoDet = signal(false);
  guardando = signal(false);

  codBusqueda = signal('');

  formMae = this.fb.group({
    bodegaOrigenId: [null as number | null, Validators.required],
    bodegaDestinoId: [null as number | null, Validators.required],
    observaciones: [''],
  });

  formDet = this.fb.group({
    codbarra: ['', Validators.required],
    productoId: [null as number | null],
    descripcion: [''],
    cantidad: [1, [Validators.required, Validators.min(0.01)]],
    costoUnitario: [0],
  });

  ngOnInit() {
    this.cargarTraslados();
    this.cargarBodegas();
    this.cargarProductos();
  }

  cargarTraslados() {
    this.cargando.set(true);
    this.api.get<any[]>(this.pathMae).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => { this.traslados.set(data || []); this.cargando.set(false); },
      error: () => { this.cargando.set(false); this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los traslados' }); },
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

  seleccionar(traslado: any) {
    this.seleccionado.set(traslado);
    this.cargarDetalles(traslado.invtrasladomaeId);
  }

  cargarDetalles(maeId: number) {
    this.cargandoDet.set(true);
    this.api.get<any[]>(`${this.pathMae}/${maeId}/det`).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => { this.detalles.set(data || []); this.cargandoDet.set(false); },
      error: () => { this.cargandoDet.set(false); this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los items' }); },
    });
  }

  volver() {
    this.seleccionado.set(null);
    this.detalles.set([]);
  }

  nuevoMae() {
    this.formMae.reset({ bodegaOrigenId: null, bodegaDestinoId: null, observaciones: '' });
    this.formDet.reset({ codbarra: '', productoId: null, descripcion: '', cantidad: 1, costoUnitario: 0 });
    this.codBusqueda.set('');
    this.detalles.set([]);
    this.seleccionado.set({ invtrasladomaeId: 0, sn_procesado: 'N', sn_anulado: 'N', nroreferencia: '' });
  }

  guardarMae() {
    if (this.formMae.invalid) return;
    if (this.formMae.value.bodegaOrigenId === this.formMae.value.bodegaDestinoId) {
      this.msgs.add({ severity: 'error', summary: 'Error', detail: 'Bodega origen y destino no pueden ser iguales' });
      return;
    }
    const val = this.formMae.value;
    this.guardando.set(true);
    this.api.post<any>(this.pathMae, {
      bodegaOrigenId: val.bodegaOrigenId,
      bodegaDestinoId: val.bodegaDestinoId,
      observaciones: val.observaciones || '',
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.guardando.set(false);
        this.msgs.add({ severity: 'success', summary: 'Creado', detail: 'Traslado creado' });
        this.seleccionado.set(res);
        this.cargarTraslados();
      },
      error: (err) => { this.guardando.set(false); this.msgs.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo crear' }); },
    });
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
        costoUnitario: prod.cstounit || 0,
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
    if (!mae || !mae.invtrasladomaeId) {
      this.msgs.add({ severity: 'warn', summary: 'Atención', detail: 'Primero guarde el encabezado del traslado' });
      return;
    }
    this.guardando.set(true);
    this.api.post<any>(this.pathDet, {
      invtrasladomaeId: mae.invtrasladomaeId,
      codbarra: prod.codbarra,
      productoId: prod.produtoId,
      descripcion: prod.descripcion,
      cantidad: 1,
      costoUnitario: prod.cstounit || 0,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.guardando.set(false);
        this.msgs.add({ severity: 'success', summary: 'Agregado', detail: prod.descripcion });
        this.cargarDetalles(mae.invtrasladomaeId);
      },
      error: (err) => { this.guardando.set(false); this.msgs.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo agregar' }); },
    });
  }

  agregarItem() {
    if (this.formDet.invalid) return;
    const mae = this.seleccionado();
    if (!mae || !mae.invtrasladomaeId) {
      this.msgs.add({ severity: 'warn', summary: 'Atención', detail: 'Primero guarde el encabezado del traslado' });
      return;
    }
    const val = this.formDet.value;
    this.guardando.set(true);
    this.api.post<any>(this.pathDet, {
      invtrasladomaeId: mae.invtrasladomaeId,
      codbarra: val.codbarra,
      productoId: val.productoId,
      descripcion: val.descripcion,
      cantidad: val.cantidad,
      costoUnitario: val.costoUnitario,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.guardando.set(false);
        this.msgs.add({ severity: 'success', summary: 'Agregado', detail: 'Item agregado' });
        this.formDet.reset({ codbarra: '', productoId: null, descripcion: '', cantidad: 1, costoUnitario: 0 });
        this.codBusqueda.set('');
        this.cargarDetalles(mae.invtrasladomaeId);
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
        this.api.delete<any>(this.pathDet, row.invtrasladodetId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => {
            this.msgs.add({ severity: 'success', summary: 'Eliminado' });
            this.cargarDetalles(this.seleccionado()!.invtrasladomaeId);
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
      message: `¿Procesar traslado #${mae.invtrasladomaeId}? Se registrará salida en bodega origen y entrada en bodega destino.`,
      header: 'Procesar traslado',
      acceptLabel: 'Procesar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.confirm.close();
        this.api.post<any>(`${this.pathMae}/${mae.invtrasladomaeId}/procesar`, {}).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: (res) => {
            this.msgs.add({ severity: 'success', summary: 'Procesado', detail: res?.message || 'Traslado procesado' });
            this.cargarTraslados();
            this.cargarDetalles(mae.invtrasladomaeId);
          },
          error: (err) => this.msgs.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo procesar' }),
        });
      },
      reject: () => this.confirm.close(),
    });
  }

  anularTraslado() {
    const mae = this.seleccionado();
    if (!mae) return;
    this.confirm.confirm({
      message: `¿Anular traslado #${mae.invtrasladomaeId}?`,
      header: 'Anular traslado',
      acceptLabel: 'Anular',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.confirm.close();
        this.api.post<any>(`${this.pathMae}/${mae.invtrasladomaeId}/anular`, {}).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: (res) => {
            this.msgs.add({ severity: 'success', summary: 'Anulado', detail: res?.message || 'Traslado anulado' });
            this.cargarTraslados();
            this.volver();
          },
          error: (err) => this.msgs.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo anular' }),
        });
      },
      reject: () => this.confirm.close(),
    });
  }

  nombreBodega(id: number): string {
    return this.bodegas().find(b => b.bodegaId === id)?.descripcion || `Bodega ${id}`;
  }

  moneda(n: number | undefined): string {
    return (n ?? 0).toLocaleString('es-HN', { style: 'currency', currency: 'HNL' });
  }

  totalTraslado(): number {
    return this.detalles().reduce((sum, d) => sum + (d.costoTotal || 0), 0);
  }
}
