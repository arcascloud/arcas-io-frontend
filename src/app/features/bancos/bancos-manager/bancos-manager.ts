import { Component, inject, signal, OnInit, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
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
import { AccordionModule } from 'primeng/accordion';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ApiService } from '../../../core/services/api.service';
import { Router } from '@angular/router';
import { CatalogoForm } from '../../parametros/catalogo-generico/catalogo-form';

@Component({
  selector: 'app-bancos-manager',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, TableModule, ButtonModule, InputTextModule,
    TagModule, TooltipModule, ToastModule, ConfirmDialogModule, DialogModule, SelectModule,
    AccordionModule, CatalogoForm,
  ],
  templateUrl: './bancos-manager.html',
  styleUrl: './bancos-manager.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BancosManager implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private msgs = inject(MessageService);
  private confirm = inject(ConfirmationService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);

  bancos = signal<any[]>([]);
  cuentas = signal<any[]>([]);
  telefonos = signal<any[]>([]);
  direcciones = signal<any[]>([]);
  monedas = signal<any[]>([]);
  bancoSeleccionado = signal<any | null>(null);
  cargando = signal(false);
  cargandoCuentas = signal(false);
  cargandoTelefonos = signal(false);
  cargandoDirecciones = signal(false);

  busqueda = signal('');

  // Panel derecho: control del form genérico embebido
  formCatalogo = signal<string | null>(null);  // 'bancos' | 'cuentas' | null
  formItemId = signal<number | string>(0);
  formQueryParams = signal<Record<string, any>>({});

  // Formularios teléfonos / direcciones
  telForm!: FormGroup;
  dirForm!: FormGroup;
  telEditando = signal(false);
  dirEditando = signal(false);
  telEditId = signal<number | null>(null);
  dirEditId = signal<number | null>(null);

  ngOnInit() {
    this.telForm = this.fb.group({
      telefono: ['', Validators.required],
      sn_activo: ['S', Validators.required],
    });
    this.dirForm = this.fb.group({
      descripcion: ['', Validators.required],
      sn_activo: ['S', Validators.required],
    });
    this.cargarBancos();
    this.cargarMonedas();
  }

  cargarMonedas() {
    this.api.get<any[]>('/parametros/monedas').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => { this.monedas.set(data || []); },
    });
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
    this.cargarTelefonos(banco.bancoId);
    this.cargarDirecciones(banco.bancoId);
    this.limpiarForms();
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

  cargarTelefonos(bancoId: number) {
    this.cargandoTelefonos.set(true);
    this.api.get<any[]>('/bancos/telefonos').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.telefonos.set((data || []).filter(t => t.bancoId === bancoId));
        this.cargandoTelefonos.set(false);
      },
      error: () => {
        this.cargandoTelefonos.set(false);
      },
    });
  }

  cargarDirecciones(bancoId: number) {
    this.cargandoDirecciones.set(true);
    this.api.get<any[]>('/bancos/direcciones').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.direcciones.set((data || []).filter(d => d.bancoId === bancoId));
        this.cargandoDirecciones.set(false);
      },
      error: () => {
        this.cargandoDirecciones.set(false);
      },
    });
  }

  volver() {
    this.bancoSeleccionado.set(null);
    this.cuentas.set([]);
    this.telefonos.set([]);
    this.direcciones.set([]);
    this.limpiarForms();
  }

  limpiarForms() {
    this.telForm.reset({ telefono: '', sn_activo: 'S' });
    this.dirForm.reset({ descripcion: '', sn_activo: 'S' });
    this.telEditando.set(false);
    this.dirEditando.set(false);
    this.telEditId.set(null);
    this.dirEditId.set(null);
  }

  // ── Bancos / Cuentas ──────────────────────────────────

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

  // ── Teléfonos ─────────────────────────────────────────

  guardarTelefono() {
    if (this.telForm.invalid || !this.bancoSeleccionado()) return;
    const raw = this.telForm.getRawValue();
    const payload = {
      bancoId: this.bancoSeleccionado()!.bancoId,
      telefono: raw.telefono,
      sn_activo: raw.sn_activo,
    };

    const req$ = this.telEditando() && this.telEditId()
      ? this.api.putBase(`/bancos/telefonos/${this.telEditId()}`, payload)
      : this.api.post('/bancos/telefonos', payload);

    req$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.msgs.add({ severity: 'success', summary: 'Guardado', detail: 'Teléfono guardado' });
        this.cargarTelefonos(this.bancoSeleccionado()!.bancoId);
        this.telForm.reset({ telefono: '', sn_activo: 'S' });
        this.telEditando.set(false);
        this.telEditId.set(null);
      },
      error: () => {
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el teléfono' });
      },
    });
  }

  editarTelefono(tel: any) {
    this.telEditando.set(true);
    this.telEditId.set(tel.bancotelefonoId);
    this.telForm.reset({ telefono: tel.telefono, sn_activo: tel.sn_activo });
  }

  eliminarTelefono(tel: any) {
    this.confirm.confirm({
      message: '¿Eliminar este teléfono?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      rejectButtonProps: { severity: 'secondary', variant: 'text', size: 'small', rounded: true },
      acceptButtonProps: { severity: 'danger', variant: 'text', size: 'small', rounded: true },
      accept: () => {
        this.api.putBase(`/bancos/telefonos/${tel.bancotelefonoId}`, { sn_activo: 'N' })
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.msgs.add({ severity: 'success', summary: 'Eliminado', detail: 'Teléfono desactivado' });
              this.cargarTelefonos(this.bancoSeleccionado()!.bancoId);
            },
            error: () => {
              this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar' });
            },
          });
      },
    });
  }

  // ── Direcciones ───────────────────────────────────────

  guardarDireccion() {
    if (this.dirForm.invalid || !this.bancoSeleccionado()) return;
    const raw = this.dirForm.getRawValue();
    const payload = {
      bancoId: this.bancoSeleccionado()!.bancoId,
      descripcion: raw.descripcion,
      sn_activo: raw.sn_activo,
    };

    const req$ = this.dirEditando() && this.dirEditId()
      ? this.api.putBase(`/bancos/direcciones/${this.dirEditId()}`, payload)
      : this.api.post('/bancos/direcciones', payload);

    req$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.msgs.add({ severity: 'success', summary: 'Guardado', detail: 'Dirección guardada' });
        this.cargarDirecciones(this.bancoSeleccionado()!.bancoId);
        this.dirForm.reset({ descripcion: '', sn_activo: 'S' });
        this.dirEditando.set(false);
        this.dirEditId.set(null);
      },
      error: () => {
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la dirección' });
      },
    });
  }

  editarDireccion(dir: any) {
    this.dirEditando.set(true);
    this.dirEditId.set(dir.bcosdireccionid);
    this.dirForm.reset({ descripcion: dir.descripcion, sn_activo: dir.sn_activo });
  }

  eliminarDireccion(dir: any) {
    this.confirm.confirm({
      message: '¿Eliminar esta dirección?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      rejectButtonProps: { severity: 'secondary', variant: 'text', size: 'small', rounded: true },
      acceptButtonProps: { severity: 'danger', variant: 'text', size: 'small', rounded: true },
      accept: () => {
        this.api.putBase(`/bancos/direcciones/${dir.bcosdireccionid}`, { sn_activo: 'N' })
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.msgs.add({ severity: 'success', summary: 'Eliminado', detail: 'Dirección desactivada' });
              this.cargarDirecciones(this.bancoSeleccionado()!.bancoId);
            },
            error: () => {
              this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar' });
            },
          });
      },
    });
  }

  // ── Helpers ───────────────────────────────────────────

  activoLbl(sn: string): string {
    return sn === 'S' ? 'Activo' : 'Inactivo';
  }

  activoSev(sn: string): 'success' | 'danger' {
    return sn === 'S' ? 'success' : 'danger';
  }

  monedaNombre(monedaId: number): string {
    return this.monedas().find(m => m.monedaId === monedaId)?.descripcion || `#${monedaId}`;
  }
}
