import { Component, inject, signal, OnInit, computed, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ToolbarModule } from 'primeng/toolbar';
import { forkJoin } from 'rxjs';
import { CxcService } from '../../../core/services/cxc.service';

export interface ClienteSaldo {
  clienteId: number;
  nrocliente: string;
  cliente: string;
  dni: string;
  rtn?: string;
  direccion?: string;
  telefono?: string;
  total: number;
  corriente: number;
  vencido30: number;
  vencido60: number;
  vencido90: number;
  fechaUltimoMov?: string;
}

export interface CartaRecordatorio {
  cliente: ClienteSaldo;
  tipo: '30' | '60' | '90';
  fecha: Date;
  saldo: number;
}

@Component({
  selector: 'app-cartas-recordatorio',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule, SelectModule, DatePickerModule, TooltipModule, ToolbarModule],
  templateUrl: './cartas-recordatorio.html',
  styleUrl: './cartas-recordatorio.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartasRecordatorio implements OnInit {
  private service = inject(CxcService);
  private msgs = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  data = signal<ClienteSaldo[]>([]);
  cargando = signal(false);
  q = signal('');
  tipoFiltro = signal<string>('todos');
  fechaCarta = signal<Date>(new Date());

  readonly tipoOptions = [
    { label: 'Todos', value: 'todos' },
    { label: '30 Días', value: '30' },
    { label: '60 Días', value: '60' },
    { label: '90+ Días', value: '90' },
  ];

  filtered = computed(() => {
    const search = this.q().toLowerCase();
    const tipo = this.tipoFiltro();
    let items = this.data();

    if (search) {
      items = items.filter(item =>
        item.cliente.toLowerCase().includes(search) ||
        item.nrocliente.toLowerCase().includes(search)
      );
    }

    if (tipo !== 'todos') {
      items = items.filter(item => {
        if (tipo === '30') return item.vencido30 > 0;
        if (tipo === '60') return item.vencido60 > 0;
        if (tipo === '90') return item.vencido90 > 0;
        return true;
      });
    }

    return items;
  });

  cartasGeneradas = signal<CartaRecordatorio[]>([]);

  ngOnInit() {
    this.load();
  }

  load() {
    this.cargando.set(true);
    this.service.getAntiguedadSaldosPrestamosCuotas().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.data.set(res ?? []);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las cartas de recordatorio' });
      },
    });
  }

  moneda(n: number): string {
    const val = Number(n) || 0;
    const partes = val.toFixed(2).split('.');
    partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return partes.join('.');
  }

  getSaldoPorTipo(cliente: ClienteSaldo, tipo: string): number {
    if (tipo === '30') return cliente.vencido30;
    if (tipo === '60') return cliente.vencido60;
    if (tipo === '90') return cliente.vencido90;
    return cliente.total;
  }

  getTipoLabel(tipo: string): string {
    const labels: Record<string, string> = {
      '30': '30 Días',
      '60': '60 Días',
      '90': '90+ Días',
    };
    return labels[tipo] || tipo;
  }

  getTipoSeverity(tipo: string): 'success' | 'warning' | 'danger' | 'info' {
    if (tipo === '90') return 'danger';
    if (tipo === '60') return 'warning';
    if (tipo === '30') return 'info';
    return 'success';
  }

  generarCartas() {
    const clientes = this.filtered();
    if (clientes.length === 0) {
      this.msgs.add({ severity: 'warn', summary: 'Sin datos', detail: 'No hay clientes para generar cartas' });
      return;
    }

    const cartas: CartaRecordatorio[] = [];
    const fecha = this.fechaCarta();

    clientes.forEach(cliente => {
      if (cliente.vencido90 > 0) {
        cartas.push({ cliente, tipo: '90', fecha, saldo: cliente.vencido90 });
      }
      if (cliente.vencido60 > 0) {
        cartas.push({ cliente, tipo: '60', fecha, saldo: cliente.vencido60 });
      }
      if (cliente.vencido30 > 0) {
        cartas.push({ cliente, tipo: '30', fecha, saldo: cliente.vencido30 });
      }
    });

    this.cartasGeneradas.set(cartas);
    this.msgs.add({ severity: 'success', summary: 'Cartas generadas', detail: `Se generaron ${cartas.length} cartas de recordatorio` });
  }

  imprimirCarta(carta: CartaRecordatorio) {
    const contenido = this.generarContenidoCarta(carta);
    const ventana = window.open('', '_blank');
    if (ventana) {
      ventana.document.write(contenido);
      ventana.document.close();
      ventana.print();
    }
  }

  imprimirTodas() {
    const cartas = this.cartasGeneradas();
    if (cartas.length === 0) {
      this.msgs.add({ severity: 'warn', summary: 'Sin cartas', detail: 'Primero genere las cartas' });
      return;
    }

    const contenido = cartas.map(c => this.generarContenidoCarta(c)).join('<div style="page-break-after: always;"></div>');
    const ventana = window.open('', '_blank');
    if (ventana) {
      ventana.document.write(contenido);
      ventana.document.close();
      ventana.print();
    }
  }

  private generarContenidoCarta(carta: CartaRecordatorio): string {
    const fechaStr = carta.fecha.toLocaleDateString('es-HN', { year: 'numeric', month: 'long', day: 'numeric' });
    const cliente = carta.cliente;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Carta de Recordatorio - ${cliente.cliente}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #0066cc; padding-bottom: 20px; }
          .header h1 { color: #0066cc; margin: 0; font-size: 24px; }
          .header p { color: #666; margin: 5px 0 0; }
          .fecha { text-align: right; margin-bottom: 20px; }
          .cliente-info { margin-bottom: 20px; }
          .cliente-info p { margin: 5px 0; }
          .saldo-box { background: #f5f5f5; border: 1px solid #ddd; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .saldo-box .label { font-size: 14px; color: #666; }
          .saldo-box .monto { font-size: 24px; font-weight: bold; color: #cc0000; }
          .mensaje { margin: 20px 0; line-height: 1.6; }
          .firma { margin-top: 40px; }
          .firma .linea { border-top: 1px solid #333; width: 200px; margin-top: 50px; }
          .firma .cargo { font-size: 12px; color: #666; margin-top: 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>CARTA DE RECORDATORIO DE COBRO</h1>
          <p>Cuentas por Cobrar</p>
        </div>

        <div class="fecha">
          <p><strong>Fecha:</strong> ${fechaStr}</p>
        </div>

        <div class="cliente-info">
          <p><strong>Señor(a):</strong> ${cliente.cliente}</p>
          <p><strong>Cliente N.°:</strong> ${cliente.nrocliente}</p>
          <p><strong>DNI:</strong> ${cliente.dni}</p>
          ${cliente.direccion ? `<p><strong>Dirección:</strong> ${cliente.direccion}</p>` : ''}
          ${cliente.telefono ? `<p><strong>Teléfono:</strong> ${cliente.telefono}</p>` : ''}
        </div>

        <div class="mensaje">
          <p>Estimado(a) cliente:</p>
          <p>Por medio de la presente, le recordamos que mantiene un saldo pendiente de pago correspondiente a la categoría de <strong>${this.getTipoLabel(carta.tipo)}</strong>.</p>
          <p>Le solicitamos amablemente realizar el pago a la brevedad posible para evitar inconvenientes con su cuenta.</p>
        </div>

        <div class="saldo-box">
          <div class="label">Saldo Vencido (${this.getTipoLabel(carta.tipo)}):</div>
          <div class="monto">L ${this.moneda(carta.saldo)}</div>
        </div>

        <div class="mensaje">
          <p>Si ya realizó el pago, por favor disculpe las molestias que este pueda causarle.</p>
          <p>Para cualquier consulta, no dude en comunicarse con nosotros.</p>
        </div>

        <div class="firma">
          <p>Atentamente,</p>
          <div class="linea"></div>
          <div class="cargo">Departamento de Cobros</div>
        </div>
      </body>
      </html>
    `;
  }

  limpiarFiltros() {
    this.q.set('');
    this.tipoFiltro.set('todos');
  }
}
