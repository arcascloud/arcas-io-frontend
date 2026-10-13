import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { CxcService } from '../../../core/services/cxc.service';
import { NavegacionService } from '../../../core/services/navegacion.service';

interface ResumenFP {
  formapagoId: number;
  formaPago: string;
  cantidad: number;
  total: number;
}

interface CajaDetallada {
  cxccajaId: number;
  fecharegistro: string;
  nrocliente: string;
  nombrecliente?: string;
  nrodocumento: string;
  concepto: string;
  sn_anulado: string;
  pagos: any[];
  totalPagos: number;
}

interface RendicionData {
  fecha: string;
  cajas: CajaDetallada[];
  resumen: ResumenFP[];
  totalGeneral: number;
  totalCobros: number;
}

@Component({
  selector: 'app-rendicion-caja',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePickerModule, ButtonModule, TableModule, TagModule, TooltipModule],
  templateUrl: './rendicion-caja.html',
  styleUrl: './rendicion-caja.scss',
})
export class RendicionCaja implements OnInit {
  private cxcService = inject(CxcService);
  private msgs = inject(MessageService);
  private navegacion = inject(NavegacionService);
  private destroyRef = inject(DestroyRef);

  fecha = signal<Date>(new Date());
  fechaMax = new Date();
  cargando = signal(false);
  imprimiendo = signal<number | null>(null);
  rendicion = signal<RendicionData | null>(null);

  ngOnInit() {
    this.cargarRendicion();
  }

  cargarRendicion() {
    const f = this.fecha();
    if (!f) return;

    const anio = f.getFullYear();
    const mes = String(f.getMonth() + 1).padStart(2, '0');
    const dia = String(f.getDate()).padStart(2, '0');
    const fechaStr = `${anio}-${mes}-${dia}`;

    this.cargando.set(true);
    this.cxcService.getRendicionCaja(fechaStr).subscribe({
      next: (data) => {
        this.rendicion.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.rendicion.set(null);
        this.cargando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la rendición' });
      },
    });
  }

  onFechaChange() {
    this.cargarRendicion();
  }

