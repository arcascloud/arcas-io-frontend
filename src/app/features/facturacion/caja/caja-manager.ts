import { Component, inject, signal, computed, OnInit, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { CajaSesionService } from './caja-sesion.service';
import { CajaSesion, CajaMovimiento, CajaCorte, CajaDisponible } from './caja-sesion.models';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-caja-manager',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    DialogModule,
    TagModule,
    TooltipModule,
    SelectModule,
    CardModule,
    ToastModule,
  ],
  templateUrl: './caja-manager.html',
  styleUrl: './caja-manager.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CajaManagerComponent implements OnInit {
  private cajaService = inject(CajaSesionService);
  private auth = inject(AuthService);
  private msgs = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  empresaId = signal<number>(1);
  usuarioId = signal<number>(1);

  /** Cajas que el usuario autenticado puede operar (tusuarios_caja) */
  cajas = signal<CajaDisponible[]>([]);
  /** Caja del turno a abrir — 1 usuario = 1 caja (resuelta por el backend) */
  cajaId = computed<number>(() => this.cajas()[0]?.cajaId ?? 0);
  nombreCaja = computed<string>(() => this.cajas()[0]?.nombre ?? 'Sin caja asignada');

  sesionActiva = signal<CajaSesion | null>(null);
  cargando = signal<boolean>(false);
  saving = signal<boolean>(false);

  // Dialogs
  displayApertura = signal<boolean>(false);
  displayMovimiento = signal<boolean>(false);
  displayCorteX = signal<boolean>(false);
  displayCierre = signal<boolean>(false);

  // Forms
  montoApertura = signal<number>(0);
  
  // Movimiento form
  nuevoMov = signal<{
    tipo: 'INGRESO_EFECTIVO' | 'RETIRO_EFECTIVO' | 'APERTURA_GAVETA_MANUAL';
    monto: number;
    metodo_pago: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'OTRO';
    motivo: string;
    autorizado_por: string;
  }>({
    tipo: 'INGRESO_EFECTIVO',
    monto: 0,
    metodo_pago: 'EFECTIVO',
    motivo: '',
    autorizado_por: '',
  });

  // Corte X form
  corteXForm = signal<{ efectivo_contado: number | null; observaciones: string }>({
    efectivo_contado: null,
    observaciones: '',
  });

  // Cierre Z form
  cierreForm = signal<{ monto_declarado: number; observacion: string }>({
    monto_declarado: 0,
    observacion: '',
  });

  // Tipos de movimiento opciones
  tiposMovimientoOpts = [
    { label: 'Ingreso de Efectivo', value: 'INGRESO_EFECTIVO' },
    { label: 'Retiro de Efectivo', value: 'RETIRO_EFECTIVO' },
    { label: 'Apertura de Gaveta Manual', value: 'APERTURA_GAVETA_MANUAL' },
  ];

  metodosPagoOpts = [
    { label: 'Efectivo', value: 'EFECTIVO' },
    { label: 'Tarjeta', value: 'TARJETA' },
    { label: 'Transferencia', value: 'TRANSFERENCIA' },
    { label: 'Otro', value: 'OTRO' },
  ];

  // Totales calculados en tiempo real
  totalesCalculados = computed(() => {
    const sesion = this.sesionActiva();
    if (!sesion || !sesion.movimientos) {
      return {
        fondo_inicial: 0,
        entradas_efectivo: 0,
        salidas_efectivo: 0,
        efectivo_esperado: 0,
        otros_medios: 0,
      };
    }

    const fondo = Number(sesion.monto_apertura) || 0;
    let entradasEfectivo = 0;
    let salidasEfectivo = 0;
    let otrosMedios = 0;

    for (const m of sesion.movimientos) {
      const monto = Number(m.monto) || 0;
      const signo = Number(m.signo) || 0;

      if (m.metodo_pago === 'EFECTIVO') {
        if (signo === 1 && m.tipo !== 'APERTURA') {
          entradasEfectivo += monto;
        } else if (signo === -1) {
          salidasEfectivo += monto;
        }
      } else {
        if (signo === 1) {
          otrosMedios += monto;
        }
      }
    }

    const efectivoEsperado = fondo + entradasEfectivo - salidasEfectivo;

    return {
      fondo_inicial: fondo,
      entradas_efectivo: entradasEfectivo,
      salidas_efectivo: salidasEfectivo,
      efectivo_esperado: efectivoEsperado,
      otros_medios: otrosMedios,
    };
  });

  ngOnInit() {
    const user = this.auth.currentUser();
    if (user) {
      if (user.empresaId) this.empresaId.set(Number(user.empresaId));
      if (user.usuarioId) this.usuarioId.set(Number(user.usuarioId));
    }
    this.cargarCajas();
  }

  /**
   * Carga las cajas asignadas al usuario (tusuarios_caja → fallback cxccajeros).
   * El backend resuelve empresaId/usuarioId del JWT.
   */
  cargarCajas() {
    this.cajaService.cajasDisponibles()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (cajas) => {
          this.cajas.set(cajas);
          if (cajas.length === 0) {
            this.msgs.add({
              severity: 'warn',
              summary: 'Sin caja asignada',
              detail: 'Su usuario no tiene ninguna caja asignada. Solicite la asignación en Configuración → Usuarios de Caja.',
            });
          }
          this.cargarSesionActiva();
        },
        error: () => {
          this.cargarSesionActiva();
          this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las cajas asignadas' });
        },
      });
  }

  cargarSesionActiva() {
    this.cargando.set(true);
    // Regla R3: un usuario = un turno abierto → se consulta por usuario, no por caja.
    this.cajaService.obtenerSesionActiva(this.empresaId(), undefined, this.usuarioId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (sesion) => {
          this.sesionActiva.set(sesion);
          this.cargando.set(false);
        },
        error: () => {
          this.cargando.set(false);
          this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudo verificar la sesión activa de caja' });
        },
      });
  }

  abrirSesion() {
    if (!this.cajaId()) {
      this.msgs.add({ severity: 'warn', summary: 'Sin caja', detail: 'No tiene una caja asignada para abrir turno' });
      return;
    }

    this.saving.set(true);
    this.cajaService.abrirSesion({
      cajaId: this.cajaId(),
      monto_apertura: this.montoApertura(),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (sesion) => {
        this.sesionActiva.set(sesion);
        this.saving.set(false);
        this.displayApertura.set(false);
        this.msgs.add({ severity: 'success', summary: 'Caja Abierta', detail: `${this.nombreCaja()} — turno iniciado con L ${this.montoApertura().toFixed(2)}` });
      },
      error: (err) => {
        this.saving.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'No se pudo abrir la caja' });
      },
    });
  }

  registrarMovimiento() {
    const sesion = this.sesionActiva();
    if (!sesion) return;

    const mov = this.nuevoMov();
    if (mov.monto <= 0) {
      this.msgs.add({ severity: 'warn', summary: 'Atención', detail: 'El monto debe ser mayor a cero' });
      return;
    }

    const signo = mov.tipo === 'RETIRO_EFECTIVO' ? -1 : 1;

    this.saving.set(true);
    this.cajaService.registrarMovimiento(sesion.id, {
      empresaId: this.empresaId(),
      tipo: mov.tipo,
      signo: signo,
      monto: mov.monto,
      metodo_pago: mov.metodo_pago,
      motivo: mov.motivo,
      autorizado_por: mov.autorizado_por,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);
        this.displayMovimiento.set(false);
        this.nuevoMov.set({ tipo: 'INGRESO_EFECTIVO', monto: 0, metodo_pago: 'EFECTIVO', motivo: '', autorizado_por: '' });
        this.msgs.add({ severity: 'success', summary: 'Registrado', detail: 'Movimiento de caja guardado con éxito' });
        this.cargarSesionActiva();
      },
      error: (err) => {
        this.saving.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'No se pudo registrar el movimiento' });
      },
    });
  }

  generarCorteX() {
    const sesion = this.sesionActiva();
    if (!sesion) return;

    const form = this.corteXForm();
    this.saving.set(true);
    this.cajaService.generarCorteX(sesion.id, {
      empresaId: this.empresaId(),
      efectivo_contado: form.efectivo_contado,
      observaciones: form.observaciones,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);
        this.displayCorteX.set(false);
        this.corteXForm.set({ efectivo_contado: null, observaciones: '' });
        this.msgs.add({ severity: 'success', summary: 'Corte X Generado', detail: 'Arqueo parcial registrado correctamente' });
        this.cargarSesionActiva();
      },
      error: (err) => {
        this.saving.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'No se pudo generar el Corte X' });
      },
    });
  }

  cerrarSesionZ() {
    const sesion = this.sesionActiva();
    if (!sesion) return;

    const form = this.cierreForm();
    this.saving.set(true);
    this.cajaService.cerrarSesion(sesion.id, {
      empresaId: this.empresaId(),
      monto_declarado_cierre: form.monto_declarado,
      observacion_cierre: form.observacion,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);
        this.displayCierre.set(false);
        this.sesionActiva.set(null);
        this.msgs.add({ severity: 'success', summary: 'Caja Cerrada (Corte Z)', detail: 'Turno finalizado y cerrado correctamente' });
        this.cargarSesionActiva();
      },
      error: (err) => {
        this.saving.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'No se pudo cerrar la caja' });
      },
    });
  }
}
