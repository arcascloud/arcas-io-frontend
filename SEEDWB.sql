-- Volcando estructura de base de datos para arcasdb
DROP DATABASE IF EXISTS `arcasdb`;
CREATE DATABASE IF NOT EXISTS `arcasdb` /*!40100 DEFAULT CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `arcasdb`;

SET FOREIGN_KEY_CHECKS = 0;
/* Empresas  */
CREATE TABLE IF NOT EXISTS `tempresas` (
      `empresaId` INT NOT NULL AUTO_INCREMENT,
      `descripcion` VARCHAR(50) NOT NULL,
      `fechasistema` DATETIME NOT NULL,
      `msjfactura` VARCHAR(200) NOT NULL DEFAULT 'LA FACTURA ES BENEFICIO DE TODOS',
      `msjdevfactura` VARCHAR(200) NOT NULL  DEFAULT 'NO SE ACEPTAN DEVOLUCIONES O CAMBIOS DESPUES DE 15 DIAS',
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `usuarioCreated` VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
      PRIMARY KEY(`empresaId`))
		COMMENT = 'tempresas, contiene el registro de las tempresas';


CREATE TABLE IF NOT EXISTS `tempresasdet` (
      `tempresasdetId` INT NOT NULL AUTO_INCREMENT,
      `tipo` ENUM('TELEFONO','DIRECCION','CORREO','RUC','RTN','WEBSITE','REDESOCIAL') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'TELEFONO',
      `descripcion` VARCHAR(80) NOT NULL,
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `empresaId` INT NOT NULL,
	  `usuarioCreated` VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
      PRIMARY KEY(`tempresasdetId`))
		COMMENT = 'tempresas, contiene el registro de las tempresas';


-- tsucursal
CREATE TABLE IF NOT EXISTS `tsucursal` (
      `Idsucursal` INT NOT NULL AUTO_INCREMENT,
      `descripcion` VARCHAR(20) NULL,
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `empresaId` INT NOT NULL,
      `usuarioCreated` VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
		PRIMARY KEY(`Idsucursal`),
		CONSTRAINT `tsucursalUnique`UNIQUE (`descripcion`,`empresaId`) 
		) COMMENT = 'tmodulos, registra los modulos por empresa';



-- tmodulos
CREATE TABLE IF NOT EXISTS `tmodulos` (
      `moduloId` INT NOT NULL AUTO_INCREMENT,
      `descripcion` VARCHAR(20) NULL,
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `empresaId` INT NOT NULL,
      `usuarioCreated` VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
		PRIMARY KEY(`moduloId`),
		CONSTRAINT `tmodulosUnique`UNIQUE (`descripcion`,`empresaId`) 
		) COMMENT = 'tmodulos, registra los modulos por empresa';

/* Tablas de tusuarios */

-- tusuarios
CREATE TABLE IF NOT EXISTS `tusuarios` (
      `usuario` VARCHAR(12) NOT NULL,
      `nombre` VARCHAR(80) NOT NULL,
      `password` VARCHAR(250) NOT NULL,
      `email` VARCHAR(20) NOT NULL,
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
       `usuarioId` INT NOT NULL AUTO_INCREMENT,
       `Idsucursal` INT NOT NULL,
	    `empresaId` INT NOT NULL,
	    `usuarioCreated`  VARCHAR(12) NOT NULL,
       `usuarioUpdated` VARCHAR(12) NULL,
       `fechaUpdated` DATETIME NULL,
      PRIMARY KEY (`usuario`),
	  UNIQUE KEY (`usuarioId`),
      CONSTRAINT `tusuariosUnique` UNIQUE (`email`, `empresaId`)
		);
		
-- tusuariosmodule
CREATE TABLE IF NOT EXISTS `tusuariosmodule` (
      `tusuariosmoduloId` INT NOT NULL AUTO_INCREMENT,
      `empresaId` INT NOT NULL,
      `moduloId` INT NOT NULL,
	  `usuario` VARCHAR(12) NOT NULL,
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `submnudatos` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `submnurocesos` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `submnueportes` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `usuarioCreated`  VARCHAR(12) NOT NULL,
	  `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
      PRIMARY KEY (`tusuariosmoduloId`),
      CONSTRAINT `tusuariosmoduleUnico` UNIQUE (`usuario`,`moduloId`,`empresaId`));

-- tusuariosmenuitem
CREATE TABLE IF NOT EXISTS `tusuariomnuitem` (
      `tusuariomnuitemsId` INT NOT NULL AUTO_INCREMENT,
       `empresaId` INT NOT NULL,
       `moduloId` INT NOT NULL,
       `usuario` VARCHAR(12) NOT NULL,
       `parent` INT NOT NULL,
       `parentId`  INT NOT NULL,
	   `levelId`  INT NOT NULL,
	   `nameParent` VARCHAR(50) NOT NULL,
	   `nameItem` VARCHAR(50) NOT NULL,
	   `labelItem` VARCHAR(50) NOT NULL,
	   `iconItem` VARCHAR(50) NULL,
	   `routerLink`  VARCHAR(50) NULL,
	   `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
       `usuarioCreated`  VARCHAR(12) NOT NULL,
	   `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
      PRIMARY KEY (`tusuariomnuitemsId`),
      CONSTRAINT `tusuariomnuitemUnique` UNIQUE(`usuario`,`moduloId`,`labelItem`,`nameItem`, `empresaId`)
		);

-- usuariomodauth
CREATE TABLE IF NOT EXISTS `usuariomodauth` (
      `usuariomodauthId` INT NOT NULL AUTO_INCREMENT,
      `usuario` VARCHAR(12) NOT NULL,
      `descripcion` VARCHAR(20) NULL,
      `sn_auth_devoluciones` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `sn_auth_reversion` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `sn_auth_anulaciones` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `sn_auth_facturacion` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `fechaoperativa` DATETIME NULL,
      `empresaId` INT NOT NULL,
      `usuarioCreated`  VARCHAR(12) NOT NULL,
	  `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
      PRIMARY KEY (`usuariomodauthId`),
		CONSTRAINT `usuariomodauthUnique` UNIQUE (`usuario`, `empresaId`) );
      
-- usuarioauditoria
CREATE TABLE IF NOT EXISTS `ttusuariosaudit` (
      `ttusuariosauditId` INT NOT NULL AUTO_INCREMENT,
      `fecharegistro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      `usuario` VARCHAR(12) NOT NULL,
      `moduloId` INT NULL,
      `nroreferencia` VARCHAR(50) NULL,
      `hora` VARCHAR(30) NULL,
	  `empresaId` INT NOT NULL,
      `usuarioCreated`  VARCHAR(12) NOT NULL,
	  `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
		PRIMARY KEY (`ttusuariosauditId`));

