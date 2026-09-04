import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { ProductosService } from '../../../core/services/productos.service';
import { CategoriasService } from '../../../core/services/categorias.service';
import { AuthService } from '../../../core/services/auth.service';
import { Categoria } from '../../../core/models/inventario.models';

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
  private auth = inject(AuthService);
  private msgs = inject(MessageService);

  esEdicion = signal(false);
  cargando = signal(false);
  guardando = signal(false);
  titulo = signal('Nuevo producto');
  categorias = signal<Categoria[]>([]);
  categoriasCargando = signal(false);

  readonly snOptions = [
    { label: 'Activo', value: 'S' },
    { label: 'Inactivo', value: 'N' },
  ];

  layout: 'grid' | 'list' = 'grid';
  options: any[] = ['grid','list'];
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
    });

    this.cargarCategorias();

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
            sn_activo: p.sn_activo === 'S' ? 'S' : 'N',
          });
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

  private cargarCategorias() {
    this.categoriasCargando.set(true);
    this.categoriasSvc.getAll().subscribe({
      next: (list) => {
        this.categorias.set(list.filter((c) => c.sn_activo === 'S'));
        this.categoriasCargando.set(false);
      },
      error: () => {
        this.categoriasCargando.set(false);
        this.msgs.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las categorías' });
      },
    });
  }

  invalid(ctrl: string): boolean {
    const c = this.form.get(ctrl);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  volver() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

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
          cstounit: raw.cstounit,
          cstoprom: raw.cstoprom,
          precioventa: raw.precioventa,
          puntoretorno: raw.puntoretorno,
          categoriaId: raw.categoriaId,
          sn_activo: raw.sn_activo || 'S',
        }
      : {
          codbarra: raw.codbarra,
          descripcion: raw.descripcion,
          descripcion_corta: raw.descripcion_corta,
          cstounit: raw.cstounit,
          cstoprom: raw.cstoprom,
          precioventa: raw.precioventa,
          puntoretorno: raw.puntoretorno,
          categoriaId: raw.categoriaId,
          empresaId: this.auth.currentUser()?.empresaId,
          sn_activo: 'S',
        };

    this.guardando.set(true);
    const op = this.esEdicion()
      ? this.service.update(this.produtoId, payload as any)
      : this.service.create(payload as any);

    op.subscribe({
      next: () => {
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
}
