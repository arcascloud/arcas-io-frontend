import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { DataViewModule } from 'primeng/dataview';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { UsuariosModuleService } from '../../../core/services/usuarios-module.service';
import { ModulosService } from '../../../core/services/modulos.service';
import { UsuariosModule } from '../../../core/models/usuario.models';

@Component({
  selector: 'app-usuario-modulos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DataViewModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    TooltipModule,
  ],
  templateUrl: './usuario-modulos.html',
  styleUrl: './usuario-modulos.scss',
})
export class UsuarioModulos implements OnInit {
  private service = inject(UsuariosModuleService);
  private modulosService = inject(ModulosService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private msgs = inject(MessageService);
  private confirm = inject(ConfirmationService);

  data = signal<UsuariosModule[]>([]);
  filtered = signal<UsuariosModule[]>([]);
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
          detail: 'No se pudieron cargar las asignaciones',
        });
      },
    });
  }

  filtrar() {
    const q = this.q().toLowerCase();
    this.filtered.set(
      this.data().filter((i) => {
        return (
          !q ||
          i.usuario.toLowerCase().includes(q) ||
          this.getModuloName(i.moduloId).toLowerCase().includes(q)
        );
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

  eliminar(item: UsuariosModule, e?: Event) {
    e?.stopPropagation();
    this.confirm.confirm({
      message: `¿Eliminar la asignación del módulo "${this.getModuloName(item.moduloId)}" al usuario "${item.usuario}"?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.service.delete(item.tusuariosmoduloId).subscribe({
          next: () => {
            this.msgs.add({
              severity: 'success',
              summary: 'Eliminado',
              detail: 'Asignación eliminada correctamente',
            });
            this.load();
          },
          error: () => {
            this.msgs.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo eliminar la asignación',
            });
          },
        });
      },
    });
  }

  getModuloName(id: number): string {
    return this.modulosMap.get(id) ?? `#${id}`;
  }

  snLbl(sn: string): string {
    return sn === 'S' ? 'Sí' : 'No';
  }

  snSev(sn: string): 'success' | 'danger' {
    return sn === 'S' ? 'success' : 'danger';
  }

  activoLbl(sn: string): string {
    return sn === 'S' ? 'Activo' : 'Inactivo';
  }

  activoSev(sn: string): 'success' | 'danger' {
    return sn === 'S' ? 'success' : 'danger';
  }
}