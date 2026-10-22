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
import { PlanillaService } from '../../../core/services/planilla.service';
import { PlanillaEmpleado } from '../../../core/models/planilla.models';

@Component({
  selector: 'app-empleados',
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
  templateUrl: './empleados.html',
  styleUrl: './empleados.scss',
})
export class Empleados implements OnInit {
  private service = inject(PlanillaService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private msgs = inject(MessageService);

  data = signal<PlanillaEmpleado[]>([]);
  cargando = signal(false);

  ngOnInit() {
    this.load();
  }

  load() {
    this.cargando.set(true);
    this.service.getEmpleados().subscribe({
      next: (res) => {
        this.data.set(res);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los empleados' });
      },
    });
  }

  nuevo() {
    this.router.navigate(['nuevo'], { relativeTo: this.route });
  }

  editar(id: number) {
    this.router.navigate(['editar', id], { relativeTo: this.route });
  }

  irATipoMov(id: number) {
    this.router.navigate(['/planilla/empleado-tipo-mov/editar', id]);
  }

  activoLbl(sn: string): string {
    return sn === 'S' ? 'Activo' : 'Inactivo';
  }

  activoSev(sn: string): 'success' | 'danger' {
    return sn === 'S' ? 'success' : 'danger';
  }
}