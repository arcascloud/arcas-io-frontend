import {
  Component,
  OnInit,
  OnChanges,
  SimpleChanges,
  inject,
  input,
  output,
  signal,
  computed,
  effect,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageService } from 'primeng/api';
import { ContabilidadService } from '../../../core/services/contabilidad.service';
import { AuthService } from '../../../core/services/auth.service';
import { CtaContable, GrupoContable, NivelCta } from '../../../core/models/contabilidad.models';

@Component({
  selector: 'app-ctacontable-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
  ],
  templateUrl: './ctacontable-form.html',
  styleUrl: './ctacontable-form.scss',
})
export class CtacontableFormComponent implements OnInit, OnChanges {
  private fb = inject(FormBuilder);
  private contabilidad = inject(ContabilidadService);
  private auth = inject(AuthService);
  private messageService = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  // Inputs/Outputs
  cuenta = input<CtaContable | null>(null);
  esEdicion = input(false);
  todasLasCuentas = input<CtaContable[]>([]);
  /** Se incrementa en cada apertura del drawer → fuerza reset/patch del form */
  apertura = input(0);
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

  // ========== Protección de cuentas con historial de movimiento/cierre ==========
  /** La cuenta seleccionada ya registra historial (coctamov/coctasaldos/copdadet/cocierredet) */
  cuentaProtegida = computed(() => this.cuenta()?.sn_protegida === true);
  /** Usuario con rol admin/supervisor/contador */
  esPrivilegiado = this.auth.esRolContabilidad;
  /** Cuenta bloqueada: con historial y sin rol privilegiado → ningún campo editable */
  bloqueada = computed(() => this.cuentaProtegida() && !this.esPrivilegiado());
  /** Habilita el select de Tipo de Cuenta (Diario/Mayor) */
  snOperableHabilitado = computed(() => {
    if (this.bloqueada()) return false;
    if (this.esPrivilegiado()) return true;
    const c = this.cuenta();
    if (!c) return true; // alta nueva
    // Sin historial: solo puede pasar de Diario a Mayor, nunca habilitar como operable
    return c.sn_operable === 'S';
  });

  form!: FormGroup;

  // Effect reactivo: al abrir el drawer (cambio de `apertura` o de `cuenta`)
  // se parchea si hay cuenta seleccionada, o se limpia el formulario si es alta.
  // Sin `apertura`, un alta tras un alta no disparaba el effect (señales sin
  // cambio) y el formulario conservaba los valores del registro anterior.
  private cuentaEffect = effect(() => {
    const c = this.cuenta();
    this.apertura(); // debe leerse para que el effect reaccione a cada apertura
    if (!this.form) return;
    if (c) {
      this.patchForm();
    } else {
      this.resetForm();
    }
  });

  readonly snOptions = [
    { label: 'Diario', value: 'S' },
    { label: 'Mayor', value: 'N' },
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
      .filter((n) => n.sn_activo === 'S')
      .map((n) => ({
        label: `Nivel ${n.nivel}${n.sn_diario === 'S' ? ' (Diario)' : ' (Mayor)'}`,
        value: n.nivel,
      }));
  }

  /** Mapa de grupo → naturaleza automática (sugerencia editable por el usuario) */
  private readonly NATURALEZA_POR_GRUPO: Record<string, 'D' | 'C'> = {
    activo: 'D',
    pasivo: 'C',
    capital: 'C',
    ingresos: 'C',
    gastos: 'D',
    costo: 'D',
  };

