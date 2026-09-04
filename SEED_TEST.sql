-- SEED DE PRUEBAS - arcasdb
-- empresaId=2 para todos los registros

-- =====================================================
-- PARAMETROS
-- =====================================================

INSERT IGNORE INTO ttipomonedas (descripcion, simbolo, sn_activo, empresaId, usuarioCreated) VALUES
('Lempira', 'L', 'S', 2, 'admin'),
('Dolar', '$', 'S', 2, 'admin');

INSERT IGNORE INTO ttipopais (descripcion, sn_activo, empresaId, usuarioCreated) VALUES
('Honduras', 'S', 2, 'admin'),
('Guatemala', 'S', 2, 'admin');

INSERT IGNORE INTO ttipodeptopais (descripcion, sn_activo, empresaId, usuarioCreated) VALUES
('Francisco Morazan', 'S', 2, 'admin'),
('Cortes', 'S', 2, 'admin'),
('Colon', 'S', 2, 'admin');

INSERT IGNORE INTO ttipodeptoempresa (departamentostempresasId, descripcion, sn_activo, empresaId, usuarioCreated) VALUES
(1, 'Administracion', 'S', 2, 'admin'),
(2, 'Ventas', 'S', 2, 'admin'),
(3, 'Contabilidad', 'S', 2, 'admin'),
(4, 'Recursos Humanos', 'S', 2, 'admin'),
(5, 'Almacen', 'S', 2, 'admin');

INSERT IGNORE INTO ttipoformapago (descripcion, sn_activo, empresaId, usuarioCreated) VALUES
('Efectivo', 'S', 2, 'admin'),
('Tarjeta Credito', 'S', 2, 'admin'),
('Transferencia Bancaria', 'S', 2, 'admin'),
('Cheque', 'S', 2, 'admin');

INSERT IGNORE INTO ttipotelefono (descripcion, empresaId, sn_activo, usuarioCreated) VALUES
('Movil', 2, 'S', 'admin'),
('Fijo', 2, 'S', 'admin'),
('Trabajo', 2, 'S', 'admin');

INSERT IGNORE INTO ttipotarjetacredito (descripcion, sn_activo, empresaId, usuarioCreated) VALUES
('Visa', 'S', 2, 'admin'),
('MasterCard', 'S', 2, 'admin'),
('American Express', 'S', 2, 'admin');

INSERT IGNORE INTO ttipodirecciones (descripcion, sn_activo, empresaId, usuarioCreated) VALUES
('Fiscal', 'S', 2, 'admin'),
('Comercial', 'S', 2, 'admin'),
('Residencial', 'S', 2, 'admin');

INSERT IGNORE INTO ttipoestado (estadoId, descripcion, sn_activo, empresaId, usuarioCreated) VALUES
(1, 'Activo', 'S', 2, 'admin'),
(2, 'Inactivo', 'N', 2, 'admin'),
(3, 'Pendiente', 'S', 2, 'admin'),
(4, 'Anulado', 'N', 2, 'admin');

INSERT IGNORE INTO ttipoproforma (proformaId, Alto, bajo, izquierda, derecho, sn_activo, empresaId, usuarioCreated) VALUES
(1, '2', '1', '1', '1', 'S', 2, 'admin');

INSERT IGNORE INTO ttipogestores (moduloId, empleadoId, sn_activo, sn_vendedor, empresaId, usuarioCreated) VALUES
(4, 1, 'S', 'S', 2, 'admin'),
(6, 1, 'S', 'N', 2, 'admin');

INSERT IGNORE INTO ttipozonas (descripcion, sn_activo, empresaId, usuarioCreated) VALUES
('Zona Centro', 'S', 2, 'admin'),
('Zona Norte', 'S', 2, 'admin'),
('Zona Sur', 'S', 2, 'admin');

INSERT IGNORE INTO ttipozonasvtacob (tzonadId, gestorId, descripcion, sn_activo, empresaId, usuarioCreated) VALUES
(1, 1, 'Cobro Centro', 'S', 2, 'admin'),
(2, 1, 'Cobro Norte', 'S', 2, 'admin');

INSERT IGNORE INTO ttipoimpuestos (moduloId, descripcion, porcentaje, sn_activo, empresaId, usuarioCreated) VALUES
(4, 'ISV 15%', 15.00, 'S', 2, 'admin'),
(4, 'ISV 18%', 18.00, 'S', 2, 'admin');

INSERT IGNORE INTO ttipopasatiempos (descripcion, usuarioCreated) VALUES
('Futbol', 'admin'),
('Lectura', 'admin'),
('Natacion', 'admin');

INSERT IGNORE INTO ttipoparamfac (empresaId, bodegaId, nrofactura, nrocotizacion, nroanulacion, impuestoId, lineasFactura, diasDevolucion, porcentajeDevolucion, nrodpdaventas, nropdadevolucion, nropdaanulacion, sn_integrado_cxc, sn_puntoventa, sn_integrado_caja, sn_anticipos, sn_correlativoUnico, sn_multiplezcajeros, sn_imprimefactura, sn_multipleempresa, sn_impuestoincluido, usuarioCreated) VALUES
(2, 1, 1, 1, 1, 1, 20.00, 7.00, 100.00, 1, 1, 1, 'S', 'N', 'S', 'S', 'S', 'N', 'N', 'N', 'S', 'admin');

