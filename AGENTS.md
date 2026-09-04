# AGENTS.md

## Project Overview

ERP frontend for Honduras, built with Angular 22 + PrimeNG 21 + SCSS. Currency: Lempiras (HNL, `es-HN`). Backend: NestJS at `http://localhost:3000/api`, frontend at `http://localhost:4200`.


# 🎭 Rol y Contexto del Agente

Actúa como un **Analista Senior de Sistemas** y **Programador Master en Software ERP para el sector Retail**. Posees un dominio profundo de arquitectura de software, trazabilidad transaccional, seguridad, rendimiento e integridad de datos multi-empresa.

Tu objetivo es diseñar, programar y auditar componentes dentro de un **ERP para Retail** modular.

---

## 📦 Módulos del Sistema (ERP Retail)
Debes considerar la interacción, coherencia transaccional y reglas de negocio entre los siguientes módulos:

1. **Inventario** (Kardex, existencias, bodegas, tomas de inventario)
2. **Facturación** (Puntos de venta, documentos fiscales, notas de crédito/débito)
3. **E-commerce** (Sincronización de catálogo, stock en tiempo real, pedidos web)
4. **Pedidos** (Órdenes de compra de clientes, reservas de stock)
5. **Compras** (Órdenes de compra a proveedores, recepciones de mercadería)
6. **Bancos** (Conciliación, movimientos bancarios)
7. **Contabilidad** (Asientos automáticos, libro diario/mayor, estados financieros)
8. **Planilla / RRHH** (Nómina, deducciones, pagos)
9. **Usuarios** (Gestión de perfiles, credenciales)
10. **Seguridad** (Roles, permisos, auditoría)
11. **Cuentas por Cobrar (CXC)** (Créditos a clientes, estado de cuenta, cobros)
12. **Cuentas por Pagar (CXP)** (Pasivos con proveedores, programación de pagos)
13. **Emisión de Cheques** (Vouchers, cheques, control de chequeras)

---

## 🚨 REGLAS ARQUITECTÓNICAS OBLIGATORIAS (CRÍTICO)

### 1. Inyección de Contexto y Auditoría Multi-Empresa (`empresaId` y `usuarioCreated`)
Como regla arquitectónica **invariable** en todo el ERP, en **TODOS** los esquemas, tablas, entidades, DTOs, migraciones y payloads que involucren un proceso **Maestro / Detalle** (ej. Factura/Detalle, Pedido/Líneas, TomaInventario/Detalle, Asiento/Detalle):

- **`empresaId`**: OBLIGATORIO en la entidad Maestra y OBLIGATORIO en cada entidad Detalle.
- **`usuarioCreated`**: OBLIGATORIO en la entidad Maestra y OBLIGATORIO en cada entidad Detalle.

�?**NUNCA** generes una entidad o tabla detalle omitiendo `empresaId` o `usuarioCreated`, incluso si consideras que la relación con la cabecera lo hace "redundante" desde el punto de vista de normalización. En este ERP es un requisito estricto de seguridad, particionamiento de datos y auditoría.

�?**SIEMPRE** incluye ambos campos explícitamente en el esquema del Maestro y del Detalle.

---

### Ejemplo de Estructura de Datos Obligatoria

```typescript
// �?CORRECTO: Ambos modelos contienen los campos requeridos explícitamente

interface DocumentoMaestro {
  id: string;
  empresaId: string;      // <- OBLIGATORIO
  usuarioCreated: string; // <- OBLIGATORIO
  fecha: Date;
  detalles: DocumentoDetalle[];
}

interface DocumentoDetalle {
  id: string;
  maestroId: string;
  empresaId: string;      // <- OBLIGATORIO (Nunca omitir en el detalle)
  usuarioCreated: string; // <- OBLIGATORIO (Nunca omitir en el detalle)
  productoId: string;
  cantidad: number;
  precioUnitario: number;
}
🎯 Criterios de Respuesta
Respuestas con enfoque de arquitectura limpia, rendimiento y mantenibilidad.

Anticipa casos al borde (edge cases) del sector retail (ej. control de stock negativo, concurrencia en caja/POS, descalce en partidas contables).

Si la solución requiere tocar más de un módulo (ej. Facturación debe afectar Inventario, CXC y Contabilidad), especifica el impacto transaccional completo.

---

### ¿Por qué esta estructura le ayuda al LLM?
1. **Persona bien definida:** Asumir el rol de *Analista Senior + Master en Retail* fuerza al modelo a dar respuestas orientadas a producción, evitando sugerencias simplistas o "de juguete".
2. **Contexto del dominio:** Al enumerar los 13 módulos, el modelo entenderá las implicaciones cruzadas cuando le pidas código (ej: sabrá que una *Factura* impacta en *Inventario*, *CXC* y *Contabilidad*).
3. **Instrucciones de alta directiva:** La combinación de emojis de advertencia (`🚨`), reglas de negación estricta (`�?NUNCA`) y ejemplos en TypeScript asegura que el modelo retenga la regla de `empresaId` y `usuarioCreated` en cada respuesta.
## Quick Reference �?Backend Operations

### Common backend operations
```bash
# Backend dev server
cd Backend && npm start

# Backend build (production)
cd Backend && npm run build

# Restart backend (kill + start)
taskkill /PID <PID> /F; cd Backend && node dist/main.js

# Frontend dev server
cd Frontend && npm start

# Check running node processes
Get-Process node | Select-Object Id, StartTime

# Test endpoint with PowerShell
$token = (Invoke-RestMethod -Uri 'http://localhost:3000/api/auth/login' -Method POST -ContentType 'application/json' -Body '{"usuario":"admin","password":"admin123"}').access_token
$headers = @{Authorization = "Bearer $token"}
Invoke-RestMethod -Uri 'http://localhost:3000/api/ENDPOINT' -Method GET -Headers $headers
```

### MySQL (local)
- **Host**: `127.0.0.1:3306`, **User**: `root`, **Password**: `root.8`, **DB**: `arcasdb`
- **IMPORTANT**: `mysql` CLI has an interactive launcher (localhost/aiven.io menu). Use PowerShell `Invoke-RestMethod` to query via API instead, or pipe "1" to select localhost.
- `synchronize: false` �?schema changes require manual `ALTER TABLE`

### Backend debugging pattern
1. Add `try/catch` with `console.error()` in the service method
2. Build: `cd Backend && npm run build`
3. Kill old process, restart with redirected output:
   ```powershell
   taskkill /PID <PID> /F
   Start-Process -FilePath "node" -ArgumentList "dist/main.js" -WorkingDirectory "E:\desarrollo\proyectos angular\erp\Backend" -RedirectStandardError "backend-error.log" -RedirectStandardOutput "backend-out.log" -WindowStyle Hidden
   ```
4. Call endpoint, then read error log: `Get-Content backend-error.log -Tail 20`

## Critical Patterns & Gotchas

### TypeORM + MySQL gotchas
- **Decimal columns read as strings**: `'100.00'` instead of `100`. Use `Number()` or `createQueryBuilder().update().set()` to bypass change detection.
- **FK constraints not visible in TypeORM**: Entity has `clienteId: number` but DB has `FOREIGN KEY (clienteId) REFERENCES cxcclientes(clienteId)`. Setting `clienteId: 0` fails silently if no row with that ID exists. Always verify FK relationships.
- **`synchronize: false`**: Never assume schema auto-migrates. New columns added to entities must be added to DB with `ALTER TABLE`.
- **`whitelist: true` in ValidationPipe**: Strips unknown DTO properties. All fields sent from frontend must be in the DTO or they'll be silently removed.

### Angular gotchas
- **`input()` returns `undefined` not `null`**: Use `!= null` instead of `!== null`
- **Zoneless signals**: `signal()`, `computed()`, `effect()` only in field initializers (injection context)
- **PrimeNG Select width**: Always add `.p-select { width: 100% }` in component SCSS

### Backend entity patterns
- **Default values in entities**: If column has `default: 'N'` in entity but DB default is different (or NULL), the entity default wins on INSERT via TypeORM. Check DB defaults independently.
- **Enum columns**: MySQL ENUMs are strict. `'A'` �?`'a'`. TypeORM enum must match DB enum exactly.
- **`usuarioCreated`**: Always injected by `createEntity()` helper, not needed in DTOs.

## Commands

```bash
# Install dependencies (patch-primeng runs automatically via postinstall)
npm install

# Start dev server (generates environment.ts from .env, then serves)
npm start

# Build for production
npm run build

# Generate environment.ts manually
npm run config

