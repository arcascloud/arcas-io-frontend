import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../../core/services/api.service';
import { EmpresasService } from '../../../core/services/empresas.service';
import { Empresa } from '../../../core/models/empresa.models';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface RecalcularResult {
  productos: number;
  registros: number;
  detalle: any[];
}

@Component({
  selector: 'app-recalcular-existencias',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputNumberModule, SelectModule, ToastModule],
  templateUrl: './recalcular-existencias.html',
  styleUrl: './recalcular-existencias.scss',
  providers: [MessageService],
})
export class RecalcularExistencias implements OnInit {
  private api = inject(ApiService);
  private http = inject(HttpClient);
  private empresasService = inject(EmpresasService);
  private msgs = inject(MessageService);

  empresas = signal<Empresa[]>([]);
  selectedEmpresaId = signal<number | null>(null);
  stockInicial = signal<number>(0);
  cargando = signal(false);
  resultado = signal<RecalcularResult | null>(null);

  ngOnInit() {
    this.cargarEmpresas();
  }

  cargarEmpresas() {
    this.empresasService.getAll().subscribe({
      next: (data) => this.empresas.set(data),
      error: () => this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las empresas' }),
    });
  }

  procesar() {
    const empresaId = this.selectedEmpresaId();
    if (!empresaId) {
      this.msgs.add({ severity: 'warn', summary: 'Advertencia', detail: 'Seleccione una empresa' });
      return;
    }

    this.cargando.set(true);
    this.resultado.set(null);

    this.http
      .post<RecalcularResult>(
        `${environment.apiUrl}/inventario/kardex/recalcular?empresaId=${empresaId}&stockInicial=${this.stockInicial()}`,
        {}
      )
      .subscribe({
        next: (res) => {
          this.resultado.set(res);
          this.cargando.set(false);
          this.msgs.add({
            severity: 'success',
            summary: 'Completado',
            detail: `${res.productos} productos, ${res.registros} registros de kardex recalculados`,
          });
        },
        error: (err) => {
          this.cargando.set(false);
          this.msgs.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Error al recalcular existencias' });
        },
      });
  }


  limpiar() {
    this.selectedEmpresaId.set(null);
    this.stockInicial.set(0);
    this.resultado.set(null);
  }
}