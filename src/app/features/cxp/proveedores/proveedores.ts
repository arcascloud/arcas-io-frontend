import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { CxpService } from '../../../core/services/cxp.service';
import { Proveedor } from '../../../core/models/inventario.models';

@Component({
  selector: 'app-cxp-proveedores',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    TooltipModule,
  ],
  templateUrl: './proveedores.html',
  styleUrl: './proveedores.scss',
})
export class CxpProveedores implements OnInit {
  private service = inject(CxpService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private msgs = inject(MessageService);

  data = signal<Proveedor[]>([]);
  filtered = signal<Proveedor[]>([]);
  cargando = signal(false);

  q = signal('');

  ngOnInit() {
    this.load();
  }

  load() {
    this.cargando.set(true);
    this.service.getProveedores().subscribe({
      next: (res) => {
        this.data.set(res);
        this.filtrar();
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los proveedores' });
      },
    });
  }

  filtrar() {
    const q = this.q().toLowerCase();
    this.filtered.set(
      this.data().filter((p) => {
        if (!q) return true;
        return (
          p.nombres?.toLowerCase().includes(q) ||
          p.apellidos?.toLowerCase().includes(q) ||
          p.nroproveedor?.toLowerCase().includes(q) ||
          p.rtn?.toLowerCase().includes(q) ||
          p.dni?.toLowerCase().includes(q)
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

  editar(id: number) {
    this.router.navigate(['editar', id], { relativeTo: this.route });
  }

  activoLbl(sn: string): string {
    return sn === 'S' ? 'Activo' : 'Inactivo';
  }

  activoSev(sn: string): 'success' | 'danger' {
    return sn === 'S' ? 'success' : 'danger';
  }

  moneda(n: number | undefined): string {
    return (n ?? 0).toLocaleString('es-HN', { style: 'currency', currency: 'HNL' });
  }
}
