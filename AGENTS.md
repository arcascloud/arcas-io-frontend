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

---

### 🚫 RESTRICCIÓN: Tabla `ttipoparametros` (CRÍTICO)

**PROHIBIDO** realizar cualquier `INSERT` en la tabla `ttipoparametros` sin autorización explícita del usuario.

- ❌ **NUNCA** hagas `INSERT INTO ttipoparametros` directo (ni via SQL, ni via API, ni via código)
- ❌ **NUNCA** generes registros nuevos en esta tabla como parte de una funcionalidad
- ✅ **SOLO** el usuario puede indicar qué registros insertar, con qué valores exactos
- ✅ Los `UPDATE` y `DELETE` en esta tabla también requieren autorización previa
- ✅ Los `SELECT` (lectura) están permitidos sin restricción

**Razón**: `ttipoparametros` es la tabla de configuración global del ERP. Un INSERT incorrecto puede romper parámetros críticos de facturación, contabilidad, CxC, CxP, etc. que afectan a todas las empresas.

Si necesitas un parámetro nuevo, **pregunta al usuario** y esperá confirmación antes de hacer cualquier modificación.

---

### 🚫 RESTRICCIÓN: Estructura de Base de Datos (CRÍTICO)

**PROHIBIDO** crear tablas o modificar nombres de tablas sin autorización explícita del usuario.

- ❌ **NUNCA** hagas `CREATE TABLE` (ni via SQL, ni via migraciones, ni via código)
- ❌ **NUNCA** hagas `RENAME TABLE` o modifiques nombres de tablas existentes
- ❌ **NUNCA** hagas `DROP TABLE`
- ⚠️ **`ALTER TABLE`**: Solo con supervisión y aprobación previa del usuario. Presentá el script SQL al usuario y esperá confirmación antes de ejecutar
- ✅ **`SELECT`** (lectura) están permitidos sin restricción
- ✅ **`INSERT`/`UPDATE`/`DELETE`** en tablas existentes siguen las reglas de cada módulo

**Razón**: La estructura de tablas del ERP es criticisima para la integridad referencial. Un CREATE TABLE o ALTER TABLE incorrecto puede romper migraciones, fixtures, reportes y otros módulos dependientes.

---

## 📐 ESTÁNDAR DE SALDOS ACUMULADOS EN CONTABILIDAD (OBLIGATORIO · 30/09/2026)

Regla normativa y **definitiva** para `coctamov` (movcta), `coctasaldos` (saldoscta), `cocierredet` (espejo de cierre) y Libro Mayor. Toda lógica nueva o reconstrucción **debe** cumplir estos incisos. Fuente de secuencia de acumulados = **`cocierredet`** (mes anterior al período vigente).

### 1.- `coctamov` (movcta) — registro de movimientos de cuentas

Sirve para registrar movimientos de cuentas **existentes o nuevas**.

| Campo | Regla de poblado |
|-------|------------------|
| **`sacum`** | = `saldo` registrado en **`cocierredet`** del mes anterior (el que precede al período vigente/abierto).<br>**`sacum = 0` SOLO SI** no hubieran movimientos en el mes que precede al período vigente (o no existe fila en `cocierredet` para ese mes). |
| **`debe`** | = **sumatoria** de todos los movimientos del **mes abierto**. |
| **`haber`** = **sumatoria** de todos los movimientos del **mes abierto**. |
| **`saldo`** | = **`sacum + (debe - haber)`** |

### 2.- `coctasaldos` (saldoscta) — tabla RESUMEN de saldos finales

Es **solo tabla de resumen**: guarda los **saldos finales** de cuentas ya existentes o nuevas. No es fuente de secuencia.

**Cálculo del saldo final del período:**

```
saldo final = saldo acum. (cocierredet del período anterior) + (debe - haber)
```

**`tiposaldo` (D/C)** — casos según el lado del acumulado y la dirección del movimiento del mes:

| # | Caso | tiposaldo |
|---|------|-----------|
| 1 | `sacum(D)` + `debe > haber` | **D** |
| 2 | `sacum(D)` + `debe < haber` | **C** |
| 3 | `sacum(C)` + `haber > debe` | **C** |
| 4 | `sacum(C)` + `haber < debe` | **D** |

> **Regla computacional**: `tiposaldo = D si saldo final ≥ 0; C si saldo final < 0`.
> Los casos 1 y 3 se cumplen **siempre**. Los casos 2 y 4 se cumplen cuando el movimiento del mes **invierte** el signo del acumulado; si el movimiento es menor que el acumulado, el saldo **conserva su lado** (la etiqueta D/C refleja siempre el signo real del saldo final).

> ⚠️ **INVARIANTE OBLIGATORIO**: **EL SALDO FINAL DE `COCTASALDOS` Y `COCTAMOV` DEBE CUADRAR**, lo mismo que su **saldo acumulado**. Si difieren, hay un bug — no se arregla con datos.

### 3.- Libro Mayor

- El **saldo acumulado** se pobla desde **`cocierredet`** (acumulado del período anterior), con las mismas reglas `tiposaldo` del inciso 2.
- Se debe **mantener la integridad de la MAYORIZACIÓN ESCALONADA siempre**: cada cuenta padre = **Σ de sus hijos**, resuelta de nivel máx → 1. Nunca se suma el acumulado previo de un padre por separado (ya viene contenido en sus hijos → doble conteo).

### 4.- Invariantes a verificar en cualquier reconstrucción/cierre

| ID | Invariante |
|----|-----------|
| I1 | `coctamov.saldo` == `coctasaldos[mes]` para toda cuenta/período |
| I2 | `coctamov.saldo` == `sacum + (debe - haber)` |
| I3 | `sacum(P)` == `cocierredet[P-1].saldo` (0 si no hay fila) |
| I4 | `SUM(debe)` == `SUM(haber)` por partida y global |
| I5 | Cuenta padre == Σ hijos (mayorización escalonada) |
| I6 | `cocierredet` guarda **todas** las cuentas del catálogo, ordenadas `ctacontable` ASC, incluso en saldo 0 |

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
- **Route reuse en componentes genéricos**: Cuando un componente se reutiliza al navegar entre rutas hermanas (ej. `/inventario/categorias` → `/inventario/marcas`), `ngOnInit` solo corre una vez y `route.data.subscribe()` no se dispara de nuevo. **Solución**: Suscribirse a `router.events` con filtro `NavigationEnd` y extraer el nombre del catálogo de la URL:
  ```typescript
  ngOnInit() {
    this.cargarConfig();
    this.navSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => this.cargarConfig());
  }

  private cargarConfig() {
    const partes = this.router.url.split('/').filter(p => p);
    const nombre = partes[partes.length - 1]; // ej: 'categorias'
    const config = CATALOGOS_PARAMETROS[nombre];
    if (config) {
      this.config.set(config);
      this.campos.set(config.campos);
      this.load();
    }
  }
  ```

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

## Bitácora – 04/09/2026

### Completado

