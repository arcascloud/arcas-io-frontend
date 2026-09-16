import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-consulta-factura-detalle',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, TagModule, TooltipModule, DialogModule, InputTextModule],
  templateUrl: './consulta-factura-detalle.html',
  styleUrl: './consulta-factura-detalle.scss',
})
export class ConsultaFacturaDetalle implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private msgs = inject(MessageService);
  private destroyRef = inject(DestroyRef);
  private auth = inject(AuthService);

  factura = signal<any>(null);
  detalles = signal<any[]>([]);
  pagos = signal<any[]>([]);
  empresa = signal<any>({});
  cargando = signal(false);
  facturaId: number = 0;

  dialogCorreo = signal(false);
  emailDestino = signal('');
  enviando = signal(false);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.facturaId = Number(id);
      this.loadTicket();
    }
  }

  loadTicket() {
    this.cargando.set(true);
    this.api.get<any>(`/facturacion/facturas/${this.facturaId}/ticket`).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.factura.set(data.factura);
        this.detalles.set(data.detalles ?? []);
        this.pagos.set(data.pagos ?? []);
        this.empresa.set(data.empresa ?? {});
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la factura' });
        this.volver();
      },
    });
  }

  volver() {
    this.router.navigate(['/facturacion/consultas']);
  }

  moneda(n: number | undefined): string {
    return (n ?? 0).toLocaleString('es-HN', { style: 'currency', currency: 'HNL' });
  }

  fechaLarga(fecha: string | Date): string {
    if (!fecha) return '-';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-HN', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  horaCorta(fecha: string | Date): string {
    if (!fecha) return '-';
    const d = new Date(fecha);
    return d.toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' });
  }

  getTipoFactura(tipo: string): string {
    return tipo === 'C' ? 'Credito' : 'Contado';
  }

  getTipoSeverity(tipo: string): string {
    return tipo === 'C' ? 'warn' : 'success';
  }

  getEstado(): string {
    const f = this.factura();
    if (!f) return '';
    if (f.sn_anulada === 'S') return 'Anulada';
    if (f.sn_pagada === 'S') return 'Pagada';
    return 'Pendiente';
  }

  getEstadoSeverity(): string {
    const f = this.factura();
    if (!f) return 'secondary';
    if (f.sn_anulada === 'S') return 'danger';
    if (f.sn_pagada === 'S') return 'success';
    return 'warn';
  }

  descuentoVisible(): boolean {
    const f = this.factura();
    return f ? Number(f.descuento ?? 0) > 0 : false;
  }

  // ==================== PDF ====================

  async buildPdfAndDo(action: 'print' | 'download'): Promise<void> {
    const pdfMake: any = (await import('pdfmake/build/pdfmake')).default;
    const pdfFonts: any = (await import('pdfmake/build/vfs_fonts')).default;
    pdfMake.vfs = pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : pdfFonts;

    const doc = this.buildPdfDefinition();
    if (action === 'print') {
      (pdfMake as any).createPdf(doc).print();
    } else {
      const id = this.factura()?.nrofactura ?? this.facturaId;
      (pdfMake as any).createPdf(doc).download('factura-' + id + '.pdf');
    }
  }

  async imprimir() {
    await this.buildPdfAndDo('print');
  }

  async descargarPdf() {
    await this.buildPdfAndDo('download');
  }

  private buildPdfDefinition(): any {
    const f = this.factura();
    const dets = this.detalles();
    const emp = this.empresa();

    const detRows = dets.map((d: any, i: number) => [
      '' + (i + 1),
      d.descripcion || d.codbarra || '',
      '' + Number(d.cantidad),
      'L ' + Number(d.precioventa).toFixed(2),
      (Number(d.descuento) || 0) > 0 ? '-' + Number(d.descuento).toFixed(0) + '%' : '0%',
      'L ' + Number(d.subTotal).toFixed(2),
    ]);

    return {
      pageSize: 'LETTER',
      pageMargins: [40, 60, 40, 60],
      content: [
        { text: emp.nombre || 'EMPRESA', style: 'header', alignment: 'center' },
        { text: emp.rtn ? 'RTN: ' + emp.rtn : '', alignment: 'center', fontSize: 9 },
        { text: emp.direccion || '', alignment: 'center', fontSize: 9 },
        { text: emp.telefono ? 'Tel: ' + emp.telefono : '', alignment: 'center', fontSize: 9 },
        { text: '\n' },
        { columns: [
          { text: '', width: '*' },
          { text: [
            { text: this.getEstado() + '\n', bold: true, fontSize: 12, color: '#10b981' },
            { text: 'FACTURA ', bold: true, fontSize: 16 },
            { text: '#' + (f?.nrofactura || this.facturaId), fontSize: 16 },
            '\n',
            { text: 'Fecha: ', bold: true }, this.fechaLarga(f?.fecharegistro) + '\n',
            { text: 'Hora: ', bold: true }, this.horaCorta(f?.fecharegistro) + '\n',
            { text: 'Tipo: ', bold: true }, this.getTipoFactura(f?.tipofactura),
          ], width: '*', alignment: 'right' },
        ] },
        { text: '\n' },
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#e2e8f0' }] },
        { text: '\n' },
        { columns: [
          { text: [
            { text: 'CLIENTE\n', bold: true, fontSize: 10 },
            f?.nombrecliente || 'Sin cliente', '\n',
            f?.direccion || '',
          ], width: '*' },
          { text: [
            { text: 'DIRECCION DE ENTREGA\n', bold: true, fontSize: 10 },
            f?.direccion || 'N/A',
          ], width: '*' },
        ] },
        { text: '\n' },
        {
          table: {
            headerRows: 1,
            widths: [30, '*', 50, 70, 50, 70],
            body: [
              [
                { text: '#', style: 'tableHeader' },
                { text: 'Producto', style: 'tableHeader' },
                { text: 'Cant.', style: 'tableHeader', alignment: 'right' },
                { text: 'Precio', style: 'tableHeader', alignment: 'right' },
                { text: 'Desc.', style: 'tableHeader', alignment: 'right' },
                { text: 'Subtotal', style: 'tableHeader', alignment: 'right' },
              ],
              ...detRows,
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
              { text: 'Subtotal: ', bold: true }, 'L ' + Number(f?.subTotal ?? 0).toFixed(2),
              '\n', { text: 'ISV 15%: ', bold: true }, 'L ' + Number(f?.impuesto ?? 0).toFixed(2),
              '\n', { text: 'Descuento: ', bold: true }, 'L ' + Number(f?.descuento ?? 0).toFixed(2),
              '\n', { text: 'TOTAL: ', bold: true, fontSize: 14 }, { text: 'L ' + Number(f?.total ?? 0).toFixed(2), bold: true, fontSize: 14, color: '#10b981' },
            ] },
          ],
        },
        { text: '\n' },
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#e2e8f0' }] },
        { text: '\n' },
        { text: 'PAGOS', bold: true, fontSize: 10 },
        ...this.pagos().map((p: any) => ({
          text: `Forma de pago: Efectivo L ${Number(p.importe_efectivo ?? 0).toFixed(2)} / Otros L ${Number(p.importe_otros ?? 0).toFixed(2)}`,
          fontSize: 9,
        })),
        f?.tipofactura === 'E' ? { text: 'Efectivo recibido: L ' + Number(f?.efectivo_recibido ?? 0).toFixed(2) + '  Cambio: L ' + Number(f?.importe_cambio ?? 0).toFixed(2), fontSize: 9 } : { text: '' },
        { text: '\n' },
        { text: emp.mensajeFactura || '', alignment: 'center', fontSize: 8, italics: true, color: '#64748b' },
      ],
      styles: {
        header: { fontSize: 18, bold: true },
        tableHeader: { bold: true, fontSize: 9, color: 'white', fillColor: '#10b981' },
      },
      defaultStyle: { fontSize: 10 },
    };
  }

  // ==================== CORREO ====================

  abrirDialogCorreo() {
    this.emailDestino.set('');
    this.dialogCorreo.set(true);
  }

  enviarCorreo() {
    const email = this.emailDestino();
    if (!email || !email.includes('@')) {
      this.msgs.add({ severity: 'warn', summary: 'Correo invalido', detail: 'Ingrese un correo electronico valido' });
      return;
    }
    this.enviando.set(true);
    const empresaId = this.auth.currentUser()?.empresaId;
    this.api.post<any>(`facturacion/facturas/${this.facturaId}/enviar-correo?empresaId=${empresaId}`, { email }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: any) => {
        this.enviando.set(false);
        this.dialogCorreo.set(false);
        this.msgs.add({ severity: 'success', summary: 'Correo enviado', detail: res.message || 'Factura enviada a ' + email });
      },
      error: (err: any) => {
        this.enviando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al enviar correo' });
      },
    });
  }

  // ==================== WHATSAPP ====================

  async compartir() {
    try {
      const pdfMake: any = (await import('pdfmake/build/pdfmake')).default;
      const pdfFonts: any = (await import('pdfmake/build/vfs_fonts')).default;
      pdfMake.vfs = pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : pdfFonts;
      const id = this.factura()?.nrofactura ?? this.facturaId;
      const total = this.moneda(this.factura()?.total);
      const nombre = this.factura()?.nombrecliente || 'Cliente';
      const texto = encodeURIComponent(`Factura #${id} - ${nombre} - Total: ${total}`);

      const blob = await new Promise<Blob>((resolve) => {
        (pdfMake.createPdf(this.buildPdfDefinition()) as any).getBlob(resolve);
      });
      const file = new File([blob], 'factura-' + id + '.pdf', { type: 'application/pdf' });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Factura #' + id });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'factura-' + id + '.pdf';
        a.click();
        URL.revokeObjectURL(url);
        window.open('https://wa.me/?text=' + texto, '_blank');
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudo compartir' });
      }
    }
  }
}
