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
import { UsuarioModAuthService } from '../../../core/services/usuario-modauth.service';
import { UsuarioModAuth } from '../../../core/models/usuario.models';

@Component({
  selector: 'app-usuario-modauth',
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
  templateUrl: './usuario-modauth.html',
  styleUrl: './usuario-modauth.scss',
})
export class UsuarioModAuthPage implements OnInit {
  private service = inject(UsuarioModAuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private msgs = inject(MessageService);
  private confirm = inject(ConfirmationService);

  data = signal<UsuarioModAuth[]>([]);
  filtered = signal<UsuarioModAuth[]>([]);
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
          detail: 'No se pudieron cargar los permisos',
        });
      },
    });
  }

  filtrar() {
    const q = this.q().toLowerCase();
    this.filtered.set(
      this.data().filter((p) => {
        return !q || p.usuario.toLowerCase().includes(q);
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

  eliminar(item: UsuarioModAuth, e?: Event) {
    e?.stopPropagation();
    this.confirm.confirm({
      message: `¿Eliminar los permisos del usuario "${item.usuario}"? Esta acción no se puede deshacer.`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.service.delete(item.usuariomodauthId).subscribe({
          next: () => {
            this.msgs.add({
              severity: 'success',
              summary: 'Eliminado',
              detail: 'Permisos eliminados correctamente',
            });
            this.load();
          },
          error: () => {
            this.msgs.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudieron eliminar los permisos',
            });
          },
        });
      },
    });
  }

  snLbl(sn: string): string {
    return sn === 'S' ? 'Sí' : 'No';
  }

  snSev(sn: string): 'success' | 'danger' {
    return sn === 'S' ? 'success' : 'danger';
  }
}