  ngOnInit(): void {
    this.initForm();
    this.cargarDatos();
    this.configurarListeners();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['todasLasCuentas'] && this.form) {
      this.form.get('ctacontable')?.updateValueAndValidity({ emitEvent: false });
      this.form.get('descripcion')?.updateValueAndValidity({ emitEvent: false });
      this.form.get('padre')?.updateValueAndValidity();
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      ctacontable: [
        '',
        [
          Validators.required,
          Validators.maxLength(20),
          this.noTerminarEnGuion,
          this.cuentaNoDuplicada,
        ],
      ],
      descripcion: [
        '',
        [Validators.required, Validators.maxLength(50), this.descripcionNoDuplicada],
      ],
      tcogrupocontableId: [null, Validators.required],
      naturaleza: ['D', Validators.required],
      nivel: [null, Validators.required],
      padre: [null],
      sn_operable: ['S', Validators.required],
      sn_activo: ['S', Validators.required],
      zorden: [0],
    });
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
      this.aplicarBloqueo();
    }
  }

  /** Limpia el formulario a los valores por defecto de una alta nueva */
  private resetForm(): void {
    this.form.reset({
      ctacontable: '',
      descripcion: '',
      tcogrupocontableId: null,
      naturaleza: 'D',
      nivel: null,
      padre: null,
      sn_operable: 'S',
      sn_activo: 'S',
      zorden: 0,
    });
    this.grupoId.set(null);
    this.nivelSeleccionado.set(null);
    this.codigoCuenta.set('');
    this.aplicarBloqueo();
  }

  /** Bloquea/desbloquea todos los controles según historial y rol del usuario */
  private aplicarBloqueo(): void {
    if (this.bloqueada()) {
      this.form.disable({ emitEvent: false });
    } else if (this.form.disabled) {
      this.form.enable({ emitEvent: false });
    }
  }

  private cargarDatos(): void {
    forkJoin({
      grupos: this.contabilidad.getGrupos(),
      niveles: this.contabilidad.getNiveles(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ grupos, niveles }) => {
          this.grupos.set(grupos);
          this.niveles.set(niveles);
          // Después de cargar opciones, aplicar patch si hay cuenta seleccionada
          if (this.cuenta()) {
            this.patchForm();
          }
        },
        error: () => {},
      });
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
    const grupo = this.grupos().find((g) => g.tcogrupocontableId === grupoId);
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
    let candidatas = todas.filter(
      (c) => c.tcogrupocontableId === grupoId && c.nivel === nivel - 1 && c.sn_activo === 'S',
    );

    // 2. Si hay código tipeado, filtrar por patrón: prefijo antes del último guión
    if (codigo) {
      const lastDash = codigo.lastIndexOf('-');
      if (lastDash > 0) {
        const prefijo = codigo.substring(0, lastDash);
        candidatas = candidatas.filter((c) => c.ctacontable === prefijo);
      }
    }

    return candidatas.map((c) => ({
      label: `${c.ctacontable} — ${c.descripcion}`,
      value: c.ctacontable,
    }));
  });

  /** Nivel 1 = raíz, no necesita cuenta mayor */
  esNivelRaiz = computed(() => (this.nivelSeleccionado() || 1) === 1);

  /** Warning: nivel > 1 pero no existe cuenta de mayor para el patrón */
  faltaMayor = computed(() => {
    const nivel = this.nivelSeleccionado() || 1;
    if (nivel <= 1) return null;
    const candidatas = this.cuentasMayor();
    if (candidatas.length === 0) {
      const codigo = this.codigoCuenta().trim();
      if (codigo) {
        const partes = codigo.split('-');
        if (partes.length >= 2) {
          const padreEsperado = partes.slice(0, -1).join('-');
          return `No hay cuenta de mayor definida para el nivel ${nivel - 1} (${padreEsperado})`;
        }
      }
      return `No hay cuenta de mayor definida para el nivel ${nivel - 1}`;
    }
    return null;
  });

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

  /** Validador: no permitir cuenta terminada en guion */
  noTerminarEnGuion(control: AbstractControl): ValidationErrors | null {
    const valor = control.value;
    if (valor && typeof valor === 'string' && valor.endsWith('-')) {
      return { terminaEnGuion: true };
    }
    return null;
  }

  /** Validador: cuenta contable no duplicada */
  cuentaNoDuplicada = (control: AbstractControl): ValidationErrors | null => {
    const valor = control.value?.trim();
    if (!valor) return null;
    const cuentaActual = this.cuenta();
    const duplicada = this.todasLasCuentas().some(
      (c) => c.ctacontable === valor && c.cuentacontablesId !== cuentaActual?.cuentacontablesId,
    );
    return duplicada ? { cuentaDuplicada: true } : null;
  };

  /** Validador: descripción no duplicada */
  descripcionNoDuplicada = (control: AbstractControl): ValidationErrors | null => {
    const valor = control.value?.trim();
    if (!valor) return null;
    const cuentaActual = this.cuenta();
    const duplicada = this.todasLasCuentas().some(
      (c) =>
        c.descripcion.toLowerCase() === valor.toLowerCase() &&
        c.cuentacontablesId !== cuentaActual?.cuentacontablesId,
    );
    return duplicada ? { descripcionDuplicada: true } : null;
  };

  invalid(ctrl: string): boolean {
    const c = this.form.get(ctrl);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  getErrorMensaje(ctrl: string): string {
    const c = this.form.get(ctrl);
    if (!c || !c.errors) return '';
    if (c.errors['required']) return 'Este campo es obligatorio';
    if (c.errors['maxlength']) return `Máximo ${c.errors['maxlength'].requiredLength} caracteres`;
    if (c.errors['terminaEnGuion']) return 'La cuenta no puede terminar en guion';
    if (c.errors['cuentaDuplicada']) return 'Ya existe una cuenta con este código';
    if (c.errors['descripcionDuplicada']) return 'Ya existe una cuenta con esta descripción';
    return 'Campo inválido';
  }

  // ========== Acciones ==========

  onGuardar(): void {
    if (this.bloqueada()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cuenta protegida',
        detail: 'La cuenta tiene historial de movimiento/cierre. Solo Contador, Supervisor o Administrador pueden modificarla.',
      });
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    const raw = this.form.getRawValue();
    // Convertir nivel a number para el backend
    raw.nivel = Number(raw.nivel);
    const cuenta = this.cuenta();

    const op =
      this.esEdicion() && cuenta
        ? this.contabilidad.actualizarCuenta(cuenta.cuentacontablesId, raw)
        : this.contabilidad.crearCuenta(raw);

    op.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.guardando.set(false);
        this.messageService.add({
          severity: 'success',
          summary: this.esEdicion() ? 'Cuenta actualizada' : 'Cuenta registrada',
          detail: this.esEdicion()
            ? 'Los cambios se guardaron con éxito'
            : 'La cuenta contable se guardó con éxito',
        });
        this.guardado.emit();
      },
      error: (err) => {
        this.guardando.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error al guardar',
          detail: err.error?.message || 'No se pudo guardar la cuenta contable',
        });
      },
    });
  }

  onCancelar(): void {
    this.cancelar.emit();
  }
}
