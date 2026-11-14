# Restaurante: plan de mejoras (mesero → caja → cocina)

Objetivo: que el mesero tome un pedido en el teléfono en el menor número de toques,
lo mande a una caja de cobro, y que cocina vea y avance ese pedido. Todo como
**pantallas nuevas e independientes**. La pantalla actual de escritorio
(`restaurante.ts/html/scss`) no se modifica.

## 1. Tres componentes, tres responsabilidades

| Componente | Quién lo usa | Dispositivo | Qué hace | Ruta |
|---|---|---|---|---|
| `restaurante-mesero` (**entregado**) | Mesero | Teléfono | Elige mesa/kiosko, arma el pedido, lo envía a una caja, marca lo servido | `/facturacion/restaurante-mesero` |
| `restaurante-caja` (fase 2) | Cajero | Tablet / PC | Ve todos los pedidos de su caja, cobra con el diálogo de pago que ya existe | `/facturacion/restaurante-caja` |
| `restaurante-cocina` (fase 3) | Cocina | Tablet / pantalla fija | Ve las líneas nuevas, las pasa a Preparando → Lista | `/facturacion/restaurante-cocina` |
| `restaurante` (existente) | Todos | Escritorio | Sin cambios; sigue funcionando con los mismos pedidos | `/facturacion/restaurante` |

Los cuatro leen y escriben el **mismo pedido** (`pospedmae` / `pospeddet`). La separación es de
pantallas, no de datos: lo que el mesero envía aparece en caja, en cocina y también en la pantalla
actual de escritorio.

### La orden SIEMPRE lleva cliente y mesero (sin tablas ni columnas nuevas)

- **Cliente** → `pospedmae.nombrecliente` (columna ya existente). El mesero lo escribe en la hoja
  "Revisar y enviar" antes de enviar; es obligatorio en una cuenta nueva.
- **Mesero** → `pospedmae.gestorId` (columna ya existente) → **`ttipogestores`** (catálogo
  existente, el de "Gestor de venta" que ya usan Nueva Factura y Pedido). **NO se crea la columna
  `meseroId` ni una tabla de meseros.** El select de meseros se carga con
  `GET /parametros/gestores` (módulo 3 = Facturación, activos) y queda precargado con el gestor
  del usuario logueado si tiene uno asignado.
- El **nombre** del mesero no se guarda en la orden: se resuelve en pantalla contra
  `ttipogestores` (lo usan el detalle del mesero, la bandeja de caja y el ticket de cocina).

## 2. Ciclo de vida del pedido

```
 Mesero envía ronda        Cocina toma          Cocina termina        Mesero sirve         Caja cobra
 ───────────────►  ENVIADO ─────────► EN_PREPARACION ─────────► LISTO ─────────► ENTREGADO ─────────► COBRADO
                      │                                                                  │
                      └──────────────────── (caja puede ANULAR antes de cobrar) ─────────┘
```

Cada **línea** (`pospeddet`) lleva su propio estado de cocina, porque en una mesa llegan rondas
distintas (primero bebidas, luego platos):

`PENDIENTE → EN_PREPARACION → LISTO → ENTREGADO`

El estado de la **cabecera** lo calcula el servidor desde sus líneas, nunca el cliente:

1. Alguna línea `LISTO` sin servir → `LISTO` (la mesa se ve verde en el teléfono del mesero).
2. Si no, alguna `EN_PREPARACION` → `EN_PREPARACION`; si no, alguna `PENDIENTE` → `ENVIADO`.
3. Todas `ENTREGADO` → `ENTREGADO`.
4. `COBRADO` lo pone el checkout existente (`sn_facturado = 'S'`).

Compatibilidad: al servir una línea el mesero usa el `setItemEntregado` que ya existe, que deja
`sn_entregado = 'S'`. Así la pantalla de escritorio sigue viendo lo mismo que antes.

## 3. Cambios de base de datos (MySQL, DDL manual por `synchronize: false`)

