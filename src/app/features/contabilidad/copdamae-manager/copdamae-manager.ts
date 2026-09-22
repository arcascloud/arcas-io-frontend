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
  filtroReferencia = signal('');

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
    const ref = this.filtroReferencia();
    if (periodo != null) r = r.filter(p => p.periodo === periodo);
    if (anio != null) r = r.filter(p => p.anio === anio);
    if (ref) r = r.filter(p => p.nroreferencia?.toLowerCase().includes(ref.toLowerCase()));
    return r.sort((a, b) => (b.nropartida ?? 0) - (a.nropartida ?? 0));
  });

  /** Solo cuentas de movimiento (sn_operable === 'S') para el autocomplete */
  cuentasMovimiento = computed(() => this.cuentas().filter(c => c.sn_operable === 'S'));

  totalDebe = computed(() => r2(this.lineas().reduce((acc, l) => acc + l.debe, 0)));
  totalCredito = computed(() => r2(this.lineas().reduce((acc, l) => acc + l.haber, 0)));
  diferencia = computed(() => r2(this.totalDebe() - this.totalCredito()));
  cuadrada = computed(() => this.totalDebe() > 0 && this.diferencia() === 0);

  /** Guardar habilitado: maestro válido + debe=haber + ≥2 líneas + ninguna en cero */
  puedeContabilizar = computed(() =>
    this.estadoForm() === 'VALID' &&
    this.cuadrada() &&
    this.lineas().length >= 2 &&
    this.lineas().every(l => l.debe > 0 || l.haber > 0)
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
        },
        error: () => { this.mostrarError('Error cargando datos'); this.cargando.set(false); },
      });
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
  }

  editarPartida(partida: CopdaMae): void {
    this.partidaSeleccionada.set(partida);
    this.form.reset({
      moduloId: partida.moduloId,
      plantillaId: partida.documentoId || null,
      auxiliar: null,
      fechadocumento: new Date(partida.fechadocumento),
      nroreferencia: partida.nroreferencia,
      descripcion: partida.descripcion,
      factordecambio: partida.factordecambio,
    });
    this.cargarDetalles(partida.partidaId, 'editar');
  }

  verPartida(partida: CopdaMae): void {
    this.partidaSeleccionada.set(partida);
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
  }

  // ===== BÚSQUEDA DE CUENTAS (autocomplete) =====

  /** Filtra cuentas de movimiento por código o nombre */
  buscar(e: AutoCompleteCompleteEvent): void {
    const q = e.query.trim().toLowerCase();
    this.sugerencias.set(
      this.cuentasMovimiento().filter(c =>
        c.ctacontable.toLowerCase().includes(q) ||
        c.descripcion.toLowerCase().includes(q)
      ),
    );
  }

  /**
   * Agrega una línea con la cuenta seleccionada.
   * Si la partida está descuadrada, propone el monto que la cuadra en el lado contrario.
   * Una misma cuenta puede repetirse (no se deduplica).
   */
  agregar(e: AutoCompleteSelectEvent): void {
    const cuenta = e.value as CtaContable;
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
    if (!this.puedeContabilizar()) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Verifique el formulario y que la partida esté cuadrada' });
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
      factordecambio: fv.factordecambio,
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
