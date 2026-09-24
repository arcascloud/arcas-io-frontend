import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { ContabilidadService } from '../../../core/services/contabilidad.service';
import { AuthService } from '../../../core/services/auth.service';
import { CtaContable } from '../../../core/models/contabilidad.models';

@Component({
  selector: 'app-reclasificacion-cuentas',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, InputTextModule, SelectModule,
    ToastModule, CardModule, TooltipModule, DialogModule, TableModule, TagModule,
  ],
  providers: [MessageService],
  templateUrl: './reclasificacion-cuentas.html',
  styleUrl: './reclasificacion-cuentas.scss',
})
export class ReclasificacionCuentasComponent implements OnInit {
  private contabilidad = inject(ContabilidadService);
  private auth = inject(AuthService);
  private messageService = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  // Datos
  cuentas = signal<CtaContable[]>([]);
  cargando = signal(false);

  // Formulario
  ctaOrigen = signal('');
  ctaDestino = signal('');

  // Dialog confirmación
  mostrarDialog = signal(false);
  resultadoReclasificacion = signal<any>(null);

  ngOnInit(): void {
    this.cargarCuentas();
  }

  cargarCuentas(): void {
    this.contabilidad.getCtacontables().pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => this.cuentas.set(data),
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las cuentas contables' }),
      });
  }

  /** Obtener descripción de una cuenta */
  getCuentaDesc(cta: string): string {
    return this.cuentas().find(c => c.ctacontable === cta)?.descripcion ?? '';
  }

  /** Obtener padre de una cuenta */
  getCuentaPadre(cta: string): string {
    const ctaObj = this.cuentas().find(c => c.ctacontable === cta);
    return (ctaObj as any)?.padre ?? '';
  }

  /** Validar que ambas cuentas estén seleccionadas y sean distintas */
  get puedeReclasificar(): boolean {
    return !!this.ctaOrigen() && !!this.ctaDestino() && this.ctaOrigen() !== this.ctaDestino();
  }

  /** Abrir dialog de confirmación */
  confirmarReclasificacion(): void {
    if (!this.puedeReclasificar) return;
    this.resultadoReclasificacion.set(null);
    this.mostrarDialog.set(true);
  }

  /** Ejecutar reclasificación */
  ejecutarReclasificacion(): void {
    if (!this.puedeReclasificar) return;

    const empresaId = this.auth.currentUser()?.empresaId ?? 0;
    this.cargando.set(true);

    this.contabilidad.reclasificarCuenta(this.ctaOrigen(), this.ctaDestino(), empresaId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.resultadoReclasificacion.set(res);
          this.cargando.set(false);
          this.messageService.add({
            severity: 'success',
            summary: 'Reclasificación exitosa',
            detail: res.message,
          });
        },
        error: (err) => {
          this.cargando.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.message || 'Error al reclasificar cuenta',
          });
        },
      });
  }

  cerrarDialog(): void {
    this.mostrarDialog.set(false);
    this.resultadoReclasificacion.set(null);
  }

  /** Limpiar formulario */
  limpiar(): void {
    this.ctaOrigen.set('');
    this.ctaDestino.set('');
    this.resultadoReclasificacion.set(null);
  }

  /** Convertir registrosAfectados a array para tabla */
  getTablaResultados(registros: Record<string, number>): { tabla: string; afectados: number }[] {
    return Object.entries(registros).map(([tabla, afectados]) => ({ tabla, afectados }));
  }
}
