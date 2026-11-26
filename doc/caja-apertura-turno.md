# Apertura de Turno de Caja (POS) — Diseño e Implementación

**Fecha:** 22/11/2026
**Módulo:** Facturación → Caja POS (`poscajasesion`)
**Estado:** Implementado y compilado (`nest build` + `npm run build` OK) · pendiente verificación en navegador

---

## 1. Contexto

La apertura de turno estaba desacoplada del catálogo real de cajas:

| # | Problema detectado | Evidencia |
|---|---|---|
| 1 | `cajaId` hardcodeado en `1` en el frontend | `caja-manager.ts` → `cajaId = signal<number>(1)` (nunca cambiaba) |
| 2 | El frontend enviaba `usuarioId` en el body | `AbrirCajaSesionDto` exigía `empresaId`, `cajaId`, `usuarioId` → un usuario podía abrir turno a nombre de otro |
| 3 | Nadie validaba qué cajas podía usar el usuario | No se consultaba `tusuarios_caja` ni `cxccajeros` al abrir |

Con el renombre `tusuarios_caja.codigo → cajaId` (que ahora referencia `cxccajeros.cajaId`), las tres tablas quedan conectadas y permiten resolver la caja del turno desde la base de datos.

---

## 2. Modelo: quién es quién

| Tabla | Responsabilidad | Clave |
|---|---|---|
| **`cxccajeros`** | Catálogo de cajas físicas/POS. `cajaId` es el ID que viaja en **todas** las transacciones (`posfacmae.cajaId`, `pospedmae.cajaId`, `posfaccaja.cajaId`, `poscajasesion.cajaId`). `usuario` = cajero **titular sugerido**. | Identidad de la caja |
| **`tusuarios_caja`** | **Matriz de autorización + configuración**: qué caja usa cada usuario, con qué `forma` (TICKET/CARTA) y `modo_correlativo` (A/M). `cajaId` → `cxccajeros.cajaId`. | Permiso |
| **`poscajasesion`** | El **turno**: apertura, movimientos, cortes X/Z. | Operación |

> **Regla mental:** `cxccajeros.usuario` es informativo (titular); `tusuarios_caja` es la **autoridad**. Si un cajero cubre a otro, se agrega/edita la fila en `tusuarios_caja` — no se toca `cxccajeros`.

### Estructura de `cxccajeros`

```
cajaId        int PK AUTO_INCREMENT
usuario       varchar(20)  → tunidades/tusuarios.usuario
sn_activo     enum('S','N')
empresaId     int
usuarioUpdated, fechaUpdated
```

### Estructura de `tusuarios_caja`

```
id                 int PK AUTO_INCREMENT
usuario            varchar(20)
cajaId             int  → cxccajeros.cajaId
sn_activo          enum('S','N')
forma              enum('TICKET','CARTA')
modo_correlativo   enum('A','M')
empresaId          int
usuarioCreated, usuarioUpdated, fechaUpdated
UNIQUE (usuario, cajaId)
```

---

## 3. Decisiones aprobadas (22/11/2026)

| # | Pregunta | Decisión |
|---|---|---|
| D1 | ¿Un usuario puede tener más de una caja autorizada? | **No — una sola por usuario.** La apertura la resuelve automáticamente, sin selector. |
| D2 | ¿Quién puede abrir turno en una caja ajena? | **Solo `admin` y `supervisor`.** El resto queda restringido a su caja. |
| D3 | ¿Un usuario puede tener 2 turnos abiertos a la vez? | **No — un turno por usuario.** |
| D4 | ¿El `cajaId` de la factura se fuerza desde la sesión abierta? | **Sí** — implementado 22/11/2026 (ver §9). |

---

## 4. Reglas de negocio

| ID | Regla |
|---|---|
| **R1** | Un usuario solo abre caja en las cajas de su `tusuarios_caja` (fallback `cxccajeros.usuario`). `admin`/`supervisor` pueden usar cualquier caja activa. |
| **R2** | Una caja = **un** turno ABIERTO a la vez. |
| **R3** | Un usuario = **un** turno ABIERTO a la vez. |
| **R4** | El `cajaId` de factura/pedido sale de la **sesión abierta** del usuario; el parámetro es solo respaldo si no hay turno. |
| **R5** | `tusuarios_caja.forma` / `modo_correlativo` se resuelven por **(usuario, cajaId)**, no solo por usuario. |
| **R6** | Caja inactiva (`sn_activo='N'`) no puede abrir turno, aunque tenga autorización. |

---

## 5. Contrato de API

### Abrir turno