Todo son columnas **nuevas y con valor por defecto**. Los pedidos existentes no cambian.

```sql
ALTER TABLE pospedmae
  ADD COLUMN estado ENUM('ABIERTO','ENVIADO','EN_PREPARACION','LISTO','ENTREGADO','COBRADO','ANULADO')
      NOT NULL DEFAULT 'ABIERTO' AFTER sn_entregado,
  ADD COLUMN enviado_at DATETIME NULL AFTER estado;

ALTER TABLE pospeddet
  ADD COLUMN estado_cocina ENUM('PENDIENTE','EN_PREPARACION','LISTO','ENTREGADO')
      NOT NULL DEFAULT 'ENTREGADO',                 -- default ENTREGADO: lo anterior no aparece en cocina
  ADD COLUMN ronda_uuid CHAR(36) NULL,              -- evita duplicar una ronda si el teléfono reintenta
  ADD COLUMN enviado_at DATETIME NULL,
  ADD COLUMN listo_at DATETIME NULL;

CREATE INDEX idx_pospedmae_caja   ON pospedmae (empresaId, sn_facturado, cajaId, estado);
CREATE INDEX idx_pospeddet_cocina ON pospeddet (estado_cocina, enviado_at);
CREATE UNIQUE INDEX uq_pospeddet_ronda ON pospeddet (pospedmaeId, ronda_uuid, productoId);
```

**Lo que NO se toca (ya existe en `pospedmae`):**

| Columna | Uso en este flujo |
|---|---|
| `cajaId INT NOT NULL` | Caja que cobra la cuenta (la envía el mesero; se conserva mientras la cuenta esté abierta) |
| `gestorId INT NULL` | **Mesero** → FK de negocio a `ttipogestores.gestorId` (catálogo existente) |
| `nombrecliente varchar(80)` | **Nombre del cliente** en la orden |

No hay columna `meseroId`: el mesero **es** un gestor (`ttipogestores`), igual que en facturación.

Dos decisiones de diseño:

- **Kioskos sin columna nueva.** Se guardan en `nromesa` como `100 + n` (kiosko 2 = `102`). Las mesas
  siguen siendo `1..20`, así que no chocan. En la pantalla de escritorio un pedido de kiosko solo se
  ve en la lista "Pedidos" como "Mesa 102", no en los botones redondos. Si eso molesta, la salida
  limpia es una columna `tipo_puesto`; no hace falta para arrancar.
- **`cajaId`.** Usa la columna que el pedido ya tiene. En el front, las cajas visibles para el
  mesero están en `CAJAS_RESTAURANTE` (`mesero.models.ts`): caja central y hasta dos adicionales.
  Más adelante se puede cargar desde el backend.

## 4. API nueva (aditiva)

### `POST /facturacion/restaurante/rondas`  (la usa el mesero)

```jsonc
// Request
{ "rondaId": "uuid", "nromesa": 7, "cajaId": 1,
  "gestorId": 5, "nombrecliente": "Carlos Flores",
  "lineas": [ { "productoId": 31, "cantidad": 2 }, { "productoId": 8, "cantidad": 1 } ] }
// Response: el pedido completo (mismo shape que GET /facturacion/pedidos/:id,
// con estado, cajaId, gestorId y nombrecliente)
```

En **una transacción**:

1. Validar mesa/kiosko en rango, que la caja exista y que `gestorId` exista en `ttipogestores`
   (empresa activa y `sn_activo = 'S'`) → 400 si no.
2. Buscar el pedido abierto del puesto (`empresaId`, `sn_facturado='N'`, `nromesa`, estado ≠ `ANULADO`)
   con bloqueo de fila. Si no hay, **crearlo** con `cajaId`, `gestorId` (mesero), `nombrecliente`
   (cliente) y `enviado_at`. Si ya existe, **se conservan su caja, su gestor y su cliente**
   (una cuenta se cobra en una sola caja y nace con un solo mesero).