INSERT IGNORE INTO ttipoparaminv (bodegaId, nrocompra, nrotrasladoo, nroajuste, nrofisico, nrorequisicion, ImpuestoCompra, ImpuestoVenta, sn_requirelote, sn_supermercado, sn_multiplesprecios, empresaId, usuarioCreated) VALUES
(1, 1, 1, 1, 1, 1, 1, 1, 'N', 'N', 'N', 2, 'admin');

INSERT IGNORE INTO ttipoparambco (empresaId, usuarioCreated) VALUES
(2, 'admin');

INSERT IGNORE INTO ttipoparampla (nropartida, nroplanilla, techo, sn_validatecho, diaslaborales, empresaId, usuarioCreated) VALUES
(1.00, 1, 50000.00, 'N', 22, 2, 'admin');

INSERT IGNORE INTO ttipoparamcon (empresaId, nropartida, periodofiscal, aniofiscal, monedafiscalId, mascaracta, nombrecontador, nombregerente, nombreauditor, usuarioCreated) VALUES
(2, 1, 1, 2026, 1, '####-##-##-####', 'Juan Perez', 'Maria Lopez', 'Carlos Garcia', 'admin');

INSERT IGNORE INTO ttipoparampres (interes, mora, diasPlazo, limitecredito, ctacontable, empresaId, usuarioCreated) VALUES
(2.00, 3.00, 30.00, 50000.00, '1120-001', 2, 'admin');

INSERT IGNORE INTO ttipoparamcxc (empresaId, interes, mora, diasPlazo, limitecredito, ctacontable, usuarioCreated) VALUES
(2, 2.00, 3.00, 30.00, 50000.00, '1120-001', 'admin');

INSERT IGNORE INTO ttipoparamcxp (empresaId, nroproveedor, interes, mora, diasPlazo, limitecredito, ctacontable, usuarioCreated) VALUES
(2, 1, 1.50, 2.50, 45.00, 100000.00, '2110-001', 'admin');

-- =====================================================
-- USUARIOS - ACCESO POR MODULO
-- =====================================================

INSERT IGNORE INTO tusuariosmodule (empresaId, moduloId, usuario, sn_activo, submnudatos, submnurocesos, submnueportes, usuarioCreated) VALUES
(2, 1, 'admin', 'S', 'S', 'S', 'S', 'admin'),
(2, 2, 'admin', 'S', 'S', 'S', 'S', 'admin'),
(2, 3, 'admin', 'S', 'S', 'S', 'S', 'admin'),
(2, 4, 'admin', 'S', 'S', 'S', 'S', 'admin'),
(2, 5, 'admin', 'S', 'S', 'S', 'S', 'admin'),
(2, 6, 'admin', 'S', 'S', 'S', 'S', 'admin'),
(2, 7, 'admin', 'S', 'S', 'S', 'S', 'admin'),
(2, 8, 'admin', 'S', 'S', 'S', 'S', 'admin');

-- =====================================================
-- USUARIOS - MENU ITEMS
-- =====================================================

INSERT IGNORE INTO tusuariomnuitem (empresaId, moduloId, usuario, parent, parentId, levelId, nameParent, nameItem, labelItem, iconItem, routerLink, sn_activo, usuarioCreated) VALUES
(2, 1, 'admin', 0, 0, 1, 'root', 'inventario', 'Inventario', 'fi-layers', '/inventario', 'S', 'admin'),
(2, 1, 'admin', 1, 1, 2, 'inventario', 'productos', 'Productos', 'fi-box', '/inventario/productos', 'S', 'admin'),
(2, 1, 'admin', 1, 1, 2, 'inventario', 'categorias', 'Categorias', 'fi-tag', '/inventario/categorias', 'S', 'admin'),
(2, 2, 'admin', 0, 0, 1, 'root', 'contabilidad', 'Contabilidad', 'fi-book', '/contabilidad', 'S', 'admin'),
(2, 4, 'admin', 0, 0, 1, 'root', 'facturacion', 'Facturacion', 'fi-file-text', '/facturacion', 'S', 'admin'),
(2, 5, 'admin', 0, 0, 1, 'root', 'cxc', 'Cuentas por Cobrar', 'fi-dollar-sign', '/cxc', 'S', 'admin'),
(2, 6, 'admin', 0, 0, 1, 'root', 'cxp', 'Cuentas por Pagar', 'fi-credit-card', '/cxp', 'S', 'admin'),
(2, 7, 'admin', 0, 0, 1, 'root', 'planilla', 'Planilla', 'fi-users', '/planilla', 'S', 'admin');

-- =====================================================
-- USUARIOS - SCRIPTS
-- =====================================================

INSERT IGNORE INTO tusuariosscripts (usuario, script, empresaId, usuarioCreated) VALUES
('admin', 'select * from prod', 2, 'admin'),
('admin', 'select * from cli', 2, 'admin');

