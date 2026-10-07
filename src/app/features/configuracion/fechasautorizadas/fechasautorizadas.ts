import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageService, ConfirmationService } from 'primeng/api';
import { FecService } from '../../../core/services/fec.service';
import { UsuariosService } from '../../../core/services/usuarios.service';
import { EmpresasService } from '../../../core/services/empresas.service';
import { AuthService } from '../../../core/services/auth.service';
import { Fecma, Fecdet, FecmaPayload } from '../../../core/models/fec.models';
import { Usuario } from '../../../core/models/usuario.models';
import { Empresa } from '../../../core/models/empresa.models';

/**
 * Fechas Contables Autorizadas — gestión de rangos contables especiales
 * para períodos cerrados (tfecma + tfecdet).
 *
 * Sección 1: form del rango (empresa, fecha contable, vigencia).
 * Sección 2: card "Item" para agregar un usuario al detalle (fechas-det).
 * Sección 3: tabla DETALLE con usuario / fecha contable / permitido.
 */
@Component({
  selector: 'app-fechas-autorizadas',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule,
    SelectModule, TooltipModule, DatePickerModule,
  ],
  templateUrl: './fechasautorizadas.html',
  styleUrl: './fechasautorizadas.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FechasAutorizadas implements OnInit {
  private fecService = inject(FecService);
  private usuariosService = inject(UsuariosService);
  private empresasSvc = inject(EmpresasService);
  private auth = inject(AuthService);
  private msgs = inject(MessageService);
  private confirm = inject(ConfirmationService);
  private destroyRef = inject(DestroyRef);

  // ── Opciones (siempre en TS, nunca inline en HTML) ──────────────────
  readonly permitidoOptions: readonly { label: string; value: 'S' | 'N' }[] = [
    { label: 'Sí', value: 'S' },
    { label: 'No', value: 'N' },
  ];

  /** Solo admin/supervisor/contador pueden escribir (ROLES_FECHAS). */
  readonly puedeEscribir = this.auth.esRolFechas;

  // ── Catálogos y listas ──────────────────────────────────────────────
  items = signal<Fecma[]>([]);
  usuarios = signal<Usuario[]>([]);
  empresas = signal<Empresa[]>([]);
  cargando = signal(false);

  // ── Estado de escritura ─────────────────────────────────────────────
  guardando = signal(false);
  guardandoItem = signal(false);

  // ── Form: rango contable autorizado ─────────────────────────────────
  /** Empresa cuyo catálogo de rangos se está listando/editando. */
  empresaSel = signal<number | null>(null);
  /** Rango seleccionado (fila de la tabla de rangos); `null` = nuevo (sin guardar). */
  seleccion = signal<number | null>(null);
  /** Fecha contable (`tfecma.fechasistema`). */
  fechaContable = signal<Date | null>(null);
  fechaDesde = signal<Date | null>(null);
  fechaHasta = signal<Date | null>(null);
  /** Detalle persistido (tfecdet) del rango seleccionado. */
  detalles = signal<Fecdet[]>([]);

  // ── Card "Item": alta de detalle ────────────────────────────────────
  nuevoUsuario = signal<string | null>(null);

  // ── Computed ────────────────────────────────────────────────────────

  /** Fecha contable formateada para la columna del DETALLE. */
  fechaContableTexto = computed(() => {
    const fc = this.fechaContable();
    return fc ? this.fmtCorta(this.fmtFecha(fc)) : '—';
  });

  /** Usuarios aún no agregados al detalle del rango seleccionado. */
  usuariosDisponibles = computed(() => {
    const usados = new Set(this.detalles().map((d) => d.usuario));
    return this.usuarios().filter((u) => !usados.has(u.usuario));
  });

  ngOnInit(): void {
    this.empresaSel.set(this.auth.currentUser()?.empresaId ?? null);
    this.load();
    this.cargarCatalogos();
  }

  // ── Carga inicial ───────────────────────────────────────────────────

  private cargarCatalogos(): void {
    this.usuariosService
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (rows) => this.usuarios.set(rows ?? []),
        error: () =>
          this.msgs.add({
            severity: 'warn',
            summary: 'Aviso',
            detail: 'No se pudo cargar el catálogo de usuarios',
          }),
      });

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

  /** Carga los rangos de la empresa y preselecciona el vigente (o el primero). */
  load(): void {
    this.cargando.set(true);
    this.fecService
      .getAll(this.empresaSel() ?? undefined)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (rows) => {
          const lista = rows ?? [];
          this.items.set(lista);
          this.cargando.set(false);

          const sel = this.seleccion();
          const actual = sel != null ? lista.find((m) => m.tfecmaId === sel) : null;
          if (actual) {
            this.cargarRango(actual);
          } else if (lista.length) {
            this.cargarRango(lista.find((m) => this.esVigente(m)) ?? lista[0]);
          } else {
            this.limpiarForm();
          }
        },
        error: () => {
          this.cargando.set(false);
          this.msgs.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron cargar los rangos contables autorizados',
          });
        },
      });
  }

  // ── Navegación entre rangos / nuevo ─────────────────────────────────

  /** Botón "Nuevo rango": deja el form vacío para dar de alta. */
  nuevo(): void {
    this.limpiarForm();
  }

  /** Cambio del select "Empresa": recarga los rangos de esa empresa. */
  onEmpresaChange(id: number): void {
    this.empresaSel.set(id);
    this.limpiarForm();
    this.load();
  }

  /** Cancelar: revierte el form a los datos guardados del rango (o limpia si es nuevo). */
  cancelar(): void {
    const id = this.seleccion();
    if (id == null) {
      this.limpiarForm();
      return;
    }
    const m = this.items().find((x) => x.tfecmaId === id);
    if (m) this.cargarRango(m);
    else this.limpiarForm();
  }

  private cargarRango(m: Fecma): void {
    this.seleccion.set(m.tfecmaId);
    this.fechaContable.set(this.aDate(m.fechasistema));
    this.fechaDesde.set(this.aDate(m.fec_vig_desde));
    this.fechaHasta.set(this.aDate(m.fec_vig_hasta));
    this.detalles.set(m.detalles ?? []);
    this.nuevoUsuario.set(null);
  }

  private limpiarForm(): void {
    this.seleccion.set(null);
    this.fechaContable.set(null);
    this.fechaDesde.set(null);
    this.fechaHasta.set(null);
    this.detalles.set([]);
    this.nuevoUsuario.set(null);
  }

  // ── Guardar rango (maestro) ─────────────────────────────────────────

  guardar(): void {
    const fechaContable = this.fechaContable();
    const desde = this.fechaDesde();
    const hasta = this.fechaHasta();

    if (!fechaContable) {
      this.msgs.add({
        severity: 'warn',
        summary: 'Fecha contable requerida',
        detail: 'Debe indicar la fecha contable del rango',
      });
      return;
    }
    if (!desde || !hasta) {
      this.msgs.add({
        severity: 'warn',
        summary: 'Fechas requeridas',
        detail: 'Debe indicar las fechas "Vigente desde" y "Vigente hasta"',
      });
      return;
    }
    if (this.fmtFecha(desde) > this.fmtFecha(hasta)) {
      this.msgs.add({
        severity: 'warn',
        summary: 'Rango inválido',
        detail: 'La fecha "Vigente desde" no puede ser mayor que "Vigente hasta"',
      });
      return;
    }

    const id = this.seleccion();
    this.guardando.set(true);

    const payload: FecmaPayload = {
      fechasistema: this.fmtFecha(fechaContable),
      fec_vig_desde: this.fmtFecha(desde),
      fec_vig_hasta: this.fmtFecha(hasta),
      empresaId: this.empresaSel() ?? undefined,
    };
    // En ALTA el maestro se crea vacío: sus líneas se agregan en la card "Item".
    // (Si se enviara `detalles: []` en UPDATE, el backend lo interpretaría como
    //  reemplazo total y borraría las líneas existentes.)
    if (id == null) payload.detalles = [];

    const req$ = id != null ? this.fecService.update(id, payload) : this.fecService.create(payload);

    req$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.guardando.set(false);
        this.seleccion.set(res.tfecmaId);
        this.msgs.add({
          severity: 'success',
          summary: id != null ? 'Actualizado' : 'Rango creado',
          detail:
            id != null
              ? 'El rango contable autorizado se actualizó correctamente'
              : 'Ahora agregue los usuarios habilitados en la tarjeta "Item"',
        });
        this.load();
      },
      error: (err) => {
        this.guardando.set(false);
        this.msgs.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'No se pudo guardar el rango contable autorizado',
        });
      },
    });
  }

  // ── Detalle (tfecdet): alta / permitido / baja ──────────────────────

  /** Card "Item": agrega el usuario seleccionado al detalle (POST fechas-det). */
  agregarItem(): void {
    const id = this.seleccion();
    if (id == null) {
      this.msgs.add({
        severity: 'warn',
        summary: 'Rango sin guardar',
        detail: 'Primero guarde el rango para poder agregar usuarios al detalle',
      });
      return;
    }
    const usuario = this.nuevoUsuario();
    if (!usuario) return;
    if (this.detalles().some((d) => d.usuario === usuario)) {
      this.msgs.add({
        severity: 'warn',
        summary: 'Usuario duplicado',
        detail: `${usuario} ya está en el detalle de este rango`,
      });
      return;
    }

    this.guardandoItem.set(true);
    this.fecService
      .createDet({ fecmaeId: id, usuario, sn_permitido: 'S' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.guardandoItem.set(false);
          this.nuevoUsuario.set(null);
          this.detalles.update((lista) => [...lista, res]);
          this.syncItemsDetalle();
          this.msgs.add({
            severity: 'success',
            summary: 'Agregado',
            detail: `${usuario} quedó habilitado en este rango`,
          });
        },
        error: (err) => {
          this.guardandoItem.set(false);
          this.msgs.add({
            severity: 'error',
            summary: 'Error',
            detail: err?.error?.message || 'No se pudo agregar el usuario al detalle',
          });
        },
      });
  }

  /** Cambia sn_permitido de una línea (PUT fechas-det). */
  setPermitido(row: Fecdet, valor: 'S' | 'N'): void {
    this.fecService
      .updateDet(row.fecdetId, { sn_permitido: valor })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.detalles.update((lista) =>
            lista.map((d) => (d.fecdetId === row.fecdetId ? { ...d, sn_permitido: valor } : d)),
          );
          this.syncItemsDetalle();
        },
        error: (err) => {
          // Nueva referencia para que OnPush repinte el valor original
          this.detalles.update((lista) => [...lista]);
          this.msgs.add({
            severity: 'error',
            summary: 'Error',
            detail: err?.error?.message || 'No se pudo actualizar el permiso',
          });
        },
      });
  }

  /** Elimina una línea del detalle (DELETE fechas-det), con confirmación. */
  quitarItem(row: Fecdet): void {
    this.confirm.confirm({
      message: `¿Quitar a ${row.usuario} del detalle de este rango?`,
      header: 'Quitar usuario',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: {
        label: 'Cancelar',
        severity: 'secondary',
        variant: 'text',
        size: 'small',
        rounded: true,
      },
      acceptButtonProps: {
        label: 'Quitar',
        severity: 'danger',
        variant: 'text',
        size: 'small',
        rounded: true,
      },
      accept: () => {
        this.fecService
          .deleteDet(row.fecdetId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.detalles.update((lista) => lista.filter((d) => d.fecdetId !== row.fecdetId));
              this.syncItemsDetalle();
              this.msgs.add({
                severity: 'success',
                summary: 'Eliminado',
                detail: `${row.usuario} fue quitado del detalle`,
              });
            },
            error: (err) => {
              this.msgs.add({
                severity: 'error',
                summary: 'Error',
                detail: err?.error?.message || 'No se pudo eliminar la línea de detalle',
              });
            },
          });
      },
    });
  }

  /** Mantiene `items()` sincronizado con `detalles()` (para no perder datos al cancelar). */
  private syncItemsDetalle(): void {
    const id = this.seleccion();
    if (id == null) return;
    const det = this.detalles();
    this.items.update((lista) =>
      lista.map((m) => (m.tfecmaId === id ? { ...m, detalles: det } : m)),
    );
  }

  // ── Baja del rango ──────────────────────────────────────────────────

  /** Acción "Seleccionar" de la tabla: carga el rango en el form. */
  seleccionar(item: Fecma): void {
    this.cargarRango(item);
  }

  /** Elimina un rango (fila de la tabla o botón del form), con confirmación. */
  eliminarRango(item?: Fecma): void {
    const objetivo = item ?? this.items().find((x) => x.tfecmaId === this.seleccion());
    if (!objetivo) return;
    const id = objetivo.tfecmaId;

    this.confirm.confirm({
      message:
        `¿Eliminar el rango ${this.fmtFecha(objetivo.fec_vig_desde)} – ${this.fmtFecha(objetivo.fec_vig_hasta)}? ` +
        `Sus ${objetivo.detalles?.length ?? 0} línea(s) de detalle también se eliminarán. Esta acción no se puede deshacer.`,
      header: 'Eliminar rango contable',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: {
        label: 'Cancelar',
        severity: 'secondary',
        variant: 'text',
        size: 'small',
        rounded: true,
      },
      acceptButtonProps: {
        label: 'Eliminar',
        severity: 'danger',
        variant: 'text',
        size: 'small',
        rounded: true,
      },
      accept: () => {
        this.fecService
          .delete(id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.msgs.add({
                severity: 'success',
                summary: 'Eliminado',
                detail: 'El rango contable autorizado fue eliminado',
              });
              if (this.seleccion() === id) this.limpiarForm();
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

  // ── Helpers ─────────────────────────────────────────────────────────

  /** ¿El rango contiene la fecha de hoy? */
  esVigente(item: Fecma): boolean {
    const hoy = this.fmtFecha(new Date());
    return hoy >= this.fmtFecha(item.fec_vig_desde) && hoy <= this.fmtFecha(item.fec_vig_hasta);
  }

  /** `dd/mm/aaaa` a partir de un string `YYYY-MM-DD` (sin `new Date()` en template). */
  fmtCorta(iso: string | null | undefined): string {
    if (!iso) return '—';
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
    return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
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
