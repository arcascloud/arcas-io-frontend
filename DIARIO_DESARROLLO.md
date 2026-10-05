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

---

## 📅 Miércoles, 17 de Septiembre de 2026

### Integración Contable Automática (Facturación → Contabilidad → CxC)

**Objetivo**: Las facturas se contabilizan automáticamente al facturar (asientos en `copdamae`/`copdadet`), usando plantillas PDA, flags de `ttipoparametros` y correlativo CAI.

### Backend — Contabilidad Lógica (`contabilidad-logica.service.ts`)

1. **`identificarConcepto()` reordenado**: COBRO → DESCUENTO → ISV → COSTO → VENTA → MERCANCIA. El orden importa porque "COSTO DE VENTA" contiene "VENTA" — si VENTA iba primero, clasificaba mal la cuenta de costo.

2. **Cuentas contables corregidas**:
   | Concepto | Cuenta Debe | Cuenta Haber |
   |----------|-------------|--------------|
   | VENTA | 4110-001 (Ventas al contado) | 1110-001 (Caja General) |
   | VENTA CRÉDITO | 4110-002 (Ventas al crédito) | 1120-001 (Clientes Nacionales) |
   | MERCANCIA | 5120-004 (Costo de venta) | 1130-001 (Mercadería) |
   | ISV | 2120-001 (ISV por Pagar) | 4110-001 (Ventas al contado) |
   | DESCUENTO | 4210-001 (Descuento sobre ventas) | 4110-001 (Ventas) |
   | COBRO CxC | 1110-001 (Caja) | 1120-001 (Clientes Nacionales) |

3. **`contabilizarPartida()`**: Pasa `currentUser` a `actualizarMovimientosContables()` y `actualizarSaldosCuentas()`.

4. **`contabilizarFactura()`**: `ventaNeta` se calcula desde componentes (ventaBruta, descuento, impuesto, costoVenta), NO desde `factura.total`.

### Backend — Facturación (`facturacion.service.ts`)

5. **`createFactura()`**: Retorna `{ ...factura, rangoDesde, rangoHasta, disponible, alerta }` con info CAI.

6. **`asignarCorrelativo()`**: Retorna objeto con disponibilidad. Bloquea si `siguiente > hasta`. Alerta si `disponible <= 30`.

7. **`procesarKardexFactura()`**: Después de contabilizar, vincula movimientos CxC con la partida:
   ```
   contabilizarFactura → crea copdamae/copdadet → guarda partidaId en posfacmae
   → actualizarPartidaMovimientos → vincula CxC movimiento con la partida
   ```

8. **`generarMovimientoDesdeFactura()`**: Ya NO llama `contabilizarCxC()`. Solo crea el movimiento CxC. La contabilización se hace después desde `procesarKardexFactura`.

### Backend — CxC (`cxc.service.ts`)

9. **Nuevo método `actualizarPartidaMovimientos()`**: Busca movimientos por `nroreferencia` + `moduloId=3` y les asigna `partidaId` + `sn_cotabilizada='S'`.

### Backend — Entidades

10. **`copdamae.entity.ts`**: PK es `partidaId` (NO `tcopdamae` — tabla se llama `copdamae`).
11. **`copdadet.entity.ts`**: FK es `partidaId` (misma corrección).
12. **`posfacdet.entity.ts`**: Campo `p_descuento` agregado (decimal 20,2) para auditar % de descuento.
13. **`poscorrelativos.entity.ts`**: Campo `cai` eliminado (CAI vive en `tempresasdet` con `tipo='CAI'`).

### Frontend — Facturación (`nueva-factura.ts/html`)

14. **Ticket térmico**: Usa `d.p_descuento` para mostrar % de descuento, incluye RANGO AUTORIZADO y CODIGO CAI desde `tempresasdet`.

15. **Payload de detalle**: Envía `p_descuento` (%) y `descuento` (monto = cantidad × precio × pct / 100).

16. **Toasts**: Muestran `nrofactura` (no `facturaId`) para que el usuario entienda el número de factura.

17. **CAI alert**: Toast de warning cuando `fac.alerta` indica disponibilidad baja.

### Prueba de fuego