-- =====================================================
-- USUARIOS - MOD AUTH (bitacora autorizaciones)
-- =====================================================

INSERT IGNORE INTO usuariomodauth (usuario, descripcion, sn_auth_devoluciones, sn_auth_reversion, sn_auth_anulaciones, sn_auth_facturacion, empresaId, usuarioCreated) VALUES
('admin', 'Admin Total', 'S', 'S', 'S', 'S', 2, 'admin');

-- =====================================================
-- INVENTARIO
-- =====================================================

INSERT IGNORE INTO tinvcategoria (categoriaId, descripcion, sn_activo, empresaId, usuarioCreated) VALUES
(1, 'Medicamentos', 'S', 2, 'admin'),
(2, 'Suministros Medicos', 'S', 2, 'admin'),
(3, 'Electronica', 'S', 2, 'admin'),
(4, 'Alimentos', 'S', 2, 'admin');

INSERT IGNORE INTO tinvbodegas (bodegaId, descripcion, sn_activo, empresaId, usuarioCreated) VALUES
(1, 'Bodega Central', 'S', 2, 'admin'),
(2, 'Bodega Secundaria', 'S', 2, 'admin'),
(3, 'Bodega Norte', 'S', 2, 'admin');

INSERT IGNORE INTO tinvmarcas (marcaId, descripcion, sn_activo, empresaId, usuarioCreated) VALUES
(1, 'Genfar', 'S', 2, 'admin'),
(2, 'Bayer', 'S', 2, 'admin'),
(3, 'Pfizer', 'S', 2, 'admin'),
(4, 'Samsung', 'S', 2, 'admin'),
(5, 'Apple', 'S', 2, 'admin');

INSERT IGNORE INTO tinvmodelos (modeloId, descripcion, sn_activo, empresaId, usuarioCreated) VALUES
(1, 'Generico', 'S', 2, 'admin'),
(2, 'Premium', 'S', 2, 'admin'),
(3, 'Estándar', 'S', 2, 'admin');

INSERT IGNORE INTO tinvcolores (colorId, descripcion, sn_activo, empresaId, usuarioCreated) VALUES
(1, 'Rojo', 'S', 2, 'admin'),
(2, 'Azul', 'S', 2, 'admin'),
(3, 'Blanco', 'S', 2, 'admin'),
(4, 'Negro', 'S', 2, 'admin');

INSERT IGNORE INTO tinvunidadmedida (unidadmedidaId, descripcion, sn_activo, empresaId, usuarioCreated) VALUES
(1, 'Pieza', 'S', 2, 'admin'),
(2, 'Caja', 'S', 2, 'admin'),
(3, 'Kilogramo', 'S', 2, 'admin'),
(4, 'Litro', 'S', 2, 'admin'),
(5, 'Par', 'S', 2, 'admin');

INSERT IGNORE INTO tinvembalajes (embalajeId, descripcion, sn_activo, empresaId, usuarioCreated) VALUES
(1, 'Caja', 'S', 2, 'admin'),
(2, 'Botella', 'S', 2, 'admin'),
(3, 'Blister', 'S', 2, 'admin'),
(4, 'Bolsa', 'S', 2, 'admin');

INSERT IGNORE INTO tinvubicaciones (ubicacionId, descripcion, sn_activo, empresaId, usuarioCreated) VALUES
(1, 'Estante A', 'S', 2, 'admin'),
(2, 'Estante B', 'S', 2, 'admin'),
(3, 'Estante C', 'S', 2, 'admin');

INSERT IGNORE INTO tinvpasillos (pasilloId, descripcion, sn_activo, empresaId, usuarioCreated) VALUES
(1, 'Pasillo 1', 'S', 2, 'admin'),
(2, 'Pasillo 2', 'S', 2, 'admin'),
(3, 'Pasillo 3', 'S', 2, 'admin');

INSERT IGNORE INTO tinvestantes (testanteId, descripcion, sn_activo, empresaId, usuarioCreated) VALUES
(1, 'Nivel 1', 'S', 2, 'admin'),
(2, 'Nivel 2', 'S', 2, 'admin'),
(3, 'Nivel 3', 'S', 2, 'admin');

INSERT IGNORE INTO tinvcasas (casaId, descripcion, sn_activo, empresaId, usuarioCreated) VALUES
(1, 'Laboratorios Locales', 'S', 2, 'admin'),
(2, 'Importadora Central', 'S', 2, 'admin'),
(3, 'Distribuidora Nacional', 'S', 2, 'admin');

INSERT IGNORE INTO tinvtags (tagsId, descripcion, sn_activo, empresaId, usuarioCreated) VALUES
(1, 'Oferta', 'S', 2, 'admin'),
(2, 'Nuevo', 'S', 2, 'admin'),
(3, 'Popular', 'S', 2, 'admin'),
(4, 'Temporada', 'S', 2, 'admin');

