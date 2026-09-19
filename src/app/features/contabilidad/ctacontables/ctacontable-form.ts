import { Component, OnInit, OnChanges, SimpleChanges, inject, input, output, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ContabilidadService } from '../../../core/services/contabilidad.service';
import { CtaContable, GrupoContable, NivelCta } from '../../../core/models/contabilidad.models';

@Component({
  selector: 'app-ctacontable-form',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    ButtonModule, InputTextModule, InputNumberModule, SelectModule, ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './ctacontable-form.html',
  styleUrl: './ctacontable-form.scss',
})
export class CtacontableFormComponent implements OnInit, OnChanges {
  private fb = inject(FormBuilder);
  private contabilidad = inject(ContabilidadService);
  private messageService = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  // Inputs/Outputs
  cuenta = input<CtaContable | null>(null);
  esEdicion = input(false);
  todasLasCuentas = input<CtaContable[]>([]);
  guardado = output<void>();
  cancelar = output<void>();

  // Estado
  cargando = signal(false);
  guardando = signal(false);
  grupos = signal<GrupoContable[]>([]);
  niveles = signal<NivelCta[]>([]);

  // Señales del formulario (para que computed reaccione)
  grupoId = signal<number | null>(null);
  nivelSeleccionado = signal<number | null>(null);
  codigoCuenta = signal<string>('');

  form!: FormGroup;

  readonly snOptions = [
    { label: 'Diario (Sí)', value: 'S' },
    { label: 'Mayor (No)', value: 'N' },
  ];

  readonly naturalezaOptions = [
    { label: 'Débito (D)', value: 'D' },
    { label: 'Crédito (C)', value: 'C' },
  ];

  readonly estadoOptions = [
    { label: 'Activo', value: 'S' },
    { label: 'Inactivo', value: 'N' },
  ];

  get nivelesSelect() {
    return this.niveles()
      .filter(n => n.sn_activo === 'S')
      .map(n => ({ label: `Nivel ${n.nivel}${n.sn_diario === 'S' ? ' (Diario)' : ' (Mayor)'}`, value: n.nivel }));
  }

  /** Mapa de grupo → naturaleza automática */
  private readonly NATURALEZA_POR_GRUPO: Record<string, 'D' | 'C'> = {
    'activo': 'D',
    'pasivo': 'C',
    'capital': 'C',
    'ingresos': 'C',
    'gastos': 'D',
  };

