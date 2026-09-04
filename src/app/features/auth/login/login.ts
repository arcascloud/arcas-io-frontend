import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { Message } from 'primeng/message';
import { AuthService } from '../../../core/services/auth.service';

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
        this.router.navigateByUrl('/');
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