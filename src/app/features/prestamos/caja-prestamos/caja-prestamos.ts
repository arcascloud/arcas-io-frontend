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
  selector: 'app-caja-prestamos',
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
  templateUrl: './caja-prestamos.html',
  styleUrl: './caja-prestamos.scss',
})
export class CajaPrestamos implements OnInit {
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

  docSeleccionado = signal<any>(null);
  totalPagos = signal(0);
  esAnulada = signal(false);
  destinoAbono = signal<number>(2);
  readonly DESTINO_ABONO = [{ label: 'Préstamos', value: 2 }] as const;
  prestamosCliente = signal<{ label: string; value: number; _raw: any }[]>([]);
  prestamoSeleccionado = signal<any>(null);

  esDestinoPrestamo = computed(() => this.destinoAbono() === 2);

  vlrcuotaPactada = computed(() => {
    const p = this.prestamoSeleccionado();
    if (!p) return 0;
    const persistido = Number(p.vlrcuota) || 0;
    if (persistido > 0) return Math.round(persistido * 100) / 100;
    const capitalneto =
      Number(p.capitalneto) || Math.max(0, (Number(p.capital) || 0) - (Number(p.prima) || 0));
    const cuotas = Number(p.cuotas) || 0;
    const i = (Number(p.tasa) || 0) / 100 / 12;
    if (capitalneto <= 0 || cuotas <= 0) return 0;
    const cuota = i > 0 ? capitalneto * (i / (1 - Math.pow(1 + i, -cuotas))) : capitalneto / cuotas;
    return Math.round(cuota * 100) / 100;
  });

  repartoPrestamo = computed(() => {
    const p = this.prestamoSeleccionado();
    const r2 = (x: number) => Math.round(x * 100) / 100;
    const efectivo = this.totalPagos();
    const vlrcuota = this.vlrcuotaPactada();
    if (!p) return null;
    const saldo = Number(p.saldoactual) || Number(p.capitalneto) || Number(p.capital) || 0;
    if (saldo <= 0) {
      return {
        saldo,
        efectivo,
        vlrcuota,
        interes: 0,
        mora: 0,
        cargos: 0,
        abonoCapital: 0,
        saldoNuevo: 0,
        diasInteres: 0,
        diasMora: 0,
        cumple: false,
      };
    }

    const hoy = new Date();
    const fechaBase =
      (p.fechaUltPago ? new Date(p.fechaUltPago) : null) ??
      (p.fechaEfectiva ? new Date(p.fechaEfectiva) : hoy);
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
    if (this.diasEntre(hoy, fechaMax) < 0) {
      diasMora = this.diasEntre(fechaMax, hoy);
    }

    const interes = r2(saldo * tasa * (diasInteres / 360));
    const cuotaBase = vlrcuota > 0 ? vlrcuota : efectivo > 0 ? efectivo : 0;
    const saldoCapitalCuota = Math.max(0, cuotaBase - interes);
    const mora = r2(saldoCapitalCuota * tasaMor * (diasMora / 360));
    const cargos = r2(interes + mora);
    const efectivoAplicar = efectivo > 0 ? efectivo : vlrcuota;
    const abonoCapital = r2(Math.max(0, efectivoAplicar - cargos));
    const saldoNuevo = r2(Math.max(0, saldo - abonoCapital));
    return {
      saldo,
      fechaBase,
      ultcuotapagada,
      proximo,
      fechaMax,
      diasTrans,
      diasInteres,
      diasMora,
      diasGracia,
      interes,
      mora,
      cargos,
      efectivo,
      abonoCapital,
      saldoNuevo,
      vlrcuota,
      cumple: efectivo >= vlrcuota - 0.01,
    };
  });