3. Si ya hay líneas con ese `rondaId`, devolver el pedido tal cual y no insertar nada (reintento seguro).
4. Por cada línea: validar producto `tipo_giro = 'R'` y existencia (misma regla que hoy), insertar una
   **línea nueva** (no sumar a una existente: cocina necesita ver cada ronda por separado) con
   `estado_cocina = 'PENDIENTE'`, y calcular `subtotal`/`impuesto` con el mismo criterio de
   `createPedido` / `pedido-form`.
5. Recalcular totales con la lógica de `updatePedido` y recalcular `estado` de la cabecera.

> Ojo con `createPedido` (web/CRM): cuando el usuario está logueado **sobreescribe** `nombrecliente`
> con el nombre del usuario. El endpoint de rondas **no** hace eso: el nombre que manda el mesero
> es el del cliente de la cuenta.

Es el único endpoint que el mesero necesita para enviar. El resto lo reutiliza del servicio actual:
`getOrdenesAbiertas`, `getItems`, `setItemEntregado`, productos de la tienda y `GET /parametros/gestores`.

### DTOs y entidad

- `pospedmae.entity.ts`: agregar `estado` y `enviado_at`. **`cajaId`, `gestorId` y `nombrecliente`
  ya están en la entidad** — no se agregan.
- `pospeddet.entity.ts`: agregar `estado_cocina`, `ronda_uuid`, `enviado_at`, `listo_at`.
- Declarar `estado` y `enviado_at` en `UpdatePosPedMaeDto` (y `estado` en el DTO del detalle si
  cocina lo necesita): el `ValidationPipe` descarta lo que no esté declarado. `gestorId`,
  `cajaId` y `nombrecliente` **ya están declarados** en `CreatePosPedMaeDto` y `UpdatePosPedMaeDto`.

### Endpoints de las fases 2 y 3 (reutilizan lo existente)

- Cocina: `PUT /facturacion/pedidos-det/:id` con `{ estado_cocina }`. El servidor valida que la
  transición sea válida (`PENDIENTE → EN_PREPARACION → LISTO`) y recalcula la cabecera.
- Caja: `GET /facturacion/pedidos?cajaId=&estado=` para la bandeja, y el `pedidos/checkout` actual para cobrar.

## 5. Componente del mesero (entregado)

### Principios

1. **Mesa a un toque.** Casillas grandes (mínimo 84 px); tocar una libre abre el menú directamente.
   Ya no existe el paso "seleccionar mesa → pulsar Nueva orden". El pedido se crea en el servidor
   recién al enviar la primera ronda, así no quedan pedidos vacíos.
2. **Cero esperas al tomar el pedido.** El pedido se arma en el teléfono. Sumar o restar un producto
   no llama al servidor; hoy cada toque hace un guardado y un refresco. Se envía una sola vez.
3. **Una mano.** Todo lo que se toca seguido está en la parte baja: barra "Revisar y enviar",
   botones de 44 px o más, campos de cliente/mesero, selector de caja y botón de envío dentro de
   la hoja inferior.
4. **La orden nace identificada.** Cuenta nueva → el mesero escribe el **nombre del cliente** y
   elige el **mesero** (precargado con su gestor) antes de enviar; si falta alguno, no se envía.
   Cuenta abierta → cliente y mesero ya guardados se muestran en solo lectura y se conservan.
5. **Se ve qué falta servir.** La casilla pasa a verde sólido y late cuando cocina termina; además
   sale un aviso aunque el mesero esté en otra pantalla.

### Pantallas