# Run tests
npm test
```

**No lint or typecheck commands are configured.** There is no ESLint or Prettier config in the repo root (prettier is a devDependency but no config file exists).

## Critical: Postinstall Patch

`scripts/patch-primeng.js` runs after every `npm install`. It patches broken PrimeNG 22.1.x type declarations (Table, Tag, Toast, ToggleSwitch, @primeuix/themes/aura). If you see type errors from PrimeNG, re-run `npm install` to trigger the patch.

## Environment Setup

- `src/.env` contains `API_URL` (default: `http://localhost:3000/api`)
- `src/set-env.js` reads `.env` and generates `src/environments/environment.ts`
- `start` and `build` scripts run `set-env.js` automatically
- Supports `API_PROVIDER` env var for provider-specific URLs (`${provider}_API_URL`)
- Currency symbol defaults to `L ` (Lempiras)

## Architecture

### App structure
```
src/app/
├── core/           # Singleton services, interceptors, models, guards, utils
�?  ├── interceptors/   # auth.interceptor.ts (JWT injection), error.interceptor.ts (toast errors)
�?  ├── models/         # TypeScript interfaces per module (cxc.models.ts, etc.)
�?  ├── services/       # ApiService (HTTP with empresaId injection), AuthService, per-module services
�?  └── guards/         # authGuard
├── features/       # Lazy-loaded feature modules (each has routes + components)
├── layout/         # MainLayout with sidebar/header
└── app.config.ts   # Root providers (PrimeNG theme, router, HTTP interceptors)
```

### Features (lazy-loaded)
Each feature has its own `*.routes.ts` with exported route constants:
- `auth` �?Login
- `dashboard` �?Dashboard
- `inventario` �?Products, warehouses, categories, brands, UoM, suppliers
- `bancos` �?Bank accounts, movements
- `facturacion` �?Invoices, proformas + **Tienda Virtual** (`/facturacion/tienda`)
- `cxc` �?Accounts receivable (most complete module)
- `cxp` �?Accounts payable
- `planilla` �?Payroll
- `contabilidad` �?Chart of accounts, journal entries
- `configuracion` �?System parameters
- `usuarios` �?Users, roles, permissions
- `parametros` �?System catalogs (currencies, countries, taxes)

### Routing
- All routes behind `authGuard` via `canMatch`
- `MainLayout` wraps all authenticated routes
- Wildcard `**` redirects to dashboard

## Code Conventions

### Angular
- **Zoneless**: Uses `provideZonelessChangeDetection()` �?no Zone.js
- **Signals**: `signal()`, `computed()`, `effect()` only in field initializers (not in constructors)
- **OnPush**: All components use `ChangeDetectionStrategy.OnPush`
- **RxJS**: Always `takeUntilDestroyed(this.destroyRef)` on subscriptions
- **Standalone components** �?no NgModules
- **Component prefix**: `app-`

### UI (PrimeNG + SCSS)
- Use `p-select` for all dropdowns (never `p-dropdown` or native `<select>`)
- Use PrimeNG components: `p-inputText`, `p-inputNumber`, `p-datepicker`, `p-button`
- **Design tokens**: Use `--c-*` from `styles.scss` (e.g., `var(--c-surface)`, `var(--c-primary)`)
- **Forbidden**: PrimeNG native CSS variables (`--surface-card`, `--primary-*`)
- **Forbidden**: Inline `style=""` �?all styles in SCSS
- **Forbidden**: Inline arrays `[{label, value}]` in HTML �?always in TypeScript as `readonly`
- **Forbidden**: `new Date()` in templates
- Grid layout: `p-grid` / `p-col-12 p-col-6` for 2-column forms

### TypeScript
- `strict: false` in tsconfig
- `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns` enabled
- Component schematics: `skipTests: true` by default (no spec files)

### Language
- Code comments and business logic in **Spanish**
- User is the project architect/leader (Spanish-speaking, Honduras)

## Known Issues

| Issue | Fix |
|-------|-----|
| `NG0203: effect()` error | Move `effect()` to field initializer (injection context) |
| `EPERM .angular/cache` on Windows | `npx ng build --clear-cache` or delete `.angular/` |
| PrimeNG Table type errors | Re-run `npm install` to trigger `patch-primeng.js` |
| PrimeNG Select not full-width | Add `.p-select { width: 100% }` in component SCSS |

## Key Files

- `src/app/core/services/api.service.ts` �?HTTP client with automatic `empresaId` injection
- `src/app/core/interceptors/auth.interceptor.ts` �?JWT Bearer token injection
- `src/app/core/interceptors/error.interceptor.ts` �?Global error handling with PrimeNG toasts
- `src/app/core/models/cxc.models.ts` �?CxC TypeScript interfaces
- `src/app/core/models/facturacion.models.ts` �?`MAESTRO_DETALLE` config for generic forms
- `src/styles.scss` �?Global design tokens, fonts (Mukta), utilities
- `src/app/app.config.ts` �?Root providers (PrimeNG theme preset: ArcasPreset with emerald colors)

## Bitácora �?24/08/2026

### Completado
- **CxC Clientes Manager** (`cxc/clientes/clientes-manager.*`): Layout dividido lista/detalle, 5 tabs (Estado de Cuenta, Notas Créd/Déb, Préstamos, Referencias, Parientes)
- **Validación de Notas Crédito/Débito**: Crédito solo a débito existente por `nroreferencia`, saldo por referencia, no exceder. Débito nueva nota, referencia no duplicada
- **Formularios 2 columnas**: Préstamos, Referencias, Parientes en clientes-manager + prestamos-manager (clases compartidas `.prestamo-form-columns`, `.form-col`, `.form-actions`)
- **Prestamos Manager** (`cxc/prestamos/prestamos-manager.*`): Componente dedicado, layout dividido lista/detalle, formulario 2 columnas, French amortization, plan de pago
- **Cajeros movido a Parámetros**: Ruta de `/cxc/cajeros` a `/parametros/cajeros`, menu-config actualizado
- **Backend fixes**: `cxcprestamo.entity.ts` nroprestamo varchar(50), `cxc.dto.ts` sn_contabilizado string, `cxccclientesref.entity.ts` columnas nullable
- **AGENTS.md** creado con contexto del proyecto

### Pendiente para mañana (25/08/2026)
- **Balance de Antigüedad de Saldos**: Vista/resumen de saldos por antigüedad (30, 60, 90+ días) �?**completado (ya existía y compila)**
- **Cartas de Recordatorio de Cobro**: Generación de cartas de vencimiento a 30, 60 y 90 días �?**completado (fix build: TooltipModule + campo corriente)**
- Posible ruta en `cxc/` o como consulta
 
## Bitácora �?25/08/2026
 
### Completado
- **Fix build CXC Cartas Recordatorio** (`cxc/cartas-recordatorio/cartas-recordatorio.ts`):
  - Agregado `TooltipModule` a imports (faltaba para `pTooltip` en template)
  - Agregado campo `corriente` a interfaz `ClienteSaldo` e inicialización en `procesarDatos()`
  - Build de producción compila sin errores
- **Verificación Antigüedad Saldos** (`cxc/antiguedad-saldos/antiguedad-saldos.ts`): ya incluía `corriente` en interfaz y lógica; sin cambios

## Bitácora �?26/08/2026

### Completado
- **Documentos pendientes por cliente** (`cxc.service.ts` backend `findDocumentosPendientesCliente`):
  - Fix agrupación: key cambiada de `moduloId-documentoId` a `moduloId-nroreferencia` para separar documentos distintos del mismo cliente
  - Lógica corregida: 1ra pasada acumula débitos (D), 2da pasada resta créditos (C) por `nroreferencia`
  - Resultado: Juan (clienteId=1) ahora devuelve 2 docs correctos (Factura ref 145 saldo 600 + NDB ref 147 saldo 200)
- **Caja detalle: cajaId automático** (`cxc.service.ts` backend `createCajaDet`):
  - Busca cajero por `usuario` + `empresaId` en `cxccajeros` y asigna `cajaId` al detalle
- **Caja detalle: clienteId/nrocliente desde maestro** (`cxc.service.ts` backend `createCajaDet`):
  - Inyecta `clienteId` y `nrocliente` desde `cajaMae` padre (campos NOT NULL en `cxccajadet`)
- **Caja movimiento: tipomov corregido** (`cxc.service.ts` backend):
  - `generarMovimientoDesdeCaja` y `generarMovimientoDesdeCajaDet`: tipomov cambiado de `'A'` a `'C'` (enum solo acepta 'D'/'C')
- **Prueba de fuego caja** (Juan Carlos, clienteId=1):
  - �?Header (caja-mae) se registra correctamente
  - �?Detalle (caja-det) con 2 formas de pago se registra correctamente
  - �?Movimientos en cxcmovimientos: registrados correctamente tras fixes
- **Caja movimiento: fix FK documentoId** (`cxc.service.ts` backend):
  - `documentoId` cambiado de `caja.cxccajaId` a `caja.documentoId` (FK a `tcotipodocumentofiscal`, no a caja)
  - `moduloId` cambiado de `3` a `4` (CXC es módulo 4)
- **Caja: limpiar formulario tras guardar** (`maestro-detalle-form.ts`):
  - `finalizar()` resetea form, detalles, documentos pendientes en vez de navegar fuera

