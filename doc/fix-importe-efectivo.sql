-- =====================================================================
-- Solo posfaccaja: dejar importe_efectivo / importe_otros coherentes con formapagoId
-- Regla: si formapagoId = 1 (Efectivo) => importe_efectivo > 0, importe_otros = 0
--        si formapagoId <> 1            => importe_efectivo = 0, importe_otros > 0
-- Alcance verificado 23/11/2026: 13 + 7 = 20 filas.
-- NO toca poscajamovimiento ni ttipoparametros.
-- =====================================================================

START TRANSACTION;

-- ANTES (esperado: efectivo_mal=13, otros_mal=7)
SELECT
  (SELECT COUNT(*) FROM posfaccaja
    WHERE formapagoId = 1 AND importe_efectivo = 0 AND importe_otros > 0) AS efectivo_mal,
  (SELECT COUNT(*) FROM posfaccaja
    WHERE formapagoId <> 1 AND importe_efectivo > 0 AND importe_otros = 0) AS otros_mal;

-- 1) Efectivo con el importe en importe_otros (13 filas)
UPDATE posfaccaja
   SET importe_efectivo = importe_otros,
       importe_otros = 0
 WHERE formapagoId = 1
   AND importe_efectivo = 0
   AND importe_otros > 0
   AND facturaId IN (6, 38, 39, 40, 53, 54, 55, 63, 64, 65, 67, 68, 71);

-- 2) Tarjeta/transferencia con el importe en importe_efectivo (7 filas)
--    importe_efectivo - importe_cambio = total de la factura (verificado).
UPDATE posfaccaja
   SET importe_otros = importe_efectivo - importe_cambio,
       importe_efectivo = 0,
       importe_cambio = 0
 WHERE formapagoId <> 1
   AND importe_efectivo > 0
   AND importe_otros = 0
   AND facturaId IN (32, 33, 35, 36, 37, 69, 70);

-- DESPUES (esperado: efectivo_mal=0, otros_mal=0)
SELECT
  (SELECT COUNT(*) FROM posfaccaja
    WHERE formapagoId = 1 AND importe_efectivo = 0 AND importe_otros > 0) AS efectivo_mal,
  (SELECT COUNT(*) FROM posfaccaja
    WHERE formapagoId <> 1 AND importe_efectivo > 0 AND importe_otros = 0) AS otros_mal;

SELECT p.posfaccajaId, p.facturaId, p.formapagoId, f.descripcion,
       p.importe_efectivo, p.importe_otros, p.importe_cambio
  FROM posfaccaja p
  JOIN ttipoformapago f ON f.formapagoId = p.formapagoId
 WHERE p.facturaId IN (6, 32, 33, 35, 36, 37, 38, 39, 40, 53, 54, 55, 63, 64, 65, 67, 68, 69, 70, 71)
 ORDER BY p.facturaId;

COMMIT;

-- Si algo no cuadra, cambia el COMMIT por ROLLBACK antes de ejecutar.
-- ROLLBACK;
