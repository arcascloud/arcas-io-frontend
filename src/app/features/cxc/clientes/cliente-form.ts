import { Component, inject, signal, OnInit, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageService } from 'primeng/api';
import { CxcService } from '../../../core/services/cxc.service';
import { AuthService } from '../../../core/services/auth.service';
import { NavegacionService } from '../../../core/services/navegacion.service';

@Component({
  selector: 'app-cliente-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    SelectButtonModule,
    DatePickerModule,
  ],
  templateUrl: './cliente-form.html',
  styleUrl: './cliente-form.scss',
})
export class ClienteForm implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(CxcService);
  private auth = inject(AuthService);
  private nav = inject(NavegacionService);
  private msgs = inject(MessageService);

  // ===== MODO INLINE (nuevo) =====
  clienteIdInput = input<number | null>(null); // null = nuevo, >0 = editar
  saved = output<void>();
  cancelled = output<void>();

  // ===== MODO RUTA (original) =====
  private _clienteId = 0;
  private _modoInline = false;

  esEdicion = signal(false);
  cargando = signal(false);
  guardando = signal(false);
  titulo = signal('Nuevo cliente');
  modoFacturacion = signal(false);

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
      nrocliente: [''],
      nombres: ['', Validators.required],
      apellidos: ['', Validators.required],
      razonsocial: [''],
      fechanacimiento: [null as Date | null],
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

    // Detectar modo facturacion desde query param
    const modo = this.route.snapshot.queryParamMap.get('modo');
    if (modo === 'facturacion') {
      this.modoFacturacion.set(true);
      this.form.get('nombres')?.setValidators([Validators.required]);
      this.form.get('apellidos')?.setValidators([Validators.required]);
      this.form.get('dni')?.setValidators([Validators.required]);
    }

    // Detectar modo: si viene clienteIdInput() -> modo inline
    // Si no, usar route params (modo original)
    const inlineId = this.clienteIdInput();
    if (inlineId != null) {
      this._modoInline = true;
      this._clienteId = inlineId;
      this.esEdicion.set(inlineId > 0);
      this.titulo.set(inlineId > 0 ? 'Editar cliente' : 'Nuevo cliente');
      if (inlineId > 0) {
        this.cargarCliente(inlineId);
      }
    } else {
      // Modo ruta original
      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
        this.esEdicion.set(true);
        this.titulo.set('Editar cliente');
        this._clienteId = Number(id);
        this.cargarCliente(this._clienteId);
      }
    }
  }

  private cargarCliente(id: number) {
    this.cargando.set(true);
    this.service.getCliente(id).subscribe({
      next: (c) => {
        this.form.patchValue({
          nrocliente: c.nrocliente,
          nombres: c.nombres,
          apellidos: c.apellidos,
          razonsocial: c.razonsocial,
          fechanacimiento: c.fechanacimiento ? new Date(c.fechanacimiento) : null,
          dni: c.dni,
          sexo: c.sexo,
          estadocivil: c.estadocivil,
          rtn: c.rtn,
          limiteCredito: Number(c.limiteCredito),
          diasplazo: Number(c.diasplazo),
          interes: Number(c.interes),
          moratorio: Number(c.moratorio),
          categoria: c.categoria,
          sn_activo: c.sn_activo === 'S' ? 'S' : 'N',
        });
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'Cliente no encontrado' });
        this.cancelar();
      },
    });
  }

  invalid(ctrl: string): boolean {
    const c = this.form.get(ctrl);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  cancelar() {
    if (this._modoInline) {
      this.cancelled.emit();
    } else {
      this.nav.volver(['/facturacion/nueva-factura']);
    }
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();

    const cleanPayload = (obj: any) => {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== null && value !== undefined && value !== '') {
          result[key] = value instanceof Date ? value.toISOString() : value;
        }
      }
      return result;
    };

    let payload: any;
    if (this.esEdicion()) {
      payload = { ...cleanPayload(raw) };
    } else {
      const cleaned = cleanPayload(raw);
      if (this.modoFacturacion()) {
        delete cleaned.diasplazo;
        delete cleaned.interes;
        delete cleaned.moratorio;
        delete cleaned.limiteCredito;
      }
      payload = {
        ...cleaned,
        empresaId: this.auth.currentUser()?.empresaId,
        sn_activo: 'S',
      };
    }

    this.guardando.set(true);
    const op = this.esEdicion()
      ? this.service.updateCliente(this._clienteId, payload as any)
      : this.service.createCliente(payload as any);

    op.subscribe({
      next: () => {
        this.guardando.set(false);
        this.msgs.add({
          severity: 'success',
          summary: 'Guardado',
          detail: this.esEdicion() ? 'Cliente actualizado' : 'Cliente creado correctamente',
        });
        if (this._modoInline) {
          this.saved.emit();
        } else {
          this.nav.volver(['/facturacion/nueva-factura']);
        }
      },
      error: () => {
        this.guardando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el cliente' });
      },
    });
  }
}