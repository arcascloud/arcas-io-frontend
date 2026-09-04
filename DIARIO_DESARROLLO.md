# Diario de Desarrollo - ERP (Frontend)

Este documento registra el progreso diario, las decisiones de arquitectura y los estándares que definimos a medida que construimos el ERP.

## Estándares del Proyecto (Borrador Inicial)
Para garantizar la escalabilidad, seguridad y una integración perfecta con nuestro backend (NestJS + MySQL), seguiremos estas reglas:

### 1. Arquitectura y Código (Angular 16+)
- **Reactividad:** Priorizar el uso de **Signals** (`signal`, `computed`, `effect`) para el estado local de los componentes.
- **Fugas de Memoria:** Toda suscripción a RxJS (`.subscribe()`) debe utilizar el operador `takeUntilDestroyed(this.destroyRef)` para auto-limpiarse cuando se destruya el componente.
- **Estilos:** Prohibido el uso de estilos en línea (`style="..."`). Todo el CSS debe ir en el archivo `.scss` del componente o en las variables globales.
- **Tipado Estricto:** Evitar el uso de `any`. Los modelos del Frontend deben mapear exactamente con los DTOs y Entidades de NestJS/TypeORM.

### 2. UI/UX (PrimeNG)
- **Tokens de Diseño:** Obligatorio utilizar las variables definidas en `styles.scss` (Ej: `var(--c-surface)`, `var(--c-primary)`, `var(--c-border)`). Prohibido usar variables nativas de PrimeNG (como `--surface-card`) para asegurar la consistencia.
- **Estructura de Página:** Todo módulo debe envolverse en un `<div class="page">`, utilizar `<div class="page-header">` y `<h1 class="page-title">`.
- **Contenedores:** Toda sección que requiera fondo blanco y borde debe usar la clase global `.card`.

### 3. Seguridad e Integración
- **Interceptores de Auth:** Todo request inyecta automáticamente el JWT desde el `AuthService`. Si el backend responde 401, el ERP limpia la sesión y redirige al Login (Interceptores funcionales).
- **Manejo de Errores Global:** El `error.interceptor.ts` atrapa errores globales (404, 409, 403, 500) provenientes de NestJS y los muestra automáticamente al usuario utilizando `MessageService` de PrimeNG. Ya no es obligatorio crear alertas de error individuales en cada componente a menos que sea una validación muy específica.

---

## Bitácora Diaria

### 📅 Sábado, 22 de Agosto de 2026

**1. Refactorización del Módulo CxC (Clientes)**
- **Componente:** `clientes-manager`
- **Mejoras UI:** Se limpió el HTML de más de 40 atributos de estilos en línea, trasladando todo a clases en `clientes-manager.scss` para asegurar la reutilización de código y mantener una interfaz limpia.
- **Mejoras Lógicas (TypeScript):**
  - Se eliminó el anti-patrón de usar `effect` y `setTimeout` para el filtrado de listas locales.
  - Se implementó un filtro ultra-rápido utilizando una señal `computed` (`filteredArray`).
  - Se previnieron fugas de memoria inyectando `DestroyRef` y aplicando `takeUntilDestroyed()` en todas las peticiones a la API del `CxcService`.
- **Decisión:** Iniciar la fase de estandarización global antes de seguir programando pantallas individuales.

### 📅 Domingo, 23 de Agosto de 2026

**1. Paginación y búsqueda server-side (CxC Clientes)**
- Backend `cxc.controller.ts`: `findAllClientes` acepta `page`, `limit`, `q` como query params. Retorna `{ data: [], total }`.
- Backend `cxc.service.ts`: Usa `findAndCount` + `Like` para buscar en nombres, apellidos, nrocliente, dni, rtn.
- Frontend: Señales `page`, `limit`, `totalClientes`; paginator con `[5, 10, 15]` opciones.
- Se eliminó el `filteredArray` computed (filtrado client-side); el HTML ahora usa `data()` directamente.
- `clientes-count` muestra `totalClientes()` del backend.

**2. Estado de Cuenta – Fix signs y orden**
- Backend `cxc.service.ts`: `findMovimientosByCliente` ordena por `fecharegistro ASC` (más antiguo primero).
- Frontend: Débito muestra `+`, Crédito/Abono muestra `-`.
- Saldo calculado restando C/A (no sumando todo).

**3. Estado de Cuenta – Tabla detallada con joins**
- Backend `cxcmovimiento.entity.ts`: `@ManyToOne` a `Tmodulos` con `@JoinColumn` simple por `moduloId` (corregido de composite a simple).
- Backend `cxc.service.ts`: `leftJoinAndSelect` sobre `mov.modulo` (eliminado `mov.documentoFiscal` inexistente).
- Frontend: Tabla con columnas Fila, Fecha, D/C, Referencia, Concepto, Importe, Saldo footer.
- Se quitó columna Descripción. Se redistribuyeron anchos: Fila 50px, Referencia 100px, Importe 150px con `tabular-nums`.

**4. Formularios inline – Estructura unificada (p-grid)**
- 5 formularios (Notas, Préstamos, Referencias, Parientes, Cliente/Nuevo) usan la misma estructura:
  - `card mb-3` → `p-fluid` → `p-grid` → `p-col-12 p-col-6` → `p-field` → label + input/select
  - Botones en `p-col-12` con `d-flex gap-2 justify-content-end mt-3`
  - Sin botones "Nuevo", sin dialogs, formularios siempre visibles
