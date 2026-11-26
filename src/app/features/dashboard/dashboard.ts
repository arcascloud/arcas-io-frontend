import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { EmpresaBrandService } from '../../core/services/empresa-brand.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dashboard-bg"></div>

    <div class="dashboard-content">
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
            <span class="stat-value">{{ brand.nombre() || '—' }}</span>
          </div>
        </div>

        <div class="card stat-card">
          <div class="stat-content">
            <span class="stat-label">Usuario</span>
            <span class="stat-value">{{ auth.currentUser()?.usuario }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      position: relative;
      margin: -1rem;
      width: calc(100% + 2rem);
      min-height: calc(100vh - 3rem);
      overflow: hidden;
      background: var(--c-bg-black, #08131c);
    }

    .dashboard-bg {
      position: absolute;
      inset: 0;
      background:
        linear-gradient(rgba(8, 19, 28, 0.72), rgba(8, 19, 28, 0.82)),
        url('/assets/img/fondo1.jfif') center center / cover no-repeat;
      z-index: 0;
    }

    .dashboard-content {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      height: calc(100vh - 7rem);
      padding: 1rem;
    }

    .page-header h1 {
      margin: 0;
      color: var(--c-text, #fff);
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .card {
      background: transparent;
      backdrop-filter: blur(6px);
    }

    .stat-card {
      padding: 20px;
    }

    .stat-content {
      display: flex;
      flex-direction: column;
    }

    .stat-label {
      font-size: 11px;
      color: var(--c-text-muted, #64748b);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 500;
    }

    .stat-value {
      font-size: 18px;
      font-weight: 600;
      margin-top: 4px;
      color: var(--c-text, #1e293b);
    }

    .proximamente-card {
      padding: 20px;

      p {
        margin: 0;
        color: var(--c-text, #1e293b);
      }
    }

    @media (max-width: 768px) {
      :host {
        margin: -0.5rem;
        width: calc(100% + 1rem);
        min-height: 100dvh;
      }

      .dashboard-bg {
        background:
          linear-gradient(180deg, rgba(8, 19, 28, 0.55), rgba(8, 19, 28, 0.9)),
          url('/assets/img/fondo1.jfif') center top / 100% auto no-repeat;
        background-color: var(--c-bg-black, #08131c);
      }

      .dashboard-content {
        height: auto;
        min-height: 100dvh;
        padding: 0.75rem;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .stat-value {
        text-shadow: 0 1px 6px rgba(0, 0, 0, 0.8);
      }
    }
  `,
})
export class Dashboard {
  auth = inject(AuthService);
  readonly brand = inject(EmpresaBrandService);
}
