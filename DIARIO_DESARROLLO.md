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

#### Encabezado de exportados rediseñado (PDF + Excel + Word) — sin logo, fuentes Audiowide + Mukta

Decisión suya: **NO logo, NO "Dir: …", NO "Tel: …"**. El encabezado queda en 4 elementos + filete. **Empresa en Audiowide; título, RTN y criterio en Mukta** (cambio suyo del 05/10/2026):

| # | Elemento | Alineación | Fuente | Tamaño (px → pt/word half-points) |
|---|----------|------------|--------|-----------------------------------|
| 1 | Nombre de la empresa (AUTOSEL) | **Izquierda** | **Audiowide** | 1.75rem / 28px → 21pt → Word 42 · Excel 21 |
| 2 | RTN (debajo de la empresa) | **Izquierda** | **Mukta** | 0.75rem / 12px → 9pt → Word 18 · Excel 9 |
| 3 | Título del reporte | **Centrado** | **Mukta** | 1.06rem ≈ 17px → 12.7pt → Word 26 · Excel 13 |
| 4 | Criterio de filtro (ej. `Del: 01/10/2026 al 04/10/2026`) | **Centrado** | **Mukta** | 0.75rem / 12px → 9pt → Word 18 · Excel 9 |

- **Datos**: `EncabezadoPrint` → `fiscal` y `logo` reemplazados por **`rtn`** (solo `RTN: 0801…`; dirección y teléfono ya no se imprimen). Eliminado todo el pipeline de logo del servicio (`logoDataUrl`, `normalizarLogo`, `medirAspecto`, `proporciones`, `empresas.getLogo`).
- **Dos fuentes en el encabezado**:
  - **PDF (jsPDF)**: `prepararFuente()` descarga y cachea **las 2 TTFs** (`Audiowide-Regular.ttf` + `Mukta-Regular.ttf`) vía helper `cargarTtf()`; `registrarFuente(doc)` devuelve `{ audiowide, mukta }` y `pdfEncabezado` usa `fontEmpresa = audiowide ? 'Audiowide' : 'helvetica'` y `fontTexto = mukta ? 'Mukta' : 'helvetica'` (fallback independiente por fuente). Re-registro por página (`pdfPaginar`) verificado sin errores.
  - **Excel**: `filaCompartida()` acepta `fontIzq`/`fontDer` → fila 1 `Audiowide` (empresa) + `Mukta` (título); fila 2 `Mukta`/`Mukta` (RTN y criterio). `Impreso por` sigue en Calibri.
  - **Word**: `celda()` acepta parámetro `fuente` → empresa `Audiowide` (42hp), título `Mukta` (26hp), RTN/criterio `Mukta` (18hp).
- **Cobertura de glifos**: `Mukta-Regular.ttf` (418 KB, TTF con `glyf`, OFL, ya en `public/assets/fonts/Mukta/`) verificada con fontTools: `—` (U+2014), acentos, `:`, `/` ✓. `Audiowide-Regular.ttf` (47 KB, 366 glifos) también verificada.
- **Grotesk queda fuera**: los `.woff2` de `public/assets/fonts/grotesk/` son un subconjunto de prueba de **67 glifos** (sin acentos, sin `:` ni `/`) → inutilizables; el `Grotesk-Regular.ttf` que se había generado (88 KB, Space Grotesk OFL) tampoco se usa ya — borrarlos cuando usted lo indique.
- **Libro Diario**: el criterio de fecha ahora dice `Del: 01/10/2026 al 04/10/2026` (antes `Rango: …`); los reportes por período conservan `Período: Octubre 2026`.
- **"Impreso por"**: Word y PDF lo llevan en el **pie de página** (ya existente); Excel no tiene pie → se conserva como fila pequeña gris bajo el criterio (dígamelo si la quiere fuera).
- **Verificación (05/10/2026, mixta Audiowide+Mukta)**:
  - **PDF**: content stream de la página 1 → `BT /F15 16 Tf … AUTOSEL` con `/F15 = Audiowide` y `/F16 12.7 Tf … LIBRO DIARIO` + `/F16 9 Tf` para RTN y criterio con `/F16 = Mukta` (Type0 embebidas ambas) · pdfium extrae el texto de las 6 páginas en orden correcto (p1 = encabezado, p6 = "Página 6 de 6");
  - **Word**: `word/header1.xml` runs → `AUTOSEL` Audiowide 42 · `LIBRO DIARIO` Mukta 26 · `RTN:` Mukta 18 · `Del:…` Mukta 18;
  - **Excel** (openpyxl): A1 Audiowide 21 · B1 Mukta 13 · A2/B2 Mukta 9 · A3 Impreso por Calibri 9;
  - `ng build` dev + prod → **exit=0**.
  - *Nota*: los renders PNG se verificaron por extracción de texto/hash (el visor de imágenes del agente adjuntó renders desfasados en varias lecturas — glitch de visualización, los archivos en disco sí corresponden).
- **Aviso**: Audiowide y Mukta **sí están instaladas en esta PC** (HKCU, per-user) → Word y Excel las muestran bien aquí; en otras PCs que no las tengan Office sustituye. El PDF sí las lleva embebidas y se ve siempre igual.

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

#### Nuevo layout de exportados: ceros en blanco, encabezado 2 filas, filetes discontinuos (05/10/2026)

