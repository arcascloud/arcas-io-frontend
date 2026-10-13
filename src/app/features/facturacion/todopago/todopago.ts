import { CommonModule } from '@angular/common';
import { DestroyRef, OnInit, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import {
  TodoPagoConfig,
  TodoPagoLinkPendiente,
  TodoPagoService,
} from '../../../core/services/todopago.service';

/**
 * TodoPago — Links de pago pendientes.
 * Lista los links 'pending' de transacciones_pago (con expiración local de 48h
 * aplicada por el backend) y permite copiar, abrir, consultar estado o regenerar.
 */
@Component({
  selector: 'app-todopago',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    TooltipModule,
    ConfirmDialogModule,
  ],
  providers: [ConfirmationService],
  templateUrl: './todopago.html',
  styleUrl: './todopago.scss',
})
export class TodoPago implements OnInit {
  private svc = inject(TodoPagoService);
  private msgs = inject(MessageService);
  private confirmSvc = inject(ConfirmationService);
  private destroyRef = inject(DestroyRef);

  config = signal<TodoPagoConfig | null>(null);
  links = signal<TodoPagoLinkPendiente[]>([]);
  cargando = signal(false);
  q = signal('');
  consultandoId = signal<number | null>(null);
  regenerandoId = signal<number | null>(null);

  /** Filtro por # factura o cliente */
  filtradas = computed(() => {
    const texto = this.q().toLowerCase().trim();
    const items = this.links();
    if (!texto) return items;
    return items.filter(
      (l) =>
        String(l.nrofactura ?? '').toLowerCase().includes(texto) ||
        (l.nombrecliente ?? '').toLowerCase().includes(texto),
    );
  });

  ngOnInit() {
    this.svc
      .getConfig()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (cfg) => this.config.set(cfg) });
    this.load();
  }

  load() {
    this.cargando.set(true);
    this.svc
      .getLinksPendientes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (filas) => {
          this.links.set(filas);
          this.cargando.set(false);
        },
        error: () => {
          this.cargando.set(false);
          this.msgs.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron cargar los links pendientes',
          });
        },
      });
  }

  // ==================== ACCIONES DE FILA ====================

  copiar(l: TodoPagoLinkPendiente, $event?: Event) {
    $event?.stopPropagation();
    if (!l.url) return;
    navigator.clipboard
      .writeText(l.url)
      .then(() =>
        this.msgs.add({
          severity: 'success',
          summary: 'Link copiado',
          detail: `Factura #${l.nrofactura ?? l.facturaid}`,
        }),
      )
      .catch(() =>
        this.msgs.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo copiar el link',
        }),
      );
  }

  abrir(l: TodoPagoLinkPendiente, $event?: Event) {
    $event?.stopPropagation();
    if (l.url) window.open(l.url, '_blank');
  }

  consultarEstado(l: TodoPagoLinkPendiente, $event?: Event) {
    $event?.stopPropagation();
    this.consultandoId.set(l.id);
    this.svc
      .getStatus(l.operation_id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (tx) => {
          this.consultandoId.set(null);
          if (tx.status === 'completed') {
            this.msgs.add({
              severity: 'success',
              summary: 'Pago confirmado',
              detail: `Factura #${l.nrofactura ?? l.facturaid} — ${this.moneda(tx.monto)}`,
            });
            this.load(); // el link ya no está pendiente → sale de la lista
          } else if (tx.status === 'expired') {
            this.msgs.add({
              severity: 'warn',
              summary: 'Link expirado',
              detail: 'Genere un link nuevo para esta factura',
            });
            this.load();
          } else {
            this.msgs.add({
              severity: 'info',
              summary: 'Sin cambios',
              detail: 'El link sigue pendiente de pago',
            });
          }
        },
        error: () => {
          this.consultandoId.set(null);
          this.msgs.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo consultar el estado',
          });
        },
      });
  }

  confirmarRegenerar(l: TodoPagoLinkPendiente, $event?: Event) {
    $event?.stopPropagation();
    this.confirmSvc.confirm({
      key: 'tp-regenerar',
      message: `Se vencerá el link actual de la factura #${l.nrofactura ?? l.facturaid} y se generará uno nuevo. ¿Continuar?`,
      header: 'Regenerar link',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: {
        label: 'Regenerar',
        severity: 'danger',
        variant: 'text',
        size: 'small',
        rounded: true,
      },
      rejectButtonProps: {
        label: 'Cancelar',
        severity: 'secondary',
        variant: 'text',
        size: 'small',
        rounded: true,
      },
      accept: () => this.regenerar(l),
    });
  }

  regenerar(l: TodoPagoLinkPendiente) {
    this.regenerandoId.set(l.id);
    this.svc
      .generarLink(l.facturaid)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.regenerandoId.set(null);
          this.msgs.add({
            severity: 'success',
            summary: 'Link regenerado',
            detail: `Factura #${l.nrofactura ?? l.facturaid}`,
          });
          this.load();
        },
        error: () => {
          this.regenerandoId.set(null);
          this.msgs.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo regenerar el link',
          });
        },
      });
  }

  // ==================== HELPERS DE VISTA ====================

  moneda(n: number | undefined | null): string {
    return (n ?? 0).toLocaleString('es-HN', { style: 'currency', currency: 'HNL' });
  }

  fechaCorta(fecha: string | Date | null): string {
    if (!fecha) return '-';
    const d = new Date(fecha);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(-2);
    return `${dd}/${mm}/${yy}`;
  }

  horaCorta(fecha: string | Date | null): string {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' });
  }

  /** Antigüedad del link: min/h/días */
  edadTexto(fecha: string | Date | null): string {
    if (!fecha) return '-';
    const ms = Date.now() - new Date(fecha).getTime();
    const min = Math.floor(ms / 60000);
    if (min < 60) return `${Math.max(min, 1)} min`;
    const h = Math.floor(min / 60);
    if (h < 48) return `${h} h`;
    return `${Math.floor(h / 24)} d`;
  }
}
