import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-compras',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h3 class="page-title">Compras</h3>
          <p class="page-subtitle">Órdenes de compra a proveedores</p>
        </div>
      </header>
      <div class="card proximamente">
        <i class="pi pi-clock"></i>
        <h4>Próximamente</h4>
        <p>Este módulo está en desarrollo.</p>
      </div>
    </section>
  `,
  styles: [`
    .proximamente {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 3rem; gap: 0.5rem; color: var(--c-text-muted);
      i { font-size: 3rem; opacity: 0.4; }
      h4 { margin: 0; color: var(--c-text); }
      p { margin: 0; font-size: 0.85rem; }
    }
  `],
})
export class Compras {}
