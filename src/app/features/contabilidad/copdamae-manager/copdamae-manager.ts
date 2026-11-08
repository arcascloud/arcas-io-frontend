import {
  Component, OnInit, inject, signal, computed, DestroyRef, ChangeDetectionStrategy,
  ElementRef, Injector, afterNextRender, viewChild,
} from '@angular/core';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { AutoComplete, AutoCompleteCompleteEvent, AutoCompleteSelectEvent } from 'primeng/autocomplete';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { Select } from 'primeng/select';
import { DatePicker } from 'primeng/datepicker';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { forkJoin } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';
import * as XLSX from 'xlsx';
import { ContabilidadService } from '../../../core/services/contabilidad.service';
import { AuthService } from '../../../core/services/auth.service';
import { ModulosService } from '../../../core/services/modulos.service';
import { CatalogoParametrosService } from '../../../core/services/catalogo-parametros.service';
import { CtaContable, CopdaMae, CopdaDet, PeriodoContable, PlantillaPdaMae, LineaPartidaDto } from '../../../core/models/contabilidad.models';
import { Modulo } from '../../../core/models/usuario.models';

/** Registro de ttipomes desde la API */
interface TipoMes { ttipomesId: number; mes: string; }

type VistaTipo = 'lista' | 'crear' | 'editar' | 'ver';

/** Línea de detalle en el formulario (signal-based, reemplaza FormArray) */
interface LineaDetalle {
  id: number;
  ctacontable: string;
  ctaNombre: string;
  descripcion: string;
  debe: number;
  haber: number;
  factordecambio: number;
}

/** Redondea a 2 decimales para evitar diferencias de punto flotante */
const r2 = (n: number) => Math.round(n * 100) / 100;

