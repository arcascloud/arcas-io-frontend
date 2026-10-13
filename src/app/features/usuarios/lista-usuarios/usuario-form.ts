import { Component, DestroyRef, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageService } from 'primeng/api';
import { UsuariosService } from '../../../core/services/usuarios.service';
import { EmpresasService } from '../../../core/services/empresas.service';
import { SucursalesService } from '../../../core/services/sucursales.service';
import { AuthService } from '../../../core/services/auth.service';
import { PlanillaService } from '../../../core/services/planilla.service';
import { Empresa } from '../../../core/models/empresa.models';
import { Sucursal } from '../../../core/models/sucursal.models';
import { PlanillaEmpleado } from '../../../core/models/planilla.models';
import { UsuarioInfo } from '../../../core/models/usuario.models';
import { environment } from '../../../../environments/environment';

/** Opción genérica para selects/segmentados ({label, value}). */
interface Opcion {
  label: string;
  value: string;
}

/** Opción numérica para select de empleado ({label, value}). */
interface OpcionNum {
  label: string;
  value: number;
}

interface FilaAdmin {
  admin_name: string;
}

interface FilaPais {
  country: string;
  iso2: string;
}

interface FilaCiudad {
  city: string;
}

interface RespuestaCiudades {
  data: FilaCiudad[];
}

/**
 * Formulario de usuarios — Configuración › Usuarios.
 *
 * Dos modos según la ruta:
 *
 * - **Nuevo** (`/usuarios/nuevo`): **registro completo replicado** del
 *   diálogo `RegistroDialog` (datos personales, documento, ubicación,
 *   credenciales y sugerencia de usuario), presentado como PÁGINA
 *   normal — sin ventana de diálogo. Envía `POST /auth/registro`
 *   (alta atómica en `tusuarios` + `tusuariosinfoinfo`).
 * - **Editar** (`/usuarios/editar/:id`): formulario reactivo existente
 *   (usuario, nombre, email, empresa, sucursal, contraseña, estado).
 */