- **Regla de ceros (solo importes)**: `esCero()` en `reportes-print.service.ts` (`|num| < 0.005`; textos `'0'`/`'0.00'`) → los importes en 0 quedan **en blanco** en PDF/Word (`filaATexto`) y Excel (`escribirFilaExcel` → `null`). Textos no numéricos (`1-1-10`, `N3`, `03/10/2026`) jamás se suprimen. Libro Mayor: `'-'` → `''` y `dc()` retorna `''` cuando el importe ≈ 0.
- **Encabezado en 2 filas** (PDF/Excel/Word): fila 1 = empresa (izquierda) + **título** (centrado, misma línea); fila 2 = RTN (izquierda) + **criterio** (centrado, misma línea); filete debajo. Tamaños: PDF 16/12.7/9/9 pt · Excel 21/13/9/9 · Word 42/26/18/18 half-points. Excel logra el centrado con merge de columnas 2..N (`B1:F1`, `B2:F2`, `A3:F3`); Word con tabla de 3 columnas sin bordes y `VerticalAlign.CENTER`.
- **Filetes discontinuos**: helper `pdfLineaDiscontinua` (`setLineDashPattern([1.1,1.1],0)`, lw 0.3) vía `didDrawCell` (bajo la cabecera y encima de TOTALES); Excel bordes `dashed` (`style="dashed"` en styles.xml); Word `BorderStyle.DASHED`. Nuevo `TablaPrint.alineacionesTotales` (override de alineación solo en filas de totales → "TOTALES" queda pegado a los importes).
- **Bloque de partida** (Libro Diario): `Partida No.: ` + `nropartida.padStart(10,'0')` · `Fecha......: ` (colon en índice 11, fecha con ceros) · `Concepto...: ` (colon en índice 11, `splitTextToSize` para no desbordar); se reserva el alto del bloque y `y += 2` en blanco antes de la tabla; en Word los mismos 3 párrafos por partida.
- **Fecha del criterio sin ceros a la izquierda**: `fechaSinCero()` → `Del: 1/10/2026 al 4/10/2026` (solo Libro Diario); `Partida Fecha` conserva `formatFechaCorta` (padded). Balances/Libro Mayor siguen con `Período: ...`.
- **Fix de anchos de tabla**: `pdfAnchos`/`wordAnchos` descartaban el ancho sobrante cuando Descripción era la única columna libre (tabla salía con 126 de 190 mm → la descripción se partía y autoTable avisaba `64 units could not fit page` ×30) → top-up: el sobrante se da a la columna de descripción (o a la última) para que **la tabla ocupe siempre todo el ancho útil**. Aviso desaparecido; Libro Diario pasó de 8 a 6 páginas (sin saltos de línea en descripción).
- **Fix crítico `wordPie`**: usaba `GRIS_CLARO = 'FF94A3B8'` (8 dígitos con alfa) → `docx` lanza `Invalid hex value 'FF94A3B8'. Expected 6 digit hex value` al construir celdas → **la exportación Word crasheaba**; cambiado a `'94A3B8'`.
- **Verificación end-to-end con el código real** (harness esbuild en Temp: `build-harness.js` + shims de Angular/rxjs/Empresas/Auth → `harness.cjs`; datos mock suyos: AUTOSEL, RTN 08011974088068, 30 partidas):
  - **PDF** 6 páginas renderizadas (p.1/p.2/p.6): encabezado repetido en todas, tablas a ancho completo, ceros en blanco, TOTALES alineados, filetes discontinuos ✓;
  - **XLSX** (openpyxl): merges `B1:F1`/`B2:F2`/`A3:F3`, 60 celdas con borde dashed (cabecera + totales), **0** ceros literales, fuentes Audiowide ✓;
  - **DOCX** (zip + XML): Audiowide ×4, sizes 42/26/18, grid 3400/3440/3400, dashed ×240, TOTALES ×30, 60 celdas de importe vacías, **0** ceros literales, UTF-8 correcto (falsa alarma: "según" va con `ú`).
- **Builds**: `ng build` dev y prod → **exit=0**.

**✅ Aprobado (05/10/2026)**: usted revisó los reportes exportados en **PDF, Word y Excel** (encabezado mixto Audiowide+Mukta, layout 2 filas, filetes discontinuos, ceros en blanco) → *"estamos bien con estos reportes"*. Incluye la fila "Impreso por" de Excel.

**Pendiente**: `reportes-contables` (Balance de Comprobación / Libro Diario / Libro Mayor en una pantalla) no tiene exportación → evaluar sumarla cuando usted lo indique; borrar `public/assets/fonts/grotesk/`; decisión de `.saldo` en Mukta vs Figtree.

---

## Bitácora – 06/10/2026

### Cierre de las 41/41 tablas de `fecharegistro` (Módulo 8: trasaviblidad)

- **Módulo 8 `trasaviblidad`** (`Backend/src/modules/contabilidad/trasaviblidad.service.ts`) — la última tabla de la lista:
  - Import + inyección de `FechaSistemaService` (era el único service de los 8 módulos sin acceso a la fecha del sistema).
  - **`create()`**: + `fecharegistro: obtenerFechaRegistro(usuario, dto.empresaId)` (antes caía al `CURRENT_TIMESTAMP` de MySQL).
  - **`asignarPartida()`**: + lo mismo en el alta de fila nueva. Idempotencia intacta: si la fila existe la devuelve sin tocar el campo.
  - DTO sin `fecharegistro` → nada que quitar.