```
POST /api/facturacion/caja/sesiones
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "cajaId": 2,              // OPCIONAL
  "monto_apertura": 1500.00
}
```

- `empresaId` y `usuarioId` **NO se aceptan por body**: se resuelven del JWT (`@CurrentUser()`). Cualquier valor enviado se descarta por `ValidationPipe({ whitelist: true })`.
- `cajaId` es opcional: si el usuario tiene una sola caja asignada, el backend la resuelve.

**Respuestas de error**

| Código | Mensaje |
|---|---|
| 400 | `No se pudo identificar el usuario autenticado` |
| 403 | `El usuario X no tiene ninguna caja asignada. Solicite la asignación en Configuración → Usuarios de Caja.` |
| 403 | `El usuario X no está autorizado para operar la caja #N` |
| 409 | `La caja #N ya tiene un turno abierto (ID: n). Debe cerrarse antes de abrir otro.` |
| 409 | `Ya tiene un turno abierto en la caja #N (ID: n). Ciérrelo antes de abrir otro turno.` |

### Cajas disponibles del usuario

```
GET /api/facturacion/caja/cajas-disponibles
Authorization: Bearer <JWT>

→ [
    { "cajaId": 1, "usuario": "admin",  "nombre": "Caja 1 · admin",  "asignada": true },
    { "cajaId": 2, "usuario": "tienda", "nombre": "Caja 2 · tienda", "asignada": false }
  ]
```

`asignada: true` significa que viene de `tusuarios_caja`; `false` que es titular en `cxccajeros`.

### Sesión activa

```
GET /api/facturacion/caja/sesiones/activa?empresaId=2
```

Si no se envía `usuarioId`, el backend usa el del JWT (R3: un turno por usuario).

---

## 6. Flujo de apertura (implementado)

```
1. empresaId + usuarioId + roles  ←  JWT (@CurrentUser())
2. Resolver cajas autorizadas:
     tusuarios_caja  WHERE usuario=yo AND empresaId AND sn_activo='S'
     └─ si vacío → cxccajeros WHERE usuario=yo AND empresaId AND sn_activo='S'
     └─ si vacío → si rol admin/supervisor: todas las cajas activas
     └─ si vacío → 403
3. Determinar cajaId:
     body.cajaId presente → debe estar en la lista autorizada (si no → 403)
     ausente + 1 caja     → se usa esa (regla 1 usuario = 1 caja)
     ausente + N cajas    → la que tiene como titular, si no la primera por cajaId
4. Validar caja activa (R6)
5. Validar que la CAJA no tenga turno ABIERTO        → 409 (R2)
6. Validar que el USUARIO no tenga otro turno ABIERTO → 409 (R3)
7. Crear sesión { empresaId, cajaId, usuarioId, monto_apertura }
8. Crear movimiento APERTURA con motivo "Apertura de turno — Caja N · usuario"
```

---

## 7. Cambios aplicados

### Backend

| Archivo | Cambio |
|---|---|
| `modules/facturacion/dto/caja-sesion.dto.ts` | `AbrirCajaSesionDto` reducido a `{ cajaId?: number, monto_apertura: number }`. Eliminados `empresaId` y `usuarioId`. |
| `modules/facturacion/caja-sesion.service.ts` | Nuevos: `cajasDisponibles()`, `resolverCajaAutorizada()`, `obtenerSesionActivaDeUsuario()`. `abrirSesion(dto, currentUser)` reescrito con R1/R2/R3/R6. Constante `ROLES_CAJA_LIBRE = ['admin','supervisor']`. Interfaz `CajaDisponible`. Repos nuevos: `Cxccajero`, `TusuarioCaja`. |
| `modules/facturacion/caja-sesion.controller.ts` | `abrirSesion` recibe el user completo. Nuevo `GET cajas-disponibles`. `sesiones/activa` cae al `usuarioId` del JWT. |
| `modules/facturacion/facturacion.module.ts` | Repo `Cxccajero` registrado en `TypeOrmModule.forFeature`. |
| `modules/parametros/parametros.service.ts` | **1 usuario = 1 caja**: al crear en `tusuarios_caja`, si el usuario ya tiene fila → `409 ConflictException` con la caja actual. |
| `modules/facturacion/facturacion.service.ts` | `getTicket`: `tusuarios_caja` se filtra por **(usuario, cajaId)** de la factura, con fallback a la primera asignación (R5); `tpv = cajaRow.id` (terminal del usuario). R4: nuevo helper `resolverCajaIdDesdeSesion()` usado en `createFactura`, `createFacCaja` y `checkoutPedido`. |
| `modules/parametros/entities/usuario-caja.entity.ts` | `codigo` → `cajaId` (renombre de columna). |
| `modules/parametros/dto/usuario-caja.dto.ts` | `codigo` → `cajaId` en Create/Update. |