#### Fix crítico: catalogo-generico no cargaba al cambiar entre catálogos en el menú
- **Problema**: Al navegar entre catálogos del mismo módulo (ej. `/contabilidad/ctacontables` → `/contabilidad/grupocontable`), Angular reutiliza el componente `CatalogoGenerico`. `ngOnInit` solo corre una vez, y `route.data.subscribe()` no se dispara con los datos de la nueva ruta porque la suscripción original estaba vinculada a la primera ruta.
- **Síntoma**: "Catalogo desconocido:" en el toast de error, sin actividad en la red.
- **Solución**: 
  - Suscribirse a `router.events` con filtro `NavigationEnd` para detectar cada navegación completada
  - Extraer el nombre del catálogo directamente de la URL: `router.url.split('/').filter(p => p)[last]`
  - Ej: `/inventario/categorias` → `categorias`, `/contabilidad/ctacontables` → `ctacontables`
  - Esto funciona aunque Angular reutilice el componente, porque `router.events` es un observable global
- **Archivo**: `src/app/features/parametros/catalogo-generico/catalogo-generico.ts`
- **Código clave**:
  ```typescript
  ngOnInit() {
    this.cargarConfig();
    this.navSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => this.cargarConfig());
  }

  private cargarConfig() {
    const partes = this.router.url.split('/').filter(p => p);
    const nombre = partes[partes.length - 1];
    const config = CATALOGOS_PARAMETROS[nombre];
    if (!config) { /* error */ return; }
    if (this.config() && this.config()!.ruta === config.ruta) return;
    this.config.set(config);
    this.campos.set(config.campos);
    this.load();
  }
  ```
- **Nota**: También se agregó `ngOnDestroy` para limpiar las suscripciones y evitar memory leaks.
#### Histórico de Clientes (`/cxc/historico`)
- **Componente nuevo** `HistoricoManager` (`cxc/historico/`): tabla Poseidon con datos históricos de clientes
- **Archivos**: `historico-manager.ts`, `historico-manager.html`, `historico-manager.scss`
- **Ruta**: `/cxc/historico` agregada en `cxc.routes.ts`

---

## Bitácora – 10/09/2026

### Completado

#### CxC Histórico → Movimientos: Auto-carga con router state
- **Problema original**: Al seleccionar un registro en `historico-manager`, el botón "Ver" navegaba a `/cxc/movimientos?clienteId=X` pero:
  1. El formulario "Datos del Movimiento" nunca se prellenaba (no había de dónde sacar la info)
  2. La columna izquierda solo mostraba código y nombre — nada de DNI, límite, categoría, etc.
- **Solución de 4 cambios**:
  1. **historico-manager.html**: Botón "Ver" pasa `item` completo (no solo `item.clienteId`)
  2. **historico-manager.ts**: `irAmovimientos(item)` usa `router.navigate` con `state: { movimiento: item }` — el objeto queda en `history.state` sin serializarse en la URL
  3. **movimientos-manager.ts**: 
     - `ngOnInit` lee `history.state?.movimiento` además de `?clienteId=`
     - `autoSelectCliente(id, movimiento?)` acepta movimiento opcional
     - Nuevo método `precargarMovimiento(movimiento)`: setea `movimientoModel` con concepto, importe, fecha, tipo, referencia del registro histórico
  4. **movimientos-manager.html**: Reemplaza `cliente-header-inline` por ficha completa usando clases `cliente-item-ficha` (mismas que la columna derecha)
     - Muestra: Código, Apellidos, Nombres, DNI, RTN, Días plazo, Límite Crédito, Disponible, Tasa interés, Tasa moratoria, Categoría, Estado, Razón social
  5. **movimientos-manager.scss**: Nueva clase `.cliente-item-ficha--header` (cursor: default, sin hover)
- **Archivos modificados**:
  - `Frontend/src/app/features/cxc/historico/historico-manager.ts` — `irAmovimientos(item)` con router state
  - `Frontend/src/app/features/cxc/historico/historico-manager.html` — botón Ver pasa item completo
  - `Frontend/src/app/features/cxc/movimientos/movimientos-manager.ts` — lee state, precarga movimiento
  - `Frontend/src/app/features/cxc/movimientos/movimientos-manager.html` — ficha completa en izquierda
  - `Frontend/src/app/features/cxc/movimientos/movimientos-manager.scss` — `.cliente-item-ficha--header`
- **Nota**: `CxcHistorico` no trae `tipodocumentofiscalId`, así que "Documento Fiscal" queda para selección manual

### Inicialización AGENTS.md
- Archivo consolidado con contexto completo del proyecto, arquitectura, reglas, bitácoras y lecciones aprendidas
- Actualizado a la fecha más reciente de trabajo (10/09/2026)

---

## Bitácora – 16/09/2026

### Completado

#### `new Date()` → `fechasistema` — Migración global
- **Objetivo**: Todas las fechas transaccionales usan `tempresas.fechasistema` en vez de `new Date()` del servidor
- **Infraestructura**:
  - `shared/fecha-sistema.service.ts` — Servicio global, lee `tempresas.fechasistema` con fallback a `new Date()`
  - `shared/fecha-sistema.module.ts` — `@Global()` module, registrado en `app.module.ts`
- **14 services** actualizados, **~41 reemplazos** totales:
  - `bancos.service.ts` (6), `cxc.service.ts` (17), `cxp.service.ts` (5), `facturacion.service.ts` (7)
  - `inventario.service.ts` (2), `ajuste-inventario.service.ts` (4), `kardex.service.ts` (3), `requisicion-inventario.service.ts` (5), `toma-inventario.service.ts` (4), `traslado-inventario.service.ts` (3)
  - `contabilidad.service.ts` (2), `parametros.service.ts` (4), `companies.service.ts` (7), `users.service.ts` (3), `modulos.service.ts` (1), `sucursales.service.ts` (1), `planilla.service.ts` (2)
- **4 `new Date()` intencionalmente conservados**: fallback en servicio compartido, `fechasistema` al crear empresa, helpers `NoEmpresa` sin contexto, `generarNroReferencia()` de traslados

#### Histórico CxC y CxP — Quitado DNI
- **`cxc/historico/historico-manager.html`**: Eliminado filtro DNI, columna DNI (header + body), campo DNI en detalle
- **`cxc/historico/historico-manager.ts`**: Eliminado signal `dni`, referencia en `cargarHistorico()`, reset en `limpiarFiltros()`
- **`cxp/historico/historico-manager.html`**: Misma limpieza (filtro, columna, detalle)
- **`cxp/historico/historico-manager.ts`**: Misma limpieza

#### Bancos — Margin-top botón Historial
- **`movimientos/movimientos.scss`**: Agregado `a { margin-top: -4.75rem }` al `.page-header` para alinear botón "Historial de Movimientos"

#### Conciliación Bancaria — Módulo completo
- **Backend — Entidades modificadas**:
  - `bco-conciliacion.entity.ts` (+4 campos): `fechaDesde`, `fechaHasta`, `saldoInicial`, `saldoFinal`
  - `bco-conciliacion-det.entity.ts` (+2 campos): `sn_conciliado` (S/N), `bcomovimientosId` (FK a bcosmovimientos)
- **Backend — DTOs** (`dto/banco.dto.ts`): `CreateConciliacionDto`, `CreateConciliacionDetDto`, `UpdateConciliacionDetDto`
- **Backend — Service** (`bancos.service.ts`): +5 métodos:
  - `parsearCsvConciliacion()` — Parse CSV `Fecha,Concepto,Referencia,Debito,Credito`, auto-detecta dd/mm/yyyy
  - `realizarMatching()` — Match por `nroreferencia` + `importe` + `dc_debitocredito` contra `bcosmovimientos` no anulados
  - `guardarConciliacion()` — Crea `bcosccmae` + `bcosccdet` en secuencia
  - `findConciliacionCompleta()` — Maestro + detalles enriquecidos con movimiento bancario
  - `deleteConciliacion()` — Cascading delete