-- tusuarioipaddress
 CREATE TABLE IF NOT EXISTS `tusuarioipaddress` (
      `securityipaddressId` INT NOT NULL AUTO_INCREMENT,
      `usuario` VARCHAR(12) NOT NULL,
      `ipaddress` VARCHAR(50) NOT NULL,
	  `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `empresaId` INT NOT NULL,
	  `usuarioCreated`  VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
		PRIMARY KEY (`securityipaddressId`),
		CONSTRAINT `tusuarioipaddressUnique` UNIQUE (`usuario`, `ipaddress`));

CREATE TABLE IF NOT EXISTS `tusuariosscripts` (
      `tusuarioscriptsId` INT NOT NULL AUTO_INCREMENT,
	  `usuario` VARCHAR(12) NOT NULL,
      `script` VARCHAR(15) NOT NULL,
      `empresaId` INT NOT NULL,
	  `usuarioCreated`  VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
      PRIMARY KEY (`tusuarioscriptsId`));


/* Tablas generales o referenciales */

-- ttipogestores
CREATE TABLE IF NOT EXISTS `ttipogestores` (
      `gestorId` INT NOT NULL AUTO_INCREMENT,
      `moduloId` INT NOT NULL,
      `empleadoId`  INT NOT NULL,
      `sn_activo` enum('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `sn_vendedor` enum('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `empresaId` INT NOT NULL,
      `usuarioCreated` VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
      PRIMARY KEY (`gestorId`),
		CONSTRAINT `gestoresUnique` UNIQUE (`empleadoId`,`empresaId`)
		) 
		COMMENT = 'esta tabla se usuara para registrar los gestores de venta y cobros';

-- ttipoformapago
CREATE TABLE IF NOT EXISTS `ttipoformapago` (
      `formapagoId` INT NOT NULL AUTO_INCREMENT,
      `descripcion` VARCHAR(50) NOT NULL,
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `empresaId` INT NOT NULL,
      `usuarioCreated` VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
      PRIMARY KEY (`formapagoId`),
	  CONSTRAINT `ttipoformapagoUnique` UNIQUE (`descripcion`,`empresaId`));

-- ttipotelefono
CREATE TABLE IF NOT EXISTS `ttipotelefono` (
      `telefonoId` INT NOT NULL AUTO_INCREMENT,
      `descripcion` VARCHAR(50) NOT NULL,
      `empresaId` INT NOT NULL,
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `usuarioCreated` VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
      PRIMARY KEY (`telefonoId`),
		CONSTRAINT `telefonosUnique` UNIQUE (`descripcion`, `empresaId`))
		COMMENT = 'esta tabla se usuara para asignar un tipo de telefono a una proveedor, cliente, empleado o banco';

-- ttarjetascredito
CREATE TABLE IF NOT EXISTS `ttipotarjetacredito` (
      `tarjetacreditoId` INT NOT NULL AUTO_INCREMENT,
      `descripcion` VARCHAR(50) NOT NULL,
      `sn_activo`  enum('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `empresaId` INT NOT NULL,
      `usuarioCreated` VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
      PRIMARY KEY ( `tarjetacreditoId`),
		CONSTRAINT `tarjetascreditoUnique` UNIQUE (`descripcion`))
		COMMENT = 'esta tabla se usuara para registrar las marcas de tarjeta de credito';

-- ttipopais
CREATE TABLE IF NOT EXISTS `ttipopais`(
      `paisId` INT NOT NULL AUTO_INCREMENT,
      `descripcion` VARCHAR(50) NOT NULL,
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `empresaId` INT NOT NULL,
      `usuarioCreated` VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
       PRIMARY KEY (`paisId`),
		CONSTRAINT `ttipopaisUnique` UNIQUE (`descripcion`))
		COMMENT = 'esta tabla se usuara para asignar los paises';

-- ttipoproforma
CREATE TABLE IF NOT EXISTS `ttipoproforma` (
      `proformaId` INT NOT NULL AUTO_INCREMENT,
      `Alto` VARCHAR(10) NOT NULL,
      `bajo` VARCHAR(10) NOT NULL,
      `izquierda` VARCHAR(10) NOT NULL,
      `derecho` VARCHAR(10) NOT NULL,
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `empresaId` INT NOT NULL,
      `usuarioCreated` VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
      PRIMARY KEY (`proformaId`)
		)	COMMENT = 'esta tabla se usuara para registrar las proformas de impresion';

-- ttipoestado
CREATE TABLE IF NOT EXISTS `ttipoestado` (
      `estadoId` INT NOT NULL,
      `descripcion` VARCHAR(50) NULL,
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `empresaId` INT NOT NULL,
      `usuarioCreated` VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
      PRIMARY KEY (`estadoId`),
		CONSTRAINT `ttipoestadoUnique` UNIQUE (`descripcion`,`empresaId`))
		COMMENT = 'esta tabla registra los estados de gestion';

-- ttipodirecciones
CREATE TABLE IF NOT EXISTS `ttipodirecciones` (
      `direccionId` INT NOT NULL AUTO_INCREMENT,
      `descripcion` VARCHAR(50) NOT NULL,
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `empresaId` INT NOT NULL,
      `usuarioCreated` VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
		PRIMARY KEY(`direccionId`),
		CONSTRAINT `ttipodireccionesUnique` UNIQUE (`descripcion`,`empresaId`))
		COMMENT = 'esta tabla registra las posibles direcciones a usar por los cxcclientes y proveedores';

-- ttipoimpuestos
CREATE TABLE IF NOT EXISTS `ttipoimpuestos` (
      `impuestoId` INT NOT NULL AUTO_INCREMENT,
      `moduloId` INT NOT NULL,
      `descripcion` VARCHAR(50) NOT NULL,
      `porcentaje` DECIMAL(20,2) DEFAULT 0.00,
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `empresaId` INT NOT NULL,
	  `usuarioCreated` VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
		PRIMARY KEY(`ImpuestoId`),
		CONSTRAINT `ttipoimpuestosUnique` UNIQUE (`descripcion`,`empresaId`))
		COMMENT = 'esta tabla registra los impuestos fiscales de un pais';

-- ttipomonedas
 CREATE TABLE IF NOT EXISTS `ttipomonedas` (
      `monedaId` INT NOT NULL AUTO_INCREMENT,
      `descripcion` VARCHAR(20) NULL,
      `simbolo` CHAR(1) NOT NULL,
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
	  `empresaId` INT NOT NULL,
	  `usuarioCreated` VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
      PRIMARY KEY (`monedaId`),
		CONSTRAINT `ttipomonedasUnique` UNIQUE (`descripcion`,`empresaId`))
		COMMENT = 'esta tabla registra las monedas de uso';

-- ttipodeptopais
 CREATE TABLE IF NOT EXISTS `ttipodeptopais` (
      `ttipodeptopaisId`  INT NOT NULL AUTO_INCREMENT,
      `descripcion` VARCHAR(50) NULL,
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `empresaId` INT NOT NULL,
      `usuarioCreated` VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
		PRIMARY KEY(`ttipodeptopaisId`),
		CONSTRAINT `ttipodeptopaisUnique` UNIQUE (`descripcion`,`empresaId`))
		COMMENT = 'esta tabla registra los departamentos de un pais';

-- ttipopasatiempos    
CREATE TABLE IF NOT EXISTS `ttipopasatiempos` (
      `pasatiempoId` INT NOT NULL AUTO_INCREMENT,
      `descripcion` VARCHAR(50) NULL,
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `usuarioCreated` VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
      PRIMARY KEY (`pasatiempoId`))
		COMMENT = 'esta tabla registra los pasatiempos';

-- ttipozonas
CREATE TABLE IF NOT EXISTS `ttipozonas` (
      `tzonadId` INT NOT NULL AUTO_INCREMENT,
      `descripcion` VARCHAR(50) NULL,
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `empresaId` INT NOT NULL,
      `usuarioCreated` VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
      PRIMARY KEY (`tzonadId`),
		CONSTRAINT `ttipozonasUnique` UNIQUE (`descripcion`, `empresaId`));

-- ttipozonasvtacob 
CREATE TABLE IF NOT EXISTS `ttipozonasvtacob` (
      `ttipozonasvtacobId` INT NOT NULL AUTO_INCREMENT,
      `tzonadId` INT NOT NULL,
      `gestorId` INT NOT NULL,
      `descripcion` VARCHAR(50) NOT NULL,
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
   	`empresaId` INT NOT NULL,
      `usuarioCreated` VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
      PRIMARY KEY (`ttipozonasvtacobId`),
		CONSTRAINT `ttipozonasvtacobUnique` UNIQUE (`tzonadId`,`gestorId`,`descripcion`, `empresaId`))
		COMMENT = 'esta tabla se usuara para asignar una zona de cobro a un gestor';
-- ttipodeptoempresa
CREATE TABLE IF NOT EXISTS `ttipodeptoempresa` (
      `departamentostempresasId` INT NOT NULL,
      `descripcion` VARCHAR(50) NOT NULL,
      `cuentacontableId` INT NULL,
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `empresaId` INT NOT NULL,
      `usuarioCreated` VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
		PRIMARY KEY (`departamentostempresasId`),
		CONSTRAINT `ttipodeptoempresaUnique` UNIQUE (`descripcion`,`empresaId`))
		COMMENT = 'esta tabla registra los departamentos de una empresa';

CREATE TABLE IF NOT EXISTS `ttipoparamfac` (
      `empresaId` INT NOT NULL,
      `bodegaId` INT NOT NULL,
      `nrofactura` INT NULL,
      `nrocotizacion` INT NULL,
      `nroanulacion` INT NULL,
      `impuestoId` INT NOT NULL,
	  `cajaId` INT NOT NULL,
	  `lineasFactura` DECIMAL(20,2) DEFAULT 0.00,
      `diasDevolucion` DECIMAL(20,2) DEFAULT 0.00,
      `porcentajeDevolucion` DECIMAL(20,2) DEFAULT 0.00,
      `nrodpdaventas` INT NOT NULL,
      `nropdadevolucion` INT NOT NULL,
      `nropdaanulacion` INT NOT NULL,
      `sn_integrado_cxc`  ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `sn_puntoventa`  ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'N',
      `sn_integrado_caja`  ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `sn_anticipos`  ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `mensajeFactura` VARCHAR(50) NULL,
      `sn_correlativoUnico`  ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `mg-t` DECIMAL(20,2) DEFAULT 0.00,
      `mg-b` DECIMAL(20,2) DEFAULT 0.00,
      `mg-l` DECIMAL(20,2) DEFAULT 0.00,
      `mg-d` DECIMAL(20,2) DEFAULT 0.00,
      `sn_multiplezcajeros`  ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'N',
      `sn_imprimefactura`  ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'N',
      `ImpresoraFactura` VARCHAR(20) NULL,
      `ImpresoraComprobante` VARCHAR(20) NULL,
      `ImpresoraMadera` VARCHAR(20) NULL,
      `ImpresoraRecibo` VARCHAR(20) NULL,
      `DriverImpresora1` VARCHAR(20) NULL,
      `DriverImpresora2` VARCHAR(20) NULL,
      `DriverImpresora3` VARCHAR(20) NULL,
      `DriverImpresora4` VARCHAR(20) NULL,
      `Puerto1` VARCHAR(6) NULL,
      `Puerto2` VARCHAR(6) NULL,
      `Puerto3` VARCHAR(6) NULL,
      `Puerto4` VARCHAR(6) NULL,
      `sn_multipleempresa`  ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'N',
      `sn_impuestoincluido`  ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `usuarioCreated`  VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL);

CREATE TABLE IF NOT EXISTS `ttipoparaminv` (
      `bodegaId` INT NULL,
      `nrocompra` INT NULL,
      `nrotrasladoo` INT NULL,
      `nroajuste` INT NULL,
      `nrofisico` INT NULL,
      `nrorequisicion` INT NULL,
      `ImpuestocompraId` INT NULL,
      `impuestoventaId` INT NULL,
      `nropartida` DECIMAL(20,2) DEFAULT 0.00,
      `sn_requirelote` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'N',
      `sn_supermercado` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'N',
      `sn_multiplesprecios` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'N',
      `empresaId` INT NULL,
 	  `usuarioCreated`  VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL);

    CREATE TABLE IF NOT EXISTS `ttipoparambco` (
      `empresaId` INT NULL,
	  `usuarioCreated`  VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL);
    
    CREATE TABLE IF NOT EXISTS `ttipoparampla` (
      `nropartida` DECIMAL(20,2) DEFAULT 0.00,
      `nroplanilla`  INT NOT NULL,
      `techo` DECIMAL(20,2) DEFAULT 0.00,
      `sn_validatecho`ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'N',
      `diaslaborales` INT NULL,
      `empresaId` INT NULL,
	  `usuarioCreated`  VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL);

 CREATE TABLE IF NOT EXISTS `ttipoparamcon` (
      `empresaId` INT NULL,
      `nropartida` INT NOT NULL,
      `periodofiscal` INT NOT NULL,
      `aniofiscal` INT NOT NULL,
      `monedafiscalId` INT NOT NULL,
      `mascaracta` VARCHAR(20) NULL,
      `nombrecontador` VARCHAR(50) NULL,
      `nombregerente` VARCHAR(50) NULL,
      `nombreauditor` VARCHAR(50) NULL,
	  `usuarioCreated`  VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL);

CREATE TABLE IF NOT EXISTS `ttipoparampres` (
      `interes` DECIMAL(20,2) DEFAULT 0.00,
      `mora` DECIMAL(20,2) DEFAULT 0.00,
      `diasPlazo` DECIMAL(20,2) DEFAULT 0.00,
      `limitecredito` DECIMAL(20,2) DEFAULT 0.00,
      `ctacontable` VARCHAR(20) NULL,
      `empresaId` INT NULL,
	  `usuarioCreated`  VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL);

CREATE TABLE IF NOT EXISTS `ttipoparampap` (
      `empresaId` INT NOT NULL,
      `moduloId` INT NOT NULL,
      `proforma` VARCHAR(150) NULL,
      `reporte` VARCHAR(150) NULL,
      `usuarioCreated`  VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL);

CREATE TABLE IF NOT EXISTS `ttipoparamcxc` (
      `empresaId` INT NOT NULL,
      `nrocliente` INT NULL,
      `interes` DECIMAL(20,2) DEFAULT 0.00,
      `mora` DECIMAL(20,2) DEFAULT 0.00,
      `diasPlazo` DECIMAL(20,2) DEFAULT 0.00,
      `limitecredito` DECIMAL(20,2) DEFAULT 0.00,
      `ctacontable` VARCHAR(20) NULL,
      `usuarioCreated`  VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL);

CREATE TABLE IF NOT EXISTS `ttipoparamcxp` (
      `empresaId` INT NOT NULL,
	  `nroproveedor` INT NULL,
      `interes` DECIMAL(20,2) DEFAULT 0.00,
      `mora` DECIMAL(20,2) DEFAULT 0.00,
      `diasPlazo` DECIMAL(20,2) DEFAULT 0.00,
      `limitecredito` DECIMAL(20,2) DEFAULT 0.00,
      `ctacontable` VARCHAR(20) NULL,
      `usuarioCreated`  VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL);

/* modulo de Inventarios */

-- productos
CREATE TABLE IF NOT EXISTS `productos` (
      `produtoId` INT NOT NULL AUTO_INCREMENT,
      `codbarra` VARCHAR(20) NULL,
      `descripcion` VARCHAR(250) NULL,
      `descripcion_corta` VARCHAR(50) NULL,
      `cstounit` DECIMAL(20,2) DEFAULT 0.00,
      `cstoprom` DECIMAL(20,2) DEFAULT 0.00,
      `precioventa` DECIMAL(20,2) DEFAULT 0.00,
      `fecUltcom` DATETIME NULL,
      `fecUltvta` DATETIME NULL,
      `puntoretorno` DECIMAL(18,2) DEFAULT 0.00,
      `categoriaId`  INT NOT NULL,
      `impuestoId` INT NOT NULL,
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
	  `empresaId` INT NOT NULL,
      `usuarioCreated` VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
		PRIMARY KEY (`produtoId`),
		CONSTRAINT `productosUnique` UNIQUE (`descripcion`,`empresaId`)
		) 
		COMMENT = 'esta tabla se usuara para registrar los productos por empresa';

CREATE TABLE IF NOT EXISTS `productosdet` (
      `productosdetsId` INT NOT NULL AUTO_INCREMENT,
	  `produtoId` INT NOT NULL,
      `tipo` enum('MARCA','MODELO','EMBALAJE','PASILLO','DEPARTAMENTO','UBICACION','COLOR','PESO','EQUIVALENCIA','CODIGOBARRA','TAMAÃƒâ€˜O') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'MARCA',
      `descripcion` VARCHAR(30) NOT NULL,
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `empresaId` INT NOT NULL,
      `usuarioCreated` VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
		PRIMARY KEY (`productosdetsId`),
		CONSTRAINT `productosdetsUnique` UNIQUE (`produtoId`,`tipo`,`descripcion`,`empresaId`)
		) 
		COMMENT = 'esta tabla se usuara para registrar los productos por empresa';


-- productoimg
CREATE TABLE IF NOT EXISTS `productoimg` (
      `productoimgId` INT NOT NULL AUTO_INCREMENT,
      `productoId` INT NOT NULL,
      `img` LONGTEXT NOT NULL,
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
	  `empresaId` INT NOT NULL,
   	  `usuarioCreated` VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
		 PRIMARY KEY (`productoimgId`)
	  	 ) COMMENT = 'esta tabla se usuara para registrar las imagenes por producto y empresa';

--  productocodbarras
CREATE TABLE IF NOT EXISTS `productocodbarras` (
      `productocodbarrasId` INT NOT NULL AUTO_INCREMENT,
      `productoId` INT NOT NULL,
      `codbarra` VARCHAR(20) NOT NULL,
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `empresaId` INT NOT NULL,
   	  `usuarioCreated` VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
		 PRIMARY KEY (`productocodbarrasId`),
	    CONSTRAINT `productocodbarrasiUnique` UNIQUE(`productoId`,`codbarra`, `empresaId`)
		 ) COMMENT = 'esta tabla se usuara para registrar los codigo de barra por producto y empresa';


-- compreasmae
CREATE TABLE IF NOT EXISTS `cxpcomprasmae` (
  `compraId` INT NOT NULL AUTO_INCREMENT,
  `fecharegistro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `TipoCompra` enum('F','O') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'F',
  `bodegaId` INT NOT NULL,
  `proveedorId` INT NOT NULL,
  `documentoId` INT NULL,
  `monedaId` INT NULL,
  `factorcambio` DECIMAL(18,4) NULL,
  `nroreferencia` VARCHAR(20) NULL,
  `subtotal` DECIMAL(20,2) DEFAULT 0.00,
  `descuento` DECIMAL(20,2) DEFAULT 0.00,
  `impuesto` DECIMAL(20,2) DEFAULT 0.00,
  `total` DECIMAL(20,2) DEFAULT 0.00,
  `sn_pagada` enum('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'N',
  `sn_cotabilizada` enum('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'N',
  `sn_anulada` enum('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
  `empresaId` INT NOT NULL,
  `usuarioCreated`  VARCHAR(12) NOT NULL,
  `usuarioUpdated` VARCHAR(12) NULL,
  `fechaUpdated` DATETIME NULL,
  PRIMARY KEY (`compraId`),
  CONSTRAINT `cxpcomprasmaeUnique` UNIQUE (`proveedorId`,`nroreferencia`, `empresaId`))
  COMMENT = 'esta tabla se usuara para registrar las compras por proveedor';

-- cxpcomprasdet
CREATE TABLE IF NOT EXISTS `cxpcomprasdet` (
  `cxpcomprasdetId` INT NOT NULL AUTO_INCREMENT,
  `fecharegistro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `compraId` INT NOT NULL,
  `bodegaId` INT NOT NULL,
  `nrofila` INT NOT NULL,
  `codbarra` VARCHAR(20) NULL,
  `descripcion` VARCHAR(50) NULL,
  `cantidad` DECIMAL(20,2) DEFAULT 0.00,
  `precio` DECIMAL(20,2) DEFAULT 0.00,
  `subtotal` DECIMAL(20,2) DEFAULT 0.00,
  `empresaId` INT NOT NULL,
  `usuarioCreated` VARCHAR(12) NOT NULL,
  `usuarioUpdated` VARCHAR(12) NULL,
   `fechaUpdated` DATETIME NULL,
   PRIMARY KEY(`cxpcomprasdetId`),
   INDEX `cxpcomprasdetIndex` (`fecharegistro` ASC, `compraId` ASC, `bodegaId` ASC, `nrofila` ASC, `empresaId` ASC)
	VISIBLE)
	COMMENT = 'esta tabla se usuara para registrar el detalle de compras por proveedor';

-- Inventario fisico maestro
CREATE TABLE IF NOT EXISTS `invfismae` (
  `invfisId` INT NOT NULL AUTO_INCREMENT,
  `fecharegistro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `bodegaId` INT NOT NULL,
  `concepto` VARCHAR(100) NULL,
  `sn_anulado` enum('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'N',
  `empresaId` INT NOT NULL,
  `usuarioCreated` VARCHAR(12) NOT NULL,
  `usuarioUpdated` VARCHAR(12) NULL,
  `fechaUpdated` DATETIME NULL,
  PRIMARY KEY (`invfisId`))
  COMMENT = 'esta tabla se usuara para levantar inventarios fisicos porempresa';

-- Inventario fisico detalle
CREATE TABLE IF NOT EXISTS `invfisdet` (
  `nvfisdetId` INT NOT NULL AUTO_INCREMENT,
  `fecharegistro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `invfisId` INT NOT NULL,
  `bodegaId` INT NOT NULL,
  `nrofila` INT NOT NULL,
  `codbarra` VARCHAR(20) NOT NULL,
  `descripcion` VARCHAR(50) NULL,
  `existencia` INT NULL,
  `fisico` DECIMAL(20,2) DEFAULT 0.00,
  `ajusteEntrada` DECIMAL(20,2) DEFAULT 0.00,
  `ajusteSalida` DECIMAL(20,2) DEFAULT 0.00,
  `costoUnitario` DECIMAL(20,2) DEFAULT 0.00,
  `costoTotal` DECIMAL(20,2) DEFAULT 0.00,
  `preciovta` DECIMAL(20,2) DEFAULT 0.00,
  `sn_posteado` enum('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
  `sn_aplicado` enum('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'N',
  `empresaId` INT NOT NULL,
  `usuarioCreated` VARCHAR(12) NOT NULL,
  `usuarioUpdated` VARCHAR(12) NULL,
  `fechaUpdated` DATETIME NULL,
   PRIMARY KEY (`nvfisdetId`))
	COMMENT = 'esta tabla detalla el inventario fisicos levantado por empresa';

-- Traslados de Inventario maestro
CREATE TABLE IF NOT EXISTS `invtrasmae` (
  `trasladoId` INT NOT NULL AUTO_INCREMENT,
  `fecharegistro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `bodegaorigen` INT NOT NULL,
  `bodegadestino` INT NOT NULL,
  `observacion` VARCHAR(100) NOT NULL,
  `factordecambio` DECIMAL(20,2) DEFAULT 0.00,
  `total` DECIMAL(20,2) DEFAULT 0.00,
  `sn_anulado` enum('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
  `empresaId` INT NOT NULL,
  `usuarioCreated` VARCHAR(12) NOT NULL,
  `usuarioUpdated` VARCHAR(12) NULL,
  `fechaUpdated` DATETIME NULL,
  PRIMARY KEY(`trasladoId`))
  COMMENT = 'esta tabla registrar el control de los productos traslados entre bodegas';

-- Traslados de Inventario detalle
CREATE TABLE IF NOT EXISTS `invtrasdet` (
  `trasladosetallesId` INT NOT NULL AUTO_INCREMENT,
  `fecharegistro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `trasladoId` INT NOT NULL,
  `nrofila` INT NOT NULL,
  `productoId`  INT NOT NULL,
  `codbarra` VARCHAR(20) NOT NULL,
  `cantidad` DECIMAL(20,2) DEFAULT 0.00,
  `precioCosto` DECIMAL(20,2) DEFAULT 0.00,
  `precioVenta` DECIMAL(20,2) DEFAULT 0.00,
  `subTotal` DECIMAL(20,2) DEFAULT 0.00,
  `bodegaOrigen` INT NOT NULL,
  `bodegaDestino` INT NOT NULL,
  `empresaId` INT NULL,
  `sn_anulado` enum('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
  `usuarioCreated` VARCHAR(12) NOT NULL,
  `usuarioUpdated` VARCHAR(12) NULL,
  `fechaUpdated` DATETIME NULL,
   PRIMARY KEY (`trasladosetallesId`),
   CONSTRAINT `trasladosdetallesUnico` UNIQUE (`trasladoId` ASC, `fecharegistro` ASC, `productoId` ASC) VISIBLE)
   COMMENT = 'esta tabla registra el l detalle de los productos trasladados entre bodegas';


-- Requisiciones de Inventario maestro
CREATE TABLE IF NOT EXISTS `invreqmae` (
      `requisionId` INT NOT NULL AUTO_INCREMENT,
      `fecharegistro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      `concepto` VARCHAR(100) NULL,
      `sn_anulado` enum('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `empresaId` INT NOT NULL,
      `usuarioCreated`  VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
      PRIMARY KEY (`requisionId`))
		COMMENT = 'esta tabla se usara registra la solicitud de productos en caso el inventario este bajo';
-- Requisiciones de Inventario detalle
CREATE TABLE IF NOT EXISTS `invreqdet` (
  `reqdetId` INT NOT NULL AUTO_INCREMENT,
  `fecharegistro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `requisionId` INT NOT NULL,
  `bodegaId` INT NOT NULL,
  `nrofila` INT NOT NULL,
  `productoId` INT NOT NULL,
  `codbarra` VARCHAR(20) NOT NULL,
  `cantidad` DECIMAL(20,2) DEFAULT 0.00,
  `costounitario` DECIMAL(20,2) DEFAULT 0.00,
  `costototal` DECIMAL(20,2) DEFAULT 0.00,
  `sn_anulado` enum('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
  `empresaId` INT NOT NULL,
  `usuarioCreated`  VARCHAR(12) NOT NULL,
  `usuarioUpdated` VARCHAR(12) NULL,
  `fechaUpdated` DATETIME NULL,
   PRIMARY KEY (`reqdetId`))
  	COMMENT = 'esta tabla registra el detalle de la requisicion de productos';

-- Movimientos de Inventario maestro
CREATE TABLE IF NOT EXISTS `invmovmae` (
      `invmovmaeid` INT NOT NULL AUTO_INCREMENT,
      `fecharegistro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      `nroajuste` INT NOT NULL,
      `bodegaId` INT NOT NULL,
      `concepto` VARCHAR(100) NULL,
      `sn_entrada` enum('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `sn_anulado` enum('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `empresaId` INT NOT NULL,
      `usuarioCreated`  VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
      PRIMARY KEY (`invmovmaeid`))
		COMMENT = 'esta tabla registra los movimientos de inventarios por diversas causas que no sean por compras';

-- Movimientos  de Inventario detalle
CREATE TABLE IF NOT EXISTS `invmovdet` (
      `invmovdetid` INT NOT NULL AUTO_INCREMENT,
      `fecharegistro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      `invmovmaeid` INT NOT NULL,
      `nrofila` INT NOT NULL,
      `bodegaId` INT NOT NULL,
      `productoId`  INT NOT NULL,
	  `codbarra` VARCHAR(20) NOT NULL,
      `cantidad` DECIMAL(20,2) DEFAULT 0.00,
      `costoUnitario` DECIMAL(20,2) DEFAULT 0.00,
      `costoTotal` DECIMAL(20,2) DEFAULT 0.00,
      `verificador` TINYINT(1) NOT NULL,
      `sn_entrada` enum('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `sn_anulado` enum('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `empresaId` INT NOT NULL,
      `usuarioCreated`  VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
      PRIMARY KEY (`invmovdetid`),
      INDEX `invmovdetIndex` (`fecharegistro` ASC, `nrofila` ASC, `empresaId` ASC) VISIBLE)
		COMMENT = 'esta tabla registra el detalle de la movimientos por productos';


-- invreconinv
 CREATE TABLE IF NOT EXISTS `invreconinv` (
      `invreconinvId` INT NOT NULL AUTO_INCREMENT,
      `bodegaId` INT NOT NULL,
      `productoId` INT NOT NULL,
	  `codbarra` VARCHAR(20) NOT NULL,
      `entradas` INT NOT NULL,
      `salidas` INT NOT NULL,
      `existencia` INT NOT NULL,
	  `empresaId` INT NOT NULL,
      `usuarioCreated`  VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
		PRIMARY KEY(`invreconinvId`))
		COMMENT = 'esta tabla es utilitarios para reconstruir existencias segun los movimientos del kardex';

-- invkardex
CREATE TABLE IF NOT EXISTS `invkardex` (
      `invkardexId` INT NOT NULL AUTO_INCREMENT,
      `fecharegistro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      `bodegaId` INT NOT NULL,
      `productoId` INT NOT NULL,
	  `codbarra` VARCHAR(20) NOT NULL,
      `FechaIngreso` DATETIME NULL,
      `factordecambio` DECIMAL(20,2) DEFAULT 0.00,
      `cantidad` DECIMAL(20,2) DEFAULT 0.00,
      `existencia` INT NOT NULL,
      `costoUnitario` DECIMAL(20,2) DEFAULT 0.00,
      `subTotal` DECIMAL(20,2) DEFAULT 0.00,
      `saldoAnterior` DECIMAL(20,2) DEFAULT 0.00,
      `saldoActual` DECIMAL(20,2) DEFAULT 0.00,
      `costoTotal` DECIMAL(20,2) DEFAULT 0.00,
      `costoUSD` DECIMAL(20,2) DEFAULT 0.00,
      `subTotalUSD` DECIMAL(20,2) DEFAULT 0.00,
      `nroreferencia` VARCHAR(20) NOT NULL,
      `tipomov`  enum('E','S') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'E',
      `moduloId` INT NOT NULL,
      `empresaId` INT NOT NULL,
      `usuarioCreated`  VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
	  PRIMARY KEY(`invkardexId`),
      INDEX `invkardexIndex` (`bodegaId` DESC, `productoId` DESC, `empresaId` DESC) VISIBLE
		)
		COMMENT = 'el kardex se usa para registrar todos los movimientos de los productos, ya sea por compras, ventas etc';

-- invexistencias
CREATE TABLE IF NOT EXISTS `invexistencias` (
      `invexistenciaId` INT NOT NULL AUTO_INCREMENT,
      `bodegaId`  INT NOT NULL,
      `productoId` INT NOT NULL,
      `existencia` DECIMAL(20,2) DEFAULT 0.00,
      `costounitario` DECIMAL(18,4) NULL,
      `precioventa` DECIMAL(18,4) NULL,
      `fecUltCompra` DATETIME NULL,
      `fecUltVta` DATETIME NULL,
      `empresaId` INT NULL,
      `usuarioCreated`  VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
      PRIMARY KEY(`invexistenciaId`),
      CONSTRAINT `invexistenciasUnique` UNIQUE (`bodegaId`,`productoId`,`empresaId`))
		COMMENT = 'Esta tabla se usara para reflejar la existencia de un producto por bodega';

-- Tablas referenciales de inventario

-- tinvcategoria    
CREATE TABLE IF NOT EXISTS `tinvcategoria` (
      `categoriaId`  INT NOT NULL AUTO_INCREMENT,
      `descripcion` VARCHAR(50) NULL,
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `empresaId` INT NOT NULL,
      `usuarioCreated` VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
		PRIMARY KEY (`categoriaId`),
		CONSTRAINT `tinvcategoriaUnique` UNIQUE (`descripcion`,`empresaId`))
		COMMENT = 'esta tabla registra las categorias de los productos';

-- tinvbodegas
CREATE TABLE IF NOT EXISTS `tinvbodegas` (
      `bodegaId` INT NOT NULL AUTO_INCREMENT,
      `descripcion` VARCHAR(50) NULL,
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `empresaId` INT NOT NULL,
      `usuarioCreated` VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
      PRIMARY KEY (`bodegaId`),
      CONSTRAINT `tinvbodegasUnique` UNIQUE (`descripcion`, `empresaId`))
		COMMENT = 'esta tabla se usuara para asignar una bogeda en los inventarios y ventas de facturas';

-- tinvpasillos
CREATE TABLE IF NOT EXISTS `tinvpasillos` (
      `pasilloId`INT NOT NULL AUTO_INCREMENT,
      `descripcion` VARCHAR(50) NOT NULL,
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
    	 `empresaId` INT NOT NULL,
   	 `usuarioCreated` VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
		 PRIMARY KEY (`pasilloId`),
      CONSTRAINT `tpasillosUnique` UNIQUE (`descripcion`, `empresaId`)
		) COMMENT = 'esta tabla se usuara para asignar un pasillo a producto';

-- tinvestantes
CREATE TABLE IF NOT EXISTS `tinvestantes` (
      `testanteId` INT NOT NULL AUTO_INCREMENT,
      `descripcion` VARCHAR(50) NOT NULL,
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
    	`empresaId` INT NOT NULL,
		`usuarioCreated` VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
		PRIMARY KEY (`testanteId`),
		CONSTRAINT `tinvestantesUnique` UNIQUE (`descripcion`, `empresaId`))
		COMMENT = 'esta tabla se usuara para asignar un producto en un estante';

-- tinvmarcas
CREATE TABLE IF NOT EXISTS `tinvmarcas` (
      `marcaId` INT NOT NULL AUTO_INCREMENT,
      `descripcion` VARCHAR(50) NOT NULL,
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
  	`empresaId` INT NOT NULL,
		`usuarioCreated` VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
		PRIMARY KEY(`marcaId`),
		CONSTRAINT `tmarcasUnique` UNIQUE (`descripcion`,`empresaId`))
		COMMENT = 'esta tabla registra las marcas comerciales';

-- tinvcolores
CREATE TABLE IF NOT EXISTS `tinvcolores` (
      `colorId` INT NOT NULL AUTO_INCREMENT,
      `descripcion` VARCHAR(50) NOT NULL,
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `empresaId` INT NOT NULL,
      `usuarioCreated` VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
		 PRIMARY KEY(`colorId`),
		 CONSTRAINT `tinvcoloresUnique` UNIQUE (`descripcion`,`empresaId`))
		 COMMENT = 'esta tabla registra el colores para los productos';

-- tinvubicaciones    
CREATE TABLE IF NOT EXISTS `tinvubicaciones` (
      `ubicacionId`  INT NOT NULL AUTO_INCREMENT,
      `descripcion` VARCHAR(50) NULL,
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `empresaId` INT NOT NULL,
      `usuarioCreated` VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
		PRIMARY KEY (`ubicacionId`),
		CONSTRAINT `tinvubicacionesUnique` UNIQUE (`descripcion`,`empresaId`))
		COMMENT = 'esta tabla registra la ubicaciones de una bodega';

-- tinvmodelos
CREATE TABLE IF NOT EXISTS `tinvmodelos` (
      `modeloId` INT NOT NULL AUTO_INCREMENT,
      `descripcion` VARCHAR(50) NOT NULL,
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
  	`empresaId` INT NOT NULL,
		`usuarioCreated` VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
		PRIMARY KEY(`modeloId`),
		CONSTRAINT `tinvmodelosUnique` UNIQUE (`descripcion`,`empresaId`))
		COMMENT = 'esta tabla registra los modelos de los productos';

-- tinvembalajes
CREATE TABLE IF NOT EXISTS `tinvembalajes` (
      `embalajeId` INT NOT NULL AUTO_INCREMENT,
      `descripcion` VARCHAR(50) NOT NULL,
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `empresaId` INT NOT NULL,
	  `usuarioCreated` VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
		PRIMARY KEY(`embalajeId`),
		CONSTRAINT `tembalajesUnique` UNIQUE (`descripcion`,`empresaId`))
		COMMENT = 'esta tabla registra los tipos de embalaje que pueden existir para los productos';

-- tinvunidademedida
CREATE TABLE IF NOT EXISTS `tinvunidadmedida` (
      `unidadmedidaId` INT NOT NULL AUTO_INCREMENT,
	  `descripcion` VARCHAR(50) NOT NULL,
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
  	  `empresaId` INT NOT NULL,
	  `usuarioCreated` VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
		PRIMARY KEY (`unidadmedidaId`),
		CONSTRAINT `tinvunidadmedidaUnique` UNIQUE (`descripcion`, `empresaId`) )
		COMMENT = 'registra las unidades de medida';
-- tinvcasas
CREATE TABLE IF NOT EXISTS `tinvcasas` (
      `casaId` INT NOT NULL AUTO_INCREMENT,
      `descripcion` VARCHAR(33) NULL,
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `empresaId` INT NOT NULL,
	  `usuarioCreated` VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
		 PRIMARY KEY (`casaId`),
		 CONSTRAINT `tinvcasasUnique` UNIQUE (`descripcion`, `empresaId`))
		 COMMENT = 'registra los nombres de las casas farmaceuticas o laboratorios';
-- tinvtags
CREATE TABLE IF NOT EXISTS `tinvtags` (
      `tagsId` INT NOT NULL AUTO_INCREMENT,
      `descripcion` VARCHAR(33) NULL,
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
    	`empresaId` INT NOT NULL,
		`usuarioCreated` VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
		 PRIMARY KEY (`tagsId`),
		 CONSTRAINT `tinvtagsIdUnique` UNIQUE (`descripcion`, `empresaId`))
		 COMMENT = 'registra los tags para buscar productos';

-- fin tablas referenciales de inventario


/* ------------------------------ POS ----------------------------- */

-- poscorrelativos
CREATE TABLE IF NOT EXISTS `poscorrelativos` (
      `poscorrelativosId` INT NOT NULL AUTO_INCREMENT,
      `nrofactura` INT NOT NULL,
      `TCPIP` VARCHAR(35) NOT NULL,
      `empresaId` INT NOT NULL,
      `usuarioCreated` VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
		PRIMARY KEY (`poscorrelativosId`))
		COMMENT = 'esta tabla controla los correlativos de factura por tusuarios';

-- factura maestro
CREATE TABLE IF NOT EXISTS `posfacmae` (
  `facturaId` INT NOT NULL AUTO_INCREMENT,
  `fecharegistro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `nrofactura` INT NOT NULL,
  `tipofactura`  enum('E','C') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'E',
  `clienteId` INT NOT NULL,
  `nrocliente` VARCHAR(20) NOT NULL,
  `nombrecliente` VARCHAR(80) NULL,
  `direccion` VARCHAR(120) NULL,
  `factordecambio` DECIMAL(20,2) DEFAULT 0.00,
  `subTotal` DECIMAL(20,2) DEFAULT 0.00,
  `impuesto` DECIMAL(20,2) DEFAULT 0.00,
  `descuento` DECIMAL(20,2) DEFAULT 0.00,
  `total` DECIMAL(20,2) DEFAULT 0.00,
  `efectivo_recibido` DECIMAL(20,2) DEFAULT 0.00,
  `importe_cambio` DECIMAL(20,2) DEFAULT 0.00,
  `diascredito` INT NOT NULL DEFAULT 0,
  `fechavencimiento` DATETIME NULL,
  `bodegaId` INT NOT NULL,
  `cajaId` INT NOT NULL,
  `gestorId` INT NOT NULL,
  `formapagoId` INT NOT NULL,
  `tarjetacreditoId` INT NULL,
  `nrotarjeta` VARCHAR(20) NULL,
  `nroreferencia` VARCHAR(20) NULL,
  `sn_excenta` enum('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'N',
  `nrocarnet` VARCHAR(12) NULL,
  `sn_pagada` enum('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
  `Hora` DATETIME NULL,
  `sn_anulada` enum('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'N',
  `fechaanulacion` DATETIME NULL,
  `anulaciond` INT NULL,
  `sn_contabilizada` enum('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'N',
  `empresaId` INT NOT NULL,
  `usuarioCreated`  VARCHAR(12) NOT NULL,
  `usuarioUpdated` VARCHAR(12) NULL,
  `fechaUpdated` DATETIME NULL,
   PRIMARY KEY (`facturaId`),
	CONSTRAINT `posfacmaeUnique` UNIQUE(`fecharegistro`,`facturaId`, `empresaId`) 
	) COMMENT = 'El maestro de facturas se usara para reflejar todas la ventas electronicas';

-- detalle de pagos de factura posfaccaja
CREATE TABLE IF NOT EXISTS `posfaccaja` (
  `posfaccajaId` int NOT NULL AUTO_INCREMENT,
  `fecharegistro` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `facturaId` int NOT NULL,
  `formapagoId` int NOT NULL,
  `tarjetacreditoId` int DEFAULT NULL,
  `nrotarjeta` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `nroautorizacion` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `factordecambio` decimal(20,2) DEFAULT '0.00',
  `importe_efectivo` decimal(20,2) DEFAULT '0.00',
  `importe_otros` decimal(20,2) DEFAULT '0.00',
  `importe_cambio` decimal(20,2) DEFAULT '0.00',
  `cajaId` int NOT NULL,
  `sn_anulado` enum('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'N',
  `fec_anulacion` datetime DEFAULT NULL,
  `Idsucursal` int DEFAULT NULL,
  `empresaId` int NOT NULL,
  `usuarioCreated` varchar(12) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `usuarioUpdated` varchar(12) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `fechaUpdated` datetime DEFAULT NULL,
  PRIMARY KEY (`posfaccajaId`),
  KEY `FK_posfaccaja_posfacmae` (`facturaId`),
  KEY `FK_posfaccaja_ttipoformapago` (`formapagoId`),
  KEY `FK_posfaccaja_ttipotarjetacredito` (`tarjetacreditoId`),
  KEY `FK_posfaccaja_tempresas` (`empresaId`),
  CONSTRAINT `FK_posfaccaja_posfacmae` FOREIGN KEY (`facturaId`) REFERENCES `posfacmae` (`facturaId`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `FK_posfaccaja_tempresas` FOREIGN KEY (`empresaId`) REFERENCES `tempresas` (`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `FK_posfaccaja_ttipoformapago` FOREIGN KEY (`formapagoId`) REFERENCES `ttipoformapago` (`formapagoId`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `FK_posfaccaja_ttipotarjetacredito` FOREIGN KEY (`tarjetacreditoId`) REFERENCES `ttipotarjetacredito` (`tarjetacreditoId`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_spanish_ci;

-- factura detalle
CREATE TABLE IF NOT EXISTS `posfacdet` (
  `posfacdetId` INT NOT NULL AUTO_INCREMENT,
  `fecharegistro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `facturaId` INT NULL,
  `bodegaId` INT NULL,
  `nrofila` INT NULL,
  `productoId` INT NOT NULL,
  `codbarra` VARCHAR(20) NOT NULL,
  `cantidad` DECIMAL(20,2) DEFAULT 0.00,
  `precioventa` DECIMAL(20,2) DEFAULT 0.00,
  `impuesto` DECIMAL(20,2) DEFAULT 0.00,
  `subTotal` DECIMAL(20,2) DEFAULT 0.00,
  `descuento` DECIMAL(20,2) DEFAULT 0.00,
  `sn_anulada` enum('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
  `empresaId` INT NOT NULL,
  `usuarioCreated`  VARCHAR(12) NOT NULL,
  `usuarioUpdated` VARCHAR(12) NULL,
  `fechaUpdated` DATETIME NULL,
  PRIMARY KEY(`posfacdetId`),
  INDEX `facdeNoFactura` (`facturaId` ASC) VISIBLE,
  INDEX `facdeIndex` (`fecharegistro` ASC, `facturaId` ASC, `productoId` ASC, `empresaId` ASC) VISIBLE)
  COMMENT = 'El detalle de facturas se usara para reflejar los items vendidos en la factura electronica';

-- combos para ventas maestro
CREATE TABLE IF NOT EXISTS `poscbomae` (
      `poscbomaeId` INT NOT NULL AUTO_INCREMENT,
      `descripcion` VARCHAR(20) NULL,
      `fec_vig_desde` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	   `fec_vig_hasta` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      `empresaId` INT NOT NULL,
      `usuarioCreated`  VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
		 PRIMARY KEY (`poscbomaeId`),
		 CONSTRAINT `poscbomaeUnique` UNIQUE (`descripcion`,`empresaId`))
		 COMMENT = 'El maestro de combos de ventas, registra las ofertas dadas los cxcclientes por medio de una combo';

-- combos para ventas detalle
CREATE TABLE IF NOT EXISTS `poscbodet` (
      `poscbodetId` INT NOT NULL AUTO_INCREMENT,
      `poscbomaeId` INT NOT NULL,
      `productoId` INT NULL,
	  `codbarra` VARCHAR(20) NOT NULL,
      `cantidad` INT NULL,
      `precioventa` DOUBLE NULL,
	  `empresaId` INT NOT NULL,
      `usuarioCreated`  VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
		 PRIMARY KEY (`poscbodetId`),
		 CONSTRAINT `poscbodetUnique` UNIQUE (`poscbomaeId`,`productoId`,`empresaId`))
		 COMMENT = 'El detalle de combos de ventas, se usa para establecer los precios de venta por producto en la factura';

-- anulacion de factura maestro
CREATE TABLE IF NOT EXISTS `posfacmaeanul` (
      `posfacmaeanulId` INT NOT NULL AUTO_INCREMENT,
      `fecharegistro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      `facturaId` INT NOT NULL,
      `bodegaId` INT NULL,
      `clienteId`  INT NOT NULL,
	  `nrocliente` VARCHAR(20) NOT NULL,
      `sn_excento`  enum('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `factordecambio` DECIMAL(20,2) DEFAULT 0.00,
      `subTotal` DECIMAL(20,2) DEFAULT 0.00,
      `impuesto` DECIMAL(20,2) DEFAULT 0.00,
      `descuento` DECIMAL(20,2) DEFAULT 0.00,
      `total` DECIMAL(20,2) DEFAULT 0.00,
      `observacion` VARCHAR(100) NULL,
      `estado` enum('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `empresaId` INT NOT NULL,
      `usuarioCreated`  VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
      PRIMARY KEY (`posfacmaeanulId`),
		CONSTRAINT `posfacmaeanulUnique` UNIQUE (`facturaId`,`empresaId`))
		COMMENT = 'El maestro de anulacion es el control de las facturas anuladas, cuando una factura se anule debe registrar automaticamente en esta tabla mediante un ttrigger';

-- anulacion de factura detalle

CREATE TABLE IF NOT EXISTS `posfacdetanul` (
  `posfacdetanulacionId` INT NOT NULL AUTO_INCREMENT,
  `fecharegistro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `posfacmaeanulId` INT NOT NULL,
  `bodegaId` INT NOT NULL,
  `productoId` INT NOT NULL,
  `codbarra` VARCHAR(20) NOT NULL,
  `cantidad` DECIMAL(20,2) DEFAULT 0.00,
  `precio` DECIMAL(20,2) DEFAULT 0.00,
  `subTotal` DECIMAL(20,2) DEFAULT 0.00,
  `estado` enum('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
  `empresaId` INT NOT NULL,
  `usuarioCreated`  VARCHAR(12) NOT NULL,
  `usuarioUpdated` VARCHAR(12) NULL,
  `fechaUpdated` DATETIME NULL,
  PRIMARY KEY( `posfacdetanulacionId` ),
  INDEX `posfacdetanulacionIndex` (`fecharegistro` ASC, `posfacmaeanulId` ASC,  `bodegaId` ASC, `productoId` ASC, `empresaId` ASC) VISIBLE)
  COMMENT = 'El detalle de anulacion es el control de las facturas anuladas, cuando una factura se anule debe registrar automaticamente en esta tabla mediante un ttrigger';

-- maestro de cotizacion de venta
CREATE TABLE IF NOT EXISTS `poscotmae` (
  `poscotmaeId` INT NOT NULL AUTO_INCREMENT,
  `fecharegistro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Nombrecliente` VARCHAR(100) NOT NULL,
  `direccion` VARCHAR(255) NOT NULL,
  `atendio` VARCHAR(100) NOT NULL,
  `gestorId` INT NOT NULL,
  `empresaId` INT NOT NULL,
  `usuarioCreated`  VARCHAR(12) NOT NULL,
  `usuarioUpdated` VARCHAR(12) NULL,
  `fechaUpdated` DATETIME NULL,
  PRIMARY KEY (`poscotmaeId`))
  COMMENT = 'el maestro de cotizaciones, sirve como una utilidad para los cxcclientes que necesitan presentar cotizacion a sus patrones';

-- detalle cotizacion de venta
CREATE TABLE IF NOT EXISTS `poscotdet` (
  `poscotdetId` INT NOT NULL AUTO_INCREMENT,
  `poscotmaeId` INT NOT NULL,
  `fecharegistro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `productoId` VARCHAR(20) NULL,
  `codbarra` VARCHAR(20) NOT NULL,
  `cantidad` DECIMAL(20,2) NOT NULL,
  `precio` DECIMAL(20,2) DEFAULT 0.00,
  `subTotal` DECIMAL(20,2) DEFAULT 0.00,
  `empresaId` INT NULL,
  `usuarioCreated`  VARCHAR(12) NOT NULL,
  `usuarioUpdated` VARCHAR(12) NULL,
  `fechaUpdated` DATETIME NULL,
  PRIMARY KEY (`poscotdetId`))
  COMMENT = 'el detalle de cotizaciones, sirve como una utilidad para los cxcclientes que necesitan presentar cotizacion a sus patrones';

-- maestro de pedidos de venta
CREATE TABLE IF NOT EXISTS `pospedmae` (
      `pospedmaeId` INT NOT NULL AUTO_INCREMENT,
      `fecharegistro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      `nombrecliente` VARCHAR(50) NOT NULL,
      `nrotelefono` VARCHAR(20) NOT NULL,
      `sn_enviogratis` enum('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `sn_facturado` enum('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `facturaId` INT NULL,
      `empresaId` INT NOT NULL,
      `usuarioCreated`  VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
      PRIMARY KEY (`pospedmaeId`))
		COMMENT = 'el maestro de pedidos sirve como una herramienta de ventas en linea o via, es importante hacer notar que si el envio de pedido esta marcado como gratis
		, en la factura no se reflejara ninguna cobro por envio, y mientras no este facturado el pedido podra ser usado por call-center para saber si el cliente 
		aun desea el producto';

-- detalle de pedidos de venta
CREATE TABLE IF NOT EXISTS `pospeddet` (
      `pospeddetId` INT NOT NULL AUTO_INCREMENT,
      `fecharegistro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      `pospedmaeId` INT NOT NULL,
      `nrofila`INT NOT NULL,
      `productoId` INT NOT NULL,
	  `codbarra` VARCHAR(20) NOT NULL,
      `cantidad` DECIMAL(20,2) DEFAULT 0.00,
      `precioventa` DECIMAL(20,2) DEFAULT 0.00,
      `subtotal` DECIMAL(20,2) DEFAULT 0.00,
      `descuento` DECIMAL(20,2) DEFAULT 0.00,
      `impuesto` DECIMAL(20,2) DEFAULT 0.00,
      `empresaId` INT NULL,
      `usuarioCreated`  VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
      PRIMARY KEY (`pospeddetId`),
      CONSTRAINT `pospeddetUnique` UNIQUE (`fecharegistro`, `pospedmaeId`, `productoId`, `nrofila`, `empresaId`))
		COMMENT = 'El detalle de pedidos muestra lo que el cliente ha solicitado';

-- tpospreciovtas
CREATE TABLE IF NOT EXISTS `tpospreciovtas` (
      `preciovtaId` INT NOT NULL AUTO_INCREMENT,
      `descripcion` VARCHAR(50) NOT NULL,
      `porcentaje` DOUBLE NULL,
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `empresaId` INT NOT NULL,
      `usuarioCreated` VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
		 PRIMARY KEY (`preciovtaId`),
		CONSTRAINT `tpospreciovtasUnique` UNIQUE (`descripcion`, `empresaId`))
		COMMENT = 'esta tabla se usuara para asignar un precio de venta a un producto';

-- tposdescuentos
CREATE TABLE IF NOT EXISTS `tposdescuentos` (
      `descuentoId` INT NOT NULL AUTO_INCREMENT,
      `descripcion` VARCHAR(50) NULL,
      `porcentaje` DECIMAL(20,2) DEFAULT 0.00,
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `empresaId` INT NOT NULL,
      `usuarioCreated` VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
      PRIMARY KEY (`descuentoId`),
		CONSTRAINT `descuentosUnique` UNIQUE (`descripcion`))
		COMMENT = 'esta tabla se usuara para registrar los descuentos otorgados';


/* Tablas modulo de cxc */
-- cxcclientes
CREATE TABLE IF NOT EXISTS `cxcclientes` (
      `clienteId` INT NOT NULL AUTO_INCREMENT,
	  `nrocliente` VARCHAR(20) NOT NULL,
      `fecharegistro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	  `fechanacimiento` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      `nombres` VARCHAR(50) NOT NULL,
      `apellidos` VARCHAR(50) NOT NULL,
      `razonsocial` VARCHAR(120) NOT NULL,
      `dni` VARCHAR(20) NOT NULL,
      `sexo` enum('M','F') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'M',
      `estadocivil` enum('S','C','D','V','U') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `rtn` VARCHAR(50) NULL,
      `limiteCredito` DECIMAL(20,2) DEFAULT 0.00,
      `diasplazo` INT NOT NULL,
      `interes` DECIMAL(20,2) NOT NULL,
      `moratorio` DECIMAL(20,2) NOT NULL,
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',  
	  `categoria`enum('A','B','C','D','E') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'A',
      `empresaId` INT NOT NULL,
      `usuarioCreated` VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
      PRIMARY KEY (`clienteId`),
      CONSTRAINT `cxcclientesUnique` UNIQUE (`dni`, `empresaId`))
   	COMMENT = 'esta tabla se usuara para registrar los cxcclientes, y el cliente debe ser unico por empresa'; 

-- cxccclientesdir
 CREATE TABLE IF NOT EXISTS `cxccclientesdir` (
      `cxccclientesdirId` INT NOT NULL AUTO_INCREMENT,
	   `clienteid` INT NOT NULL,
      `direccionId` INT NOT NULL,
      `descripcion` VARCHAR(50) NULL,
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `empresaId` INT NULL,
      `usuarioCreated` VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
      PRIMARY KEY(`cxccclientesdirId`),
      CONSTRAINT `ClientesDireccionesUnique` UNIQUE (`clienteid`, `direccionId`, `empresaId`)
		) COMMENT = 'esta tabla se usuara para registrar las direccion del cliente';

-- cxcclientestel
CREATE TABLE IF NOT EXISTS `cxcclientestel` (
      `clientetelefonoId`  INT NOT NULL AUTO_INCREMENT,
      `clienteId` INT NOT NULL,
      `telefonoId` INT NOT NULL,
      `descripcion` VARCHAR(20) NULL,
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
     `empresaId` INT NULL,
      `usuarioCreated` VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
      PRIMARY KEY(`clientetelefonoId`),
      CONSTRAINT `cxcclientestelefonUnique` UNIQUE (`clienteId`,`descripcion`,`empresaId`))
		COMMENT = 'esta tabla se usuara para registrar los telefonos del cliente';

-- cxccclientesref
CREATE TABLE IF NOT EXISTS `cxccclientesref` (
      `referenciaId` INT NOT NULL AUTO_INCREMENT,
      `clienteId` INT NOT NULL,
      `nombres` VARCHAR(50) NOT NULL,
      `apellidos` VARCHAR(50) NOT NULL,
	  `fechanacimiento` DATETIME NULL,
      `dni` VARCHAR(20) NULL,
      `tiporeferencia` enum('AA','CO','FA') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'FA',
      `sexo` enum('M','F') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'M',
      `estadocivil` enum('S','C','D','V','U') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `telefono1` VARCHAR(20) NOT NULL,
      `telefono2` VARCHAR(20) NOT NULL,
      `direccion1` VARCHAR(50) NOT NULL,
      `direccion2` VARCHAR(50) NOT NULL,
      `lugarTrabajo` VARCHAR(50) NOT NULL,
      `cargo` VARCHAR(50) NULL,
      `salario` DECIMAL(20,2) DEFAULT 0.00,
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
  	 `empresaId` INT NOT NULL,
      `usuarioCreated` VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
      PRIMARY KEY(`referenciaId`),
      CONSTRAINT `cxccclientesrefUnique` UNIQUE (`dni`,`empresaId`))
		COMMENT = 'esta tabla se usuara para registrar las referencias del cliente';

-- cxccajeros    
CREATE TABLE IF NOT EXISTS `cxccajeros` (
      `cajaId` INT NOT NULL AUTO_INCREMENT,
      `usuario`  VARCHAR(12) NOT NULL,
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `empresaId` INT NOT NULL,
	  `usuarioCreated` VARCHAR(12) NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
      PRIMARY KEY (`cajaId`),
		CONSTRAINT `cxccajerosUnique` UNIQUE (`cajaId`,`usuario`,`empresaId`))
		COMMENT = 'esta tabla registra los cajeros disponibles para una empresa';

-- cxc de cxcclientes
CREATE TABLE IF NOT EXISTS `cxccajamae` (
  `cxccajaId`  INT NOT NULL AUTO_INCREMENT,
  `fecharegistro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `moduloId` INT NOT NULL,
  `clienteId` INT NOT NULL,
  `nrocliente` VARCHAR(20) NOT NULL,
  `documentoId` INT NOT NULL,
  `tipomov` CHAR(1) NOT NULL DEFAULT 'C',
  `nrodocumento` VARCHAR(20) NOT NULL,
  `concepto` VARCHAR(500) NULL,
  `sn_cotabilizada` enum('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'N',
  `sn_anulado` enum('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'N',
  `fec_anulacion` DATETIME,
  `partidaId` INT NULL,
  `Idsucursal` INT NULL,
  `empresaId` INT NOT NULL,
  `usuarioCreated` VARCHAR(12) NOT NULL,
  `usuarioUpdated` VARCHAR(12) NULL,
  `fechaUpdated` DATETIME NULL,
  PRIMARY KEY (`cxccajaId`),
  CONSTRAINT `cxccajaUnique` 
  UNIQUE (`fecharegistro`, `clienteId`,  `documentoId`, `nrodocumento`,`Idsucursal`, `empresaId`))
  COMMENT = 'esta tabla se usuara para registrar los movimientos del cliente';


CREATE TABLE IF NOT EXISTS `cxccajadet` (
  `cxccajadetId`  INT NOT NULL AUTO_INCREMENT,
  `cxccajaId`  INT NOT NULL,
  `clienteId` INT NOT NULL,
  `nrocliente` VARCHAR(20) NOT NULL,
  `factordecambio` DECIMAL(20,2) DEFAULT 0.00,
  `formapagoId` INT NOT NULL,
  `tarjetacreditoId` INT NULL,
  `nrotarjeta` VARCHAR(20) NULL,
  `nroautorizacion` VARCHAR(20) NULL,
  `importe` DECIMAL(20,2) DEFAULT 0.00,
  `cajaId` INT NOT NULL,
  `sn_anulado` enum('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'N',
  `fec_anulacion` DATETIME,
  `Idsucursal` INT NULL,
  `empresaId` INT NOT NULL,
  `usuarioCreated` VARCHAR(12) NOT NULL,
  `usuarioUpdated` VARCHAR(12) NULL,
  `fechaUpdated` DATETIME NULL,
  PRIMARY KEY (`cxccajadetId`))
  COMMENT = 'esta tabla se usuara para registrar los movimientos del cliente';

-- cxc de cxcclientes
CREATE TABLE IF NOT EXISTS `cxcmovimientos` (
  `clienteMovId`  INT NOT NULL AUTO_INCREMENT,
  `fecharegistro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `clienteId` INT NOT NULL,
  `nrocliente` VARCHAR(20) NOT NULL,
  `moduloId` INT NOT NULL,
  `documentoId` INT NOT NULL,
  `tipomov` enum('D','C') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'D',
  `nroreferencia` VARCHAR(20) NULL,
  `factordecambio` DECIMAL(20,2) DEFAULT 0.00,
  `importe` DECIMAL(20,2) DEFAULT 0.00,
  `concepto` VARCHAR(500) NULL,
  `sn_cotabilizada` enum('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'N',
  `sn_doc_anulado` enum('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'N',
  `fec_anulacion` DATETIME,
  `partidaId` INT NULL,
  `Idsucursal` INT NULL,
  `empresaId` INT NOT NULL,
  `usuarioCreated` VARCHAR(12) NOT NULL,
  `usuarioUpdated` VARCHAR(12) NULL,
  `fechaUpdated` DATETIME NULL,
  PRIMARY KEY (`clienteMovId`),
  CONSTRAINT `clientemovimientosUnique` 
  UNIQUE (`fecharegistro`, `clienteId`,  `documentoId`, `nroreferencia`,`Idsucursal`, `empresaId`))
  COMMENT = 'esta tabla se usuara para registrar los movimientos del cliente';

-- Historico de cxcclientes
CREATE TABLE IF NOT EXISTS `cxchisto` (
      `historicoclienteId` INT NOT NULL AUTO_INCREMENT,
      `anio` INT NOT NULL,
      `periodo` INT NOT NULL,
      `clienteId` INT NOT NULL,
	  `nrocliente` VARCHAR(20) NOT NULL,
      `saldo` DECIMAL(20,2) DEFAULT 0.00,
      `empresaId` INT NULL,
      `usuarioCreated` VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
      PRIMARY KEY (`historicoclienteId`))
		COMMENT = 'esta tabla se usuara para registrar el historico del cliente';

-- saldos a favor de cxcclientes
CREATE TABLE IF NOT EXISTS `cxcsalfav` (
      `cxcsalfavId` INT NOT NULL AUTO_INCREMENT,
      `fecharegistro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      `anio` INT NOT NULL,
      `periodo` INT NOT NULL,
      `clienteId` INT NOT NULL,
	  `nrocliente` VARCHAR(20) NOT NULL,
      `importe` DECIMAL(20,2) DEFAULT 0.00,
      `sn_aplicado` enum('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `fec_proceso` DATETIME NULL,
      `empresaId` INT NULL,
      `usuarioCreated` VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
      PRIMARY KEY (`cxcsalfavId`))
	  	COMMENT = 'esta tabla se usuara para registrar los saldos a favor del cxc';

-- cxc tcctdiascobros
CREATE TABLE IF NOT EXISTS `tcctdiascobros` (
      `tdiascobrosId` INT NOT NULL AUTO_INCREMENT,
      `descripcion` VARCHAR(50) NULL,
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `empresaId` INT NOT NULL,
      `usuarioCreated` VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
      PRIMARY KEY (`tdiascobrosId`),
		CONSTRAINT `tcctdiascobrosUnique` UNIQUE (`descripcion`, `empresaId`))
		COMMENT = 'registra los dias de cobros';

-- cxc prestamos
CREATE TABLE IF NOT EXISTS `cxcprestamos` (
      `prestamoId` INT NOT NULL AUTO_INCREMENT,
      `fecharegistro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      `nroprestamo` INT NOT NULL,
      `clienteId` INT NOT NULL,
	  `capital` DECIMAL(20,2) DEFAULT 0.00,
      `prima` INT NULL,
      `capitalneto` DECIMAL(20,2) DEFAULT 0.00,
      `tasa` DECIMAL(20,2) DEFAULT 0.00,
      `cuotas` INT NULL,
      `diascuotas` INT NULL,
      `moratorio` DECIMAL(20,2) DEFAULT 0.00,
      `gestorId` INT NULL,
      `monedaId` INT NULL,
      `gracia` INT NULL,
      `ultcuotapagada` INT NULL,
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `sn_contabilizado` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'N',
      `empresaId` INT NOT NULL,
      `usuarioCreated`  VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
      PRIMARY KEY (`prestamoId`));

CREATE TABLE IF NOT EXISTS `cxcprestamospp` (
  `pppId` INT NOT NULL AUTO_INCREMENT,
  `prestamoId` INT NOT NULL,
  `FechaPago` DATETIME NOT NULL,
  `clienteId` INT NOT NULL,
  `nrofila` INT NOT NULL,
  `vlrcuota` DECIMAL(20,2) DEFAULT 0.00,
  `capital` DECIMAL(20,2) DEFAULT 0.00,
  `interes` DECIMAL(20,2) DEFAULT 0.00,
  `mora` DECIMAL(20,2) DEFAULT 0.00,
  `saldo` DECIMAL(20,2) DEFAULT 0.00,
  `diasvencido` INT NULL,
  `sn_pagada` enum('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'N',
  `sn_anulada` enum('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'N',
  `empresaId` INT NOT NULL,
  `usuarioCreated`  VARCHAR(12) NOT NULL,
  `usuarioUpdated` VARCHAR(12) NULL,
  `fechaUpdated` DATETIME NULL,
  PRIMARY KEY(`pppId`),
  CONSTRAINT `cxcprestamosppUnique` UNIQUE (`prestamoId`, `FechaPago`, `clienteId`, `nrofila`, `empresaId`));

CREATE TABLE IF NOT EXISTS `cxcparientes` (
  `parienteId` INT NOT NULL AUTO_INCREMENT,
  `fecharegistro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fechanacimiento` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `clienteId` INT NOT NULL,
  `nombres` VARCHAR(50) NULL,
  `apellidos` VARCHAR(50) NULL,
  `dni` VARCHAR(20) NOT NULL,
  `tipopariente` enum('P','H','E','A','M') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'M',
  `sexo` enum('M','F') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'M',
  `estadocivil`  enum('S','C','D','V','U') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
  `telefono1` VARCHAR(20) NULL,
  `direccion1` VARCHAR(50) NULL,
  `lugar` VARCHAR(50) NULL,
  `cargo` VARCHAR(50) NULL,
  `salario` DECIMAL(20,2) DEFAULT 0.00,
  `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
  `empresaId` INT NOT NULL,
  `usuarioCreated`  VARCHAR(12) NOT NULL,
  `usuarioUpdated` VARCHAR(12) NULL,
  `fechaUpdated` DATETIME NULL,
   PRIMARY KEY(`parienteId`),
   CONSTRAINT `cxcparientesUnico` UNIQUE (`dni`,`empresaId`) );

-- fin de modulo cxc

/* modulo de cxp */

-- proveedor
CREATE TABLE IF NOT EXISTS `proveedor` (
      `proveedorId` INT NOT NULL AUTO_INCREMENT,
      `fecharegistro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      `nroproveedor` VARCHAR(20) NOT NULL,
      `nombres` VARCHAR(50) NOT NULL,
      `apellidos` VARCHAR(50) NOT NULL,
      `razonsocial` VARCHAR(120) NULL,
      `dni` VARCHAR(20) NULL,
      `sexo` enum('M','F') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'M',
      `estadocivil` enum('S','C','D','V','U') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `rtn` VARCHAR(50) NULL,
      `limiteCredito` DECIMAL(20,2) DEFAULT 0.00,
      `diasplazo` INT NOT NULL,
      `interes` DECIMAL(20,2) NOT NULL,
      `moratorio` DECIMAL(20,2) NOT NULL,
      `sn_activo` enum('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `categoria`enum('A','B','C','D','E') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'A',
      `empresaId` INT NOT NULL,
      `usuarioCreated` VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
      PRIMARY KEY (`proveedorId`),
      CONSTRAINT `proveedorUnique` UNIQUE (`dni`, `empresaId`))
		COMMENT = 'esta tabla se usuara para registrar los proveedores de la empresa';

-- proveedordir
CREATE TABLE IF NOT EXISTS `proveedordir` (
      `proveedordireccionId` INT NOT NULL AUTO_INCREMENT,
      `proveedorId` INT NOT NULL,
      `direccionId`  INT NOT NULL,
      `descripcion` VARCHAR(10) NULL,
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `empresaId` INT NOT NULL,
      `usuarioCreated` VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
      PRIMARY KEY (`proveedordireccionId`),
      CONSTRAINT `proveedordirUnique`  UNIQUE (`proveedorId`, `direccionId`, `empresaId`))
		COMMENT = 'esta tabla se usuara para registrar las direcciones del proveedor';

-- proveedortel
CREATE TABLE IF NOT EXISTS `proveedortel` (
      `proveedorestelefonosId` INT NOT NULL AUTO_INCREMENT,
      `proveedorId` INT NOT NULL,
      `telefonoId`  INT NOT NULL,
      `descripcion` VARCHAR(10) NULL,
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `empresaId` INT NOT NULL,
      `usuarioCreated` VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
      PRIMARY KEY (`proveedorestelefonosId`),
      CONSTRAINT `proveedortelUnique`  UNIQUE (`proveedorId`, `telefonoId`, `empresaId`))
		COMMENT = 'esta tabla se usuara para registrar los telefonos del proveedor';

-- movimientos cxp
CREATE TABLE IF NOT EXISTS `cxpmovimientos` (
  `bcomovId` INT NOT NULL AUTO_INCREMENT,
  `fecharegistro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `bcoctasId` INT NOT NULL,
  `moduloId` INT NOT NULL,
  `documentoId` INT NOT NULL,
  `proveedorId` INT NOT NULL,
  `codproveedor` VARCHAR(20) NOT NULL,
  `tipomov` enum('D','C') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'D',
  `nroreferencia` VARCHAR(20) NOT NULL,
  `descripcion1` VARCHAR(100) NULL,
  `descripcion2` VARCHAR(100) NULL,
  `importe` DECIMAL(20,2) DEFAULT 0.00,
  `nrochq` VARCHAR(20) NULL, 
  `sn_chq` enum('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
  `sn_chq_anulado` enum('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'N',
  `sn_conciliado` enum('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'N',
  `sn_contabilizado` enum('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'N',
  `sn_doc_anulado` enum('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'N',
  `fec_anulacion` DATETIME,
  `partidaId` INT NULL,
  `Idsucursal` INT NULL,
  `empresaId` INT NOT NULL,
   `usuarioCreated`  VARCHAR(12) NOT NULL,
   `usuarioUpdated` VARCHAR(12) NULL,
   `fechaUpdated` DATETIME NULL,
   PRIMARY KEY (`bcomovId`))
	COMMENT = 'Esta tabla registra los movimientos en las cuentas del banco';

-- Historico de cxp
CREATE TABLE IF NOT EXISTS `cxphisto` (
      `cxphistoId` INT NOT NULL AUTO_INCREMENT,
      `anio` INT NOT NULL,
      `periodo` INT NOT NULL,
      `proveedorId` INT NOT NULL,
	  `codproveedor` VARCHAR(20) NOT NULL,
      `saldo` DECIMAL(20,2) DEFAULT 0.00,
      `empresaId` INT NULL,
      `usuarioCreated` VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
      PRIMARY KEY (`cxphistoId`))
		COMMENT = 'esta tabla se usuara para registrar el historico de saldos proveedores';

-- saldos a favor de cxp
CREATE TABLE IF NOT EXISTS `cxpsalfav` (
      `cxpsalfavId` INT NOT NULL AUTO_INCREMENT,
      `fecharegistro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      `anio` INT NOT NULL,
      `periodo` INT NOT NULL,
      `proveedorId` INT NOT NULL,
	  `codproveedor` VARCHAR(20) NOT NULL,
      `importe` DECIMAL(20,2) DEFAULT 0.00,
      `sn_aplicado` enum('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'N',
      `fec_proceso` DATETIME NULL,
      `empresaId` INT NULL,
      `usuarioCreated` VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
       PRIMARY KEY (`cxpsalfavId`))
		COMMENT = 'esta tabla se usuara para registrar los saldos a favor en cxp';
/*  Modulo de bancos */
-- tabla de bancos
CREATE TABLE IF NOT EXISTS `bcos` (
      `bancoId` INT NOT NULL AUTO_INCREMENT,
      `descripcion` VARCHAR(50) NOT NULL,
      `sn_activo` enum('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `Idsucursal` INT NULL,
      `empresaId` INT NOT NULL,
      `usuarioCreated`  VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
      PRIMARY KEY (`bancoId`),
      CONSTRAINT `bcosUnique` UNIQUE (`descripcion`, `empresaId`)
		) COMMENT = 'Esta  registra los bancos';
-- direcciones del bancos
CREATE TABLE IF NOT EXISTS `bcosdir` (
      `bcosdireccionid` INT NOT NULL AUTO_INCREMENT,
      `bancoId` INT NOT NULL,
      `direccionId` INT NOT NULL,
      `descripcion` VARCHAR(50) NULL,
      `empresaId` INT NOT NULL,
      `usuarioCreated`  VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
      PRIMARY KEY (`bcosdireccionid`))
		COMMENT = 'Esta tabla registra las direcciones de los bancos';
-- telefonos del bancos
CREATE TABLE IF NOT EXISTS `bcostel` (
      `bancotelefonoId` INT NOT NULL AUTO_INCREMENT,
      `bancoId` INT NOT NULL,
      `telefonoId` INT NOT NULL,
      `descripcion` VARCHAR(20) NULL,
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `empresaId` INT NOT NULL,
      `usuarioCreated`  VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
      PRIMARY KEY(`bancotelefonoId`),
      CONSTRAINT `bancostelefonosUnique` UNIQUE (`bancoId`, `telefonoId`))
		COMMENT = 'Esta tabla registra los telefonos de los bancos';
-- cuentas bancarias
CREATE TABLE IF NOT EXISTS `bcosctas` (
      `bcoctasId` INT NOT NULL AUTO_INCREMENT,
      `bancoId` INT NOT NULL,
      `nrocuenta` VARCHAR(20) NOT NULL,
      `monedaId` INT NOT NULL,
      `sn_activo` enum('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
	  `Idsucursal` INT NULL,
      `empresaId` INT NOT NULL,
      `usuarioCreated`  VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
      PRIMARY KEY(`bcoctasId`),
      CONSTRAINT `bcosctasUnique` UNIQUE (`bancoId`, `nrocuenta`, `Idsucursal`,`empresaId`)
		) COMMENT = 'Esta tabla registra las cuentas bancarias de los bancos';
-- conciliaciones bancarias
CREATE TABLE IF NOT EXISTS `bcosccmae` (
  `bcoconcilacionId` INT NOT NULL AUTO_INCREMENT,
  `fecharegistro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ctabcoId` INT NULL,
  `importe` DECIMAL(20,2) DEFAULT 0.00,
  `sn_conciliado` enum('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
  `Idsucursal` INT NOT NULL,
  `empresaId` INT NOT NULL,
  `usuarioCreated`  VARCHAR(12) NOT NULL,
  `usuarioUpdated` VARCHAR(12) NULL,
  `fechaUpdated` DATETIME NULL,
  PRIMARY KEY (`bcoconcilacionId`),
  CONSTRAINT `bcosconciliacioneUnique` UNIQUE (`fecharegistro`,`ctabcoId`, `empresaId`))
  COMMENT = 'Esta tabla registra la conciliacion de movimientos bancarios';
-- conciliacion bancaria detalle
CREATE TABLE IF NOT EXISTS `bcosccdet` (
  `bcosdetconciliacionId` INT NOT NULL AUTO_INCREMENT,
  `bcoconcilacionId` INT NULL,
  `fecharegistro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecmovbco` DATETIME NULL,
  `nrorefencia` VARCHAR(20) NOT NULL,
  `concepto` VARCHAR(150) NOT NULL,
  `importe` DECIMAL(20,2) DEFAULT 0.00,
  `naturaleza` enum('D','C') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'D',
  `Idsucursal` INT NOT NULL,
  `empresaId` INT NOT NULL,
  `usuarioCreated`  VARCHAR(12) NOT NULL,
  `usuarioUpdated` VARCHAR(12) NULL,
  `fechaUpdated` DATETIME NULL,
  PRIMARY KEY(`bcosdetconciliacionId`))
  COMMENT = 'Esta tabla registra el detalle de la conciliacion bancaria';

 /*  Modulo de planillas */
   CREATE TABLE IF NOT EXISTS `plplempleados` (
      `empleadoId`  INT NOT NULL AUTO_INCREMENT, 
      `fecharegistro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      `nombres` VARCHAR(50) NOT NULL,
      `apellidos` VARCHAR(50) NOT NULL,
      `dni` VARCHAR(20) not NULL,
      `fechanacimiento` DATETIME NULL,
      `sexo` enum('M','F','T') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'M',
      `estadocivil` enum('S','C','V','D','U') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `paisorigen` INT NULL,
      `paisresidencia` INT NULL,
      `nroseguro` VARCHAR(20) NULL,
      `telefono` VARCHAR(20) NOT NULL,
      `celular` VARCHAR(20) NOT NULL,
      `email` VARCHAR(20) NOT NULL,
      `profesionId` INT NULL,
      `puestoId` INT NULL,
      `sueldobruto` DECIMAL(20,2) DEFAULT 0.00,
      `techoseguro` DECIMAL(20,2) DEFAULT 0.00,
      `cuentabancaria` VARCHAR(20) NULL,
      `lugardenacimiento` VARCHAR(200) NULL,
      `foto` LONGBLOB NULL,
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `tipoempId` INT NOT NULL,
	  `Idsucursal` INT NOT NULL,
      `empresaId` INT NOT NULL,
      `usuarioCreated`  VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
      PRIMARY KEY (`empleadoId`),
      CONSTRAINT `plempleadosUnique` UNIQUE (`dni`, `empresaId`))
		COMMENT = 'Esta tabla registra lo plempleados';

CREATE TABLE IF NOT EXISTS `pletitulaciones` (
      `emptitulacionId` INT NOT NULL AUTO_INCREMENT, 
      `empleadoId` INT NOT NULL,
      `descripcion` VARCHAR(50) NOT NULL,
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `empresaId` INT NOT NULL,
      `usuarioCreated`  VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
		PRIMARY KEY (`emptitulacionId`))
		COMMENT = 'Esta tabla registra las titulaciones del empleado';

CREATE TABLE IF NOT EXISTS `pleasistencia` (
      `plempleadosasistenciaId`  INT NOT NULL AUTO_INCREMENT,
      `fecharegistro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      `empleadoId` INT NOT NULL,
      `horaentrada` VARCHAR(20) NULL,
      `horaalmuerzo` VARCHAR(20) NULL,
      `horaretorno` VARCHAR(20) NULL,
      `horarealSalida` VARCHAR(20) NULL,
      `horasalida` VARCHAR(20) NULL,
      `empresaId` INT NOT NULL,
      `usuarioCreated`  VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
      PRIMARY KEY ( `plempleadosasistenciaId`))
		COMMENT = 'Esta tabla registra la asistencia del empleado';

CREATE TABLE IF NOT EXISTS `plecertificaciones` (
      `empcertificacionId` INT NOT NULL AUTO_INCREMENT,
      `empleadoId` INT NULL,
      `descripcion` VARCHAR(50) NULL,
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `empresaId` INT NOT NULL,
      `usuarioCreated`  VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
      PRIMARY KEY (`empcertificacionId`),
      CONSTRAINT `empcertificacionUnique` UNIQUE (`descripcion`,`empresaId`)
		) COMMENT = 'Esta tabla registra las certificacion del empleado';

CREATE TABLE IF NOT EXISTS `plecomisiones` (
      `emplcomId` INT NOT NULL AUTO_INCREMENT,
      `empleadoId` INT NOT NULL,
      `comisionId` INT NOT NULL,
      `tipocomision`  enum('F','P') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'f',
      `sn_quincenal` enum('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `empresaId` INT NOT NULL,
      `usuarioCreated`  VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
      PRIMARY KEY (`emplcomId`),
      CONSTRAINT `empcomisionesUnique` UNIQUE (`empleadoId`, `comisionId`, `empresaId`))
		COMMENT = 'Esta tabla registra los ingresos por empleado';

CREATE TABLE IF NOT EXISTS `plededucciones` (
      `empdeduccionId`  INT NOT NULL AUTO_INCREMENT,
      `empleadoId` INT NOT NULL,
      `deduccionId` INT NOT NULL,
      `tipodeduccion`  enum('F','P') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'f',
      `sn_quincenal` enum('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `porcentaje` DECIMAL(20,2) DEFAULT 0.00,
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `empresaId` INT NOT NULL,
      `usuarioCreated`  VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
      PRIMARY KEY (`empdeduccionId`),
      CONSTRAINT `plededuccionesUniques` UNIQUE (`empleadoId`, `deduccionId`, `empresaId`))
		COMMENT = 'Esta tabla registra las deduccion por plempleados';

CREATE TABLE IF NOT EXISTS `pleplamae` (
      `planillaId` INT NOT NULL AUTO_INCREMENT,
      `fecharegistro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      `periodo` INT NOT NULL,
      `anio` INT NOT NULL,
      `bcoctasId` INT NOT NULL,
      `items` DECIMAL(20,2) DEFAULT 0.00,
      `sn_pagada` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'N',
      `sn_anulada` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'N',
   	  `totalapagar` INT NULL,
      `empresaId` INT NOT NULL,
      `usuarioCreated`  VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
      PRIMARY KEY(`planillaId`),
      INDEX `pleplamaeIndex` (`planillaId` ASC, `anio` ASC, `periodo` ASC) VISIBLE)
	  COMMENT = 'Esta tabla registra la planilla de pago';


CREATE TABLE IF NOT EXISTS `plepladet` (
      `plepladetId` INT NOT NULL AUTO_INCREMENT,
      `planillaId` INT NOT NULL,
      `fecharegistro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 	  `empleadoId` INT NOT NULL,
      `departamentoId` INT NULL,
      `sueldobruto` DECIMAL(20,2) DEFAULT 0.00,
      `importe_dihss` DECIMAL(20,2) DEFAULT 0.00,
      `importe_drap` DECIMAL(20,2) DEFAULT 0.00,
      `importe_drtf` DECIMAL(20,2) DEFAULT 0.00,
      `importe_dotras` DECIMAL(20,2) DEFAULT 0.00,
      `importe_ccomision` DECIMAL(20,2) DEFAULT 0.00,
      `importe_chorasextras`DECIMAL(20,2) DEFAULT 0.00,
      `importe_cbonos` DECIMAL(20,2) DEFAULT 0.00,
      `sueldoneto` DECIMAL(20,2) DEFAULT 0.00,
      `sn_pagar` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `empresaId` INT NOT NULL,
      `usuarioCreated`  VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
 	   PRIMARY KEY (`plepladetId`),
		CONSTRAINT `plepladetUnique` UNIQUE(`planillaId`,`empleadoId`,`empresaId`) )
		COMMENT = 'Esta tabla registra el detalle de la planilla de pago';

-- tplpuestos
CREATE TABLE IF NOT EXISTS `tplpuestos` (
      `puestosId` INT NOT NULL AUTO_INCREMENT,
      `descripcion` VARCHAR(50) NOT NULL,
      `empresaId` INT NOT NULL,
      `usuarioCreated` VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
		PRIMARY KEY (`puestosId`),
		CONSTRAINT `tplpuestosUnique` UNIQUE (`descripcion`,`empresaId`) )
		COMMENT = 'esta tabla registra los estados de gestion';

-- tplprofesiones
CREATE TABLE IF NOT EXISTS `tplprofesiones` (
      `profesionId` INT NOT NULL AUTO_INCREMENT,
      `descripcion` VARCHAR(50) NOT NULL,
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `empresaId` INT NOT NULL,
      `usuarioCreated` VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
		PRIMARY KEY(`profesionId`),
		CONSTRAINT `tprofesionesUnique` UNIQUE (`descripcion`,`empresaId`))
		COMMENT = 'esta tabla registra las profesiones de los plempleados';

-- tplededucciones
CREATE TABLE IF NOT EXISTS `tpldeducciones` (
      `deduccioneId` INT NOT NULL AUTO_INCREMENT,
      `descripcion` VARCHAR(50) NOT NULL,
      `sn_porcentual`  enum('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `sn_obligatoria`  enum('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `porcentaje` DECIMAL(20,2) DEFAULT 0.00,
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
  	  `empresaId` INT NOT NULL,
      `usuarioCreated` VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
		PRIMARY KEY(`deduccioneId`),
		CONSTRAINT `tdeduccionesUnique` UNIQUE (`descripcion`,`empresaId`))
		COMMENT = 'esta tabla registra las deducciones';

-- tplingresos
CREATE TABLE IF NOT EXISTS `tplingresos` (
      `tingresoId` INT NOT NULL AUTO_INCREMENT,
      `descripcion` VARCHAR(50) NOT NULL,
      `sn_porcentual`  enum('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
	  `sn_obligatoria`  enum('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `porcentaje` DECIMAL(20,2) DEFAULT 0.00,
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `empresaId` INT NOT NULL,
      `usuarioCreated` VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
      PRIMARY KEY(`tingresoId`),
      CONSTRAINT `tplingresosUnique` UNIQUE (`descripcion`,`empresaId`))
		COMMENT = 'esta tabla registra los posibles ingresos que genere un empleado por concepto horas extras, bonos y comisiones';


 /* modulo de contabilidad */
 
-- Crear catalogo de cuentas contables
CREATE TABLE IF NOT EXISTS `tcoctacontables` (
      `cuentacontablesId` INT NOT NULL AUTO_INCREMENT,
      `ctacontable` VARCHAR(20) NOT NULL,
      `descripcion` VARCHAR(50) NOT NULL,
      `naturaleza` enum('D','C') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'D',
      `nivel` INT NOT NULL,
      `padre` VARCHAR(12) NULL,
      `sn_operable`  enum('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `tcogrupocontableId` INT NOT NULL,
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `empresaId` INT NOT NULL,
      `Idsucursal` INT NOT NULL,
      `usuarioCreated`  VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
      PRIMARY KEY (`cuentacontablesId`,`ctacontable`),
		CONSTRAINT`coctacontableUnique` UNIQUE (`ctacontable`,`empresaId`) );

-- Crear catalogo de grupos contables
CREATE TABLE IF NOT EXISTS `tcogrupocontable` (
      `tcogrupocontableId` INT NOT NULL AUTO_INCREMENT,
      `descripcion` VARCHAR(50) NOT NULL,
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
  	  `usuarioCreated`  VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
      PRIMARY KEY (`tcogrupocontableId`));

-- Crear definicion de partidas recurrentes mae
CREATE TABLE IF NOT EXISTS `tcoplantillapdamae` (
      `tcoplantillapdamaeId` INT NOT NULL AUTO_INCREMENT,
      `descripcion` VARCHAR(50) NOT NULL,
      `moduloId` INT NOT NULL,
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `empresaId` INT NOT NULL,
      `usuarioCreated`  VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
      PRIMARY KEY (`tcoplantillapdamaeId`),
		CONSTRAINT `definicionesUnique` UNIQUE (`descripcion`, `empresaId`));

-- Crear detalle de difinicion de partidas recurrentes
CREATE TABLE IF NOT EXISTS `tcoplantillapdadet` (
      `tcoplantillapdadetId` INT NOT NULL AUTO_INCREMENT,
      `tcoplantillapdamaeId` INT NOT NULL,
      `nrofila` INT NOT NULL,
      `ctacontable`  VARCHAR(20) NOT NULL,
      `descripcion` VARCHAR(50) NULL,
      `moduloId`  INT NULL,
      `ctamayorId` VARCHAR(50) NULL,
      `naturaleza` enum('D','C') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'D',
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `empresaId` INT NULL,
      `usuarioCreated`  VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
      PRIMARY KEY (`tcoplantillapdadetId`),
      INDEX `tcoplantillapdadetIndex` (`tcoplantillapdamaeId` ASC, `nrofila` ASC) VISIBLE,
		CONSTRAINT `tcoplantillapdadetUnique` UNIQUE (`tcoplantillapdamaeId`,`ctacontable`,`naturaleza`, `empresaId`)
	);

-- crear saldos contables por periodo
CREATE TABLE IF NOT EXISTS `cosaldoscta` (
      `cosaldosctaId` INT NOT NULL AUTO_INCREMENT,
      `anio` INT NULL,
      `ctacontable` VARCHAR(20) NOT NULL,
      `saldoanterior` DECIMAL(20,2) DEFAULT 0.00,
      `enero` DECIMAL(20,2) DEFAULT 0.00,
      `febrero` DECIMAL(20,2) DEFAULT 0.00,
      `marzo` DECIMAL(20,2) DEFAULT 0.00,
      `abril` DECIMAL(20,2) DEFAULT 0.00,
      `mayo` DECIMAL(20,2) DEFAULT 0.00,
      `junio` DECIMAL(20,2) DEFAULT 0.00,
      `julio` DECIMAL(20,2) DEFAULT 0.00,
      `agosto` DECIMAL(20,2) DEFAULT 0.00,
      `septiembre` DECIMAL(20,2) DEFAULT 0.00,
      `octubre` DECIMAL(20,2) DEFAULT 0.00,
      `noviembre` DECIMAL(20,2) DEFAULT 0.00,
      `diciembre` DECIMAL(20,2) DEFAULT 0.00,
      `empresaId` INT NOT NULL,
      `usuarioCreated`  VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
      PRIMARY KEY( `cosaldosctaId`),
      CONSTRAINT `cosaldosctaUnique` UNIQUE (`ctacontable`, `anio`,`empresaId`));

-- crear cierre contables
CREATE TABLE IF NOT EXISTS `cocierrectable` (
      `cierrectableId` INT NOT NULL AUTO_INCREMENT,
      `periodo` INT NULL,
      `anio` INT NULL,
      `fechacierre` DATETIME NOT NULL,
      `observacion` VARCHAR(20) NULL,
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `empresaId` INT NOT NULL,
      `usuarioCreated`  VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
      PRIMARY KEY (`cierrectableId`),
		CONSTRAINT `cocierrectableUnique` UNIQUE(`periodo`,`anio`,`empresaId`) );

-- crear tcoconsultas de liquidez empresarial
CREATE TABLE IF NOT EXISTS `tcorepliquidez` (
      `tcorepliquidezId`  INT NOT NULL AUTO_INCREMENT,
      `descripcion` VARCHAR(50) NULL,
      `objetivo` VARCHAR(100) NULL,
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `empresaId` INT NOT NULL,
      `usuarioCreated`  VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
      PRIMARY KEY (`tcorepliquidezId`));

-- crear factor de cambio factordecambios
CREATE TABLE IF NOT EXISTS `cofactordecambios` (
      `factordecambioId` INT NOT NULL,
      `fecharegistro`DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      `preciocompra` DECIMAL(20,2) DEFAULT 0.00,
      `precioventa` DECIMAL(20,2) DEFAULT 0.00,
      `tipomoneda`ENUM('D','E','Y') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'D',
	  `empresaId` INT NOT NULL,
      `usuarioCreated`  VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
      PRIMARY KEY (`factordecambioId`));

-- crear definicion de balances financieros manuales
CREATE TABLE IF NOT EXISTS `tcoplantillabalancesmae` (
      `cocdefbalmaId`  INT NOT NULL AUTO_INCREMENT,
      `descripcion` VARCHAR(50) NOT NULL,
	  `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `empresaId` INT NOT NULL,
      `usuarioCreated`  VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
      PRIMARY KEY(`cocdefbalmaId`),
      CONSTRAINT `tcoplantillabalancesmaeUnique`  UNIQUE (`descripcion`,`empresaId`)
		);

-- crear detalle de balances financieros manuales
CREATE TABLE IF NOT EXISTS `tcoplantillabalancesdet` (
      `tcoplantillabalancesdetid`  INT NOT NULL AUTO_INCREMENT,
      `cocdefbalmaId` INT NOT NULL,
      `tipo` VARCHAR(1) NULL,
      `ctacontable` VARCHAR(20) NULL,
      `descripcion` VARCHAR(50) NULL,
      `columna` INT NULL,
      `renglon` INT NULL,
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `empresaId` INT NULL,
      `usuarioCreated`  VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
       PRIMARY KEY(`tcoplantillabalancesdetid`),
      INDEX `ORDEN` (`columna` ASC, `renglon` ASC, `ctacontable` ASC) VISIBLE);

-- tabla para parametriar reportes financieros
CREATE TABLE IF NOT EXISTS `tcorepdiarios` (
      `tcorepdiariosId` INT NOT NULL AUTO_INCREMENT, 
      `descripcion` VARCHAR(50) NOT NULL,
      `reporte` VARCHAR(50) NOT NULL,
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `empresaId` INT NULL,
      `usuarioCreated`  VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
      PRIMARY KEY (`tcorepdiariosId`));
 
-- tabla para generar el balance comparativo
CREATE TABLE IF NOT EXISTS `tcorepbalances` (
      `balcomId` INT NOT NULL AUTO_INCREMENT, 
      `ctacontable` VARCHAR(20) NULL,
      `periodoA` INT NOT NULL,
      `anioA` INT NOT NULL,
      `saldoA` DECIMAL(20,2) DEFAULT 0.00,
      `periodoB` INT NOT NULL,
      `anioB` INT NOT NULL,
      `saldoB` DECIMAL(20,2) DEFAULT 0.00,
      `empresaId` INT NULL,
      `usuarioCreated`  VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
      PRIMARY KEY (`balcomId`),
      CONSTRAINT `contabalcom` UNIQUE (`ctacontable`,`empresaId`));
  
-- crear periodos contables
CREATE TABLE IF NOT EXISTS `coperiodoctable` (
      `periodoscontableId` INT NOT NULL AUTO_INCREMENT,
      `nroanio` INT NOT NULL,
      `nromes`  INT NOT NULL,
      `sn_abierto` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `empresaId` INT NOT NULL,
      `usuarioCreated`  VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
      PRIMARY KEY (periodoscontableId),
		CONSTRAINT `coperiodoctableUnique` UNIQUE (`nroanio`,`nromes`)
 );

-- crear asientos contables
CREATE TABLE IF NOT EXISTS `copdamae` (
  `copdamaeId` INT NOT NULL AUTO_INCREMENT,
  `fecharegistro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `periodo` INT NOT NULL,
  `anio` INT NOT NULL,
  `moduloId` INT NOT NULL,
  `documentoId` INT NOT NULL,
  `fechadocumento` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `factordecambio` DECIMAL(20,2) DEFAULT 0.00,
  `nroreferencia` VARCHAR(70) NOT NULL,
  `descripcion` VARCHAR(70) NOT NULL,
  `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
  `nropartida` INT NOT NULL,
  `Idsucursal` INT NOT NULL,
  `empresaId` INT NOT NULL,
  `usuarioCreated`  VARCHAR(12) NOT NULL,
  `usuarioUpdated` VARCHAR(12) NULL,
   `fechaUpdated` DATETIME NULL,
   PRIMARY KEY(`copdamaeId`),
	CONSTRAINT `copdamaeUnique`UNIQUE (`anio`,`moduloId`,`documentoId`, `nroreferencia`, `Idsucursal`,`empresaId`));

-- crear detalle de asientos contables
CREATE TABLE IF NOT EXISTS `copdadet` (
  `copdadetId` INT NOT NULL AUTO_INCREMENT,
  `copdamaeId` INT NOT NULL,
  `fecharegistro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `periodo` INT NULL,
  `anio` INT NULL,
  `nropartida` INT NULL,
  `moduloId`  INT NOT NULL,
  `nrofila` INT NULL,
  `ctacontable` VARCHAR(20) NULL,
  `descripcion` VARCHAR(70) NULL,
  `debito` DECIMAL(20,2) DEFAULT 0.00,
  `credito` DECIMAL(20,2) DEFAULT 0.00,
  `factordecambio` DECIMAL(20,2) DEFAULT 0.00,
  `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
  `Idsucursal` INT NOT NULL,
  `empresaId` INT NOT NULL,
  `usuarioCreated`  VARCHAR(12) NOT NULL,
  `usuarioUpdated` VARCHAR(12) NULL,
  `fechaUpdated` DATETIME NULL,
  PRIMARY KEY(`copdadetId`),
  CONSTRAINT `copdadetUnique` UNIQUE (`fecharegistro`, `nropartida`, `periodo`, `anio`, `moduloId`, `nrofila`, `ctacontable`, `empresaId`)
  );


-- crear movimientos contables
CREATE TABLE IF NOT EXISTS `comovcta` (
  `movctascontablesId` INT NOT NULL AUTO_INCREMENT,
  `monedaId`  INT NOT NULL,
  `ctacontable` VARCHAR(20) NOT NULL,
  `anio` INT NOT NULL,
  `periodo` INT NOT NULL,
  `sacum` DECIMAL(20,2) DEFAULT 0.00,
  `debe` DECIMAL(20,2) DEFAULT 0.00,
  `haber` DECIMAL(20,2) DEFAULT 0.00,
  `saldo` DECIMAL(20,2) DEFAULT 0.00,
  `fecultmov` DATETIME NULL,
  `ultnropda` INT NULL,
  `empresaId` INT NOT NULL,
  `usuarioCreated`  VARCHAR(12) NOT NULL,
  `usuarioUpdated` VARCHAR(12) NULL,
  `fechaUpdated` DATETIME NULL,
  PRIMARY KEY (`movctascontablesId`),
  CONSTRAINT `movctascontableUnique` UNIQUE (`ctacontable`, `periodo`, `anio`, `empresaId`))
  COMMENT = 'comovcta, contiene los movimientos contables por cuenta y periodo';

-- tnivlcta
CREATE TABLE IF NOT EXISTS `tconivelcta` (
      `nivelcontableId` INT NOT NULL AUTO_INCREMENT,
      `nivel` ENUM('1','2','3','4','5','6','7','8') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT '1',
      `sn_diario`  enum('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
   	  `empresaId` INT NOT NULL,
      `usuarioCreated` VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
      PRIMARY KEY (`nivelcontableId`))
		COMMENT = 'tnivelcta, se usuara para asignar un nivel de mayor a la cuenta contables';
-- tnaturalezacta
CREATE TABLE IF NOT EXISTS `tconaturalezacta` (
      `naturalezaCtaId` INT NOT NULL AUTO_INCREMENT,
      `descripcion` enum('D','C') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'D',
      `empresaId` INT NOT NULL,
      `usuarioCreated` VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
       PRIMARY KEY (`naturalezaCtaId`),
		 CONSTRAINT `tconaturalezactaUnique` UNIQUE (`descripcion`) )
		 COMMENT = 'esta tabla se usuara para asignarle una naturaleza contable a una cuenta contable';

-- tcoImpuestovecional contabilidad
CREATE TABLE IF NOT EXISTS `tcoimpuestovecinal` (
      `impvecinalId` INT NOT NULL AUTO_INCREMENT,
      `descripcion` VARCHAR(50) NULL,
      `del` DECIMAL(20,2) DEFAULT 0.00,
      `al` DECIMAL(20,2) DEFAULT 0.00,
      `importe` DECIMAL(20,2) DEFAULT 0.00,
	  `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `empresaId` INT NOT NULL,
      `usuarioCreated` VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
		PRIMARY KEY (`impvecinalId`),
		CONSTRAINT `tcoimpuestovecinalUnique` UNIQUE (`descripcion`, `empresaId`))
		COMMENT = 'registra los impuestos vecinales';

-- tcotipodocumentofiscal
CREATE TABLE IF NOT EXISTS `tcotipodocumentofiscal` (
      `tipodocumentofiscalId` INT NOT NULL AUTO_INCREMENT,
      `descripcion` VARCHAR(50) NOT NULL,
      `abreviatura` VARCHAR(10) NOT NULL,
      `naturaleza`enum('D','C') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'D',
      `cuentacontableId` INT NOT NULL,
      `nrocorrelativo` INT NOT NULL,
	  `sn_activo` ENUM('S','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'S',
      `empresaId` INT NOT NULL,
      `usuarioCreated` VARCHAR(12) NOT NULL,
      `usuarioUpdated` VARCHAR(12) NULL,
      `fechaUpdated` DATETIME NULL,
		 PRIMARY KEY(`tipodocumentofiscalId`),
		 CONSTRAINT `tipodocumentofiscalUnique` UNIQUE (`descripcion`,`empresaId`) )
		 COMMENT = 'esta tabla registra los tipo de documentos fiscales';

/* Tablas de parametros y sistemas */

-- integridad modulo tempresas core comercial

ALTER TABLE `tempresas` ADD CONSTRAINT fk_create_tempresas_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tempresas` ADD CONSTRAINT fk_update_tempresas_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `tempresasdet` ADD CONSTRAINT fk_tempresasdet_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tempresasdet` ADD CONSTRAINT fk_create_tempresasdet_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tempresasdet` ADD CONSTRAINT fk_update_tempresasdet_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;


ALTER TABLE `tsucursal` ADD CONSTRAINT fk_tsucursal_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tsucursal` ADD CONSTRAINT fk_create_tsucursal_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tsucursal` ADD CONSTRAINT fk_update_tsucursal_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;



ALTER TABLE `tmodulos` ADD CONSTRAINT fk_create_tmodulos_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tmodulos` ADD CONSTRAINT fk_update_tmodulos_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

/* -------------------------------------- MODULO DE USUARIOS       -------------------------------------------------*/

ALTER TABLE `tusuarios` ADD CONSTRAINT fk_tusuarios_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tusuarios` ADD CONSTRAINT fk_tusuarios_tsucursal FOREIGN KEY (`Idsucursal`) REFERENCES `tsucursal`(`Idsucursal`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- fk-tusuariosmodule
ALTER TABLE `tusuariosmodule` ADD CONSTRAINT fk_tusuariosmodule_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tusuariosmodule` ADD CONSTRAINT fk_tusuariosmodule_usuario FOREIGN KEY (`usuario`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tusuariosmodule` ADD CONSTRAINT fk_tusuariosmodule_tmodulos FOREIGN KEY (`moduloId`) REFERENCES `tmodulos`(`moduloId`) ON DELETE RESTRICT ON UPDATE CASCADE;		
-- fk-tusuariomnuitem
ALTER TABLE `tusuariomnuitem` ADD CONSTRAINT fk_tusuariomnuitem_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tusuariomnuitem` ADD CONSTRAINT fk_tusuariomnuitem_usuario FOREIGN KEY (`usuario`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tusuariomnuitem` ADD CONSTRAINT fk_tusuariomnuitem_tmodulos FOREIGN KEY (`moduloId`) REFERENCES `tmodulos`(`moduloId`) ON DELETE RESTRICT ON UPDATE CASCADE;		
-- fk-usuariomodauth
ALTER TABLE `usuariomodauth` ADD CONSTRAINT fk_usuariomodauth_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `usuariomodauth` ADD CONSTRAINT fk_usuariomodauth_usuario FOREIGN KEY (`usuario`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-ttusuariosaudit
ALTER TABLE `ttusuariosaudit` ADD CONSTRAINT fk_ttusuariosaudit_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ttusuariosaudit` ADD CONSTRAINT fk_ttusuariosaudit_usuario FOREIGN KEY (`usuario`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ttusuariosaudit` ADD CONSTRAINT fk_ttusuariosaudit_tmodulos FOREIGN KEY (`moduloId`) REFERENCES `tmodulos`(`moduloId`) ON DELETE RESTRICT ON UPDATE CASCADE;		
-- fk-ttipodeptoempresa
ALTER TABLE `tusuarioipaddress` ADD CONSTRAINT fk_create_securityipaddress_usuario FOREIGN KEY (`usuario`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tusuarioipaddress` ADD CONSTRAINT fk_update_securityipaddress_usuario FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tusuarioipaddress` ADD CONSTRAINT fk_securityipaddress_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-tusuariosscripts
ALTER TABLE `tusuariosscripts` ADD CONSTRAINT fk_tusuariosscripts_usuario FOREIGN KEY (`usuario`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;		
ALTER TABLE `tusuariosscripts` ADD CONSTRAINT fk_tusuariosscripts_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tusuariosscripts` ADD CONSTRAINT fk_create_tusuariosscripts_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tusuariosscripts` ADD CONSTRAINT fk_update_tusuariosscripts_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

/* ---------------------------------------- TTIPOS CATALOGOS RERENCIALES   -------------------------------------------------*/
-- fk-ttipodeptoempresa
ALTER TABLE `ttipodeptoempresa` ADD CONSTRAINT fk_ttipodeptoempresa_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ttipodeptoempresa` ADD CONSTRAINT fk_create_ttipodeptoempresa_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ttipodeptoempresa` ADD CONSTRAINT fk_update_ttipodeptoempresa_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-ttipodeptopais
ALTER TABLE `ttipodeptopais` ADD CONSTRAINT fk_ttipodeptopais_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ttipodeptopais` ADD CONSTRAINT fk_create_ttipodeptopais_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ttipodeptopais` ADD CONSTRAINT fk_update_ttipodeptopais_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-ttipodirecciones
ALTER TABLE `ttipodirecciones` ADD CONSTRAINT fk_ttipodirecciones_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ttipodirecciones` ADD CONSTRAINT fk_create_ttipodirecciones_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ttipodirecciones` ADD CONSTRAINT fk_update_ttipodirecciones_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-ttipoestado
ALTER TABLE `ttipoestado` ADD CONSTRAINT fk_ttipoestado_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ttipoestado` ADD CONSTRAINT fk_create_ttipoestado_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ttipoestado` ADD CONSTRAINT fk_update_ttipoestado_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-ttipoformapago
ALTER TABLE `ttipoformapago` ADD CONSTRAINT fk_ttipoformapago_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ttipoformapago` ADD CONSTRAINT fk_create_ttipoformapago_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ttipoformapago` ADD CONSTRAINT fk_update_ttipoformapago_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-ttipogestores
ALTER TABLE `ttipogestores` ADD CONSTRAINT fk_ttipogestores_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ttipogestores` ADD CONSTRAINT fk_create_ttipogestores_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ttipogestores` ADD CONSTRAINT fk_update_ttipogestores_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ttipogestores` ADD CONSTRAINT fk_ttipogestores_tmodulos FOREIGN KEY (`moduloId`) REFERENCES `tmodulos`(`moduloId`) ON DELETE RESTRICT ON UPDATE CASCADE;		
ALTER TABLE `ttipogestores` ADD CONSTRAINT fk_ttipogestores_plplempleados FOREIGN KEY (`empleadoId`) REFERENCES `plplempleados`(`empleadoId`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-ttipoimpuestos
ALTER TABLE `ttipoimpuestos` ADD CONSTRAINT fk_ttipoimpuestos_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ttipoimpuestos` ADD CONSTRAINT fk_ttipoimpuestos_tmodulos FOREIGN KEY (`moduloId`) REFERENCES `tmodulos`(`moduloId`) ON DELETE RESTRICT ON UPDATE CASCADE;		
ALTER TABLE `ttipoimpuestos` ADD CONSTRAINT fk_create_ttipoimpuestos_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ttipoimpuestos` ADD CONSTRAINT fk_update_ttipoimpuestos_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-ttipomonedas
ALTER TABLE `ttipomonedas` ADD CONSTRAINT fk_ttipomonedas_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ttipomonedas` ADD CONSTRAINT fk_create_ttipomonedas_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ttipomonedas` ADD CONSTRAINT fk_update_ttipomonedas_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-ttipopais
ALTER TABLE `ttipopais` ADD CONSTRAINT fk_create_ttipopais_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ttipopais` ADD CONSTRAINT fk_update_ttipopais_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-ttipoparambco
ALTER TABLE `ttipoparambco` ADD CONSTRAINT fk_ttipoparambco_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ttipoparambco` ADD CONSTRAINT fk_create_ttipoparambco_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ttipoparambco` ADD CONSTRAINT fk_update_ttipoparambco_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-ttipodeptopais
ALTER TABLE `ttipoparamcon` ADD CONSTRAINT fk_ttipoparamcon_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ttipoparamcon` ADD CONSTRAINT fk_create_ttipoparamcon_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ttipoparamcon` ADD CONSTRAINT fk_update_ttipoparamcon_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-ttipoparamcxc
ALTER TABLE `ttipoparamcxc` ADD CONSTRAINT fk_ttipoparamcxc_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ttipoparamcxc` ADD CONSTRAINT fk_create_ttipoparamcxc_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ttipoparamcxc` ADD CONSTRAINT fk_update_ttipoparamcxc_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-ttipoparamcxp
ALTER TABLE `ttipoparamcxp` ADD CONSTRAINT fk_ttipoparamcxp_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ttipoparamcxp` ADD CONSTRAINT fk_create_ttipoparamcxp_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ttipoparamcxp` ADD CONSTRAINT fk_update_ttipoparamcxp_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-ttipoparampap
ALTER TABLE `ttipoparampap` ADD CONSTRAINT fk_ttipoparampap_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ttipoparampap` ADD CONSTRAINT fk_create_ttipoparampap_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ttipoparampap` ADD CONSTRAINT fk_update_ttipoparampap_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-ttipoparamfac
ALTER TABLE `ttipoparamfac` ADD CONSTRAINT fk_ttipoparamfac_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ttipoparamfac` ADD CONSTRAINT fk_create_ttipoparamfac_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ttipoparamfac` ADD CONSTRAINT fk_update_ttipoparamfac_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-ttipoparaminv
ALTER TABLE `ttipoparaminv` ADD CONSTRAINT fk_ttipoparaminv_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ttipoparaminv` ADD CONSTRAINT fk_create_ttipoparaminv_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ttipoparaminv` ADD CONSTRAINT fk_update_ttipoparaminv_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-ttipoparampla
ALTER TABLE `ttipoparampla` ADD CONSTRAINT fk_ttipoparampla_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ttipoparampla` ADD CONSTRAINT fk_create_ttipoparampla_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ttipoparampla` ADD CONSTRAINT fk_update_ttipoparampla_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-ttipoparampres
ALTER TABLE `ttipoparampres` ADD CONSTRAINT fk_ttipoparampres_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ttipoparampres` ADD CONSTRAINT fk_create_ttipoparampres_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ttipoparampres` ADD CONSTRAINT fk_update_ttipoparampres_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-ttipotarjetacredito
ALTER TABLE `ttipotarjetacredito` ADD CONSTRAINT fk_ttipotarjetacredito_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ttipotarjetacredito` ADD CONSTRAINT fk_create_ttipotarjetacredito_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ttipotarjetacredito` ADD CONSTRAINT fk_update_ttipotarjetacredito_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-ttipotelefono
ALTER TABLE `ttipotelefono` ADD CONSTRAINT fk_ttipotelefono_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ttipotelefono` ADD CONSTRAINT fk_create_ttipotelefono_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ttipotelefono` ADD CONSTRAINT fk_update_ttipotelefono_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-ttipozonas
ALTER TABLE `ttipozonas` ADD CONSTRAINT fk_ttipozonas_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ttipozonas` ADD CONSTRAINT fk_create_ttipozonas_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ttipozonas` ADD CONSTRAINT fk_update_ttipozonas_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-ttipozonasvtacob
ALTER TABLE `ttipozonasvtacob` ADD CONSTRAINT fk_ttipozonasvtacob_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ttipozonasvtacob` ADD CONSTRAINT fk_create_ttipozonasvtacob_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ttipozonasvtacob` ADD CONSTRAINT fk_update_ttipozonasvtacob_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-tipopasatiempos
ALTER TABLE `ttipopasatiempos` ADD CONSTRAINT fk_create_ttipopasatiempos_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ttipopasatiempos` ADD CONSTRAINT fk_update_ttipopasatiempos_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-ttipoproforma
ALTER TABLE `ttipoproforma` ADD CONSTRAINT fk_create_ttipoproforma_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ttipoproforma` ADD CONSTRAINT fk_update_ttipoproforma_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;


/* ------------------------------------- MODULO DE INVENTARIOS        -------------------------------------------------*/
-- fk-invexistencias
ALTER TABLE `invexistencias` ADD CONSTRAINT fk_invexistencias_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `invexistencias` ADD CONSTRAINT fk_create_invexistencias_usuario FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `invexistencias` ADD CONSTRAINT fk_update_invexistencias_usuario FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `invexistencias` ADD CONSTRAINT fk_invexistencias_tbodegas FOREIGN KEY (`bodegaId`) REFERENCES `tinvbodegas`(`bodegaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `invexistencias` ADD CONSTRAINT fk_invexistencias_productos FOREIGN KEY (`productoId`) REFERENCES `producto`(`productoId`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-invfisdet
ALTER TABLE `invfisdet` ADD CONSTRAINT fk_invfisdet_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `invfisdet` ADD CONSTRAINT fk_create_invfisdet_usuario FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `invfisdet` ADD CONSTRAINT fk_update_invfisdet_usuario FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `invfisdet` ADD CONSTRAINT fk_invfisdet_tbodegas FOREIGN KEY (`bodegaId`) REFERENCES `tinvbodegas`(`bodegaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `invfisdet` ADD CONSTRAINT fk_invfisdet_invfismae FOREIGN KEY (`invfisId`) REFERENCES `invfismae`(`invfisId`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-invfismae
ALTER TABLE `invfismae` ADD CONSTRAINT fk_invfismae_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `invfismae` ADD CONSTRAINT fk_create_invfismae_usuario FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `invfismae` ADD CONSTRAINT fk_update_invfismae_usuario FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `invfismae` ADD CONSTRAINT fk_invfismae_tbodegas FOREIGN KEY (`bodegaId`) REFERENCES `tinvbodegas`(`bodegaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-invkardex
ALTER TABLE `invkardex` ADD CONSTRAINT fk_invkardex_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `invkardex` ADD CONSTRAINT fk_create_invkardex_usuario FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `invkardex` ADD CONSTRAINT fk_update_invkardex_usuario FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `invkardex` ADD CONSTRAINT fk_invkardex_tbodega FOREIGN KEY (`bodegaId`) REFERENCES `tinvbodegas`(`bodegaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `invkardex` ADD CONSTRAINT fk_invkardex_productos FOREIGN KEY (`productoId`) REFERENCES `producto`(`productoId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `invkardex` ADD CONSTRAINT fk_invkardex_tmodulos FOREIGN KEY (`moduloId`) REFERENCES `tmodulos`(`moduloId`) ON DELETE RESTRICT ON UPDATE CASCADE;		
-- fk-invmovdet
ALTER TABLE `invmovdet` ADD CONSTRAINT fk_invmovdet_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `invmovdet` ADD CONSTRAINT fk_create_invmovdet_usuario FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `invmovdet` ADD CONSTRAINT fk_update_invmovdet_usuario FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `invmovdet` ADD CONSTRAINT fk_invmovdet_tbodegas FOREIGN KEY (`bodegaId`) REFERENCES `tinvbodegas`(`bodegaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `invmovdet` ADD CONSTRAINT fk_invmovdet_productos FOREIGN KEY (`productoId`) REFERENCES `producto`(`productoId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `invmovdet` ADD CONSTRAINT fk_invmovdet_invmovemae FOREIGN KEY (`invmovmaeid`) REFERENCES `invmovmae`(`invmovmaeid`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-invmovmae
ALTER TABLE `invmovmae` ADD CONSTRAINT fk_invmovmae_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `invmovmae` ADD CONSTRAINT fk_create_invmovmae_usuario FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `invmovmae` ADD CONSTRAINT fk_update_invmovmae_usuario FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `invmovmae` ADD CONSTRAINT fk_invmovmae_tbodega FOREIGN KEY (`bodegaId`) REFERENCES `tinvbodegas`(`bodegaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-invreconinv
ALTER TABLE `invreconinv` ADD CONSTRAINT fk_invreconinv_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `invreconinv` ADD CONSTRAINT fk_create_invreconinv_usuario FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `invreconinv` ADD CONSTRAINT fk_update_invreconinv_usuario FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `invreconinv` ADD CONSTRAINT fk_invreconinv_productos FOREIGN KEY (`productoId`) REFERENCES `producto`(`productoId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `invreconinv` ADD CONSTRAINT fk_invreconinv_tbodegas FOREIGN KEY (`bodegaId`) REFERENCES `tinvbodegas`(`bodegaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-invreqdet
ALTER TABLE `invreqdet` ADD CONSTRAINT fk_invreqdet_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `invreqdet` ADD CONSTRAINT fk_create_invreqdet_usuario FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `invreqdet` ADD CONSTRAINT fk_update_invreqdet_usuario FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `invreqdet` ADD CONSTRAINT fk_invreqdet_invreqmae FOREIGN KEY (`requisionId`) REFERENCES `invreqmae`(`requisionId`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-invreqmae
ALTER TABLE `invreqmae` ADD CONSTRAINT fk_invreqmae_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `invreqmae` ADD CONSTRAINT fk_create_invreqmae_usuario FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `invreqmae` ADD CONSTRAINT fk_update_invreqmae_usuario FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-invtrasdet
ALTER TABLE `invtrasdet` ADD CONSTRAINT fk_invtrasdet_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `invtrasdet` ADD CONSTRAINT fk_create_invtrasdet_usuario FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `invtrasdet` ADD CONSTRAINT fk_update_invtrasdet_usuario FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `invtrasdet` ADD CONSTRAINT fk_invtrasdet1_tbodegas FOREIGN KEY (`bodegaOrigen`) REFERENCES `tinvbodegas`(`bodegaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `invtrasdet` ADD CONSTRAINT fk_invtrasdet1_productos FOREIGN KEY (`bodegaOrigen`) REFERENCES `producto`(`productoId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `invtrasdet` ADD CONSTRAINT fk_invtrasdet2_productos FOREIGN KEY (`bodegaDestino`) REFERENCES `producto`(`productoId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `invtrasdet` ADD CONSTRAINT fk_invtrasdet2_tbodegas FOREIGN KEY (`bodegaDestino`) REFERENCES `tinvbodegas`(`bodegaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `invtrasdet` ADD CONSTRAINT fk_invtrasdet_invtrasmae FOREIGN KEY (`trasladoId`) REFERENCES `invtrasmae`(`trasladoId`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-invtrasmae
ALTER TABLE `invtrasmae` ADD CONSTRAINT fk_invtrasmae_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `invtrasmae` ADD CONSTRAINT fk_create_invtrasmae_usuario FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `invtrasmae` ADD CONSTRAINT fk_update_invtrasmae_usuario FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `invtrasmae` ADD CONSTRAINT fk_invtrasmae1_tbodegas FOREIGN KEY (`bodegaOrigen`) REFERENCES `tinvbodegas`(`bodegaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `invtrasmae` ADD CONSTRAINT fk_invtrasmae2_tbodegas FOREIGN KEY (`bodegaDestino`) REFERENCES `tinvbodegas`(`bodegaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-productos
ALTER TABLE `productos` ADD CONSTRAINT fk_productos_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `productos` ADD CONSTRAINT fk_create_productos_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `productos` ADD CONSTRAINT fk_update_productos_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `productos` ADD CONSTRAINT fk_productos_tinvcategoria FOREIGN KEY (`categoriaId`) REFERENCES `tinvcategoria`(`categoriaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-productosdets
ALTER TABLE `productosdet` ADD CONSTRAINT fk_productosdets_productos FOREIGN KEY (`produtoId`) REFERENCES `productos`(`produtoId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `productosdet` ADD CONSTRAINT fk_productosdets_empresa  FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `productosdet` ADD CONSTRAINT fk_create_productosdets_usuario  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `productosdet` ADD CONSTRAINT fk_update_productosdets_usuario  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-productoscodbarras
ALTER TABLE `productocodbarras` ADD CONSTRAINT fk_productocodbarras_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `productocodbarras` ADD CONSTRAINT fk_create_productocodbarras_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `productocodbarras` ADD CONSTRAINT fk_update_productocodbarras_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-productoimg
ALTER TABLE `productoimg` ADD CONSTRAINT fk_productoimg_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `productoimg` ADD CONSTRAINT fk_create_productoimg_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `productoimg` ADD CONSTRAINT fk_update_productoimg_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-proveedor
ALTER TABLE `proveedor` ADD CONSTRAINT fk_proveedor_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `proveedor` ADD CONSTRAINT fk_create_proveedor_tusuarios FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `proveedor` ADD CONSTRAINT fk_update_proveedor_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-proveedordir
ALTER TABLE `proveedordir` ADD CONSTRAINT fk_proveedordir_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `proveedordir` ADD CONSTRAINT fk_create_proveedordir_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `proveedordir` ADD CONSTRAINT fk_update_proveedordir_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `proveedordir` ADD CONSTRAINT fk_proveedordir_proveedor FOREIGN KEY (`proveedorId`) REFERENCES `proveedor`(`proveedorId`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-proveedortel
ALTER TABLE `proveedortel` ADD CONSTRAINT fk_proveedortel_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `proveedortel` ADD CONSTRAINT fk_create_proveedortel_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `proveedortel` ADD CONSTRAINT fk_update_proveedortel_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `proveedortel` ADD CONSTRAINT fk_proveedortel_proveedor FOREIGN KEY (`proveedorId`) REFERENCES `proveedor`(`proveedorId`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-tinvbodegas
ALTER TABLE `tinvbodegas` ADD CONSTRAINT fk_tinvbodegas_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tinvbodegas` ADD CONSTRAINT fk_create_tinvbodegas_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tinvbodegas` ADD CONSTRAINT fk_update_tinvbodegas_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-tinvembalajes
ALTER TABLE `tinvembalajes` ADD CONSTRAINT fk_tinvembalajes_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tinvembalajes` ADD CONSTRAINT fk_create_tinvembalajes_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tinvembalajes` ADD CONSTRAINT fk_update_tinvembalajes_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-tinvcasas
ALTER TABLE `tinvcasas` ADD CONSTRAINT fk_tinvcasas_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tinvcasas` ADD CONSTRAINT fk_create_tinvcasas_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tinvcasas` ADD CONSTRAINT fk_update_tinvcasas_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-tinvestantes
ALTER TABLE `tinvestantes` ADD CONSTRAINT fk_tinvestantes_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tinvestantes` ADD CONSTRAINT fk_create_tinvestantes_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tinvestantes` ADD CONSTRAINT fk_update_tinvestantes_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-tinvmarcas
ALTER TABLE `tinvmarcas` ADD CONSTRAINT fk_tinvmarcas_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tinvmarcas` ADD CONSTRAINT fk_update_tmarcas_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tinvmarcas` ADD CONSTRAINT fk_create_tinvmarcas_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-tinvpasillos
ALTER TABLE `tinvpasillos` ADD CONSTRAINT fk_tinvpasillos_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tinvpasillos` ADD CONSTRAINT fk_create_tinvpasillos_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tinvpasillos` ADD CONSTRAINT fk_update_tinvpasillos_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-tinvunidadmedida
ALTER TABLE `tinvunidadmedida` ADD CONSTRAINT fk_tinvunidadmedida_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tinvunidadmedida` ADD CONSTRAINT fk_create_tinvunidadmedida_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tinvunidadmedida` ADD CONSTRAINT fk_update_tinvunidadmedida_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-tinvubicaciones
ALTER TABLE `tinvubicaciones` ADD CONSTRAINT fk_tinvubicaciones_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tinvubicaciones` ADD CONSTRAINT fk_create_tinvubicaciones_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tinvubicaciones` ADD CONSTRAINT fk_update_tinvubicaciones_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-tinvmodelos
ALTER TABLE `tinvmodelos` ADD CONSTRAINT fk_tinvmodelos_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tinvmodelos` ADD CONSTRAINT fk_create_tinvmodelo_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tinvmodelos` ADD CONSTRAINT fk_update_tinvmodelos_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

/* ---------------------------------------- MODULO DE VENTAS ----------------------------------------------------*/
-- fk-poscorrelativos
ALTER TABLE `poscorrelativos` ADD CONSTRAINT fk_create_poscorrelativos_usuario FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `poscorrelativos` ADD CONSTRAINT fk_update_poscorrelativos_usuario FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-posfacdet (detalle de facturas)
ALTER TABLE `posfacdet` ADD CONSTRAINT fk_posfacdet_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `posfacdet` ADD CONSTRAINT fk_create_posfacdet_usuario FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `posfacdet` ADD CONSTRAINT fk_update_posfacdet_usuario FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `posfacdet` ADD CONSTRAINT fk_posfacdet_tbodegas FOREIGN KEY (`bodegaId`) REFERENCES `tinvbodegas`(`bodegaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `posfacdet` ADD CONSTRAINT fk_posfacdet_productos FOREIGN KEY (`productoId`) REFERENCES `producto`(`productoId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `posfacdet` ADD CONSTRAINT fk_posfacdet_posfacmae FOREIGN KEY (`facturaId`) REFERENCES `posfacmae`(`facturaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-posfacmae (maestro de facturas)
ALTER TABLE `posfacmae` ADD CONSTRAINT fk_posfacmae_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `posfacmae` ADD CONSTRAINT fk_create_posfacmae_usuario FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `posfacmae` ADD CONSTRAINT fk_update_posfacmae_usuario FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `posfacmae` ADD CONSTRAINT fk_posfacmae_tbodegas FOREIGN KEY (`bodegaId`) REFERENCES `tinvbodegas`(`bodegaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `posfacmae` ADD CONSTRAINT fk_posfacmae_cxcclientes FOREIGN KEY (`clienteId`) REFERENCES `cxcclientes`(`clienteId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `posfacmae` ADD CONSTRAINT fk_posfacmae_cxccajeros FOREIGN KEY (`cajaId`) REFERENCES `cxccajeros`(`cajaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `posfacmae` ADD CONSTRAINT fk_posfacmaea_ttipoformapago FOREIGN KEY (`formapagoId`) REFERENCES `ttipoformapago`(`formapagoId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `posfacmae` ADD CONSTRAINT fk_posfacmaea_ttipotarjetacredito FOREIGN KEY (`tarjetacreditoId`) REFERENCES `ttipotarjetacredito`(`tarjetacreditoId`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-posfacdetanul (detalle de anulaciones de factura)
ALTER TABLE `posfacdetanul` ADD CONSTRAINT fk_posfacdetanul_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `posfacdetanul` ADD CONSTRAINT fk_create_posfacdetanul_usuario FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `posfacdetanul` ADD CONSTRAINT fk_update_posfacdetanul_usuario FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `posfacdetanul` ADD CONSTRAINT fk_posfacdetanul_tbodegas FOREIGN KEY (`bodegaId`) REFERENCES `tinvbodegas`(`bodegaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `posfacdetanul` ADD CONSTRAINT fk_posfacdetanul_productos FOREIGN KEY (`productoId`) REFERENCES `producto`(`productoId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `posfacdetanul` ADD CONSTRAINT fk_posfacdetanul_posfacmaeanul FOREIGN KEY (`posfacmaeanulId`) REFERENCES `posfacmaeanul`(`posfacmaeanulId`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-posfacmaeanul (maestro de facturas anuladas)
ALTER TABLE `posfacmaeanul` ADD CONSTRAINT fk_posfacmaeanul_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `posfacmaeanul` ADD CONSTRAINT fk_create_posfacmaeanul_usuario FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `posfacmaeanul` ADD CONSTRAINT fk_update_posfacmaeanul_usuario FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `posfacmaeanul` ADD CONSTRAINT fk_posfacmaeanul_tbodegas FOREIGN KEY (`bodegaId`) REFERENCES `tinvbodegas`(`bodegaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `posfacmaeanul` ADD CONSTRAINT fk_posfacmaeanul_cxcclientes FOREIGN KEY (`clienteId`) REFERENCES `cxcclientes`(`clienteId`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-poscotdet (detalle de cotizaciones de venta)
ALTER TABLE `poscotdet` ADD CONSTRAINT fk_poscotdet_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `poscotdet` ADD CONSTRAINT fk_create_poscotdet_usuario FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `poscotdet` ADD CONSTRAINT fk_update_poscotdet_usuario FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `poscotdet` ADD CONSTRAINT fk_poscotdet_poscotmae FOREIGN KEY (`poscotmaeId`) REFERENCES `poscotmae`(`poscotmaeId`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-poscotmae (maestros de cotizaciones de venta)
ALTER TABLE `poscotmae` ADD CONSTRAINT fk_poscotmae_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `poscotmae` ADD CONSTRAINT fk_create_poscotmae_usuario FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `poscotmae` ADD CONSTRAINT fk_update_poscotmae_usuario FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-pospeddet (detalle de pedidos de venta)
ALTER TABLE `pospeddet` ADD CONSTRAINT fk_pospeddet_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `pospeddet` ADD CONSTRAINT fk_create_pospeddet_usuario FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `pospeddet` ADD CONSTRAINT fk_update_pospeddet_usuario FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `pospeddet` ADD CONSTRAINT fk_pospeddet_pospedmae FOREIGN KEY (`pospedmaeId`) REFERENCES `pospedmae`(`pospedmaeId`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-pospedmae (maestros de pedidos de venta)
ALTER TABLE `pospedmae` ADD CONSTRAINT fk_create_pospedmae_usuario FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `pospedmae` ADD CONSTRAINT fk_pospedmae_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `pospedmae` ADD CONSTRAINT fk_update_pospedmae_usuario FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-poscbodet (detalle de combos de ofertas)
ALTER TABLE `poscbodet` ADD CONSTRAINT fk_poscbodet_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `poscbomae` ADD CONSTRAINT fk_poscbomae_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-tposdescuentos (descuentos de ventas)
ALTER TABLE `tposdescuentos` ADD CONSTRAINT fk_tposdescuentos_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tposdescuentos` ADD CONSTRAINT fk_create_tposdescuentos_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tposdescuentos` ADD CONSTRAINT fk_update_tposdescuentos_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-pospreciovtas (precios de venta sobre los productos)
ALTER TABLE `tpospreciovtas` ADD CONSTRAINT fk_tpospreciovtas_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tpospreciovtas` ADD CONSTRAINT fk_create_tpospreciovtas_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tpospreciovtas` ADD CONSTRAINT fk_update_tpospreciovtas_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

/* ---------------------------------------- MODULO DE CUENTAS X COBRAR ----------------------------------------------------*/
-- fk-cxcclientes
ALTER TABLE `cxcclientes` ADD CONSTRAINT fk_cxcclientes_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cxcclientes` ADD CONSTRAINT fk_create_cxcclientes_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cxcclientes` ADD CONSTRAINT fk_update_cxcclientes_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-cxccclientesdir
ALTER TABLE `cxccclientesdir` ADD CONSTRAINT fk_cxccclientesdir_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cxccclientesdir` ADD CONSTRAINT fk_create_cxccclientesdir_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cxccclientesdir` ADD CONSTRAINT fk_update_cxccclientesdir_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cxccclientesdir` ADD CONSTRAINT fk_cxccclientesdir_cxcclientes FOREIGN KEY (`clienteId`) REFERENCES `cxcclientes`(`clienteId`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-cxccclientesref
ALTER TABLE `cxccclientesref` ADD CONSTRAINT fk_cxccclientesref_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cxccclientesref` ADD CONSTRAINT fk_create_cxccclientesref_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cxccclientesref` ADD CONSTRAINT fk_update_cxccclientesref_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cxccclientesref` ADD CONSTRAINT fk_cxccclientesref_cxcclientes FOREIGN KEY (`clienteId`) REFERENCES `cxcclientes`(`clienteId`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-cxcclientestel
ALTER TABLE `cxcclientestel` ADD CONSTRAINT fk_cxcclientestel_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cxcclientestel` ADD CONSTRAINT fk_update_cxcclientestel_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cxcclientestel` ADD CONSTRAINT fk_create_cxcclientestel_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cxcclientestel` ADD CONSTRAINT fk_cxcclientestel_cxcclientes FOREIGN KEY (`clienteId`) REFERENCES `cxcclientes`(`clienteId`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-cxcmovimientos
ALTER TABLE `cxcmovimientos` ADD CONSTRAINT fk_cxcmovimientos_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cxcmovimientos` ADD CONSTRAINT fk_cxcmovimientos_cxcclientes FOREIGN KEY (`clienteId`) REFERENCES `cxcclientes`(`clienteId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cxcmovimientos` ADD CONSTRAINT fk_cxcmovimientos_tmodulos FOREIGN KEY (`moduloId`) REFERENCES `tmodulos`(`moduloId`) ON DELETE RESTRICT ON UPDATE CASCADE;		
ALTER TABLE `cxcmovimientos` ADD CONSTRAINT fk_cxcmovimientos_tcotipodocumentofiscal FOREIGN KEY (`documentoId`) REFERENCES `tcotipodocumentofiscal`(`tipodocumentofiscalId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cxcmovimientos` ADD CONSTRAINT fk_create_cxcmovimientos_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cxcmovimientos` ADD CONSTRAINT fk_update_cxcmovimientos_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-cxccajeros
ALTER TABLE `cxccajeros` ADD CONSTRAINT fk_cxccajeros_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cxccajeros` ADD CONSTRAINT fk_create_cxccajeros_usuario FOREIGN KEY (`usuario`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cxccajeros` ADD CONSTRAINT fk_update_cxccajeros_usuario FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-cxccajadet
ALTER TABLE `cxccajadet` ADD CONSTRAINT fk_cxccajadet_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cxccajadet` ADD CONSTRAINT fk_cxccajadet_cxccajamae FOREIGN KEY (`cxccajaId`) REFERENCES `cxccajamae`(`cxccajaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cxccajadet` ADD CONSTRAINT fk_update_cxccajadet_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cxccajadet` ADD CONSTRAINT fk_create_cxccajadet_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cxccajadet` ADD CONSTRAINT fk_cxccajadet_ttipoformapago FOREIGN KEY (`formapagoId`) REFERENCES `ttipoformapago`(`formapagoId`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-cxccajamae
ALTER TABLE `cxccajamae` ADD CONSTRAINT fk_cxccajamae_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cxccajamae` ADD CONSTRAINT fk_update_cxccajamae_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cxccajamae` ADD CONSTRAINT fk_create_cxccajamae_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cxccajamae` ADD CONSTRAINT fk_cxccajamae_tmodulos FOREIGN KEY (`moduloId`) REFERENCES `tmodulos`(`moduloId`) ON DELETE RESTRICT ON UPDATE CASCADE;		
ALTER TABLE `cxccajamae` ADD CONSTRAINT fk_cxccaja_tcotipodocumentofiscal FOREIGN KEY (`documentoId`) REFERENCES `tcotipodocumentofiscal`(`tipodocumentofiscalId`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-cxcsalfav
ALTER TABLE `cxcsalfav` ADD CONSTRAINT fk_cxcsalfav_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cxcsalfav` ADD CONSTRAINT fk_create_cxcsalfav_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cxcsalfav` ADD CONSTRAINT fk_update_cxcsalfav_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cxcsalfav` ADD CONSTRAINT fk_cxcsalfav_cxcclientes FOREIGN KEY (`clienteId`) REFERENCES `cxcclientes`(`clienteId`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-cxchisto
ALTER TABLE `cxchisto` ADD CONSTRAINT fk_cxchisto_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cxchisto` ADD CONSTRAINT fk_create_cxchisto_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cxchisto` ADD CONSTRAINT fk_update_cxchisto_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-cxcprestamos
ALTER TABLE `cxcprestamos` ADD CONSTRAINT fk_cxcprestamos_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cxcprestamos` ADD CONSTRAINT fk_create_cxcprestamos_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cxcprestamos` ADD CONSTRAINT fk_cxcprestamos_cxcclientes FOREIGN KEY (`clienteId`) REFERENCES `cxcclientes`(`clienteId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cxcprestamos` ADD CONSTRAINT fk_update_cxcprestamos_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-cxcprestamospp
ALTER TABLE `cxcprestamospp` ADD CONSTRAINT fk_create_cxcprestamospp_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cxcprestamospp` ADD CONSTRAINT fk_cxcprestamospp_cxcclientes FOREIGN KEY (`clienteId`) REFERENCES `cxcclientes`(`clienteId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cxcprestamospp` ADD CONSTRAINT fk_update_cxcprestamospp_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cxcprestamospp` ADD CONSTRAINT fk_cxcprestamospp_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-cxphisto
ALTER TABLE `cxphisto` ADD CONSTRAINT fk_cxphisto_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cxchisto` ADD CONSTRAINT fk_cxcclienteshisto_cxcclientes FOREIGN KEY (`clienteId`) REFERENCES `cxcclientes`(`clienteId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cxphisto` ADD CONSTRAINT fk_create_cxphisto_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cxphisto` ADD CONSTRAINT fk_update_cxphisto_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-cxcparientes
ALTER TABLE `cxcparientes` ADD CONSTRAINT fk_cxcparientes_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cxcparientes` ADD CONSTRAINT fk_cxcparientes_cxcclientes FOREIGN KEY (`clienteId`) REFERENCES `cxcclientes`(`clienteId`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk_tdiascobros
ALTER TABLE `tcctdiascobros` ADD CONSTRAINT fk_tdiascobros_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tcctdiascobros` ADD CONSTRAINT fk_create_tdiascobros_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tcctdiascobros` ADD CONSTRAINT fk_update_tdiascobros_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

/* ----------------------------------- MODULO DE CUENTAS X PAGAR ----------------------------------------------------*/
-- fk-cxpmovimientos
ALTER TABLE `cxpmovimientos` ADD CONSTRAINT fk_cxpmovimientos_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cxpmovimientos` ADD CONSTRAINT fk_create_cxpmovimientos_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cxpmovimientos` ADD CONSTRAINT fk_update_cxpmovimientos_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cxpmovimientos` ADD CONSTRAINT fk_cxpmovimientos_tmodulos FOREIGN KEY (`moduloId`) REFERENCES `tmodulos`(`moduloId`) ON DELETE RESTRICT ON UPDATE CASCADE;		
ALTER TABLE `cxpmovimientos` ADD CONSTRAINT fk_cxpmovimientos_tcotipodocumentofiscal FOREIGN KEY (`documentoId`) REFERENCES `tcotipodocumentofiscal`(`tipodocumentofiscalId`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-cxpsalfav
ALTER TABLE `cxpsalfav` ADD CONSTRAINT fk_cxpsalfav_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cxpsalfav` ADD CONSTRAINT fk_create_cxpsalfav_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cxpsalfav` ADD CONSTRAINT fk_update_cxpsalfav_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- fk-cxpcomprasdet
ALTER TABLE `cxpcomprasdet` ADD CONSTRAINT fk_cxpcomprasdet_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cxpcomprasdet` ADD CONSTRAINT fk_create_cxpcomprasdet_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cxpcomprasdet` ADD CONSTRAINT fk_update_cxpcomprasdet_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cxpcomprasdet` ADD CONSTRAINT fk_cxpcomprasdet_cxpcomprasmae FOREIGN KEY (`compraId`) REFERENCES `cxpcomprasmae`(`compraId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cxpcomprasdet` ADD CONSTRAINT fk_cxpcomprasdet_tbodegas FOREIGN KEY (`bodegaId`) REFERENCES `tinvbodegas`(`bodegaId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- fk-cxpcomprasmae
ALTER TABLE `cxpcomprasmae` ADD CONSTRAINT fk_cxpcomprasmae_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cxpcomprasmae` ADD CONSTRAINT fk_create_cxpcomprasmae_usuario FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cxpcomprasmae` ADD CONSTRAINT fk_update_cxpcomprasmae_usuario FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cxpcomprasmae` ADD CONSTRAINT fk_cxpcomprasmae_tbodegas FOREIGN KEY (`bodegaId`) REFERENCES `tinvbodegas`(`bodegaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cxpcomprasmae` ADD CONSTRAINT fk_cxpcomprasmae_proveedor FOREIGN KEY (`proveedorId`) REFERENCES `proveedor`(`proveedorId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cxpcomprasmae` ADD CONSTRAINT fk_cxpcomprasmae_tcotipodocumentofiscal FOREIGN KEY (`documentoId`) REFERENCES `tcotipodocumentofiscal`(`tipodocumentofiscalId`) ON DELETE RESTRICT ON UPDATE CASCADE;


/* ---------------------------------------- MODULO DE BANCOS ----------------------------------------------------*/
-- fk-bcos
ALTER TABLE `bcos` ADD CONSTRAINT fk_bcos_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `bcos` ADD CONSTRAINT fk_create_bcos_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `bcos` ADD CONSTRAINT fk_update_bcos_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-bcosctas
ALTER TABLE `bcosctas` ADD CONSTRAINT fk_bcosctas_bcos FOREIGN KEY (`bancoId`) REFERENCES `bcos`(`bancoId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `bcosctas` ADD CONSTRAINT fk_bcosctas_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `bcosctas` ADD CONSTRAINT fk_create_bcosctas_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `bcosctas` ADD CONSTRAINT fk_update_bcosctas_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-bcosdir
ALTER TABLE `bcosdir` ADD CONSTRAINT fk_bcosdir_bcos FOREIGN KEY (`bancoId`) REFERENCES `bcos`(`bancoId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `bcosdir` ADD CONSTRAINT fk_create_bcosdir_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `bcosdir` ADD CONSTRAINT fk_bcosdir_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `bcosdir` ADD CONSTRAINT fk_update_bcosdir_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-bcostel
ALTER TABLE `bcostel` ADD CONSTRAINT fk_bcostel_bcos FOREIGN KEY (`bancoId`) REFERENCES `bcos`(`bancoId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `bcostel` ADD CONSTRAINT fk_create_bcostel_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `bcostel` ADD CONSTRAINT fk_update_bcostel_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-bcosccdet
ALTER TABLE `bcosccdet` ADD CONSTRAINT fk_bcosccdet_bcosccmae FOREIGN KEY (`bcoconcilacionId`) REFERENCES `bcosccmae`(`bcoconcilacionId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `bcosccdet` ADD CONSTRAINT fk_bcosccdet_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `bcosccdet` ADD CONSTRAINT fk_create_bcosccdet_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `bcosccdet` ADD CONSTRAINT fk_update_bcosccdet_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-bcosccmae
ALTER TABLE `bcosccmae` ADD CONSTRAINT fk_bcosccmae_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `bcosccmae` ADD CONSTRAINT fk_create_bcosccmae_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `bcosccmae` ADD CONSTRAINT fk_update_bcosccmae_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

/* ---------------------------------------- MODULO DE PLANILLAS ----------------------------------------------------*/
-- fk-plplempleados
ALTER TABLE `plplempleados` ADD CONSTRAINT fk_plempleados_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `plplempleados` ADD CONSTRAINT fk_plplempleados_tsucursal FOREIGN KEY (`Idsucursal`) REFERENCES `tsucursal`(`Idsucursal`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `plplempleados` ADD CONSTRAINT fk_create_plempleados_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `plplempleados` ADD CONSTRAINT fk_update_plempleados_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- fk-plededucciones
ALTER TABLE `plededucciones` ADD CONSTRAINT fk_plededucciones_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `plededucciones` ADD CONSTRAINT fk_create_plededucciones_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `plededucciones` ADD CONSTRAINT fk_update_plededucciones_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `plededucciones` ADD CONSTRAINT fk_plededucciones_plempleados FOREIGN KEY (`empleadoId`) REFERENCES `plplempleados`(`empleadoId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `plededucciones` ADD CONSTRAINT fk_plededucciones_plplempleados FOREIGN KEY (`empleadoId`) REFERENCES `plplempleados`(`empleadoId`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-plecomisiones
ALTER TABLE `plecomisiones` ADD CONSTRAINT fk_plecomisiones_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `plecomisiones` ADD CONSTRAINT fk_create_plecomisiones_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `plecomisiones` ADD CONSTRAINT fk_update_plecomisiones_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `plecomisiones` ADD CONSTRAINT fk_plecomisiones_plempleados FOREIGN KEY (`empleadoId`) REFERENCES `plplempleados`(`empleadoId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `plecomisiones` ADD CONSTRAINT fk_plecomisiones_plplempleados FOREIGN KEY (`empleadoId`) REFERENCES `plplempleados`(`empleadoId`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-plecertificaciones
ALTER TABLE `plecertificaciones` ADD CONSTRAINT fk_plecertificaciones_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `plecertificaciones` ADD CONSTRAINT fk_create_plecertificaciones_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `plecertificaciones` ADD CONSTRAINT fk_update_plecertificaciones_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `plecertificaciones` ADD CONSTRAINT fk_plecertificaciones_plempleados FOREIGN KEY (`empleadoId`) REFERENCES `plplempleados`(`empleadoId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `plecertificaciones` ADD CONSTRAINT fk_plecertificaciones_plplempleados FOREIGN KEY (`empleadoId`) REFERENCES `plplempleados`(`empleadoId`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-pletitulaciones
ALTER TABLE `pletitulaciones` ADD CONSTRAINT fk_pletitulaciones_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `pletitulaciones` ADD CONSTRAINT fk_create_pletitulaciones_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `pletitulaciones` ADD CONSTRAINT fk_update_pletitulaciones_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `pletitulaciones` ADD CONSTRAINT fk_pletitulaciones_plempleados FOREIGN KEY (`empleadoId`) REFERENCES `plplempleados`(`empleadoId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `pletitulaciones` ADD CONSTRAINT fk_pletitulaciones_plplempleados FOREIGN KEY (`empleadoId`) REFERENCES `plplempleados`(`empleadoId`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-pleasistencia
ALTER TABLE `pleasistencia` ADD CONSTRAINT fk_pleasistencia_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `pleasistencia` ADD CONSTRAINT fk_create_pleasistencia_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `pleasistencia` ADD CONSTRAINT fk_update_pleasistencia_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `pleasistencia` ADD CONSTRAINT fk_pleasistencia_plempleados FOREIGN KEY (`empleadoId`) REFERENCES `plplempleados`(`empleadoId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `pleasistencia` ADD CONSTRAINT fk_pleasistencia_plplempleados FOREIGN KEY (`empleadoId`) REFERENCES `plplempleados`(`empleadoId`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-plepladet
ALTER TABLE `plepladet` ADD CONSTRAINT fk_plepladet_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `plepladet` ADD CONSTRAINT fk_create_plepladet_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `plepladet` ADD CONSTRAINT fk_update_plepladet_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `plepladet` ADD CONSTRAINT fk_plepladet_plempleados FOREIGN KEY (`empleadoId`) REFERENCES `plplempleados`(`empleadoId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `plepladet` ADD CONSTRAINT fk_plepladet_pleplamae FOREIGN KEY (`planillaId`) REFERENCES `pleplamae`(`planillaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `plepladet` ADD CONSTRAINT fk_plepladet_plplempleados FOREIGN KEY (`empleadoId`) REFERENCES `plplempleados`(`empleadoId`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-pleplamae
ALTER TABLE `pleplamae` ADD CONSTRAINT fk_pleplamae_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `pleplamae` ADD CONSTRAINT fk_create_pleplamae_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `pleplamae` ADD CONSTRAINT fk_update_pleplamae_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-tpldeducciones
ALTER TABLE `tpldeducciones` ADD CONSTRAINT fk_tplededucciones_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tpldeducciones` ADD CONSTRAINT fk_create_tplededucciones_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tpldeducciones` ADD CONSTRAINT fk_update_tplededucciones_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-tplingresos
ALTER TABLE `tplingresos` ADD CONSTRAINT fk_tplingresos_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tplingresos` ADD CONSTRAINT fk_create_tplingresos_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tplingresos` ADD CONSTRAINT fk_update_tplingresos_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-tplprofesiones
ALTER TABLE `tplprofesiones` ADD CONSTRAINT fk_tprofesiones_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tplprofesiones` ADD CONSTRAINT fk_create_tprofesiones_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tplprofesiones` ADD CONSTRAINT fk_update_tplprofesiones_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-tplpuestos
ALTER TABLE `tplpuestos` ADD CONSTRAINT fk_tpuestos_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tplpuestos` ADD CONSTRAINT fk_create_tpuestos_tusuarios  FOREIGN KEY (`usuarioCreated` ) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tplpuestos` ADD CONSTRAINT fk_update_tplpuestos_tusuarios  FOREIGN KEY (`usuarioUpdated` ) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

/* ---------------------------------------- MODULO DE CONTABILIDAD ----------------------------------------------------*/

-- fk-cofactordecambios
ALTER TABLE `cofactordecambios` ADD CONSTRAINT fk_cofactordecambios_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cofactordecambios` ADD CONSTRAINT fk_create_cofactordecambios_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cofactordecambios` ADD CONSTRAINT fk_update_cofactordecambios_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-copdadet (detalle de partidas)
ALTER TABLE `copdadet` ADD CONSTRAINT fk_copdadet_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `copdadet` ADD CONSTRAINT fk_create_copdadet_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `copdadet` ADD CONSTRAINT fk_update_copdadet_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `copdadet` ADD CONSTRAINT fk_copdadet_tmodulos FOREIGN KEY (`moduloId`) REFERENCES `tmodulos`(`moduloId`) ON DELETE RESTRICT ON UPDATE CASCADE;		
ALTER TABLE `copdadet` ADD CONSTRAINT fk_copdadet_ctacontables FOREIGN KEY (`ctacontable`) REFERENCES `tcoctacontables`(`ctacontable`) ON DELETE RESTRICT ON UPDATE CASCADE;		
ALTER TABLE `copdadet` ADD CONSTRAINT fk_copdadet_copdamae FOREIGN KEY (`copdamaeId`) REFERENCES `copdamae`(`copdamaeId`) ON DELETE RESTRICT ON UPDATE CASCADE;		
ALTER TABLE `copdadet` ADD CONSTRAINT fk_copdadet_tcoctacontables FOREIGN KEY (`ctacontable`) REFERENCES `tcoctacontables`(`ctacontable`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-copdamae (maestro de partidas)
ALTER TABLE `copdamae` ADD CONSTRAINT fk_update_copdamae_usuario FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `copdamae` ADD CONSTRAINT fk_copdamae_tmodulos FOREIGN KEY (`moduloId`) REFERENCES `tmodulos`(`moduloId`) ON DELETE RESTRICT ON UPDATE CASCADE;		
ALTER TABLE `copdamae` ADD CONSTRAINT fk_copdamae_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `copdamae` ADD CONSTRAINT fk_create_copdamae_usuario FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-comovcta (movimientos contables en el mes)
ALTER TABLE `comovcta` ADD CONSTRAINT fk_comovcta_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `comovcta` ADD CONSTRAINT fk_create_comovcta_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `comovcta` ADD CONSTRAINT fk_update_comovcta_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `comovcta` ADD CONSTRAINT fk_comovcta_ctacontables FOREIGN KEY (`ctacontable`) REFERENCES `tcoctacontables`(`ctacontable`) ON DELETE RESTRICT ON UPDATE CASCADE;		
ALTER TABLE `comovcta` ADD CONSTRAINT fk_comovcta_tcoctacontables FOREIGN KEY (`ctacontable`) REFERENCES `tcoctacontables`(`ctacontable`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-cosaldoscta (saldos de cuentas contables)
ALTER TABLE `cosaldoscta` ADD CONSTRAINT fk_cosaldoscta_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cosaldoscta` ADD CONSTRAINT fk_create_cosaldoscta_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cosaldoscta` ADD CONSTRAINT fk_update_cosaldoscta_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cosaldoscta` ADD CONSTRAINT fk_cosaldoscta_ctacontables FOREIGN KEY (`ctacontable`) REFERENCES `tcoctacontables`(`ctacontable`) ON DELETE RESTRICT ON UPDATE CASCADE;		
ALTER TABLE `cosaldoscta` ADD CONSTRAINT fk_cosaldoscta_tcoctacontables FOREIGN KEY (`ctacontable`) REFERENCES `tcoctacontables`(`ctacontable`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-coperiodoctable (periodo contable operativo)
ALTER TABLE `coperiodoctable` ADD CONSTRAINT fk_coperiodoctable_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `coperiodoctable` ADD CONSTRAINT fk_create_coperiodoctable_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `coperiodoctable` ADD CONSTRAINT fk_update_coperiodoctable_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-cocierrectable (periodo contable cerrado)
ALTER TABLE `cocierrectable` ADD CONSTRAINT fk_cocierrectable_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cocierrectable` ADD CONSTRAINT fk_create_cocierrectable_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cocierrectable` ADD CONSTRAINT fk_update_cocierrectable_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-tcoctacontables(cuentas contables)
ALTER TABLE `tcoctacontables` ADD CONSTRAINT fk_update_tcoctacontables_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tcoctacontables` ADD CONSTRAINT fk_tcoctacontables_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tcoctacontables` ADD CONSTRAINT fk_create_tcoctacontables_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tcoctacontables` ADD CONSTRAINT fk_tcoctacontables_tcogrupocontable FOREIGN KEY (`tcogrupocontableId`) REFERENCES `tcogrupocontable`(`tcogrupocontableId`) ON DELETE RESTRICT ON UPDATE CASCADE;		
-- fk-cogrupocontable grupos contables: Gastos, Ingresos, Activo Circulante, Pasivo circulante, etc, etc
ALTER TABLE `tcogrupocontable` ADD CONSTRAINT fk_create_tcogrupocontable_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tcogrupocontable` ADD CONSTRAINT fk_update_tcogrupocontable_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-tconaturalezacta (Debito y Credito)
ALTER TABLE `tconaturalezacta` ADD CONSTRAINT fk_create_tnaturalezacta_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tconaturalezacta` ADD CONSTRAINT fk_update_tnaturalezacta_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-conivelcta
ALTER TABLE `tconivelcta` ADD CONSTRAINT fk_create_tnivelcta_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tconivelcta` ADD CONSTRAINT fk_update_tnivelcta_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-tcorepdiarios
ALTER TABLE `tcorepdiarios` ADD CONSTRAINT fk_tcorepdiarios_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tcorepdiarios` ADD CONSTRAINT fk_create_tcorepdiarios_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tcorepdiarios` ADD CONSTRAINT fk_update_tcorepdiarios_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-tcorepbalances
ALTER TABLE `tcorepbalances` ADD CONSTRAINT fk_tcorepbalances_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tcorepbalances` ADD CONSTRAINT fk_update_tcorepbalances_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tcorepbalances` ADD CONSTRAINT fk_tcorepbalances_ctacontables FOREIGN KEY (`ctacontable`) REFERENCES `tcoctacontables`(`ctacontable`) ON DELETE RESTRICT ON UPDATE CASCADE;		
ALTER TABLE `tcorepbalances` ADD CONSTRAINT fk_create_tcorepbalances_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tcorepbalances` ADD CONSTRAINT fk_tcorepbalances_tcoctacontables FOREIGN KEY (`ctacontable`) REFERENCES `tcoctacontables`(`ctacontable`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-tcorepliquidez
ALTER TABLE `tcorepliquidez` ADD CONSTRAINT fk_create_tcorepliquidez_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tcorepliquidez` ADD CONSTRAINT fk_update_tcorepliquidez_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-tcoplantillabalancesdet (detalle de definicion manual balances financieros)
ALTER TABLE `tcoplantillabalancesdet` ADD CONSTRAINT fk_tcoplantillabalancesdet_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tcoplantillabalancesdet` ADD CONSTRAINT fk_create_tcoplantillabalancesdet_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tcoplantillabalancesdet` ADD CONSTRAINT fk_update_tcoplantillabalancesdet_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tcoplantillabalancesdet` ADD CONSTRAINT fk_cocdefbalde_tcoctacontables FOREIGN KEY (`ctacontable`) REFERENCES `tcoctacontables`(`ctacontable`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tcoplantillabalancesdet` ADD CONSTRAINT fk_tcoplantillabalancesdet_tcoplantillabalancesmae FOREIGN KEY (`cocdefbalmaId`) REFERENCES `tcoplantillabalancesmae`(`cocdefbalmaId`) ON DELETE RESTRICT ON UPDATE CASCADE;		
-- fk-tcoplantillabalancesmae (maestro de definicion manual balances financieros)
ALTER TABLE `tcoplantillabalancesmae` ADD CONSTRAINT fk_tcoplantillabalancesmae_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tcoplantillabalancesmae` ADD CONSTRAINT fk_create_tcoplantillabalancesmae_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tcoplantillabalancesmae` ADD CONSTRAINT fk_update_tcoplantillabalancesmae_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-tcoplantillapdadet (detalle de definicion automatica de partidas)
ALTER TABLE `tcoplantillapdadet` ADD CONSTRAINT fk_tcoplantillapdadet_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tcoplantillapdadet` ADD CONSTRAINT fk_create_tcoplantillapdadet_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tcoplantillapdadet` ADD CONSTRAINT fk_update_tcoplantillapdadet_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tcoplantillapdadet` ADD CONSTRAINT fk_tcoplantillapdadet_ctacontables FOREIGN KEY (`ctacontable`) REFERENCES `tcoctacontables`(`ctacontable`) ON DELETE RESTRICT ON UPDATE CASCADE;		
ALTER TABLE `tcoplantillapdadet` ADD CONSTRAINT fk_tcoplantillapdadet_tcoctacontables FOREIGN KEY (`ctacontable`) REFERENCES `tcoctacontables`(`ctacontable`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tcoplantillapdadet` ADD CONSTRAINT fk_tcoplantillapdadet_tmodulos FOREIGN KEY (`moduloId`) REFERENCES `tmodulos`(`moduloId`) ON DELETE RESTRICT ON UPDATE CASCADE;		
ALTER TABLE `tcoplantillapdadet` ADD CONSTRAINT fk_tcoplantillapdadet_tcoplantillapdamae FOREIGN KEY (`tcoplantillapdamaeId`) REFERENCES `tcoplantillapdamae`(`tcoplantillapdamaeId`) ON DELETE RESTRICT ON UPDATE CASCADE;		
-- fk-tcoplantillapdamae (maestro de definicion automatica de partidas)
ALTER TABLE `tcoplantillapdamae` ADD CONSTRAINT fk_tcoplantillapdamae_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tcoplantillapdamae` ADD CONSTRAINT fk_update_tcoplantillapdamae_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tcoplantillapdamae` ADD CONSTRAINT fk_tcoplantillapdamae_tmodulos FOREIGN KEY (`moduloId`) REFERENCES `tmodulos`(`moduloId`) ON DELETE RESTRICT ON UPDATE CASCADE;		
ALTER TABLE `tcoplantillapdamae` ADD CONSTRAINT fk_create_tcoplantillapdamae_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-tplpuestos
ALTER TABLE `tcoimpuestovecinal` ADD CONSTRAINT fk_tcoimpuestovecinal_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tcoimpuestovecinal` ADD CONSTRAINT fk_update_tcoimpuestovecinal_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tcoimpuestovecinal` ADD CONSTRAINT fk_create_tcoimpuestovecinal_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- fk-tplpuestos
ALTER TABLE `tcotipodocumentofiscal` ADD CONSTRAINT fk_tipodocumentofiscal_empresa FOREIGN KEY (`empresaId`) REFERENCES `tempresas`(`empresaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tcotipodocumentofiscal` ADD CONSTRAINT fk_create_tipodocumentofiscal_tusuarios  FOREIGN KEY (`usuarioCreated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tcotipodocumentofiscal` ADD CONSTRAINT fk_update_tipodocumentofiscal_tusuarios  FOREIGN KEY (`usuarioUpdated`) REFERENCES `tusuarios`(`usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;


-- script finalizado