  imprimir() {
    const data = this.rendicion();
    if (!data) return;

    const fmt = (n: number) => `L ${Number(n || 0).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const fecha = new Date(data.fecha).toLocaleDateString('es-HN');

    const resumenHtml = data.resumen.map((r) => `<tr>
      <td>${r.formaPago}</td>
      <td class="center">${r.cantidad}</td>
      <td class="right">${fmt(r.total)}</td>
    </tr>`).join('');

    const cajasHtml = data.cajas.map((c) => {
      const fechaCaja = c.fecharegistro ? new Date(c.fecharegistro).toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' }) : '';
      return `<tr>
        <td>${c.cxccajaId}</td>
        <td>${fechaCaja}</td>
        <td>${c.nrocliente}</td>
        <td>${c.nrodocumento || '—'}</td>
        <td class="right">${fmt(c.totalPagos)}</td>
      </tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Rendición de Caja ${fecha}</title>
<style>
  @page { margin: 10mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Courier New', Courier, monospace; font-size: 11px; color: #000; }
  .center { text-align: center; }
  .right { text-align: right; }
  .bold { font-weight: bold; }
  h1 { font-size: 14px; text-align: center; margin: 8px 0; text-transform: uppercase; }
  .line { border-top: 1px solid #000; margin: 6px 0; }
  .line2 { border-top: 2px solid #000; margin: 6px 0; }
  table { width: 100%; border-collapse: collapse; margin: 6px 0; }
  th { font-size: 9px; text-align: left; border-bottom: 1px solid #000; padding: 3px 2px; text-transform: uppercase; }
  td { padding: 3px 2px; font-size: 10px; }
  .total-row { font-size: 12px; font-weight: bold; border-top: 2px solid #000; padding-top: 4px; }
  .section-title { font-size: 11px; font-weight: bold; margin: 8px 0 2px; text-transform: uppercase; }
</style>
</head>
<body>
  <h1>Rendición de Caja</h1>
  <div class="center bold">Fecha: ${fecha}</div>
  <div class="center">Cobros: ${data.totalCobros}</div>
  <div class="line2"></div>

  <div class="section-title">Resumen por Forma de Pago</div>
  <table>
    <thead>
      <tr><th>Forma de Pago</th><th class="center">Cant.</th><th class="right">Total</th></tr>
    </thead>
    <tbody>${resumenHtml}</tbody>
  </table>

  <div class="line2"></div>
  <div class="total-row right">TOTAL GENERAL: ${fmt(data.totalGeneral)}</div>
  <div class="line2"></div>

  <div class="section-title">Detalle de Cobros</div>
  <table>
    <thead>
      <tr><th>#</th><th>Hora</th><th>Cliente</th><th>Doc.</th><th class="right">Total</th></tr>
    </thead>
    <tbody>${cajasHtml}</tbody>
  </table>

  <div class="line2"></div>
  <div class="total-row right">TOTAL: ${fmt(data.totalGeneral)}</div>
</body>
</html>`;

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      this.msgs.add({ severity: 'warn', summary: 'Impresión', detail: 'Permita las ventanas emergentes para imprimir' });
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  }

  volver() {
    this.navegacion.volver(['/cxc/caja']);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // REIMPRESIÓN DE RECIBO DE COBRO
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Reimprime el recibo de cobro de una caja específica desde la rendición.
   * Usa el mismo endpoint y formato térmico 80mm que el formulario de Caja.
   */
  imprimirRecibo(cajaId: number) {
    if (!cajaId) return;

    this.imprimiendo.set(cajaId);
    this.cxcService.getCajaRecibo(cajaId).subscribe({
      next: (data) => {
        this.imprimiendo.set(null);
        this.abrirRecibo(data);
      },
      error: () => {
        this.imprimiendo.set(null);
        this.msgs.add({ severity: 'warn', summary: 'Impresión', detail: 'No se pudieron cargar los datos del recibo' });
      },
    });
  }

  private abrirRecibo(data: any) {
    const caja = data.caja;
    const cliente = data.cliente;
    const empresa = data.empresa;
    const detalles = data.detalles || [];

    const fmt = (n: number) => `L ${Number(n || 0).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const fecha = caja.fecharegistro ? new Date(caja.fecharegistro).toLocaleDateString('es-HN') : '';
    const hora = caja.fecharegistro ? new Date(caja.fecharegistro).toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' }) : '';

    const pagosHtml = detalles.map((d: any) => {
      let extra = '';
      if (d.nrotarjeta) extra += ` ****${String(d.nrotarjeta).slice(-4)}`;
      if (d.nroautorizacion) extra += ` Aut: ${d.nroautorizacion}`;
      return `<tr>
        <td>${d.formaPago}${extra}</td>
        <td class="right">${fmt(d.importe)}</td>
      </tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Recibo Caja #${caja.cxccajaId}</title>
<style>
  @page { margin: 4mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Courier New', Courier, monospace;
    font-size: 11px;
    width: 72mm;
    padding: 2mm;
    color: #000;
  }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .line { border-top: 1px dashed #000; margin: 4px 0; }
  .line2 { border-top: 2px solid #000; margin: 4px 0; }
  .right { text-align: right; }
  .header { margin-bottom: 6px; }
  .header .empresa { font-size: 13px; font-weight: bold; }
  .header .info { font-size: 9px; }
  .recibo-title { font-size: 12px; font-weight: bold; text-align: center; margin: 6px 0 2px; }
  .doc-info { margin: 4px 0; }
  .doc-info .row { display: flex; justify-content: space-between; }
  .cliente-box { margin: 4px 0; padding: 2px 0; }
  table { width: 100%; border-collapse: collapse; margin: 4px 0; }
  th { font-size: 9px; text-align: left; border-bottom: 1px solid #000; padding: 2px 0; }
  td { padding: 2px 0; font-size: 10px; }
  .total-row { font-size: 12px; font-weight: bold; border-top: 2px solid #000; padding-top: 3px; }
  .mensaje { font-size: 8px; text-align: center; margin-top: 6px; font-style: italic; }
  .firma { margin-top: 16px; text-align: center; }
  .firma .line-firma { border-top: 1px solid #000; width: 60mm; margin: 0 auto 2px; }
  .anulado { color: #000; font-size: 14px; font-weight: bold; text-align: center; border: 2px solid #000; padding: 2px; margin: 4px 0; }
</style>
</head>
<body>
  <div class="header center">
    <div class="empresa">${empresa.nombre || 'EMPRESA'}</div>
    ${empresa.rtn ? `<div class="info">RTN: ${empresa.rtn}</div>` : ''}
    ${empresa.direccion ? `<div class="info">${empresa.direccion}</div>` : ''}
    ${empresa.telefono ? `<div class="info">Tel: ${empresa.telefono}</div>` : ''}
  </div>

  <div class="line2"></div>
  <div class="recibo-title">RECIBO DE COBRO</div>
  <div class="line2"></div>

  ${caja.sn_anulado === 'S' ? '<div class="anulado">*** ANULADO ***</div>' : ''}

  <div class="doc-info">
    <div class="row"><span>Recibo #:</span><span class="bold">${caja.cxccajaId}</span></div>
    <div class="row"><span>Fecha:</span><span>${fecha} ${hora}</span></div>
    ${data.tipoDocumento ? `<div class="row"><span>Doc. Fiscal:</span><span>${data.tipoDocumento}</span></div>` : ''}
    ${caja.nrodocumento ? `<div class="row"><span>Documento #:</span><span>${caja.nrodocumento}</span></div>` : ''}
  </div>

  <div class="line"></div>

  <div class="cliente-box">
    <div class="row"><span>Cliente:</span><span class="bold">${cliente.razonsocial || `${cliente.nombres} ${cliente.apellidos}`}</span></div>
    <div class="row"><span>Código:</span><span>${cliente.nrocliente}</span></div>
    ${cliente.dni ? `<div class="row"><span>DNI:</span><span>${cliente.dni}</span></div>` : ''}
    ${cliente.rtn ? `<div class="row"><span>RTN:</span><span>${cliente.rtn}</span></div>` : ''}
  </div>

  <div class="line"></div>

  <table>
    <thead>
      <tr>
        <th>Forma de Pago</th>
        <th class="right">Importe</th>
      </tr>
    </thead>
    <tbody>
      ${pagosHtml}
    </tbody>
  </table>

  <div class="line2"></div>
  <div class="total-row" style="display:flex; justify-content:space-between;">
    <span>TOTAL</span>
    <span>${fmt(data.totalPagos)}</span>
  </div>
  <div class="line2"></div>

  ${caja.concepto ? `<div style="margin-top:4px;"><strong>Concepto:</strong> ${caja.concepto}</div>` : ''}

  <div class="firma">
    <div class="line-firma"></div>
    <div style="font-size:9px;">Firma de conformidad</div>
  </div>

  ${empresa.mensajeFactura ? `<div class="mensaje">${empresa.mensajeFactura}</div>` : ''}
  <div class="mensaje">Gracias por su pago</div>
</body>
</html>`;

    const printWindow = window.open('', '_blank', 'width=320,height=600');
    if (!printWindow) {
      this.msgs.add({ severity: 'warn', summary: 'Impresión', detail: 'Permita las ventanas emergentes para imprimir' });
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  }

  /** Calcula el porcentaje de un valor sobre el total. */
  porcentaje(valor: number, total: number): string {
    if (!total) return '0.0';
    return ((valor / total) * 100).toFixed(1);
  }
}
