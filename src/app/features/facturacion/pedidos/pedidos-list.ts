import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, of, catchError } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { PedidosVirtualService } from '../pedidos-virtual/pedidos-virtual.service';
import { FacturaImpresionService } from '../../../core/services/factura-impresion.service';

@Component({
  selector: 'app-pedidos-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule, TagModule, TooltipModule],
  templateUrl: './pedidos-list.html',
  styleUrl: './pedidos-list.scss',
})
export class PedidosList implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private msgs = inject(MessageService);
  private destroyRef = inject(DestroyRef);
  private pedidosSvc = inject(PedidosVirtualService);
  private impresion = inject(FacturaImpresionService);

  pedidos = signal<any[]>([]);
  filtered = signal<any[]>([]);
  cargando = signal(false);
  q = signal('');
  /** # del pedido que se está imprimiendo (null = ninguna) */
  imprimiendo = signal<number | null>(null);

  ngOnInit() {
    this.load();
  }

  load() {
    this.cargando.set(true);
    this.api.get<any>('/facturacion/pedidos').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: any) => {
        const items = Array.isArray(res) ? res : (res?.value ?? []);
        // Orden descendente por # de pedido — más reciente primero (9 → 1)
        items.sort((a: any, b: any) => Number(b.pospedmaeId) - Number(a.pospedmaeId));
        this.pedidos.set(items);
        this.filtrar();
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los pedidos' });
      },
    });
  }

  filtrar() {
    const texto = this.q().toLowerCase().trim();
    if (!texto) {
      this.filtered.set(this.pedidos());
      return;
    }
    this.filtered.set(
      this.pedidos().filter((p) => {
        const nro = String(p.pospedmaeId ?? '');
        const cliente = (p.nombrecliente ?? '').toLowerCase();
        const telefono = (p.nrotelefono ?? '').toLowerCase();
        return nro.includes(texto) || cliente.includes(texto) || telefono.includes(texto);
      }),
    );
  }

  buscar() { this.filtrar(); }
  limpiar() { this.q.set(''); this.filtrar(); }

  editar(id: number) {
    const user = this.auth.currentUser();
    if (user?.sn_cliente === 'S') {
      this.router.navigate(['/facturacion/pedidos-virtual', id]);
    } else {
      this.router.navigate(['/facturacion/pedidos/editar', id]);
    }
  }

  /**
   * Imprime el detalle (ticket) de un pedido: carga pedido + detalles,
   * enriquece la descripción desde el catálogo de productos (pospeddet
   * solo guarda codbarra) y delega en FacturaImpresionService (mismo motor
   * pdfmake y formato parametrizado TICKET/CARTA que las facturas).
   */
  imprimir(p: any) {
    if (this.imprimiendo() != null) return;
    const id = Number(p.pospedmaeId);
    this.imprimiendo.set(id);
    forkJoin({
      pedido: this.api.get<any>(`/facturacion/pedidos/${id}`),
      detalles: this.api.get<any[]>(`/facturacion/pedidos-det/pedido/${id}`),
      productos: this.pedidosSvc.getProductos().pipe(catchError(() => of([] as any[]))),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: async ({ pedido, detalles, productos }) => {
          try {
            if (!Array.isArray(detalles) || detalles.length === 0) {
              this.msgs.add({ severity: 'warn', summary: 'Impresión', detail: 'El pedido no tiene productos' });
              return;
            }
            const items = this.enriquecerDescripcion(detalles, productos ?? []);
            await this.impresion.imprimirPedido(pedido, items);
          } catch {
            this.msgs.add({ severity: 'warn', summary: 'Impresión', detail: 'No se pudo imprimir el pedido' });
          } finally {
            this.imprimiendo.set(null);
          }
        },
        error: () => {
          this.imprimiendo.set(null);
          this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los datos del pedido' });
        },
      });
  }

  /** Une cada línea del pedido con la descripción del producto (por codbarra, fallback productoId) */
  private enriquecerDescripcion(detalles: any[], productos: any[]): any[] {
    const porCod = new Map<string, any>();
    const porId = new Map<number, any>();
    for (const pr of productos) {
      if (pr.codbarra) porCod.set(String(pr.codbarra), pr);
      const pid = Number(pr.produtoId ?? pr.productoId);
      if (pid) porId.set(pid, pr);
    }
    return detalles.map((d) => {
      if (d.descripcion) return d;
      const pr = (d.codbarra ? porCod.get(String(d.codbarra)) : null) || porId.get(Number(d.productoId));
      return { ...d, descripcion: pr?.descripcion || `Producto #${d.productoId}` };
    });
  }

  nuevo() {
    this.router.navigate(['/facturacion/pedidos/editar', 'nuevo']);
  }

  fechaCorta(fecha: string | Date): string {
    if (!fecha) return '-';
    const d = new Date(fecha);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(-2);
    return `${dd}/${mm}/${yy}`;
  }

  /** Los decimales llegan de MySQL como string ('62.00') → Number() antes de formatear */
  moneda(n: number | string | undefined | null): string {
    return Number(n ?? 0).toLocaleString('es-HN', { style: 'currency', currency: 'HNL' });
  }

  getEnvioLabel(val: string): string {
    return val === 'S' ? 'Si' : 'No';
  }

  getEnvioSeverity(val: string): string {
    return val === 'S' ? 'success' : 'secondary';
  }

  getFacturadoLabel(val: string): string {
    return val === 'S' ? 'Si' : 'No';
  }

  getFacturadoSeverity(val: string): string {
    return val === 'S' ? 'info' : 'warn';
  }
}
