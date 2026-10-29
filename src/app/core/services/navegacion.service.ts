import { Injectable, inject } from '@angular/core';
import { Location } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NavegacionService {
  private location = inject(Location);
  private router = inject(Router);

  /**
   * Navegaciones completadas dentro de la app (la 1ª es la carga inicial).
   * Se usa en vez de window.history.length > 1: si el usuario llega al ERP
   * desde un enlace externo (WhatsApp, correo), history.length incluye esa
   * página externa y location.back() sacaría a la persona de la aplicación.
   */
  private navegaciones = 0;

  constructor() {
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.navegaciones++);
  }

  /** True si hay una pantalla anterior dentro de la app. */
  get puedeRegresar(): boolean {
    return this.navegaciones > 1;
  }

  /** Regresa a la pantalla anterior; si no hay, va a la ruta de respaldo. */
  volver(fallback: string[] | string = ['/']) {
    if (this.puedeRegresar) {
      this.location.back();
    } else {
      this.router.navigate(Array.isArray(fallback) ? fallback : [fallback]);
    }
  }
}