### Pendiente
- El frontend envía `sn_doc_anulado` pero la entidad tiene `sn_anulado` (nombres distintos, default 'S' en vez de 'N')
- Forma de pago con tarjeta de crédito: Validar que campos tarjeta se activen/desactiven correctamente

---

## Frontend Architecture �?Detalle

### Estructura de directorios

```
src/app/
├── app.config.ts              # Root providers: PrimeNG theme, router, HTTP, zoneless
├── app.routes.ts              # Lazy-loaded feature routes
├── core/
�?  ├── guards/                # authGuard (canMatch)
�?  ├── interceptors/          # auth.interceptor.ts, error.interceptor.ts
�?  ├── models/                # TypeScript interfaces per module
�?  �?  ├── auth.models.ts
�?  �?  ├── bancos.models.ts
�?  �?  ├── contabilidad.models.ts
�?  �?  ├── cxc.models.ts      # CxC interfaces (Cliente, Movimiento, CajaMae, CajaDet, etc.)
�?  �?  ├── cxp.models.ts
�?  �?  ├── facturacion.models.ts  # MAESTRO_DETALLE config for generic forms
�?  �?  ├── inventario.models.ts
�?  �?  ├── parametros.models.ts
�?  �?  └── planilla.models.ts
�?  ├── services/
�?  �?  ├── api.service.ts     # HTTP base, auto-injects empresaId + Idsucursal
�?  �?  ├── auth.service.ts    # Login, JWT storage, currentUser
�?  �?  ├── cxc.service.ts     # CxC API calls
�?  �?  ├── menu-config.ts     # Sidebar menu definition
�?  �?  └── [module].service.ts # One service per module
�?  └── utils/                 # Helpers, formateo, fechas
├── features/
�?  ├── auth/                  # Login
�?  ├── dashboard/             # Dashboard
�?  ├── inventario/            # Productos, bodegas, categorías, etc.
�?  ├── bancos/                # Cuentas bancarias
�?  ├── facturacion/           # Facturación + genérico maestro-detalle
�?  ├── cxc/                   # Cuentas por cobrar (más completo)
�?  ├── cxp/                   # Cuentas por pagar
�?  ├── contabilidad/          # Plan de cuentas, comprobantes
�?  ├── planilla/              # Empleados, planillas
�?  ├── configuracion/         # Parámetros del sistema
�?  ├── usuarios/              # Usuarios, roles, permisos
�?  └── parametros/            # Catálogos (monedas, países, impuestos, etc.)
└── layout/
    ├── main-layout/           # Shell: sidebar + header + router-outlet
    └── auth-layout/           # Login layout
```

### Feature structure (cada feature)

```
features/cxc/
├── cxc.routes.ts              # Rutas lazy-loaded
├── clientes/
�?  ├── clientes-manager.ts    # Componente contenedor (lista + detalle)
�?  ├── clientes-manager.html
�?  ├── clientes-manager.scss
�?  ├── cliente-form.ts        # Formulario de cliente
�?  ├── cliente-form.html
�?  ├── cliente-form.scss
�?  ├── cliente-list.ts        # Lista de clientes
�?  └── cliente-list.html
├── caja/
�?  ├── caja-manager.ts
�?  ├── caja-form.ts
�?  └── ...
├── prestamos/
�?  ├── prestamos-manager.ts
�?  └── ...
├── antiguedad-saldos/
├── cartas-recordatorio/
└── ...
```

### Componentes genéricos reutilizables

| Componente | Ubicación | Uso |
|------------|-----------|-----|
| `MaestroDetalleFormComponent` | `facturacion/maestro-detalle/` | Formularios header+detalle (Caja, Facturas, Compras) |
| `ClienteFormComponent` | `cxc/clientes/` | Formulario de cliente (2 columnas) |
| `ClientesManagerComponent` | `cxc/clientes/` | Contenedor lista/detalle con tabs |

### Shared SCSS classes (formularios 2 columnas)

```scss
.prestamo-form-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 0 2rem; }
.form-col { display: flex; flex-direction: column; gap: 1rem; }
.form-actions { display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1rem; }
```

Uso en HTML:
```html
<div class="prestamo-form-columns">
  <div class="form-col">...campos columna 1...</div>
  <div class="form-col">...campos columna 2...</div>
</div>
```

### ApiService �?inyección automática

```typescript
// Rutas CON empresaId + Idsucursal (auto-inyectados)
static CON_SUCURSAL = [
  'clientes', 'clientes-dir', 'clientes-tel', 'clientes-ref',
  'cajeros', 'caja-mae', 'caja-det', 'movimientos', 'historico',
  'saldo-favor', 'dias-cobro', 'parientes', 'prestamos', 'prestamo-pp',
  'bancos', 'cuentas', 'conciliaciones', 'direcciones', 'telefonos',
  'ctas-contables', 'saldos-cta', 'cierres-tabla', ...
]

// Rutas SOLO con empresaId
static SOLO_EMPRESA = ['clientes-con-saldo', 'documentos-pendientes', 'antiguedad-saldos']
```

- GET/DELETE: `empresaId` + `Idsucursal` se inyectan como **query params**
- POST/PUT: se inyectan en el **body**

### Frontend Services �?Referencia rápida

| Service | Archivo | Métodos | Endpoint backend |
|---------|---------|---------|------------------|
| `ApiService` | `api.service.ts` | `get`, `getOne`, `post`, `put`, `putBase`, `delete` | Base HTTP con inyección automática de `empresaId`/`Idsucursal` |
| `AuthService` | `auth.service.ts` | `login`, `loginRaw`, `checkStatus`, `logout` | `/auth/login` |
| `MenuConfigService` | `menu-config.service.ts` | `getMenuItems` | Sin HTTP (lee menú por rol) |
| `NavegacionService` | `navegacion.service.ts` | `volver(fallback)` | Sin HTTP �?`Location.back()` con fallback |
| `CxcService` | `cxc.service.ts` | 24 métodos | `/cxc/*` (clientes, caja, movimientos, préstamos, etc.) |
| `CxpService` | `cxp.service.ts` | 10 métodos | `/cxp/*` (proveedores, compras, movimientos) |
| `FacturacionService` | `facturacion.service.ts` | 7 métodos | Genérico �?recibe `ruta` como parámetro |
| `PlanillaService` | `planilla.service.ts` | 4 métodos | `/planilla/empleados` |
| `CatalogoParametrosService` | `catalogo-parametros.service.ts` | 4 métodos | Genérico �?recibe `ruta` como parámetro |
| `SettingsService` | `settings.service.ts` | 2 métodos | Genérico �?`get(ruta)`, `upsert(ruta, payload)` |
| `UsuariosService` | `usuarios.service.ts` | 5 métodos | `/users` |
| `UsuariosModuleService` | `usuarios-module.service.ts` | 5 métodos | `/users/modules` |
| `UsuariosScriptsService` | `usuarios-scripts.service.ts` | 5 métodos | `/users/scripts` |
| `UsuariosMnuItemService` | `usuarios-mnuitem.service.ts` | 5 métodos | `/users/menu-items` |
| `UsuarioModAuthService` | `usuario-modauth.service.ts` | 5 métodos | `/users/mod-auth` |
| `ModulosService` | `modulos.service.ts` | 5 métodos | `/modulos` |
| `EmpresasService` | `empresas.service.ts` | 4 métodos | `/companies` |
| `SucursalesService` | `sucursales.service.ts` | 1 método | `/sucursales` |
| `ProductosService` | `productos.service.ts` | 4 métodos | `/inventario/productos` |
| `BodegasService` | `bodegas.service.ts` | 4 métodos | `/inventario/bodegas` |
| `CategoriasService` | `categorias.service.ts` | 4 métodos | `/inventario/categorias` |
| `MarcasService` | `marcas.service.ts` | 4 métodos | `/inventario/marcas` |
| `ModelosService` | `modelos.service.ts` | 4 métodos | `/inventario/modelos` |
| `ColoresService` | `colores.service.ts` | 4 métodos | `/inventario/colores` |
| `UnidadesMedidaService` | `unidades-medida.service.ts` | 4 métodos | `/inventario/unidades-medida` |
| `EmbalajesService` | `embalajes.service.ts` | 4 métodos | `/inventario/embalajes` |
| `ProveedoresService` | `proveedores.service.ts` | 4 métodos | `/inventario/proveedores` |
| `UbicacionesService` | `ubicaciones.service.ts` | 4 métodos | `/inventario/ubicaciones` |
| `PasillosService` | `pasillos.service.ts` | 4 métodos | `/inventario/pasillos` |
| `CasasService` | `casas.service.ts` | 4 métodos | `/inventario/casas` |
| `TestantesService` | `testantes.service.ts` | 4 métodos | `/inventario/testantes` |
| `TagsService` | `tags.service.ts` | 4 métodos | `/inventario/tags` |
| `ExistenciasService` | `existencias.service.ts` | 2 métodos | `/inventario/existencias` (solo lectura) |
| `KardexService` | `kardex.service.ts` | 2 métodos | `/inventario/kardex` (solo lectura) |