- **Verificación global final**: **41 llamadas** exactas a `obtenerFechaRegistro()` en el backend · **7 services con check `TABLAS_FECHAREGISTRO.has()`** (cxc, bancos, contabilidad, cxp, facturacion, inventario, planilla) · estampado directo en puntos fuera de helpers (4 flujos inventario, kardex, contabilidad-logica, generadores CxC, cheques/conciliación/movCxP, clientes TIENDA, trasaviblidad) · grep residual: los únicos services que insertan con `usuarioCreated` sin fecha son `companies`, `modulos`, `fec`, `parametros`, `sucursales`, `users` → tablas fuera de la lista de 41 ✓ · **cero** `fecharegistro: new Date()/now/fecha` · `nest build` → **exit=0**.
- **Estado**: 41/41 aplicadas. Verificadas por usted: núcleo, CxC, Bancos. Aplicadas pendientes de verificación: Contabilidad, CxP, Inventario, Planilla, POS/Facturación, trasaviblidad.

### Auditoría `posfacmae`: `rtn_cliente` y `direccion` → `direccion_entrega`

Petición suya: *"agregar rtn_cliente y revisar si ya cambiamos direccion por direccion_entrega"*. Estado por capas:

| Capa | `direccion_entrega` | `rtn_cliente` | Notas |
|------|:-------------------:|:-------------:|-------|
| Entity `posfacmae.entity.ts` | ✅ L36 | ✅ L40 | No existe ningún `direccion` en el entity |
| BD (`information_schema`) | ✅ varchar(2000) | ✅ varchar(20) | 38 columnas; **`direccion` ya NO existe**; 2 filas de datos |
| DTO `CreatePosFacMaeDto` / `UpdatePosFacMaeDto` | ❌ tiene `direccion` (L27/L141) | ❌ ausente | **Con `whitelist:true` los campos nuevos se descartan silenciosamente** |
| Service `facturacion.service.ts` | ❌ ticket usa `mae.direccion` (L1382) y `f.direccion` (L1457) → imprime "N/A" | ❌ nadie lo escribe | L870/L936 (`dto.direccion`) son del **carrito/checkout** (`poscotmae`, tabla distinta que sí conserva `direccion`) |
| Frontend | ⚠️ `consulta-factura-detalle.html` lee `factura()?.direccion`; `nueva-factura.ts` y `facturacion.models.ts` envían clave `direccion` | ⚠️ solo **lee** `rtn_cliente` en `factura-impresion.service.ts:263`; nadie lo envía | `tienda-virtual`/`cotizaciones` usan `direccion` de `poscotmae` (correcto, no tocar) |

**Conclusión**: entity y BD ya están listos; el cambio **no está conectado** en DTO → service (ticket) → frontend (lectura de factura). **Pendiente de su confirmación para aplicar el fix** (DTO con los 2 campos nuevos, ticket con `direccion_entrega`, frontend: payload/lectura de facturas renombrado — sin tocar carrito/cotizaciones).

### Facturación (06/10/2026, tarde) — RTN cliente + bodega por sucursal + fixes 400

**1. RTN del cliente en factura nueva** (pedido suyo):
- **HTML**: campo `RTN del cliente` (input, maxlength 20) justo **antes del p-select de Descuento**.
- **TS**: control `rtn_cliente` en el form; **contado** → siempre limpio (`onTipoFacturaChange` + reset de `nueva()`); **crédito** → automático desde `cxcclientes.rtn` al elegir cliente (`onClienteChange`); payload `mae.rtn_cliente`.
- **Backend**: `rtn_cliente?: string` agregado a `CreatePosFacMaeDto` y `UpdatePosFacMaeDto` (sin esto el `whitelist:true` lo descartaba). Ticket/impresión ya leían `f.rtn_cliente` → ahora sí lo recibe.

**2. Tipo Constancia SAR**: revisado — candado por diseño (solo con "Exenta de ISV"=Sí) y opciones hardcodeadas `OCE/SAG/CEA/FNE`; resultó ser problema suyo → **sin cambios**.

