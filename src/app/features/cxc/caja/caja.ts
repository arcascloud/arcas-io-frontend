import { Component, inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
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
  /**
   * Préstamo crudo seleccionado (destino = Préstamos). El cálculo de interés
   * es INTERÉS SIMPLE sobre el saldo total, anclado en `fechaUltPago`
   * (modelo sin plan de pagos).
   */
  prestamoSeleccionado = signal<any>(null);

  /** true si el destino seleccionado es Préstamos. */
  esDestinoPrestamo = computed(() => this.destinoAbono() === 2);

  /**
   * Cuota pactada del préstamo. Prefiere el valor persistido en
   * `cxcprestamos.vlrcuota`; si es nulo o 0, lo deriva de los términos
   * del préstamo (amortización francesa mensual).
   * Se usa como MÍNIMO de efectivo exigido para aplicar el cobro.
   */
  vlrcuotaPactada = computed(() => {
    const p = this.prestamoSeleccionado();
    if (!p) return 0;
    // Preferir valor persistido
    const persistido = Number(p.vlrcuota) || 0;
    if (persistido > 0) return Math.round(persistido * 100) / 100;
    // Fallback: cálculo por fórmula francesa
    const capitalneto = Number(p.capitalneto)
      || Math.max(0, (Number(p.capital) || 0) - (Number(p.prima) || 0));
    const cuotas = Number(p.cuotas) || 0;
    const i = (Number(p.tasa) || 0) / 100 / 12;
    if (capitalneto <= 0 || cuotas <= 0) return 0;
    const cuota = i > 0 ? capitalneto * (i / (1 - Math.pow(1 + i, -cuotas))) : capitalneto / cuotas;
    return Math.round(cuota * 100) / 100;
  });

  /**
   * Reparto del cobro al préstamo (interés simple sobre el saldo, misma regla
   * de gracia/mora que facturas). Recalcula en vivo según el efectivo capturado.
   */
  repartoPrestamo = computed(() => {
    const p = this.prestamoSeleccionado();
    const r2 = (x: number) => Math.round(x * 100) / 100;
    const efectivo = this.totalPagos();
    const vlrcuota = this.vlrcuotaPactada();
    if (!p) return null;
    const saldo = Number(p.saldoactual) || Number(p.capitalneto) || Number(p.capital) || 0;
    if (saldo <= 0) {
      return { saldo, efectivo, vlrcuota, interes: 0, mora: 0, cargos: 0, abonoCapital: 0, saldoNuevo: 0, diasInteres: 0, diasMora: 0, cumple: false };
    }


    const hoy = new Date();
    const fechaBase = (p.fechaUltPago ? new Date(p.fechaUltPago) : null)
      ?? (p.fechaEfectiva ? new Date(p.fechaEfectiva) : hoy);
    const ultcuotapagada = p.ultcuotapagada;
     const tasa = (Number(p.tasa) || 0) / 100;
    const tasaMor = (Number(p.moratorio) || 0) / 100;
    const diasPlazo = Number(p.diascuotas) || 0;
    const gracia = Number(p.gracia) || 0;

    const diasTrans = Math.max(0, this.diasEntre(fechaBase, hoy));
    const proximo = this.sumarDias(fechaBase, diasPlazo);
    const fechaMax = this.sumarDias(proximo, gracia);
    let diasInteres = diasTrans;
    let diasMora = 0;
    let diasGracia = 0;
    if (this.diasEntre(hoy, fechaMax) >= 0) {
      // Dentro de plazo/gracia: la gracia usada no devenga interés.
      diasGracia = Math.max(0, this.diasEntre(proximo, hoy));
      diasInteres = Math.max(0, diasTrans - diasGracia);
    } else {
      // Vencido: interés sobre todos los días + mora desde el fin de gracia.
      diasMora = this.diasEntre(fechaMax, hoy);
    }

    const interes = r2(saldo * tasa * (diasInteres / 360));
    const mora = r2(saldo * tasaMor * (diasMora / 360));
    const cargos = r2(interes + mora);
    const abonoCapital = r2(Math.max(0, efectivo - cargos));
    const saldoNuevo = r2(Math.max(0, saldo - abonoCapital));
    return {
      saldo, fechaBase, ultcuotapagada, proximo, fechaMax, diasTrans, diasInteres, diasMora,diasGracia,
      interes, mora, cargos, efectivo, abonoCapital, saldoNuevo, vlrcuota,
      cumple: efectivo >= vlrcuota - 0.01,
    };
  });

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
          // Recarga el select de clientes con el destino real de la caja
          // (cargarOpciones corrió con destino=1 por defecto).
          this.cargarClientes();
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
   * - destino=2 (Préstamos): solo clientes con préstamos activos (con cuotas por cobrar).
   */
  private cargarClientes() {
    const ruta = this.destinoAbono() === 2
      ? '/cxc/clientes-con-prestamos'
      : '/cxc/clientes-con-saldo';
    this.api.get<any>(ruta).subscribe({
      next: (res) => {
        const items = Array.isArray(res) ? res : (res?.data ?? []);
        // En edición, el cliente de la caja puede ya no estar en la lista
        // (ej. su préstamo se saldó después) → se agrega para no perderlo del select.
        const actual = this.form?.get('clienteId')?.value;
        if (actual && !items.some((i: any) => i.clienteId === actual)) {
          items.push({
            clienteId: actual,
            nrocliente: this.form.get('nrocliente')?.value ?? '',
            cliente: this.form.get('nombrecliente')?.value || '(Cliente de la caja)',
            dni: '',
            rtn: '',
            saldo: 0,
          });
        }
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
        this.prestamoSeleccionado.set(null);
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
    this.prestamoSeleccionado.set(null);
    // Recarga el select de clientes según el nuevo destino (saldo vs préstamos)
    this.cargarClientes();
  }

  /** Carga los préstamos del cliente (para el select), opcionalmente ejecuta un callback tras cargar. */
  private cargarPrestamosCliente(clienteId: number, after?: () => void) {
    this.cxcService.getPrestamosByCliente(clienteId).subscribe({
      next: (prestamos) => {
        // Activo = no anulado, sn_activo='S' Y con saldo de capital por cobrar
        // (los totalmente pagados conservan sn_activo='S' en BD).
        const activos = (prestamos ?? []).filter((p: any) =>
          p.sn_activo === 'S' && p.sn_anulado !== 'S' && Number(p.saldoactual ?? p.capital ?? 0) > 0,
        );
        this.prestamosCliente.set(activos.map((p: any) => ({
          // saldoactual: capital pendiente (fallback al capital para préstamos antiguos sin saldo)
          label: `${p.nroprestamo} · Saldo L ${Number(p.saldoactual ?? p.capital ?? 0).toFixed(2)} · Cuota L ${this.calcularVlrcuota(p).toFixed(2)}`,
          value: p.prestamoId,
          _raw: p,
        })));
        after?.();
      },
      error: () => {
        this.prestamosCliente.set([]);
        this.prestamoSeleccionado.set(null);
      },
    });
  }

  /**
   * Al elegir el préstamo fija el objeto crudo; el cálculo de interés
   * (interés simple sobre el saldo, anclado en fechaUltPago) lo deriva el
   * computed `repartoPrestamo` en vivo según el efectivo capturado.
   */
  onPrestamoChange(prestamoId: number | null) {
    this.form.patchValue({ prestamoId: prestamoId ?? null }, { emitEvent: false });
    this.prestamoSeleccionado.set(
      prestamoId ? (this.prestamosCliente().find((p) => p.value === prestamoId)?._raw ?? null) : null,
    );
  }

  /** Cuota pactada de un préstamo (francesa mensual) — espejo de vlrcuotaPactada por objeto. */
  private calcularVlrcuota(p: any): number {
    if (!p) return 0;
    const capitalneto = Number(p.capitalneto)
      || Math.max(0, (Number(p.capital) || 0) - (Number(p.prima) || 0));
    const cuotas = Number(p.cuotas) || 0;
    const i = (Number(p.tasa) || 0) / 100 / 12;
    if (capitalneto <= 0 || cuotas <= 0) return 0;
    const cuota = i > 0 ? capitalneto * (i / (1 - Math.pow(1 + i, -cuotas))) : capitalneto / cuotas;
    return Math.round(cuota * 100) / 100;
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

  /** Label de la forma de pago seleccionada en la fila (o vacío). */
  private labelFp(row: any): string {
    const opts = this.formasPago();
    const selected = opts.find((o: any) => o.value === row['formapagoId']);
    return selected ? String(selected.label) : '';
  }

  esEfectivo(row: any): boolean {
    return /efectivo/i.test(this.labelFp(row));
  }

  /** Tarjeta de crédito/débito: muestra select de marca + nro. tarjeta. */
  esTarjeta(row: any): boolean {
    return /tarjeta/i.test(this.labelFp(row));
  }

  /** Transferencia: muestra autorización. */
  esTransferencia(row: any): boolean {
    return /transferencia|transfer/i.test(this.labelFp(row));
  }

  /** Limpia los campos que no aplican al cambiar la forma de pago. */
  onFormaPagoChange(row: any) {
    const esTarjeta = this.esTarjeta(row);
    const esTrans = this.esTransferencia(row);
    if (!esTarjeta) {
      row['tarjetacreditoId'] = null;
      row['nrotarjeta'] = '';
    }
    if (!esTrans) {
      row['nroautorizacion'] = '';
    }
    if (this.esEfectivo(row)) {
      row['tarjetacreditoId'] = null;
      row['nrotarjeta'] = '';
      row['nroautorizacion'] = '';
    }
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

    if (this.destinoAbono() === 2) {
      if (!this.form.get('prestamoId')?.value) {
        this.msgs.add({ severity: 'warn', summary: 'Validación', detail: 'Seleccione el préstamo a pagar' });
        return;
      }
      const rp = this.repartoPrestamo();
      if (rp && !rp.cumple) {
        this.msgs.add({
          severity: 'warn',
          summary: 'Validación',
          detail: `El efectivo recibido (L ${rp.efectivo.toFixed(2)}) es menor a la cuota pactada (L ${rp.vlrcuota.toFixed(2)})`,
        });
        return;
      }
    }

    this.confirm.confirm({
      message: '¿Está seguro de aplicar el abono?',
      header: 'Confirmación',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: {
        label: 'Sí',
        severity: 'success',
        variant: 'text',
        size: 'small',
        rounded: true,
      },
      rejectButtonProps: {
        label: 'No',
        severity: 'secondary',
        variant: 'text',
        size: 'small',
        rounded: true,
      },
      accept: () => this.ejecutarGuardado(),
    });
  }

  private ejecutarGuardado() {

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

  /** Tras guardar maestro + detalles, genera los movimientos CxC (reparto) o aplica al préstamo y finaliza. */
  private procesarYFinalizar(maeId: number) {
    // Destino = Préstamos: modelo de INTERÉS SIMPLE sobre el saldo (sin plan de
    // pagos). El backend recalcula interés/mora con la fecha de sistema como
    // autoridad y valida que el efectivo cubra la cuota pactada.
    if (this.destinoAbono() === 2) {
      const payload = { prestamoId: this.form.get('prestamoId')?.value };
      this.cxcService.procesarAbono(maeId, payload).subscribe({
        next: (res) => {
          if (res?.motivo) {
            this.msgs.add({ severity: 'warn', summary: 'Cobro a préstamo', detail: res.motivo });
          } else {
            this.msgs.add({
              severity: 'success',
              summary: 'Cobro a préstamo',
              detail: `Interés L ${(res!.interes || 0).toFixed(2)} · Mora L ${(res!.mora || 0).toFixed(2)} · Abono capital L ${(res!.abonoCapital || 0).toFixed(2)} · Nuevo saldo L ${(res!.saldoNuevo || 0).toFixed(2)}`,
            });
          }
          this.finalizar(maeId);
        },
        error: () => {
          this.finalizar(maeId);
          this.msgs.add({
            severity: 'warn',
            summary: 'Caja guardada',
            detail: 'Cobro guardado, pero no se pudo aplicar al préstamo',
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
    this.prestamoSeleccionado.set(null);
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
