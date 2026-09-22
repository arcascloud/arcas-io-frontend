import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import {
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TableModule } from 'primeng/table';
import {
  AutoComplete,
  AutoCompleteCompleteEvent,
  AutoCompleteSelectEvent,
} from 'primeng/autocomplete';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { Select } from 'primeng/select';
import { DatePicker } from 'primeng/datepicker';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';

/* ---------- Modelos ---------- */

interface Cuenta {
  codigo: string;
  nombre: string;
  aceptaMovimiento: boolean; // solo las cuentas de detalle reciben movimientos
}

interface Linea {
  id: number;
  cuenta: Cuenta;
  descripcion: string;
  debe: number;
  haber: number;
}

export interface Partida {
  concepto: string;
  auxiliarId: number | null;
  fechaDocumento: Date;
  referencia: string;
  descripcion: string;
  totalDebe: number;
  totalHaber: number;
  detalle: { linea: number; cuenta: string; descripcion: string; debe: number; haber: number }[];
}

/* ---------- Datos de ejemplo (reemplazar por tu API) ---------- */

const CONCEPTOS = [
  { codigo: 'DIA', nombre: 'Diario' },
  { codigo: 'AJU', nombre: 'Ajuste' },
  { codigo: 'PRV', nombre: 'Provisión' },
  { codigo: 'CIE', nombre: 'Cierre' },
];

const AUXILIARES = [
  { id: 1, nombre: 'Cliente Mostrador' },
  { id: 2, nombre: 'Proveedor Servicios SA' },
  { id: 3, nombre: 'Empleado - Planilla' },
];

const CUENTAS: Cuenta[] = [
  { codigo: '1', nombre: 'ACTIVO', aceptaMovimiento: false },
  { codigo: '1101-01', nombre: 'Caja general', aceptaMovimiento: true },
  { codigo: '1101-02', nombre: 'Bancos moneda nacional', aceptaMovimiento: true },
  { codigo: '1201-01', nombre: 'Cuentas por cobrar clientes', aceptaMovimiento: true },
  { codigo: '2101-01', nombre: 'Proveedores locales', aceptaMovimiento: true },
  { codigo: '2103-01', nombre: 'Impuesto por pagar', aceptaMovimiento: true },
  { codigo: '4101-01', nombre: 'Ventas de mercadería', aceptaMovimiento: true },
  { codigo: '5101-01', nombre: 'Costo de ventas', aceptaMovimiento: true },
  { codigo: '6101-01', nombre: 'Gastos de sueldos', aceptaMovimiento: true },
];

const r2 = (n: number) => Math.round(n * 100) / 100;

