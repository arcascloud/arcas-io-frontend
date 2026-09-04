import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
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
import { ToolbarModule } from 'primeng/toolbar';
import { SelectModule } from 'primeng/select';
import { FileUploadModule } from 'primeng/fileupload';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TomaInventarioService } from '../../../core/services/toma-inventario.service';
import { BodegasService } from '../../../core/services/bodegas.service';
import { TomaInventarioMae, TomaInventarioDet } from '../../../core/models/inventario.models';
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
    ToolbarModule, SelectModule, FileUploadModule,
  ],
  templateUrl: './toma-inventarios.html',
  styleUrl: './toma-inventarios.scss',
})
export class TomaInventarios implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(TomaInventarioService);
  private bodegasService = inject(BodegasService);
  private msgs = inject(MessageService);
  private confirm = inject(ConfirmationService);
  private destroyRef = inject(DestroyRef);
  private dialogService = inject(DialogService);

  ref: DynamicDialogRef | undefined;

  maestros = signal<any[]>([]);
  detalles = signal<any[]>([]);
  bodegas = signal<any[]>([]);
  seleccionado = signal<any | null>(null);
  cargando = signal(false);
  cargandoDet = signal(false);

  dialogMae = signal(false);
  dialogDet = signal(false);
  dialogImport = signal(false);
  esEdicion = signal(false);

  formMae = this.fb.group({
    concepto: ['', Validators.required],
    bodegaId: [null as number | null, Validators.required],
  });

  formDet = this.fb.group({
    codbarra: ['', Validators.required],
    descripcion: [''],
    fisico: [0, Validators.required],
  });

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
    this.cargarDetalles(row.invfisId);
  }

  cargarDetalles(invfisId: number) {
    this.cargandoDet.set(true);
    this.service.getDet(invfisId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => {
        this.detalles.set(data?.value || data || []);
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
  }

  nuevoMae() {
    this.esEdicion.set(false);
    this.formMae.reset();
    this.dialogMae.set(true);
  }

  editarMae(row: any) {
    this.esEdicion.set(true);
    this.formMae.patchValue({ concepto: row.concepto, bodegaId: row.bodegaId });
    this.seleccionado.set(row);
    this.dialogMae.set(true);
  }

  guardarMae() {
    if (this.formMae.invalid) return;
    const val = this.formMae.value;
    const obs$ = this.esEdicion()
      ? this.service.update(this.seleccionado()!.invfisId, val as any)
      : this.service.create(val as any);

    obs$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: any) => {
        this.msgs.add({ severity: 'success', summary: 'Guardado', detail: this.esEdicion() ? 'Toma actualizada' : 'Toma creada' });
        this.dialogMae.set(false);
        this.cargarMaestros();
        if (!this.esEdicion() && res.invfisId) {
          this.seleccionar(res);
        }
      },
      error: () => this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar' }),
    });
  }

  eliminarMae(row: any) {
    this.confirm.confirm({
      message: `¿Eliminar toma de inventario #${row.invfisId}?`,
      header: 'Confirmar',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.service.remove(row.invfisId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => {
            this.msgs.add({ severity: 'success', summary: 'Eliminada' });
            if (this.seleccionado()?.invfisId === row.invfisId) this.volver();
            this.cargarMaestros();
          },
        });
      },
    });
  }

  nuevoDet() {
    this.formDet.reset({ codbarra: '', descripcion: '', fisico: 0 });
    this.dialogDet.set(true);
  }

  editarDet(row: any) {
    this.formDet.patchValue({ codbarra: row.codbarra, descripcion: row.descripcion, fisico: row.fisico });
    (this.formDet as any)._editId = row.nvfisdetId;
    this.dialogDet.set(true);
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
        this.formDet.reset({ codbarra: data.codbarra, descripcion: data.descripcion, fisico: 0 });
        (this.formDet as any)._editId = null;
        this.dialogDet.set(true);
      }
    });
  }

  guardarDet() {
    if (this.formDet.invalid) return;
    const val = this.formDet.value;
    const editId = (this.formDet as any)._editId;

    const payload: any = {
      invfisId: this.seleccionado()!.invfisId,
      bodegaId: this.seleccionado()!.bodegaId,
      codbarra: val.codbarra,
      descripcion: val.descripcion || '',
      fisico: val.fisico || 0,
      empresaId: this.seleccionado()!.empresaId,
    };

    const obs$ = editId
      ? this.service.updateDet(editId, payload)
      : this.service.createDet(payload);

    obs$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.msgs.add({ severity: 'success', summary: 'Guardado', detail: editId ? 'Item actualizado' : 'Item agregado' });
        this.dialogDet.set(false);
        delete (this.formDet as any)._editId;
        this.cargarDetalles(this.seleccionado()!.invfisId);
      },
      error: () => this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el item' }),
    });
  }

  eliminarDet(row: any) {
    this.confirm.confirm({
      message: `¿Eliminar item "${row.descripcion}"?`,
      header: 'Confirmar',
      accept: () => {
        this.service.removeDet(row.nvfisdetId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => {
            this.msgs.add({ severity: 'success', summary: 'Eliminado' });
            this.cargarDetalles(this.seleccionado()!.invfisId);
          },
        });
      },
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
}
