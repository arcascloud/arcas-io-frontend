import { Component, inject, signal, OnInit, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { CardModule } from 'primeng/card';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { FileUploadModule } from 'primeng/fileupload';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TomaInventarioService } from '../../../core/services/toma-inventario.service';
import { BodegasService } from '../../../core/services/bodegas.service';
import { ProductosService } from '../../../core/services/productos.service';
import { AuthService } from '../../../core/services/auth.service';
import { Bodega, Producto } from '../../../core/models/inventario.models';
import { ProductosHelperList } from '../../helpers/productos';
import { FooterHelper } from '../../helpers/footer';

@Component({
  selector: 'app-toma-inventarios',
  standalone: true,
  providers: [DialogService],
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    TableModule, ButtonModule, InputTextModule, InputNumberModule,
    DialogModule, TagModule, ToastModule, ConfirmDialogModule,
    SelectModule, CheckboxModule, ScrollPanelModule, CardModule,
    ToolbarModule, TooltipModule, AutoCompleteModule, FileUploadModule,
  ],
  templateUrl: './toma-inventarios.html',
  styleUrl: './toma-inventarios.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TomaInventarios implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(TomaInventarioService);
  private bodegasService = inject(BodegasService);
  private productosService = inject(ProductosService);
  private auth = inject(AuthService);
  private msgs = inject(MessageService);
  private confirm = inject(ConfirmationService);
  private destroyRef = inject(DestroyRef);
  private dialogService = inject(DialogService);

  ref: DynamicDialogRef | undefined;

  maestros = signal<any[]>([]);
  detalles = signal<any[]>([]);
  bodegas = signal<Bodega[]>([]);

  seleccionado = signal<any | null>(null);
  cargando = signal(false);
  cargandoDet = signal(false);
  itemsSeleccionados = signal<any[]>([]);

  formMae = this.fb.group({
    bodegaId: [null as number | null, Validators.required],
    concepto: ['', Validators.required],
  });

  formDet = this.fb.group({
    codbarra: ['', Validators.required],
    descripcion: [''],
    productoId: [null as number | null],
    fisico: [0, [Validators.required, Validators.min(0)]],
  });

  itemEditando = signal<number | null>(null);
  productoSeleccionado: Producto | null = null;
  productosFiltrados: Producto[] = [];

  dialogImport = signal(false);
  archivoImport = signal<File | null>(null);
  itemsImport = signal<any[]>([]);

  ngOnInit() {
    this.cargarBodegas();
    this.cargarMaestros();
  }

  cargarBodegas() {
    this.bodegasService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => this.bodegas.set(data?.value || data || []),
    });
  }

  cargarMaestros() {
    this.cargando.set(true);
    this.service.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => {
        this.maestros.set(data?.value || data || []);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las tomas de inventario' });
      },
    });
  }

  seleccionar(row: any) {
    this.seleccionado.set(row);
    this.formMae.patchValue({ bodegaId: row.bodegaId, concepto: row.concepto });
    this.formDet.reset({ codbarra: '', descripcion: '', productoId: null, fisico: 0 });
    this.itemEditando.set(null);
    this.productoSeleccionado = null;
    this.cargarDetalles(row.invfisId);
  }

  cargarDetalles(invfisId: number) {
    this.cargandoDet.set(true);
    this.service.getDet(invfisId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => {
        this.detalles.set((data?.value || data || []).sort((a: any, b: any) => (b.nrofila || 0) - (a.nrofila || 0)));
        this.cargandoDet.set(false);
      },
      error: () => {
        this.cargandoDet.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los items' });
      },
    });
  }

  volver() {
    this.seleccionado.set(null);
    this.detalles.set([]);
    this.itemsSeleccionados.set([]);
  }

  nuevoMae() {
    this.formMae.reset({ bodegaId: null, concepto: '' });
    this.seleccionado.set({
      invfisId: 0,
      empresaId: this.auth.currentUser()?.empresaId || 0,
      fecharegistro: new Date().toISOString(),
      bodegaId: 0,
      concepto: '',
      sn_anulado: 'N',
      usuarioCreated: this.auth.currentUser()?.usuario || 'SYSTEM',
    });
    this.detalles.set([]);
  }

  guardarMae() {
    if (this.formMae.invalid) return;
    const val = this.formMae.value;
    const payload: any = {
      bodegaId: val.bodegaId,
      concepto: val.concepto,
      sn_anulado: 'N',
    };

    this.service.create(payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: any) => {
        this.msgs.add({ severity: 'success', summary: 'Guardado', detail: 'Toma de inventario creada' });
        this.cargarMaestros();
        if (res?.invfisId) {
          this.seleccionar(res);
        }
      },
      error: (err) => {
        this.msgs.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo guardar' });
      },
    });
  }

  nuevoDet() {
    this.formDet.reset({ codbarra: '', descripcion: '', productoId: null, fisico: 0 });
    this.itemEditando.set(null);
    this.productoSeleccionado = null;
  }

  guardarDet() {
    if (this.formDet.invalid) return;
    const val = this.formDet.value;
    const mae = this.seleccionado();
    if (!mae) return;

    let finalCodbarra = val.codbarra || '';
    if (this.productoSeleccionado) {
      finalCodbarra = (this.productoSeleccionado as any).codbarra || finalCodbarra;
    }

    const payload: any = {
      invfisId: mae.invfisId,
      bodegaId: mae.bodegaId,
      codbarra: finalCodbarra,
      descripcion: val.descripcion || '',
      productoId: val.productoId || null,
      fisico: val.fisico || 0,
      empresaId: mae.empresaId,
    };

    const editId = this.itemEditando();
    const obs$ = editId
      ? this.service.updateDet(editId, payload)
      : this.service.createDet(payload);

    obs$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.msgs.add({ severity: 'success', summary: 'Guardado', detail: editId ? 'Item actualizado' : 'Item agregado' });
        this.formDet.reset({ codbarra: '', descripcion: '', productoId: null, fisico: 0 });
        this.itemEditando.set(null);
        this.productoSeleccionado = null;
        this.cargarDetalles(mae.invfisId);
      },
      error: (err) => this.msgs.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo guardar el item' }),
    });
  }

  editarItem(row: any) {
    this.itemEditando.set(row.nvfisdetId);
    this.productoSeleccionado = row.productoId
      ? { produtoId: row.productoId, codbarra: row.codbarra, descripcion: row.descripcion } as any
      : null;
    this.formDet.patchValue({
      codbarra: row.codbarra || '',
      descripcion: row.descripcion || '',
      productoId: row.productoId || null,
      fisico: row.fisico || 0,
    });
  }

  cancelarEdicion() {
    this.itemEditando.set(null);
    this.productoSeleccionado = null;
    this.formDet.reset({ codbarra: '', descripcion: '', productoId: null, fisico: 0 });
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
        this.productoSeleccionado = data;
        this.formDet.patchValue({
          codbarra: data.codbarra,
          descripcion: data.descripcion,
          productoId: data.produtoId,
          fisico: 0,
        });
      }
    });
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
    }
  }

  eliminarDet(row: any) {
    this.confirm.confirm({
      message: `¿Eliminar item "${row.descripcion || row.codbarra}"?`,
      header: 'Confirmar',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.confirm.close();
        this.service.removeDet(row.nvfisdetId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => {
            this.msgs.add({ severity: 'success', summary: 'Eliminado' });
            this.cargarDetalles(this.seleccionado()!.invfisId);
          },
          error: (err) => this.msgs.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo eliminar' }),
        });
      },
      reject: () => this.confirm.close(),
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
          this.service.removeDet(item.nvfisdetId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: () => {
              eliminados++;
              if (eliminados === seleccionados.length) {
                this.msgs.add({ severity: 'success', summary: 'Eliminados', detail: `${eliminados} item(s) eliminado(s)` });
                this.itemsSeleccionados.set([]);
                this.cargarDetalles(this.seleccionado()!.invfisId);
              }
            },
            error: (err) => this.msgs.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo eliminar' }),
          });
        }
      },
      reject: () => this.confirm.close(),
    });
  }

  cargarExistencia(row: any) {
    this.service.cargarExistencia(row.nvfisdetId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.msgs.add({ severity: 'info', summary: 'Existencia cargada', detail: `Sistema: ${row.existencia}` });
        this.cargarDetalles(this.seleccionado()!.invfisId);
      },
    });
  }

  procesar() {
    const mae = this.seleccionado();
    if (!mae) return;
    this.confirm.confirm({
      message: `¿Procesar toma de inventario #${mae.invfisId}? Se aplicarán ajustes al kardex.`,
      header: 'Procesar inventario',
      acceptLabel: 'Procesar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.confirm.close();
        this.service.procesar(mae.invfisId, mae.bodegaId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: (res: any) => {
            this.msgs.add({ severity: 'success', summary: 'Procesado', detail: res.message || 'Inventario procesado' });
            this.cargarMaestros();
            this.cargarDetalles(mae.invfisId);
          },
          error: (err) => this.msgs.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo procesar' }),
        });
      },
      reject: () => this.confirm.close(),
    });
  }

  eliminarMae(mae: any) {
    this.confirm.confirm({
      message: `¿Anular toma de inventario #${mae.invfisId}?`,
      header: 'Anular toma',
      acceptLabel: 'Anular',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.confirm.close();
        this.service.remove(mae.invfisId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => {
            this.msgs.add({ severity: 'success', summary: 'Anulada', detail: 'Toma de inventario anulada' });
            this.cargarMaestros();
            if (this.seleccionado()?.invfisId === mae.invfisId) this.volver();
          },
          error: (err) => this.msgs.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo anular' }),
        });
      },
      reject: () => this.confirm.close(),
    });
  }

  abrirImport() {
    this.itemsImport.set([]);
    this.archivoImport.set(null);
    this.dialogImport.set(true);
  }

  onArchivoSelect(event: any) {
    const file = event.files?.[0];
    if (!file) return;
    this.archivoImport.set(file);
    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      try {
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(content);
          this.itemsImport.set(Array.isArray(parsed) ? parsed : [parsed]);
        } else if (file.name.endsWith('.csv')) {
          const lines = content.split('\n').filter(l => l.trim());
          if (lines.length < 2) return;
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          const items = lines.slice(1).map(line => {
            const vals = line.split(',').map(v => v.trim().replace(/"/g, ''));
            const obj: any = {};
            headers.forEach((h, i) => obj[h] = vals[i] || '');
            return obj;
          });
          this.itemsImport.set(items);
        } else if (file.name.endsWith('.xml')) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(content, 'text/xml');
          const rows = doc.querySelectorAll('row');
          const items: any[] = [];
          rows.forEach(row => {
            const obj: any = {};
            Array.from(row.children).forEach(child => obj[child.tagName] = child.textContent || '');
            items.push(obj);
          });
          this.itemsImport.set(items);
        }
      } catch (e) {
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudo leer el archivo' });
      }
    };
    reader.readAsText(file);
  }

  confirmarImport() {
    const mae = this.seleccionado();
    if (!mae || this.itemsImport().length === 0) return;
    this.service.importar(mae.invfisId, this.itemsImport()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: any) => {
        const count = Array.isArray(res) ? res.length : 0;
        this.msgs.add({ severity: 'success', summary: 'Importado', detail: `${count} items importados` });
        this.dialogImport.set(false);
        this.cargarDetalles(mae.invfisId);
      },
      error: () => this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron importar los items' }),
    });
  }

  nombreBodega(id: number): string {
    return this.bodegas().find(b => b.bodegaId === id)?.descripcion || `Bodega ${id}`;
  }

  diferencia(row: any): number {
    return (Number(row.fisico) || 0) - (Number(row.existencia) || 0);
  }

  todosAplicados(): boolean {
    return this.detalles().length > 0 && this.detalles().every(d => d.sn_aplicado === 'S');
  }

  objectKeys(obj: any): string[] {
    return Object.keys(obj || {});
  }

  isSelected(row: any): boolean {
    return this.itemsSeleccionados().some(i => i.nvfisdetId === row.nvfisdetId);
  }

  toggleRow(row: any, checked: boolean) {
    const actual = this.itemsSeleccionados();
    if (checked) {
      this.itemsSeleccionados.set([...actual, row]);
    } else {
      this.itemsSeleccionados.set(actual.filter(i => i.nvfisdetId !== row.nvfisdetId));
    }
  }

  todosSeleccionados(): boolean {
    const det = this.detalles();
    return det.length > 0 && det.every(d => this.isSelected(d));
  }

  toggleTodos(checked: boolean) {
    this.itemsSeleccionados.set(checked ? [...this.detalles()] : []);
  }
}