**3. Error 400 `bodegaId/cajaId should not be empty` → regla de negocio nueva: bodega desde `tsucursal`**:
- **Causa raíz**: el form cargaba bodega/caja de `param-fac` (módulo 3), pero en BD `bodegaId=1` vive en **módulo 1** y `cajaId=1` en **módulo 4** (módulo 3 solo tiene `lineasFactura`/`sn_impuestoincluido`) → `null` → `@IsNotEmpty()` rechazaba **en el ValidationPipe, antes de que corriera cualquier fallback del service**.
- **Regla suya**: la bodega por defecto de facturación/inventarios/kardex se saca de **`tsucursal.bodegaId`**, vinculando **`tusuario` (`usuario` + `empresaId`) → `Idsucursal` → `tsucursal` (`Idsucursal` + `empresaId`)**.
- **Entity `Tsucursal`**: la columna `bodegaId` existía en BD (int NOT NULL) pero **no estaba en la entity** → agregada (+ `bodegaId` opcional en DTOs Create/Update).
- **`facturacion.service.ts`**: nuevo helper **`getBodegaPorUsuario(usuario, empresaId)`**; aplicado en 3 puntos con prioridad `dto.bodegaId` → sucursal → parámetro con fallback: **`createFactura`**, **`checkoutTienda`** y **`checkoutPedido`** (estos dos antes usaban param módulo 3 → siempre fallback 1).
- **DTO**: `bodegaId` y `cajaId` cambiados de `@IsNotEmpty()` a **`@IsOptional()`** — el ValidationPipe rechazaba antes de que el service resolviera (1er intento de fix insuficiente: el fallback nunca corría).
- **Frontend**: detalle usa **`fac.bodegaId`** (respuesta del mae) en vez de `raw.bodegaId`; quitado el get de bodega desde módulo 1; caja sigue viniendo del módulo 4.
- **Verificación end-to-end real** (datos de pruebas, con su payload `bodegaId: null`): **factura #120011 creada con `bodegaId: 1` resuelto** de tsucursal, `cajaId: 1`, `rtn_cliente` guardado. Prueba de validación mínima: los únicos campos rechazados son `clienteId`/`nrocliente` (ya no `bodegaId`/`cajaId`).
- Builds: `nest build` y `ng build production` → **exit=0**.

**Aprobado (06/10/2026)**: *"estamos bien"*. Nota: en pruebas, no datos de producción (factura 120011 queda como prueba, anulable desde UI).


---


---

## Bitácora – 07/10/2026

### Completado

#### Correlativo automático de requisición (`invreqmae.nrorequisicion`)

- **Regla (suya)**: `nrorequisicion` es autoincremental por parámetro en **`ttipoparametros`** (`field='nrorequisicion'`), incrementando **`valor = valor + 1`**, localizado por **`Idsucursal` + `empresaId` del usuario logueado**.
- **Parámetro en BD**: `ttipoparametrosId=109`, `valor='0'` (luego `2`), `grupo='CORRELATIVO'`, `moduloId=11`, `Idsucursal=1`, `empresaId=2`, `sn_activo='S'` (ya existía, sin INSERT).
- **Backend** (`requisicion-inventario.service.ts`):
  - Nuevo helper privado **`siguienteNroRequisicion(usuario, empresaId)`**: resuelve `Idsucursal` desde **`tusuarios`** (`usuario` + `empresaId`) y ejecuta un **UPDATE atómico** `valor = LAST_INSERT_ID(CAST(valor AS UNSIGNED) + 1)` en **queryRunner dedicado** (UPDATE y `SELECT LAST_INSERT_ID()` en la misma conexión → sin race condition entre incrementos).
  - Si no existe el parámetro para esa empresa/sucursal → **400** con mensaje claro (nunca lo crea: `ttipoparametros` requiere autorización para INSERT).
  - **`createMae`**: `nrorequisicion` se asigna SIEMPRE desde el backend (ignora `dto.nrorequisicion`).
- **Módulo** (`inventario.module.ts`): `TipoParametro` y `Tusuarios` agregados a `TypeOrmModule.forFeature` (no estaban).
- **E2E verificado**: POST#1 → `nrorequisicion=1`, POST#2 → `nrorequisicion=2`, parámetro `0 → 1 → 2` (payload mandaba `nrorequisicion: 999` → ignorado). `nest build` → exit=0.
- **Nota**: quedaron 2 requisiciones de prueba (concepto 'Prueba correlativo 1/2', `invreqmaeid` 2 y 3) y el parámetro en `valor=2` (próxima requisición real = 3).
- **Fecha del sistema**: actualizada por usted a 07/10/2026 → el guard `FECHA_SISTEMA` (409) ya no bloquea operaciones.

#### Correlativo automático de traslado (`invtrasmae.nroreferencia`)

- **Regla (suya)**: `nroreferencia` es autoincremental por parámetro en **`ttipoparametros`** (`field='nrotraslado'`), incrementando **`valor = valor + 1`**, localizado por **`Idsucursal` + `empresaId` del usuario logueado**.
- **Parámetro en BD**: `ttipoparametrosId=110`, `valor='0'` (luego `4`), `grupo='CORRELATIVO'`, `moduloId=11`, `Idsucursal=1`, `empresaId=2`, `sn_activo='S'` (ya existía, sin INSERT).
- **Backend** (`traslado-inventario.service.ts`):
  - Nuevo helper **`siguienteNroReferencia(usuario, empresaId): Promise<string>`**: misma mecánica que requisiciones — resuelve `Idsucursal` desde `tusuarios` y UPDATE atómico `valor = LAST_INSERT_ID(CAST(valor AS UNSIGNED) + 1)` en queryRunner dedicado; devuelve **string** (`nroreferencia` es `varchar(20) NOT NULL`).
  - **`createMae`**: `nroreferencia` se asigna SIEMPRE desde el backend (ignora `dto.nroreferencia`).
  - **Eliminado** `generarNroReferencia()` (fallback hardcodeado `yyyymmddsssss` con `new Date()` — uno de los 4 `new Date()` documentados en AGENTS.md) + `tipoParametroRepo`, `usuariosRepo` y `dataSource` inyectados en el constructor.
