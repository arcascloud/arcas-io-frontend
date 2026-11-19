import { Component, inject, signal, OnInit, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../../../core/services/api.service';
import { ReportesPrintService, EncabezadoPrint, TablaPrint, ColumnaPrint } from '../../../../core/services/reportes-print.service';

interface GrupoFacturaAnuladaHeader {
  fecharegistro: string;
  tipofactura: string;
  facturas: any[];
  subtotal: number;
  impuesto: number;
  descuento: number;
  total: number;
}

@Component({
  selector: 'app-facturas-anuladas',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, DatePickerModule],
  templateUrl: './facturas-anuladas.html',
  styleUrl: './facturas-anuladas.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FacturasAnuladasReport implements OnInit {
  private api = inject(ApiService);
  private print = inject(ReportesPrintService);
  private msgs = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  fechaDesde = signal<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  fechaHasta = signal<Date>(new Date());
  
  cargando = signal(false);
  grupos = signal<GrupoFacturaAnuladaHeader[]>([]);

  totalesGenerales = signal({
    subtotal: 0,
    impuesto: 0,
    descuento: 0,
    total: 0,
    cantidad: 0,
  });

  ngOnInit() {
    this.generarReporte();
  }

  generarReporte() {
    this.cargando.set(true);
    this.api.get<any>('/facturacion/facturas').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: any) => {
        const items = Array.isArray(res) ? res : (res?.value ?? []);
        const desde = this.fechaDesde() ? new Date(this.fechaDesde()) : null;
        const hasta = this.fechaHasta() ? new Date(this.fechaHasta()) : null;
        if (desde) desde.setHours(0, 0, 0, 0);
        if (hasta) hasta.setHours(23, 59, 59, 999);

        const filtradas = items.filter((f: any) => {
          if (!f.fecharegistro) return false;
          if ((f.sn_anulada ?? 'N') !== 'S') return false;
          const fDate = new Date(f.fecharegistro);
          if (desde && fDate < desde) return false;
          if (hasta && fDate > hasta) return false;
          return true;
        });

        this.procesarGrupos(filtradas);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las facturas anuladas para el reporte' });
      },
    });
  }

  private procesarGrupos(items: any[]) {
    const mapa = new Map<string, any[]>();

    for (const f of items) {
      const fechaStr = this.fechaCorta(f.fecharegistro);
      const tipo = f.tipofactura ?? 'E';
      const key = `${fechaStr}_${tipo}`;

      if (!mapa.has(key)) {
        mapa.set(key, []);
      }
      mapa.get(key)!.push(f);
    }

    let gSub = 0;
    let gImp = 0;
    let gDesc = 0;
    let gTot = 0;
    let gCant = 0;

    const listaGrupos: GrupoFacturaAnuladaHeader[] = [];

    mapa.forEach((facs, key) => {
      const [fecha, tipo] = key.split('_');

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
        fecharegistro: fecha,
        tipofactura: tipo,
        facturas: facs,
        subtotal: sub,
        impuesto: imp,
        descuento: desc,
        total: tot,
      });
    });

    listaGrupos.sort((a, b) => b.fecharegistro.localeCompare(a.fecharegistro));

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
    return `Del: ${d} al ${h} (Solo Anuladas)`;
  }

  private buildTablaPrint(): TablaPrint {
    const columnas: ColumnaPrint[] = [
      { titulo: 'Fecha', alinear: 'left', pdf: 20, word: 1200, excel: 12 },
      { titulo: 'Nro. Factura', alinear: 'center', pdf: 25, word: 1500, excel: 15 },
      { titulo: 'Tipo', alinear: 'center', pdf: 18, word: 1000, excel: 10 },
      { titulo: 'Estado', alinear: 'center', pdf: 16, word: 900, excel: 10 },
      { titulo: 'Subtotal', alinear: 'right', pdf: 25, word: 1600, excel: 16 },
      { titulo: 'Impuesto', alinear: 'right', pdf: 25, word: 1600, excel: 16 },
      { titulo: 'Descuento', alinear: 'right', pdf: 25, word: 1600, excel: 16 },
      { titulo: 'Total', alinear: 'right', pdf: 28, word: 1740, excel: 18 },
    ];

    const filas: (string | number | null)[][] = [];
    const filasTotalesIdx: number[] = [];
    let idxFila = 0;

    for (const g of this.grupos()) {
      const tipoTxt = this.getTipoLabel(g.tipofactura);

      filas.push([
        `GRUPO ANULADAS — Fecha: ${g.fecharegistro} | Tipo: ${tipoTxt}`,
        '', '', '', '', '', '', ''
      ]);
      filasTotalesIdx.push(idxFila);
      idxFila++;

      for (const f of g.facturas) {
        filas.push([
          g.fecharegistro,
          String(f.nrofactura ?? ''),
          tipoTxt,
          'Anulada',
          Number(f.subTotal ?? f.subtotal ?? 0),
          Number(f.impuesto ?? 0),
          Number(f.descuento ?? 0),
          Number(f.total ?? 0),
        ]);
        idxFila++;
      }

      filas.push([
        `SUBTOTAL GRUPO ANULADAS (${g.fecharegistro} - ${tipoTxt})`,
        '', '', '',
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
      `GRAN TOTAL ANULADAS (${tG.cantidad} facturas)`,
      '', '', '',
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
    const enc = await this.print.encabezado('REPORTE DE FACTURAS ANULADAS', this.metaStr());
    const tab = this.buildTablaPrint();
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });
    const altoEnc = this.print.pdfEncabezado(doc, enc);
    this.print.pdfTabla(doc, tab, altoEnc, altoEnc);
    this.print.pdfPaginar(doc, enc, altoEnc);
    doc.save(`facturas-anuladas-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  async exportarExcel() {
    const enc = await this.print.encabezado('REPORTE DE FACTURAS ANULADAS', this.metaStr());
    const tab = this.buildTablaPrint();
    const wb = this.print.nuevoLibro();
    const ws = wb.addWorksheet('Facturas Anuladas');
    const filaTab = this.print.excelEncabezado(wb, ws, enc, tab);
    this.print.excelTabla(ws, tab, filaTab, 'landscape');
    await this.print.descargarExcel(wb, `facturas-anuladas-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  async exportarWord() {
    const enc = await this.print.encabezado('REPORTE DE FACTURAS ANULADAS', this.metaStr());
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
    a.download = `facturas-anuladas-${new Date().toISOString().slice(0, 10)}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