```
 1 · Puestos                         2 · Menú                            3 · Revisar y enviar (hoja)
┌──────────────────────────┐   ┌──────────────────────────┐   ┌──────────────────────────┐
│ ‹  Salón   (🔔 2 listos) │   │ ‹  Mesa 7            🔍  │   │ Mesa 7                 ✕ │
│ [ Mesas | Kioskos ]      │   │    Pedido nuevo          │   │ 3 productos por enviar   │
│ (Todas)(Libres)(Ocup.)(Por servir)│ (Todo)(Cervezas)(Carnes)→│   │ Cerveza        [−] 2 [+] 🗑│
│ ┌───┐ ┌───┐ ┌───┐ ┌───┐  │   │ [img] Cerveza        [ + ]│   │ Baleada        [−] 1 [+] 🗑│
│ │ 1 │ │ 2 │ │ 3 │ │ 4 │  │   │       L 45.00            │   │ ─────────────────────── │
│ │Lib│ │12m│ │Ser│ │Lib│  │   │ [img] Baleada  [−] 2 [+] │   │ Cliente [Carlos Flores ] │
│ └───┘ └───┘ └───┘ └───┘  │   │       L 30.00            │   │ Mesero  [Ana López    ▾] │
│ ...                      │   │ [img] Flan (Agotado)     │   │ (Caja central)(Caja 2)(Caja 3)│
├──────────────────────────┤   │ (3) Revisar y enviar L120│   │ Esta ronda       L 120.00 │
│                          │   └──────────────────────────┘   │ [ ✈ Enviar a Caja central ]│
└──────────────────────────┘                                   └──────────────────────────┘
```

Estados de la casilla: **libre** (borde punteado, como en escritorio), **en cocina** (ámbar, con los
minutos), **lista** (verde sólido: hay que servir), **servida** (azul: esperando que pidan la cuenta).
Tocar una casilla ocupada abre una hoja con **cliente y mesero** de la cuenta, las líneas y su estado
de cocina, el botón **Marcar servido** (cuando hay líneas listas) y **Agregar productos** (siguiente ronda).

### Decisiones y límites

- **Caja predeterminada recordada** por teléfono. Si la mesa ya tiene pedido, se usa la caja de ese pedido.
- **Cliente y mesero de cuenta abierta se conservan.** El backend no los pisa al agregar una ronda;
  en el teléfono se muestran en solo lectura.
- **Reintento seguro.** Si falla el envío, el pedido se queda en pantalla; el `rondaId` evita duplicados si el servidor sí lo procesó.
- **Salir sin enviar** pide confirmación, porque el borrador solo vive en el teléfono.
- **Actualización:** cada 15 s y al volver a la app (se pausa con la pantalla apagada). Ver sección 8.
- **Pantalla completa solo en teléfono** (menos de 768 px); en pantallas anchas queda como columna centrada. El escritorio actual no se toca.
- **Pendiente para la fase 1.5:** notas por producto ("sin cebolla"). Necesita una columna `nota` en
  `pospeddet`; la dejé fuera para no entregar algo que el backend actual no guarda.
- Los pedidos con `nromesa` fuera de las mesas/kioskos configurados (y la "venta libre" sin mesa) no aparecen en esta pantalla.

### Archivos de la fase 1

| Archivo | Dónde queda |
|---|---|
| `restaurante-mesero.ts/html/scss` | `features/facturacion/restaurante-mesero/` |
| `mesero.models.ts` | `core/models/` |
| `mesero.service.ts` | `core/services/` |
| Ruta | `facturacion.routes.ts` → `path: 'restaurante-mesero'` |
| `normalizarOrden` (pass-through de `gestorId`, `cajaId`, `estado`) | `core/services/restaurante.service.ts` — aditivo; la pantalla de escritorio no lee esos campos |

## 6. Caja central y cajas adicionales (fase 2)

- **Bandeja por caja.** La central ve **todos** los pedidos; Caja 2 y 3 ven solo los suyos
  (`cajaId`). Se elige la caja al entrar y se recuerda.
- **Lista de cuentas abiertas** ordenada por antigüedad, con mesa, **cliente** (`nombrecliente`),
  **mesero** (`gestorId` → `ttipogestores`), total, y estado (en cocina / servida). Se destaca la que
  ya fue servida, que es la que normalmente se cobra.
- **Cobrar** reutiliza el diálogo de pagos actual (múltiples formas de pago, Luhn, TodoPago, ticket).
  Se extrae a un componente compartido para no duplicar código; la pantalla de escritorio sigue igual
  hasta que decidas migrarla.
