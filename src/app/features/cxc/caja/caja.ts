import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { MessageService } from 'primeng/api';
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
  ],
  providers: [DialogService],
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
  ref: DynamicDialogRef | undefined;

  esEdicion = signal(false);
  cargando = signal(false);
  guardando = signal(false);

  clientes = signal<any[]>([]);
  documentosFiscales = signal<any[]>([]);
  formasPago = signal<any[]>([]);
  tarjetas = signal<any[]>([]);
  documentosPendientes = signal<any[]>([]);
  documentosFiltrados = signal<any[]>([]);
  nrosDocumento = signal<any[]>([]);

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

    if (id && id !== 'nuevo') {
      this.esEdicion.set(true);
      this.itemId = Number(id);
      this.cargando.set(true);
      this.service.getMaeOne<any>('/cxc/caja-mae', this.itemId).subscribe({
        next: (mae) => {
          this.form.patchValue({
            moduloId: mae?.moduloId ?? 4,
            clienteId: mae?.clienteId,
            nrocliente: mae?.nrocliente ?? '',
            nombrecliente: mae?.nombrecliente ?? '',
            concepto: mae?.concepto ?? '',
            documentoId: mae?.documentoId,
            nrodocumento: mae?.nrodocumento,
            tipomov: mae?.tipomov ?? 'C',
            sn_cotabilizada: mae?.sn_cotabilizada ?? 'N',
            sn_anulado: mae?.sn_anulado ?? 'N',
            fec_anulacion: mae?.fec_anulacion ?? null,
            partidaId: mae?.partidaId ?? 0,
          });
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
    this.api.get<any>('/cxc/clientes-con-saldo').subscribe({
      next: (res) => {
        const items = Array.isArray(res) ? res : (res?.data ?? []);
        this.clientes.set(items);
      },
    });
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

  private vigilarCliente() {
    this.form.get('clienteId')?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((clienteId) => {
      if (!clienteId) {
        this.form.patchValue({ nrocliente: '', nombrecliente: '' });
        this.documentosPendientes.set([]);
        this.documentosFiltrados.set([]);
        this.nrosDocumento.set([]);
        return;
      }
      this.api.get<any>(`/cxc/clientes/${clienteId}`).subscribe({
        next: (cliente) => this.form.patchValue({
          nrocliente: cliente?.nrocliente ?? '',
          nombrecliente: `${cliente?.nombres ?? ''} ${cliente?.apellidos ?? ''}`.trim(),
        }),
        error: () => this.form.patchValue({ nrocliente: '', nombrecliente: '' }),
      });
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

  abrirClientes() {
    const config: EntitySelectorConfig = {
      titulo: 'Seleccionar cliente con saldo',
      columns: [
        { key: 'nrocliente', label: 'Nro.' },
        { key: 'cliente', label: 'Nombre' },
        { key: 'dni', label: 'DNI' },
        { key: 'rtn', label: 'RTN' },
      ],
      loadData: () => {
        return new Promise<any[]>((resolve) => {
          this.api.get<any>('/cxc/clientes-con-saldo').subscribe({
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

  private cargarDets() {
    this.service.getDet<any>(`/cxc/caja-det/factura/${this.itemId}`).subscribe({
      next: (mios) => {
        this.dets.set((mios ?? []).map((d) => ({ ...d })));
        for (const d of (mios ?? [])) this.detGuardados.add(d['cxccajadetId']);
        this.contadorFila = (mios ?? []).length;
        this.cargando.set(false);
      },
      error: () => {
        this.service.getDet<any>('/cxc/caja-det').subscribe({
          next: (todos) => {
            const mios = (todos ?? []).filter((d) => d['cxccajaId'] === this.itemId);
            this.dets.set(mios.map((d) => ({ ...d })));
            for (const d of mios) this.detGuardados.add(d['cxccajadetId']);
            this.contadorFila = mios.length;
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
    const fila = this.dets()[idx];
    if (fila['cxccajadetId'] && this.detGuardados.has(fila['cxccajadetId'])) return;
    this.dets.update((d) => d.filter((_, i) => i !== idx));
  }

  esNuevaFila(fila: any): boolean {
    return !fila['cxccajadetId'] || !this.detGuardados.has(fila['cxccajadetId']);
  }

  invalid(ctrl: string): boolean {
    const c = this.form.get(ctrl);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  volver() {
    this.navegacion.volver(['/cxc/caja-mae']);
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
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
      this.finalizar();
      return;
    }

    let completados = 0;
    const ok = () => {
      completados += 1;
      if (completados === pendientes) this.finalizar();
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

  private finalizar() {
    this.guardando.set(false);
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
    this.esEdicion.set(false);
    this.itemId = 0;
  }
}
