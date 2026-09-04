import { Component, inject, signal, OnInit, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToolbarModule } from 'primeng/toolbar';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { CxpService } from '../../../core/services/cxp.service';
import { BodegasService } from '../../../core/services/bodegas.service';
import { ProductosService } from '../../../core/services/productos.service';
import { CatalogoParametrosService } from '../../../core/services/catalogo-parametros.service';
import { AuthService } from '../../../core/services/auth.service';
import { CompraMae, CompraDet, Proveedor, Producto, Bodega } from '../../../core/models/inventario.models';

@Component({
  selector: 'app-consulta-compras',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    TableModule, ButtonModule, InputTextModule, InputNumberModule,
    DialogModule, TagModule, ToastModule, ConfirmDialogModule,
    ToolbarModule, SelectModule, TooltipModule,
  ],
  templateUrl: './consulta-compras.html',
  styleUrl: './consulta-compras.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsultaCompras implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(CxpService);
  private bodegasService = inject(BodegasService);
  private productosService = inject(ProductosService);
  private catalogService = inject(CatalogoParametrosService);
  private auth = inject(AuthService);
  private msgs = inject(MessageService);
  private confirm = inject(ConfirmationService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);

  compras = signal<CompraMae[]>([]);
  detalles = signal<CompraDet[]>([]);
  proveedores = signal<Proveedor[]>([]);
  bodegas = signal<Bodega[]>([]);
  productos = signal<Producto[]>([]);
  documentosFiscales = signal<{ label: string; value: number }[]>([]);
  monedas = signal<{ label: string; value: number }[]>([]);

  seleccionado = signal<CompraMae | null>(null);
  cargando = signal(false);
  cargandoDet = signal(false);

  dialogMae = signal(false);
  dialogDet = signal(false);
  esEdicion = signal(false);

  totalFactura = signal(0);

  formMae = this.fb.group({
    proveedorId: [null as number | null, Validators.required],
    bodegaId: [null as number | null, Validators.required],
    TipoCompra: ['F' as 'F' | 'O', Validators.required],
    documentoId: [null as number | null],
    monedaId: [null as number | null, Validators.required],
    nroreferencia: [''],
    subtotal: [0],
    descuento: [0],
    impuesto: [0],
    total: [0],
  });

  formDet = this.fb.group({
    productoId: [null as number | null, Validators.required],
    cantidad: [1, [Validators.required, Validators.min(0.01)]],
    precio: [0, [Validators.required, Validators.min(0.01)]],
  });

  ngOnInit() {
    this.cargarCompras();
    this.cargarProveedores();
    this.cargarBodegas();
    this.cargarProductos();
    this.cargarDocumentosFiscales();
    this.cargarMonedas();
  }

  cargarCompras() {
    this.cargando.set(true);
    this.service.getCompras().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.compras.set(data || []);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las compras' });
      },
    });
  }

  cargarProveedores() {
    this.service.getProveedores().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => this.proveedores.set(data || []),
    });
  }

  cargarBodegas() {
    this.bodegasService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => this.bodegas.set(data?.value || data || []),
    });
  }

  cargarProductos() {
    this.productosService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => this.productos.set(data?.value || data || []),
    });
  }

  cargarDocumentosFiscales() {
    this.catalogService.getAll<any>('/parametros/tcotipodocumentofiscal').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        const user = this.auth.currentUser();
        const filtered = (res || []).filter((r: any) => {
          const activo = r.sn_activo === 'S';
          const mismaEmpresa = user?.empresaId ? Number(r.empresaId) === Number(user.empresaId) : true;
          return activo && mismaEmpresa;
        });
        this.documentosFiscales.set(filtered.map((r: any) => ({
          label: r.descripcion,
          value: r.tipodocumentofiscalId,
        })));
      },
    });
  }

  cargarMonedas() {
    this.catalogService.getAll<any>('/parametros/monedas').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        const user = this.auth.currentUser();
        const filtered = (res || []).filter((r: any) => {
          const mismaEmpresa = user?.empresaId ? Number(r.empresaId) === Number(user.empresaId) : true;
          return mismaEmpresa;
        });
        this.monedas.set(filtered.map((r: any) => ({
          label: r.descripcion,
          value: r.monedaId,
        })));
      },
    });
  }

  seleccionar(compra: CompraMae) {
    this.seleccionado.set(compra);
    this.cargarDetalles(compra.compraId);
  }

  cargarDetalles(compraId: number) {
    this.cargandoDet.set(true);
    this.service.getDetallesByCompra(compraId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.detalles.set(data || []);
        this.cargandoDet.set(false);
      },
      error: () => {
        this.cargandoDet.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los detalles' });
      },
    });
  }

  volver() {
    this.seleccionado.set(null);
    this.detalles.set([]);
  }

  nuevoMae() {
    this.router.navigate(['/cxp/compras']);
  }

  guardarMae() {
    if (this.formMae.invalid) return;
    const val = this.formMae.value;
    const payload: any = {
      ...val,
      sn_pagada: 'N',
      sn_anulada: 'N',
    };

    this.service.createCompra(payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: any) => {
        this.msgs.add({ severity: 'success', summary: 'Guardado', detail: 'Compra creada exitosamente' });
        this.dialogMae.set(false);
        this.cargarCompras();
        if (res?.compraId) {
          this.seleccionar(res);
        }
      },
      error: (err) => {
        const detail = err.error?.message || 'No se pudo crear la compra';
        this.msgs.add({ severity: 'error', summary: 'Error', detail });
      },
    });
  }

  nuevoDet() {
    this.formDet.reset({ productoId: null, cantidad: 1, precio: 0 });
    this.dialogDet.set(true);
  }

  guardarDet() {
    if (this.formDet.invalid) return;
    const val = this.formDet.value;
    const mae = this.seleccionado();
    if (!mae) return;

    const producto = this.productos().find(p => p.produtoId === val.productoId);
    const payload: any = {
      compraId: mae.compraId,
      bodegaId: mae.bodegaId,
      codbarra: producto?.codbarra || '',
      descripcion: producto?.descripcion || '',
      cantidad: val.cantidad || 1,
      precio: val.precio || 0,
      subtotal: (val.cantidad || 1) * (val.precio || 0),
      empresaId: mae.empresaId,
    };

    this.service.createCompraDet(payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.msgs.add({ severity: 'success', summary: 'Guardado', detail: 'Item agregado' });
        this.dialogDet.set(false);
        this.cargarDetalles(mae.compraId);
      },
      error: (err) => this.msgs.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo guardar el item' }),
    });
  }

  eliminarDet(row: CompraDet) {
    this.confirm.confirm({
      message: `¿Eliminar item "${row.descripcion || row.codbarra}"?`,
      header: 'Confirmar',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.confirm.close();
        this.service.deleteCompraDet(row.cxpcomprasdetId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => {
            this.msgs.add({ severity: 'success', summary: 'Eliminado' });
            this.cargarDetalles(this.seleccionado()!.compraId);
          },
          error: (err) => {
            this.msgs.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo eliminar' });
          },
        });
      },
      reject: () => {
        this.confirm.close();
      },
    });
  }

  procesar() {
    const mae = this.seleccionado();
    if (!mae) return;
    this.confirm.confirm({
      message: `¿Procesar compra #${mae.compraId}? Se registrará entrada en kardex y movimiento CxP (débito).`,
      header: 'Procesar compra',
      acceptLabel: 'Procesar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.confirm.close();
        this.service.procesarCompra(mae.compraId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: (res: any) => {
            this.msgs.add({ severity: 'success', summary: 'Procesada', detail: res?.message || 'Compra procesada' });
            this.cargarCompras();
            this.cargarDetalles(mae.compraId);
          },
          error: (err) => this.msgs.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo procesar' }),
        });
      },
      reject: () => {
        this.confirm.close();
      },
    });
  }

  anularCompra(compra: CompraMae) {
    this.confirm.confirm({
      message: `¿Anular compra #${compra.compraId}? Se reversará el kardex y se marcará el movimiento CxP como anulado.`,
      header: 'Anular compra',
      acceptLabel: 'Anular',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.confirm.close();
        this.service.anularCompra(compra.compraId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: (res: any) => {
            this.msgs.add({ severity: 'success', summary: 'Anulada', detail: res?.message || 'Compra anulada' });
            this.cargarCompras();
            if (this.seleccionado()?.compraId === compra.compraId) {
              this.volver();
            }
          },
          error: (err) => this.msgs.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo anular' }),
        });
      },
      reject: () => {
        this.confirm.close();
      },
    });
  }

  nombreProveedor(id: number): string {
    const p = this.proveedores().find(x => x.proveedorId === id);
    return p ? `${p.nombres} ${p.apellidos}` : `Proveedor #${id}`;
  }

  nombreBodega(id: number): string {
    return this.bodegas().find(b => b.bodegaId === id)?.descripcion || `Bodega ${id}`;
  }

  nombreProducto(id: number): string {
    return this.productos().find(p => p.produtoId === id)?.descripcion || `Producto #${id}`;
  }

  moneda(val: number): string {
    if (val == null || isNaN(val)) return 'L 0.00';
    return val.toLocaleString('es-HN', { style: 'currency', currency: 'HNL' });
  }

  actualizarTotales() {
    const sub = this.detalles().reduce((sum, d) => sum + (d.subtotal || 0), 0);
    this.totalFactura.set(sub);
  }
}
