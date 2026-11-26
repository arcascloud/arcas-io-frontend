-- Solo lectura: detecta desincronizaciones entre ttipoformapago, poscajamovimiento y posfaccaja.
-- Ejecutar después del fix debe devolver 0 filas en las 5 consultas.

-- 1) Efectivo mal registrado
SELECT c.id, c.referencia_id AS facturaId, b.descripcion AS forma,
       c.metodo_pago, c.tipo, c.monto
  FROM poscajamovimiento c
  JOIN posfaccaja a ON a.facturaId = c.referencia_id AND c.referencia_tipo = 'FACTURA'
  JOIN ttipoformapago b ON b.formapagoId = a.formapagoId
 WHERE b.formapagoId = 1 AND c.metodo_pago <> 'EFECTIVO'
 ORDER BY c.id;

-- 2) Tarjeta mal registrada
SELECT c.id, c.referencia_id AS facturaId, b.descripcion AS forma,
       c.metodo_pago, c.tipo, c.monto
  FROM poscajamovimiento c
  JOIN posfaccaja a ON a.facturaId = c.referencia_id AND c.referencia_tipo = 'FACTURA'
  JOIN ttipoformapago b ON b.formapagoId = a.formapagoId
 WHERE b.formapagoId = 2 AND c.metodo_pago <> 'TARJETA'
 ORDER BY c.id;

-- 3) Transferencia mal registrada
SELECT c.id, c.referencia_id AS facturaId, b.descripcion AS forma,
       c.metodo_pago, c.tipo, c.monto
  FROM poscajamovimiento c
  JOIN posfaccaja a ON a.facturaId = c.referencia_id AND c.referencia_tipo = 'FACTURA'
  JOIN ttipoformapago b ON b.formapagoId = a.formapagoId
 WHERE b.formapagoId = 3 AND c.metodo_pago <> 'TRANSFERENCIA'
 ORDER BY c.id;

-- 4) Efectivo con el importe en la columna equivocada
SELECT posfaccajaId, facturaId, formapagoId, importe_efectivo, importe_otros
  FROM posfaccaja
 WHERE formapagoId = 1 AND importe_efectivo = 0 AND importe_otros > 0
 ORDER BY facturaId;

-- 5) No efectivo (tarjeta/transferencia) con el importe en importe_efectivo
SELECT posfaccajaId, facturaId, formapagoId, importe_efectivo, importe_otros, importe_cambio
  FROM posfaccaja
 WHERE formapagoId <> 1 AND importe_efectivo > 0 AND importe_otros = 0
 ORDER BY facturaId;
