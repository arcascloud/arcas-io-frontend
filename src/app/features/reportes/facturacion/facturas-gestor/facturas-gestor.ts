import { Component, inject, signal, OnInit, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../../../core/services/api.service';
import { ReportesPrintService, EncabezadoPrint, TablaPrint, ColumnaPrint } from '../../../../core/services/reportes-print.service';

interface GrupoFacturaGestor {
  gestorId: number;
  nombreGestor: string;
  facturas: any[];
  subtotal: number;
  impuesto: number;
  descuento: number;
  total: number;
}

@Component({
  selector: 'app-facturas-gestor',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, DatePickerModule, SelectModule],
  templateUrl: './facturas-gestor.html',
  styleUrl: './facturas-gestor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FacturasGestorReport implements OnInit {
  private api = inject(ApiService);
  private print = inject(ReportesPrintService);
  private msgs = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  fechaDesde = signal<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  fechaHasta = signal<Date>(new Date());
  gestorId = signal<number | null>(null);

  gestores = signal<{ label: string; value: number | null }[]>([]);
  cargando = signal(false);
  grupos = signal<GrupoFacturaGestor[]>([]);

  totalesGenerales = signal({
    subtotal: 0,
    impuesto: 0,
    descuento: 0,
    total: 0,
    cantidad: 0,
  });

  ngOnInit() {
    this.cargarGestores();
  }

  cargarGestores() {
    this.api.get<any[]>('/parametros/gestores').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (items) => {
        const ventas = (items ?? []).filter(
          (g) => Number(g.moduloId) === 3 && g.sn_activo !== 'N' && !!g.nombre
        );
        const opciones = [{ label: 'Todos los gestores', value: null }];
        for (const g of ventas) {
          opciones.push({ label: String(g.nombre), value: Number(g.gestorId) });
        }
        this.gestores.set(opciones);
        this.generarReporte();
      },
      error: () => {
        this.gestores.set([{ label: 'Todos los gestores', value: null }]);
        this.generarReporte();
      }
    });
  }

  generarReporte() {
    this.cargando.set(true);
    this.api.get<any>('/facturacion/facturas').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: any) => {
        const items = Array.isArray(res) ? res : (res?.value ?? []);
        const desde = this.fechaDesde() ? new Date(this.fechaDesde()) : null;
        const hasta = this.fechaHasta() ? new Date(this.fechaHasta()) : null;
        const gestorSel = this.gestorId();

        if (desde) desde.setHours(0, 0, 0, 0);
        if (hasta) hasta.setHours(23, 59, 59, 999);

        const filtradas = items.filter((f: any) => {
          if (!f.fecharegistro) return false;
          const fDate = new Date(f.fecharegistro);
          if (desde && fDate < desde) return false;
          if (hasta && fDate > hasta) return false;
          if (gestorSel !== null && gestorSel !== undefined && Number(f.gestorId) !== Number(gestorSel)) return false;
          return true;
        });

        this.procesarGrupos(filtradas);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las facturas para el reporte' });
      },
    });
  }

  private procesarGrupos(items: any[]) {
    const mapa = new Map<number, any[]>();
    const gestorMap = new Map<number, string>();
    for (const g of this.gestores()) {
      if (g.value !== null) {
        gestorMap.set(Number(g.value), g.label);
      }
    }

    for (const f of items) {
      const gId = Number(f.gestorId ?? 0);
      if (!mapa.has(gId)) {
        mapa.set(gId, []);
      }
      mapa.get(gId)!.push(f);
    }

    let gSub = 0;
    let gImp = 0;
    let gDesc = 0;
    let gTot = 0;
    let gCant = 0;

    const listaGrupos: GrupoFacturaGestor[] = [];

    mapa.forEach((facs, gId) => {
      const nombreGestor = gestorMap.get(gId) || (gId ? `Gestor #${gId}` : 'Sin Gestor');

      // Sort invoices by date descending inside gestor
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
        gestorId: gId,
        nombreGestor,
        facturas: facs,
        subtotal: sub,
        impuesto: imp,
        descuento: desc,
        total: tot,
      });
    });

    listaGrupos.sort((a, b) => a.nombreGestor.localeCompare(b.nombreGestor));

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
    const gestorSel = this.gestorId();
    const gestorObj = this.gestores().find(g => g.value === gestorSel);
    const gestorNombre = gestorObj ? gestorObj.label : 'Todos';
    return `Del: ${d} al ${h} | Gestor: ${gestorNombre}`;
  }

  private buildTablaPrint(): TablaPrint {
    const columnas: ColumnaPrint[] = [
      { titulo: 'Nro. Factura', alinear: 'left', pdf: 20, word: 1200, excel: 12 },
      { titulo: 'Fecha', alinear: 'center', pdf: 18, word: 1000, excel: 10 },
      { titulo: 'Tipo', alinear: 'center', pdf: 15, word: 800, excel: 8 },
      { titulo: 'Anulada', alinear: 'center', pdf: 15, word: 800, excel: 8 },
      { titulo: 'Subtotal', alinear: 'right', pdf: 24, word: 1500, excel: 15 },
      { titulo: 'Impuesto', alinear: 'right', pdf: 24, word: 1500, excel: 15 },
      { titulo: 'Descuento', alinear: 'right', pdf: 24, word: 1500, excel: 15 },
      { titulo: 'Total', alinear: 'right', pdf: 26, word: 1640, excel: 17 },
    ];

    const filas: (string | number | null)[][] = [];
    const filasTotalesIdx: number[] = [];
    let idxFila = 0;

    for (const g of this.grupos()) {
      filas.push([
        `GESTOR: ${g.nombreGestor} (${g.facturas.length} facturas)`,
        '', '', '', '', '', '', ''
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
          anulTxt,
          Number(f.subTotal ?? f.subtotal ?? 0),
          Number(f.impuesto ?? 0),
          Number(f.descuento ?? 0),
          Number(f.total ?? 0),
        ]);
        idxFila++;
      }

      filas.push([
        `SUBTOTAL GESTOR (${g.nombreGestor})`,
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
      `GRAN TOTAL (${tG.cantidad} facturas)`,
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
    const enc = await this.print.encabezado('REPORTE DETALLADO DE FACTURACIÓN POR GESTOR', this.metaStr());
    const tab = this.buildTablaPrint();
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });
    const altoEnc = this.print.pdfEncabezado(doc, enc);
    this.print.pdfTabla(doc, tab, altoEnc, altoEnc);
    this.print.pdfPaginar(doc, enc, altoEnc);
    doc.save(`facturacion-gestor-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  async exportarExcel() {
    const enc = await this.print.encabezado('REPORTE DETALLADO DE FACTURACIÓN POR GESTOR', this.metaStr());
    const tab = this.buildTablaPrint();
    const wb = this.print.nuevoLibro();
    const ws = wb.addWorksheet('Facturación por Gestor');
    const filaTab = this.print.excelEncabezado(wb, ws, enc, tab);
    this.print.excelTabla(ws, tab, filaTab, 'landscape');
    await this.print.descargarExcel(wb, `facturacion-gestor-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  async exportarWord() {
    const enc = await this.print.encabezado('REPORTE DETALLADO DE FACTURACIÓN POR GESTOR', this.metaStr());
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
    a.download = `facturacion-gestor-${new Date().toISOString().slice(0, 10)}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
