import { Component, input } from '@angular/core';

/**
 * Pantalla de carga global mientras se determina el layout
 * (lectura de localStorage / cambio de perfil tras login).
 *
 * Muestra un GIF de `src/assets/images/` según el `gif` input
 * (default: `cargando.gif`).
 */
@Component({
  selector: 'app-loading',
  standalone: true,
  template: `
    <div class="loading-overlay">
      <img
        [src]="'assets/images/' + gif()"
        alt="Cargando..."
        class="loading-gif"
      />
      <p class="loading-text">{{ texto() }}</p>
    </div>
  `,
  styles: [
    `
      .loading-overlay {
        position: fixed;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1.5rem;
        background: var(--c-surface-ground, #f8fafc);
        z-index: 9999;
      }
      .loading-gif {
        width: 140px;
        height: 140px;
        object-fit: contain;
      }
      .loading-text {
        font-family: 'Mukta', sans-serif;
        font-size: 1.1rem;
        color: var(--c-text-muted, #64748b);
        margin: 0;
      }
    `,
  ],
})
export class Loading {
  /** Nombre del GIF en src/assets/images/ */
  readonly gif = input('cargando.gif');
  /** Texto debajo del GIF */
  readonly texto = input('Cargando...');
}
