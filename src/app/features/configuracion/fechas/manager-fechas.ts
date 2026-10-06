import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DatePickerModule } from 'primeng/datepicker';
import { FieldsetModule } from 'primeng/fieldset';
import { MessageService, ConfirmationService } from 'primeng/api';
import { FecService } from '../../../core/services/fec.service';
import { UsuariosService } from '../../../core/services/usuarios.service';
import { AuthService } from '../../../core/services/auth.service';
import { Fecma, Fecdet, AutorizacionFec, EstadoFechaSistema } from '../../../core/models/fec.models';
import { Usuario } from '../../../core/models/usuario.models';

/** Fila de detalle en edición dentro del diálogo (aún sin persistir). */
interface DetalleEdicion {
  usuario: string;
  sn_permitido: 'S' | 'N';
}

@Component({
  selector: 'app-manager-fechas',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule,
    SelectModule, TagModule, TooltipModule, DialogModule, ToastModule,
    ConfirmDialogModule, DatePickerModule, FieldsetModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './manager-fechas.html',
  styleUrl: './manager-fechas.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagerFechas implements OnInit {
  private fecService = inject(FecService);
  private usuariosService = inject(UsuariosService);
  private auth = inject(AuthService);
  private msgs = inject(MessageService);
  private confirm = inject(ConfirmationService);
  private destroyRef = inject(DestroyRef);

  // ── Opciones (siempre en TS, nunca inline en HTML) ──────────────────
  readonly permitidoOptions: readonly { label: string; value: 'S' | 'N' }[] = [
    { label: 'Permitido', value: 'S' },
    { label: 'No permitido', value: 'N' },
  ];

  // ── Estado ──────────────────────────────────────────────────────────
  items = signal<Fecma[]>([]);
  usuarios = signal<Usuario[]>([]);
  cargando = signal(false);
  guardando = signal(false);
  q = signal('');

  /** Solo admin/supervisor pueden escribir (igual que en backend). */
  readonly puedeEscribir = this.auth.esRolFechas;

  filtered = computed(() => {
    const t = this.q().trim().toLowerCase();
    if (!t) return this.items();
    return this.items().filter((m) => {
      const desde = this.fmtFecha(m.fec_vig_desde);
      const hasta = this.fmtFecha(m.fec_vig_hasta);
      if (desde.includes(t) || hasta.includes(t)) return true;
      if ((m.usuarioCreated ?? '').toLowerCase().includes(t)) return true;
      return (m.detalles ?? []).some((d) => d.usuario.toLowerCase().includes(t));
    });
  });

  /** Total de usuarios habilitados en todos los rangos. */
  totalHabilitados = computed(() =>
    this.items().reduce(
      (acc, m) => acc + (m.detalles ?? []).filter((d) => d.sn_permitido === 'S').length,
      0,
    ),
  );

  // ── Dialog de edición ───────────────────────────────────────────────
  dialogVisible = signal(false);
  esEdicion = signal(false);
  fecmaId = signal<number | null>(null);
  fechaDesde = signal<Date | null>(null);
  fechaHasta = signal<Date | null>(null);
  detalles = signal<DetalleEdicion[]>([]);
  /** Usuario preseleccionado en el selector de alta de detalle. */
  nuevoUsuario = signal<string | null>(null);

  // ── Verificador de autorización ─────────────────────────────────────
  chkUsuario = signal<string>('');
  chkFecha = signal<Date | null>(null);
  chkResultado = signal<AutorizacionFec | null>(null);
  chkConsultando = signal(false);

  // ── Fecha del Sistema del ERP ───────────────────────────────────────
  estadoFecha = signal<EstadoFechaSistema | null>(null);
  cargandoFecha = signal(false);
  actualizandoFecha = signal(false);

  /** ¿La Fecha del Sistema no coincide con la del servidor? → ERP bloqueado. */
  desalineada = computed(() => {
    const e = this.estadoFecha();
    return !!e && !e.coincide;
  });

  /** Usuarios disponibles para agregar al detalle (excluye los ya agregados). */
  usuariosDisponibles = computed(() => {
    const usados = new Set(this.detalles().map((d) => d.usuario));
    return this.usuarios().filter((u) => !usados.has(u.usuario));
  });

  ngOnInit(): void {
    this.load();
    this.cargarEstadoFecha();
    this.usuariosService
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (rows) => this.usuarios.set(rows),
        error: () => this.msgs.add({
          severity: 'warn',
          summary: 'Aviso',
          detail: 'No se pudo cargar el catálogo de usuarios',
        }),
      });
  }

  load(): void {
    this.cargando.set(true);
    this.fecService
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (rows) => {
          this.items.set(rows ?? []);
          this.cargando.set(false);
        },
        error: () => {
          this.cargando.set(false);
          this.msgs.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron cargar las fechas autorizadas',
          });
        },
      });
  }

  // ── Alta / edición ──────────────────────────────────────────────────

  nuevo(): void {
    this.esEdicion.set(false);
    this.fecmaId.set(null);
    this.fechaDesde.set(null);
    this.fechaHasta.set(null);
    this.detalles.set([]);
    this.nuevoUsuario.set(null);
    this.dialogVisible.set(true);
  }

  editar(item: Fecma, e?: Event): void {
    e?.stopPropagation();
    this.esEdicion.set(true);
    this.fecmaId.set(item.tfecmaId);
    this.fechaDesde.set(this.aDate(item.fec_vig_desde));
    this.fechaHasta.set(this.aDate(item.fec_vig_hasta));
    this.detalles.set(
      (item.detalles ?? []).map((d) => ({
        usuario: d.usuario,
        sn_permitido: d.sn_permitido,
      })),
    );
    this.nuevoUsuario.set(null);
    this.dialogVisible.set(true);
  }

  agregarDetalle(): void {
    const usuario = this.nuevoUsuario();
    if (!usuario) return;
    if (this.detalles().some((d) => d.usuario === usuario)) return;
    this.detalles.update((lista) => [...lista, { usuario, sn_permitido: 'S' }]);
    this.nuevoUsuario.set(null);
  }

  quitarDetalle(usuario: string): void {
    this.detalles.update((lista) => lista.filter((d) => d.usuario !== usuario));
  }

  setPermitido(usuario: string, valor: 'S' | 'N'): void {
    this.detalles.update((lista) =>
      lista.map((d) => (d.usuario === usuario ? { ...d, sn_permitido: valor } : d)),
    );
  }

  guardar(): void {
    const desde = this.fechaDesde();
    const hasta = this.fechaHasta();

    if (!desde || !hasta) {
      this.msgs.add({
        severity: 'warn',
        summary: 'Fechas requeridas',
        detail: 'Debe indicar las fechas "Desde" y "Hasta" de la vigencia',
      });
      return;
    }
    if (this.fmtFecha(desde) > this.fmtFecha(hasta)) {
      this.msgs.add({
        severity: 'warn',
        summary: 'Rango inválido',
        detail: 'La fecha "Desde" no puede ser mayor que la fecha "Hasta"',
      });
      return;
    }
    if (this.detalles().length === 0) {
      this.msgs.add({
        severity: 'warn',
        summary: 'Detalle requerido',
        detail: 'Debe habilitar al menos un usuario en este rango de vigencia',
      });
      return;
    }

    this.guardando.set(true);
    const payload = {
      fec_vig_desde: this.fmtFecha(desde),
      fec_vig_hasta: this.fmtFecha(hasta),
      detalles: this.detalles().map((d) => ({
        usuario: d.usuario,
        sn_permitido: d.sn_permitido,
      })),
    };

    const req$ = this.esEdicion()
      ? this.fecService.update(this.fecmaId()!, payload)
      : this.fecService.create(payload);

    req$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.guardando.set(false);
        this.dialogVisible.set(false);
        this.msgs.add({
          severity: 'success',
          summary: this.esEdicion() ? 'Actualizado' : 'Creado',
          detail: 'El rango de vigencia se guardó correctamente',
        });
        this.load();
      },
      error: (err) => {
        this.guardando.set(false);
        this.msgs.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'No se pudo guardar el rango de vigencia',
        });
      },
    });
  }

  // ── Baja ────────────────────────────────────────────────────────────

  eliminar(item: Fecma, e?: Event): void {
    e?.stopPropagation();
    this.confirm.confirm({
      message: `¿Eliminar el rango ${this.fmtFecha(item.fec_vig_desde)} – ${this.fmtFecha(item.fec_vig_hasta)}? ` +
        `Sus ${item.detalles?.length ?? 0} línea(s) de detalle también se eliminarán. Esta acción no se puede deshacer.`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.fecService.delete(item.tfecmaId).subscribe({
          next: () => {
            this.msgs.add({
              severity: 'success',
              summary: 'Eliminado',
              detail: 'El rango de vigencia fue eliminado',
            });
            this.load();
          },
          error: (err) => {
            this.msgs.add({
              severity: 'error',
              summary: 'Error',
              detail: err?.error?.message || 'No se pudo eliminar el rango',
            });
          },
        });
      },
    });
  }

  // ── Verificador de autorización ─────────────────────────────────────

  verificar(): void {
    const usuario = this.chkUsuario().trim();
    if (!usuario) {
      this.msgs.add({
        severity: 'warn',
        summary: 'Seleccione usuario',
        detail: 'Debe elegir el usuario a consultar',
      });
      return;
    }
    this.chkConsultando.set(true);
    const fecha = this.chkFecha() ? this.fmtFecha(this.chkFecha()!) : undefined;
    this.fecService
      .autorizar(usuario, fecha)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.chkConsultando.set(false);
          this.chkResultado.set(res);
        },
        error: () => {
          this.chkConsultando.set(false);
          this.chkResultado.set(null);
          this.msgs.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo consultar la autorización',
          });
        },
      });
  }

  limpiarVerificacion(): void {
    this.chkUsuario.set('');
    this.chkFecha.set(null);
    this.chkResultado.set(null);
  }

  // ── Fecha del Sistema del ERP ───────────────────────────────────────

  /**
   * Consulta `tempresas.fechasistema` vs `CURDATE()`.
   * Es un GET: siempre responde, incluso con el ERP bloqueado.
   */
  cargarEstadoFecha(): void {
    this.cargandoFecha.set(true);
    this.fecService
      .getEstadoFechaSistema()
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
      acceptButtonStyleClass: 'p-button-danger',
      acceptLabel: 'Sí, actualizar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.actualizandoFecha.set(true);
        this.fecService
          .actualizarFechaSistema(destino)
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

  // ── Helpers ─────────────────────────────────────────────────────────

  /** Estado visual del rango respecto a la fecha de hoy. */
  estadoVigencia(item: Fecma): { label: string; severity: 'success' | 'secondary' | 'warn' } {
    const hoy = this.fmtFecha(new Date());
    const desde = this.fmtFecha(item.fec_vig_desde);
    const hasta = this.fmtFecha(item.fec_vig_hasta);
    if (hoy < desde) return { label: 'Pendiente', severity: 'secondary' };
    if (hoy > hasta) return { label: 'Vencido', severity: 'warn' };
    return { label: 'Vigente', severity: 'success' };
  }

  /** Cuenta de usuarios con sn_permitido='S'. */
  habilitados(item: Fecma): number {
    return (item.detalles ?? []).filter((d) => d.sn_permitido === 'S').length;
  }

  /** `YYYY-MM-DD` local (sin desplazar el día por la zona horaria). */
  fmtFecha(valor: Date | string | null | undefined): string {
    if (valor == null) return '';
    const d = this.aDate(valor);
    if (isNaN(d.getTime())) return '';
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mes}-${dia}`;
  }

  /** Convierte un valor del backend (string o Date) a Date local a medianoche. */
  private aDate(valor: Date | string): Date {
    if (valor instanceof Date) return new Date(valor.getFullYear(), valor.getMonth(), valor.getDate());
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(valor);
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    const d = new Date(valor);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
}