@Component({
  selector: 'app-partida-contable',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    DecimalPipe,
    TableModule,
    AutoComplete,
    InputNumber,
    InputText,
    Textarea,
    Select,
    DatePicker,
    Button,
    Tag,
  ],
  styles: `
    .muted {
      color: var(--p-text-muted-color);
    }
  `,
  template: `
    <section class="flex flex-col gap-6">
      <!-- MAESTRO -->
      <form [formGroup]="form" class="grid grid-cols-1 gap-4 md:grid-cols-6">
        <div class="flex flex-col gap-1 md:col-span-2">
          <label for="concepto">Concepto contable *</label>
          <p-select
            inputId="concepto"
            formControlName="concepto"
            [options]="conceptos"
            optionLabel="nombre"
            optionValue="codigo"
            placeholder="Seleccione un concepto"
            [fluid]="true"
            appendTo="body"
          />
        </div>

        <div class="flex flex-col gap-1 md:col-span-2">
          <label for="auxiliar">Auxiliar</label>
          <p-select
            inputId="auxiliar"
            formControlName="auxiliar"
            [options]="auxiliares"
            optionLabel="nombre"
            optionValue="id"
            [filter]="true"
            filterBy="nombre"
            [showClear]="true"
            placeholder="Sin auxiliar"
            [fluid]="true"
            appendTo="body"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label for="fecha">Fecha documento *</label>
          <p-datepicker
            inputId="fecha"
            formControlName="fechaDocumento"
            dateFormat="dd/mm/yy"
            [showIcon]="true"
            iconDisplay="input"
            [fluid]="true"
            appendTo="body"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label for="referencia">Referencia</label>
          <input id="referencia" pInputText formControlName="referencia" maxlength="30" class="w-full" />
        </div>

        <div class="flex flex-col gap-1 md:col-span-6">
          <label for="descripcion">Descripción *</label>
          <textarea
            id="descripcion"
            pTextarea
            formControlName="descripcion"
            rows="2"
            maxlength="200"
            class="w-full"
          ></textarea>
        </div>
      </form>

      <!-- DETALLE (fuera del <form> para poder usar ngModel sin standalone) -->
      <p-table
        [value]="lineas()"
        dataKey="id"
        [rowTrackBy]="trackById"
        size="small"
        showGridlines
        [tableStyle]="{ 'min-width': '52rem' }"
      >
        <ng-template #header>
          <tr>
            <th class="w-1/4">Cuenta</th>
            <th>Descripción</th>
            <th class="w-44 text-right">Debe</th>
            <th class="w-44 text-right">Haber</th>
            <th class="w-14"></th>
          </tr>
        </ng-template>

        <ng-template #body let-l>
          <tr [attr.data-linea]="l.id">
            <td>
              <span class="muted mr-2">{{ l.cuenta.codigo }}</span>
              <span>{{ l.cuenta.nombre }}</span>
            </td>
            <td>
              <input
                pInputText
                class="w-full"
                maxlength="200"
                [ngModel]="l.descripcion"
                (ngModelChange)="editar(l.id, { descripcion: $event })"
                aria-label="Descripción de la línea"
              />
            </td>
            <td class="text-right">
              <p-inputnumber
                data-col="debe"
                [ngModel]="l.debe || null"
                (ngModelChange)="setDebe(l.id, $event)"
                [min]="0"
                [minFractionDigits]="2"
                [maxFractionDigits]="2"
                [fluid]="true"
                inputStyleClass="text-right"
              />
            </td>
            <td class="text-right">
              <p-inputnumber
                data-col="haber"
                [ngModel]="l.haber || null"
                (ngModelChange)="setHaber(l.id, $event)"
                [min]="0"
                [minFractionDigits]="2"
                [maxFractionDigits]="2"
                [fluid]="true"
                inputStyleClass="text-right"
              />
            </td>
            <td class="text-center">
              <p-button
                icon="pi pi-trash"
                severity="danger"
                [text]="true"
                [rounded]="true"
                size="small"
                [tabindex]="-1"
                ariaLabel="Quitar línea"
                (onClick)="quitar(l.id)"
              />
            </td>
          </tr>
        </ng-template>

        <ng-template #footer>
          <!-- Fila fantasma: aquí se agregan las cuentas -->
          <tr>
            <td colspan="5">
              <p-autocomplete
                #buscador
                [(ngModel)]="seleccionada"
                [suggestions]="sugerencias()"
                (completeMethod)="buscar($event)"
                (onSelect)="agregar($event)"
                optionLabel="nombre"
                placeholder="Escribe código o nombre de la cuenta para agregar una línea…"
                [minLength]="1"
                [delay]="250"
                [fluid]="true"
                appendTo="body"
              >
                <ng-template #item let-c>
                  <span class="muted mr-2">{{ c.codigo }}</span>{{ c.nombre }}
                </ng-template>
                <ng-template #empty>
                  <div class="muted px-3 py-2">No hay cuentas de movimiento con ese criterio</div>
                </ng-template>
              </p-autocomplete>
            </td>
          </tr>

          <tr>
            <td colspan="2" class="text-right font-semibold">Totales</td>
            <td class="text-right font-semibold">{{ totalDebe() | number: '1.2-2' }}</td>
            <td class="text-right font-semibold">{{ totalHaber() | number: '1.2-2' }}</td>
            <td></td>
          </tr>

          <tr>
            <td colspan="2" class="text-right">Diferencia</td>
            <td colspan="2">
              <div class="flex items-center justify-end gap-3">
                <span>{{ diferencia() | number: '1.2-2' }}</span>
                @if (cuadrada()) {
                  <p-tag severity="success" value="Cuadrada" />
                } @else {
                  <p-tag severity="danger" value="Descuadrada" />
                }
              </div>
            </td>
            <td></td>
          </tr>
        </ng-template>
      </p-table>

      <div class="flex justify-end gap-2">
        <p-button label="Limpiar" severity="secondary" [outlined]="true" (onClick)="limpiar()" />
        <p-button
          label="Guardar partida"
          icon="pi pi-check"
          [disabled]="!puedeGuardar()"
          (onClick)="guardar()"
        />
      </div>
    </section>
  `,
})
export class PartidaContable {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly buscadorEl = viewChild('buscador', { read: ElementRef });
  private siguienteId = 1;

  readonly guardada = output<Partida>();

  protected readonly conceptos = CONCEPTOS;
  protected readonly auxiliares = AUXILIARES;

  /* ----- Maestro ----- */
  protected readonly form = this.fb.group({
    concepto: this.fb.control<string | null>(null, Validators.required),
    auxiliar: this.fb.control<number | null>(null),
    fechaDocumento: this.fb.control<Date | null>(new Date(), Validators.required),
    referencia: this.fb.control('', Validators.maxLength(30)),
    descripcion: this.fb.control('', [Validators.required, Validators.maxLength(200)]),
  });
  private readonly estadoForm = toSignal(this.form.statusChanges, {
    initialValue: this.form.status,
  });