- **Backend — Controller** (`bancos.controller.ts`): +5 endpoints:
  - `POST /bancos/conciliaciones/parsear-csv` (FileInterceptor)
  - `POST /bancos/conciliaciones/matching`
  - `POST /bancos/conciliaciones`
  - `GET /bancos/conciliaciones/:id/completa`
  - `DELETE /bancos/conciliaciones/:id`
- **Frontend — Componente** (`bancos/conciliacion/`):
  - `conciliacion.ts` — 4 pasos: selección cuenta → upload CSV → preview → matching resultado
  - `conciliacion.html` — Tabla cuentas, upload drag & drop, preview con checkbox, summary cards (total/conciliados/diferencias), tabla resultado con row highlights (verde=conciliado, amarillo=diferencia)
  - `conciliacion.scss` — Summary cards, row highlights, upload zone
- **Frontend — Ruta**: `/bancos/conciliacion` en `bancos.routes.ts`
- **ALTER TABLE ejecutados**:
  - `bcosccmae`: +`fechaDesde`, `fechaHasta`, `saldoInicial`, `saldoFinal`
  - `bcosccdet`: +`sn_conciliado`, `bcomovimientosId`
- **Matching**: Criterio `importe + referencia + naturaleza(D/C)` contra movimientos no anulados

#### Respaldo base de datos
- **Archivo**: `E:\desarrollo\proyectos angular\erp\respaldo_16sep2026.sql` (1.72 MB)

### Pendiente
- Verificar conciliación bancaria end-to-end en browser (upload CSV → matching → guardar)
- Agregar menú de Conciliación en `tusuariomnuitem` para acceso desde sidebar

---

## Bitácora – 28/09/2026

### Completado

#### Protección de cuentas contables (`sn_operable` + historial de cierre)
- **Reglas** (16/16 pruebas E2E):
  - **R1**: Cuenta con historial (`coctamov`/`coctasaldos`/`copdadet`/`cocierredet`) + rol fuera de `ROLES_CONTABILIDAD` → 403 en cualquier campo incl. eliminar
  - **R2**: Operable 'S' + historial → cambiar a 'N' (convertir a Mayor) = 403 absoluto para todos
  - **R3**: Habilitar `sn_operable='S'` → solo roles privilegiados
- **Fuente de roles**: tablas `ttipo_rol` / `tusuarios_rol` (usuario logueado → `auth.service.ts` devuelve `roles: string[]`)
- **Constante**: `ROLES_CONTABILIDAD = ['admin', 'supervisor', 'contador']` — en `Backend/src/modules/users/roles.service.ts` y `Frontend/src/app/core/services/auth.service.ts` (cambiar en ambos lugares)
- **Backend**: `roles.service.ts` (nuevo), `contabilidad.service.ts` (`validarProteccionCuenta`, `sn_protegida` en queries), protección en `removeCtacontable` con `@CurrentUser()`
- **Frontend**: `ctacontable-form` (banner + bloqueo de campos), `ctacontables-list` (candado 🔒 en columna Diario/Mayor + Eliminar deshabilitado)
- **Historial real empresa 2**: 9/127 cuentas protegidas (`cocierredet` vacía)

#### CRUD de Roles de Usuario (`/usuarios/usuario-roles`)
- **Tablas**: `tusuarios_rol` (rol_id PK, usuarioId, rol, empresaId, UNIQUE `usuarioId_rol`) y catálogo `ttipo_rol` (15 roles) — **solo lectura** para el catálogo
- **Backend** (`users/`):
  - `dto/usuario-rol.dto.ts` — `CreateUsuarioRolDto {usuarioId, rol, empresaId}` / `UpdateUsuarioRolDto {usuarioId?, rol?}`
  - `users.service.ts` — `findAllRoles` (enriquecido con nombre/login), `findRole`, `findAllTiposRol` (incluye globales `empresaId NULL`), `createRole`, `updateRole` (setea `usuarioUpdated`/`fechaUpdate` — NO usa `updateEntity` porque esa clave es `fechaUpdated`), `removeRole` (hard delete), `validarRole` (404 usuario / 400 rol fuera de catálogo / 409 duplicado)
  - `users.controller.ts` — `GET/POST /users/roles`, `GET /users/roles/tipos`, `GET/PUT/DELETE /users/roles/:id` (antes de rutas `:usuario` del final)
- **Frontend**:
  - `core/services/usuario-roles.service.ts` (path `/users/roles`)
  - `core/models/usuario.models.ts` — `UsuarioRol`, `TipoRol`
  - `features/usuarios/usuario-roles/` — lista (tabla paginada, filtro, tags por severidad) + form (selects de usuario/rol; usuario deshabilitado en edición)
  - Rutas: montadas en `configuracion.routes.ts` → `/configuracion/usuarios/usuario-roles` (+`/nuevo`, `/editar/:id`); **`usuarios.routes.ts` NO está importado en `app.routes.ts` (código muerto, no agregar rutas ahí)**
- **Prueba E2E 16/16 OK** (`test-roles-crud.js`): CRUD completo, 409 duplicado, 400 rol inexistente, 404 usuario inexistente; baseline de 3 filas intacta tras la prueba
- **Gotcha**: el frontend inyecta `empresaId` en el body vía `ApiService.post` — las pruebas con curl deben mandarlo explícito o el DTO rechaza con 400
- Menú de Usuarios ya incluido en `tusuariomnuitem` por aprobación del usuario

#### Protección de períodos contables (`coperiodoctable` + `cocierremae`/`cocierredet`) — E2E 20/20 OK
- **Reglas aprobadas** ("paquete completo"):
  - **P1**: Período cerrado (`sn_abierto='N'`) = inmutable para siempre → PUT/DELETE 403 con mensaje "no es modificable ni puede reabrirse bajo ninguna circunstancia"
  - **P2**: Período con otro cerrado posterior también está protegido (previos/antecesores) → 403
  - **P3**: Cerrar un período SOLO desde `/contabilidad/cierre-contable` (genera partida): POST cerrado → 403; PUT `sn_abierto:'N'` desde catálogo → 400 "use Cierre Contable"
  - **P4**: Cierre secuencial: `realizarCierre` valida tras "período abierto" que no existan meses/años anteriores abiertos → 400 "primero deben cerrarse los períodos anteriores abiertos: 9/2026"; validación replicada en `cierre-contable.ts` (cliente) con lista de pendientes
  - **P5**: `cocierremae`/`cocierredet` = solo lectura absoluta: create/update/remove → 403 (throw inmediato, sin findOne → cualquier id también da 403)
  - **P6**: DELETE de período con cierre registrado → 403 "tiene cierre contable registrado" (evita huérfanos en historial)
