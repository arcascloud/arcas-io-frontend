import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { AccordionModule } from 'primeng/accordion';
import { FieldsetModule } from 'primeng/fieldset';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { GalleriaModule } from 'primeng/galleria';
import { MessageService } from 'primeng/api';
import { ProductosService } from '../../../core/services/productos.service';
import { CategoriasService } from '../../../core/services/categorias.service';
import { DepartamentosService } from '../../../core/services/departamentos.service';
import { MarcasService } from '../../../core/services/marcas.service';
import { PasillosService } from '../../../core/services/pasillos.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  Categoria,
  Departamento,
  Marca,
  Pasillo,
  ProductoDet,
  ProductoImg,
  TipoImpuesto,
} from '../../../core/models/inventario.models';
import { CatalogoParametrosService } from '../../../core/services/catalogo-parametros.service';
import { BadgeModule } from 'primeng/badge';

/** Labels legibles para los tipos de atributo del producto */
const TIPO_LABELS: Record<string, string> = {
  MODELO: 'Modelo',
  EMBALAJE: 'Embalaje',
  PASILLO: 'Pasillo',
  COLOR: 'Color',
  PESO: 'Peso',
  TAMANO: 'Tamaño',
};

/** Tipos de atributo disponibles */
const TIPOS_DISPONIBLES = Object.keys(TIPO_LABELS);

