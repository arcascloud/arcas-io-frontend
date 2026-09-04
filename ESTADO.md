# Estado del Frontend — Sistema Arcas Software

> Documento vivo para reuniones y revisiones. Se actualiza al final de cada sesión para no partir de cero.

Última actualización: 2026-08-29

## Resumen

Stack: **Angular 22 + PrimeNG 21** (standalone, signals). Backend **NestJS** completo en
`E:\desarrollo\arcassoftware\Backend`; el frontend está en `E:\desarrollo\arcassoftware\Frontend`.

Todos los módulos del backend ya tienen su pantalla en el frontend, salvo los pendientes listados abajo.
El build de producción compila sin errores: `npm run build`.

## Cómo correr / verificar

```powershell
cd E:\desarrollo\arcassoftware\Frontend
npm run build     # compilación de producción (sin errores = OK)
```

No hay scripts de test/lint configurados; la verificación es el build.

## Convenciones clave (leer antes de tocar código)

- **PrimeNG 21**: `p-dropdown` ya no existe → usar `p-select` (`primeng/select`, `SelectModule`).
  `p-inputnumber` (`primeng/inputnumber`), `p-datepicker` → **`DatePickerModule`** (`primeng/datepicker`, P mayúscula).
  `p-dataview` NO tiene input `dataKey` (no enlazarlo con `[]`).
- **ApiService** (`core/services/api.service.ts`): `get/getOne/put/delete` inyectan `empresaId` en query params.
  `post`/`put`/`putBase` inyectan **`empresaId` siempre** y **`Idsucursal` solo en tablas que la tienen** (allowlist
  `CON_SUCURSAL`: /bancos/bancos, /bancos/cuentas, /contabilidad/copdamae, /contabilidad/copdadet,
  /contabilidad/ctacontables, /cxc/caja-mae, /cxc/caja-det, /planilla/empleados). Excepción opt-out: `sinContexto`
  para `/parametros/pasatiempos` (tabla sin columna empresaId; DTO sin whitelist). Payloads con `as any`.
  `putBase` = PUT sin id (usado por los settings upsert).
- **Login / contexto**: el login NO envía `empresaId` (solo `usuario`+`password`); la respuesta trae
  `usuario.empresaId` + `usuario.idsucursal`, que se usan automáticamente en altas/modificaciones sin mostrarse
  ni digitarse en formularios. Los formularios ya NO incluyen campos `empresaId`/`Idsucursal` manuales.
- **Sin botones Eliminar** en los CRUD (el backend no expone DELETE en la mayoría de módulos; donde existe,
  ej. inventario codigos-barras/productos-det/productos-img, tampoco se agregó por consistencia).
- **Botones** siempre `size="small"`.
- **Menú**: estático en `core/services/menu-config.service.ts`; ediciones aditivas.
- **Rutas activas**: Configuración usa `features/configuracion/configuracion.routes.ts`.
  `features/parametros/parametros.routes.ts` y `features/parametros/configuracion.routes.ts` son **huérfanas** (no tocar).

## Sistemas genéricos (reutilizables)

1. **Catálogo genérico** — `core/models/catalogo-parametros.models.ts` (`CATALOGOS_PARAMETROS`),
   `core/services/catalogo-parametros.service.ts`, `features/parametros/catalogo-generico/*`.
   - Soporta `tipo`: `texto | numero | select | fecha`.
   - Selects con opciones estáticas (`opciones`) o asíncronas (`cargaOpciones: {url, labelCampo, valueCampo}`).
   - `incluyeEmpresaId` y `sinEstado` por catálogo. **Ojo:** `pasatiempos` requiere `incluyeEmpresaId: false`
     (tabla sin columna empresaId; `createPasatiempo` propaga el DTO completo).
   - El componente lee el nombre vía `route.data['nombre'] ?? paramMap`.
2. **Maestro-detalle** — `core/models/facturacion.models.ts` (`MAESTRO_DETALLE`),
   `core/services/facturacion.service.ts`, `features/facturacion/maestro-detalle/*`.
   - Det existentes se actualizan con PUT, nuevos con POST; botón "quitar" deshabilitado en filas ya guardadas.
