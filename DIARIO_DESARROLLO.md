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

---

## Bitácora – 07/10/2026 (tarde 2: gestores duplicados)

### Completado

#### Catálogo Gestores — bloqueo de duplicados con alerta por módulo
- **Regla**: un empleado solo puede ser gestor **una vez por empresa** — la BD ya tenía la clave única `gestoresUnique(empleadoId, empresaId)` (SIN módulo); el INSERT duplicado daba `ER_DUP_ENTRY` → **500**. El guard de app ahora se alinea con la BD: sin eso, cualquier registro repetido seguía cayendo al 500.
- **Backend** (`parametros.service.ts`):
  - `validarGestorDuplicado(empresaId, empleadoId, excluirId?, moduloIdSolicitado?)` — `findOne` por (empresaId, empleadoId) excluyendo el propio id en update; lanza `ConflictException(409)`; bloquea también registros **inactivos** (la clave única los sigue ocupando — reactivar editando desde la lista; la lista no filtra `sn_activo`)
  - `mensajeGestorDuplicado(moduloId, empleadoId)` — nombre = `nombres + apellidos` de `plplempleados` (repo ya inyectado) + género por `sexo === 'F'`:
    - módulo 3 (Facturación) → "… ya se encuentra **registrada como vendedora**" / "registrado como vendedor"
    - módulo 4 (CxC) → "… ya se encuentra **registrada como gestora de cobro**" / "registrado como gestor de cobro"
    - usa el módulo del **registro existente** (el rol que ya tiene); en cruce de módulos describe el rol existente, no el solicitado
  - Llamada al inicio de `createGestor` (antes de consumir nada) y en `updateGestor` (valores efectivos `dto.x ?? actual.x`, excluye id propio)
- **Frontend** (`catalogo-generico/catalogo-form.*`): 409 → **diálogo modal bloqueante** con el mensaje exacto del backend (signals `dialogoDuplicado`/`mensajeDuplicado`, `DialogModule`, p-dialog 30rem + footer "Entendido", SCSS `.dlg-duplicado`); se omite el toast genérico "No se pudo guardar" en 409 (el interceptor global añade su toast "Conflicto de Datos", patrón ya aceptado con DNI). El código es **genérico**: sirve a cualquier catálogo que devuelva 409.
- **Verificación**: E2E **23/23 PASS** (`test-gestores-duplicado.js`) — duplicado mismo par, cruzado de módulo, género F/M exacto, create único 201 → repetido 409 (no 500), PUT propio 200 / ajeno 409, inactivo 409, limpieza (baseline 3 filas intacta, 0 residuos); `nest build` + `ng build` OK; `backend-error.log` vacío
- **Nota**: no se alteró el índice único (ALTER requiere aprobación). Si la regla de negocio debiera ser "empleado+módulo" (un mismo empleado podría ser vendedor Y gestor de cobro), habría que cambiar la clave a `(empleadoId, empresaId, moduloId)` — pendiente de su decisión. Los mensajes usan "gestor **de** cobro" (forma gramatical; indicó "gestor cobro").

---

## Bitácora – 07/10/2026 (tarde 3: textos de catálogos genéricos)

### Completado

#### Encabezados "Nuevo …" / "Editar …" de los 66 catálogos genéricos
- **Bug original**: `catalogo-form.ts` calcula el singular con `config.tituloSingular ?? config.titulo.slice(0, -1)` (recorta 1 letra) — solo funciona con plurales regulares en "s". Ej: Gestores → **"Nuevo Gestore"**.
- **Fix 1 — `tituloSingular` explícito**: 40 configs agregados (43 total con los 3 preexistentes) en `catalogo-parametros.models.ts`; los 23 restantes usan el fallback y son plurales regulares correctos (Estados→Estado, Marcas→Marca, etc.). Ejemplos: Meses→**Mes**, Formas de Pago→**Forma de Pago**, Países→**País**, Direcciones→**Dirección**, Cuentas Bancarias→**Cuenta Bancaria**, Profesiones→**Profesión**, Deducciones→**Deducción**, Cuentas Contables→**Cuenta Contable**, Unidades de Medida→**Unidad de Medida**, Ubicaciones→**Ubicación**, **Colores→Color** ("Colores"−s = "Colore", hallazgo del script de verificación), Factor de Cambio→**Factor de Cambio** (ya era singular), ISR/Impuesto Vecinal/Naturaleza de Cuenta/Grupo Contable/Detalle de Cierre/Reporte de Liquidez/Asistencia (singulares que el fallback mutilaba), Reportes Diarios→**Reporte Diario**, Movimientos de Cuentas→**Movimiento de Cuentas**, Saldos anuales→**Saldo anual**, Deducciones por Empleado→**Deducción por Empleado**, Carteras Contables (×4)→**Cartera Contable…**, Información de Proveedores/Clientes→**Información de Proveedor/Cliente**, Tipos de Documento Fiscal→**Tipo de Documento Fiscal**, Niveles Contables→**Nivel Contable**, Tarjetas de Crédito→**Tarjeta de Crédito**, Días de Cobro→**Día de Cobro**, Zonas Venta/Cobro→**Zona Venta/Cobro**, Precios de Venta→**Precio de Venta**, Titulaciones/Certificaciones/Comisiones→con tilde.
- **Fix 2 — artículo Nuevo/Nueva**: el "Nuevo" estaba hardcodeado → "Nuevo Dirección", "Nuevo Cuenta Contable". Nuevo helper exportado **`articuloNuevo(singular)`** en `catalogo-parametros.models.ts`: primer sustantivo del singular → termina en -a/-ción/-sión/-dad/-tad/-tud → "Nueva"; excepción **"día"** → "Nuevo Día de Cobro". Usado en `catalogo-form.ts:105`.
- **Verificación**: script `verificar-singulares.js` replica la lógica real y simula los 66 encabezados → **66/66 gramaticalmente correctos**; `ng build` OK (solo warnings CommonJS preexistentes)
- **Alcance**: solo afecta a los 66 catálogos de `CATALOGOS_PARAMETROS` (ruta `parametros/:nombre`); no hay otro lugar que construya "Nuevo …" dinámico en `features/parametros`

---

## Bitácora – 07/10/2026 (noche)

### Completado

#### Pedidos (`/facturacion/pedidos/editar/nuevo`) — puntos 12, 13 y 14 de la revisión

- **12 — ISV en el pedido (Subtotal ≠ Total)**: el carrito y el resumen del checkout mostraban Subtotal = Total porque las líneas se guardaban con `impuesto: 0`; **la factura final también salía sin ISV** (`checkoutPedido` en `facturacion.service.ts` ya suma `det.impuesto` correctamente con `total = subTotal + impuestoTotal - descuentoTotal`, pero recibía 0 en todas las líneas).
  - `pedidos-virtual.ts`: cálculo de ISV con el **mismo criterio que `nueva-factura`** — `GET /parametros/parametros/objeto?moduloId=3` (`impuestoId`) + `GET /parametros/impuestos` con fallback al primer impuesto activo del módulo 3 → **ISV 15%** (`impuestoId` vacío en param-fac de empresa 2); helper `calcularImpuesto(bruto) = Math.round(bruto * tasa * 100) / 100` aplicado en los payloads de `agregarAlPedido`, `incrementar` y `decrementar`
  - Nuevos computeds: `subtotalPedido` (Σ brutos sin ISV), `isvPedido` (Σ impuesto de las líneas) y `totalPedido` redefinido = `Σ(subtotal + impuesto − descuento)` (misma fórmula que `checkoutPedido`) → `efectivo_recibido`, "Total a pagar" y el cambio del checkout ahora cuadran con `importe_cambio` del backend
  - `pedidos-virtual.html`: línea **`ISV (15%)`** agregada en el resumen del carrito y en "Resumen del Pedido" del checkout (`@if (tasaImpuestoPct > 0)`); la línea "Subtotal" ahora usa `subtotalPedido()`
  - **Sin cambios en backend** → sin rebuild ni restart
  - Nota: pedidos antiguos en BD tienen `impuesto = 0` en sus líneas → muestran ISV 0.00 hasta que el ítem se toque (incrementar/decrementar recalcula)
