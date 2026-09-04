import { Component, OnInit, signal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { CxcService } from '../../core/services/cxc.service';
import { CxcCliente } from '../../core/models/cxc.models';
import { FooterHelper } from './footer';

@Component({
  providers: [DialogService, MessageService, CxcService],
  standalone: true,
  imports: [TableModule, ButtonModule, InputTextModule, FormsModule],
  template: `
    <div class="mb-3">
      <input pInputText [(ngModel)]="q" (keyup.enter)="buscar()" placeholder="Buscar cliente..." class="w-full" />
    </div>
    <p-table
      [value]="clientes()"
      [rows]="10"
      [paginator]="true"
      responsiveLayout="scroll"
      [tableStyle]="{ 'min-width': '40rem' }"
    >
      <ng-template pTemplate="header">
        <tr>
          <th>Nro.</th>
          <th>Nombre</th>
          <th>DNI</th>
          <th>RTN</th>
          <th style="width:4em"></th>
        </tr>
      </ng-template>
      <ng-template pTemplate="body" let-cliente>
        <tr>
          <td>{{ cliente.nrocliente }}</td>
          <td>{{ cliente.nombres }} {{ cliente.apellidos }}</td>
          <td>{{ cliente.dni }}</td>
          <td>{{ cliente.rtn }}</td>
          <td>
            <p-button
              type="button"
              [text]="true"
              [rounded]="true"
              icon="pi pi-plus"
              (onClick)="selectCliente(cliente)"
            />
          </td>
        </tr>
      </ng-template>
    </p-table>
  `,
})
export class ClientesHelperList implements OnInit {
  clientes = signal<CxcCliente[]>([]);
  allClientes = signal<CxcCliente[]>([]);
  q = '';

  constructor(
    private cxcService: CxcService,
    private ref: DynamicDialogRef
  ) {}

  ngOnInit() {
    this.cxcService.getClientes(1, 500).subscribe({
      next: (res) => {
        this.allClientes.set(res.data);
        this.clientes.set(res.data);
      },
    });
  }

  buscar() {
    const term = this.q.toLowerCase().trim();
    if (!term) {
      this.clientes.set(this.allClientes());
      return;
    }
    this.clientes.set(
      this.allClientes().filter(
        (c) =>
          (c.nrocliente ?? '').toLowerCase().includes(term) ||
          (c.nombres ?? '').toLowerCase().includes(term) ||
          (c.apellidos ?? '').toLowerCase().includes(term) ||
          (c.dni ?? '').toLowerCase().includes(term) ||
          (c.rtn ?? '').toLowerCase().includes(term)
      )
    );
  }

  selectCliente(cliente: CxcCliente) {
    this.ref.close(cliente);
  }

  closeDialog(data: any) {
    this.ref.close(data);
  }
}
