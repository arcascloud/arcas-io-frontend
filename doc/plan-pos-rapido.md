# Plan de trabajo — Rediseño POS Rápido (2 pantallas + drawer)

> Aprobado por el usuario: 08/11/2026
> Estado: **EN EJECUCIÓN**

## Contexto y decisiones

- **Pantalla 1** `/facturacion/pos-rapido`: escáner + catálogo + pie fijo de totales + drawer de carrito.
- **Pantalla 2** `/facturacion/pos-rapido/pagar` (ruta nueva): Columna A datos factura (copiada de `nueva-factura`) + Columna B formas de pago.
- **Estado compartido**: nuevo servicio raíz `PosRapidoStateService` (patrón `CarritoStateService`): `filas`, `totales`, `descuentoGlobal`, `pagos`, contexto (cliente TIENDA, bodega, caja, factor). Pantalla 1 escribe → pantalla 2 lee y factura → al facturar limpia y vuelve.
- El cliente **ya no es siempre TIENDA**: se copia el comportamiento de `nueva-factura` (contado = TIENDA automático, crédito = select de cliente habilitado).
- El diálogo de cobro actual (`dialogCobro`) se elimina: lo reemplaza la pantalla 2.

---

## Fase 1 — Pantalla 1: `pos-rapido` (html/scss/ts)

### 1.1 Header (puntos 4 y 5 del plan del usuario)
- **Quitar**: botones "Carrito" y "Cobrar" del header (puntos 1-2).
- **Reducir** el input del escáner (`flex: 0 1 340px`) y **a su derecha** colocar `<p-select>` **Descuento global** (`GET /facturacion/descuentos`, signal `descuentoGlobalId`, replica `onDescuentoGlobalChange()` de nueva-factura) — ancho fijo ~14rem.
- **Feedback visual de escaneo**: al agregar producto, clase `scan-ok` en el contenedor del escáner (borde/estilo verde 400ms) además del aviso flotante existente; mantener re-enfoque del input.
- **Badge de items**: clic = abrir/cerrar drawer; mantener mini-total.

### 1.2 Drawer del carrito (punto 3)
- `<p-drawer>` de PrimeNG (`DrawerModule`), `position="right"`, `styleClass="pos-drawer"`, `[(visible)]` con `model(false)` (patrón documentado: `model()`, no `signal()` plano — con `signal()` plano `visibleChange()` sobreescribe).
- **Auto-abrir**: `effect()` — al pasar de 0 a ≥1 ítems se abre solo; badge lo alterna.
- **Contenido** (lógica tienda-virtual): ítems con img, nombre, precio, botones `−`/`+`, subtotal, eliminar; resumen Subtotal/Total; botones **Vaciar** y **Pagar** (`Pagar` → navega a pantalla 2, cierra drawer).
- Overlay en móvil (`position="right"`, ancho `min(380px, 85vw)`).
- **Quitar**: vista completa `pos-carrito` (tabla + footer carrito) y el toggle `vista()` catálogo/carrito; el catálogo queda siempre visible.

### 1.3 Pie fijo siempre visible (punto 8)
- **Fila 1 — Totales**: `Subtotal venta | Impuesto (tasa%) | Descuento | Gran Total` (celdas label uppercase + monto).
- **Fila 2 — Resumen de Pago**: `Total de Factura: L x | Total de Pagos: L y` + texto `presione Alt+9 para ver ventana de atajos` + `ingrese el importe de pago presionando el botón pagar` (si pagos = 0).
- **Botón `Pagar`** → `irAPagar()`: valida `filas.length > 0` y navega a `/facturacion/pos-rapido/pagar`.
- El descuento global entra en el cálculo de totales (además del descuento por línea/oferta).

### 1.4 Catálogo más denso (puntos 6-7)
- Grid `minmax(220px → 170px)`, gap `0.85 → 0.55rem`, imagen `aspect-ratio 4/3`, paddings reducidos.
- Info por tarjeta igual (código, descripción, precio, stock, badge carrito) — solo menos aire, tipo cajero experimentado.

### 1.5 Atajos (punto 8)
- Agregar `dialogAtajos` (ALT+9) — **no existía**: copiar `atajos[]` + `p-dialog` de `nueva-factura`.
- Reasignar: `ALT+1` enfocar escáner, `ALT+2` abrir/cerrar drawer, `ALT+3` ir a pagar (si hay ítems), `ALT+4` vaciar, `ALT+9` atajos, `ESC` limpiar búsqueda.

