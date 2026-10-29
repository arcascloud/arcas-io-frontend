import { Component, inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
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
import { FacturaImpresionService, FacturaImpresionData } from '../../../core/services/factura-impresion.service';
import { NavegacionService } from '../../../core/services/navegacion.service';
import { numeroALetras } from '../../../core/utils/numeros-a-letras';

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
  private impresion = inject(FacturaImpresionService);
  private nav = inject(NavegacionService);

  /** Partida contable de origen (viaja en la URL al abrir desde copdamae) */
  partidaId = signal<number | null>(null);

  factura = signal<any>(null);
  detalles = signal<any[]>([]);
  pagos = signal<any[]>([]);
  empresa = signal<any>({});
  correlativo = signal<any>(null);
  impuestos = signal<any>(null);
  cajero = signal<{ usuario?: string; nombre?: string; apellidos?: string } | null>(null);
  tpv = signal<number | string | null>(null);
  cargando = signal(false);
  facturaId: number = 0;

  dialogCorreo = signal(false);
  emailDestino = signal('');
  enviando = signal(false);

  ngOnInit() {
    // Partida contable de origen: viaja en la URL al abrir desde copdamae
    const partida = Number(this.route.snapshot.queryParamMap.get('partidaId'));
    if (!isNaN(partida) && partida > 0) this.partidaId.set(partida);

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
        this.correlativo.set(data.correlativo ?? null);
        this.impuestos.set(data.impuestos ?? null);
        this.cajero.set(data.cajero ?? null);
        this.tpv.set(data.tpv ?? null);
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
    // Si vino de una partida contable, regresa al detalle de esa partida
    // (la partida viaja en la URL, no en el historial: se navega explícito)
    const partida = this.partidaId();
    if (partida) {
      this.router.navigate(['/contabilidad/copdamae'], { queryParams: { partidaId: partida } });
      return;
    }
    this.nav.volver(['/facturacion/consultas']);
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

  /** Desglose fiscal por tasa (viene del backend; fallback: ISV total → 15%) */
  desglose = computed(() => {
    const imp = this.impuestos();
    if (imp && (imp.gravado15 != null || imp.gravado18 != null)) {
      return {
        exonerado: Number(imp.exonerado) || 0,
        excento: Number(imp.excento) || 0,
        gravado15: Number(imp.gravado15) || 0,
        gravado18: Number(imp.gravado18) || 0,
      };
    }
    return { exonerado: 0, excento: 0, gravado15: Number(this.factura()?.impuesto) || 0, gravado18: 0 };
  });

  /** Total en letras formato ticket: "... OCHOCIENTOS CON 00/100" */
  totalEnLetrasTexto(): string {
    const base = numeroALetras(Number(this.factura()?.total) || 0).replace(/\s*LEMPIRAS$/i, '').trim();
    if (/\d{2}\/100$/.test(base)) return base.replace(/(\d{2}\/100)$/, 'CON $1');
    return base + ' CON 00/100';
  }

  // ==================== IMPRESIÓN / PDF ====================

  /** Payload para el servicio de impresión (formato TICKET/CARTA desde timpresoras) */
  private datosImpresion(): FacturaImpresionData {
    return {
      factura: this.factura(),
      detalles: this.detalles(),
      pagos: this.pagos(),
      empresa: this.empresa(),
      correlativo: this.correlativo(),
      impuestos: this.impuestos() ?? undefined,
      cajero: this.cajero(),
      tpv: this.tpv(),
    };
  }

  async imprimir() {
    try {
      await this.impresion.imprimir(this.datosImpresion());
    } catch {
      this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudo generar la impresión' });
    }
  }

  async descargarPdf() {
    try {
      const id = this.factura()?.nrofactura ?? this.facturaId;
      await this.impresion.descargar(this.datosImpresion(), 'factura-' + id + '.pdf');
    } catch {
      this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudo descargar el PDF' });
    }
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
      const id = this.factura()?.nrofactura ?? this.facturaId;
      const total = this.moneda(this.factura()?.total);
      const nombre = this.factura()?.nombrecliente || 'Cliente';
      const texto = encodeURIComponent(`Factura #${id} - ${nombre} - Total: ${total}`);

      // PDF en el formato parametrizado (TICKET 80mm o CARTA LETTER)
      const blob = await this.impresion.getBlob(this.datosImpresion());
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
