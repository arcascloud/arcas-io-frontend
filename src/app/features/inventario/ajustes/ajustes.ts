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
import { AjusteInventarioService } from '../../../core/services/ajuste-inventario.service';
import { BodegasService } from '../../../core/services/bodegas.service';
import { ProductosService } from '../../../core/services/productos.service';
import { Bodega, Producto } from '../../../core/models/inventario.models';
import { ProductosHelperList } from '../../helpers/productos';
import { FooterHelper } from '../../helpers/footer';

@Component({
  selector: 'app-ajustes',
  standalone: true,
  providers: [DialogService],
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    TableModule, ButtonModule, InputTextModule, InputNumberModule,
    SelectModule, TagModule, ToastModule, ConfirmDialogModule, TooltipModule,
  ],
  templateUrl: './ajustes.html',
  styleUrl: './ajustes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Ajustes implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(AjusteInventarioService);
  private bodegasService = inject(BodegasService);
  private productosService = inject(ProductosService);
  private msgs = inject(MessageService);
  private confirm = inject(ConfirmationService);
  private destroyRef = inject(DestroyRef);
  private dialogService = inject(DialogService);

  ref: DynamicDialogRef | undefined;

  ajustes = signal<any[]>([]);
  detalles = signal<any[]>([]);
  bodegas = signal<Bodega[]>([]);
  productos = signal<Producto[]>([]);

  seleccionado = signal<any | null>(null);
  cargando = signal(false);
  cargandoDet = signal(false);
  guardando = signal(false);

  codBusqueda = signal('');

  formMae = this.fb.group({
    concepto: ['', Validators.required],
    bodegaId: [null as number | null, Validators.required],
    sn_entrada: ['S' as 'S' | 'N', Validators.required],
  });

  formDet = this.fb.group({
    codbarra: ['', Validators.required],
    productoId: [null as number | null],
    descripcion: [''],
    cantidad: [1, [Validators.required, Validators.min(0.01)]],
    costoUnitario: [0],
  });

  ngOnInit() {
    this.cargarAjustes();
    this.cargarBodegas();
    this.cargarProductos();
  }

  cargarAjustes() {
    this.cargando.set(true);
    this.service.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => { this.ajustes.set(data || []); this.cargando.set(false); },
      error: () => { this.cargando.set(false); this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los ajustes' }); },
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

  seleccionar(ajuste: any) {
    this.seleccionado.set(ajuste);
    this.formMae.patchValue({
      concepto: ajuste.concepto || '',
      bodegaId: ajuste.bodegaId || null,
      sn_entrada: ajuste.sn_entrada || 'S',
    });
    this.cargarDetalles(ajuste.invmovmaeid);
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
    this.formMae.reset({ concepto: '', bodegaId: null, sn_entrada: 'S' });
    this.formDet.reset({ codbarra: '', productoId: null, descripcion: '', cantidad: 1, costoUnitario: 0 });
    this.codBusqueda.set('');
    this.detalles.set([]);
    this.seleccionado.set({ invmovmaeid: 0, sn_procesado: 'N', sn_anulado: 'N', concepto: '', bodegaId: 0 });
  }

  guardarMae() {
    if (this.formMae.invalid) return;
    const val = this.formMae.value;
    this.guardando.set(true);
    this.service.create({
      concepto: val.concepto || '',
      bodegaId: val.bodegaId || 0,
      sn_entrada: val.sn_entrada || 'S',
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.guardando.set(false);
        this.msgs.add({ severity: 'success', summary: 'Creado', detail: 'Ajuste creado' });
        this.seleccionado.set(res);
        this.cargarAjustes();
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
    if (!mae || !mae.invmovmaeid) {
      this.msgs.add({ severity: 'warn', summary: 'Atención', detail: 'Primero guarde el encabezado del ajuste' });
      return;
    }
    this.guardando.set(true);
    this.service.createDet({
      invmovmaeid: mae.invmovmaeid,
      bodegaId: mae.bodegaId,
      codbarra: prod.codbarra,
      cantidad: 1,
      sn_entrada: mae.sn_entrada || 'S',
      empresaId: mae.empresaId,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.guardando.set(false);
        this.msgs.add({ severity: 'success', summary: 'Agregado', detail: prod.descripcion });
        this.cargarDetalles(mae.invmovmaeid);
      },
      error: (err) => { this.guardando.set(false); this.msgs.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo agregar' }); },
    });
  }

  agregarItem() {
    if (this.formDet.invalid) return;
    const mae = this.seleccionado();
    if (!mae || !mae.invmovmaeid) {
      this.msgs.add({ severity: 'warn', summary: 'Atención', detail: 'Primero guarde el encabezado del ajuste' });
      return;
    }
    const val = this.formDet.value;
    this.guardando.set(true);
    this.service.createDet({
      invmovmaeid: mae.invmovmaeid,
      bodegaId: mae.bodegaId,
      codbarra: val.codbarra || '',
      cantidad: val.cantidad || 0,
      sn_entrada: mae.sn_entrada || 'S',
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.guardando.set(false);
        this.msgs.add({ severity: 'success', summary: 'Agregado', detail: 'Item agregado' });
        this.formDet.reset({ codbarra: '', productoId: null, descripcion: '', cantidad: 1, costoUnitario: 0 });
        this.codBusqueda.set('');
        this.cargarDetalles(mae.invmovmaeid);
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
        this.service.removeDet(row.invmovdetid).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => {
            this.msgs.add({ severity: 'success', summary: 'Eliminado' });
            this.cargarDetalles(this.seleccionado()!.invmovmaeid);
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
    const tipo = mae.sn_entrada === 'S' ? 'entrada' : 'salida';
    this.confirm.confirm({
      message: `¿Procesar ajuste #${mae.invmovmaeid}? Se registrará como ${tipo} en kardex.`,
      header: 'Procesar ajuste',
      acceptLabel: 'Procesar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.confirm.close();
        this.service.procesar(mae.invmovmaeid).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: (res) => {
            this.msgs.add({ severity: 'success', summary: 'Procesado', detail: res?.message || 'Ajuste procesado' });
            this.cargarAjustes();
            this.cargarDetalles(mae.invmovmaeid);
          },
          error: (err) => this.msgs.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo procesar' }),
        });
      },
      reject: () => this.confirm.close(),
    });
  }

  todosProcesados(): boolean {
    return this.detalles().length > 0 && this.detalles().every(d => d.verificador === 1);
  }

  esNuevo(): boolean {
    return !this.seleccionado()?.invmovmaeid;
  }

  nombreBodega(id: number): string {
    return this.bodegas().find(b => b.bodegaId === id)?.descripcion || `Bodega ${id}`;
  }

  moneda(n: number | undefined): string {
    return (n ?? 0).toLocaleString('es-HN', { style: 'currency', currency: 'HNL' });
  }

  totalAjuste(): number {
    return this.detalles().reduce((sum, d) => sum + (d.costoTotal || 0), 0);
  }
}