### 1.6 Quitar
- `dialogCobro` + su `p-dialog` completo (reemplazado por pantalla 2); `abrirCobro()` pasa a `irAPagar()`.
- Se conservan `pagos`, `inicializarPagos`, `esTarjeta`, `validarLuhn`, etc. → se **mueven al state service** para la pantalla 2.

---

## Fase 2 — Servicio de estado `pos-rapido.state.ts`

`providedIn: 'root'`:
- `filas = signal<LineaPos[]>`, `descuentoGlobalId = signal`, `pagos = signal<PagoFactura[]>`, `totales` (computed con descuento global + exenta)
- Contexto: `clienteTienda`, `bodegaId`, `cajaId`, `factordecambio`, `formaspago`, `tarjetas`, `gestores`
- Formulario de la factura (FormGroup para pantalla 2) o sus valores
- `limpiar()` post-facturación

**Mover** desde el componente: `filas`, cálculo de totales, cargas de contexto.

---

## Fase 3 — Pantalla 2: `pos-pagar` (nueva)

`features/facturacion/pos-pagar/` — ts/html/scss; ruta `pos-rapido/pagar` en `facturacion.routes.ts`.

### Columna A — Datos de la factura (copiar de nueva-factura)

| Campo | Fuente |
|---|---|
| Tipo factura `Contado/Crédito` + botón **Nuevo Cliente** | `nueva-factura.html:374-407` (`tipoOptions`, `onTipoFacturaChange()`) |
| Factura con nombre `Si/No` + input nombre (contado+Si) | html:411-424, 449-465 (`nombreClienteManual`) |
| Cliente `p-select` (deshabilitado en contado → TIENDA) | html:425-447 (`onClienteChange()`) |
| RTN del cliente | html:468-479 |
| Gestor de ventas (`/parametros/gestores` módulo 3) | html:481-496 (`cargarGestor()`) |
| Exenta ISV `Si/No` → `recalcularExenta()` | html:515-527, ts:1025-1045 |
| Tipo Constancia (OCE/SAG/CEA/FNE) / Nro. Constancia / Importe Excento readonly | html:529-586 |
| Separadores `---` entre bloques | según maqueta del usuario |

### Columna B — Forma de pago (replicar diálogo de pagos)

- Cards de pago idénticas a `nueva-factura.html:668-772`: "Agregar pago", forma de pago, tarjeta condicional (tipo/nro), autorización (tarjeta/transferencia), importe HNL.
- `inicializarPagos()`, `agregarPago`/`quitarPago`, `pagosConImporte`, `pendiente`, `cambio`, `esTarjeta`/`esTransferencia`, `validarLuhn`.

### Footer

- `Total Factura | Total Pagos | Pendiente` + botones **Cancelar** (volver a pantalla 1, conserva carrito) y **Facturar**.

### Lógica `facturar()`

- Copia adaptada de `nueva-factura.ts:1149-1453`: validaciones (form, filas, total 0, nombre manual, pagos/Luhn/autorización, `totalPagos >= total` para contado) → `POST facturas` → forkJoin `facturas-det` → contado: `POST fac-caja` → `procesar-kardex` → toast + ticket (si `snImprimeFactura`) → `state.limpiar()` → navegar a pantalla 1.
- Crédito: `sn_pagada='N'`, sin pagos (igual que nueva-factura).
- Responsive: `col-12 md:col-6` para apilar en móvil.

---

## Fase 4 — Verificación

1. `npm run build` (producción).
2. Prueba manual: escanear → drawer auto-abre → Pagar → pantalla 2 → contado con pago → Facturar → vuelve limpio.
3. Crédito con cliente, exenta con constancia, tarjeta con Luhn inválido → errores esperados.

**Archivos**: `pos-rapido.{ts,html,scss}` (editar), `pos-rapido.state.ts` (nuevo), `pos-pagar/*` (nuevos), `facturacion.routes.ts` (ruta). Sin cambios backend, sin SQL.

---

## Matriz de decisiones (respuestas del usuario)

| Pregunta | Decisión |
|---|---|
| ¿Dónde se abre el 2do formulario? | **Ruta separada** `/facturacion/pos-rapido/pagar` |
| ¿Cuándo se abre el drawer del carrito? | **Auto al agregar primer ítem** + badge para alternar |
| ¿Cliente siempre TIENDA? | **No** — igual que nueva-factura: contado=TIENDA, crédito=select |
| ¿Contenido del drawer? | **Carrito + resumen + botón Pagar** |