3. **Consulta read-only** — `features/cxc/consulta/consulta.*`. Lee `route.data['consulta']` =
   `{nombre, titulo, subtitulo?, ruta, idKey, excluir?}`.
4. **Settings single-row** — `core/models/settings.models.ts` (`SETTINGS`),
   `features/configuracion/settings/*`. GET + PUT (upsert) por empresa; ruta `/configuracion/settings/:tipo`.

## Completado (por módulo)

### Inventario (`/inventario`)
Productos (CRUD dedicado), categorías + 11 catálogos genéricos (marcas, modelos, colores, unidades-medida,
embalajes, proveedores, bodegas, ubicaciones, pasillos, casas, testantes, tags), existencias y kardex (solo lectura).
Pendiente menor: codigos-barras, productos-det, productos-img (ver Pendientes).

### Configuración (`/configuracion`)
- Empresas, Usuarios, Módulos por Usuario, Menú por Usuario, Scripts, Permisos Especiales (pre-existentes).
- **15 catálogos de parámetros** vía genérico (estados, formas-pago, monedas, impuestos, paises,
  departamentos-pais, departamentos-empresa, direcciones, telefonos, tarjetas-credito, pasatiempos, zonas,
  gestores, proformas, zonas-vta-cob) en `/configuracion/parametros/:nombre`.
- **9 Settings por módulo** (param-bco, param-con, param-cxc, param-cxp, param-fac, param-inv, param-pap,
  param-pla, param-pres) en `/configuracion/settings/:tipo`.

### Facturación (`/facturacion`)
Catálogos: correlativos, precios, descuentos. Maestro-detalle: facturas, cotizaciones, pedidos, combos.
**Anular Factura** (`/facturacion/facturas-anul`): componente dedicado `AnularFacturas` — tabla Poseidon con acciones Ver/Anular, dialogo confirmacion, validaciones backend (ya anulada, contabilizada, credito con abonos), reversa kardex + existencias + movimientos CxC.
**Tienda Virtual** (`/facturacion/tienda`): optimizada con cache localStorage (TTL 5 min) + shareReplay, trackBy, lazy loading imagenes, content-visibility auto.
**Nueva Factura** (`/facturacion/nueva-factura`, `features/facturacion/nueva-factura/*`): pantalla dedicada adaptada del
prototipo `atenciones\gestion\facturacion.*` — **sin encabezado de página ni cabecera de factura** (solo botón Salir a la
derecha), sección **Tipo** arriba, "Facturar a" (solo Cliente, se selecciona por nombre/código), "Datos de la venta"
(bodega, cajero, gestor, exenta de ISV, Nro. Carnet — factor de cambio/días crédito/vencimiento quedaron solo en TS),
entrada de detalle con **producto (lupa + dialog de selección)**, cantidad y botón **Agregar**
(validación cantidad 1..100, impuesto 12%, subtotal), grid Producto/Cantidad/Precio Venta/Impuesto/Sub total/Acción,
sección **Pago** (forma de pago, tarjeta, Nro. Tarjeta, Nro. Referencia, efectivo/cambio) y barra inferior
**Nueva/Facturar/Salir** + Sub total/Impuesto/Total read-only. Guarda `posfacmae` + `posfacdet`
(POST `/facturacion/facturas` + `/facturacion/facturas-det`). Sin estilos responsivos (decisión usuario).

**Valores automáticos en Nueva Factura**:
- **Factor de cambio**: se carga de `cofactordecambios` (GET `/contabilidad/factordecambio`, empresa del usuario),
  se toma el registro de `tipomoneda='D'` más reciente por `fecharegistro` y se pone en el campo oculto `factordecambio`.
- **Días de crédito / vencimiento**: de `ttipoparamcxc` (GET `/parametros/param-cxc`, por empresa) se toma `diasPlazo`
  → `diascredito` y `fechavencimiento = hoy + diasPlazo` (DATEADD). Ambos campos ocultos.
- **Nro. de factura**: se quita del formulario y el **backend lo auto-asigna** desde `poscorrelativos` de la empresa
  (toma el correlativo y lo incrementa; si no existe, usa 1). `CreatePosFacMaeDto.nrofactura` ahora opcional.