INSERT IGNORE INTO productos (produtoId, codbarra, descripcion, descripcion_corta, cstounit, cstoprom, precioventa, categoriaId, sn_activo, empresaId, usuarioCreated) VALUES
(1, '7501234567890', 'Paracetamol 500mg x 20 tabletas', 'Paracetamol 500', 15.00, 16.00, 25.00, 1, 'S', 2, 'admin'),
(2, '7501234567891', 'Ibuprofeno 400mg x 30 capsuleulas', 'Ibuprofeno 400', 35.00, 37.00, 55.00, 1, 'S', 2, 'admin'),
(3, '7501234567892', 'Jeringa Descartable 5ml x 100 und', 'Jeringa 5ml', 120.00, 125.00, 180.00, 2, 'S', 2, 'admin'),
(4, '7501234567893', 'Audifonos Bluetooth Samsung', 'Audifonos BT', 450.00, 470.00, 650.00, 3, 'S', 2, 'admin'),
(5, '7501234567894', 'Arroz Premium 1kg', 'Arroz 1kg', 28.00, 30.00, 42.00, 4, 'S', 2, 'admin'),
(6, '7501234567895', 'Aspirina 100mg x 25 tabletas', 'Aspirina 100', 12.00, 13.00, 20.00, 1, 'S', 2, 'admin');

INSERT IGNORE INTO invexistencias (invexistenciaId, bodegaId, productoId, existencia, costounitario, precioventa, empresaId, usuarioCreated) VALUES
(1, 1, 1, 150.00, 15.00, 25.00, 2, 'admin'),
(2, 1, 2, 80.00, 35.00, 55.00, 2, 'admin'),
(3, 1, 3, 200.00, 120.00, 180.00, 2, 'admin'),
(4, 2, 4, 25.00, 450.00, 650.00, 2, 'admin'),
(5, 1, 5, 300.00, 28.00, 42.00, 2, 'admin'),
(6, 2, 6, 100.00, 12.00, 20.00, 2, 'admin');

-- =====================================================
-- BANCOS
-- =====================================================

INSERT IGNORE INTO bcos (bancoId, descripcion, sn_activo, Idsucursal, empresaId, usuarioCreated) VALUES
(1, 'Banco Atlantida', 'S', 1, 2, 'admin'),
(2, 'Banco Davivienda', 'S', 1, 2, 'admin'),
(3, 'BAC Credito Automatico', 'S', 1, 2, 'admin');

INSERT IGNORE INTO bcosctas (bcoctasId, bancoId, nrocuenta, monedaId, sn_activo, Idsucursal, empresaId, usuarioCreated) VALUES
(1, 1, '0101-0001-000001', 1, 'S', 1, 2, 'admin'),
(2, 1, '0101-0001-000002', 2, 'S', 1, 2, 'admin'),
(3, 2, '0025-0001-000001', 1, 'S', 1, 2, 'admin'),
(4, 3, '0106-0001-000001', 1, 'S', 1, 2, 'admin');

INSERT IGNORE INTO bcosdir (bcosdireccionid, bancoId, direccionId, descripcion, empresaId, usuarioCreated) VALUES
(1, 1, 1, 'Tegucigalpa', 2, 'admin'),
(2, 2, 1, 'San Pedro Sula', 2, 'admin'),
(3, 3, 1, 'Tegucigalpa', 2, 'admin');

INSERT IGNORE INTO bcostel (bancotelefonoId, bancoId, telefonoId, descripcion, sn_activo, empresaId, usuarioCreated) VALUES
(1, 1, 2, '2222-0001', 'S', 2, 'admin'),
(2, 2, 2, '2545-0001', 'S', 2, 'admin'),
(3, 3, 2, '2280-0001', 'S', 2, 'admin');

-- =====================================================
-- CxC - CLIENTES
-- =====================================================

INSERT IGNORE INTO cxcclientes (clienteId, nrocliente, nombres, apellidos, razonsocial, dni, sexo, estadocivil, rtn, limiteCredito, diasplazo, interes, moratorio, sn_activo, categoria, empresaId, usuarioCreated) VALUES
(1, 'CLI-0001', 'Juan Carlos', 'Perez Garcia', 'Juan Carlos Perez Garcia', '0801-1990-12345', 'M', 'S', 'RTN-0801-1234567890', 50000.00, 30, 2.00, 3.00, 'S', 'A', 2, 'admin'),
(2, 'CLI-0002', 'Maria Elena', 'Lopez Rodriguez', 'Maria Elena Lopez Rodriguez', '0801-1985-54321', 'F', 'C', 'RTN-0801-0987654321', 25000.00, 15, 2.50, 3.50, 'S', 'B', 2, 'admin'),
(3, 'CLI-0003', 'Carlos Alberto', 'Martinez Flores', 'Carlos Alberto Martinez Flores', '0801-1992-67890', 'M', 'S', 'RTN-0801-1122334455', 75000.00, 45, 1.50, 2.50, 'S', 'A', 2, 'admin'),
(4, 'CLI-0004', 'Ana Patricia', 'Suarez Rivera', 'Ana Patricia Suarez Rivera', '0801-1988-11111', 'F', 'V', 'RTN-0801-5566778899', 15000.00, 15, 3.00, 4.00, 'S', 'C', 2, 'admin'),
(5, 'CLI-0005', 'Roberto', 'Diaz Cruz', 'Roberto Diaz Cruz', '0801-1995-22222', 'M', 'S', NULL, 10000.00, 10, 2.00, 3.00, 'S', 'D', 2, 'admin');

