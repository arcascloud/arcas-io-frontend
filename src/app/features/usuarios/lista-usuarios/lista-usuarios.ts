import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { DataViewModule } from 'primeng/dataview';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { UsuariosService } from '../../../core/services/usuarios.service';
import { Usuario } from '../../../core/models/usuario.models';

@Component({
  selector: 'app-lista-usuarios',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DataViewModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TagModule,
    TooltipModule,
  ],
  templateUrl: './lista-usuarios.html',
  styleUrl: './lista-usuarios.scss',
})
export class ListaUsuarios implements OnInit {
  private service = inject(UsuariosService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private msgs = inject(MessageService);

  data = signal<Usuario[]>([]);
  filtered = signal<Usuario[]>([]);
  cargando = signal(false);

  q = signal('');
  estadoFiltro = signal<string | null>(null);

  readonly estadoOptions = [
    { label: 'Todos', value: null },
    { label: 'Activo', value: 'S' },
    { label: 'Inactivo', value: 'N' },
  ];

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
          detail: 'No se pudieron cargar los usuarios',
        });
      },
    });
  }

  filtrar() {
    const q = this.q().toLowerCase();
    const est = this.estadoFiltro();
    this.filtered.set(
      this.data().filter((u) => {
        const matchQ =
          !q ||
          u.usuario.toLowerCase().includes(q) ||
          (u.nombre?.toLowerCase().includes(q) ?? false) ||
          (u.email?.toLowerCase().includes(q) ?? false);
        const matchEst = !est || u.sn_activo === est;
        return matchQ && matchEst;
      }),
    );
  }

  buscar() {
    this.filtrar();
  }

  limpiarFiltros() {
    this.q.set('');
    this.estadoFiltro.set(null);
    this.filtrar();
  }

  nuevo() {
    this.router.navigate(['nuevo'], { relativeTo: this.route });
  }

  editar(usuario: string, e?: Event) {
    e?.stopPropagation();
    this.router.navigate(['editar', usuario], { relativeTo: this.route });
  }

  activoLbl(sn: string): string {
    return sn === 'S' ? 'Activo' : 'Inactivo';
  }

  activoSev(sn: string): 'success' | 'danger' {
    return sn === 'S' ? 'success' : 'danger';
  }
}