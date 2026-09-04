import { Component, inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { DataViewModule } from 'primeng/dataview';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { FacturacionService } from '../../../core/services/facturacion.service';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';
import { NavegacionService } from '../../../core/services/navegacion.service';

interface ProductoCatalogo {
  produtoId: number;
  descripcion: string;
  descripcion_corta?: string;
  codbarra?: string;
  precioventa: number;
  preciocosto: number;
  imagen: string | null;
  existencia: number;
  categoria?: string;
  categoriaId: number;
}

interface ComboItem {
  productoId: number;
  codbarra: string;
  descripcion: string;
  imagen: string | null;
  cantidad: number;
  precioventa: number;
  preciocosto: number;
}

@Component({
  selector: 'app-combos-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    DatePickerModule,
    DataViewModule,
    TooltipModule,
  ],
  templateUrl: './combos-form.html',
  styleUrl: './combos-form.scss',
})
export class CombosForm implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(FacturacionService);
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private destroyRef = inject(DestroyRef);
  private navegacion = inject(NavegacionService);
  private msgs = inject(MessageService);

  esEdicion = signal(false);
  cargando = signal(false);
  guardando = signal(false);
  titulo = signal('Nuevo Combo');

  form!: FormGroup;

  productos = signal<ProductoCatalogo[]>([]);
  busqueda = signal('');
  cargandoProductos = signal(false);

  comboItems = signal<ComboItem[]>([]);

  private itemId = 0;
  private imagenCache = new Map<string, string>();

  productosFiltrados = computed(() => {
    const q = this.busqueda().toLowerCase();
    const items = this.productos();
    if (!q) return items;
    return items.filter(p =>
      p.descripcion?.toLowerCase().includes(q) ||
      p.codbarra?.toLowerCase().includes(q) ||
      p.categoria?.toLowerCase().includes(q)
    );
  });

  totalCombo = computed(() =>
    this.comboItems().reduce((sum, i) => sum + (Number(i.cantidad) * Number(i.precioventa)), 0)
  );

  totalItems = computed(() =>
    this.comboItems().reduce((sum, i) => sum + Number(i.cantidad), 0)
  );

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.buildForm();
    this.cargarProductos();

    if (id && id !== 'nuevo') {
      this.esEdicion.set(true);
      this.itemId = Number(id);
      this.titulo.set('Editar Combo');
      this.cargando.set(true);
      this.cargarCombo();
    }
  }

  private buildForm() {
    this.form = this.fb.group({
      descripcion: ['', Validators.required],
      fec_vig_desde: [new Date(), Validators.required],
      fec_vig_hasta: [new Date(), Validators.required],
    });
  }

  private cargarProductos() {
    this.cargandoProductos.set(true);
    this.api.get<any[]>('/inventario/tienda/productos').subscribe({
      next: (res) => {
        const items = Array.isArray(res) ? res : [];
        this.productos.set(items);
        this.cargandoProductos.set(false);
      },
      error: (err) => {
        console.error('Error cargando productos', err);
        this.cargandoProductos.set(false);
      },
    });
  }

  private cargarCombo() {
    this.service.getMaeOne<any>('/facturacion/combos', this.itemId).subscribe({
      next: (mae) => {
        this.form.patchValue({
          descripcion: mae?.descripcion ?? '',
          fec_vig_desde: mae?.fec_vig_desde ? new Date(mae.fec_vig_desde) : new Date(),
          fec_vig_hasta: mae?.fec_vig_hasta ? new Date(mae.fec_vig_hasta) : new Date(),
        });
        this.cargarDets();
      },
      error: () => {
        this.cargando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'Combo no encontrado' });
        this.volver();
      },
    });
  }

  private cargarDets() {
    this.service.getDet<any>('/facturacion/combos-det').subscribe({
      next: (todos) => {
        const mios = (todos ?? []).filter((d) => d.poscbomaeId === this.itemId);
        const items: ComboItem[] = mios.map((d: any) => {
          const prod = this.productos().find(p => p.produtoId === Number(d.productoId));
          return {
            productoId: d.productoId,
            codbarra: d.codbarra ?? prod?.codbarra ?? '',
            descripcion: prod?.descripcion ?? `Producto #${d.productoId}`,
            imagen: prod?.imagen ?? null,
            cantidad: d.cantidad ?? 1,
            precioventa: d.precioventa ?? 0,
            preciocosto: Number(prod?.preciocosto) || 0,
          };
        });
        this.comboItems.set(items);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los detalles' });
      },
    });
  }

  agregarAlCombo(producto: ProductoCatalogo) {
    const existente = this.comboItems().find(i => i.productoId === Number(producto.produtoId));
    if (existente) {
      this.comboItems.update(items =>
        items.map(i => i.productoId === Number(producto.produtoId)
          ? { ...i, cantidad: i.cantidad + 1 }
          : i
        )
      );
    } else {
      this.comboItems.update(items => [...items, {
        productoId: Number(producto.produtoId),
        codbarra: producto.codbarra ?? '',
        descripcion: producto.descripcion,
        imagen: producto.imagen,
        cantidad: 1,
        precioventa: Number(producto.precioventa),
        preciocosto: Number(producto.preciocosto) || 0,
      }]);
    }
  }

  incrementar(item: ComboItem) {
    this.comboItems.update(items =>
      items.map(i => i.productoId === item.productoId
        ? { ...i, cantidad: i.cantidad + 1 }
        : i
      )
    );
  }

  decrementar(item: ComboItem) {
    if (item.cantidad <= 1) {
      this.quitarDelCombo(item);
      return;
    }
    this.comboItems.update(items =>
      items.map(i => i.productoId === item.productoId
        ? { ...i, cantidad: i.cantidad - 1 }
        : i
      )
    );
  }

  quitarDelCombo(item: ComboItem) {
    this.comboItems.update(items => items.filter(i => i.productoId !== item.productoId));
  }

  precioMinimo(item: ComboItem): number {
    return Number(item.preciocosto) * 1.03;
  }

  precioValido(item: ComboItem): boolean {
    return Number(item.precioventa) >= this.precioMinimo(item);
  }

  onPrecioChange(item: ComboItem, nuevoPrecio: number) {
    const minimo = this.precioMinimo(item);
    this.comboItems.update(items =>
      items.map(i => i.productoId === item.productoId
        ? { ...i, precioventa: nuevoPrecio }
        : i
      )
    );
    if (nuevoPrecio < minimo) {
      this.msgs.add({
        severity: 'warn',
        summary: 'Precio bajo',
        detail: `${item.descripcion}: precio mínimo L ${minimo.toFixed(2)} (costo + 3%)`,
      });
    }
  }

  resolverImagen(imagen: string | null): string {
    if (!imagen) return '';
    const cacheKey = imagen.substring(0, 100);
    if (this.imagenCache.has(cacheKey)) return this.imagenCache.get(cacheKey)!;
    const result = /^data:/i.test(imagen) ? imagen : `data:image/png;base64,${imagen}`;
    this.imagenCache.set(cacheKey, result);
    return result;
  }

  formatearPrecio(precio: number | string): string {
    return `L ${Number(precio).toFixed(2)}`;
  }

  invalid(ctrl: string): boolean {
    const c = this.form.get(ctrl);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  volver() {
    this.navegacion.volver(['/facturacion/combos']);
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.comboItems().length === 0) {
      this.msgs.add({ severity: 'warn', summary: 'Sin productos', detail: 'Agrega al menos un producto al combo' });
      return;
    }

    const preciosInvalidos = this.comboItems().filter(i => !this.precioValido(i));
    if (preciosInvalidos.length > 0) {
      const nombres = preciosInvalidos.map(i => i.descripcion).join(', ');
      this.msgs.add({
        severity: 'error',
        summary: 'Precios inválidos',
        detail: `${nombres}: precio de venta menor al costo + 3%`,
      });
      return;
    }

    const maeBody = {
      ...this.form.getRawValue(),
      ...(this.esEdicion() ? {} : { empresaId: this.auth.currentUser()?.empresaId }),
    };

    this.guardando.set(true);
    const maeOp = this.esEdicion()
      ? this.service.updateMae<any>('/facturacion/combos', this.itemId, maeBody)
      : this.service.createMae<any>('/facturacion/combos', maeBody);

    maeOp.subscribe({
      next: (mae) => {
        const maeId = this.esEdicion() ? this.itemId : mae.poscbomaeId;
        this.guardarDets(maeId);
      },
      error: () => {
        this.guardando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el combo' });
      },
    });
  }

  private guardarDets(maeId: number) {
    const items = this.comboItems();
    const empresaId = this.auth.currentUser()?.empresaId;

    const crearTodos = () => {
      if (items.length === 0) {
        this.finalizar();
        return;
      }
      let completados = 0;
      const total = items.length;
      const ok = () => {
        completados += 1;
        if (completados === total) this.finalizar();
      };
      const fail = () => {
        this.guardando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar uno de los productos' });
      };
      this.crearDets(maeId, items, empresaId, ok, fail);
    };

    if (this.esEdicion()) {
      this.service.getDet<any>('/facturacion/combos-det').subscribe({
        next: (todos) => {
          const existentes = (todos ?? []).filter((d: any) => d.poscbomaeId === maeId);
          if (existentes.length === 0) {
            crearTodos();
            return;
          }
          let eliminados = 0;
          const totalElim = existentes.length;
          for (const det of existentes) {
            this.api.delete<any>('/facturacion/combos-det', det.poscbodetId).subscribe({
              next: () => {
                eliminados++;
                if (eliminados === totalElim) crearTodos();
              },
              error: () => {
                eliminados++;
                if (eliminados === totalElim) crearTodos();
              },
            });
          }
        },
        error: () => crearTodos(),
      });
    } else {
      crearTodos();
    }
  }

  private crearDets(maeId: number, items: ComboItem[], empresaId: number, ok: () => void, fail: () => void) {
    for (const item of items) {
      const body = {
        poscbomaeId: maeId,
        productoId: item.productoId,
        codbarra: item.codbarra,
        cantidad: item.cantidad,
        precioventa: item.precioventa,
        empresaId,
      };
      this.service.createDet<any>('/facturacion/combos-det', body).subscribe({ next: ok, error: fail });
    }
  }

  private finalizar() {
    this.guardando.set(false);
    this.msgs.add({
      severity: 'success',
      summary: 'Guardado',
      detail: this.esEdicion() ? 'Combo actualizado' : 'Combo creado correctamente',
    });
    this.form.reset({ descripcion: '', fec_vig_desde: new Date(), fec_vig_hasta: new Date() });
    this.comboItems.set([]);
    this.esEdicion.set(false);
    this.itemId = 0;
    this.titulo.set('Nuevo Combo');
  }
}