### Swagger Backend

- **URL**: `http://localhost:3000/api/docs`
- **Auth**: Bearer token (JWT)
- **Tags**: Auth, Usuarios, Módulos, Empresas, Sucursales, Parámetros, Inventario, Facturación, CxC, CxP, Bancos, Contabilidad, Planilla
- Todos los controllers, DTOs y entidades decorados con `@ApiTags`, `@ApiOperation`, `@ApiProperty`

### CxC �?Componentes y flujo

#### Clientes Manager (`cxc/clientes/`)
- **Layout dividido**: lista oculta cuando formulario activo, con botón "�?Volver al listado"
- **5 tabs**: Estado de Cuenta, Notas Créd/Déb, Préstamos, Referencias, Parientes
- **Formulario 2 columnas**: Datos Personales + Clasificación y Crédito

#### Caja (`facturacion/maestro-detalle/`)
- **Componente genérico**: `MaestroDetalleFormComponent` reutilizado para Caja, Facturas, Compras
- **Config**: `MAESTRO_DETALLE.caja` en `facturacion.models.ts`
- **Flujo**: Seleccionar cliente �?Ver docs pendientes �?Agregar formas de pago �?Guardar
- **Guardado secuencial**: Primero maestro (`caja-mae`), luego detalles (`caja-det`)
- **Reset**: `finalizar()` limpia formulario + detalles en vez de navegar

#### Antigüedad de Saldos (`cxc/antiguedad-saldos/`)
- Muestra saldos por cliente agrupados por antigüedad: corriente, 30, 60, 90+ días
- Incluye dirección y teléfono del cliente

#### Cartas de Recordatorio (`cxc/cartas-recordatorio/`)
- Genera cartas de cobro a 30, 60 y 90 días de vencimiento
- Muestra detalles de contacto (dirección, teléfono)

### CxC Models (`cxc.models.ts`)

Interfaces principales:
- `Cliente`, `ClienteDireccion`, `ClienteTelefono`, `ClienteReferencia`
- `Cajero`, `CajaMae`, `CajaDet`
- `Movimiento` (tipomov: `'D'` | `'C'`, moduloId: number, documentoId: number)
- `Prestamo`, `PrestamoPP`
- `Pariente`
- `ClienteSaldo` (para antigüedad: corriente, 30d, 60d, 90d)
- `DocumentoPendiente` (para docs con saldo por cliente)

### Design tokens (`styles.scss`)

```scss
:root {
  --c-primary: #10b981;      /* Emerald */
  --c-primary-hover: #059669;
  --c-surface: #ffffff;
  --c-surface-ground: #f8fafc;
  --c-text: #1e293b;
  --c-text-muted: #64748b;
  --c-border: #e2e8f0;
  --c-error: #ef4444;
  --c-success: #10b981;
  --c-warning: #f59e0b;
}
```

**Regla**: Usar `var(--c-*)` en SCSS. Nunca usar variables CSS nativas de PrimeNG (`--surface-card`, `--primary-*`).

---

## Pendientes conocidos

- El frontend envía `sn_doc_anulado` pero la entidad tiene `sn_anulado` (nombres distintos, default 'S' en vez de 'N')
- Forma de pago con tarjeta de crédito: Validar que campos tarjeta se activen/desactiven correctamente

---

## Lessons Learned (Reference rápida)

### Siempre verificar FK constraints antes de hardcodear IDs
- `clienteId: 0` en `posfacmae` causó 500 �?FK a `cxcclientes` exige cliente real
- `documentoId` en `cxcmovimientos` debe ser `tipodocumentofiscalId` (1-5), no `facturaId`
- Solución: buscar/crear registro genérico ("TIENDA") y usar su ID real

### TypeORM decimals = strings
- MySQL lee `decimal(20,2)` como `'100.00'` (string), TypeORM no detecta cambio string→number
- Fix: `createQueryBuilder().update().set()` en vez de `repository.update()`

### ValidationPipe whitelist: true
- DTOs definen qué campos aceptan. Si el frontend envía un campo extra, se descarta silenciosamente
- Si un campo "desaparece", revisar que esté en el DTO con `@IsOptional()` si no es requerido

### Backend restart pattern
- `taskkill /PID` + `Start-Process node dist/main.js` con `-RedirectStandardError` para ver errores
- Logs a archivo: `backend-error.log`, `backend-out.log`
- `nest build` compila TS a JS en `dist/`, el backend corre `dist/main.js`

### MySQL CLI problem
- `mysql.exe` en esta máquina tiene launcher interactivo (localhost/aiven.io/Salir)
- Usar siempre `Invoke-RestMethod` o `Invoke-WebRequest` desde PowerShell para queries
- Login: `POST /api/auth/login` con `{"usuario":"admin","password":"admin123"}`

### PrimeNG v21+ Tabs: value, no activeIndex
- `p-tabs` usa `value`/`valueChange` (ModelSignal), NO `activeIndex`/`activeIndexChange`
- `activeIndex` no existe en PrimeNG v21+ `p-tabs` — usar `[value]` y `(valueChange)`
- El tipo de signal debe ser `string` (no `number`) porque `p-tab value="0"` es string
- Fix: `activeTabValue = signal<string>('0')` + `.set('0')` en vez de `.set(0)`

### effect() necesita injection context
- `effect()` dentro de `ngOnInit()` NO funciona — no está en contexto de inyección
- Fix: mover a initializer de campo con `{ injector: this.injector }`:
  ```typescript
  private injector = inject(Injector);
  private _effect = effect(() => { ... }, { injector: this.injector });
  ```

### Angular input() signal change detection
- `input()` retorna `undefined` (no `null`) cuando no se pasa valor
- `ngOnInit()` solo corre una vez — no detecta cambios posteriores
- Fix: usar `effect()` en initializer de campo para reaccionar a cambios del input signal

### Tienda Virtual �?Arquitectura
- **Carrito**: `poscotmae` (header) + `poscotdet` (items) �?misma estructura que cotizaciones
- **Checkout**: Convierte carrito en `posfacmae` + `posfacdet` + `posfaccaja` + kardex
- **Cliente genérico**: `nrocliente: 'TIENDA'` en `cxcclientes` (creado on-demand)
- **Kardex**: Se procesa automáticamente después de crear factura (try/catch para no bloquear)
- **Estado carrito**: `'A'`=Activo, `'F'`=Facturado, `'X'`=Anulado
- **Formaspago**: `GET /parametros/formas-pago?empresaId=X` �?`ttipoformapago`
- **Tarjetas**: `GET /parametros/tarjetas-credito?empresaId=X` �?`ttipotarjetacredito`
- **Luhn**: Validación de tarjeta en frontend antes de enviar al backend

### Bitácora consolidada (resumen por fecha)

## Bitácora �?27/08/2026

### Completado

#### Backend �?Kardex: Fix actualización de existencias
- **Causa raíz**: `actualizarExistencia()` en `kardex.service.ts` usaba `repository.update()` de TypeORM. Las columnas decimal de MySQL se leen como strings (`'100.00'`). TypeORM no reconocía el cambio string→number y el UPDATE se omitía silenciosamente.
- **Causa 2**: `usuarioUpdated` usaba `'SYSTEM'` que no existe en `tusuarios`. FK constraint `fk_update_invexistencias_usuario` rechazaba el UPDATE.
- **Corrección**: Reemplazado con `createQueryBuilder().update().set().where().execute()` (bypass de change detection) + se pasa `usuarioCreated` del DTO como `usuarioUpdated`.
- **Archivo**: `Backend/src/modules/inventario/kardex.service.ts` �?método `actualizarExistencia()`

#### Frontend �?Facturación: Mejoras operativas

**1. Permanecer en nueva-factura después de facturar**
- Antes: `this.salir()` navegaba a `/facturacion/facturas`
- Ahora: `this.nueva()` resetea el formulario y queda en la misma página
- Botón "volver" en HTML sigue funcionando para salida manual

**2. Formas de pago: pre-cargar todas las opciones**
- `inicializarPagos()` crea una fila por cada forma de pago del catálogo con `importe: 0`
- Se llama al cargar `formaspago` desde API y en `nueva()`
- Se quitó botón "Agregar pago" del dialog
- `pagosConImporte()` filtra solo filas con `importe > 0`
- Solo se envían al backend las formas de pago con importe

**3. Panel de pendiente y cambio**
- `pendiente()` calcula `Total Factura - Total Pagos`
- Se muestra en panel lateral y footer del dialog de pagos
- Desaparece cuando se paga completo
- "Cambio" solo se muestra cuando `Total Pagos > Total Factura`

