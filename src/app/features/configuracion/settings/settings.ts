import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import { ParametroUnificadoService } from '../../../core/services/parametro-unificado.service';
import { SETTINGS, SettingsConfig, CampoSetting } from '../../../core/models/settings.models';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    ProgressSpinnerModule,
  ],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private parametroService = inject(ParametroUnificadoService);
  private msgs = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  config!: SettingsConfig;
  campos: CampoSetting[] = [];

  cargando = signal(false);
  guardando = signal(false);

  form!: FormGroup;

  ngOnInit() {
    const nombre = this.route.snapshot.paramMap.get('tipo') ?? '';
    this.config = SETTINGS[nombre];
    if (!this.config) {
      this.msgs.add({ severity: 'error', summary: 'Error', detail: 'Configuración no encontrada' });
      return;
    }
    this.campos = this.config.campos;

    const controls: Record<string, any> = {};
    for (const c of this.campos) {
      controls[c.key] = [''];
    }
    this.form = this.fb.group(controls);

    this.cargarParametros();
  }

  private cargarParametros() {
    this.cargando.set(true);

    if (this.config.moduloId) {
      // Tabla unificada ttipoparametros
      this.parametroService.getAsObject(this.config.moduloId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (obj) => {
            for (const c of this.campos) {
              const v = obj[c.key];
              if (v !== undefined && v !== null) {
                this.form.get(c.key)?.setValue(c.tipo === 'numero' ? Number(v) : v);
              }
            }
            this.cargando.set(false);
          },
          error: () => {
            this.cargando.set(false);
            this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la configuración' });
          },
        });
    } else {
      this.cargando.set(false);
    }
  }

  guardar() {
    if (!this.config.moduloId) {
      this.msgs.add({ severity: 'warn', summary: 'Aviso', detail: 'No hay módulo configurado para guardar' });
      return;
    }

    const payload = this.form.getRawValue();
    const parametros: { field: string; valor: string; tipo: string }[] = [];

    for (const c of this.campos) {
      const v = payload[c.key];
      if (v !== undefined && v !== null && v !== '') {
        parametros.push({
          field: c.key,
          valor: String(v),
          tipo: c.tipo === 'numero' ? 'NUMBER' : 'STRING',
        });
      }
    }

    if (parametros.length === 0) return;

    this.guardando.set(true);
    this.parametroService.upsertLote(this.config.moduloId, parametros)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.guardando.set(false);
          this.msgs.add({ severity: 'success', summary: 'Guardado', detail: 'Configuración actualizada' });
        },
        error: () => {
          this.guardando.set(false);
          this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la configuración' });
        },
      });
  }
}
