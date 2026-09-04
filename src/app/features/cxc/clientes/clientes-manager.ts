import { Component, inject, signal, OnInit, computed, ChangeDetectionStrategy, DestroyRef, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { timeout, catchError, of } from 'rxjs';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DataViewModule } from 'primeng/dataview';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { TabsModule } from 'primeng/tabs';
import { CardModule } from 'primeng/card';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { PaginatorModule } from 'primeng/paginator';
import { CxcService } from '../../../core/services/cxc.service';
import { AuthService } from '../../../core/services/auth.service';
import { CatalogoParametrosService } from '../../../core/services/catalogo-parametros.service';
import { CxcCliente } from '../../../core/models/cxc.models';
import { ClienteForm } from './cliente-form';

@Component({
  selector: 'app-clientes-manager',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ToolbarModule,
    ButtonModule,
    InputTextModule,
    DataViewModule,
    TagModule,
    TooltipModule,
    TabsModule,
    CardModule,
    SkeletonModule,
    DialogModule,
    InputNumberModule,
    SelectModule,
    DatePickerModule,
PaginatorModule,
    ClienteForm,
  ],
  templateUrl:'./clientes-manager.html',
  styleUrl: './clientes-manager.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientesManager implements OnInit {
  private service = inject(CxcService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private msgs = inject(MessageService);
  private auth = inject(AuthService);
  private catalogService = inject(CatalogoParametrosService);
  private destroyRef = inject(DestroyRef);

  // ===== OPCIONES DE SELECTS =====
  readonly notaTipoOptions = [
    { label: 'Crédito', value: 'C' },
    { label: 'Débito', value: 'D' },
  ];

  readonly estadoOptions = [
    { label: 'Activo', value: 'S' },
    { label: 'Inactivo', value: 'N' },
  ];

  readonly referenciaTipoOptions = [
    { label: 'Personal', value: 'Personal' },
    { label: 'Comercial', value: 'Comercial' },
    { label: 'Bancaria', value: 'Bancaria' },
    { label: 'Familiar', value: 'Familiar' },
  ];

  readonly referenciaParentescoOptions = [
    { label: 'Padre/Madre', value: 'Padre/Madre' },
    { label: 'Hermano/a', value: 'Hermano/a' },
    { label: 'Cónyuge', value: 'Cónyuge' },
    { label: 'Amigo/a', value: 'Amigo/a' },
    { label: 'Otro', value: 'Otro' },
  ];

  readonly parienteParentescoOptions = [
    { label: 'Padre', value: 'Padre' },
    { label: 'Madre', value: 'Madre' },
    { label: 'Hermano', value: 'Hermano' },
    { label: 'Hermana', value: 'Hermana' },
    { label: 'Hijo/a', value: 'Hijo/a' },
    { label: 'Cónyuge', value: 'Cónyuge' },
    { label: 'Abuelo/a', value: 'Abuelo/a' },
    { label: 'Tío/a', value: 'Tío/a' },
    { label: 'Otro', value: 'Otro' },
  ];

  // ===== FORMULARIO INLINE CLIENTES =====
  showForm = signal(false);
  editingCliente = signal<CxcCliente | null>(null);

  // ===== FORMULARIO INLINE NOTAS =====
  // showNotaForm = signal(false); // Ya no necesario, formulario siempre visible

  // Effect para resetear página y recargar cuando cambie el filtro (q)
  private _searchEffect = effect(() => {
    this.q();
    this.page.set(1);
    this.loadClientes();
  });

  data = signal<CxcCliente[]>([]);
  totalClientes = signal(0);
  page = signal(1);
  limit = signal(10);
  cargando = signal(false);

  q = signal('');

  // Notas (formulario inline)
  notaSaving = signal(false);
  notaModel = signal<any>({
    clienteId: null,
    tipomov: 'C',
    concepto: '',
    importe: 0,
    nroreferencia: '',
    fecharegistro: new Date().toISOString(),
  });

  // Préstamos (formulario inline)
  prestamoSaving = signal(false);
  prestamoModel = signal<any>({
    clienteId: null,
    nroprestamo: null,
    capital: 0,
    cuotas: 1,
    tasa: 0,
    vlrcuota: 0,
    fecharegistro: new Date().toISOString(),
    sn_activo: 'S',
  });

  prestamoFecha = computed(() => {
    const f = this.prestamoModel().fecharegistro;
    if (!f) return null;
    const d = new Date(f);
    return isNaN(d.getTime()) ? null : d;
  });

  onPrestamoFechaChange(d: Date | null) {
    this.prestamoModel.set({ ...this.prestamoModel(), fecharegistro: d ? d.toISOString() : null });
  }

  // Referencias (formulario inline)
  referenciaSaving = signal(false);
  referenciaModel = signal<any>({
    clienteId: null,
    nombres: '',
    apellidos: '',
    telefono: '',
    celular: '',
    tipo: '',
    parentesco: '',
    direccion1: '',
    lugarTrabajo: '',
    fechanacimiento: null,
    dni: '',
  });

  referenciaFecha = computed(() => {
    const f = this.referenciaModel().fechanacimiento;
    if (!f) return null;
    const d = new Date(f);
    return isNaN(d.getTime()) ? null : d;
  });

  onReferenciaFechaChange(d: Date | null) {
    this.referenciaModel.set({ ...this.referenciaModel(), fechanacimiento: d ? d.toISOString() : null });
  }

  // Parientes (formulario inline)
  parienteSaving = signal(false);
  parienteModel = signal<any>({
    clienteId: null,
    dni: '',
    nombres: '',
    apellidos: '',
    parentesco: '',
    telefono: '',
  });

  // Plan de pago (amortización)
  planPago = signal<any[]>([]);
  showPlanPago = signal(false);

  // Documentos select
  documentosOptions = signal<{label:string,value:any}[]>([]);
  documentoSelected = signal<any>(null);

  // Fecha auxiliar para p-datepicker (no usar new() en templates)
  notaFecha = computed(() => {
    const f = this.notaModel().fecharegistro;
    if (!f) return null;
    const d = new Date(f);
    return isNaN(d.getTime()) ? null : d;
  });

  onFechaChange(d: Date | null) {
    this.notaModel.set({ ...this.notaModel(), fecharegistro: d ? d.toISOString() : null });
  }

  selectedCliente = signal<CxcCliente | null>(null);

  estadoCuentaData = signal<any[]>([]);
  estadoCuentaLoading = signal(false);

  notasData = signal<any[]>([]);
  notasLoading = signal(false);

  prestamosData = signal<any[]>([]);
  prestamosLoading = signal(false);

  referenciasData = signal<any[]>([]);
  referenciasLoading = signal(false);

  parientesData = signal<any[]>([]);
  parientesLoading = signal(false);

  activeTabIndex = signal(0);

  // Saldo pendiente computado (evita recalcular en cada ciclo de detección de cambios)
  saldoPendiente = computed(() =>
    this.estadoCuentaData().reduce((sum, m) => {
      const importe = Number(m.importe || 0);
      // D = Débito (cargo) suma, C = Crédito / A = Abono restan
      if (m.tipomov === 'D') return sum + importe;
      return sum - importe;
    }, 0)
  );

  totalDebitos = computed(() =>
    this.estadoCuentaData()
      .filter(m => m.tipomov === 'D')
      .reduce((sum, m) => sum + Number(m.importe || 0), 0)
  );

  totalCreditos = computed(() =>
    this.estadoCuentaData()
      .filter(m => m.tipomov === 'C')
      .reduce((sum, m) => sum + Number(m.importe || 0), 0)
  );

  saldoDisponible = computed(() => this.totalDebitos() - this.totalCreditos());

  // Referencias de débitos existentes (nroreferencia únicos de movimientos tipo D)
  debitoReferencias = computed(() => {
    const refs = this.estadoCuentaData()
      .filter(m => m.tipomov === 'D' && m.nroreferencia)
      .map(m => String(m.nroreferencia));
    return [...new Set(refs)];
  });

  // Referencias ya usadas por notas de débito (no se pueden repetir)
  debitoReferenciasUsadas = computed(() => this.debitoReferencias());

  // Saldo disponible por referencia de débito específica
  saldoDisponiblePorRef(ref: string): number {
    if (!ref) return 0;
    const debitos = this.estadoCuentaData()
      .filter(m => m.tipomov === 'D' && String(m.nroreferencia) === ref)
      .reduce((sum, m) => sum + Number(m.importe || 0), 0);
    const creditos = this.estadoCuentaData()
      .filter(m => m.tipomov === 'C' && String(m.nroreferencia) === ref)
      .reduce((sum, m) => sum + Number(m.importe || 0), 0);
    return Math.max(debitos - creditos, 0);
  }

  ngOnInit() {
    this.loadClientes();
    this.loadDocumentos();
  }

  loadClientes() {
    this.cargando.set(true);
    this.service.getClientes(this.page(), this.limit(), this.q()).pipe(
      takeUntilDestroyed(this.destroyRef),
      timeout(10000),
      catchError(err => {
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'La carga tardó demasiado o falló.' });
        return of({ data: [], total: 0 });
      })
    ).subscribe({
      next: (res) => {
        this.data.set(res.data);
        this.totalClientes.set(res.total);
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los clientes' });
      },
    });
  }

  onPageChange(event: any) {
    this.page.set(event.page + 1);
    this.limit.set(event.rows);
    this.loadClientes();
  }

  loadDocumentos() {
    // Cargar tipos de documento fiscal filtrados por empresa y activos
    const user = this.auth.currentUser();
    this.catalogService.getAll<any>('/parametros/tcotipodocumentofiscal').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        const filtered = (res || []).filter((r: any) => {
          // campo activo puede ser sn_activo === 'S' o activo === true
          const activo = r.sn_activo === 'S' || r.activo === true || r.sn_activo === true;
          const mismaEmpresa = user?.empresaId ? Number(r.empresaId) === Number(user.empresaId) : true;
          return activo && mismaEmpresa;
        });
        const opts = filtered.map((r: any) => ({ label: r.descripcion || r.nombre || r.descripcioncorta || String(r.tipodocumentofiscalId || r.documentoId || r.id), value: r.tipodocumentofiscalId ?? r.documentoId ?? r.id }));
        this.documentosOptions.set(opts);
      },
      error: () => {
        this.documentosOptions.set([]);
      },
    });
  }

  cancelarNota() {
    this.notaModel.set({
      tipomov: 'C',
      concepto: '',
      importe: 0,
      nroreferencia: '',
      fecharegistro: new Date().toISOString(),
    });
  }

  guardarNota() {
    const raw = { ...this.notaModel() };
    const cliente = this.selectedCliente();

    if (!cliente) {
      this.msgs.add({ severity: 'warn', summary: 'Seleccione', detail: 'Seleccione un cliente antes de crear una nota' });
      return;
    }

    // Normalizar campos
    const payload: any = {
      ...raw,
      importe: Number(raw.importe) || 0,
      tipomov: raw.tipomov || 'C',
      clienteId: cliente.clienteId,
    };

    // Formatear fecha a ISO si viene como yyyy-MM-dd o Date
    try {
      if (payload.fecharegistro) {
        const d = new Date(payload.fecharegistro);
        if (!isNaN(d.getTime())) payload.fecharegistro = d.toISOString();
      }
    } catch (e) {
      // ignore
    }

    // Validaciones básicas
    if (!payload.concepto || !payload.clienteId) {
      this.msgs.add({ severity: 'warn', summary: 'Datos incompletos', detail: 'Complete concepto y cliente' });
      return;
    }

    // Importe debe ser mayor que 0 (no aceptar negativos ni cero)
    if (typeof payload.importe !== 'number' || payload.importe <= 0) {
      this.msgs.add({ severity: 'warn', summary: 'Importe inválido', detail: 'El importe debe ser mayor que 0' });
      return;
    }

    // Validar débito: referencia obligatoria y no duplicada
    if (payload.tipomov === 'D') {
      if (!payload.nroreferencia || payload.nroreferencia.trim() === '') {
        this.msgs.add({ severity: 'warn', summary: 'Referencia requerida', detail: 'Ingrese el número de factura o préstamo de referencia' });
        return;
      }
      const refStr = String(payload.nroreferencia).trim();
      if (this.debitoReferenciasUsadas().includes(refStr)) {
        this.msgs.add({ severity: 'warn', summary: 'Referencia duplicada', detail: `Ya existe una nota de débito con referencia "${refStr}". No se pueden crear débitos duplicados.` });
        return;
      }
    }

    // Validar crédito: referencia obligatoria, debe existir como débito, y no exceder saldo de ese débito
    if (payload.tipomov === 'C') {
      if (!payload.nroreferencia || payload.nroreferencia.trim() === '') {
        this.msgs.add({ severity: 'warn', summary: 'Referencia requerida', detail: 'Seleccione el documento de débito al que aplica el abono' });
        return;
      }
      const refsDisponibles = this.debitoReferencias();
      if (!refsDisponibles.includes(String(payload.nroreferencia))) {
        this.msgs.add({ severity: 'warn', summary: 'Referencia inválida', detail: `La referencia "${payload.nroreferencia}" no corresponde a ningún débito existente` });
        return;
      }
      const saldoRef = this.saldoDisponiblePorRef(String(payload.nroreferencia));
      if (saldoRef <= 0) {
        this.msgs.add({ severity: 'warn', summary: 'Débito saldado', detail: `El débito ref. ${payload.nroreferencia} ya fue pagado completamente` });
        return;
      }
      if (payload.importe > saldoRef) {
        this.msgs.add({ severity: 'warn', summary: 'Excede saldo', detail: `El abono (${payload.importe}) excede el saldo del débito ref. ${payload.nroreferencia} (${saldoRef.toFixed(2)})` });
        return;
      }
    }

    // Añadir usuario/empresa contextuales si están disponibles para cumplir el contrato del backend
    const user = this.auth.currentUser();
    if (user) {
      payload.usuarioCreated = payload.usuarioCreated || user.usuario || user.nombre;
      // Incluir explícitamente empresaId/idsucursal por si el backend los espera en el body
      payload.empresaId = payload.empresaId ?? user.empresaId;
      if (user.idsucursal != null) payload.Idsucursal = payload.Idsucursal ?? user.idsucursal;
    }

    this.notaSaving.set(true);

    // Use createMovimiento (movimientos endpoint) which accepts debito/credito movimientos
    // Add defaults required by backend
    payload.moduloId = payload.moduloId ?? 4;
    payload.documentoId = payload.documentoId ?? 3;
    payload.nrocliente = payload.nrocliente ?? this.selectedCliente()?.nrocliente ?? payload.nrocliente;
    // include selected documento fiscal if any
    if (this.documentoSelected()) {
      payload.tipodocumentofiscalId = payload.tipodocumentofiscalId ?? this.documentoSelected();
      payload.documentoId = payload.documentoId ?? this.documentoSelected();
    }
    // Ensure Idsucursal is present if available
    payload.Idsucursal = payload.Idsucursal ?? (user?.idsucursal ?? payload.Idsucursal);
    // Ensure importe is numeric
    payload.importe = Number(payload.importe) || 0;
    // Marcar como no anulado por defecto
    payload.sn_doc_anulado = payload.sn_doc_anulado ?? 'N';

    this.service.createMovimiento(payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        // agregar a la lista local para reflejar inmediatamente
        this.notasData.set([...(this.notasData() || []), res]);
        // si es movimiento, también añadir al estado de cuenta
        this.estadoCuentaData.set([...(this.estadoCuentaData() || []), res]);
        this.notaSaving.set(false);
        this.notaModel.set({
          tipomov: 'C',
          concepto: '',
          importe: 0,
          nroreferencia: '',
          fecharegistro: new Date().toISOString(),
        });
        this.msgs.add({ severity: 'success', summary: 'Guardado', detail: 'Nota registrada correctamente' });
      },
      error: (err) => {
        // Mostrar detalle útil si está disponible
        console.error('[ClientesManager] Error guardando nota', err);
        let detail = 'No se pudo guardar la nota';
        if (err?.error?.message) detail = err.error.message;
        else if (err?.message) detail = err.message;
        this.notaSaving.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail });
      },
    });
  }

  // ===== PRÉSTAMOS =====
  cancelarPrestamo() {
    this.prestamoModel.set({
      nroprestamo: null,
      capital: 0,
      cuotas: 1,
      tasa: 0,
      vlrcuota: 0,
      fecharegistro: new Date().toISOString(),
      sn_activo: 'S',
    });
  }

  guardarPrestamo() {
    const cliente = this.selectedCliente();
    if (!cliente) {
      this.msgs.add({ severity: 'warn', summary: 'Seleccione', detail: 'Seleccione un cliente antes de crear un préstamo' });
      return;
    }

    const raw = { ...this.prestamoModel() };
    const payload: any = {
      ...raw,
      clienteId: cliente.clienteId,
      capital: Number(raw.capital) || 0,
      cuotas: Number(raw.cuotas) || 1,
      tasa: Number(raw.tasa) || 0,
      vlrcuota: Number(raw.vlrcuota) || 0,
      nroprestamo: raw.nroprestamo || '',
      sn_activo: raw.sn_activo || 'S',
      sn_contabilizado: 'N',
    };

    // Formatear fecha
    try {
      if (payload.fecharegistro) {
        const d = new Date(payload.fecharegistro);
        if (!isNaN(d.getTime())) payload.fecharegistro = d.toISOString();
      }
    } catch (e) { }

    // Validaciones
    if (!payload.capital || payload.capital <= 0) {
      this.msgs.add({ severity: 'warn', summary: 'Datos incompletos', detail: 'El capital debe ser mayor a 0' });
      return;
    }
    if (!payload.cuotas || payload.cuotas <= 0) {
      this.msgs.add({ severity: 'warn', summary: 'Datos incompletos', detail: 'Las cuotas deben ser mayor a 0' });
      return;
    }

    const user = this.auth.currentUser();
    if (user) {
      payload.empresaId = payload.empresaId ?? user.empresaId;
      if (user.idsucursal != null) payload.Idsucursal = payload.Idsucursal ?? user.idsucursal;
      payload.usuarioCreated = payload.usuarioCreated ?? user.usuario ?? user.nombre;
    }

    this.prestamoSaving.set(true);
    this.service.createPrestamo(payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.prestamosData.set([...(this.prestamosData() || []), res]);
        this.prestamoModel.set({
          nroprestamo: null,
          capital: 0,
          cuotas: 1,
          tasa: 0,
          vlrcuota: 0,
          fecharegistro: new Date().toISOString(),
          sn_activo: 'S',
        });
        this.msgs.add({ severity: 'success', summary: 'Guardado', detail: 'Préstamo registrado correctamente' });

        // Si hay plan de pago generado, guardarlo vinculado al préstamo
        const plan = this.planPago();
        if (plan.length > 0 && res?.prestamoId) {
          this.guardarPlanPagoConPrestamo(res.prestamoId, plan, cliente.clienteId);
        } else {
          this.prestamoSaving.set(false);
          this.showPlanPago.set(false);
          this.planPago.set([]);
        }
      },
      error: (err) => {
        console.error('[ClientesManager] Error guardando préstamo', err);
        let detail = 'No se pudo guardar el préstamo';
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

    requests.forEach((req) => {
      req.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          completadas++;
          if (completadas + errores === plan.length) {
            this.prestamoSaving.set(false);
            this.showPlanPago.set(false);
            this.planPago.set([]);
            this.msgs.add({
              severity: 'success',
              summary: 'Plan de pago',
              detail: `${completadas} cuotas guardadas`,
            });
          }
        },
        error: () => {
          errores++;
          if (completadas + errores === plan.length) {
            this.prestamoSaving.set(false);
            this.showPlanPago.set(false);
            this.planPago.set([]);
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

  // ===== REFERENCIAS =====
  cancelarReferencia() {
    this.referenciaModel.set({
      nombres: '',
      apellidos: '',
      telefono: '',
      celular: '',
      tipo: '',
      parentesco: '',
      direccion1: '',
      lugarTrabajo: '',
      fechanacimiento: null,
      dni: '',
    });
  }

  guardarReferencia() {
    const cliente = this.selectedCliente();
    if (!cliente) {
      this.msgs.add({ severity: 'warn', summary: 'Seleccione', detail: 'Seleccione un cliente antes de crear una referencia' });
      return;
    }

    const raw = { ...this.referenciaModel() };
    const payload: any = {
      clienteId: cliente.clienteId,
      nombres: raw.nombres,
      apellidos: raw.apellidos,
      dni: raw.dni,
      fechanacimiento: raw.fechanacimiento,
      telefono1: raw.telefono,
      telefono2: raw.celular,
      direccion1: raw.direccion1,
      lugarTrabajo: raw.lugarTrabajo,
    };

    if (!payload.nombres || !payload.telefono1) {
      this.msgs.add({ severity: 'warn', summary: 'Datos incompletos', detail: 'Complete nombre y teléfono' });
      return;
    }

    const user = this.auth.currentUser();
    if (user) {
      payload.empresaId = payload.empresaId ?? user.empresaId;
      if (user.idsucursal != null) payload.Idsucursal = payload.Idsucursal ?? user.idsucursal;
      payload.usuarioCreated = payload.usuarioCreated ?? user.usuario ?? user.nombre;
    }

    this.referenciaSaving.set(true);
    this.service.createReferencia(payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.referenciasData.set([...(this.referenciasData() || []), res]);
        this.referenciaSaving.set(false);
        this.referenciaModel.set({
          nombres: '',
          telefono: '',
          celular: '',
          tipo: '',
          parentesco: '',
        });
        this.msgs.add({ severity: 'success', summary: 'Guardado', detail: 'Referencia registrada correctamente' });
      },
      error: (err) => {
        console.error('[ClientesManager] Error guardando referencia', err);
        let detail = 'No se pudo guardar la referencia';
        if (err?.error?.message) detail = err.error.message;
        else if (err?.message) detail = err.message;
        this.referenciaSaving.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail });
      },
    });
  }

  // ===== PARIENTES =====
  cancelarPariente() {
    this.parienteModel.set({
      dni: '',
      nombres: '',
      apellidos: '',
      parentesco: '',
      telefono: '',
    });
  }

  guardarPariente() {
    const cliente = this.selectedCliente();
    if (!cliente) {
      this.msgs.add({ severity: 'warn', summary: 'Seleccione', detail: 'Seleccione un cliente antes de crear un pariente' });
      return;
    }

    const raw = { ...this.parienteModel() };
    const payload: any = {
      ...raw,
      clienteId: cliente.clienteId,
    };

    if (!payload.nombres || !payload.apellidos || !payload.parentesco || !payload.telefono) {
      this.msgs.add({ severity: 'warn', summary: 'Datos incompletos', detail: 'Complete todos los campos' });
      return;
    }

    const user = this.auth.currentUser();
    if (user) {
      payload.empresaId = payload.empresaId ?? user.empresaId;
      if (user.idsucursal != null) payload.Idsucursal = payload.Idsucursal ?? user.idsucursal;
      payload.usuarioCreated = payload.usuarioCreated ?? user.usuario ?? user.nombre;
    }

    this.parienteSaving.set(true);
    this.service.createPariente(payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.parientesData.set([...(this.parientesData() || []), res]);
        this.parienteSaving.set(false);
        this.parienteModel.set({
          dni: '',
          nombres: '',
          apellidos: '',
          parentesco: '',
          telefono: '',
        });
        this.msgs.add({ severity: 'success', summary: 'Guardado', detail: 'Pariente registrado correctamente' });
      },
      error: (err) => {
        console.error('[ClientesManager] Error guardando pariente', err);
        let detail = 'No se pudo guardar el pariente';
        if (err?.error?.message) detail = err.error.message;
        else if (err?.message) detail = err.message;
        this.parienteSaving.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail });
      },
    });
  }

  // ===== PLAN DE PAGO (AMORTIZACIÓN) =====
  calcularCuota() {
    const raw = this.prestamoModel();
    const capital = Number(raw.capital) || 0;
    const cuotas = Number(raw.cuotas) || 0;
    const tasaAnual = Number(raw.tasa) || 0;

    if (capital <= 0 || cuotas <= 0 || tasaAnual <= 0) return;

    const tasaMensual = tasaAnual / 100 / 12;
    const factor = tasaMensual / (1 - Math.pow(1 + tasaMensual, -cuotas));
    const cuotaFija = Math.round(capital * factor * 100) / 100;

    this.prestamoModel.set({ ...this.prestamoModel(), vlrcuota: cuotaFija });
  }

  generarPlanPago() {
    const raw = this.prestamoModel();
    const capital = Number(raw.capital) || 0;
    const cuotas = Number(raw.cuotas) || 0;
    const tasaAnual = Number(raw.tasa) || 0;

    if (capital <= 0) {
      this.msgs.add({ severity: 'warn', summary: 'Datos incompletos', detail: 'El capital debe ser mayor a 0' });
      return;
    }
    if (cuotas <= 0) {
      this.msgs.add({ severity: 'warn', summary: 'Datos incompletos', detail: 'Las cuotas deben ser mayor a 0' });
      return;
    }
    if (tasaAnual <= 0) {
      this.msgs.add({ severity: 'warn', summary: 'Datos incompletos', detail: 'La tasa de interés debe ser mayor a 0' });
      return;
    }

    // Generar nroprestamo: YYYYMMDD + empresaId + usuarioId + SS (segundos)
    const now = new Date();
    const user = this.auth.currentUser();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const nroprestamo = `${yyyy}${mm}${dd}${user?.empresaId ?? ''}${user?.usuarioId ?? ''}${ss}`;

    // Fórmula de French (cuota fija)
    const tasaMensual = tasaAnual / 100 / 12;
    const factor = tasaMensual / (1 - Math.pow(1 + tasaMensual, -cuotas));
    const cuotaFija = capital * factor;

    const plan: any[] = [];
    let saldo = capital;
    const fechaBase = raw.fecharegistro ? new Date(raw.fecharegistro) : new Date();

    for (let i = 1; i <= cuotas; i++) {
      const interes = saldo * tasaMensual;
      const capitalPago = cuotaFija - interes;
      saldo = saldo - capitalPago;

      const fechaPago = new Date(fechaBase);
      fechaPago.setMonth(fechaPago.getMonth() + i);

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

    // Actualizar modelo con nroprestamo generado y valor de cuota
    this.prestamoModel.set({
      ...this.prestamoModel(),
      nroprestamo,
      vlrcuota: Math.round(cuotaFija * 100) / 100,
    });
  }

  cancelarPlanPago() {
    this.showPlanPago.set(false);
    this.planPago.set([]);
  }

  limpiarFiltros() {
    this.q.set('');
    }

  nuevo() {
    this.editingCliente.set(null);
    this.showForm.set(true);
  }

  onFormSaved() {
    this.showForm.set(false);
    this.editingCliente.set(null);
    this.loadClientes(); // refrescar lista
  }

  onFormCancelled() {
    this.showForm.set(false);
    this.editingCliente.set(null);
  }

  editarCliente(cliente: CxcCliente, event: Event) {
    event.stopPropagation();
    this.editingCliente.set(cliente);
    this.showForm.set(true);
  }

  seleccionarCliente(cliente: CxcCliente) {
    this.selectedCliente.set(cliente);
    this.activeTabIndex.set(0); // Focus en Estado de Cuenta
    this.cargarDatosCliente(cliente.clienteId);
  }

  private cargarDatosCliente(clienteId: number) {
    this.estadoCuentaLoading.set(true);
    this.service.getMovimientosByCliente(clienteId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.estadoCuentaData.set(res);
        this.estadoCuentaLoading.set(false);
      },
      error: () => this.estadoCuentaLoading.set(false),
    });

    this.notasLoading.set(true);
    this.service.getHistoricoByCliente(clienteId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.notasData.set(res);
        this.notasLoading.set(false);
      },
      error: () => this.notasLoading.set(false),
    });

    this.prestamosLoading.set(true);
    this.service.getPrestamosByCliente(clienteId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.prestamosData.set(res);
        this.prestamosLoading.set(false);
      },
      error: () => this.prestamosLoading.set(false),
    });

    this.referenciasLoading.set(true);
    this.service.getReferenciasByCliente(clienteId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.referenciasData.set(res);
        this.referenciasLoading.set(false);
      },
      error: () => this.referenciasLoading.set(false),
    });

    this.parientesLoading.set(true);
    this.service.getParientesByCliente(clienteId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.parientesData.set(res);
        this.parientesLoading.set(false);
      },
      error: () => this.parientesLoading.set(false),
    });
  }

  onTabChange(index: number) {
    this.activeTabIndex.set(index);
  }

  getClienteNombre(c: CxcCliente): string {
    const nombres = c.nombres || '';
    const apellidos = c.apellidos || '';
    const full = `${nombres} ${apellidos}`.trim();
    return full || c.razonsocial || c.nrocliente || 'Sin nombre';
  }

  getTipoMovLabel(tipo: string): string {
    const tipos: Record<string, string> = {
      'C': 'Crédito',
      'A': 'Abono',
      'D': 'Débito',
    };
    return tipos[tipo] || tipo;
  }

  getTipoMovSeverity(tipo: string): 'success' | 'danger' | 'warning' | 'info' {
    if (tipo === 'A') return 'success';
    if (tipo === 'C') return 'info';
    return 'danger';
  }

  moneda(n: number | undefined): string {
    const val = Number(n) || 0;
    const partes = val.toFixed(2).split('.');
    partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return partes.join('.');
  }

  getSaldoPendiente(): number {
    return this.saldoPendiente();
  }
}