- **Backend**: `contabilidad.service.ts` — helper `explicarProteccionPeriodo()`, reglas en `create/update/removePeriodoctable`, cierres mae+det bloqueados, guard de cierre huérfano en `removePeriodoctable`; `contabilidad-logica.service.ts` — paso "1b. CIERRE SECUENCIAL" en `realizarCierre`
- **Backend — fix crítico**: `removePeriodoctable` usaba `softDelete()` genérico pero **`coperiodoctable` no tiene columna `sn_activo`** → era un no-op silencioso (fila seguía apareciendo). Cambiado a **hard delete** (sin FKs hacia `periodoscontableId`)
- **Frontend**:
  - `catalogo-parametros.models.ts` — flags `protegerCerrados`/`proteccionMensaje` en `CatalogoConfig`; `periodoctable` (protegido), `cierrectable`/`cierredet` (`soloLectura: true`)
  - `catalogo-generico.ts/html/scss` — `esProtegido(item)`: filas cerradas muestran candado `pi-lock` con tooltip (sin click/editar)
  - `catalogo-form.ts/html/scss` — signal `protegido`: bloqueo total (`form.disable()` + ocultar Guardar + banner `mensaje-proteccion`); control `sn_abierto` deshabilitado siempre en catálogos protegidos (getRawValue lo omite)
  - `cierre-contable.ts` — validación secuencial previa al confirm; `cierre-contable.html` — candado verde en períodos cerrados
- **Datos reales empresa 2**: meses 1–8/2026 cerrados, 9/2026 abierto (con cierre "prueba" registrado en `cocierremae`); estado intacto tras las 20 pruebas
- **Test**: `C:\Users\ALLANR~1\AppData\Local\Temp\opencode\test-periodos-protegidos.js` (20/20)

### Pendiente
- Verificar en browser: protección de cuentas, CRUD de roles, períodos (`/contabilidad/periodoctable`, `/contabilidad/cierre-contable`) y candidato a menú de Conciliación Bancaria

---

## Bitácora – 29/09/2026

### Completado

#### Estado de Cuenta (`/contabilidad/saldoscta`) — solo partidas vigentes y contabilizadas
- **Endpoint** `findSaldosCtaDetalle` (`contabilidad.service.ts`) — criterio ACTUAL (29/09/2026): **doble bandera `sn_anulada='N'` + `sn_contabilizada='S'`**; FAC-19 aparece una sola vez (las anuladas duplicaban 43 documentos)
- Agrupación por `nropartida` con `MIN(fecharegistro)` — **`nropartida` NO es único** (secuencia por `(anio, periodo)`)
- **`coctasaldos` reparado**: 12 meses × 8 cuentas recalculados desde `copdadet` activas; 6 celdas de septiembre corregidas (Ventas -52,430→-104,540; Caja -121,327.73→-61,412.05; Costo 31,394→61,504; ISV -7,249.27→-15,064.95; Mercadería 1,219,423→1,189,313; 4-3-10-001 5,240→5,250); **8/8 cuadran**; `saldoanterior` intacto; suma meses Ventas = neto detalle ✓

#### Flags `sn_contabilizada` / `sn_cerrada` en partidas (backend + UI) — E2E 13/13 OK
- **DB**: columnas `enum('S','N') NOT NULL DEFAULT 'N'` **ya existían** en `copdamae` y `copdadet` (sin DDL nuevo)
- **Entidades + DTOs**: agregados a `copdamae.entity.ts`, `copdadet.entity.ts` y a `CreateCopdamaeDto`, `UpdateCopdamaeDto`, `CreateCopdadetDto`, `UpdateCopdadetDto` (`@IsEnum(['S','N']) @IsOptional()`); con `whitelist:true` los campos NO declarados en DTO se descartan silenciosamente
- **Ciclo de vida** (`contabilidad-logica.service.ts`):
  - `contabilizarPartida` → mae+det `sn_contabilizada='S'`
  - `realizarCierre` → partida de cierre `S` + **bulk `sn_cerrada='S'`** mae+det (UPDATE por empresa/anio/periodo + subquery para det) tras cerrar período (step 12)
  - `descontabilizarFactura` y reconstrucción Fase 0 (`updMae`/`updDet`) → `sn_contabilizada='N'`
- **Guards** (`contabilidad.service.ts`): `exigirPartidaModificable(ref, etiqueta, accion)` → **403** si `sn_cerrada='S'` **o** el período está cerrado en `coperiodoctable` (fallback); aplicado en `create/update/remove` de `copdamae` y `copdadet`
- **Invariantes en remove**: `removeCopdamae` → mae `N/N` + **cascada a líneas** (UPDATE copdadet por partidaId); `removeCopdadet` → línea `N/N`
- **Backfill** (snapshot previo: `Temp\opencode\snapshot-flags-partidas.json`): `sn_cerrada='S'` en partidas de períodos cerrados; `sn_contabilizada` normalizado a **estado actual** (decisión usuario: activa='S', inactiva='N' — 90 filas inactivas traían el valor invertido de la DB); final: mae 153 → S/S/S:33, S/S/N:30, N/N/S:34, N/N/N:56; det 499 coherente
- **Tests**: `test-flags-e2e.js` **13/13** — 403 en partida cerrada (mae/det, crear/editar/eliminar), 200 en abierta, contabilizar→S/S/N, remove→cascada N/N, reversa exacta de `coctamov`/`coctasaldos`, cleanup completo (partida 155 eliminada, residuos 0/0, conteos 153/499)
- **Frontend UI** (`/contabilidad/copdamae` → `copdamae-manager`):
  - `contabilidad.models.ts` — `CopdaMae` + `sn_contabilizada`/`sn_cerrada` (el GET ya los devolvía)
  - **Detalle (vista "ver")**: tags "Contabilizada: Sí/No" y "Cerrada: Cerrada 🔒 / Abierta 🔓"; botones Editar/Eliminar `[disabled]` con tooltip condicional
  - **Lista**: tag "Cerrada" con `pi pi-lock` + tooltip en cabecera, tag "Contabilizada"/"No contabilizada" junto a Auxiliar, borde izquierdo rojo (`.partida-cerrada`); botones Editar/Eliminar deshabilitados
  - **Guards de UX** en `editarPartida`/`eliminarPartida`: toast warn "Partida cerrada" antes de intentar (el 403 del backend sigue siendo la autoridad)
  - **Bug fix**: la lista usaba `track partida.copdamaeId` y `partidaSeleccionada()?.copdamaeId` — el PK es `partidaId` → `undefined === undefined` resaltaba TODAS las filas; corregido a `partidaId`
- **Gotchas**:
  - `PUT/DELETE copdamae/:id` y `copdadet/:id` requieren **`?empresaId=2` como query param** (no en body)
  - `mysql2` `affectedRows` vs `affectedRows` del UPDATE con el mismo valor → usar SELECT previo para confirmar cambio
  - `NOW()` y paréntesis rompen el inline `node -e` de PowerShell → scripts `.js` en archivo
  - Backend reiniciado con `cmd /c ... > backend-out.log 2> backend-error.log` vía `Invoke-CimMethod Win32_Process.Create`

