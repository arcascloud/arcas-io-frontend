import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ToolbarModule } from 'primeng/toolbar';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../../../core/services/api.service';
import { FacturacionService } from '../../../../core/services/facturacion.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Producto } from '../../../../core/models/inventario.models';
import { ProductosHelperList } from '../../../helpers/productos';
import { FooterHelper } from '../../../helpers/footer';

interface FilaDet {
  fila: number;
  productoId: number | null;
  codbarra: string;
  descripcion: string;
  imagenUrl?: string | null;
  estado?: string;
  cantidad: number;
  precio: number;
  subTotal: number;
}

@Component({
  selector: 'app-cotizaciones-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    TableModule,
    ToolbarModule,
    TagModule,
    TooltipModule,
    DialogModule,
  ],
  providers: [DialogService],
  templateUrl: './cotizaciones-form.html',
  styleUrl: './cotizaciones-form.scss',
})
export class CotizacionesForm implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private service = inject(FacturacionService);
  private msgs = inject(MessageService);
  private destroyRef = inject(DestroyRef);
  private auth = inject(AuthService);
  ref: DynamicDialogRef | undefined;

  form!: FormGroup;

  esEdicion = signal(false);
  cargando = signal(false);
  guardando = signal(false);
  titulo = signal('Nueva Cotizacion');

  gestores = signal<any[]>([]);

  filas = signal<FilaDet[]>([]);
  totales = signal({ subTotal: 0, impuesto: 0, total: 0 });
  mae = signal<any>(null);

  qProducto = signal('');
  dialogProductos = signal(false);
  dialogCorreo = signal(false);
  empresaDet = signal<any[]>([]);
  empresaNombre = 'EMPRESA';
  emailDestino = signal('');
  productosArray: Producto[] = [];
  productosFiltrados = signal<Producto[]>([]);

  private existenciasMap = new Map<number, number>();
  private imagenesMap = new Map<number, string>();
  private tasaImpuesto = 0.15;
  private contadorFila = 0;
  private cotizacionId: number | null = null;

  constructor(public dialogService: DialogService) {}

  ngOnInit() {
    this.buildForm();
    this.cargarGestores();
    this.cargarProductos();
    this.cargarEmpresa();

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'nuevo') {
      this.esEdicion.set(true);
      this.cotizacionId = Number(id);
      this.titulo.set('Editar Cotizacion #' + id);
      this.cargando.set(true);
      this.cargarCotizacion(Number(id));
    }
  }

  private buildForm() {
    this.form = this.fb.group({
      Nombrecliente: ['', Validators.required],
      direccion: ['', Validators.required],
      atendio: ['', Validators.required],
      gestorId: [null as number | null, Validators.required],
    });
  }

  private cargarGestores() {
    this.api.get<any>('/parametros/gestores').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        const items = res?.value ?? (Array.isArray(res) ? res : []);
        this.gestores.set((items ?? []).map((g: any) => ({
          label: g.nombre || 'Gestor #' + g.g_gestorId,
          value: g.g_gestorId,
        })));
      },
    });
  }

  private cargarProductos() {
    this.api.get<any[]>('/inventario/existencias').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (items) => {
        const m = new Map<number, number>();
        for (const e of items ?? []) {
          const id = Number(e.productoId);
          m.set(id, (m.get(id) ?? 0) + Number(e.existencia ?? 0));
        }
        this.existenciasMap = m;

        this.api.get<any[]>('/inventario/productos').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: (prods) => {
            this.productosArray = ((prods ?? []) as Producto[]).filter((p) => m.has(Number(p.produtoId)));
            this.filtrarProductos();
          },
        });
      },
    });

    this.api.get<any[]>('/inventario/productos-img').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (items) => {
        const m = new Map<number, string>();
        for (const i of items ?? []) {
          const id = Number(i.productoId);
          if (i.sn_activo === 'S' && i.img && !m.has(id)) {
            m.set(id, /^data:/i.test(i.img) ? i.img : 'data:image/png;base64,' + i.img);
          }
        }
        this.imagenesMap = m;
      },
    });
  }

  private cargarCotizacion(id: number) {
    this.api.get<any>('/facturacion/cotizaciones/' + id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (mae) => {
        this.mae.set(mae);
        this.form.patchValue({
          Nombrecliente: mae.Nombrecliente,
          direccion: mae.direccion,
          atendio: mae.atendio,
          gestorId: mae.gestorId,
        });
        this.cargarDetalles(id);
      },
      error: () => {
        this.cargando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'Cotizacion no encontrada' });
        this.volver();
      },
    });
  }

  private cargarDetalles(cotizacionId: number) {
    this.api.get<any>('/facturacion/cotizaciones-det/mae/' + cotizacionId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        const dets = res?.value ?? (Array.isArray(res) ? res : []);
        for (const d of dets) {
          const row: FilaDet = {
            fila: ++this.contadorFila,
            productoId: Number(d.productoId) || null,
            codbarra: d.codbarra ?? '',
            descripcion: d.codbarra ?? '',
            imagenUrl: this.imagenesMap.get(Number(d.productoId)) ?? null,
            estado: 'ALTA',
            cantidad: Number(d.cantidad) || 1,
            precio: Number(d.precio) || 0,
            subTotal: Number(d.subTotal) || 0,
          };
          this.filas.update((f) => [...f, row]);
        }
        this.recalcularTotales();
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
      },
    });
  }

  private cargarEmpresa() {
    const empresaId = this.auth.currentUser()?.empresaId;
    if (!empresaId) return;
    this.api.get<any>('/companies/' + empresaId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((emp) => {
        this.empresaNombre = emp?.descripcion || 'EMPRESA';
      });
    this.api.get<any>('/companies/det', { empresaId })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((det) => {
        const items = det?.value ?? (Array.isArray(det) ? det : []);
        this.empresaDet.set(items);
      });
  }

  filtrarProductos() {
    const q = this.qProducto().toLowerCase().trim();
    this.productosFiltrados.set(
      q
        ? this.productosArray.filter(
            (p) =>
              (p.codbarra ?? '').toLowerCase().includes(q) ||
              (p.descripcion ?? '').toLowerCase().includes(q),
          )
        : this.productosArray,
    );
  }

  onBuscarProducto(event: Event) {
    const texto = (event.target as HTMLInputElement).value ?? '';
    this.qProducto.set(texto);

    if (texto.length >= 13) {
      this.api.get<any>('/inventario/productos/buscar', { q: texto.trim() }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (res) => {
          const items = Array.isArray(res) ? res : (res?.value ?? []);
          const producto = items.find((p: any) => (p.codbarra ?? '').trim().startsWith(texto.trim()));
          if (producto) {
            this.agregarProductoDirecto(producto);
            this.qProducto.set('');
          } else {
            this.msgs.add({ severity: 'warn', summary: 'No encontrado', detail: 'No se encontro producto con codigo ' + texto });
          }
        },
      });
    }
  }

  private agregarProductoDirecto(p: Producto) {
    const productoId = Number(p.produtoId) || null;
    const tieneRegistro = this.existenciasMap.has(productoId ?? -1);
    const existencia = Number(this.existenciasMap.get(productoId ?? -1) ?? 0);

    if (tieneRegistro && existencia <= 0) {
      this.msgs.add({ severity: 'warn', summary: 'Sin existencia', detail: p.descripcion + ' no tiene existencia disponible' });
      return;
    }

    const estado = !tieneRegistro ? 'SIN_STOCK' : existencia <= 0 ? 'AGOTADO' : 'ALTA';
    this.agregarFila(p, estado);
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
      if (data) {
        const productoId = Number(data.produtoId) || null;
        const existencia = Number(this.existenciasMap.get(productoId ?? -1) ?? 0);
        const stockMin = Number(data.stockMinimo ?? 0);
        const estado = existencia <= 0 ? 'AGOTADO' : existencia <= stockMin ? 'BAJO' : 'ALTA';

        if (estado === 'AGOTADO') {
          this.msgs.add({ severity: 'warn', summary: 'Sin existencia', detail: data.descripcion + ' no tiene existencia disponible' });
          return;
        }

        this.agregarFila(data, estado);
      }
    });
  }

  private agregarFila(p: any, estado: string) {
    const productoId = Number(p.produtoId) || null;
    const row: FilaDet = {
      fila: ++this.contadorFila,
      productoId,
      codbarra: p.codbarra ?? '',
      descripcion: p.descripcion ?? '',
      imagenUrl: this.imagenesMap.get(productoId ?? -1) ?? null,
      estado,
      cantidad: 1,
      precio: Number(p.precioventa) || 0,
      subTotal: Number(p.precioventa) || 0,
    };
    this.filas.update((f) => [...f, row]);
    this.recalcularFila(row);
  }

  quitarFila(idx: number) {
    this.filas.update((f) => f.filter((_, i) => i !== idx));
    this.recalcularTotales();
  }

  recalcularFila(row: FilaDet) {
    const cantidad = row.cantidad ?? 0;
    const precio = row.precio ?? 0;
    row.subTotal = Math.round(cantidad * precio * 100) / 100;
    this.filas.update((f) => [...f]);
    this.recalcularTotales();
  }

  recalcularTotales() {
    let subTotal = 0;
    for (const r of this.filas()) {
      subTotal += r.subTotal ?? 0;
    }
    const impuesto = Math.round(subTotal * this.tasaImpuesto * 100) / 100;
    const total = Math.round((subTotal + impuesto) * 100) / 100;
    this.totales.set({ subTotal, impuesto, total });
  }

  invalid(ctrl: string): boolean {
    const c = this.form.get(ctrl);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  getSeverity(estado: string): string {
    switch (estado) {
      case 'ALTA': return 'success';
      case 'BAJO': return 'warn';
      case 'AGOTADO': return 'danger';
      case 'SIN_STOCK': return 'info';
      default: return 'secondary';
    }
  }

  moneda(n: number | undefined): string {
    return (n ?? 0).toLocaleString('es-HN', { style: 'currency', currency: 'HNL' });
  }

  volver() {
    this.router.navigate(['/facturacion/cotizaciones']);
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.msgs.add({ severity: 'warn', summary: 'Validacion', detail: 'Complete los campos obligatorios' });
      return;
    }
    const filasArr = this.filas();
    if (filasArr.length === 0) {
      this.msgs.add({ severity: 'warn', summary: 'Validacion', detail: 'Agregue al menos un producto' });
      return;
    }

    const raw = this.form.getRawValue();
    const maeBody = {
      Nombrecliente: raw.Nombrecliente,
      direccion: raw.direccion,
      atendio: raw.atendio,
      gestorId: raw.gestorId,
    };

    this.guardando.set(true);

    if (this.esEdicion() && this.cotizacionId) {
      this.service.updateMae<any>('/facturacion/cotizaciones', this.cotizacionId, maeBody).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => this.guardarDetalles(this.cotizacionId!),
        error: () => {
          this.guardando.set(false);
          this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar la cotizacion' });
        },
      });
    } else {
      this.service.createMae<any>('/facturacion/cotizaciones', maeBody).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (res) => {
          const id = res.poscotmaeId;
          this.guardarDetalles(id);
        },
        error: () => {
          this.guardando.set(false);
          this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la cotizacion' });
        },
      });
    }
  }

  private guardarDetalles(cotizacionId: number) {
    const filasArr = this.filas();
    const empresaId = this.auth.currentUser()?.empresaId;

    if (this.esEdicion()) {
      this.volverConMensaje('Cotizacion #' + cotizacionId + ' actualizada');
      return;
    }

    const detOps = filasArr.map((r) =>
      this.service.createDet<any>('/facturacion/cotizaciones-det', {
        poscotmaeId: cotizacionId,
        productoId: r.productoId,
        codbarra: r.codbarra || '',
        cantidad: r.cantidad ?? 0,
        precio: r.precio ?? 0,
        subTotal: r.subTotal,
        empresaId,
      }),
    );

    forkJoin(detOps).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.guardando.set(false);
        this.msgs.add({ severity: 'success', summary: 'Guardado', detail: 'Cotizacion #' + cotizacionId + ' creada' });
        this.volver();
      },
      error: () => {
        this.guardando.set(false);
        this.msgs.add({ severity: 'warn', summary: 'Advertencia', detail: 'Cotizacion #' + cotizacionId + ' creada, pero fallo el detalle' });
        this.volver();
      },
    });
  }

  private volverConMensaje(mensaje: string) {
    this.guardando.set(false);
    this.msgs.add({ severity: 'success', summary: 'Guardado', detail: mensaje });
    this.volver();
  }

  // ==================== PDF / Correo / WhatsApp ====================

  async imprimirPDF(): Promise<void> {
    const pdfMake: any = (await import('pdfmake/build/pdfmake')).default;
    const pdfFonts: any = (await import('pdfmake/build/vfs_fonts')).default;
    pdfMake.vfs = pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : pdfFonts;
    pdfMake.createPdf(this.buildPdfDefinition()).print();
  }

  async descargarPDF(): Promise<void> {
    const pdfMake: any = (await import('pdfmake/build/pdfmake')).default;
    const pdfFonts: any = (await import('pdfmake/build/vfs_fonts')).default;
    pdfMake.vfs = pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : pdfFonts;
    const id = this.mae()?.poscotmaeId || 'nueva';
    pdfMake.createPdf(this.buildPdfDefinition()).download('cotizacion-' + id + '.pdf');
  }

  async compartir(): Promise<void> {
    try {
      const pdfMake: any = (await import('pdfmake/build/pdfmake')).default;
      const pdfFonts: any = (await import('pdfmake/build/vfs_fonts')).default;
      pdfMake.vfs = pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : pdfFonts;
      const id = this.mae()?.poscotmaeId || 'nueva';
      const blob = await new Promise<Blob>((resolve) => {
        (pdfMake as any).createPdf(this.buildPdfDefinition()).getBlob(resolve);
      });
      const file = new File([blob], 'cotizacion-' + id + '.pdf', { type: 'application/pdf' });
      if (navigator.share) {
        await navigator.share({ files: [file], title: 'Cotizacion #' + id });
      } else {
        this.msgs.add({ severity: 'warn', summary: 'No disponible', detail: 'Web Share API no soportada' });
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudo compartir' });
      }
    }
  }

  abrirDialogCorreo(): void {
    this.emailDestino.set('');
    this.dialogCorreo.set(true);
  }

  enviarCorreo(): void {
    const emailVal = this.emailDestino();
    if (!emailVal || !emailVal.includes('@')) {
      this.msgs.add({ severity: 'warn', summary: 'Correo invalido', detail: 'Ingrese un correo electronico valido' });
      return;
    }
    const id = this.mae()?.poscotmaeId;
    if (!id) {
      this.msgs.add({ severity: 'warn', summary: 'Sin cotizacion', detail: 'Guarde la cotizacion antes de enviar por correo' });
      return;
    }
    this.guardando.set(true);
    const empresaId = this.auth.currentUser()?.empresaId;
    this.api.post<any>('facturacion/cotizaciones/' + id + '/enviar-correo?empresaId=' + empresaId, { email: emailVal }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: any) => {
        this.guardando.set(false);
        this.dialogCorreo.set(false);
        this.msgs.add({ severity: 'success', summary: 'Correo enviado', detail: res.message || 'Cotizacion enviada a ' + emailVal });
      },
      error: (err: any) => {
        this.guardando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al enviar correo' });
      },
    });
  }

  private buildPdfDefinition(): any {
    const maeData = this.mae();
    const filasData = (this.filas() ?? []).filter((f: FilaDet) => f.productoId);
    const totalesData = this.totales() ?? { subTotal: 0, impuesto: 0, total: 0 };
    const now = new Date();

    const det = this.empresaDet();
    const rtn = det.find((d: any) => d.tipo === 'RTN')?.descripcion || '';
    const dirEmpresa = det.find((d: any) => d.tipo === 'DIRECCION')?.descripcion || '';
    const tel = det.find((d: any) => d.tipo === 'TELEFONO')?.descripcion || '';

    return {
      pageSize: 'LETTER',
      pageMargins: [40, 60, 40, 60],
      content: [
        { text: this.empresaNombre, style: 'header', alignment: 'center' },
        { text: rtn ? 'RTN: ' + rtn : '', alignment: 'center', fontSize: 9 },
        { text: dirEmpresa, alignment: 'center', fontSize: 9 },
        { text: tel ? 'Tel: ' + tel : '', alignment: 'center', fontSize: 9 },
        { text: '\n' },
        { text: 'COTIZACION', style: 'header', alignment: 'center' },
        { text: '#' + (maeData?.poscotmaeId || 'Nueva'), style: 'subheader', alignment: 'center' },
        { text: 'Fecha: ' + now.toLocaleDateString('es-HN'), alignment: 'right', margin: [0, 5] },
        { text: '\n' },
        {
          columns: [
            { text: [
              { text: 'Cliente: ', bold: true }, (maeData?.Nombrecliente || this.form.value.Nombrecliente || ''),
              '\n', { text: 'Direccion: ', bold: true }, (maeData?.direccion || this.form.value.direccion || ''),
              '\n', { text: 'Atendio: ', bold: true }, (maeData?.atendio || this.form.value.atendio || ''),
            ], width: '*' },
          ],
        },
        { text: '\n' },
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto', 'auto'],
            body: [
              [
                { text: 'Producto', style: 'tableHeader' },
                { text: 'Precio', style: 'tableHeader', alignment: 'right' },
                { text: 'Cant.', style: 'tableHeader', alignment: 'right' },
                { text: 'Subtotal', style: 'tableHeader', alignment: 'right' },
              ],
              ...filasData.map((f: FilaDet) => [
                f.descripcion || f.codbarra,
                'L ' + Number(f.precio).toFixed(2),
                '' + Number(f.cantidad),
                'L ' + Number(f.subTotal).toFixed(2),
              ]),
            ],
          },
          layout: 'lightHorizontalLines',
        },
        { text: '\n' },
        {
          alignment: 'right',
          columns: [
            { width: '*', text: '' },
            { width: 200, text: [
              { text: 'Subtotal: ', bold: true }, 'L ' + Number(totalesData.subTotal).toFixed(2),
              '\n', { text: 'ISV 15%: ', bold: true }, 'L ' + Number(totalesData.impuesto).toFixed(2),
              '\n', { text: 'TOTAL: ', bold: true, fontSize: 14 }, { text: 'L ' + Number(totalesData.total).toFixed(2), bold: true, fontSize: 14, color: '#10b981' },
            ] },
          ],
        },
      ],
      styles: {
        header: { fontSize: 20, bold: true },
        subheader: { fontSize: 14, margin: [0, 5] },
        tableHeader: { bold: true, fontSize: 10, color: 'white', fillColor: '#10b981' },
      },
      defaultStyle: { fontSize: 10 },
    };
  }
}