@Component({
  selector: 'app-producto-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    AccordionModule,
    FieldsetModule,
    TableModule,
    TooltipModule,
    BadgeModule,
    GalleriaModule,
  ],
  templateUrl: './producto-form.html',
  styleUrl: './producto-form.scss',
})
export class ProductoForm implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(ProductosService);
  private categoriasSvc = inject(CategoriasService);
  private departamentosSvc = inject(DepartamentosService);
  private marcasSvc = inject(MarcasService);
  private pasillosSvc = inject(PasillosService);
  private catalogoSvc = inject(CatalogoParametrosService);
  private auth = inject(AuthService);
  private msgs = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  // ── Estado ──────────────────────────────────────────────────────
  esEdicion = signal(false);
  cargando = signal(false);
  guardando = signal(false);
  titulo = signal('Nuevo producto');
  categorias = signal<Categoria[]>([]);
  categoriasCargando = signal(false);

  // ── Clasificación (20261015 ARFM: catálogos reales de inventario) ──
  departamentos = signal<Departamento[]>([]);
  departamentosCargando = signal(false);
  marcas = signal<Marca[]>([]);
  marcasCargando = signal(false);
  pasillos = signal<Pasillo[]>([]);
  pasillosCargando = signal(false);

  // Impuestos

  impuestos = signal<TipoImpuesto[]>([]);

  // ── Atributos dinámicos (productosdet) ──────────────────────────
  atributos = signal<ProductoDet[]>([]);
  atributoForm!: FormGroup;
  atributoEditando = signal<ProductoDet | null>(null);
  guardandoAtributo = signal(false);

  readonly TIPOS_OPTIONS = Object.entries(TIPO_LABELS).map(([value, label]) => ({ label, value }));

  // ── Imágenes (productoimg) ──────────────────────────────────────
  imagenes = signal<ProductoImg[]>([]);
  readonly MAX_IMAGENES = 5;
  activeIndex = signal(0);

  readonly galleriaResponsiveOptions = [
    { breakpoint: '768px', numVisible: 3 },
    { breakpoint: '480px', numVisible: 2 },
  ];

  readonly snOptions = [
    { label: 'Activo', value: 'S' },
    { label: 'Inactivo', value: 'N' },
  ];

  /** Opciones del indicador de producto controlado */
  readonly snControladoOptions = [
    { label: 'No controlado', value: 'N' },
    { label: 'Controlado', value: 'S' },
  ];

  readonly TIPO_LABELS = TIPO_LABELS;

  private produtoId = 0;

  form!: FormGroup;

  ngOnInit() {
    this.form = this.fb.group({
      codbarra: [''],
      descripcion: ['', Validators.required],
      descripcion_corta: [''],
      cstounit: [0],
      cstoprom: [0],
      precioventa: [0],
      puntoretorno: [0],
      categoriaId: [null as number | null, Validators.required],
      sn_activo: ['S' as 'S' | 'N'],
      // 20261015 ARFM SKU del producto (varchar(20), obligatorio)
      codigo_sku: ['', Validators.required],

      // 20261015 ARFM Departamento de inventario (tinvdeptos.deptoId)
      deptoId: [null as number | null, Validators.required],

      // 20261015 ARFM Marca y pasillo (columnas NOT NULL en `productos`)
      marcaId: [null as number | null, Validators.required],
      pasilloId: [null as number | null, Validators.required],

      // NOT NULL en BD + FK a ttipoimpuestos → obligatorio
      impuestoId: [null as number | null, Validators.required],

       // Producto controlado (fármacos, material agroindustrial) → default 'N'
       sn_controlado: ['N' as 'S' | 'N'],
       // Producto regulado como droga o psicotrópico → default 'N'
       sn_droga: ['N' as 'S' | 'N'],
    });

    this.atributoForm = this.fb.group({
      tipo: [null as string | null, Validators.required],
      descripcion: ['', Validators.required],
      sn_activo: ['S' as 'S' | 'N'],
    });

    this.cargarCategorias();
    this.cargarDepartamentos();
    this.cargarMarcas();
    this.cargarPasillos();
    this.cargarImpuestos();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.esEdicion.set(true);
      this.titulo.set('Editar producto');
      this.produtoId = Number(id);
      this.cargando.set(true);

      this.service.getOne(this.produtoId).subscribe({
        next: (p) => {
          this.form.patchValue({
            codbarra: p.codbarra,
            descripcion: p.descripcion,
            descripcion_corta: p.descripcion_corta,
            cstounit: Number(p.cstounit),
            cstoprom: Number(p.cstoprom),
            precioventa: Number(p.precioventa),
            puntoretorno: Number(p.puntoretorno),
            categoriaId: p.categoriaId,
            impuestoId: p.impuestoId,
            sn_activo: p.sn_activo === 'S' ? 'S' : 'N',
            sn_controlado: p.sn_controlado === 'S' ? 'S' : 'N',
            sn_droga: p.sn_droga === 'S' ? 'S' : 'N',
            // 20261015 ARFM clasificación: los productos antiguos traen 0 →
            // se dejan en null para que el select quede vacío y el usuario
            // asigne el valor real (los 3 campos son obligatorios).
            codigo_sku: p.codigo_sku ?? '',
            deptoId: (p.deptoId ?? 0) > 0 ? p.deptoId : null,
            marcaId: (p.marcaId ?? 0) > 0 ? p.marcaId : null,
            pasilloId: (p.pasilloId ?? 0) > 0 ? p.pasilloId : null,
          });
          this.cargarAtributos();
          this.cargarImagenes();
          this.cargando.set(false);
        },
        error: () => {
          this.cargando.set(false);
          this.msgs.add({ severity: 'error', summary: 'Error', detail: 'Producto no encontrado' });
          this.volver();
        },
      });
    }
  }

  // ── Carga de datos ──────────────────────────────────────────────

  private cargarCategorias() {
    this.categoriasCargando.set(true);
    this.categoriasSvc.getAll().subscribe({
      next: (list) => {
        this.categorias.set(list.filter((c) => c.sn_activo === 'S'));
        this.categoriasCargando.set(false);
      },
      error: () => {
        this.categoriasCargando.set(false);
        this.msgs.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las categorías',
        });
      },
    });
  }

  private cargarImpuestos() {
    this.catalogoSvc.getAll<TipoImpuesto>('/parametros/impuestos').subscribe({
      next: (list) => this.impuestos.set(list.filter((i) => i.sn_activo === 'S')),
      error: () =>
        this.msgs.add({
          severity: 'warn',
          summary: 'Aviso',
          detail: 'No se pudieron cargar los impuestos',
        }),
    });
  }

  // 20261015 ARFM Cargar departamentos (tinvdeptos vía /inventario/deptos)
  private cargarDepartamentos() {
    this.departamentosCargando.set(true);
    this.departamentosSvc.getAll().subscribe({
      next: (list) => {
        this.departamentos.set(list.filter((d) => d.sn_activo === 'S'));
        this.departamentosCargando.set(false);
      },
      error: () => {
        this.departamentosCargando.set(false);
        this.msgs.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los departamentos',
        });
      },
    });
  }

  // 20261015 ARFM Cargar marcas (tinvmarcas)
  private cargarMarcas() {
    this.marcasCargando.set(true);
    this.marcasSvc.getAll().subscribe({
      next: (list) => {
        this.marcas.set(list.filter((m) => m.sn_activo === 'S'));
        this.marcasCargando.set(false);
      },
      error: () => {
        this.marcasCargando.set(false);
        this.msgs.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las marcas',
        });
      },
    });
  }

  // 20261015 ARFM Cargar pasillos (tinvpasillos)
  private cargarPasillos() {
    this.pasillosCargando.set(true);
    this.pasillosSvc.getAll().subscribe({
      next: (list) => {
        this.pasillos.set(list.filter((p) => p.sn_activo === 'S'));
        this.pasillosCargando.set(false);
      },
      error: () => {
        this.pasillosCargando.set(false);
        this.msgs.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los pasillos',
        });
      },
    });
  }

  private cargarAtributos() {
    this.service.getDetByProducto(this.produtoId).subscribe({
      next: (list) => {
        this.atributos.set(list);
      },
      error: () => {
        this.msgs.add({
          severity: 'warn',
          summary: 'Aviso',
          detail: 'No se pudieron cargar los atributos',
        });
      },
    });
  }

  // ── CRUD Atributos ──────────────────────────────────────────────

  invalidAtributo(ctrl: string): boolean {
    const c = this.atributoForm.get(ctrl);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  agregarAtributo() {
    this.atributoForm.reset({ tipo: null, descripcion: '', sn_activo: 'S' });
    this.atributoEditando.set(null);
  }

  editarAtributo(attr: ProductoDet) {
    this.atributoEditando.set(attr);
    this.atributoForm.patchValue({
      tipo: attr.tipo,
      descripcion: attr.descripcion,
      sn_activo: attr.sn_activo,
    });
  }

  cancelarAtributo() {
    this.atributoEditando.set(null);
    this.atributoForm.reset({ tipo: null, descripcion: '', sn_activo: 'S' });
  }

  guardarAtributo() {
    if (this.atributoForm.invalid) {
      this.atributoForm.markAllAsTouched();
      return;
    }

    const raw = this.atributoForm.getRawValue();
    const editando = this.atributoEditando();

    this.guardandoAtributo.set(true);

    if (editando) {
      // Actualizar existente
      this.service
        .updateDet(editando.productosdetsId, {
          tipo: raw.tipo,
          descripcion: raw.descripcion,
          sn_activo: raw.sn_activo,
        })
        .subscribe({
          next: (updated) => {
            this.atributos.update((list) =>
              list.map((a) => (a.productosdetsId === updated.productosdetsId ? updated : a)),
            );
            this.cancelarAtributo();
            this.guardandoAtributo.set(false);
            this.msgs.add({
              severity: 'success',
              summary: 'Atributo',
              detail: 'Atributo actualizado',
            });
          },
          error: () => {
            this.guardandoAtributo.set(false);
            this.msgs.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo actualizar el atributo',
            });
          },
        });
    } else {
      // Crear nuevo
      this.service
        .createDet({
          produtoId: this.produtoId,
          tipo: raw.tipo,
          descripcion: raw.descripcion,
          sn_activo: raw.sn_activo,
          empresaId: this.auth.currentUser()?.empresaId,
        })
        .subscribe({
          next: (created) => {
            this.atributos.update((list) => [...list, created]);
            this.cancelarAtributo();
            this.guardandoAtributo.set(false);
            this.msgs.add({
              severity: 'success',
              summary: 'Atributo',
              detail: 'Atributo agregado',
            });
          },
          error: () => {
            this.guardandoAtributo.set(false);
            this.msgs.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo crear el atributo',
            });
          },
        });
    }
  }

  eliminarAtributo(attr: ProductoDet) {
    this.service.deleteDet(attr.productosdetsId).subscribe({
      next: () => {
        this.atributos.update((list) =>
          list.filter((a) => a.productosdetsId !== attr.productosdetsId),
        );
        this.msgs.add({ severity: 'success', summary: 'Atributo', detail: 'Atributo eliminado' });
      },
      error: () => {
        this.msgs.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo eliminar el atributo',
        });
      },
    });
  }

  getTipoLabel(tipo: string): string {
    return TIPO_LABELS[tipo] ?? tipo;
  }

  private cargarImagenes() {
    this.service.getImgByProducto(this.produtoId).subscribe({
      next: (list) => {
        this.imagenes.set(list.filter((img) => img.sn_activo === 'S'));
      },
      error: () => {
        this.msgs.add({
          severity: 'warn',
          summary: 'Aviso',
          detail: 'No se pudieron cargar las imágenes',
        });
      },
    });
  }

  // ── Imágenes ────────────────────────────────────────────────────

  get imagenesCount(): number {
    return this.imagenes().length;
  }

  get puedeAgregarImagen(): boolean {
    return this.imagenesCount < this.MAX_IMAGENES;
  }

  onSeleccionarImagen(event: Event, slotIndex: number) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.msgs.add({
        severity: 'warn',
        summary: 'Aviso',
        detail: 'Solo se permiten archivos de imagen',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.msgs.add({
        severity: 'warn',
        summary: 'Aviso',
        detail: 'La imagen no puede superar 5 MB',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;

      if (this.esEdicion()) {
        // Guardar imagen directamente en el backend
        this.service
          .createImg({
            productoId: this.produtoId,
            img: base64,
            sn_activo: 'S',
            empresaId: this.auth.currentUser()?.empresaId,
          })
          .subscribe({
            next: (img) => {
              this.imagenes.update((imgs) => [...imgs, img]);
              this.msgs.add({
                severity: 'success',
                summary: 'Imagen',
                detail: 'Imagen cargada correctamente',
              });
            },
            error: () => {
              this.msgs.add({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo guardar la imagen',
              });
            },
          });
      } else {
        // Modo creación: guardar en memoria (se sube al guardar el producto)
        const tmpImg: ProductoImg = {
          productoimgId: -Date.now() - slotIndex,
          productoId: 0,
          img: base64,
          sn_activo: 'S',
          empresaId: this.auth.currentUser()?.empresaId ?? 0,
          usuarioCreated: this.auth.currentUser()?.usuario ?? '',
        };
        this.imagenes.update((imgs) => [...imgs, tmpImg]);
      }
    };
    reader.readAsDataURL(file);

    // Limpiar el input para poder re-seleccionar el mismo archivo
    input.value = '';
  }

  eliminarImagen(img: ProductoImg) {
    if (this.esEdicion() && img.productoimgId > 0) {
      this.service.deleteImg(img.productoimgId).subscribe({
        next: () => {
          this.imagenes.update((imgs) => imgs.filter((i) => i.productoimgId !== img.productoimgId));
          this.msgs.add({ severity: 'success', summary: 'Imagen', detail: 'Imagen eliminada' });
        },
        error: () => {
          this.msgs.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo eliminar la imagen',
          });
        },
      });
    } else {
      this.imagenes.update((imgs) => imgs.filter((i) => i.productoimgId !== img.productoimgId));
    }
  }

  getImagenUrl(img: ProductoImg): string {
    if (img.img && !img.img.startsWith('data:')) {
      return `data:image/png;base64,${img.img}`;
    }
    return img.img;
  }

  // ── Helpers ─────────────────────────────────────────────────────

  invalid(ctrl: string): boolean {
    const c = this.form.get(ctrl);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  volver() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  // ── Guardar ─────────────────────────────────────────────────────

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();

    const payload = this.esEdicion()
      ? {
          codbarra: raw.codbarra,
          descripcion: raw.descripcion,
          descripcion_corta: raw.descripcion_corta,
          codigo_sku: raw.codigo_sku,
          cstounit: raw.cstounit,
          cstoprom: raw.cstoprom,
          precioventa: raw.precioventa,
          puntoretorno: raw.puntoretorno,
          deptoId: raw.deptoId,
          categoriaId: raw.categoriaId,
          marcaId: raw.marcaId,
          pasilloId: raw.pasilloId,
          impuestoId: raw.impuestoId,
          sn_controlado: raw.sn_controlado || 'N',
          sn_droga: raw.sn_droga || 'N',
          sn_activo: raw.sn_activo || 'S',
        }
      : {
          codbarra: raw.codbarra,
          descripcion: raw.descripcion,
          descripcion_corta: raw.descripcion_corta,
          codigo_sku: raw.codigo_sku,
          cstounit: raw.cstounit,
          cstoprom: raw.cstoprom,
          precioventa: raw.precioventa,
          puntoretorno: raw.puntoretorno,
          deptoId: raw.deptoId,
          categoriaId: raw.categoriaId,
          marcaId: raw.marcaId,
          pasilloId: raw.pasilloId,
          impuestoId: raw.impuestoId,
          sn_controlado: raw.sn_controlado || 'N',
          sn_droga: raw.sn_droga || 'N',
          empresaId: this.auth.currentUser()?.empresaId,
          sn_activo: 'S',
        };

    this.guardando.set(true);
    const op = this.esEdicion()
      ? this.service.update(this.produtoId, payload as any)
      : this.service.create(payload as any);

    op.subscribe({
      next: (producto) => {
        // Si es creación y hay imágenes pendientes, subirlas
        if (!this.esEdicion()) {
          const nuevoId = (producto as any).produtoId ?? (producto as any).productoId;
          this.subirImagenesPendientes(nuevoId);
        }
        this.guardando.set(false);
        this.msgs.add({
          severity: 'success',
          summary: 'Guardado',
          detail: this.esEdicion() ? 'Producto actualizado' : 'Producto creado correctamente',
        });
        this.volver();
      },
      error: () => {
        this.guardando.set(false);
        this.msgs.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo guardar el producto',
        });
      },
    });
  }

  private subirImagenesPendientes(productoId: number) {
    const imgsTmp = this.imagenes().filter((img) => img.productoimgId < 0);
    for (const img of imgsTmp) {
      this.service
        .createImg({
          productoId,
          img: img.img,
          sn_activo: 'S',
          empresaId: this.auth.currentUser()?.empresaId,
        })
        .subscribe({ error: () => {} });
    }
  }
}