- **Factura 52** (nrofactura=120008): `partidaId=13`, `sn_contabilizada=S` ✓
- **CxC movimiento** (ref 120008): `partidaId=13`, `sn_cotabilizada=S` ✓
- **Ambos vinculados a la misma partida** ✓
- **Partida balanceada**: Debe = Haber ✓

### Lecciones aprendidas

| Lección | Detalle |
|---------|---------|
| **DB table names** | `copdamae`/`copdadet` (NO `tcopdamae`/`tcopdadet`) |
| **PK/FK** | `partidaId` (no `nropartida`) |
| **CAI location** | `tempresasdet` con `tipo='CAI'`, NO en `poscorrelativos` |
| **`identificarConcepto` order** | COSTO antes de VENTA (porque "COSTO DE VENTA" contiene "VENTA") |
| **`modo_correlativo`** | Se lee de `ttipoparametros` (moduloId=3), NO de `timpresoras` |
| **`posfacdet.descuento`** | Almacena MONTO calculado, NO porcentaje. `p_descuento` almacena el % |
| **TypeORM decimals** | Se leen como strings. Usar `createQueryBuilder().update().set()` para bypass |
| **CxC `partidaId`** | Se asigna DESPUÉS de `contabilizarFactura`, no antes |
| **FK constraints** | `clienteId: 0` en posfacmae falla silenciosamente si el cliente no existe |

### Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `Backend/src/modules/contabilidad/contabilidad-logica.service.ts` | `identificarConcepto` reordenado, cuentas corregidas, `currentUser` en updates |
| `Backend/src/modules/facturacion/facturacion.service.ts` | CxC linking post-contabilización, CAI en respuesta |
| `Backend/src/modules/cxc/cxc.service.ts` | Nuevo `actualizarPartidaMovimientos()`, sin `contabilizarCxC` en factura |
| `Backend/src/modules/facturacion/entities/posfacdet.entity.ts` | Campo `p_descuento` agregado |
| `Backend/src/modules/facturacion/entities/poscorrelativos.entity.ts` | Campo `cai` eliminado |
| `Backend/src/modules/contabilidad/entities/copdamae.entity.ts` | PK `partidaId` |
| `Backend/src/modules/contabilidad/entities/copdadet.entity.ts` | FK `partidaId` |
| `Frontend/src/app/features/facturacion/nueva-factura/nueva-factura.ts` | Ticket con `p_descuento`, payload con `%` + monto, `nrofactura` en toasts |
| `Frontend/src/app/features/facturacion/nueva-factura/nueva-factura.html` | CAI en ticket, alert toast |

---

### 05 de Octubre de 2026 — Reportes de Contabilidad: letterhead compartido (PDF + Excel + Word)

**Alcance aprobado**: exportación con letterhead (PDF + Excel + Word) para los 4 reportes con botones: Balance Dinámico, Balance Financiero, Libro Mayor y Libro Diario. **Decisión final del día: el letterhead es SOLO de los archivos exportados; en pantalla NO se muestra** ("quitame esto de la UI"). (`reportes-contables` / Balance de Comprobación NO tiene botones de exportación → queda pendiente.)

#### Servicio compartido `core/services/reportes-print.service.ts`

- `encabezado(titulo, meta)` → `EncabezadoPrint { titulo, empresa, fiscal, meta, usuario, fecha, logo }` con cache por empresa (nombre + `tempresasdet` + logo).
- **PDF**: `pdfEncabezado` (logo + título + empresa + fiscal + meta + filete), `pdfTabla` (minimalista: filete bajo cabecera, filete + negrita en totales), `pdfPaginar` (encabezado repetido pág. 2+ y pie `usuario | Página X de Y | fecha`).
- **Excel (exceljs)**: `nuevoLibro`, `excelEncabezado` (logo embebido + celdas mergeadas), `excelTabla` (cabecera con filete, `numFmt #,##0.00`, totales con filete, cabecera congelada, `fitToWidth`), `descargarExcel`.
- **Word (docx v9)**: `wordEncabezado` (logo `ImageRun` + título), `wordPie` (tabla usuario | paginación | fecha), `wordTabla`, `wordDocumento` (header/footer repetidos por página).
- **Tipos**: `ColumnaPrint { titulo, alinear, pdf (mm), word (twips), excel (chars) }`, `TablaPrint { columnas, filas, filasTotales?, filaTotales? }` — los números se formatean solos en PDF/Word.