### Cuentas por Cobrar (`/cxc`)
Clientes (CRUD dedicado), cajeros + dias-cobro (catálogos), caja + prestamos (maestro-detalle),
movimientos/historico/saldo-favor (consulta read-only), **antiguedad-saldos**, **cartas-recordatorio** (fix build 25/08).
Pendiente: parientes, clientes-dir, clientes-tel, clientes-ref (CRUD en backend).

### Cuentas por Pagar (`/cxp`)
Proveedores (CRUD dedicado, diseño estandarizado con Inventario); compras, compras-det, historicos, saldos-av (consulta read-only).
**Movimientos CxP** (`/cxp/movimientos`): componente dedicado `CxPMovimientosManager` replicando diseño CxC — panel dividido proveedores/movimientos, formulario 2 columnas, validación débito/crédito/referencia.
Backend: endpoints `GET /cxp/proveedores-pag` (paginado), `GET /cxp/movimientos/proveedor/:id`, `POST /cxp/movimientos`.
Pendiente menor: proveedores-dir / proveedores-tel (solo lectura).

### Bancos (`/bancos`)
bancos + cuentas (catálogos genéricos con `cargaOpciones`), conciliaciones/direcciones/telefonos (solo lectura).

### Planilla (`/planilla`)
Empleados (CRUD dedicado con selects países/profesiones/puestos); catálogos: puestos, profesiones,
deducciones, ingresos, titulaciones, certificaciones, asistencia, comisiones, deducciones-emp;
planillas (maestro-detalle).

### Contabilidad (`/contabilidad`)
16 catálogos genéricos: ctacontables, grupocontable, nivelcta, naturalezacta, tipos-doc-fiscal,
impuestovecinal, factordecambio, cierrectable, periodoctable, saldoscta, repliquidez, repdiarios,
repbalances, movcta (+ cierres). Maestro-detalle: plantillapda, plantillabalances, copda.

### Usuarios / Auth
Login (auth), CRUD de usuarios, módulos (`/users/modules`), menu-items, scripts, mod-auth.
Login: request `{usuario, password}` (sin empresaId); response `access_token` + `usuario{empresaId, idsucursal}`.
Backend: `LoginDto.empresaId` ahora opcional; `auth.service.login` busca por `{usuario, sn_activo:'S'}`.

## Pendientes

1. **Sucursales CRUD** (`/sucursales`) — existe `core/services/sucursales.service.ts` (solo GET, usado por
   usuario-form) pero no hay pantalla. Entidad: idsucursal, descripcion, sn_activo, empresaId. Fácil como catálogo genérico.
2. **CXC parientes** — CRUD completo (`/cxc/parientes`).
3. **CXC clientes-dir / clientes-tel / clientes-ref** — tienen POST/PUT (CRUD reales), no solo lectura.
4. **Inventario codigos-barras / productos-det / productos-img** — CRUD con DELETE en backend.
5. **CXP proveedores-dir / proveedores-tel** — solo lectura.

## Notas de reuniones / decisiones

- El usuario priorizó: primero los 4 maestro-detalle de Facturación → luego resto del HU.
- Facturas Anuladas se construyó primero de la lista de pendientes (decisión 2026-08-20).
- Decisión 2026-08-20: login sin `empresaId` en la petición; la respuesta entrega `empresaId` + `idsucursal` y esos
  valores se inyectan de forma global y automática en altas/modificaciones (ApiService), sin campos en formularios.
  Se quitaron los campos manuales `Idsucursal` de bancos, cuentas, ctacontables, copda, facturas-anul y empleados.
- Decisión 2026-08-20: pantalla de facturación dedicada estilo invoice de Poseidon PrimeNG (no el maestro-detalle
  genérico): "Nueva Factura" en `/facturacion/nueva-factura` con secciones Pago y Totales separadas.