  puedeEditar = computed(() => !this.esAnulada() && !this.guardando() && !this.anulando());
  totalCargos = computed(() => {
    const doc = this.docSeleccionado();
    return doc?.esFacturaCredito ? Number(doc.totalCargos) || 0 : 0;
  });
  abonoCapital = computed(() => {
    const pagos = this.totalPagos();
    const cargos = this.totalCargos();
    return Math.max(0, Math.round((pagos - cargos) * 100) / 100);
  });
  saldoNuevo = computed(() => {
    const doc = this.docSeleccionado();
    if (!doc) return 0;
    const saldo = Number(doc.saldo) || 0;
    return Math.round((saldo - this.abonoCapital()) * 100) / 100;
  });
  cargosCubiertos = computed(() => Math.min(this.totalCargos(), this.totalPagos()));
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
          this.destinoAbono.set(Number(mae?.destinoabono) || 2);
          this.cargarClientes();
          this.form.patchValue({
            moduloId: mae?.moduloId ?? 4,
            clienteId: mae?.clienteId,
            nrocliente: mae?.nrocliente ?? '',
            nombrecliente: mae?.nombrecliente ?? '',
            concepto: mae?.concepto ?? '',
            destinoabono: Number(mae?.destinoabono) || 2,
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
      destinoabono: [2],
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
        this.documentosFiscales.set(
          filtrados.map((i: any) => ({ label: i.descripcion, value: i.tipodocumentofiscalId })),
        );
      },
    });
    this.api.get<any>('/parametros/formas-pago').subscribe({
      next: (res) => {
        const items = Array.isArray(res) ? res : (res?.data ?? []);
        this.formasPago.set(items.map((i: any) => ({ label: i.descripcion, value: i.formapagoId })));
      },
    });
    this.api.get<any>('/parametros/tarjetas-credito').subscribe({
      next: (res) => {
        const items = Array.isArray(res) ? res : (res?.data ?? []);
        this.tarjetas.set(items.map((i: any) => ({ label: i.descripcion, value: i.tarjetacreditoId })));
      },
    });
  }

  private cargarClientes() {
    this.api.get<any>('/cxc/clientes-con-prestamos', { moduloId: 10 }).subscribe({
      next: (res) => {
        const items = Array.isArray(res) ? res : (res?.data ?? []);
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
    this.form
      .get('clienteId')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((clienteId) => {
        if (!clienteId) {
          this.form.patchValue({ nrocliente: '', nombrecliente: '' });
          this.prestamosCliente.set([]);
          this.prestamoSeleccionado.set(null);
          return;
        }
        this.api.get<any>(`/cxc/clientes/${clienteId}`).subscribe({
          next: (cliente) =>
            this.form.patchValue({
              nrocliente: cliente?.nrocliente ?? '',
              nombrecliente: `${cliente?.nombres ?? ''} ${cliente?.apellidos ?? ''}`.trim(),
            }),
          error: () => this.form.patchValue({ nrocliente: '', nombrecliente: '' }),
        });

        this.cargarPrestamosCliente(clienteId, () => {
          const lista = this.prestamosCliente();
          if (lista.length) {
            this.onPrestamoChange(lista[0].value);
          }
        });
      });
  }

  onDestinoChange() {
    const destino = this.form.get('destinoabono')?.value ?? 2;
    this.destinoAbono.set(Number(destino));
    this.form.patchValue(
      { clienteId: null, nrocliente: '', nombrecliente: '', prestamoId: null },
      { emitEvent: false },
    );
    this.prestamosCliente.set([]);
    this.prestamoSeleccionado.set(null);
    this.cargarClientes();
  }

  private cargarPrestamosCliente(clienteId: number, after?: () => void) {
    this.cxcService.getPrestamosByCliente(clienteId).subscribe({
      next: (prestamos) => {
        const activos = (prestamos ?? []).filter(
          (p: any) =>
            p.sn_activo === 'S' &&
            p.sn_anulado !== 'S' &&
            Number(p.saldoactual ?? p.capital ?? 0) > 0,
        );
        this.prestamosCliente.set(
          activos.map((p: any) => ({
            label: `${p.nroprestamo} · Saldo L ${Number(p.saldoactual ?? p.capital ?? 0).toFixed(2)} · Cuota L ${this.calcularVlrcuota(p).toFixed(2)}`,
            value: p.prestamoId,
            _raw: p,
          })),
        );
        after?.();
      },
      error: () => {
        this.prestamosCliente.set([]);
        this.prestamoSeleccionado.set(null);
      },
    });
  }

  onPrestamoChange(prestamoId: number | null) {
    this.form.patchValue({ prestamoId: prestamoId ?? null }, { emitEvent: false });
    this.prestamoSeleccionado.set(
      prestamoId
        ? (this.prestamosCliente().find((p) => p.value === prestamoId)?._raw ?? null)
        : null,
    );
  }

  private calcularVlrcuota(p: any): number {
    if (!p) return 0;
    const capitalneto =
      Number(p.capitalneto) || Math.max(0, (Number(p.capital) || 0) - (Number(p.prima) || 0));
    const cuotas = Number(p.cuotas) || 0;
    const i = (Number(p.tasa) || 0) / 100 / 12;
    if (capitalneto <= 0 || cuotas <= 0) return 0;
    const cuota = i > 0 ? capitalneto * (i / (1 - Math.pow(1 + i, -cuotas))) : capitalneto / cuotas;
    return Math.round(cuota * 100) / 100;
  }

  private diasEntre(desde: Date, hasta: Date): number {
    const d1 = new Date(Date.UTC(desde.getFullYear(), desde.getMonth(), desde.getDate()));
    const d2 = new Date(Date.UTC(hasta.getFullYear(), hasta.getMonth(), hasta.getDate()));
    return Math.round((d2.getTime() - d1.getTime()) / 86400000);
  }

  private sumarDias(fecha: Date, dias: number): Date {
    const d = new Date(fecha.getTime());
    d.setDate(d.getDate() + dias);
    return d;
  }

  private vigilarNroDocumento() {}

  onDocumentoIdChange() {}
  onNroDocumentoChange(nro: any) {}

  recalcularTotal() {
    const total = this.dets().reduce((s, r) => s + (Number(r['importe']) || 0), 0);
    this.totalPagos.set(Math.round(total * 100) / 100);
  }

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

  abrirClientes() {
    const config: EntitySelectorConfig = {
      titulo: 'Seleccionar cliente con préstamo',
      columns: [
        { key: 'nrocliente', label: 'Nro.' },
        { key: 'cliente', label: 'Nombre' },
        { key: 'dni', label: 'DNI' },
        { key: 'rtn', label: 'RTN' },
        { key: 'saldo', label: 'Saldo Préstamo' },
      ],
      loadData: () => {
        return new Promise<any[]>((resolve) => {
          this.api.get<any>('/cxc/clientes-con-prestamos', { moduloId: 10 }).subscribe({
            next: (res) => resolve(Array.isArray(res) ? res : (res?.data ?? [])),
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

  opcionesFp() { return this.formasPago(); }
  opcionesTarjeta() { return this.tarjetas(); }

  private labelFp(row: any): string {
    const opts = this.formasPago();
    const selected = opts.find((o: any) => o.value === row['formapagoId']);
    return selected ? String(selected.label) : '';
  }

  esEfectivo(row: any): boolean { return /efectivo/i.test(this.labelFp(row)); }
  esTarjeta(row: any): boolean { return /tarjeta/i.test(this.labelFp(row)); }
  esTransferencia(row: any): boolean { return /transferencia|transfer/i.test(this.labelFp(row)); }

  onFormaPagoChange(row: any) {
    if (!this.esTarjeta(row)) { row['tarjetacreditoId'] = null; row['nrotarjeta'] = ''; }
    if (!this.esTransferencia(row)) { row['nroautorizacion'] = ''; }
    if (this.esEfectivo(row)) { row['tarjetacreditoId'] = null; row['nrotarjeta'] = ''; row['nroautorizacion'] = ''; }
  }

  private cargarDets() {
    this.service.getDet<any>(`/cxc/caja-det/factura/${this.itemId}`).subscribe({
      next: (mios) => {
        this.dets.set((mios ?? []).map((d) => ({ ...d })));
        for (const d of mios ?? []) this.detGuardados.add(d['cxccajadetId']);
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
    this.dets.update((d) => [
      ...d,
      {
        __local: true,
        nrofila: this.contadorFila,
        formapagoId: null,
        /** Inicia vacío (undefined) para que el campo no muestre 0. */
        importe: undefined,
        tarjetacreditoId: null,
        nrotarjeta: '',
        nroautorizacion: '',
        factordecambio: 0,
      },
    ]);
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

  volver() {
    this.navegacion.volver(['/prestamos/caja-prestamos']);
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (!this.validarDetalles()) return;

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

    this.confirm.confirm({
      message: '¿Está seguro de aplicar el abono al préstamo?',
      header: 'Confirmación',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { label: 'Sí', severity: 'success', variant: 'text', size: 'small', rounded: true },
      rejectButtonProps: { label: 'No', severity: 'secondary', variant: 'text', size: 'small', rounded: true },
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

  private procesarYFinalizar(maeId: number) {
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
        this.msgs.add({ severity: 'warn', summary: 'Caja guardada', detail: 'Cobro guardado, pero no se pudo aplicar al préstamo' });
      },
    });
  }

  private finalizar(nuevoId?: number) {
    this.guardando.set(false);
    const idParaImprimir = nuevoId ?? this.itemId;
    this.msgs.add({ severity: 'success', summary: 'Guardado', detail: this.esEdicion() ? 'Caja actualizada' : 'Caja creada correctamente' });
    this.form.reset({
      moduloId: 4,
      clienteId: null,
      nrocliente: '',
      nombrecliente: '',
      concepto: '',
      destinoabono: 2,
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
    this.prestamosCliente.set([]);
    this.prestamoSeleccionado.set(null);
    this.totalPagos.set(0);
    this.esEdicion.set(false);
    this.esAnulada.set(false);
    this.itemId = 0;
  }

  imprimirRecibo(cajaId?: number) {}
  anular() {}
}
