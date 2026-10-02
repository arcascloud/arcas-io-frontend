// ============================================================================
// contabilidad.service.ts  (NestJS)
// REEMPLAZA findSaldosCtaDetalle (el original, sin lo de mayorización)
//
// Cambios respecto al original:
// 1. Agrupa por periodo + nropartida (antes solo nropartida) para que el frontend
//    arme el bloque de cada mes. Orden: mes ascendente (el saldo se acumula en
//    orden cronológico); dentro del mes, nropartida DESC como ya lo tenías.
// 2. Filtra por a.anio y a.periodo (mismo criterio que calcularSaldosCta) en vez
//    de YEAR(fecharegistro), para que el detalle cuadre con las columnas de meses.
// 3. Mantiene la doble bandera sn_anulada='N' + sn_contabilizada='S'.
// ============================================================================
async findSaldosCtaDetalle(ctacontable: string, anio: number | undefined, empresaId: number) {
  if (!ctacontable) {
    throw new BadRequestException('El parámetro ctacontable es requerido');
  }

  const qb = this.copdadetRepo.createQueryBuilder('a')
    .select('a.periodo', 'periodo')
    .addSelect('a.nropartida', 'nropartida')
    .addSelect('MIN(a.fecharegistro)', 'fecharegistro')
    .addSelect('SUM(a.debito)', 'debito')
    .addSelect('SUM(a.credito)', 'credito')
    .where('a.ctacontable = :ctacontable', { ctacontable })
    .andWhere('a.empresaId = :empresaId', { empresaId })
    .andWhere("a.sn_anulada = 'N'")
    .andWhere("a.sn_contabilizada = 'S'")
    .andWhere('a.periodo IS NOT NULL');

  if (anio) {
    qb.andWhere('a.anio = :anio', { anio });
  }

  const movimientos = await qb
    .groupBy('a.periodo')
    .addGroupBy('a.nropartida')
    .orderBy('a.periodo', 'ASC')
    .addOrderBy('a.nropartida', 'DESC')
    .getRawMany();

  const cta = await this.ctacontablesRepo.findOne({ where: { ctacontable, empresaId } });

  let totalDebito = 0;
  let totalCredito = 0;
  for (const m of movimientos) {
    totalDebito += Number(m.debito) || 0;
    totalCredito += Number(m.credito) || 0;
  }

  return {
    descripcion: cta?.descripcion ?? '',
    movimientos, // ahora cada fila trae `periodo`
    totales: { debito: totalDebito, credito: totalCredito },
  };
}
