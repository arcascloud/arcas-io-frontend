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
import { FacturaImpresionService } from '../../../core/services/factura-impresion.service';

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
  private impresion = inject(FacturaImpresionService);

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
      const data = await this.api.get<any>(`/facturacion/facturas/${f.facturaId}/ticket`).toPromise();
      if (!data) return;
      // El formato (TICKET/CARTA) lo resuelve el servicio desde timpresoras
      await this.impresion.imprimir(data);
    } catch {
      this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudo generar la impresión' });
    }
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
      const data = await this.api.get<any>(`/facturacion/facturas/${f.facturaId}/ticket`).toPromise();
      if (!data) return;

      const id = f.nrofactura || f.facturaId;
      const total = this.moneda(f.total);
      const nombre = f.nombrecliente || 'Cliente';
      const texto = encodeURIComponent(`Factura #${id} - ${nombre} - Total: ${total}`);

      // PDF en el formato parametrizado (TICKET 80mm o CARTA LETTER)
      const blob = await this.impresion.getBlob(data);
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
