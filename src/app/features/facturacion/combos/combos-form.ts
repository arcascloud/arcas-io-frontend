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

interface Descuento {
  descuentoId: number;
  descripcion: string;
  porcentaje: number;
  sn_activo: string;
}

interface ProductoCatalogo {
  produtoId: number;
  descripcion: string;
  descripcion_corta?: string;
  codbarra?: string;
  precioventa: number;
  cstounit: number;
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
  cstounit: number;
  descuentoId: number | null;
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
  descuentos = signal<Descuento[]>([]);

  comboItems = signal<ComboItem[]>([]);

  private itemId = 0;

  /** descuentoId seleccionado por productoId en el catálogo */
  descuentoPorProducto = new Map<number, number | null>();

  onDescuentoCatalogoChange(productoId: number, descuentoId: number | null) {
    this.descuentoPorProducto.set(productoId, descuentoId);
  }

  onDescuentoResumenChange(item: ComboItem, descuentoId: number | null) {
    const precioOriginal = this.getPrecioOriginal(item);
    const precioConDescuento = this.calcularPrecioDescuento(precioOriginal, descuentoId);
    this.comboItems.update(items =>
      items.map(i => i.productoId === item.productoId
        ? { ...i, descuentoId, precioventa: precioConDescuento }
        : i
      )
    );
  }

  /** Busca el precio original del producto en el catálogo */
  private getPrecioOriginal(item: ComboItem): number {
    const prod = this.productos().find(p => p.produtoId === item.productoId);
    return prod ? Number(prod.precioventa) : Number(item.precioventa);
  }

  /** Calcula precio con descuento: precio - (precio * (porcentaje/100)) */
  calcularPrecioDescuento(precioOriginal: number, descuentoId: number | null): number {
    if (!descuentoId) return precioOriginal;
    const desc = this.descuentos().find(d => d.descuentoId === descuentoId);
    if (!desc) return precioOriginal;
    const porcentaje = Number(desc.porcentaje);
    return precioOriginal - (precioOriginal * (porcentaje / 100));
  }

  readonly TIPO_COMBO_OPTIONS = [
    { label: 'Oferta', value: 'O' },
    { label: 'Combo', value: 'C' },
    { label: 'Aniversario', value: 'A' },
    { label: 'Navidad', value: 'N' },
    { label: 'BlackFriday', value: 'B' },
  ];

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
    this.cargarDescuentos();

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
      tipocombo: ['' as string],
      fec_vig_desde: [new Date(), Validators.required],
      fec_vig_hasta: [new Date(), Validators.required],
      descuentoId: [1 as number | null],
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

  private cargarDescuentos() {
    this.api.get<any[]>('/facturacion/descuentos').subscribe({
      next: (res) => this.descuentos.set((Array.isArray(res) ? res : []).filter((d: any) => d.sn_activo === 'S')),
      error: () => {},
    });
  }

  private cargarCombo() {
    this.service.getMaeOne<any>('/facturacion/combos', this.itemId).subscribe({
      next: (mae) => {
        this.form.patchValue({
          descripcion: mae?.descripcion ?? '',
          tipocombo: mae?.tipocombo ?? '',
          fec_vig_desde: mae?.fec_vig_desde ? new Date(mae.fec_vig_desde) : new Date(),
          fec_vig_hasta: mae?.fec_vig_hasta ? new Date(mae.fec_vig_hasta) : new Date(),
          descuentoId: mae?.descuentoId ?? null,
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
      next: (res: any) => {
        const todos = res?.value ?? res ?? [];
        const mios = (Array.isArray(todos) ? todos : []).filter((d) => d.poscbomaeId === this.itemId);
        const items: ComboItem[] = mios.map((d: any) => {
          const prod = this.productos().find(p => p.produtoId === Number(d.productoId));
          return {
            productoId: d.productoId,
            codbarra: d.codbarra ?? prod?.codbarra ?? '',
            descripcion: prod?.descripcion ?? `Producto #${d.productoId}`,
            imagen: prod?.imagen ?? null,
            cantidad: d.cantidad ?? 1,
            precioventa: d.precioventa ?? 0,
            cstounit: Number(prod?.cstounit) || 0,
            descuentoId: d.descuentoId ?? null,
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
    const descuentoId = this.descuentoPorProducto.get(Number(producto.produtoId)) ?? null;
    const precioOriginal = Number(producto.precioventa);
    const precioConDescuento = this.calcularPrecioDescuento(precioOriginal, descuentoId);
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
        precioventa: precioConDescuento,
        cstounit: Number(producto.cstounit) || 0,
        descuentoId,
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
    return Number(item.cstounit) * 1.03;
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
    return /^data:/i.test(imagen) ? imagen : `data:image/png;base64,${imagen}`;
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
      const nombres = preciosInvalidos.map(i =>
        `${i.descripcion} (${this.formatearPrecio(i.precioventa)} < ${this.formatearPrecio(this.precioMinimo(i))})`
      ).join(', ');
      this.msgs.add({
        severity: 'warn',
        summary: 'Precios por debajo del mínimo',
        detail: `${nombres} — costo + 3%`,
      });
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
        descuentoId: item.descuentoId ?? 1,
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
    this.form.reset({ descripcion: '', tipocombo: '', fec_vig_desde: new Date(), fec_vig_hasta: new Date(), descuentoId: 1 });
    this.comboItems.set([]);
    this.esEdicion.set(false);
    this.itemId = 0;
    this.titulo.set('Nuevo Combo');
  }
}