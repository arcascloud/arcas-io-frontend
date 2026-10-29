# Restaurante — cómo integrarlo en Arcas Software

El componente reutiliza los endpoints de **pedidos** que ya existen
(`/facturacion/pedidos`, `/pedidos-det`, `/pedidos/checkout`). Una orden del
restaurante es un pedido (`pospedmae`) con una mesa asignada, y "Pagar ahora"
usa el mismo `checkoutPedido` que ya convierte un pedido en factura.

Solo hacen falta **dos columnas nuevas** en `pospedmae`.

## 1. Base de datos (MySQL, `synchronize: false` → DDL manual)

```sql
ALTER TABLE pospedmae
  ADD COLUMN nromesa INT NULL AFTER nrotelefono,
  ADD COLUMN sn_entregado ENUM('S','N') NOT NULL DEFAULT 'N' AFTER nromesa;

-- Para listar rápido las órdenes abiertas de una empresa
CREATE INDEX idx_pospedmae_mesa ON pospedmae (empresaId, sn_facturado, nromesa);
```

Los pedidos existentes quedan con `nromesa = NULL` y `sn_entregado = 'N'`, así que
**no aparecen** en la pantalla de restaurante (solo se muestran las órdenes con
mesa o las recién creadas sin mesa).

## 2. Entidad `pospedmae.entity.ts`

Junto a las demás columnas:

```ts
@ApiProperty({ required: false, description: 'Número de mesa (restaurante). NULL = sin mesa' })
@Column({ type: 'int', nullable: true })
nromesa: number | null;

@ApiProperty({ enum: ['S', 'N'], required: false, description: 'S = pedido entregado a la mesa' })
@Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
sn_entregado: string;
```

## 3. DTOs en `facturacion.dto.ts`

En **`CreatePosPedMaeDto`** y en **`UpdatePosPedMaeDto`** (el ValidationPipe rechaza
o descarta los campos que no estén declarados):

```ts
@ApiProperty({ required: false, description: 'Número de mesa del restaurante' })
@IsNumber() @IsOptional()
nromesa?: number | null;

@ApiProperty({ required: false, enum: ['S', 'N'] })
@IsIn(['S', 'N']) @IsOptional()
sn_entregado?: string;
```

Importa `IsIn` de `class-validator` si todavía no está en el archivo.

No hace falta tocar `createPedido` ni `updatePedido`: el primero ya fuerza
`sn_facturado = 'N'` y el segundo acepta actualizaciones parciales y recalcula
los totales desde el detalle.

## 4. Frontend

Copia los 5 archivos a `src/app/features/facturacion/restaurante/`:

```
restaurante.ts · restaurante.html · restaurante.scss
restaurante.models.ts · restaurante.service.ts
```

Ruta en `facturacion.routes.ts`, antes del `'**'`:

```ts
{
  path: 'restaurante',
  loadComponent: () =>
    import('./restaurante/restaurante').then((m) => m.Restaurante),
},
```

Si el menú sale de la tabla de menús del ERP, crea la opción apuntando a
`/facturacion/restaurante`.

## 5. Qué verificar con una orden de prueba

1. **ISV.** El cálculo por línea copia el criterio de `pedido-form`
   (`subtotal` = bruto, `impuesto` según `param-fac` y el catálogo de impuestos).
   Crea una orden con 2 o 3 productos y compara subtotal, ISV y total con los de
   un pedido igual hecho desde Pedidos.
2. **Productos.** La pantalla usa `/inventario/tienda/productos` (el mismo de la
   tienda virtual, con caché de 1 minuto). Solo aparecen los productos marcados
   para tienda. Si el restaurante necesita otro catálogo, hay que cambiar esa
   llamada en `restaurante.ts` (`cargarProductos`).
3. **Existencia.** `VALIDAR_EXISTENCIA = true` (arriba de `restaurante.ts`) impide
   agregar productos sin stock. Cámbialo a `false` si los platos preparados no
   llevan kardex.
4. **Cobro.** `Pagar ahora` llama a `/facturacion/pedidos/checkout` con la forma de
   pago y el efectivo recibido. No captura datos de tarjeta; si hacen falta,
   hay que reutilizar los campos del checkout de la tienda.
5. **Mesas.** El número de mesas está en `NUM_MESAS` (15) en `restaurante.models.ts`.

## 6. Lo que esta primera versión no incluye

- Impresión de comanda para cocina.
- Ofertas y descuentos.
- Actualización automática cuando otro cajero crea órdenes: la lista se carga
  al abrir la pantalla.
- Cambio de mesa o unión de cuentas.