INSERT IGNORE INTO cxccclientesdir (cxccclientesdirId, clienteid, direccionId, descripcion, sn_activo, empresaId, usuarioCreated) VALUES
(1, 1, 1, 'Residencial', 'S', 2, 'admin'),
(2, 2, 2, 'Comercial', 'S', 2, 'admin'),
(3, 3, 1, 'Fiscal', 'S', 2, 'admin');

INSERT IGNORE INTO cxcclientestel (clientetelefonoId, clienteId, telefonoId, descripcion, sn_activo, empresaId, usuarioCreated) VALUES
(1, 1, 1, '9988-7766', 'S', 2, 'admin'),
(2, 2, 1, '9977-6655', 'S', 2, 'admin'),
(3, 3, 2, '2233-4455', 'S', 2, 'admin');

INSERT IGNORE INTO cxccajeros (cajaId, usuario, sn_activo, empresaId) VALUES
(1, 'admin', 'S', 2);

INSERT IGNORE INTO tcctdiascobros (tdiascobrosId, descripcion, sn_activo, empresaId, usuarioCreated) VALUES
(1, 'Lunes', 'S', 2, 'admin'),
(2, 'Martes', 'S', 2, 'admin'),
(3, 'Miercoles', 'S', 2, 'admin'),
(4, 'Jueves', 'S', 2, 'admin'),
(5, 'Viernes', 'S', 2, 'admin');

-- =====================================================
-- CxP - PROVEEDORES
-- =====================================================

INSERT IGNORE INTO proveedor (proveedorId, nroproveedor, nombres, apellidos, razonsocial, dni, sexo, estadocivil, rtn, limiteCredito, diasplazo, interes, moratorio, sn_activo, categoria, empresaId, usuarioCreated) VALUES
(1, 'PRV-0001', 'Distribuidora', 'Nacional S.A.', 'Distribuidora Nacional S.A.', '0801-1000-00001', 'M', 'S', 'RTN-0801-9988776655', 200000.00, 60, 1.00, 2.00, 'S', 'A', 2, 'admin'),
(2, 'PRV-0002', 'Importadora', 'Central Ltda', 'Importadora Central Ltda', '0801-1000-00002', 'M', 'S', 'RTN-0801-4433221100', 150000.00, 45, 1.50, 2.50, 'S', 'A', 2, 'admin'),
(3, 'PRV-0003', 'Laboratorios', 'Locales S.A.', 'Laboratorios Locales S.A.', '0801-1000-00003', 'F', 'C', 'RTN-0801-1122112211', 300000.00, 90, 0.50, 1.50, 'S', 'B', 2, 'admin');

-- =====================================================
-- FACTURACION
-- =====================================================

INSERT IGNORE INTO tpospreciovtas (preciovtaId, descripcion, porcentaje, sn_activo, empresaId, usuarioCreated) VALUES
(1, 'Precio Normal', 0.00, 'S', 2, 'admin'),
(2, 'Precio Mayoreo', -10.00, 'S', 2, 'admin'),
(3, 'Precio Especial', -20.00, 'S', 2, 'admin');

INSERT IGNORE INTO tposdescuentos (descuentoId, descripcion, porcentaje, sn_activo, empresaId, usuarioCreated) VALUES
(1, 'Sin Descuento', 0.00, 'S', 2, 'admin'),
(2, 'Descuento 5%', 5.00, 'S', 2, 'admin'),
(3, 'Descuento 10%', 10.00, 'S', 2, 'admin'),
(4, 'Descuento 15%', 15.00, 'S', 2, 'admin');

INSERT IGNORE INTO tcotipodocumentofiscal (tipodocumentofiscalId, descripcion, abreviatura, naturaleza, cuentacontableId, nrocorrelativo, sn_activo, empresaId, usuarioCreated) VALUES
(1, 'Factura', 'FAC', 'D', 1, 1, 'S', 2, 'admin'),
(2, 'Nota de Credito', 'NC', 'C', 1, 1, 'S', 2, 'admin'),
(3, 'Nota de Debito', 'ND', 'D', 1, 1, 'S', 2, 'admin'),
(4, 'Ticket', 'TCK', 'D', 1, 1, 'S', 2, 'admin');

-- =====================================================
-- PLANILLA
-- =====================================================

INSERT IGNORE INTO tplpuestos (puestosId, descripcion, empresaId, usuarioCreated) VALUES
(1, 'Gerente General', 2, 'admin'),
(2, 'Vendedor', 2, 'admin'),
(3, 'Almacenero', 2, 'admin'),
(4, 'Cajero', 2, 'admin'),
(5, 'Contador', 2, 'admin');