- Botones: `class="p-button-text"` (Limpiar) / `class="p-button-primary"` (Guardar)

**5. Formulario Cliente (columna derecha) – Fix simetría**
- `cliente-form.html`: Reescrito con `p-grid`/`p-col-12 p-col-6`/`p-field`/`p-select` (antes usaba `form-grid`/`campo`).
- Se eliminó doble wrapper `card` (padre `form-inline-container card` + componente interno).
- Wrapper padre: `form-inline-wrapper` con `padding: 1.5rem`.
- Se eliminaron `[fluid]="true"` redundantes de todos los inputs/selects.
- `cliente-form.scss`: `.campo` muerto reemplazado por `:host { display: block }`.

**6. Selects – Opciones movidas al TypeScript**
- Todos los arrays inline `[{label: ..., value: ...}]` del HTML se movieron al TS como `readonly` arrays:
  - `notaTipoOptions`, `estadoOptions`, `referenciaTipoOptions`, `referenciaParentescoOptions`, `parienteParentescoOptions`
- Se eliminaron comentarios HTML residuales (`<!-- no tiene asimetria -->`).

**7. Maestro-Detalle form (prestamos/editar/nuevo) – Fix grid**
- `maestro-detalle-form.scss`: Agregadas clases faltantes `form-grid`, `campo`, `acciones-form` que el HTML usaba pero no estaban definidas.

**8. Backend – Fix errores**
- `cxc.controller.ts`: `findAllClientes` – `page` y `limit` cambiados de `ParseIntPipe` con default a `string?` parseado manualmente (NestJS ejecuta el pipe antes de aplicar el default → "Validation failed (numeric string is expected)").
- `cxcmovimiento.entity.ts`: `@JoinColumn` compuesto (`moduloId + empresaId`) cambiado a simple (`moduloId`) porque `Tmodulos` tiene PK solo en `moduloId`.
- `cxc.service.ts`: Eliminado `leftJoinAndSelect('mov.documentoFiscal')` que referenciaba una relación inexistente en la entidad.

**9. SCSS – Width de selects en tabs**
- Clases `.nota-form-inline`, `.prestamo-form-inline`, `.referencia-form-inline`, `.pariente-form-inline` con `input.p-inputtext, .p-select, .p-inputnumber, .p-datepicker { width: 100% }` para forzar ancho completo dentro del card.

---
 
### 📅 Lunes, 25 de Agosto de 2026
 
**1. CxC Cartas de Recordatorio – Fix compilación y datos**
- **Componente:** `cartas-recordatorio` (`features/cxc/cartas-recordatorio/*`)
- **Problema:** El build fallaba por dos causas:
  1. Falta `TooltipModule` en imports (el HTML usaba `pTooltip` sin importarlo).
  2. Interfaz `ClienteSaldo` y mapa `mapaClientes` sin campo `corriente` (solo tenía `total`, `vencido30`, `vencido60`, `vencido90`).
- **Solución:**
  - Agregado `TooltipModule` de `primeng/tooltip` a los imports del componente standalone.
  - Agregado `corriente: number` a la interfaz `ClienteSaldo`.
  - Inicializado `corriente: 0` en `procesarDatos()` al crear entradas del mapa.
- **Resultado:** Build de producción compila sin errores (`npm run build` OK). Filtrado de clientes funcionando (p.ej. búsqueda "juan").
 
**2. Verificación Antigüedad de Saldos**
- Revisado `antiguedad-saldos.ts`: ya incluía `corriente` en la interfaz `AntiguedadItem` y en la lógica. Sin cambios necesarios.
 
---
 
## Archivos modificados (23 Agosto)

| Archivo | Cambio |
|---------|--------|
| `src/app/features/cxc/clientes/clientes-manager.html` | Tabla EC sin Descripción, redistribución columnas, selects con opciones TS |
| `src/app/features/cxc/clientes/clientes-manager.ts` | Arrays `readonly` de opciones, signals de paginación |
| `src/app/features/cxc/clientes/clientes-manager.scss` | Form-inline-wrapper, anchos de tabla EC, selects full-width |
| `src/app/features/cxc/clientes/cliente-form.html` | Reescrito con p-grid/p-col/p-field, sin [fluid], botones unificados |
| `src/app/features/cxc/clientes/cliente-form.scss` | `.campo` → `:host { display: block }` |
| `src/app/features/facturacion/maestro-detalle/maestro-detalle-form.scss` | Agregadas clases `form-grid`, `campo`, `acciones-form` |
| `Backend/src/modules/cxc/cxc.controller.ts` | `findAllClientes` page/limit como string optional |
| `Backend/src/modules/cxc/cxc.service.ts` | Eliminado join a `documentoFiscal` |
| `Backend/src/modules/cxc/entities/cxcmovimiento.entity.ts` | `@JoinColumn` simple en vez de composite |
 
## Archivos modificados (25 Agosto)
 
| Archivo | Cambio |
|---------|--------|
| `src/app/features/cxc/cartas-recordatorio/cartas-recordatorio.ts` | Agregado `TooltipModule` a imports, campo `corriente` en interfaz e inicialización |
