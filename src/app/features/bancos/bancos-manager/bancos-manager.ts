import { Component, inject, signal, OnInit, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ApiService } from '../../../core/services/api.service';
import { Router } from '@angular/router';
import { CatalogoForm } from '../../parametros/catalogo-generico/catalogo-form';

@Component({
  selector: 'app-bancos-manager',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule,
    TagModule, TooltipModule, ToastModule, ConfirmDialogModule, DialogModule, SelectModule,
    CatalogoForm,
  ],
  templateUrl: './bancos-manager.html',
  styleUrl: './bancos-manager.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BancosManager implements OnInit {
  private api = inject(ApiService);
  private msgs = inject(MessageService);
  private confirm = inject(ConfirmationService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);

  bancos = signal<any[]>([]);
  cuentas = signal<any[]>([]);
  bancoSeleccionado = signal<any | null>(null);
  cargando = signal(false);
  cargandoCuentas = signal(false);

  busqueda = signal('');

  // Panel derecho: control del form genérico embebido
  formCatalogo = signal<string | null>(null);  // 'bancos' | 'cuentas' | null
  formItemId = signal<number | string>(0);
  formQueryParams = signal<Record<string, any>>({});

  ngOnInit() {
    this.cargarBancos();
  }

  cargarBancos() {
    this.cargando.set(true);
    this.api.get<any[]>('/bancos/bancos').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => { this.bancos.set(data || []); this.cargando.set(false); },
      error: () => {
        this.cargando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los bancos' });
      },
    });
  }

  seleccionar(banco: any) {
    this.bancoSeleccionado.set(banco);
    this.cargarCuentas(banco.bancoId);
  }

  cargarCuentas(bancoId: number) {
    this.cargandoCuentas.set(true);
    this.api.get<any[]>('/bancos/cuentas').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.cuentas.set((data || []).filter(c => c.bancoId === bancoId));
        this.cargandoCuentas.set(false);
      },
      error: () => {
        this.cargandoCuentas.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las cuentas' });
      },
    });
  }

  volver() {
    this.bancoSeleccionado.set(null);
    this.cuentas.set([]);
  }

  nuevoBanco() {
    this.formCatalogo.set('bancos');
    this.formItemId.set('nuevo');
    this.formQueryParams.set({});
  }

  editarBanco(banco: any) {
    this.formCatalogo.set('bancos');
    this.formItemId.set(banco.bancoId);
    this.formQueryParams.set({});
  }

  editarCuenta(cuenta: any) {
    this.formCatalogo.set('cuentas');
    this.formItemId.set(cuenta.bcoctasId);
    this.formQueryParams.set({});
  }

  nuevaCuenta() {
    if (!this.bancoSeleccionado()) return;
    this.formCatalogo.set('cuentas');
    this.formItemId.set('nuevo');
    this.formQueryParams.set({ bancoId: this.bancoSeleccionado()!.bancoId });
  }

  onFormFinalized() {
    this.formCatalogo.set(null);
    this.cargarBancos();
    if (this.bancoSeleccionado()) {
      this.cargarCuentas(this.bancoSeleccionado()!.bancoId);
    }
  }

  activoLbl(sn: string): string {
    return sn === 'S' ? 'Activo' : 'Inactivo';
  }

  activoSev(sn: string): 'success' | 'danger' {
    return sn === 'S' ? 'success' : 'danger';
  }
}
