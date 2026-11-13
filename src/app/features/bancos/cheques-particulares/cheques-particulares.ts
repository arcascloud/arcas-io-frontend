import { Component, inject, signal, computed, OnInit, OnDestroy, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
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
import { Subscription } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { BcoCta, BcoMovimiento } from '../../../core/models/bancos.models';
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
export class ChequesParticulares implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private msgs = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  // Datos
  cuentas = signal<BcoCta[]>([]);
  bancos = signal<any[]>([]);
  movimientos = signal<BcoMovimiento[]>([]);
  cargandoMovimientos = signal(false);
  emitando = signal(false);
  mostrarImpresion = signal(false);
  chequeAImprimir = signal<any>(null);
  // Signal espejo del form para que los computed() sean reactivos
  importeActual = signal(0);

  // Formulario
  form!: FormGroup;
  private formSub?: Subscription;

  ngOnInit() {
    this.form = this.fb.group({
      bcoctasId: [null, Validators.required],
      beneficiario: ['', Validators.required],
      concepto: ['', Validators.required],
      // Inicia vacío (undefined) para que el campo no muestre 0
      importe: [undefined as number | undefined, [Validators.required, Validators.min(0.01)]],
    });
    this.form.get('importe')!.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(v => this.importeActual.set(Number(v || 0)));
    this.form.get('bcoctasId')!.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(id => {
        if (id) this.cargarMovimientos(id);
        else this.movimientos.set([]);
      });
    this.cargarCuentas();
    this.cargarBancos();
  }

  ngOnDestroy() {
    this.formSub?.unsubscribe();
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

  cargarMovimientos(bcoctasId: number) {
    this.cargandoMovimientos.set(true);
    this.api.get<any[]>('/bancos/movimientos', { bcoctasId: String(bcoctasId) })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (data) => { this.movimientos.set(data || []); this.cargandoMovimientos.set(false); },
        error: () => { this.cargandoMovimientos.set(false); },
      });
  }

  /**
   * Saldo de la cuenta seleccionada: Σ Débitos − Σ Créditos,
   * excluyendo movimientos anulados.
   */
  readonly saldoCuenta = computed(() => {
    return this.movimientos()
      .filter(m => m.sn_doc_anulado !== 'S')
      .reduce((suma, m) => suma + (m.dc_debitocredito === 'D' ? Number(m.importe) : -Number(m.importe)), 0);
  });

  /** true cuando el importe del cheque excede el saldo de la cuenta */
  readonly saldoInsuficiente = computed(() => {
    const importe = this.importeActual();
    return importe > 0 && this.saldoCuenta() < importe;
  });

  saldoTexto(): string {
    if (this.cargandoMovimientos()) return 'Cargando…';
    return this.formatCurrency(this.saldoCuenta());
  }

  emitir() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.msgs.add({ severity: 'warn', summary: 'Atención', detail: 'Complete todos los campos requeridos' });
      return;
    }

    const cuenta = this.cuentaSeleccionada();
    if (!cuenta) return;

    // Validación de saldo antes de enviar
    const importe = Number(this.form.value.importe);
    if (this.saldoCuenta() < importe) {
      this.msgs.add({
        severity: 'warn',
        summary: 'Saldo insuficiente',
        detail: `Saldo actual ${this.formatCurrency(this.saldoCuenta())} — importe del cheque ${this.formatCurrency(importe)}`,
      });
      return;
    }

    this.emitando.set(true);

    this.api.post<any>('/bancos/cheques/emitir-particular', {
      bcoctasId: cuenta.bcoctasId,
      bancoId: cuenta.bancoId,
      beneficiario: this.form.value.beneficiario,
      concepto: this.form.value.concepto,
      importe: importe,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.emitando.set(false);
        this.chequeAImprimir.set(res.cheque);
        this.mostrarImpresion.set(true);
        this.msgs.add({ severity: 'success', summary: 'Éxito', detail: res.mensaje });
        this.form.reset({ bcoctasId: null, beneficiario: '', concepto: '', importe: undefined });
        this.movimientos.set([]);
        this.importeActual.set(0);
      },
      error: (err) => {
        this.emitando.set(false);
        const msg = err?.error?.message;
        const detalle =
          (Array.isArray(msg) ? msg.join(' · ') : msg) ||
          err?.error?.error ||
          'Error al emitir cheque';
        this.msgs.add({ severity: 'error', summary: 'No se pudo emitir', detail: detalle });
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
