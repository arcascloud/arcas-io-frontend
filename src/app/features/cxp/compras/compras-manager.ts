import { Component, inject, signal, OnInit, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
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
import { AutoCompleteModule } from 'primeng/autocomplete';
import { MessageService, ConfirmationService } from 'primeng/api';
import { CxpService } from '../../../core/services/cxp.service';
import { BodegasService } from '../../../core/services/bodegas.service';
import { ProductosService } from '../../../core/services/productos.service';
import { CatalogoParametrosService } from '../../../core/services/catalogo-parametros.service';
import { AuthService } from '../../../core/services/auth.service';
import { EmpresasService } from '../../../core/services/empresas.service';
import { firstValueFrom } from 'rxjs';
import { CompraMae, CompraDet, Proveedor, Producto, Bodega } from '../../../core/models/inventario.models';
import { OcrDialog } from './ocr-dialog';
import { FacturaData } from '../../../core/utils/invoice-parser';
import { CheckboxModule } from 'primeng/checkbox';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-compras-manager',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    DialogModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    ToolbarModule,
    SelectModule,
    TooltipModule,
    AutoCompleteModule,
    OcrDialog,
    CheckboxModule,
    ScrollPanelModule,
    CardModule,
  ],
  templateUrl: './compras-manager.html',
  styleUrl: './compras-manager.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComprasManager implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(CxpService);
  private bodegasService = inject(BodegasService);
  private productosService = inject(ProductosService);
  private catalogService = inject(CatalogoParametrosService);
  private auth = inject(AuthService);
  private empresasService = inject(EmpresasService);
  private msgs = inject(MessageService);
  private confirm = inject(ConfirmationService);
  private destroyRef = inject(DestroyRef);

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
  itemsSeleccionados = signal<CompraDet[]>([]);
 
  dialogDet = signal(false);
  dialogProducto = signal(false);
  dialogOcr = signal(false);
  esEdicion = signal(false);
 
  totalFactura = signal(0);


  formMae = this.fb.group({
    proveedorId: [null as number | null, Validators.required],
    bodegaId: [null as number | null, Validators.required],
    TipoCompra: ['FCO' as 'FCO' | 'FCC' | 'ORC', Validators.required],
    documentoId: [null as number | null],
    monedaId: [null as number | null, Validators.required],
    nroreferencia: [''],
    subtotal: [0],
    descuento: [0],
    impuesto: [0],
    total: [0],
  });

  formDet = this.fb.group({
    codbarra: [''],
    descripcion: [''],
    productoId: [null as number | null],
    cantidad: [1, [Validators.required, Validators.min(0.01)]],
    precio: [0, [Validators.required, Validators.min(0.01)]],
    precioventa: [0],
    preciovtaId: [null as number | null],
  });

  itemEditando = signal<number | null>(null);

  impuestos = signal<{ label: string; value: number }[]>([]);
  preciosVta = signal<{ label: string; value: number }[]>([]);
  preciosVtaRaw = signal<any[]>([]);
  preciovtaDefaultId: number | null = null;
  preciovtaDefaultPorcentaje: number = 0;

  productosFiltrados: Producto[] = [];
  productoSeleccionado: Producto | null = null;
  
  formProducto = this.fb.group({
    codbarra: [''],
    descripcion: ['', Validators.required],
    cstounit: [0, Validators.required],
    precioventa: [0, Validators.required],
    categoriaId: [1, Validators.required],
    impuestoId: [null as number | null, Validators.required],
  });

  ngOnInit() {
    this.cargarCompras();
    this.cargarProveedores();
    this.cargarBodegas();
    this.cargarProductos();
    this.cargarDocumentosFiscales();
    this.cargarMonedas();
    this.cargarImpuestos();
    this.cargarPreciosVta();
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

  cargarImpuestos() {
    this.catalogService.getAll<any>('/parametros/impuestos').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.impuestos.set((res || []).map((r: any) => ({
          label: r.descripcion,
          value: r.impuestoId,
        })));
      },
    });
  }

  cargarPreciosVta() {
    this.catalogService.getAll<any>('/parametros/precios-vta').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        const raw = res || [];
        this.preciosVtaRaw.set(raw);
        this.preciosVta.set(raw.map((r: any) => ({
          label: r.descripcion,
          value: r.preciovtaId,
        })));
        const mayor = raw.reduce((max: any, r: any) => r.porcentaje > (max?.porcentaje ?? -Infinity) ? r : max, null);
        if (mayor) {
          this.preciovtaDefaultId = mayor.preciovtaId;
          this.preciovtaDefaultPorcentaje = mayor.porcentaje;
        }
      },
    });
  }

  seleccionar(compra: CompraMae) {
    this.seleccionado.set(compra);
    this.formMae.patchValue(compra);
    this.formDet.reset({ productoId: null, codbarra: '', descripcion: '', cantidad: 1, precio: 0, precioventa: 0, preciovtaId: this.preciovtaDefaultId });
    this.itemEditando.set(null);
    this.productoSeleccionado = null;
    this.cargarDetalles(compra.compraId);
  }

  cargarDetalles(compraId: number) {
    this.cargandoDet.set(true);
    this.service.getDetallesByCompra(compraId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.detalles.set((data || []).sort((a, b) => (b.nrofila || 0) - (a.nrofila || 0)));
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
    this.esEdicion.set(false);
    this.formMae.reset({
      TipoCompra: 'FCO',
      proveedorId: null,
      bodegaId: null,
      documentoId: null,
      monedaId: null,
      nroreferencia: '',
      subtotal: 0,
      descuento: 0,
      impuesto: 0,
      total: 0,
    });
    this.totalFactura.set(0);
    
    // Crear objeto dummy para disparar la vista de detalle
    this.seleccionado.set({
      compraId: 0,
      empresaId: this.auth.currentUser()?.empresaId || 0,
      fecharegistro: new Date().toISOString(),
      TipoCompra: 'FCO',
      bodegaId: 0,
      proveedorId: 0,
      documentoId: 0,
      subtotal: 0,
      descuento: 0,
      impuesto: 0,
      total: 0,
      sn_pagada: 'N',
      sn_contabilizada: 'N',
      sn_anulada: 'N',
      usuarioCreated: this.auth.currentUser()?.usuario || 'SYSTEM'
    } as CompraMae);
    this.detalles.set([]);
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
    this.formDet.reset({ productoId: null, codbarra: '', descripcion: '', cantidad: 1, precio: 0, precioventa: 0, preciovtaId: this.preciovtaDefaultId });
    this.itemEditando.set(null);
    this.productoSeleccionado = null;
    this.dialogDet.set(true);
  }


  guardarDet() {
    if (this.formDet.invalid) return;
    const val = this.formDet.value;
    const mae = this.seleccionado();
    if (!mae) return;

    let finalCodbarra = val.codbarra || '';
    if (this.productoSeleccionado) {
      if (typeof this.productoSeleccionado === 'string') {
        finalCodbarra = this.productoSeleccionado;
      } else if ((this.productoSeleccionado as any).codbarra) {
        finalCodbarra = (this.productoSeleccionado as any).codbarra;
      }
    }

    const payload: any = {
      compraId: mae.compraId,
      bodegaId: mae.bodegaId,
      codbarra: finalCodbarra,
      descripcion: val.descripcion || '',
      productoId: val.productoId || null,
      cantidad: val.cantidad || 1,
      precio: val.precio || 0,
      precioventa: val.precioventa || 0,
      preciovtaId: val.preciovtaId || null,
      subtotal: (val.cantidad || 1) * (val.precio || 0),
      empresaId: mae.empresaId,
    };

    const editId = this.itemEditando();
    if (editId) {
      this.service.updateCompraDet(editId, payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.msgs.add({ severity: 'success', summary: 'Actualizado', detail: 'Item actualizado' });
          this.formDet.reset({ productoId: null, codbarra: '', descripcion: '', cantidad: 1, precio: 0, precioventa: 0, preciovtaId: this.preciovtaDefaultId });
          this.itemEditando.set(null);
          this.productoSeleccionado = null;
          this.cargarDetalles(mae.compraId);
        },
        error: (err) => this.msgs.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo actualizar el item' }),
      });
    } else {
      this.service.createCompraDet(payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.msgs.add({ severity: 'success', summary: 'Guardado', detail: 'Item agregado' });
          this.formDet.reset({ productoId: null, codbarra: '', descripcion: '', cantidad: 1, precio: 0, precioventa: 0, preciovtaId: this.preciovtaDefaultId });
          this.productoSeleccionado = null;
          this.cargarDetalles(mae.compraId);
        },
        error: (err) => this.msgs.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo guardar el item' }),
      });
    }
  }

  editarItem(row: CompraDet) {
    this.itemEditando.set(row.cxpcomprasdetId);
    
    if (row.productoId) {
      const prod = this.productos().find(p => p.produtoId === row.productoId);
      // Si no encuentra el producto en caché, armamos un objeto para que el autocomplete lo muestre
      this.productoSeleccionado = prod || { produtoId: row.productoId, codbarra: row.codbarra, descripcion: row.descripcion } as any;
    } else if (row.codbarra) {
      // Si no hay producto asociado (ej. OCR o manual), asignamos el string del codbarra
      this.productoSeleccionado = row.codbarra as any;
    } else {
      this.productoSeleccionado = null;
    }

    this.formDet.patchValue({
      codbarra: row.codbarra || '',
      descripcion: row.descripcion || '',
      productoId: row.productoId || null,
      cantidad: row.cantidad,
      precio: row.precio,
      precioventa: row.precioventa || 0,
      preciovtaId: row.preciovtaId || null,
    });
  }

  cancelarEdicion() {
    this.itemEditando.set(null);
    this.productoSeleccionado = null;
    this.formDet.reset({ productoId: null, codbarra: '', descripcion: '', cantidad: 1, precio: 0, precioventa: 0, preciovtaId: this.preciovtaDefaultId });
  }

  onCodBarraSearch(event: any) {
    const termino = event.query;
    if (!termino || termino.length < 8) {
      this.productosFiltrados = [];
      return;
    }
    this.productosService.search(termino).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (productos) => this.productosFiltrados = productos || [],
      error: () => this.productosFiltrados = [],
    });
  }

  onProductoSelect(event: any) {
    const prod: Producto = event.value;
    this.productoSeleccionado = prod;
    this.formDet.patchValue({
      productoId: prod.produtoId,
      codbarra: prod.codbarra || '',
      descripcion: prod.descripcion,
    });
  }

  onCodBarraClear() {
    this.productoSeleccionado = null;
    this.formDet.patchValue({ productoId: null, codbarra: '', descripcion: '' });
  }

  onCodBarraBlur() {
    if (!this.productoSeleccionado) {
      this.formDet.patchValue({ productoId: null, codbarra: '', descripcion: '' });
    } else if (typeof this.productoSeleccionado === 'string') {
      this.formDet.patchValue({ codbarra: this.productoSeleccionado });
    }
  }

  onPrecioVtaChange(preciovtaId: number | null) {
    if (!preciovtaId) return;
    const precio = this.formDet.value.precio || 0;
    if (precio <= 0) return;

    this.service.getPrecioVta(preciovtaId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (pvta: any) => {
        if (pvta?.porcentaje != null) {
          const precioventa = Number(precio) * (1 + pvta.porcentaje / 100);
          this.formDet.patchValue({ precioventa: Math.round(precioventa * 100) / 100 });
        }
      },
    });
  }

  onPrecioCompraChange() {
    const preciovtaId = this.formDet.value.preciovtaId;
    if (preciovtaId) {
      this.onPrecioVtaChange(preciovtaId);
    }
  }


  guardarProducto() {
    if (this.formProducto.invalid) return;
    const val = this.formProducto.value;
    this.productosService.create({ ...val, sn_activo: 'S' } as any).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (nuevoProd) => {
        this.msgs.add({ severity: 'success', summary: 'Producto creado', detail: nuevoProd.descripcion });
        this.productos.update(lista => [...lista, nuevoProd]);
        this.dialogProducto.set(false);
        this.formDet.patchValue({ productoId: nuevoProd.produtoId });
      },
      error: (err) => this.msgs.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo crear el producto' }),
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

  eliminarSeleccionados() {
    const seleccionados = this.itemsSeleccionados();
    if (seleccionados.length === 0) return;

    this.confirm.confirm({
      message: `¿Eliminar ${seleccionados.length} item(s) seleccionado(s)?`,
      header: 'Eliminar múltiple',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.confirm.close();
        let eliminados = 0;
        for (const item of seleccionados) {
          this.service.deleteCompraDet(item.cxpcomprasdetId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: () => {
              eliminados++;
              if (eliminados === seleccionados.length) {
                this.msgs.add({ severity: 'success', summary: 'Eliminados', detail: `${eliminados} item(s) eliminado(s)` });
                this.itemsSeleccionados.set([]);
                this.cargarDetalles(this.seleccionado()!.compraId);
              }
            },
            error: (err) => {
              this.msgs.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo eliminar' });
            },
          });
        }
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
        this.ejecutarProcesar(mae);
      },
      reject: () => {
        this.confirm.close();
      },
    });
  }

  /** Llama al backend; si responde 400 por saldo insuficiente, sugiere crédito */
  private ejecutarProcesar(mae: CompraMae): void {
    this.service.procesarCompra(mae.compraId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: any) => {
        this.msgs.add({ severity: 'success', summary: 'Procesada', detail: res?.message || 'Compra procesada' });
        this.seleccionado.update(s => s ? { ...s, sn_procesada: 'S' } : null);
        this.cargarCompras();
        this.cargarDetalles(mae.compraId);
      },
      error: (err) => this.manejarErrorProcesar(err, mae),
    });
  }

  /**
   * Saldo insuficiente en la cuenta de HABER (Caja) para comprar de contado:
   * muestra la alerta del backend y ofrece registrar la compra al crédito (FCC).
   */
  private manejarErrorProcesar(err: any, mae: CompraMae): void {
    const msgRaw: string = err?.error?.message || 'No se pudo procesar';
    const esSaldoInsuficiente = err?.status === 400 && /saldo insuficiente/i.test(msgRaw);

    if (!esSaldoInsuficiente) {
      this.msgs.add({ severity: 'error', summary: 'Error', detail: msgRaw });
      return;
    }

    // El backend envía el mensaje con saltos de línea; se convierten a <br>
    const msg = msgRaw.replace(/\n/g, '<br>');
    this.confirm.confirm({
      message: `${msg}<br><br><b>¿Desea registrarla como compra al crédito y procesarla?</b>`,
      header: 'Saldo insuficiente en Caja',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, al crédito',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { label: 'Sí, al crédito', severity: 'warn', variant: 'text', size: 'small', rounded: true },
      rejectButtonProps: { label: 'Cancelar', severity: 'secondary', variant: 'text', size: 'small', rounded: true },
      accept: () => {
        this.confirm.close();
        this.service.updateCompra(mae.compraId, { TipoCompra: 'FCC' }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => {
            this.seleccionado.update(s => s ? { ...s, TipoCompra: 'FCC' } : null);
            this.msgs.add({ severity: 'info', summary: 'Cambiada a crédito', detail: `Compra #${mae.compraId} ahora es al crédito (FCC)` });
            this.cargarCompras();
            this.ejecutarProcesar(mae);
          },
          error: (e2: any) => this.msgs.add({
            severity: 'error', summary: 'Error', detail: e2.error?.message || 'No se pudo cambiar a crédito',
          }),
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
    // TypeORM lee los decimal como string ('1250.00'); sin Number() no agrupa millares
    const n = Number(val);
    if (val == null || isNaN(n)) return 'L 0.00';
    return n.toLocaleString('es-HN', { style: 'currency', currency: 'HNL' });
  }

  actualizarTotales() {
    const sub = this.detalles().reduce((sum, d) => sum + (d.subtotal || 0), 0);
    this.totalFactura.set(sub);
  }

  isSelected(row: CompraDet): boolean {
    return this.itemsSeleccionados().some(i => i.cxpcomprasdetId === row.cxpcomprasdetId);
  }

  toggleRow(row: CompraDet, checked: boolean) {
    const actual = this.itemsSeleccionados();
    if (checked) {
      this.itemsSeleccionados.set([...actual, row]);
    } else {
      this.itemsSeleccionados.set(actual.filter(i => i.cxpcomprasdetId !== row.cxpcomprasdetId));
    }
  }

  todosSeleccionados(): boolean {
    const det = this.detalles();
    return det.length > 0 && det.every(d => this.isSelected(d));
  }

  toggleTodos(checked: boolean) {
    this.itemsSeleccionados.set(checked ? [...this.detalles()] : []);
  }

  puedeUsarOcr(): boolean {
    const mae = this.seleccionado();
    if (!mae) return false;
    if (mae.sn_anulada === 'S') return false;
    if (mae.sn_pagada === 'S') return false;
    return true;
  }

  /** Logo de la empresa: tempresaslogo.img (base64) por empresaId. Fallback al asset local. */
  private async cargarLogo(): Promise<string> {
    const fallback = `${window.location.origin}/assets/images/logo1.png`;
    try {
      const empresaId = this.auth.currentUser()?.empresaId;
      if (!empresaId) return fallback;
      const res = await firstValueFrom(this.empresasService.getLogo(empresaId));
      const img = res?.img;
      if (!img) return fallback;
      if (img.startsWith('data:')) return img;
      const mime = img.startsWith('/9j/') ? 'image/jpeg' : img.startsWith('R0lGOD') ? 'image/gif' : 'image/png';
      return `data:${mime};base64,${img}`;
    } catch {
      return fallback;
    }
  }

  async imprimir() {
    const mae = this.seleccionado();
    if (!mae) return;
    const dets = this.detalles();
    const prov = this.nombreProveedor(mae.proveedorId);
    const bodega = this.nombreBodega(mae.bodegaId);
    const tipoMap: Record<string, string> = { FCO: 'Factura Contado', FCC: 'Factura Crédito', ORC: 'Orden de Compra' };
    const tipo = tipoMap[mae.TipoCompra] || mae.TipoCompra;
    const fecha = mae.fecharegistro ? new Date(mae.fecharegistro).toLocaleDateString('es-HN') : '-';
    const nro = mae.nroreferencia || String(mae.compraId);
    const logo = await this.cargarLogo();
    const fechaImpresion = new Date().toLocaleString('es-HN');
    const pagada = mae.sn_pagada === 'S' ? 'Sí' : 'No';
    const anulada = mae.sn_anulada === 'S' ? 'Sí' : 'No';
    const totalLineas = dets.reduce((s, d) => s + Number(d.subtotal || 0), 0);

    const lineas = dets.map(d => `
      <tr>
        <td>${d.nrofila}</td>
        <td>${d.codbarra || ''}</td>
        <td>${d.descripcion || d.codbarra || ''}</td>
        <td class="text-right">${d.cantidad}</td>
        <td class="text-right">${this.moneda(d.precio)}</td>
        <td class="text-right font-bold">${this.moneda(d.subtotal)}</td>
      </tr>
    `).join('');

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>${tipo} : ${nro}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 12px; padding: 20px; color: #1e293b; }
  .header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 16px; border-bottom: 2px solid #1e2e3b; padding-bottom: 12px; }
  .header .header-logo { height: 56px; width: auto; }
  .header .header-num { text-align: right; }
  .header .header-num .doc-tipo { color: #64748b; font-size: 12px; }
  .header .header-num .doc-num { color: #1e2e3b; font-size: 18px; font-weight: 700; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 2rem; margin-bottom: 16px; padding: 10px; background: #f0f4f7; border-radius: 6px; }
  .info-grid .label { font-weight: 600; color: #64748b; }
  .info-grid .value { color: #1e293b; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th { background: #1e2e3b; color: white; padding: 6px 8px; text-align: left; font-size: 11px; }
  td { padding: 5px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
  tfoot td { border-top: 2px solid #1e2e3b; border-bottom: none; padding-top: 8px; font-size: 12px; }
  tbody tr:nth-child(even) { background: #f0f4f7; }
  .text-right { text-align: right; }
  .font-bold { font-weight: 700; }
  .totales { display: flex; justify-content: flex-end; gap: 2rem; margin-bottom: 16px; }
  .totales .total-item { text-align: right; }
  .totales .total-label { font-size: 11px; color: #64748b; }
  .totales .total-value { font-size: 14px; font-weight: 700; color: #1e2e3b; }
  .estado { display: inline-block; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 11px; }
  .estado-pagada { background: #d1fae5; color: #065f46; }
  .estado-pendiente { background: #fef3c7; color: #92400e; }
  .estado-anulada { background: #fee2e2; color: #991b1b; }
  .footer { display: flex; align-items: center; justify-content: space-between; gap: 1rem; text-align: left; margin-top: 20px; padding-top: 12px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 10px; }
  @media print { body { padding: 10px; } }
</style></head><body>
  <div class="header">
    <img class="header-logo" src="${logo}" alt="Logo" />
    <div class="header-num">
      <div class="doc-tipo">${tipo}</div>
      <div class="doc-num">${nro}</div>
    </div>
  </div>
  <div class="info-grid">
    <div><span class="label">Proveedor: </span><span class="value">${prov}</span></div>
    <div><span class="label">Bodega: </span><span class="value">${bodega}</span></div>
    <div><span class="label">Fecha: </span><span class="value">${fecha}</span></div>
    <div><span class="label">Referencia: </span><span class="value">${mae.nroreferencia || '-'}</span></div>
    <div><span class="label">Pagada: </span><span class="value">${pagada}</span></div>
    <div><span class="label">Anulada: </span><span class="value">${anulada}</span></div>
  </div>
  <table>
    <thead><tr><th>#</th><th>Código</th><th>Producto</th><th class="text-right">Cant.</th><th class="text-right">P.U.</th><th class="text-right">Subtotal</th></tr></thead>
    <tbody>${lineas || '<tr><td colspan="6" style="text-align:center;color:#64748b;">Sin items</td></tr>'}</tbody>
    ${dets.length ? `<tfoot><tr>
      <td colspan="5" class="text-right font-bold">TOTAL</td>
      <td class="text-right font-bold">${this.moneda(totalLineas)}</td>
    </tr></tfoot>` : ''}
  </table>
  <div class="totales">
    <div class="total-item">
      <div class="total-label">TOTAL COMPRA</div>
      <div class="total-value">${this.moneda(mae.total)}</div>
    </div>
  </div>
  <div class="footer">
    <span>ARCAS Software ERP &mdash; Documento generado automáticamente</span>
    <span class="footer-fecha">Fecha de impresión: ${fechaImpresion}</span>
  </div>
</body></html>`;

    const win = window.open('', '_blank', 'width=800,height=600');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  }

  onOcrDatos(datos: FacturaData) {
    const mae = this.seleccionado();
    if (!mae) return;
    if (!this.puedeUsarOcr()) {
      this.msgs.add({ severity: 'warn', summary: 'No permitido', detail: 'La compra ya fue procesada o pagada' });
      return;
    }

    // Buscar o crear proveedor
    let proveedor = this.proveedores().find(p => {
      const rtnMatch = datos.rtn && p.rtn && p.rtn.replace(/[\.\-\s]/g, '') === datos.rtn.replace(/[\.\-\s]/g, '');
      const nombreMatch = datos.proveedor &&
        (`${p.nombres} ${p.apellidos}`.toLowerCase().includes(datos.proveedor.toLowerCase()) ||
         (p.razonsocial || '').toLowerCase().includes(datos.proveedor.toLowerCase()));
      return rtnMatch || nombreMatch;
    });

    if (proveedor) {
      this.cargarItemsOcr(datos, proveedor.proveedorId);
    } else if (datos.proveedor) {
      this.crearProveedorOcr(datos);
    } else {
      this.msgs.add({ severity: 'warn', summary: 'Proveedor', detail: 'No se detectó proveedor en la factura. Seleccione uno manualmente.' });
    }
  }

  private crearProveedorOcr(datos: FacturaData) {
    const partes = (datos.proveedor || '').split(/\s+/);
    const nombres = partes.slice(0, Math.ceil(partes.length / 2)).join(' ');
    const apellidos = partes.slice(Math.ceil(partes.length / 2)).join(' ') || 'N/A';

    const payload: any = {
      nroproveedor: 'OCR-' + Date.now(),
      nombres,
      apellidos,
      razonsocial: datos.proveedor,
      rtn: datos.rtn || '',
      sexo: 'M',
      estadocivil: 'U',
      limiteCredito: 0,
      diasplazo: 0,
      interes: 0,
      moratorio: 0,
      categoria: 'D',
      sn_activo: 'S',
    };

    this.service.createProveedor(payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (nuevoProv) => {
        this.msgs.add({ severity: 'success', summary: 'Proveedor creado', detail: `${nombres} ${apellidos}` });
        this.proveedores.update(lista => [...lista, nuevoProv]);
        this.cargarItemsOcr(datos, nuevoProv.proveedorId);
      },
      error: (err) => {
        this.msgs.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo crear el proveedor' });
      },
    });
  }

  private cargarItemsOcr(datos: FacturaData, proveedorId: number) {
    const mae = this.seleccionado();
    if (!mae) return;

    // Si el proveedor de la factura es diferente al de la compra, actualizar
    if (mae.proveedorId !== proveedorId) {
      this.service.updateCompra(mae.compraId, { proveedorId }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.seleccionado.update(s => s ? { ...s, proveedorId } : s);
          this.cargarProveedores();
          this.agregarItemsOcr(datos, mae);
        },
        error: () => this.agregarItemsOcr(datos, mae),
      });
    } else {
      this.agregarItemsOcr(datos, mae);
    }
  }

  private agregarItemsOcr(datos: FacturaData, mae: CompraMae) {
    let agregados = 0;
    const total = datos.items.length;
    const nroInicial = this.detalles().reduce((max, d) => Math.max(max, d.nrofila || 0), 0);

    for (let i = 0; i < datos.items.length; i++) {
      const item = datos.items[i];
      const payload: any = {
        compraId: mae.compraId,
        bodegaId: mae.bodegaId,
        nrofila: nroInicial + i + 1,
        codbarra: item.codbarra || '',
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        precio: item.precioUnitario,
        subtotal: item.cantidad * item.precioUnitario,
        empresaId: mae.empresaId,
      };

      this.service.createCompraDet(payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          agregados++;
          if (agregados === total) {
            this.msgs.add({ severity: 'success', summary: 'OCR', detail: `${agregados} item(s) cargado(s) desde factura` });
            this.cargarDetalles(mae.compraId);
            this.dialogOcr.set(false);
          }
        },
        error: (err) => {
          this.msgs.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al cargar item OCR' });
        },
      });
    }
  }
}
