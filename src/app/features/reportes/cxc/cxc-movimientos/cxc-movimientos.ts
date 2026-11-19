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

interface GrupoCxcMovimiento {
  clienteId: number;
  nombreCliente: string;
  movimientos: any[];
  totalImporte: number;
}

@Component({
  selector: 'app-cxc-movimientos-report',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, DatePickerModule, SelectModule],
  templateUrl: './cxc-movimientos.html',
  styleUrl: './cxc-movimientos.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxcMovimientosReport implements OnInit {
  private api = inject(ApiService);
  private print = inject(ReportesPrintService);
  private msgs = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  fechaDesde = signal<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  fechaHasta = signal<Date>(new Date());
  clienteId = signal<number | null>(null);

  clientesOptions = signal<{ label: string; value: number | null }[]>([]);
  cargando = signal(false);
  grupos = signal<GrupoCxcMovimiento[]>([]);

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
      clientesRes: this.api.get<any>('/cxc/clientes', { limit: 2000 }),
      docsRes: this.api.get<any[]>('/parametros/tcotipodocumentofiscal')
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        const rawClientes = res.clientesRes;
        const clientesList = Array.isArray(rawClientes) ? rawClientes : (rawClientes?.data ?? []);
        
        const opciones = [{ label: 'Todos los clientes', value: null }];
        for (const c of clientesList) {
          const nombre = c.razonsocial || `${c.nombres || ''} ${c.apellidos || ''}`.trim();
          opciones.push({ label: `${c.nrocliente} - ${nombre}`, value: Number(c.clienteId) });
        }
        this.clientesOptions.set(opciones);
        this.generarReporte();
      },
      error: () => {
        this.clientesOptions.set([{ label: 'Todos los clientes', value: null }]);
        this.generarReporte();
      }
    });
  }

  generarReporte() {
    this.cargando.set(true);
    forkJoin({
      movsRes: this.api.get<any[]>('/cxc/movimientos'),
      docsRes: this.api.get<any[]>('/parametros/tcotipodocumentofiscal'),
      clientesRes: this.api.get<any>('/cxc/clientes', { limit: 2000 })
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        const movs = res.movsRes ?? [];
        const docs = res.docsRes ?? [];
        const rawClientes = res.clientesRes;
        const clientesList = Array.isArray(rawClientes) ? rawClientes : (rawClientes?.data ?? []);

        const docMap = new Map<number, string>();
        for (const d of docs) {
          const id = Number(d.tipodocumentofiscalId ?? d.documentoId ?? d.id);
          const desc = String(d.descripcion || d.nombre || d.descripcioncorta || `Doc #${id}`);
          docMap.set(id, desc);
        }

        const clienteMap = new Map<number, { nro: string; nombre: string }>();
        for (const c of clientesList) {
          const cId = Number(c.clienteId);
          const nombre = c.razonsocial || `${c.nombres || ''} ${c.apellidos || ''}`.trim();
          clienteMap.set(cId, { nro: c.nrocliente || String(cId), nombre });
        }

        const desde = this.fechaDesde() ? new Date(this.fechaDesde()) : null;
        const hasta = this.fechaHasta() ? new Date(this.fechaHasta()) : null;
        const clienteSel = this.clienteId();

        if (desde) desde.setHours(0, 0, 0, 0);
        if (hasta) hasta.setHours(23, 59, 59, 999);

        const enriquecidos = movs.map((m: any) => {
          const cId = Number(m.clienteId ?? 0);
          const cliInfo = clienteMap.get(cId) || { nro: m.nrocliente || String(cId), nombre: `Cliente #${cId}` };
          const docDesc = m.documentoId != null ? (docMap.get(Number(m.documentoId)) || `Doc #${m.documentoId}`) : '-';

          m._clienteId = cId;
          m._nombreCliente = `${cliInfo.nro} - ${cliInfo.nombre}`;
          m._documentoDesc = docDesc;
          return m;
        });

        const filtradas = enriquecidos.filter((m: any) => {
          if (!m.fecharegistro) return false;
          const mDate = new Date(m.fecharegistro);
          if (desde && mDate < desde) return false;
          if (hasta && mDate > hasta) return false;

          if (clienteSel !== null && clienteSel !== undefined && Number(m._clienteId) !== Number(clienteSel)) {
            return false;
          }
          return true;
        });

        this.procesarGrupos(filtradas);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los movimientos de CxC' });
      },
    });
  }

  private procesarGrupos(items: any[]) {
    const mapa = new Map<number, { nombre: string; items: any[] }>();

    for (const m of items) {
      const cId = Number(m._clienteId ?? 0);
      if (!mapa.has(cId)) {
        mapa.set(cId, { nombre: m._nombreCliente, items: [] });
      }
      mapa.get(cId)!.items.push(m);
    }

    let gImpTotal = 0;
    let gCantTotal = 0;

    const listaGrupos: GrupoCxcMovimiento[] = [];

    mapa.forEach((val, cId) => {
      // Sort movimientos: tipomov DESCENDING (e.g. 'I' > 'D' > 'C'), then fecharegistro DESCENDING
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
        clienteId: cId,
        nombreCliente: val.nombre,
        movimientos: val.items,
        totalImporte: subImp,
      });
    });

    listaGrupos.sort((a, b) => a.nombreCliente.localeCompare(b.nombreCliente));

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
    const cliSel = this.clienteId();
    const cliObj = this.clientesOptions().find(c => c.value === cliSel);
    const cliNombre = cliObj ? cliObj.label : 'Todos';
    return `Del: ${d} al ${h} | Cliente: ${cliNombre}`;
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
        `CLIENTE: ${g.nombreCliente} (${g.movimientos.length} movimientos)`,
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
        `SUBTOTAL CLIENTE (${g.nombreCliente})`,
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
    const enc = await this.print.encabezado('REPORTE DE MOVIMIENTOS DE CUENTAS POR COBRAR (CxC)', this.metaStr());
    const tab = this.buildTablaPrint();
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });
    const altoEnc = this.print.pdfEncabezado(doc, enc);
    this.print.pdfTabla(doc, tab, altoEnc, altoEnc);
    this.print.pdfPaginar(doc, enc, altoEnc);
    doc.save(`cxc-movimientos-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  async exportarExcel() {
    const enc = await this.print.encabezado('REPORTE DE MOVIMIENTOS DE CUENTAS POR COBRAR (CxC)', this.metaStr());
    const tab = this.buildTablaPrint();
    const wb = this.print.nuevoLibro();
    const ws = wb.addWorksheet('Movimientos CxC');
    const filaTab = this.print.excelEncabezado(wb, ws, enc, tab);
    this.print.excelTabla(ws, tab, filaTab, 'landscape');
    await this.print.descargarExcel(wb, `cxc-movimientos-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  async exportarWord() {
    const enc = await this.print.encabezado('REPORTE DE MOVIMIENTOS DE CUENTAS POR COBRAR (CxC)', this.metaStr());
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
    a.download = `cxc-movimientos-${new Date().toISOString().slice(0, 10)}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
