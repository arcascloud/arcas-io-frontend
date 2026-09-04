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
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-cotizaciones-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule, TagModule, TooltipModule, ConfirmDialogModule, DialogModule],
  providers: [ConfirmationService],
  templateUrl: './cotizaciones-list.html',
  styleUrl: './cotizaciones-list.scss',
})
export class CotizacionesList implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  private msgs = inject(MessageService);
  private confirmation = inject(ConfirmationService);
  private destroyRef = inject(DestroyRef);
  private auth = inject(AuthService);

  data = signal<any[]>([]);
  filtered = signal<any[]>([]);
  cargando = signal(false);
  q = signal('');

  dialogCorreo = signal(false);
  emailDestino = signal('');
  enviando = signal(false);
  seleccionada = signal<any>(null);

  ngOnInit() {
    this.load();
  }

  load() {
    this.cargando.set(true);
    this.api.get<any>('/facturacion/cotizaciones').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        const items = res?.value ?? (Array.isArray(res) ? res : []);
        this.data.set(items);
        this.filtrar();
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las cotizaciones' });
      },
    });
  }

  filtrar() {
    const texto = this.q().toLowerCase().trim();
    if (!texto) {
      this.filtered.set(this.data());
      return;
    }
    this.filtered.set(
      this.data().filter((i) => {
        const nro = String(i.poscotmaeId ?? '');
        const cliente = (i.Nombrecliente ?? '').toLowerCase();
        const atendio = (i.atendio ?? '').toLowerCase();
        return nro.includes(texto) || cliente.includes(texto) || atendio.includes(texto);
      }),
    );
  }

  buscar() { this.filtrar(); }
  limpiar() { this.q.set(''); this.filtrar(); }

  nuevo() {
    this.router.navigate(['/facturacion/cotizaciones/editar', 'nuevo']);
  }

  editar(id: number) {
    this.router.navigate(['/facturacion/cotizaciones/editar', id]);
  }

  eliminar(item: any, event: Event) {
    this.confirmation.confirm({
      target: event.target as EventTarget,
      message: `¿Eliminar cotización #${item.poscotmaeId}?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: 'danger', variant: 'text', size: 'small', rounded: true },
      rejectButtonProps: { severity: 'secondary', variant: 'text', size: 'small', rounded: true },
      accept: () => {
        this.api.delete<any>('/facturacion/cotizaciones', item.poscotmaeId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => {
            this.msgs.add({ severity: 'success', summary: 'Eliminada', detail: 'Cotización eliminada' });
            this.load();
          },
          error: () => {
            this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la cotización' });
          },
        });
      },
    });
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

  estadoLabel(item: any): string {
    switch (item.sn_estadocarrito) {
      case 'A': return 'Activa';
      case 'F': return 'Facturada';
      case 'X': return 'Anulada';
      default: return item.sn_estadocarrito ?? 'N/A';
    }
  }

  estadoSeverity(item: any): string {
    switch (item.sn_estadocarrito) {
      case 'A': return 'success';
      case 'F': return 'info';
      case 'X': return 'danger';
      default: return 'secondary';
    }
  }

  esActiva(item: any): boolean {
    return item.sn_estadocarrito === 'A';
  }

  // ==================== CORREO ====================

  abrirCorreo(item: any, event?: Event) {
    event?.stopPropagation();
    this.seleccionada.set(item);
    this.emailDestino.set('');
    this.dialogCorreo.set(true);
  }

  enviarCorreo() {
    const email = this.emailDestino();
    if (!email || !email.includes('@')) {
      this.msgs.add({ severity: 'warn', summary: 'Correo inválido', detail: 'Ingrese un correo electrónico válido' });
      return;
    }
    const item = this.seleccionada();
    if (!item) return;
    this.enviando.set(true);
    const empresaId = this.auth.currentUser()?.empresaId;
    this.api.post<any>(`facturacion/cotizaciones/${item.poscotmaeId}/enviar-correo?empresaId=${empresaId}`, { email }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: any) => {
        this.enviando.set(false);
        this.dialogCorreo.set(false);
        this.msgs.add({ severity: 'success', summary: 'Correo enviado', detail: res.message || 'Cotización enviada a ' + email });
      },
      error: (err: any) => {
        this.enviando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al enviar correo' });
      },
    });
  }
}
