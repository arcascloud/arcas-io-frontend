import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { FieldsetModule } from 'primeng/fieldset';
import { MessageService } from 'primeng/api';
import { EmpresasService } from '../../../core/services/empresas.service';
import { ParametroUnificadoService } from '../../../core/services/parametro-unificado.service';
import { AuthService } from '../../../core/services/auth.service';
import { TipoParametro, MODULO_LABELS } from '../../../core/models/parametro-unificado.model';
import { Empresa } from '../../../core/models/empresa.models';
import { Sucursal } from '../../../core/models/sucursal.models';

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
    TagModule,
    DialogModule,
    FieldsetModule,
  ],
  templateUrl: './param-manager-modulos.html',
  styleUrl: './param-manager-modulos.scss',
})
export class ParamManagerModulos implements OnInit {
  private fb = inject(FormBuilder);
  private empresasService = inject(EmpresasService);
  private parametroService = inject(ParametroUnificadoService);
  private auth = inject(AuthService);
  private msgs = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  // Datos de selects
  empresas = signal<Empresa[]>([]);
  sucursales = signal<Sucursal[]>([]);
  modulos = signal<{ label: string; value: number }[]>([]);

  // Estado
  parametros = signal<TipoParametro[]>([]);
  cargando = signal(false);
  guardando = signal(false);

  // Filtros
  empresaId = signal<number | null>(null);
  sucursalId = signal<number | null>(null);
  moduloId = signal<number | null>(null);

  // Dialog
  dialogVisible = signal(false);
  editando = signal(false);
  parametroId = signal<number | null>(null);
  form!: FormGroup;

  ngOnInit() {
    this.form = this.fb.group({
      field: ['', Validators.required],
      tipo: ['STRING', Validators.required],
      valor: ['', Validators.required],
      sn_activo: ['S', Validators.required],
    });

    // Cargar empresas
    this.empresasService.getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.empresas.set(data);
          // Auto-seleccionar primera empresa
          if (data.length > 0) {
            this.empresaId.set(data[0].empresaId);
            this.cargarSucursales(data[0].empresaId);
          }
        },
      });

    // Cargar módulos
    const mods = Object.entries(MODULO_LABELS).map(([id, label]) => ({
      label,
      value: Number(id),
    }));
    this.modulos.set(mods);

    // Pre-cargar parámetros si ya hay empresa
    if (this.empresaId()) {
      this.cargarParametros();
    }
  }

  cargarSucursales(empresaId: number) {
    this.empresasService.getAllSucursales(empresaId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.sucursales.set(data);
          if (data.length > 0) {
            this.sucursalId.set(data[0].idsucursal);
          }
        },
      });
  }

  onEmpresaChange(empresaId: number) {
    this.empresaId.set(empresaId);
    this.sucursalId.set(null);
    this.parametros.set([]);
    this.cargarSucursales(empresaId);
  }

  onModuloChange(moduloId: number) {
    this.moduloId.set(moduloId);
    this.cargarParametros();
  }

  cargarParametros() {
    const eid = this.empresaId();
    const mid = this.moduloId();
    if (!eid) return;

    this.cargando.set(true);
    const params: Record<string, string> = {};
    if (mid) params['moduloId'] = String(mid);

    this.parametroService.getAll(mid || undefined)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          // Filtrar por empresaId del lado del cliente
          this.parametros.set(data.filter(p => p.empresaId === eid));
          this.cargando.set(false);
        },
        error: () => {
          this.cargando.set(false);
          this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los parámetros' });
        },
      });
  }

  // ── Dialog ──────────────────────────────────────────────

  nuevo() {
    this.editando.set(false);
    this.parametroId.set(null);
    this.form.reset({
      field: '',
      tipo: 'STRING',
      valor: '',
      sn_activo: 'S',
    });
    this.dialogVisible.set(true);
  }

  editar(param: TipoParametro) {
    this.editando.set(true);
    this.parametroId.set(param.ttipoparametrosId);
    this.form.reset({
      field: param.field,
      tipo: param.tipo,
      valor: param.valor,
      sn_activo: param.sn_activo,
    });
    this.form.get('field')?.disable();
    this.dialogVisible.set(true);
  }

  guardar() {
    if (this.form.invalid) return;

    const eid = this.empresaId();
    const mid = this.moduloId();
    if (!eid || !mid) {
      this.msgs.add({ severity: 'warn', summary: 'Aviso', detail: 'Seleccione empresa y módulo' });
      return;
    }

    const raw = this.form.getRawValue();
    this.guardando.set(true);

    this.parametroService.upsert(mid, raw.field, raw.valor, raw.tipo)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.guardando.set(false);
          this.dialogVisible.set(false);
          this.msgs.add({ severity: 'success', summary: 'Guardado', detail: 'Parámetro actualizado' });
          this.cargarParametros();
        },
        error: () => {
          this.guardando.set(false);
          this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el parámetro' });
        },
      });
  }

  eliminar(param: TipoParametro) {
    this.parametroService.remove(param.ttipoparametrosId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.msgs.add({ severity: 'success', summary: 'Eliminado', detail: 'Parámetro desactivado' });
          this.cargarParametros();
        },
        error: () => {
          this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el parámetro' });
        },
      });
  }

  // ── Helpers ─────────────────────────────────────────────

  usuarioActual(): string {
    return this.auth.currentUser()?.usuario || '';
  }

  moduloLabel(id: number): string {
    return MODULO_LABELS[id] || String(id);
  }

  tipoLabel(tipo: string): string {
    return tipo === 'NUMBER' ? 'Numérico' : 'Texto';
  }

  tipoSeverity(tipo: string): 'success' | 'info' {
    return tipo === 'NUMBER' ? 'success' : 'info';
  }

  estadoLabel(sn: string): string {
    return sn === 'S' ? 'Activo' : 'Inactivo';
  }

  estadoSeverity(sn: string): 'success' | 'danger' {
    return sn === 'S' ? 'success' : 'danger';
  }
}
