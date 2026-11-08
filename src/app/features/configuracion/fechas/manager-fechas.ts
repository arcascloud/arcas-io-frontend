import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { FecService } from '../../../core/services/fec.service';
import { AuthService } from '../../../core/services/auth.service';
import { EmpresasService } from '../../../core/services/empresas.service';
import { EstadoFechaSistema } from '../../../core/models/fec.models';
import { Empresa } from '../../../core/models/empresa.models';

@Component({
  selector: 'app-manager-fechas',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, SelectModule, TagModule, ToastModule, ConfirmDialogModule],
  providers: [MessageService, ConfirmationService],
  templateUrl: './manager-fechas.html',
  styleUrl: './manager-fechas.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagerFechas implements OnInit {
  private fecService = inject(FecService);
  private auth = inject(AuthService);
  private empresasSvc = inject(EmpresasService);
  private msgs = inject(MessageService);
  private confirm = inject(ConfirmationService);
  private destroyRef = inject(DestroyRef);

  /** Solo admin/supervisor pueden escribir (igual que en backend). */
  readonly puedeEscribir = this.auth.esRolFechas;

  // ── Selección de empresa ────────────────────────────────────────────
  empresas = signal<Empresa[]>([]);
  /** Empresa cuya Fecha del Sistema se está consultando/modificando. */
  empresaSel = signal<number | null>(null);

  // ── Fecha del Sistema del ERP ───────────────────────────────────────
  estadoFecha = signal<EstadoFechaSistema | null>(null);
  cargandoFecha = signal(false);
  actualizandoFecha = signal(false);

  /** ¿La Fecha del Sistema no coincide con la del servidor? → ERP bloqueado. */
  desalineada = computed(() => {
    const e = this.estadoFecha();
    return !!e && !e.coincide;
  });

  ngOnInit(): void {
    // Preselecciona la empresa del usuario y carga su estado + catálogo.
    this.empresaSel.set(this.auth.currentUser()?.empresaId ?? null);
    this.cargarEstadoFecha();

    this.empresasSvc
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (rows) => this.empresas.set(rows ?? []),
        error: () =>
          this.msgs.add({
            severity: 'warn',
            summary: 'Aviso',
            detail: 'No se pudo cargar el catálogo de empresas',
          }),
      });
  }

  /** Cambia la empresa consultada y recarga su Fecha del Sistema. */
  onEmpresaChange(id: number): void {
    this.empresaSel.set(id);
    this.cargarEstadoFecha();
  }

  // ── Fecha del Sistema del ERP ───────────────────────────────────────

  /**
   * Consulta `tempresas.fechasistema` vs `CURDATE()`.
   * Es un GET: siempre responde, incluso con el ERP bloqueado.
   */
  cargarEstadoFecha(): void {
    this.cargandoFecha.set(true);
    this.fecService
      .getEstadoFechaSistema(this.empresaSel() ?? undefined)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (e) => {
          this.estadoFecha.set(e);
          this.cargandoFecha.set(false);
        },
        error: () => this.cargandoFecha.set(false),
      });
  }

  /** Sincroniza la Fecha del Sistema con la del servidor (exige confirmación). */
  actualizarFechaSistema(): void {
    const destino = this.estadoFecha()?.fechaServidor;
    if (!destino) return;

    this.confirm.confirm({
      message:
        `¿Establecer la Fecha del Sistema del ERP en ${this.fmtCorta(destino)}? ` +
        'Se desbloquearán todas las operaciones del sistema.',
      header: 'Actualizar Fecha del Sistema',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger rounded',
      acceptLabel: 'Sí, actualizar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.actualizandoFecha.set(true);
        this.fecService
          .actualizarFechaSistema(destino, this.empresaSel() ?? undefined)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (e) => {
              this.actualizandoFecha.set(false);
              this.estadoFecha.set(e);
              this.msgs.add({
                severity: 'success',
                summary: 'Fecha actualizada',
                detail: `La Fecha del Sistema del ERP ahora es ${this.fmtCorta(e.fechaServidor)}`,
              });
            },
            error: (err) => {
              this.actualizandoFecha.set(false);
              this.msgs.add({
                severity: 'error',
                summary: 'Error',
                detail: err?.error?.message || 'No se pudo actualizar la Fecha del Sistema',
              });
            },
          });
      },
    });
  }

  /** `dd/mm/aaaa` a partir de un string `YYYY-MM-DD` (sin `new Date()`). */
  fmtCorta(iso: string | null | undefined): string {
    if (!iso) return '—';
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
    return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
  }

  /** Igual que `fmtCorta`, con texto por defecto si no hay valor. */
  fechaTexto(iso: string | null | undefined, vacio = '—'): string {
    return iso ? this.fmtCorta(iso) : vacio;
  }

}
