import { Component, inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { FacturacionService } from '../../../core/services/facturacion.service';
import { CxcService } from '../../../core/services/cxc.service';
import { NavegacionService } from '../../../core/services/navegacion.service';
import { EntitySelectorHelper, EntitySelectorConfig } from '../../helpers/entity-selector';
import { FooterHelper } from '../../helpers/footer';

@Component({
  selector: 'app-caja',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    TableModule,
    ConfirmDialogModule,
    TagModule,
  ],
  providers: [DialogService, ConfirmationService],
  templateUrl: './caja.html',
  styleUrl: './caja.scss',
})
export class Caja implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(FacturacionService);
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private destroyRef = inject(DestroyRef);
  private dialogService = inject(DialogService);
  private cxcService = inject(CxcService);
  private navegacion = inject(NavegacionService);
  private msgs = inject(MessageService);
  private confirm = inject(ConfirmationService);
  ref: DynamicDialogRef | undefined;

  esEdicion = signal(false);
  cargando = signal(false);
  guardando = signal(false);
  anulando = signal(false);
  imprimiendo = signal(false);

  clientes = signal<any[]>([]);
  documentosFiscales = signal<any[]>([]);
  formasPago = signal<any[]>([]);
  tarjetas = signal<any[]>([]);
  documentosPendientes = signal<any[]>([]);
  documentosFiltrados = signal<any[]>([]);
  nrosDocumento = signal<any[]>([]);

  /** Documento (factura de crédito) actualmente seleccionado, con su desglose de interés. */
  docSeleccionado = signal<any>(null);
  /** Total de efectivo capturado en las formas de pago. */
  totalPagos = signal(0);

  /** true si la caja actual ya fue anulada. */
  esAnulada = signal(false);

  /** Destino del abono: 1 = Cuenta corriente (documentos), 2 = Préstamos (cuotas). */
  destinoAbono = signal<number>(1);
  /** Opciones del select "Destino de abono". */
  readonly DESTINO_ABONO = [
    { label: 'Cuenta corriente', value: 1 },
    { label: 'Préstamos', value: 2 },
  ] as const;
  /** Préstamos activos del cliente (cuando destino = Préstamos). */
  prestamosCliente = signal<{ label: string; value: number; _raw: any }[]>([]);
  /** Plan de cuotas del préstamo seleccionado, con interés/mora calculados al día de hoy. */
  planCuotas = signal<any[]>([]);

  /** true si el destino seleccionado es Préstamos. */
  esDestinoPrestamo = computed(() => this.destinoAbono() === 2);

  /**
   * Cuotas que cubre el efectivo recibido (desde la cuota 1 pendiente, en orden).
   * Si no alcanza ni para la cuota 1 → lista vacía (regla: guardar con aviso).
   */
  cuotasCubiertas = computed(() => {
    const restante = this.totalPagos();
    const ids = new Set<number>();
    const lista: any[] = [];
    let aplicado = 0;
    if (restante > 0) {
      for (const c of this.planCuotas()) {
        if (c.sn_pagada === 'S') continue;
        const total = Number(c.total) || 0;
        if (aplicado + total <= restante + 0.005) {
          ids.add(c.pppId);
          lista.push(c);
          aplicado += total;
        } else {
          break; // el abono aplica en secuencia: si no cubre esta, tampoco las siguientes
        }
      }
    }
    const primera = this.planCuotas().find((c) => c.sn_pagada !== 'S');
    const faltaPrimera = primera && !ids.size
      ? Math.round(((Number(primera.total) || 0) - restante) * 100) / 100
      : 0;
    return {
      ids,
      lista,
      aplicado: Math.round(aplicado * 100) / 100,
      faltaPrimera,
    };
  });

  /** Aviso cuando el abono no cubre ni la cuota 1 (la caja se guarda sin pagar cuotas). */
  avisoCuota1 = computed(() => {
    if (!this.esDestinoPrestamo() || !this.planCuotas().length) return null;
    const cc = this.cuotasCubiertas();
    if (this.totalPagos() > 0 && cc.faltaPrimera > 0) {
      return `El abono no cubre la cuota #1: faltan L ${cc.faltaPrimera.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. La caja se guardará sin pagar cuotas.`;
    }
    return null;
  });

  /** true si la cuota actualmente se pagaría con el efectivo capturado. */
  esCubierta(cuota: any): boolean {
    return this.cuotasCubiertas().ids.has(cuota.pppId);
  }

  /** true si la caja puede editarse (no anulada y hay formulario activo). */
  puedeEditar = computed(() => !this.esAnulada() && !this.guardando() && !this.anulando());

  /** Total de cargos (interés + mora) devengados al día de hoy. */
  totalCargos = computed(() => {
    const doc = this.docSeleccionado();
    return doc?.esFacturaCredito ? (Number(doc.totalCargos) || 0) : 0;
  });

  /**
   * Reparto del efectivo recibido: primero se pagan los cargos (interés + mora)
   * y el remainder abona al capital de la factura.
   */
  abonoCapital = computed(() => {
    const pagos = this.totalPagos();
    const cargos = this.totalCargos();
    return Math.max(0, Math.round((pagos - cargos) * 100) / 100);
  });

  /** Saldo restante de la factura después de abonar el capital. */
  saldoNuevo = computed(() => {
    const doc = this.docSeleccionado();
    if (!doc) return 0;
    const saldo = Number(doc.saldo) || 0;
    return Math.round((saldo - this.abonoCapital()) * 100) / 100;
  });

  /** Efectivo aplicado a cargos (limitado a lo recibido si no alcanza). */
  cargosCubiertos = computed(() => {
    return Math.min(this.totalCargos(), this.totalPagos());
  });

  /** true si hay factura de crédito seleccionada con interés devengado. */
  tieneInteres = computed(() => this.totalCargos() > 0);

  dets = signal<any[]>([]);
  detGuardados = new Set<number>();
  private itemId = 0;
  private contadorFila = 0;

  form!: FormGroup;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.buildForm();
    this.cargarOpciones();
    this.vigilarCliente();
    this.vigilarNroDocumento();

    if (id && id !== 'nuevo') {
      this.esEdicion.set(true);
      this.itemId = Number(id);
      this.cargando.set(true);
      this.service.getMaeOne<any>('/cxc/caja-mae', this.itemId).subscribe({
        next: (mae) => {
          this.destinoAbono.set(Number(mae?.destinoabono) || 1);
          this.form.patchValue({
            moduloId: mae?.moduloId ?? 4,
            clienteId: mae?.clienteId,
            nrocliente: mae?.nrocliente ?? '',
            nombrecliente: mae?.nombrecliente ?? '',
            concepto: mae?.concepto ?? '',
            destinoabono: Number(mae?.destinoabono) || 1,
            prestamoId: mae?.prestamoId ?? null,
            documentoId: mae?.documentoId,
            nrodocumento: mae?.nrodocumento,
            tipomov: mae?.tipomov ?? 'C',
            sn_cotabilizada: mae?.sn_cotabilizada ?? 'N',
            sn_anulado: mae?.sn_anulado ?? 'N',
            fec_anulacion: mae?.fec_anulacion ?? null,
            partidaId: mae?.partidaId ?? 0,
          });
          this.esAnulada.set(mae?.sn_anulado === 'S');
          if (this.esAnulada()) this.form.disable();
          if (this.destinoAbono() === 2 && mae?.prestamoId) {
            this.cargarPrestamosCliente(mae.clienteId, () => this.onPrestamoChange(mae.prestamoId));
          }
          this.cargarDets();
        },
        error: () => {
          this.cargando.set(false);
          this.msgs.add({ severity: 'error', summary: 'Error', detail: 'Registro no encontrado' });
          this.volver();
        },
      });
    } else {
      this.cargando.set(false);
    }
  }

  private buildForm() {
    this.form = this.fb.group({
      moduloId: [4],
      clienteId: [null, Validators.required],
      nrocliente: [''],
      nombrecliente: [''],
      concepto: [''],
      destinoabono: [1],
      prestamoId: [null],
      documentoId: [null],
      nrodocumento: [null],
      tipomov: ['C'],
      sn_cotabilizada: ['N'],
      sn_anulado: ['N'],
      fec_anulacion: [null],
      partidaId: [0],
    });
  }

  private cargarOpciones() {
    this.cargarClientes();
    this.api.get<any>('/parametros/tcotipodocumentofiscal').subscribe({
      next: (res) => {
        const items = Array.isArray(res) ? res : (res?.data ?? []);
        const filtrados = items.filter((i: any) => ['FAC', 'NDB', 'PRE'].includes(i.abreviatura));
        this.documentosFiscales.set(filtrados.map((i: any) => ({
          label: i.descripcion,
          value: i.tipodocumentofiscalId,
        })));
      },
    });
    this.api.get<any>('/parametros/formas-pago').subscribe({
      next: (res) => {
        const items = Array.isArray(res) ? res : (res?.data ?? []);
        this.formasPago.set(items.map((i: any) => ({
          label: i.descripcion,
          value: i.formapagoId,
        })));
      },
    });
    this.api.get<any>('/parametros/tarjetas-credito').subscribe({
      next: (res) => {
        const items = Array.isArray(res) ? res : (res?.data ?? []);
        this.tarjetas.set(items.map((i: any) => ({
          label: i.descripcion,
          value: i.tarjetacreditoId,
        })));
      },
    });
  }

  /**
   * Carga el select de clientes según el destino del abono:
   * - destino=1 (Facturas): clientes con saldo pendiente en cuenta corriente.
   * - destino=2 (Préstamos): solo clientes con préstamos activos.
   */
  private cargarClientes() {
    const ruta = this.destinoAbono() === 2
      ? '/cxc/clientes-con-prestamos'
      : '/cxc/clientes-con-saldo';
    this.api.get<any>(ruta).subscribe({
      next: (res) => {
        const items = Array.isArray(res) ? res : (res?.data ?? []);
        this.clientes.set(items);
      },
      error: () => this.clientes.set([]),
    });
  }

  private vigilarCliente() {
    this.form.get('clienteId')?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((clienteId) => {
      if (!clienteId) {
        this.form.patchValue({ nrocliente: '', nombrecliente: '' });
        this.documentosPendientes.set([]);
        this.documentosFiltrados.set([]);
        this.nrosDocumento.set([]);
        this.docSeleccionado.set(null);
        this.prestamosCliente.set([]);
        this.planCuotas.set([]);
        return;
      }
      this.api.get<any>(`/cxc/clientes/${clienteId}`).subscribe({
        next: (cliente) => this.form.patchValue({
          nrocliente: cliente?.nrocliente ?? '',
          nombrecliente: `${cliente?.nombres ?? ''} ${cliente?.apellidos ?? ''}`.trim(),
        }),
        error: () => this.form.patchValue({ nrocliente: '', nombrecliente: '' }),
      });

      // Destino = Préstamos: carga los préstamos activos del cliente (no documentos)
      // y auto-selecciona el primero para mostrar el plan de cuotas.
      if (this.destinoAbono() === 2) {
        this.cargarPrestamosCliente(clienteId, () => {
          const lista = this.prestamosCliente();
          if (lista.length) {
            this.onPrestamoChange(lista[0].value);
          }
        });
        return;
      }

      this.cxcService.getDocumentosPendientesCliente(clienteId).subscribe({
        next: (docs) => {
          this.documentosPendientes.set(docs);
          this.filtrarDocumentos(docs);
        },
        error: () => {
          this.documentosPendientes.set([]);
          this.documentosFiltrados.set([]);
          this.nrosDocumento.set([]);
        },
      });
    });
  }

  /** Cambia el destino del abono: limpia cliente, documentos y plan de cuotas. */
  onDestinoChange() {
    const destino = this.form.get('destinoabono')?.value ?? 1;
    this.destinoAbono.set(Number(destino));
    this.form.patchValue({
      clienteId: null,
      nrocliente: '',
      nombrecliente: '',
      prestamoId: null,
      documentoId: null,
      nrodocumento: null,
    }, { emitEvent: false });
    this.documentosPendientes.set([]);
    this.documentosFiltrados.set([]);
    this.nrosDocumento.set([]);
    this.docSeleccionado.set(null);
    this.prestamosCliente.set([]);
    this.planCuotas.set([]);
    // Recarga el select de clientes según el nuevo destino (saldo vs préstamos)
    this.cargarClientes();
  }

  /** Carga los préstamos del cliente (para el select), opcionalmente ejecuta un callback tras cargar. */
  private cargarPrestamosCliente(clienteId: number, after?: () => void) {
    this.cxcService.getPrestamosByCliente(clienteId).subscribe({
      next: (prestamos) => {
        const activos = (prestamos ?? []).filter((p: any) => p.sn_activo === 'S' && p.sn_anulado !== 'S');
        this.prestamosCliente.set(activos.map((p: any) => ({
          // saldoactual: capital pendiente (fallback al capital para préstamos antiguos sin saldo)
          label: `${p.nroprestamo} · Saldo L ${Number(p.saldoactual ?? p.capital ?? 0).toFixed(2)} · Cuota L ${Number(p.vlrcuota || 0).toFixed(2)}`,
          value: p.prestamoId,
          _raw: p,
        })));
        after?.();
      },
      error: () => {
        this.prestamosCliente.set([]);
        this.planCuotas.set([]);
      },
    });
  }

  /** Al elegir el préstamo, carga su plan de cuotas con interés/mora calculados al día de hoy. */
  onPrestamoChange(prestamoId: number | null) {
    this.form.patchValue({ prestamoId: prestamoId ?? null }, { emitEvent: false });
    this.planCuotas.set([]);
    if (!prestamoId) return;
    const prestamo = this.prestamosCliente().find((p) => p.value === prestamoId)?._raw ?? null;
    this.cxcService.getPrestamoPPByPrestamo(prestamoId).subscribe({
      next: (plan) => {
        this.planCuotas.set((plan ?? []).map((c: any) => this.calcularCuotaHoy(c, prestamo)));
      },
      error: () => {
        this.planCuotas.set([]);
        this.msgs.add({ severity: 'error', summary: 'Préstamos', detail: 'No se pudo cargar el plan de cuotas' });
      },
    });
  }

  /**
   * Calcula la cuota al día de hoy con la MISMA regla de facturas
   * (calcularInteresesFactura), pero usando las tasas del préstamo:
   * - capital de la cuota = plan.capital
   * - período: inicia FechaPago − diascuotas; proximoPago = FechaPago;
   *   con gracia del préstamo
   * - interés = capital × (tasa/100) × (días interés/360)
   * - mora = capital × (moratorio/100) × (días mora/360) desde FechaPago + gracia
   * - total a pagar = capital + interés + mora
   */
  private calcularCuotaHoy(cuota: any, prestamo: any): any {
    const r2 = (x: number) => Math.round(x * 100) / 100;
    const capital = Number(cuota.capital) || 0;
    const tasaAnual = Number(prestamo?.tasa) || 0;
    const tasaMoratoria = Number(prestamo?.moratorio) || 0;
    const diasPlazo = Number(prestamo?.diascuotas) || 0;
    const diasGracia = Number(prestamo?.gracia) || 0;
    const hoy = new Date();
    const vencimiento = new Date(cuota.FechaPago);

    let interes = 0;
    let mora = 0;
    let diasInteres = 0;
    let diasMora = 0;

    if (cuota.sn_pagada !== 'S') {
      const fechaBase = this.sumarDias(vencimiento, -diasPlazo);      // inicio del período
      const proximoPago = vencimiento;                                 // FechaPago
      const fechaMaxPago = this.sumarDias(proximoPago, diasGracia);    // fin de gracia
      const diasTotales = Math.max(0, this.diasEntre(fechaBase, hoy));

      if (hoy.getTime() <= fechaMaxPago.getTime()) {
        // Dentro del plazo/gracia: interés devengado menos la gracia; mora = 0.
        const diasGraciaEfectiva = Math.max(0, this.diasEntre(proximoPago, hoy));
        diasInteres = Math.max(0, diasTotales - diasGraciaEfectiva);
        diasMora = 0;
      } else {
        // Vencido: interés sobre todos los días + mora desde el fin de gracia.
        diasInteres = diasTotales;
        diasMora = Math.max(0, this.diasEntre(fechaMaxPago, hoy));
      }

      interes = r2(capital * (tasaAnual / 100) * (diasInteres / 360));
      mora = r2(capital * (tasaMoratoria / 100) * (diasMora / 360));
    }

    const total = r2(capital + interes + mora);
    return {
      ...cuota,
      capital,
      interes,
      mora,
      diasInteres,
      diasMora,
      total,
    };
  }

  /** Días completos entre dos fechas (ignora hora, espejo de diasEntre del backend). */
  private diasEntre(desde: Date, hasta: Date): number {
    const d1 = new Date(Date.UTC(desde.getFullYear(), desde.getMonth(), desde.getDate()));
    const d2 = new Date(Date.UTC(hasta.getFullYear(), hasta.getMonth(), hasta.getDate()));
    return Math.round((d2.getTime() - d1.getTime()) / 86400000);
  }

  /** Suma/resta días calendario a una fecha (espejo de sumarDias del backend). */
  private sumarDias(fecha: Date, dias: number): Date {
    const d = new Date(fecha.getTime());
    d.setDate(d.getDate() + dias);
    return d;
  }

  /** Observa el control nrodocumento (forma reactiva) para fijar el doc con desglose. */
  private vigilarNroDocumento() {
    this.form.get('nrodocumento')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((nro) => this.onNroDocumentoChange(nro));
  }

  private filtrarDocumentos(docs: any[]) {
    const tiposUnicos = [...new Set(docs.map(d => d.documentoId))];
    const allOpts = this.documentosFiscales();
    const filtradas = allOpts.filter(o => tiposUnicos.includes(o.value));
    this.documentosFiltrados.set(filtradas);
    this.form.get('documentoId')?.setValue(null);
    this.form.get('nrodocumento')?.setValue(null);
    this.nrosDocumento.set([]);
  }

  onDocumentoIdChange() {
    const docId = this.form.get('documentoId')?.value;
    this.form.get('nrodocumento')?.setValue(null);
    this.docSeleccionado.set(null);
    if (docId) {
      const docs = this.documentosPendientes().filter(d => d.documentoId === docId);
      this.nrosDocumento.set(docs.map(d => ({
        label: `${d.nroreferencia} (Saldo: ${d.saldo.toFixed(2)})`,
        value: d.nroreferencia,
      })));
    } else {
      this.nrosDocumento.set([]);
    }
  }

  /** Al elegir el nro de documento, fija el doc seleccionado (con su interés devengado). */
  onNroDocumentoChange(nro: any) {
    if (!nro) {
      this.docSeleccionado.set(null);
      return;
    }
    const doc = this.documentosPendientes().find(d => d.nroreferencia === nro);
    this.docSeleccionado.set(doc ?? null);
  }

  /** Recalcula el total de efectivo capturado en las formas de pago. */
  recalcularTotal() {
    const total = this.dets().reduce((s, r) => s + (Number(r['importe']) || 0), 0);
    this.totalPagos.set(Math.round(total * 100) / 100);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // VALIDACIONES
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Valida un número de tarjeta de crédito con el algoritmo de Luhn.
   * @param numero - Número de tarjeta sin espacios ni guiones
   * @returns true si el número pasa la validación Luhn
   */
  private validarLuhn(numero: string): boolean {
    const limpio = numero.replace(/[\s-]/g, '');
    if (limpio.length < 13 || limpio.length > 19) return false;
    let suma = 0;
    let alternar = false;
    for (let i = limpio.length - 1; i >= 0; i--) {
      let n = parseInt(limpio[i], 10);
      if (isNaN(n)) return false;
      if (alternar) {
        n *= 2;
        if (n > 9) n -= 9;
      }
      suma += n;
      alternar = !alternar;
    }
    return suma % 10 === 0;
  }

  /**
   * Valida que todas las filas de detalle tengan forma de pago e importe > 0.
   * Si una fila es tarjeta, valida nrotarjeta con Luhn.
   * @returns true si todo es válido
   */
  private validarDetalles(): boolean {
    const filas = this.dets();
    if (filas.length === 0) {
      this.msgs.add({ severity: 'warn', summary: 'Validación', detail: 'Debe agregar al menos una forma de pago' });
      return false;
    }

    for (let i = 0; i < filas.length; i++) {
      const fila = filas[i];
      const importe = Number(fila['importe']) || 0;

      if (!fila['formapagoId']) {
        this.msgs.add({ severity: 'warn', summary: 'Validación', detail: `Fila ${i + 1}: seleccione la forma de pago` });
        return false;
      }

      if (importe <= 0) {
        this.msgs.add({ severity: 'warn', summary: 'Validación', detail: `Fila ${i + 1}: el importe debe ser mayor a cero` });
        return false;
      }

      // Validar tarjeta solo si tiene datos de tarjeta
      if (fila['nrotarjeta'] && String(fila['nrotarjeta']).trim()) {
        const nrotarjeta = String(fila['nrotarjeta']).replace(/[\s-]/g, '');
        if (nrotarjeta.length >= 13 && !this.validarLuhn(nrotarjeta)) {
          this.msgs.add({ severity: 'warn', summary: 'Validación', detail: `Fila ${i + 1}: número de tarjeta inválido (Luhn)` });
          return false;
        }
      }
    }

    return true;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // UI HELPERS
  // ══════════════════════════════════════════════════════════════════════════

  abrirClientes() {
    const esPrestamo = this.destinoAbono() === 2;
    const config: EntitySelectorConfig = {
      titulo: esPrestamo ? 'Seleccionar cliente con préstamo' : 'Seleccionar cliente con saldo',
      columns: [
        { key: 'nrocliente', label: 'Nro.' },
        { key: 'cliente', label: 'Nombre' },
        { key: 'dni', label: 'DNI' },
        { key: 'rtn', label: 'RTN' },
        ...(esPrestamo ? [{ key: 'saldo', label: 'Saldo Préstamo' }] : []),
      ],
      loadData: () => {
        return new Promise<any[]>((resolve) => {
          const ruta = esPrestamo ? '/cxc/clientes-con-prestamos' : '/cxc/clientes-con-saldo';
          this.api.get<any>(ruta).subscribe({
            next: (res) => {
              const items = Array.isArray(res) ? res : (res?.data ?? []);
              resolve(items);
            },
            error: () => resolve([]),
          });
        });
      },
    };

    this.ref = this.dialogService.open(EntitySelectorHelper, {
      header: config.titulo,
      width: '60vw',
      modal: true,
      contentStyle: { overflow: 'auto' },
      data: { config },
      templates: { footer: FooterHelper },
    });

    this.ref.onClose.subscribe((cliente: any) => {
      if (cliente) {
        this.form.patchValue({
          clienteId: cliente.clienteId,
          nrocliente: cliente.nrocliente ?? '',
          nombrecliente: `${cliente.nombres ?? ''} ${cliente.apellidos ?? ''}`.trim(),
        });
      }
    });
  }

  opcionesFp(): { label: string; value: any }[] {
    return this.formasPago();
  }

  opcionesTarjeta(): { label: string; value: any }[] {
    return this.tarjetas();
  }

  esEfectivo(row: any): boolean {
    const opts = this.formasPago();
    const selected = opts.find((o: any) => o.value === row['formapagoId']);
    return selected ? /efectivo/i.test(selected.label) : false;
  }

  onFormaPagoChange(row: any) {
    if (this.esEfectivo(row)) {
      row['tarjetacreditoId'] = null;
      row['nrotarjeta'] = '';
      row['nroautorizacion'] = '';
    }
  }

  isCampoDesactivado(row: any, key: string): boolean {
    const camposTarjeta = ['tarjetacreditoId', 'nrotarjeta', 'nroautorizacion'];
    return camposTarjeta.includes(key) && this.esEfectivo(row);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DETALLES
  // ══════════════════════════════════════════════════════════════════════════

  private cargarDets() {
    this.service.getDet<any>(`/cxc/caja-det/factura/${this.itemId}`).subscribe({
      next: (mios) => {
        this.dets.set((mios ?? []).map((d) => ({ ...d })));
        for (const d of (mios ?? [])) this.detGuardados.add(d['cxccajadetId']);
        this.contadorFila = (mios ?? []).length;
        this.recalcularTotal();
        this.cargando.set(false);
      },
      error: () => {
        this.service.getDet<any>('/cxc/caja-det').subscribe({
          next: (todos) => {
            const mios = (todos ?? []).filter((d) => d['cxccajaId'] === this.itemId);
            this.dets.set(mios.map((d) => ({ ...d })));
            for (const d of mios) this.detGuardados.add(d['cxccajadetId']);
            this.contadorFila = mios.length;
            this.recalcularTotal();
            this.cargando.set(false);
          },
          error: () => {
            this.cargando.set(false);
            this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los detalles' });
          },
        });
      },
    });
  }

  nuevaFila() {
    if (!this.puedeEditar()) return;
    this.contadorFila += 1;
    this.dets.update((d) => [...d, {
      __local: true,
      nrofila: this.contadorFila,
      formapagoId: null,
      importe: 0,
      tarjetacreditoId: null,
      nrotarjeta: '',
      nroautorizacion: '',
      factordecambio: 0,
    }]);
  }

  quitarFila(idx: number) {
    if (!this.puedeEditar()) return;
    const fila = this.dets()[idx];
    if (fila['cxccajadetId'] && this.detGuardados.has(fila['cxccajadetId'])) return;
    this.dets.update((d) => d.filter((_, i) => i !== idx));
    this.recalcularTotal();
  }

  esNuevaFila(fila: any): boolean {
    return !fila['cxccajadetId'] || !this.detGuardados.has(fila['cxccajadetId']);
  }

  invalid(ctrl: string): boolean {
    const c = this.form.get(ctrl);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // GUARDAR
  // ══════════════════════════════════════════════════════════════════════════

  volver() {
    this.navegacion.volver(['/cxc/caja']);
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.validarDetalles()) return;

    if (this.destinoAbono() === 2 && !this.form.get('prestamoId')?.value) {
      this.msgs.add({ severity: 'warn', summary: 'Validación', detail: 'Seleccione el préstamo a pagar' });
      return;
    }

    const maeBody = {
      ...this.form.getRawValue(),
      ...(this.esEdicion() ? {} : { empresaId: this.auth.currentUser()?.empresaId }),
    };

    this.guardando.set(true);
    const maeOp = this.esEdicion()
      ? this.service.updateMae<any>('/cxc/caja-mae', this.itemId, maeBody)
      : this.service.createMae<any>('/cxc/caja-mae', maeBody);

    maeOp.subscribe({
      next: (mae) => {
        const maeId = this.esEdicion() ? this.itemId : mae['cxccajaId'];
        this.guardarDets(maeId);
      },
      error: () => {
        this.guardando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la caja' });
      },
    });
  }

  private guardarDets(maeId: number) {
    const pendientes = this.dets().length;
    if (pendientes === 0) {
      this.procesarYFinalizar(maeId);
      return;
    }

    let completados = 0;
    const ok = () => {
      completados += 1;
      if (completados === pendientes) this.procesarYFinalizar(maeId);
    };
    const fail = () => {
      this.guardando.set(false);
      this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar uno de los detalles' });
    };

    const empresaId = this.auth.currentUser()?.empresaId;
    for (const fila of this.dets()) {
      const detId = fila['cxccajadetId'];
      const body = { ...fila, cxccajaId: maeId, empresaId };
      delete body.__local;
      if (detId && this.detGuardados.has(detId)) {
        this.service.updateDet<any>('/cxc/caja-det', detId, body).subscribe({ next: ok, error: fail });
      } else {
        this.service.createDet<any>('/cxc/caja-det', body).subscribe({ next: ok, error: fail });
      }
    }
  }

  /** Tras guardar maestro + detalles, genera los movimientos CxC (reparto) o aplica a cuotas y finaliza. */
  private procesarYFinalizar(maeId: number) {
    // Destino = Préstamos: la UI envía las cuotas cubiertas (con su desglose
    // de interés/mora calculado y aprobado en pantalla) para que las marque pagadas.
    if (this.destinoAbono() === 2) {
      const cc = this.cuotasCubiertas();
      const payload = {
        prestamoId: this.form.get('prestamoId')?.value,
        cuotas: cc.lista.map((c) => ({
          pppId: c.pppId,
          capital: Number(c.capital) || 0,
          interes: Number(c.interes) || 0,
          mora: Number(c.mora) || 0,
          diasMora: Number(c.diasMora) || 0,
          total: Number(c.total) || 0,
        })),
      };
      this.cxcService.procesarAbono(maeId, payload).subscribe({
        next: (res) => {
          const pagadas = res?.cuotasPagadas?.length ?? 0;
          if (pagadas > 0) {
            this.msgs.add({
              severity: 'success',
              summary: 'Cobro a préstamo',
              detail: `Cuota(s) pagada(s): ${res!.cuotasPagadas!.join(', ')} · Total aplicado L ${(res!.totalAplicado || 0).toFixed(2)}`,
            });
          } else {
            // Regla aprobada: guardar con aviso si no cubre ni la cuota 1.
            const falta = this.cuotasCubiertas().faltaPrimera;
            this.msgs.add({
              severity: 'warn',
              summary: 'Caja guardada sin cuotas',
              detail: falta > 0
                ? `El abono no cubre la cuota #1: faltan L ${falta.toFixed(2)}`
                : (res?.motivo || 'Ninguna cuota fue cubierta por el abono'),
            });
          }
          this.finalizar(maeId);
        },
        error: () => {
          this.finalizar(maeId);
          this.msgs.add({
            severity: 'warn',
            summary: 'Caja guardada',
            detail: 'Cobro guardado, pero no se pudieron aplicar las cuotas del préstamo',
          });
        },
      });
      return;
    }

    const doc = this.docSeleccionado();
    const esCredito = !!doc?.esFacturaCredito;
    // Se envían los valores de interés/mora YA calculados por la UI (lo que el usuario
    // vio y aprobó en el desglose) para que la partida contable use esos montos exactos.
    const desglose = esCredito
      ? {
          interes: Math.min(Number(doc.interes) || 0, this.totalPagos()),
          mora: Math.min(
            Number(doc.mora) || 0,
            Math.max(0, this.totalPagos() - (Number(doc.interes) || 0)),
          ),
        }
      : {};
    this.cxcService.procesarAbono(maeId, desglose).subscribe({
      next: () => {
        // Ofrecer imprimir recibo tras guardar
        this.msgs.add({
          severity: 'success',
          summary: 'Guardado',
          detail: 'Caja guardada correctamente. ¿Desea imprimir el recibo?',
        });
        this.finalizar(maeId);
      },
      error: () => {
        //aunque falle la generación de movimientos, el cobro quedó guardado
        this.finalizar(maeId);
        this.msgs.add({
          severity: 'warn',
          summary: 'Caja guardada',
          detail: 'Cobro guardado, pero no se pudieron generar los movimientos CxC',
        });
      },
    });
  }

  private finalizar(nuevoId?: number) {
    this.guardando.set(false);
    const idParaImprimir = nuevoId ?? this.itemId;
    this.msgs.add({
      severity: 'success',
      summary: 'Guardado',
      detail: this.esEdicion() ? 'Caja actualizada' : 'Caja creada correctamente',
    });
    this.form.reset({
      moduloId: 4,
      clienteId: null,
      nrocliente: '',
      nombrecliente: '',
      concepto: '',
      destinoabono: 1,
      prestamoId: null,
      documentoId: null,
      nrodocumento: null,
      tipomov: 'C',
      sn_cotabilizada: 'N',
      sn_anulado: 'N',
      fec_anulacion: null,
      partidaId: 0,
    });
    this.dets.set([]);
    this.detGuardados.clear();
    this.contadorFila = 0;
    this.documentosPendientes.set([]);
    this.documentosFiltrados.set([]);
    this.nrosDocumento.set([]);
    this.docSeleccionado.set(null);
    this.destinoAbono.set(1);
    this.prestamosCliente.set([]);
    this.planCuotas.set([]);
    this.totalPagos.set(0);
    this.esEdicion.set(false);
    this.esAnulada.set(false);
    this.itemId = 0;

    // Si hay un ID nuevo, ofrecer impresión inmediata
    if (idParaImprimir > 0) {
      this.imprimirRecibo(idParaImprimir);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // IMPRESIÓN DE RECIBO
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Imprime el recibo de una caja. Genera un HTML optimizado para
   * impresora térmica 80mm y abre el diálogo de impresión del navegador.
   */
  imprimirRecibo(cajaId?: number) {
    const id = cajaId ?? this.itemId;
    if (!id) return;

    this.imprimiendo.set(true);
    this.cxcService.getCajaRecibo(id).subscribe({
      next: (data) => {
        this.imprimiendo.set(false);
        this.abrirRecibo(data);
      },
      error: () => {
        this.imprimiendo.set(false);
        this.msgs.add({ severity: 'warn', summary: 'Impresión', detail: 'No se pudieron cargar los datos del recibo' });
      },
    });
  }

  private abrirRecibo(data: any) {
    const caja = data.caja;
    const cliente = data.cliente;
    const empresa = data.empresa;
    const detalles = data.detalles || [];

    const fmt = (n: number) => `L ${Number(n || 0).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const fecha = caja.fecharegistro ? new Date(caja.fecharegistro).toLocaleDateString('es-HN') : '';
    const hora = caja.fecharegistro ? new Date(caja.fecharegistro).toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' }) : '';

    const pagosHtml = detalles.map((d: any) => {
      let extra = '';
      if (d.nrotarjeta) extra += ` ****${String(d.nrotarjeta).slice(-4)}`;
      if (d.nroautorizacion) extra += ` Aut: ${d.nroautorizacion}`;
      return `<tr>
        <td>${d.formaPago}${extra}</td>
        <td class="right">${fmt(d.importe)}</td>
      </tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Recibo Caja #${caja.cxccajaId}</title>
<style>
  @page { margin: 4mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Courier New', Courier, monospace;
    font-size: 11px;
    width: 72mm;
    padding: 2mm;
    color: #000;
  }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .line { border-top: 1px dashed #000; margin: 4px 0; }
  .line2 { border-top: 2px solid #000; margin: 4px 0; }
  .right { text-align: right; }
  .header { margin-bottom: 6px; }
  .header .empresa { font-size: 13px; font-weight: bold; }
  .header .info { font-size: 9px; }
  .recibo-title { font-size: 12px; font-weight: bold; text-align: center; margin: 6px 0 2px; }
  .doc-info { margin: 4px 0; }
  .doc-info .row { display: flex; justify-content: space-between; }
  .cliente-box { margin: 4px 0; padding: 2px 0; }
  table { width: 100%; border-collapse: collapse; margin: 4px 0; }
  th { font-size: 9px; text-align: left; border-bottom: 1px solid #000; padding: 2px 0; }
  td { padding: 2px 0; font-size: 10px; }
  .total-row { font-size: 12px; font-weight: bold; border-top: 2px solid #000; padding-top: 3px; }
  .mensaje { font-size: 8px; text-align: center; margin-top: 6px; font-style: italic; }
  .firma { margin-top: 16px; text-align: center; }
  .firma .line-firma { border-top: 1px solid #000; width: 60mm; margin: 0 auto 2px; }
  .anulado { color: #000; font-size: 14px; font-weight: bold; text-align: center; border: 2px solid #000; padding: 2px; margin: 4px 0; }
</style>
</head>
<body>
  <div class="header center">
    <div class="empresa">${empresa.nombre || 'EMPRESA'}</div>
    ${empresa.rtn ? `<div class="info">RTN: ${empresa.rtn}</div>` : ''}
    ${empresa.direccion ? `<div class="info">${empresa.direccion}</div>` : ''}
    ${empresa.telefono ? `<div class="info">Tel: ${empresa.telefono}</div>` : ''}
  </div>

  <div class="line2"></div>
  <div class="recibo-title">RECIBO DE COBRO</div>
  <div class="line2"></div>

  ${caja.sn_anulado === 'S' ? '<div class="anulado">*** ANULADO ***</div>' : ''}

  <div class="doc-info">
    <div class="row"><span>Recibo #:</span><span class="bold">${caja.cxccajaId}</span></div>
    <div class="row"><span>Fecha:</span><span>${fecha} ${hora}</span></div>
    ${data.tipoDocumento ? `<div class="row"><span>Doc. Fiscal:</span><span>${data.tipoDocumento}</span></div>` : ''}
    ${caja.nrodocumento ? `<div class="row"><span>Documento #:</span><span>${caja.nrodocumento}</span></div>` : ''}
  </div>

  ${data.prestamo ? `
  <div class="doc-info">
    <div class="row"><span>Préstamo #:</span><span class="bold">${data.prestamo.nroprestamo}</span></div>
    <div class="row"><span>Cuotas pagadas:</span><span class="bold">${data.prestamo.cuotas.map((c: any) => '#' + c.nrofila).join(', ')}</span></div>
  </div>` : ''}

  <div class="line"></div>

  <div class="cliente-box">
    <div class="row"><span>Cliente:</span><span class="bold">${cliente.razonsocial || `${cliente.nombres} ${cliente.apellidos}`}</span></div>
    <div class="row"><span>Código:</span><span>${cliente.nrocliente}</span></div>
    ${cliente.dni ? `<div class="row"><span>DNI:</span><span>${cliente.dni}</span></div>` : ''}
    ${cliente.rtn ? `<div class="row"><span>RTN:</span><span>${cliente.rtn}</span></div>` : ''}
  </div>

  <div class="line"></div>

  <table>
    <thead>
      <tr>
        <th>Forma de Pago</th>
        <th class="right">Importe</th>
      </tr>
    </thead>
    <tbody>
      ${pagosHtml}
    </tbody>
  </table>

  <div class="line2"></div>
  <div class="total-row" style="display:flex; justify-content:space-between;">
    <span>TOTAL</span>
    <span>${fmt(data.totalPagos)}</span>
  </div>
  <div class="line2"></div>

  ${caja.concepto ? `<div style="margin-top:4px;"><strong>Concepto:</strong> ${caja.concepto}</div>` : ''}

  <div class="firma">
    <div class="line-firma"></div>
    <div style="font-size:9px;">Firma de conformidad</div>
  </div>

  ${empresa.mensajeFactura ? `<div class="mensaje">${empresa.mensajeFactura}</div>` : ''}
  <div class="mensaje">Gracias por su pago</div>
</body>
</html>`;

    const printWindow = window.open('', '_blank', 'width=320,height=600');
    if (!printWindow) {
      this.msgs.add({ severity: 'warn', summary: 'Impresión', detail: 'Permita las ventanas emergentes para imprimir' });
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ANULACIÓN
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Anula la caja actual con confirmación del usuario.
   * Revierte movimientos CxC, detalles y marca la caja como anulada.
   */
  anular() {
    if (!this.itemId || this.esAnulada()) return;

    this.confirm.confirm({
      message: `¿Está seguro de anular la caja #${this.itemId}?\n\nEsta acción revertirá los movimientos CxC generados.`,
      header: 'Anular Caja',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: {
        label: 'Anular',
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
      accept: () => {
        this.anulando.set(true);
        this.cxcService.anularCaja(this.itemId).subscribe({
          next: (res) => {
            this.anulando.set(false);
            this.esAnulada.set(true);
            this.form.disable();
            this.msgs.add({ severity: 'success', summary: 'Anulada', detail: res.mensaje || 'Caja anulada correctamente' });
          },
          error: (err) => {
            this.anulando.set(false);
            const msg = err?.error?.message || 'No se pudo anular la caja';
            this.msgs.add({ severity: 'error', summary: 'Error', detail: msg });
          },
        });
      },
    });
  }
}
