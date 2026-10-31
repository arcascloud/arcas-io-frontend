import { Component, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InfoHelper } from './info';
import { ProductosService } from '../../core/services/productos.service';
import { Producto, ProductoImg } from '../../core/models/inventario.models';

@Component({
  providers: [DialogService, MessageService, ProductosService],
  standalone: true,
  imports: [TableModule, ButtonModule, FormsModule, InputTextModule],
  styles: [
    `
      .img-cell {
        text-align: center;
      }
      .img-cell img {
        width: 4.5rem;
        height: 4.5rem;
        object-fit: cover;
        border-radius: 8px;
        border: 1px solid var(--c-border, #e2e8f0);
        background: var(--c-surface-ground, #f8fafc);
        display: block;
        margin: 0 auto;
      }
      .img-cell .img-placeholder {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 4.5rem;
        height: 4.5rem;
        border-radius: 8px;
        border: 1px dashed var(--c-border, #e2e8f0);
        color: var(--c-text-muted, #64748b);
        font-size: 1.4rem;
      }
      ::ng-deep .p-datatable-tbody > tr > td {
        vertical-align: middle;
      }
    `,
  ],
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
          <th style="width: 6rem">Imagen</th>
          <th pSortableColumn="descripcion">
            <div class="flex align-items-center gap-2">
              Descripción
              <p-sortIcon field="descripcion"></p-sortIcon>
            </div>
          </th>
          <th pSortableColumn="codbarra">
            <div class="flex align-items-center gap-2">
              Código
              <p-sortIcon field="codbarra"></p-sortIcon>
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
          <th></th>
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
          <th></th>
          <th></th>
        </tr>
      </ng-template>

      <ng-template pTemplate="body" let-product>
        <tr (click)="selectProduct(product)" class="row-selectable">
          <td class="img-cell">
            @if (imagenDe(product)) {
              <img [src]="imagenDe(product)" [alt]="product.descripcion" loading="lazy" />
            } @else {
              <span class="img-placeholder"><i class="pi pi-image"></i></span>
            }
          </td>
          <td>{{ product.descripcion }}</td>
          <td>{{ product.codbarra }}</td>
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
          <td colspan="5" class="text-center p-3">Sin resultados</td>
        </tr>
      </ng-template>
    </p-table>
  `,
})
export class ProductosHelperList implements OnInit {
  products = signal<Producto[]>([]);

  /** Map productoId → imagen dataURL (de /inventario/productos-img).
   *  Debe ser signal para que la tabla redibuje al llegar (ARFM20261030). */
  private imagenesMap = signal<Map<number, string>>(new Map());

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

    // Imágenes de productos (ARFM20261030): solo activas, 1ª por producto
    this.productService.getImgAll().subscribe({
      next: (items: ProductoImg[]) => {
        const m = new Map<number, string>(this.imagenesMap());
        for (const i of items ?? []) {
          const id = Number(i.productoId);
          if (i.sn_activo === 'S' && i.img && !m.has(id)) {
            m.set(id, this.resolverImagen(i.img));
          }
        }
        this.imagenesMap.set(m);
      },
      error: (error) => {
        console.error('Error al cargar imágenes de productos', error);
      },
    });
  }

  /** Imagen del producto para la tabla (dataURL) o '' si no tiene */
  imagenDe(product: Producto): string {
    return this.imagenesMap().get(Number(product.produtoId)) ?? '';
  }

  private resolverImagen(img: string): string {
    return /^data:/i.test(img) ? img : `data:image/png;base64,${img}`;
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
