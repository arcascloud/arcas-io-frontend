import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { DataViewModule } from 'primeng/dataview';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { UsuariosMnuItemService } from '../../../core/services/usuarios-mnuitem.service';
import { ModulosService } from '../../../core/services/modulos.service';
import { UsuariosMnuItem } from '../../../core/models/usuario.models';

@Component({
  selector: 'app-usuario-mnuitem',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DataViewModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    TooltipModule,
  ],
  templateUrl: './usuario-mnuitem.html',
  styleUrl: './usuario-mnuitem.scss',
})
export class UsuarioMnuItem implements OnInit {
  private service = inject(UsuariosMnuItemService);
  private modulosService = inject(ModulosService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private msgs = inject(MessageService);
  private confirm = inject(ConfirmationService);

  data = signal<UsuariosMnuItem[]>([]);
  filtered = signal<UsuariosMnuItem[]>([]);
  cargando = signal(false);

  q = signal('');
  private modulosMap = new Map<number, string>();

  ngOnInit() {
    this.modulosService.getAll().subscribe({
      next: (d) => d.forEach((m) => this.modulosMap.set(m.moduloId, m.descripcion)),
    });
    this.load();
  }

  load() {
    this.cargando.set(true);
    this.service.getAll().subscribe({
      next: (res) => {
        this.data.set(res);
        this.filtrar();
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.msgs.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los items',
        });
      },
    });
  }

  filtrar() {
    const q = this.q().toLowerCase();
    this.filtered.set(
      this.data().filter((i) => {
        const text = [
          i.usuario,
          i.nameItem,
          i.labelItem,
          i.routerLink ?? '',
          this.getModuloName(i.moduloId),
        ]
          .join(' ')
          .toLowerCase();
        return !q || text.includes(q);
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

  nuevo() {
    this.router.navigate(['nuevo'], { relativeTo: this.route });
  }

  editar(id?: number, e?: Event) {
    e?.stopPropagation();
    if (!id) return;
    this.router.navigate(['editar', id], { relativeTo: this.route });
  }

  eliminar(item: UsuariosMnuItem, e?: Event) {
    e?.stopPropagation();
    this.confirm.confirm({
      message: `¿Eliminar el item "${item.labelItem}" (${item.usuario})? Esta acción no se puede deshacer.`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.service.delete(item.tusuariomnuitemsId).subscribe({
          next: () => {
            this.msgs.add({
              severity: 'success',
              summary: 'Eliminado',
              detail: 'Item eliminado correctamente',
            });
            this.load();
          },
          error: () => {
            this.msgs.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo eliminar el item',
            });
          },
        });
      },
    });
  }

  getModuloName(id: number): string {
    return this.modulosMap.get(id) ?? `#${id}`;
  }

  activoLbl(sn: string): string {
    return sn === 'S' ? 'Activo' : 'Inactivo';
  }

  activoSev(sn: string): 'success' | 'danger' {
    return sn === 'S' ? 'success' : 'danger';
  }
}