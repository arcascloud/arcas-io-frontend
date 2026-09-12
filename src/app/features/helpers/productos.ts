import { Component, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InfoHelper } from './info';
import { ProductosService } from '../../core/services/productos.service';
import { Producto } from '../../core/models/inventario.models';

@Component({
  providers: [DialogService, MessageService, ProductosService],
  standalone: true,
  imports: [TableModule, ButtonModule, FormsModule, InputTextModule],
  template: `
    <p-table
      dataKey="produtoId"
      [value]="productosFiltrados()"
      responsiveLayout="scroll"
       [filterDelay]="200"
      [rows]="5"
      [paginator]="true"
    >
      <ng-template pTemplate="header">
        <tr>
          <th pSortableColumn="codbarra">
            <div class="flex align-items-center gap-2">
              Código
              <p-sortIcon field="codbarra"></p-sortIcon>
            </div>
          </th>
          <th pSortableColumn="descripcion">
            <div class="flex align-items-center gap-2">
              Descripción
              <p-sortIcon field="descripcion"></p-sortIcon>
            </div>
          </th>
          <th pSortableColumn="precioventa" style="width: 12rem" class="text-right">
            <div class="flex align-items-center justify-content-end gap-2">
              Precio Venta
              <p-sortIcon field="precioventa"></p-sortIcon>
            </div>
          </th>
          <th style="width: 4em"></th>
        </tr>
        <tr class="filtros-row">
          <th>
            <input
              pInputText
              type="text"
              [ngModel]="filtroCodbarra()"
              (ngModelChange)="filtroCodbarra.set($event)"
              placeholder="Filtrar código"
              class="w-full"
            />
          </th>
          <th>
            <input
              pInputText
              type="text"
              [ngModel]="filtroDescripcion()"
              (ngModelChange)="filtroDescripcion.set($event)"
              placeholder="Filtrar descripción"
              class="w-full"
            />
          </th>
          <th></th>
          <th></th>
        </tr>
      </ng-template>

      <ng-template pTemplate="body" let-product>
        <tr (click)="selectProduct(product)" class="row-selectable">
          <td>{{ product.codbarra }}</td>
          <td>{{ product.descripcion }}</td>
          <td class="text-right">{{ product.precioventa }}</td>
          <td>
            <p-button
              type="button"
              [text]="true"
              [rounded]="true"
              severity="success"
              icon="pi pi-chevron-circle-right"
              (click)="selectProduct(product); $event.stopPropagation()"
            />
          </td>
        </tr>
      </ng-template>
      <ng-template pTemplate="emptymessage">
        <tr>
          <td colspan="4" class="text-center p-3">Sin resultados</td>
        </tr>
      </ng-template>
    </p-table>
  `,
})
export class ProductosHelperList implements OnInit {
  products = signal<Producto[]>([]);

  filtroCodbarra = signal('');
  filtroDescripcion = signal('');

  productosFiltrados = computed(() => {
    const cod = this.filtroCodbarra().toLowerCase().trim();
    const desc = this.filtroDescripcion().toLowerCase().trim();
    return this.products().filter(
      (p) =>
        (!cod || (p.codbarra ?? '').toLowerCase().includes(cod)) &&
        (!desc || (p.descripcion ?? '').toLowerCase().includes(desc)),
    );
  });

  constructor(
    private productService: ProductosService,
    private dialogService: DialogService,
    private ref: DynamicDialogRef,
  ) {}

  ngOnInit() {
    this.productService.getAll().subscribe({
      next: (products: Producto[]) => {
        this.products.set(products);
      },
      error: (error) => {
        console.error('Error al cargar productos', error);
      },
    });
  }

  selectProduct(product: Producto) {
    this.ref.close(product);
  }

  showInfo() {
    this.dialogService.open(InfoHelper, {
      header: 'Información',
      modal: true,
      dismissableMask: true,
      data: {
        totalItems: this.products().length,
      },
    });
  }

  closeDialog(data) {
    this.ref.close(data);
  }
}
