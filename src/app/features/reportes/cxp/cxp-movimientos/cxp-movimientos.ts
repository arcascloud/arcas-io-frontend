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

interface GrupoCxpMovimiento {
  proveedorId: number;
  nombreProveedor: string;
  movimientos: any[];
  totalImporte: number;
}

@Component({
  selector: 'app-cxp-movimientos-report',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, DatePickerModule, SelectModule],
  templateUrl: './cxp-movimientos.html',
  styleUrl: './cxp-movimientos.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxpMovimientosReport implements OnInit {
  private api = inject(ApiService);
  private print = inject(ReportesPrintService);
  private msgs = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  fechaDesde = signal<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  fechaHasta = signal<Date>(new Date());
  proveedorId = signal<number | null>(null);

  proveedoresOptions = signal<{ label: string; value: number | null }[]>([]);
  cargando = signal(false);
  grupos = signal<GrupoCxpMovimiento[]>([]);

  totalesGenerales = signal({
    totalImporte: 0,
    cantidad: 0,
  });

  ngOnInit() {
    this.cargarCatalogos();
  }

  cargarCatalogos() {
    this.cargando.set(true);
    forkJoin({
      proveedoresRes: this.api.get<any>('/cxp/proveedores'),
      docsRes: this.api.get<any[]>('/parametros/tcotipodocumentofiscal')
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: any) => {
        const provsList = Array.isArray(res.proveedoresRes) ? res.proveedoresRes : (res.proveedoresRes?.data ?? []);
        
        const opciones = [{ label: 'Todos los proveedores', value: null }];
        for (const p of provsList) {
          const nombre = p.razonsocial || p.proveedorNombre || `${p.nombres || ''} ${p.apellidos || ''}`.trim() || p.nombre || '';
          const codigo = p.codproveedor || p.proveedorId || '';
          opciones.push({ label: `${codigo} - ${nombre}`, value: Number(p.proveedorId) });
        }
        this.proveedoresOptions.set(opciones);
        this.generarReporte();
      },
      error: () => {
        this.proveedoresOptions.set([{ label: 'Todos los proveedores', value: null }]);
        this.generarReporte();
      }
    });
  }

  generarReporte() {
    this.cargando.set(true);
    forkJoin({
      movsRes: this.api.get<any[]>('/cxp/movimientos'),
      docsRes: this.api.get<any[]>('/parametros/tcotipodocumentofiscal'),
      proveedoresRes: this.api.get<any>('/cxp/proveedores')
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: any) => {
        const movs = res.movsRes ?? [];
        const docs = res.docsRes ?? [];
        const provsList = Array.isArray(res.proveedoresRes) ? res.proveedoresRes : (res.proveedoresRes?.data ?? []);

        const docMap = new Map<number, string>();
        for (const d of docs) {
          const id = Number(d.tipodocumentofiscalId ?? d.documentoId ?? d.id);
          const desc = String(d.descripcion || d.nombre || d.descripcioncorta || `Doc #${id}`);
          docMap.set(id, desc);
        }

        const provMap = new Map<number, { codigo: string; nombre: string }>();
        for (const p of provsList) {
          const pId = Number(p.proveedorId);
          const nombre = p.razonsocial || p.proveedorNombre || `${p.nombres || ''} ${p.apellidos || ''}`.trim() || p.nombre || '';
          const codigo = p.codproveedor || String(pId);
          provMap.set(pId, { codigo, nombre });
        }

        const desde = this.fechaDesde() ? new Date(this.fechaDesde()) : null;
        const hasta = this.fechaHasta() ? new Date(this.fechaHasta()) : null;
        const provSel = this.proveedorId();

        if (desde) desde.setHours(0, 0, 0, 0);
        if (hasta) hasta.setHours(23, 59, 59, 999);

        const enriquecidos = movs.map((m: any) => {
          const pId = Number(m.proveedorId ?? 0);
          const provInfo = provMap.get(pId) || { codigo: m.codproveedor || String(pId), nombre: `Proveedor #${pId}` };
          const docDesc = m.documentoId != null ? (docMap.get(Number(m.documentoId)) || `Doc #${m.documentoId}`) : '-';

          m._proveedorId = pId;
          m._nombreProveedor = `${provInfo.codigo} - ${provInfo.nombre}`;
          m._documentoDesc = docDesc;
          return m;
        });

        const filtradas = enriquecidos.filter((m: any) => {
          if (!m.fecharegistro) return false;
          const mDate = new Date(m.fecharegistro);
          if (desde && mDate < desde) return false;
          if (hasta && mDate > hasta) return false;

          if (provSel !== null && provSel !== undefined && Number(m._proveedorId) !== Number(provSel)) {
            return false;
          }
          return true;
        });

        this.procesarGrupos(filtradas);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los movimientos de CxP' });
      },
    });
  }

  private procesarGrupos(items: any[]) {
    const mapa = new Map<number, { nombre: string; items: any[] }>();

    for (const m of items) {
      const pId = Number(m._proveedorId ?? 0);
      if (!mapa.has(pId)) {
        mapa.set(pId, { nombre: m._nombreProveedor, items: [] });
      }
      mapa.get(pId)!.items.push(m);
    }

    let gImpTotal = 0;
    let gCantTotal = 0;

    const listaGrupos: GrupoCxpMovimiento[] = [];

    mapa.forEach((val, pId) => {
      // Sort movimientos: tipomov DESCENDING, then fecharegistro DESCENDING
      val.items.sort((a, b) => {
        const tA = String(a.tipomov ?? '');
        const tB = String(b.tipomov ?? '');
        const cmpTipos = tB.localeCompare(tA); // Descendente
        if (cmpTipos !== 0) return cmpTipos;
        return new Date(b.fecharegistro).getTime() - new Date(a.fecharegistro).getTime();
      });

      let subImp = 0;
      for (const m of val.items) {
        const imp = Number(m.importe ?? 0);
        subImp += imp;
        gImpTotal += imp;
        gCantTotal++;
      }

      listaGrupos.push({
        proveedorId: pId,
        nombreProveedor: val.nombre,
        movimientos: val.items,
        totalImporte: subImp,
      });
    });

    listaGrupos.sort((a, b) => a.nombreProveedor.localeCompare(b.nombreProveedor));

    this.grupos.set(listaGrupos);
    this.totalesGenerales.set({
      totalImporte: gImpTotal,
      cantidad: gCantTotal,
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

  private metaStr(): string {
    const d = this.fechaDesde() ? this.fechaCorta(this.fechaDesde()) : 'Inicio';
    const h = this.fechaHasta() ? this.fechaCorta(this.fechaHasta()) : 'Fin';
    const provSel = this.proveedorId();
    const provObj = this.proveedoresOptions().find(p => p.value === provSel);
    const provNombre = provObj ? provObj.label : 'Todos';
    return `Del: ${d} al ${h} | Proveedor: ${provNombre}`;
  }

  private buildTablaPrint(): TablaPrint {
    const columnas: ColumnaPrint[] = [
      { titulo: 'Fecha', alinear: 'center', pdf: 12, word: 800, excel: 9 },
      { titulo: 'Tipo', alinear: 'center', pdf: 10, word: 600, excel: 7 },
      { titulo: 'Documento', alinear: 'left', pdf: 20, word: 1400, excel: 14 },
      { titulo: 'Nro. Ref.', alinear: 'left', pdf: 15, word: 1000, excel: 10 },
      { titulo: 'Concepto', alinear: 'left', pdf: 23, word: 1600, excel: 16 },
      { titulo: 'Anulada', alinear: 'center', pdf: 10, word: 600, excel: 7 },
      { titulo: 'Contab.', alinear: 'center', pdf: 10, word: 600, excel: 7 },
      { titulo: 'Importe', alinear: 'right', pdf: 20, word: 1300, excel: 13 },
    ];

    const filas: (string | number | null)[][] = [];
    const filasTotalesIdx: number[] = [];
    let idxFila = 0;

    for (const g of this.grupos()) {
      filas.push([
        `PROVEEDOR: ${g.nombreProveedor} (${g.movimientos.length} movimientos)`,
        '', '', '', '', '', '', ''
      ]);
      filasTotalesIdx.push(idxFila);
      idxFila++;

      for (const m of g.movimientos) {
        const anulTxt = (m.sn_doc_anulado ?? m.sn_anulada ?? 'N') === 'S' ? 'Sí' : 'No';
        const contabTxt = (m.sn_cotabilizada ?? m.sn_contabilizada ?? 'N') === 'S' ? 'Sí' : 'No';

        filas.push([
          this.fechaCorta(m.fecharegistro),
          String(m.tipomov ?? ''),
          m._documentoDesc || '',
          m.nroreferencia || '',
          m.concepto || '',
          anulTxt,
          contabTxt,
          Number(m.importe ?? 0),
        ]);
        idxFila++;
      }

      filas.push([
        `SUBTOTAL PROVEEDOR (${g.nombreProveedor})`,
        '', '', '', '', '', '',
        g.totalImporte
      ]);
      filasTotalesIdx.push(idxFila);
      idxFila++;
    }

    const tG = this.totalesGenerales();
    const filaTotales = [
      `GRAN TOTAL (${tG.cantidad} movimientos)`,
      '', '', '', '', '', '',
      tG.totalImporte
    ];

    return {
      columnas,
      filas,
      filasTotales: filasTotalesIdx,
      filaTotales,
    };
  }

  async exportarPdf() {
    const enc = await this.print.encabezado('REPORTE DE MOVIMIENTOS DE CUENTAS POR PAGAR (CxP)', this.metaStr());
    const tab = this.buildTablaPrint();
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });
    const altoEnc = this.print.pdfEncabezado(doc, enc);
    this.print.pdfTabla(doc, tab, altoEnc, altoEnc);
    this.print.pdfPaginar(doc, enc, altoEnc);
    doc.save(`cxp-movimientos-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  async exportarExcel() {
    const enc = await this.print.encabezado('REPORTE DE MOVIMIENTOS DE CUENTAS POR PAGAR (CxP)', this.metaStr());
    const tab = this.buildTablaPrint();
    const wb = this.print.nuevoLibro();
    const ws = wb.addWorksheet('Movimientos CxP');
    const filaTab = this.print.excelEncabezado(wb, ws, enc, tab);
    this.print.excelTabla(ws, tab, filaTab, 'landscape');
    await this.print.descargarExcel(wb, `cxp-movimientos-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  async exportarWord() {
    const enc = await this.print.encabezado('REPORTE DE MOVIMIENTOS DE CUENTAS POR PAGAR (CxP)', this.metaStr());
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
    a.download = `cxp-movimientos-${new Date().toISOString().slice(0, 10)}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
