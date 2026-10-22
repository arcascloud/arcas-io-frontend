import { Component, inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { TagModule } from 'primeng/tag';
import { FieldsetModule } from 'primeng/fieldset';
import { DrawerModule } from 'primeng/drawer';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { EmpresasService } from '../../../core/services/empresas.service';
import { ParametroUnificadoService } from '../../../core/services/parametro-unificado.service';
import {
  TipoParametro,
  GrupoTipoParametro,
  GRUPOS_TIPO_PARAMETRO,
  MODULO_LABELS,
} from '../../../core/models/parametro-unificado.model';
import { Empresa } from '../../../core/models/empresa.models';

@Component({
  selector: 'app-param-manager-modulos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    MultiSelectModule,
    TagModule,
    FieldsetModule,
    DrawerModule,
    TooltipModule,
  ],
  templateUrl: './param-manager-modulos.html',
  styleUrl: './param-manager-modulos.scss',
})
export class ParamManagerModulos implements OnInit {
  private fb = inject(FormBuilder);
  private empresasService = inject(EmpresasService);
  private parametroService = inject(ParametroUnificadoService);
  private msgs = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  // Opciones readonly
  readonly tipoOptions = [
    { label: 'Texto (STRING)', value: 'STRING' },
    { label: 'Numérico (NUMBER)', value: 'NUMBER' },
  ];

  readonly estadoOptions = [
    { label: 'Activo', value: 'S' },
    { label: 'Inactivo', value: 'N' },
  ];

  readonly grupoOptions = GRUPOS_TIPO_PARAMETRO;

  // Datos de selects
  empresas = signal<Empresa[]>([]);
  modulos = signal<{ label: string; value: number }[]>([]);

  // Estado
  parametros = signal<TipoParametro[]>([]);
  cargando = signal(false);
  guardando = signal(false);

  // Filtros
  empresaId = signal<number | null>(null);
  modulosFiltro = signal<number[]>([]);
  grupoFiltro = signal<GrupoTipoParametro[]>([]);

  // Selección / edición
  selectedParam = signal<TipoParametro | null>(null);
  editando = signal(false);
  form!: FormGroup;

  // Drawer de creación y edición (la tabla ocupa toda la pantalla)
  drawer = signal(false);

  // Valor editado directo en la tabla (guardado al salir del campo)
  valorOriginal = signal<string | null>(null);

  /** Parámetros visibles: selección múltiple de módulos + selección de tipos de configuración */
  parametrosVista = computed(() => {
    const mods = this.modulosFiltro();
    const sel = this.grupoFiltro();
    let items = this.parametros();
    if (mods.length) items = items.filter(p => mods.includes(p.moduloId));
    if (sel.length) items = items.filter(p => sel.includes(p.grupo));
    return items;
  });

