import { Injectable, signal } from '@angular/core';

/**
 * Estado global de la pantalla de carga (GIF).
 * Usado por:
 * - `app.ts` al iniciar (F5) → determina layout desde localStorage
 * - `login-dialog` tras login → mientras cambia el layout
 */
@Injectable({ providedIn: 'root' })
export class LoadingStateService {
  /** true → se muestra el overlay con GIF */
  readonly visible = signal(false);

  /** Texto debajo del GIF */
  readonly texto = signal('Cargando...');

  mostrar(texto = 'Cargando...'): void {
    this.texto.set(texto);
    this.visible.set(true);
  }

  ocultar(): void {
    this.visible.set(false);
  }
}
