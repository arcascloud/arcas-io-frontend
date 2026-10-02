import { Component, inject, signal, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { CatalogoParametrosService } from '../../../core/services/catalogo-parametros.service';
import { CATALOGOS_PARAMETROS, CatalogoConfig, CampoCatalogo } from '../../../core/models/catalogo-parametros.models';

@Component({
  selector: 'app-catalogo-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    DatePickerModule,
  ],
  templateUrl: './catalogo-form.html',
  styleUrl: './catalogo-form.scss',
})
export class CatalogoForm implements OnInit, OnChanges {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(CatalogoParametrosService);
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private msgs = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  /** Modo embebido: nombre del catálogo (ej: 'bancos', 'cuentas') */
  @Input() catalogoNombre = '';
  /** Modo embebido: ID del registro (0 = nuevo) */
  @Input() itemIdInput: number | string = '';
  /** Modo embebido: query params para pre-llenar campos */
  @Input() queryParamsInput: Record<string, any> = {};
  /** Se emite al guardar o cancelar (para que el padre cierre el form) */
  @Output() finalized = new EventEmitter<void>();

  config!: CatalogoConfig;
  campos: CampoCatalogo[] = [];

  esEdicion = signal(false);
  cargando = signal(false);
  guardando = signal(false);
  titulo = signal('');
  /** Registro protegido (ej: período cerrado) → formulario bloqueado, sin Guardar */
  protegido = signal(false);

  opcionesMap = signal<Record<string, { label: string; value: any }[]>>({});

  readonly snOptions = [
    { label: 'Activo', value: 'S' },
    { label: 'Inactivo', value: 'N' },
  ];

  private itemId = 0;

  form!: FormGroup;

