import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { SettingsService } from '../../../core/services/settings.service';
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
  ],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private service = inject(SettingsService);
  private msgs = inject(MessageService);

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

    this.cargando.set(true);
    this.service.get(this.config.ruta).subscribe({
      next: (d) => {
        const row = d ?? {};
        for (const c of this.campos) {
          const v = row[c.key];
          if (v !== undefined && v !== null) {
            this.form.get(c.key)?.setValue(v);
          }
        }
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la configuración' });
      },
    });
  }

  guardar() {
    const payload = this.form.getRawValue();
    for (const c of this.campos) {
      if (payload[c.key] === '' || payload[c.key] === null) {
        delete payload[c.key];
      }
    }

    this.guardando.set(true);
    this.service.upsert(this.config.ruta, payload).subscribe({
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