- **Sin cambios de módulo**: `TipoParametro` y `Tusuarios` ya estaban en `inventario.module.ts` (agregados para requisiciones, mismo módulo).
- **Gotcha del test**: `POST /inventario/traslados` es OTRO endpoint legado (`inventario.controller.ts` → `registrarTraslado`, inserta kardex directo y falló 500 con `NaN`); el endpoint real — el que usa el frontend (`traslados.ts`, `pathMae`) — es **`POST /inventario/traslados-mae`**.
- **E2E verificado en ambas instancias**: auxiliar :3100 con parámetro en 0 → `nroreferencia` '1' y '2' (payload mandaba `'NO-USAR'` → ignorado), parámetro 0→2; backend principal :3000 → '3' y '4', parámetro 2→4. `nest build` → exit=0.
- **Nota**: quedaron 4 traslados de prueba (`invtrasladomaeId` 2–5) y el parámetro en `valor=4` (próximo traslado real = 5).

#### Correlativo automático de ajuste (`invmovmae.nroajuste`)

- **Regla (suya)**: `nroajuste` es autoincremental por parámetro en **`ttipoparametros`** (`field='nroajuste'`), incrementando **`valor = valor + 1`**, localizado por **`Idsucursal` + `empresaId` del usuario logueado**.
- **Parámetro en BD**: `ttipoparametrosId=6`, `valor='1'` (luego `3`), `grupo='CORRELATIVO'`, `moduloId=1`, `Idsucursal=1`, `empresaId=2`, `sn_activo='S'` (ya existía, sin INSERT).
- **Backend** (`ajuste-inventario.service.ts`):
  - Nuevo helper **`siguienteNroAjuste(usuario, empresaId): Promise<number>`** — misma mecánica que requisiciones/traslados: `Idsucursal` desde `tusuarios` + UPDATE atómico `valor = LAST_INSERT_ID(CAST(valor AS UNSIGNED) + 1)` en queryRunner dedicado.
  - **`createMae`**: `nroajuste` se asigna SIEMPRE desde el backend (ignora `dto.nroajuste`).
  - `tipoParametroRepo`, `usuariosRepo` y `dataSource` inyectados en el constructor (módulo ya los tenía registrados).
- **Endpoint**: `POST /inventario/ajustes-inventario` → `createMae` (mismo patrón de controller que los otros dos).
- **E2E verificado**: parámetro inicia en `1` → POST#1 `nroajuste=2`, POST#2 `nroajuste=3` (payload mandaba `999` → ignorado), parámetro `1→3`. `nest build` → exit=0.
- **Nota**: quedaron 2 ajustes de prueba (`invmovmaeid` 1–2) y el parámetro en `valor=3` (próximo ajuste real = 4). Modo desarrollo: datos de prueba no se limpian.
- **Patrón consolidado (3/3)**: `nrorequisicion` (requisiciones), `nrotraslado` (traslados-mae), `nroajuste` (ajustes-inventario) — todos idénticos: ttipoparametros `field` + `valor+1` por `Idsucursal`/`empresaId` del logueado, atómico con `LAST_INSERT_ID`, sin INSERT de parámetros (los 3 ya existían).

#### Correlativo automático de partida (`copdamae.nropartida`)

- **Regla (suya)**: `nropartida` es autoincremental por parámetro en **`ttipoparametros`** (`field='nropartida'`), incrementando **`valor = valor + 1`**, localizado por **`Idsucursal` + `empresaId` del usuario logueado**.
- **Parámetro en BD**: `ttipoparametrosId=77`, `valor='28'` (luego `29`), `grupo='CORRELATIVO'`, `moduloId=7`, `Idsucursal=1`, `empresaId=2`, `sn_activo='S'` (ya existía, sin INSERT). `max(nropartida)` real en BD = 14 → sin colisión.
- **Backend — 3 caminos de creación unificados bajo el parámetro** (antes: manual mandaba nropartida del cliente + automáticos usaban `MAX+1` por (año,período) → podía haber colisiones):
  1. **`contabilidad.service.ts` → `createCopdamae`** (endpoint manual `POST /contabilidad/copdamae`): nuevo helper **`siguienteNropartida(usuario, empresaId)`**; ignora `dto.nropartida` (`{...dto, nropartida}`) + inyecciones nuevas `TipoParametro`, `Tusuarios`, `DataSource`.
  2. **`contabilidad-logica.service.ts`** — **`generarNroPartida()` ELIMINADA** (MAX+1) y reemplazada por el mismo helper en sus 2 usos: `contabilizarPartida` (L91 — lo usan crearPartidaInicial, contabilizarFactura/CxC/CxP/Banco) y `realizarCierre` (L760). + inyección `Tusuarios` (ya tenía `TipoParametro` y `DataSource`).
  3. Helper idéntico a los anteriores: `Idsucursal` desde `tusuarios` + UPDATE atómico `valor = LAST_INSERT_ID(CAST(valor AS UNSIGNED) + 1)` en queryRunner dedicado; si no existe el parámetro → 400.
