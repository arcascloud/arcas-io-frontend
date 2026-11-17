/**
 * Regla de negocio — producto "solicitado bajo demanda"
 * (`productos.sn_solicitado_bajo_demanda` S/N, default 'N').
 *
 * Un producto bajo demanda NO exige existencia para poder venderse:
 *  - Tienda virtual: se puede agregar al carrito con existencia 0.
 *  - Facturación / Pedidos / Cotizaciones: se puede agregar a la factura.
 *  - Restaurante (mesero y escritorio): se puede tomar el pedido.
 *
 * El kardex sigue descontando igual: la existencia puede quedar en negativo
 * (es lo esperado, refleja la demanda sin reposición inmediata).
 */
export function esBajoDemanda(
  producto?: { sn_solicitado_bajo_demanda?: string | null } | null,
): boolean {
  return producto?.sn_solicitado_bajo_demanda === 'S';
}
