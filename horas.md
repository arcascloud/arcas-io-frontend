# Estimado de Horas de Trabajo por Módulo

> Estimación generada el 30/10/2026 a partir de la bitácora de desarrollo, historial de commits y LOC actual de ambos repositorios.

## Metodología

| Base | Valor |
|---|---|
| Rango de fechas | 22/08/2026 – 30/10/2026 |
| Días activos | ~41 (bitácora `DIARIO_DESARROLLO.md` + AGENTS.md + 30 commits frontend + 6 commits backend) |
| Horas por día | ~6 h (rango plausible 5–7 h) |
| **Total base** | **~240 h** (rango 205–287 h) |
| Distribución | Participación por LOC actual (.ts/.html/.scss) de Frontend `src/app` y Backend `src` |
| Alcance | Incluye trabajo sin commitear (snapshot de código actual) |

- LOC total: **Frontend 111,339** + **Backend 47,944** = **159,283 líneas**.
- **Sesgo del método**: LOC sobreestima Frontend (HTML/SCSS verboso) y subestima Backend (lógica densa, pruebas E2E, scripts de DB y debugging que no generan líneas). Un ajuste backend ×1.3 movería ~10 h de FE a BE.

## Tabla de horas (base 240 h)

| Módulo | Frontend | Backend | Total |
|---|---:|---:|---:|
| Facturación (facturas, tickets, Tienda Virtual, OCR) | 38 h | 9 h | **47 h** |
| Contabilidad (catálogo, partidas, cierres, reportes) | 22 h | 17 h | **39 h** |
| Infraestructura (core, layout, interceptores, helpers) | 29 h | 1 h | **30 h** |
| CxC (clientes, caja, préstamos, cartas) | 19 h | 7 h | **26 h** |
| Planilla/RRHH | 10 h | 10 h | **20 h** |
| Inventario (kardex, tomas, traslados) | 11 h | 9 h | **20 h** |
| Usuarios/Seguridad (roles, permisos) | 10 h | 4 h | **14 h** |
| CxP (compras, OCR, movimientos) | 10 h | 4 h | **13 h** |
| Bancos (cuentas, cheques, conciliación) | 9 h | 3 h | **12 h** |
| Configuración/Empresas | 7 h | 2 h | **9 h** |
| Parámetros/Catálogos | 4 h | 5 h | **9 h** |
| Dashboard | 0.1 h | – | **~0 h** |
| **TOTAL** | **168 h** | **72 h** | **240 h** |

## Detalle por LOC

| Módulo | LOC FE | LOC BE |
|---|---:|---:|
| Facturación | 25,070 | 6,054 |
| Contabilidad | 14,268 | 11,596 |
| Infraestructura (core/layout/shared/helpers) | 19,151 | 679 |
| CxC | 12,889 | 4,714 |
| Planilla/RRHH | 6,865 | 6,610 |
| Inventario | 7,070 | 6,033 |
| Usuarios/Seguridad | 6,346 | 2,713 |
| CxP | 6,380 | 2,294 |
| Bancos | 5,727 | 2,088 |
| Configuración/Empresas | 4,854 | 1,393 |
| Parámetros/Catálogos | 2,652 | 3,507 |
| Dashboard | 67 | 0 |
| Infraestructura backend (shared/common/config/modules) | – | 263 |
| **TOTAL** | **111,339** | **47,944** |

## Escenarios por horas/día

| Escenario | Horas/día | Total proyecto |
|---|---:|---:|
| Conservador | 5 h | **205 h** |
| Base | 6 h | **240 h** |
| Intensivo | 7 h | **287 h** |

Para escalar un módulo a otro escenario: multiplicar sus horas por el factor (205/240 = 0.85; 287/240 = 1.20).

## Fuentes

- `DIARIO_DESARROLLO.md` — bitácora diaria (desde 22/08/2026).
- `AGENTS.md` — bitácoras consolidadas por fecha.
- `git log` Frontend (30 commits, 03/09–29/10/2026) y Backend (6 commits, 03/09–18/09/2026).
- Conteo de LOC por directorio de `Frontend/src/app` y `Backend/src`.
