import { Component, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';
import { DatePickerModule } from 'primeng/datepicker';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DialogService } from 'primeng/dynamicdialog';
import { MaestroDetalleForm } from '../../facturacion/maestro-detalle/maestro-detalle-form';
import { PlanillaService } from '../../../core/services/planilla.service';
import { ContabilidadService } from '../../../core/services/contabilidad.service';
import {
  FacturaImpresionService,
  ReciboPlanillaData,
} from '../../../core/services/factura-impresion.service';
import {
  HorasExtrasPlanillaResultado,
  PlanillaGeneradaResultado,
  PlanillaEmpleado,
  PlDepto,
} from '../../../core/models/planilla.models';
import { PeriodoContable } from '../../../core/models/contabilidad.models';

/** Opción de select {label, value} usada por los selects de cabecera. */
interface OpcionSelect {
  label: string;
  value: any;
}

/**
 * Formulario de planilla de pago (cabecera + líneas por empleado).
 *
 * Factorizado del maestro-detalle genérico: hereda todo el CRUD
 * (cabecera, detalles, selector de entidades, guardado secuencial) y agrega:
 *
 *  - **Select de Periodo** desde `coperiodoctable` etiquetado con `tmeses`
 *    (valor del control = `"anio-nromes"`; al elegirlo sincroniza el Año).
 *  - **Multi-select de Departamento** (`tpldeptos`) con opción "Todos":
 *    filtra la tabla de líneas; en la carga inicial muestra todos.
 *  - **Generar planilla** (`POST /planilla/planillas/:id/generar`): recalcula
 *    IHSS, RAP, RTF y vecinal ÷12, otras deducciones, comisiones por tramo,
 *    bonos, horas extras y neto; si el mes corresponde crea o regenera la
 *    planilla especial del décimo (13avo/14avo).
 *  - **Calcular horas extras** (`POST /planilla/planillas/:id/calcular-horas-extras`):
 *    integra las horas extras del período en `importe_chorasextras`.
 *  - **Detalle con Expand** (patrón manual del Libro Diario: `signal<Set>`
 *    `expandido` + `toggleFila`/`isExpandido` + segunda `<tr>` con `@if`
 *    dentro del `pTemplate="body"`; sin RowToggler/dataKey de PrimeNG):
 *    la fila principal muestra Pagar | Empleado | Salario Bruto |
 *    SubTot. Egresos | SubTot. Ingresos | Neto a Pagar | Acciones; el
 *    detalle de IHSS/RAP/RTF/Otras Ded. y Comisiones/H. Extras/Bonos vive
 *    en la fila expandida (editables, con subtotales al pie de cada grupo).
 *  - **Imprimir recibo**: botón por línea → `FacturaImpresionService.
 *    imprimirReciboPlanilla()` (pdfmake, formato TICKET/CARTA parametrizado).
 */
@Component({
  selector: 'app-pagar-planilla-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    MultiSelectModule,
    CheckboxModule,
    TooltipModule,
    DatePickerModule,
    TableModule,
    TagModule,
  ],
  providers: [DialogService],
  templateUrl: './pagar-planilla-form.html',
  styleUrl: './pagar-planilla-form.scss',
})
export class PagarPlanillaForm extends MaestroDetalleForm {
  private planillaService = inject(PlanillaService);
  private contabilidadService = inject(ContabilidadService);
  private impresion = inject(FacturaImpresionService);

  calculandoHE = signal(false);
  generandoPlanilla = signal(false);
  autorizandoPago = signal(false);
  contabilizando = signal(false);

  /**
   * Estado del flujo **Generar → Autorizar pago → Contabilizar** (flags de
   * `pleplamae` leídos de la cabecera completa cargada en edición).
   */
  readonly snAutorizada = computed(() => this.maeActual()?.sn_autorizada === 'S');
  readonly snContabilizada = computed(() => this.maeActual()?.sn_contabilizada === 'S');

