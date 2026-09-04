import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../../core/services/api.service';
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
export class CatalogoForm implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(CatalogoParametrosService);
  private api = inject(ApiService);
  private msgs = inject(MessageService);

  config!: CatalogoConfig;
  campos: CampoCatalogo[] = [];

  esEdicion = signal(false);
  cargando = signal(false);
  guardando = signal(false);
  titulo = signal('');

  opcionesMap = signal<Record<string, { label: string; value: any }[]>>({});

  readonly snOptions = [
    { label: 'Activo', value: 'S' },
    { label: 'Inactivo', value: 'N' },
  ];

  private itemId = 0;

  form!: FormGroup;

  ngOnInit() {
    const nombre =
      this.route.snapshot.data['nombre'] ?? this.route.snapshot.paramMap.get('nombre') ?? '';
    const id = this.route.snapshot.paramMap.get('id') ?? '';

    this.config = CATALOGOS_PARAMETROS[nombre];
    if (!this.config) {
      this.msgs.add({ severity: 'error', summary: 'Error', detail: `Catálogo desconocido: ${nombre}` });
      return;
    }
    this.campos = this.config.campos;
    this.titulo.set(this.esNuevo(id) ? `Nuevo ${this.config.titulo.slice(0, -1)}` : `Editar ${this.config.titulo.slice(0, -1)}`);
    this.buildForm();
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
          this.cargando.set(false);
        },
        error: () => {
          this.cargando.set(false);
          this.msgs.add({ severity: 'error', summary: 'Error', detail: 'Registro no encontrado' });
          this.volver();
        },
      });
    }
  }

  private esNuevo(id: string): boolean {
    return !id || id === 'nuevo';
  }

  private cargarOpciones() {
    for (const c of this.campos) {
      if (c.cargaOpciones) {
        this.api.get<any[]>(c.cargaOpciones.url).subscribe({
          next: (items) => {
            const opts = (items ?? []).map((i) => ({
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
  }

  invalid(ctrl: string): boolean {
    const c = this.form.get(ctrl);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  volver() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
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