  ngOnInit() {
    this.form = this.fb.group({
      field: ['', Validators.required],
      descripcion: [''],
      tipo: ['STRING', Validators.required],
      valor: ['', Validators.required],
      grupo: ['CORRELATIVO', Validators.required],
      sn_activo: ['S', Validators.required],
      // Módulo al que pertenece el parámetro nuevo (campo visible del drawer;
      // en edición se usa el módulo del parámetro seleccionado)
      moduloId: [null as number | null],
    });

    // Cargar empresas — los parámetros se cargan cuando la empresa ya existe
    // (antes se llamaba cargarParametros() de forma síncrona y quedaba sin datos)
    this.empresasService.getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.empresas.set(data);
          if (data.length > 0) {
            this.empresaId.set(data[0].empresaId);
            this.cargarParametros();
          }
        },
      });

    // Cargar módulos
    const mods = Object.entries(MODULO_LABELS).map(([id, label]) => ({
      label,
      value: Number(id),
    }));
    this.modulos.set(mods);
  }

  onEmpresaChange(empresaId: number) {
    this.empresaId.set(empresaId);
    this.parametros.set([]);
    this.limpiarSeleccion();
    this.cargarParametros();
  }

  onModulosChange(mids: number[] | null) {
    this.modulosFiltro.set(mids || []);
    this.limpiarSeleccion();
    this.cargarParametros();
  }

  cargarParametros() {
    const eid = this.empresaId();
    const mods = this.modulosFiltro();
    if (!eid) return;

    this.cargando.set(true);
    // 1 módulo seleccionado → filtrado en servidor; varios o ninguno →
    // se traen todos y el filtrado dinámico lo hace parametrosVista()
    this.parametroService.getAll(mods.length === 1 ? mods[0] : undefined)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.parametros.set(data.filter(p => p.empresaId === eid));
          this.cargando.set(false);
        },
        error: () => {
          this.cargando.set(false);
          this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los parámetros' });
        },
      });
  }

  // ── Selección / Edición inline ──────────────────────────

  onRowClick(param: TipoParametro) {
    this.selectedParam.set(param);
    this.cargarForm(param);
    this.drawer.set(true);
  }

  private cargarForm(param: TipoParametro) {
    this.editando.set(true);
    this.form.reset({
      field: param.field,
      descripcion: param.descripcion || '',
      tipo: param.tipo,
      valor: param.valor,
      grupo: param.grupo || 'CORRELATIVO',
      sn_activo: param.sn_activo,
    });
    this.form.get('field')?.disable();
  }

  limpiarSeleccion() {
    this.selectedParam.set(null);
    this.editando.set(false);
    this.form.reset({
      field: '',
      descripcion: '',
      tipo: 'STRING',
      valor: '',
      grupo: 'CORRELATIVO',
      sn_activo: 'S',
      // Precarga con el módulo del filtro superior si hay exactamente uno seleccionado
      moduloId: this.modulosFiltro().length === 1 ? this.modulosFiltro()[0] : null,
    });
    this.form.get('field')?.enable();
  }

  // ── Guardar ─────────────────────────────────────────────

  guardar() {
    if (this.form.invalid) {
      this.msgs.add({ severity: 'warn', summary: 'Aviso', detail: 'Complete los campos requeridos' });
      return;
    }

    const raw = this.form.getRawValue();
    const eid = this.empresaId();
    const paramSel = this.selectedParam();
    // En edición se usa el módulo DEL parámetro (la tabla puede mostrar varios módulos);
    // al crear nuevo, el módulo viene del campo del drawer
    const mid = paramSel ? paramSel.moduloId : raw.moduloId;
    if (!eid) {
      this.msgs.add({ severity: 'warn', summary: 'Aviso', detail: 'Seleccione la empresa en el contexto superior' });
      return;
    }
    if (!mid) {
      this.msgs.add({ severity: 'warn', summary: 'Aviso', detail: 'Seleccione el módulo al que pertenece el parámetro' });
      return;
    }
    if (raw.tipo === 'NUMBER' && (String(raw.valor).trim() === '' || isNaN(Number(raw.valor)))) {
      this.msgs.add({ severity: 'warn', summary: 'Valor inválido', detail: 'El valor debe ser numérico' });
      return;
    }

    this.guardando.set(true);
    this.parametroService.upsert(mid, raw.field, String(raw.valor), raw.tipo, raw.descripcion ?? '', raw.grupo)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.guardando.set(false);
          this.msgs.add({
            severity: 'success',
            summary: paramSel ? 'Actualizado' : 'Creado',
            detail: paramSel ? 'Parámetro actualizado' : 'Parámetro creado',
          });
          this.drawer.set(false);
          this.limpiarSeleccion();
          this.cargarParametros();
        },
        error: () => {
          this.guardando.set(false);
          this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el parámetro' });
        },
      });
  }

  // ── Drawer (crear y editar) ─────────────────────────────

  abrirNuevo() {
    this.limpiarSeleccion();
    this.drawer.set(true);
  }

  onDrawerChange(visible: boolean) {
    this.drawer.set(visible);
    if (!visible) {
      this.limpiarSeleccion();
    }
  }

  // ── Valor editable en la tabla ─────────────────────────

  onValorFocus(param: TipoParametro) {
    this.valorOriginal.set(param.valor);
  }

  onValorEnter(ev: Event) {
    (ev.target as HTMLInputElement | null)?.blur();
  }

  guardarValorInline(param: TipoParametro) {
    const original = this.valorOriginal();
    const nuevo = param.valor;
    if (original === null || nuevo === original) return;

    if (param.tipo === 'NUMBER' && (String(nuevo).trim() === '' || isNaN(Number(nuevo)))) {
      this.msgs.add({ severity: 'warn', summary: 'Valor inválido', detail: 'Este parámetro requiere un valor numérico' });
      param.valor = original;
      return;
    }

    this.guardando.set(true);
    this.parametroService.upsert(param.moduloId, param.field, String(nuevo), param.tipo, param.descripcion ?? '', param.grupo)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.guardando.set(false);
          this.msgs.add({ severity: 'success', summary: 'Guardado', detail: `${param.field} = ${nuevo}` });
          this.cargarParametros();
        },
        error: () => {
          param.valor = original;
          this.guardando.set(false);
          this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el valor' });
        },
      });
  }

  eliminar(param: TipoParametro) {
    this.parametroService.remove(param.ttipoparametrosId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.msgs.add({ severity: 'success', summary: 'Eliminado', detail: 'Parámetro desactivado' });
          if (this.selectedParam()?.ttipoparametrosId === param.ttipoparametrosId) {
            this.limpiarSeleccion();
          }
          this.cargarParametros();
        },
        error: () => {
          this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el parámetro' });
        },
      });
  }

  // ── Helpers ─────────────────────────────────────────────

  moduloLabel(id: number): string {
    return MODULO_LABELS[id] || String(id);
  }

  tipoLabel(tipo: string): string {
    return tipo === 'NUMBER' ? 'Numérico' : 'Texto';
  }

  tipoSeverity(tipo: string): 'success' | 'info' {
    return tipo === 'NUMBER' ? 'success' : 'info';
  }

  grupoLabel(grupo: string): string {
    return GRUPOS_TIPO_PARAMETRO.find(g => g.value === grupo)?.label || grupo || '-';
  }

  grupoSeverity(grupo: string): 'info' | 'warn' | 'success' | 'secondary' | 'contrast' {
    switch (grupo) {
      case 'IMPUESTO': return 'warn';
      case 'INTERES': return 'success';
      case 'IMPRESION': return 'secondary';
      case 'CONTABLE': return 'contrast';
      case 'ASIENTO': return 'info';
      default: return 'info';
    }
  }

  estadoLabel(sn: string): string {
    return sn === 'S' ? 'Activo' : 'Inactivo';
  }

  estadoSeverity(sn: string): 'success' | 'danger' {
    return sn === 'S' ? 'success' : 'danger';
  }
}