  /**
   * Cabeceras de 2 líneas de las columnas de dinero del detalle (línea 1
   * en minúscula tenue + línea 2 principal), según el layout pedido:
   * Salario/Bruto · SubTot./Egresos · SubTot./Ingresos · Salario/Neto a Pagar.
   */
  readonly encabezadoDinero: Record<string, readonly [string, string]> = {
    sueldobruto: ['Salario', 'Bruto'],
    _egresos: ['SubTot.', 'Egresos'],
    _ingresos: ['SubTot.', 'Ingresos'],
    sueldoneto: ['Salario', 'Neto a Pagar'],
  };

  /** Teclas de egresos mostradas en la fila expandida (grupo izquierdo). */
  readonly clavesEgresos: readonly string[] = [
    'importe_dihss',
    'importe_drap',
    'importe_drtf',
    'importe_drvc',
    'importe_dotras',
  ];
  /** Teclas de ingresos mostradas en la fila expandida (grupo derecho). */
  readonly clavesIngresos: readonly string[] = [
    'importe_ccomision',
    'importe_chorasextras',
    'importe_cbonos',
  ];

  /** Opciones del select de Periodo (períodos de `coperiodoctable`). */
  periodosOptions = signal<OpcionSelect[]>([]);
  /** Períodos crudos de la empresa (para sincronizar Año ↔ Periodo). */
  private periodosRaw: PeriodoContable[] = [];

  /** Opciones del multi-select de Departamento (`tpldeptos` + "Todos"). */
  deptosOptions = signal<OpcionSelect[]>([]);
  /** Selección del filtro de departamentos; `[-1]` = Todos (carga inicial). */
  deptosSel = signal<number[]>([-1]);

