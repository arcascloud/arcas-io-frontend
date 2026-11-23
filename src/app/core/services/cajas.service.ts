import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, shareReplay } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

/**
 * Fila de `cxccajeros`: cada registro activo es una caja de la empresa.
 * `cajaId` es la PK y es el valor que viaja en:
 *   pospedmae.cajaId · posfacmae.cajaId · posfaccaja.cajaId · poscajasesion.cajaId
 */
export interface CajaCajero {
  cajaId: number;
  /** Login del cajero asignado a la caja (tusuarios.usuario). */
  usuario: string;
  sn_activo?: 'S' | 'N' | string;
}

/** Caja lista para un select o un botón. */
export interface CajaOpcion {
  id: number;
  /** Etiqueta visible, ej. 'Caja 1 · admin'. */
  nombre: string;
  /** Login del cajero asignado a la caja. */
  usuario: string;
}

/**
 * Catálogo de cajas de la empresa.
 *
 * Fuente única: tabla `cxccajeros` (GET /cxc/cajeros, `empresaId` lo inyecta
 * ApiService). Antes las pantallas de restaurante usaban la constante fija
 * `CAJAS_RESTAURANTE` (ids 1, 2 y 3); ahora la lista es dinámica y cualquier
 * cajero habilitado aparece como caja disponible.
 *
 * Se cachea en memoria (shareReplay) para no repetir la llamada en cada
 * pantalla. Si la petición falla, el observable emite [] y se limpia la caché
 * para permitir reintentos; las pantallas conservan su lista de respaldo.
 */
@Injectable({ providedIn: 'root' })
export class CajasService {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private cache?: Observable<CajaOpcion[]>;

  /** Cajas activas de la empresa, ordenadas por cajaId ascendente. */
  getCajas(forzar = false): Observable<CajaOpcion[]> {
    if (!this.cache || forzar) {
      this.cache = this.api.get<CajaCajero[]>('/cxc/cajeros').pipe(
        map((lista) => this.normalizar(lista ?? [])),
        catchError((err) => {
          console.error('[CajasService] No se pudieron cargar las cajas', err);
          this.cache = undefined;
          return of([] as CajaOpcion[]);
        }),
        shareReplay(1),
      );
    }
    return this.cache;
  }

  /**
   * Caja por defecto de la sesión: la del usuario logueado si está registrado
   * como cajero; si no, la primera de la lista.
   */
  cajaPorDefecto(cajas: CajaOpcion[]): number | null {
    if (!cajas.length) return null;
    const login = this.auth.currentUser()?.usuario;
    const propia = login ? cajas.find((c) => c.usuario === login) : undefined;
    return (propia ?? cajas[0]).id;
  }

  /** Fuerza la recarga en la próxima suscripción (tras cambiar cajeros en parámetros). */
  invalidar(): void {
    this.cache = undefined;
  }

  private normalizar(lista: CajaCajero[]): CajaOpcion[] {
    return lista
      .filter((c) => c && c.cajaId != null && c.sn_activo !== 'N')
      .map((c) => {
        const usuario = String(c.usuario ?? '').trim();
        return {
          id: Number(c.cajaId),
          usuario,
          nombre: usuario ? `Caja ${c.cajaId} · ${usuario}` : `Caja ${c.cajaId}`,
        };
      })
      .sort((a, b) => a.id - b.id);
  }
}