  ngOnInit() {
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['catalogoNombre'] || changes['itemIdInput']) {
      this.initForm();
    }
  }

  private initForm() {
    // Modo embebido: usar @Inputs
    const nombre = this.catalogoNombre || (this.route.snapshot.data['nombre'] ?? this.route.snapshot.paramMap.get('nombre') ?? '');
    const id = this.itemIdInput !== null && this.itemIdInput !== undefined && this.itemIdInput !== ''
      ? String(this.itemIdInput)
      : this.route.snapshot.paramMap.get('id') ?? '';

    this.config = CATALOGOS_PARAMETROS[nombre];
    if (!this.config) {
      this.msgs.add({ severity: 'error', summary: 'Error', detail: `Catálogo desconocido: ${nombre}` });
      return;
    }
    this.campos = this.config.campos;
    this.protegido.set(false);
    this.titulo.set(this.esNuevo(id) ? `Nuevo ${this.config.titulo.slice(0, -1)}` : `Editar ${this.config.titulo.slice(0, -1)}`);
    this.buildForm();

    // Catálogo protegido: sn_abierto nunca se toca desde aquí
    // (cerrar un período es exclusivo de Cierre Contable, que genera la partida)
    if (this.config.protegerCerrados && this.form.contains('sn_abierto')) {
      this.form.get('sn_abierto')?.disable();
    }
    this.cargarOpciones();

    if (!this.esNuevo(id)) {
      this.esEdicion.set(true);
      this.itemId = Number(id);
      this.cargando.set(true);
      this.service.getOne<any>(this.config.ruta, this.itemId).subscribe({
        next: (item) => {
          const patch: Record<string, any> = {};
          for (const c of this.campos) patch[c.key] = item?.[c.key];
          if (!this.config.sinEstado) patch['sn_activo'] = item?.sn_activo === 'S' ? 'S' : 'N';
          this.form.patchValue(patch);

          // Registro protegido (ej: período cerrado sn_abierto='N') → bloqueo total
          if (this.config.protegerCerrados && item?.['sn_abierto'] === 'N') {
            this.protegido.set(true);
            this.form.disable();
          }
          this.cargando.set(false);
        },
        error: () => {
          this.cargando.set(false);
          this.msgs.add({ severity: 'error', summary: 'Error', detail: 'Registro no encontrado' });
          this.volver();
        },
      });
    } else {
      // Pre-llenar campos desde queryParams (embebido) o route.queryParams (ruta)
      const qp = Object.keys(this.queryParamsInput ?? {}).length
        ? this.queryParamsInput
        : this.route.snapshot.queryParams;
      const patch: Record<string, any> = {};
      for (const c of this.campos) {
        if (qp[c.key] != null) {
          patch[c.key] = Number(qp[c.key]);
        }
      }
      if (Object.keys(patch).length) this.form.patchValue(patch);

      // Al crear: campos 'fecha' vacíos se instancian con tempresas.fechasistema
      this.precargarFechaSistema();
    }
  }

  /**
   * Solo al crear: prellena los campos tipo 'fecha' que estén vacíos
   * con la fecha del sistema de la empresa (tempresas.fechasistema).
   * En edición nunca se toca (conserva la fecha guardada).
   */
  private precargarFechaSistema() {
    const camposFecha = this.campos.filter((c) => c.tipo === 'fecha');
    if (!camposFecha.length) return;
    const empresaId = this.auth.currentUser()?.empresaId;
    if (!empresaId) return;
    this.api
      .get<{ fechasistema?: string }>(`/companies/${empresaId}`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (emp) => {
          if (!emp?.fechasistema) return;
          const d = new Date(emp.fechasistema);
          if (isNaN(d.getTime())) return;
          const patch: Record<string, any> = {};
          for (const c of camposFecha) {
            // Solo si está vacío (un valor por queryParams tiene prioridad)
            if (!this.form.get(c.key)?.value) patch[c.key] = d;
          }
          if (Object.keys(patch).length) this.form.patchValue(patch);
        },
      });
  }

  private esNuevo(id: string): boolean {
    return !id || id === 'nuevo';
  }

  private cargarOpciones() {
    for (const c of this.campos) {
      if (c.cargaOpciones) {
        this.api.get<any>(c.cargaOpciones.url).subscribe({
          next: (res) => {
            // Aceptar arrays planos y respuestas paginadas { data, total }
            let items: any[] = [];
            if (Array.isArray(res)) {
              items = res;
            } else if (res && typeof res === 'object') {
              const candidate = res.data ?? res.results ?? Object.values(res).find(Array.isArray) ?? [];
              items = Array.isArray(candidate) ? candidate : [];
            }
            const opts = items.map((i) => ({
              label: String(i[c.cargaOpciones!.labelCampo] ?? i[c.cargaOpciones!.valueCampo] ?? ''),
              value: i[c.cargaOpciones!.valueCampo],
            }));
            this.opcionesMap.update((m) => ({ ...m, [c.key]: opts }));
          },
        });
      }
    }
  }

  opciones(c: CampoCatalogo): { label: string; value: any }[] {
    if (c.cargaOpciones) return this.opcionesMap()[c.key] ?? [];
    return c.opciones ?? [];
  }

  private buildForm() {
    const group: Record<string, any> = {};
    for (const c of this.campos) {
      group[c.key] = [
        c.tipo === 'numero' ? 0 : '',
        c.requerido ? Validators.required : [],
      ];
    }
    if (!this.config.sinEstado) group['sn_activo'] = ['S'];
    this.form = this.fb.group(group);

    // Validaciones cruzadas declarativas (ej: precioventa >= preciocompra)
    const form = this.form;
    for (const c of this.campos) {
      if (!c.minCampo) continue;
      const ctrl = form.get(c.key);
      const refCtrl = form.get(c.minCampo);
      if (!ctrl || !refCtrl) continue;
      ctrl.addValidators((control) => {
        const ref = refCtrl.value;
        if (ref == null || ref === '') return null;
        return Number(control.value) < Number(ref) ? { minCampo: c.minCampo } : null;
      });
      ctrl.updateValueAndValidity({ emitEvent: false });
      // Revalidar cuando cambia el campo de referencia
      refCtrl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
        ctrl.updateValueAndValidity({ emitEvent: false });
      });
    }
  }

  invalid(ctrl: string): boolean {
    const c = this.form.get(ctrl);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  /** Mensaje del error del campo: minCampo tiene texto propio, si no es "obligatorio" */
  mensajeError(c: CampoCatalogo): string {
    const err = this.form.get(c.key)?.errors;
    if (err?.['minCampo']) {
      const ref = this.campos.find((x) => x.key === err['minCampo']);
      return `${c.label} no puede ser menor al campo ${ref?.label ?? err['minCampo']}`;
    }
    return `${c.label} es obligatorio`;
  }

  volver() {
    if (this.catalogoNombre) {
      // Modo embebido: emitir evento para que el padre cierre
      this.finalized.emit();
    } else {
      this.router.navigate(['../'], { relativeTo: this.route });
    }
  }

  guardar() {
    if (this.protegido()) {
      this.msgs.add({
        severity: 'warn',
        summary: 'Registro protegido',
        detail: this.config?.proteccionMensaje || 'Este registro no es modificable',
      });
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.msgs.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Revise los campos marcados en rojo',
      });
      return;
    }

    const raw = this.form.getRawValue();
    const sinContexto = this.config.incluyeEmpresaId === false;
    const body = this.esEdicion()
      ? { ...raw }
      : { ...raw };

    this.guardando.set(true);
    const op = this.esEdicion()
      ? this.service.update<any>(this.config.ruta, this.itemId, body as any, sinContexto)
      : this.service.create<any>(this.config.ruta, body as any, sinContexto);

    op.subscribe({
      next: () => {
        this.guardando.set(false);
        this.msgs.add({
          severity: 'success',
          summary: 'Guardado',
          detail: this.esEdicion() ? 'Registro actualizado' : 'Registro creado correctamente',
        });
        this.volver();
      },
      error: () => {
        this.guardando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el registro' });
      },
    });
  }
}