INSERT IGNORE INTO tplprofesiones (profesionId, descripcion, sn_activo, empresaId, usuarioCreated) VALUES
(1, 'Administrador de Empresas', 'S', 2, 'admin'),
(2, 'Contador Publico', 'S', 2, 'admin'),
(3, 'Enfermera', 'S', 2, 'admin'),
(4, 'Ingeniero en Sistemas', 'S', 2, 'admin'),
(5, 'Tecnico en Farmacia', 'S', 2, 'admin');

INSERT IGNORE INTO tpldeducciones (deduccioneId, descripcion, sn_porcentual, sn_obligatoria, porcentaje, sn_activo, empresaId, usuarioCreated) VALUES
(1, 'IHSS', 'S', 'S', 2.50, 'S', 2, 'admin'),
(2, 'RAP', 'S', 'S', 1.50, 'S', 2, 'admin'),
(3, 'RTF', 'S', 'S', 0.00, 'S', 2, 'admin'),
(4, 'Prestamo Interno', 'N', 'N', 0.00, 'S', 2, 'admin');

INSERT IGNORE INTO tplingresos (tingresoId, descripcion, sn_porcentual, sn_obligatoria, porcentaje, sn_activo, empresaId, usuarioCreated) VALUES
(1, 'Horas Extras', 'N', 'N', 0.00, 'S', 2, 'admin'),
(2, 'Bonos', 'N', 'N', 0.00, 'S', 2, 'admin'),
(3, 'Comisiones', 'N', 'N', 0.00, 'S', 2, 'admin'),
(4, 'Aguinaldo', 'S', 'S', 8.33, 'S', 2, 'admin');

INSERT IGNORE INTO plplempleados (empleadoId, nombres, apellidos, dni, sexo, estadocivil, telefono, celular, email, profesionId, puestoId, sueldobruto, sn_activo, tipoempId, Idsucursal, empresaId, usuarioCreated) VALUES
(1, 'Pedro Antonio', 'Hernandez Lopez', '0801-1985-10001', 'M', 'C', '2222-1001', '9911-1001', 'pedro.hernandez@arcas.hn', 1, 1, 25000.00, 'S', 1, 1, 2, 'admin'),
(2, 'Laura Sofia', 'Garcia Martinez', '0801-1990-10002', 'F', 'S', '2222-1002', '9911-1002', 'laura.garcia@arcas.hn', 4, 2, 12000.00, 'S', 1, 1, 2, 'admin'),
(3, 'Miguel Angel', 'Rivera Torres', '0801-1988-10003', 'M', 'S', '2222-1003', '9911-1003', 'miguel.rivera@arcas.hn', 5, 3, 10000.00, 'S', 1, 1, 2, 'admin'),
(4, 'Sandra Carolina', 'Flores Diaz', '0801-1992-10004', 'F', 'C', '2222-1004', '9911-1004', 'sandra.flores@arcas.hn', 2, 5, 18000.00, 'S', 1, 1, 2, 'admin'),
(5, 'Francisco Jose', 'Morales Cruz', '0801-1987-10005', 'M', 'V', '2222-1005', '9911-1005', 'francisco.morales@arcas.hn', 3, 4, 11000.00, 'S', 1, 1, 2, 'admin');

INSERT IGNORE INTO plplempleados (empleadoId, nombres, apellidos, dni, fechanacimiento, sexo, estadocivil, paisorigen, paisresidencia, nroseguro, telefono, celular, email, profesionId, puestoId, sueldobruto, techoseguro, cuentabancaria, lugardenacimiento, sn_activo, tipoempId, Idsucursal, empresaId, usuarioCreated) VALUES
(6, 'Rosa Maria', 'Castillo Vega', '0801-1993-10006', '1993-05-15 00:00:00', 'F', 'S', 1, 1, 'HND-10006', '2222-1006', '9911-1006', 'rosa.castillo@arcas.hn', 5, 3, 9500.00, 20000.00, '0101-1001-000006', 'Tegucigalpa', 'S', 1, 1, 2, 'admin');

-- =====================================================
-- CONTABILIDAD
-- =====================================================

INSERT IGNORE INTO tcogrupocontable (tcogrupocontableId, descripcion, sn_activo, usuarioCreated) VALUES
(1, 'Activos', 'S', 'admin'),
(2, 'Pasivos', 'S', 'admin'),
(3, 'Capital', 'S', 'admin'),
(4, 'Ingresos', 'S', 'admin'),
(5, 'Gastos', 'S', 'admin');

