import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DatePickerModule } from 'primeng/datepicker';
import { Message } from 'primeng/message';
import { CheckboxModule } from 'primeng/checkbox';
import { TerminosDialog } from './terminos-dialog';
import { environment } from '../../../environments/environment';

/** Opción genérica para selects/segmentados ({label, value}). */
interface Opcion {
  label: string;
  value: string;
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
 * Registro de usuario como diálogo DENTRO del sistema (MainLayout),
 * con la misma estética login-hl que LoginDialog (panel de bienvenida
 * a la izquierda + formulario a la derecha).
 *
 * Flujo:
 * - Se abre desde el diálogo de login (botón "Registrarse").
 * - Completa datos personales, documento, ubicación y credenciales.
 * - Sugiere el usuario a partir de apellidos + primer nombre (editable).
 * - Crea la cuenta vía POST /auth/registro (tusuarios + tusuariosinfoinfo)
 *   y ofrece volver al login (output `solicitarLogin` → MainLayout).
 *
 * Catálogos geográficos (País/Departamento/Ciudad) se cargan bajo demanda
 * desde los endpoints públicos de worldcities.
 *
 * Límites de campos = estructura real:
 * - `tusuarios`: usuario 20, nombre/apellidos 80, email 30, password 250.
 * - `tusuariosinfoinfo`: nrodocumento 30, direccion 2000, telefono 80,
 *   pais/departamento/ciudad 80.
 */
@Component({
  selector: 'app-registro-dialog',
  standalone: true,
  imports: [
    FormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    SelectModule,
    SelectButtonModule,
    DatePickerModule,
    Message,
    CheckboxModule,
    TerminosDialog,
  ],
  templateUrl: './registro-dialog.html',
  styleUrl: './registro-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistroDialog {
  private http = inject(HttpClient);
  private destroyRef = inject(DestroyRef);

  /** Notifica a MainLayout que se desea abrir el diálogo de login. */
  readonly solicitarLogin = output<void>();

  visible = signal(false);
  terminosVisible = signal(false);
  readonly dialogStyle = { width: '50%' };
  readonly dialogBreakpoints = { '960px': '88vw', '640px': '96vw' };

  aceptaTerminos = false;
  errTerminos = signal('');

  // ── Opciones (siempre en TypeScript, nunca arrays inline en HTML) ──
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

  // ── Modelo del formulario (template-driven) ──
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
  email = '';
  confirmarEmail = '';
  password = '';
  confirmar = '';
  usuario = '';
  usuarioEditado = false; // el usuario ya escribió su propio usuario

  // ── Catálogos geográficos (señales: se cargan por HTTP) ──
  paises = signal<Opcion[]>([]);
  departamentos = signal<Opcion[]>([]);
  ciudades = signal<Opcion[]>([]);
  geoLoading = signal(false);
  private geoInicializada = false;

  loading = signal(false);
  error = signal('');
  exito = signal('');
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

  /**
   * Limpia el formulario completo: vuelve todo a los valores por defecto
   * (campos, catálogos dependientes, errores y mensajes).
   */
  limpiarFormulario(): void {
    this.nombres = '';
    this.apellidos = '';
    this.tipodoc = 'D';
    this.dni = '';
    this.celular = '';
    this.sexo = '';
    this.fechaNac = null;
    this.direccion = '';
    this.paisValue = '';
    this.deptoValue = '';
    this.ciudadValue = '';
    this.email = '';
    this.confirmarEmail = '';
    this.password = '';
    this.confirmar = '';
    this.usuario = '';
    this.usuarioEditado = false;

    // Catálogos dependientes (la lista de países se conserva: ya se cargó)
    this.departamentos.set([]);
    this.ciudades.set([]);

    this.loading.set(false);
    this.error.set('');
    this.exito.set('');
    this.errNombres.set('');
    this.errApellidos.set('');
    this.errTipodoc.set('');
    this.errDni.set('');
    this.errCelular.set('');
    this.errSexo.set('');
    this.errFecha.set('');
    this.errDireccion.set('');
    this.errPais.set('');
    this.errDepto.set('');
    this.errCiudad.set('');
    this.errEmail.set('');
    this.errConfirmarEmail.set('');
    this.errUsuario.set('');
    this.errPassword.set('');
    this.errConfirmar.set('');
    this.aceptaTerminos = false;
    this.errTerminos.set('');
  }

  abrirTerminos(event?: Event) {
    event?.preventDefault();
    this.terminosVisible.set(true);
  }

  /** Abre el diálogo: limpia el formulario y carga los catálogos la primera vez. */
  abrir(): void {
    this.limpiarFormulario();
    if (!this.geoInicializada) {
      this.geoInicializada = true;
      this.cargarPaises();
    }
    this.visible.set(true);
  }

  cerrar(): void {
    this.visible.set(false);
  }

  /** "Iniciar sesión" (panel de bienvenida o tras éxito) → abrir login. */
  irALogin(): void {
    this.visible.set(false);
    this.solicitarLogin.emit();
  }

  // ── Reglas de contraseña (vista en vivo) ──
  get pwdLargo(): boolean {
    return this.password.length >= 8;
  }

  get pwdMayuscula(): boolean {
    return /[A-ZÁÉÍÓÚÜÑ]/.test(this.password);
  }

  get pwdDigito(): boolean {
    return /[0-9]/.test(this.password);
  }

  get pwdEspecial(): boolean {
    return /[.,!@#$%^&*()=+~/?;:ñÑ]/.test(this.password);
  }

  /** Nombre dinámico del campo documento (DNI/RTN/...). */
  get etiquetaDoc(): string {
    return this.etiquetasTipodoc[this.tipodoc] || 'Documento';
  }

  // ── Sugerencia de usuario: apellidos + primer nombre ──
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
    this.usuario = valor;
    this.errUsuario.set('');
    this.usuarioEditado = true;
  }

  private actualizarSugerencia(): void {
    if (!this.usuarioEditado) {
      this.usuario = this.sugerirUsuario();
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

  // ── Envío ──
  registrar() {
    this.error.set('');
    this.exito.set('');

    const nombres = this.nombres.trim();
    const apellidos = this.apellidos.trim();
    const email = this.email.trim();
    const usuario = this.usuario.trim();
    const dni = this.dni.trim();
    const celular = this.celular.trim();
    const direccion = this.direccion.trim();

    // Validaciones inline por campo
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
    this.errCelular.set(!celular ? 'Ingrese su celular' : celular.length > 80 ? 'Máximo 80 caracteres' : '');
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
    this.errDireccion.set(!direccion ? 'Ingrese su dirección' : direccion.length > 2000 ? 'Máximo 2000 caracteres' : '');
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
    if (!this.password) {
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
        : this.confirmar !== this.password
          ? 'Las contraseñas no coinciden'
          : '',
    );

    this.errTerminos.set(!this.aceptaTerminos ? 'Debe aceptar los Términos y Condiciones' : '');

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
      this.errTerminos(),
    ];
    if (errores.some((e) => e)) return;

    const paisNombre =
      this.paises().find((p) => p.value === this.paisValue)?.label || '';

    this.loading.set(true);
    this.http
      .post<{ ok: boolean; usuario: string }>(`${environment.apiUrl}/auth/registro`, {
        usuario,
        nombre: nombres,
        apellidos,
        email,
        password: this.password,
        tipodoc: this.tipodoc,
        nrodocumento: dni,
        telefono: celular,
        sexo: this.sexo,
        fechanacimiento: this.fechaAISO(this.fechaNac),
        direccion,
        pais: paisNombre,
        departamento: this.deptoValue,
        ciudad: this.ciudadValue,
        origen: 'REGISTRO_DIALOG',
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resp) => {
          // Tras crear la cuenta: formulario limpio + mensaje de éxito
          const usuarioCreado = resp.usuario;
          this.limpiarFormulario();
          this.exito.set(
            `Cuenta creada correctamente. Ya puedes iniciar sesión con "${usuarioCreado}".`,
          );
        },
        error: (err) => {
          this.loading.set(false);
          const msg = Array.isArray(err.error?.message)
            ? err.error.message.join(', ')
            : err.error?.message || 'No se pudo crear la cuenta';
          this.error.set(msg);
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
