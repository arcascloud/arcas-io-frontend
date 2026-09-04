import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TableModule } from 'primeng/table';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { FacturacionService } from '../../../core/services/facturacion.service';
import { MAESTRO_DETALLE, MaestroDetalleConfig, CampoMae, CampoDetalle } from '../../../core/models/facturacion.models';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { EntitySelectorHelper, EntitySelectorConfig } from '../../helpers/entity-selector';
import { FooterHelper } from '../../helpers/footer';
import { CxcService } from '../../../core/services/cxc.service';
import { NavegacionService } from '../../../core/services/navegacion.service';

@Component({
  selector: 'app-maestro-detalle-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    DatePickerModule,
    TableModule,
  ],
  providers: [DialogService],
  templateUrl: './maestro-detalle-form.html',
  styleUrl: './maestro-detalle-form.scss',
})
export class MaestroDetalleForm implements OnInit {
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
  ref: DynamicDialogRef | undefined;
  private msgs = inject(MessageService);

  config!: MaestroDetalleConfig;
  camposMae: CampoMae[] = [];
  camposDet: CampoDetalle[] = [];

  esEdicion = signal(false);
  cargando = signal(false);
  guardando = signal(false);
  titulo = signal('');

  opcionesMap = signal<Record<string, { label: string; value: any }[]>>({});

  dets = signal<any[]>([]);
  detGuardados = new Set<number>();
  documentosPendientes = signal<any[]>([]);

  private itemId = 0;
  private contadorFila = 0;
  private factorCambioDefault = 0;

  form!: FormGroup;

  ngOnInit() {
    const nombre = this.route.snapshot.data['nombre'] ?? '';
    const id = this.route.snapshot.paramMap.get('id') ?? '';

    this.config = MAESTRO_DETALLE[nombre];
    if (!this.config) {
      this.msgs.add({ severity: 'error', summary: 'Error', detail: `Módulo desconocido: ${nombre}` });
      return;
    }
    this.camposMae = this.config.camposMae;
    this.camposDet = this.config.camposDet;
    this.titulo.set(this.config.titulo);
    this.buildForm();
    this.cargarOpciones();
    this.vigilarCliente();
    this.cargarFactorCambio();

    if (id && id !== 'nuevo') {
      this.esEdicion.set(true);
      this.itemId = Number(id);
      this.cargando.set(true);
      this.service.getMaeOne<any>(this.config.rutaMae, this.itemId).subscribe({
        next: (mae) => {
          const patch: Record<string, any> = {};
          for (const c of this.camposMae) {
            const v = mae?.[c.key];
            patch[c.key] = c.tipo === 'fecha' && v ? new Date(v) : v;
          }
          this.form.patchValue(patch);
          this.cargarDets();
        },
        error: () => {
          this.cargando.set(false);
          this.msgs.add({ severity: 'error', summary: 'Error', detail: 'Registro no encontrado' });
          this.volver();
        },
      });
    }
  }

  private buildForm() {
    const group: Record<string, any> = {};
    for (const c of this.camposMae) {
      const hasDefault = c.defaultValue !== undefined && c.defaultValue !== null;
      const initial = hasDefault ? c.defaultValue : (c.tipo === 'numero' ? 0 : null);
      group[c.key] = [initial, c.requerido ? Validators.required : []];
    }
    this.form = this.fb.group(group);
  }

  private cargarOpciones() {
    const all = [...this.camposMae, ...this.camposDet] as (CampoMae | CampoDetalle)[];
    for (const c of all) {
      if (c.cargaOpciones) {
        this.api.get<any>(c.cargaOpciones.url).subscribe({
          next: (res) => {
            let items: any[] = [];
            if (Array.isArray(res)) {
              items = res;
            } else if (res && typeof res === 'object') {
              const candidate = res.data ?? res.results ?? Object.values(res).find(Array.isArray) ?? [];
              items = Array.isArray(candidate) ? candidate : [];
            }
            let filtered = items;
            const filtro = (c as CampoMae).filtroAbreviaturas;
            if (filtro?.length) {
              filtered = filtered.filter((i: any) => filtro.includes(i.abreviatura));
            }
            const opts = filtered.map((i: any) => ({
              label: String(i[c.cargaOpciones!.labelCampo] ?? i[c.cargaOpciones!.valueCampo] ?? ''),
              value: i[c.cargaOpciones!.valueCampo],
            }));
            this.opcionesMap.update((m) => ({ ...m, [c.key]: opts }));
          },
        });
      }
    }
  }

  opciones(c: CampoMae | CampoDetalle): { label: string; value: any }[] {
    if (c.cargaOpciones) return this.opcionesMap()[c.key] ?? [];
    return (c as any).opciones ?? [];
  }