@Component({
  selector: 'app-usuario-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    SelectButtonModule,
    SelectModule,
    DatePickerModule,
  ],
  templateUrl: './usuario-form.html',
  styleUrl: './usuario-form.scss',
})
export class UsuarioForm implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(UsuariosService);
  private empresasSvc = inject(EmpresasService);
  private sucursalesSvc = inject(SucursalesService);
  private auth = inject(AuthService);
  private planillaSvc = inject(PlanillaService);
  private msgs = inject(MessageService);
  private http = inject(HttpClient);
  private destroyRef = inject(DestroyRef);

  esEdicion = signal(false);
  cargando = signal(false);
  guardando = signal(false);
  titulo = signal('Nuevo usuario');
  errorPassword = signal('');
  empresas = signal<Empresa[]>([]);
  sucursales = signal<Sucursal[]>([]);
  empresasCargando = signal(false);
  sucursalesCargando = signal(false);

  // ── Vínculo con empleado (p-select en ambos modos) ──
  /** Catálogo de empleados de la empresa (cargado una vez para ambos modos). */
  empleados = signal<PlanillaEmpleado[]>([]);
  empleadosCargando = signal(false);
  /** Información extendida del usuario en edición (`tusuariosinfoinfo`). */
  infoEdicion = signal<UsuarioInfo | null>(null);
  infoCargando = signal(false);
  /** Empleado elegido en modo nuevo (template-driven). */
  empleadoId: number | null = null;

  /** PK numérico del usuario en edición (para `GET/PUT /users/info/:usuarioId`). */
  private usuarioIdNum = 0;
  /** Valores originales de `tusuariosinfoinfo` en edición — para detectar cambios. */
  private infoOriginal = { sexo: '', fecnac: '', empleadoId: null as number | null };

  readonly snOptions = [
    { label: 'Activo', value: 'S' },
    { label: 'Inactivo', value: 'N' },
  ];

  private usuarioId = '';

  form!: FormGroup;

  // ── Registro completo (modo nuevo) — réplica de RegistroDialog ──
  readonly opcionesTipodoc: Opcion[] = [
    { label: 'DNI', value: 'D' },
    { label: 'RTN', value: 'R' },
    { label: 'LICENCIA', value: 'L' },
    { label: 'CARNET RESIDENTE', value: 'C' },
    { label: 'PASAPORTE', value: 'P' },
  ];

  readonly opcionesSexo: Opcion[] = [
    { label: 'MASCULINO', value: 'M' },
    { label: 'FEMENINO', value: 'F' },
  ];

  /** Fecha de nacimiento permitida: 1 de enero de 1931 hasta hoy. */
  readonly fechaMin = new Date(1931, 0, 1);
  readonly fechaMax = new Date();

  /** Etiqueta dinámica del campo de documento según el tipo elegido. */
  readonly etiquetasTipodoc: Record<string, string> = {
    D: 'DNI',
    R: 'RTN',
    L: 'Licencia',
    C: 'Carnet de residente',
    P: 'Pasaporte',
  };

  // Modelo del registro (template-driven)
  nombres = '';
  apellidos = '';
  tipodoc = 'D';
  dni = '';
  celular = '';
  sexo = '';
  fechaNac: Date | null = null;
  direccion = '';
  paisValue = ''; // value = iso2 del país elegido
  deptoValue = '';
  ciudadValue = '';
  emailRegistro = '';
  confirmarEmail = '';
  passwordRegistro = '';
  confirmar = '';
  usuarioRegistro = '';
  usuarioEditado = false; // el usuario ya escribió su propio usuario

  // Catálogos geográficos (endpoints públicos de worldcities)
  paises = signal<Opcion[]>([]);
  departamentos = signal<Opcion[]>([]);
  ciudades = signal<Opcion[]>([]);
  geoLoading = signal(false);

  // Errores inline por campo del registro
  errNombres = signal('');
  errApellidos = signal('');
  errTipodoc = signal('');
  errDni = signal('');
  errCelular = signal('');
  errSexo = signal('');
  errFecha = signal('');
  errDireccion = signal('');
  errPais = signal('');
  errDepto = signal('');
  errCiudad = signal('');
  errEmail = signal('');
  errConfirmarEmail = signal('');
  errUsuario = signal('');
  errPassword = signal('');
  errConfirmar = signal('');

  ngOnInit() {
    this.form = this.fb.group({
      usuario: ['', Validators.required],
      nombre: ['', Validators.required],
      apellidos: ['', Validators.required],
      sexo: ['' as string, Validators.required],
      fechanacimiento: [null as Date | null, Validators.required],
      email: ['', [Validators.required, Validators.email]],
      confirmarEmail: [''],
      password: ['', [Validators.maxLength(20)]],
      confirmarPassword: [''],
      sn_activo: ['S' as 'S' | 'N'],
      empresaId: [null as number | null, Validators.required],
      Idsucursal: [null as number | null, Validators.required],
      empleadoId: [null as number | null],
    });

    this.cargarEmpleados();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      // ── Modo edición: formulario reactivo existente ──
      this.esEdicion.set(true);
      this.titulo.set('Editar usuario');
      this.usuarioId = id;
      this.cargarEmpresas();
      this.cargando.set(true);
      this.service.getOne(id).subscribe({
        next: (u) => {
          this.usuarioIdNum = u.usuarioId;
          this.form.patchValue({
            usuario: u.usuario,
            nombre: u.nombre,
            apellidos: u.apellidos || '',
            email: u.email,
            sn_activo: u.sn_activo,
            empresaId: u.empresaId,
          });
          this.cargarSucursales(u.empresaId, u.Idsucursal);
          if (u.usuarioId) {
            this.cargarInfo(u.usuarioId);
          } else {
            this.cargando.set(false);
          }
        },
        error: () => {
          this.cargando.set(false);
          this.msgs.add({ severity: 'error', summary: 'Error', detail: 'Usuario no encontrado' });
          this.volver();
        },
      });
    } else {
      // ── Modo nuevo: registro completo réplica (página, sin diálogo) ──
      this.cargarPaises();
    }
  }

  private cargarEmpresas() {
    this.empresasCargando.set(true);
    this.empresasSvc.getAll().subscribe({
      next: (list) => {
        const actual = this.auth.currentUser()?.empresaId;
        this.empresas.set(list.filter((e) => e.sn_activo === 'S' || e.empresaId === actual));
        this.empresasCargando.set(false);
      },
      error: () => {
        this.empresasCargando.set(false);
        this.msgs.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las empresas',
        });
      },
    });
  }

  private cargarSucursales(empresaId: number, seleccionarId?: number) {
    this.sucursalesCargando.set(true);
    this.sucursalesSvc.getAll(empresaId).subscribe({
      next: (list) => {
        this.sucursales.set(list.filter((s) => s.sn_activo === 'S'));
        if (seleccionarId !== undefined) {
          this.form.get('Idsucursal')?.patchValue(seleccionarId);
        }
        this.sucursalesCargando.set(false);
      },
      error: () => {
        this.sucursales.set([]);
        this.sucursalesCargando.set(false);
        this.msgs.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las sucursales',
        });
      },
    });
  }

  onEmpresaChange(event: { value: number }) {
    this.form.get('Idsucursal')?.reset();
    if (event.value) {
      this.cargarSucursales(event.value);
    }
  }

  // ── Vínculo con empleado (ambos modos) ──

  private cargarEmpleados(): void {
    this.empleadosCargando.set(true);
    this.planillaSvc
      .getEmpleados()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) => {
          this.empleados.set(list || []);
          this.empleadosCargando.set(false);
        },
        error: () => {
          this.empleados.set([]);
          this.empleadosCargando.set(false);
        },
      });
  }

  /**
   * Carga `tusuariosinfoinfo` del usuario en edición para conocer su
   * `nrodocumento` (filtro del select), el `empleadoId`, el sexo y la
   * fecha de nacimiento. Guarda los originales para detectar cambios.
   */
  private cargarInfo(usuarioId: number): void {
    this.infoCargando.set(true);
    this.service
      .getInfo(usuarioId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (info) => {
          this.infoEdicion.set(info);
          const fecnacISO = info.fecnac ? String(info.fecnac).slice(0, 10) : '';
          this.infoOriginal = {
            sexo: info.sexo ?? '',
            fecnac: fecnacISO,
            empleadoId: info.empleadoId ?? null,
          };
          this.form.patchValue({
            empleadoId: info.empleadoId ?? null,
            sexo: info.sexo ?? 'M',
            // Fecha local explícita (evita desfase UTC de `new Date(iso)`)
            fechanacimiento: fecnacISO
              ? new Date(+fecnacISO.slice(0, 4), +fecnacISO.slice(5, 7) - 1, +fecnacISO.slice(8, 10))
              : null,
          });
          this.infoCargando.set(false);
          this.cargando.set(false);
        },
        error: () => {
          // 404 = el usuario no tiene información registrada → no se pueden
          // editar sexo/fecha/empleado (no hay fila en tuinfosinfoinfo)
          this.infoEdicion.set(null);
          this.form.get('sexo')?.disable();
          this.form.get('fechanacimiento')?.disable();
          this.infoCargando.set(false);
          this.cargando.set(false);
        },
      });
  }

  /** Documento usado como filtro: `nrodocumento` (edición) o `dni` digitado (nuevo). */
  private get docFiltro(): string {
    const doc = this.esEdicion() ? (this.infoEdicion()?.nrodocumento ?? '') : this.dni;
    return (doc || '').trim();
  }

  /** Empleado seleccionado (fuente según el modo). */
  private get valorEmpleado(): number | null {
    return this.esEdicion() ? (this.form.get('empleadoId')?.value ?? null) : this.empleadoId;
  }

  /** Opciones del select: empleados cuyo `dni` coincide con el documento del filtro. */
  get opcionesEmpleado(): OpcionNum[] {
    const doc = this.docFiltro;
    if (!doc) return [];
    const lista: OpcionNum[] = this.empleados()
      .filter((e) => (e.nrodocumento || '').trim() === doc)
      .map((e) => ({ label: `${e.nombres} ${e.apellidos}`.trim(), value: e.empleadoId }));
    // Mantener visible el vínculo actual aunque su DNI ya no coincida
    const actual = this.valorEmpleado;
    if (actual != null && !lista.some((o) => o.value === actual)) {
      const emp = this.empleados().find((e) => e.empleadoId === actual);
      if (emp) {
        lista.push({ label: `${emp.nombres} ${emp.apellidos}`.trim(), value: emp.empleadoId });
      }
    }
    return lista;
  }

  get placeholderEmpleado(): string {
    if (this.empleadosCargando()) return 'Cargando empleados...';
    if (this.infoCargando()) return 'Cargando documento...';
    if (!this.docFiltro) {
      return this.esEdicion() ? 'Sin documento registrado' : 'Ingrese primero el documento';
    }
    return this.opcionesEmpleado.length ? 'Seleccionar empleado' : 'Sin coincidencias';
  }

  get empleadoDisabled(): boolean {
    if (this.empleadosCargando()) return true;
    if (this.esEdicion()) return this.infoCargando() || !this.infoEdicion();
    return !this.dni.trim();
  }

  /** Cambio del documento en modo nuevo: limpia errores y desvincula si ya no coincide. */
  onDniChange(valor: string): void {
    this.dni = valor;
    this.errDni.set('');
    const sel = this.empleadoId;
    if (sel != null && !this.opcionesEmpleado.some((o) => o.value === sel)) {
      this.empleadoId = null;
    }
  }

  invalid(ctrl: string): boolean {
    const c = this.form.get(ctrl);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  volver() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  // ─────────────────────────────────────────────────────────────
  // Edición (formulario reactivo)
  // ─────────────────────────────────────────────────────────────

  validarPassword(pw: string): boolean {
    if (!pw && !this.esEdicion()) {
      this.form.get('password')?.setErrors({ required: true });
      this.errorPassword.set('');
      return false;
    }
    if (!pw) {
      this.errorPassword.set('');
      return true;
    }
    if (pw.length < 8) {
      this.errorPassword.set('Debe tener al menos 8 caracteres');
      return false;
    }
    if (!/[A-Z]/.test(pw)) {
      this.errorPassword.set('Debe contener una letra mayúscula');
      return false;
    }
    if (!/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\;'/]/.test(pw)) {
      this.errorPassword.set('Debe contener un carácter especial');
      return false;
    }
    this.errorPassword.set('');
    return true;
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();

    // ── Confirmación de correo ──
    this.errConfirmarEmail.set(
      !raw.confirmarEmail
        ? 'Confirme su correo'
        : raw.confirmarEmail !== (raw.email || '')
          ? 'Los correos no coinciden'
          : ''
    );
    // ── Confirmación de contraseña ──
    if (raw.password) {
      this.errConfirmar.set(
        !raw.confirmarPassword
          ? 'Confirme la contraseña'
          : raw.confirmarPassword !== raw.password
            ? 'Las contraseñas no coinciden'
            : ''
      );
    } else {
      this.errConfirmar.set(raw.confirmarPassword ? 'Deje vacío junto con la contraseña' : '');
    }
    if (this.errConfirmarEmail() || this.errConfirmar()) return;
    if (!this.validarPassword(raw.password || '')) return;

    this.guardando.set(true);

    const dto: Record<string, unknown> = {
      nombre: raw.nombre,
      apellidos: raw.apellidos,
      email: raw.email,
      sn_activo: raw.sn_activo,
      Idsucursal: raw.Idsucursal,
    };
    if (raw.password) {
      dto['password'] = raw.password;
    }

    // ── Cambios en tuinfosinfoinfo: sexo, fecha de nacimiento, empleado ──
    const hayInfo = this.infoEdicion() != null;
    const cambios: Partial<UsuarioInfo> = {};
    if (hayInfo) {
      const sexoNuevo = raw.sexo ?? '';
      if (sexoNuevo !== this.infoOriginal.sexo) {
        cambios.sexo = sexoNuevo as 'M' | 'F';
      }
      const fecnacNuevo = raw.fechanacimiento ? this.fechaAISO(raw.fechanacimiento) : '';
      if (fecnacNuevo !== this.infoOriginal.fecnac) {
        cambios.fecnac = fecnacNuevo || null;
      }
      const empNuevo: number | null = raw.empleadoId ?? null;
      if (empNuevo !== this.infoOriginal.empleadoId) {
        cambios.empleadoId = empNuevo;
      }
    }
    const infoCambiada = hayInfo && Object.keys(cambios).length > 0;

    this.service.update(this.usuarioId, dto as any).subscribe({
      next: () => {
        if (infoCambiada && this.usuarioIdNum) {
          // Usuario OK → guardar cambios de información extendida
          this.service.updateInfo(this.usuarioIdNum, cambios).subscribe({
            next: () => {
              this.guardando.set(false);
              this.msgs.add({
                severity: 'success',
                summary: 'Guardado',
                detail: 'Usuario actualizado',
              });
              this.volver();
            },
            error: () => {
              this.guardando.set(false);
              this.msgs.add({
                severity: 'warn',
                summary: 'Guardado parcial',
                detail: 'Usuario actualizado, pero no se pudo guardar la información extendida',
              });
            },
          });
          return;
        }
        this.guardando.set(false);
        this.msgs.add({
          severity: 'success',
          summary: 'Guardado',
          detail: 'Usuario actualizado',
        });
        this.volver();
      },
      error: () => {
        this.guardando.set(false);
        this.msgs.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo guardar el usuario',
        });
      },
    });
  }

  // ─────────────────────────────────────────────────────────────
  // Registro completo (modo nuevo) — lógica réplica de RegistroDialog
  // ─────────────────────────────────────────────────────────────

  // ── Reglas de contraseña (vista en vivo — ambos modos) ──
  /** Contraseña actualmente escrita según el modo (edición: form; nuevo: registro). */
  private get pwdActual(): string {
    if (this.esEdicion()) {
      return this.form?.get('password')?.value || '';
    }
    return this.passwordRegistro;
  }

  get pwdLargo(): boolean {
    return this.pwdActual.length >= 8;
  }

  get pwdMayuscula(): boolean {
    return /[A-ZÁÉÍÓÚÜÑ]/.test(this.pwdActual);
  }

  get pwdDigito(): boolean {
    return /[0-9]/.test(this.pwdActual);
  }

  get pwdEspecial(): boolean {
    return /[.,!@#$%^&*()=+~/?;:ñÑ]/.test(this.pwdActual);
  }

  /** Nombre dinámico del campo documento (DNI/RTN/...). */
  get etiquetaDoc(): string {
    return this.etiquetasTipodoc[this.tipodoc] || 'Documento';
  }

  onNombreChange(valor: string): void {
    this.nombres = valor;
    this.errNombres.set('');
    this.actualizarSugerencia();
  }

  onApellidosChange(valor: string): void {
    this.apellidos = valor;
    this.errApellidos.set('');
    this.actualizarSugerencia();
  }

  onUsuarioChange(valor: string): void {
    this.usuarioRegistro = valor;
    this.errUsuario.set('');
    this.usuarioEditado = true;
  }

  private actualizarSugerencia(): void {
    if (!this.usuarioEditado) {
      this.usuarioRegistro = this.sugerirUsuario();
    }
  }

  /** "Pérez López" + "Juan Carlos" → perezlopezjuan (máx. 20, sin acentos/espacios). */
  private sugerirUsuario(): string {
    const apellidos = this.normalizar(this.apellidos);
    const primerNombre = this.normalizar(this.nombres.trim().split(/\s+/)[0] || '');
    return (apellidos + primerNombre).slice(0, 20);
  }

  private normalizar(texto: string): string {
    return (texto || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // quitar acentos
      .replace(/[^a-z0-9]/g, ''); // quitar todo lo no alfanumérico
  }

  // ── Catálogos geográficos (endpoints públicos de worldcities) ──
  private cargarPaises(): void {
    this.geoLoading.set(true);
    this.http
      .get<FilaPais[]>(`${environment.apiUrl}/parametros/worldcities/paises`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (filas) => {
          const lista: Opcion[] = (filas || [])
            .map((f) => ({ label: f.country || '', value: f.iso2 || '' }))
            .filter((o) => o.label && o.value);
          this.paises.set(lista);
          this.geoLoading.set(false);
        },
        error: () => this.geoLoading.set(false),
      });
  }

  onPaisChange(): void {
    this.errPais.set('');
    this.errDepto.set('');
    this.errCiudad.set('');
    this.deptoValue = '';
    this.ciudadValue = '';
    this.departamentos.set([]);
    this.ciudades.set([]);
    if (!this.paisValue) return;

    this.geoLoading.set(true);
    this.http
      .get<FilaAdmin[]>(
        `${environment.apiUrl}/parametros/worldcities/admin?iso2=${encodeURIComponent(this.paisValue)}`,
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (filas) => {
          const lista = filas
            .map((f) => f.admin_name)
            .filter((n) => !!n)
            .map((n) => ({ label: n, value: n }));
          this.departamentos.set(lista);
          this.geoLoading.set(false);
        },
        error: () => this.geoLoading.set(false),
      });
  }

  onDeptoChange(): void {
    this.errDepto.set('');
    this.errCiudad.set('');
    this.ciudadValue = '';
    this.ciudades.set([]);
    if (!this.deptoValue || !this.paisValue) return;

    this.geoLoading.set(true);
    this.http
      .get<RespuestaCiudades>(
        `${environment.apiUrl}/parametros/worldcities?iso2=${encodeURIComponent(
          this.paisValue,
        )}&admin_name=${encodeURIComponent(this.deptoValue)}&rows=500`,
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resp) => {
          const unicas = new Set<string>();
          for (const fila of resp?.data || []) {
            if (fila?.city) unicas.add(fila.city);
          }
          const lista = Array.from(unicas)
            .sort((a, b) => a.localeCompare(b))
            .map((n) => ({ label: n, value: n }));
          this.ciudades.set(lista);
          this.geoLoading.set(false);
        },
        error: () => this.geoLoading.set(false),
      });
  }

  /** Envía el registro completo a POST /auth/registro (público). */
  registrar() {
    if (this.guardando()) return;

    const nombres = this.nombres.trim();
    const apellidos = this.apellidos.trim();
    const email = this.emailRegistro.trim();
    const usuario = this.usuarioRegistro.trim();
    const dni = this.dni.trim();
    const celular = this.celular.trim();
    const direccion = this.direccion.trim();

    // Validaciones inline por campo (mismas del diálogo de registro)
    this.errNombres.set(!nombres ? 'Ingrese sus nombres' : '');
    this.errApellidos.set(!apellidos ? 'Ingrese sus apellidos' : '');
    this.errTipodoc.set(!this.tipodoc ? 'Seleccione el tipo de documento' : '');
    this.errDni.set(
      !dni
        ? `Ingrese su ${this.etiquetaDoc}`
        : dni.length > 30
          ? 'Máximo 30 caracteres'
          : '',
    );
    this.errCelular.set(
      !celular ? 'Ingrese su celular' : celular.length > 80 ? 'Máximo 80 caracteres' : '',
    );
    this.errSexo.set(!this.sexo ? 'Seleccione su sexo' : '');
    this.errFecha.set(!this.fechaNac ? 'Ingrese su fecha de nacimiento' : '');
    if (this.fechaNac) {
      const anio = this.fechaNac.getFullYear();
      if (anio < 1931) {
        this.errFecha.set('La fecha no puede ser anterior a 1931');
      } else if (anio > this.fechaMax.getFullYear()) {
        this.errFecha.set('La fecha no puede ser futura');
      }
    }
    this.errDireccion.set(
      !direccion ? 'Ingrese su dirección' : direccion.length > 2000 ? 'Máximo 2000 caracteres' : '',
    );
    this.errPais.set(!this.paisValue ? 'Seleccione su país' : '');
    this.errDepto.set(!this.deptoValue ? 'Seleccione su departamento' : '');
    this.errCiudad.set(!this.ciudadValue ? 'Seleccione su ciudad' : '');
    this.errEmail.set(
      !email
        ? 'Ingrese su correo'
        : !this.emailValido(email)
          ? 'Correo no válido'
          : email.length > 30
            ? 'Máximo 30 caracteres'
            : '',
    );
    this.errConfirmarEmail.set(
      !this.confirmarEmail.trim()
        ? 'Confirme su correo'
        : this.confirmarEmail.trim() !== email
          ? 'Los correos no coinciden'
          : '',
    );
    this.errUsuario.set(
      !usuario
        ? 'Ingrese un usuario'
        : /\s/.test(usuario)
          ? 'No debe contener espacios'
          : usuario.length < 3
            ? 'Mínimo 3 caracteres'
            : '',
    );

    // Contraseña: 8 + mayúscula + número + especial
    if (!this.passwordRegistro) {
      this.errPassword.set('Ingrese una contraseña');
    } else if (!this.pwdLargo) {
      this.errPassword.set('Mínimo 8 caracteres');
    } else if (!this.pwdMayuscula) {
      this.errPassword.set('Debe contener al menos 1 mayúscula');
    } else if (!this.pwdDigito) {
      this.errPassword.set('Debe contener al menos 1 número');
    } else if (!this.pwdEspecial) {
      this.errPassword.set('Debe contener al menos 1 carácter especial');
    } else {
      this.errPassword.set('');
    }

    this.errConfirmar.set(
      !this.confirmar
        ? 'Confirme la contraseña'
        : this.confirmar !== this.passwordRegistro
          ? 'Las contraseñas no coinciden'
          : '',
    );

    const errores = [
      this.errNombres(),
      this.errApellidos(),
      this.errTipodoc(),
      this.errDni(),
      this.errCelular(),
      this.errSexo(),
      this.errFecha(),
      this.errDireccion(),
      this.errPais(),
      this.errDepto(),
      this.errCiudad(),
      this.errEmail(),
      this.errConfirmarEmail(),
      this.errUsuario(),
      this.errPassword(),
      this.errConfirmar(),
    ];
    if (errores.some((e) => e)) return;

    const paisNombre =
      this.paises().find((p) => p.value === this.paisValue)?.label || '';

    const body: Record<string, unknown> = {
      usuario,
      nombre: nombres,
      apellidos,
      email,
      password: this.passwordRegistro,
      tipodoc: this.tipodoc,
      nrodocumento: dni,
      telefono: celular,
      sexo: this.sexo,
      fechanacimiento: this.fechaAISO(this.fechaNac),
      direccion,
      pais: paisNombre,
      departamento: this.deptoValue,
      ciudad: this.ciudadValue,
    };
    // Vínculo opcional con empleado (validado en backend: existe y su DNI coincide)
    if (this.empleadoId != null) {
      body['empleadoId'] = this.empleadoId;
    }

    this.guardando.set(true);
    this.http
      .post<{ ok: boolean; usuario: string }>(`${environment.apiUrl}/auth/registro`, body)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resp) => {
          this.guardando.set(false);
          // El backend agrega sufijo (2, 3...) si el usuario ya existía
          const detalle =
            resp.usuario === usuario
              ? 'Usuario creado correctamente'
              : `El usuario "${usuario}" ya existía; se creó como "${resp.usuario}"`;
          this.msgs.add({ severity: 'success', summary: 'Usuario creado', detail: detalle });
          this.volver();
        },
        error: () => {
          // El interceptor global ya muestra el toast con el mensaje del backend
          this.guardando.set(false);
        },
      });
  }

  private fechaAISO(fecha: Date | null): string {
    if (!fecha) return '';
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${fecha.getFullYear()}-${mes}-${dia}`;
  }

  private emailValido(valor: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
  }
}
