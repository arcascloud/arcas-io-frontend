import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { DataViewModule } from 'primeng/dataview';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { UsuariosScriptsService } from '../../../core/services/usuarios-scripts.service';
import { UsuariosScripts } from '../../../core/models/usuario.models';

@Component({
  selector: 'app-usuario-scripts',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DataViewModule,
    ButtonModule,
    InputTextModule,
    TooltipModule,
  ],
  templateUrl: './usuario-scripts.html',
  styleUrl: './usuario-scripts.scss',
})
export class UsuarioScripts implements OnInit {
  private service = inject(UsuariosScriptsService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private msgs = inject(MessageService);
  private confirm = inject(ConfirmationService);

  data = signal<UsuariosScripts[]>([]);
  filtered = signal<UsuariosScripts[]>([]);
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
          detail: 'No se pudieron cargar los scripts',
        });
      },
    });
  }

  filtrar() {
    const q = this.q().toLowerCase();
    this.filtered.set(
      this.data().filter((s) => {
        return (
          !q ||
          s.usuario.toLowerCase().includes(q) ||
          s.script.toLowerCase().includes(q)
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

  eliminar(item: UsuariosScripts, e?: Event) {
    e?.stopPropagation();
    this.confirm.confirm({
      message: `¿Eliminar el script "${item.script}" de "${item.usuario}"? Esta acción no se puede deshacer.`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.service.delete(item.tusuarioscriptsId).subscribe({
          next: () => {
            this.msgs.add({
              severity: 'success',
              summary: 'Eliminado',
              detail: 'Script eliminado correctamente',
            });
            this.load();
          },
          error: () => {
            this.msgs.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo eliminar el script',
            });
          },
        });
      },
    });
  }
}