- **13 — Botón Volver**: `p-button` "← Volver" en `toolbar-left` (size small, variant text, severity secondary, rounded + pTooltip) → `NavegacionService.volver(['/facturacion/pedidos'])` (history.back con fallback al listado)
- **14 — Toast al incrementar ítem existente**: la rama `existing` de `agregarAlPedido` y el método `incrementar()` ahora emiten toast success "Actualizado — N unidades en el pedido" (antes solo se mostraba toast al agregar ítem nuevo)
- Build: `npx ng build --configuration production` exit=0 (solo warnings CommonJS preexistentes)

#### Fix — Botón "Confirmar Factura" siempre inhabilitado en pedidos

- **Causa raíz**: `formularioPagoValido` era un `computed()` que solo leía `this.checkout.*`, y `checkout` es un **objeto plano** ligado con `[(ngModel)]` (no es signal). Un computed sin dependencias signals se evalúa **una sola vez** — al renderizar el contenido del diálogo, con los campos de pago aún vacíos → `false` — y queda **congelado para siempre**: escribir en los inputs cambia el objeto plano pero no invalida el computed, así que el botón `[disabled]="procesando() || !formularioPagoValido()"` nunca se habilitaba.
- **Fix**: convertido a **método** `formularioPagoValido(): boolean` (misma lógica: nombre cliente requerido; tarjeta → 13+ dígitos + Luhn + vencimiento MM/YY + CVV≥3 + tipo tarjeta; transferencia → nroautorizacion; otro → true). El template ya lo llamaba con `()`, sin cambios en el HTML.
- Por qué funciona en zoneless: cada evento DOM ligado por Angular (tecleo en `p-inputmask`/`input`, cambio de `p-select`) programa detección de cambios → el binding `[disabled]` reevalúa el método con el estado fresco del objeto plano.
- `npx ng build --configuration production` exit=0

#### Pedidos — botón "Guardar pedido" (facturación a futuro) en el sidebar "Mi Pedido"

- **Footer del carrito** (`cart-summary`): ahora dos botones lado a lado (`.cart-actions`, flex) — **"Guardar pedido"** (secondary, `pi-save`) y **"Facturar pedido"** (success, `pi-check`; antes se llamaba solo "Facturar").
- **Flujo Guardar**: valida que haya pedido con items → diálogo modal "Guardar pedido" (nombre completo * + teléfono, precargado desde el pedido cargado si tiene nombre real distinto de "Cliente Pedido") → `PUT /facturacion/pedidos/:id` con `{ nombrecliente, nrotelefono }` → toast success "Pedido #N guardado" → `limpiarTodo()` → navega a `/facturacion/pedidos`.
- **Backend sin cambios**: ya existía `PUT /facturacion/pedidos/:id` con `UpdatePosPedMaeDto` (`nombrecliente?`, `nrotelefono?`); `ApiService.put` inyecta `empresaId` como query param (el controller lo toma de `@Query`).
- **Nuevo método** `PedidosVirtualService.actualizarPedido(pedidoId, datos)` → `api.put("/facturacion/pedidos", id, datos)`.
- **Facturar a futuro**: el pedido ya queda en `pospedmae` con su cliente → desde el listado `/facturacion/pedidos` (columna Cliente) → Editar → `/editar/:id` carga items → botón "Facturar pedido" → checkout.
- Reset completo en `limpiarTodo()`: dialogs, señales de nombre/teléfono y datos de cliente precargados.
- Diálogo: modal + draggable/resizable false + breakpoints + `[style]` 30rem (95vw mobile); footer con Cancelar (text/secondary) y Guardar (text/raised/success con `[loading]="guardandoPedido()"`); Enter en el nombre guarda.
- E2E API 4/4 OK: POST crea (pedidoId=5) → PUT `CLIENTE GUARDADO E2E`/`9999-1234` → GET listado lo refleja → DELETE limpia; `backend-error.log` vacío.
- `npx ng build --configuration production` exit=0

- **Ajuste UX**: .cart-actions cambiado a lex-direction: column — botones Guardar pedido / Facturar pedido apilados en vertical (uno sobre otro), no lado a lado.

#### Listado de pedidos — columna Hora eliminada
- /facturacion/pedidos: quitada la columna **Hora** de la tabla (th + td + estilos .th-hora/.hora-cell); colspan del empty message 8 → 7; método horaCorta() eliminado de pedidos-list.ts. Compila exit=0.

#### Pedidos — precios con separador de millares