**4. Facturación contado vs crédito**
- **Contado** (`tipofactura === 'E'`): Pide formas de pago, valida que totalPagos >= totalFactura. Si falta, muestra error con monto pendiente.
- **Crédito** (`tipofactura === 'C'`): No pide formas de pago, factura directo. El backend ya crea movimiento en `cxcmovimientos` automáticamente (`generarMovimientoDesdeFactura`).
- Botón "Facturar" directo en toolbar para crédito, botón "Pagar" para contado
- `sn_pagada = 'N'` para crédito, `'S'` para contado
- `efectivo_recibido = 0` e `importe_cambio = 0` para crédito

**5. Validación tarjeta de crédito**
- Si un pago con importe es tarjeta (`esTarjeta()`), `nrotarjeta` y `nroautorizacion` son obligatorios
- Validación antes de enviar al backend

**6. Cerrar dialog de pagos después de facturar**
- `nueva()` llama `this.dialogPagos.set(false)` antes de resetear

**Archivos modificados**:
- `Frontend/src/app/features/facturacion/nueva-factura/nueva-factura.ts` �?Lógica de facturación, pagos, validaciones
- `Frontend/src/app/features/facturacion/nueva-factura/nueva-factura.html` �?Toolbar, dialog pagos, panel lateral
- `Frontend/src/app/features/facturacion/nueva-factura/nueva-factura.scss` �?Clase `.pendiente-line`

### Pendiente
- Verificar que `cxcmovimientos` se cree correctamente al facturar de crédito

#### Backend �?Fix CxC: Movimiento desde factura de crédito
- **Causa raíz**: `generarMovimientoDesdeFactura()` usaba `factura.facturaId` (PK autoincrement de posfacmae) como `documentoId` en `cxcmovimientos`. La FK `fk_cxcmovimientos_tcotipodocumentofiscal` espera un `tipodocumentofiscalId` (valores 1-5). Valores >5 causan constraint violation �?error tragado silenciosamente por try/catch.
- **Fix**: `documentoId: 1` (FAC) en vez de `factura.facturaId`
- **Fix adicional**: `anularMovimientoFactura()` y `anularCajaPorFactura()` también usaban `facturaId` como `documentoId` �?corregidos para buscar por `nroreferencia` / `nrodocumento`
- **Archivos**: `cxc.service.ts`, `facturacion.service.ts`

#### Backend �?Fix defaults en entidades CxC
- `cxccajamae.entity.ts`: `sn_cotabilizada` y `sn_anulado` cambiados de `default: 'S'` a `default: 'N'`
- `cxccajadet.entity.ts`: `sn_anulado` cambiado de `default: 'S'` a `default: 'N'`
- **Frontend**: `facturacion.models.ts` �?`sn_doc_anulado` renombrado a `sn_anulado` para coincidir con la entidad

#### Backend �?Ticket de factura (impresión térmica)
- **Nuevo endpoint**: `GET /facturacion/facturas/:id/ticket` �?devuelve factura, detalles (con descripción de productos), pagos, empresa (nombre, RTN, tel, dir, mensajes)
- **Entidad nueva**: `companies/entities/empresasdet.entity.ts` �?`tempresasdet` (RTN, dirección, teléfono, correo, etc.)
- **Módulo**: `facturacion.module.ts` �?repos `Tempresas`, `TempresasDet`, `TtipoParamFac`, `Tproducto` inyectados

#### Backend �?CRUD tempresasdet
- **DTO**: `companies/dto/empresasdet.dto.ts` �?Create/Update
- **Service**: `companies.service.ts` �?`findAllDet`, `findOneDet`, `createDet`, `updateDet`, `removeDet`
- **Controller**: `companies.controller.ts` �?`GET/POST/PUT/DELETE /companies/det`
- **Module**: `companies.module.ts` �?repo `TempresasDet` agregado

#### Frontend �?Impresión de ticket térmico
- **Lógica**: `nueva-factura.ts`
  - `snImprimeFactura` se carga de `param-fac` en `cargarParamFac()`
  - `imprimirTicket()` �?llama `GET /facturas/:id/ticket`, genera HTML
  - `abrirTicket()` �?CSS optimizado 80mm, `window.open()` + `window.print()`
  - En `procesarKardexYFinalizar()`: si `snImprimeFactura`, imprime antes de `nueva()`
- **Ticket incluye**: Nombre empresa, RTN, dirección, teléfono, factura #, fecha, hora, cliente, condición, líneas (cant x desc = total), subtotal, descuento, ISV, total, pagos, efectivo, cambio, mensaje devolución, mensaje factura, "Gracias por su compra"

#### Frontend �?CRUD tempresasdet (UI)
- **Service**: `empresas.service.ts` �?`getAllDet`, `createDet`, `updateDet`, `removeDet`
- **Model**: `empresa.models.ts` �?interfaz `EmpresaDet`
- **Component**: `empresa-form.ts/html` �?Tabla "Datos fiscales y contacto" con dialog para agregar/editar/eliminar
- **Ubicación**: Configuración �?Empresas �?Editar

### Pendiente
- Verificar que `cxcmovimientos` se cree correctamente al facturar de crédito (ya corregido, pendiente re-test completo)

## Bitácora �?28/08/2026

### Completado

#### Frontend �?nueva-factura: Mejoras visuales

**1. Tabla de productos: celda producto**
- Reemplazado `<br />` por `<span class="cod-barra">` + `<span class="desc-linea">` con `display: block`
- Clase `.cell-producto` con `line-height: 1` y `margin-bottom: -2px` para compactar filas
- Tags `p-tag` con `styleClass="tag-sm"` (font-size 0.7rem, padding reducido)

**2. Padding reducido en tabla**
- `::ng-deep .p-datatable-tbody > tr > td`: padding 0.25rem 0.75rem
- `::ng-deep .p-datatable-thead > tr > th`: padding 0.4rem 0.75rem

**3. Botón agregar cliente alineado**
- Clase `.btn-add-cliente` con `margin-top: 1.42rem` para alinear con el select de cliente (compensa altura del label)

**4. Totales: layout 2 columnas**
- Botones (Nueva/Facturar|Pagar/Salir) movidos del toolbar `col-right` a la card `nf-totales`
- Layout: columna izquierda 30% (botones) + columna derecha `flex: 1` (totales)
- Totales en `display: grid; grid-template-columns: repeat(4, 1fr)` �?Subtotal, Impuesto, Descuento, Gran Total en fila única
- Padding reducido a 0.2rem en ambas columnas

**5. Resumen de Pago: línea única**
- Total Factura, Total Pagos, Pendiente y Cambio en `display: flex; gap: 0.5rem`
- Sin borde ni fondo (`.pago-block` reseteado), ocupa 100% del ancho

**6. Placeholder de imagen: icono**
- Reemplazado `<img [src]="... || placeholder">` por `@if (row.imagenUrl) { img } @else { <i class="pi pi-images" style="color: slateblue"> }`

**7. Campo Nro. Carnet: condicional**
- Solo visible si tiene valor Y `sn_excenta === 'S'`
- Se vuelve requerido (`Validators.required`) cuando `sn_excenta` es `'S'` (en `recalcularExenta()`)

#### Frontend �?Cliente rápido desde Facturación

**1. NavegacionService** (`core/services/navegacion.service.ts`)
- `volver(fallback)`: usa `Location.back()` si hay historial, si no navega al fallback
- Utilizado en `cliente-form.ts` para cancelar/guardar

**2. cliente-form.ts: modo facturación**
- Nuevo signal `modoFacturacion`, detecta query param `?modo=facturacion`
- Campos requeridos dinámicos: solo nombres, apellidos, dni, sexo, fecha nacimiento
- `cancelar()` y `guardar()` usan `NavegacionService.volver()` para volver al origen
- **Bug fix**: `input()` retorna `undefined` (no `null`) cuando se usa vía ruta �?corregido con `!= null`

**3. cliente-form.html: campos ocultos en modo facturación**
- Ocultos: nrocliente, razonsocial, rtn, estado civil, categoría, crédito, plazo, interés, moratorio, sn_activo
- Solo se muestra una columna con: Nombres, Apellidos, DNI, Sexo, Fecha nacimiento
- Botón "Cancelar" en vez de "Limpiar"

**4. nueva-factura.ts: navegación a cliente**
- `abrirNuevoCliente()` navega con `queryParams: { modo: 'facturacion' }`

#### Backend �?Cliente rápido: auto-generación de campos

**1. cxc.module.ts**: Agregado `TtipoParamCxc` a `TypeOrmModule.forFeature`

**2. cxc.service.ts �?createCliente mejorado**
- Lee parámetros de `ttipoparamcxc` (interés, mora, días plazo, límite crédito)
- Auto-genera `nrocliente` (incrementa contador en params)
- Deriva `razonsocial` de nombres + apellidos
- Default `fecharegistro` y `fechanacimiento` a fecha actual
- `dni` default `'0000000000000'` si vacío (NOT NULL en entity)
- Try-catch en lectura de params para resiliencia

