import { Component, inject, signal, OnInit, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../../core/services/api.service';
import { BcoCta } from '../../../core/models/bancos.models';
import { numeroALetras } from '../../../core/utils/numeros-a-letras';

@Component({
  selector: 'app-cheques-particulares',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, RouterLink, ButtonModule,
    InputTextModule, InputNumberModule, SelectModule, TextareaModule, ToastModule,
  ],
  templateUrl: './cheques-particulares.html',
  styleUrl: './cheques-particulares.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChequesParticulares implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private msgs = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  // Datos
  cuentas = signal<BcoCta[]>([]);
  bancos = signal<any[]>([]);
  emitando = signal(false);
  mostrarImpresion = signal(false);
  chequeAImprimir = signal<any>(null);

  // Formulario
  form!: FormGroup;

  ngOnInit() {
    this.form = this.fb.group({
      bcoctasId: [null, Validators.required],
      beneficiario: ['', Validators.required],
      concepto: ['', Validators.required],
      importe: [0, [Validators.required, Validators.min(0.01)]],
    });
    this.cargarCuentas();
    this.cargarBancos();
  }

  cargarBancos() {
    this.api.get<any[]>('/bancos/bancos').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => { this.bancos.set(data || []); },
    });
  }

  cargarCuentas() {
    this.api.get<any[]>('/bancos/cuentas').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        const ctas = (data || [])
          .filter((c: any) => c.sn_activo === 'S' && c.monedaId === 1)
          .map((c: any) => ({ ...c, bancoId: Number(c.bancoId) }));
        this.cuentas.set(ctas);
      },
    });
  }

  bancoNombre(bancoId: number): string {
    return this.bancos().find(b => b.bancoId === bancoId)?.descripcion || '';
  }

  cuentaSeleccionada(): BcoCta | null {
    const id = this.form?.get('bcoctasId')?.value;
    return this.cuentas().find(c => c.bcoctasId === id) || null;
  }

  emitir() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.msgs.add({ severity: 'warn', summary: 'Atención', detail: 'Complete todos los campos requeridos' });
      return;
    }

    const cuenta = this.cuentaSeleccionada();
    if (!cuenta) return;

    this.emitando.set(true);

    this.api.post<any>('/bancos/cheques/emitir-particular', {
      bcoctasId: cuenta.bcoctasId,
      bancoId: cuenta.bancoId,
      beneficiario: this.form.value.beneficiario,
      concepto: this.form.value.concepto,
      importe: this.form.value.importe,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.emitando.set(false);
        this.chequeAImprimir.set(res.cheque);
        this.mostrarImpresion.set(true);
        this.msgs.add({ severity: 'success', summary: 'Éxito', detail: res.mensaje });
        this.form.reset({ bcoctasId: null, beneficiario: '', concepto: '', importe: 0 });
      },
      error: (err) => {
        this.emitando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al emitir cheque' });
      },
    });
  }

  // ── Impresión ───────────────────────────────────────────

  cerrarImpresion() {
    this.mostrarImpresion.set(false);
    this.chequeAImprimir.set(null);
  }

  windowPrint() {
    window.print();
  }

  numeroALetrasValor(num: number): string {
    return numeroALetras(num);
  }

  formatCurrency(valor: number): string {
    return new Intl.NumberFormat('es-HN', { style: 'currency', currency: 'HNL' }).format(valor || 0);
  }

  get fechaHoy(): string {
    return new Date().toLocaleDateString('es-HN', { year: 'numeric', month: 'long', day: 'numeric' });
  }
}
