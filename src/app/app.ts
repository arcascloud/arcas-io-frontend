import { Component, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { Loading } from './shared/loading/loading';
import { LoadingStateService } from './core/services/loading-state.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Loading],
  template: `
    @if (loadingState.visible()) {
      <app-loading [gif]="'cargando.gif'" [texto]="loadingState.texto()" />
    } @else {
      <router-outlet />
    }
  `,
})
export class App implements OnInit {
  private router = inject(Router);
  readonly loadingState = inject(LoadingStateService);

  ngOnInit(): void {
    // F5: mostrar GIF mientras se determina el layout desde localStorage
    this.loadingState.mostrar('Cargando...');

    // Oculta el GIF en la PRIMERA navegación completada
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => {
        if (this.loadingState.visible()) {
          setTimeout(() => this.loadingState.ocultar(), 300);
        }
      });
  }
}
