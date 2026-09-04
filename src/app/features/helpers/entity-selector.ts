import { Component, OnInit, signal, Input } from '@angular/core';
import { MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef, DynamicDialog } from 'primeng/dynamicdialog';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { FooterHelper } from './footer';

export interface EntityColumn {
  key: string;
  label: string;
  format?: (item: any) => string;
}

export interface EntitySelectorConfig {
  titulo: string;
  columns: EntityColumn[];
  loadData: () => Promise<any[]> | any;
  onSelect?: (item: any) => void;
}

@Component({
  providers: [MessageService],
  standalone: true,
  imports: [TableModule, ButtonModule, InputTextModule, FormsModule],
  template: `
    <div class="mb-3">
      <input pInputText [(ngModel)]="q" (keyup.enter)="buscar()" placeholder="Buscar..." class="w-full" />
    </div>
    <p-table
      [value]="items()"
      [rows]="10"
      [paginator]="true"
      responsiveLayout="scroll"
    >
      <ng-template pTemplate="header">
        <tr>
          @for (col of columns; track col.key) {
            <th>{{ col.label }}</th>
          }
          <th style="width:4em"></th>
        </tr>
      </ng-template>
      <ng-template pTemplate="body" let-item>
        <tr>
          @for (col of columns; track col.key) {
            <td>{{ col.format ? col.format(item) : item[col.key] }}</td>
          }
          <td>
            <p-button
              type="button"
              [text]="true"
              [rounded]="true"
              icon="pi pi-plus"
              (onClick)="selectItem(item)"
            />
          </td>
        </tr>
      </ng-template>
    </p-table>
  `,
})
export class EntitySelectorHelper implements OnInit {
  @Input() config!: EntitySelectorConfig;

  items = signal<any[]>([]);
  allItems: any[] = [];
  columns: EntityColumn[] = [];
  q = '';

  instance: DynamicDialog | undefined;

  constructor(
    private dialogService: DialogService,
    private ref: DynamicDialogRef
  ) {}

  ngOnInit() {
    this.instance = this.dialogService.getInstance(this.ref);
    if (this.instance?.data) {
      this.config = this.instance.data['config'];
    }
    this.columns = this.config?.columns ?? [];

    const result = this.config?.loadData();
    if (result instanceof Promise) {
      result.then((data) => this.setItems(data));
    } else if (result) {
      if (Array.isArray(result)) {
        this.setItems(result);
      } else if (result.subscribe) {
        result.subscribe((data: any) => this.setItems(data));
      }
    }
  }

  private setItems(data: any[]) {
    this.allItems = data ?? [];
    this.items.set(this.allItems);
  }

  buscar() {
    const term = this.q.toLowerCase().trim();
    if (!term) {
      this.items.set(this.allItems);
      return;
    }
    this.items.set(
      this.allItems.filter((item) =>
        this.columns.some((col) => {
          const val = String(item[col.key] ?? '').toLowerCase();
          return val.includes(term);
        })
      )
    );
  }

  selectItem(item: any) {
    this.config?.onSelect?.(item);
    this.ref.close(item);
  }

  closeDialog(data: any) {
    this.ref.close(data);
  }
}