INSERT IGNORE INTO tcoctacontables (cuentacontablesId, ctacontable, descripcion, naturaleza, nivel, padre, sn_operable, tcogrupocontableId, sn_activo, empresaId, Idsucursal, usuarioCreated) VALUES
(1, '1110', 'Caja y Bancos', 'D', 1, NULL, 'S', 1, 'S', 2, 1, 'admin'),
(2, '1110-001', 'Caja General', 'D', 2, '1110', 'S', 1, 'S', 2, 1, 'admin'),
(3, '1110-002', 'Banco Atlantida', 'D', 2, '1110', 'S', 1, 'S', 2, 1, 'admin'),
(4, '1110-003', 'Banco Davivienda', 'D', 2, '1110', 'S', 1, 'S', 2, 1, 'admin'),
(5, '1120', 'Cuentas por Cobrar', 'D', 1, NULL, 'S', 1, 'S', 2, 1, 'admin'),
(6, '1120-001', 'Clientes Nacionales', 'D', 2, '1120', 'S', 1, 'S', 2, 1, 'admin'),
(7, '1130', 'Inventarios', 'D', 1, NULL, 'S', 1, 'S', 2, 1, 'admin'),
(8, '1130-001', 'Mercaderia', 'D', 2, '1130', 'S', 1, 'S', 2, 1, 'admin'),
(9, '2110', 'Cuentas por Pagar', 'C', 1, NULL, 'S', 2, 'S', 2, 1, 'admin'),
(10, '2110-001', 'Proveedores Nacionales', 'C', 2, '2110', 'S', 2, 'S', 2, 1, 'admin'),
(11, '2120', 'Impuestos por Pagar', 'C', 1, NULL, 'S', 2, 'S', 2, 1, 'admin'),
(12, '2120-001', 'ISV por Pagar', 'C', 2, '2120', 'S', 2, 'S', 2, 1, 'admin'),
(13, '3110', 'Capital Social', 'C', 1, NULL, 'S', 3, 'S', 2, 1, 'admin'),
(14, '3120', 'Resultados Acumulados', 'C', 1, NULL, 'S', 3, 'S', 2, 1, 'admin'),
(15, '4110', 'Ventas', 'C', 1, NULL, 'S', 4, 'S', 2, 1, 'admin'),
(16, '4110-001', 'Ventas Gravadas 15%', 'C', 2, '4110', 'S', 4, 'S', 2, 1, 'admin'),
(17, '4110-002', 'Ventas Gravadas 18%', 'C', 2, '4110', 'S', 4, 'S', 2, 1, 'admin'),
(18, '4120', 'Devoluciones en Ventas', 'D', 1, NULL, 'S', 4, 'S', 2, 1, 'admin'),
(19, '5110', 'Compras', 'D', 1, NULL, 'S', 5, 'S', 2, 1, 'admin'),
(20, '5110-001', 'Compras Gravadas', 'D', 2, '5110', 'S', 5, 'S', 2, 1, 'admin'),
(21, '5120', 'Gastos Operativos', 'D', 1, NULL, 'S', 5, 'S', 2, 1, 'admin'),
(22, '5120-001', 'Sueldos y Salarios', 'D', 2, '5120', 'S', 5, 'S', 2, 1, 'admin'),
(23, '5120-002', 'Alquileres', 'D', 2, '5120', 'S', 5, 'S', 2, 1, 'admin'),
(24, '5120-003', 'Servicios Basicos', 'D', 2, '5120', 'S', 5, 'S', 2, 1, 'admin');

INSERT IGNORE INTO tconivelcta (nivelcontableId, nivel, sn_diario, sn_activo, empresaId, usuarioCreated) VALUES
(1, '1', 'N', 'S', 2, 'admin'),
(2, '2', 'S', 'S', 2, 'admin'),
(3, '3', 'S', 'S', 2, 'admin'),
(4, '4', 'S', 'S', 2, 'admin');

INSERT IGNORE INTO tconaturalezacta (naturalezaCtaId, descripcion, empresaId, usuarioCreated) VALUES
(1, 'D', 2, 'admin'),
(2, 'C', 2, 'admin');

INSERT IGNORE INTO coperiodoctable (periodoscontableId, nroanio, nromes, sn_abierto, empresaId, usuarioCreated) VALUES
(1, 2026, 1, 'N', 2, 'admin'),
(2, 2026, 2, 'N', 2, 'admin'),
(3, 2026, 3, 'N', 2, 'admin'),
(4, 2026, 4, 'N', 2, 'admin'),
(5, 2026, 5, 'N', 2, 'admin'),
(6, 2026, 6, 'S', 2, 'admin'),
(7, 2026, 7, 'S', 2, 'admin'),
(8, 2026, 8, 'S', 2, 'admin');

INSERT IGNORE INTO tcorepdiarios (tcorepdiariosId, descripcion, reporte, sn_activo, empresaId, usuarioCreated) VALUES
(1, 'Diario General', 'rpt_diario_general.rpt', 'S', 2, 'admin'),
(2, 'Diario Compras', 'rpt_diario_compras.rpt', 'S', 2, 'admin'),
(3, 'Diario Ventas', 'rpt_diario_ventas.rpt', 'S', 2, 'admin');

INSERT IGNORE INTO tcoimpuestovecinal (impvecinalId, descripcion, del, al, importe, sn_activo, empresaId, usuarioCreated) VALUES
(1, 'Alcabala 1%', 0.00, 50000.00, 1.00, 'S', 2, 'admin'),
(2, 'Alcabala 2%', 50001.00, 100000.00, 2.00, 'S', 2, 'admin'),
(3, 'Alcabala 3%', 100001.00, 200000.00, 3.00, 'S', 2, 'admin');