- Decisión 2026-08-20: Nro. Factura auto desde `poscorrelativos` (backend); Factor de cambio desde `cofactordecambios`
  (último por fecha, moneda D); Días crédito + vencimiento desde `ttipoparamcxc.diasPlazo` (DATEADD). Campos ocultos.
  `styleClass="w-full"` no existe como clase global → los inputs de texto de secciones usan
  `.invoice-party .campo input[pinputtext] { width: 100% }` (PrimeNG `p-fluid` no se distribuye en esta versión).
- **PAUSA (2026-08-20):** el usuario va a preparar el estilo / guía visual de la facturación para no asumir
  requerimientos. NO avanzar con más cambios en la pantalla hasta recibir esa guía.
- La delegación a agente `general` del IDE falló en su momento (no creó archivos); el trabajo se hace directo.
- **Fix 2026-08-25:** `cartas-recordatorio` y `antiguedad-saldos` en CXC compilaban mal por falta de `TooltipModule` y campo `corriente` en interfaz/datos. Corregido; build OK.

## Bitácora — 29/08/2026

### Completado

#### Anular Factura (`/facturacion/facturas-anul`)
- **Componente nuevo** `AnularFacturas` (`anular-facturas/`): tabla Poseidon, columnas #Factura, Fecha, Hora, Cliente, Tipo, Total, Anulada, Contab., Acciones (Ver + Anular)
- **Acciones**: solo Ver (navega a consulta) y Anular (pi-ban, disabled si ya anulada)
- **Dialogo confirmacion**: pregunta antes de anular, muestra cliente/total/tipo
- **Validaciones backend** (`facturacion.service.ts createFacturaAnul`):
  - `sn_anulada === 'S'` → "La factura ya esta anulada"
  - `sn_contabilizada === 'S'` → "La factura esta contabilizada y no se puede anular"
  - Credito + abonos → "La factura es al credito y tiene abonos registrados"
- **Reversa automatica**: kardex (entrada), existencias, movimientos CxC, caja

#### Tienda Virtual — Optimizacion velocidad
- **TiendaService**: cache 2 niveles — `shareReplay(1)` in-memory + `localStorage` TTL 5 min
- **Componente**: `trackBy` en todos los `@for`, `loading="lazy"` en imagenes, `content-visibility: auto` en cards, `imagenCache` Map para resolver base64, `invalidateCache()` post-checkout

#### Estandarizacion formularios proveedores
- **CxP proveedor-form SCSS**: reemplazado 6 lineas por SCSS completo de Inventario (`.form-grid`, `.campo`, `.acciones-form` con grid 2 columnas)
- **CxP proveedor-form HTML**: orden RTN→DNI alineado con Inventario, sin inline `pSize="small"` inconsistente

#### Fix encoding cotizaciones
- `cotizaciones-form.html`: re-guardado con UTF-8 correcto (vocales con tilde estaban como `�`)

#### CxP Movimientos (`/cxp/movimientos`)
- **Componente nuevo** `CxpMovimientosManager` (`cxp/movimientos/`): replica de CxC Movimientos adaptado para proveedores
- **Backend**: `GET /cxp/proveedores-pag` (paginado con busqueda), `GET /cxp/movimientos/proveedor/:id`, `POST /cxp/movimientos`
- **Frontend service**: `getProveedoresPag()`, `getMovimientosByProveedor()`, `createMovimiento()`
- **Mismo diseño**: panel dividido proveedores/movimientos, formulario 2 columnas, validacion debito/credito/referencia

#### p-size="small" global
- Todos los `p-inputText`, `p-inputNumber`, `p-select`, `p-selectbutton` del ERP actualizados con `pSize="small"` / `size="small"` (~50 archivos)

#### Consulta Facturas — Diseno Poseidon
- **Lista**: 9 columnas, cards, Hora small font, tag Anulada/Contab,acciones (eye, print, envelope, whatsapp)
- **Detalle**: paper layout (border-radius 12px, shadow), empresa header, Estado tag, items table, pagos, footer, acciones
- **PDF**: Estado primero (left), FACTURA # right-aligned
- **WhatsApp**: fallback desktop descarga PDF + abre wa.me

### Pendiente
- Verificar CxP movimientos end-to-end en browser
- CxC movimientos: posibles ajustes de UX pendientes