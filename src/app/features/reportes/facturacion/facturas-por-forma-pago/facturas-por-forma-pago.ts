import { Component, inject, signal, OnInit, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../../../core/services/api.service';
import { ReportesPrintService, EncabezadoPrint, TablaPrint, ColumnaPrint } from '../../../../core/services/reportes-print.service';

interface GrupoFacturaFormaPago {
  formapagoId: number;
  nombreFormaPago: string;
  facturas: any[];
  subtotal: number;
  impuesto: number;
  descuento: number;
  total: number;
}

@Component({
  selector: 'app-facturas-por-forma-pago',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, DatePickerModule, SelectModule],
  templateUrl: './facturas-por-forma-pago.html',
  styleUrl: './facturas-por-forma-pago.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FacturasPorFormaPagoReport implements OnInit {
  private api = inject(ApiService);
  private print = inject(ReportesPrintService);
  private msgs = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  fechaDesde = signal<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  fechaHasta = signal<Date>(new Date());
  formaPagoId = signal<number | null>(null);

  formasPagoOptions = signal<{ label: string; value: number | null }[]>([]);
  cargando = signal(false);
  grupos = signal<GrupoFacturaFormaPago[]>([]);

  totalesGenerales = signal({
    subtotal: 0,
    impuesto: 0,
    descuento: 0,
    total: 0,
    cantidad: 0,
  });

  ngOnInit() {
    this.cargarCatalogos();
  }

  cargarCatalogos() {
    this.cargando.set(true);
    forkJoin({
      formasPago: this.api.get<any[]>('/parametros/formas-pago'),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        const fps = res.formasPago ?? [];
        const opciones = [
          { label: 'Todas las formas de pago', value: null },
          { label: 'Crédito', value: -1 }
        ];
        for (const fp of fps) {
          opciones.push({ label: String(fp.descripcion), value: Number(fp.formapagoId) });
        }
        this.formasPagoOptions.set(opciones);
        this.generarReporte();
      },
      error: () => {
        this.formasPagoOptions.set([
          { label: 'Todas las formas de pago', value: null },
          { label: 'Crédito', value: -1 }
        ]);
        this.generarReporte();
      }
    });
  }

  generarReporte() {
    this.cargando.set(true);
    forkJoin({
      facturasRes: this.api.get<any>('/facturacion/facturas'),
      pagosRes: this.api.get<any[]>('/facturacion/fac-caja')
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        const items = Array.isArray(res.facturasRes) ? res.facturasRes : (res.facturasRes?.value ?? []);
        const pagos = res.pagosRes ?? [];

        const fpMap = new Map<number, { formapagoId: number; nrotarjeta?: string; nroautorizacion?: string }>();
        for (const p of pagos) {
          if (p.facturaId && p.formapagoId != null) {
            if (!fpMap.has(Number(p.facturaId))) {
              fpMap.set(Number(p.facturaId), {
                formapagoId: Number(p.formapagoId),
                nrotarjeta: p.nrotarjeta,
                nroautorizacion: p.nroautorizacion
              });
            }
          }
        }

        const desde = this.fechaDesde() ? new Date(this.fechaDesde()) : null;
        const hasta = this.fechaHasta() ? new Date(this.fechaHasta()) : null;
        const fpSel = this.formaPagoId();

        if (desde) desde.setHours(0, 0, 0, 0);
        if (hasta) hasta.setHours(23, 59, 59, 999);

        const conDatos = items.map((f: any) => {
          const tipo = f.tipofactura ?? 'E';
          const fId = Number(f.facturaId ?? 0);
          const pagoInfo = fpMap.get(fId);
          const assignedFp = tipo === 'C' ? -1 : (pagoInfo?.formapagoId ?? 1);

          f._resolvedFormaPagoId = assignedFp;
          f._nrotarjeta = pagoInfo?.nrotarjeta || f.nrotarjeta || '';
          f._nroautorizacion = pagoInfo?.nroautorizacion || f.nroautorizacion || '';
          return f;
        });

        const filtradas = conDatos.filter((f: any) => {
          if (!f.fecharegistro) return false;
          const fDate = new Date(f.fecharegistro);
          if (desde && fDate < desde) return false;
          if (hasta && fDate > hasta) return false;

          if (fpSel !== null && fpSel !== undefined && Number(f._resolvedFormaPagoId) !== Number(fpSel)) {
            return false;
          }
          return true;
        });

        this.procesarGrupos(filtradas);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los datos para el reporte' });
      },
    });
  }

  private procesarGrupos(items: any[]) {
    const mapa = new Map<number, any[]>();
    const fpNameMap = new Map<number, string>();
    for (const opt of this.formasPagoOptions()) {
      if (opt.value !== null) {
        fpNameMap.set(Number(opt.value), opt.label);
      }
    }
    fpNameMap.set(-1, 'Crédito');

    for (const f of items) {
      const fpId = Number(f._resolvedFormaPagoId ?? 1);
      if (!mapa.has(fpId)) {
        mapa.set(fpId, []);
      }
      mapa.get(fpId)!.push(f);
    }

    let gSub = 0;
    let gImp = 0;
    let gDesc = 0;
    let gTot = 0;
    let gCant = 0;

    const listaGrupos: GrupoFacturaFormaPago[] = [];

    mapa.forEach((facs, fpId) => {
      const nombreFormaPago = fpNameMap.get(fpId) || (fpId === -1 ? 'Crédito' : `Forma de Pago #${fpId}`);

      facs.sort((a, b) => new Date(b.fecharegistro).getTime() - new Date(a.fecharegistro).getTime());

      let sub = 0;
      let imp = 0;
      let desc = 0;
      let tot = 0;

      for (const f of facs) {
        const s = Number(f.subTotal ?? f.subtotal ?? 0);
        const i = Number(f.impuesto ?? 0);
        const d = Number(f.descuento ?? 0);
        const t = Number(f.total ?? 0);
        sub += s;
        imp += i;
        desc += d;
        tot += t;

        gSub += s;
        gImp += i;
        gDesc += d;
        gTot += t;
        gCant++;
      }

      listaGrupos.push({
        formapagoId: fpId,
        nombreFormaPago,
        facturas: facs,
        subtotal: sub,
        impuesto: imp,
        descuento: desc,
        total: tot,
      });
    });

    listaGrupos.sort((a, b) => a.nombreFormaPago.localeCompare(b.nombreFormaPago));

    this.grupos.set(listaGrupos);
    this.totalesGenerales.set({
      subtotal: gSub,
      impuesto: gImp,
      descuento: gDesc,
      total: gTot,
      cantidad: gCant,
    });
  }

  fechaCorta(fecha: string | Date): string {
    if (!fecha) return '-';
    const d = new Date(fecha);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = String(d.getFullYear());
    return `${dd}/${mm}/${yy}`;
  }

  moneda(n: number | undefined): string {
    return (n ?? 0).toLocaleString('es-HN', { style: 'currency', currency: 'HNL' });
  }

  getTipoLabel(tipo: string): string {
    return tipo === 'C' ? 'Crédito' : 'Contado';
  }

  private metaStr(): string {
    const d = this.fechaDesde() ? this.fechaCorta(this.fechaDesde()) : 'Inicio';
    const h = this.fechaHasta() ? this.fechaCorta(this.fechaHasta()) : 'Fin';
    const fpSel = this.formaPagoId();
    const fpObj = this.formasPagoOptions().find(o => o.value === fpSel);
    const fpNombre = fpObj ? fpObj.label : 'Todas';
    return `Del: ${d} al ${h} | Forma de Pago: ${fpNombre}`;
  }

  private buildTablaPrint(): TablaPrint {
    const columnas: ColumnaPrint[] = [
      { titulo: 'Nro. Factura', alinear: 'left', pdf: 14, word: 900, excel: 10 },
      { titulo: 'Fecha', alinear: 'center', pdf: 12, word: 800, excel: 9 },
      { titulo: 'Tipo', alinear: 'center', pdf: 10, word: 600, excel: 7 },
      { titulo: 'Nro. Tarjeta', alinear: 'left', pdf: 20, word: 1400, excel: 14 },
      { titulo: 'Auth', alinear: 'left', pdf: 14, word: 900, excel: 10 },
      { titulo: 'Anulada', alinear: 'center', pdf: 10, word: 600, excel: 7 },
      { titulo: 'Subtotal', alinear: 'right', pdf: 15, word: 1000, excel: 10 },
      { titulo: 'Impuesto', alinear: 'right', pdf: 15, word: 1000, excel: 10 },
      { titulo: 'Descuento', alinear: 'right', pdf: 15, word: 1000, excel: 10 },
      { titulo: 'Total', alinear: 'right', pdf: 17, word: 1100, excel: 11 },
    ];

    const filas: (string | number | null)[][] = [];
    const filasTotalesIdx: number[] = [];
    let idxFila = 0;

    for (const g of this.grupos()) {
      filas.push([
        `FORMA DE PAGO: ${g.nombreFormaPago} (${g.facturas.length} facturas)`,
        '', '', '', '', '', '', '', '', ''
      ]);
      filasTotalesIdx.push(idxFila);
      idxFila++;

      for (const f of g.facturas) {
        const tipoTxt = this.getTipoLabel(f.tipofactura);
        const anulTxt = (f.sn_anulada ?? 'N') === 'S' ? 'Sí' : 'No';

        filas.push([
          String(f.nrofactura ?? ''),
          this.fechaCorta(f.fecharegistro),
          tipoTxt,
          f._nrotarjeta || '',
          f._nroautorizacion || '',
          anulTxt,
          Number(f.subTotal ?? f.subtotal ?? 0),
          Number(f.impuesto ?? 0),
          Number(f.descuento ?? 0),
          Number(f.total ?? 0),
        ]);
        idxFila++;
      }

      filas.push([
        `SUBTOTAL FORMA DE PAGO (${g.nombreFormaPago})`,
        '', '', '', '', '',
        g.subtotal,
        g.impuesto,
        g.descuento,
        g.total
      ]);
      filasTotalesIdx.push(idxFila);
      idxFila++;
    }

    const tG = this.totalesGenerales();
    const filaTotales = [
      `GRAN TOTAL (${tG.cantidad} facturas)`,
      '', '', '', '', '',
      tG.subtotal,
      tG.impuesto,
      tG.descuento,
      tG.total
    ];

    return {
      columnas,
      filas,
      filasTotales: filasTotalesIdx,
      filaTotales,
    };
  }

  async exportarPdf() {
    const enc = await this.print.encabezado('REPORTE DETALLADO DE FACTURACIÓN POR FORMA DE PAGO', this.metaStr());
    const tab = this.buildTablaPrint();
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });
    const altoEnc = this.print.pdfEncabezado(doc, enc);
    this.print.pdfTabla(doc, tab, altoEnc, altoEnc);
    this.print.pdfPaginar(doc, enc, altoEnc);
    doc.save(`facturacion-forma-pago-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  async exportarExcel() {
    const enc = await this.print.encabezado('REPORTE DETALLADO DE FACTURACIÓN POR FORMA DE PAGO', this.metaStr());
    const tab = this.buildTablaPrint();
    const wb = this.print.nuevoLibro();
    const ws = wb.addWorksheet('Facturación por Forma de Pago');
    const filaTab = this.print.excelEncabezado(wb, ws, enc, tab);
    this.print.excelTabla(ws, tab, filaTab, 'landscape');
    await this.print.descargarExcel(wb, `facturacion-forma-pago-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  async exportarWord() {
    const enc = await this.print.encabezado('REPORTE DETALLADO DE FACTURACIÓN POR FORMA DE PAGO', this.metaStr());
    const tab = this.buildTablaPrint();
    const children = [
      ...this.print.wordEncabezado(enc, 'landscape'),
      this.print.wordTabla(tab, 'landscape'),
    ];
    const doc = this.print.wordDocumento(enc, 'landscape', children);
    const { Packer } = await import('docx');
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `facturacion-forma-pago-${new Date().toISOString().slice(0, 10)}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
