import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DrawerModule } from 'primeng/drawer';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ContabilidadService } from '../../../core/services/contabilidad.service';
import { AuthService } from '../../../core/services/auth.service';
import { CtaContable, GrupoContable, NivelCta } from '../../../core/models/contabilidad.models';
import { CtacontableFormComponent } from './ctacontable-form';

@Component({
  selector: 'app-ctacontables-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    TableModule, ButtonModule, InputTextModule, SelectModule, TagModule, TooltipModule,
    DrawerModule, ConfirmDialogModule, ToastModule,
    CtacontableFormComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './ctacontables-list.html',
  styleUrl: './ctacontables-list.scss',
})
export class CtacontablesListComponent implements OnInit {
  private contabilidad = inject(ContabilidadService);
  private auth = inject(AuthService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private destroyRef = inject(DestroyRef);

  /** Usuario con rol admin/supervisor/contador */
  esPrivilegiado = this.auth.esRolContabilidad;

  // Datos
  cuentas = signal<CtaContable[]>([]);
  grupos = signal<GrupoContable[]>([]);
  niveles = signal<NivelCta[]>([]);
  cargando = signal(false);

  // Filtros
  filtroBuscar = signal('');
  filtroGrupo = signal<number | null>(null);
  filtroNivel = signal<number | null>(null);

  // Dialog
  dialogFormVisible = signal(false);
  cuentaSeleccionada = signal<CtaContable | null>(null);
  esEdicion = signal(false);
  /** Se incrementa en cada apertura del drawer para refrescar el formulario */
  apertura = signal(0);

  readonly naturalezasOpts = [
    { label: 'Débito', value: 'D' },
    { label: 'Crédito', value: 'C' },
  ];

  // Computed: opciones para filtros
  gruposOpts = computed(() => [
    { label: 'Todos', value: null },
    ...this.grupos().map(g => ({ label: g.descripcion, value: g.tcogrupocontableId })),
  ]);

  nivelesOpts = computed(() => {
    const nivelesUnicos = [...new Set(this.cuentas().map(c => c.nivel))].sort((a, b) => a - b);
    return [
      { label: 'Todos', value: null },
      ...nivelesUnicos.map(n => ({ label: `Nivel ${n}`, value: n })),
    ];
  });

  // Computed
  cuentasFiltradas = computed(() => {
    let resultado = this.cuentas();
    const buscar = this.filtroBuscar().toLowerCase();
    const grupo = this.filtroGrupo();
    const nivel = this.filtroNivel();

    if (buscar) {
      resultado = resultado.filter(c =>
        c.ctacontable.toLowerCase().includes(buscar) ||
        c.descripcion.toLowerCase().includes(buscar)
      );
    }
    if (grupo != null) resultado = resultado.filter(c => c.tcogrupocontableId === grupo);
    if (nivel != null) resultado = resultado.filter(c => c.nivel === nivel);

    // Ordenar por zorden (asc) y luego por ctacontable (asc)
    resultado = [...resultado].sort((a, b) => {
      const za = a.zorden ?? 0;
      const zb = b.zorden ?? 0;
      if (za !== zb) return za - zb;
      return a.ctacontable.localeCompare(b.ctacontable);
    });

    return resultado;
  });

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando.set(true);
    this.contabilidad.getCuentas()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => { this.cuentas.set(data); this.cargando.set(false); },
        error: () => { this.cargando.set(false); this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las cuentas contables' }); },
      });

    this.contabilidad.getGrupos()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => this.grupos.set(data),
        error: () => {},
      });

    this.contabilidad.getNiveles()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => this.niveles.set(data),
        error: () => {},
      });
  }

  // ========== Acciones ==========

  nuevaCuenta(): void {
    this.cuentaSeleccionada.set(null);
    this.esEdicion.set(false);
    this.apertura.update((v) => v + 1);
    this.dialogFormVisible.set(true);
  }

  editarCuenta(cuenta: CtaContable): void {
    this.cuentaSeleccionada.set(cuenta);
    this.esEdicion.set(true);
    this.apertura.update((v) => v + 1);
    this.dialogFormVisible.set(true);
  }

  eliminarCuenta(cuenta: CtaContable): void {
    this.confirmationService.confirm({
      message: `¿Está seguro de eliminar la cuenta "${cuenta.ctacontable} - ${cuenta.descripcion}"?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.contabilidad.eliminarCuenta(cuenta.cuentacontablesId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.messageService.add({ severity: 'success', summary: 'Eliminada', detail: 'Cuenta contable eliminada' });
              this.cargarDatos();
            },
            error: (err) =>
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: err.error?.message || 'No se pudo eliminar la cuenta',
              }),
          });
      },
    });
  }

  onGuardado(): void {
    this.dialogFormVisible.set(false);
    this.cargarDatos();
  }

  onCancelar(): void {
    this.dialogFormVisible.set(false);
  }

  // ========== Helpers ==========

  /** Cuenta con historial de movimiento/cierre y usuario sin rol privilegiado */
  bloqueada(cuenta: CtaContable): boolean {
    return cuenta.sn_protegida === true && !this.esPrivilegiado();
  }

  getGrupoDescripcion(grupoId: number): string {
    return this.grupos().find(g => g.tcogrupocontableId === grupoId)?.descripcion ?? '-';
  }

  naturalezaLabel(nat: string): string {
    return nat === 'D' ? 'Débito' : 'Crédito';
  }

  naturalezaSeverity(nat: string): 'info' | 'warn' {
    return nat === 'D' ? 'info' : 'warn';
  }

  limpiarFiltros(): void {
    this.filtroBuscar.set('');
    this.filtroGrupo.set(null);
    this.filtroNivel.set(null);
  }
}