  esEfectivo(row: any): boolean {
    const opts = this.opcionesMap()['formapagoId'] ?? [];
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

  abrirSelector(selectorName: string) {
    (this as any)[selectorName]?.();
  }

  private vigilarCliente() {
    this.form.get('clienteId')?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((clienteId) => {
      if (!clienteId) {
        this.form.patchValue({ nrocliente: '', nombrecliente: '' });
        this.documentosPendientes.set([]);
        this.filtrarOpcionesDocumento();
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
          this.filtrarOpcionesDocumento();
        },
        error: () => {
          this.documentosPendientes.set([]);
          this.filtrarOpcionesDocumento();
        },
      });
    });
  }

  private filtrarOpcionesDocumento() {
    const docs = this.documentosPendientes();
    const tiposUnicos = [...new Set(docs.map(d => d.documentoId))];
    const allOpts = this.opcionesMap()['documentoId'] ?? [];
    const filtradas = allOpts.filter(o => tiposUnicos.includes(o.value));
    this.opcionesMap.update(m => ({ ...m, ['__docFiltradas']: filtradas }));
    this.form.get('documentoId')?.setValue(null);
    this.form.get('nrodocumento')?.setValue(null);
    this.opcionesMap.update(m => ({ ...m, ['__nroDocFiltradas']: [] }));
  }

  opcionesDocumento(): { label: string; value: any }[] {
    return this.opcionesMap()['__docFiltradas'] ?? this.opcionesMap()['documentoId'] ?? [];
  }

  opcionesNroDocumento(): { label: string; value: any }[] {
    const docId = this.form.get('documentoId')?.value;
    if (!docId) return [];
    const docs = this.documentosPendientes().filter(d => d.documentoId === docId);
    return docs.map(d => ({
      label: `${d.nroreferencia} (Saldo: ${d.saldo.toFixed(2)})`,
      value: d.nroreferencia,
    }));
  }

  onDocumentoIdChange() {
    const docId = this.form.get('documentoId')?.value;
    this.form.get('nrodocumento')?.setValue(null);
    if (docId) {
      const docs = this.documentosPendientes().filter(d => d.documentoId === docId);
      const opts = docs.map(d => ({
        label: `${d.nroreferencia} (Saldo: ${d.saldo.toFixed(2)})`,
        value: d.nroreferencia,
      }));
      this.opcionesMap.update(m => ({ ...m, ['__nroDocFiltradas']: opts }));
    } else {
      this.opcionesMap.update(m => ({ ...m, ['__nroDocFiltradas']: [] }));
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

  private cargarFactorCambio() {
    this.api.get<any[]>('/contabilidad/factordecambio').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (items) => {
        const dolares = (items ?? [])
          .filter((f) => f.tipomoneda === 'D')
          .sort((a, b) => new Date(b.fecharegistro).getTime() - new Date(a.fecharegistro).getTime());
        if (dolares.length > 0) {
          this.factorCambioDefault = Number(dolares[0].preciocompra) || 0;
        }
      },
    });
  }

  private cargarDets() {
    const rutaDetById = this.config.rutaDetById
      ? `${this.config.rutaDetById}/${this.itemId}`
      : `${this.config.rutaDet}/factura/${this.itemId}`;
    this.service.getDet<any>(rutaDetById).subscribe({
      next: (mios) => {
        this.dets.set((mios ?? []).map((d) => ({ ...d })));
        for (const d of (mios ?? [])) this.detGuardados.add(d[this.config.idKeyDet]);
        this.contadorFila = (mios ?? []).length;
        this.cargando.set(false);
      },
      error: () => {
        this.service.getDet<any>(this.config.rutaDet).subscribe({
          next: (todos) => {
            const mios = (todos ?? []).filter((d) => d[this.config.fkDet] === this.itemId);
            this.dets.set(mios.map((d) => ({ ...d })));
            for (const d of mios) this.detGuardados.add(d[this.config.idKeyDet]);
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
    const fila: any = { __local: true };
    for (const c of this.camposDet) {
      if (c.key === 'nrofila') fila[c.key] = this.contadorFila;
      else if (c.key === 'factordecambio') fila[c.key] = this.factorCambioDefault;
      else fila[c.key] = c.tipo === 'numero' ? 0 : c.tipo === 'fecha' ? new Date() : '';
    }
    this.dets.update((d) => [...d, fila]);
  }

  quitarFila(idx: number) {
    const fila = this.dets()[idx];
    if (fila[this.config.idKeyDet] && this.detGuardados.has(fila[this.config.idKeyDet])) return;
    this.dets.update((d) => d.filter((_, i) => i !== idx));
  }

  invalid(ctrl: string): boolean {
    const c = this.form.get(ctrl);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  volver() {
    this.navegacion.volver([this.config.rutaMae]);
  }

  esNuevaFila(fila: any): boolean {
    return !fila[this.config.idKeyDet] || !this.detGuardados.has(fila[this.config.idKeyDet]);
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
      ? this.service.updateMae<any>(this.config.rutaMae, this.itemId, maeBody as any)
      : this.service.createMae<any>(this.config.rutaMae, maeBody as any);

    maeOp.subscribe({
      next: (mae) => {
        const maeId = this.esEdicion() ? this.itemId : mae[this.config.idKeyMae];
        this.guardarDets(maeId);
      },
      error: () => {
        this.guardando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el documento' });
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
      const detId = fila[this.config.idKeyDet];
      const body = { ...fila, [this.config.fkDet]: maeId, empresaId };
      delete body.__local;
      if (detId && this.detGuardados.has(detId)) {
        this.service.updateDet<any>(this.config.rutaDet, detId, body as any).subscribe({ next: ok, error: fail });
      } else {
        this.service.createDet<any>(this.config.rutaDet, body as any).subscribe({ next: ok, error: fail });
      }
    }
  }

  private finalizar() {
    this.guardando.set(false);
    this.msgs.add({
      severity: 'success',
      summary: 'Guardado',
      detail: this.esEdicion() ? 'Documento actualizado' : 'Documento creado correctamente',
    });
    this.form.reset();
    for (const c of this.camposMae) {
      const hasDefault = c.defaultValue !== undefined && c.defaultValue !== null;
      const initial = hasDefault ? c.defaultValue : (c.tipo === 'numero' ? 0 : null);
      this.form.get(c.key)?.setValue(initial);
    }
    this.dets.set([]);
    this.detGuardados.clear();
    this.contadorFila = 0;
    this.documentosPendientes.set([]);
    this.esEdicion.set(false);
    this.itemId = 0;
    this.filtrarOpcionesDocumento();
  }
}