  /* ----- Detalle ----- */
  protected readonly lineas = signal<Linea[]>([]);
  protected readonly sugerencias = signal<Cuenta[]>([]);
  protected readonly seleccionada = signal<Cuenta | string | null>(null);

  protected readonly totalDebe = computed(() =>
    r2(this.lineas().reduce((acc, l) => acc + l.debe, 0)),
  );
  protected readonly totalHaber = computed(() =>
    r2(this.lineas().reduce((acc, l) => acc + l.haber, 0)),
  );
  protected readonly diferencia = computed(() => r2(this.totalDebe() - this.totalHaber()));
  protected readonly cuadrada = computed(() => this.totalDebe() > 0 && this.diferencia() === 0);

  protected readonly puedeGuardar = computed(
    () =>
      this.estadoForm() === 'VALID' &&
      this.cuadrada() &&
      this.lineas().length >= 2 &&
      this.lineas().every((l) => l.debe > 0 || l.haber > 0),
  );

  // Evita recrear la fila (y perder el foco) mientras se edita un monto.
  protected readonly trackById = (_: number, l: Linea) => l.id;

  protected buscar(e: AutoCompleteCompleteEvent) {
    const q = e.query.trim().toLowerCase();
    // En real: this.http.get<Cuenta[]>('/api/cuentas', { params: { q, movimiento: true } })
    this.sugerencias.set(
      CUENTAS.filter(
        (c) =>
          c.aceptaMovimiento &&
          (c.codigo.toLowerCase().includes(q) || c.nombre.toLowerCase().includes(q)),
      ),
    );
  }

  protected agregar(e: AutoCompleteSelectEvent) {
    const cuenta = e.value as Cuenta;
    const dif = this.diferencia(); // debe - haber

    // Si la partida está descuadrada, la nueva línea propone el monto que la cuadra
    // en el lado contrario. Una misma cuenta puede repetirse: no se deduplica.
    const linea: Linea = {
      id: this.siguienteId++,
      cuenta,
      descripcion: this.form.controls.descripcion.value || cuenta.nombre,
      debe: dif < 0 ? -dif : 0,
      haber: dif > 0 ? dif : 0,
    };
    this.lineas.update((ls) => [...ls, linea]);

    // El autocomplete termina de procesar la selección antes de aceptar el reset.
    setTimeout(() => this.seleccionada.set(null));

    // Cuando la fila ya está renderizada, el cursor va directo al monto.
    const lado = linea.haber > 0 ? 'haber' : 'debe';
    afterNextRender(
      () =>
        this.host.nativeElement
          .querySelector<HTMLInputElement>(`[data-linea="${linea.id}"] [data-col="${lado}"] input`)
          ?.focus(),
      { injector: this.injector },
    );
  }

  /* Una línea es debe O haber, nunca ambos: al capturar uno se limpia el otro. */
  protected setDebe(id: number, valor: number | null) {
    const v = valor ?? 0;
    this.editar(id, v > 0 ? { debe: v, haber: 0 } : { debe: 0 });
  }

  protected setHaber(id: number, valor: number | null) {
    const v = valor ?? 0;
    this.editar(id, v > 0 ? { haber: v, debe: 0 } : { haber: 0 });
  }

  protected editar(id: number, cambios: Partial<Linea>) {
    this.lineas.update((ls) => ls.map((l) => (l.id === id ? { ...l, ...cambios } : l)));
  }

  protected quitar(id: number) {
    this.lineas.update((ls) => ls.filter((l) => l.id !== id));
  }

  protected limpiar() {
    this.form.reset({ fechaDocumento: new Date() });
    this.lineas.set([]);
    this.seleccionada.set(null);
  }

  protected guardar() {
    if (!this.puedeGuardar()) return;
    const v = this.form.getRawValue();

    const partida: Partida = {
      concepto: v.concepto!,
      auxiliarId: v.auxiliar,
      fechaDocumento: v.fechaDocumento!,
      referencia: v.referencia,
      descripcion: v.descripcion,
      totalDebe: this.totalDebe(),
      totalHaber: this.totalHaber(),
      detalle: this.lineas().map((l, i) => ({
        linea: i + 1,
        cuenta: l.cuenta.codigo,
        descripcion: l.descripcion,
        debe: l.debe,
        haber: l.haber,
      })),
    };

    // Aquí llamas a tu servicio HTTP; el padre también puede escuchar (guardada).
    this.guardada.emit(partida);
  }
}
