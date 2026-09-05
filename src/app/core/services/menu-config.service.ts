import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';

/** Configuración de un elemento del menú lateral */
export interface MenuItemConfig {
  /** Texto visible del menú */
  label: string;
  /** Clase del ícono (Font Awesome sin prefijo 'fa-') */
  icon: string;
  /** Ruta de navegación (si tiene ruta, es un enlace directo) */
  route?: string;
  /** Roles que pueden ver este elemento (si se omite, es visible para todos) */
  roles?: string[];
  /** Submenús anidados */
  children?: MenuItemConfig[];
}

@Injectable({ providedIn: 'root' })
export class MenuConfigService {
  private auth = inject(AuthService);

  /**
   * Obtiene la estructura completa del menú lateral filtrada por el rol del usuario actual.
   * Los elementos sin propiedad `roles` son visibles para todos los usuarios autenticados.
   * @returns Arreglo de elementos del menú con sus hijos anidados
   */
  getMenuItems(): MenuItemConfig[] {
    const rol = this.auth.currentUser()?.rol ?? '';

    const all: MenuItemConfig[] = [
      { label: 'Dashboard', icon: 'home', route: '/dashboard' },

      {
        label: 'Inventario', icon: 'box', route: '/inventario',
        roles: ['admin', 'supervisor', 'contador', 'aux_contable', 'jefe_bodega', 'aux_bodega'],
        children: [
          { label: 'Productos', icon: 'tag', route: '/inventario/productos' },
          { label: 'Existencias', icon: 'warehouse', route: '/inventario/existencias' },
          { label: 'Kardex', icon: 'history', route: '/inventario/kardex' },
          { label: 'Requisiciones', icon: 'file', route: '/inventario/requisiciones' },
          {
            label: 'Operaciones', icon: 'cogs', children: [
              { label: 'Compras', icon: 'shopping-cart', route: '/inventario/compras' },
              { label: 'Consulta de Compras', icon: 'search', route: '/inventario/consulta-compras' },
              { label: 'Toma de Inventarios', icon: 'clipboard', route: '/inventario/toma-inventarios' },
              { label: 'Ajuste de Inventarios', icon: 'sliders-h', route: '/inventario/ajustes' },
              { label: 'Traslados de Productos', icon: 'exchange-alt', route: '/inventario/traslados' },
            ],
          },
          {
            label: 'Catálogos', icon: 'book', children: [
              { label: 'Categorías', icon: 'list', route: '/inventario/categorias' },
              { label: 'Marcas', icon: 'bookmark', route: '/inventario/marcas' },
              { label: 'Modelos', icon: 'th-large', route: '/inventario/modelos' },
              { label: 'Colores', icon: 'palette', route: '/inventario/colores' },
              { label: 'Unidades de Medida', icon: 'arrows-h', route: '/inventario/unidades-medida' },
              { label: 'Embalajes', icon: 'box', route: '/inventario/embalajes' },
              { label: 'Bodegas', icon: 'building', route: '/inventario/bodegas' },
              { label: 'Ubicaciones', icon: 'map-marker', route: '/inventario/ubicaciones' },
              { label: 'Pasillos', icon: 'align-justify', route: '/inventario/pasillos' },
              { label: 'Casas', icon: 'home', route: '/inventario/casas' },
              { label: 'Tags', icon: 'tags', route: '/inventario/tags' },
            ],
          },
        ],
      },

      {
        label: 'Facturacion', icon: 'file-edit', route: '/facturacion',
        roles: ['admin', 'supervisor', 'contador', 'aux_contable', 'gestor_venta'],
        children: [
          { label: 'Facturar', icon: 'plus', route: '/facturacion/nueva-factura' },
          { label: 'Tienda Virtual', icon: 'shopping-bag', route: '/facturacion/tienda' },
          { label: 'Pedidos Virtual', icon: 'shopping-cart', route: '/facturacion/pedidos-virtual' },
          { label: 'Consulta de Facturas', icon: 'file', route: '/facturacion/consultas' },
          { label: 'Consultar Cotizaciones', icon: 'file', route: '/facturacion/cotizaciones' },
          { label: 'Consultar Pedidos', icon: 'shopping-cart', route: '/facturacion/pedidos' },
          { label: 'Anular Factura', icon: 'file-times', route: '/facturacion/facturas-anul' },
          { label: 'Combos', icon: 'boxes', route: '/facturacion/combos' },
          { label: 'Descuentos', icon: 'percent', route: '/facturacion/descuentos' },
        ],
      },

      {
        label: 'Cuentas por Cobrar', icon: 'wallet', route: '/cxc',
        roles: ['admin', 'supervisor', 'contador', 'aux_contable'],
        children: [
          { label: 'Caja', icon: 'dollar', route: '/cxc/caja' },
          { label: 'Clientes', icon: 'users', route: '/cxc/clientes' },
          { label: 'Préstamos', icon: 'pi pi-briefcase', route: '/cxc/prestamos' },
          { label: 'Movimientos', icon: 'history', route: '/cxc/movimientos' },
          { label: 'Histórico', icon: 'book', route: '/cxc/historico' },
          { label: 'Antigüedad de Saldos', icon: 'chart-bar', route: '/cxc/antiguedad-saldos' },
          { label: 'Cartas de Recordatorio', icon: 'envelope', route: '/cxc/cartas-recordatorio' },
        ],
      },

      {
        label: 'Cuentas por Pagar', icon: 'credit-card', route: '/cxp',
        roles: ['admin', 'supervisor', 'contador', 'aux_contable'],
        children: [
          { label: 'Proveedores', icon: 'users', route: '/cxp/proveedores' },
          { label: 'Compras', icon: 'shopping-bag', route: '/cxp/compras' },
          { label: 'Movimientos', icon: 'history', route: '/cxp/movimientos' },
          { label: 'Históricos', icon: 'book', route: '/cxp/historicos' },
          { label: 'Saldos a favor', icon: 'heart', route: '/cxp/saldos-av' },
        ],
      },

      {
        label: 'Bancos', icon: 'building', route: '/bancos',
        roles: ['admin', 'supervisor', 'contador', 'aux_contable'],
        children: [
          { label: 'Bancos', icon: 'building', route: '/bancos/bancos' },
          { label: 'Cuentas', icon: 'wallet', route: '/bancos/cuentas' },
          { label: 'Conciliaciones', icon: 'file-check', route: '/bancos/conciliaciones' },
          { label: 'Direcciones', icon: 'map-marker', route: '/bancos/direcciones' },
          { label: 'Teléfonos', icon: 'phone', route: '/bancos/telefonos' },
        ],
      },

      {
        label: 'Planilla', icon: 'id-card', route: '/planilla',
        roles: ['admin', 'supervisor', 'contador', 'aux_contable', 'rrhh'],
        children: [
          { label: 'Empleados', icon: 'user', route: '/planilla/empleados' },
          { label: 'Puestos', icon: 'briefcase', route: '/planilla/puestos' },
          { label: 'Profesiones', icon: 'graduation-cap', route: '/planilla/profesiones' },
          { label: 'Deducciones', icon: 'minus', route: '/planilla/deducciones' },
          { label: 'Ingresos', icon: 'plus', route: '/planilla/ingresos' },
          { label: 'Titulaciones', icon: 'award', route: '/planilla/titulaciones' },
          { label: 'Certificaciones', icon: 'id-card', route: '/planilla/certificaciones' },
          { label: 'Asistencia', icon: 'clock', route: '/planilla/asistencia' },
          { label: 'Comisiones', icon: 'money-bill-wave', route: '/planilla/comisiones' },
          { label: 'Deducciones por Empleado', icon: 'minus-circle', route: '/planilla/deducciones-emp' },
          { label: 'Planillas', icon: 'money-check', route: '/planilla/planillas' },
        ],
      },

      {
        label: 'Contabilidad', icon: 'chart-bar', route: '/contabilidad',
        roles: ['admin', 'supervisor', 'contador', 'aux_contable'],
        children: [
          { label: 'Cuentas Contables', icon: 'list', route: '/contabilidad/ctacontables' },
          { label: 'Grupo Contable', icon: 'sitemap', route: '/contabilidad/grupocontable' },
          { label: 'Niveles', icon: 'layer-group', route: '/contabilidad/nivelcta' },
          { label: 'Naturaleza de Cuenta', icon: 'balance-scale', route: '/contabilidad/naturalezacta' },
          { label: 'Saldos', icon: 'chart-line', route: '/contabilidad/saldoscta' },
          { label: 'Tipos Doc Fiscal', icon: 'file-signature', route: '/contabilidad/tipos-doc-fiscal' },
          { label: 'Impuesto Vecinal', icon: 'landmark', route: '/contabilidad/impuestovecinal' },
          { label: 'Factor de Cambio', icon: 'dollar', route: '/contabilidad/factordecambio' },
          { label: 'Cierres', icon: 'lock', route: '/contabilidad/cierrectable' },
          { label: 'Periodos', icon: 'calendar-check', route: '/contabilidad/periodoctable' },
          { label: 'Plantillas PDA', icon: 'file-edit', route: '/contabilidad/plantillapdamae' },
          { label: 'Plantillas Balances', icon: 'chart-pie', route: '/contabilidad/plantillabalancesmae' },
          { label: 'Partidas de Diario', icon: 'receipt', route: '/contabilidad/copdamae' },
          { label: 'Mov. de Cuentas', icon: 'arrows-spin', route: '/contabilidad/movcta' },
          { label: 'Rep. Liquidez', icon: 'water', route: '/contabilidad/repliquidez' },
          { label: 'Rep. Diarios', icon: 'newspaper', route: '/contabilidad/repdiarios' },
          { label: 'Rep. Balances', icon: 'chart-bar', route: '/contabilidad/repbalances' },
        ],
      },

      {
        label: 'Configuracion', icon: 'cog', route: '/configuracion',
        children: [
          { label: 'Empresas', icon: 'building', route: '/configuracion/empresas' },
          {
            label: 'Usuarios', icon: 'users',
            children: [
              { label: 'Usuarios', icon: 'user', route: '/configuracion/usuarios' },
              { label: 'Modulos por Usuario', icon: 'user-plus', route: '/configuracion/usuarios/usuario-modulos' },
              { label: 'Menu por Usuario', icon: 'bars', route: '/configuracion/usuarios/usuario-mnuitem' },
              { label: 'Scripts por Usuario', icon: 'code', route: '/configuracion/usuarios/usuario-scripts' },
              { label: 'Permisos Especiales', icon: 'key', route: '/configuracion/usuarios/usuario-modauth' },
            ],
          },
          {
            label: 'Parametros', icon: 'cog',
            roles: ['admin', 'supervisor', 'contador', 'aux_contable'],
            children: [
              { label: 'Correlativos', icon: 'hashtag', route: '/configuracion/parametros/correlativos' },
              { label: 'Estados', icon: 'flag', route: '/configuracion/parametros/estados' },
              { label: 'Formas de Pago', icon: 'credit-card', route: '/configuracion/parametros/formas-pago' },
              { label: 'Monedas', icon: 'dollar', route: '/configuracion/parametros/monedas' },
              { label: 'Impuestos', icon: 'percentage', route: '/configuracion/parametros/impuestos' },
              { label: 'Países', icon: 'globe', route: '/configuracion/parametros/paises' },
              { label: 'Departamentos (País)', icon: 'map', route: '/configuracion/parametros/departamentos-pais' },
              { label: 'Departamentos Empresa', icon: 'building', route: '/configuracion/parametros/departamentos-empresa' },
              { label: 'Direcciones', icon: 'map-marker', route: '/configuracion/parametros/direcciones' },
              { label: 'Teléfonos', icon: 'phone', route: '/configuracion/parametros/telefonos' },
              { label: 'Tarjetas de Crédito', icon: 'credit-card', route: '/configuracion/parametros/tarjetas-credito' },
              { label: 'Pasatiempos', icon: 'heart', route: '/configuracion/parametros/pasatiempos' },
              { label: 'Zonas', icon: 'map', route: '/configuracion/parametros/zonas' },
              { label: 'Gestores', icon: 'user', route: '/configuracion/parametros/gestores' },
              { label: 'Proformas', icon: 'file', route: '/configuracion/parametros/proformas' },
              { label: 'Zonas Venta/Cobro', icon: 'map', route: '/configuracion/parametros/zonas-vta-cob' },
              { label: 'Cajeros', icon: 'user', route: '/configuracion/parametros/cajeros' },
              { label: 'Días de Cobro', icon: 'calendar', route: '/configuracion/parametros/dias-cobro' },
            ],
          },
          {
            label: 'Settings por Módulo', icon: 'sliders-h',
            children: [
              { label: 'Bancos', icon: 'building', route: '/configuracion/settings/param-bco' },
              { label: 'Contabilidad', icon: 'chart-bar', route: '/configuracion/settings/param-con' },
              { label: 'Cuentas por Cobrar', icon: 'wallet', route: '/configuracion/settings/param-cxc' },
              { label: 'Cuentas por Pagar', icon: 'handshake', route: '/configuracion/settings/param-cxp' },
              { label: 'Facturación', icon: 'file-edit', route: '/configuracion/settings/param-fac' },
              { label: 'Inventario', icon: 'box', route: '/configuracion/settings/param-inv' },
              { label: 'Papelería', icon: 'book', route: '/configuracion/settings/param-pap' },
              { label: 'Planilla', icon: 'id-card', route: '/configuracion/settings/param-pla' },
              { label: 'Préstamos', icon: 'hand-holding-usd', route: '/configuracion/settings/param-pres' },
              { label: 'IA', icon: 'robot', route: '/configuracion/settings/param-ia' },
            ],
          },
        ],
      },
    ];

    return all;
  }
}