INSERT IGNORE INTO tcoplantillapdamae (tcoplantillapdamaeId, descripcion, moduloId, sn_activo, empresaId, usuarioCreated) VALUES
(1, 'Partida Compra Standard', 1, 'S', 2, 'admin'),
(2, 'Partida Venta Standard', 4, 'S', 2, 'admin'),
(3, 'Partida Pago Proveedor', 6, 'S', 2, 'admin');

INSERT IGNORE INTO tcorepliquidez (tcorepliquidezId, descripcion, objetivo, sn_activo, empresaId, usuarioCreated) VALUES
(1, 'Ratio Liquidez General', 'Medir capacidad de pago a corto plazo', 'S', 2, 'admin'),
(2, 'Ratio Rapidez', 'Medir liquidez inmediata', 'S', 2, 'admin');

INSERT IGNORE INTO tcorepbalances (balcomId, ctacontable, periodoA, anioA, saldoA, periodoB, anioB, saldoB, empresaId, usuarioCreated) VALUES
(1, '1110', 6, 2026, 150000.00, 5, 2026, 140000.00, 2, 'admin'),
(2, '1120', 6, 2026, 75000.00, 5, 2026, 68000.00, 2, 'admin'),
(3, '2110', 6, 2026, 120000.00, 5, 2026, 115000.00, 2, 'admin');

-- =====================================================
-- RESUMEN DE DATOS SEMILLADOS
-- =====================================================

SELECT 'ttipomonedas' AS tabla, COUNT(*) AS registros FROM ttipomonedas WHERE empresaId = 2
UNION ALL SELECT 'ttipopais', COUNT(*) FROM ttipopais WHERE empresaId = 2
UNION ALL SELECT 'ttipodeptopais', COUNT(*) FROM ttipodeptopais WHERE empresaId = 2
UNION ALL SELECT 'ttipodeptoempresa', COUNT(*) FROM ttipodeptoempresa WHERE empresaId = 2
UNION ALL SELECT 'ttipoformapago', COUNT(*) FROM ttipoformapago WHERE empresaId = 2
UNION ALL SELECT 'ttipotelefono', COUNT(*) FROM ttipotelefono WHERE empresaId = 2
UNION ALL SELECT 'ttipotarjetacredito', COUNT(*) FROM ttipotarjetacredito WHERE empresaId = 2
UNION ALL SELECT 'ttipodirecciones', COUNT(*) FROM ttipodirecciones WHERE empresaId = 2
UNION ALL SELECT 'ttipoestado', COUNT(*) FROM ttipoestado WHERE empresaId = 2
UNION ALL SELECT 'ttipoparamfac', COUNT(*) FROM ttipoparamfac WHERE empresaId = 2
UNION ALL SELECT 'ttipoparaminv', COUNT(*) FROM ttipoparaminv WHERE empresaId = 2
UNION ALL SELECT 'tusuariosmodule', COUNT(*) FROM tusuariosmodule WHERE empresaId = 2
UNION ALL SELECT 'tusuariomnuitem', COUNT(*) FROM tusuariomnuitem WHERE empresaId = 2
UNION ALL SELECT 'tusuariosscripts', COUNT(*) FROM tusuariosscripts WHERE empresaId = 2
UNION ALL SELECT 'tinvcategoria', COUNT(*) FROM tinvcategoria WHERE empresaId = 2
UNION ALL SELECT 'tinvbodegas', COUNT(*) FROM tinvbodegas WHERE empresaId = 2
UNION ALL SELECT 'tinvmarcas', COUNT(*) FROM tinvmarcas WHERE empresaId = 2
UNION ALL SELECT 'productos', COUNT(*) FROM productos WHERE empresaId = 2
UNION ALL SELECT 'invexistencias', COUNT(*) FROM invexistencias WHERE empresaId = 2
UNION ALL SELECT 'bcos', COUNT(*) FROM bcos WHERE empresaId = 2
UNION ALL SELECT 'bcosctas', COUNT(*) FROM bcosctas WHERE empresaId = 2
UNION ALL SELECT 'cxcclientes', COUNT(*) FROM cxcclientes WHERE empresaId = 2
UNION ALL SELECT 'proveedor', COUNT(*) FROM proveedor WHERE empresaId = 2
UNION ALL SELECT 'tplpuestos', COUNT(*) FROM tplpuestos WHERE empresaId = 2
UNION ALL SELECT 'tpldeducciones', COUNT(*) FROM tpldeducciones WHERE empresaId = 2
UNION ALL SELECT 'tplingresos', COUNT(*) FROM tplingresos WHERE empresaId = 2
UNION ALL SELECT 'plplempleados', COUNT(*) FROM plplempleados WHERE empresaId = 2
UNION ALL SELECT 'tcogrupocontable', COUNT(*) FROM tcogrupocontable
UNION ALL SELECT 'tcoctacontables', COUNT(*) FROM tcoctacontables WHERE empresaId = 2
UNION ALL SELECT 'coperiodoctable', COUNT(*) FROM coperiodoctable WHERE empresaId = 2;