- **DTO `CreateCopdamaeDto`**: `nropartida` cambiado de **requerido** a `@IsOptional()` (lo asigna el backend).
- **E2E verificado** (`POST /contabilidad/copdamae`, payload mandaba `nropartida: 999` → ignorado): **`nropartida=29`**, parámetro `28 → 29`. `nest build` → exit=0.
- **Gotcha**: tras mis ediciones el `nest start --watch` del usuario quedó sin hijo `node dist/main` (arranque caído durante recompilación) — verificado con instancia temporal capturando stderr (arrancaba limpio) y cerrada para devolver :3000 al watch.


---

## Bitácora – 07/10/2026

### Unificación de correlativos bajo `ttipoparametros` – `CorrelativosService` compartido

- **Regla suya (definitiva)**: TODOS los correlativos del ERP se administran desde **`ttipoparametros`** (grupo `CORRELATIVO`, `valor = valor + 1`, localizado por **`Idsucursal` + `empresaId`** del usuario logueado). Se **eliminó el fallback a `tcotipodocumentofiscal.nrocorrelativo`** en `asignarCorrelativo()` (facturación): sin CAI ahora se usa el contador `nrofactura` de `ttipoparametros`. Campo descartado por su decisión: **`nrofisico`** (no se lleva ese control).
- **Nuevo servicio compartido** `Backend/src/shared/correlativos.service.ts`:
  - `siguiente(field, empresaId, usuario, qr?)` — UPDATE atómico `LAST_INSERT_ID(CAST(valor AS UNSIGNED) + 1)` + `SELECT LAST_INSERT_ID()`; 400 si el parámetro no existe o está inactivo; acepta **QueryRunner opcional** para flujos transaccionales (rollback revierte el incremento).
  - `siguienteString(..., pad)` — mismo flujo con padding (`nrocliente`/`nroempleado`/`nroplanilla`/`nroproveedor`/`nroprestamo` = 6; `nrochq` = 10).
  - `asegurar(field, ...)` — INSERT del parámetro solo si falta (uso limitado a `nrochq`, comportamiento ya existente en bancos).
  - `CorrelativosModule` `@Global` registrado en `app.module.ts`.
- **Migración al servicio (creators que ahora delegan)**:
  - **CxC** (`cxc.service.ts`): `generarNroMovimiento` → campos **`nro_debito`** (tipomov='D') / **`nro_credito`** ('C') — *antes buscaba `nro_debito_cxc`/`nro_credito_cxc` que no existen y hacía `return 1` sin incrementar (bug)*; `createCliente` → `nrocliente`; `createPrestamo` → `nroprestamo` (DTO `nroprestamo` → `@IsOptional`).
  - **CxP** (`cxp.service.ts`): `createProveedor` → `nroproveedor` (*antes `moduloId:5`, el param real es `moduloId:1` — bug*); `crearMovimientoCxP` → `cxp_nromovimiento` (antes `Number(ref) || compraId`); `createCompra` → `nrocompra` (columna ya existía en la entity).
  - **Inventario** (`inventario.service.ts`): `createProveedor` → `nroproveedor` (es el endpoint que usa el FE; el de CxP la UI no lo invoca).
  - **Planilla**: `createEmpleado` / `createPlanilla` → `nroempleado` / `nroplanilla`.
  - **Bancos**: `emitirCheques` (lote) y `emitirChequeParticular` → `nrochq` con `asegurar` + `siguiente(..., queryRunner)` **dentro de la transacción** (pad 10; se eliminaron los UPDATE finales de contador).
  - **Facturación**: modo M de `asignarCorrelativo` → `nrofactura`; **sin CAI → fallback `ttipoparametros`** (antes `tcotipodocumentofiscal.nrocorrelativo`, eliminado por su indicación); `createFacturaAnul` → `nroanulacion` (columna ya existía en la entity).
- **Refactor de los 5 helpers duplicados → delegación** (sin cambio de comportamiento): `siguienteNroRequisicion`, `siguienteNroReferencia`, `siguienteNroAjuste` y `siguienteNropartida` (contabilidad-logica + contabilidad.service) ahora llaman al servicio compartido; se eliminó el cuerpo duplicado con queryRunner propio de cada uno.
- **Fixes E2E encontrados**:
  - `cxccliente.entity.ts` **no mapeaba `Idsucursal`** (columna NOT NULL sin default en BD) → el INSERT la omitía → `ER_NO_DEFAULT_FOR_FIELD (1364)`. Arreglado: mapeo en la entity + `Idsucursal` opcional en `CreateCxcClienteDto` (el `whitelist:true` lo descartaba) + fallback `0` en `createCliente` (consistente con los clientes existentes, que tienen `Idsucursal=0`).
  - DTO inventario `nroproveedor`: era requerido → ahora `@IsOptional()` (lo asigna el backend).
- **E2E (aux :3100)**: proveedor → `000006`, cliente → `000008`, empleado → `000005`, préstamo → `000001`, compra → `nrocompra=2`; todos cuadran con los contadores en BD. `nest build` → exit=0. *(Cada intento fallido consume el correlativo — modo desarrollo, sin rollback de contadores.)*
- **No probado E2E**: modo M de `nrofactura` (el parámetro `modo_correlativo` actual es `'A'` con CAI activo; cambiarlo requiere `UPDATE ttipoparametros` → requiere su autorización).
- **Estado de contadores (emp 2 / suc 1, verificado)**: nrocliente=8, nroproveedor=6, nroempleado=5, nroplanilla=2, nroprestamo=1, nrocompra=2, nrochq=11, nrofactura=49, nropartida=30, nrorequisicion=2, nrotraslado=4, nroajuste=3, nroanulacion=1, nro_debito=2.