#### Cálculo de saldos de cuentas (`POST /contabilidad/saldoscta/calcular`)
- **Contexto**: el usuario aportó `sp_calcular_saldos_cuenta(anio, periodo, empresaId, usuarioCreated)` con indicación "o lo invocas o lo creas en backend" → **decisión: versión backend** (el proyecto no usa procedures y `synchronize:false` dejaría la procedure fuera de versionado)
- **La procedure fue creada en la BD y ejecutada** (hoy 20:57) — dañó `septiembre` en las 9 filas de `coctasaldos` (guardó `ABS(total año)` en vez del neto del período 9) e insertó `1-1-20-3-001` con signo invertido; el nuevo endpoint la reparó (8 filas / 8 celdas)
- **Regla de cálculo de saldos (definida por el usuario, 29/09/2026)**: **doble bandera `sn_anulada='N'` + `sn_contabilizada='S'`** en TODOS los cálculos de saldos = solo movimientos **vigentes y contabilizados**. Las banderas no son intercambiables: `sn_anulada` descarta anuladas, `sn_contabilizada` descarta las no asentadas al mayor. Aplicada en `findSaldosCtaDetalle` (detalle) y `calcularSaldosCta` (catálogo) para que cuadren.
- **4 correcciones vs el SP original** (todas en el JSDoc del método `calcularSaldosCta`):
  1. **Sin `ABS()`** — guarda neto firmado `SUM(debito-credito)`; la UI marca negativo=(C)/positivo=(D) y la suma de meses debe igualar el neto del detalle
  2. **Filtra por columna `periodo`**, no por `fecharegistro BETWEEN` — todas las partidas de 2026 se registraron en septiembre (reconstrucción), el rango de fechas metía los 12 meses en septiembre
  3. **Doble bandera `sn_anulada='N'` + `sn_contabilizada='S'`** — mismo criterio en catálogo y detalle
  4. **`empresaId` en TODAS las operaciones** — el SP lo omitía en UPDATE/EXISTS (riesgo multi-empresa)
- **Implementación**: `contabilidad.service.ts` → `calcularSaldosCta(dto, usuario)` (QueryBuilder, crea fila faltante si hay movimiento, nunca toca `saldoanterior`, idempotente, `fechaSistema` para `fechaUpdated`); DTO `CalcularSaldosCtaDto` (anio, periodo opcional 1-12, empresaId); controller `@Post('saldoscta/calcular')`
- **Verificación E2E**: 1ª invocación → 8 filas/8 celdas corregidas; 2ª invocación → 0/0 (idempotente); `periodo:13` → 400; verificación DB **9/9 OK sumaMeses=real, suma global=0.00**; cuadre vía API catálogo↔detalle **9/9, global 0**
- **Gotcha**: el proceso en :3000 tras matar al anterior puede tardar ~15s en aparecer en `Get-NetTCPConnection`; verificar con un `GET` HTTP antes de asumir fallo

### Pendiente
- Verificar en browser: flags y candado en `/contabilidad/copdamae` (partidas cerradas 1–8/2026)
- Prueba en vivo de `realizarCierre` (bulk `sn_cerrada='S'` en un cierre real) — **irreversible por diseño P1**, pendiente cuando el usuario lo indique
- Decidir destino de `sp_calcular_saldos_cuenta` en la BD (corregirla con las 4 mismas correcciones o eliminarla en favor del endpoint — requiere aprobación del usuario; no usarla tal cual, daña los datos)

---

## Bitácora – 30/09/2026

### Completado

#### Espejo de saldos en `realizarCierre` (cocierredet: hojas + padres mayorizados)
- **Paso 10 reescrito** (`contabilidad-logica.service.ts`): ya no guarda solo las filas de `coctamov`; ahora itera `mayorizarSaldoFinal(...)` y guarda el saldo final de TODAS las cuentas con `tiposaldo = saldo >= 0 ? 'D' : 'C'`
- **Nuevo método privado `mayorizarSaldoFinal(empresaId, movimientos, anio, periodo)`**:
  1. Hojas operables: fuente = `coctamov.saldo` (YA es el acumulado a fin de período = saldo acumulado + debe − haber, la fórmula del Libro Mayor). Cuentas operables SIN movimiento en el período → arrastre desde `cocierredet` del período anterior
  2. Padres/grupos (`sn_operable='N'`): mayorización escalonada nivel máx → 1: `Σ hijos + movimientos propios`. **NO** suma el acumulado previo del padre (ya viene contenido en sus hijos → evitaría doble conteo)
- **Filtros anti-doble-conteo** aplicados a la construcción del mapa de acumulados:
  - `generarLibroMayor` (`contabilidad-logica.service.ts`): bloque de `saldoAcumMap` movido DESPUÉS del catálogo y con `if (cta && cta.sn_operable !== 'S') continue;`
  - `generarBalanceDinamico` (`contabilidad.service.ts`, paso 5): mismo filtro en ambos bucles de `acumMap`
  - Mismo criterio en ambos: el acumulado de un padre se deriva SIEMPRE de sus hijos. Hoy `cocierredet` está vacía → **numéricamente nada cambió** en los reportes
- **`values` del upsert**: agregado `usuarioUpdated` y `fechaUpdated` para que el `overwrite` del `orUpdate` no los escriba NULL
- **Verificación (réplica exacta en Node con datos reales, empresa 2 / 2026 / per 9)**: 29 filas (mismo conteo que Libro Mayor) · todas las raíces cuadran con Σ hijos · **Σ hojas = 0.00** · tiposaldo D=13 / C=16 · muestra: `1-1-10-1-001` = 63,042.00 D, `4-1-10-001` = −122,481.00 C, raíz `1` = −175,181.74 C
- **Upsert validado en transacción con ROLLBACK** (sin rastro): INSERT con `tiposaldo` OK → 2ª pasada = UPDATE con 1 sola fila → **unique match CONFIRMADO** para `conflict_target: ['ctacontable','anio','empresaId']` → rollback deja 0 filas
- **Reportes verificados 200**: `cierredet` (0 filas), `libro-mayor` (29), `balance-dinamico`, `balance-comprobacion`; `nest build` + `ng build --configuration production` OK; backend reiniciado en :3000
- **Columna real**: `cocierredet.tiposaldo enum('D','C') NULL DEFAULT 'D'` ya existía en la BD (sin DDL nuevo); la tabla tiene **0 filas**

### Hallazgos (requieren su aprobación — no ejecutados)
1. **Dato huérfano en catálogo**: `2-1-70-001` (saldo −17,100.26) tiene `padre = '2-2-70'` que **no existe** en `coctacontables` → ese saldo no se mayoriza hasta la raíz "2" (el Libro Mayor tiene el mismo efecto). Corrección = `UPDATE coctacontables` (el padre correcto hay que confirmarlo con usted)
2. **`cosaldoscierreUnique(ctacontable, anio, empresaId)` NO incluye `periodo`** → solo puede existir **1 fila por cuenta-año** en `cocierredet`. Al cerrar el período 10 se sobrescribiría la fila del período 9 y el Libro Mayor de períodos intermedios perdería el acumulado. Requiere `ALTER TABLE` (necesita su aprobación):
   ```sql
   ALTER TABLE cocierredet DROP INDEX cosaldoscierreUnique;
   ALTER TABLE cocierredet ADD UNIQUE KEY cosaldoscierreUnique (ctacontable, anio, periodo, empresaId);
   ```
   (y cambiar `conflict_target` a `['ctacontable','anio','periodo','empresaId']`)

#### Reversión de cierre / reapertura de período (nuevo proceso, por separado del cierre)
- **Endpoint**: `POST /contabilidad/cierrectable/revertir` (paralelo a `/cierrectable/realizar`), recibe `CierreContableDto` (empresaId, anio, periodo, observacion?)
- **Backend** `contabilidad-logica.service.ts` → `revertirCierre(dto, currentUser)`, **todo dentro de UNA transacción** (`DataSource` → `createQueryRunner`, rollback si algo falla). Inyección nueva: `private readonly dataSource: DataSource`
- **Validaciones previas (no destructivas)**:
  1. Período existe y está **CERRADO** (si no → 400; si no existe → 404)
  2. **Secuencia inversa**: no reabrir si hay períodos posteriores **cerrados** (lista cuáles)
  3. **No puede haber partidas en períodos posteriores** (sus acumulados en `coctamov` dependen de este cierre → 400 con conteo)
  4. Localiza la partida de cierre por `nroreferencia = 'CIERRE-{p}-{a}'` y verifica **FK RESTRICT** hacia `cotrxref` / `posfacmov` (si tiene transacciones → 400)
