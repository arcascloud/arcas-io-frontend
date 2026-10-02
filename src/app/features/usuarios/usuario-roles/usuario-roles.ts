import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { UsuarioRolesService } from '../../../core/services/usuario-roles.service';
import { UsuarioRol } from '../../../core/models/usuario.models';

@Component({
  selector: 'app-usuario-roles',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule, TagModule, TooltipModule],
  providers: [MessageService, ConfirmationService],
  templateUrl: './usuario-roles.html',
  styleUrl: './usuario-roles.scss',
})
export class UsuarioRolesPage implements OnInit {
  private service = inject(UsuarioRolesService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private msgs = inject(MessageService);
  private confirm = inject(ConfirmationService);

  data = signal<UsuarioRol[]>([]);
  filtered = signal<UsuarioRol[]>([]);
  cargando = signal(false);

  q = signal('');

  ngOnInit() {
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
          detail: 'No se pudieron cargar los roles de usuario',
        });
      },
    });
  }

  filtrar() {
    const q = this.q().toLowerCase();
    this.filtered.set(
      this.data().filter((r) => {
        if (!q) return true;
        return (
          (r.nombreUsuario ?? '').toLowerCase().includes(q) ||
          (r.loginUsuario ?? '').toLowerCase().includes(q) ||
          r.rol.toLowerCase().includes(q)
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

  eliminar(item: UsuarioRol, e?: Event) {
    e?.stopPropagation();
    this.confirm.confirm({
      message: `¿Quitar el rol "${item.rol}" al usuario "${item.loginUsuario || item.usuarioId}"? Esta acción no se puede deshacer.`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.service.delete(item.rol_id).subscribe({
          next: () => {
            this.msgs.add({
              severity: 'success',
              summary: 'Eliminado',
              detail: 'Rol removido correctamente',
            });
            this.load();
          },
          error: (err) => {
            this.msgs.add({
              severity: 'error',
              summary: 'Error',
              detail: err.error?.message || 'No se pudo eliminar el rol',
            });
          },
        });
      },
    });
  }

  /** Severidad visual del tag según el rol */
  severidadRol(rol: string): 'danger' | 'warn' | 'info' | 'secondary' {
    switch (rol) {
      case 'admin':
        return 'danger';
      case 'supervisor':
        return 'warn';
      case 'contador':
        return 'info';
      default:
        return 'secondary';
    }
  }
}
