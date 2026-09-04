import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `
    <div class="page-header">
      <h1>Dashboard</h1>
    </div>

    <div class="stats-grid">
      <div class="card stat-card">
        <div class="stat-content">
          <span class="stat-label">Bienvenido</span>
          <span class="stat-value">{{ auth.currentUser()?.nombre }}</span>
        </div>
      </div>

      <div class="card stat-card">
        <div class="stat-content">
          <span class="stat-label">Empresa</span>
          <span class="stat-value">{{ auth.currentUser()?.empresaId }}</span>
        </div>
      </div>

      <div class="card stat-card">
        <div class="stat-content">
          <span class="stat-label">Usuario</span>
          <span class="stat-value">{{ auth.currentUser()?.usuario }}</span>
        </div>
      </div>
    </div>

    <div class="card" style="margin-top:24px;">
      <p>Modulo de reportes y graficas proximamente.</p>
    </div>
  `,
  styles: `
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }
    .stat-card { padding: 20px; }
    .stat-content {
      display: flex;
      flex-direction: column;
    }
    .stat-label {
      font-size: 11px;
      color: #5B6E72;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 500;
    }
    .stat-value {
      font-size: 18px;
      font-weight: 600;
      margin-top: 4px;
    }
  `,
})
export class Dashboard {
  auth = inject(AuthService);
}