- **Reversión (orden inverso al cierre)**:
  1. `coctamov`: resta por cuenta lo que la partida de cierre acumuló (`UPDATE`QueryBuilder explícito, bypass de change detection en decimals); `saldo` recalculado **con signo** (`debe - haber`)
  2. `coctasaldos`: resta el neto de la columna del mes
  3. Elimina partida de cierre: `copdadet` → `copdamae` (FK RESTRICT, det primero)
  4. Elimina espejo: `cocierredet` → `cocierremae`
  5. `sn_cerrada='N'` en `copdamae` + `copdadet` del período (libera el candado)
  6. `sn_abierto='S'` en `coperiodoctable`
- **Verificación 4/4 validaciones OK** (API real): 9/2026 abierto→400, 8/2026 cerrado→400 "51 partidas en períodos posteriores", 13/2026→404, 7/2026→400 "primero revertir 8/2026"
- **Verificación de las 11 queries destructivas** en transacción con **ROLLBACK**: todas válidas (nombres de columna: `coctamovId`, `cosaldosctaId`, `cierrectableId`, `cocierremaeId`, `periodoscontableId`); estado posterior intacto → `copdamae`=82, `copdadet`=267, períodos 1–8=N, 9=S
- **Frontend**:
  - Nuevo componente `contabilidad/reversar-cierre/` (`reversar-cierre.ts/html/scss`) — ruta **`/contabilidad/reversar-cierre`**
  - Preselección por query params (`?periodo=&anio=`) leídos en `ngOnInit`
  - Tabla "Períodos cerrados" con botón de reversión **solo en el cierre más reciente** (`esUltimoCerrado()`), los demás muestran candado con tooltip
  - `ContabilidadService.revertirCierre(request)` → `POST ${R}/cierrectable/revertir`
  - `cierre-contable`: botón **"Revertir cierre"** en el header + icono `pi-replay` en las filas cerradas → navegan con `Router`
- **Nota**: el menú del sidebar sale de `tusuariomnuitem` (BD) → el acceso es por botón desde Cierre Contable; agregar entrada de menú requiere INSERT aprobado

