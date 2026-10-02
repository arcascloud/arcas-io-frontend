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
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { forkJoin } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';
import { ContabilidadService } from '../../../core/services/contabilidad.service';
import { AuthService } from '../../../core/services/auth.service';
import { ModulosService } from '../../../core/services/modulos.service';
import { CatalogoParametrosService } from '../../../core/services/catalogo-parametros.service';
import { CtaContable, CopdaMae, CopdaDet, PeriodoContable, PlantillaPdaMae } from '../../../core/models/contabilidad.models';
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
    Select, DatePicker, Button, Tag, TooltipModule,
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

  /** Auxiliares del filtro de lista: módulos 2,3,4,5,6,7 (los que usa el ERP) */
  auxiliaresFiltroOptions = computed(() =>
    this.modulos()
      .filter(m => [2, 3, 4, 5, 6, 7].includes(m.moduloId))
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
    this.partidaSeleccionada.set(partida);
    this.marcarPartidaEnUrl(partida.partidaId);
    this.form.reset({
      moduloId: partida.moduloId,
      plantillaId: partida.documentoId || null,
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
      BCO: 'Movimiento bancario',
      CAJA: 'Caja',
      CHEQ: 'Cheque',
      CIERRE: 'Cierre contable',
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
        // bcomovimientosId en bcosmovimientos
        return doc > 0 ? { ruta: '/bancos/historial', params: { movimientoId: doc } } : null;
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
    this.confirmationService.confirm({
      message: `¿Está seguro de eliminar la Partida #${partida.nropartida}?`,
      header: 'Confirmar eliminación',
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

  getPlantillaLabel(documentoId: number): string {
    return this.plantillas().find(p => p.tcoplantillapdamaeId === documentoId)?.descripcion ?? '';
  }

  getPeriodoTagSeverity(periodo: number): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    const mapa: Record<number, 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'> = {
      1: 'info', 2: 'info', 3: 'success', 4: 'success',
      5: 'warn', 6: 'warn', 7: 'danger', 8: 'danger',
      9: 'secondary', 10: 'secondary', 11: 'contrast', 12: 'contrast',
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