  ngOnInit(): void {
    this.initForm();
    this.cargarDatos();
    this.configurarListeners();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['cuenta'] && this.form) {
      this.patchForm();
    }
    if (changes['todasLasCuentas'] && this.form) {
      this.form.get('padre')?.updateValueAndValidity();
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      ctacontable: ['', [Validators.required, Validators.maxLength(20)]],
      descripcion: ['', [Validators.required, Validators.maxLength(50)]],
      tcogrupocontableId: [null, Validators.required],
      naturaleza: ['D', Validators.required],
      nivel: [null, Validators.required],
      padre: [null],
      sn_operable: ['S', Validators.required],
      sn_activo: ['S', Validators.required],
      zorden: [0],
    });
    this.patchForm();
  }

  private patchForm(): void {
    const c = this.cuenta();
    if (c) {
      this.form.patchValue({
        ctacontable: c.ctacontable,
        descripcion: c.descripcion,
        tcogrupocontableId: c.tcogrupocontableId,
        naturaleza: c.naturaleza,
        nivel: String(c.nivel),
        padre: c.padre || '',
        sn_operable: c.sn_operable,
        sn_activo: c.sn_activo,
        zorden: c.zorden ?? 0,
      });
      this.grupoId.set(c.tcogrupocontableId);
      this.nivelSeleccionado.set(Number(c.nivel));
      this.codigoCuenta.set(c.ctacontable);
    }
  }

  private cargarDatos(): void {
    this.contabilidad.getGrupos()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (data) => this.grupos.set(data), error: () => {} });

    this.contabilidad.getNiveles()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (data) => this.niveles.set(data), error: () => {} });
  }

  // ========== Listeners de reglas de negocio ==========

  private configurarListeners(): void {
    // Sincronizar código de cuenta con signal
    this.form.get('ctacontable')?.valueChanges.subscribe((codigo) => {
      this.codigoCuenta.set(codigo || '');
    });

    // Al cambiar grupo → auto-set naturaleza + sincronizar signal
    this.form.get('tcogrupocontableId')?.valueChanges.subscribe((grupoId) => {
      this.grupoId.set(grupoId);
      if (!this.esEdicion()) {
        const nat = this.obtenerNaturalezaPorGrupo(grupoId);
        if (nat) this.form.get('naturaleza')?.setValue(nat);
      }
      this.form.get('padre')?.setValue(null, { emitEvent: false });
    });

    // Al cambiar nivel → limpiar padre si nivel 1 + sincronizar signal
    this.form.get('nivel')?.valueChanges.subscribe((nivel) => {
      this.nivelSeleccionado.set(Number(nivel));
      if (Number(nivel) === 1) {
        this.form.get('padre')?.setValue(null, { emitEvent: false });
      }
    });
  }

  // ========== Reglas de negocio ==========

  private obtenerNaturalezaPorGrupo(grupoId: number): 'D' | 'C' | null {
    const grupo = this.grupos().find(g => g.tcogrupocontableId === grupoId);
    if (!grupo) return null;
    const desc = grupo.descripcion.toLowerCase().trim();
    for (const [key, nat] of Object.entries(this.NATURALEZA_POR_GRUPO)) {
      if (desc.includes(key)) return nat;
    }
    return null;
  }

  /** Cuentas disponibles como Cuenta Mayor según grupo, nivel y patrón de código */
  cuentasMayor = computed(() => {
    const grupoId = this.grupoId();
    const nivel = this.nivelSeleccionado() || 1;
    if (!grupoId || nivel <= 1) return [];

    const codigo = this.codigoCuenta().trim();
    const todas = this.todasLasCuentas();

    // 1. Filtrar por grupo y nivel exacto (nivel - 1)
    let candidatas = todas.filter(c =>
      c.tcogrupocontableId === grupoId && c.nivel === nivel - 1 && c.sn_activo === 'S'
    );

    // 2. Si hay código tipeado, filtrar por patrón: prefijo antes del último guión
    if (codigo) {
      const lastDash = codigo.lastIndexOf('-');
      if (lastDash > 0) {
        const prefijo = codigo.substring(0, lastDash);
        candidatas = candidatas.filter(c => c.ctacontable === prefijo);
      }
    }

    return candidatas.map(c => ({
      label: `${c.ctacontable} — ${c.descripcion}`,
      value: c.ctacontable,
    }));
  });

  /** Nivel 1 = raíz, no necesita cuenta mayor */
  esNivelRaiz = computed(() => (this.nivelSeleccionado() || 1) === 1);

  private inferirNivelYPadre(codigo: string): void {
    const partes = codigo.split('-');
    const nivel = partes.length;
    this.form.get('nivel')?.setValue(String(nivel), { emitEvent: false });

    if (nivel > 1) {
      const padreCodigo = partes.slice(0, -1).join('-');
      this.form.get('padre')?.setValue(padreCodigo, { emitEvent: false });
    } else {
      this.form.get('padre')?.setValue('', { emitEvent: false });
    }
  }

  // ========== Helpers ==========

  invalid(ctrl: string): boolean {
    const c = this.form.get(ctrl);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  getErrorMensaje(ctrl: string): string {
    const c = this.form.get(ctrl);
    if (!c || !c.errors) return '';
    if (c.errors['required']) return 'Este campo es obligatorio';
    if (c.errors['maxlength']) return `Máximo ${c.errors['maxlength'].requiredLength} caracteres`;
    return 'Campo inválido';
  }

  // ========== Acciones ==========

  onGuardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    const raw = this.form.getRawValue();
    // Convertir nivel a number para el backend
    raw.nivel = Number(raw.nivel);
    const cuenta = this.cuenta();

    const op = this.esEdicion() && cuenta
      ? this.contabilidad.actualizarCuenta(cuenta.cuentacontablesId, raw)
      : this.contabilidad.crearCuenta(raw);

    op.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.guardando.set(false);
          this.messageService.add({
            severity: 'success',
            summary: 'Guardado',
            detail: this.esEdicion() ? 'Cuenta actualizada' : 'Cuenta creada correctamente',
          });
          this.guardado.emit();
        },
        error: (err) => {
          this.guardando.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.message || 'No se pudo guardar la cuenta',
          });
        },
      });
  }

  onCancelar(): void {
    this.cancelar.emit();
  }
}
