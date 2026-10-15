import { Component, inject, signal, OnInit, computed, ChangeDetectionStrategy, DestroyRef, effect, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { timeout, catchError, of } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DataViewModule } from 'primeng/dataview';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { CardModule } from 'primeng/card';
import { SkeletonModule } from 'primeng/skeleton';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { CxcService } from '../../../core/services/cxc.service';
import { AuthService } from '../../../core/services/auth.service';
import { CxcCliente } from '../../../core/models/cxc.models';

@Component({
  selector: 'app-prestamos-manager',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    DataViewModule,
    TagModule,
    TooltipModule,
    CardModule,
    SkeletonModule,
    ConfirmDialogModule,
    InputNumberModule,
    SelectModule,
    DatePickerModule,
    ProgressSpinnerModule,
    IconFieldModule,
    InputIconModule,
  ],
  providers: [ConfirmationService],
  templateUrl: './prestamos-manager.html',
  styleUrl: './prestamos-manager.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrestamosManager implements OnInit {
  private service = inject(CxcService);
  private msgs = inject(MessageService);
  private confirm = inject(ConfirmationService);
  private auth = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  // ===== CLIENTES =====
  data = signal<CxcCliente[]>([]);
  cargando = signal(false);
  selectedCliente = signal<CxcCliente | null>(null);
  q = signal('');
  page = signal(1);
  limit = signal(15);
  totalClientes = signal(0);

  private _searchEffect = effect(() => {
    this.q();
    this.page.set(1);
    untracked(() => this.loadClientes());
  });

  // ===== PRESTAMO (maximo 1 por cliente) =====
  prestamoData = signal<any | null>(null);
  prestamosLoading = signal(false);
  prestamoSaving = signal(false);

  prestamoModel = signal<any>({
    clienteId: null,
    nroprestamo: '',
    capital: 0,
    prima: 0,
    capitalneto: 0,
    cuotas: 1,
    tasa: 0,
    moratorio: 0,
    vlrcuota: 0,
    fecha_aprobacion: new Date().toISOString(),
    sn_preaprobado: 'N',
    sn_activo: 'S',
  });

  prestamoFecha = computed(() => {
    const f = this.prestamoModel().fecha_aprobacion;
    if (!f) return null;
    const d = new Date(f);
    return isNaN(d.getTime()) ? null : d;
  });

  /** Capital neto = capital - prima (solo lectura en el form). */
  capitalnetoCalc = computed(() => {
    const m = this.prestamoModel();
    return Math.round(((Number(m.capital) || 0) - (Number(m.prima) || 0)) * 100) / 100;
  });

  /** Fecha de la 1er cuota = fecha de aprobación + 30 días (regla de negocio). */
  fechaEfectivaCalc = computed(() => {
    const f = this.prestamoModel().fecha_aprobacion;
    if (!f) return null;
    const d = new Date(f);
    if (isNaN(d.getTime())) return null;
    d.setDate(d.getDate() + 30);
    return d;
  });

  planPago = signal<any[]>([]);
  showPlanPago = signal(false);

  readonly estadoOptions = [
    { label: 'Activo', value: 'S' },
    { label: 'Inactivo', value: 'N' },
  ];

  /** Guarda pendiente: pre-aprobacion solicitada sobre un préstamo sin guardar. */
  private pendingPreaprobado = false;

  ngOnInit() {}

  // ===== CLIENTES =====
  loadClientes() {
    this.cargando.set(true);
    this.service
      .getClientes(this.page(), this.limit(), this.q())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        timeout(10000),
        catchError(() => of({ data: [], total: 0 })),
      )
      .subscribe({
        next: (res) => {
          this.data.set(res.data);
          this.totalClientes.set(res.total);
          this.cargando.set(false);
        },
        error: () => this.cargando.set(false),
      });
  }

  onPageChange(event: any) {
    this.page.set(event.page + 1);
    this.limit.set(event.rows);
    this.loadClientes();
  }

  limpiarFiltros() {
    this.q.set('');
    this.selectedCliente.set(null);
    this.prestamoData.set(null);
    this.planPago.set([]);
    this.showPlanPago.set(false);
    this.limpiarFormulario();
  }

  seleccionarCliente(cliente: CxcCliente) {
    this.selectedCliente.set(cliente);
    this.prestamoData.set(null);
    this.planPago.set([]);
    this.showPlanPago.set(false);
    this.loadPrestamoCliente(cliente.clienteId);
  }

  getClienteNombre(c: CxcCliente): string {
    const nombres = c.nombres || '';
    const apellidos = c.apellidos || '';
    const full = `${nombres} ${apellidos}`.trim();
    return full || c.razonsocial || c.nrocliente || 'Sin nombre';
  }

  moneda(val: any): string {
    const num = Number(val) || 0;
    if (isNaN(num)) return '0.00';
    const partes = num.toFixed(2).split('.');
    partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return partes.join('.');
  }

  // ===== PRESTAMO =====
  private loadPrestamoCliente(clienteId: number) {
    this.prestamosLoading.set(true);
    this.service
      .getPrestamosByCliente(clienteId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          const pres = Array.isArray(res) ? res[0] : res?.value ? res.value[0] : res;
          if (pres && pres.prestamoId) {
            this.prestamoData.set(pres);
            const capitalneto =
              Number(pres.capitalneto) || (Number(pres.capital) || 0) - (Number(pres.prima) || 0);
            this.prestamoModel.set({
              prestamoId: pres.prestamoId,
              clienteId: pres.clienteId,
              nroprestamo: pres.nroprestamo || '',
              capital: Number(pres.capital) || 0,
              prima: Number(pres.prima) || 0,
              capitalneto,
              cuotas: Number(pres.cuotas) || 0,
              tasa: Number(pres.tasa) || 0,
              moratorio: Number(pres.moratorio) || 0,
              vlrcuota:
                Number(pres.vlrcuota) ||
                this.calcularCuotaValue(capitalneto, Number(pres.cuotas), Number(pres.tasa)),
              fecha_aprobacion: pres.fecha_aprobacion || pres.fecharegistro,
              sn_preaprobado: pres.sn_preaprobado || 'N',
              sn_activo: pres.sn_activo || 'S',
            });
            // Plan de pago: loading sigue activo hasta que termine
            this.loadPlanPago(pres.prestamoId);
          } else {
            this.prestamoData.set(null);
            this.limpiarFormulario();
            this.planPago.set([]);
            this.showPlanPago.set(false);
            this.prestamosLoading.set(false);
          }
        },
        error: () => this.prestamosLoading.set(false),
      });
  }

  private loadPlanPago(prestamoId: number) {
    this.showPlanPago.set(false);
    this.planPago.set([]);
    this.service
      .getPrestamoPPByPrestamo(prestamoId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const cuotas = (res || []).sort((a: any, b: any) => (a.nrofila || 0) - (b.nrofila || 0));
          this.planPago.set(cuotas);
          this.showPlanPago.set(cuotas.length > 0);
          this.prestamosLoading.set(false);
        },
        error: () => {
          this.planPago.set([]);
          this.showPlanPago.set(false);
          this.prestamosLoading.set(false);
        },
      });
  }

  private calcularCuotaValue(capital: number, cuotas: number, tasaAnual: number): number {
    if (capital <= 0 || cuotas <= 0 || tasaAnual <= 0) return 0;
    const tasaMensual = tasaAnual / 100 / 12;
    const factor = tasaMensual / (1 - Math.pow(1 + tasaMensual, -cuotas));
    return Math.round(capital * factor * 100) / 100;
  }

  onPrestamoFechaChange(d: Date | null) {
    this.prestamoModel.set({
      ...this.prestamoModel(),
      fecha_aprobacion: d ? d.toISOString() : null,
    });
  }

  calcularCuota() {
    const raw = this.prestamoModel();
    // Regla de negocio: la cuota se calcula sobre el CAPITAL NETO (capital - prima)
    const capitalneto =
      Math.round(((Number(raw.capital) || 0) - (Number(raw.prima) || 0)) * 100) / 100;
    const cuotas = Number(raw.cuotas) || 0;
    const tasaAnual = Number(raw.tasa) || 0;
    const vlrcuota = this.calcularCuotaValue(capitalneto, cuotas, tasaAnual);
    this.prestamoModel.set({ ...this.prestamoModel(), capitalneto, vlrcuota });
  }

  /** Cancelar: limpia el formulario (alcance definido 14/10/2026). */
  cancelar() {
    this.limpiarFormulario();
  }

  private limpiarFormulario() {
    this.pendingPreaprobado = false;
    this.prestamoModel.set({
      clienteId: this.selectedCliente()?.clienteId ?? null,
      nroprestamo: '',
      capital: 0,
      prima: 0,
      capitalneto: 0,
      cuotas: 1,
      tasa: 0,
      moratorio: 0,
      vlrcuota: 0,
      fecha_aprobacion: new Date().toISOString(),
      sn_preaprobado: 'N',
      sn_activo: 'S',
    });
  }

  guardarPrestamo() {
    const cliente = this.selectedCliente();
    if (!cliente) {
      this.msgs.add({
        severity: 'warn',
        summary: 'Seleccione',
        detail: 'Seleccione un cliente antes de crear un prestamo',
      });
      return;
    }

    // Validar que no tenga prestamo activo
    if (this.prestamoData()) {
      this.msgs.add({
        severity: 'warn',
        summary: 'Ya existe',
        detail: 'Este cliente ya tiene un prestamo registrado',
      });
      return;
    }

    const raw = { ...this.prestamoModel() };
    const capital = Number(raw.capital) || 0;
    const prima = Number(raw.prima) || 0;
    const capitalneto = Math.round((capital - prima) * 100) / 100;
    const payload: any = {
      clienteId: cliente.clienteId,
      // El nroprestamo NO se envía: la APROBACIÓN es quien asigna el correlativo
      capital,
      prima,
      capitalneto, // el backend recalcula, pero viaja coherente
      vlrcuota: Number(raw.vlrcuota) || 0,
      cuotas: Number(raw.cuotas) || 1,
      tasa: Number(raw.tasa) || 0,
      moratorio: Number(raw.moratorio) || 0,
      fecha_aprobacion: raw.fecha_aprobacion,
      // El pre-aprobado es un paso del flujo (botón), nunca se setea manualmente
      sn_preaprobado: 'N',
      sn_activo: raw.sn_activo || 'S',
      sn_contabilizado: 'N',
    };

    if (capital <= 0) {
      this.msgs.add({
        severity: 'warn',
        summary: 'Datos incompletos',
        detail: 'El capital debe ser mayor a 0',
      });
      return;
    }
    if (prima < 0) {
      this.msgs.add({
        severity: 'warn',
        summary: 'Datos incompletos',
        detail: 'La prima no puede ser negativa',
      });
      return;
    }
    if (capitalneto <= 0) {
      this.msgs.add({
        severity: 'warn',
        summary: 'Datos incompletos',
        detail: 'El capital neto (capital - prima) debe ser mayor a 0',
      });
      return;
    }
    if (!payload.cuotas || payload.cuotas <= 0) {
      this.msgs.add({
        severity: 'warn',
        summary: 'Datos incompletos',
        detail: 'Las cuotas deben ser mayor a 0',
      });
      return;
    }

    const user = this.auth.currentUser();
    if (user) {
      payload.empresaId = payload.empresaId ?? user.empresaId;
      if (user.idsucursal != null) payload.Idsucursal = payload.Idsucursal ?? user.idsucursal;
      payload.usuarioCreated = payload.usuarioCreated ?? user.usuario ?? user.nombre;
    }

    this.prestamoSaving.set(true);
    this.service
      .createPrestamo(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.prestamoData.set(res);
          this.prestamoModel.set({
            ...this.prestamoModel(),
            prestamoId: res.prestamoId,
            nroprestamo: res.nroprestamo || '',
          });
          this.prestamoSaving.set(false);
          this.msgs.add({
            severity: 'success',
            summary: 'Guardado',
            detail: 'Prestamo registrado correctamente',
          });

          // Guardar plan de pago si existe
          const plan = this.planPago();
          if (plan.length > 0 && res?.prestamoId) {
            this.guardarPlanPagoConPrestamo(res.prestamoId, plan, cliente.clienteId);
          }

          // Encadenar pre-aprobación pendiente (flujo: guardar → pre-aprobar)
          if (this.pendingPreaprobado) {
            this.pendingPreaprobado = false;
            this.preaprobar();
          }
        },
        error: (err) => {
          let detail = 'No se pudo guardar el prestamo';
          if (err?.error?.message) detail = err.error.message;
          else if (err?.message) detail = err.message;
          this.prestamoSaving.set(false);
          this.msgs.add({ severity: 'error', summary: 'Error', detail });
        },
      });
  }

  private guardarPlanPagoConPrestamo(prestamoId: number, plan: any[], clienteId: number) {
    const user = this.auth.currentUser();
    const requests = plan.map((fila) => {
      const payload = {
        ...fila,
        prestamoId,
        clienteId,
        empresaId: user?.empresaId,
        usuarioCreated: user?.usuario || user?.nombre,
      };
      return this.service.createPrestamoPP(payload);
    });

    let completadas = 0;
    let errores = 0;
    const total = plan.length;

    requests.forEach((req) => {
      req.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          completadas++;
          if (completadas + errores === total) {
            this.prestamoSaving.set(false);
            this.msgs.add({
              severity: 'success',
              summary: 'Plan de pago',
              detail: `${completadas} cuotas guardadas`,
            });
          }
        },
        error: () => {
          errores++;
          if (completadas + errores === total) {
            this.prestamoSaving.set(false);
            this.msgs.add({
              severity: errores > 0 ? 'warn' : 'success',
              summary: 'Plan de pago',
              detail: `${completadas} guardadas, ${errores} errores`,
            });
          }
        },
      });
    });
  }

  generarPlanPago() {
    const raw = this.prestamoModel();
    const capital = Number(raw.capital) || 0;
    const prima = Number(raw.prima) || 0;
    // Regla de negocio: el plan se amortiza sobre el CAPITAL NETO
    const capitalneto = Math.round((capital - prima) * 100) / 100;
    const cuotas = Number(raw.cuotas) || 0;
    const tasaAnual = Number(raw.tasa) || 0;

    if (capital <= 0) {
      this.msgs.add({
        severity: 'warn',
        summary: 'Datos incompletos',
        detail: 'El capital debe ser mayor a 0',
      });
      return;
    }
    if (capitalneto <= 0) {
      this.msgs.add({
        severity: 'warn',
        summary: 'Datos incompletos',
        detail: 'El capital neto (capital - prima) debe ser mayor a 0',
      });
      return;
    }
    if (cuotas <= 0) {
      this.msgs.add({
        severity: 'warn',
        summary: 'Datos incompletos',
        detail: 'Las cuotas deben ser mayor a 0',
      });
      return;
    }
    if (tasaAnual <= 0) {
      this.msgs.add({
        severity: 'warn',
        summary: 'Datos incompletos',
        detail: 'La tasa de interes debe ser mayor a 0',
      });
      return;
    }

    const tasaMensual = tasaAnual / 100 / 12;
    const factor = tasaMensual / (1 - Math.pow(1 + tasaMensual, -cuotas));
    const cuotaFija = capitalneto * factor;

    const plan: any[] = [];
    let saldo = capitalneto;
    // 1er cuota = fecha de aprobación + 30 días; luego mensualidades desde ahí
    const fechaEfectiva = this.fechaEfectivaCalc() ?? new Date();

    for (let i = 1; i <= cuotas; i++) {
      const interes = saldo * tasaMensual;
      const capitalPago = cuotaFija - interes;
      saldo = saldo - capitalPago;

      const fechaPago = new Date(fechaEfectiva);
      fechaPago.setMonth(fechaPago.getMonth() + (i - 1));

      plan.push({
        nrofila: i,
        FechaPago: fechaPago.toISOString(),
        vlrcuota: Math.round(cuotaFija * 100) / 100,
        capital: Math.round(capitalPago * 100) / 100,
        interes: Math.round(interes * 100) / 100,
        mora: 0,
        saldo: Math.round(Math.abs(saldo) * 100) / 100,
        sn_pagada: 'N',
        sn_anulada: 'N',
      });
    }

    this.planPago.set(plan);
    this.showPlanPago.set(true);
    // El nroprestamo NO se genera aquí: solo la APROBACIÓN asigna el correlativo
    this.prestamoModel.set({
      ...this.prestamoModel(),
      capitalneto,
      vlrcuota: Math.round(cuotaFija * 100) / 100,
    });

    // Préstamo ya guardado → regenerar plan en BD (borra el anterior y guarda el nuevo)
    const p = this.prestamoData();
    if (p?.prestamoId) {
      this.prestamoSaving.set(true);
      this.service
        .deletePrestamoPPByPrestamo(p.prestamoId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => this.guardarPlanPagoConPrestamo(p.prestamoId, plan, p.clienteId),
          error: (err) => {
            this.prestamoSaving.set(false);
            this.msgs.add({
              severity: 'error',
              summary: 'Plan de pago',
              detail: err.error?.message || 'No se pudo regenerar el plan',
            });
          },
        });
    }
  }

  // ── Flujo de estados del préstamo ─────────────────────────────────

  /** Generar plan: siempre que NO esté pre-aprobado ni aprobado (guardado o no). */
  puedeGenerarPlan = computed(() => {
    const p = this.prestamoData();
    // Sin préstamo guardado → puede generar (primera vez)
    if (!p) return true;
    // Con préstamo guardado → solo si no está pre-aprobado ni aprobado
    return p.sn_preaprobado !== 'S' && p.sn_aprobado !== 'S';
  });

  /** Pre-aprobación: guarda el préstamo (con o sin plan generado), siempre que no esté pre-aprobado ni aprobado. */
  puedePreaprobar = computed(() => {
    const p = this.prestamoData();
    if (!p) return true; // sin préstamo guardado → puede pre-aprobar (guarda)
    return p.sn_preaprobado !== 'S' && p.sn_aprobado !== 'S';
  });

  /** Motivo por el que el botón Generar Plan está deshabilitado. */
  motivoBloqueoPlan = computed(() => {
    const p = this.prestamoData();
    if (!p) return '';
    if (p.sn_preaprobado === 'S')
      return 'El préstamo está pre-aprobado: el plan de pagos está bloqueado';
    if (p.sn_aprobado === 'S') return 'El préstamo está aprobado: el plan de pagos está bloqueado';
    return '';
  });

  /** Motivo por el que el botón Pre-aprobación está deshabilitado. */
  motivoBloqueoPreaprobado = computed(() => {
    const p = this.prestamoData();
    if (!p) return '';
    if (p.sn_preaprobado === 'S') return 'El préstamo ya está pre-aprobado';
    if (p.sn_aprobado === 'S') return 'El préstamo ya está aprobado';
    return '';
  });

  /** Motivo por el que el botón Aprobación está deshabilitado. */
  motivoBloqueoAprobar = computed(() => {
    const p = this.prestamoData();
    if (!p) return 'Guarde o pre-aprobee el préstamo primero';
    if (p.sn_preaprobado !== 'S') return 'El préstamo debe estar pre-aprobado antes de aprobarlo';
    if (p.sn_aprobado === 'S') return 'El préstamo ya está aprobado';
    return '';
  });

  /** Motivo por el que el botón Contabilización está deshabilitado. */
  motivoBloqueoContabilizar = computed(() => {
    const p = this.prestamoData();
    if (!p) return 'El préstamo debe estar aprobado antes de contabilizarlo';
    if (p.sn_aprobado !== 'S') return 'El préstamo debe estar aprobado antes de contabilizarlo';
    if (p.sn_contabilizado === 'S') return 'El préstamo ya está contabilizado';
    return '';
  });

  /** Aprobación: solo si está pre-aprobado y NO aprobado. Genera nroprestamo y bloquea plan. */
  puedeAprobar = computed(() => {
    const p = this.prestamoData();
    return !!p && p.sn_preaprobado === 'S' && p.sn_aprobado !== 'S';
  });

  /** Contabilización: solo si está aprobado y NO contabilizado. Genera partida + movimiento D. */
  puedeContabilizar = computed(() => {
    const p = this.prestamoData();
    return !!p && p.sn_aprobado === 'S' && p.sn_contabilizado !== 'S';
  });

  /**
   * Pre-aprobación: si el préstamo aún no está guardado, lo guarda primero
   * (con plan si se generó) y luego lo pre-aprueba. NO genera nroprestamo.
   */
  preaprobar() {
    const p = this.prestamoData();
    if (!p) {
      // Guardar primero y encadenar la pre-aprobación
      this.pendingPreaprobado = true;
      this.guardarPrestamo();
      return;
    }
    this.prestamoSaving.set(true);
    this.service
      .preaprobarPrestamo(p.prestamoId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.prestamoData.set(res);
          this.prestamoModel.set({
            ...this.prestamoModel(),
            nroprestamo: res.nroprestamo || '',
            sn_preaprobado: 'S',
          });
          this.prestamoSaving.set(false);
          this.msgs.add({
            severity: 'success',
            summary: 'Pre-aprobado',
            detail: `Préstamo #${res.prestamoId} pre-aprobado. El plan de pagos queda bloqueado.`,
          });
        },
        error: (err) => {
          this.prestamoSaving.set(false);
          this.msgs.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.message || 'No se pudo pre-aprobar',
          });
        },
      });
  }

  confirmarAprobar() {
    const p = this.prestamoData();
    if (!p) return;
    this.confirm.confirm({
      message: `¿Está seguro de APROBAR el préstamo #${p.prestamoId}?<br/>Se generará el número de préstamo y el plan de pagos quedará bloqueado.`,
      header: 'Confirmar Aprobación',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: {
        label: 'Sí, aprobar',
        severity: 'success',
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
      accept: () => this.aprobar(),
    });
  }

  aprobar() {
    const p = this.prestamoData();
    if (!p) return;
    this.prestamoSaving.set(true);
    this.service
      .aprobarPrestamo(p.prestamoId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.prestamoData.set(res);
          this.prestamoModel.set({
            ...this.prestamoModel(),
            nroprestamo: res.nroprestamo,
            sn_aprobado: 'S',
          });
          this.prestamoSaving.set(false);
          this.msgs.add({
            severity: 'success',
            summary: 'Aprobado',
            detail: `Préstamo ${res.nroprestamo} aprobado`,
          });
        },
        error: (err) => {
          this.prestamoSaving.set(false);
          this.msgs.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.message || 'No se pudo aprobar',
          });
        },
      });
  }

  confirmarContabilizar() {
    const p = this.prestamoData();
    if (!p) return;
    this.confirm.confirm({
      message: `¿Está seguro de CONTABILIZAR el préstamo ${p.nroprestamo}?<br/>Se generará la partida (Débito préstamo / Crédito bancos) y el movimiento de débito por L ${Number(p.capitalneto || 0).toFixed(2)}.`,
      header: 'Confirmar Contabilización',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: {
        label: 'Sí, contabilizar',
        severity: 'success',
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
      accept: () => this.contabilizar(),
    });
  }

  contabilizar() {
    const p = this.prestamoData();
    if (!p) return;
    this.prestamoSaving.set(true);
    this.service
      .contabilizarPrestamo(p.prestamoId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.prestamoData.set(res.prestamo);
          this.prestamoModel.set({ ...this.prestamoModel(), sn_contabilizado: 'S' });
          this.prestamoSaving.set(false);
          this.msgs.add({
            severity: 'success',
            summary: 'Contabilizado',
            detail: `Partida #${res.partidaId} y movimiento #${res.movimientoId} generados`,
          });
        },
        error: (err) => {
          this.prestamoSaving.set(false);
          this.msgs.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.message || 'No se pudo contabilizar',
          });
        },
      });
  }
}
