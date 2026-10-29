import { Routes } from '@angular/router';
import { CatalogoConfig } from './catalogo-list/catalogo-list';

export const INVENTARIO_ROUTES: Routes = [
  { path: '', redirectTo: 'productos', pathMatch: 'full' },

  // Productos
  { path: 'productos', loadComponent: () => import('./productos/productos').then(m => m.Productos) },
  { path: 'productos/nuevo', loadComponent: () => import('./productos/producto-form').then(m => m.ProductoForm) },
  { path: 'productos/editar/:id', loadComponent: () => import('./productos/producto-form').then(m => m.ProductoForm) },

  // Categorías
  { path: 'categorias', data: { catalogo: { titulo: 'Categorías', subtitulo: 'Administración de categorías de productos', ruta: '/inventario/categorias', idKey: 'categoriaId', icono: 'pi-tags', tituloNuevo: 'Nueva categoría', campos: [{ key: 'descripcion', label: 'Descripción' }] } satisfies CatalogoConfig }, loadComponent: () => import('./catalogo-list/catalogo-list').then(m => m.CatalogoList) },
  { path: 'categorias/nuevo', data: { nombre: 'categorias' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-form').then(m => m.CatalogoForm) },
  { path: 'categorias/editar/:id', data: { nombre: 'categorias' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-form').then(m => m.CatalogoForm) },

  // Marcas
  { path: 'marcas', data: { catalogo: { titulo: 'Marcas', subtitulo: 'Administración de marcas', ruta: '/inventario/marcas', idKey: 'marcaId', icono: 'pi-bookmark', tituloNuevo: 'Nueva marca', campos: [{ key: 'descripcion', label: 'Descripción' }] } satisfies CatalogoConfig }, loadComponent: () => import('./catalogo-list/catalogo-list').then(m => m.CatalogoList) },
  { path: 'marcas/nuevo', data: { nombre: 'marcas' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-form').then(m => m.CatalogoForm) },
  { path: 'marcas/editar/:id', data: { nombre: 'marcas' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-form').then(m => m.CatalogoForm) },

  // Modelos
  { path: 'modelos', data: { catalogo: { titulo: 'Modelos', subtitulo: 'Administración de modelos', ruta: '/inventario/modelos', idKey: 'modeloId', icono: 'pi-box', tituloNuevo: 'Nuevo modelo', campos: [{ key: 'descripcion', label: 'Descripción' }] } satisfies CatalogoConfig }, loadComponent: () => import('./catalogo-list/catalogo-list').then(m => m.CatalogoList) },
  { path: 'modelos/nuevo', data: { nombre: 'modelos' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-form').then(m => m.CatalogoForm) },
  { path: 'modelos/editar/:id', data: { nombre: 'modelos' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-form').then(m => m.CatalogoForm) },

  // Colores
  { path: 'colores', data: { catalogo: { titulo: 'Colores', subtitulo: 'Administración de colores', ruta: '/inventario/colores', idKey: 'colorId', icono: 'pi-palette', tituloNuevo: 'Nuevo color', campos: [{ key: 'descripcion', label: 'Descripción' }] } satisfies CatalogoConfig }, loadComponent: () => import('./catalogo-list/catalogo-list').then(m => m.CatalogoList) },
  { path: 'colores/nuevo', data: { nombre: 'colores' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-form').then(m => m.CatalogoForm) },
  { path: 'colores/editar/:id', data: { nombre: 'colores' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-form').then(m => m.CatalogoForm) },

  // Unidades de Medida
  { path: 'unidades-medida', data: { catalogo: { titulo: 'Unidades de Medida', subtitulo: 'Administración de unidades de medida', ruta: '/inventario/unidades-medida', idKey: 'unidadmedidaId', icono: 'pi-arrows-h', tituloNuevo: 'Nueva unidad', campos: [{ key: 'descripcion', label: 'Descripción' }] } satisfies CatalogoConfig }, loadComponent: () => import('./catalogo-list/catalogo-list').then(m => m.CatalogoList) },
  { path: 'unidades-medida/nuevo', data: { nombre: 'unidades-medida' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-form').then(m => m.CatalogoForm) },
  { path: 'unidades-medida/editar/:id', data: { nombre: 'unidades-medida' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-form').then(m => m.CatalogoForm) },

  // Embalajes
  { path: 'embalajes', data: { catalogo: { titulo: 'Embalajes', subtitulo: 'Administración de embalajes', ruta: '/inventario/embalajes', idKey: 'embalajeId', icono: 'pi-shopping-bag', tituloNuevo: 'Nuevo embalaje', campos: [{ key: 'descripcion', label: 'Descripción' }] } satisfies CatalogoConfig }, loadComponent: () => import('./catalogo-list/catalogo-list').then(m => m.CatalogoList) },
  { path: 'embalajes/nuevo', data: { nombre: 'embalajes' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-form').then(m => m.CatalogoForm) },
  { path: 'embalajes/editar/:id', data: { nombre: 'embalajes' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-form').then(m => m.CatalogoForm) },

  // Bodegas
  { path: 'bodegas', data: { catalogo: { titulo: 'Bodegas', subtitulo: 'Administración de bodegas', ruta: '/inventario/bodegas', idKey: 'bodegaId', icono: 'pi-building', tituloNuevo: 'Nueva bodega', campos: [{ key: 'descripcion', label: 'Descripción' }] } satisfies CatalogoConfig }, loadComponent: () => import('./catalogo-list/catalogo-list').then(m => m.CatalogoList) },
  { path: 'bodegas/nuevo', data: { nombre: 'bodegas' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-form').then(m => m.CatalogoForm) },
  { path: 'bodegas/editar/:id', data: { nombre: 'bodegas' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-form').then(m => m.CatalogoForm) },

  // Ubicaciones
  { path: 'ubicaciones', data: { catalogo: { titulo: 'Ubicaciones', subtitulo: 'Administración de ubicaciones', ruta: '/inventario/ubicaciones', idKey: 'ubicacionId', icono: 'pi-map-marker', tituloNuevo: 'Nueva ubicación', campos: [{ key: 'descripcion', label: 'Descripción' }] } satisfies CatalogoConfig }, loadComponent: () => import('./catalogo-list/catalogo-list').then(m => m.CatalogoList) },
  { path: 'ubicaciones/nuevo', data: { nombre: 'ubicaciones' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-form').then(m => m.CatalogoForm) },
  { path: 'ubicaciones/editar/:id', data: { nombre: 'ubicaciones' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-form').then(m => m.CatalogoForm) },

  // Pasillos
  { path: 'pasillos', data: { catalogo: { titulo: 'Pasillos', subtitulo: 'Administración de pasillos', ruta: '/inventario/pasillos', idKey: 'pasilloId', icono: 'pi-directions', tituloNuevo: 'Nuevo pasillo', campos: [{ key: 'descripcion', label: 'Descripción' }] } satisfies CatalogoConfig }, loadComponent: () => import('./catalogo-list/catalogo-list').then(m => m.CatalogoList) },
  { path: 'pasillos/nuevo', data: { nombre: 'pasillos' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-form').then(m => m.CatalogoForm) },
  { path: 'pasillos/editar/:id', data: { nombre: 'pasillos' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-form').then(m => m.CatalogoForm) },

  // Casas
  { path: 'casas', data: { catalogo: { titulo: 'Casas', subtitulo: 'Administración de casas', ruta: '/inventario/casas', idKey: 'casaId', icono: 'pi-home', tituloNuevo: 'Nueva casa', campos: [{ key: 'descripcion', label: 'Descripción' }] } satisfies CatalogoConfig }, loadComponent: () => import('./catalogo-list/catalogo-list').then(m => m.CatalogoList) },
  { path: 'casas/nuevo', data: { nombre: 'casas' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-form').then(m => m.CatalogoForm) },
  { path: 'casas/editar/:id', data: { nombre: 'casas' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-form').then(m => m.CatalogoForm) },

  // Testantes
  { path: 'testantes', data: { catalogo: { titulo: 'Testantes', subtitulo: 'Administración de testantes', ruta: '/inventario/testantes', idKey: 'testanteId', icono: 'pi-verified', tituloNuevo: 'Nuevo testante', campos: [{ key: 'descripcion', label: 'Descripción' }] } satisfies CatalogoConfig }, loadComponent: () => import('./catalogo-list/catalogo-list').then(m => m.CatalogoList) },
  { path: 'testantes/nuevo', data: { nombre: 'testantes' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-form').then(m => m.CatalogoForm) },
  { path: 'testantes/editar/:id', data: { nombre: 'testantes' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-form').then(m => m.CatalogoForm) },

  // Tags
  { path: 'tags', data: { catalogo: { titulo: 'Tags', subtitulo: 'Administración de tags', ruta: '/inventario/tags', idKey: 'tagsId', icono: 'pi-hashtag', tituloNuevo: 'Nuevo tag', campos: [{ key: 'descripcion', label: 'Descripción' }] } satisfies CatalogoConfig }, loadComponent: () => import('./catalogo-list/catalogo-list').then(m => m.CatalogoList) },
  { path: 'tags/nuevo', data: { nombre: 'tags' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-form').then(m => m.CatalogoForm) },
  { path: 'tags/editar/:id', data: { nombre: 'tags' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-form').then(m => m.CatalogoForm) },

  // Proveedores
  { path: 'proveedores', loadComponent: () => import('./proveedores/proveedores').then(m => m.Proveedores) },
  { path: 'proveedores/nuevo', loadComponent: () => import('./proveedores/proveedor-form').then(m => m.ProveedorForm) },
  { path: 'proveedores/editar/:id', loadComponent: () => import('./proveedores/proveedor-form').then(m => m.ProveedorForm) },

  // Departamentos (tinvdeptos)
  { path: 'deptos', data: { nombre: 'deptos' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-generico').then(m => m.CatalogoGenerico) },
  { path: 'deptos/nuevo', data: { nombre: 'deptos' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-form').then(m => m.CatalogoForm) },
  { path: 'deptos/editar/:id', data: { nombre: 'deptos' }, loadComponent: () => import('../parametros/catalogo-generico/catalogo-form').then(m => m.CatalogoForm) },

  // Existencias (read-only)
  { path: 'existencias', loadComponent: () => import('./existencias/existencias').then(m => m.Existencias) },

  // Kardex (read-only)
  { path: 'kardex', loadComponent: () => import('./kardex/kardex').then(m => m.Kardex) },

  // Requisiciones
  { path: 'requisiciones', loadComponent: () => import('./requisiciones/requisiciones').then(m => m.Requisiciones) },

  // Operaciones
  { path: 'compras', redirectTo: '/cxp/compras', pathMatch: 'full' },
  { path: 'consulta-compras', loadComponent: () => import('./consulta-compras/consulta-compras').then(m => m.ConsultaCompras) },
  { path: 'toma-inventarios', loadComponent: () => import('./toma-inventarios/toma-inventarios').then(m => m.TomaInventarios) },
  { path: 'ajustes', loadComponent: () => import('./ajustes/ajustes').then(m => m.Ajustes) },
  { path: 'traslados', loadComponent: () => import('./traslados/traslados').then(m => m.Traslados) },

  { path: '**', redirectTo: 'productos' },
];