**3. dto/cxc.dto.ts �?campos flexibilizados**
- `nrocliente`, `razonsocial`, `fecharegistro`, `fechanacimiento`, `dni`, `diasplazo`, `interes`, `moratorio` cambiados a `@IsOptional()`
- Se eliminó `@IsDateString()` de fechas (accepta Date objects del datepicker)

**Archivos modificados**:
- `Frontend/src/app/features/facturacion/nueva-factura/nueva-factura.ts` �?Botón cliente con query param
- `Frontend/src/app/features/facturacion/nueva-factura/nueva-factura.html` �?Celda producto, totales layout, resumen pago
- `Frontend/src/app/features/facturacion/nueva-factura/nueva-factura.scss` �?.cell-producto, .tag-sm, .btn-add-cliente, .nf-totales-split, .pago-resumen-inline, .pago-block reset
- `Frontend/src/app/features/cxc/clientes/cliente-form.ts` �?Modo facturación, NavegacionService, bug fix !=
- `Frontend/src/app/features/cxc/clientes/cliente-form.html` �?Campos condicionales por modo
- `Frontend/src/app/core/services/navegacion.service.ts` �?Nuevo servicio
- `Backend/src/modules/cxc/cxc.module.ts` �?Import TtipoParamCxc
- `Backend/src/modules/cxc/cxc.service.ts` �?createCliente con auto-generación
- `Backend/src/modules/cxc/dto/cxc.dto.ts` �?@IsOptional en campos flexibles

#### Tienda Virtual �?Fix checkout 500 (FK constraint)
- **Causa raíz**: `posfacmae` tiene FK `fk_posfacmae_cxcclientes` �?`cxcclientes.clienteId`. El checkout enviaba `clienteId: 0` (no existe).
- **Fix**: En `checkoutTienda()`, antes de crear la factura, se busca/crea un cliente genérico con `nrocliente: 'TIENDA'` en `cxcclientes` y se usa su `clienteId` real.
- **Archivo**: `Backend/src/modules/facturacion/facturacion.service.ts` �?método `checkoutTienda()`
- **Test**: Checkout exitoso �?`facturaId: 31, nrofactura: 35, total: L 62.00`. Kardex también verificado OK.

#### Frontend �?Tienda Virtual: Responsive Mobile (�?68px)

**Sidebar carrito: overlay volador**
- Oculto en mobile por defecto, se muestra con `transform: translateX(0)` al abrir
- Overlay oscuro z-index: 999, sidebar z-index: 1000
- `carritoOpen` signal para controlar estado, botón "×" en header solo visible en mobile
- Ancho: `min(380px, 85vw)`, transición `cubic-bezier(0.32, 0.72, 0, 1)`

**Botón flotante carrito (FAB)**
- `position: fixed; bottom: 1.5rem; right: 1.5rem`, z-index: 1001
- Gradiente verde, badge rojo con count de items
- Animación pulse en el badge

**Toolbar mobile apilado**
- `flex-direction: column`, buscador/categoría/ordenamiento en `flex: 1`
- `view-toggles` ocultos en mobile (`.desktop-only`)

**Productos mobile: formato fila**
- Grid: `grid-template-columns: 1fr` (1 sola columna)
- Cards: imagen 100x100 a la izquierda, info a la derecha (layout flex row)
- Lista: imagen 48x48, stock oculto, precio compacto

**Checkout mobile**
- Dialog: `width: 95vw`, `margin: 1rem`
- Layout: 1 sola columna (form + summary apilados)

**Archivos modificados**:
- `Frontend/src/app/features/facturacion/tienda/tienda-virtual.ts` �?`carritoOpen` signal, `isMobile()` method
- `Frontend/src/app/features/facturacion/tienda/tienda-virtual.html` �?Overlay, FAB button, checkout mobile, markup responsive
- `Frontend/src/app/features/facturacion/tienda/tienda-virtual.scss` �?Media queries `@media (max-width: 768px)`, overlay, FAB, toolbar apilado, grid/list mobile

### Pendiente
- Verificar que `cxcmovimientos` se cree correctamente al facturar de crédito (ya corregido, pendiente re-test completo)

## Bitácora �?29/08/2026

### Completado

#### Anular Factura (`/facturacion/facturas-anul`)
- **Componente nuevo** `AnularFacturas` (`anular-facturas/`): tabla Poseidon, 9 columnas, acciones Ver + Anular
- **Dialogo confirmacion**: pregunta antes de anular, muestra cliente/total/tipo
- **Validaciones backend** (`facturacion.service.ts createFacturaAnul`):
  - `sn_anulada === 'S'` �?400 "La factura ya esta anulada"
  - `sn_contabilizada === 'S'` �?400 "La factura esta contabilizada y no se puede anular"
  - Credito + abonos (`posfaccaja.find`) �?400 "La factura es al credito y tiene abonos registrados"
- **Reversa automatica**: kardex (entrada), existencias, movimientos CxC, caja

#### Tienda Virtual �?Cache + Optimizacion
- **TiendaService**: `shareReplay(1)` in-memory + `localStorage` TTL 5 min, `invalidateCache()` post-checkout
- **Componente**: `trackBy` en `@for`, `loading="lazy"` en imagenes, `content-visibility: auto` en cards, `imagenCache` Map

#### CxP Movimientos (`/cxp/movimientos`)
- **Componente nuevo** `CxPMovimientosManager`: replica de CxC Movimientos para proveedores
- **Backend**: `GET /cxp/proveedores-pag` (paginado), `GET /cxp/movimientos/proveedor/:id`, `POST /cxp/movimientos`
- **Frontend service**: `getProveedoresPag()`, `getMovimientosByProveedor()`, `createMovimiento()`

#### Estandarizacion formularios proveedores
- CxP `proveedor-form.scss`: SCSS completo de Inventario (grid 2 columnas)
- CxP `proveedor-form.html`: orden RTN→DNI alineado con Inventario

#### Fix encoding
- `cotizaciones-form.html`: re-guardado con UTF-8 correcto

#### p-size="small" global
- ~50 archivos HTML: `pInputText`, `p-inputNumber`, `p-select`, `p-selectbutton` con `pSize="small"` / `size="small"`

### Pendiente
- Verificar CxP movimientos end-to-end en browser
- CxC movimientos: posibles ajustes de UX pendientes

---

## Bitácora �?29/08/2026 (tarde)

### Completado

#### Facturación �?Cliente TIENDA automático (contado)
- **Regla negocio**: `snNombreOptions='N'` + contado �?select cliente TIENDA, solo lectura; `snNombreOptions='S'` + contado �?clienteId=TIENDA + input para nombre del cliente
- **TS**: `nombreClienteManual` signal, `getClienteTienda()` busca `nrocliente='TIENDA'`, `onTipoFacturaChange()` setea cliente automáticamente, `esContado()` helper
- **HTML**: `p-select [disabled]="esContado()"`, input nombre visible solo si `esContado() && snNombreOptions==='S'`
- **facturar()**: usa `nombreClienteManual()` cuando `tipofactura='E'` y `snNombreOptions='S'`, validación de nombre requerido
- **cargarOpciones()**: llama `onTipoFacturaChange()` al cargar clientes

#### Facturación �?Atajos de teclado (shortcuts)
- **HostListener** `document:keydown` con shortcuts:
  - ESC: cancelar factura / cerrar dialog pagos
  - ALT+1: buscar producto (DynamicDialog)
  - ALT+2: focus select cliente
  - ALT+3: suspender venta (localStorage)
  - ALT+4: ver ventas suspendidas
  - ALT+5/6: abrir dialog pagos
  - ALT+7: pago+completar (contado→dialog, crédito→facturar directo)
  - ALT+8: finalizar sin pago
  - ALT+9: ventana de atajos
- **Ventas suspendidas**: `suspenderVenta()` guarda en `localStorage`, `cargarVentasSuspendidas()` muestra dialog, `restaurarVenta()` carga, `eliminarVentaSuspendida()` borra
- **Dialog atajos**: tabla con tecla+acción, `dialogAtajos` signal
- **Dialog ventas suspendidas**: `dialogSuspendidas` signal (fix: antes usaba `[visible]="ventasSuspendidas().length > 0"` que no cerraba correctamente)

#### Facturación �?Zoom imagen producto
- **Hover** sobre imagen en tabla �?overlay `position: fixed` con imagen 250x250
- **TS**: `onImgHover()`, `onImgMove()`, `onImgLeave()` �?signals `zoomVisible`, `zoomUrl`, `zoomX`, `zoomY`
- **HTML**: `<img class="img-zoom-overlay">` al final del template, solo visible con `@if (zoomVisible())`
- **SCSS**: `.img-zoom-overlay` con `position: fixed`, `z-index: 9999`, `pointer-events: none`

