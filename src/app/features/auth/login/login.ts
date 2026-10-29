import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { Message } from 'primeng/message';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, ButtonModule, InputTextModule, PasswordModule, Message],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  /** Ruta de origen (authGuard la pasa como ?returnUrl=): tras login se
   *  vuelve a ella en vez de ir siempre al dashboard (ej: tienda virtual). */
  private readonly returnUrl =
    this.route.snapshot.queryParamMap.get('returnUrl') || '/';

  constructor() {
    // Con VALIDAR_SESSION='N' la pantalla de login no existe: nunca se
    // muestra /login, se redirige a la tienda.
    if (environment.VALIDAR_SESSION === 'N') {
      this.router.navigate(['/facturacion/tienda']);
    }
  }

  usuario = '';
  password = '';
  loading = signal(false);
  error = signal('');

  login() {
    this.error.set('');
    if (!this.usuario || !this.password) {
      this.error.set('Ingrese usuario y contraseña');
      return;
    }

    this.loading.set(true);
    const payload = { usuario: this.usuario, password: this.password };

    this.auth.loginRaw(payload).subscribe({
      next: () => {
        this.router.navigateByUrl(this.returnUrl);
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