-- =====================================================================
-- Repara la forma de pago registrada (23/11/2026)
-- Alcance verificado: 1 movimiento + 20 filas de posfaccaja
--   - 13 pagos EN EFECTIVO con importe_efectivo = 0
--   -  7 pagos NO efectivo con importe_efectivo > 0
-- NO modifica estructura ni ttipoparametros.
-- =====================================================================

START TRANSACTION;

-- Diagnóstico ANTES (esperado: movimientos_mal=1, efectivo_mal=13, otros_mal=7)
SELECT
  (SELECT COUNT(*)
     FROM poscajamovimiento m
     JOIN posfaccaja p ON p.facturaId = m.referencia_id
     JOIN ttipoformapago f ON f.formapagoId = p.formapagoId
    WHERE m.referencia_tipo = 'FACTURA'
      AND f.formapagoId = 1
      AND m.metodo_pago <> 'EFECTIVO') AS movimientos_mal,
  (SELECT COUNT(*)
     FROM posfaccaja
    WHERE formapagoId = 1
      AND importe_efectivo = 0
      AND importe_otros > 0) AS efectivo_mal,
  (SELECT COUNT(*)
     FROM posfaccaja
    WHERE formapagoId <> 1
      AND importe_efectivo > 0
      AND importe_otros = 0) AS otros_mal;

-- 1) Movimiento de caja de la factura 71: Efectivo mal registrado como Transferencia
UPDATE poscajamovimiento
   SET metodo_pago = 'EFECTIVO',
       tipo = 'VENTA_EFECTIVO'
 WHERE id = 2
   AND referencia_tipo = 'FACTURA'
   AND referencia_id = 71
   AND metodo_pago = 'TRANSFERENCIA'
   AND tipo = 'COBRO_TRANSFERENCIA';

-- 2) PAGOS EN EFECTIVO: el importe estaba en importe_otros
--    facturas: 6, 38, 39, 40, 53, 54, 55, 63, 64, 65, 67, 68, 71
UPDATE posfaccaja
   SET importe_efectivo = importe_otros,
       importe_otros = 0
 WHERE formapagoId = 1
   AND importe_efectivo = 0
   AND importe_otros > 0
   AND facturaId IN (6, 38, 39, 40, 53, 54, 55, 63, 64, 65, 67, 68, 71);

-- 3) PAGOS NO EFECTIVO (tarjeta/transferencia): el importe estaba en importe_efectivo
--    importe_efectivo - importe_cambio = total de la factura (verificado en las 7 filas)
--    facturas: 32, 33, 35, 36, 37, 69, 70
UPDATE posfaccaja
   SET importe_otros = importe_efectivo - importe_cambio,
       importe_efectivo = 0,
       importe_cambio = 0
 WHERE formapagoId <> 1
   AND importe_efectivo > 0
   AND importe_otros = 0
   AND facturaId IN (32, 33, 35, 36, 37, 69, 70);

-- Verificación DESPUES (esperado: movimientos_mal=0, efectivo_mal=0, otros_mal=0)
SELECT
  (SELECT COUNT(*)
     FROM poscajamovimiento m
     JOIN posfaccaja p ON p.facturaId = m.referencia_id
     JOIN ttipoformapago f ON f.formapagoId = p.formapagoId
    WHERE m.referencia_tipo = 'FACTURA'
      AND f.formapagoId = 1
      AND m.metodo_pago <> 'EFECTIVO') AS movimientos_mal,
  (SELECT COUNT(*)
     FROM posfaccaja
    WHERE formapagoId = 1
      AND importe_efectivo = 0
      AND importe_otros > 0) AS efectivo_mal,
  (SELECT COUNT(*)
     FROM posfaccaja
    WHERE formapagoId <> 1
      AND importe_efectivo > 0
      AND importe_otros = 0) AS otros_mal;

SELECT a.facturaId, b.descripcion, c.metodo_pago, c.tipo, c.monto
  FROM posfaccaja a
 INNER JOIN ttipoformapago b ON b.formapagoId = a.formapagoId
 INNER JOIN poscajamovimiento c ON c.referencia_id = a.facturaId
 WHERE a.facturaId = 71;

COMMIT;

-- Si algo no cuadra, cambia el COMMIT por ROLLBACK antes de ejecutar.
-- ROLLBACK;
