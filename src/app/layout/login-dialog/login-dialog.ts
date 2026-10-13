import {
  Component,
  DestroyRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { Message } from 'primeng/message';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../core/services/auth.service';

/**
 * Login en diálogo HEADLESS (PrimeNG Dialog → <ng-template #headless>).
 *
 * - Replica la estética de la pantalla de login con SCSS PROPIO
 *   (NO modifica main-layout.scss ni login.scss).
 * - Checkbox "Es cliente": sincronizado con el toggle Cliente/Empleado del topbar.
 * - Checkbox "Recordar lo que indiqué": persiste usuario + tipo de persona.
 * - Checkbox "Recordar contraseña": persiste la contraseña OFUSCADA (XOR+base64)
 *   en localStorage — misma advertencia de siempre: no es criptografía real,
 *   cualquier script con acceso al localStorage puede leerla.
 * - UX de campos: errores inline, mínimo de caracteres y aviso de Bloq Mayús.
 * - Sin banner de sesión: se quitó por decisión del usuario.
 */
@Component({
  selector: 'app-login-dialog',
  standalone: true,
  imports: [
    FormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    CheckboxModule,
    Message,
  ],
  templateUrl: './login-dialog.html',
  styleUrl: './login-dialog.scss',
})
export class LoginDialog {
  private auth = inject(AuthService);
  private msgs = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  /** Misma clave de persistencia que el drawer en main-layout (preferencia compartida) */
  private static readonly CLAVE_RECORDAR = 'drawer_login_preferencias';
  /** Clave independiente para la contraseña ofuscada */
  private static readonly CLAVE_PASSWORD = 'login_dialog_password';
  /** Clave XOR de ofuscación (obfuscação, NO encriptación) */
  private static readonly CLAVE_OBF = 'arcas-login-2026';

  visible = signal(false);

  /** Tipo de persona del topbar: 'C' = Cliente, 'E' = Empleado */
  readonly tipoPersona = input<string>('C');
  /** Notifica al padre un cambio de tipo de persona (checkbox "Es cliente") */
  readonly tipoPersonaChange = output<string>();
  /** Notifica a MainLayout que se debe abrir el diálogo de registro */
  readonly registro = output<void>();

  usuario = signal('');
  password = signal('');
  loading = signal(false);
  error = signal('');
  recordar = signal(false);
  recordarPassword = signal(false);
  capsLock = signal(false);
  errUsuario = signal('');
  errPassword = signal('');

  /** true si la persona indicada es cliente (checkbox 1) */
  get esCliente(): boolean {
    return this.tipoPersona() === 'C';
  }

  /** Limpia el formulario completo: campos, errores y avisos. */
  limpiarFormulario(): void {
    this.error.set('');
    this.errUsuario.set('');
    this.errPassword.set('');
    this.capsLock.set(false);
    this.usuario.set('');
    this.password.set('');
    this.recordar.set(false);
    this.recordarPassword.set(false);
  }

  /** Abre el diálogo: limpia el formulario y restaura solo lo que pidió recordar */
  abrir() {
    this.limpiarFormulario();
    this.cargarPreferencias();
    this.cargarPassword();
    this.visible.set(true);
  }

  cerrar() {
    this.visible.set(false);
  }

  /** Botón "Registrarse": cierra este diálogo y notifica al padre
   *  para abrir el de registro (ambos viven dentro del sistema) */
  registrarse() {
    this.visible.set(false);
    this.registro.emit();
  }

  // ==================== Campos: input + validación ====================

  onUsuarioInput(valor: string) {
    this.usuario.set(valor);
    this.errUsuario.set('');
  }

  onPasswordInput(valor: string) {
    this.password.set(valor);
    this.errPassword.set('');
  }

  /** Detecta Bloq Mayús al escribir en la contraseña */
  onPasswordKey(event: KeyboardEvent) {
    try {
      this.capsLock.set(event.getModifierState('CapsLock'));
    } catch {
      // navegador sin getModifierState → se ignora
    }
  }

  onPasswordBlur() {
    this.capsLock.set(false);
  }

  // ==================== Checkboxes ====================

  onEsClienteChange(esCliente: boolean) {
    this.tipoPersonaChange.emit(esCliente ? 'C' : 'E');
    this.guardarPreferencias();
  }

  onRecordarChange(recordar: boolean) {
    this.recordar.set(recordar);
    if (!recordar) {
      // sin "recordar lo que indiqué" la contraseña guardada no tiene caso
      this.recordarPassword.set(false);
      localStorage.removeItem(LoginDialog.CLAVE_PASSWORD);
    }
    this.guardarPreferencias();
  }

  onRecordarPasswordChange(recordar: boolean) {
    this.recordarPassword.set(recordar);
    if (recordar) {
      this.guardarPassword();
    } else {
      localStorage.removeItem(LoginDialog.CLAVE_PASSWORD);
    }
  }

  // ==================== Persistencia ====================

  /** Guarda (o limpia) usuario + tipo de persona indicado */
  private guardarPreferencias() {
    if (this.recordar()) {
      localStorage.setItem(
        LoginDialog.CLAVE_RECORDAR,
        JSON.stringify({
          usuario: this.usuario(),
          tipoPersona: this.tipoPersona(),
        }),
      );
    } else {
      localStorage.removeItem(LoginDialog.CLAVE_RECORDAR);
    }
  }

  /** Restaura lo guardado al abrir (si el usuario pidió recordar) */
  private cargarPreferencias() {
    try {
      const raw = localStorage.getItem(LoginDialog.CLAVE_RECORDAR);
      if (!raw) {
        this.recordar.set(false);
        return;
      }
      const data = JSON.parse(raw);
      if (data?.usuario) this.usuario.set(String(data.usuario));
      if (data?.tipoPersona === 'C' || data?.tipoPersona === 'E') {
        this.tipoPersonaChange.emit(data.tipoPersona);
      }
      this.recordar.set(true);
    } catch {
      this.recordar.set(false);
    }
  }

  /** Guarda la contraseña ofuscada (solo si el checkbox está activo y hay datos) */
  private guardarPassword() {
    if (!this.recordarPassword()) return;
    const usuario = this.usuario().trim();
    const pw = this.password();
    if (!usuario || !pw) return;
    localStorage.setItem(
      LoginDialog.CLAVE_PASSWORD,
      JSON.stringify({ usuario, password: LoginDialog.ofuscar(pw) }),
    );
  }

  /** Precarga la contraseña guardada si coincide con el usuario indicado */
  private cargarPassword() {
    this.recordarPassword.set(false);
    if (!this.recordar()) return; // requiere "recordar lo que indiqué"
    try {
      const raw = localStorage.getItem(LoginDialog.CLAVE_PASSWORD);
      if (!raw) return;
      const data = JSON.parse(raw);
      const usuario = this.usuario().trim();
      if (!data?.password || !usuario || data.usuario !== usuario) return;
      const pw = LoginDialog.desofuscar(data.password);
      if (!pw) return;
      this.password.set(pw);
      this.recordarPassword.set(true);
    } catch {
      // registro corrupto → se ignora
    }
  }

  /** Ofusca texto para guardarlo en localStorage (XOR + base64). No es encriptación real. */
  private static ofuscar(texto: string): string {
    const clave = new TextEncoder().encode(LoginDialog.CLAVE_OBF);
    const bytes = new TextEncoder().encode(texto);
    const out = bytes.map((b, i) => b ^ clave[i % clave.length]);
    return btoa(String.fromCharCode(...out));
  }

  /** Invierte ofuscar(); devuelve '' si el contenido está corrupto */
  private static desofuscar(codificado: string): string {
    try {
      const clave = new TextEncoder().encode(LoginDialog.CLAVE_OBF);
      const bytes = Uint8Array.from(atob(codificado), (c) => c.charCodeAt(0));
      const out = bytes.map((b, i) => b ^ clave[i % clave.length]);
      return new TextDecoder().decode(out);
    } catch {
      return '';
    }
  }

  // ==================== Ingreso ====================

  /** Ingreso: reemplaza token/usuario de la sesión (AuthService.login) */
  ingresar() {
    this.error.set('');
    const usuario = this.usuario().trim();
    const password = this.password();

    // Validaciones de campo (inline)
    this.errUsuario.set('');
    this.errPassword.set('');
    if (!usuario) {
      this.errUsuario.set('Ingrese su usuario');
    } else if (/\s/.test(usuario)) {
      this.errUsuario.set('No debe contener espacios');
    } else if (usuario.length < 3) {
      this.errUsuario.set('Mínimo 3 caracteres');
    }
    if (!password) {
      this.errPassword.set('Ingrese su contraseña');
    } else if (password.length < 4) {
      this.errPassword.set('Mínimo 4 caracteres');
    }
    if (this.errUsuario() || this.errPassword()) return;

    this.loading.set(true);
    this.auth
      .login(usuario, password)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          this.guardarPreferencias();
          this.guardarPassword(); // persiste ANTES de limpiar
          this.limpiarFormulario(); // después de iniciar: formulario en cero
          this.visible.set(false);
          this.msgs.add({
            severity: 'success',
            summary: 'Sesión iniciada',
            detail: `Bienvenido ${res.usuario?.nombre || usuario}`,
          });
        },
        error: (err) => {
          this.loading.set(false);
          const msg = Array.isArray(err.error?.message)
            ? err.error.message.join(', ')
            : err.error?.message || 'Credenciales incorrectas';
          this.error.set(msg);
        },
      });
  }
}