- **Reasignar a otra caja** (solo la central) por si una caja se cierra.
- **Anular** una línea o el pedido, con motivo; solo caja puede anular lo ya enviado a cocina.

## 7. Cocina (fase 3)

- **Tablero por columnas:** Nuevos · Preparando · Listos. Cada tarjeta es un **ticket por ronda**:
  puesto, **cliente**, **mesero**, hora de envío, minutos de espera (ámbar a los 10 min, rojo a los 20;
  ajustable), y sus líneas.
- **Un toque por avance:** la tarjeta o cada línea pasa de Nuevo → Preparando → Listo. Botones grandes
  para tablet con manos ocupadas.
- **Sonido y aviso** cuando entra un ticket nuevo (con botón para activarlo, por las reglas del navegador).
- **Filtro por estación** (bebidas / platos) usando la categoría del producto, si cocina y barra son distintas.
- **Impresión de comanda** (estaba pendiente en la primera versión): opcional, sobre este mismo ticket.

## 8. Actualización en vivo

- **Ahora:** consulta cada 15 s. Con el volumen de tu mercado alcanza y es lo más simple.
- **Después, si hace falta:** eventos del servidor (SSE). En NestJS es un `@Sse()` que emite cuando
  cambia un estado; el front mantiene el refresco actual como respaldo si se cae la conexión.

## 9. Orden de trabajo sugerido

| Fase | Entregable | Depende de |
|---|---|---|
| 0 | DDL de la sección 3, entidad y DTOs | — |
| 1 | `POST /rondas` + **componente mesero (este entregable)** + ruta + permiso por rol | Fase 0 |
| 1.5 | Notas por producto; menú inicial para el rol mesero | Fase 1 |
| 2 | Componente caja (bandeja por caja, cobro compartido) | Fase 1 |
| 3 | Componente cocina (tablero, transiciones validadas en servidor) | Fase 1 |
| 4 | Tiempo real (SSE), impresión de comanda, cambio de mesa / unión de cuentas | Fases 2 y 3 |

La fase 1 ya permite probar el flujo completo con una prueba simple: el mesero envía, y el pedido
aparece en la pantalla de escritorio actual con su mesa, su cliente y su mesero.

## 10. Supuestos que debes confirmar

1. **`restaurante.service.ts` y `restaurante.models.ts` no se modifican salvo el pass-through
   aditivo** de `gestorId`, `cajaId` y `estado` en `normalizarOrden` (la escritorio no los lee).
   El componente usa solo los métodos que vi en `restaurante.ts` (`getOrdenesAbiertas`, `getItems`,
   `setItemEntregado`) y los campos de `OrdenRestaurante` / `OrdenItem` que ese código ya lee.
   Si alguna firma difiere, el ajuste es mínimo.
2. **La URL de `/facturacion/restaurante/rondas`** y su respuesta son un contrato nuevo que hay que
   implementar en NestJS; hasta entonces el botón Enviar mostrará error.
3. **Cajas en `CAJAS_RESTAURANTE`** (ids 1, 2 y 3) son de ejemplo: cámbialos por los ids reales de `pospedmae.cajaId` / caja.
4. **Meseros = gestores.** Se asume que los meseros se dan de alta en `ttipogestores` con módulo 3
   (Facturación) y `sn_activo = 'S'`, opcionalmente con `usuarioId` apuntando al login del mesero
   (para la precarga). Si un mesero no tiene gestor, el botón Enviar lo avisa.
5. **Kioskos:** `NUM_KIOSKOS = 20` (`mesero.models.ts`) y `NUM_MESAS = 20` (`restaurante.models.ts`).
6. **Imágenes:** los productos llegan con la foto en base64. En teléfono con datos móviles conviene
   un endpoint de miniaturas; no lo hice porque implica tocar el backend de productos.
7. **Versión de Angular:** compilado en modo estricto (plantilla incluida) con Angular 21 y PrimeNG 21.
   No estaba probado en el navegador ni contra el backend.
