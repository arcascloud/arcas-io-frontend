# Plan: Refactorizar CRUD - Dialogs a Páginas Separadas

## Contexto
Los 6 componentes CRUD de la sección Usuarios actualmente usan `<p-dialog>` para crear/editar registros. El usuario quiere mover los formularios a páginas/rutas separadas (como su proyecto "junta de agua"), usando solo componentes PrimeNG (`<p-card>`, `<p-button>`, etc.) en los formularios. Los dialogs solo se usarán para confirmaciones (ej: eliminar).

## Estructura de Rutas Actual → Nueva

```
USUARIOS_ROUTES:
  ''               → redirect lista
  'lista'          → ListaUsuarios (solo tabla)
  'lista/nuevo'    → UsuarioForm (crear)         ← NUEVO
  'lista/editar/:id' → UsuarioForm (editar)      ← NUEVO
  'modulos'        → Modulos (solo tabla)
  'modulos/nuevo'  → ModuloForm (crear)           ← NUEVO
  'modulos/editar/:id' → ModuloForm (editar)      ← NUEVO
  ... (mismo patrón para los 4 restantes)
```

## Archivos a Crear (7)

### 1. `src/app/core/services/modulos.service.ts`
Servicio dedicado para Modulos (no existe, se crea igual que los demás).

### 2. `src/app/features/usuarios/lista-usuarios/usuario-form.ts`
- Componente standalone para crear/editar `Usuario`
- Detecta modo por `activatedRoute.snapshot.paramMap.get('id')`
- PrimeNG: `p-card` (contenedor), `p-inputText` (campos), `p-button` (guardar/cancelar), `p-toast`
- Carga datos vía `UsuariosService.getOne()` en modo edición
- Guarda vía `UsuariosService.create()` o `.update()`
- Navega de vuelta a `/usuarios/lista` al cancelar/guardar

### 3. `src/app/features/usuarios/modulos/modulo-form.ts`
- PrimeNG: `p-card`, `p-inputText`, `p-button`, `p-toast`
- Campo: `descripcion`
- Servicio: `ModulosService` (nuevo)

### 4. `src/app/features/usuarios/usuario-modulos/usuario-modulos-form.ts`
- PrimeNG: `p-card`, `p-select` (usuario, módulo), `p-select` S/N (3 permisos), `p-button`, `p-toast`
- Carga listas de usuarios y módulos para los selects
- Servicio: `UsuariosModuleService`

### 5. `src/app/features/usuarios/usuario-mnuitem/usuario-mnuitem-form.ts`
- PrimeNG: `p-card`, `p-select` (usuario, módulo), `p-inputText` (nameItem, labelItem, routerLink, iconItem), `p-inputNumber` (parentId, levelId), `p-button`, `p-toast`
- Servicio: `UsuariosMnuItemService`

### 6. `src/app/features/usuarios/usuario-modauth/usuario-modauth-form.ts`
- PrimeNG: `p-card`, `p-select` (usuario), `p-toggleswitch` (5 permisos), `p-button`, `p-toast`
- Conversión boolean ↔ `'S'`/`'N'`
- Servicio: `UsuarioModAuthService`

### 7. `src/app/features/usuarios/usuario-scripts/usuario-scripts-form.ts`
- PrimeNG: `p-card`, `p-inputText` (usuario, script), `p-button`, `p-toast`
- Servicio: `UsuariosScriptsService`

## Archivos a Modificar (7)

### 8. `src/app/features/usuarios/usuarios.routes.ts`
Agregar rutas hijas para cada form (nuevo + editar/:id).

### 9-14. Los 6 componentes de lista
Cada uno:
- **Eliminar**: `<p-dialog>`, campos del form, lógica de `showDialog`/`form`/`openNew()`/`openEdit()`/`save()`
- **Agregar**: `Router` para navegar a `./nuevo` y `./editar/:id`
- **Mantener**: `<p-table>`, carga de datos, `<p-toast>`, `<p-confirmDialog>` (donde exista)

### 15. `src/app/core/services/modulos.service.ts` (crear)

## Orden de Ejecución
1. Crear `modulos.service.ts`
2. Crear los 6 formularios (uno por uno)
3. Modificar los 6 componentes de lista (quitar dialogs, agregar navegación)
4. Actualizar `usuarios.routes.ts` con las nuevas rutas
5. Build y verificar 0 errores