### Frontend

| Archivo | Cambio |
|---|---|
| `features/facturacion/caja/caja-sesion.models.ts` | Nueva interfaz `CajaDisponible`. |
| `features/facturacion/caja/caja-sesion.service.ts` | Nuevo `cajasDisponibles()`. `abrirSesion()` ya no envía `empresaId`/`usuarioId`. |
| `features/facturacion/caja/caja-manager.ts` | Eliminado `cajaId = signal(1)`. Ahora `cajaId` y `nombreCaja` son `computed` desde las cajas autorizadas. Nuevo `cargarCajas()`. `cargarSesionActiva()` consulta por usuario (R3). |
| `features/facturacion/caja/caja-manager.html` | Muestra `p-tag` con la caja asignada; botón "Abrir Turno" deshabilitado si no hay caja. |
| `core/models/catalogo-parametros.models.ts` | Campo `codigo` (número) → `cajaId` como `select` alimentado por `/cxc/cajeros`. |
| `core/services/cajas.service.ts` | Catálogo dinámico de cajas para restaurante (`GET /cxc/cajeros`). |
| `features/facturacion/restaurante*` | Cajas dinámicas (`restaurante`, `restaurante-mesero`, `restaurante-caja`). |

---

## 8. Verificación

| Check | Resultado |
|---|---|
| `npx nest build` (Backend) | **OK** |
| `npm run build` (Frontend) | **OK** — `EXIT=0`, solo warnings preexistentes de `pdfmake` / `tesseract` |
| Backend escuchando en `:3000` | **No** — compilado pero no levantado |

### Cómo probar

```powershell
cd Backend
node dist/main.js
```

1. Login → `POST /api/auth/login` con `{"usuario":"admin","password":"admin123"}`.
2. `GET /api/facturacion/caja/cajas-disponibles` → debe devolver la(s) caja(s) del usuario.
3. Abrir turno → `POST /api/facturacion/caja/sesiones` con `{"monto_apertura": 100}`.
4. Reintentar la apertura → debe responder **409** (R3).
5. En el navegador: `/facturacion/caja` → debe mostrar la caja asignada y deshabilitar el botón si el usuario no tiene caja.

### Datos de referencia (empresa 1)

```
cxccajeros:   (1,'admin'), (2,'tienda'), (3,'solorzanocastro')
tusuarios_caja: 1 fila por usuario
```

---

## 9. Resueltos y pendientes

### Resuelto — R4: forzar `cajaId` desde la sesión abierta (22/11/2026)

Nuevo helper privado en `facturacion.service.ts`:

```ts
private async resolverCajaIdDesdeSesion(empresaId: number, usuario: string): Promise<number | null>
```

Resuelve `tusuarios.usuarioId` por `(usuario, empresaId)` y devuelve `session.cajaId` de `cajaSesionService.obtenerSesionActivaDeUsuario(empresaId, usuarioId)`. Si no hay turno o falla, devuelve `null` y se aplica el respaldo.

| Método | Antes | Ahora |
|---|---|---|
| `createFactura` | `dto.cajaId = getParamDefecto('cajaId', 1)` | sesión → parámetro (si no hay turno) |
| `createFacCaja` | `Number(dto.cajaId) || 1` | sesión → payload → `1` |
| `checkoutPedido` | `pedido.cajaId` → parámetro | sesión → `pedido.cajaId` → parámetro |

La validación de turno abierto para contado sigue igual (`obtenerSesionActiva(empresaId, cajaId)` → 400 "La caja #N no tiene ninguna sesión (turno) abierta. Debe abrir turno antes de facturar.").

### Resuelto — `tpv` del payload del ticket (22/11/2026)

**Decisión del usuario:** conservar la clave `tpv` (no renombrarla a `cajaId` para no romper la impresión ni la consulta de facturas), pero su **valor debe ser `tusuarios_caja.id`** — la terminal del usuario — **no `cxccajeros.cajaId`**.

```ts
// getTicket() — Backend/src/modules/facturacion/facturacion.service.ts
tpv: cajaRow?.id ?? null,   // antes: cajaRow?.cajaId ?? null
```

La fila `cajaRow` sigue resolviéndose por `(usuario, cajaId)` de la factura, con fallback a la primera asignación histórica del usuario. Solo cambia el valor expuesto.

### Otros

- Verificación end-to-end en navegador con backend reiniciado.