### Modo manual de correlativo de factura → contador `nroticket` (su indicación)

- **Regla suya**: en modo manual (`modo_correlativo = 'M'`) el correlativo ahora sale del contador **`nroticket`** de `ttipoparametros` (id 112, grupo CORRELATIVO) y **NO de `nrofactura`** — así la facturación manual no contradice los correlativos fiscales secuestrados de la SAR.
- **Cambio** (`facturacion.service.ts` → `asignarCorrelativo()`, solo el modo M):
  - `this.correlativos.siguiente('nroticket', empresaId, currentUser)` en vez de `'nrofactura'` (doc comment y log actualizados con la justificación SAR).
  - El resultado sigue llenando `posfacmae.nrofactura` (no cambia esquema ni callers): la factura creada en modo M recibe el número que generó el contador de tickets.
  - **Sin cambios** en el modo automático (CAI) ni en el *fallback* sin CAI (sigue `nrofactura`, id 1, `valor=49`).
- **E2E con autorización suya** (UPDATE temporal `modo_correlativo` 'A'→'M' y **revertido en `finally`** a 'A'):
  - `POST /facturacion/facturas` (crédito, cliente CLI-0001, total L 1.00) → **201**, `facturaId=7`, **`nrofactura=1`**.
  - `nroticket`: **0 → 1** ✅ · `nrofactura` param: **49 intacto** ✅ · `modo_correlativo`: de vuelta en **'A'** ✅.
- **Nota**: quedó la factura de prueba `facturaId=7` (`nrofactura=1`, crédito, sin detalles, total L 1.00). Modo desarrollo: los datos de prueba no se limpian.
- `nest build` → exit=0; `nroticket` es `sn_activo='S'`, `moduloId=7`, `Idsucursal=1`, `empresaId=2` (el servicio solo filtra por field + empresaId + Idsucursal + sn_activo, no por moduloId).


---

## Bitácora – 07/10/2026

### Defaults de crédito desde ttipoparametros (alta de cliente y proveedor)

**Regla**: al dar de alta un **cliente** (CxC) o **proveedor** (CxP), los 4 campos de crédito se inicializan automáticamente desde `ttipoparametros` (grupo INTERES). Los valores explícitos del usuario siempre se respetan (`??` = solo si el DTO no los trae).

| Entidad | Módulo | Fields usados (valores hoy) |
|---------|--------|------------------------------|
| Cliente | 4 (CxC) | `cxc_limitecredito`=50000, `cxc_diasPlazo`=15, `cxc_interes`=24, `cxc_mora`=3 |
| Proveedor | 5 (CxP) | `cxp_limitecredito`=50000, `cxp_diasPlazo`=15, `cxp_interes`=24, `cxp_mora`=3 |
| Préstamos | 4 | `pres_*` existe en BD pero **ningún código lo lee aún** (pendiente) |

**Backend** (doble capa):
- `cxc/cxc.service.ts` → `createCliente`: field names corregidos a `cxc_*` (antes `interes/mora/diasPlazo/limitecredito` que ya no existían en la BD)
- `inventario/inventario.service.ts` → `createProveedor`: inyectado repo `TipoParametro` + helper privado `getParamMod(empresaId, moduloId, field, def)` + 4 defaults (moduloId 5)
- `cxp/cxp.service.ts` → `createProveedor`: 4 defaults vía `getValorParametro()` existente
- `cxp/dto/proveedor.dto.ts`: `diasplazo/interes/moratorio` ahora `@IsOptional()` en Create (antes requeridos → la API directa no podía omitirlos)
- Compila: `nest build` exit=0

**Frontend** (3 forms prellenan en ALTA, nunca en edición — `ParametroUnificadoService.getAsObject()`):
- `cxc/clientes/cliente-form.ts`: `cargarDefaultsCreditos()` (m4) en el effect de reset inline + rama ruta-nuevo
- `inventario/proveedores/proveedor-form.ts`: `cargarDefaultsCreditos()` (m5) en rama sin id
- `cxp/proveedores/proveedor-form.ts`: `cargarDefaultsCreditos()` (m5) en `aplicarId(null)` + rama ruta-nuevo
- Patrón: `takeUntilDestroyed(this.destroyRef)` + patch numérico `Number(...)`; OnPush-safe (writeValue toca el DOM directo)
- Compila: `ng build` exit=0

**E2E 33/33 PASS** (`test-defaults-credito.js`): endpoints `/parametros/parametros/objeto` y `/valor` (los que consume el FE), alta de cliente/proveedor sin campos → valores vigentes de BD (espera dinámica, no hardcode), alta con valores explícitos (1234/30/7.5/2) → respetados, cleanup de 4 filas sin residuos.

