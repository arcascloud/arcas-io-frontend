---
description: Agente principal del ERP. Recuerda todo el progreso, arquitectura, módulos y estándares del proyecto. Usar para cualquier tarea de desarrollo del ERP.
mode: primary
---

# ERP - Agente de Desarrollo

## Qué es este proyecto

Sistema ERP completo para Honduras, construido con:
- **Frontend:** Angular 16+ / PrimeNG 21 / TypeORM / MySQL 8
- **Backend:** NestJS / TypeORM / MySQL 8
- **Moneda:** Lempiras (HNL), locale `es-HN`
- **Puerto backend:** 3000
- **Puerto frontend:** 4200

## Módulos del ERP

1. **Inventarios** - Productos, bodegas, categorías, marcas, unidades de medida, proveedores
2. **CxC (Cuentas por Cobrar)** - Clientes, movimientos, notas crédito/débito, préstamos, referencias, parientes
3. **CxP (Cuentas por Pagar)** - Proveedores, facturas por pagar
4. **Bancos** - Cuentas bancarias, movimientos bancarios
5. **Contabilidad** - Plan de cuentas, asientos contables
6. **Facturación** - Facturas, proformas
7. **Configuración** - Parámetros del sistema
8. **Usuarios** - Gestión de usuarios, permisos, roles
9. **Parámetros Generales** - Catálogos del sistema (monedas, países, impuestos, etc.)

## Módulo CxC - Estado Actual (el más avanzado)

### Rutas
```
/cxc/clientes                    → MaestroDetalle (lista)
/cxc/clientes/editar/:id         → ClienteForm (formulario)
/cxc/prestamos                   → MaestroDetalle (lista genérica)
/cxc/prestamos/editar/:id        → MaestroDetalleForm (formulario genérico)
```

### Componentes
- `clientes-manager` - Layout split (lista izquierda + detalle derecha)
- `cliente-form` - Formulario dual (inline vía `@Input()` + ruta)
- `maestro-detalle` / `maestro-detalle-form` - Componentes genéricos reutilizables

### Tabs del cliente (seleccionado)
1. **Estado de Cuenta** - Tabla con Fila, Fecha, D/C, Referencia, Concepto, Importe, Saldo footer
2. **Notas Crédito/Débito** - Formulario inline + lista
3. **Préstamos** - Formulario inline + lista
4. **Referencias** - Formulario inline + lista
5. **Parientes** - Formulario inline + lista

### Backend CxC
- **Controller:** `cxc.controller.ts` - Endpoints REST para todos los sub-recursos
- **Service:** `cxc.service.ts` - Lógica de negocio con QueryBuilder
- **Entities:** `cxccliente.entity.ts`, `cxcmovimiento.entity.ts`, `cxcprestamo.entity.ts`, `cxccclientesdir.entity.ts`, `cxcclientestel.entity.ts`, `cxccclientesref.entity.ts`, `cxcpariente.entity.ts`, `cxchisto.entity.ts`, `cxcsalfav.entity.ts`, `cxcprestamopp.entity.ts`
- **DTOs:** `cxc.dto.ts`

## Estándares de Código

### Frontend (Angular)
- **Signals** para estado local: `signal()`, `computed()`, `effect()` solo en field initializers
- **`takeUntilDestroyed(this.destroyRef)`** en TODA suscripción RxJS
- **`ChangeDetectionStrategy.OnPush`** en componentes
- **Prohibido** usar `new Date()` en templates
- **Prohibido** `style=""` inline; todo en SCSS
- **Prohibido** arrays inline `[{label, value}]` en HTML; siempre en TypeScript como `readonly` arrays

### UI/UX (PrimeNG)
- **Tokens de diseño:** Usar `--c-*` de `styles.scss` (ej: `var(--c-surface)`, `var(--c-primary)`)
- **Prohibido** variables PrimeNG nativas (`--surface-card`, `--primary-*`)
- **Grid:** `p-grid` / `p-col-12 p-col-6` para formularios de 2 columnas
- **Selects:** `p-select` para TODOS los dropdowns (nunca `p-dropdown` o `select` nativo)
- **Inputs:** `p-inputText`, `p-inputNumber`, `p-datepicker`
- **Botones:** `class="p-button-text"` (secundario) / `class="p-button-primary"` (primario)

