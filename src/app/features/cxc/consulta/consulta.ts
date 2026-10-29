import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DataViewModule } from 'primeng/dataview';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../../core/services/api.service';

export interface ConsultaConfig {
  nombre: string;
  titulo: string;
  subtitulo?: string;
  ruta: string;
  idKey: string;
  excluir?: string[];
}

const CAMPOS_AUDITORIA = [
  'usuarioCreated',
  'usuarioUpdated',
  'fechaUpdated',
];

@Component({
  selector: 'app-consulta',
  standalone: true,
  imports: [CommonModule, FormsModule, DataViewModule, ButtonModule, InputTextModule, TooltipModule],
  templateUrl: './consulta.html',
  styleUrl: './consulta.scss',
})
export class Consulta implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private msgs = inject(MessageService);

  config!: ConsultaConfig;

  data = signal<any[]>([]);
  filtered = signal<any[]>([]);
  cargando = signal(false);

  q = signal('');

  ngOnInit() {
    this.config = this.route.snapshot.data['consulta'];
    if (!this.config) {
      this.msgs.add({ severity: 'error', summary: 'Error', detail: 'Consulta no configurada' });
      return;
    }
    this.load();
  }

  load() {
    this.cargando.set(true);
    this.api.get<any[]>(this.config.ruta).subscribe({
      next: (res) => {
        this.data.set(res ?? []);
        this.filtrar();
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: `No se pudieron cargar ${this.config.titulo}` });
      },
    });
  }

  campos(item: any): { label: string; value: any }[] {
    const excluir = new Set([...CAMPOS_AUDITORIA, this.config.idKey, ...(this.config.excluir ?? [])]);
    return Object.entries(item ?? {})
      .filter(([k, v]) => !excluir.has(k) && v !== null && v !== undefined)
      .map(([k, v]) => ({ label: k, value: this.formatear(v) }));
  }

  private formatear(v: any): any {
    if (v instanceof Date || (typeof v === 'string' && !isNaN(Date.parse(v)) && v.includes('T'))) {
      return new Date(v).toLocaleString();
    }
    if (typeof v === 'number') {
      return Number.isInteger(v) ? v : v.toLocaleString('es-HN');
    }
    return v;
  }

  filtrar() {
    const q = this.q().toLowerCase();
    this.filtered.set(
      this.data().filter((i) => {
        if (!q) return true;
        return JSON.stringify(i).toLowerCase().includes(q);
      }),
    );
  }

  buscar() {
    this.filtrar();
  }

  limpiarFiltros() {
    this.q.set('');
    this.filtrar();
  }
}