- `pedidos-virtual.ts` (`formatearPrecio`): de `L ${Number(x).toFixed(2)}` a `toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })` → **L 1,250.00** — aplica en los 16 usos del template (cards de productos, carrito, resumen del pedido y checkout), cubre `/facturacion/pedidos/editar/nuevo` y `/editar/:id` (mismo componente).
- Toast de "Pedido facturado" (total de la factura) también con millares.
- Listado `/facturacion/pedidos`: no tiene columnas con montos (solo #, fecha, cliente, teléfono, tags) — no hay números que formatear ahí.
- `npx ng build --configuration production` exit=0

#### Listado de pedidos - orden descendente

- /facturacion/pedidos: tabla ordenada por **# de pedido de mayor a menor** (9 -> 1, mas reciente primero). Sort en pedidos-list.ts load() antes de setear la signal; el filtro y la paginacion respetan el orden. Frontend only, build exit=0.

---

## Bitácora – 07/10/2026

### Completado

#### Impresión de detalle de pedido (`/facturacion/pedidos`) — ticket/pdf por fila
- **Decisión del usuario**: "Cada pedido (Detalle/Ticket)" (NO listado completo)
- **Botón** `pi pi-print` en columna Acciones junto a Editar (severity secondary, text, rounded, small), con `[loading]` por fila, `[disabled]` mientras otra impresión corre y `$event.stopPropagation()` (la fila navega a editar)
- **Backend SIN cambios**: reutiliza `GET /facturacion/pedidos/:id`, `GET /facturacion/pedidos-det/pedido/:id`, catálogo `/inventario/tienda/productos` (cache 1 min de PedidosVirtualService), `/companies/:id` + `/companies/det` + `/companies/impresoras`
- **Motor reutilizado**: `FacturaImpresionService` (pdfmake, formato parametrizado desde `timpresoras` → TICKET 80mm o CARTA LETTER, impresión vía iframe oculto) — mismo motor que las facturas
- **`factura-impresion.service.ts`** (sección nueva "PEDIDO"):
  - `imprimirPedido(pedido, detalles)` — público; resuelve formato, arma doc, blob e imprime
  - `cargarEmpresaImpresion()` — cacheado: nombre de `tempresas` + RTN/DIRECCION/TELEFONO/CORREO de `tempresasdet` + mensajes; fallback `{nombre:'EMPRESA'}`
  - `totalesPedido()** — misma fórmula que `checkoutPedido`: `total = subtotal + ISV − descuentos`
  - `buildPedidoTicketPdf()` — Courier 80mm: encabezado empresa, PEDIDO No./Fecha+Hora/Cliente/Tel/Estado (con # de factura si facturado), tabla ARTÍCULO / CANT × P.U. / TOTAL con desc por línea, Subtotal/−Descuentos/ISV/**TOTAL PEDIDO**, pie "Documento NO fiscal - pedido de venta / No equivale a factura" + fecha de impresión
  - `buildPedidoCartaPdf()` — LETTER: encabezado empresa, bloque PEDIDO # + fecha/hora/estado (colores PENDIENTE ámbar / FACTURADO verde), tabla 6 col con header verde #10b981, bloque totales alineado a la derecha, mismo pie no fiscal
  - `alturaPedidoTicketPdf(items)` — altura estimada de bobina (una sola página)
- **`pedidos-list.ts`**:
  - `imprimir(p)` → `forkJoin` de pedido + detalles + catálogo (productos con `catchError(() => of([]))`)
  - `enriquecerDescripcion()` une cada línea con la descripción por **codbarra** (fallback productoId) — porque **`pospeddet` NO guarda `descripcion`** (solo `codbarra` + `productoId`); si no hay match: `Producto #id`
  - signal `imprimiendo: number | null` (# de pedido en curso) + guard de doble click
- **Smoke test API**: 10 pedidos; #2 → 2 detalles (codbarra 7501234567894 → "Corolla" en catálogo ✓); empresa AUTOSEL con RTN/DIRECCION/TELEFONO/CORREO ✓; impresoras formato **TICKET** ✓
- **Nota**: pedidos legacy (creados antes del fix de ISV en tienda) imprimen ISV 0.00 — esperado
- `npx ng build --configuration production` **exit=0** (solo warnings preexistentes)

### Pendiente
- Verificar impresión en browser: click pi-print → diálogo de impresión con ticket 80mm (formato TICKET de la empresa)

---

## Bitácora - 07/10/2026 (2)

### Separación de rutas de pedidos: PedidoForm (ERP) vs PedidosVirtual (CRM)

**Problema**: `/facturacion/pedidos/editar/:id` y `/facturacion/pedidos/editar/nuevo`
cargaban `PedidosVirtual` (el CRM de clientes externos con diseño de tienda online).
El editor ERP de pedidos se veía como la tienda virtual - "la cagada" reportada.

**Solución**: nuevo componente `PedidoForm` con el mismo diseño de `nueva-factura`
(grid xl:col-9 + panel lateral xl:col-3) que opera sobre pospedmae/pospeddet.

**Archivos nuevos**:
- `features/facturacion/pedidos/pedido-form.ts` - logica:
  - Filas en memoria (FilaPedido) con calculo: bruto = cantidad x precio;
    ISV = (bruto - descuento) x tasa (param-fac modulo 3, fallback 15%),
    total = bruto - desc + ISV (cuadra con checkoutPedido del backend:
    pospeddet.subtotal = bruto, descuento = monto, impuesto = ISV)
  - Helper de productos (DynamicDialog ALT+1), escaneo >=13 digitos,
    ofertas/promos desde /facturacion/combos-ofertas
  - `asegurarGuardado()`: crea (POST mae + detalles secuenciales) o actualiza
    (PUT mae + DELETE/POST detalles solo si sucio); Guardar navega al listado,
    Facturar abre dialogo de pago
  - Dialogo de pago UNICO con TODAS las formas de pago (a diferencia del CRM):
    tarjeta (Luhn + MM/YY + CVV + tipo), transferencia (autorizacion),
    efectivo (recibido + cambio); `formularioPagoValido()` es METODO (leccion
    comput() con objetos planos + ngModel)
  - Si sn_facturado = 'S' -> solo lectura (banner + campos/botones disabled)
- `features/facturacion/pedidos/pedido-form.html` - layout identico a
  nueva-factura: buscador, tabla 7 columnas (Producto/Imagen/Cantidad/Promo/
  PrecioVta/Subtotal/Accion), totales 4 bloques, panel lateral (cliente, nombre,
  telefono, envio gratis, resumen, botones Salir/Nueva/Guardar/Facturar)
- `features/facturacion/pedidos/pedido-form.scss` - copia de clases relevantes
  de nueva-factura.scss + extras (.page-header-pedido, .pd-actions, .pd-cambio)

**Cambio de ruta** (unico archivo tocado de rutas):
- `facturacion.routes.ts`: `pedidos/editar/:id` -> `./pedidos/pedido-form`
- INTACTOS: `/pedidos-virtual` (CRM), `/pedidos` (lista ERP con impresion),
  pedidos-list.ts navega a /editar/:id y /editar/nuevo -> ahora PedidoForm

**Verificado**:
- `UpdatePosPedMaeDto` acepta nombrecliente/nrotelefono/sn_enviogratis/sn_facturado
- `npx ng build --configuration production` exit=0 (solo warnings preexistentes)
- git status: solo routes.ts (1 linea) + 3 archivos nuevos en esta ronda
- `p-table` NO tiene input `trackBy` (es de ngFor) - removido del template

## Bitácora - 07/10/2026 (3): Pedidos — nuevo esquema pospedmae/pospeddet, E2E 61/61

### Contexto
El usuario recreó `pospedmae`/`pospeddet` con el nuevo DDL (tablas vacías, sin migración). Alcance aprobado: **"Contado + cabecera completa"** — defaults completos en backend, totales de cabecera recalculados, ERP envía `clienteId`/`nrocliente` con `tipofactura 'E'`, cerrar con E2E + revisión fuerte CRM/ERP.

### E2E completado (61 OK / 0 FAIL)
Script: `Temp\\opencode\\test-pedidos-nuevo-esquema.js` (snapshots previos + limpieza exacta).

**A. Pedido ERP (clienteId real = 1 / CLI-0001)** — 33 checks:
- Defaults backend al nacer: `bodegaId=1`, `cajaId=1`, `Idsucursal=1`, `sn_facturado='N'`, `tipofactura='E'`, total 0
- Totales de cabecera recalculados en cada cambio de detalle: 200/30/0/230 → 250/36.75/5/281.75 → (PUT det) 300/43.50/10/333.50
- PUT: renombra sin romper totales ni clienteId; PUT con `sn_facturado:'S'` → 400 (solo checkout lo marca)
- Checkout **multi-pago** (efectivo 200 + transferencia 133.50 con AUT): 2 filas en `posfaccaja`, `nrofactura` numérico, pedido enlazado (`sn_facturado='S'`, `facturaId`, `nrofactura`)
- `posfacmae`: cliente/bodega/caja/sucursal/pagada/tipo/total/dirección correctos; `posfacdet` 2 líneas con empresaId/bodegaId; `invkardex` 2 salidas (nroreferencia=facturaId, moduloId=1)
- **Partida contable automática** (integración ON en empresa 2): 6 líneas cuadradas D=H=72,343.50 + bitácora `posfacmov`
- 5 guards 400: re-checkout, crear det, PUT, DELETE det, DELETE pedido (todo facturado)
- Dirección copiada del pedido **vigente** (la renombrada en el PUT)

**B. Pedido CRM (sin clienteId)** — 15 checks:
- Fallback cliente TIENDA (clienteId=15) + mismos defaults; det → totales 100/15/0/115; DELETE det → cabecera a 0; re-crear det
- Checkout **legacy** (1 fila de caja, efectivo 115, cambio 0); guard re-checkout 400

**Limpieza/restore (sin residuos):** 0 filas TEST; `coctamov` (45), `coctasaldos` (38) e `invexistencias` (7) idénticos a sus snapshots; conteos baseline intactos; detección de concurrencia exacta por IDs (kardex/facturas ajenas/anulaciones en la ventana). Pedidos del usuario #13-15 intactos.

### Hallazgo corregido: dirección de factura NUNCA se persistía
- **Síntoma**: todas las `posfacmae.direccion_entrega = NULL` (5/5 filas existentes); el HTML de correo-factura (`generarHtmlFactura`) mostraba siempre `f.direccion = 'N/A'`
- **Causa**: DTO/FE envían `direccion`, pero la entidad mapeaba la propiedad `direccion_entrega` sin `name:` → TypeORM descartaba el campo en INSERT (no existe columna `direccion`)
- **Fix**: `posfacmae.entity.ts` → propiedad renombrada a `direccion` con `@Column({ name: 'direccion_entrega', ... })` (length 2000, coincide con BD). Beneficia los 3 flujos de una vez: Nueva Factura, `checkoutTienda` y `checkoutPedido` (que copia `pedido.direccion_entrega`)
- Verificado en E2E: A24 confirma dirección correcta en la factura creada por checkout

### Hallazgo PENDIENTE (reportado, no corregido — requiere aprobación)
- `contabilidad-logica.service.ts` → `descontabilizarFactura` usa `.where('movctascontablesId = :id')` pero la columna real de `coctamov` es `coctamovId` → error SQL silenciado por catch → la reversa de una factura contabilizada queda incompleta (coctamov mal revertido + paso 5 saltado → factura con `partidaId`). No afecta al E2E (la limpieza es SQL directo). Corrección de 1 línea cuando el usuario apruebe.

### Revisión fuerte CRM + ERP (OK)
- **ERP** (`pedido-form.ts`): envía `clienteId`/`nrocliente` (valida cliente requerido), `p_descuento` en cada línea, checkout con pagos[] completo (Luhn tarjeta + autorización transferencia), todos los campos declarados en DTOs
- **CRM** (`pedidos-virtual`): `crearPedido` sin clienteId (→ TIENDA), `nrotelefono` con fallback 'N/A', checkout legacy sin pagos[]
- `checkoutPedido` resuelve `empresaId` desde el pedido → `sinContexto: true` es válido; `Idsucursal` inyectado desde JWT + fallback en service
- Formularios FE no recolectan dirección/RTN del pedido (columnas opcionales en BD; backend los acepta y el checkout los copia) — funcionalidad disponible si se decide agregarlos a la UI

### Verificaciones de build
- `nest build` exit 0 → backend reiniciado (:3000, node PID nuevo, docs 200)
- `ng build --configuration production` exit 0 (solo warnings preexistentes: budgets + CommonJS)

## Bitácora - 07/10/2026 (4): Fix descontabilizarFactura + paridad pedido→factura (crédito) + E2E 76/76

### 1. Fix aplicado: `descontabilizarFactura` (aprobación del usuario — "dejar bien fino")
- `contabilidad-logica.service.ts` (~L2172):
  - `.where('movctascontablesId = :id')` → `.where('coctamovId = :id')` (PK real de `coctamov`; el error SQL estaba silenciado por catch y la reversa quedaba incompleta)
  - `saldo` recalculado **con signo**: `sacum + (nuevoDebe − nuevoHaber)` redondeado a 2 decimales
  - Paso nuevo: `actualizarSaldosCuentas(detallesPartida.map(...), empresaId, periodo, anio, currentUser)` **después** de marcar flags (la doble bandera sn_anulada='N' AND sn_contabilizada='S' solo ve los datos ya revertidos)

### 2. Paridad pedido→factura (DTOs + `checkoutPedido`)
- **`facturacion.dto.ts`**: `CreatePosPedMaeDto`/`UpdatePosPedMaeDto` += `factordecambio`, `sn_excenta` (S/N), `tipoconstancia` (OCE/SAG/CEA/FNE), `nroconstancia`, `importe_excento`; `CheckoutPedidoDto.formapagoId` → `@IsOptional()` (el crédito no paga)
- **`checkoutPedido`**:
  - `validarPeriodoAbierto` (mismo criterio que Nueva Factura; verificado: 10/2026 abierto → seguro)
  - `facturaPayload` con paridad total: `tipofactura: 'C'/'E'`, `rtn_cliente`, `factordecambio` (fallback 1), `diascredito`/`fechavencimiento` solo crédito, `gestorId`, `sn_excenta`, `tipoconstancia` (default FNE), `nroconstancia`, `importe_excento`, `sn_pagada`, `efectivo_recibido`/`importe_cambio`=0 en crédito
  - Crédito → `cxcService.generarMovimientoDesdeFactura` (try/catch) en paralelo a la factura
  - Filas `posfaccaja` **solo contado** (`if (!esCredito)`); pedido queda `sn_pagada='N'` en crédito
- **`pospedmae`** tiene todas las columnas de `posfacmae` → sin DDL

### 3. Frontend `pedido-form` (ERP) — espejo de Nueva Factura
- Campos nuevos: Tipo factura (Contado/Crédito selectbutton), cliente "+" (ruta `?modo=facturacion`), RTN (auto desde cliente en crédito), bloque fiscal (Descuento global, Exenta ISV, Tipo/Nro Constancia, Importe Excento readonly)
- Fórmula ISV incluido (`sn_impuestoincluido='S'`, empresa 2): `recalcularFila` con exenta → `impuesto=0` + `impuestoExcento`
- Descuentos (`/facturacion/descuentos` con acumulables), días plazo CxC, gestor, ALT+1/ALT+2
- `facturar()` ramifica: crédito → `checkoutCredito()` (POST checkout, solo pospedmaeId/nombrecliente/nrotelefono, `sinContexto`); contado → diálogo de pago
- Validación exenta (tipo+nro constancia requeridos) en `asegurarGuardado`; payload mae completo en PUT (sin factordecambio → backend fallback 1)
- Builds: `nest build` 0 · `ng build --configuration production` 0

### 4. E2E extendido: **76 OK / 0 FAIL**
Script: `Temp\\opencode\\test-pedidos-nuevo-esquema.js` — secciones A (33) + B (15) intactas, **sección C nueva (15 checks)**:
- C0 contado hereda: rtn, excenta=N, FNE, importe 0, factor 1, gestor null, días 0
- C1-C4: pedido crédito con cabecera fiscal completa persiste en `pospedmae` (whitelist) + detalle exenta 100/0/100
- C5-C6: checkout **sin formapagoId ni pagos** (201) → `posfacmae`: tipo='C', pagada='N', RTN, exenta='S', SAG/CONST-E2E-1, importe_excento=15, vencimiento, factor=1, dirección, total=100
- C7 `posfaccaja` = 0 filas (crédito no paga) · C8 `cxcmovimientos` 1 débito FAC por 100 · C9 pedido pagada='N' enlazado
- C10-C12: kardex 1 salida + partida 39 cuadrada (15,100 = 15,100) + movimiento CxC vinculado a la partida · C13 guard re-checkout 400
- Limpieza: nueva `DELETE cxcmovimientos` (moduloId=3, nroreferencia=nrofacturas TEST) **antes** de `copdamae` (FK partidaId) + **V14** sin huérfanos; snapshots exactos (coctamov 45, coctasaldos 38, invexistencias 7); pedidos usuario #13-15 intactos


---

## Bitácora – 07/10/2026 (5) — TodoPago: link de pago (modo sandbox)

### Completado

#### TodoPago en ERP — implementación completa backend + frontend (E2E 47/47 OK)

**Decisión del usuario**: botón/activación = **en la forma de pago** (fila `formapagoId=6 TodoPagoLink` en el diálogo de Formas de Pago de Nueva Factura); al confirmar = **"Todo: transacción + factura + caja"**.

**Flujo implementado**
1. Facturar contado con pago TodoPagoLink → factura nace `sn_pagada='N'` y la fila TP **NO** se inserta en `posfaccaja` al facturar (los otros pagos sí).
2. Tras kardex, se genera el link → card en el panel derecho con URL (copiar/abrir/ver estado), monto, tag estado y badge SANDBOX; **polling cada 10 s** al `/status`.
3. Al abrir el link (sandbox simulado) → redirige a **`/facturacion/pago-confirmado?Answer=SIM-…&Order=FA-…`** → componente confirma vía `POST /api/todopago/confirmar` → pantalla éxito/error.
4. Confirmación atómica (idempotente): transacción `completed` + `fecha_confirmacion` + `raw_response` · `posfacmae.sn_pagada='S'` · `INSERT posfaccaja` (formapagoId=6, importe_otros=link, `usuarioCreated` heredado de la factura, `nroautorizacion`=operationId). Reconfirmar → `alreadyProcessed=true`, sin duplicados.

**Backend — módulo `src/modules/todopago/`**
- `entities/transaccion-pago.entity.ts` — mapea tabla existente `transacciones_pago` (columna `facturaid` minúsculas, FK → `posfacmae`; enum status pending/completed/failed/expired/reversed; json raw_request/raw_response).
- `todopago.service.ts` — protocolo 3 operaciones con **axios**: SendAuthorizeRequest / GetAuthorizeAnswer / GetStatus; **sandbox automático** sin credenciales (`TODOPAGO_*` vacías en .env) → link simulado `${PUBLIC_URL}/facturacion/pago-confirmado?Answer=SIM-…`; monto = total factura − sum(posfaccaja); validaciones 404 factura inexistente / 400 anulada / 400 saldada.
- `todopago.controller.ts` — `GET /todopago/config` · `POST /generar-link/:facturaId` · `GET /status/:operationId` · `GET /transacciones/:facturaId` · **`POST /confirmar`** (público, callback) · **`POST /webhook`** (público, servidor a servidor).
- `todopago.module.ts` registrado en `app.module.ts` (forFeature TransaccionPago + TPosFacMae + TPosFacCaja); usa `FechaSistemaService` (global) para `fecha_confirmacion`/`fechaUpdated`.
- `axios` instalado en Backend.

**🔴 Gotcha crítico: dotenv y JWT (401 generalizado)**
- Primer intento: `dotenv.config()` al inicio de `main.ts` → el .env del repo es un **template de junta-agua** con `JWT_SECRET=${seed}` (literal, sin expandir).
- Efecto: `JwtModule.register` evalúa `process.env.JWT_SECRET` **al importar** (antes de dotenv) → firma con fallback `arcas-software-secret-key-2026`; `JwtStrategy` construye **después** de dotenv → verifica con `${seed}` → **firma inválida → 401 en TODA la API autenticada** (descubierto en la primera pasada del E2E: B1 401).
- **Solución**: quitado `dotenv.config()` global. Nuevo helper todopago.env.ts (cargarEnvTodoPago) que parsea el .env y carga SOLO TODOPAGO_* y PUBLIC_URL, invocado en main.ts después de NestFactory.create() (el JWT ya capturó su secreto). SMTP/DB/JWT del .env (plantilla de junta-agua) quedan intactos.
- Verificación: login → verify OK con fallback → GET protegidos pasan el guard (400 por query requerida = correcto).

**Frontend**
- `core/services/todopago.service.ts` — getConfig/generarLink/getStatus/getTransacciones (vía ApiService) + `confirmar()` (HttpClient directo, público); exporta `FORMAPAGO_TODOPAGO = 6`.
- `nueva-factura.ts`:
  - `facturar()`: detecta pagos con `formapagoId=6` → `sn_pagada='N'`, `efectivo_recibido` solo suma pagos no-TP, `importe_cambio=0`.
  - `guardarPagosYFinalizar()`: **excluye TP** de los `fac-caja`.
  - `procesarKardexYFinalizar()`: si hubo link → `generarLinkPago(fac)` (card + polling) en vez de reset directo.
  - `onFormaPagoChange()`: al elegir TodoPago auto-asigna el **importe pendiente** de la factura.
  - Signals `linkPago/linkStatus/linkCopiado`; métodos copiarLink/abrirLink/cerrarLink/consultarEstadoLink + tag estado (Pendiente/Pagado/Fallido/Expirado).
- `nueva-factura.html/.scss` — card **`.tp-link-card`** al inicio del panel derecho (URL copiable, botones Copiar/Abrir/Estado/Cerrar, badge SANDBOX); `(onChange)` en select de forma de pago.
- **Ruta nueva** `/facturacion/pago-confirmado` (`features/facturacion/pago-confirmado/`) — lee `?Answer=&Order=`, confirma, muestra éxito (factura # + monto) / error con Reintentar; botones a consultas/nueva factura.
- Build: `ng build --configuration production` OK (solo warnings CommonJS preexistentes).

**Prueba E2E sandbox — `test-todopago-link.js` → 47/47 OK**
- A: config (sandbox, formapagoId=6) · B: factura contado `sn_pagada=N` sin caja · C: generar-link (pending, monto 115, URL SIM-…, fila BD) · D: confirmar (completed, `sn_pagada='S'`, 1 caja formapagoId=6 importe_otros=115, usuarioCreated heredado) · E: idempotencia (reconfirmar no duplica) · F: status/historial/404/400 (anulada, saldada) · V: snapshots `posfacmae/posfacdet/posfaccaja/transacciones_pago/copdamae/copdadet/invkardex` + `coctamov/coctasaldos/invexistencias` **idénticos**; cleanup sin residuos TEST E2E TP%.
- `backend-error.log` en 0 líneas.

**Nota**: quedan en `src/` archivos .js muertos de la referencia Express (`config/todopago.js`, `todopago.service.js`, `todopagoController.js`, `todopagoRoutes.js`) — código no compilado (tsc solo .ts); no borrar sin avisar.

### Pendiente
- Prueba en browser: Nueva Factura → pago TodoPagoLink → Facturar → card link → **Abrir** → pantalla de confirmación → verificar `sn_pagada='S'` + caja.
- Modo producción: credenciales `TODOPAGO_MERCHANT_ID/API_KEY/SECURITY` en .env + endpoint real (arreglar URLs `.com.ar` vs dominio HN según documentación de TodoPago Honduras) y webhook público.
- Los archivos .js de referencia Express en `src/` → eliminar o mover a docs.


---

## Bitácora – 07/10/2026 (6)

### Completado

#### TodoPago replicado en Pedidos (`/facturacion/pedidos`) — E2E 40/40 OK
- **Backend `facturacion.service.ts` → `checkoutPedido()`**:
  - Constante local `FORMAPAGO_TODOPAGO = 6` (evita import cruzado con módulos)
  - Detección `conLink`: tabla `pagos` con formapagoId=6, O legacy sin tabla pero `formapagoId=6` (camino CRM/pedidos-virtual)
  - Factura nace `sn_pagada='N'`; `efectivo_recibido = suma de pagos NO-TP`; pagos TP **no** entran a `posfaccaja` (se insertan al confirmar el link)
  - `pospedmae.sn_pagada='N'` hasta que el link se confirme; return `{ facturaId, nrofactura, total, conLink }`
- **Backend `todopago.service.ts` → `aplicarConfirmacion()`**: además de `posfacmae.sn_pagada='S'`, localiza el pedido (`pospedmae.facturaId`) y lo marca `sn_pagada='S'` (coherencia con la lista de pedidos). `todopago.module.ts` +repo `TPosPedMae`
- **Frontend `pedido-form.ts/html/scss`**: inyecta `TodoPagoService`; `facturarConLink` detectado en `procesarPago()`; en success con link **NO navega** → `generarLinkPago()` + card `.tp-link-card` (monto, tag estado, SANDBOX, copiar/abrir/estado/cerrar) + polling 10s + `onFormaPagoChange` (auto-importe pendiente al elegir TP)
- **E2E `test-todopago-pedidos.js`: 40/40** — multi-pago efectivo 100 + TP 130 → factura N, caja solo efectivo, kardex OK; link cobra **saldo pendiente 130** (230−100); confirmar → completed + caja 2 filas (suma 230) + pedido pagado; caso legacy (formapagoId=6 sin tabla); idempotencia; 404; snapshots intactos (V1–V4); cleanup total
- `nest build` 0 · `ng build --configuration production` 0 · backend reiniciado :3000

### Gotchas encontrados
- **El checkout de pedidos contabiliza automáticamente** (emisión de partida por `factura.creada`) — el cleanup del E2E debe: borrar `posfacmov` **ANTES** que `copdadet`/`copdamae` (FK `FK_posfacmov_copdamae` RESTRICT) + revertir `coctamov`/`coctasaldos` (restauración desde snapshot si no hay actividad concurrente, o reversa selectiva por deltas si la hay)
- `POST /todopago/generar-link/:id` cobra el **saldo pendiente** (total − pagos ya en caja), no el total de la factura
- Runs fallidos dejaron residuos → scripts de reparación en Temp: `fix-tp-pedidos-residuos.js` (limpieza por nombre TEST E2E TP) y `fix-tp-deltas-run2.js` (reversa de deltas contables); I1/I2 verificados OK tras cada reparación

### Hallazgo (preexistente, NO tocado — requiere su revisión)
- Descuadre de **500** entre `coctamov.saldo` y `coctasaldos.octubre` (periodo 10/2026, empresa 2): `1-1-10-1-001` = 344,600 vs 344,100 y `1-1-20-1-001` = 1,003,900 vs 1,004,400 (se compensan entre sí). **Ya existía antes** de los fixes de hoy (confirmado: presente en los valores previos a la primera reparación). Parece un movimiento de 500 aplicado solo a `coctamov`.

### Pendiente
- Probar en browser: pedidos → pago con TodoPagoLink → card del link → confirmación en sandbox
- Ruta `/facturacion/pago-confirmado` queda bajo `authGuard` (OK en sandbox con sesión; en producción real deberá salirse del guard)

#### E2E TodoPago en pedidos reescrito SIN tocar contabilidad (42/42 OK)
- **Regla del usuario**: prohibido TODA prueba contable del agente (cero escrituras a `coctamov`, `coctasaldos`, `copdamae`, `copdadet`, `cocierremae/det`, `coperiodoctable`). Se permite flujo completo factura/pago/TodoPago/kardex SIEMPRE que NO se genere partida contable.
- **Opción A autorizada**: alternar `ttipoparametros.sn_integrar_facturacion` 'S'→'N' solo durante la corrida y restaurar 'S' verificado en `finally`. Mecanismo: `contabilizarFactura` (contabilidad-logica.service.ts L1911) sale temprano → cero `copdamae`/`copdadet`/`posfacmov`/`coctamov`/`coctasaldos`; kardex y pagos siguen normales.
- **Simulación contable** (pedido + factura TEST): `sn_contabilizada='S'` + `partidaId = ttipoparametros.nropartida` (47; no existe en `copdamae`, sin FK en `pospedmae`/`posfacmae` → no apunta a partida real). ```nropartida``` NO existe como columna en esas tablas: el número va en `partidaId`.
- **Marcador**: pedidos con `direccion_entrega='TEST de prueba'`; `nombrecliente LIKE 'TEST E2E TP %'` para cleanup.
- **Test** `test-todopago-pedidos.js` reescrito: flag en try/finally; snapshots SOLO tablas de negocio (sin V2/V3 de coctamov para evitar falsos positivos por contabilidad concurrente del usuario en UI); aserciones de cero partidas TEST (lectura) al inicio/fin; limpieza sin tablas contables. Resultado: **42/42** — flag restaurado 'S', conteos negocio == iniciales, invexistencias exacto.

#### Notificación del link TodoPago → ConfirmDialog headless (llamativa)
- **Motivo**: la notificación del link (toast + card en el panel) era casi inadvertida. Se reemplaza con un **ConfirmDialog headless** (https://v21.primeng.org/confirmdialog#headless) modal en **Nueva Factura** y **Pedido Form**.
- **Dos variantes en un solo template** (según `linkStatus()`):
  1. **Link generado** (badge círculo gradiente emerald + icono pi-link, título, Factura #, monto grande L, tag estado, tag SANDBOX, url copiable, acciones: Copiar link / Abrir link / Estado / Cerrar)
  2. **¡Pago confirmado!** (badge check, monto en verde, botón Entendido) — se reabre automáticamente cuando el polling o "Estado" detectan `completed`
- **Disparadores**: `generarLinkPago()` (exito) y `polling`/`consultarEstadoLink()` en `completed`. El toast de "Link de pago generado" se quitó (el diálogo lo reemplaza); el de "Pago confirmado" se mantiene.
- **Implementación**:
  - `ConfirmDialogModule` + `ConfirmationService` **local en providers** de cada componente (aisla su `<p-confirmdialog>` del global de `main-layout` — mismo patrón de `anular-facturas`)
  - `<p-confirmdialog key="tp-link">` declarativo con `[style] width 460px` y `breakpoints` (esos dos NO existen en la interfaz `Confirmation`; irían en `confirm()` y no compilan)
  - `confirm()` solo pasa props válidas: key/header/message/icon/modal/closable/closeOnEscape/dismissableMask + `acceptVisible:false` y `rejectVisible:false`
  - Template `#headless` con contexto `let-message let-onAccept let-onReject` (ContentChild 'headless' en primeng 21.1.9)
  - **Footer por defecto oculto**: PrimeNG renderiza el footer con botones Cancel/OK incluso en headless (bug #17000) → doble protección: props de visibilidad + `.tp-hl-dialog .p-dialog-footer { display: none }` con `::ng-deep` (styleClass declarativo en el `<p-confirmdialog>`)
  - SCSS `.tp-hl` idéntico en ambos componentes (tokens `--c-*`, badge gradiente con sombra, monto 1.8rem)
  - `nueva-factura`: signal nueva `nroFacturaLink` (tras `nueva()` el formulario se resetea, el nro. fiscal se guarda aparte para el diálogo)
  - La card `.tp-link-card` se conserva como indicador persistente tras cerrar el diálogo
- `npx ng build --configuration production` **EXIT=0**


---

## Bitácora – 08/10/2026

### Completado

#### TodoPago A+B+C: pantalla de links pendientes, expiración local 48h y botón en Consulta de Facturas (E2E backend 20/20 OK)

**C (expiración local de links - 48h)** `Backend/src/modules/todopago/todopago.service.ts`:
- Constante `TTL_LINK_HORAS = 48`
- `expirarLinksVencidos()` privado: UPDATE lazy que pasa a 'expired' todo link 'pending' con `fecha_creacion < NOW() - INTERVAL 48 HOUR` (idempotente)
- `listarLinksPendientes()` lo invoca ANTES de listar
- `consultarStatus()`: si el tx está 'pending' y ya venció el TTL → 'expired' en BD y retorna SIN consultar el gateway
- `generarLink()`: antes de guardar la transacción nueva, marca 'expired' los 'pending' anteriores de la misma factura → **un solo link vigente por factura** (regenerar vence el anterior)
- `mapTx()` ahora incluye `url` (desde rawRequest.url) y `sandbox`

**B (pantalla de links pendientes)**:
- Backend: `GET /todopago/links-pendientes` (`todopago.controller.ts`) con `@Query('empresaId')` opcional (parseo manual, sin ParseIntPipe); `listarLinksPendientes(empresaId?)` enriquece cada tx con nrofactura, nombrecliente, totalFactura, empresaId, snPagada, snAnulada (join manual via facMaeRepo + `In()`) y filtra por empresa (transacciones_pago NO tiene columna empresaId → se filtra vía posfacmae)
- Frontend service: interfaz `TodoPagoLinkPendiente` + `getLinksPendientes()` (empresaId auto-inyectado por ApiService); `nrofactura` del base ampliado a `string | number`
- Componente nuevo `features/facturacion/todopago/` (`TodoPago`): tabla paginada de links pendientes (Factura, Cliente, Monto, Creado, Edad, Estado, Entorno, Acciones), filtro por factura/cliente, tag PRODUCCIÓN/SANDBOX del config, acciones por fila: Copiar link, Abrir link, Consultar estado (completed → sale de la lista; expired → avisa), Regenerar con ConfirmDialog local (`key='tp-regenerar'`, providers locales `ConfirmationService`)
- Ruta: `/facturacion/todopago` en `facturacion.routes.ts` (**el item de menú en tusuariomnuitem requiere INSERT aprobado por el usuario**)

**A (botón en Consulta de Facturas)** `consulta-facturas.ts|html|scss`:
- Botón `pi pi-link` con `pTooltip="Ver link de pago"` en la columna Acciones, visible solo si `sn_pagada !== 'S' && sn_anulada !== 'S'` (severity help)
- Diálogo "Link de pago — Factura #": carga `GET /todopago/transacciones/:id`; si hay tx 'pending' muestra URL readonly + Copiar/Abrir + monto/fecha/SANDBOX + botón "Regenerar link"; si no hay → estado vacío con botón "Generar link"; abajo tabla Historial (fecha, monto, estado con labels ES: Pendiente/Completado/Fallido/Vencido/Reversado)
- Signals: dialogLink, linkFactura, linkHistorial, linkVigente, linkCargando, linkGenerando; métodos abrirLink, cargarLink, generarLinkFactura, copiarLinkUrl, abrirLinkUrl, getLinkEstadoLabel/Severity

**Verificación E2E `test-links-e2e.js` → 20/20 OK** (admin, factura pendiente 1 = 120009, empresa 2):
- generar-link 201 con url; links-pendientes lo lista con nrofactura/nombrecliente/empresaId enriquecidos y url presente
- empresaId=999 no ve la fila (filtro multi-empresa OK)
- regenerar → anterior 'expired', nueva 'pending' (un solo link vigente)
- envejecer 49h → al listar NO aparece, BD queda 'expired' (TTL lazy OK)
- GET status/:operationId → 'expired' sin gateway
- historial incluye url + sandbox
- cleanup: 2 filas baseline intactas (solo se borraron las creadas por el test; NO toca contabilidad ni ttipoparametros)
- `nest build` EXIT=0; `ng build --configuration production` EXIT=0; backend reiniciado en :3000

### Pendiente
- INSERT aprobado del usuario para el item de menu `/facturacion/todopago`
- Probar A y B en browser (usuario revisa visualmente)

---

## Bitácora – 10/10/2026

### Contra partida (Contabilidad) — backend + E2E + UI

#### Diseño (aprobado por el usuario)
- **Contra partida** = reverso de un asiento: crea partida espejo en el **período vigente** (fechaSistema) con débito↔crédito invertidos, mismo módulo/documento/referencia/sucursal/factor.
- **Original** → `sn_anulada='S'` + `sn_contabilizada='S'` + `contrapdaId` + `feccontrapda` (marcado AL FINAL); **contra** → `N/S` + `partidaOrigenId`, `nropartida` correlativo propio, `descripcion = "Contra partida #N: ..."`, líneas conservan su descripción.
- Ambas permanecen en el mayor y **netean a cero** (se postean con `actualizarMovimientosContables` + `actualizarSaldosCuentas`).
- **Estados**: `N/S` vigente · `S/N` anulada normal · `S/S` original contraedida (cuenta) · `N/S` + `partidaOrigenId` = contra (cuenta). **Criterio único**: solo `sn_contabilizada='S'` para cálculo/reconstrucción (cambio de doble bandera → bandera simple en TODO: saldos, ER, libro diario, dashboard, reconstrucción).

#### Bloqueos (backend `contabilidad-logica.service.ts` / `contabilidad.service.ts`)
- `contraPartida`: 404 inexistente · 400 (es contra / `CIERRE-` / no contabilizada / sin período vigente abierto / original en período posterior / sin líneas) · 409 ya contraedida (+ red de seguridad por `partidaOrigenId` + `sn_contabilizada='S'`).
- Guard `exigirPartidaNoContraida` en update/remove `copdamae` y en líneas: original contraedida no se edita/elimina (409); **la propia contra sí se puede eliminar** (deshacer, limpia marcador de la original); `descontabilizarFactura` lanza 400 si la partida tiene `contrapdaId`.
- Reconstrucción: snapshot por `sn_contabilizada='S'`; mata módulos 3/4/5 **no contra** y regenera desde fuentes; **fase 5 reaplica contras** (`partidaOrigenId != null`) → el par sobrevive a la reconstrucción.
- Endpoint: `POST /contabilidad/copdamae/:id/contra` (empresaId en body vía ApiService, fallback JWT).

#### E2E (`test-contra.js`, empresa 2) — 33/35 → fallos resueltos
- **OK (33)**: creación de contra de la partida 48 (FAC-120009, per. 10): `partidaOrigenId`, N/S, período vigente, módulo/referencia conservados, correlativo propio, original S/S + `contrapdaId` + `feccontrapda`, líneas S/S, espejo déb↔cred invertido por línea y cuadrado, líneas contra N/S, bloqueos 409/400 (ya contraedida, contraer contra, editar/eliminar original, editar contra, editar línea), bloqueo `CIERRE-`.
- **2 fallos eran bugs del script** (typo `b.deb`→`b.debe`; esperaba 200 en `POST reportes/libro-diario` que devuelve 201) → corregidos.
- **1 fallo es PREEXISTENTE** (no de la contra): `1-1-10-1-001` tenía drift de **500.00** entre `coctamov` y `coctasaldos[oct]` porque la partida 7 "BCO-TEST-D/C" (mód. 6) tiene líneas en `copdadet` (contab S) que **nunca se postearon a `coctamov`**. El drift existía ANTES de la contra (Δ de la contra neteó a 0 en las 5 cuentas ✓). Solución: **Reconstrucción de Mayores** (fase 5 repostearía la partida 7).

#### UI (`/contabilidad/copdamae` → copdamae-manager) — `ng build` OK
- **Modelo** `CopdaMae`: `partidaOrigenId?`, `contrapdaId?`, `feccontrapda?`.
- **Servicio** `ContabilidadService.contraPartida(id)` → POST con body `{}` (empresaId auto).
- **Detalle**: botón contra (pi-undo) en toolbar + item "Contra partida:" en ficha (tag `Contraedida → #N` warn / `Contra de #N` danger + fecha).
- **Lista**: tags "Contraedida"/"Contra", borde izquierdo ámbar (`.partida-contra`), botón contra por fila.
- **Helpers TS**: `puedeContraer/tooltipContra`, `puedeEditar/tooltipEditar`, `puedeEliminar/tooltipEliminar` (disabled + tooltip explicativo), `partidaNumero(id)` para enlazar original↔contra; guards en `editarPartida`/`eliminarPartida` con mensajes previos (backend sigue siendo la autoridad); confirm de eliminar contra advierte que **requiere Reconstrucción de Mayores** para impactar el mayor.

### Verificación post-ajuste del usuario (10/10/2026 tarde) — TODO CUADRA
- El usuario hizo el **ajuste de mayores directo**: la partida 7 "BCO-TEST-D/C" (mód. 6, líneas de prueba de Bancos) quedó con `debito=0 / credito=0` en `copdadet` (copdadetId 239/240). **La reconstrucción NO se ejecutó** (sin trace `[Reconstruir] Fase 0` en el log; la 48/49 nunca se marcaron S/N) — y ya no hace falta.
- Verificación (`verif-post-recon.js`, empresa 2): **I1 = 0 cuentas rotas en per. 10 y 0 en los 12 meses (48 filas coctamov)** · **I2 `sacum+(d-h)=saldo` 0 desviadas** · `coctamov` D/H = `copdadet` (contab S) D/H = **3,293,001.00 exacto** · global 2026 **D = H = 17,773,001.00** · pareja intacta: **48 S/S + contrapdaId=50 ↔ 50 N/S + partidaOrigenId=48** (sin clon; FAC-120009: mód 3 = nropartida 4, mód 4 = 48/49/50).

#### Ajustes de terminología UI — aprobados por el usuario (11/10/2026)
- **Regla**: usar **"ContraPda"**; **prohibido** "Contraedida"/"Contra" como etiquetas (términos inventados que los contables no comprenden). "Espejo" también quitado de textos visibles.
- **Lista**: tag `Contabilizada: Sí/No` + `ContraPda: Sí` (solo cuando `sn_anulada='S'`) agrupados a la izquierda de la fila de acciones (wrapper `.partida-estado-left` con `margin-right:auto`, reemplaza a `.contabilizada-left`); eliminados los tags "Contraedida"/"Contra" del header de lista.
- **Ficha "Datos de la Partida"**: label `ContraPda:` + tag corto `[Sí]` + texto **fuera** del tag:
  - fila contra (#50): `[Sí] , de la Pda Origen (#48)`
  - fila original (#48): `[Sí] , con ContraPda (#50)` + fecha entre paréntesis
  - sin contra: `[No]`
- **Tooltip botón contra**: `Crear contra partida de esta partida #N en el período en curso` (antes "Contra partida (espejo en el período vigente)").
- **Confirm crear contra**: `...en el período en curso. Las dos partidas permanecen en el mayor y netean a cero.` (sin "espejo").
- `ng build` OK; usuario verificó en browser: **"quedo bien"**.

### Pendiente
- Click en vivo del botón Contra desde la UI (la pareja 48 ← 50 fue creada vía E2E/API).

---

## Bitácora – 11/10/2026 (seguridad)

### Bug reportado
- Usuario **floresmurillo** (sin items de menú en `tusuariomnuitem`) podía navegar **todas las rutas** del sistema tras cambiar de usuario vía login-dialog.

### Diagnóstico
- **El token NO es el problema**: `login-dialog.ingresar()` → `AuthService.login()` reescribe token+user en localStorage y signals; el interceptor lee el signal en cada petición; el menú se recarga vía `effect` sobre `currentUser()` (por eso el sidebar sí quedaba vacío).
- **Causa real**: `authGuard` solo verificaba **autenticación** (¿hay token?) + restricción de clientes (`tipoPersona='C'`). **No existía autorización por ruta**: cualquier sesión autenticada accedía a cualquier URL. El menú (`tusuariomnuitem`) solo ocultaba enlaces — UI, no seguridad. El backend tampoco validaba permisos por endpoint.

### Solución (B completa) — backend
- **`jwt-auth.guard.ts`** (punto único: todos los controllers usan `JwtAuthGuard`): nuevo `validarPermisoModulo(req)` después del JWT y **antes** de los checks de fecha; aplica a GET y escrituras. Exige AL MENOS 1 fila activa en `tusuariomnuitem` (usuario+empresa+moduloId) según el prefijo del endpoint. Fail-closed: prefijo sin mapear → 403 (mejor visible en desarrollo que abierto en producción). `@Public`/auth/todopago quedan fuera (no pasan por el guard).
- **`MAPA_MODULOS`** (IDs reales de `tmodulos` empresa 2): inventario=2, facturacion=3, cxc=4, cxp=5, bancos=6, contabilidad=7, planilla=8, users/companies/sucursales/modulos/parametros=**11** (el menú de /configuracion vive en módulo 11 — CORRELATIVOS —; el módulo 1 no tiene items asignados).
- **Lecturas compartidas** (GET sin requerir módulo, para no romper flujos cross-module): `parametros`, `companies`, `sucursales` (catálogos/contexto) + parciales `inventario/productos|tienda|existencias` y `cxc/clientes|cajeros` (lookups de facturación/tienda). `users/menu-items` siempre (el chequeo depende de ese mismo endpoint).
- Inyección vía `DataSource` (global) — sin wiring de módulos nuevos.

### Solución (B completa) — frontend
- **`menu-config.service.ts`**: `modulosPermitidos(): Promise<Set<number>>` con caché por usuario (`claveModulos` + promesa) — evita carreras guard↔effect; el effect y el guard comparten la misma carga.
- **`auth.guard.ts`**: para empleados (`tipoPersona='E'`), la ruta debe caer en un segmento cuyo `moduloId` esté en los módulos del usuario (`MODULOS_POR_SEGMENTO`, alineado con el backend). **Whitelist** `RUTAS_LIBRES`: `/dashboard`, `/tienda`, `/pedidos`, + `RUTAS_PUBLICAS`. Denegación → toast "Acceso denegado: No tiene permiso para el módulo X" + redirect a `/dashboard`.

### E2E API (`test-permisos-api.js`) — 16/16 según diseño
- floresmurillo (JWT minteado, 0 items): **403** en POST /cxc/clientes, GET /users, /inventario/bodegas, /bancos/cuentas, /contabilidad/ctacontables, /planilla/empleados, /cxp/proveedores · **200** en /users/menu-items, /inventario/productos, /inventario/tienda/productos, /cxc/cajeros, /parametros/formas-pago (lecturas compartidas).
- admin: pasa el guard en todos (400 restantes = faltantes de query params en el script, no de permisos).

### Pendiente
- Verificación en browser: login como floresmurillo → intentar URLs directas (debe toast + dashboard); admin → todo normal. Ajustar `LECTURA_COMPARTIDA`/`LECTURA_PARCIAL`/`MAPA_MODULOS` si algún flujo cross-module legítimo queda bloqueado.

---

## Bitácora – 11/10/2026 (tarde)

### Completado

#### Caja · Destino de abono: Cuenta corriente (1) / Préstamos (2) — E2E 19/19 OK

**Petición del usuario**: en `/cxc/caja`, p-select "Destino de abono" antes del cliente (Cuenta corriente=1, Préstamos=2). Destino=Préstamos: abono a cuotas del plan, siempre desde la cuota 1; cuota pagada SOLO si el abono cubre su total (capital + interés + mora); interés simple y mora con la MISMA regla de facturas pero tasas del préstamo. Regla de abono insuficiente para cuota 1: **guardar con aviso** (aprobada).

**BD (ALTER ejecutados por el usuario)**:
- `cxccajamae`: +`destinoabono TINYINT NOT NULL DEFAULT 1` (1=CTA CTTE, 2=PRÉSTAMOS) y +`prestamoId INT NULL`
- `cxcprestamospp`: +`cxccajaId INT NULL` (enlace cuota↔caja → reversa al anular + idempotencia al re-guardar)

**Backend** (`cxc.service.ts`):
- `procesarAbonoCaja` firma ampliada: recibe `{ interes?, mora?, prestamoId?, cuotas? }`; si `destinoabono=2` delega en **`procesarAbonoPrestamo`**: (1) revierte cuotas pagadas por ESTA caja (`cxccajaId`), (2) valida cuotas enviadas (existentes, del préstamo, pendientes) y que su total no exceda el efectivo, (3) las marca `sn_pagada='S'` con mora/días mora/`cxccajaId`, (4) recalcula `ultcuotapagada` (`actualizarUltCuotaPagada`). **Sin movimientos CxC** (los préstamos no postean D al crearse → los abonos tampoco, no distorsionan cuenta corriente)
- `anularCaja`: paso 4 nuevo — revierte cuotas con `cxccajaId = caja` (limpia enlace, `mora=0`, `diasvencido=NULL`) + recalcula `ultcuotapagada`
- `findCajaRecibo`: si destino=2, devuelve `prestamo: { nroprestamo, capital, tasa, cuotas: [pagadas por esta caja] }`
- Controller `procesar-abono` body ampliado en consecuencia

**🐛 Bug pre-existente corregido — `cxcprestamo.entity.ts` (causaba 500 en GET /cxc/prestamos/cliente)**: la entity declaraba `tasa`/`diascuotas`/`moratorio`/`gracia` como nombres de columna, pero la BD usa `tasa_interes_anual`/`diasplazo`/`tasa_interes_moratorio_anual`/`diasgracia` → `Unknown column 'tasa'` en todo SELECT/INSERT vía repo. **Fix**: `@Column({ name: 'tasa_interes_anual' })` etc. (mapeo a columnas reales, sin tocar BD). Con esto la lista de préstamos de la caja carga y el cálculo de interés usa las tasas correctas

**Frontend** (`cxc/caja/`):
- Select "Destino de abono" (`DESTINO_ABONO` readonly array) antes de Cliente; deshabilitado al editar; cambio de destino limpia cliente/documentos/plan
- Destino=2: oculta Tipo/Nro Documento; tras elegir cliente carga `getPrestamosByCliente` (activos) en select; al elegir préstamo carga plan vía `getPrestamoPPByPrestamo` con **`calcularCuotaHoy`** (espejo de `calcularInteresesFactura`: período inicia `FechaPago − diascuotas`, `proximoPago=FechaPago`, gracia del préstamo; interés = capital×tasa/100×días/360; mora desde `FechaPago+gracia` con `moratorio`)
- Tabla cuotas: #, Vencimiento, Capital, Interés, Mora, Total, Estado (Pagada/Se paga ahora/Pendiente) + fila highlight verde para las que cubre el abono; resumen (efectivo/cuotas a pagar/total)
- `cuotasCubiertas` computed: reparto en secuencia desde cuota 1 pendiente; `avisoCuota1` si no alcanza ni para la 1 → toast warn al guardar ("faltan L x.xx… la caja se guardará sin pagar cuotas")
- `procesarYFinalizar` rama destino=2: envía `{ prestamoId, cuotas: [{pppId, capital, interes, mora, diasMora, total}] }`; éxito muestra cuotas pagadas; error no bloquea el cobro guardado
- Recibo térmico: bloque "Préstamo #: … / Cuotas pagadas: #1, #2"
- SCSS: `.cuotas-card`, `.prestamo-select`, `.cuotas-table` (`.cuota-cubierta`, `.cuota-pagada`, `.mora-positiva`), `.resumen-cuotas`, `.aviso-cuota`

**E2E API (`test-caja-prestamos.js`, 19/19)**: GET prestamos/cliente (fix 500) · plan 52 cuotas · caja destino=2 paga cuota 1 (interés 13d @28% = L 11.23, total L 1,122.14) · BD `sn_pagada=S`+`cxccajaId`+`ultcuotapagada=1` · re-procesar idempotente · recibo con préstamo · anulación revierte todo (cuota N, enlace NULL, ultcuotapagada 0) · abono insuficiente guarda sin cuotas con motivo · cleanup OK

**Nota**: en el primer intento del E2E saltó el gate `FECHA_SISTEMA` (409 ERP 10/10 vs servidor 11/10); al reintentar la fecha ya era 11/10 (posible cache TTL del servicio de fecha con expiración entre ejecuciones) — sin UPDATE necesario

### Pendiente
- Verificar en browser: `/cxc/caja` → destino Préstamos → cliente con préstamo → tabla cuotas → guardar → imprimir recibo; y anular para ver reversa
- Préstamos no contabilizan cobros (diseño actual: sin movimientos CxC ni partida por abonos a préstamo) — futura mejora si se requiere asiento por cobro de préstamo