#### Pruebas E2E del ciclo cerrar → revertir → re-cerrar (septiembre 2026) — 8/8 OK
- **Ciclo completo ejecutado 3 veces** (cerrar → verificar → revertir → re-cerrar): septiembre 2026 **quedó CERRADO** (`cierrectableId=5`, partida `CIERRE-9-2026` #91, 4 líneas, utilidad 33,609.37)
- **Validación de facturas funcionó**: primer intento → 400 "4 factura(s) sin contabilizar en el período 9/2026"

##### 4 bugs encontrados y corregidos en backend (`contabilidad-logica.service.ts`)
1. **`identificarConcepto()` no reconocía facturas de crédito** → `desc.includes('CLIENTES') || desc.includes('CXC')` agregado al caso `'COBRO'`. Sin esto, "Clientes/CxC" → `'DESCONOCIDO'` → línea omitida → partida NO cuadrada → `contabilizarFactura` devolvía `false` silencioso. **Ninguna factura de crédito se había contabilizado jamás**
2. **Cuenta de utilidad default `'1-200'` no existe** en el catálogo → 500 FK `fk_copdadet_ctacontables` + **partida de cierre a medias sin transacción** (tuve que limpiar `partidaId=160` manualmente). Cambiado a **`'3-1-13-001' Resultados Acumulados`** (elegido por el usuario; la única operable del grupo 3)
3. **Espejo `cocierredet` con signos absolutos** (Σ hojas = 850,065.27 ≠ 0): `mayorizarSaldoFinal` leía `coctamov.saldo` (que se escribe con `Math.abs`). **Fix**: fuente cambiada a `coctasaldos` (`saldoanterior` + meses hasta el período, firmado ✓ Σ=0.00) **Y** movido el paso del espejo ANTES de `actualizarMovimientosContables`/`actualizarSaldosCuentas` (si no, lee `septiembre` ya con la partida de cierre restada)
4. **`coctamov.saldo` escrito con `Math.abs(debe-haber)` sin `sacum`** (L294/L309) → ahora `(sacum) + (debe - haber)` CON SIGNO, en `actualizarMovimientosContables` **y** en `revertirCierre` (mi reversión original usaba `debe-haber` y perdía el acumulado → la partida de cierre re-cerrada dejaba residual de -18,001)
- `L473 Math.abs(mov.saldo)` se MANTIENE a propósito: es la construcción de la partida de cierre (cierra el saldo absoluto con la naturaleza como dirección)

##### Verificación final del cierre #3 — 8/8
- Espejo: **Σ hojas = 0.00** (29 filas, 9 hojas, D=13/C=16 firmados)
- Cuentas de resultado en **0 real** (`saldo` y `sacum+d-h` = 0) — antes quedaba residual
- Partida de cierre cuadrada: D = H = **175,648.50** (4 líneas)
- Utilidad coherente: espejo −33,609.37 ↔ partida 33,609.37
- Período `N`, 56 partidas `sn_cerrada='S'`, `cocierremae` id=5, 0 facturas pendientes
- **Reportes API 200**: libro-mayor (32), balance-comprobacion (10), libro-diario (56), balance-dinamico
- **Reversión verificada 2 veces**: elimina partida cierre + espejo, restaura `coctamov`/`coctasaldos` con signo, libera `sn_cerrada` (flags vuelven a N=55/S=31), reabre período; residuo menor: fila `3-1-13-001` en `coctamov`/`coctasaldos` queda en 0 (se creó en el cierre)

##### Hallazgos PENDIENTES → resueltos (18/09/2026, aprobación del usuario)
- **UPDATE `coctamov.saldo`** (aprobado): `SET saldo = COALESCE(sacum,0)+(debe-haber) WHERE empresaId=2 AND anio=2026 AND periodo=9` → ejecutado, 10 filas revisadas / **0 fuera de regla**
- **Unique de `cocierredet` con `periodo`** (aprobado): ya estaba aplicado en la BD — `(ctacontable, anio, periodo, empresaId)` UNIQUE, 30 filas sin duplicados. Un `DROP INDEX` de prueba falló con "needed in a foreign key constraint" (los FK `fk_cosaldoscierre_ctacontables`/`fk_cosaldoscierre_tcoctacontables` usan ese índice) — **sin efecto, nada se rompió**. `conflict_target` del código actualizado a `['ctacontable','anio','periodo','empresaId']` (`contabilidad-logica.service.ts` L624; en MySQL es documentativo — el upsert usa el índice físico)
- **Padre de `2-1-70-001`**: ya era `2-1-70` (correcto, existe) — corregido vía UI (fechaUpdated hoy con `fechaSistema`). Verificado: **0 huérfanos en empresa 2** → UPDATE no necesario
- **`sp_calcular_saldos_cuenta`**: el usuario indicó que solo daña **si se invoca** y no la ha ejecutado → **se deja como está** (no eliminar ni corregir)

##### Ciclo final revertir → re-cerrar (con padre correcto + unique de 4 columnas) — 12/12 OK
- Reversión de cierre #3 OK → re-cierre **`cierrectableId=6`** regeneró el espejo: **30 filas** (apareció `2-1-70`)
- **Grupo 2 ahora mayoriza el ISV**: raíz `2` = **214,439.11** (238,717 − 24,277.89); antes el cierre #3 corrió con el padre roto y la raíz quedó en 238,717 sin el ISV
- Verificaciones: Σ hojas = 0 ✅ · **cada grupo = Σ hijos directos (21 grupos)** ✅ · coctamov cumple `sacum+(d-h)` (0 desviadas) ✅ · resultados en 0 ✅ · partida D=H=175,648.50 ✅ · período N + 56 flags S ✅ · utilidad coherente (−33,609.37 ↔ 33,609.37) ✅ · 0 facturas pendientes ✅ · espejo sin duplicados ✅
- Reportes 200: libro-mayor (**33**), balance-comprobacion (10), libro-diario (56), balance-dinamico
- **Frontend**: botones "Revertir cierre" (header + `pi-replay` por fila) **quitados de `cierre-contable`** (método `irARevertir` + import `Router` eliminados) — la reversión se accede desde el menú de usuario (según el usuario, ya habilitado en `tusuariomnuitem`); ruta `/contabilidad/reversar-cierre` intacta
- Builds: `nest build` + `ng build --configuration production` OK; backend reiniciado

#### Balance Dinámico (`/contabilidad/balance-dinamico`) — Columna 0 = saldo acumulado del período anterior
- **Petición del usuario**: "para cualquier balance que no sea Estado de Resultado, traer el saldo acumulado del período anterior y mostrarlo en la columna 0; no olvidar la impresión en PDF, Excel y Word"
- **Causa raíz**: `generarBalanceDinamico` (`contabilidad.service.ts`) leía el acumulado de **`cocierredet`**, que solo tiene filas de los períodos **ya cerrados** → para per. 8 no existía nada → `acum = 0` → `col0 = 0` **y** `valor` mostraba solo el neto del mes (incorrecto para un balance: `1-1-10-1-001` daba 47,235.01 en vez de 63,042)
- **Fix (solo el paso 5)**: nueva fuente `acum(P) = coctasaldos.saldoanterior(año) + Σ (debe − haber) de coctamov(año, período < P)` — **idéntico al `sacum`** que guarda `coctamov` para el período P, pero calculado para todas las cuentas (también las que no se movieron en P)
  - `esBalance` se subió del **paso 9 al 2b** (depende solo de `det`, pero lo necesita el paso 5); en el paso 9 queda solo el comentario
  - **Estado de Resultado conserva el código legacy de `cocierredet`** (`else if (!esBalance)`): el ER presenta el flujo del período y su `col0` es `null`; cambiarlo a YTD habría alterado sus cifras sin que se pidiera
  - Filtro `sn_operable !== 'S'` conservado en ambas rutas (el acumulado de un padre se deriva de sus hijos en `calcularMayorizado`)
- **Verificación (empresa 2, plantilla 2 = Balance general, plantilla 1 = ER)**:
  - per 9/2026: `1-1-10-1-001` col0 **15,806.99** / valor **63,042** ✓ · `1-1` col0 **7,739.99** / valor **180,829.74** ✓ · `2-1` col0 **849.01** / valor **214,439.11** ✓ · sin movimiento → 0/0 ✓
  - **Invariante `col0(P+1) == valor(P)`** verificado P=4..8 → **0 fallos** (prueba fuerte de corrección)
  - ER en per 1/4/9 → `col0 = null`, `mostrarCol0 = false` → **sin regresión**
  - `backend-error.log` vacío
- **Exports (ya lo soportaban, solo se afinó la etiqueta)**: `encabezadoColumnas()` / `filasCuerpo()` / `filaTotales()` de `balance-dinamico.ts` incluyen `col0` cuando `mostrarCol0()`; `columnStylesPDF` calcula el ancho con `encabezado.length`; Excel agrega el `wch` extra; Word agrega la celda alineada a la derecha. Etiqueta `'Saldo. Acum'` unificada a **`'Saldo Acum.'`** para coincidir con el HTML
- **Sin fila de TOTALES en balances** (diseño actual: `@if (!reporte()?.esBalance)` en HTML y en los 3 exports) → `totales['0']` (24,395.99, suma literal de la columna con padres e hijos) **no se muestra**; no se tocó
- Archivos: `Backend/src/modules/contabilidad/contabilidad.service.ts` (paso 2b + paso 5), `Frontend/src/app/features/contabilidad/balance-dinamico/balance-dinamico.ts`

### Pendiente
- (Antes: hallazgos 1/2 del espejo, normalización de coctamov, SP) → **todos resueltos o decididos**
- Entrada de menú `/contabilidad/reversar-cierre`: el usuario indicó que ya está habilitada en el menú de usuario (no requirió INSERT)
- **Balance Dinámico / Estado de Resultado**: el usuario indicó *"no me gustó el resultado, pero dejemos esos reportes para otro día"* — **el fix de la columna 0 quedó APLICADO** (decisión suya: no revertir). Pendiente de retomar cuando él lo indique; posible foco: revisar la presentación/criterio de `col0` y de `valor`, que es lo que no le convenció (la corrección numérica sí pasó todas las verificaciones).

---

## Bitácora – 04/11/2026

### Completado

#### Restaurante — Entrega por ítem de orden (toggle del mesero)
- **Reglas definidas por el usuario**: solo el toggle del mesero (sin pantalla de cocina en esta iteración); `pospedmae.sn_entregado` pasa a `'S'` **automáticamente** cuando todos los ítems están entregados (se eliminó el botón manual "Marcar entregada").
- **Estado inicial por ítem**: producto con `sn_enviar_a_cocina='S'` → ítem nace `'N'` (cocina despacha); `'N'` → ítem nace `'S'` (no pasa por cocina); sin catálogo → `'N'` (conservador).
- **Backend**:
  - `pospeddet.entity.ts` + columna `sn_entregado` (enum S/N default N — **ya existía en BD**, sin ALTER)
  - `facturacion.service.ts`: `sincronizarEntregadoPedido(pospedmaeId, empresaId, currentUser?)` (transición `'N'→'S'` solo si todos los dets en `'S'`; `'S'→'N'` si queda alguno pendiente o la orden queda vacía; solo escribe si cambia), ejecutado en `createPedidoDet`, `updatePedidoDet` y `deletePedidoDet`
  - `updatePedidoDet`: si el payload (tras filtrar meta `empresaId`/`Idsucursal`/`usuarioCreated`/`fecharegistro`) es **solo `sn_entregado`** → omite `recalcularTotalesPedido` (un toggle nunca mueve dinero)
- **Frontend**: `restaurante.models.ts` (`OrdenItem.sn_entregado`), `restaurante.service.ts` (`setItemEntregado`, `normalizarItem`; `marcarEntregada` eliminado), `restaurante.ts|html|scss`: `p-togglebutton` por ítem ("Entregado"/"Pendiente en cocina"), fila con `&.entregado` (opacity .72), `ToggleButtonModule` importado, botones manuales quitados (pie + ✓ de lista de pendientes)
- **Verificación E2E**: `Temp\opencode\test-entrega-items.js` **20/20 OK** — estado inicial por `sn_enviar_a_cocina`, auto-sync cabecera (N→S→N→S), PUT `sn_entregado` no altera totales (subTotal 98,000 = A×2+B×1), DELETE con sync, residuos 0, producto de prueba revertido
- **Builds**: `nest build` ✅ + `npm run build` ✅ (0 errores)

#### Fix crítico: 401 global en el backend (JWT)
- **Causa raíz**: `ConfigModule.forRoot({isGlobal:true})` (app.module.ts) carga `.env` (`JWT_SECRET=${seed}` placeholder) **después** de que `JwtModule.register` evaluó el secret al importar el módulo → firma con el fallback y verifica con `'${seed}'` → 401 genérico en todos los endpoints autenticados
- **Fix**: nuevo `src/modules/auth/jwt-secret.ts` → `secretoJwt()` (parsea `.env` perezoso, cachea, fuente única) usado en `auth.module.ts` (`secret`) y `jwt.strategy.ts` (`secretOrKey`); `.env` línea 13 cambiada a `JWT_SECRET=arcas-software-secret-key-2026` (mantiene tokens/cookies existentes válidos)
- **Verificado**: login 201 + `/auth/me` 200

#### Fix: "Nueva orden" / checkout TIENDA → 500 `ER_NO_DEFAULT_FOR_FIELD`
- `cxcclientes` tiene columnas **NOT NULL sin default** en BD (`synchronize:false`); `obtenerClienteTienda()` y `checkoutTienda()` no las seteaban
- Fix en ambos bloques de `facturacion.service.ts`: `diasgracia: 0`, `moduloId: 4`, `Idsucursal: 1` (replicando la lección de `cxc.service.ts:263` y `createCliente`)
- **Lección**: antes de crear filas en tablas del legado, verificar `SHOW COLUMNS` de NOT NULL sin default (no confiar en los `default:` de la entity — TypeORM emite keyword `DEFAULT` que MySQL rechaza si la columna no lo tiene)

#### Mantenimiento de entorno
- **Fecha del Sistema** actualizada a `04/11/2026` vía `PUT /api/parametros/fechas-sistema` (aprobada por el usuario) → desbloquea los 409 `FECHA_SISTEMA`
- `nest start --watch` zombie (desde 02/11, retenía el puerto 3000) eliminado; backend reiniciado con `node dist/main.js` y **logs con rutas absolutas** en `Backend\backend-out.log`/`backend-error.log` (`-RedirectStandard*` es relativo al CWD del llamador, no al `-WorkingDirectory` → antes caían en `Frontend\`)
- netstat devuelve el mismo PID en IPv4+IPv6 → tomar solo el primer match antes de `taskkill` (con "PID PID" el taskkill falla y el viejo sigue vivo → `EADDRINUSE`)

#### Fix: órdenes de hoy invisibles en Restaurante → "La mesa X ya tiene una orden abierta (#N)"
- **Síntoma** (en prod, `https://arcas-io-backend.onrender.com/api`): "Nueva orden" en mesa 3 devolvía 400 "La mesa 3 ya tiene una orden abierta (#70)" aunque la UI mostraba la mesa como **libre**.
- **Causa raíz**: `getOrdenesAbiertas()` (`restaurante.service.ts`) filtraba "hoy" con componentes **locales** de `new Date()`; el backend guarda `fecharegistro` como fecha de negocio a **medianoche UTC** (`2026-11-04T00:00:00.000Z`) → en HN (UTC-6) se leía como **03/11** → TODAS las órdenes del día (#70–#73) desaparecían de la lista, la mesa se veía libre y el backend (que sí valida correctamente) rechazaba la nueva.
- **Fix** (solo frontend, funciona contra el backend actual de prod):
  - Nuevo criterio = **mismo del backend**: `dia(fecharegistro) >= fechaSistema` comparando **cadenas `YYYY-MM-DD`** (sin zonas horarias), con `fechaSistema` de `GET /parametros/fechas-sistema` (existe en prod y devuelve `{"fechaSistema":"2026-11-04",...}`); respaldo = día local si el estado falla.
  - Helpers `fechaDia()` (string ISO/Date → día) y `fechaLocal()` en `restaurante.service.ts`.
- **Verificación** con datos reales de prod (TZ `America/Guatemala`): filtro viejo → **0 mesas visibles**; filtro nuevo → **4** (#70 mesa 3, #71 mesa 2, #72 mesa 4, #73 mesa 15); `npm run build` ✅.
- **Nota**: es el ÚNICO filtro "hoy vs fecharegistro" con este patrón en el frontend (revisado con `getFullYear()` sobre `src/app`).

#### Restaurante: ticket al cobrar (mismo motor que Nueva Factura)
- Tras `confirmarPago()` exitoso → `imprimirTicket(f.facturaId)`: `GET /facturacion/facturas/:id/ticket` + `FacturaImpresionService.imprimir()` (formato TICKET/CARTA resuelto desde `timpresoras`), con los mismos toasts de error que `nueva-factura.ts`
- **Gate por parámetro (decisión del usuario 04/11)**: imprime **solo si** `ttipoparametros` (módulo 3, `field='sn_imprimefactura'`) = `'S'`; si no está en `'S'` o el endpoint falla → **no se imprime nada**. El usuario ya insertó el parámetro en prod → respuesta actual: `{"...","sn_imprimefactura":"S"}`. El valor viaja en `ConfigISV.snImprimeFactura` (cargado en `cargarISV()`, cache `shareReplay(1)`); Nueva Factura (`cargarParamFac`) usa el mismo endpoint/param → también imprime en prod desde ahora
- Endpoint verificado en prod: `GET /facturas/38/ticket?empresaId=2` → 200 (empresa AUTOSEL, detalles/pagos OK); `ApiService.get` inyecta `empresaId` → suficiente
- `takeUntilDestroyed` viene de `@angular/core/rxjs-interop` (NO de `@angular/core`)

#### Restaurante — Venta libre (pedidos sin mesa)
- **Concepto**: Permitir abrir y cobrar pedidos sin reservar mesa para locales con modelo mixto tienda/restaurante.
- **Implementación**:
  - Botón "Venta libre" en la columna de mesas (Row 4, severity warn, icono `pi pi-shop`).
  - Envía pedidos con `nromesa: 0` y `nombrecliente: 'Venta Libre'`. Backend (`validarMesaLibre` y `createPedido`) ya soporta `nromesa < 1` sin cambios.
  - Filtro `getOrdenesAbiertas()` incluye `nromesa < 1` **solo si** `nombrecliente` es `'Venta Libre'` (excluye pedidos web/CRM con mesa 0 y huérfanos).
  - Método `ventaLibre()` en componente con guard anti-duplicados (si la orden activa ya es una venta libre vacía, avisa y no duplica).
  - Listado de pedidos, cabecera de orden y diálogo de pago adaptados con el helper `etiquetaMesa(o)` para mostrar "Venta libre" en vez de "Mesa 0".
  - **Prueba E2E local (`test-venta-libre.js`)**: 10/10 OK (crear, filtrar, agregar ítem sin mesa, verificar total, eliminar, 0 residuos).
  - `npm run build` ✅.

### Pendiente
- **Pantalla/monitor de cocina**: diferida a la siguiente iteración (decisión del usuario); el endpoint de estado ya queda disponible
- **Catálogo cocina**: marcar los productos de cocina con `sn_enviar_a_cocina='S'` en Productos → Editar → "Enviar a Cocina" (los 33 están en `'N'`)
- Deploy a Cloudflare (`_worker.js` sin commitear + build prod) cuando el usuario lo indique