#### Correcciones aplicadas al service

| Fix | Detalle |
|-----|---------|
| docx v9 `ImageRun.type` | `jpeg` → `'jpg'` (el tipo de `docx` no acepta `"jpeg"`) |
| docx v9 `ITableBordersOptions` | `between` no existe → `insideHorizontal` + `insideVertical` |
| `wordPie` retorno | `(Paragraph \| Table)[]` (el footer acepta tablas) |
| `pdfAnchos`/`wordAnchos` | El ancho fijo de la 1ª columna (cuenta) no se descontaba del reparto → columnas desbordaban/cortaban ancho; ahora: 1ª col fija → descripción 30%/35% → resto en partes iguales |
| `wordTabla` ancho | 14112/10512 → **13840/10240** (página − márgenes 1000 twips c/u); antes la tabla desbordaba el margen |

#### Integración por componente

- **Balance Dinámico**: exports con `construirPDF()` + `tablaPrint()`; se eliminó toda la maquinaria propia (`autoTable`/`XLSX`/docx manual, `columnStylesPDF`, `encabezadoPaginaPDF`, `celulaWord`, etc.).
- **Balance Financiero**: mismos exports + **3 filas de totales** (`ACTIVOS`/`PASIVOS`/`CAPITAL`) en `filasTotales`; meta incluye `Nivel` cuando `nivelMaximo !== 99`.
- **Libro Mayor**: **2 variantes de tabla** — `tablaPdfWord()` (7 col., importe y D/C combinados `"123,456.00 (D)"`, `-` en ceros) y `tablaExcel()` (9 col., números puros + D/C en columna aparte, conservando el comportamiento numérico con el que siempre se exportó). `filaTotales` en ambas.
- **Libro Diario**: PDF/Word con **una tabla por partida** (título `Partida #N | fecha | descripción` + tabla + totales de la partida; PDF salta de página antes de orfar el título), Excel plano con columna Partida/Fecha y `filasTotales` por partida.
- **Pantalla**: el letterhead **se eliminó** de los 4 templates (bloque `.report-letterhead` quitado de sus HTML y purgado de sus TS: `letterhead`/`logoUrl`/`cargarLetterhead()`); la pantalla queda limpia y los exportados conservan logo a la derecha + nombre del libro en letra pequeña debajo.
- `EmpresasService` ya no se inyecta en Libro Mayor/Libro Diario (la empresa la resuelve el service).

#### Estilos globales

- La sección `.report-letterhead` que se había agregado a `src/styles.scss` fue **eliminada** (CSS muerto al quitar el letterhead de la pantalla).

#### Encabezado de exportados rediseñado (PDF + Excel + Word) — sin logo, fuente Audiowide

Decisión suya: **NO logo, NO "Dir: …", NO "Tel: …"**. El encabezado queda en 4 elementos + filete, todos en **Audiowide**:

| # | Elemento | Alineación | Tamaño (px → pt/word half-points) |
|---|----------|------------|-----------------------------------|
| 1 | Nombre de la empresa (AUTOSEL) | **Izquierda** | 1.75rem / 28px → 21pt → Word 42 · Excel 21 |
| 2 | RTN (debajo de la empresa) | **Izquierda** | 0.75rem / 12px → 9pt → Word 18 · Excel 9 |
| 3 | Título del reporte | **Centrado** | 1.06rem ≈ 17px → 12.7pt → Word 26 · Excel 13 |
| 4 | Criterio de filtro (ej. `Del: 01/10/2026 al 04/10/2026`) | **Centrado** | 0.75rem / 12px → 9pt → Word 18 · Excel 9 |