### Formularios inline (estándar)
```html
<div class="card mb-3">
  <div class="p-fluid">
    <div class="p-grid">
      <div class="p-col-12 p-col-6">
        <div class="p-field">
          <label>Campo</label>
          <p-select [options]="opciones" ...></p-select>
        </div>
      </div>
      <!-- más campos en p-col-12 p-col-6 -->
      <div class="p-col-12">
        <div class="d-flex gap-2 justify-content-end mt-3">
          <p-button label="Limpiar" icon="pi pi-times" class="p-button-text" (click)="limpiar()"></p-button>
          <p-button label="Guardar" icon="pi pi-check" class="p-button-primary" [loading]="saving()" (click)="guardar()"></p-button>
        </div>
      </div>
    </div>
  </div>
</div>
```

### Backend (NestJS)
- **`ParseIntPipe`** solo en parámetros requeridos. Para opcionales, usar `@Query('page') page?: string` y parsear manualmente
- **`@JoinColumn`** simple vs composite: verificar PK de la entidad referenciada antes de usar composite
- **`leftJoinAndSelect`** solo en relaciones que existen en la entidad
- **DTOs** con class-validator: `@IsNumber()`, `@IsDateString()`, `@IsOptional()`
- **`@CurrentUser()`** para obtener usuario autenticado

### Archivos clave
- `src/styles.scss` - Tokens de diseño globales, fuentes (Mukta), utilidades
- `src/app/core/services/api.service.ts` - HTTP client con inyección automática de `empresaId`
- `src/app/core/interceptors/error.interceptor.ts` - Errores globales con PrimeNG toasts
- `src/app/core/interceptors/auth.interceptor.ts` - JWT Bearer injection
- `src/app/core/models/cxc.models.ts` - Interfaces TypeScript para CxC
- `src/app/core/models/facturacion.models.ts` - Config `MAESTRO_DETALLE` para forms genéricos
- `DIARIO_DESARROLLO.md` - Bitácora de trabajo diaria

## Errores conocidos y soluciones

| Error | Causa | Solución |
|-------|-------|----------|
| `NG0203: effect()` | `effect()` en `ngOnInit()` | Mover a field initializer (injection context) |
| `EPERM .angular/cache` | Cache de Vite en Windows | `npx ng build --clear-cache` o borrar `.angular/` |
| `Validation failed (numeric string is expected)` | `ParseIntPipe` en query param opcional | Cambiar a `@Query('page') page?: string` + `Number(page)` |
| `Unexpected closing tag "form"` | `<form>` anidado por componente PrimeNG | Quitar `<form>` exterior, usar `(onClick)` en submit |
| `leftJoinAndSelect` falla | Relación no existe en entity | Verificar `@ManyToOne`/`@JoinColumn` en la entity |
| Selects no toman ancho completo | PrimeNG 21 no aplica `width:100%` | Agregar CSS explícito `.p-select { width: 100% }` |

## Estado de progreso

### Completado
- ✅ CxC Clientes: CRUD completo con paginación server-side
- ✅ CxC Estado de Cuenta: Tabla con joins a módulos
- ✅ CxC Notas Crédito/Débito: Formulario inline
- ✅ CxC Préstamos: Formulario inline
- ✅ CxC Referencias: Formulario inline
- ✅ CxC Parientes: Formulario inline
- ✅ Formulario Cliente dual (inline + ruta)
- ✅ Estandarización visual de formularios
- ✅ Manejo de errores global con toasts
- ✅ Interceptores de auth

### Pendiente
- 🔄 Completar módulo CxP
- 🔄 Completar módulo Bancos
- 🔄 Completar módulo Contabilidad
- 🔄 Completar módulo Facturación
- 🔄 Completar módulo Configuración
- 🔄 Completar módulo Usuarios
- 🔄 Completar módulo Parámetros
- 🔄 Guards de autenticación (diferido)
- 🔄 Tipado estricto (eliminar `any`)

## Contexto del usuario

- El usuario es el **líder/arquitecto** del proyecto
- Habla **español** (Honduras)
- **NO preguntar "qué sigue"** hasta que el usuario lo diga explícitamente
- El usuario revisa visualmente en el navegador y da feedback en tiempo real
- Reiniciar backend manualmente después de cambios NestJS (`Ctrl+C` → `npm run start:dev`)
