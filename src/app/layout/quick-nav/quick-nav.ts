import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DialogModule } from 'primeng/dialog';
import { SelectButtonModule } from 'primeng/selectbutton';
import { AutoCompleteModule, AutoComplete } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { QuickNavItem, QuickNavService } from '../../core/services/quick-nav.service';

type Pestana = 'menu' | 'datos';

/**
 * Navegación rápida global (Ctrl+Alt+1).
 *
 * Un solo cuadro con dos modos:
 *  - Menú: autocompletado sobre los ítems del menú lateral → navega a la ruta.
 *  - Datos: búsqueda global en clientes, proveedores, productos y cuentas contables.
 */
@Component({
  selector: 'app-quick-nav',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule, SelectButtonModule, AutoCompleteModule, ButtonModule, TooltipModule],
  templateUrl: './quick-nav.html',
  styleUrl: './quick-nav.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuickNav {
  readonly nav = inject(QuickNavService);
  private destroyRef = inject(DestroyRef);

  @ViewChild(AutoComplete) private ac?: AutoComplete;

  readonly tabs: { label: string; value: Pestana }[] = [
    { label: 'Menú', value: 'menu' },
    { label: 'Datos', value: 'datos' },
  ];

  readonly pestana = signal<Pestana>('menu');
  readonly sugerencias = signal<QuickNavItem[]>([]);
  readonly cargando = signal(false);
  readonly seleccionado = signal<QuickNavItem | null>(null);

  private queryActual = '';
  private reqId = 0;
  private navegoConEnter = false;

  buscar(query: string): void {
    this.queryActual = query ?? '';
    this.navegoConEnter = false;

    if (this.pestana() === 'menu') {
      this.sugerencias.set(this.nav.filtrarMenu(this.queryActual));
      this.cargando.set(false);
      return;
    }

    const termino = this.queryActual.trim();
    if (termino.length < 2) {
      this.sugerencias.set([]);
      this.cargando.set(false);
      return;
    }

    const id = ++this.reqId;
    this.cargando.set(true);
    this.nav
      .buscarDatos(termino)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (id !== this.reqId) return;
          this.sugerencias.set(res);
          this.cargando.set(false);
        },
        error: () => {
          if (id !== this.reqId) return;
          this.sugerencias.set([]);
          this.cargando.set(false);
        },
      });
  }

  cambiarPestana(valor: Pestana): void {
    if (this.pestana() === valor) return;
    this.pestana.set(valor);
    this.sugerencias.set([]);
    this.buscar(this.queryActual);
    this.enfocar();
  }

  onShow(): void {
    this.seleccionado.set(null);
    this.navegoConEnter = false;
    this.queryActual = '';
    this.sugerencias.set(this.nav.filtrarMenu(''));
    this.enfocar();
  }

  onHide(): void {
    this.pestana.set('menu');
    this.cargando.set(false);
    // No resetear navegoConEnter aquí: el keyup de Enter llega DESPUÉS de ocultar
    // el panel y, si se resetea, se navegaría una 2ª vez a sugerencias()[0].
  }

  onSelect(event: { value?: QuickNavItem } | QuickNavItem | null): void {
    // PrimeNG emite { originalEvent, value } — normalizar por si llega el objeto plano
    const item = event && 'value' in event ? event.value : (event as QuickNavItem | null);
    if (!item) return;
    this.seleccionado.set(item);
    this.navegoConEnter = true;
    this.ir(item);
  }

  onKeyup(event: Event): void {
    // Diálogo cerrado → no reaccionar (el keyup llega tarde, tras el cierre)
    if (!this.nav.abierto()) return;
    const e = event as KeyboardEvent;
    if (e.key !== 'Enter') return;
    // PrimeNG ya seleccionó la opción resaltada → onSelect() se encarga
    if (this.navegoConEnter) {
      this.navegoConEnter = false;
      return;
    }
    const primero = this.sugerencias()[0];
    if (primero) this.ir(primero);
  }

  ir(item?: QuickNavItem | null): void {
    const destino = item ?? this.seleccionado() ?? this.sugerencias()[0];
    if (!destino) return;
    this.nav.navegar(destino);
  }

  get hintPestana(): string {
    return this.pestana() === 'menu'
      ? 'Escriba para buscar una pantalla del sistema'
      : 'Escriba 2+ caracteres para buscar clientes, proveedores, productos o cuentas';
  }

  private enfocar(): void {
    setTimeout(() => {
      const input = (this.ac as unknown as { inputEL?: { nativeElement?: HTMLInputElement } } | undefined)?.inputEL
        ?.nativeElement;
      input?.focus();
      input?.select();
    });
  }
}
