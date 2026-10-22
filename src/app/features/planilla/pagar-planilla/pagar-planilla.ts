import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MaestroDetalle } from '../../facturacion/maestro-detalle/maestro-detalle';

/**
 * Lista de planillas de pago.
 *
 * Factorizada del maestro-detalle genérico (que vive en facturación y
 * comparten contabilidad): reutiliza su template y su lógica, y queda bajo
 * `features/planilla/` para que el módulo sea dueño de sus componentes y
 * pueda divergir sin tocar el genérico.
 */
@Component({
  selector: 'app-pagar-planilla',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule],
  templateUrl: '../../facturacion/maestro-detalle/maestro-detalle.html',
  styleUrl: '../../facturacion/maestro-detalle/maestro-detalle.scss',
})
export class PagarPlanilla extends MaestroDetalle {}