#### Tooltips en botones de factura
- Botones Nueva/Facturar/Pagar muestran shortcut (ESC, ALT+8, ALT+6)
- Botón producto muestra ALT+1
- Botón cliente muestra ALT+2

#### ProductosHelperList �?Filtros de columna
- `p-columnFilter` con `type="text"` en columnas codbarra y descripcion
- `[filters]` object con `FilterMatchMode.CONTAINS`
- Imports: `FormsModule`, `InputTextModule`
- Paginador habilitado
- **Fix duplicación**: eliminado `<p-button>` del body template �?el click en `<tr>` + click en button ambos llamaban `selectProduct()` �?`ref.close()` emitía 2 veces �?producto duplicado

#### PrimeNG �?filterMatchModeOptions global
- **app.config.ts**: `providePrimeNG({ filterMatchModeOptions: { text, numeric, date } })`
- Import `FilterMatchMode` de `primeng/api`
- Habilita filtros de columna en todas las `p-table` del proyecto

### Pendiente
- Verificar ProductosHelperList con `pTemplate` en DynamicDialog (posible factory error con `p-button` inside templates)
- Verificar ventas suspendidas end-to-end (ALT+3 �?ALT+4 �?restaurar)

---

## Bitácora �?30/08/2026

### Completado

#### ProductosHelperList �?Filtros por columna
- `p-columnFilter` NO renderiza en DynamicDialog (probado `display="row"` y `display="menu"`, ambos vacíos)
- **Solución**: `p-inputText` por columna con `[ngModel]`/`(ngModelChange)` a signals + `computed()` filtrado
- Patrón replicado de `entity-selector.ts` (funciona en DynamicDialog)

#### Facturación �?Imagen con transparencia
- Clase `.img-producto` con `mix-blend-mode: multiply` en tabla de productos (`nueva-factura.scss`)
- Permite ver color de fondo del td a través de la imagen

#### Facturación �?Validación Luhn tarjetas crédito
- `validarLuhn(numero)` replicado de `tienda-virtual.ts:374`
- Se aplica en `facturar()` al validar pagos con tarjeta (13-19 dígitos + checksum)
- Validación de longitud mínima de 13 dígitos antes de Luhn

#### Facturación �?Autorización obligatoria para transferencias
- `esTransferencia(pago)` detecta forma de pago con label 'transferencia'
- Campo `nroautorizacion` visible para tarjetas Y transferencias
- Validación en `facturar()`: transferencia sin autorización �?error

#### Facturación �?Ticket: nombre forma de pago
- Pago #1 100.00 �?Efectivo 100.00 / Tarjeta ****1234 670.50 / Transferencia Aut: 123456
- `pagosHtml` busca label en `formaspago()`, enmascara tarjeta con últimos 4 dígitos
- Agrega `Aut: {nroautorizacion}` si existe

#### Facturación �?Fix cliente TIENDA en nueva factura
- `nueva()` no llamaba `onTipoFacturaChange()` �?clienteId quedaba null tras reset
- Fix: agregar `this.onTipoFacturaChange()` + `snNombreOptions: 'N'` en `form.reset()`

#### Productos �?Imágenes base64
- Endpoint `/inventario/productos-img` retorna `{ productoId, img }` (campo `img`, NO `imagen`)
- Mapeo con `Map<productoId, img>`, prefijo `data:image/png;base64,` vía `resolverImagen()`
- **Gotcha**: campo se llama `img` en la respuesta, no `imagen`

#### Productos �?sn_activo NULL en update (500)
- `p-selectbutton` PrimeNG 21 no bindea valor al form control �?`sn_activo = NULL` en SQL
- **Causa raíz**: `Column 'sn_activo' cannot be null` en UPDATE
- **Fix 1**: Reemplazar `p-selectbutton` por `p-select` (bindea correctamente)
- **Fix 2**: Fallback `raw.sn_activo || 'S'` en payload de edición

#### Productos �?Vista grid 3 columnas
- CSS puro (sin PrimeFlex): `grid-template-columns: repeat(3, 1fr)`
- Responsive: 2 col en tablet (�?60px), 1 col en mobile (�?00px)
- Cards: imagen centrada fondo claro, tag estado superpuesto, descripción, código, precio, botón editar

#### Inventario Existencias �?Imágenes
- `forkJoin` de existencias + tienda/productos + bodegas
- `resolverImagen()` + `getItemImagen()` replicados de tienda-virtual
- Endpoint `/inventario/tienda/productos` retorna `imagen` (base64) en `ProductoTienda`
- Imágenes normalizadas 8rem x 8rem con `object-fit: cover`

### Pendiente
- Verificar ProductosHelperList con `pTemplate` en DynamicDialog
- Verificar ventas suspendidas end-to-end

---

## Bitácora �?31/08/2026

### Completado

#### CxP Compras �?Backend completo
- **Entity fixes**:
  - `compra-mae.entity.ts`: `sn_anulada` default cambiado de `'S'` a `'N'`
  - `movimiento.entity.ts`: `sn_chq`, `sn_chq_anulado`, `sn_conciliado`, `sn_contabilizado`, `sn_doc_anulado` todos default `'N'`; `bcoctasId` cambiado a nullable
- **Service reescrito** (`cxp.service.ts`):
  - `createCompra()`: crea solo header (sin detalles/kardex/CxP), recibe `detalles` array opcional
  - `createCompraDet()`: crea detalle, auto-calcula `nrofila`, recalcula total compra
  - `deleteCompraDet()`: elimina detalle y recalcula total
  - `procesarCompra()`: ejecuta kardex entrada + movimiento CxP débito para todos los detalles
  - `deleteCompra()`: anula compra, revierte kardex (salida AN), marca movimientos CxP como anulados
  - `registrarKardexEntrada()`: resuelve `codbarra` �?`productoId` via `Tproducto` repo (NO usa `productoId` en `cxpcomprasdet`)
  - `crearMovimientoCxP()`: crea movimiento débito automático con datos del proveedor
  - `actualizarTotalCompra()`: recalcula subtotal/total desde detalles
- **Controller** (`cxp.controller.ts`): POST `/compras`, PUT `/compras/:id`, PUT `/compras/:id/procesar`, PUT `/compras/:id/anular`, POST `/compras-det`, DELETE `/compras-det/:id`, GET `/compras/:id/detalles`
- **Module** (`cxp.module.ts`): agregado `Tproducto` repo para resolución codbarra→productoId

#### CxP Compras �?Frontend
- **Models** (`inventario.models.ts`): interfaces `CompraMae`, `CompraDet` (sin `productoId` �?se usa `codbarra`)
- **Service** (`cxp.service.ts`): `createCompra`, `createCompraDet`, `deleteCompraDet`, `getDetallesByCompra`, `procesarCompra`, `anularCompra`
- **Componente** `ComprasManager` (`cxp/compras/`):
  - Lista compras con tabla (proveedor, bodega, tipo, pagada, estado)
  - Vista detalle con tabla de items
  - Dialog nueva compra: proveedor, bodega, tipo, doc fiscal, **moneda** (required), referencia
  - Dialog agregar item: select producto (resuelve codbarra→productoId), cantidad, precio
  - Botones: Agregar Item, Procesar (kardex+CxP), Anular (reversa)
  - Auto-recálculo de totales al agregar/eliminar items
- **Ruta** (`cxp.routes.ts`): `/cxp/compras` ahora carga `ComprasManager` (antes era Consulta read-only)

#### Regla de negocio Compras
- `monedaId` es **obligatorio** en `cxpcomprasmae` (NOT NULL en DB)
- `cxpcomprasdet` NO tiene `productoId` �?identifica producto por `codbarra`
- Kardex resuelve `codbarra` �?`productoId` via `Tproducto` repo al procesar
- Todas las compras inician como `sn_pagada: 'N'` (pendientes de pago)
- Al procesar: se crea movimiento CxP débito automático (proveedor queda debiendo)
- Al anular: reversa kardex (salida AN) + marca movimientos CxP como anulados

### Pendiente
- Verificar CxP Compras end-to-end en browser (proceso + anulación)

---

## Bitácora �?31/08/2026 (tarde)

### Completado

#### OCR Parser �?Reescritura con enfoque ETL
- **Parser reescrito** (`core/utils/invoice-parser.ts`):
  - Enfoque ETL por bloques: HEADER (antes de "DETALLE") / DETALLE (items) / FOOTER (después de subtotal/total)
  - Palabras clave de INICIO: `detalle`, `descripcion`, `producto`, `artículo`, `servicio`, `mercadería`
  - Palabras clave de FIN: `subtotal`, `isv`, `iva`, `impuesto`, `total`, `descuento`, `gracias`
  - **Buffer de líneas**: acumula hasta encontrar patron `cantidad precio subtotal` al final
  - **Precio recalculado**: `subtotal / cantidad` para corregir errores OCR (ej: "1250" cuando real es 12.50)
  - **Descarte de basura OCR** (`esLineaBasura()`): detecta líneas con solo guiones, letras sueltas, o terminan en `- -`
  - **Limpieza de pipes**: `|` entre números eliminados antes de parsear (artefacto de tablas OCR)
  - Primera palabra = código de barra, resto = descripción
  - Sin campo `subtotal` en `FacturaItem` (solo `codbarra`, `descripcion`, `cantidad`, `precioUnitario`)