@Component({
  selector: 'app-copdamae-manager',
  standalone: true,
  imports: [
    DecimalPipe, DatePipe, FormsModule, ReactiveFormsModule,
    TableModule, AutoComplete, InputNumber, InputText, Textarea,
    Select, DatePicker, Button, Tag, TooltipModule, DialogModule,
    ToastModule, ConfirmDialogModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './copdamae-manager.html',
  styleUrl: './copdamae-manager.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CopdamaeManager implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private contabilidad = inject(ContabilidadService);
  private auth = inject(AuthService);
  private modulosService = inject(ModulosService);
  private catalogo = inject(CatalogoParametrosService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private destroyRef = inject(DestroyRef);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private injector = inject(Injector);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private buscadorEl = viewChild('buscador', { read: ElementRef });
  private siguienteId = 1;

  // ===== ESTADO =====
  partidas = signal<CopdaMae[]>([]);
  cuentas = signal<CtaContable[]>([]);
  periodos = signal<PeriodoContable[]>([]);
  modulos = signal<Modulo[]>([]);
  meses = signal<TipoMes[]>([]);
  plantillas = signal<PlantillaPdaMae[]>([]);
  partidaSeleccionada = signal<CopdaMae | null>(null);
  vista = signal<VistaTipo>('lista');
  cargando = signal(false);

  // ===== PARTIDA INICIAL (carga desde archivo Excel) =====
  dialogInicial = signal(false);
  inicialCargando = signal(false);
  inicialNombreArchivo = signal<string | null>(null);
  inicialLineas = signal<LineaPartidaDto[]>([]);
  inicialErrores = signal<string[]>([]);

  // ===== FILTROS =====
  filtroPeriodo = signal<number | null>(null);
  filtroAnio = signal<number | null>(null);
  filtroAuxiliar = signal<number | null>(null);
  filtroConcepto = signal('');

  // ===== LÍNEAS DE DETALLE (señal-based) =====
  lineas = signal<LineaDetalle[]>([]);
  sugerencias = signal<CtaContable[]>([]);
  seleccionada = signal<CtaContable | string | null>(null);

  // ===== OPCIONES DE SELECTS =====
  /** Meses cargados desde ttipomes (catálogo global) */
  mesesOptions = computed(() =>
    this.meses().map(m => ({ label: m.mes, value: m.ttipomesId }))
  );

  /** Módulos con auxiliar contable activo (sn_auxiliar_contable = 'S') */
  modulosOptions = computed(() =>
    this.modulos()
      .filter(m => m.sn_activo === 'S' && m.sn_auxiliar_contable === 'S')
      .map(m => ({ label: m.descripcion_contable || m.descripcion, value: m.moduloId }))
      .sort((a, b) => a.label.localeCompare(b.label))
  );

  /** Auxiliares del filtro de lista: los módulos activos con auxiliar contable
   *  (flag `tmodulos.sn_auxiliar_contable='S'` — sin lista hardcodeada) */
  auxiliaresFiltroOptions = computed(() =>
    this.modulos()
      .filter(m => m.sn_activo === 'S' && m.sn_auxiliar_contable === 'S')
      .map(m => ({ label: m.descripcion_contable || m.descripcion, value: m.moduloId }))
      .sort((a, b) => a.value - b.value)
  );

  // ===== FORMULARIO (tipado con NonNullableFormBuilder) =====
  form = this.fb.group({
    moduloId:     this.fb.control<number>(1, Validators.required),
    plantillaId:  this.fb.control<number | null>(null),
    auxiliar:     this.fb.control<number | null>(null),
    fechadocumento: this.fb.control<Date>(new Date(), Validators.required),
    nroreferencia: this.fb.control('', Validators.maxLength(30)),
    descripcion:  this.fb.control('', [Validators.required, Validators.maxLength(200)]),
    factordecambio: this.fb.control(1),
  });
  private estadoForm = toSignal(this.form.statusChanges, { initialValue: this.form.status });

  /** Valor actual del select de módulo (reactivo al form control) */
  private moduloIdActual = toSignal(this.form.controls.moduloId.valueChanges, {
    initialValue: this.form.controls.moduloId.value,
  });

  /** Plantillas de partida filtradas por el módulo seleccionado */
  plantillasConcepto = computed(() => {
    const mid = this.moduloIdActual();
    return this.plantillas()
      .filter(p => p.moduloId === mid && p.sn_activo === 'S')
      .map(p => ({ label: p.descripcion, value: p.tcoplantillapdamaeId }));
  });

  // ===== COMPUTED =====
  aniosOptions = computed(() => {
    const anios = [...new Set(this.partidas().map(p => p.anio))].sort((a, b) => b - a);
    return anios.map(a => ({ label: String(a), value: a }));
  });

  partidasFiltradas = computed(() => {
    let r = this.partidas();
    const periodo = this.filtroPeriodo();
    const anio = this.filtroAnio();
    const aux = this.filtroAuxiliar();
    const concepto = this.filtroConcepto();
    if (periodo != null) r = r.filter(p => p.periodo === periodo);
    if (anio != null) r = r.filter(p => p.anio === anio);
    if (aux != null) r = r.filter(p => p.moduloId === aux);
    if (concepto) {
      const q = concepto.toLowerCase();
      r = r.filter(p =>
        p.descripcion?.toLowerCase().includes(q) ||
        p.nroreferencia?.toLowerCase().includes(q),
      );
    }
    return r.sort((a, b) => (b.nropartida ?? 0) - (a.nropartida ?? 0));
  });

  /** Solo cuentas de movimiento (sn_operable === 'S') para el autocomplete */
  cuentasMovimiento = computed(() => this.cuentas().filter(c => c.sn_operable === 'S'));

  totalDebe = computed(() => r2(this.lineas().reduce((acc, l) => acc + l.debe, 0)));
  totalCredito = computed(() => r2(this.lineas().reduce((acc, l) => acc + l.haber, 0)));
  diferencia = computed(() => r2(this.totalDebe() - this.totalCredito()));
  cuadrada = computed(() => this.totalDebe() > 0 && this.diferencia() === 0);

  /** Guardar habilitado: maestro válido + debe=haber + ≥2 líneas + ninguna en cero
   *  Y que la partida seleccionada NO esté ya contabilizada (evita doble contabilización) */
  puedeContabilizar = computed(() =>
    this.estadoForm() === 'VALID' &&
    this.cuadrada() &&
    this.lineas().length >= 2 &&
    this.lineas().every(l => l.debe > 0 || l.haber > 0) &&
    this.partidaSeleccionada()?.sn_contabilizada !== 'S'
  );

  /** Evita recrear la fila y perder foco mientras se edita un monto */
  trackById = (_: number, l: LineaDetalle) => l.id;

  // ===== COMPUTED: PARTIDA INICIAL =====

  inicialTotalDebe = computed(() => r2(this.inicialLineas().reduce((acc, l) => acc + l.debito, 0)));
  inicialTotalHaber = computed(() => r2(this.inicialLineas().reduce((acc, l) => acc + l.credito, 0)));
  inicialDiferencia = computed(() => r2(this.inicialTotalDebe() - this.inicialTotalHaber()));

  /**
   * Cuentas del archivo que no están en el plan de cuentas de la empresa
   * (o están inactivas / no operables). Si hay al menos una, la carga de la
   * partida inicial queda bloqueada: el archivo no se envía al backend.
   */
  inicialCuentasInvalidas = computed(() => {
    const lineas = this.inicialLineas();
    const catalogo = this.cuentas();
    if (lineas.length === 0 || catalogo.length === 0) return [];

    const mapa = new Map<string, CtaContable>();
    for (const c of catalogo) mapa.set(String(c.ctacontable).trim().toUpperCase(), c);

    const inexistentes: string[] = [];
    const inactivas: string[] = [];
    const noOperables: string[] = [];
    const naturalezas: string[] = [];
    for (const l of lineas) {
      const clave = String(l.ctacontable).trim().toUpperCase();
      const cuenta = mapa.get(clave);
      if (!cuenta) {
        if (!inexistentes.includes(clave)) inexistentes.push(clave);
        continue;
      }
      if (cuenta.sn_activo !== 'S') {
        if (!inactivas.includes(clave)) inactivas.push(clave);
        continue;
      }
      if (cuenta.sn_operable !== 'S') {
        if (!noOperables.includes(clave)) noOperables.push(clave);
        continue;
      }
      // La naturaleza del archivo (D/C) debe coincidir con la del plan de cuentas
      const nat = l.debito > 0 && l.credito <= 0 ? 'D' : l.credito > 0 && l.debito <= 0 ? 'C' : null;
      if (nat && cuenta.naturaleza && nat !== cuenta.naturaleza) {
        const detalle = `${clave} (archivo ${nat} / plan ${cuenta.naturaleza})`;
        if (!naturalezas.some(n => n.startsWith(`${clave} `))) naturalezas.push(detalle);
      }
    }

    const resumir = (lista: string[], max = 10): string =>
      lista.length <= max ? lista.join(', ') : `${lista.slice(0, max).join(', ')} … y ${lista.length - max} más`;

    const msgs: string[] = [];
    if (inexistentes.length > 0) {
      msgs.push(`No existen en el plan de cuentas (${inexistentes.length}): ${resumir(inexistentes)}`);
    }
    if (inactivas.length > 0) {
      msgs.push(`Cuentas inactivas (${inactivas.length}): ${resumir(inactivas)}`);
    }
    if (noOperables.length > 0) {
      msgs.push(`Cuentas no operables (${noOperables.length}): ${resumir(noOperables)}`);
    }
    if (naturalezas.length > 0) {
      msgs.push(`Naturaleza distinta a la del plan de cuentas (${naturalezas.length}): ${resumir(naturalezas)}`);
    }
    return msgs;
  });

  /** Todo lo que impide cargar: errores de lectura + cuentas fuera del plan */
  inicialProblemas = computed(() => [...this.inicialErrores(), ...this.inicialCuentasInvalidas()]);

  /** Habilita "Cargar": sin problemas, ≥2 líneas y débitos = créditos */
  inicialLista = computed(() =>
    this.inicialProblemas().length === 0 &&
    this.inicialLineas().length >= 2 &&
    this.inicialTotalDebe() > 0 &&
    this.inicialDiferencia() === 0,
  );

  /**
   * Período contable abierto donde caerá la partida (el más antiguo).
   * Es la misma regla que aplica el backend; aquí solo sirve para previsualizar.
   */
  inicialPeriodo = computed(() => {
    const abierto = this.periodos()
      .filter(p => p.sn_abierto === 'S')
      .sort((a, b) => a.nroanio - b.nroanio || a.nromes - b.nromes)[0];
    return abierto ? { anio: abierto.nroanio, periodo: abierto.nromes } : null;
  });

  // ===== CICLO DE VIDA =====
  ngOnInit(): void {
    this.cargarDatos();
  }

  private cargarDatos(): void {
    this.cargando.set(true);
    forkJoin({
      partidas: this.contabilidad.getPartidas(),
      cuentas: this.contabilidad.getCuentas(),
      periodos: this.contabilidad.getPeriodos(),
      modulos: this.modulosService.getAll(),
      meses: this.catalogo.getAll<TipoMes>('/parametros/meses'),
      plantillas: this.contabilidad.getPlantillasPda(),
    }).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.partidas.set(data.partidas);
          this.cuentas.set(data.cuentas);
          this.periodos.set(data.periodos);
          this.modulos.set(data.modulos);
          this.meses.set(data.meses);
          this.plantillas.set(data.plantillas);
          // Preseleccionar periodo abierto
          const abierto = data.periodos.find(p => p.sn_abierto === 'S');
          if (abierto) {
            this.filtroAnio.set(abierto.nroanio);
            this.filtroPeriodo.set(abierto.nromes);
          }
          this.cargando.set(false);
          this.restaurarPartidaDesdeUrl();
        },
        error: () => { this.mostrarError('Error cargando datos'); this.cargando.set(false); },
      });
  }

  /**
   * Restaura el detalle de partida al volver (atrás/forward) desde un documento
   * de origen. La partida queda marcada en la URL como ?partidaId=.
   */
  private restaurarPartidaDesdeUrl(): void {
    const raw = this.route.snapshot.queryParamMap.get('partidaId');
    if (!raw) return;
    const id = Number(raw);
    if (isNaN(id) || id <= 0) return;
    const partida = this.partidas().find(p => Number(p.partidaId) === id);
    if (!partida) return;
    this.filtroPeriodo.set(partida.periodo);
    this.filtroAnio.set(partida.anio);
    this.verPartida(partida);
  }

  /**
   * Escribe (o limpia) ?partidaId= en la URL actual SIN crear una entrada de
   * historial nueva, de modo que "atrás" regrese al detalle de la partida.
   * Devuelve la promesa de la navegación, o `null` si la URL ya estaba así.
   */
  private marcarPartidaEnUrl(partidaId: number | null): Promise<boolean> | null {
    const actual = this.route.snapshot.queryParamMap.get('partidaId');
    const nuevo = partidaId != null ? String(partidaId) : null;
    if (actual === nuevo) return null;
    return this.router.navigate([], {
      queryParams: this.queryParamsConPartida(partidaId),
      replaceUrl: true,
    });
  }

  /** Query params actuales con `partidaId` actualizado (los demás se conservan). */
  private queryParamsConPartida(partidaId: number | null): Record<string, string> {
    const qpm = this.route.snapshot.queryParamMap;
    const params: Record<string, string> = {};
    qpm.keys.forEach(k => {
      if (k !== 'partidaId' && qpm.get(k) != null) params[k] = qpm.get(k)!;
    });
    if (partidaId != null) params['partidaId'] = String(partidaId);
    return params;
  }

  // ===== NAVEGACIÓN =====

  nuevaPartida(): void {
    this.partidaSeleccionada.set(null);
    this.form.reset({
      moduloId: 1, plantillaId: null, auxiliar: null, fechadocumento: new Date(),
      nroreferencia: '', descripcion: '', factordecambio: 1,
    });
    this.lineas.set([]);
    this.seleccionada.set(null);
    this.siguienteId = 1;
    this.vista.set('crear');
    this.marcarPartidaEnUrl(null);
  }

  editarPartida(partida: CopdaMae): void {
    // Control de partidas cerradas: el backend responde 403, avisamos antes (UX)
    if (partida.sn_cerrada === 'S') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Partida cerrada',
        detail: `La Partida #${partida.nropartida} pertenece a un período cerrado y no puede modificarse`,
      });
      return;
    }
    // Pareja original ↔ contra (backend 409): avisar antes de intentar
    if (partida.partidaOrigenId != null) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Contra partida',
        detail: `La Partida #${partida.nropartida} es una contra partida y no puede editarse`,
      });
      return;
    }
    if (partida.contrapdaId != null) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Tiene contra partida',
        detail: `La Partida #${partida.nropartida} ya fue contraedida; primero elimine la contra partida` +
          (this.partidaNumero(partida.contrapdaId) ? ` #${this.partidaNumero(partida.contrapdaId)}` : ''),
      });
      return;
    }
    this.partidaSeleccionada.set(partida);
    this.marcarPartidaEnUrl(partida.partidaId);
    this.form.reset({
      moduloId: partida.moduloId,
      // plantillaId calculada en backend por módulo; null en partidas sin
      // plantilla aplicable (nunca derivarla de documentoId)
      plantillaId: partida.plantillaId ?? null,
      auxiliar: null,
      fechadocumento: new Date(partida.fechadocumento),
      nroreferencia: partida.nroreferencia,
      descripcion: partida.descripcion,
      // decimal de MySQL llega como string ("1.00") → coaccionar a number
      factordecambio: Number(partida.factordecambio) || 1,
    });
    this.cargarDetalles(partida.partidaId, 'editar');
  }

  verPartida(partida: CopdaMae): void {
    this.partidaSeleccionada.set(partida);
    this.marcarPartidaEnUrl(partida.partidaId);
    this.cargarDetalles(partida.partidaId, 'ver');
  }

  private cargarDetalles(partidaId: number, modo: 'editar' | 'ver'): void {
    this.cargando.set(true);
    this.contabilidad.getDetallesPartida(partidaId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (detalles) => {
          this.lineas.set(detalles.map(d => ({
            id: this.siguienteId++,
            ctacontable: d.ctacontable ?? '',
            ctaNombre: this.getCuentaNombre(d.ctacontable ?? ''),
            descripcion: d.descripcion ?? '',
            debe: Number(d.debito) || 0,
            haber: Number(d.credito) || 0,
            factordecambio: Number(d.factordecambio) || 1,
          })));
          this.vista.set(modo);
          this.cargando.set(false);
        },
        error: () => { this.mostrarError('Error cargando detalles'); this.cargando.set(false); },
      });
  }

  volver(): void {
    this.vista.set('lista');
    this.partidaSeleccionada.set(null);
    this.lineas.set([]);
    this.marcarPartidaEnUrl(null);
  }

  // ===== ORIGEN DEL DOCUMENTO (trazabilidad) =====

  /**
   * Etiqueta legible del tipo de documento de origen, derivada del prefijo de
   * `nroreferencia`. Si el prefijo no se reconoce, cae en el nombre del módulo.
   */
  origenTipoLabel(partida: CopdaMae): string {
    const prefijo = (partida.nroreferencia || '').trim().toUpperCase().split('-')[0];
    const mapa: Record<string, string> = {
      FAC: 'Factura',
      NCF: 'Factura',
      NDB: 'Nota débito',
      ND: 'Nota débito',
      NC: 'Nota crédito',
      NCR: 'Nota crédito',
      CXC: 'Cobro CxC',
      CXP: 'Pago CxP',
      PPR: 'Préstamo',
      ICS: 'Interés simple',
      ICM: 'Interés moratorio',
      BCO: 'Movimiento bancario',
      CAJA: 'Caja',
      CHEQ: 'Cheque',
      CIERRE: 'Cierre contable',
      PLANILLA: 'Planilla',
    };
    return mapa[prefijo] || this.getModuloLabel(partida.moduloId);
  }

  /**
   * Resuelve a qué pantalla navegar para ver el documento que originó la partida.
   * Devuelve `null` cuando no existe una ruta que aterrice en el registro exacto.
   */
  enlaceOrigen(partida: CopdaMae): { ruta: string; params?: Record<string, string | number> } | null {
    const doc = Number(partida.documentoId) || 0;
    switch (Number(partida.moduloId)) {
      case 1: {
        // Referencia: CIERRE-{periodo}-{anio}
        const m = /CIERRE-(\d{1,2})-(\d{4})/i.exec(partida.nroreferencia || '');
        return {
          ruta: '/contabilidad/cierre-contable',
          params: m ? { periodo: Number(m[1]), anio: Number(m[2]) } : undefined,
        };
      }
      case 2:
        // Inventarios: cuando el origen es una factura, documentoId = posfacmae.facturaId
        if (doc > 0 && /^FAC-/i.test(partida.nroreferencia || '')) {
          return { ruta: `/facturacion/consultas/${doc}` };
        }
        return null;
      case 3:
        // facturaId en posfacmae
        return doc > 0 ? { ruta: `/facturacion/consultas/${doc}` } : null;
      case 4:
        // clienteMovId en cxcmovimientos
        return doc > 0 ? { ruta: '/cxc/movimientos', params: { movimientoId: doc } } : null;
      case 5:
        // cxpmovId en cxpmovimientos
        return doc > 0 ? { ruta: '/cxp/movimientos', params: { movimientoId: doc } } : null;
      case 6:
        // Bancos: documentoId ES el tcoplantillapdamaeId (módulo sin documentos
        // fiscales); el id del movimiento queda en bcosmovimientos.partidaId,
        // no aquí → sin params, se navega al listado del historial.
        return { ruta: '/bancos/historial' };
      case 8:
        // Planilla: la referencia es PLANILLA-{nroplanilla} y la ruta de edición
        // necesita planillaId → se navega al listado de planillas.
        return { ruta: '/planilla/planillas' };
      default:
        return null;
    }
  }

  /**
   * Navega al documento de origen.
   *
   * Antes de salir, escribe la partida en la entrada de historial actual
   * (replaceUrl) para que "atrás" regrese al detalle de la partida y no a la
   * lista. Se encadenan las dos navegaciones para evitar que se cancelen entre sí.
   */
  irAOrigen(partida: CopdaMae): void {
    const link = this.enlaceOrigen(partida);
    if (!link) return;

    const navegar = () => this.router.navigate([link.ruta], {
      // partidaId viaja junto al documento para que el destino pueda regresar
      queryParams: { ...link.params, partidaId: partida.partidaId },
    });

    const marcada = this.marcarPartidaEnUrl(partida.partidaId);
    if (marcada) {
      // esperar a que la navegación de reemplazo termine (resuelta o cancelada)
      marcada.then(navegar, navegar);
    } else {
      navegar();
    }
  }

  // ===== BÚSQUEDA DE CUENTAS (autocomplete) =====

  /** Filtra cuentas de movimiento por código o nombre (excluye las ya usadas en el detalle) */
  buscar(e: AutoCompleteCompleteEvent): void {
    const q = e.query.trim().toLowerCase();
    const usadas = new Set(this.lineas().map(l => l.ctacontable));
    this.sugerencias.set(
      this.cuentasMovimiento().filter(c =>
        !usadas.has(c.ctacontable) &&
        (c.ctacontable.toLowerCase().includes(q) ||
        c.descripcion.toLowerCase().includes(q)),
      ),
    );
  }

  /**
   * Agrega una línea con la cuenta seleccionada.
   * Si la partida está descuadrada, propone el monto que la cuadra en el lado contrario.
   * REGLA: una cuenta contable solo puede ingresar UNA vez en el detalle (no se admiten repetidas).
   */
  agregar(e: AutoCompleteSelectEvent): void {
    const cuenta = e.value as CtaContable;

    // Una cuenta ya ingresada no puede repetirse en el detalle
    if (this.lineas().some(l => l.ctacontable === cuenta.ctacontable)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cuenta duplicada',
        detail: `La cuenta ${cuenta.ctacontable} - ${cuenta.descripcion} ya fue ingresada en el detalle`,
      });
      setTimeout(() => this.seleccionada.set(null));
      return;
    }

    const dif = this.diferencia(); // debe - haber

    const linea: LineaDetalle = {
      id: this.siguienteId++,
      ctacontable: cuenta.ctacontable,
      ctaNombre: cuenta.descripcion,
      descripcion: this.form.controls.descripcion.value || cuenta.descripcion,
      debe: dif < 0 ? -dif : 0,
      haber: dif > 0 ? dif : 0,
      factordecambio: Number(this.form.controls.factordecambio.value) || 1,
    };
    this.lineas.update(ls => [...ls, linea]);

    // Limpiar el autocomplete después de la selección
    setTimeout(() => this.seleccionada.set(null));

    // Cuando la fila ya está renderizada, el cursor va directo al monto
    const lado = linea.haber > 0 ? 'haber' : 'debe';
    afterNextRender(() => {
      this.host.nativeElement
        .querySelector<HTMLInputElement>(`[data-linea="${linea.id}"] [data-col="${lado}"] input`)
        ?.focus();
    }, { injector: this.injector });
  }

  // ===== EDICIÓN DE LÍNEAS =====

  /** Una línea es debe O haber, nunca ambos: al capturar uno se limpia el otro */
  setDebe(id: number, valor: number | null): void {
    const v = valor ?? 0;
    this.editar(id, v > 0 ? { debe: v, haber: 0 } : { debe: 0 });
  }

  setHaber(id: number, valor: number | null): void {
    const v = valor ?? 0;
    this.editar(id, v > 0 ? { haber: v, debe: 0 } : { haber: 0 });
  }

  editar(id: number, cambios: Partial<LineaDetalle>): void {
    this.lineas.update(ls => ls.map(l => l.id === id ? { ...l, ...cambios } : l));
  }

  quitar(id: number): void {
    this.lineas.update(ls => ls.filter(l => l.id !== id));
  }

  // ===== CONTABILIZAR =====

  contabilizar(): void {
    // Blindaje: una partida ya contabilizada nunca puede volver a contabilizarse
    const sel = this.partidaSeleccionada();
    if (sel?.sn_contabilizada === 'S') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Ya contabilizada',
        detail: `La Partida #${sel.nropartida} ya está contabilizada (sn_contabilizada = 'S') y no puede contabilizarse de nuevo`,
      });
      return;
    }

    if (!this.puedeContabilizar()) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Verifique el formulario y que la partida esté cuadrada' });
      return;
    }

    // Auditoría final: ninguna cuenta puede repetirse en el detalle (también lo valida el backend)
    const duplicadas = this.ctasRepetidas();
    if (duplicadas.length > 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Cuentas duplicadas',
        detail: `Cuenta(s) repetida(s) en el detalle: ${duplicadas.join(', ')}`,
      });
      return;
    }

    const fv = this.form.getRawValue();
    const user = this.auth.currentUser();
    const fecha = fv.fechadocumento;

    this.cargando.set(true);
    this.contabilidad.contabilizarPartida({
      empresaId: user?.empresaId ?? 0,
      Idsucursal: user?.idsucursal ?? 0,
      periodo: fecha.getMonth() + 1,
      anio: fecha.getFullYear(),
      moduloId: fv.moduloId,
      documentoId: fv.plantillaId ?? fv.auxiliar ?? 0,
      fechadocumento: fecha,
      nroreferencia: fv.nroreferencia,
      descripcion: fv.descripcion,
      factordecambio: Number(fv.factordecambio) || 1,
      lineas: this.lineas().map(l => ({
        ctacontable: l.ctacontable,
        descripcion: l.descripcion,
        debito: l.debe,
        credito: l.haber,
        factordecambio: l.factordecambio,
      })),
    }).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.messageService.add({ severity: 'success', summary: 'Contabilizado', detail: `Partida #${result.nropartida} creada exitosamente` });
          this.volver();
          this.cargarDatos();
          this.cargando.set(false);
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al contabilizar' });
          this.cargando.set(false);
        },
      });
  }

  // ===== ELIMINAR =====

  eliminarPartida(partida: CopdaMae): void {
    // Control de partidas cerradas: el backend responde 403, avisamos antes (UX)
    if (partida.sn_cerrada === 'S') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Partida cerrada',
        detail: `La Partida #${partida.nropartida} pertenece a un período cerrado y no puede eliminarse`,
      });
      return;
    }
    // La original contraedida no se elimina mientras exista su contra (backend 409).
    // La propia contra SÍ se puede eliminar (deshacer) — ver mensaje especial abajo.
    if (partida.contrapdaId != null) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Tiene contra partida',
        detail: `La Partida #${partida.nropartida} ya fue contraedida; primero elimine la contra partida` +
          (this.partidaNumero(partida.contrapdaId) ? ` #${this.partidaNumero(partida.contrapdaId)}` : ''),
      });
      return;
    }
    const esContra = partida.partidaOrigenId != null;
    this.confirmationService.confirm({
      message: esContra
        ? `¿Eliminar la contra partida #${partida.nropartida}? OJO: la eliminación NO revierte el mayor ` +
          'automáticamente; ejecute Reconstrucción de Mayores para sincronizar coctamov.'
        : `¿Está seguro de eliminar la Partida #${partida.nropartida}?`,
      header: esContra ? 'Eliminar contra partida' : 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: { label: 'Cancelar', severity: 'secondary', variant: 'text', size: 'small', rounded: true },
      acceptButtonProps: { label: 'Eliminar', severity: 'danger', variant: 'text', size: 'small', rounded: true },
      accept: () => {
        this.contabilidad.eliminarPartida(partida.partidaId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.messageService.add({ severity: 'success', summary: 'Eliminada', detail: 'Partida eliminada' });
              if (this.partidaSeleccionada()?.partidaId === partida.partidaId) this.volver();
              this.cargarDatos();
            },
            error: () => this.mostrarError('Error al eliminar'),
          });
      },
    });
  }

  // ===== CONTRA PARTIDA =====

  /**
   * Crea la contra partida (espejo en el período vigente) de una partida
   * contabilizada y marca la original. Bloqueos de UX previos (el backend
   * es la autoridad): cerrada, no contabilizada, ya contraedida o si la
   * fila ES una contra.
   */
  contraPartida(partida: CopdaMae): void {
    if (!this.puedeContraer(partida)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No permitido',
        detail: this.tooltipContra(partida),
      });
      return;
    }
    this.confirmationService.confirm({
      message: `Se creará la contra partida de la Partida #${partida.nropartida} ` +
        `(${partida.nroreferencia || partida.descripcion}) en el período en curso. ` +
        'Las dos partidas permanecen en el mayor y netean a cero.',
      header: 'Contra partida',
      icon: 'pi pi-undo',
      rejectButtonProps: { label: 'Cancelar', severity: 'secondary', variant: 'text', size: 'small', rounded: true },
      acceptButtonProps: { label: 'Contraer', severity: 'warn', variant: 'text', size: 'small', rounded: true },
      accept: () => {
        this.cargando.set(true);
        this.contabilidad.contraPartida(partida.partidaId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (contra) => {
              this.messageService.add({
                severity: 'success',
                summary: 'Contra partida creada',
                detail: `Partida #${contra.nropartida} creada como contra de la #${partida.nropartida}`,
              });
              // Recarga la lista y (vía ?partidaId= en la URL) refresca la
              // partida seleccionada con sus nuevas marcas (S/S + contrapdaId)
              this.cargarDatos();
              this.cargando.set(false);
            },
            // El interceptor global ya muestra el toast con el mensaje del
            // backend (400 período/cierre, 409 ya contraedida)
            error: () => this.cargando.set(false),
          });
      },
    });
  }

  /** ¿Se puede pedir la contra partida de esta fila? (el backend es la autoridad) */
  puedeContraer(partida: CopdaMae): boolean {
    return partida.sn_cerrada !== 'S' &&
      partida.sn_contabilizada === 'S' &&
      partida.partidaOrigenId == null &&
      partida.contrapdaId == null;
  }

  /** Explica por qué el botón Contra está deshabilitado (o su acción) */
  tooltipContra(partida: CopdaMae): string {
    if (partida.sn_cerrada === 'S') return 'Período cerrado: la partida no puede contraerse';
    if (partida.partidaOrigenId != null) return 'Ya es una contra partida: no puede contraerse';
    if (partida.contrapdaId != null) return 'Ya tiene una contra partida asociada';
    if (partida.sn_contabilizada !== 'S') return 'Solo se contraen partidas contabilizadas';
    return `Crear contra partida de esta partida #${partida.nropartida} en el período en curso`;
  }

  /** Editar habilitado: sin cerrar, sin pareja de contra (backend 409) */
  puedeEditar(partida: CopdaMae): boolean {
    return partida.sn_cerrada !== 'S' &&
      partida.contrapdaId == null &&
      partida.partidaOrigenId == null;
  }

  tooltipEditar(partida: CopdaMae): string {
    if (partida.sn_cerrada === 'S') return 'Partida cerrada (período cerrado)';
    if (partida.partidaOrigenId != null) return 'Es una contra partida: no editable';
    if (partida.contrapdaId != null) return 'Tiene contra partida asociada: primero elimine la contra';
    return 'Editar';
  }

  /** Eliminar habilitado: sin cerrar y sin contra asociada (la propia contra sí se elimina) */
  puedeEliminar(partida: CopdaMae): boolean {
    return partida.sn_cerrada !== 'S' && partida.contrapdaId == null;
  }

  tooltipEliminar(partida: CopdaMae): string {
    if (partida.sn_cerrada === 'S') return 'Partida cerrada (período cerrado)';
    if (partida.contrapdaId != null) return 'Tiene contra partida asociada: primero elimine la contra';
    if (partida.partidaOrigenId != null) return 'Eliminar contra partida (requiere Reconstrucción de Mayores)';
    return 'Eliminar';
  }

  /** nropartida de otra partida por id (para mostrar el enlace original ↔ contra) */
  partidaNumero(id: number | null | undefined): number | null {
    if (id == null) return null;
    return this.partidas().find(p => Number(p.partidaId) === Number(id))?.nropartida ?? null;
  }

  // ===== PARTIDA INICIAL (carga desde archivo Excel) =====

  /** Abre el diálogo de carga de la partida inicial (estado limpio). */
  abrePartidaInicial(): void {
    this.inicialNombreArchivo.set(null);
    this.inicialLineas.set([]);
    this.inicialErrores.set([]);
    this.inicialCargando.set(false);
    this.dialogInicial.set(true);
  }

  cierraPartidaInicial(valor: boolean): void {
    if (this.inicialCargando()) return;
    this.dialogInicial.set(valor);
  }

  /**
   * Lee el archivo Excel elegido y extrae las líneas de la partida.
   * Columnas buscadas: `ctacontable`, `D/C` e `importe` (con alias tolerados).
   * La fila de encabezados se localiza por la columna `ctacontable`, así que
   * el archivo puede llevar columnas extra (ej: `fila`) antes o después.
   */
  onArchivoInicial(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // permite volver a elegir el mismo archivo
    if (!file) return;

    this.inicialNombreArchivo.set(file.name);
    this.inicialLineas.set([]);
    this.inicialErrores.set([]);

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const wb = XLSX.read(new Uint8Array(reader.result as ArrayBuffer), { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        if (!ws) throw new Error('el archivo no tiene hojas');
        const filas = XLSX.utils.sheet_to_json<unknown[]>(ws, {
          header: 1, raw: true, defval: null, blankrows: false,
        });
        this.procesarFilasExcel(filas);
      } catch (e) {
        this.inicialErrores.set([`No se pudo leer el archivo Excel: ${(e as Error).message}`]);
      }
    };
    reader.onerror = () => this.inicialErrores.set(['No se pudo leer el archivo.']);
    reader.readAsArrayBuffer(file);
  }

  /** Convierte las filas crudas del Excel en líneas de partida, con validaciones. */
  private procesarFilasExcel(filas: unknown[][]): void {
    const norm = (v: unknown) => String(v ?? '').trim().toLowerCase().replace(/\s+/g, '');

    // 1) Los encabezados deben ser exactamente los esperados
    const errorEncabezado = this.validarEncabezados(filas);
    if (errorEncabezado) {
      this.inicialLineas.set([]);
      this.inicialErrores.set([errorEncabezado]);
      return;
    }

    const col = this.detectarColumnas(filas);
    if (!col) {
      this.inicialErrores.set([
        'No se pudieron identificar las columnas del archivo. Se necesitan: cuenta contable, naturaleza D/C e importe.',
      ]);
      return;
    }

    const errores: string[] = [];
    const lineas: LineaPartidaDto[] = [];
    const vistos = new Set<string>();
    const repetidas = new Set<string>();

    for (let i = col.iDesde; i < filas.length; i++) {
      const fila = filas[i];
      if (!Array.isArray(fila)) continue;
      if (fila.every(c => norm(c) === '')) continue;             // fila vacía
      if (norm(fila[col.iCta]) === 'ctacontable') continue;       // encabezado repetido

      const nroFila = i + 1; // 1-based, para que coincida con el Excel
      const cta = String(fila[col.iCta] ?? '').trim();
      const dc = String(fila[col.iDC] ?? '').trim().toUpperCase().replace(/\s+/g, '');
      const bruto = fila[col.iImp];
      const importe = Number(String(bruto ?? '').replace(/[^\d.-]/g, ''));
      const desc = col.iDesc != null ? String(fila[col.iDesc] ?? '').trim() : '';

      if (!cta) { errores.push(`Fila ${nroFila}: falta el código de cuenta contable.`); continue; }
      if (dc !== 'D' && dc !== 'C') { errores.push(`Fila ${nroFila}: la naturaleza debe ser D o C (valor "${dc}").`); continue; }
      if (!Number.isFinite(importe)) { errores.push(`Fila ${nroFila}: importe inválido (${bruto ?? 'vacío'}).`); continue; }
      if (importe < 0) { errores.push(`Fila ${nroFila}: el importe no puede ser negativo (${String(bruto).trim()}).`); continue; }
      if (importe === 0) { errores.push(`Fila ${nroFila}: el importe debe ser mayor que cero.`); continue; }

      if (vistos.has(cta)) repetidas.add(cta); else vistos.add(cta);

      lineas.push({
        ctacontable: cta,
        descripcion: desc || undefined,
        debito: dc === 'D' ? importe : 0,
        credito: dc === 'C' ? importe : 0,
      });
    }

    if (repetidas.size > 0) {
      errores.push(
        `Cuenta(s) repetida(s) — una partida admite una sola línea por cuenta: ${[...repetidas].join(', ')}`,
      );
    }
    if (lineas.length === 0 && errores.length === 0) {
      errores.push('No se encontraron líneas con datos en el archivo.');
    }

    this.inicialLineas.set(lineas);
    this.inicialErrores.set(errores.slice(0, 15));
  }

  /**
   * Encabezados obligatorios del archivo de partida inicial (fila 1).
   * Se comparan sin distinguir mayúsculas, acentos ni espacios sobrantes.
   */
  private static readonly ENCABEZADOS_PARTIDA = ['No', 'Cuenta', 'Descripcion', 'Naturaleza', 'Importe'];

  /**
   * Valida que la primera fila contenga exactamente los encabezados
   * `No | Cuenta | Descripcion | Naturaleza | Importe`.
   * Devuelve un mensaje de error, o `null` si los encabezados son correctos.
   */
  private validarEncabezados(filas: unknown[][]): string | null {
    const esperados = CopdamaeManager.ENCABEZADOS_PARTIDA;
    const norm = (v: unknown) =>
      String(v ?? '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    const esperadosNorm = esperados.map(e => norm(e));

    const fila0 = Array.isArray(filas[0]) ? (filas[0] as unknown[]) : [];
    const leidos = fila0.map(norm).filter(v => v !== '');
    const texto = esperados.join(', ');

    // ¿Existe fila de encabezados en absoluto?
    if (!leidos.some(v => esperadosNorm.includes(v))) {
      return `Falta la fila de encabezados. En la primera fila debe ir: ${texto}.`;
    }

    const encontrados = new Set(leidos);
    const faltantes = esperados.filter((e, i) => !encontrados.has(esperadosNorm[i]));
    const inesperados = leidos.filter(v => !esperadosNorm.includes(v));

    if (faltantes.length > 0 || inesperados.length > 0) {
      const partes: string[] = [];
      if (faltantes.length > 0) {
        partes.push(`faltan: ${faltantes.map(f => `"${f}"`).join(', ')}`);
      }
      if (inesperados.length > 0) {
        partes.push(`inesperados: ${inesperados.map(f => `"${f}"`).join(', ')}`);
      }
      return `Los encabezados del archivo no son los correctos (${partes.join('; ')}). Se espera: ${texto}.`;
    }

    return null;
  }

  /**
   * Identifica los índices de columna del archivo.
   *
   * La fila de encabezados (validada antes) se salta; los índices de las
   * columnas de datos se infieren por contenido:
   *   - cuenta: valores con guiones (`1-1-10-1-001`)
   *   - naturaleza: valores exactamente `D` o `C`
   *   - importe: última columna numérica que no es cuenta ni naturaleza
   *   - descripción: primera columna de texto restante
   */
  private detectarColumnas(filas: unknown[][]): {
    iDesde: number; iCta: number; iDesc: number | null; iDC: number; iImp: number;
  } | null {
    const norm = (v: unknown) => String(v ?? '').trim().toLowerCase().replace(/\s+/g, '');
    const esCta = (v: unknown) => /^\s*\d+(\s*-\s*\d+)+\s*$/.test(String(v ?? ''));
    const esDC = (v: unknown) => ['D', 'C'].includes(String(v ?? '').trim().toUpperCase());
    const esNum = (v: unknown) =>
      v !== null && v !== undefined && v !== '' &&
      !/[a-z]/i.test(String(v).trim()) &&
      Number.isFinite(Number(String(v).replace(/[^\d.-]/g, '')));

    // ¿Hay fila de encabezados? Si existe, la saltamos (los datos empiezan después)
    let iHdr = -1;
    for (let i = 0; i < filas.length; i++) {
      const f = filas[i];
      if (Array.isArray(f) && f.some(c => ['ctacontable', 'cuenta', 'cta'].includes(norm(c)))) {
        iHdr = i;
        break;
      }
    }
    const iDesde = iHdr >= 0 ? iHdr + 1 : 0;

    const datos = filas.slice(iDesde).filter(f => Array.isArray(f) && f.some(c => norm(c) !== ''));
    if (datos.length === 0) return null;

    const ancho = Math.max(...datos.map(f => f.length));
    const pct = (fn: (v: unknown) => boolean, c: number): number => {
      let hit = 0;
      let n = 0;
      for (const f of datos) {
        const v = f[c];
        if (norm(v) === '') continue;
        n++;
        if (fn(v)) hit++;
      }
      return n > 0 ? hit / n : 0;
    };
    const cols = Array.from({ length: ancho }, (_, c) => c);
    const mejor = (fn: (v: unknown) => boolean): number | undefined =>
      cols
        .filter(c => pct(fn, c) >= 0.5)
        .sort((a, b) => pct(fn, b) - pct(fn, a))[0];

    const iDC = mejor(esDC);
    const iCta = mejor(esCta);
    if (iCta == null || iDC == null || iCta === iDC) return null;

    const candidatos = cols.filter(c => c !== iCta && c !== iDC && pct(esNum, c) >= 0.5);
    const iImp = candidatos.length > 0 ? candidatos[candidatos.length - 1] : undefined;
    if (iImp == null) return null;

    const iDesc =
      cols.find(c => c !== iCta && c !== iDC && c !== iImp && pct(esNum, c) < 0.5 && pct(v => norm(v) !== '', c) >= 0.5) ?? null;

    return { iDesde, iCta, iDesc, iDC, iImp };
  }

  confirmarPartidaInicial(): void {
    const periodo = this.inicialPeriodo();
    if (!periodo) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin período abierto',
        detail: 'No hay ningún período contable abierto para esta empresa.',
      });
      return;
    }
    if (!this.inicialLista()) return;

    this.confirmationService.confirm({
      message:
        `Se cargará la partida inicial con ${this.inicialLineas().length} líneas por ` +
        `L ${this.formatearMoneda(this.inicialTotalDebe())} en el período ` +
        `${periodo.periodo}/${periodo.anio}. ¿Continuar?`,
      header: 'Partida inicial',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: { label: 'Cancelar', severity: 'secondary', variant: 'text', size: 'small', rounded: true },
      acceptButtonProps: { label: 'Cargar partida', severity: 'success', variant: 'text', size: 'small', rounded: true },
      accept: () => this.ejecutarPartidaInicial(),
    });
  }

  /**
   * Envía las líneas al backend. El servidor decide el período (abierto),
   * la fecha documento (último día del período) y la referencia
   * (INICIAL-{periodo}-{año}), y rechaza con 409 si ya fue cargada.
   */
  private ejecutarPartidaInicial(): void {
    this.inicialCargando.set(true);
    this.contabilidad.crearPartidaInicial({
      moduloId: 7,
      descripcion: 'balances inicial de operaciones mercantiles',
      lineas: this.inicialLineas(),
    }).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (partida) => {
          this.inicialCargando.set(false);
          this.dialogInicial.set(false);
          this.messageService.add({
            severity: 'success',
            summary: 'Partida inicial creada',
            detail: `Partida #${partida.nropartida} · ${this.inicialLineas().length} líneas · período ${partida.periodo}/${partida.anio}`,
          });
          this.inicialNombreArchivo.set(null);
          this.inicialLineas.set([]);
          this.inicialErrores.set([]);
          this.cargarDatos();
        },
        // El interceptor ya muestra el toast con el mensaje del backend
        error: () => this.inicialCargando.set(false),
      });
  }

  // ===== HELPERS =====

  /** Cuentas contables que aparecen más de una vez en el detalle (debe venir vacío) */
  ctasRepetidas(): string[] {
    const vistos = new Set<string>();
    const repetidas: string[] = [];
    for (const l of this.lineas()) {
      const cta = l.ctacontable?.trim();
      if (!cta) continue;
      if (vistos.has(cta)) {
        if (!repetidas.includes(cta)) repetidas.push(cta);
      } else {
        vistos.add(cta);
      }
    }
    return repetidas;
  }

  getCuentaNombre(ctacontable: string): string {
    return this.cuentas().find(c => c.ctacontable === ctacontable)?.descripcion ?? '';
  }

  getPeriodoLabel(periodo: number): string {
    return this.mesesOptions().find(m => m.value === periodo)?.label ?? '';
  }

  getModuloLabel(moduloId: number): string {
    const m = this.modulos().find(mod => mod.moduloId === moduloId);
    return m?.descripcion_contable || m?.descripcion || `M${moduloId}`;
  }

  /**
   * Concepto contable del encabezado.
   *
   * REGLA (14/10/2026): el label de la plantilla se resuelve SIEMPRE por el
   * `tcoplantillapdamaeId` (`partida.plantillaId`, calculado en backend por módulo).
   * JAMÁS se cruza `documentoId` contra el catálogo de plantillas.
   *
   * Composición: `${plantilla} · ${módulo}` + tipo de documento solo en módulos
   * con documentos fiscales (3 → "Factura"; en CxC/CxP la propia plantilla ya
   * nombra el tipo: abono, nota débito/crédito, compra contado/crédito…).
   *
   * @param tcoplantillapdamaeId plantillaId entregada por backend (null si no aplica)
   * @param moduloId   módulo de la partida (valida que la plantilla sea DEL módulo)
   * @param documentoId para módulo 3 decide "Factura" (facturaId > 0); en los demás
   *                    no se usa para el label
   * @returns '' cuando no hay plantilla → el HTML cae al nombre del módulo
   */
  getPlantillaLabel(
    tcoplantillapdamaeId: number | null | undefined,
    moduloId: number,
    documentoId: number,
  ): string {
    const pid = Number(tcoplantillapdamaeId) || 0;
    const mod = Number(moduloId) || 0;
    if (!pid || !mod) return '';
    const plantilla = this.plantillas().find(
      p =>
        p.sn_activo === 'S' &&
        Number(p.moduloId) === mod &&
        Number(p.tcoplantillapdamaeId) === pid,
    );
    if (!plantilla) return '';
    const partes = [plantilla.descripcion, this.getModuloLabel(mod)];
    if (mod === 3 && Number(documentoId) > 0) partes.push('Factura');
    return partes.join(' · ');
  }

  getPeriodoTagSeverity(periodo: number): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    const mapa: Record<number, 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'> =
      {
        1: 'secondary',
        2: 'secondary',
        3: 'secondary',
        4: 'secondary',
        5: 'secondary',
        6: 'secondary',
        7: 'secondary',
        8: 'secondary',
        9: 'secondary',
        10: 'secondary',
        11: 'secondary',
        12: 'secondary',
      };
    return mapa[periodo] ?? 'info';
  }

  formatearMoneda(valor: number): string {
    return (Number(valor) || 0).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  private mostrarError(msg: string): void {
    this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
  }
}