**Gotchas / hallazgos**:
1. **Bug preexistente (NO de este cambio)**: `cxcclientesUnique(dni, empresaId)` — el cliente TIENDA (id 15) ya ocupó `dni='0000000000000'` (el fallback del backend) → **crear cliente sin dni desde el FE ahora da 500 duplicado**. Igual en `proveedorUnique(dni, empresaId)`. Requiere decisión: fallback único por registro o permitir NULL.
2. `interes` CxC/CxP cambió de 18 → 24 en BD durante la sesión (edición del usuario) — el código lee el valor vigente.
3. Contadores avanzados por E2E: `nrocliente`→12, `nroproveedor`→10 (dev mode: permitido).
4. **Matar procesos con timeout del shell tool**: `Start-Process` lanza bien pero el tool mata el árbol al hacer timeout → usar `Invoke-CimMethod Win32_Process.Create` con `cmd /c "node dist\main.js > backend-out.log 2> backend-error.log"` para procesos independientes.
5. PS5.1 `Set-Content` sobre archivos UTF-8 los doble-encripta (mojibake) — scripts .js siempre con Write/Node, nunca re-guardar con PS.

**Archivos modificados**:
- `Backend/src/modules/cxc/cxc.service.ts`
- `Backend/src/modules/inventario/inventario.service.ts`
- `Backend/src/modules/cxp/cxp.service.ts`
- `Backend/src/modules/cxp/dto/proveedor.dto.ts`
- `Frontend/src/app/features/cxc/clientes/cliente-form.ts`
- `Frontend/src/app/features/inventario/proveedores/proveedor-form.ts`
- `Frontend/src/app/features/cxp/proveedores/proveedor-form.ts`

---

## Bit�cora � 07/10/2026 (tarde)

### Completado

#### Validaci�n de DNI duplicado � bloqueo antes de registrar (cliente y proveedor)
- **Regla**: el DNI es la **llave maestra** por empresa (UNIQUE (dni, empresaId) en `cxcclientes` y `proveedor`); no se permiten duplicados ? **alerta bloqueante ANTES de registrar**.
- **Backend � 3 rutas nuevas + guard en create/update (cxc, inventario, cxp)**:
  - `GET /cxc/clientes/dni-existe?empresaId&dni[&excluirId]` ? `{existe, id, numero, nombre}` (declarada ANTES de `clientes/:id`)
  - `GET /inventario/proveedores/dni-existe` y `GET /cxp/proveedores/dni-existe` (antes de `proveedores/:id`)
  - `createCliente` / `createProveedor` (�2): `ConflictException` **409** antes del INSERT y **antes de consumir correlativo** (nrocliente/nroproveedor NO avanzan en intento bloqueado); mensaje `DNI X ya esta registrado a nombre de Y (nro. Z)`
  - `updateCliente` / `updateProveedor` (�3): 409 si se cambia a dni ajeno (`Not(id)`)
  - Dni efectivo: cliente/cxp ? `dto.dni || '0000000000000'` (mismo fallback que inserta el payload); inventario ? solo si el dto trae dni (payload guarda NULL, que MySQL permite repetir)
  - `dni` vac�o en el check ? `{existe:false}` (evita match accidental)
- **Frontend � 3 formularios**:
  - `dniExiste()` agregado a `CxcService`, `ProveedoresService`, `CxpService`
  - En `guardar()`: verifica primero ? si `existe` abre **p-dialog modal bloqueante** (signals `dialogoDni`/`bloqueoDni`) con DNI + titular + nro + nota "llave maestra"; si el check no responde ? POST y el **409** del backend abre el mismo di�logo con `err.error.message`
  - Refactor `guardar ? verificar ? registrar`; `DialogModule` importado en cliente-form (cxc), proveedor-form (inventario) y proveedor-form (cxp)
  - SCSS: clase `.dni-bloqueo` (icono warning, mensaje, detalle en rojo, nota muted) en los 3 forms
- **E2E 35/35 PASS** (`test-dni-duplicado.js`): chk existente/inexistente/excluirId/vac�o; POST dup ? 409 cliente (inventario+cxp) y proveedores con mensaje correcto; **correlativo nrocliente NO consumido en 409**; POST sin dni ? 409 (fallback TIENDA ocupado); PUT dni propio ? 200 / ajeno ? 409; proveedor sin dni ? 201�2 (NULL permitido); limpieza completa sin residuos
- Builds: `nest build` OK + `ng build` exit 0; backend relanzado (:3000) sin errores en log; FE :4200 responde 200

### Hallazgos
- **No existe endpoint DELETE de proveedores** (ni en inventario ni en cxp) � preexistente; la limpieza de pruebas se hizo v�a BD (misma tabla `proveedor`)
- `max-w-30rem` se usa en HTML (cheques.html) pero **no est� definido en ning�n SCSS** ? no-op; los di�logos nuevos usan `[style]="{ width: '30rem' }"` + `[breakpoints]`
- El interceptor global ya muestra toast en 409 ("Conflicto de Datos") adem�s del di�logo modal ? doble notificaci�n aceptada (el di�logo es el bloqueo que pidi� el usuario)

### Gotchas
- Rutas con path literal (`clientes/dni-existe`) deben declararse ANTES de `clientes/:id`; si no, Nest las captura como `:id` (ParseIntPipe ? error)
- PowerShell no puede leer el body de errores HTTP (`GetResponseStream()` queda vac�o despu�s de Invoke-RestMethod/WebRequest) ? usar `fetch` de Node para inspeccionar cuerpos 4xx
- En modo desarrollo los correlativos avanzan con cada alta v�lida; los intentos bloqueados por DNI NO los consumen (guard va antes del `correlativos.siguienteString`)