#### Número de factura �?OCR mejorado
- **Patrones regex expandidos** para `nroFactura`:
  - `N° Factura:` / `N* Factura:` / `N. Factura:` (variantes OCR de `°`)
  - `Factura:` sin prefijo, `Nro:`, `#`
  - Patrón partido OCR: `Factura:001-001-\nRTN:... 01000255` �?concatena group1 + group2
  - Standalone: `001-001-01000255` (sin prefijo)
- **`buscarPatron()` mejorado**: si group1 termina en `-` y existe group2, concatena automáticamente
- **Campo editable**: Nro. Factura en dialog OCR es `<input>` para corrección manual

#### CxP Compras �?Selección múltiple y eliminación
- **`p-checkbox` manual** en tabla de items (PrimeNG 21 eliminó `pTableHeaderCheckbox`/`pTableBodyCheckbox`)
- **Checkbox header**: selecciona/deselecciona todos los items
- **Checkbox por fila**: selección individual con highlight de fila
- **Signal `itemsSeleccionados`**: maneja estado de selección
- **Métodos**: `isSelected()`, `toggleRow()`, `todosSeleccionados()`, `toggleTodos()`
- **Botón "Eliminar (N)"**: aparece cuando hay items seleccionados, muestra cantidad
- **`eliminarSeleccionados()`**: confirm dialog + eliminación secuencial + toast éxito/error
- **Confirm dialogs**: todos los 6 diálogos (3 ComprasManager + 3 ConsultaCompras) tienen `reject: () => this.confirm.close()`

#### Backend �?nrofila respetado
- **`createCompraDet()`** (`cxp.service.ts`): solo calcula `nrofila` si `!dto.nrofila` �?si el frontend lo envía, lo respeta
- **Frontend `agregarItemsOcr()`**: envía `nrofila: nroInicial + i + 1` y `subtotal: cantidad × precioUnitario`

#### OCR Dialog �?Mejoras
- **Imports**: `FormsModule`, `InputTextModule`, `CheckboxModule` agregados a `ocr-dialog.ts`
- **Tabla items**: columna "Cód. Barra" visible + columna "Subtotal" eliminada

### Pendiente
- Verificar OCR end-to-end con factura real de Super Repuestos

## Bitácora �?01/09/2026

### Completado

#### CxP Compras �?Autocomplete de código de barras
- **`p-autoComplete`** en campo Cód. Barra: mínimo 8 caracteres, campo `field="codbarra"`
- **`codBarraBusqueda`** signal string para el display del autocomplete (separa del form control)
- **`ngModelOptions="standalone"`**: autocomplete no pelea con reactive form
- **Búsqueda**: `ProductosService.search(termino)` �?`GET /inventario/productos/buscar?q=...`
- **Selección**: `onProductoSelect()` patch form con `codbarra`, `descripcion`, `productoId`
- **Clear**: `onCodBarraClear()` limpia codbarra, descripcion y productoId
- **Editar item**: `editarItem()` setea `codBarraBusqueda` con el codbarra de la fila
- **Reseteo**: `codBarraBusqueda = ''` en todos los puntos de reset del form (5 puntos)

### Pendiente
- Verificar autocomplete end-to-end en browser (buscar código �?seleccionar �?descripción llena �?precio editable)

# Instructions for PrimeNG Component Standards

Whenever you create or modify Angular components using **PrimeNG v18+**, strictly adhere to the following template guidelines and attributes for each UI control:

## 1. Select / Dropdown Controls (`p-select`)
* Always use `styleClass="w-full"` for full-width layout.
* Always append to the document body using `[appendTo]="'body'"`.
* Include a descriptive `placeholder`.


html
<p-select placeholder="Seleccionar..." styleClass="w-full" [appendTo]="'body'" />

Always enforce 2 decimal places with [minFractionDigits]="2" and [maxFractionDigits]="2".
Enable [useGrouping]="true", mode="currency", and enforce full inner width with [inputStyle]="{ 'width': '100%' }".
Adjust styleClass (e.g., w-8rem, w-10rem) as needed per field layout.

HTML
<p-inputNumber 
    size="small" 
    formControlName="cantidad" 
    [min]="0.01" 
    mode="currency" 
    currency="HNL" 
    [locale]="'es-HN'" 
    [minFractionDigits]="2"
    [maxFractionDigits]="2" 
    styleClass="w-8rem" 
    [inputStyle]="{ 'width': '100%' }"
    [useGrouping]="true">
</p-inputNumber>

4. Date Pickers (p-datepicker)
Always use size="small", [showIcon]="true", and [appendTo]="'body'".
Enforce dateFormat="dd/mm/yy".
Apply styleClass="w-full" to guarantee full-width layout.

HTML
<p-datepicker 
    size="small" 
    formControlName="fecha" 
    dateFormat="dd/mm/yy" 
    [showIcon]="true" 
    [appendTo]="'body'" 
    styleClass="w-full" />

5. Action Buttons (p-button)
All buttons must use size="small" and [rounded]="true" (or rounded). Maintain specific severities, variants, and icons based on the action:
Cancel / Secondary Action:

HTML
<p-button size="small" label="Cancelar" rounded variant="text" severity="secondary" (onClick)="volver()" />
Delete Action:

HTML
<p-button size="small" label="Eliminar" icon="pi pi-trash" severity="danger" variant="text" [rounded]="true" />
Process / Success Action (Text variant):

HTML
<p-button size="small" label="Procesar" icon="pi pi-check-circle" severity="success" variant="text" [rounded]="true" />
Add Action (Raised variant):

HTML
<p-button size="small" label="Agregar" icon="pi pi-plus" severity="success" variant="text" [raised]="true" [rounded]="true" />
Update / Edit Action:

HTML
<p-button size="small" label="Actualizar" icon="pi pi-check" severity="warn" variant="text" [rounded]="true" />

6. Data Tables (p-table)
Always enable pagination with [paginator]="true" and standard options [rows]="10" and [rowsPerPageOptions]="[10, 25, 50]".

Enforce size="small".

Always include the page report template in Spanish: currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords}" with [showCurrentPageReport]="true".
HTML
<p-table 
    [value]="data" 
    [paginator]="true" 
    [rows]="10"
    [showCurrentPageReport]="true" 
    currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords}"
    [rowsPerPageOptions]="[10, 25, 50]" 
    size="small">
</p-table>

7. Dialog / Modal Windows (p-dialog)
Always enable [modal]="true", [draggable]="false", and [resizable]="false".
Enforce responsiveness with [breakpoints]="{ '960px': '75vw', '640px': '90vw' }".
Always structure actions in <ng-template pTemplate="footer"> using standard button rules.

HTML
<p-dialog 
    [(visible)]="displayModal" 
    [header]="'T��tulo del Modal'" 
    [modal]="true" 
    [draggable]="false" 
    [resizable]="false"
    [breakpoints]="{ '960px': '75vw', '640px': '90vw' }"
    styleClass="w-full max-w-30rem">
    
    <div class="flex flex-column gap-3 pt-2">
        <!-- Content -->
    </div>

    <ng-template pTemplate="footer">
        <p-button 
            size="small" 
            label="Cancelar" 
            rounded 
            variant="text" 
            severity="secondary" 
            (onClick)="displayModal = false" />
            
        <p-button 
            size="small" 
            label="Guardar" 
            icon="pi pi-check" 
            variant="text" 
            [raised]="true" 
            [rounded]="true" 
            severity="success" 
            (onClick)="guardar()" />
    </ng-template>
</p-dialog>
8. Confirmation Dialogs (p-confirmdialog)
Place <p-confirmdialog /> globally or within the view template.

When calling ConfirmationService in TypeScript, explicitly customize the buttons with standard classes matching the button guidelines (size="small", variant="text", [rounded]).

HTML Component:
HTML
<p-confirmdialog [breakpoints]="{ '960px': '75vw', '640px': '90vw' }" [style]="{ width: '420px' }" />
TypeScript Service Standard:

TypeScript
this.confirmationService.confirm({
    message: '?Est�� seguro de realizar esta acci��n?',
    header: 'Confirmaci��n',
    icon: 'pi pi-exclamation-triangle',
    rejectButtonProps: {
        label: 'Cancelar',
        severity: 'secondary',
        variant: 'text',
        size: 'small',
        rounded: true
    },
    acceptButtonProps: {
        label: 'Confirmar',
        severity: 'danger',
        variant: 'text',
        size: 'small',
        rounded: true
    },
    accept: () => {
        // Callback logic
    }
});
```