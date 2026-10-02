Recap: Libro Mayor — cómo mayoriza
Cadena de llamada (100% lectura)
libro-mayor.ts → ContabilidadService.generarLibroMayor()
   POST /api/contabilidad/reportes/libro-mayor        (contabilidad.controller.ts:1095)
   → ContabilidadLogicaService.generarLibroMayor()    (contabilidad-logica.service.ts:743-920)
¿Afecta tablas? NO — es 100% calculado en memoria
Verificado por barrido del método completo (líneas 743–920): cero .save() / .insert() / .update() / .delete(). Solo 3 lecturas:
#	Tabla	Qué trae	Filtro
1	coctamov	Movimientos del período (debe/haber)	empresaId + anio + periodo
2	cocierredet	Saldo acumulado del período anterior	empresaId + anioAnt + periodoAnt (ene→dic-1)
3	coctacontables	Catálogo de cuentas	empresaId + sn_activo='S'
La respuesta se arma y se descarta en cada petición: no se persiste nada, no hay caché, es idempotente (repetir el request da exactamente el mismo resultado).
Algoritmo de mayorización (paso a paso)
1. movMap — suma debe/haber por cuenta (nivel hoja).
2. saldoAcumMap — saldo del cierre anterior por cuenta.
3. Inicialización — solo cuentas operables (sn_operable='S') que tengan movimiento o acumulado: saldo = debe − haber.
4. Mayorización escalonada (contabilidad-logica.service.ts:850):
for (nivel = maxNivel; nivel >= 1; nivel--)
  para cada cuenta NO operable de ese nivel:
    total = Σ hijos en resMap  +  movimientos propios  +  acumulado propio
    si tiene movimiento o acumulado ≠ 0 → se agrega al resultado
5. Salida — array ordenado por código, saldo = |debe − haber| y saldoAcum = |…| (siempre positivos; la dirección D/C la da naturaleza).
Las escrituras que ves en ese archivo NO son de Libro Mayor
contabilidad-logica.service.ts sí tiene .save()/.update() (líneas 107, 129, 293, 352, 518, 562, 1219, 1281…), pero pertenecen a otros métodos: contabilizarPartida() (crea copdamae + copdadet y actualiza coctamov/coctasaldos), cierre de período (cocierremae/coperiodoctable/cocierredet), anulaciones e integración facturación — se invocan desde otros endpoints, no desde reportes/libro-mayor.
Observaciones (por si querés ajustar algo)
1. Jerarquía por campo padre, no por prefijo de código: si una cuenta hija no tiene padre cargado en coctacontables, no se suma al padre. (El Balance Dinámico sí suma por prefijo y por padre — comportamientos distintos.)
2. Saldo acumulado solo viene del cierre: si un período nunca se cerró, saldoAcum = 0 (no suma movimientos de períodos anteriores).
3. Un padre con movimientos propios los incluye además de sus hijos.
4. Solo se muestran cuentas con movimiento o acumulado ≠ 0 (las vacías no aparecen).
5. Los exports (PDF/Excel/Word) también son locales en libro-mayor.ts — sin tocar el backend.