- **Datos**: `EncabezadoPrint` → `fiscal` y `logo` reemplazados por **`rtn`** (solo `RTN: 0801…`; dirección y teléfono ya no se imprimen). Eliminado todo el pipeline de logo del servicio (`logoDataUrl`, `normalizarLogo`, `medirAspecto`, `proporciones`, `empresas.getLogo`).
- **Fuente Audiowide** (se probó Grotesk primero, luego cambió a Audiowide):
  - **PDF (jsPDF)**: TTF embebida vía `addFileToVFS` + `addFont`, descargada de `/assets/fonts/Audiowide/Audiowide-Regular.ttf` y cacheada en sesión (`prepararFuente()` se espera dentro de `encabezado()`, con flag `fuenteCargada`/`fuenteB64`); si falla → fallback `helvetica`. Re-registro por página (`pdfPaginar` → `registrarFuente()`) verificado sin errores.
  - **Excel/Word**: `font: 'Audiowide'` (nombre de familia) en los 4 elementos del encabezado.
- **Cobertura de glifos**: `Audiowide-Regular.ttf` (**47 KB, 366 glifos**, Google Fonts, OFL) ya existía en `public/assets/fonts/Audiowide/`; verificada con fontTools (acentos, `:`, `/`, `—` OK, TTF `glyf` embebible en jsPDF).
- **Grotesk queda fuera**: los `.woff2` de `public/assets/fonts/grotesk/` son un subconjunto de prueba de **67 glifos** (sin acentos, sin `:` ni `/`) → inutilizables; el `Grotesk-Regular.ttf` que se había generado (88 KB, Space Grotesk OFL) tampoco se usa ya — borrarlos cuando usted lo indique.
- **Libro Diario**: el criterio de fecha ahora dice `Del: 01/10/2026 al 04/10/2026` (antes `Rango: …`); los reportes por período conservan `Período: Octubre 2026`.
- **"Impreso por"**: Word y PDF lo llevan en el **pie de página** (ya existente); Excel no tiene pie → se conserva como fila pequeña gris bajo el criterio (dígamelo si la quiere fuera).
- **Verificación**: render del PDF a PNG (pypdfium2) → exactamente el diseño pedido en Audiowide · `word/header1.xml` → `w:rFonts w:ascii="Audiowide"` ×4 con sizes 42/18/26/18 y alineaciones left/left/center/center · `styles.xml` de xlsx → `<name val="Audiowide"/>` sizes 21/9/13 · `ng build` dev + prod → **exit=0**.
- **Aviso**: Audiowide **sí está instalada en esta PC** (HKCU, per-user) → Word y Excel la muestran bien aquí; en otras PCs que no la tengan Office sustituye. El PDF sí la lleva embebida y se ve siempre igual.

#### Tipografía global: Figtree (activada en styles.scss)

- `public/assets/fonts/Figtree/` (Google Fonts, OFL): VF `Figtree-VariableFont_wght.ttf` (ejes `wght` 300–900) + `Figtree-Italic-VariableFont_wght.ttf` + 14 estáticas en `static/`.
- **Dos `@font-face`** en `src/styles.scss` (romana + itálica, `font-weight: 300 900`, `font-display: swap`) → familia **Figtree**.
- **Activada como tipografía global**: `--font-family: 'Figtree', 'Mukta', sans-serif` (Mukta queda como fallback y sus `@font-face` originales siguen intactos).
- `ArcasPreset` de PrimeNG no define `fontFamily` y no existe `--p-content-font-family` → **toda la UI hereda Figtree del `body`** (texto y componentes PrimeNG), sin tocar tema ni componentes.
- Verificado en `dist` (dev y prod): ambos `@font-face` de Figtree + la variable `--font-family` presentes; `ng build` **exit=0**.
- Nota: `.saldo` en `balance-dinamico.scss` sigue en `font-family: 'Mukta', monospace` (tabular-nums) — pendiente de decisión si se pasa a Figtree.
- Los `@font-face` de Grotesk que había en `styles.scss` salieron en el restore desde git HEAD (código muerto, 0 usos).

#### Dependencias / builds

- `exceljs ^4.4.0` agregado (Excel con letterhead; `xlsx` solo queda en componentes no migrados).
- `npx ng build --configuration development` y `--configuration production` → **exit=0** (solo warnings CommonJS de `exceljs`/`html2canvas`/`tesseract.js`, ya existentes).

**Pendiente**: `reportes-contables` (Balance de Comprobación / Libro Diario / Libro Mayor en una pantalla) no tiene exportación → evaluar sumarla cuando usted lo indique; verificación visual en browser de los 4 reportes (pantalla, PDF, Excel, Word).
