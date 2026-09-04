import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-consulta-facturas',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule, TagModule, TooltipModule, DialogModule],
  templateUrl: './consulta-facturas.html',
  styleUrl: './consulta-facturas.scss',
})
export class ConsultaFacturas implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  private msgs = inject(MessageService);
  private destroyRef = inject(DestroyRef);
  private auth = inject(AuthService);

  facturas = signal<any[]>([]);
  filtered = signal<any[]>([]);
  cargando = signal(false);
  q = signal('');

  dialogCorreo = signal(false);
  emailDestino = signal('');
  enviando = signal(false);
  facturaSeleccionada = signal<any>(null);

  ngOnInit() {
    this.load();
  }

  load() {
    this.cargando.set(true);
    this.api.get<any>('/facturacion/facturas').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: any) => {
        const items = Array.isArray(res) ? res : (res?.value ?? []);
        this.facturas.set(items);
        this.filtrar();
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las facturas' });
      },
    });
  }

  filtrar() {
    const texto = this.q().toLowerCase().trim();
    if (!texto) {
      this.filtered.set(this.facturas());
      return;
    }
    this.filtered.set(
      this.facturas().filter((f) => {
        const nro = String(f.nrofactura ?? '');
        const cliente = (f.nombrecliente ?? '').toLowerCase();
        return nro.includes(texto) || cliente.includes(texto);
      }),
    );
  }

  buscar() { this.filtrar(); }
  limpiar() { this.q.set(''); this.filtrar(); }

  ver(id: number) {
    this.router.navigate(['/facturacion/consultas', id]);
  }

  fechaCorta(fecha: string | Date): string {
    if (!fecha) return '-';
    const d = new Date(fecha);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(-2);
    return `${dd}/${mm}/${yy}`;
  }

  horaCorta(fecha: string | Date): string {
    if (!fecha) return '-';
    const d = new Date(fecha);
    return d.toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' });
  }

  moneda(n: number | undefined): string {
    return (n ?? 0).toLocaleString('es-HN', { style: 'currency', currency: 'HNL' });
  }

  getTipoLabel(tipo: string): string {
    return tipo === 'C' ? 'Credito' : 'Contado';
  }

  getTipoSeverity(tipo: string): string {
    return tipo === 'C' ? 'warn' : 'success';
  }

  getEstado(f: any): string {
    if (f.sn_anulada === 'S') return 'Anulada';
    if (f.sn_pagada === 'S') return 'Pagada';
    return 'Pendiente';
  }

  getEstadoSeverity(f: any): string {
    if (f.sn_anulada === 'S') return 'danger';
    if (f.sn_pagada === 'S') return 'success';
    return 'warn';
  }

  // ==================== REIMPRIMIR ====================

  async reimprimir(f: any, $event?: Event) {
    $event?.stopPropagation();
    try {
      const pdfMake: any = (await import('pdfmake/build/pdfmake')).default;
      const pdfFonts: any = (await import('pdfmake/build/vfs_fonts')).default;
      pdfMake.vfs = pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : pdfFonts;

      const data = await this.api.get<any>(`/facturacion/facturas/${f.facturaId}/ticket`).toPromise();
      if (!data) return;

      const doc = this.buildPdfDefinition(data);
      (pdfMake as any).createPdf(doc).print();
    } catch {
      this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudo generar el PDF' });
    }
  }

  private buildPdfDefinition(data: any): any {
    const f = data.factura;
    const dets = data.detalles ?? [];
    const emp = data.empresa ?? {};
    const pagos = data.pagos ?? [];

    const detRows = dets.map((d: any, i: number) => [
      '' + (i + 1),
      d.descripcion || d.codbarra || '',
      '' + Number(d.cantidad),
      'L ' + Number(d.precioventa).toFixed(2),
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
            { text: this.getEstadoLabel(f) + '\n', bold: true, fontSize: 12, color: '#10b981' },
            { text: 'FACTURA ', bold: true, fontSize: 16 },
            { text: '#' + (f?.nrofactura || ''), fontSize: 16 },
            '\n',
            { text: 'Fecha: ', bold: true }, this.fechaLarga(f?.fecharegistro) + '\n',
            { text: 'Hora: ', bold: true }, this.horaCorta(f?.fecharegistro) + '\n',
            { text: 'Tipo: ', bold: true }, (f?.tipofactura === 'C' ? 'Credito' : 'Contado'),
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
            widths: [30, '*', 50, 70, 70],
            body: [
              [
                { text: '#', style: 'tableHeader' },
                { text: 'Producto', style: 'tableHeader' },
                { text: 'Cant.', style: 'tableHeader', alignment: 'right' },
                { text: 'Precio', style: 'tableHeader', alignment: 'right' },
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
        ...pagos.map((p: any) => ({
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

  private fechaLarga(fecha: string | Date): string {
    if (!fecha) return '-';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-HN', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  private getEstadoLabel(f: any): string {
    if (f?.sn_anulada === 'S') return 'Anulada';
    if (f?.sn_pagada === 'S') return 'Pagada';
    return 'Pendiente';
  }

  // ==================== CORREO ====================

  abrirCorreo(f: any, $event?: Event) {
    $event?.stopPropagation();
    this.facturaSeleccionada.set(f);
    this.emailDestino.set('');
    this.dialogCorreo.set(true);
  }

  enviarCorreo() {
    const email = this.emailDestino();
    if (!email || !email.includes('@')) {
      this.msgs.add({ severity: 'warn', summary: 'Correo invalido', detail: 'Ingrese un correo electronico valido' });
      return;
    }
    const f = this.facturaSeleccionada();
    if (!f) return;
    this.enviando.set(true);
    const empresaId = this.auth.currentUser()?.empresaId;
    this.api.post<any>(`facturacion/facturas/${f.facturaId}/enviar-correo?empresaId=${empresaId}`, { email }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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

  async compartirWhatsapp(f: any, $event?: Event) {
    $event?.stopPropagation();
    try {
      const pdfMake: any = (await import('pdfmake/build/pdfmake')).default;
      const pdfFonts: any = (await import('pdfmake/build/vfs_fonts')).default;
      pdfMake.vfs = pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : pdfFonts;

      const data = await this.api.get<any>(`/facturacion/facturas/${f.facturaId}/ticket`).toPromise();
      if (!data) return;

      const id = f.nrofactura || f.facturaId;
      const total = this.moneda(f.total);
      const nombre = f.nombrecliente || 'Cliente';
      const texto = encodeURIComponent(`Factura #${id} - ${nombre} - Total: ${total}`);

      const blob = await new Promise<Blob>((resolve) => {
        (pdfMake.createPdf(this.buildPdfDefinition(data)) as any).getBlob(resolve);
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
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudo compartir la factura' });
      }
    }
  }
}
