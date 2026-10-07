import {
  Component,
  inject,
  signal,
  OnInit,
  input,
  output,
  effect,
  Injector,
  ViewChild,
  ElementRef,
  ChangeDetectionStrategy,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { CxpService } from '../../../core/services/cxp.service';
import { AuthService } from '../../../core/services/auth.service';
import { NavegacionService } from '../../../core/services/navegacion.service';
import { ParametroUnificadoService } from '../../../core/services/parametro-unificado.service';

/**
 * Formulario de proveedor (solo datos del maestro).
 *
 * Soporta dos modos:
 *  - INLINE: se usa dentro de ProveedoresManager (tab "Proveedor") mediante
 *    `[proveedorIdInput]` + outputs `saved` / `cancelled`.
 *  - RUTA: se usa en `/cxp/proveedores/editar/:id` (quick-nav) sin bindings.
 *
 * La Inf. Adicional (proveedorinfo) y las Carteras contables viven en el manager,
 * igual que en Clientes (CxC).
 */
@Component({
  selector: 'app-cxp-proveedor-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    SelectButtonModule,
    DialogModule,
  ],
  templateUrl: './proveedor-form.html',
  styleUrl: './proveedor-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxpProveedorForm implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private service = inject(CxpService);
  private auth = inject(AuthService);
  private nav = inject(NavegacionService);
  private msgs = inject(MessageService);
  private injector = inject(Injector);
  private paramsUnif = inject(ParametroUnificadoService);
  private destroyRef = inject(DestroyRef);

  // ===== MODO INLINE (manager) =====
  /** null = nuevo, >0 = editar, undefined = modo ruta (no se usa el input) */
  proveedorIdInput = input<number | null | undefined>(undefined);
  saved = output<void>();
  cancelled = output<void>();

  // ===== MODO RUTA =====
  private proveedorId = 0;
  private modoRuta = false;
  /** Último id aplicado — evita recargas duplicadas entre ngOnInit y el effect */
  private ultimoIdAplicado: number | null | undefined = undefined;

  esEdicion = signal(false);
  cargando = signal(false);
  guardando = signal(false);
  titulo = signal('Nuevo proveedor');
  // Bloqueo por DNI duplicado (DNI = llave maestra por empresa)
  dialogoDni = signal(false);
  bloqueoDni = signal<{ dni: string; nombre: string | null; numero: string | null; detalle?: string } | null>(null);
  /** true cuando cuelga del manager (la cabecera "Volver" solo aplica en modo ruta) */
  modoInline = signal(false);

  @ViewChild('primerCampo') primerCampo?: ElementRef<HTMLInputElement>;

  focusPrimerCampo() {
    setTimeout(() => this.primerCampo?.nativeElement?.focus(), 100);
  }

  // Reacciona a cambios de proveedorIdInput (selección en la lista del manager)
  private _proveedorEffect = effect(() => {
    const id = this.proveedorIdInput();
    if (id === undefined) return; // modo ruta
    this.modoInline.set(true);
    this.aplicarId(id ?? null);
  }, { injector: this.injector });

  readonly snOptions = [
    { label: 'Activo', value: 'S' },
    { label: 'Inactivo', value: 'N' },
  ];

  readonly sexoOptions = [
    { label: 'Masculino', value: 'M' },
    { label: 'Femenino', value: 'F' },
  ];

  readonly estadoCivilOptions = [
    { label: 'Soltero', value: 'S' },
    { label: 'Casado', value: 'C' },
    { label: 'Divorciado', value: 'D' },
    { label: 'Viudo', value: 'V' },
    { label: 'Unión libre', value: 'U' },
  ];

  readonly categoriaOptions = [
    { label: 'A', value: 'A' },
    { label: 'B', value: 'B' },
    { label: 'C', value: 'C' },
    { label: 'D', value: 'D' },
    { label: 'E', value: 'E' },
  ];

  form!: FormGroup;

  ngOnInit() {
    this.form = this.fb.group({
      nroproveedor: ['', Validators.required],
      nombres: ['', Validators.required],
      apellidos: ['', Validators.required],
      razonsocial: [''],
      dni: [''],
      sexo: ['M' as 'M' | 'F'],
      estadocivil: ['S' as 'S' | 'C' | 'D' | 'V' | 'U'],
      rtn: [''],
      limiteCredito: [0],
      diasplazo: [0],
      interes: [0],
      moratorio: [0],
      categoria: ['A' as 'A' | 'B' | 'C' | 'D' | 'E'],
      sn_activo: ['S' as 'S' | 'N'],
    });

    const inlineId = this.proveedorIdInput();
    if (inlineId !== undefined) {
      // Modo inline: la carga/reset la resuelve el effect (sin doble petición)
      this.modoInline.set(true);
      this.aplicarId(inlineId ?? null);
    } else {
      // Modo ruta (/cxp/proveedores/editar/:id)
      this.modoRuta = true;
      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
        this.esEdicion.set(true);
        this.titulo.set('Editar proveedor');
        this.proveedorId = Number(id);
        this.cargarProveedor(this.proveedorId);
      } else {
        this.cargarDefaultsCreditos();
      }
    }
  }

  /** Aplica el id seleccionado (inline): carga el proveedor o limpia el formulario */
  private aplicarId(id: number | null) {
    if (this.ultimoIdAplicado === id && this.form) return;
    this.ultimoIdAplicado = id;

    this.proveedorId = id ?? 0;
    this.esEdicion.set(!!id);
    this.titulo.set(id ? 'Editar proveedor' : 'Nuevo proveedor');

    if (id) {
      this.cargarProveedor(id);
    } else if (this.form) {
      this.form.reset({
        nroproveedor: '',
        nombres: '',
        apellidos: '',
        razonsocial: '',
        dni: '',
        sexo: 'M',
        estadocivil: 'S',
        rtn: '',
        limiteCredito: 0,
        diasplazo: 0,
        interes: 0,
        moratorio: 0,
        categoria: 'A',
        sn_activo: 'S',
      });
      this.cargarDefaultsCreditos();
      this.cargando.set(false);
    }
  }

  /**
   * Precarga los defaults de credito del proveedor desde ttipoparametros
   * (CxP, moduloId=5: cxp_limitecredito, cxp_diasPlazo, cxp_interes, cxp_mora).
   * Solo en alta - en edicion manda lo guardado.
   */
  private cargarDefaultsCreditos(): void {
    this.paramsUnif.getAsObject(5).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((obj) => {
      this.form.patchValue({
        limiteCredito: Number(obj['cxp_limitecredito'] ?? 0),
        diasplazo: Number(obj['cxp_diasPlazo'] ?? 0),
        interes: Number(obj['cxp_interes'] ?? 0),
        moratorio: Number(obj['cxp_mora'] ?? 0),
      });
    });
  }

  private cargarProveedor(id: number) {
    this.cargando.set(true);
    this.service.getProveedor(id).subscribe({
      next: (p) => {
        this.form.patchValue({
          nroproveedor: p.nroproveedor,
          nombres: p.nombres,
          apellidos: p.apellidos,
          razonsocial: p.razonsocial,
          dni: p.dni,
          sexo: p.sexo,
          estadocivil: p.estadocivil,
          rtn: p.rtn,
          limiteCredito: Number(p.limiteCredito),
          diasplazo: Number(p.diasplazo),
          interes: Number(p.interes),
          moratorio: Number(p.moratorio),
          categoria: p.categoria,
          sn_activo: p.sn_activo === 'S' ? 'S' : 'N',
        });
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'Proveedor no encontrado' });
        if (this.modoRuta) this.nav.volver(['/cxp/proveedores']);
        else this.cancelar();
      },
    });
  }

  invalid(ctrl: string): boolean {
    const c = this.form.get(ctrl);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  cancelar() {
    if (this.modoInline()) {
      this.cancelled.emit();
    } else {
      this.nav.volver(['/cxp/proveedores']);
    }
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();

    const payload: any = this.esEdicion()
      ? { ...raw }
      : {
          ...raw,
          empresaId: this.auth.currentUser()?.empresaId,
          sn_activo: 'S',
        };

    this.guardando.set(true);
    const dniEfectivo = ((raw.dni as string) || '').trim() || '0000000000000';

    // DNI = llave maestra: verificar duplicado por empresa ANTES de registrar (dialogo bloqueante)
    this.service.dniExiste(dniEfectivo, this.esEdicion() ? this.proveedorId : undefined).subscribe({
      next: (r) => {
        if (r.existe) {
          this.guardando.set(false);
          this.bloqueoDni.set({ dni: dniEfectivo, nombre: r.nombre, numero: r.numero });
          this.dialogoDni.set(true);
          return;
        }
        this.registrar(payload);
      },
      // sin verificacion disponible: aplica el bloqueo 409 del backend
      error: () => this.registrar(payload),
    });
  }

  private registrar(payload: any): void {
    const dniEfectivo = (((this.form.getRawValue().dni as string) || '').trim()) || '0000000000000';
    const op = this.esEdicion()
      ? this.service.updateProveedor(this.proveedorId, payload)
      : this.service.createProveedor(payload);

    op.subscribe({
      next: () => {
        this.guardando.set(false);
        this.msgs.add({
          severity: 'success',
          summary: 'Guardado',
          detail: this.esEdicion() ? 'Proveedor actualizado' : 'Proveedor creado correctamente',
        });
        if (this.modoInline()) {
          this.saved.emit();
        } else {
          this.nav.volver(['/cxp/proveedores']);
        }
      },
      error: (err: any) => {
        this.guardando.set(false);
        if (err?.status === 409) {
          this.bloqueoDni.set({ dni: dniEfectivo, nombre: null, numero: null, detalle: err?.error?.message });
          this.dialogoDni.set(true);
        } else {
          this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el proveedor' });
        }
      },
    });
  }
}