  /** Empleados crudos de la empresa (`plempleados`) para el select del detalle. */
  private empleadosRaw = signal<PlanillaEmpleado[]>([]);
  /** Opciones del select Empleado de las líneas ("nombres apellidos"). */
  empleadosOptions = computed<OpcionSelect[]>(() =>
    this.empleadosRaw()
      .map((e) => ({
        label:
          `${e.nombres ?? ''} ${e.apellidos ?? ''}`.replace(/\s+/g, ' ').trim() ||
          `Empleado ${e.empleadoId}`,
        value: e.empleadoId,
      }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  );

  /** Mapa mes → nombre (`tmeses`) para etiquetar los períodos. */
  private mesesMap = signal<Record<number, string>>({});

  /**
   * Detalles visibles en la tabla: filtrados por los departamentos
   * seleccionados. Con "Todos" (o selección vacía) se muestran todas las
   * líneas; las filas sin guardar siempre se muestran para poder editarlas.
   */
  detsFiltrados = computed(() => {
    const sel = this.deptosSel();
    const todos = sel.length === 0 || sel.includes(-1);
    if (todos) return this.dets();
    return this.dets().filter((d) => sel.includes(d['departamentoId']) || this.esNuevaFila(d));
  });

  /**
   * `true` si TODAS las líneas visibles (las filtradas) están marcadas para
   * pagar (`sn_pagar='S'`) — estado del checkbox "marcar todas" de la
   * cabecera.
   */
  todasPagar = computed(() => {
    const visibles = this.detsFiltrados();
    return visibles.length > 0 && visibles.every((d) => d['sn_pagar'] === 'S');
  });

  /**
   * Total a Pagar: suma del neto DERIVADO (`netoFila` = bruto + ingresos −
   * egresos) de las líneas marcadas para pagar (`sn_pagar='S'`), **sin
   * importar el filtro de departamentos** (es un total global). Redondeado
   * igual que el backend (`totalapagar` es INT).
   */
  totalAPagar = computed(() =>
    Math.round(
      this.dets()
        .filter((d) => d['sn_pagar'] === 'S')
        .reduce((suma, d) => suma + this.netoFila(d), 0),
    ),
  );

  /**
   * Sincroniza el total calculado al control `totalapagar` del formulario
   * (campo de solo lectura). `emitEvent: false` para no encadenar
   * `valueChanges`.
   */
  private syncTotalAPagar = effect(() => {
    const total = this.totalAPagar();
    const ctrl = this.form?.get('totalapagar');
    if (ctrl && ctrl.value !== total) {
      ctrl.setValue(total, { emitEvent: false });
    }
  });

  /** Contador de `rowId` para filas nuevas (negativo: no choca con los PK). */
  private rowIdContador = -1;

  /**
   * Filas expandidas (patrón manual del Libro Diario: `signal<Set>` +
   * segunda `<tr>` con `@if` dentro del `pTemplate="body"`). La clave es
   * `rowId`: las guardadas usan su `plepladetId` (estable entre recargas →
   * el estado expandido persiste) y las nuevas un contador negativo único.
   */
  expandido = signal<Set<string>>(new Set());

  /**
   * Asigna `rowId` a cada línea si falta (clave del expand). Se muta
   * in-place sin escribir señales para no encadenar efectos.
   */
  private syncRowIds = effect(() => {
    const filas = this.dets();
    for (const fila of filas) {
      if (fila['rowId'] == null) {
        fila['rowId'] = fila[this.config.idKeyDet] ?? this.rowIdContador--;
      }
    }
  });

  /** Alterna el expand de la fila (chevron de Acciones). */
  toggleFila(row: any): void {
    const id = this.claveFila(row);
    const set = new Set(this.expandido());
    if (set.has(id)) set.delete(id);
    else set.add(id);
    this.expandido.set(set);
  }

  /** `true` si la fila está expandida (su sub-fila de Egresos/Ingresos se muestra). */
  isExpandido(row: any): boolean {
    const id = row['rowId'];
    return id != null && this.expandido().has(String(id));
  }

  /** Clave de expand de la fila, asignándola si aún no existe. */
  private claveFila(row: any): string {
    if (row['rowId'] == null) {
      row['rowId'] = row[this.config.idKeyDet] ?? this.rowIdContador--;
    }
    return String(row['rowId']);
  }

  /** Etiqueta de un campo del detalle (reutilizada por la fila expandida). */
  etiquetaCampo(key: string): string {
    return this.camposDet.find((c) => c.key === key)?.label ?? key;
  }

  /** Suma de egresos de la línea: IHSS + RAP + RTF + Otras Deducciones. */
  egresosDe(row: any): number {
    return this.clavesEgresos.reduce((suma, k) => suma + (Number(row[k]) || 0), 0);
  }

  /** Suma de ingresos de la línea: Comisiones + Horas Extras + Bonos. */
  ingresosDe(row: any): number {
    return this.clavesIngresos.reduce((suma, k) => suma + (Number(row[k]) || 0), 0);
  }

  /**
   * Neto derivado de la línea (regla de negocio):
   * `sueldoneto = sueldobruto + ingresos − egresos` (si el resultado es
   * negativo, se resta). Única fuente para la celda "Neto a Pagar", el
   * Total a Pagar, el recibo y el payload al guardar — así nunca puede
   * quedar desfasado de los importes visibles de la fila.
   */
  netoFila(row: any): number {
    const bruto = Number(row['sueldobruto']) || 0;
    return Math.round((bruto + this.ingresosDe(row) - this.egresosDe(row)) * 100) / 100;
  }

  /** Valor de una celda `subtotal` (_egresos / _ingresos / sueldoneto) para la fila. */
  subtotalFila(row: any, key: string): number {
    if (key === 'sueldoneto') return this.netoFila(row);
    return key === '_egresos' ? this.egresosDe(row) : this.ingresosDe(row);
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.inicializarCatalogosPlanilla();
  }

  /**
   * Carga los catálogos del formulario (meses, departamentos, períodos
   * contables) y arma la sincronización Año ↔ Periodo.
   */
  private inicializarCatalogosPlanilla() {
    this.planillaService
      .getEmpleados()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((empleados) => this.empleadosRaw.set(empleados));

    this.planillaService
      .getMeses()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((meses) => {
        const map: Record<number, string> = {};
        for (const m of meses) map[m.tmesId] = m.descripcion;
        this.mesesMap.set(map);
        this.refrescarPeriodosOptions();
      });

    this.planillaService
      .getPlDeptos()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((deptos) => this.asignarDeptos(deptos));

    this.contabilidadService
      .getPeriodos()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((periodos) => {
        // Select de Periodo = períodos ABIERTOS con el mes desde tmeses:
        //   SELECT a.nromes, b.descripcion, a.nroanio
        //   FROM coperiodoctable a INNER JOIN tmeses b ON b.tmesId = a.nromes
        //   WHERE a.sn_abierto = 'S'
        // Más reciente primero: 2026 Oct, 2026 Sep, ... 2025 Dic, ...
        this.periodosRaw = periodos
          .filter((p) => p.sn_abierto === 'S')
          .sort((a, b) => b.nroanio - a.nroanio || b.nromes - a.nromes);
        this.refrescarPeriodosOptions();
      });

    // Año editado: si el período elegido es de otro año se limpia; si el
    // período viene como número (patch de carga) se convierte a "anio-mes".
    this.form
      .get('anio')!
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((anio) => {
        const p = this.form.get('periodo')!.value;
        if (p != null && p !== '') {
          if (typeof p === 'number') {
            if (anio) this.form.get('periodo')!.setValue(`${anio}-${p}`, { emitEvent: false });
          } else if (String(p).split('-')[0] !== String(anio)) {
            this.form.get('periodo')!.setValue(null, { emitEvent: false });
          }
        }
        this.refrescarPeriodosOptions();
      });

    // Período elegido: sincroniza el Año y reconstruye las opciones.
    this.form
      .get('periodo')!
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((v) => {
        if (v != null && v !== '') {
          if (typeof v === 'number') {
            // Patch de carga: el valor aún es el número crudo del backend.
            const anio = Number(this.form.get('anio')?.value) || 0;
            if (anio) this.form.get('periodo')!.setValue(`${anio}-${v}`, { emitEvent: false });
          } else {
            const [a, m] = String(v).split('-').map(Number);
            if (a && m && this.form.get('anio')!.value !== a) {
              this.form.get('anio')!.setValue(a, { emitEvent: false });
            }
          }
        }
        this.refrescarPeriodosOptions();
      });
  }

  /** Opciones del select Periodo: "Mes Año" de tmeses, sólo períodos abiertos. */
  private refrescarPeriodosOptions() {
    const meses = this.mesesMap();
    const opts: OpcionSelect[] = this.periodosRaw.map((p) => ({
      label: `${meses[p.nromes] ?? p.nromes} ${p.nroanio}`,
      value: `${p.nroanio}-${p.nromes}`,
    }));

    // Un registro existente puede tener un período fuera de coperiodoctable:
    // se agrega una opción sintética para que el select lo muestre igual.
    const actual = this.form?.get('periodo')?.value;
    if (typeof actual === 'string' && actual.includes('-') && !opts.some((o) => o.value === actual)) {
      const [a, m] = actual.split('-').map(Number);
      opts.push({ label: `${meses[m] ?? m} ${a}`, value: actual });
    }

    this.periodosOptions.set(opts);
  }

  /** Arma las opciones del multi-select con "Todos" al inicio. */
  private asignarDeptos(deptos: PlDepto[]) {
    const opciones = deptos.map((d) => ({ label: d.descripcion, value: d.tpldeptosId }));
    this.deptosOptions.set([{ label: 'Todos', value: -1 }, ...opciones]);
    // Carga inicial: todos los departamentos seleccionados (tabla sin filtrar).
    this.deptosSel.set([-1]);
  }

  /**
   * Cambio de la selección de departamentos: "Todos" es excluyente
   * (elegir un departamento concreto lo descarta, y viceversa); si se
   * deselecciona todo se vuelve a "Todos".
   * Se normaliza el valor a array por si el control emite un escalar.
   */
  onDeptosChange(sel: number[] | number) {
    const val = Array.isArray(sel) ? sel : sel == null ? [] : [sel];
    const ant = this.deptosSel();
    if (!val.length) {
      this.deptosSel.set([-1]);
      return;
    }
    if (val.includes(-1) && !ant.includes(-1)) {
      this.deptosSel.set([-1]);
      return;
    }
    const concretos = val.filter((v) => v !== -1);
    this.deptosSel.set(concretos.length ? concretos : [-1]);
  }

  /**
   * Al elegir el empleado de una línea se sincroniza `departamentoId` con el
   * `deptoId` del empleado (misma regla del backend al generar la planilla:
   * `departamentoId: e.deptoId`), para que el filtro de cabecera por
   * departamentos siga aplicando aunque la columna ya no se muestre.
   */
  onEmpleadoChange(row: any) {
    const emp = this.empleadosRaw().find((e) => e.empleadoId === row['empleadoId']);
    row['departamentoId'] = emp?.deptoId ?? null;
  }

  /**
   * Marca/desmarca la línea para pagar (checkbox de la tabla → `sn_pagar`).
   * Se copia el array de `dets` para invalidar `detsFiltrados`/`todasPagar`
   * (los `computed` no ven mutaciones in-place de las filas).
   */
  onPagarChange(row: any, marcado: boolean) {
    row['sn_pagar'] = marcado ? 'S' : 'N';
    this.dets.update((filas) => [...filas]);
  }

  /**
   * Invalida los computed de totales (`totalAPagar`, `todasPagar`) tras
   * editar una celda de dinero de una línea: los mutadores in-place de
   * filas no invalidan señales.
   */
  refrescarTotales(): void {
    this.dets.update((filas) => [...filas]);
  }

  /**
   * Checkbox de cabecera: marca/desmarca TODAS las líneas visibles
   * (respeta el filtro de departamentos activo).
   */
  marcarTodas(marcar: boolean) {
    for (const d of this.detsFiltrados()) d['sn_pagar'] = marcar ? 'S' : 'N';
    this.dets.update((filas) => [...filas]);
  }

  /**
   * Antes de guardar: escribe el neto derivado (`netoFila`) en cada línea,
   * de modo que el backend almacene siempre un `sueldoneto` que cuadre con
   * bruto + ingresos − egresos (aunque la fila tenga un valor previo
   * desfasado, p. ej. de una integración anterior de horas extras).
   *
   * Además convierte el control `periodo` de "anio-mes" (formato del select)
   * a NÚMERO para el payload: el DTO exige `@IsNumber()` y con el string
   * "2026-12" la API responde 400 ("periodo must be a number"). El swap se
   * hace sin emitir eventos y se restaura enseguida — `maeBody` se construye
   * síncrono dentro de `super.guardar()`, antes de cualquier render.
   */
  override guardar(): void {
    for (const fila of this.dets()) {
      fila['sueldoneto'] = this.netoFila(fila);
    }

    // Swap 1: periodo "anio-mes" → número (DTO exige @IsNumber()).
    const ctrl = this.form.get('periodo');
    const original = ctrl?.value;
    const esCompuesto = typeof original === 'string' && original.includes('-');
    if (esCompuesto) {
      ctrl!.setValue(Number(original!.split('-')[1]), { emitEvent: false });
    }

    // Swap 2: items llega como STRING de la BD (decimal → "8.00") y el
    // DTO lo rechaza con 400; se envía como número y se restaura igual.
    const ctrlItems = this.form.get('items');
    const itemsOriginal = ctrlItems?.value;
    const itemsEsString = typeof itemsOriginal === 'string' && itemsOriginal !== '';
    if (itemsEsString) {
      ctrlItems!.setValue(Number(itemsOriginal), { emitEvent: false });
    }

    super.guardar();

    if (esCompuesto) {
      ctrl!.setValue(original, { emitEvent: false });
    }
    if (itemsEsString) {
      ctrlItems!.setValue(itemsOriginal, { emitEvent: false });
    }
  }

  /**
   * Genera el detalle de la planilla de forma MASIVA (todos los empleados
   * activos con todos los rubros calculados):
   * - **Planilla en edición**: genera directo sobre el `planillaId`.
   * - **Planilla nueva** (`/editar/nuevo`): primero crea la cabecera
   *   (validando el formulario), actualiza la URL al id real y luego genera —
   *   así no hay que agregar empleados 1 × 1 ni guardar antes.
   */
  generarPlanilla() {
    if (this.generandoPlanilla() || this.guardando()) return;

    if (this.esEdicion() && this.itemId) {
      this.ejecutarGeneracion();
      return;
    }

    // Nueva: la cabecera debe existir antes de generar (el endpoint trabaja
    // sobre planillaId) — se crea aquí con el mismo payload que Guardar.
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.msgs.add({
        severity: 'warn',
        summary: 'Planilla',
        detail: 'Complete los campos requeridos de la cabecera antes de generar',
      });
      return;
    }

    this.generandoPlanilla.set(true);
    const raw = this.form.getRawValue();
    if (typeof raw.periodo === 'string' && raw.periodo.includes('-')) {
      raw.periodo = Number(raw.periodo.split('-')[1]);
    }
    const maeBody = { ...raw, empresaId: this.auth.currentUser()?.empresaId };

    this.service.createMae<any>(this.config.rutaMae, maeBody).subscribe({
      next: (mae) => {
        const nuevoId = Number(mae?.[this.config.idKeyMae]);
        if (!nuevoId) {
          this.generandoPlanilla.set(false);
          this.msgs.add({ severity: 'error', summary: 'Error', detail: 'La cabecera se creó sin id' });
          return;
        }
        this.itemId = nuevoId;
        this.esEdicion.set(true);
        this.detGuardados.clear();
        this.maeActual.set(mae);
        // La URL refleja el id real: refrescar/back siguen en edición.
        this.router.navigate(['/planilla/planillas/editar', nuevoId], { replaceUrl: true });
        this.ejecutarGeneracion();
      },
      error: () => {
        this.generandoPlanilla.set(false);
        this.msgs.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo crear la cabecera de la planilla',
        });
      },
    });
  }

  /** Llama al endpoint de generación (sobre una cabecera ya existente). */
  private ejecutarGeneracion() {
    this.generandoPlanilla.set(true);
    this.planillaService.generarPlanilla(this.itemId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => this.trasGenerarPlanilla(res),
        error: () => this.generandoPlanilla.set(false),
      });
  }

  /**
   * **Paso 2 — Autorizar pago de planilla**: marca `sn_autorizada='S'` en el
   * backend. No mueve dinero: es la aprobación previa que habilita
   * "Contabilizar planilla". La respuesta actualiza `maeActual` → los
   * botones y los tags de estado se refrescan.
   */
  autorizarPago() {
    if (this.autorizandoPago() || this.guardando()) return;
    if (!this.esEdicion() || !this.itemId) {
      this.msgs.add({
        severity: 'warn',
        summary: 'Planilla',
        detail: 'Guarde o genere la planilla antes de autorizarla',
      });
      return;
    }

    this.autorizandoPago.set(true);
    this.planillaService.autorizarPlanilla(this.itemId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (mae) => {
          this.autorizandoPago.set(false);
          this.maeActual.set(mae);
          this.msgs.add({
            severity: 'success',
            summary: 'Pago autorizado',
            detail: 'La planilla quedó autorizada: ya puede contabilizarla.',
          });
        },
        error: () => this.autorizandoPago.set(false),
      });
  }

  /**
   * **Paso 3 — Contabilizar planilla**: el BACKEND valida los fondos de la
   * cuenta bancaria seleccionada (saldo ≥ total a pagar) antes de marcar
   * `sn_contabilizada='S'`; si faltan fondos responde 400 y el interceptor
   * global muestra el toast con saldo vs requerido. La partida contable se
   * integrará después (`partidaId` queda en 0 — decisión 20/10/2026).
   */
  contabilizarPlanilla() {
    if (this.contabilizando() || this.guardando()) return;
    if (!this.esEdicion() || !this.itemId) {
      this.msgs.add({
        severity: 'warn',
        summary: 'Planilla',
        detail: 'Guarde o genere la planilla antes de contabilizarla',
      });
      return;
    }

    this.contabilizando.set(true);
    this.planillaService.contabilizarPlanilla(this.itemId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (mae) => {
          this.contabilizando.set(false);
          this.maeActual.set(mae);
          this.msgs.add({
            severity: 'success',
            summary: 'Planilla contabilizada',
            detail:
              'Fondos verificados en la cuenta bancaria. '
              + 'La partida contable se integrará después (partidaId pendiente).',
          });
        },
        error: () => this.contabilizando.set(false),
      });
  }

  /**
   * Línea nueva: nace marcada para pagar (`sn_pagar='S'`, mismo default
   * que la BD y que el backend al generar; evita enviar '' que el DTO
   * rechaza con 400).
   */
  override nuevaFila(): void {
    super.nuevaFila();
    const filas = this.dets();
    const fila = filas[filas.length - 1];
    if (fila) fila['sn_pagar'] = 'S';
  }

  /**
   * Elimina una fila de la tabla filtrada: `rowIndex` es del array filtrado,
   * por lo que se busca la fila real en `dets()` antes de quitarla.
   */
  quitarFilaFiltrado(row: any) {
    const idx = this.dets().indexOf(row);
    if (idx >= 0) this.quitarFila(idx);
  }

  /**
   * Integra las horas extras MENSUALES del período de esta planilla en sus
   * líneas (`importe_chorasextras`) y en el rubro `PAGO-HORA-EX`.
   * Sólo tiene sentido sobre una planilla guardada con líneas.
   */
  calcularHorasExtras() {
    if (!this.esEdicion() || !this.itemId) {
      this.msgs.add({
        severity: 'warn',
        summary: 'Planilla',
        detail: 'Guarde la planilla antes de calcular las horas extras',
      });
      return;
    }

    this.calculandoHE.set(true);
    this.planillaService.calcularHorasExtrasPlanilla(this.itemId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => this.trasCalcularHorasExtras(res),
        error: () => this.calculandoHE.set(false),
      });
  }

  private trasCalcularHorasExtras(res: HorasExtrasPlanillaResultado) {
    this.calculandoHE.set(false);

    this.msgs.add({
      severity: 'success',
      summary: `Horas extras integradas (${res.periodoTexto})`,
      detail: `${res.empleadosCalculados} empleado(s) · ${res.horasTotales} h · ${this.fmtL(res.importeTotal)} en ${res.lineasActualizadas} línea(s)`,
    });

    if (res.minutosSinTramo > 0) {
      this.msgs.add({
        severity: 'warn',
        summary: 'Minutos sin tramo',
        detail: `${res.minutosSinTramo} minuto(s) no cayeron en ningún tramo de tplhorasextras`,
      });
    }

    if (res.empleadosSinLinea?.length) {
      this.msgs.add({
        severity: 'warn',
        summary: 'Sin línea en la planilla',
        detail: `${res.empleadosSinLinea.length} empleado(s) con horas extras no están en esta planilla`,
      });
    }

    // Refresca las líneas con el importe recién calculado.
    this.dets.update((filas) =>
      filas.map((fila) => {
        const d = res.detalle?.find((x) => x.empleadoId === fila.empleadoId);
        return d ? { ...fila, importe_chorasextras: d.importe } : fila;
      }),
    );
  }

  /**
   * Genera la planilla con todos los cálculos: IHSS, RAP, RTF y vecinal ÷12
   * (desde el mes del parámetro), otras deducciones, comisiones por tramo,
   * bonos, horas extras y neto. Si el mes corresponde, crea o regenera la
   * planilla especial del décimo (13avo en diciembre / 14avo en junio).
   * Implementación en `generarPlanilla()` / `ejecutarGeneracion()`.
   */
  private trasGenerarPlanilla(res: PlanillaGeneradaResultado) {
    this.generandoPlanilla.set(false);

    const t = res.totales;
    this.msgs.add({
      severity: 'success',
      summary: `Planilla generada (${res.periodoTexto})`,
      detail:
        `${res.empleadosCalculados} empleado(s) · neto total ${this.fmtL(t.neto)} · ` +
        `IHSS ${this.fmtL(t.ihss)} · RAP ${this.fmtL(t.rap)} · RTF+vecinal ${this.fmtL(t.rtf + t.vecinal)}`,
    });

    if (res.decimo?.aplicado) {
      this.msgs.add({
        severity: 'info',
        summary: `Planilla especial ${res.decimo.tipo} ${res.decimo.aplicado ? 'generada' : ''}`,
        detail: `${res.decimo.nroplanilla} · ${res.decimo.empleados} empleado(s) · ${this.fmtL(res.decimo.total)}`,
      });
    }

    // Actualiza cabecera (items / totalapagar) y recarga las líneas nuevas
    this.form.patchValue({ items: res.lineasCreadas, totalapagar: Math.round(t.neto) });
    this.cargarDetsFiltrando();
  }

  /**
   * Imprime el recibo de pago de UNA línea (empleado) con el motor pdfmake
   * del proyecto (formato TICKET/CARTA parametrizado en `timpresoras`).
   * Usa los montos visibles de la fila; no requiere línea guardada.
   */
  imprimirRecibo(row: any) {
    const emp = this.empleadosRaw().find((e) => e.empleadoId === row['empleadoId']);
    if (!emp) {
      this.msgs.add({
        severity: 'warn',
        summary: 'Recibo',
        detail: 'Seleccione el empleado antes de imprimir el recibo',
      });
      return;
    }

    // Período legible: opción del select o "Mes Año" desde tmeses.
    const periodoValue = this.form.get('periodo')?.value;
    const anio = this.form.get('anio')?.value;
    const mes = this.mesesMap()[Number(periodoValue)];
    const periodoLabel =
      this.periodosOptions().find((o) => o.value === periodoValue)?.label ??
      (mes ? `${mes} ${anio ?? ''}`.trim() : periodoValue != null && periodoValue !== '' ? `Período ${periodoValue}` : 'Planilla');

    const recibo: ReciboPlanillaData = {
      periodo: periodoLabel,
      nroplanilla: this.itemId || null,
      empleado: {
        nombre:
          `${emp.nombres ?? ''} ${emp.apellidos ?? ''}`.replace(/\s+/g, ' ').trim() ||
          `Empleado ${emp.empleadoId}`,
      },
      montos: {
        sueldobruto: Number(row['sueldobruto']) || 0,
        ihss: Number(row['importe_dihss']) || 0,
        rap: Number(row['importe_drap']) || 0,
        rtf: Number(row['importe_drtf']) || 0,
        vecinal: Number(row['importe_drvc']) || 0,
        otras: Number(row['importe_dotras']) || 0,
        comisiones: Number(row['importe_ccomision']) || 0,
        horasExtras: Number(row['importe_chorasextras']) || 0,
        bonos: Number(row['importe_cbonos']) || 0,
        neto: this.netoFila(row),
      },
    };

    this.impresion.imprimirReciboPlanilla(recibo).catch(() => {
      this.msgs.add({
        severity: 'warn',
        summary: 'Impresión',
        detail: 'No se pudo imprimir el recibo',
      });
    });
  }

  /** Formato monetario del proyecto: L 1,234.56 (es-HN). */
  fmtL(valor: number | string | null | undefined): string {
    return `L ${Number(valor ?? 0).toLocaleString('es-HN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
}
