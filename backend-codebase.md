# ERP Arcas - Código Fuente Completo
> Generado automáticamente el 10/9/2026, 10:20:21 a. m.

---

## 📄 .env

```typescript
﻿# ===== Configuracion del Servidor =====
PORT=3000
NODE_ENV=development

# ===== Base de Datos MySQL =====
DB_HOST=${arcas_host}
DB_PORT=${arcas_port}
DB_USER=${arcas_user}
DB_PASSWORD=${arcas_password}
DB_NAME=${arcas_database}

# ===== JWT =====
JWT_SECRET=${seed}
JWT_EXPIRES_IN=8h

# ===== CORS =====
CORS_ORIGIN=http://localhost:4200

# ===== Correo =====
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
MAIL_FROM=

```

---

## 📄 nest-cli.json

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}

```

---

## 📄 tsconfig.json

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2022",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": true,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "forceConsistentCasingInFileNames": false,
    "noFallthroughCasesInSwitch": false,
    "strictPropertyInitialization": false,
    "paths": {
      "@/*": ["src/*"]
    }
  }
}

```

---

## 📄 package.json

```json
{
  "name": "arcas-backend",
  "version": "1.0.0",
  "description": "Backend ERP Arcas Software",
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main"
  },
  "dependencies": {
    "@nestjs/common": "^11.2.0",
    "@nestjs/config": "^4.0.4",
    "@nestjs/core": "^11.2.0",
    "@nestjs/event-emitter": "^3.1.0",
    "@nestjs/jwt": "^11.0.0",
    "@nestjs/passport": "^11.0.0",
    "@nestjs/platform-express": "^11.2.0",
    "@nestjs/swagger": "^11.4.7",
    "@nestjs/typeorm": "^11.0.0",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.1",
    "dotenv": "^17.4.2",
    "dotenv-expand": "^1000.0.0",
    "mysql2": "^3.14.0",
    "nodemailer": "^9.0.6",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1",
    "typeorm": "^0.3.21"
  },
  "devDependencies": {
    "@nestjs/cli": "^11.0.0",
    "@nestjs/schematics": "^11.0.0",
    "@types/express": "^5.0.0",
    "@types/node": "^22.10.0",
    "@types/nodemailer": "^8.0.1",
    "@types/passport-jwt": "^4.0.1",
    "typescript": "^5.7.0"
  }
}

```

---

## 📄 src\app.module.ts

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { SucursalesModule } from './modules/sucursales/sucursales.module';
import { ModulosModule } from './modules/modules/modulos.module';
import { InventarioModule } from './modules/inventario/inventario.module';
import { ParametrosModule } from './modules/parametros/parametros.module';
import { BancosModule } from './modules/bancos/bancos.module';
import { ContabilidadModule } from './modules/contabilidad/contabilidad.module';
import { PlanillaModule } from './modules/planilla/planilla.module';
import { CxcModule } from './modules/cxc/cxc.module';
import { CxpModule } from './modules/cxp/cxp.module';
import { FacturacionModule } from './modules/facturacion/facturacion.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: '127.0.0.1',
      port: 3306,
      username: 'root',
      password: 'root.8',
      database: 'arcasdb',
      autoLoadEntities: true,
      synchronize: false,
    }),
    AuthModule,
    UsersModule,
    CompaniesModule,
    SucursalesModule,
    ModulosModule,
    InventarioModule,
    ParametrosModule,
    BancosModule,
    ContabilidadModule,
    PlanillaModule,
    CxcModule,
    CxpModule,
    FacturacionModule,
  ],
})
export class AppModule {}

```

---

## 📄 src\common\decorators\current-user.decorator.ts

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

```

---

## 📄 src\common\decorators\roles.decorator.ts

```typescript
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

```

---

## 📄 src\common\guards\jwt-auth.guard.ts

```typescript
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}

@Injectable()
export class RolesGuard {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user?.roles?.includes(role));
  }
}

```

---

## 📄 src\common\interfaces\jwt-payload.interface.ts

```typescript
export interface JwtPayload {
  usuario: string;
  empresaId: number;
  sub?: string;
}

```

---

## 📄 src\config\mail.ts

```typescript
﻿import * as nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

export function getTransporter(): nodemailer.Transporter | null {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    console.warn('[Mail] SMTP no configurado — envío de correo deshabilitado');
    return null;
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user, pass },
    });
  }
  return transporter;
}

export function getMailFrom(): string {
  return process.env.MAIL_FROM || process.env.SMTP_USER || 'noreply@arcas.com';
}

```

---

## 📄 src\main.ts

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.enableCors({ origin: '*' });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('Arcas ERP API')
    .setDescription('API del sistema ERP Arcas — Honduras')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Autenticación y login')
    .addTag('Usuarios', 'Gestión de usuarios del sistema')
    .addTag('Módulos', 'Módulos del sistema')
    .addTag('Empresas', 'Gestión de empresas')
    .addTag('Sucursales', 'Gestión de sucursales')
    .addTag('Parámetros', 'Catálogos del sistema')
    .addTag('Inventario', 'Productos, bodegas, kardex')
    .addTag('Facturación', 'Facturas, cotizaciones, pedidos')
    .addTag('CxC', 'Cuentas por cobrar — clientes, caja, movimientos')
    .addTag('CxP', 'Cuentas por pagar — proveedores, compras')
    .addTag('Bancos', 'Cuentas y movimientos bancarios')
    .addTag('Contabilidad', 'Plan de cuentas, comprobantes, saldos')
    .addTag('Planilla', 'Empleados, deducciones, planillas')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Arcas Backend corriendo en http://localhost:${port}`);
  console.log(`Swagger UI: http://localhost:${port}/api/docs`);
}
bootstrap();

```

---

## 📄 src\modules\auth\auth.controller.ts

```typescript
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({ status: 200, description: 'Inicio de sesión exitoso' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}

```

---

## 📄 src\modules\auth\auth.module.ts

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { Tusuarios } from '../users/entities/usuario.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tusuarios]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'arcas-software-secret-key-2026',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}

```

---

## 📄 src\modules\auth\auth.service.ts

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tusuarios } from '../users/entities/usuario.entity';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Tusuarios)
    private readonly usersRepo: Repository<Tusuarios>,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersRepo.findOne({
      where: {
        usuario: dto.usuario,
        sn_activo: 'S',
      },
    });

    if (!user || user.password !== dto.password) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const payload: JwtPayload = {
      usuario: user.usuario,
      empresaId: user.empresaId,
    };

    return {
      access_token: this.jwtService.sign(payload),
      usuario: {
        usuarioId: user.usuarioId,
        usuario: user.usuario,
        nombre: user.nombre,
        email: user.email,
        empresaId: user.empresaId,
        idsucursal: user.Idsucursal,
      },
    };
  }

  async validateUser(usuario: string, empresaId: number) {
    return this.usersRepo.findOne({
      where: { usuario, empresaId, sn_activo: 'S' },
    });
  }
}

```

---

## 📄 src\modules\auth\dto\login.dto.ts

```typescript
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ description: 'Usuario' })
  @IsString()
  @IsNotEmpty()
  usuario: string;

  @ApiProperty({ description: 'Contraseña' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ description: 'ID de Empresa', required: false })
  @IsOptional()
  empresaId?: number;
}

```

---

## 📄 src\modules\auth\strategies\jwt.strategy.ts

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tusuarios } from '../../users/entities/usuario.entity';
import { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(Tusuarios)
    private readonly usersRepo: Repository<Tusuarios>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'arcas-software-secret-key-2026',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersRepo.findOne({
      where: { usuario: payload.usuario, sn_activo: 'S' },
    });
    if (!user) {
      throw new UnauthorizedException('Token no válido');
    }
    return {
      usuario: user.usuario,
      nombre: user.nombre,
      empresaId: user.empresaId,
      idsucursal: user.Idsucursal,
    };
  }
}

```

---

## 📄 src\modules\bancos\bancos.controller.ts

```typescript
import {
  Controller, Get, Post, Put, Body, Param, Query,
  UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BancosService } from './bancos.service';
import { CreateBancoDto, UpdateBancoDto, CreateBcoCtaDto, UpdateBcoCtaDto } from './dto/banco.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Bancos')
@ApiBearerAuth()
@Controller('bancos')
@UseGuards(JwtAuthGuard)
export class BancosController {
  constructor(private readonly service: BancosService) {}

  @Get('bancos')
  @ApiOperation({ summary: 'Listar bancos' })
  @ApiResponse({ status: 200, description: 'Lista de bancos obtenida exitosamente' })
  findAllBancos(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllBancos(empresaId);
  }

  @Get('bancos/:id')
  @ApiOperation({ summary: 'Obtener banco por ID' })
  @ApiResponse({ status: 200, description: 'Banco encontrado' })
  @ApiResponse({ status: 404, description: 'Banco no encontrado' })
  findBanco(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findBanco(id, empresaId);
  }

  @Post('bancos')
  @ApiOperation({ summary: 'Crear banco' })
  @ApiResponse({ status: 201, description: 'Banco creado exitosamente' })
  createBanco(@Body() dto: CreateBancoDto, @CurrentUser() user: any) {
    return this.service.createBanco(dto, user.usuario);
  }

  @Put('bancos/:id')
  @ApiOperation({ summary: 'Actualizar banco' })
  @ApiResponse({ status: 200, description: 'Banco actualizado exitosamente' })
  updateBanco(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateBancoDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateBanco(id, empresaId, dto, user.usuario);
  }

  @Get('cuentas')
  @ApiOperation({ summary: 'Listar cuentas bancarias' })
  @ApiResponse({ status: 200, description: 'Lista de cuentas bancarias obtenida exitosamente' })
  findAllCtas(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllCtas(empresaId);
  }

  @Get('cuentas/:id')
  @ApiOperation({ summary: 'Obtener cuenta bancaria por ID' })
  @ApiResponse({ status: 200, description: 'Cuenta bancaria encontrada' })
  @ApiResponse({ status: 404, description: 'Cuenta bancaria no encontrada' })
  findCta(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findCta(id, empresaId);
  }

  @Post('cuentas')
  @ApiOperation({ summary: 'Crear cuenta bancaria' })
  @ApiResponse({ status: 201, description: 'Cuenta bancaria creada exitosamente' })
  createCta(@Body() dto: CreateBcoCtaDto, @CurrentUser() user: any) {
    return this.service.createCta(dto, user.usuario);
  }

  @Put('cuentas/:id')
  @ApiOperation({ summary: 'Actualizar cuenta bancaria' })
  @ApiResponse({ status: 200, description: 'Cuenta bancaria actualizada exitosamente' })
  updateCta(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateBcoCtaDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateCta(id, empresaId, dto, user.usuario);
  }

  @Get('conciliaciones')
  @ApiOperation({ summary: 'Listar conciliaciones bancarias' })
  @ApiResponse({ status: 200, description: 'Lista de conciliaciones bancarias obtenida exitosamente' })
  findAllConciliaciones(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllConciliaciones(empresaId);
  }

  @Get('conciliaciones/:id')
  @ApiOperation({ summary: 'Obtener conciliación bancaria por ID' })
  @ApiResponse({ status: 200, description: 'Conciliación bancaria encontrada' })
  @ApiResponse({ status: 404, description: 'Conciliación bancaria no encontrada' })
  findConciliacion(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findConciliacion(id, empresaId);
  }

  @Get('direcciones')
  @ApiOperation({ summary: 'Listar direcciones de bancos' })
  @ApiResponse({ status: 200, description: 'Lista de direcciones de bancos obtenida exitosamente' })
  findAllDirecciones(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllDirecciones(empresaId);
  }

  @Get('telefonos')
  @ApiOperation({ summary: 'Listar teléfonos de bancos' })
  @ApiResponse({ status: 200, description: 'Lista de teléfonos de bancos obtenida exitosamente' })
  findAllTelefonos(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllTelefonos(empresaId);
  }
}

```

---

## 📄 src\modules\bancos\bancos.module.ts

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tbanco } from './entities/banco.entity';
import { TbcoCta } from './entities/bco-cta.entity';
import { TbcoConciliacion } from './entities/bco-conciliacion.entity';
import { TbcoConciliacionDet } from './entities/bco-conciliacion-det.entity';
import { TbcoDireccion } from './entities/bco-direccion.entity';
import { TbcoTelefono } from './entities/bco-telefono.entity';
import { BancosService } from './bancos.service';
import { BancosController } from './bancos.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tbanco,
      TbcoCta,
      TbcoConciliacion,
      TbcoConciliacionDet,
      TbcoDireccion,
      TbcoTelefono,
    ]),
  ],
  controllers: [BancosController],
  providers: [BancosService],
  exports: [BancosService],
})
export class BancosModule {}

```

---

## 📄 src\modules\bancos\bancos.service.ts

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ObjectLiteral } from 'typeorm';
import { Tbanco } from './entities/banco.entity';
import { TbcoCta } from './entities/bco-cta.entity';
import { TbcoConciliacion } from './entities/bco-conciliacion.entity';
import { TbcoConciliacionDet } from './entities/bco-conciliacion-det.entity';
import { TbcoDireccion } from './entities/bco-direccion.entity';
import { TbcoTelefono } from './entities/bco-telefono.entity';
import { CreateBancoDto, UpdateBancoDto, CreateBcoCtaDto, UpdateBcoCtaDto } from './dto/banco.dto';

@Injectable()
export class BancosService {
  constructor(
    @InjectRepository(Tbanco) private readonly bancoRepo: Repository<Tbanco>,
    @InjectRepository(TbcoCta) private readonly bcoCtaRepo: Repository<TbcoCta>,
    @InjectRepository(TbcoConciliacion) private readonly bcoConciliacionRepo: Repository<TbcoConciliacion>,
    @InjectRepository(TbcoConciliacionDet) private readonly bcoConciliacionDetRepo: Repository<TbcoConciliacionDet>,
    @InjectRepository(TbcoDireccion) private readonly bcoDireccionRepo: Repository<TbcoDireccion>,
    @InjectRepository(TbcoTelefono) private readonly bcoTelefonoRepo: Repository<TbcoTelefono>,
  ) {}

  private async findAllByEmpresa<T extends ObjectLiteral>(repo: Repository<T>, empresaId: number) {
    return repo.find({
      where: { empresaId } as unknown as FindOptionsWhere<T>,
    });
  }

  private async findOneById<T extends ObjectLiteral>(
    repo: Repository<T>,
    idField: string,
    id: number | string,
    empresaId: number,
    entityName: string,
  ) {
    const where = { [idField]: id, empresaId } as unknown as FindOptionsWhere<T>;
    const found = await repo.findOne({ where });
    if (!found) throw new NotFoundException(`${entityName} ${id} no encontrado`);
    return found;
  }

  private async createEntity<T extends ObjectLiteral>(
    repo: Repository<T>,
    dto: any,
    currentUser: string,
  ) {
    const entity = repo.create({
      ...dto,
      usuarioCreated: currentUser,
    });
    return repo.save(entity);
  }

  private async updateEntity<T extends ObjectLiteral>(
    repo: Repository<T>,
    idField: string,
    id: number | string,
    empresaId: number,
    dto: any,
    currentUser: string,
    entityName: string,
  ) {
    const entity = await this.findOneById(repo, idField, id, empresaId, entityName);
    Object.assign(entity, dto, {
      usuarioUpdated: currentUser,
      fechaUpdated: new Date(),
    });
    return repo.save(entity);
  }

  private async softDelete<T extends ObjectLiteral>(
    repo: Repository<T>,
    idField: string,
    id: number | string,
    empresaId: number,
    entityName: string,
  ) {
    const entity = await this.findOneById(repo, idField, id, empresaId, entityName);
    Object.assign(entity, {
      sn_activo: 'N',
      fechaUpdated: new Date(),
    });
    return repo.save(entity);
  }

  async findAllBancos(empresaId: number) {
    return this.findAllByEmpresa(this.bancoRepo, empresaId);
  }

  async findBanco(bancoId: number, empresaId: number) {
    return this.findOneById(this.bancoRepo, 'bancoId', bancoId, empresaId, 'Banco');
  }

  async createBanco(dto: CreateBancoDto, currentUser: string) {
    return this.createEntity(this.bancoRepo, dto, currentUser);
  }

  async updateBanco(bancoId: number, empresaId: number, dto: UpdateBancoDto, currentUser: string) {
    return this.updateEntity(this.bancoRepo, 'bancoId', bancoId, empresaId, dto, currentUser, 'Banco');
  }

  async removeBanco(bancoId: number, empresaId: number) {
    return this.softDelete(this.bancoRepo, 'bancoId', bancoId, empresaId, 'Banco');
  }

  async findAllCtas(empresaId: number) {
    return this.findAllByEmpresa(this.bcoCtaRepo, empresaId);
  }

  async findCta(bcoctasId: number, empresaId: number) {
    return this.findOneById(this.bcoCtaRepo, 'bcoctasId', bcoctasId, empresaId, 'Cuenta Banco');
  }

  async createCta(dto: CreateBcoCtaDto, currentUser: string) {
    return this.createEntity(this.bcoCtaRepo, dto, currentUser);
  }

  async updateCta(bcoctasId: number, empresaId: number, dto: UpdateBcoCtaDto, currentUser: string) {
    return this.updateEntity(this.bcoCtaRepo, 'bcoctasId', bcoctasId, empresaId, dto, currentUser, 'Cuenta Banco');
  }

  async removeCta(bcoctasId: number, empresaId: number) {
    return this.softDelete(this.bcoCtaRepo, 'bcoctasId', bcoctasId, empresaId, 'Cuenta Banco');
  }

  async findAllConciliaciones(empresaId: number) {
    return this.bcoConciliacionRepo.find({
      where: { empresaId } as unknown as FindOptionsWhere<TbcoConciliacion>,
      order: { fecharegistro: 'DESC' } as any,
    });
  }

  async findConciliacion(bcoconcilacionId: number, empresaId: number) {
    return this.findOneById(this.bcoConciliacionRepo, 'bcoconcilacionId', bcoconcilacionId, empresaId, 'Conciliacion');
  }

  async createConciliacion(dto: any, currentUser: string) {
    return this.createEntity(this.bcoConciliacionRepo, dto, currentUser);
  }

  async updateConciliacion(bcoconcilacionId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.bcoConciliacionRepo, 'bcoconcilacionId', bcoconcilacionId, empresaId, dto, currentUser, 'Conciliacion');
  }

  async findAllConciliacionesDet(empresaId: number) {
    return this.findAllByEmpresa(this.bcoConciliacionDetRepo, empresaId);
  }

  async findConciliacionDet(bcosdetconciliacionId: number, empresaId: number) {
    return this.findOneById(this.bcoConciliacionDetRepo, 'bcosdetconciliacionId', bcosdetconciliacionId, empresaId, 'Detalle Conciliacion');
  }

  async createConciliacionDet(dto: any, currentUser: string) {
    return this.createEntity(this.bcoConciliacionDetRepo, dto, currentUser);
  }

  async updateConciliacionDet(bcosdetconciliacionId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.bcoConciliacionDetRepo, 'bcosdetconciliacionId', bcosdetconciliacionId, empresaId, dto, currentUser, 'Detalle Conciliacion');
  }

  async findAllDirecciones(empresaId: number) {
    return this.findAllByEmpresa(this.bcoDireccionRepo, empresaId);
  }

  async findDireccion(bcosdireccionid: number, empresaId: number) {
    return this.findOneById(this.bcoDireccionRepo, 'bcosdireccionid', bcosdireccionid, empresaId, 'Direccion Banco');
  }

  async createDireccion(dto: any, currentUser: string) {
    return this.createEntity(this.bcoDireccionRepo, dto, currentUser);
  }

  async updateDireccion(bcosdireccionid: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.bcoDireccionRepo, 'bcosdireccionid', bcosdireccionid, empresaId, dto, currentUser, 'Direccion Banco');
  }

  async findAllTelefonos(empresaId: number) {
    return this.findAllByEmpresa(this.bcoTelefonoRepo, empresaId);
  }

  async findTelefono(bancotelefonoId: number, empresaId: number) {
    return this.findOneById(this.bcoTelefonoRepo, 'bancotelefonoId', bancotelefonoId, empresaId, 'Telefono Banco');
  }

  async createTelefono(dto: any, currentUser: string) {
    return this.createEntity(this.bcoTelefonoRepo, dto, currentUser);
  }

  async updateTelefono(bancotelefonoId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.bcoTelefonoRepo, 'bancotelefonoId', bancotelefonoId, empresaId, dto, currentUser, 'Telefono Banco');
  }
}

```

---

## 📄 src\modules\bancos\dto\banco.dto.ts

```typescript
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBancoDto {
  @ApiProperty({ description: 'Nombre del banco' })
  @IsString() @IsNotEmpty()
  descripcion: string;

  @ApiProperty({ required: false, description: 'ID de la sucursal' })
  @IsNumber() @IsOptional()
  Idsucursal?: number;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdateBancoDto {
  @ApiProperty({ required: false, description: 'Nombre del banco' })
  @IsString() @IsOptional()
  descripcion?: string;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Activo (Sí/No)' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;

  @ApiProperty({ required: false, description: 'ID de la sucursal' })
  @IsNumber() @IsOptional()
  Idsucursal?: number;
}

export class CreateBcoCtaDto {
  @ApiProperty({ description: 'ID del banco' })
  @IsNumber()
  bancoId: number;

  @ApiProperty({ description: 'Número de cuenta bancaria' })
  @IsString() @IsNotEmpty()
  nrocuenta: string;

  @ApiProperty({ description: 'ID de la moneda' })
  @IsNumber()
  monedaId: number;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdateBcoCtaDto {
  @ApiProperty({ required: false, description: 'ID del banco' })
  @IsNumber() @IsOptional()
  bancoId?: number;

  @ApiProperty({ required: false, description: 'Número de cuenta bancaria' })
  @IsString() @IsOptional()
  nrocuenta?: string;

  @ApiProperty({ required: false, description: 'ID de la moneda' })
  @IsNumber() @IsOptional()
  monedaId?: number;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Activo (Sí/No)' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;

  @ApiProperty({ required: false, description: 'ID de la sucursal' })
  @IsNumber() @IsOptional()
  Idsucursal?: number;
}

```

---

## 📄 src\modules\bancos\entities\banco.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('bcos')
export class Tbanco {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'bancoId' })
  bancoId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  Idsucursal: number;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\bancos\entities\bco-conciliacion-det.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('bcosccdet')
export class TbcoConciliacionDet {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'bcosdetconciliacionId' })
  bcosdetconciliacionId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  bcoconcilacionId: number;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fecmovbco: Date;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  nrorefencia: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 150 })
  concepto: string;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  importe: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['D', 'C'], default: 'D' })
  naturaleza: string;

  @ApiProperty()
  @Column()
  Idsucursal: number;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\bancos\entities\bco-conciliacion.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('bcosccmae')
export class TbcoConciliacion {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'bcoconcilacionId' })
  bcoconcilacionId: number;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  ctabcoId: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  importe: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_conciliado: string;

  @ApiProperty()
  @Column()
  Idsucursal: number;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\bancos\entities\bco-cta.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('bcosctas')
export class TbcoCta {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'bcoctasId' })
  bcoctasId: number;

  @ApiProperty()
  @Column()
  bancoId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  nrocuenta: string;

  @ApiProperty()
  @Column()
  monedaId: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  Idsucursal: number;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\bancos\entities\bco-direccion.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('bcosdir')
export class TbcoDireccion {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'bcosdireccionid' })
  bcosdireccionid: number;

  @ApiProperty()
  @Column()
  bancoId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  direccionId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 50, nullable: true })
  descripcion: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\bancos\entities\bco-telefono.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('bcostel')
export class TbcoTelefono {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'bancotelefonoId' })
  bancotelefonoId: number;

  @ApiProperty()
  @Column()
  bancoId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  telefonoId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\companies\companies.controller.ts

```typescript
﻿import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { CreateEmpresaDto, UpdateEmpresaDto } from './dto/empresa.dto';
import { CreateEmpresaDetDto, UpdateEmpresaDetDto } from './dto/empresasdet.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Empresas')
@ApiBearerAuth()
@Controller('companies')
@UseGuards(JwtAuthGuard)
export class CompaniesController {
  constructor(private readonly service: CompaniesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar empresas' })
  @ApiResponse({ status: 200, description: 'Lista de empresas obtenida exitosamente' })
  findAll() {
    return this.service.findAll();
  }

  @Get('det')
  @ApiOperation({ summary: 'Listar datos de empresa (RTN, tel, dir, etc)' })
  @ApiResponse({ status: 200, description: 'Datos de empresa obtenidos' })
  findAllDet(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllDet(empresaId);
  }

  @Get('det/:id')
  @ApiOperation({ summary: 'Obtener dato de empresa por ID' })
  findOneDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findOneDet(id, empresaId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener empresa por ID' })
  @ApiResponse({ status: 200, description: 'Empresa encontrada' })
  @ApiResponse({ status: 404, description: 'Empresa no encontrada' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear empresa' })
  @ApiResponse({ status: 201, description: 'Empresa creada exitosamente' })
  create(@Body() dto: CreateEmpresaDto, @CurrentUser() user: any) {
    return this.service.create(dto, user.usuario);
  }

  @Post('det')
  @ApiOperation({ summary: 'Crear dato de empresa' })
  @ApiResponse({ status: 201, description: 'Dato de empresa creado' })
  createDet(
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: CreateEmpresaDetDto,
    @CurrentUser() user: any,
  ) {
    return this.service.createDet(empresaId, dto, user.usuario);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar empresa' })
  @ApiResponse({ status: 200, description: 'Empresa actualizada exitosamente' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEmpresaDto,
    @CurrentUser() user: any,
  ) {
    return this.service.update(id, dto, user.usuario);
  }

  @Put('det/:id')
  @ApiOperation({ summary: 'Actualizar dato de empresa' })
  @ApiResponse({ status: 200, description: 'Dato de empresa actualizado' })
  updateDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateEmpresaDetDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateDet(id, empresaId, dto, user.usuario);
  }


}


```

---

## 📄 src\modules\companies\companies.module.ts

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tempresas } from './entities/empresa.entity';
import { TempresasDet } from './entities/empresasdet.entity';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Tempresas, TempresasDet])],
  controllers: [CompaniesController],
  providers: [CompaniesService],
  exports: [CompaniesService],
})
export class CompaniesModule {}

```

---

## 📄 src\modules\companies\companies.service.ts

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tempresas } from './entities/empresa.entity';
import { TempresasDet } from './entities/empresasdet.entity';
import { CreateEmpresaDto, UpdateEmpresaDto } from './dto/empresa.dto';
import { CreateEmpresaDetDto, UpdateEmpresaDetDto } from './dto/empresasdet.dto';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Tempresas)
    private readonly repo: Repository<Tempresas>,
    @InjectRepository(TempresasDet)
    private readonly detRepo: Repository<TempresasDet>,
  ) {}

  async findAll() {
    return this.repo.find();
  }

  async findOne(empresaId: number) {
    const found = await this.repo.findOne({ where: { empresaId } });
    if (!found) throw new NotFoundException(`Empresa ${empresaId} no encontrada`);
    return found;
  }

  async create(dto: CreateEmpresaDto, currentUser: string) {
    const entity = this.repo.create({
      ...dto,
      fechasistema: new Date(),
      usuarioCreated: currentUser,
    });
    return this.repo.save(entity);
  }

  async update(empresaId: number, dto: UpdateEmpresaDto, currentUser: string) {
    const entity = await this.findOne(empresaId);
    Object.assign(entity, dto, {
      usuarioUpdated: currentUser,
      fechaUpdated: new Date(),
    });
    return this.repo.save(entity);
  }

  // ===== EmpresaDet =====

  async findAllDet(empresaId: number) {
    return this.detRepo.find({ where: { empresaId }, order: { tipo: 'ASC' } });
  }

  async findOneDet(empresasdetId: number, empresaId: number) {
    const found = await this.detRepo.findOne({ where: { empresasdetId, empresaId } });
    if (!found) throw new NotFoundException(`EmpresaDet ${empresasdetId} no encontrado`);
    return found;
  }

  async createDet(empresaId: number, dto: CreateEmpresaDetDto, currentUser: string) {
    const entity = this.detRepo.create({
      ...dto,
      empresaId,
      sn_activo: dto.sn_activo || 'S',
      usuarioCreated: currentUser,
    });
    return this.detRepo.save(entity);
  }

  async updateDet(empresasdetId: number, empresaId: number, dto: UpdateEmpresaDetDto, currentUser: string) {
    const entity = await this.findOneDet(empresasdetId, empresaId);
    Object.assign(entity, dto, {
      usuarioUpdated: currentUser,
      fechaUpdated: new Date(),
    });
    return this.detRepo.save(entity);
  }

  async removeDet(empresasdetId: number, empresaId: number) {
    const entity = await this.findOneDet(empresasdetId, empresaId);
    await this.detRepo.remove(entity);
    return { deleted: true };
  }
}

```

---

## 📄 src\modules\companies\dto\empresa.dto.ts

```typescript
import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEmpresaDto {
  @ApiProperty({ description: 'Nombre de la empresa' })
  @IsString() @IsNotEmpty()
  descripcion: string;

  @ApiProperty({ required: false, description: 'Mensaje de factura' })
  @IsString() @IsOptional()
  msjfactura?: string;

  @ApiProperty({ required: false, description: 'Mensaje de devolución de factura' })
  @IsString() @IsOptional()
  msjdevfactura?: string;
}

export class UpdateEmpresaDto {
  @ApiProperty({ required: false, description: 'Nombre de la empresa' })
  @IsString() @IsOptional()
  descripcion?: string;

  @ApiProperty({ required: false, description: 'Mensaje de factura' })
  @IsString() @IsOptional()
  msjfactura?: string;

  @ApiProperty({ required: false, description: 'Mensaje de devolución de factura' })
  @IsString() @IsOptional()
  msjdevfactura?: string;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Estado activo' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;
}

```

---

## 📄 src\modules\companies\dto\empresasdet.dto.ts

```typescript
import { IsString, IsNotEmpty, IsEnum, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEmpresaDetDto {
  @ApiProperty({ enum: ['TELEFONO', 'DIRECCION', 'CORREO', 'RUC', 'RTN', 'WEBSITE', 'REDESOCIAL'] })
  @IsEnum(['TELEFONO', 'DIRECCION', 'CORREO', 'RUC', 'RTN', 'WEBSITE', 'REDESOCIAL'])
  @IsNotEmpty()
  tipo: string;

  @ApiProperty({ description: 'Valor del dato' })
  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @ApiProperty({ required: false, enum: ['S', 'N'], default: 'S' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;

  @ApiProperty({ required: false })
  @IsNumber() @IsOptional()
  empresaId?: number;
}

export class UpdateEmpresaDetDto extends CreateEmpresaDetDto {}

```

---

## 📄 src\modules\companies\entities\empresa.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Tsucursal } from '../../sucursales/entities/sucursal.entity';
import { Tusuarios } from '../../users/entities/usuario.entity';

@Entity('tempresas')
export class Tempresas {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'empresaId' })
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'datetime' })
  fechasistema: Date;

  @ApiProperty()
  @Column({ type: 'varchar', length: 200, default: 'LA FACTURA ES BENEFICIO DE TODOS' })
  msjfactura: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 200, default: 'NO SE ACEPTAN DEVOLUCIONES O CAMBIOS DESPUES DE 15 DIAS' })
  msjdevfactura: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;

  @ApiProperty({ type: () => [Tsucursal], required: false })
  @OneToMany(() => Tsucursal, (s) => s.empresa)
  sucursales: Tsucursal[];

  @ApiProperty({ type: () => [Tusuarios], required: false })
  @OneToMany(() => Tusuarios, (u) => u.empresa)
  usuarios: Tusuarios[];
}

```

---

## 📄 src\modules\companies\entities\empresasdet.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('tempresasdet')
export class TempresasDet {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'tempresasdetId' })
  empresasdetId: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['TELEFONO', 'DIRECCION', 'CORREO', 'RUC', 'RTN', 'WEBSITE', 'REDESOCIAL'] })
  tipo: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 80 })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column({ type: 'int' })
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\contabilidad\contabilidad.controller.ts

```typescript
import {
  Controller, Get, Post, Put, Body, Param, Query,
  UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ContabilidadService } from './contabilidad.service';
import {
  CreateTcoctacontablesDto, UpdateTcoctacontablesDto,
  CreateCopdamaeDto, UpdateCopdamaeDto,
  CreateCopdadetDto, UpdateCopdadetDto,
} from './dto/contabilidad.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Contabilidad')
@ApiBearerAuth()
@Controller('contabilidad')
@UseGuards(JwtAuthGuard)
export class ContabilidadController {
  constructor(private readonly service: ContabilidadService) {}

  // ===== Ctacontables =====

  @Get('ctacontables')
  @ApiOperation({ summary: 'Listar cuentas contables' })
  @ApiResponse({ status: 200, description: 'Lista de cuentas contables obtenida exitosamente' })
  findAllCtacontables(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllCtacontables(empresaId);
  }

  @Get('ctacontables/:id')
  @ApiOperation({ summary: 'Obtener cuenta contable por ID' })
  @ApiResponse({ status: 200, description: 'Cuenta contable encontrada' })
  @ApiResponse({ status: 404, description: 'Cuenta contable no encontrada' })
  findCtacontable(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findCtacontable(id, empresaId);
  }

  @Post('ctacontables')
  @ApiOperation({ summary: 'Crear cuenta contable' })
  @ApiResponse({ status: 201, description: 'Cuenta contable creada exitosamente' })
  createCtacontable(@Body() dto: CreateTcoctacontablesDto, @CurrentUser() user: any) {
    return this.service.createCtacontable(dto, user.usuario);
  }

  @Put('ctacontables/:id')
  @ApiOperation({ summary: 'Actualizar cuenta contable' })
  @ApiResponse({ status: 200, description: 'Cuenta contable actualizada exitosamente' })
  updateCtacontable(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateTcoctacontablesDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateCtacontable(id, empresaId, dto, user.usuario);
  }

  @Put('ctacontables/:id/remove')
  @ApiOperation({ summary: 'Eliminar cuenta contable' })
  @ApiResponse({ status: 200, description: 'Cuenta contable eliminada exitosamente' })
  removeCtacontable(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeCtacontable(id, empresaId);
  }

  // ===== Grupo Contable =====

  @Get('grupocontable')
  @ApiOperation({ summary: 'Listar grupos contables' })
  @ApiResponse({ status: 200, description: 'Lista de grupos contables obtenida exitosamente' })
  findAllGrupocontable(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllGrupocontable(empresaId);
  }

  @Get('grupocontable/:id')
  @ApiOperation({ summary: 'Obtener grupo contable por ID' })
  @ApiResponse({ status: 200, description: 'Grupo contable encontrado' })
  @ApiResponse({ status: 404, description: 'Grupo contable no encontrado' })
  findGrupocontable(@Param('id', ParseIntPipe) id: number) {
    return this.service.findGrupocontable(id);
  }

  @Post('grupocontable')
  @ApiOperation({ summary: 'Crear grupo contable' })
  @ApiResponse({ status: 201, description: 'Grupo contable creado exitosamente' })
  createGrupocontable(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createGrupocontable(dto, user.usuario);
  }

  @Put('grupocontable/:id')
  @ApiOperation({ summary: 'Actualizar grupo contable' })
  @ApiResponse({ status: 200, description: 'Grupo contable actualizado exitosamente' })
  updateGrupocontable(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateGrupocontable(id, dto, user.usuario);
  }

  @Put('grupocontable/:id/remove')
  @ApiOperation({ summary: 'Eliminar grupo contable' })
  @ApiResponse({ status: 200, description: 'Grupo contable eliminado exitosamente' })
  removeGrupocontable(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeGrupocontable(id);
  }

  // ===== Plantilla PDAMAE =====

  @Get('plantillapdamae')
  @ApiOperation({ summary: 'Listar plantillas pda maestro' })
  @ApiResponse({ status: 200, description: 'Lista de plantillas obtenida exitosamente' })
  findAllPlantillapdamae(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllPlantillapdamae(empresaId);
  }

  @Get('plantillapdamae/:id')
  @ApiOperation({ summary: 'Obtener plantilla pda maestro por ID' })
  @ApiResponse({ status: 200, description: 'Plantilla encontrada' })
  @ApiResponse({ status: 404, description: 'Plantilla no encontrada' })
  findPlantillapdamae(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findPlantillapdamae(id, empresaId);
  }

  @Post('plantillapdamae')
  @ApiOperation({ summary: 'Crear plantilla pda maestro' })
  @ApiResponse({ status: 201, description: 'Plantilla creada exitosamente' })
  createPlantillapdamae(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createPlantillapdamae(dto, user.usuario);
  }

  @Put('plantillapdamae/:id')
  @ApiOperation({ summary: 'Actualizar plantilla pda maestro' })
  @ApiResponse({ status: 200, description: 'Plantilla actualizada exitosamente' })
  updatePlantillapdamae(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updatePlantillapdamae(id, empresaId, dto, user.usuario);
  }

  @Put('plantillapdamae/:id/remove')
  @ApiOperation({ summary: 'Eliminar plantilla pda maestro' })
  @ApiResponse({ status: 200, description: 'Plantilla eliminada exitosamente' })
  removePlantillapdamae(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removePlantillapdamae(id, empresaId);
  }

  // ===== Plantilla PDADET =====

  @Get('plantillapdadet')
  @ApiOperation({ summary: 'Listar plantillas pda detalle' })
  @ApiResponse({ status: 200, description: 'Lista de plantillas detalle obtenida exitosamente' })
  findAllPlantillapdadet(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllPlantillapdadet(empresaId);
  }

  @Get('plantillapdadet/:id')
  @ApiOperation({ summary: 'Obtener plantilla pda detalle por ID' })
  @ApiResponse({ status: 200, description: 'Plantilla detalle encontrada' })
  @ApiResponse({ status: 404, description: 'Plantilla detalle no encontrada' })
  findPlantillapdadet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findPlantillapdadet(id, empresaId);
  }

  @Post('plantillapdadet')
  @ApiOperation({ summary: 'Crear plantilla pda detalle' })
  @ApiResponse({ status: 201, description: 'Plantilla detalle creada exitosamente' })
  createPlantillapdadet(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createPlantillapdadet(dto, user.usuario);
  }

  @Put('plantillapdadet/:id')
  @ApiOperation({ summary: 'Actualizar plantilla pda detalle' })
  @ApiResponse({ status: 200, description: 'Plantilla detalle actualizada exitosamente' })
  updatePlantillapdadet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updatePlantillapdadet(id, empresaId, dto, user.usuario);
  }

  @Put('plantillapdadet/:id/remove')
  @ApiOperation({ summary: 'Eliminar plantilla pda detalle' })
  @ApiResponse({ status: 200, description: 'Plantilla detalle eliminada exitosamente' })
  removePlantillapdadet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removePlantillapdadet(id, empresaId);
  }

  // ===== Saldos Cta =====

  @Get('saldoscta')
  @ApiOperation({ summary: 'Listar saldos de cuentas contables' })
  @ApiResponse({ status: 200, description: 'Lista de saldos obtenida exitosamente' })
  findAllSaldoscta(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllSaldoscta(empresaId);
  }

  @Get('saldoscta/:id')
  @ApiOperation({ summary: 'Obtener saldo de cuenta contable por ID' })
  @ApiResponse({ status: 200, description: 'Saldo encontrado' })
  @ApiResponse({ status: 404, description: 'Saldo no encontrado' })
  findSaldoscta(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findSaldoscta(id, empresaId);
  }

  @Post('saldoscta')
  @ApiOperation({ summary: 'Crear saldo de cuenta contable' })
  @ApiResponse({ status: 201, description: 'Saldo creado exitosamente' })
  createSaldoscta(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createSaldoscta(dto, user.usuario);
  }

  @Put('saldoscta/:id')
  @ApiOperation({ summary: 'Actualizar saldo de cuenta contable' })
  @ApiResponse({ status: 200, description: 'Saldo actualizado exitosamente' })
  updateSaldoscta(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateSaldoscta(id, empresaId, dto, user.usuario);
  }

  // ===== Cierre Table =====

  @Get('cierrectable')
  @ApiOperation({ summary: 'Listar cierres de tabla' })
  @ApiResponse({ status: 200, description: 'Lista de cierres de tabla obtenida exitosamente' })
  findAllCierrectable(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllCierrectable(empresaId);
  }

  @Get('cierrectable/:id')
  @ApiOperation({ summary: 'Obtener cierre de tabla por ID' })
  @ApiResponse({ status: 200, description: 'Cierre de tabla encontrado' })
  @ApiResponse({ status: 404, description: 'Cierre de tabla no encontrado' })
  findCierrectable(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findCierrectable(id, empresaId);
  }

  @Post('cierrectable')
  @ApiOperation({ summary: 'Crear cierre de tabla' })
  @ApiResponse({ status: 201, description: 'Cierre de tabla creado exitosamente' })
  createCierrectable(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createCierrectable(dto, user.usuario);
  }

  @Put('cierrectable/:id')
  @ApiOperation({ summary: 'Actualizar cierre de tabla' })
  @ApiResponse({ status: 200, description: 'Cierre de tabla actualizado exitosamente' })
  updateCierrectable(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateCierrectable(id, empresaId, dto, user.usuario);
  }

  @Put('cierrectable/:id/remove')
  @ApiOperation({ summary: 'Eliminar cierre de tabla' })
  @ApiResponse({ status: 200, description: 'Cierre de tabla eliminado exitosamente' })
  removeCierrectable(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeCierrectable(id, empresaId);
  }

  // ===== Repliquidez =====

  @Get('repliquidez')
  @ApiOperation({ summary: 'Listar reportes de liquidez' })
  @ApiResponse({ status: 200, description: 'Lista de reportes de liquidez obtenida exitosamente' })
  findAllRepliquidez(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllRepliquidez(empresaId);
  }

  @Get('repliquidez/:id')
  @ApiOperation({ summary: 'Obtener reporte de liquidez por ID' })
  @ApiResponse({ status: 200, description: 'Reporte de liquidez encontrado' })
  @ApiResponse({ status: 404, description: 'Reporte de liquidez no encontrado' })
  findRepliquidez(@Param('id', ParseIntPipe) id: number) {
    return this.service.findRepliquidez(id);
  }

  @Post('repliquidez')
  @ApiOperation({ summary: 'Crear reporte de liquidez' })
  @ApiResponse({ status: 201, description: 'Reporte de liquidez creado exitosamente' })
  createRepliquidez(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createRepliquidez(dto, user.usuario);
  }

  @Put('repliquidez/:id')
  @ApiOperation({ summary: 'Actualizar reporte de liquidez' })
  @ApiResponse({ status: 200, description: 'Reporte de liquidez actualizado exitosamente' })
  updateRepliquidez(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateRepliquidez(id, dto, user.usuario);
  }

  @Put('repliquidez/:id/remove')
  @ApiOperation({ summary: 'Eliminar reporte de liquidez' })
  @ApiResponse({ status: 200, description: 'Reporte de liquidez eliminado exitosamente' })
  removeRepliquidez(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeRepliquidez(id);
  }

  // ===== Factor de Cambio =====

  @Get('factordecambio')
  @ApiOperation({ summary: 'Listar factores de cambio' })
  @ApiResponse({ status: 200, description: 'Lista de factores de cambio obtenida exitosamente' })
  findAllFactordecambio(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllFactordecambio(empresaId);
  }

  @Get('factordecambio/:id')
  @ApiOperation({ summary: 'Obtener factor de cambio por ID' })
  @ApiResponse({ status: 200, description: 'Factor de cambio encontrado' })
  @ApiResponse({ status: 404, description: 'Factor de cambio no encontrado' })
  findFactordecambio(@Param('id', ParseIntPipe) id: number) {
    return this.service.findFactordecambio(id);
  }

  @Post('factordecambio')
  @ApiOperation({ summary: 'Crear factor de cambio' })
  @ApiResponse({ status: 201, description: 'Factor de cambio creado exitosamente' })
  createFactordecambio(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createFactordecambio(dto, user.usuario);
  }

  @Put('factordecambio/:id')
  @ApiOperation({ summary: 'Actualizar factor de cambio' })
  @ApiResponse({ status: 200, description: 'Factor de cambio actualizado exitosamente' })
  updateFactordecambio(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateFactordecambio(id, dto, user.usuario);
  }

  // ===== Plantilla Balances MAE =====

  @Get('plantillabalancesmae')
  @ApiOperation({ summary: 'Listar plantillas de balances maestro' })
  @ApiResponse({ status: 200, description: 'Lista de plantillas de balances obtenida exitosamente' })
  findAllPlantillabalancesmae(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllPlantillabalancesmae(empresaId);
  }

  @Get('plantillabalancesmae/:id')
  @ApiOperation({ summary: 'Obtener plantilla de balances maestro por ID' })
  @ApiResponse({ status: 200, description: 'Plantilla de balances encontrada' })
  @ApiResponse({ status: 404, description: 'Plantilla de balances no encontrada' })
  findPlantillabalancesmae(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findPlantillabalancesmae(id, empresaId);
  }

  @Post('plantillabalancesmae')
  @ApiOperation({ summary: 'Crear plantilla de balances maestro' })
  @ApiResponse({ status: 201, description: 'Plantilla de balances creada exitosamente' })
  createPlantillabalancesmae(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createPlantillabalancesmae(dto, user.usuario);
  }

  @Put('plantillabalancesmae/:id')
  @ApiOperation({ summary: 'Actualizar plantilla de balances maestro' })
  @ApiResponse({ status: 200, description: 'Plantilla de balances actualizada exitosamente' })
  updatePlantillabalancesmae(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updatePlantillabalancesmae(id, empresaId, dto, user.usuario);
  }

  @Put('plantillabalancesmae/:id/remove')
  @ApiOperation({ summary: 'Eliminar plantilla de balances maestro' })
  @ApiResponse({ status: 200, description: 'Plantilla de balances eliminada exitosamente' })
  removePlantillabalancesmae(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removePlantillabalancesmae(id, empresaId);
  }

  // ===== Plantilla Balances DET =====

  @Get('plantillabalancesdet')
  @ApiOperation({ summary: 'Listar plantillas de balances detalle' })
  @ApiResponse({ status: 200, description: 'Lista de plantillas de balances detalle obtenida exitosamente' })
  findAllPlantillabalancesdet(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllPlantillabalancesdet(empresaId);
  }

  @Get('plantillabalancesdet/:id')
  @ApiOperation({ summary: 'Obtener plantilla de balances detalle por ID' })
  @ApiResponse({ status: 200, description: 'Plantilla de balances detalle encontrada' })
  @ApiResponse({ status: 404, description: 'Plantilla de balances detalle no encontrada' })
  findPlantillabalancesdet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findPlantillabalancesdet(id, empresaId);
  }

  @Post('plantillabalancesdet')
  @ApiOperation({ summary: 'Crear plantilla de balances detalle' })
  @ApiResponse({ status: 201, description: 'Plantilla de balances detalle creada exitosamente' })
  createPlantillabalancesdet(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createPlantillabalancesdet(dto, user.usuario);
  }

  @Put('plantillabalancesdet/:id')
  @ApiOperation({ summary: 'Actualizar plantilla de balances detalle' })
  @ApiResponse({ status: 200, description: 'Plantilla de balances detalle actualizada exitosamente' })
  updatePlantillabalancesdet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updatePlantillabalancesdet(id, empresaId, dto, user.usuario);
  }

  @Put('plantillabalancesdet/:id/remove')
  @ApiOperation({ summary: 'Eliminar plantilla de balances detalle' })
  @ApiResponse({ status: 200, description: 'Plantilla de balances detalle eliminada exitosamente' })
  removePlantillabalancesdet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removePlantillabalancesdet(id, empresaId);
  }

  // ===== Rep Diarios =====

  @Get('repdiarios')
  @ApiOperation({ summary: 'Listar reportes diarios' })
  @ApiResponse({ status: 200, description: 'Lista de reportes diarios obtenida exitosamente' })
  findAllRepdiarios(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllRepdiarios(empresaId);
  }

  @Get('repdiarios/:id')
  @ApiOperation({ summary: 'Obtener reporte diario por ID' })
  @ApiResponse({ status: 200, description: 'Reporte diario encontrado' })
  @ApiResponse({ status: 404, description: 'Reporte diario no encontrado' })
  findRepdiarios(@Param('id', ParseIntPipe) id: number) {
    return this.service.findRepdiarios(id);
  }

  @Post('repdiarios')
  @ApiOperation({ summary: 'Crear reporte diario' })
  @ApiResponse({ status: 201, description: 'Reporte diario creado exitosamente' })
  createRepdiarios(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createRepdiarios(dto, user.usuario);
  }

  @Put('repdiarios/:id')
  @ApiOperation({ summary: 'Actualizar reporte diario' })
  @ApiResponse({ status: 200, description: 'Reporte diario actualizado exitosamente' })
  updateRepdiarios(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateRepdiarios(id, dto, user.usuario);
  }

  @Put('repdiarios/:id/remove')
  @ApiOperation({ summary: 'Eliminar reporte diario' })
  @ApiResponse({ status: 200, description: 'Reporte diario eliminado exitosamente' })
  removeRepdiarios(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeRepdiarios(id);
  }

  // ===== Rep Balances =====

  @Get('repbalances')
  @ApiOperation({ summary: 'Listar reportes de balances' })
  @ApiResponse({ status: 200, description: 'Lista de reportes de balances obtenida exitosamente' })
  findAllRepbalances(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllRepbalances(empresaId);
  }

  @Get('repbalances/:id')
  @ApiOperation({ summary: 'Obtener reporte de balance por ID' })
  @ApiResponse({ status: 200, description: 'Reporte de balance encontrado' })
  @ApiResponse({ status: 404, description: 'Reporte de balance no encontrado' })
  findRepbalances(@Param('id', ParseIntPipe) id: number) {
    return this.service.findRepbalances(id);
  }

  @Post('repbalances')
  @ApiOperation({ summary: 'Crear reporte de balance' })
  @ApiResponse({ status: 201, description: 'Reporte de balance creado exitosamente' })
  createRepbalances(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createRepbalances(dto, user.usuario);
  }

  @Put('repbalances/:id')
  @ApiOperation({ summary: 'Actualizar reporte de balance' })
  @ApiResponse({ status: 200, description: 'Reporte de balance actualizado exitosamente' })
  updateRepbalances(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateRepbalances(id, dto, user.usuario);
  }

  // ===== Periodo Cta Table =====

  @Get('periodoctable')
  @ApiOperation({ summary: 'Listar períodos contables' })
  @ApiResponse({ status: 200, description: 'Lista de períodos contables obtenida exitosamente' })
  findAllPeriodoctable(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllPeriodoctable(empresaId);
  }

  @Get('periodoctable/:id')
  @ApiOperation({ summary: 'Obtener período contable por ID' })
  @ApiResponse({ status: 200, description: 'Período contable encontrado' })
  @ApiResponse({ status: 404, description: 'Período contable no encontrado' })
  findPeriodoctable(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findPeriodoctable(id, empresaId);
  }

  @Post('periodoctable')
  @ApiOperation({ summary: 'Crear período contable' })
  @ApiResponse({ status: 201, description: 'Período contable creado exitosamente' })
  createPeriodoctable(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createPeriodoctable(dto, user.usuario);
  }

  @Put('periodoctable/:id')
  @ApiOperation({ summary: 'Actualizar período contable' })
  @ApiResponse({ status: 200, description: 'Período contable actualizado exitosamente' })
  updatePeriodoctable(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updatePeriodoctable(id, empresaId, dto, user.usuario);
  }

  @Put('periodoctable/:id/remove')
  @ApiOperation({ summary: 'Eliminar período contable' })
  @ApiResponse({ status: 200, description: 'Período contable eliminado exitosamente' })
  removePeriodoctable(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removePeriodoctable(id, empresaId);
  }

  // ===== Copdamae =====

  @Get('copdamae')
  @ApiOperation({ summary: 'Listar copdamae' })
  @ApiResponse({ status: 200, description: 'Lista de copdamae obtenida exitosamente' })
  findAllCopdamae(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllCopdamae(empresaId);
  }

  @Get('copdamae/:id')
  @ApiOperation({ summary: 'Obtener copdamae por ID' })
  @ApiResponse({ status: 200, description: 'Copdamae encontrado' })
  @ApiResponse({ status: 404, description: 'Copdamae no encontrado' })
  findCopdamae(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findCopdamae(id, empresaId);
  }

  @Post('copdamae')
  @ApiOperation({ summary: 'Crear copdamae' })
  @ApiResponse({ status: 201, description: 'Copdamae creado exitosamente' })
  createCopdamae(@Body() dto: CreateCopdamaeDto, @CurrentUser() user: any) {
    return this.service.createCopdamae(dto, user.usuario);
  }

  @Put('copdamae/:id')
  @ApiOperation({ summary: 'Actualizar copdamae' })
  @ApiResponse({ status: 200, description: 'Copdamae actualizado exitosamente' })
  updateCopdamae(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateCopdamaeDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateCopdamae(id, empresaId, dto, user.usuario);
  }

  @Put('copdamae/:id/remove')
  @ApiOperation({ summary: 'Eliminar copdamae' })
  @ApiResponse({ status: 200, description: 'Copdamae eliminado exitosamente' })
  removeCopdamae(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeCopdamae(id, empresaId);
  }

  // ===== Copdadet =====

  @Get('copdadet')
  @ApiOperation({ summary: 'Listar copdadet' })
  @ApiResponse({ status: 200, description: 'Lista de copdadet obtenida exitosamente' })
  findAllCopdadet(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllCopdadet(empresaId);
  }

  @Get('copdadet/:id')
  @ApiOperation({ summary: 'Obtener copdadet por ID' })
  @ApiResponse({ status: 200, description: 'Copdadet encontrado' })
  @ApiResponse({ status: 404, description: 'Copdadet no encontrado' })
  findCopdadet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findCopdadet(id, empresaId);
  }

  @Post('copdadet')
  @ApiOperation({ summary: 'Crear copdadet' })
  @ApiResponse({ status: 201, description: 'Copdadet creado exitosamente' })
  createCopdadet(@Body() dto: CreateCopdadetDto, @CurrentUser() user: any) {
    return this.service.createCopdadet(dto, user.usuario);
  }

  @Put('copdadet/:id')
  @ApiOperation({ summary: 'Actualizar copdadet' })
  @ApiResponse({ status: 200, description: 'Copdadet actualizado exitosamente' })
  updateCopdadet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateCopdadetDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateCopdadet(id, empresaId, dto, user.usuario);
  }

  @Put('copdadet/:id/remove')
  @ApiOperation({ summary: 'Eliminar copdadet' })
  @ApiResponse({ status: 200, description: 'Copdadet eliminado exitosamente' })
  removeCopdadet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeCopdadet(id, empresaId);
  }

  // ===== Mov Cta =====

  @Get('movcta')
  @ApiOperation({ summary: 'Listar movimientos de cuenta' })
  @ApiResponse({ status: 200, description: 'Lista de movimientos de cuenta obtenida exitosamente' })
  findAllMovcta(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllMovcta(empresaId);
  }

  @Get('movcta/:id')
  @ApiOperation({ summary: 'Obtener movimiento de cuenta por ID' })
  @ApiResponse({ status: 200, description: 'Movimiento de cuenta encontrado' })
  @ApiResponse({ status: 404, description: 'Movimiento de cuenta no encontrado' })
  findMovcta(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findMovcta(id, empresaId);
  }

  @Post('movcta')
  @ApiOperation({ summary: 'Crear movimiento de cuenta' })
  @ApiResponse({ status: 201, description: 'Movimiento de cuenta creado exitosamente' })
  createMovcta(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createMovcta(dto, user.usuario);
  }

  @Put('movcta/:id')
  @ApiOperation({ summary: 'Actualizar movimiento de cuenta' })
  @ApiResponse({ status: 200, description: 'Movimiento de cuenta actualizado exitosamente' })
  updateMovcta(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateMovcta(id, empresaId, dto, user.usuario);
  }

  // ===== Nivel Cta =====

  @Get('nivelcta')
  @ApiOperation({ summary: 'Listar niveles de cuenta' })
  @ApiResponse({ status: 200, description: 'Lista de niveles de cuenta obtenida exitosamente' })
  findAllNivelcta(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllNivelcta(empresaId);
  }

  @Get('nivelcta/:id')
  @ApiOperation({ summary: 'Obtener nivel de cuenta por ID' })
  @ApiResponse({ status: 200, description: 'Nivel de cuenta encontrado' })
  @ApiResponse({ status: 404, description: 'Nivel de cuenta no encontrado' })
  findNivelcta(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findNivelcta(id, empresaId);
  }

  @Post('nivelcta')
  @ApiOperation({ summary: 'Crear nivel de cuenta' })
  @ApiResponse({ status: 201, description: 'Nivel de cuenta creado exitosamente' })
  createNivelcta(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createNivelcta(dto, user.usuario);
  }

  @Put('nivelcta/:id')
  @ApiOperation({ summary: 'Actualizar nivel de cuenta' })
  @ApiResponse({ status: 200, description: 'Nivel de cuenta actualizado exitosamente' })
  updateNivelcta(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateNivelcta(id, empresaId, dto, user.usuario);
  }

  @Put('nivelcta/:id/remove')
  @ApiOperation({ summary: 'Eliminar nivel de cuenta' })
  @ApiResponse({ status: 200, description: 'Nivel de cuenta eliminado exitosamente' })
  removeNivelcta(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeNivelcta(id, empresaId);
  }

  // ===== Naturaleza Cta =====

  @Get('naturalezacta')
  @ApiOperation({ summary: 'Listar naturalezas de cuenta' })
  @ApiResponse({ status: 200, description: 'Lista de naturalezas de cuenta obtenida exitosamente' })
  findAllNaturalezacta(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllNaturalezacta(empresaId);
  }

  @Get('naturalezacta/:id')
  @ApiOperation({ summary: 'Obtener naturaleza de cuenta por ID' })
  @ApiResponse({ status: 200, description: 'Naturaleza de cuenta encontrada' })
  @ApiResponse({ status: 404, description: 'Naturaleza de cuenta no encontrada' })
  findNaturalezacta(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findNaturalezacta(id, empresaId);
  }

  @Post('naturalezacta')
  @ApiOperation({ summary: 'Crear naturaleza de cuenta' })
  @ApiResponse({ status: 201, description: 'Naturaleza de cuenta creada exitosamente' })
  createNaturalezacta(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createNaturalezacta(dto, user.usuario);
  }

  @Put('naturalezacta/:id')
  @ApiOperation({ summary: 'Actualizar naturaleza de cuenta' })
  @ApiResponse({ status: 200, description: 'Naturaleza de cuenta actualizada exitosamente' })
  updateNaturalezacta(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateNaturalezacta(id, empresaId, dto, user.usuario);
  }

  // ===== Impuesto Vecinal =====

  @Get('impuestovecinal')
  @ApiOperation({ summary: 'Listar impuestos vecinales' })
  @ApiResponse({ status: 200, description: 'Lista de impuestos vecinales obtenida exitosamente' })
  findAllImpuestovecinal(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllImpuestovecinal(empresaId);
  }

  @Get('impuestovecinal/:id')
  @ApiOperation({ summary: 'Obtener impuesto vecinal por ID' })
  @ApiResponse({ status: 200, description: 'Impuesto vecinal encontrado' })
  @ApiResponse({ status: 404, description: 'Impuesto vecinal no encontrado' })
  findImpuestovecinal(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findImpuestovecinal(id, empresaId);
  }

  @Post('impuestovecinal')
  @ApiOperation({ summary: 'Crear impuesto vecinal' })
  @ApiResponse({ status: 201, description: 'Impuesto vecinal creado exitosamente' })
  createImpuestovecinal(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createImpuestovecinal(dto, user.usuario);
  }

  @Put('impuestovecinal/:id')
  @ApiOperation({ summary: 'Actualizar impuesto vecinal' })
  @ApiResponse({ status: 200, description: 'Impuesto vecinal actualizado exitosamente' })
  updateImpuestovecinal(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateImpuestovecinal(id, empresaId, dto, user.usuario);
  }

  @Put('impuestovecinal/:id/remove')
  @ApiOperation({ summary: 'Eliminar impuesto vecinal' })
  @ApiResponse({ status: 200, description: 'Impuesto vecinal eliminado exitosamente' })
  removeImpuestovecinal(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeImpuestovecinal(id, empresaId);
  }

  // ===== Tipos Doc Fiscal =====

  @Get('tipos-doc-fiscal')
  @ApiOperation({ summary: 'Listar tipos de documento fiscal' })
  @ApiResponse({ status: 200, description: 'Lista de tipos de documento fiscal obtenida exitosamente' })
  findAllTipoDocFiscal(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllTipoDocFiscal(empresaId);
  }

  @Get('tipos-doc-fiscal/:id')
  @ApiOperation({ summary: 'Obtener tipo de documento fiscal por ID' })
  @ApiResponse({ status: 200, description: 'Tipo de documento fiscal encontrado' })
  @ApiResponse({ status: 404, description: 'Tipo de documento fiscal no encontrado' })
  findTipoDocFiscal(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findTipoDocFiscal(id, empresaId);
  }

  @Post('tipos-doc-fiscal')
  @ApiOperation({ summary: 'Crear tipo de documento fiscal' })
  @ApiResponse({ status: 201, description: 'Tipo de documento fiscal creado exitosamente' })
  createTipoDocFiscal(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createTipoDocFiscal(dto, user.usuario);
  }

  @Put('tipos-doc-fiscal/:id')
  @ApiOperation({ summary: 'Actualizar tipo de documento fiscal' })
  @ApiResponse({ status: 200, description: 'Tipo de documento fiscal actualizado exitosamente' })
  updateTipoDocFiscal(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateTipoDocFiscal(id, empresaId, dto, user.usuario);
  }
}

```

---

## 📄 src\modules\contabilidad\contabilidad.module.ts

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tcoctacontables } from './entities/tcoctacontables.entity';
import { Tcogrupocontable } from './entities/tcogrupocontable.entity';
import { Tcoplantillapdamae } from './entities/tcoplantillapdamae.entity';
import { Tcoplantillapdadet } from './entities/tcoplantillapdadet.entity';
import { Cosaldoscta } from './entities/cosaldoscta.entity';
import { Cocierrectable } from './entities/cocierrectable.entity';
import { Tcorepliquidez } from './entities/tcorepliquidez.entity';
import { Cofactordecambios } from './entities/cofactordecambios.entity';
import { Tcoplantillabalancesmae } from './entities/tcoplantillabalancesmae.entity';
import { Tcoplantillabalancesdet } from './entities/tcoplantillabalancesdet.entity';
import { Tcorepdiarios } from './entities/tcorepdiarios.entity';
import { Tcorepbalances } from './entities/tcorepbalances.entity';
import { Coperiodoctable } from './entities/coperiodoctable.entity';
import { Copdamae } from './entities/copdamae.entity';
import { Copdadet } from './entities/copdadet.entity';
import { Comovcta } from './entities/comovcta.entity';
import { Tconivelcta } from './entities/tconivelcta.entity';
import { Tconaturalezacta } from './entities/tconaturalezacta.entity';
import { Tcoimpuestovecinal } from './entities/tcoimpuestovecinal.entity';
import { TCoTipoDocumentoFiscal } from './entities/tcotipodocumentofiscal.entity';
import { ContabilidadService } from './contabilidad.service';
import { ContabilidadController } from './contabilidad.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tcoctacontables,
      Tcogrupocontable,
      Tcoplantillapdamae,
      Tcoplantillapdadet,
      Cosaldoscta,
      Cocierrectable,
      Tcorepliquidez,
      Cofactordecambios,
      Tcoplantillabalancesmae,
      Tcoplantillabalancesdet,
      Tcorepdiarios,
      Tcorepbalances,
      Coperiodoctable,
      Copdamae,
      Copdadet,
      Comovcta,
      Tconivelcta,
      Tconaturalezacta,
      Tcoimpuestovecinal,
      TCoTipoDocumentoFiscal,
    ]),
  ],
  controllers: [ContabilidadController],
  providers: [ContabilidadService],
  exports: [ContabilidadService],
})
export class ContabilidadModule {}

```

---

## 📄 src\modules\contabilidad\contabilidad.service.ts

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ObjectLiteral } from 'typeorm';
import { Tcoctacontables } from './entities/tcoctacontables.entity';
import { Tcogrupocontable } from './entities/tcogrupocontable.entity';
import { Tcoplantillapdamae } from './entities/tcoplantillapdamae.entity';
import { Tcoplantillapdadet } from './entities/tcoplantillapdadet.entity';
import { Cosaldoscta } from './entities/cosaldoscta.entity';
import { Cocierrectable } from './entities/cocierrectable.entity';
import { Tcorepliquidez } from './entities/tcorepliquidez.entity';
import { Cofactordecambios } from './entities/cofactordecambios.entity';
import { Tcoplantillabalancesmae } from './entities/tcoplantillabalancesmae.entity';
import { Tcoplantillabalancesdet } from './entities/tcoplantillabalancesdet.entity';
import { Tcorepdiarios } from './entities/tcorepdiarios.entity';
import { Tcorepbalances } from './entities/tcorepbalances.entity';
import { Coperiodoctable } from './entities/coperiodoctable.entity';
import { Copdamae } from './entities/copdamae.entity';
import { Copdadet } from './entities/copdadet.entity';
import { Comovcta } from './entities/comovcta.entity';
import { Tconivelcta } from './entities/tconivelcta.entity';
import { Tconaturalezacta } from './entities/tconaturalezacta.entity';
import { Tcoimpuestovecinal } from './entities/tcoimpuestovecinal.entity';
import { TCoTipoDocumentoFiscal } from './entities/tcotipodocumentofiscal.entity';
import {
  CreateTcoctacontablesDto, UpdateTcoctacontablesDto,
  CreateCopdamaeDto, UpdateCopdamaeDto,
  CreateCopdadetDto, UpdateCopdadetDto,
} from './dto/contabilidad.dto';

@Injectable()
export class ContabilidadService {
  constructor(
    @InjectRepository(Tcoctacontables) private readonly ctacontablesRepo: Repository<Tcoctacontables>,
    @InjectRepository(Tcogrupocontable) private readonly grupocontableRepo: Repository<Tcogrupocontable>,
    @InjectRepository(Tcoplantillapdamae) private readonly plantillapdamaeRepo: Repository<Tcoplantillapdamae>,
    @InjectRepository(Tcoplantillapdadet) private readonly plantillapdadetRepo: Repository<Tcoplantillapdadet>,
    @InjectRepository(Cosaldoscta) private readonly saldosctaRepo: Repository<Cosaldoscta>,
    @InjectRepository(Cocierrectable) private readonly cierrectableRepo: Repository<Cocierrectable>,
    @InjectRepository(Tcorepliquidez) private readonly repliquidezRepo: Repository<Tcorepliquidez>,
    @InjectRepository(Cofactordecambios) private readonly factordecambioRepo: Repository<Cofactordecambios>,
    @InjectRepository(Tcoplantillabalancesmae) private readonly plantillabalancesmaeRepo: Repository<Tcoplantillabalancesmae>,
    @InjectRepository(Tcoplantillabalancesdet) private readonly plantillabalancesdetRepo: Repository<Tcoplantillabalancesdet>,
    @InjectRepository(Tcorepdiarios) private readonly repdiariosRepo: Repository<Tcorepdiarios>,
    @InjectRepository(Tcorepbalances) private readonly repbalancesRepo: Repository<Tcorepbalances>,
    @InjectRepository(Coperiodoctable) private readonly periodoctableRepo: Repository<Coperiodoctable>,
    @InjectRepository(Copdamae) private readonly copdamaeRepo: Repository<Copdamae>,
    @InjectRepository(Copdadet) private readonly copdadetRepo: Repository<Copdadet>,
    @InjectRepository(Comovcta) private readonly movctaRepo: Repository<Comovcta>,
    @InjectRepository(Tconivelcta) private readonly nivelctaRepo: Repository<Tconivelcta>,
    @InjectRepository(Tconaturalezacta) private readonly naturalezactaRepo: Repository<Tconaturalezacta>,
    @InjectRepository(Tcoimpuestovecinal) private readonly impuestovecinalRepo: Repository<Tcoimpuestovecinal>,
    @InjectRepository(TCoTipoDocumentoFiscal) private readonly tipoDocFiscalRepo: Repository<TCoTipoDocumentoFiscal>,
  ) {}

  private async findAllByEmpresa<T extends ObjectLiteral>(repo: Repository<T>, empresaId: number) {
    return repo.find({
      where: { empresaId } as unknown as FindOptionsWhere<T>,
    });
  }

  private async findOneById<T extends ObjectLiteral>(
    repo: Repository<T>,
    idField: string,
    id: number | string,
    empresaId: number,
    entityName: string,
  ) {
    const where = { [idField]: id, empresaId } as unknown as FindOptionsWhere<T>;
    const found = await repo.findOne({ where });
    if (!found) throw new NotFoundException(`${entityName} ${id} no encontrado`);
    return found;
  }

  private async findOneByIdNoEmpresa<T extends ObjectLiteral>(
    repo: Repository<T>,
    idField: string,
    id: number | string,
    entityName: string,
  ) {
    const where = { [idField]: id } as unknown as FindOptionsWhere<T>;
    const found = await repo.findOne({ where });
    if (!found) throw new NotFoundException(`${entityName} ${id} no encontrado`);
    return found;
  }

  private async createEntity<T extends ObjectLiteral>(
    repo: Repository<T>,
    dto: any,
    currentUser: string,
  ) {
    const entity = repo.create({
      ...dto,
      usuarioCreated: currentUser,
    });
    return repo.save(entity);
  }

  private async updateEntity<T extends ObjectLiteral>(
    repo: Repository<T>,
    idField: string,
    id: number | string,
    empresaId: number,
    dto: any,
    currentUser: string,
    entityName: string,
  ) {
    const entity = await this.findOneById(repo, idField, id, empresaId, entityName);
    Object.assign(entity, dto, {
      usuarioUpdated: currentUser,
      fechaUpdated: new Date(),
    });
    return repo.save(entity);
  }

  private async updateEntityNoEmpresa<T extends ObjectLiteral>(
    repo: Repository<T>,
    idField: string,
    id: number | string,
    dto: any,
    currentUser: string,
    entityName: string,
  ) {
    const entity = await this.findOneByIdNoEmpresa(repo, idField, id, entityName);
    Object.assign(entity, dto, {
      usuarioUpdated: currentUser,
      fechaUpdated: new Date(),
    });
    return repo.save(entity);
  }

  private async softDelete<T extends ObjectLiteral>(
    repo: Repository<T>,
    idField: string,
    id: number | string,
    empresaId: number,
    entityName: string,
  ) {
    const entity = await this.findOneById(repo, idField, id, empresaId, entityName);
    Object.assign(entity, {
      sn_activo: 'N',
      fechaUpdated: new Date(),
    });
    return repo.save(entity);
  }

  private async softDeleteNoEmpresa<T extends ObjectLiteral>(
    repo: Repository<T>,
    idField: string,
    id: number | string,
    entityName: string,
  ) {
    const entity = await this.findOneByIdNoEmpresa(repo, idField, id, entityName);
    Object.assign(entity, {
      sn_activo: 'N',
      fechaUpdated: new Date(),
    });
    return repo.save(entity);
  }

  async findAllCtacontables(empresaId: number) {
    return this.findAllByEmpresa(this.ctacontablesRepo, empresaId);
  }

  async findCtacontable(cuentacontablesId: number, empresaId: number) {
    return this.findOneById(this.ctacontablesRepo, 'cuentacontablesId', cuentacontablesId, empresaId, 'Cuenta Contable');
  }

  async createCtacontable(dto: CreateTcoctacontablesDto, currentUser: string) {
    return this.createEntity(this.ctacontablesRepo, dto, currentUser);
  }

  async updateCtacontable(cuentacontablesId: number, empresaId: number, dto: UpdateTcoctacontablesDto, currentUser: string) {
    return this.updateEntity(this.ctacontablesRepo, 'cuentacontablesId', cuentacontablesId, empresaId, dto, currentUser, 'Cuenta Contable');
  }

  async removeCtacontable(cuentacontablesId: number, empresaId: number) {
    return this.softDelete(this.ctacontablesRepo, 'cuentacontablesId', cuentacontablesId, empresaId, 'Cuenta Contable');
  }

  async findAllGrupocontable(empresaId: number) {
    return this.grupocontableRepo.find({
      where: { sn_activo: 'S' } as unknown as FindOptionsWhere<Tcogrupocontable>,
    });
  }

  async findGrupocontable(tcogrupocontableId: number) {
    return this.findOneByIdNoEmpresa(this.grupocontableRepo, 'tcogrupocontableId', tcogrupocontableId, 'Grupo Contable');
  }

  async createGrupocontable(dto: any, currentUser: string) {
    return this.createEntity(this.grupocontableRepo, dto, currentUser);
  }

  async updateGrupocontable(tcogrupocontableId: number, dto: any, currentUser: string) {
    return this.updateEntityNoEmpresa(this.grupocontableRepo, 'tcogrupocontableId', tcogrupocontableId, dto, currentUser, 'Grupo Contable');
  }

  async removeGrupocontable(tcogrupocontableId: number) {
    return this.softDeleteNoEmpresa(this.grupocontableRepo, 'tcogrupocontableId', tcogrupocontableId, 'Grupo Contable');
  }

  async findAllPlantillapdamae(empresaId: number) {
    return this.findAllByEmpresa(this.plantillapdamaeRepo, empresaId);
  }

  async findPlantillapdamae(tcoplantillapdamaeId: number, empresaId: number) {
    return this.findOneById(this.plantillapdamaeRepo, 'tcoplantillapdamaeId', tcoplantillapdamaeId, empresaId, 'Plantilla PDA Mae');
  }

  async createPlantillapdamae(dto: any, currentUser: string) {
    return this.createEntity(this.plantillapdamaeRepo, dto, currentUser);
  }

  async updatePlantillapdamae(tcoplantillapdamaeId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.plantillapdamaeRepo, 'tcoplantillapdamaeId', tcoplantillapdamaeId, empresaId, dto, currentUser, 'Plantilla PDA Mae');
  }

  async removePlantillapdamae(tcoplantillapdamaeId: number, empresaId: number) {
    return this.softDelete(this.plantillapdamaeRepo, 'tcoplantillapdamaeId', tcoplantillapdamaeId, empresaId, 'Plantilla PDA Mae');
  }

  async findAllPlantillapdadet(empresaId: number) {
    return this.findAllByEmpresa(this.plantillapdadetRepo, empresaId);
  }

  async findPlantillapdadet(tcoplantillapdadetId: number, empresaId: number) {
    return this.findOneById(this.plantillapdadetRepo, 'tcoplantillapdadetId', tcoplantillapdadetId, empresaId, 'Plantilla PDA Det');
  }

  async createPlantillapdadet(dto: any, currentUser: string) {
    return this.createEntity(this.plantillapdadetRepo, dto, currentUser);
  }

  async updatePlantillapdadet(tcoplantillapdadetId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.plantillapdadetRepo, 'tcoplantillapdadetId', tcoplantillapdadetId, empresaId, dto, currentUser, 'Plantilla PDA Det');
  }

  async removePlantillapdadet(tcoplantillapdadetId: number, empresaId: number) {
    return this.softDelete(this.plantillapdadetRepo, 'tcoplantillapdadetId', tcoplantillapdadetId, empresaId, 'Plantilla PDA Det');
  }

  async findAllSaldoscta(empresaId: number) {
    return this.findAllByEmpresa(this.saldosctaRepo, empresaId);
  }

  async findSaldoscta(cosaldosctaId: number, empresaId: number) {
    return this.findOneById(this.saldosctaRepo, 'cosaldosctaId', cosaldosctaId, empresaId, 'Saldo Cuenta');
  }

  async createSaldoscta(dto: any, currentUser: string) {
    return this.createEntity(this.saldosctaRepo, dto, currentUser);
  }

  async updateSaldoscta(cosaldosctaId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.saldosctaRepo, 'cosaldosctaId', cosaldosctaId, empresaId, dto, currentUser, 'Saldo Cuenta');
  }

  async findAllCierrectable(empresaId: number) {
    return this.findAllByEmpresa(this.cierrectableRepo, empresaId);
  }

  async findCierrectable(cierrectableId: number, empresaId: number) {
    return this.findOneById(this.cierrectableRepo, 'cierrectableId', cierrectableId, empresaId, 'Cierre Contable');
  }

  async createCierrectable(dto: any, currentUser: string) {
    return this.createEntity(this.cierrectableRepo, dto, currentUser);
  }

  async updateCierrectable(cierrectableId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.cierrectableRepo, 'cierrectableId', cierrectableId, empresaId, dto, currentUser, 'Cierre Contable');
  }

  async removeCierrectable(cierrectableId: number, empresaId: number) {
    return this.softDelete(this.cierrectableRepo, 'cierrectableId', cierrectableId, empresaId, 'Cierre Contable');
  }

  async findAllRepliquidez(empresaId: number) {
    return this.repliquidezRepo.find({
      where: { empresaId } as unknown as FindOptionsWhere<Tcorepliquidez>,
      order: { tcorepliquidezId: 'ASC' } as any,
    });
  }

  async findRepliquidez(tcorepliquidezId: number) {
    return this.findOneByIdNoEmpresa(this.repliquidezRepo, 'tcorepliquidezId', tcorepliquidezId, 'Reporte Liquidez');
  }

  async createRepliquidez(dto: any, currentUser: string) {
    return this.createEntity(this.repliquidezRepo, dto, currentUser);
  }

  async updateRepliquidez(tcorepliquidezId: number, dto: any, currentUser: string) {
    return this.updateEntityNoEmpresa(this.repliquidezRepo, 'tcorepliquidezId', tcorepliquidezId, dto, currentUser, 'Reporte Liquidez');
  }

  async removeRepliquidez(tcorepliquidezId: number) {
    return this.softDeleteNoEmpresa(this.repliquidezRepo, 'tcorepliquidezId', tcorepliquidezId, 'Reporte Liquidez');
  }

  async findAllFactordecambio(empresaId: number) {
    return this.factordecambioRepo.find({
      where: { empresaId } as unknown as FindOptionsWhere<Cofactordecambios>,
      order: { fecharegistro: 'DESC' } as any,
    });
  }

  async findFactordecambio(factordecambioId: number) {
    return this.findOneByIdNoEmpresa(this.factordecambioRepo, 'factordecambioId', factordecambioId, 'Factor de Cambio');
  }

  async createFactordecambio(dto: any, currentUser: string) {
    return this.createEntity(this.factordecambioRepo, dto, currentUser);
  }

  async updateFactordecambio(factordecambioId: number, dto: any, currentUser: string) {
    return this.updateEntityNoEmpresa(this.factordecambioRepo, 'factordecambioId', factordecambioId, dto, currentUser, 'Factor de Cambio');
  }

  async findAllPlantillabalancesmae(empresaId: number) {
    return this.findAllByEmpresa(this.plantillabalancesmaeRepo, empresaId);
  }

  async findPlantillabalancesmae(cocdefbalmaId: number, empresaId: number) {
    return this.findOneById(this.plantillabalancesmaeRepo, 'cocdefbalmaId', cocdefbalmaId, empresaId, 'Plantilla Balance Mae');
  }

  async createPlantillabalancesmae(dto: any, currentUser: string) {
    return this.createEntity(this.plantillabalancesmaeRepo, dto, currentUser);
  }

  async updatePlantillabalancesmae(cocdefbalmaId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.plantillabalancesmaeRepo, 'cocdefbalmaId', cocdefbalmaId, empresaId, dto, currentUser, 'Plantilla Balance Mae');
  }

  async removePlantillabalancesmae(cocdefbalmaId: number, empresaId: number) {
    return this.softDelete(this.plantillabalancesmaeRepo, 'cocdefbalmaId', cocdefbalmaId, empresaId, 'Plantilla Balance Mae');
  }

  async findAllPlantillabalancesdet(empresaId: number) {
    return this.findAllByEmpresa(this.plantillabalancesdetRepo, empresaId);
  }

  async findPlantillabalancesdet(tcoplantillabalancesdetid: number, empresaId: number) {
    return this.findOneById(this.plantillabalancesdetRepo, 'tcoplantillabalancesdetid', tcoplantillabalancesdetid, empresaId, 'Plantilla Balance Det');
  }

  async createPlantillabalancesdet(dto: any, currentUser: string) {
    return this.createEntity(this.plantillabalancesdetRepo, dto, currentUser);
  }

  async updatePlantillabalancesdet(tcoplantillabalancesdetid: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.plantillabalancesdetRepo, 'tcoplantillabalancesdetid', tcoplantillabalancesdetid, empresaId, dto, currentUser, 'Plantilla Balance Det');
  }

  async removePlantillabalancesdet(tcoplantillabalancesdetid: number, empresaId: number) {
    return this.softDelete(this.plantillabalancesdetRepo, 'tcoplantillabalancesdetid', tcoplantillabalancesdetid, empresaId, 'Plantilla Balance Det');
  }

  async findAllRepdiarios(empresaId: number) {
    return this.repdiariosRepo.find({
      where: { empresaId } as unknown as FindOptionsWhere<Tcorepdiarios>,
    });
  }

  async findRepdiarios(tcorepdiariosId: number) {
    return this.findOneByIdNoEmpresa(this.repdiariosRepo, 'tcorepdiariosId', tcorepdiariosId, 'Reporte Diario');
  }

  async createRepdiarios(dto: any, currentUser: string) {
    return this.createEntity(this.repdiariosRepo, dto, currentUser);
  }

  async updateRepdiarios(tcorepdiariosId: number, dto: any, currentUser: string) {
    return this.updateEntityNoEmpresa(this.repdiariosRepo, 'tcorepdiariosId', tcorepdiariosId, dto, currentUser, 'Reporte Diario');
  }

  async removeRepdiarios(tcorepdiariosId: number) {
    return this.softDeleteNoEmpresa(this.repdiariosRepo, 'tcorepdiariosId', tcorepdiariosId, 'Reporte Diario');
  }

  async findAllRepbalances(empresaId: number) {
    return this.repbalancesRepo.find({
      where: { empresaId } as unknown as FindOptionsWhere<Tcorepbalances>,
      order: { balcomId: 'ASC' } as any,
    });
  }

  async findRepbalances(balcomId: number) {
    return this.findOneByIdNoEmpresa(this.repbalancesRepo, 'balcomId', balcomId, 'Reporte Balance');
  }

  async createRepbalances(dto: any, currentUser: string) {
    return this.createEntity(this.repbalancesRepo, dto, currentUser);
  }

  async updateRepbalances(balcomId: number, dto: any, currentUser: string) {
    return this.updateEntityNoEmpresa(this.repbalancesRepo, 'balcomId', balcomId, dto, currentUser, 'Reporte Balance');
  }

  async findAllPeriodoctable(empresaId: number) {
    return this.findAllByEmpresa(this.periodoctableRepo, empresaId);
  }

  async findPeriodoctable(periodoscontableId: number, empresaId: number) {
    return this.findOneById(this.periodoctableRepo, 'periodoscontableId', periodoscontableId, empresaId, 'Periodo Contable');
  }

  async createPeriodoctable(dto: any, currentUser: string) {
    return this.createEntity(this.periodoctableRepo, dto, currentUser);
  }

  async updatePeriodoctable(periodoscontableId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.periodoctableRepo, 'periodoscontableId', periodoscontableId, empresaId, dto, currentUser, 'Periodo Contable');
  }

  async removePeriodoctable(periodoscontableId: number, empresaId: number) {
    return this.softDelete(this.periodoctableRepo, 'periodoscontableId', periodoscontableId, empresaId, 'Periodo Contable');
  }

  async findAllCopdamae(empresaId: number) {
    return this.copdamaeRepo.find({
      where: { empresaId } as unknown as FindOptionsWhere<Copdamae>,
      order: { fecharegistro: 'DESC' } as any,
    });
  }

  async findCopdamae(copdamaeId: number, empresaId: number) {
    return this.findOneById(this.copdamaeRepo, 'copdamaeId', copdamaeId, empresaId, 'Partida Mayor');
  }

  async createCopdamae(dto: CreateCopdamaeDto, currentUser: string) {
    return this.createEntity(this.copdamaeRepo, dto, currentUser);
  }

  async updateCopdamae(copdamaeId: number, empresaId: number, dto: UpdateCopdamaeDto, currentUser: string) {
    return this.updateEntity(this.copdamaeRepo, 'copdamaeId', copdamaeId, empresaId, dto, currentUser, 'Partida Mayor');
  }

  async removeCopdamae(copdamaeId: number, empresaId: number) {
    return this.softDelete(this.copdamaeRepo, 'copdamaeId', copdamaeId, empresaId, 'Partida Mayor');
  }

  async findAllCopdadet(empresaId: number) {
    return this.findAllByEmpresa(this.copdadetRepo, empresaId);
  }

  async findCopdadet(copdadetId: number, empresaId: number) {
    return this.findOneById(this.copdadetRepo, 'copdadetId', copdadetId, empresaId, 'Partida Detalle');
  }

  async createCopdadet(dto: CreateCopdadetDto, currentUser: string) {
    return this.createEntity(this.copdadetRepo, dto, currentUser);
  }

  async updateCopdadet(copdadetId: number, empresaId: number, dto: UpdateCopdadetDto, currentUser: string) {
    return this.updateEntity(this.copdadetRepo, 'copdadetId', copdadetId, empresaId, dto, currentUser, 'Partida Detalle');
  }

  async removeCopdadet(copdadetId: number, empresaId: number) {
    return this.softDelete(this.copdadetRepo, 'copdadetId', copdadetId, empresaId, 'Partida Detalle');
  }

  async findAllMovcta(empresaId: number) {
    return this.findAllByEmpresa(this.movctaRepo, empresaId);
  }

  async findMovcta(movctascontablesId: number, empresaId: number) {
    return this.findOneById(this.movctaRepo, 'movctascontablesId', movctascontablesId, empresaId, 'Movimiento Cuenta');
  }

  async createMovcta(dto: any, currentUser: string) {
    return this.createEntity(this.movctaRepo, dto, currentUser);
  }

  async updateMovcta(movctascontablesId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.movctaRepo, 'movctascontablesId', movctascontablesId, empresaId, dto, currentUser, 'Movimiento Cuenta');
  }

  async findAllNivelcta(empresaId: number) {
    return this.findAllByEmpresa(this.nivelctaRepo, empresaId);
  }

  async findNivelcta(nivelcontableId: number, empresaId: number) {
    return this.findOneById(this.nivelctaRepo, 'nivelcontableId', nivelcontableId, empresaId, 'Nivel Contable');
  }

  async createNivelcta(dto: any, currentUser: string) {
    return this.createEntity(this.nivelctaRepo, dto, currentUser);
  }

  async updateNivelcta(nivelcontableId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.nivelctaRepo, 'nivelcontableId', nivelcontableId, empresaId, dto, currentUser, 'Nivel Contable');
  }

  async removeNivelcta(nivelcontableId: number, empresaId: number) {
    return this.softDelete(this.nivelctaRepo, 'nivelcontableId', nivelcontableId, empresaId, 'Nivel Contable');
  }

  async findAllNaturalezacta(empresaId: number) {
    return this.findAllByEmpresa(this.naturalezactaRepo, empresaId);
  }

  async findNaturalezacta(naturalezaCtaId: number, empresaId: number) {
    return this.findOneById(this.naturalezactaRepo, 'naturalezaCtaId', naturalezaCtaId, empresaId, 'Naturaleza Cuenta');
  }

  async createNaturalezacta(dto: any, currentUser: string) {
    return this.createEntity(this.naturalezactaRepo, dto, currentUser);
  }

  async updateNaturalezacta(naturalezaCtaId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.naturalezactaRepo, 'naturalezaCtaId', naturalezaCtaId, empresaId, dto, currentUser, 'Naturaleza Cuenta');
  }

  async findAllImpuestovecinal(empresaId: number) {
    return this.findAllByEmpresa(this.impuestovecinalRepo, empresaId);
  }

  async findImpuestovecinal(impvecinalId: number, empresaId: number) {
    return this.findOneById(this.impuestovecinalRepo, 'impvecinalId', impvecinalId, empresaId, 'Impuesto Vecinal');
  }

  async createImpuestovecinal(dto: any, currentUser: string) {
    return this.createEntity(this.impuestovecinalRepo, dto, currentUser);
  }

  async updateImpuestovecinal(impvecinalId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.impuestovecinalRepo, 'impvecinalId', impvecinalId, empresaId, dto, currentUser, 'Impuesto Vecinal');
  }

  async removeImpuestovecinal(impvecinalId: number, empresaId: number) {
    return this.softDelete(this.impuestovecinalRepo, 'impvecinalId', impvecinalId, empresaId, 'Impuesto Vecinal');
  }

  async findAllTipoDocFiscal(empresaId: number) {
    return this.findAllByEmpresa(this.tipoDocFiscalRepo, empresaId);
  }

  async findTipoDocFiscal(tipodocumentofiscalId: number, empresaId: number) {
    return this.findOneById(this.tipoDocFiscalRepo, 'tipodocumentofiscalId', tipodocumentofiscalId, empresaId, 'Tipo Documento Fiscal');
  }

  async createTipoDocFiscal(dto: any, currentUser: string) {
    return this.createEntity(this.tipoDocFiscalRepo, dto, currentUser);
  }

  async updateTipoDocFiscal(tipodocumentofiscalId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.tipoDocFiscalRepo, 'tipodocumentofiscalId', tipodocumentofiscalId, empresaId, dto, currentUser, 'Tipo Documento Fiscal');
  }

  async removeTipoDocFiscal(tipodocumentofiscalId: number, empresaId: number) {
    return this.softDelete(this.tipoDocFiscalRepo, 'tipodocumentofiscalId', tipodocumentofiscalId, empresaId, 'Tipo Documento Fiscal');
  }
}

```

---

## 📄 src\modules\contabilidad\dto\contabilidad.dto.ts

```typescript
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTcoctacontablesDto {
  @ApiProperty({ description: 'Código de la cuenta contable' })
  @IsString() @IsNotEmpty()
  ctacontable: string;

  @ApiProperty({ description: 'Descripción de la cuenta contable' })
  @IsString() @IsNotEmpty()
  descripcion: string;

  @ApiProperty({ enum: ['D', 'C'], required: false, description: 'Naturaleza de la cuenta (Débito/Crédito)' })
  @IsEnum(['D', 'C']) @IsOptional()
  naturaleza?: string;

  @ApiProperty({ description: 'Nivel de la cuenta en la jerarquía' })
  @IsNumber()
  nivel: number;

  @ApiProperty({ required: false, description: 'Código de la cuenta padre' })
  @IsString() @IsOptional()
  padre?: string;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Indica si la cuenta es operable' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_operable?: string;

  @ApiProperty({ description: 'ID del grupo contable' })
  @IsNumber()
  tcogrupocontableId: number;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;

  @ApiProperty({ required: false, description: 'ID de la sucursal' })
  @IsNumber() @IsOptional()
  Idsucursal?: number;
}

export class UpdateTcoctacontablesDto {
  @ApiProperty({ required: false, description: 'Código de la cuenta contable' })
  @IsString() @IsOptional()
  ctacontable?: string;

  @ApiProperty({ required: false, description: 'Descripción de la cuenta contable' })
  @IsString() @IsOptional()
  descripcion?: string;

  @ApiProperty({ enum: ['D', 'C'], required: false, description: 'Naturaleza de la cuenta (Débito/Crédito)' })
  @IsEnum(['D', 'C']) @IsOptional()
  naturaleza?: string;

  @ApiProperty({ required: false, description: 'Nivel de la cuenta en la jerarquía' })
  @IsNumber() @IsOptional()
  nivel?: number;

  @ApiProperty({ required: false, description: 'Código de la cuenta padre' })
  @IsString() @IsOptional()
  padre?: string;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Indica si la cuenta es operable' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_operable?: string;

  @ApiProperty({ required: false, description: 'ID del grupo contable' })
  @IsNumber() @IsOptional()
  tcogrupocontableId?: number;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Indica si la cuenta está activa' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;

  @ApiProperty({ required: false, description: 'ID de la sucursal' })
  @IsNumber() @IsOptional()
  Idsucursal?: number;
}

export class CreateCopdamaeDto {
  @ApiProperty({ description: 'Período contable' })
  @IsNumber()
  periodo: number;

  @ApiProperty({ description: 'Año contable' })
  @IsNumber()
  anio: number;

  @ApiProperty({ description: 'ID del módulo' })
  @IsNumber()
  moduloId: number;

  @ApiProperty({ description: 'ID del documento' })
  @IsNumber()
  documentoId: number;

  @ApiProperty({ required: false, description: 'Factor de cambio' })
  @IsNumber() @IsOptional()
  factordecambio?: number;

  @ApiProperty({ description: 'Número de referencia' })
  @IsString() @IsNotEmpty()
  nroreferencia: string;

  @ApiProperty({ description: 'Descripción del comprobante' })
  @IsString() @IsNotEmpty()
  descripcion: string;

  @ApiProperty({ description: 'Número de partida' })
  @IsNumber()
  nropartida: number;

  @ApiProperty({ description: 'ID de la sucursal' })
  @IsNumber()
  Idsucursal: number;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdateCopdamaeDto {
  @ApiProperty({ required: false, description: 'Período contable' })
  @IsNumber() @IsOptional()
  periodo?: number;

  @ApiProperty({ required: false, description: 'Año contable' })
  @IsNumber() @IsOptional()
  anio?: number;

  @ApiProperty({ required: false, description: 'ID del módulo' })
  @IsNumber() @IsOptional()
  moduloId?: number;

  @ApiProperty({ required: false, description: 'ID del documento' })
  @IsNumber() @IsOptional()
  documentoId?: number;

  @ApiProperty({ required: false, description: 'Factor de cambio' })
  @IsNumber() @IsOptional()
  factordecambio?: number;

  @ApiProperty({ required: false, description: 'Número de referencia' })
  @IsString() @IsOptional()
  nroreferencia?: string;

  @ApiProperty({ required: false, description: 'Descripción del comprobante' })
  @IsString() @IsOptional()
  descripcion?: string;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Indica si está activo' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;

  @ApiProperty({ required: false, description: 'Número de partida' })
  @IsNumber() @IsOptional()
  nropartida?: number;

  @ApiProperty({ required: false, description: 'ID de la sucursal' })
  @IsNumber() @IsOptional()
  Idsucursal?: number;
}

export class CreateCopdadetDto {
  @ApiProperty({ description: 'ID del comprobante padre' })
  @IsNumber()
  copdamaeId: number;

  @ApiProperty({ required: false, description: 'Período contable' })
  @IsNumber() @IsOptional()
  periodo?: number;

  @ApiProperty({ required: false, description: 'Año contable' })
  @IsNumber() @IsOptional()
  anio?: number;

  @ApiProperty({ required: false, description: 'Número de partida' })
  @IsNumber() @IsOptional()
  nropartida?: number;

  @ApiProperty({ description: 'ID del módulo' })
  @IsNumber()
  moduloId: number;

  @ApiProperty({ required: false, description: 'Número de fila' })
  @IsNumber() @IsOptional()
  nrofila?: number;

  @ApiProperty({ required: false, description: 'Código de cuenta contable' })
  @IsString() @IsOptional()
  ctacontable?: string;

  @ApiProperty({ required: false, description: 'Descripción del movimiento' })
  @IsString() @IsOptional()
  descripcion?: string;

  @ApiProperty({ required: false, description: 'Monto de débito' })
  @IsNumber() @IsOptional()
  debito?: number;

  @ApiProperty({ required: false, description: 'Monto de crédito' })
  @IsNumber() @IsOptional()
  credito?: number;

  @ApiProperty({ required: false, description: 'Factor de cambio' })
  @IsNumber() @IsOptional()
  factordecambio?: number;

  @ApiProperty({ description: 'ID de la sucursal' })
  @IsNumber()
  Idsucursal: number;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdateCopdadetDto {
  @ApiProperty({ required: false, description: 'ID del comprobante padre' })
  @IsNumber() @IsOptional()
  copdamaeId?: number;

  @ApiProperty({ required: false, description: 'Período contable' })
  @IsNumber() @IsOptional()
  periodo?: number;

  @ApiProperty({ required: false, description: 'Año contable' })
  @IsNumber() @IsOptional()
  anio?: number;

  @ApiProperty({ required: false, description: 'Número de partida' })
  @IsNumber() @IsOptional()
  nropartida?: number;

  @ApiProperty({ required: false, description: 'ID del módulo' })
  @IsNumber() @IsOptional()
  moduloId?: number;

  @ApiProperty({ required: false, description: 'Número de fila' })
  @IsNumber() @IsOptional()
  nrofila?: number;

  @ApiProperty({ required: false, description: 'Código de cuenta contable' })
  @IsString() @IsOptional()
  ctacontable?: string;

  @ApiProperty({ required: false, description: 'Descripción del movimiento' })
  @IsString() @IsOptional()
  descripcion?: string;

  @ApiProperty({ required: false, description: 'Monto de débito' })
  @IsNumber() @IsOptional()
  debito?: number;

  @ApiProperty({ required: false, description: 'Monto de crédito' })
  @IsNumber() @IsOptional()
  credito?: number;

  @ApiProperty({ required: false, description: 'Factor de cambio' })
  @IsNumber() @IsOptional()
  factordecambio?: number;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Indica si está activo' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;

  @ApiProperty({ required: false, description: 'ID de la sucursal' })
  @IsNumber() @IsOptional()
  Idsucursal?: number;
}

```

---

## 📄 src\modules\contabilidad\entities\cocierrectable.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('cocierrectable')
export class Cocierrectable {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'cierrectableId' })
  cierrectableId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  periodo: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  anio: number;

  @ApiProperty()
  @Column({ type: 'datetime' })
  fechacierre: Date;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  observacion: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\contabilidad\entities\cofactordecambios.entity.ts

```typescript
import { Entity, PrimaryColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('cofactordecambios')
export class Cofactordecambios {
  @ApiProperty()
  @PrimaryColumn({ name: 'factordecambioId' })
  factordecambioId: number;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  preciocompra: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  precioventa: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['D', 'E', 'Y'], default: 'D' })
  tipomoneda: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\contabilidad\entities\comovcta.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('comovcta')
export class Comovcta {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'movctascontablesId' })
  movctascontablesId: number;

  @ApiProperty()
  @Column()
  monedaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  ctacontable: string;

  @ApiProperty()
  @Column()
  anio: number;

  @ApiProperty()
  @Column()
  periodo: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  sacum: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  debe: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  haber: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  saldo: number;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fecultmov: Date;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  ultnropda: number;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\contabilidad\entities\copdadet.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('copdadet')
export class Copdadet {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'copdadetId' })
  copdadetId: number;

  @ApiProperty()
  @Column()
  copdamaeId: number;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  periodo: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  anio: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  nropartida: number;

  @ApiProperty()
  @Column()
  moduloId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  nrofila: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  ctacontable: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 70, nullable: true })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  debito: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  credito: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  factordecambio: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column()
  Idsucursal: number;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\contabilidad\entities\copdamae.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('copdamae')
export class Copdamae {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'copdamaeId' })
  copdamaeId: number;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @ApiProperty()
  @Column()
  periodo: number;

  @ApiProperty()
  @Column()
  anio: number;

  @ApiProperty()
  @Column()
  moduloId: number;

  @ApiProperty()
  @Column()
  documentoId: number;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fechadocumento: Date;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  factordecambio: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 70 })
  nroreferencia: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 70 })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column()
  nropartida: number;

  @ApiProperty()
  @Column()
  Idsucursal: number;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\contabilidad\entities\coperiodoctable.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('coperiodoctable')
export class Coperiodoctable {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'periodoscontableId' })
  periodoscontableId: number;

  @ApiProperty()
  @Column()
  nroanio: number;

  @ApiProperty()
  @Column()
  nromes: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_abierto: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\contabilidad\entities\cosaldoscta.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('cosaldoscta')
export class Cosaldoscta {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'cosaldosctaId' })
  cosaldosctaId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  anio: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  ctacontable: string;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  saldoanterior: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  enero: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  febrero: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  marzo: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  abril: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  mayo: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  junio: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  julio: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  agosto: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  septiembre: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  octubre: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  noviembre: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  diciembre: number;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\contabilidad\entities\tcoctacontables.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('tcoctacontables')
export class Tcoctacontables {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'cuentacontablesId' })
  cuentacontablesId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  ctacontable: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['D', 'C'], default: 'D' })
  naturaleza: string;

  @ApiProperty()
  @Column({ type: 'int' })
  nivel: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  padre: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_operable: string;

  @ApiProperty()
  @Column()
  tcogrupocontableId: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column()
  Idsucursal: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\contabilidad\entities\tcogrupocontable.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('tcogrupocontable')
export class Tcogrupocontable {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'tcogrupocontableId' })
  tcogrupocontableId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\contabilidad\entities\tcoimpuestovecinal.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('tcoimpuestovecinal')
export class Tcoimpuestovecinal {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'impvecinalId' })
  impvecinalId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 50, nullable: true })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  del: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  al: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  importe: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\contabilidad\entities\tconaturalezacta.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('tconaturalezacta')
export class Tconaturalezacta {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'naturalezaCtaId' })
  naturalezaCtaId: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['D', 'C'], default: 'D' })
  descripcion: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\contabilidad\entities\tconivelcta.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('tconivelcta')
export class Tconivelcta {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'nivelcontableId' })
  nivelcontableId: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['1', '2', '3', '4', '5', '6', '7', '8'], default: '1' })
  nivel: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_diario: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\contabilidad\entities\tcoplantillabalancesdet.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('tcoplantillabalancesdet')
export class Tcoplantillabalancesdet {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'tcoplantillabalancesdetid' })
  tcoplantillabalancesdetid: number;

  @ApiProperty()
  @Column()
  cocdefbalmaId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 1, nullable: true })
  tipo: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  ctacontable: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 50, nullable: true })
  descripcion: string;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  columna: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  renglon: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\contabilidad\entities\tcoplantillabalancesmae.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('tcoplantillabalancesmae')
export class Tcoplantillabalancesmae {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'cocdefbalmaId' })
  cocdefbalmaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\contabilidad\entities\tcoplantillapdadet.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('tcoplantillapdadet')
export class Tcoplantillapdadet {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'tcoplantillapdadetId' })
  tcoplantillapdadetId: number;

  @ApiProperty()
  @Column()
  tcoplantillapdamaeId: number;

  @ApiProperty()
  @Column()
  nrofila: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  ctacontable: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 50, nullable: true })
  descripcion: string;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  moduloId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 50, nullable: true })
  ctamayorId: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['D', 'C'], default: 'D' })
  naturaleza: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\contabilidad\entities\tcoplantillapdamae.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('tcoplantillapdamae')
export class Tcoplantillapdamae {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'tcoplantillapdamaeId' })
  tcoplantillapdamaeId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

  @ApiProperty()
  @Column()
  moduloId: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\contabilidad\entities\tcorepbalances.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('tcorepbalances')
export class Tcorepbalances {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'balcomId' })
  balcomId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  ctacontable: string;

  @ApiProperty()
  @Column()
  periodoA: number;

  @ApiProperty()
  @Column()
  anioA: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  saldoA: number;

  @ApiProperty()
  @Column()
  periodoB: number;

  @ApiProperty()
  @Column()
  anioB: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  saldoB: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\contabilidad\entities\tcorepdiarios.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('tcorepdiarios')
export class Tcorepdiarios {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'tcorepdiariosId' })
  tcorepdiariosId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  reporte: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\contabilidad\entities\tcorepliquidez.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('tcorepliquidez')
export class Tcorepliquidez {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'tcorepliquidezId' })
  tcorepliquidezId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 50, nullable: true })
  descripcion: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 100, nullable: true })
  objetivo: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\contabilidad\entities\tcotipodocumentofiscal.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('tcotipodocumentofiscal')
export class TCoTipoDocumentoFiscal {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'tipodocumentofiscalId' })
  tipodocumentofiscalId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 10 })
  abreviatura: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['D', 'C'], default: 'D' }) // La naturaleza del documento fiscal, si es de tipo Debito o Credito 
  naturaleza: string;

  @ApiProperty()
  @Column() // va ser para vincular los documentos fiscales por modulo
  moduloId: number;

  @ApiProperty()
  @Column()  // va ser para vincular la cuenta contable que va afectar el documento
  cuentacontableId: number;

  @ApiProperty()
  @Column() // en el caso de las facturacion, se puede usar ticket para llever un correlativo de preregistro
  nrocorrelativo: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\cxc\cxc.controller.ts

```typescript
import {
  Controller, Get, Post, Put, Body, Param, Query,
  UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CxcService } from './cxc.service';
import {
  CreateCxcClienteDto, UpdateCxcClienteDto,
  CreateCxcMovimientoDto, UpdateCxcMovimientoDto,
  CreateCxcPrestamoDto, UpdateCxcPrestamoDto,
} from './dto/cxc.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('CxC')
@ApiBearerAuth()
@Controller('cxc')
@UseGuards(JwtAuthGuard)
export class CxcController {
  constructor(private readonly service: CxcService) {}

  @Get('clientes')
  @ApiOperation({ summary: 'Listar clientes con paginación' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllClientes(
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string
  ) {
    return this.service.findAllClientes(empresaId, page ? Number(page) : 1, limit ? Number(limit) : 10, q);
  }

  @Get('clientes/:id')
  @ApiOperation({ summary: 'Obtener cliente por ID' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findCliente(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findCliente(id, empresaId);
  }

  @Post('clientes')
  @ApiOperation({ summary: 'Crear cliente' })
  @ApiResponse({ status: 201, description: 'Creado exitosamente' })
  createCliente(@Body() dto: CreateCxcClienteDto, @CurrentUser() user: any) {
    return this.service.createCliente(dto, user.usuario);
  }

  @Put('clientes/:id')
  @ApiOperation({ summary: 'Actualizar cliente' })
  updateCliente(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateCxcClienteDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateCliente(id, empresaId, dto, user.usuario);
  }

  @Get('clientes-dir')
  @ApiOperation({ summary: 'Listar direcciones de clientes' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllClientesDir(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllClientesDir(empresaId);
  }

  @Get('clientes-dir/:id')
  @ApiOperation({ summary: 'Obtener dirección de cliente por ID' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findClienteDir(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findClienteDir(id, empresaId);
  }

  @Post('clientes-dir')
  @ApiOperation({ summary: 'Crear dirección de cliente' })
  @ApiResponse({ status: 201, description: 'Creado exitosamente' })
  createClienteDir(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createClienteDir(dto, user.usuario);
  }

  @Put('clientes-dir/:id')
  @ApiOperation({ summary: 'Actualizar dirección de cliente' })
  updateClienteDir(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateClienteDir(id, empresaId, dto, user.usuario);
  }

  @Get('clientes-tel')
  @ApiOperation({ summary: 'Listar teléfonos de clientes' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllClientesTel(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllClientesTel(empresaId);
  }

  @Get('clientes-tel/:id')
  @ApiOperation({ summary: 'Obtener teléfono de cliente por ID' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findClienteTel(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findClienteTel(id, empresaId);
  }

  @Post('clientes-tel')
  @ApiOperation({ summary: 'Crear teléfono de cliente' })
  @ApiResponse({ status: 201, description: 'Creado exitosamente' })
  createClienteTel(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createClienteTel(dto, user.usuario);
  }

  @Put('clientes-tel/:id')
  @ApiOperation({ summary: 'Actualizar teléfono de cliente' })
  updateClienteTel(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateClienteTel(id, empresaId, dto, user.usuario);
  }

  @Get('clientes-ref')
  @ApiOperation({ summary: 'Listar referencias de clientes' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllClientesRef(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllClientesRef(empresaId);
  }

  @Get('clientes-ref/cliente/:clienteId')
  @ApiOperation({ summary: 'Referencias por cliente' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findClientesRefByCliente(
    @Param('clienteId', ParseIntPipe) clienteId: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findClientesRefByCliente(clienteId, empresaId);
  }

  @Get('clientes-ref/:id')
  @ApiOperation({ summary: 'Obtener referencia de cliente por ID' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findClienteRef(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findClienteRef(id, empresaId);
  }

  @Post('clientes-ref')
  @ApiOperation({ summary: 'Crear referencia de cliente' })
  @ApiResponse({ status: 201, description: 'Creado exitosamente' })
  createClienteRef(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createClienteRef(dto, user.usuario);
  }

  @Put('clientes-ref/:id')
  @ApiOperation({ summary: 'Actualizar referencia de cliente' })
  updateClienteRef(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateClienteRef(id, empresaId, dto, user.usuario);
  }

  @Get('cajeros')
  @ApiOperation({ summary: 'Listar cajeros' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllCajeros(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllCajeros(empresaId);
  }

  @Get('cajeros/:id')
  @ApiOperation({ summary: 'Obtener cajero por ID' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findCajero(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findCajero(id, empresaId);
  }

  @Post('cajeros')
  @ApiOperation({ summary: 'Crear cajero' })
  @ApiResponse({ status: 201, description: 'Creado exitosamente' })
  createCajero(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createCajero(dto, user.usuario);
  }

  @Put('cajeros/:id')
  @ApiOperation({ summary: 'Actualizar cajero' })
  updateCajero(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateCajero(id, empresaId, dto, user.usuario);
  }

  @Get('caja-mae')
  @ApiOperation({ summary: 'Listar cabeceras de caja' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllCajaMae(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllCajaMae(empresaId);
  }

  @Get('caja-mae/:id')
  @ApiOperation({ summary: 'Obtener cabecera de caja por ID' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findCajaMae(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findCajaMae(id, empresaId);
  }

  @Post('caja-mae')
  @ApiOperation({ summary: 'Crear cabecera de caja' })
  @ApiResponse({ status: 201, description: 'Creado exitosamente' })
  createCajaMae(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createCajaMae(dto, user.usuario);
  }

  @Put('caja-mae/:id')
  @ApiOperation({ summary: 'Actualizar cabecera de caja' })
  updateCajaMae(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateCajaMae(id, empresaId, dto, user.usuario);
  }

  @Get('caja-det')
  @ApiOperation({ summary: 'Listar detalles de caja' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllCajaDet(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllCajaDet(empresaId);
  }

  @Get('caja-det/:id')
  @ApiOperation({ summary: 'Obtener detalle de caja por ID' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findCajaDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findCajaDet(id, empresaId);
  }

  @Post('caja-det')
  @ApiOperation({ summary: 'Crear detalle de caja' })
  @ApiResponse({ status: 201, description: 'Creado exitosamente' })
  createCajaDet(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createCajaDet(dto, user.usuario);
  }

  @Put('caja-det/:id')
  @ApiOperation({ summary: 'Actualizar detalle de caja' })
  updateCajaDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateCajaDet(id, empresaId, dto, user.usuario);
  }

  @Get('movimientos')
  @ApiOperation({ summary: 'Listar movimientos CxC' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllMovimientos(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllMovimientos(empresaId);
  }

  @Get('movimientos/cliente/:clienteId')
  @ApiOperation({ summary: 'Movimientos por cliente' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findMovimientosByCliente(
    @Param('clienteId', ParseIntPipe) clienteId: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findMovimientosByCliente(clienteId, empresaId);
  }

  @Get('movimientos/:id')
  @ApiOperation({ summary: 'Obtener movimiento por ID' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findMovimiento(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findMovimiento(id, empresaId);
  }

  @Post('movimientos')
  @ApiOperation({ summary: 'Crear movimiento' })
  @ApiResponse({ status: 201, description: 'Creado exitosamente' })
  createMovimiento(@Body() dto: CreateCxcMovimientoDto, @CurrentUser() user: any) {
    return this.service.createMovimiento(dto, user.usuario);
  }

  @Put('movimientos/:id')
  @ApiOperation({ summary: 'Actualizar movimiento' })
  updateMovimiento(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateCxcMovimientoDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateMovimiento(id, empresaId, dto, user.usuario);
  }

  @Get('historico')
  @ApiOperation({ summary: 'Listar histórico' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllHistoro(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllHistoro(empresaId);
  }

  @Get('historico/filtros')
  @ApiOperation({ summary: 'Histórico con filtros (dni, cliente, fecha)' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findHistoricoConFiltros(
    @Query('empresaId') empresaId: number,
    @Query('dni') dni?: string,
    @Query('cliente') cliente?: string,
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
  ) {
    const id = Number(empresaId);
    return this.service.findHistoricoConFiltros(id, dni, cliente, fechaDesde, fechaHasta);
  }

  @Get('historico/cliente/:clienteId')
  @ApiOperation({ summary: 'Histórico por cliente' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findHistoricoByCliente(
    @Param('clienteId', ParseIntPipe) clienteId: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findHistoricoByCliente(clienteId, empresaId);
  }

  @Get('historico/:id')
  @ApiOperation({ summary: 'Obtener registro histórico por ID' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findHistoro(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findHistoro(id, empresaId);
  }

  @Post('historico')
  @ApiOperation({ summary: 'Crear registro histórico' })
  @ApiResponse({ status: 201, description: 'Creado exitosamente' })
  createHistoro(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createHistoro(dto, user.usuario);
  }

  @Put('historico/:id')
  @ApiOperation({ summary: 'Actualizar registro histórico' })
  updateHistoro(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateHistoro(id, empresaId, dto, user.usuario);
  }

  @Get('saldo-favor')
  @ApiOperation({ summary: 'Listar saldos a favor' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllSalFav(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllSalFav(empresaId);
  }

  @Get('saldo-favor/:id')
  @ApiOperation({ summary: 'Obtener saldo a favor por ID' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findSalFav(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findSalFav(id, empresaId);
  }

  @Post('saldo-favor')
  @ApiOperation({ summary: 'Crear saldo a favor' })
  @ApiResponse({ status: 201, description: 'Creado exitosamente' })
  createSalFav(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createSalFav(dto, user.usuario);
  }

  @Put('saldo-favor/:id')
  @ApiOperation({ summary: 'Actualizar saldo a favor' })
  updateSalFav(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateSalFav(id, empresaId, dto, user.usuario);
  }

  @Get('dias-cobro')
  @ApiOperation({ summary: 'Listar días de cobro' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllDiasCobro(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllDiasCobro(empresaId);
  }

  @Get('dias-cobro/:id')
  @ApiOperation({ summary: 'Obtener día de cobro por ID' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findDiasCobro(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findDiasCobro(id, empresaId);
  }

  @Post('dias-cobro')
  @ApiOperation({ summary: 'Crear día de cobro' })
  @ApiResponse({ status: 201, description: 'Creado exitosamente' })
  createDiasCobro(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createDiasCobro(dto, user.usuario);
  }

  @Put('dias-cobro/:id')
  @ApiOperation({ summary: 'Actualizar día de cobro' })
  updateDiasCobro(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateDiasCobro(id, empresaId, dto, user.usuario);
  }

  @Get('prestamos')
  @ApiOperation({ summary: 'Listar préstamos' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllPrestamos(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllPrestamos(empresaId);
  }

  @Get('prestamos/cliente/:clienteId')
  @ApiOperation({ summary: 'Préstamos por cliente' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findPrestamosByCliente(
    @Param('clienteId', ParseIntPipe) clienteId: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findPrestamosByCliente(clienteId, empresaId);
  }

  @Get('prestamos/:id')
  @ApiOperation({ summary: 'Obtener préstamo por ID' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findPrestamo(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findPrestamo(id, empresaId);
  }

  @Post('prestamos')
  @ApiOperation({ summary: 'Crear préstamo' })
  @ApiResponse({ status: 201, description: 'Creado exitosamente' })
  createPrestamo(@Body() dto: CreateCxcPrestamoDto, @CurrentUser() user: any) {
    return this.service.createPrestamo(dto, user.usuario);
  }

  @Put('prestamos/:id')
  @ApiOperation({ summary: 'Actualizar préstamo' })
  updatePrestamo(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateCxcPrestamoDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updatePrestamo(id, empresaId, dto, user.usuario);
  }

  @Get('prestamo-pp')
  @ApiOperation({ summary: 'Listar plan de pagos de préstamos' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllPrestamoPP(
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Query('prestamoId') prestamoId?: string,
  ) {
    return this.service.findAllPrestamoPP(empresaId, prestamoId ? Number(prestamoId) : undefined);
  }

  @Get('prestamo-pp/:id')
  @ApiOperation({ summary: 'Obtener cuota de plan de pagos por ID' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findPrestamoPP(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findPrestamoPP(id, empresaId);
  }

  @Post('prestamo-pp')
  @ApiOperation({ summary: 'Crear cuota de plan de pagos' })
  @ApiResponse({ status: 201, description: 'Creado exitosamente' })
  createPrestamoPP(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createPrestamoPP(dto, user.usuario);
  }

  @Put('prestamo-pp/:id')
  @ApiOperation({ summary: 'Actualizar cuota de plan de pagos' })
  updatePrestamoPP(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updatePrestamoPP(id, empresaId, dto, user.usuario);
  }

  @Get('parientes')
  @ApiOperation({ summary: 'Listar parientes' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllParientes(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllParientes(empresaId);
  }

  @Get('parientes/cliente/:clienteId')
  @ApiOperation({ summary: 'Parientes por cliente' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findParientesByCliente(
    @Param('clienteId', ParseIntPipe) clienteId: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findParientesByCliente(clienteId, empresaId);
  }

  @Get('parientes/:id')
  @ApiOperation({ summary: 'Obtener pariente por ID' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findPariente(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findPariente(id, empresaId);
  }

  @Post('parientes')
  @ApiOperation({ summary: 'Crear pariente' })
  @ApiResponse({ status: 201, description: 'Creado exitosamente' })
  createPariente(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createPariente(dto, user.usuario);
  }

  @Put('parientes/:id')
  @ApiOperation({ summary: 'Actualizar pariente' })
  updatePariente(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updatePariente(id, empresaId, dto, user.usuario);
  }

  @Get('antiguedad-saldos')
  @ApiOperation({ summary: 'Antigüedad de saldos' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  getAntiguedadSaldos(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.getAntiguedadSaldos(empresaId);
  }

  @Get('clientes-con-saldo')
  @ApiOperation({ summary: 'Clientes con saldo pendiente' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  getClientesConSaldo(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.getClientesConSaldo(empresaId);
  }

  @Get('documentos-pendientes/cliente/:clienteId')
  @ApiOperation({ summary: 'Documentos pendientes por cliente' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findDocumentosPendientesCliente(
    @Param('clienteId', ParseIntPipe) clienteId: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findDocumentosPendientesCliente(clienteId, empresaId);
  }
}

```

---

## 📄 src\modules\cxc\cxc.module.ts

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CxcCliente } from './entities/cxccliente.entity';
import { CxccClientesDir } from './entities/cxccclientesdir.entity';
import { CxcClienteTel } from './entities/cxcclientestel.entity';
import { CxccClientesRef } from './entities/cxccclientesref.entity';
import { Cxccajero } from './entities/cxccajero.entity';
import { CxccajaMae } from './entities/cxccajamae.entity';
import { CxccajaDet } from './entities/cxccajadet.entity';
import { CxcMovimiento } from './entities/cxcmovimiento.entity';
import { CxcHistoro } from './entities/cxchisto.entity';
import { CxcSalFav } from './entities/cxcsalfav.entity';
import { TcctDiasCobro } from './entities/tcctdiascobro.entity';
import { CxcPrestamo } from './entities/cxcprestamo.entity';
import { CxcPrestamoPP } from './entities/cxcprestamopp.entity';
import { CxcPariente } from './entities/cxcpariente.entity';
import { TtipoParamCxc } from '../parametros/entities/param-cxc.entity';
import { CxcService } from './cxc.service';
import { CxcController } from './cxc.controller';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    TypeOrmModule.forFeature([
      CxcCliente,
      CxccClientesDir,
      CxcClienteTel,
      CxccClientesRef,
      Cxccajero,
      CxccajaMae,
      CxccajaDet,
      CxcMovimiento,
      CxcHistoro,
      CxcSalFav,
      TcctDiasCobro,
      CxcPrestamo,
      CxcPrestamoPP,
      CxcPariente,
      TtipoParamCxc,
    ]),
  ],
  controllers: [CxcController],
  providers: [CxcService],
  exports: [CxcService],
})
export class CxcModule {}

```

---

## 📄 src\modules\cxc\cxc.service.ts

```typescript
import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ObjectLiteral, Like } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CxcCliente } from './entities/cxccliente.entity';
import { CxccClientesDir } from './entities/cxccclientesdir.entity';
import { CxcClienteTel } from './entities/cxcclientestel.entity';
import { CxccClientesRef } from './entities/cxccclientesref.entity';
import { Cxccajero } from './entities/cxccajero.entity';
import { CxccajaMae } from './entities/cxccajamae.entity';
import { CxccajaDet } from './entities/cxccajadet.entity';
import { CxcMovimiento } from './entities/cxcmovimiento.entity';
import { CxcHistoro } from './entities/cxchisto.entity';
import { CxcSalFav } from './entities/cxcsalfav.entity';
import { TcctDiasCobro } from './entities/tcctdiascobro.entity';
import { TtipoParamCxc } from '../parametros/entities/param-cxc.entity';
import { CxcPrestamo } from './entities/cxcprestamo.entity';
import { CxcPrestamoPP } from './entities/cxcprestamopp.entity';
import { CxcPariente } from './entities/cxcpariente.entity';
import {
  CreateCxcClienteDto, UpdateCxcClienteDto,
  CreateCxcMovimientoDto, UpdateCxcMovimientoDto,
  CreateCxcPrestamoDto, UpdateCxcPrestamoDto,
} from './dto/cxc.dto';

@Injectable()
export class CxcService {
  constructor(
    @InjectRepository(CxcCliente) private readonly clienteRepo: Repository<CxcCliente>,
    @InjectRepository(CxccClientesDir) private readonly clienteDirRepo: Repository<CxccClientesDir>,
    @InjectRepository(CxcClienteTel) private readonly clienteTelRepo: Repository<CxcClienteTel>,
    @InjectRepository(CxccClientesRef) private readonly clienteRefRepo: Repository<CxccClientesRef>,
    @InjectRepository(Cxccajero) private readonly cajeroRepo: Repository<Cxccajero>,
    @InjectRepository(CxccajaMae) private readonly cajaMaeRepo: Repository<CxccajaMae>,
    @InjectRepository(CxccajaDet) private readonly cajaDetRepo: Repository<CxccajaDet>,
    @InjectRepository(CxcMovimiento) private readonly movimientoRepo: Repository<CxcMovimiento>,
    @InjectRepository(CxcHistoro) private readonly historoRepo: Repository<CxcHistoro>,
    @InjectRepository(CxcSalFav) private readonly salFavRepo: Repository<CxcSalFav>,
    @InjectRepository(TcctDiasCobro) private readonly diasCobroRepo: Repository<TcctDiasCobro>,
    @InjectRepository(CxcPrestamo) private readonly prestamoRepo: Repository<CxcPrestamo>,
    @InjectRepository(CxcPrestamoPP) private readonly prestamoPPRepo: Repository<CxcPrestamoPP>,
    @InjectRepository(CxcPariente) private readonly parienteRepo: Repository<CxcPariente>,
    @InjectRepository(TtipoParamCxc) private readonly paramCxcRepo: Repository<TtipoParamCxc>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private async findAllByEmpresa<T extends ObjectLiteral>(repo: Repository<T>, empresaId: number) {
    return repo.find({
      where: { empresaId } as unknown as FindOptionsWhere<T>,
    });
  }

  private async findOneById<T extends ObjectLiteral>(
    repo: Repository<T>,
    idField: string,
    id: number | string,
    empresaId: number,
    entityName: string,
  ) {
    const where = { [idField]: id, empresaId } as unknown as FindOptionsWhere<T>;
    const found = await repo.findOne({ where });
    if (!found) throw new NotFoundException(`${entityName} ${id} no encontrado`);
    return found;
  }

  private async createEntity<T extends ObjectLiteral>(
    repo: Repository<T>,
    dto: any,
    currentUser: string,
  ): Promise<T> {
    const entity = repo.create({
      ...dto,
      usuarioCreated: currentUser,
    });
    const saved = await repo.save(entity);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  private async updateEntity<T extends ObjectLiteral>(
    repo: Repository<T>,
    idField: string,
    id: number | string,
    empresaId: number,
    dto: any,
    currentUser: string,
    entityName: string,
  ) {
    const entity = await this.findOneById(repo, idField, id, empresaId, entityName);
    Object.assign(entity, dto, {
      usuarioUpdated: currentUser,
      fechaUpdated: new Date(),
    });
    return repo.save(entity);
  }

  private async softDelete<T extends ObjectLiteral>(
    repo: Repository<T>,
    idField: string,
    id: number | string,
    empresaId: number,
    entityName: string,
  ) {
    const entity = await this.findOneById(repo, idField, id, empresaId, entityName);
    Object.assign(entity, {
      sn_activo: 'N',
      fechaUpdated: new Date(),
    });
    return repo.save(entity);
  }

  async findAllClientes(empresaId: number, page: number, limit: number, q?: string) {
    const whereBase = { empresaId } as FindOptionsWhere<CxcCliente>;
    
    const [data, total] = await this.clienteRepo.findAndCount({
      where: q 
        ? [
            { ...whereBase, nombres: Like('%' + q + '%') },
            { ...whereBase, apellidos: Like('%' + q + '%') },
            { ...whereBase, nrocliente: Like('%' + q + '%') },
            { ...whereBase, dni: Like('%' + q + '%') },
            { ...whereBase, rtn: Like('%' + q + '%') },
          ]
        : whereBase,
      skip: (page - 1) * limit,
      take: limit,
      order: { clienteId: 'DESC' }
    });
    return { data, total };
  }

  async findCliente(clienteId: number, empresaId: number) {
    return this.findOneById(this.clienteRepo, 'clienteId', clienteId, empresaId, 'Cliente');
  }

  async createCliente(dto: CreateCxcClienteDto, currentUser: string) {
    let params: TtipoParamCxc | null = null;
    try {
      params = await this.paramCxcRepo.findOne({ where: { empresaId: dto.empresaId } });
    } catch (_) {}

    const nro = (params?.nrocliente ?? 0) + 1;
    const nrocliente = dto.nrocliente || String(nro).padStart(6, '0');

    const payload: any = {
      ...dto,
      nrocliente,
      dni: dto.dni || '0000000000000',
      razonsocial: dto.razonsocial || `${dto.nombres} ${dto.apellidos}`,
      fecharegistro: dto.fecharegistro || new Date().toISOString(),
      fechanacimiento: dto.fechanacimiento || new Date().toISOString(),
      interes: dto.interes ?? params?.interes ?? 0,
      moratorio: dto.moratorio ?? params?.mora ?? 0,
      diasplazo: dto.diasplazo ?? params?.diasPlazo ?? 0,
      limiteCredito: dto.limiteCredito ?? params?.limitecredito ?? 0,
    };

    const saved = await this.createEntity(this.clienteRepo, payload, currentUser);

    if (params) {
      try {
        await this.paramCxcRepo.update({ empresaId: dto.empresaId }, { nrocliente: nro });
      } catch (_) {}
    }

    return saved;
  }

  async updateCliente(clienteId: number, empresaId: number, dto: UpdateCxcClienteDto, currentUser: string) {
    return this.updateEntity(this.clienteRepo, 'clienteId', clienteId, empresaId, dto, currentUser, 'Cliente');
  }

  async removeCliente(clienteId: number, empresaId: number) {
    return this.softDelete(this.clienteRepo, 'clienteId', clienteId, empresaId, 'Cliente');
  }

  async findAllClientesDir(empresaId: number) {
    return this.findAllByEmpresa(this.clienteDirRepo, empresaId);
  }

  async findClienteDir(cxccclientesdirId: number, empresaId: number) {
    return this.findOneById(this.clienteDirRepo, 'cxccclientesdirId', cxccclientesdirId, empresaId, 'Direccion Cliente');
  }

  async createClienteDir(dto: any, currentUser: string) {
    return this.createEntity(this.clienteDirRepo, dto, currentUser);
  }

  async updateClienteDir(cxccclientesdirId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.clienteDirRepo, 'cxccclientesdirId', cxccclientesdirId, empresaId, dto, currentUser, 'Direccion Cliente');
  }

  async findAllClientesTel(empresaId: number) {
    return this.findAllByEmpresa(this.clienteTelRepo, empresaId);
  }

  async findClienteTel(clientetelefonoId: number, empresaId: number) {
    return this.findOneById(this.clienteTelRepo, 'clientetelefonoId', clientetelefonoId, empresaId, 'Telefono Cliente');
  }

  async createClienteTel(dto: any, currentUser: string) {
    return this.createEntity(this.clienteTelRepo, dto, currentUser);
  }

  async updateClienteTel(clientetelefonoId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.clienteTelRepo, 'clientetelefonoId', clientetelefonoId, empresaId, dto, currentUser, 'Telefono Cliente');
  }

  async findAllClientesRef(empresaId: number) {
    return this.findAllByEmpresa(this.clienteRefRepo, empresaId);
  }

  async findClientesRefByCliente(clienteId: number, empresaId: number) {
    return this.clienteRefRepo.find({
      where: { clienteId, empresaId } as FindOptionsWhere<CxccClientesRef>,
      order: { referenciaId: 'DESC' },
    });
  }

  async findClienteRef(referenciaId: number, empresaId: number) {
    return this.findOneById(this.clienteRefRepo, 'referenciaId', referenciaId, empresaId, 'Referencia Cliente');
  }

  async createClienteRef(dto: any, currentUser: string) {
    return this.createEntity(this.clienteRefRepo, dto, currentUser);
  }

  async updateClienteRef(referenciaId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.clienteRefRepo, 'referenciaId', referenciaId, empresaId, dto, currentUser, 'Referencia Cliente');
  }

  async findAllCajeros(empresaId: number) {
    return this.findAllByEmpresa(this.cajeroRepo, empresaId);
  }

  async findCajero(cajaId: number, empresaId: number) {
    return this.findOneById(this.cajeroRepo, 'cajaId', cajaId, empresaId, 'Cajero');
  }

  async createCajero(dto: any, currentUser: string) {
    return this.createEntity(this.cajeroRepo, dto, currentUser);
  }

  async updateCajero(cajaId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.cajeroRepo, 'cajaId', cajaId, empresaId, dto, currentUser, 'Cajero');
  }

  async findAllCajaMae(empresaId: number) {
    return this.findAllByEmpresa(this.cajaMaeRepo, empresaId);
  }

  async findCajaMae(cxccajaId: number, empresaId: number) {
    return this.findOneById(this.cajaMaeRepo, 'cxccajaId', cxccajaId, empresaId, 'Caja Maestro');
  }

  async createCajaMae(dto: any, currentUser: string) {
    const caja = await this.createEntity<CxccajaMae>(this.cajaMaeRepo, dto, currentUser);

    if (dto.tipomov === 'C') {
      try {
        await this.generarMovimientoDesdeCaja(caja, currentUser);
      } catch (error) {
        console.error('Error generando movimiento CXC desde Caja:', error);
      }
    }

    return caja;
  }

  async updateCajaMae(cxccajaId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.cajaMaeRepo, 'cxccajaId', cxccajaId, empresaId, dto, currentUser, 'Caja Maestro');
  }

  async findAllCajaDet(empresaId: number) {
    return this.findAllByEmpresa(this.cajaDetRepo, empresaId);
  }

  async findCajaDet(cxccajadetId: number, empresaId: number) {
    return this.findOneById(this.cajaDetRepo, 'cxccajadetId', cxccajadetId, empresaId, 'Detalle Caja');
  }

  async createCajaDet(dto: any, currentUser: string) {
    const cajero = await this.cajeroRepo.findOne({
      where: { usuario: currentUser, empresaId: dto.empresaId, sn_activo: 'S' } as FindOptionsWhere<Cxccajero>,
    });

    const cajaMae = await this.cajaMaeRepo.findOne({
      where: { cxccajaId: dto.cxccajaId, empresaId: dto.empresaId } as FindOptionsWhere<CxccajaMae>,
    });

    const cajaDet = await this.createEntity<CxccajaDet>(this.cajaDetRepo, {
      ...dto,
      cajaId: cajero?.cajaId ?? 0,
      clienteId: cajaMae?.clienteId ?? dto.clienteId,
      nrocliente: cajaMae?.nrocliente ?? dto.nrocliente,
    }, currentUser);

    if (cajaMae && cajaMae.tipomov === 'C') {
      try {
        await this.generarMovimientoDesdeCajaDet(cajaDet, cajaMae, currentUser);
      } catch (error) {
        console.error('Error generando movimiento CXC desde Caja Det:', error.message, error.stack);
      }
    }

    return cajaDet;
  }

  async updateCajaDet(cxccajadetId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.cajaDetRepo, 'cxccajadetId', cxccajadetId, empresaId, dto, currentUser, 'Detalle Caja');
  }

  private async generarMovimientoDesdeCaja(caja: CxccajaMae, currentUser: string): Promise<CxcMovimiento> {
    const cliente = await this.findCliente(caja.clienteId, caja.empresaId);
    
    const movimiento = this.movimientoRepo.create({
      fecharegistro: new Date(),
      clienteId: caja.clienteId,
      nrocliente: cliente.nrocliente,
      moduloId: 4,
      documentoId: caja.documentoId,
      tipomov: 'C',
      nroreferencia: caja.nrodocumento,
      factordecambio: 1,
      importe: 0,
      concepto: `Pago Caja #${caja.cxccajaId} - ${caja.concepto || ''}`,
      sn_cotabilizada: 'N',
      sn_doc_anulado: 'N',
      empresaId: caja.empresaId,
      usuarioCreated: currentUser,
    });

    return this.movimientoRepo.save(movimiento);
  }

  private async generarMovimientoDesdeCajaDet(cajaDet: CxccajaDet, cajaMae: CxccajaMae, currentUser: string): Promise<CxcMovimiento> {
    const cliente = await this.findCliente(cajaDet.clienteId, cajaDet.empresaId);
    
    const movimiento = this.movimientoRepo.create({
      fecharegistro: new Date(),
      clienteId: cajaDet.clienteId,
      nrocliente: cliente.nrocliente,
      moduloId: 4,
      documentoId: cajaMae.documentoId,
      tipomov: 'C',
      nroreferencia: cajaMae.nrodocumento,
      factordecambio: cajaDet.factordecambio || 1,
      importe: cajaDet.importe,
      concepto: `Pago ${cajaDet.formapagoId} - Caja #${cajaMae.cxccajaId}`,
      sn_cotabilizada: 'N',
      sn_doc_anulado: 'N',
      empresaId: cajaDet.empresaId,
      usuarioCreated: currentUser,
    });

    const saved = await this.movimientoRepo.save(movimiento);

    this.eventEmitter.emit('cxc.movimiento.creado', { movimiento: saved, origen: 'caja', cajaMae, cajaDet });

    return saved;
  }

  async findAllMovimientos(empresaId: number) {
    return this.findAllByEmpresa(this.movimientoRepo, empresaId);
  }

  async findMovimientosByCliente(clienteId: number, empresaId: number) {
    return this.movimientoRepo
      .createQueryBuilder('mov')
      .leftJoinAndSelect('mov.modulo', 'modulo')
      .where('mov.clienteId = :clienteId AND mov.empresaId = :empresaId', { clienteId, empresaId })
      .orderBy('mov.fecharegistro', 'ASC')
      .getMany();
  }

  async findMovimiento(clienteMovId: number, empresaId: number) {
    return this.findOneById(this.movimientoRepo, 'clienteMovId', clienteMovId, empresaId, 'Movimiento');
  }

  async createMovimiento(dto: CreateCxcMovimientoDto, currentUser: string) {
    return this.createEntity(this.movimientoRepo, dto, currentUser);
  }

  async updateMovimiento(clienteMovId: number, empresaId: number, dto: UpdateCxcMovimientoDto, currentUser: string) {
    return this.updateEntity(this.movimientoRepo, 'clienteMovId', clienteMovId, empresaId, dto, currentUser, 'Movimiento');
  }

  async findAllHistoro(empresaId: number) {
    return this.findAllByEmpresa(this.historoRepo, empresaId);
  }

  /**
   * Consulta histórico de movimientos con filtros por DNI, cliente y rango de fechas
   */
  async findHistoricoConFiltros(
    empresaId: number,
    dni?: string,
    cliente?: string,
    fechaDesde?: string,
    fechaHasta?: string,
  ) {
    const qb = this.movimientoRepo.createQueryBuilder('a')
      .select('a.clienteId', 'clienteId')
      .addSelect('a.fecharegistro', 'fecharegistro')
      .addSelect('a.nrocliente', 'nrocliente')
      .addSelect('b.dni', 'dni')
      .addSelect('b.razonsocial', 'cliente')
      .addSelect('c.descripcion', 'modulo')
      .addSelect('d.abreviatura', 'abreviatura')
      .addSelect('a.nroreferencia', 'nroreferencia')
      .addSelect('a.tipomov', 'tipomov')
      .addSelect('a.importe', 'importe')
      .addSelect('a.concepto', 'concepto')
      .addSelect('a.sn_doc_anulado', 'sn_doc_anulado')
      .addSelect('a.sn_cotabilizada', 'sn_cotabilizada')
      .addSelect('a.clienteMovId', 'clienteMovId')
      .innerJoin('cxcclientes', 'b', 'b.clienteId = a.clienteId')
      .innerJoin('tmodulos', 'c', 'c.moduloId = a.moduloId')
      .innerJoin('tcotipodocumentofiscal', 'd', 'd.tipodocumentofiscalId = a.documentoId')
      .where('a.empresaId = :empresaId', { empresaId })
      .orderBy('b.razonsocial', 'ASC')
      .addOrderBy('a.clienteMovId', 'ASC');

    if (dni && dni.trim()) {
      qb.andWhere('b.dni LIKE :dni', { dni: `%${dni.trim()}%` });
    }

    if (cliente && cliente.trim()) {
      qb.andWhere('(b.razonsocial LIKE :cliente OR b.nombres LIKE :cliente OR b.apellidos LIKE :cliente)', { 
        cliente: `%${cliente.trim()}%` 
      });
    }

    if (fechaDesde && fechaDesde.trim()) {
      qb.andWhere('a.fecharegistro >= :fechaDesde', { fechaDesde: `${fechaDesde.trim()} 00:00:00` });
    }

    if (fechaHasta && fechaHasta.trim()) {
      qb.andWhere('a.fecharegistro <= :fechaHasta', { fechaHasta: `${fechaHasta.trim()} 23:59:59` });
    }

    return qb.getRawMany();
  }

  async findHistoricoByCliente(clienteId: number, empresaId: number) {
    return this.historoRepo.find({
      where: { clienteId, empresaId } as FindOptionsWhere<CxcHistoro>,
      order: { historicoclienteId: 'DESC' },
    });
  }

  async findHistoro(historicoclienteId: number, empresaId: number) {
    return this.findOneById(this.historoRepo, 'historicoclienteId', historicoclienteId, empresaId, 'Historico Cliente');
  }

  async createHistoro(dto: any, currentUser: string) {
    return this.createEntity(this.historoRepo, dto, currentUser);
  }

  async updateHistoro(historicoclienteId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.historoRepo, 'historicoclienteId', historicoclienteId, empresaId, dto, currentUser, 'Historico Cliente');
  }

  async findAllSalFav(empresaId: number) {
    return this.findAllByEmpresa(this.salFavRepo, empresaId);
  }

  async findSalFav(cxcsalfavId: number, empresaId: number) {
    return this.findOneById(this.salFavRepo, 'cxcsalfavId', cxcsalfavId, empresaId, 'Saldo Favor');
  }

  async createSalFav(dto: any, currentUser: string) {
    return this.createEntity(this.salFavRepo, dto, currentUser);
  }

  async updateSalFav(cxcsalfavId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.salFavRepo, 'cxcsalfavId', cxcsalfavId, empresaId, dto, currentUser, 'Saldo Favor');
  }

  async findAllDiasCobro(empresaId: number) {
    return this.findAllByEmpresa(this.diasCobroRepo, empresaId);
  }

  async findDiasCobro(tdiascobrosId: number, empresaId: number) {
    return this.findOneById(this.diasCobroRepo, 'tdiascobrosId', tdiascobrosId, empresaId, 'Dias Cobro');
  }

  async createDiasCobro(dto: any, currentUser: string) {
    return this.createEntity(this.diasCobroRepo, dto, currentUser);
  }

  async updateDiasCobro(tdiascobrosId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.diasCobroRepo, 'tdiascobrosId', tdiascobrosId, empresaId, dto, currentUser, 'Dias Cobro');
  }

  async findAllPrestamos(empresaId: number) {
    return this.findAllByEmpresa(this.prestamoRepo, empresaId);
  }

  async findPrestamosByCliente(clienteId: number, empresaId: number) {
    return this.prestamoRepo.find({
      where: { clienteId, empresaId } as FindOptionsWhere<CxcPrestamo>,
      order: { fecharegistro: 'DESC' },
    });
  }

  async findPrestamo(prestamoId: number, empresaId: number) {
    return this.findOneById(this.prestamoRepo, 'prestamoId', prestamoId, empresaId, 'Prestamo');
  }

  async createPrestamo(dto: CreateCxcPrestamoDto, currentUser: string) {
    return this.createEntity(this.prestamoRepo, dto, currentUser);
  }

  async updatePrestamo(prestamoId: number, empresaId: number, dto: UpdateCxcPrestamoDto, currentUser: string) {
    return this.updateEntity(this.prestamoRepo, 'prestamoId', prestamoId, empresaId, dto, currentUser, 'Prestamo');
  }

  async removePrestamo(prestamoId: number, empresaId: number) {
    return this.softDelete(this.prestamoRepo, 'prestamoId', prestamoId, empresaId, 'Prestamo');
  }

  async findAllPrestamoPP(empresaId: number, prestamoId?: number) {
    const where: any = { empresaId };
    if (prestamoId) where.prestamoId = prestamoId;
    return this.prestamoPPRepo.find({ where, order: { nrofila: 'ASC' } });
  }

  async findPrestamoPP(pppId: number, empresaId: number) {
    return this.findOneById(this.prestamoPPRepo, 'pppId', pppId, empresaId, 'Prestamo Plan Pago');
  }

  async createPrestamoPP(dto: any, currentUser: string) {
    return this.createEntity(this.prestamoPPRepo, dto, currentUser);
  }

  async updatePrestamoPP(pppId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.prestamoPPRepo, 'pppId', pppId, empresaId, dto, currentUser, 'Prestamo Plan Pago');
  }

  async findAllParientes(empresaId: number) {
    return this.findAllByEmpresa(this.parienteRepo, empresaId);
  }

  async findParientesByCliente(clienteId: number, empresaId: number) {
    return this.parienteRepo.find({
      where: { clienteId, empresaId } as FindOptionsWhere<CxcPariente>,
      order: { fecharegistro: 'DESC' },
    });
  }

  async findPariente(parienteId: number, empresaId: number) {
    return this.findOneById(this.parienteRepo, 'parienteId', parienteId, empresaId, 'Pariente');
  }

  async createPariente(dto: any, currentUser: string) {
    return this.createEntity(this.parienteRepo, dto, currentUser);
  }

  async updatePariente(parienteId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.parienteRepo, 'parienteId', parienteId, empresaId, dto, currentUser, 'Pariente');
  }

  async generarMovimientoDesdeFactura(factura: any, currentUser: string): Promise<CxcMovimiento> {
    const cliente = await this.findCliente(factura.clienteId, factura.empresaId);
    
    const movimiento = this.movimientoRepo.create({
      fecharegistro: new Date(),
      clienteId: factura.clienteId,
      nrocliente: cliente.nrocliente,
      moduloId: 3,
      documentoId: 1, // tipodocumentofiscalId = 1 (FAC)
      tipomov: 'D',
      nroreferencia: factura.nrofactura.toString(),
      factordecambio: factura.factordecambio || 1,
      importe: factura.total,
      concepto: `Factura Crédito #${factura.nrofactura}`,
      sn_cotabilizada: 'N',
      sn_doc_anulado: 'N',
      empresaId: factura.empresaId,
      usuarioCreated: currentUser,
    });

    const saved = await this.movimientoRepo.save(movimiento);

    this.eventEmitter.emit('cxc.movimiento.creado', { movimiento: saved, origen: 'facturacion', factura });

    return saved;
  }

  async anularMovimientoFactura(facturaId: number, nrofactura: number, empresaId: number, currentUser: string): Promise<void> {
    const movimientos = await this.movimientoRepo.find({
      where: { nroreferencia: nrofactura.toString(), moduloId: 3, empresaId } as FindOptionsWhere<CxcMovimiento>,
    });

    for (const mov of movimientos) {
      mov.sn_doc_anulado = 'S';
      mov.fec_anulacion = new Date();
      mov.usuarioUpdated = currentUser;
      mov.fechaUpdated = new Date();
      await this.movimientoRepo.save(mov);
    }

    this.eventEmitter.emit('cxc.movimiento.anulado', { facturaId, empresaId, currentUser });
  }

  async anularCajaPorFactura(facturaId: number, nrofactura: number, empresaId: number, currentUser: string): Promise<void> {
    const cajas = await this.cajaMaeRepo.find({
      where: { nrodocumento: nrofactura.toString(), moduloId: 4, empresaId } as FindOptionsWhere<CxccajaMae>,
    });

    for (const caja of cajas) {
      caja.sn_anulado = 'S';
      caja.fec_anulacion = new Date();
      caja.usuarioUpdated = currentUser;
      caja.fechaUpdated = new Date();
      await this.cajaMaeRepo.save(caja);

      const detalles = await this.cajaDetRepo.find({
        where: { cxccajaId: caja.cxccajaId, empresaId } as FindOptionsWhere<CxccajaDet>,
      });

      for (const det of detalles) {
        det.sn_anulado = 'S';
        det.fec_anulacion = new Date();
        det.usuarioUpdated = currentUser;
        det.fechaUpdated = new Date();
        await this.cajaDetRepo.save(det);
      }

      const movsCaja = await this.movimientoRepo.find({
        where: { documentoId: caja.cxccajaId, moduloId: 3, empresaId } as FindOptionsWhere<CxcMovimiento>,
      });

      for (const mov of movsCaja) {
        mov.sn_doc_anulado = 'S';
        mov.fec_anulacion = new Date();
        mov.usuarioUpdated = currentUser;
        mov.fechaUpdated = new Date();
        await this.movimientoRepo.save(mov);
      }
    }

    this.eventEmitter.emit('cxc.caja.anulada', { facturaId, empresaId, currentUser });
  }

  async getAntiguedadSaldos(empresaId: number) {
    const hoy = new Date();
    const clientes = await this.clienteRepo.find({ where: { empresaId } as FindOptionsWhere<CxcCliente> });
    const movimientos = await this.movimientoRepo.find({ where: { empresaId } as FindOptionsWhere<CxcMovimiento> });

    const mapaClientes = new Map<number, any>();

    clientes.forEach(c => {
      mapaClientes.set(c.clienteId, {
        clienteId: c.clienteId,
        nrocliente: c.nrocliente,
        cliente: `${c.nombres || ''} ${c.apellidos || ''}`.trim() || c.razonsocial || 'Sin nombre',
        dni: c.dni || '',
        rtn: c.rtn || '',
        total: 0,
        corriente: 0,
        vencido30: 0,
        vencido60: 0,
        vencido90: 0,
      });
    });

    movimientos.forEach(m => {
      if (m.sn_doc_anulado === 'S') return;
      const item = mapaClientes.get(m.clienteId);
      if (!item) return;

      const importe = Number(m.importe) || 0;
      if (importe <= 0) return;

      const fechaMov = new Date(m.fecharegistro);
      const diasDiff = Math.floor((hoy.getTime() - fechaMov.getTime()) / (1000 * 60 * 60 * 24));

      if (m.tipomov === 'D') {
        item.total += importe;
        if (diasDiff <= 30) {
          item.corriente += importe;
        } else if (diasDiff <= 60) {
          item.vencido30 += importe;
        } else if (diasDiff <= 90) {
          item.vencido60 += importe;
        } else {
          item.vencido90 += importe;
        }
      } else {
        item.total -= importe;
      }
    });

    return Array.from(mapaClientes.values()).filter(item => item.total > 0);
  }

  async getClientesConSaldo(empresaId: number) {
    const result = await this.getAntiguedadSaldos(empresaId);

    const clientesIds = result.map(r => r.clienteId);
    if (clientesIds.length === 0) return [];

    const clientes = await this.clienteRepo.find({
      where: { clienteId: { $in: clientesIds } } as any,
    });

    const mapaDir = new Map<number, any>();
    const dirs = await this.clienteDirRepo.find({ where: { empresaId } as FindOptionsWhere<CxccClientesDir> });
    dirs.forEach((d: any) => {
      const cid = d.clienteid ?? d.clienteId;
      if (cid && !mapaDir.has(cid)) {
        mapaDir.set(cid, d);
      }
    });

    const mapaTel = new Map<number, any>();
    const tels = await this.clienteTelRepo.find({ where: { empresaId } as FindOptionsWhere<CxcClienteTel> });
    tels.forEach(t => {
      if (!mapaTel.has(t.clienteId)) {
        mapaTel.set(t.clienteId, t);
      }
    });

    return result.map(item => {
      const cliente = clientes.find(c => c.clienteId === item.clienteId);
      const dir = mapaDir.get(item.clienteId) as any;
      const tel = mapaTel.get(item.clienteId) as any;
      return {
        ...item,
        direccion: dir ? `${dir.direccion1 || ''} ${dir.direccion2 || ''}`.trim() : '',
        telefono: tel ? tel.telefono || tel.celular || '' : '',
      };
    });
  }

  async findDocumentosPendientesCliente(clienteId: number, empresaId: number) {
    const movimientos = await this.movimientoRepo
      .createQueryBuilder('mov')
      .leftJoinAndSelect('mov.modulo', 'modulo')
      .where('mov.clienteId = :clienteId AND mov.empresaId = :empresaId AND mov.sn_doc_anulado = :anulado', {
        clienteId, empresaId, anulado: 'N',
      })
      .orderBy('mov.fecharegistro', 'ASC')
      .getMany();

    // 1ra pasada: acumular débitos (D) como documentos pendientes
    const mapaDocs = new Map<string, any>();
    for (const m of movimientos) {
      const importe = Number(m.importe) || 0;
      if (m.tipomov !== 'D' || importe <= 0) continue;

      const key = `${m.moduloId}-${m.nroreferencia}`;
      if (!mapaDocs.has(key)) {
        mapaDocs.set(key, {
          moduloId: m.moduloId,
          modulo: m.modulo?.descripcion ?? '',
          documentoId: m.documentoId,
          nroreferencia: m.nroreferencia ?? '',
          tipomov: 'D',
          importe: 0,
          pagado: 0,
        });
      }
      mapaDocs.get(key).importe += importe;
    }

    // 2da pasada: restar créditos (C) por nroreferencia
    for (const m of movimientos) {
      const importe = Number(m.importe) || 0;
      if (m.tipomov !== 'C' || importe <= 0) continue;

      const key = `${m.moduloId}-${m.nroreferencia}`;
      const doc = mapaDocs.get(key);
      if (doc) {
        doc.pagado += importe;
      }
    }

    return Array.from(mapaDocs.values())
      .map(doc => ({ ...doc, saldo: doc.importe - doc.pagado }))
      .filter(doc => doc.saldo > 0);
  }
}

```

---

## 📄 src\modules\cxc\dto\cxc.dto.ts

```typescript
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsDateString, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateCxcClienteDto {
  @ApiProperty({ description: 'Número de Cliente', required: false })
  @IsString() @IsOptional()
  nrocliente?: string;

  @ApiProperty({ description: 'Fecha de Registro', required: false })
  @IsOptional()
  fecharegistro?: string;

  @ApiProperty({ description: 'Fecha de Nacimiento', required: false })
  @IsOptional()
  fechanacimiento?: string;

  @ApiProperty({ description: 'Nombres' })
  @IsString() @IsNotEmpty()
  nombres: string;

  @ApiProperty({ description: 'Apellidos' })
  @IsString() @IsNotEmpty()
  apellidos: string;

  @ApiProperty({ description: 'Razón Social', required: false })
  @IsString() @IsOptional()
  razonsocial?: string;

  @ApiProperty({ description: 'DNI', required: false })
  @IsString() @IsOptional()
  dni?: string;

  @ApiProperty({ description: 'Sexo', enum: ['M', 'F'], required: false })
  @IsEnum(['M', 'F']) @IsOptional()
  sexo?: string;

  @ApiProperty({ description: 'Estado Civil', enum: ['S', 'C', 'D', 'V', 'U'], required: false })
  @IsEnum(['S', 'C', 'D', 'V', 'U']) @IsOptional()
  estadocivil?: string;

  @ApiProperty({ description: 'RTN', required: false })
  @IsString() @IsOptional()
  rtn?: string;

  @ApiProperty({ description: 'Límite de Crédito', required: false })
  @IsNumber() @IsOptional()
  limiteCredito?: number;

  @ApiProperty({ description: 'Días de Plazo', required: false })
  @IsNumber() @IsOptional()
  diasplazo?: number;

  @ApiProperty({ description: 'Interés', required: false })
  @IsNumber() @IsOptional()
  interes?: number;

  @ApiProperty({ description: 'Moratorio', required: false })
  @IsNumber() @IsOptional()
  moratorio?: number;

  @ApiProperty({ description: 'Categoría', enum: ['A', 'B', 'C', 'D', 'E'], required: false })
  @IsEnum(['A', 'B', 'C', 'D', 'E']) @IsOptional()
  categoria?: string;

  @ApiProperty({ description: 'ID de Empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdateCxcClienteDto {
  @ApiProperty({ description: 'Número de Cliente', required: false })
  @IsString() @IsOptional()
  nrocliente?: string;

  @ApiProperty({ description: 'Fecha de Nacimiento', required: false })
  @IsDateString() @IsOptional()
  fechanacimiento?: string;

  @ApiProperty({ description: 'Nombres', required: false })
  @IsString() @IsOptional()
  nombres?: string;

  @ApiProperty({ description: 'Apellidos', required: false })
  @IsString() @IsOptional()
  apellidos?: string;

  @ApiProperty({ description: 'Razón Social', required: false })
  @IsString() @IsOptional()
  razonsocial?: string;

  @ApiProperty({ description: 'DNI', required: false })
  @IsString() @IsOptional()
  dni?: string;

  @ApiProperty({ description: 'Sexo', enum: ['M', 'F'], required: false })
  @IsEnum(['M', 'F']) @IsOptional()
  sexo?: string;

  @ApiProperty({ description: 'Estado Civil', enum: ['S', 'C', 'D', 'V', 'U'], required: false })
  @IsEnum(['S', 'C', 'D', 'V', 'U']) @IsOptional()
  estadocivil?: string;

  @ApiProperty({ description: 'RTN', required: false })
  @IsString() @IsOptional()
  rtn?: string;

  @ApiProperty({ description: 'Límite de Crédito', required: false })
  @IsNumber() @IsOptional()
  limiteCredito?: number;

  @ApiProperty({ description: 'Días de Plazo', required: false })
  @IsNumber() @IsOptional()
  diasplazo?: number;

  @ApiProperty({ description: 'Interés', required: false })
  @IsNumber() @IsOptional()
  interes?: number;

  @ApiProperty({ description: 'Moratorio', required: false })
  @IsNumber() @IsOptional()
  moratorio?: number;

  @ApiProperty({ description: 'Categoría', enum: ['A', 'B', 'C', 'D', 'E'], required: false })
  @IsEnum(['A', 'B', 'C', 'D', 'E']) @IsOptional()
  categoria?: string;

  @ApiProperty({ description: 'Activo', enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;
}

export class CreateCxcMovimientoDto {
  @ApiProperty({ description: 'Fecha de Registro' })
  @IsDateString()
  fecharegistro: string;

  @ApiProperty({ description: 'ID de Cliente' })
  @IsNumber()
  clienteId: number;

  @ApiProperty({ description: 'Número de Cliente' })
  @IsString() @IsNotEmpty()
  nrocliente: string;

  @ApiProperty({ description: 'ID de Módulo' })
  @IsNumber()
  moduloId: number;

  @ApiProperty({ description: 'ID de Documento' })
  @IsNumber()
  documentoId: number;

  @ApiProperty({ description: 'Tipo de Movimiento', enum: ['D', 'C'], required: false })
  @IsEnum(['D', 'C']) @IsOptional()
  tipomov?: string;

  @ApiProperty({ description: 'Número de Referencia', required: false })
  @IsString() @IsOptional()
  nroreferencia?: string;

  @ApiProperty({ description: 'Factor de Cambio', required: false })
  @IsNumber() @IsOptional()
  factordecambio?: number;

  @ApiProperty({ description: 'Importe', required: false })
  @IsNumber() @IsOptional()
  importe?: number;

  @ApiProperty({ description: 'Concepto', required: false })
  @IsString() @IsOptional()
  concepto?: string;

  @ApiProperty({ description: 'ID de Empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdateCxcMovimientoDto {
  @ApiProperty({ description: 'Tipo de Movimiento', enum: ['D', 'C'], required: false })
  @IsEnum(['D', 'C']) @IsOptional()
  tipomov?: string;

  @ApiProperty({ description: 'Número de Referencia', required: false })
  @IsString() @IsOptional()
  nroreferencia?: string;

  @ApiProperty({ description: 'Factor de Cambio', required: false })
  @IsNumber() @IsOptional()
  factordecambio?: number;

  @ApiProperty({ description: 'Importe', required: false })
  @IsNumber() @IsOptional()
  importe?: number;

  @ApiProperty({ description: 'Concepto', required: false })
  @IsString() @IsOptional()
  concepto?: string;

  @ApiProperty({ description: 'Contabilizado', enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_cotabilizada?: string;

  @ApiProperty({ description: 'Documento Anulado', enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_doc_anulado?: string;
}

export class CreateCxcPrestamoDto {
  @ApiProperty({ description: 'Fecha de Registro' })
  @IsDateString()
  fecharegistro: string;

  @ApiProperty({ description: 'Número de Préstamo' })
  @IsString()
  nroprestamo: string;

  @ApiProperty({ description: 'ID de Cliente' })
  @IsNumber()
  clienteId: number;

  @ApiProperty({ description: 'Capital', required: false })
  @IsNumber() @IsOptional()
  capital?: number;

  @ApiProperty({ description: 'Prima', required: false })
  @IsNumber() @IsOptional()
  prima?: number;

  @ApiProperty({ description: 'Capital Neto', required: false })
  @IsNumber() @IsOptional()
  capitalneto?: number;

  @ApiProperty({ description: 'Tasa', required: false })
  @IsNumber() @IsOptional()
  tasa?: number;

  @ApiProperty({ description: 'Cuotas', required: false })
  @IsNumber() @IsOptional()
  cuotas?: number;

  @ApiProperty({ description: 'Días Cuotas', required: false })
  @IsNumber() @IsOptional()
  diascuotas?: number;

  @ApiProperty({ description: 'Moratorio', required: false })
  @IsNumber() @IsOptional()
  moratorio?: number;

  @ApiProperty({ description: 'ID de Gestor', required: false })
  @IsNumber() @IsOptional()
  gestorId?: number;

  @ApiProperty({ description: 'ID de Moneda', required: false })
  @IsNumber() @IsOptional()
  monedaId?: number;

  @ApiProperty({ description: 'Gracia', required: false })
  @IsNumber() @IsOptional()
  gracia?: number;

  @ApiProperty({ description: 'Activo', required: false })
  @IsString() @IsOptional()
  sn_activo?: string;

  @ApiProperty({ description: 'Contabilizado', required: false })
  @IsString() @IsOptional()
  sn_contabilizado?: string;

  @ApiProperty({ description: 'ID de Empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdateCxcPrestamoDto {
  @ApiProperty({ description: 'Capital', required: false })
  @IsNumber() @IsOptional()
  capital?: number;

  @ApiProperty({ description: 'Prima', required: false })
  @IsNumber() @IsOptional()
  prima?: number;

  @ApiProperty({ description: 'Capital Neto', required: false })
  @IsNumber() @IsOptional()
  capitalneto?: number;

  @ApiProperty({ description: 'Tasa', required: false })
  @IsNumber() @IsOptional()
  tasa?: number;

  @ApiProperty({ description: 'Cuotas', required: false })
  @IsNumber() @IsOptional()
  cuotas?: number;

  @ApiProperty({ description: 'Días Cuotas', required: false })
  @IsNumber() @IsOptional()
  diascuotas?: number;

  @ApiProperty({ description: 'Moratorio', required: false })
  @IsNumber() @IsOptional()
  moratorio?: number;

  @ApiProperty({ description: 'ID de Gestor', required: false })
  @IsNumber() @IsOptional()
  gestorId?: number;

  @ApiProperty({ description: 'ID de Moneda', required: false })
  @IsNumber() @IsOptional()
  monedaId?: number;

  @ApiProperty({ description: 'Gracia', required: false })
  @IsNumber() @IsOptional()
  gracia?: number;

  @ApiProperty({ description: 'Última Cuota Pagada', required: false })
  @IsNumber() @IsOptional()
  ultcuotapagada?: number;

  @ApiProperty({ description: 'Activo', required: false })
  @IsString() @IsOptional()
  sn_activo?: string;

  @ApiProperty({ description: 'Contabilizado', required: false })
  @IsString() @IsOptional()
  sn_contabilizado?: string;
}

```

---

## 📄 src\modules\cxc\entities\cxccajadet.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('cxccajadet')
export class CxccajaDet {
  @PrimaryGeneratedColumn({ name: 'cxccajadetId' })
  cxccajadetId: number;

  @Column()
  cxccajaId: number;

  @Column()
  clienteId: number;

  @Column({ type: 'varchar', length: 20 })
  nrocliente: string;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  factordecambio: number;

  @Column()
  formapagoId: number;

  @Column({ type: 'int', nullable: true })
  tarjetacreditoId: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  nrotarjeta: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  nroautorizacion: string;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  importe: number;

  @Column()
  cajaId: number;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_anulado: string;

  @Column({ type: 'datetime', nullable: true })
  fec_anulacion: Date;

  @Column({ type: 'int', nullable: true })
  Idsucursal: number;

  @Column()
  empresaId: number;

  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\cxc\entities\cxccajamae.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('cxccajamae')
export class CxccajaMae {
  @PrimaryGeneratedColumn({ name: 'cxccajaId' })
  cxccajaId: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @Column()
  moduloId: number;

  @Column()
  clienteId: number;

  @Column({ type: 'varchar', length: 20 })
  nrocliente: string;

  @Column()
  documentoId: number;

  @Column({ type: 'char', length: 1, default: 'C' })
  tipomov: string;

  @Column({ type: 'varchar', length: 20 })
  nrodocumento: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  concepto: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_cotabilizada: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_anulado: string;

  @Column({ type: 'datetime', nullable: true })
  fec_anulacion: Date;

  @Column({ type: 'int', nullable: true })
  partidaId: number;

  @Column({ type: 'int', nullable: true })
  Idsucursal: number;

  @Column()
  empresaId: number;

  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\cxc\entities\cxccajero.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('cxccajeros')
export class Cxccajero {
  @PrimaryGeneratedColumn({ name: 'cajaId' })
  cajaId: number;

  @Column({ type: 'varchar', length: 12 })
  usuario: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @Column()
  empresaId: number;

  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\cxc\entities\cxccclientesdir.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('cxccclientesdir')
export class CxccClientesDir {
  @PrimaryGeneratedColumn({ name: 'cxccclientesdirId' })
  cxccclientesdirId: number;

  @Column()
  clienteid: number;

  @Column()
  direccionId: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  descripcion: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @Column({ type: 'int', nullable: true })
  empresaId: number;

  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\cxc\entities\cxccclientesref.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('cxccclientesref')
export class CxccClientesRef {
  @PrimaryGeneratedColumn({ name: 'referenciaId' })
  referenciaId: number;

  @Column()
  clienteId: number;

  @Column({ type: 'varchar', length: 50 })
  nombres: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  apellidos: string;

  @Column({ type: 'datetime', nullable: true })
  fechanacimiento: Date;

  @Column({ type: 'varchar', length: 20, nullable: true })
  dni: string;

  @Column({ type: 'enum', enum: ['AA', 'CO', 'FA'], default: 'FA', nullable: true })
  tiporeferencia: string;

  @Column({ type: 'enum', enum: ['M', 'F'], default: 'M', nullable: true })
  sexo: string;

  @Column({ type: 'enum', enum: ['S', 'C', 'D', 'V', 'U'], default: 'S', nullable: true })
  estadocivil: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telefono1: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telefono2: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  direccion1: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  direccion2: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  lugarTrabajo: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  cargo: string;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0, nullable: true })
  salario: number;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S', nullable: true })
  sn_activo: string;

  @Column({ nullable: true })
  empresaId: number;

  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioCreated: string;

  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\cxc\entities\cxccliente.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('cxcclientes')
export class CxcCliente {
  @PrimaryGeneratedColumn({ name: 'clienteId' })
  clienteId: number;

  @Column({ type: 'varchar', length: 20 })
  nrocliente: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fechanacimiento: Date;

  @Column({ type: 'varchar', length: 50 })
  nombres: string;

  @Column({ type: 'varchar', length: 50 })
  apellidos: string;

  @Column({ type: 'varchar', length: 120 })
  razonsocial: string;

  @Column({ type: 'varchar', length: 20 })
  dni: string;

  @Column({ type: 'enum', enum: ['M', 'F'], default: 'M' })
  sexo: string;

  @Column({ type: 'enum', enum: ['S', 'C', 'D', 'V', 'U'], default: 'S' })
  estadocivil: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  rtn: string;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  limiteCredito: number;

  @Column()
  diasplazo: number;

  @Column({ type: 'decimal', precision: 20, scale: 2 })
  interes: number;

  @Column({ type: 'decimal', precision: 20, scale: 2 })
  moratorio: number;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @Column({ type: 'enum', enum: ['A', 'B', 'C', 'D', 'E'], default: 'A' })
  categoria: string;

  @Column()
  empresaId: number;

  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\cxc\entities\cxchisto.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('cxchisto')
export class CxcHistoro {
  @PrimaryGeneratedColumn({ name: 'historicoclienteId' })
  historicoclienteId: number;

  @Column()
  anio: number;

  @Column()
  periodo: number;

  @Column()
  clienteId: number;

  @Column({ type: 'varchar', length: 20 })
  nrocliente: string;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  saldo: number;

  @Column({ type: 'int', nullable: true })
  empresaId: number;

  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\cxc\entities\cxcmovimiento.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn
} from 'typeorm';
import { Tmodulos } from '../../modules/entities/modulo.entity';

@Entity('cxcmovimientos')
export class CxcMovimiento {
  @PrimaryGeneratedColumn({ name: 'clienteMovId' })
  clienteMovId: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @Column()
  clienteId: number;

  @Column({ type: 'varchar', length: 20 })
  nrocliente: string;

  @Column()
  moduloId: number;

  @ManyToOne(() => Tmodulos, { eager: false })
  @JoinColumn({ name: 'moduloId', referencedColumnName: 'moduloId' })
  modulo: Tmodulos;

  @Column()
  documentoId: number;

  @Column({ type: 'enum', enum: ['D', 'C'], default: 'D' })
  tipomov: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  nroreferencia: string;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  factordecambio: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  importe: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  concepto: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_cotabilizada: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_doc_anulado: string;

  @Column({ type: 'datetime', nullable: true })
  fec_anulacion: Date;

  @Column({ type: 'int', nullable: true })
  partidaId: number;

  @Column({ type: 'int', nullable: true })
  Idsucursal: number;

  @Column()
  empresaId: number;

  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\cxc\entities\cxcpariente.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('cxcparientes')
export class CxcPariente {
  @PrimaryGeneratedColumn({ name: 'parienteId' })
  parienteId: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fechanacimiento: Date;

  @Column()
  clienteId: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  nombres: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  apellidos: string;

  @Column({ type: 'varchar', length: 20 })
  dni: string;

  @Column({ type: 'enum', enum: ['P', 'H', 'E', 'A', 'M'], default: 'M' })
  tipopariente: string;

  @Column({ type: 'enum', enum: ['M', 'F'], default: 'M' })
  sexo: string;

  @Column({ type: 'enum', enum: ['S', 'C', 'D', 'V', 'U'], default: 'S' })
  estadocivil: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telefono1: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  direccion1: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  lugar: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  cargo: string;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  salario: number;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @Column()
  empresaId: number;

  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\cxc\entities\cxcprestamo.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('cxcprestamos')
export class CxcPrestamo {
  @PrimaryGeneratedColumn({ name: 'prestamoId' })
  prestamoId: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @Column({ type: 'varchar', length: 50 })
  nroprestamo: string;

  @Column()
  clienteId: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  capital: number;

  @Column({ type: 'int', nullable: true })
  prima: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  capitalneto: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  tasa: number;

  @Column({ type: 'int', nullable: true })
  cuotas: number;

  @Column({ type: 'int', nullable: true })
  diascuotas: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  moratorio: number;

  @Column({ type: 'int', nullable: true })
  gestorId: number;

  @Column({ type: 'int', nullable: true })
  monedaId: number;

  @Column({ type: 'int', nullable: true })
  gracia: number;

  @Column({ type: 'int', nullable: true })
  ultcuotapagada: number;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_contabilizado: string;

  @Column()
  empresaId: number;

  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\cxc\entities\cxcprestamopp.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('cxcprestamospp')
export class CxcPrestamoPP {
  @PrimaryGeneratedColumn({ name: 'pppId' })
  pppId: number;

  @Column()
  prestamoId: number;

  @Column({ type: 'datetime' })
  FechaPago: Date;

  @Column()
  clienteId: number;

  @Column()
  nrofila: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  vlrcuota: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  capital: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  interes: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  mora: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  saldo: number;

  @Column({ type: 'int', nullable: true })
  diasvencido: number;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_pagada: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_anulada: string;

  @Column()
  empresaId: number;

  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\cxc\entities\cxcsalfav.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('cxcsalfav')
export class CxcSalFav {
  @PrimaryGeneratedColumn({ name: 'cxcsalfavId' })
  cxcsalfavId: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @Column()
  anio: number;

  @Column()
  periodo: number;

  @Column()
  clienteId: number;

  @Column({ type: 'varchar', length: 20 })
  nrocliente: string;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  importe: number;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_aplicado: string;

  @Column({ type: 'datetime', nullable: true })
  fec_proceso: Date;

  @Column({ type: 'int', nullable: true })
  empresaId: number;

  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\cxc\entities\tcctdiascobro.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('tcctdiascobros')
export class TcctDiasCobro {
  @PrimaryGeneratedColumn({ name: 'tdiascobrosId' })
  tdiascobrosId: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  descripcion: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @Column()
  empresaId: number;

  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\cxp\cxp.controller.ts

```typescript
import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CxpService } from './cxp.service';
import { CreateProveedorDto, UpdateProveedorDto } from './dto/proveedor.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('CxP')
@ApiBearerAuth()
@Controller('cxp')
@UseGuards(JwtAuthGuard)
export class CxpController {
  constructor(private readonly service: CxpService) {}

  @Get('proveedores')
  @ApiOperation({ summary: 'Listar proveedores' })
  @ApiResponse({ status: 200, description: 'Lista de proveedores obtenida exitosamente' })
  findAllProveedores(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllProveedores(empresaId);
  }

  @Get('proveedores-pag')
  @ApiOperation({ summary: 'Listar proveedores paginados' })
  findProveedoresPag(
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
  ) {
    return this.service.findProveedoresPag(empresaId, Number(page) || 1, Number(limit) || 15, q || '');
  }

  @Get('proveedores/:id')
  @ApiOperation({ summary: 'Obtener proveedor por ID' })
  @ApiResponse({ status: 200, description: 'Proveedor encontrado' })
  @ApiResponse({ status: 404, description: 'Proveedor no encontrado' })
  findProveedor(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findProveedor(id, empresaId);
  }

  @Post('proveedores')
  @ApiOperation({ summary: 'Crear proveedor' })
  @ApiResponse({ status: 201, description: 'Proveedor creado exitosamente' })
  createProveedor(@Body() dto: CreateProveedorDto, @CurrentUser() user: any) {
    return this.service.createProveedor(dto, user.usuario);
  }

  @Put('proveedores/:id')
  @ApiOperation({ summary: 'Actualizar proveedor' })
  @ApiResponse({ status: 200, description: 'Proveedor actualizado exitosamente' })
  updateProveedor(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateProveedorDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateProveedor(id, empresaId, dto, user.usuario);
  }

  @Get('proveedores-dir')
  @ApiOperation({ summary: 'Listar direcciones de proveedores' })
  @ApiResponse({ status: 200, description: 'Lista de direcciones de proveedores obtenida exitosamente' })
  findAllProveedorDirs(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllProveedorDirs(empresaId);
  }

  @Get('proveedores-tel')
  @ApiOperation({ summary: 'Listar teléfonos de proveedores' })
  @ApiResponse({ status: 200, description: 'Lista de teléfonos de proveedores obtenida exitosamente' })
  findAllProveedorTels(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllProveedorTels(empresaId);
  }

  @Get('compras')
  @ApiOperation({ summary: 'Listar compras' })
  @ApiResponse({ status: 200, description: 'Lista de compras obtenida exitosamente' })
  findAllCompras(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllCompras(empresaId);
  }

  @Get('compras/:id')
  @ApiOperation({ summary: 'Obtener compra por ID' })
  @ApiResponse({ status: 200, description: 'Compra encontrada' })
  @ApiResponse({ status: 404, description: 'Compra no encontrada' })
  findCompra(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findCompra(id, empresaId);
  }

  @Get('compras-det')
  @ApiOperation({ summary: 'Listar detalle de compras' })
  @ApiResponse({ status: 200, description: 'Lista de detalle de compras obtenida exitosamente' })
  findAllComprasDet(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllComprasDet(empresaId);
  }

  @Get('compras/:id/detalles')
  @ApiOperation({ summary: 'Obtener detalles de una compra' })
  findComprasDetByCompra(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findComprasDetByCompra(id, empresaId);
  }

  @Post('compras')
  @ApiOperation({ summary: 'Crear compra con detalles' })
  @ApiResponse({ status: 201, description: 'Compra creada exitosamente' })
  createCompra(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createCompra(dto, user.usuario);
  }

  @Put('compras/:id')
  @ApiOperation({ summary: 'Actualizar compra' })
  @ApiResponse({ status: 200, description: 'Compra actualizada exitosamente' })
  updateCompra(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateCompra(id, empresaId, dto, user.usuario);
  }

  @Put('compras/:id/anular')
  @ApiOperation({ summary: 'Anular compra (reversa kardex + movimiento CxP)' })
  @ApiResponse({ status: 200, description: 'Compra anulada exitosamente' })
  deleteCompra(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @CurrentUser() user: any,
  ) {
    return this.service.deleteCompra(id, empresaId, user.usuario);
  }

  @Put('compras/:id/procesar')
  @ApiOperation({ summary: 'Procesar compra (kardex entrada + movimiento CxP débito)' })
  @ApiResponse({ status: 200, description: 'Compra procesada exitosamente' })
  procesarCompra(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @CurrentUser() user: any,
  ) {
    return this.service.procesarCompra(id, empresaId, user.usuario);
  }

  @Get('movimientos')
  @ApiOperation({ summary: 'Listar movimientos de cuentas por pagar' })
  @ApiResponse({ status: 200, description: 'Lista de movimientos obtenida exitosamente' })
  findAllMovimientos(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllMovimientos(empresaId);
  }

  @Get('movimientos/proveedor/:proveedorId')
  @ApiOperation({ summary: 'Listar movimientos por proveedor' })
  findMovimientosByProveedor(
    @Param('proveedorId', ParseIntPipe) proveedorId: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findMovimientosByProveedor(proveedorId, empresaId);
  }

  @Post('movimientos')
  @ApiOperation({ summary: 'Crear movimiento' })
  createMovimiento(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createMovimiento(dto, user.usuario);
  }

  @Get('historicos')
  @ApiOperation({ summary: 'Listar históricos de cuentas por pagar' })
  @ApiResponse({ status: 200, description: 'Lista de históricos obtenida exitosamente' })
  findAllHistoricos(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllHistoricos(empresaId);
  }

  @Get('saldos-av')
  @ApiOperation({ summary: 'Listar saldos anticipo de proveedores' })
  @ApiResponse({ status: 200, description: 'Lista de saldos obtenida exitosamente' })
  findAllSaldosAv(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllSaldosAv(empresaId);
  }

  @Delete('compras-det/:id')
  @ApiOperation({ summary: 'Eliminar detalle de compra' })
  deleteCompraDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.deleteCompraDet(id, empresaId);
  }

  @Post('compras-det')
  @ApiOperation({ summary: 'Crear detalle de compra' })
  @ApiResponse({ status: 201, description: 'Detalle creado exitosamente' })
  createCompraDet(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createCompraDet(dto, user.usuario);
  }

  @Put('compras-det/:id')
  @ApiOperation({ summary: 'Actualizar detalle de compra' })
  @ApiResponse({ status: 200, description: 'Detalle actualizado exitosamente' })
  updateCompraDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateCompraDet(id, empresaId, dto, user.usuario);
  }
}

```

---

## 📄 src\modules\cxp\cxp.module.ts

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TCxpProveedor } from './entities/proveedor.entity';
import { TCxpProveedorDir } from './entities/proveedordir.entity';
import { TCxpProveedorTel } from './entities/proveedortel.entity';
import { TCxpCompraMae } from './entities/compra-mae.entity';
import { TCxpCompraDet } from './entities/compra-det.entity';
import { TCxpMovimiento } from './entities/movimiento.entity';
import { TCxpHistorico } from './entities/historico.entity';
import { TCxpSaldoAv } from './entities/saldoav.entity';
import { Tproducto } from '../inventario/entities/producto.entity';
import { TPosPrecioVtas } from '../facturacion/entities/tpospreciovtas.entity';
import { CxpService } from './cxp.service';
import { CxpController } from './cxp.controller';
import { InventarioModule } from '../inventario/inventario.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    TypeOrmModule.forFeature([
      TCxpProveedor,
      TCxpProveedorDir,
      TCxpProveedorTel,
      TCxpCompraMae,
      TCxpCompraDet,
      TCxpMovimiento,
      TCxpHistorico,
      TCxpSaldoAv,
      Tproducto,
      TPosPrecioVtas,
    ]),
    InventarioModule,
  ],
  controllers: [CxpController],
  providers: [CxpService],
  exports: [CxpService],
})
export class CxpModule {}

```

---

## 📄 src\modules\cxp\cxp.service.ts

```typescript
import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ObjectLiteral } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TCxpProveedor } from './entities/proveedor.entity';
import { TCxpProveedorDir } from './entities/proveedordir.entity';
import { TCxpProveedorTel } from './entities/proveedortel.entity';
import { TCxpCompraMae } from './entities/compra-mae.entity';
import { TCxpCompraDet } from './entities/compra-det.entity';
import { TCxpMovimiento } from './entities/movimiento.entity';
import { TCxpHistorico } from './entities/historico.entity';
import { TCxpSaldoAv } from './entities/saldoav.entity';
import { CreateProveedorDto, UpdateProveedorDto } from './dto/proveedor.dto';
import { KardexService } from '../inventario/kardex.service';
import { Tproducto } from '../inventario/entities/producto.entity';
import { TPosPrecioVtas } from '../facturacion/entities/tpospreciovtas.entity';

@Injectable()
export class CxpService {
  constructor(
    @InjectRepository(TCxpProveedor) private readonly proveedorRepo: Repository<TCxpProveedor>,
    @InjectRepository(TCxpProveedorDir) private readonly proveedorDirRepo: Repository<TCxpProveedorDir>,
    @InjectRepository(TCxpProveedorTel) private readonly proveedorTelRepo: Repository<TCxpProveedorTel>,
    @InjectRepository(TCxpCompraMae) private readonly compraMaeRepo: Repository<TCxpCompraMae>,
    @InjectRepository(TCxpCompraDet) private readonly compraDetRepo: Repository<TCxpCompraDet>,
    @InjectRepository(TCxpMovimiento) private readonly movimientoRepo: Repository<TCxpMovimiento>,
    @InjectRepository(TCxpHistorico) private readonly historicoRepo: Repository<TCxpHistorico>,
    @InjectRepository(TCxpSaldoAv) private readonly saldoAvRepo: Repository<TCxpSaldoAv>,
    @InjectRepository(Tproducto) private readonly productoRepo: Repository<Tproducto>,
    @InjectRepository(TPosPrecioVtas) private readonly posPrecioVtaRepo: Repository<TPosPrecioVtas>,
    @Inject(forwardRef(() => KardexService)) private readonly kardexService: KardexService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private async findAllByEmpresa<T extends ObjectLiteral>(repo: Repository<T>, empresaId: number) {
    return repo.find({
      where: { empresaId } as unknown as FindOptionsWhere<T>,
      order: { empresaId: 'ASC' } as any,
    });
  }

  private async findOneById<T extends ObjectLiteral>(
    repo: Repository<T>,
    idField: string,
    id: number | string,
    empresaId: number,
    entityName: string,
  ) {
    const where = { [idField]: id, empresaId } as unknown as FindOptionsWhere<T>;
    const found = await repo.findOne({ where });
    if (!found) throw new NotFoundException(`${entityName} ${id} no encontrado`);
    return found;
  }

  private async createEntity<T extends ObjectLiteral>(
    repo: Repository<T>,
    dto: any,
    currentUser: string,
  ): Promise<T> {
    const entity = repo.create({
      ...dto,
      usuarioCreated: currentUser,
    });
    const saved = await repo.save(entity);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  private async updateEntity<T extends ObjectLiteral>(
    repo: Repository<T>,
    idField: string,
    id: number | string,
    empresaId: number,
    dto: any,
    currentUser: string,
    entityName: string,
  ) {
    const entity = await this.findOneById(repo, idField, id, empresaId, entityName);
    Object.assign(entity, dto, {
      usuarioUpdated: currentUser,
      fechaUpdated: new Date(),
    });
    return repo.save(entity);
  }

  private async softDelete<T extends ObjectLiteral>(
    repo: Repository<T>,
    idField: string,
    id: number | string,
    empresaId: number,
    entityName: string,
  ) {
    const entity = await this.findOneById(repo, idField, id, empresaId, entityName);
    Object.assign(entity, {
      sn_activo: 'N',
      fechaUpdated: new Date(),
    });
    return repo.save(entity);
  }

  async findAllProveedores(empresaId: number) {
    return this.findAllByEmpresa(this.proveedorRepo, empresaId);
  }

  async findProveedoresPag(empresaId: number, page: number, limit: number, q: string) {
    const qb = this.proveedorRepo.createQueryBuilder('p')
      .where('p.empresaId = :empresaId', { empresaId });

    if (q && q.trim()) {
      const term = `%${q.trim()}%`;
      qb.andWhere('(p.nombres LIKE :q OR p.apellidos LIKE :q OR p.nroproveedor LIKE :q OR p.rtn LIKE :q OR p.dni LIKE :q)', { q: term });
    }

    const total = await qb.getCount();
    const data = await qb
      .orderBy('p.proveedorId', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { data, total };
  }

  async findProveedor(proveedorId: number, empresaId: number) {
    return this.findOneById(this.proveedorRepo, 'proveedorId', proveedorId, empresaId, 'Proveedor');
  }

  async createProveedor(dto: CreateProveedorDto, currentUser: string) {
    return this.createEntity(this.proveedorRepo, dto, currentUser);
  }

  async updateProveedor(proveedorId: number, empresaId: number, dto: UpdateProveedorDto, currentUser: string) {
    return this.updateEntity(this.proveedorRepo, 'proveedorId', proveedorId, empresaId, dto, currentUser, 'Proveedor');
  }

  async removeProveedor(proveedorId: number, empresaId: number) {
    return this.softDelete(this.proveedorRepo, 'proveedorId', proveedorId, empresaId, 'Proveedor');
  }

  async findAllProveedorDirs(empresaId: number) {
    return this.findAllByEmpresa(this.proveedorDirRepo, empresaId);
  }

  async findProveedorDir(proveedorId: number, empresaId: number) {
    return this.findOneById(this.proveedorDirRepo, 'proveedordireccionId', proveedorId, empresaId, 'Direccion Proveedor');
  }

  async createProveedorDir(dto: any, currentUser: string) {
    return this.createEntity(this.proveedorDirRepo, dto, currentUser);
  }

  async updateProveedorDir(proveedorId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.proveedorDirRepo, 'proveedordireccionId', proveedorId, empresaId, dto, currentUser, 'Direccion Proveedor');
  }

  async findAllProveedorTels(empresaId: number) {
    return this.findAllByEmpresa(this.proveedorTelRepo, empresaId);
  }

  async findProveedorTel(proveedorId: number, empresaId: number) {
    return this.findOneById(this.proveedorTelRepo, 'proveedorestelefonosId', proveedorId, empresaId, 'Telefono Proveedor');
  }

  async createProveedorTel(dto: any, currentUser: string) {
    return this.createEntity(this.proveedorTelRepo, dto, currentUser);
  }

  async updateProveedorTel(proveedorId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.proveedorTelRepo, 'proveedorestelefonosId', proveedorId, empresaId, dto, currentUser, 'Telefono Proveedor');
  }

  async findAllCompras(empresaId: number) {
    return this.findAllByEmpresa(this.compraMaeRepo, empresaId);
  }

  async findCompra(compraId: number, empresaId: number) {
    return this.findOneById(this.compraMaeRepo, 'compraId', compraId, empresaId, 'Compra');
  }

  async createCompra(dto: any, currentUser: string) {
    const compra = await this.createEntity<TCxpCompraMae>(this.compraMaeRepo, {
      TipoCompra: dto.TipoCompra || 'F',
      bodegaId: dto.bodegaId,
      proveedorId: dto.proveedorId,
      documentoId: dto.documentoId,
      nroreferencia: dto.nroreferencia,
      monedaId: dto.monedaId,
      factorcambio: dto.factorcambio || 1,
      subtotal: 0,
      descuento: 0,
      impuesto: 0,
      total: 0,
      sn_pagada: 'N',
      sn_cotabilizada: 'N',
      sn_anulada: 'N',
      empresaId: dto.empresaId,
    }, currentUser);

    if (dto.detalles && Array.isArray(dto.detalles) && dto.detalles.length > 0) {
      for (let i = 0; i < dto.detalles.length; i++) {
        const det = dto.detalles[i];
        await this.createEntity(this.compraDetRepo, {
          compraId: compra.compraId,
          bodegaId: det.bodegaId || compra.bodegaId,
          nrofila: i + 1,
          codbarra: det.codbarra,
          descripcion: det.descripcion,
          cantidad: det.cantidad,
          precio: det.precio,
          subtotal: det.subtotal || (det.cantidad * det.precio),
          empresaId: compra.empresaId,
        }, currentUser);
      }
      await this.actualizarTotalCompra(compra.compraId, compra.empresaId);
    }

    this.eventEmitter.emit('compra.creada', { compra, currentUser });
    return compra;
  }

  private async actualizarTotalCompra(compraId: number, empresaId: number): Promise<void> {
    const detalles = await this.compraDetRepo.find({
      where: { compraId, empresaId } as unknown as FindOptionsWhere<TCxpCompraDet>,
    });
    const subtotal = detalles.reduce((sum, d) => sum + Number(d.subtotal || 0), 0);
    const compra = await this.findOneById(this.compraMaeRepo, 'compraId', compraId, empresaId, 'Compra');
    compra.subtotal = subtotal;
    compra.total = subtotal;
    await this.compraMaeRepo.save(compra);
  }

  async procesarCompra(compraId: number, empresaId: number, currentUser: string) {
    const compra = await this.findOneById(this.compraMaeRepo, 'compraId', compraId, empresaId, 'Compra');

    if (compra.sn_anulada === 'S') {
      throw new BadRequestException('La compra está anulada y no se puede procesar');
    }

    const detalles = await this.compraDetRepo.find({
      where: { compraId, empresaId } as unknown as FindOptionsWhere<TCxpCompraDet>,
    });
    if (detalles.length === 0) {
      throw new BadRequestException('La compra no tiene detalles para procesar');
    }

    await this.actualizarTotalCompra(compraId, empresaId);

    try {
      await this.registrarKardexEntrada(compraId, empresaId, currentUser);
    } catch (error) {
      console.error('Error registrando Kardex entrada compra:', error);
      throw error;
    }

    try {
      await this.crearMovimientoCxP(compra, currentUser);
    } catch (error) {
      console.error('Error creando movimiento CxP compra:', error);
      throw error;
    }

    compra.sn_procesada = 'S';
    await this.compraMaeRepo.save(compra);

    this.eventEmitter.emit('compra.procesada', { compra, currentUser });
    return { message: 'Compra procesada exitosamente', compraId };
  }

  private async registrarKardexEntrada(compraId: number, empresaId: number, currentUser: string): Promise<void> {
    const detalles = await this.compraDetRepo.find({
      where: { compraId, empresaId } as unknown as FindOptionsWhere<TCxpCompraDet>,
    });

    const compra = await this.findOneById(this.compraMaeRepo, 'compraId', compraId, empresaId, 'Compra');

    for (const det of detalles) {
      if (!det.codbarra) continue;
      const prod = await this.productoRepo.findOne({ where: { codbarra: det.codbarra, empresaId } as any });
      if (!prod) continue;
      await this.kardexService.registrarEntrada({
        bodegaId: det.bodegaId,
        productoId: prod.produtoId,
        cantidad: det.cantidad,
        costoUnitario: det.precio,
        nroreferencia: compraId.toString(),
        moduloId: 2,
        tipomov: 'E',
        subtipoMov: 'C',
        empresaId,
        usuarioCreated: currentUser,
        factordecambio: compra.factorcambio || 1,
        codbarra: det.codbarra,
      });
    }
  }

  private async crearMovimientoCxP(compra: TCxpCompraMae, currentUser: string): Promise<void> {
    const proveedor = await this.findOneById(
      this.proveedorRepo, 'proveedorId', compra.proveedorId, compra.empresaId, 'Proveedor',
    );

    await this.createEntity(this.movimientoRepo, {
      bcoctasId: 0,
      moduloId: 2,
      documentoId: compra.documentoId || 1,
      proveedorId: compra.proveedorId,
      codproveedor: proveedor.nroproveedor,
      tipomov: 'D',
      nroreferencia: compra.compraId.toString(),
      descripcion1: `Compra #${compra.compraId}`,
      descripcion2: proveedor.razonsocial || `${proveedor.nombres} ${proveedor.apellidos}`,
      importe: compra.total,
      sn_chq: 'N',
      sn_chq_anulado: 'N',
      sn_conciliado: 'N',
      sn_contabilizado: 'N',
      sn_doc_anulado: 'N',
      empresaId: compra.empresaId,
    }, currentUser);
  }

  async updateCompra(compraId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.compraMaeRepo, 'compraId', compraId, empresaId, dto, currentUser, 'Compra');
  }

  async deleteCompra(compraId: number, empresaId: number, currentUser: string) {
    const compra = await this.findOneById(this.compraMaeRepo, 'compraId', compraId, empresaId, 'Compra');
    if (compra.sn_anulada === 'S') {
      throw new BadRequestException('La compra ya está anulada');
    }
    compra.sn_anulada = 'S';
    compra.usuarioUpdated = currentUser;
    compra.fechaUpdated = new Date();
    await this.compraMaeRepo.save(compra);

    const detalles = await this.compraDetRepo.find({
      where: { compraId, empresaId } as unknown as FindOptionsWhere<TCxpCompraDet>,
    });

    for (const det of detalles) {
      try {
        if (!det.codbarra) continue;
        const prod = await this.productoRepo.findOne({ where: { codbarra: det.codbarra, empresaId } as any });
        if (!prod) continue;
        await this.kardexService.registrarSalida({
          bodegaId: det.bodegaId,
          productoId: prod.produtoId,
          cantidad: det.cantidad,
          costoUnitario: det.precio,
          nroreferencia: compraId.toString(),
          moduloId: 2,
          tipomov: 'S',
          subtipoMov: 'AN',
          empresaId,
          usuarioCreated: currentUser,
          codbarra: det.codbarra,
        });
      } catch (error) {
        console.error('Error reversando Kardex en anulación de compra:', error);
      }
    }

    try {
      const movimientos = await this.movimientoRepo.find({
        where: {
          proveedorId: compra.proveedorId,
          empresaId,
          nroreferencia: compraId.toString(),
        } as unknown as FindOptionsWhere<TCxpMovimiento>,
      });
      for (const mov of movimientos) {
        mov.sn_doc_anulado = 'S';
        mov.fec_anulacion = new Date();
        mov.usuarioUpdated = currentUser;
        mov.fechaUpdated = new Date();
        await this.movimientoRepo.save(mov);
      }
    } catch (error) {
      console.error('Error anulando movimientos CxP:', error);
    }

    return { message: 'Compra anulada exitosamente' };
  }

  async findAllComprasDet(empresaId: number) {
    return this.findAllByEmpresa(this.compraDetRepo, empresaId);
  }

  async findComprasDetByCompra(compraId: number, empresaId: number) {
    return this.compraDetRepo.find({
      where: { compraId, empresaId } as unknown as FindOptionsWhere<TCxpCompraDet>,
      order: { nrofila: 'ASC' } as any,
    });
  }

  async findCompraDet(cxpcomprasdetId: number, empresaId: number) {
    return this.findOneById(this.compraDetRepo, 'cxpcomprasdetId', cxpcomprasdetId, empresaId, 'Detalle Compra');
  }

  async createCompraDet(dto: any, currentUser: string) {
    if (!dto.nrofila) {
      const existentes = await this.compraDetRepo.find({
        where: { compraId: dto.compraId, empresaId: dto.empresaId } as unknown as FindOptionsWhere<TCxpCompraDet>,
      });
      const maxNro = existentes.reduce((max, d) => Math.max(max, d.nrofila || 0), 0);
      dto.nrofila = maxNro + 1;
    }

    // Calcular precioventa desde tpospreciovtas si se envía preciovtaId
    if (dto.preciovtaId && dto.precio) {
      const pvta = await this.posPrecioVtaRepo.findOne({ where: { preciovtaId: dto.preciovtaId, empresaId: dto.empresaId } as any });
      if (pvta && pvta.porcentaje) {
        dto.precioventa = Number(dto.precio) * (1 + pvta.porcentaje / 100);
      }
    }

    const det = await this.createEntity(this.compraDetRepo, dto, currentUser);
    await this.actualizarTotalCompra(dto.compraId, dto.empresaId);
    return det;
  }

  async updateCompraDet(cxpcomprasdetId: number, empresaId: number, dto: any, currentUser: string) {
    // Calcular precioventa desde tpospreciovtas si se envía preciovtaId
    if (dto.preciovtaId && dto.precio) {
      const pvta = await this.posPrecioVtaRepo.findOne({ where: { preciovtaId: dto.preciovtaId, empresaId } as any });
      if (pvta && pvta.porcentaje) {
        dto.precioventa = Number(dto.precio) * (1 + pvta.porcentaje / 100);
      }
    }

    return this.updateEntity(this.compraDetRepo, 'cxpcomprasdetId', cxpcomprasdetId, empresaId, dto, currentUser, 'Detalle Compra');
  }

  async deleteCompraDet(cxpcomprasdetId: number, empresaId: number) {
    const det = await this.findOneById(this.compraDetRepo, 'cxpcomprasdetId', cxpcomprasdetId, empresaId, 'Detalle Compra');
    const compraId = det.compraId;
    await this.compraDetRepo.remove(det);
    await this.actualizarTotalCompra(compraId, empresaId);
    return { message: 'Detalle eliminado' };
  }

  async findAllMovimientos(empresaId: number) {
    return this.findAllByEmpresa(this.movimientoRepo, empresaId);
  }

  async findMovimientosByProveedor(proveedorId: number, empresaId: number) {
    return this.movimientoRepo.find({
      where: { proveedorId, empresaId } as unknown as FindOptionsWhere<TCxpMovimiento>,
      order: { fecharegistro: 'DESC' } as any,
    });
  }

  async findMovimiento(bcomovId: number, empresaId: number) {
    return this.findOneById(this.movimientoRepo, 'bcomovId', bcomovId, empresaId, 'Movimiento');
  }

  async createMovimiento(dto: any, currentUser: string) {
    return this.createEntity(this.movimientoRepo, dto, currentUser);
  }

  async updateMovimiento(bcomovId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.movimientoRepo, 'bcomovId', bcomovId, empresaId, dto, currentUser, 'Movimiento');
  }

  async findAllHistoricos(empresaId: number) {
    return this.findAllByEmpresa(this.historicoRepo, empresaId);
  }

  async findHistorico(cxphistoId: number, empresaId: number) {
    return this.findOneById(this.historicoRepo, 'cxphistoId', cxphistoId, empresaId, 'Historico');
  }

  async createHistorico(dto: any, currentUser: string) {
    return this.createEntity(this.historicoRepo, dto, currentUser);
  }

  async updateHistorico(cxphistoId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.historicoRepo, 'cxphistoId', cxphistoId, empresaId, dto, currentUser, 'Historico');
  }

  async findAllSaldosAv(empresaId: number) {
    return this.findAllByEmpresa(this.saldoAvRepo, empresaId);
  }

  async findSaldoAv(cxpsalfavId: number, empresaId: number) {
    return this.findOneById(this.saldoAvRepo, 'cxpsalfavId', cxpsalfavId, empresaId, 'Saldo A favor');
  }

  async createSaldoAv(dto: any, currentUser: string) {
    return this.createEntity(this.saldoAvRepo, dto, currentUser);
  }

  async updateSaldoAv(cxpsalfavId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.saldoAvRepo, 'cxpsalfavId', cxpsalfavId, empresaId, dto, currentUser, 'Saldo A favor');
  }
}

```

---

## 📄 src\modules\cxp\dto\proveedor.dto.ts

```typescript
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProveedorDto {
  @ApiProperty({ description: 'Número de Proveedor' })
  @IsString() @IsNotEmpty()
  nroproveedor: string;

  @ApiProperty({ description: 'Nombres' })
  @IsString() @IsNotEmpty()
  nombres: string;

  @ApiProperty({ description: 'Apellidos' })
  @IsString() @IsNotEmpty()
  apellidos: string;

  @ApiProperty({ description: 'Razón Social', required: false })
  @IsString() @IsOptional()
  razonsocial?: string;

  @ApiProperty({ description: 'DNI', required: false })
  @IsString() @IsOptional()
  dni?: string;

  @ApiProperty({ description: 'Sexo', enum: ['M', 'F'], required: false })
  @IsEnum(['M', 'F']) @IsOptional()
  sexo?: string;

  @ApiProperty({ description: 'Estado Civil', enum: ['S', 'C', 'D', 'V', 'U'], required: false })
  @IsEnum(['S', 'C', 'D', 'V', 'U']) @IsOptional()
  estadocivil?: string;

  @ApiProperty({ description: 'RTN', required: false })
  @IsString() @IsOptional()
  rtn?: string;

  @ApiProperty({ description: 'Límite de Crédito', required: false })
  @IsNumber() @IsOptional()
  limiteCredito?: number;

  @ApiProperty({ description: 'Días de Plazo' })
  @IsNumber()
  diasplazo: number;

  @ApiProperty({ description: 'Interés' })
  @IsNumber()
  interes: number;

  @ApiProperty({ description: 'Moratorio' })
  @IsNumber()
  moratorio: number;

  @ApiProperty({ description: 'Categoría', enum: ['A', 'B', 'C', 'D', 'E'], required: false })
  @IsEnum(['A', 'B', 'C', 'D', 'E']) @IsOptional()
  categoria?: string;

  @ApiProperty({ description: 'ID de Empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdateProveedorDto {
  @ApiProperty({ description: 'Número de Proveedor', required: false })
  @IsString() @IsOptional()
  nroproveedor?: string;

  @ApiProperty({ description: 'Nombres', required: false })
  @IsString() @IsOptional()
  nombres?: string;

  @ApiProperty({ description: 'Apellidos', required: false })
  @IsString() @IsOptional()
  apellidos?: string;

  @ApiProperty({ description: 'Razón Social', required: false })
  @IsString() @IsOptional()
  razonsocial?: string;

  @ApiProperty({ description: 'DNI', required: false })
  @IsString() @IsOptional()
  dni?: string;

  @ApiProperty({ description: 'Sexo', enum: ['M', 'F'], required: false })
  @IsEnum(['M', 'F']) @IsOptional()
  sexo?: string;

  @ApiProperty({ description: 'Estado Civil', enum: ['S', 'C', 'D', 'V', 'U'], required: false })
  @IsEnum(['S', 'C', 'D', 'V', 'U']) @IsOptional()
  estadocivil?: string;

  @ApiProperty({ description: 'RTN', required: false })
  @IsString() @IsOptional()
  rtn?: string;

  @ApiProperty({ description: 'Límite de Crédito', required: false })
  @IsNumber() @IsOptional()
  limiteCredito?: number;

  @ApiProperty({ description: 'Días de Plazo', required: false })
  @IsNumber() @IsOptional()
  diasplazo?: number;

  @ApiProperty({ description: 'Interés', required: false })
  @IsNumber() @IsOptional()
  interes?: number;

  @ApiProperty({ description: 'Moratorio', required: false })
  @IsNumber() @IsOptional()
  moratorio?: number;

  @ApiProperty({ description: 'Activo', enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;

  @ApiProperty({ description: 'Categoría', enum: ['A', 'B', 'C', 'D', 'E'], required: false })
  @IsEnum(['A', 'B', 'C', 'D', 'E']) @IsOptional()
  categoria?: string;
}

```

---

## 📄 src\modules\cxp\entities\compra-det.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('cxpcomprasdet')
export class TCxpCompraDet {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'cxpcomprasdetId' })
  cxpcomprasdetId: number;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @ApiProperty()
  @Column()
  compraId: number;

  @ApiProperty()
  @Column()
  bodegaId: number;

  @ApiProperty()
  @Column()
  nrofila: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  codbarra: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 50, nullable: true })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  cantidad: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  precio: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  precioventa: number;

  @ApiProperty({ required: false, description: 'ID de precio de venta' })
  @Column({ type: 'int', nullable: true })
  preciovtaId: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  subtotal: number;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\cxp\entities\compra-mae.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('cxpcomprasmae')
export class TCxpCompraMae {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'compraId' })
  compraId: number;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['F', 'O'], default: 'F' })
  TipoCompra: string;

  @ApiProperty()
  @Column()
  bodegaId: number;

  @ApiProperty()
  @Column()
  proveedorId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  documentoId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  monedaId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'decimal', precision: 18, scale: 4, nullable: true })
  factorcambio: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  nroreferencia: string;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  subtotal: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  descuento: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  impuesto: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  total: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_procesada: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_pagada: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_cotabilizada: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_anulada: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\cxp\entities\historico.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('cxphisto')
export class TCxpHistorico {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'cxphistoId' })
  cxphistoId: number;

  @ApiProperty()
  @Column()
  anio: number;

  @ApiProperty()
  @Column()
  periodo: number;

  @ApiProperty()
  @Column()
  proveedorId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  codproveedor: string;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  saldo: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\cxp\entities\movimiento.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('cxpmovimientos')
export class TCxpMovimiento {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'bcomovId' })
  bcomovId: number;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @ApiProperty()
  @Column({ type: 'int', nullable: true })
  bcoctasId: number;

  @ApiProperty()
  @Column()
  moduloId: number;

  @ApiProperty()
  @Column()
  documentoId: number;

  @ApiProperty()
  @Column()
  proveedorId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  codproveedor: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['D', 'C'], default: 'D' })
  tipomov: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  nroreferencia: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 100, nullable: true })
  descripcion1: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 100, nullable: true })
  descripcion2: string;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  importe: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  nrochq: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_chq: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_chq_anulado: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_conciliado: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_contabilizado: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_doc_anulado: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fec_anulacion: Date;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  partidaId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  Idsucursal: number;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\cxp\entities\proveedor.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('proveedor')
export class TCxpProveedor {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'proveedorId' })
  proveedorId: number;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  nroproveedor: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  nombres: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  apellidos: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 120, nullable: true })
  razonsocial: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  dni: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['M', 'F'], default: 'M' })
  sexo: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'C', 'D', 'V', 'U'], default: 'S' })
  estadocivil: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 50, nullable: true })
  rtn: string;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  limiteCredito: number;

  @ApiProperty()
  @Column({ type: 'int' })
  diasplazo: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2 })
  interes: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2 })
  moratorio: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['A', 'B', 'C', 'D', 'E'], default: 'A' })
  categoria: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\cxp\entities\proveedordir.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('proveedordir')
export class TCxpProveedorDir {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'proveedordireccionId' })
  proveedordireccionId: number;

  @ApiProperty()
  @Column()
  proveedorId: number;

  @ApiProperty()
  @Column({ type: 'int' })
  direccionId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 10, nullable: true })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\cxp\entities\proveedortel.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('proveedortel')
export class TCxpProveedorTel {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'proveedorestelefonosId' })
  proveedorestelefonosId: number;

  @ApiProperty()
  @Column()
  proveedorId: number;

  @ApiProperty()
  @Column({ type: 'int' })
  telefonoId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 10, nullable: true })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\cxp\entities\saldoav.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('cxpsalfav')
export class TCxpSaldoAv {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'cxpsalfavId' })
  cxpsalfavId: number;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @ApiProperty()
  @Column()
  anio: number;

  @ApiProperty()
  @Column()
  periodo: number;

  @ApiProperty()
  @Column()
  proveedorId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  codproveedor: string;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  importe: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_aplicado: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fec_proceso: Date;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\facturacion\dto\facturacion.dto.ts

```typescript
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePosFacMaeDto {
  @ApiProperty({ required: false, description: 'Número de factura' })
  @IsNumber() @IsOptional()
  nrofactura?: number;

  @ApiProperty({ enum: ['E', 'C'], required: false, description: 'Tipo de factura (Electrónica/Contingencia)' })
  @IsEnum(['E', 'C']) @IsOptional()
  tipofactura?: string;

  @ApiProperty({ description: 'ID del cliente' })
  @IsNumber() @IsNotEmpty()
  clienteId: number;

  @ApiProperty({ description: 'Número de cliente' })
  @IsString() @IsNotEmpty()
  nrocliente: string;

  @ApiProperty({ required: false, description: 'Nombre del cliente' })
  @IsString() @IsOptional()
  nombrecliente?: string;

  @ApiProperty({ required: false, description: 'Dirección del cliente' })
  @IsString() @IsOptional()
  direccion?: string;

  @ApiProperty({ required: false, description: 'Factor de cambio' })
  @IsNumber() @IsOptional()
  factordecambio?: number;

  @ApiProperty({ required: false, description: 'Subtotal de la factura' })
  @IsNumber() @IsOptional()
  subTotal?: number;

  @ApiProperty({ required: false, description: 'Monto de impuesto' })
  @IsNumber() @IsOptional()
  impuesto?: number;

  @ApiProperty({ required: false, description: 'Monto de descuento' })
  @IsNumber() @IsOptional()
  descuento?: number;

  @ApiProperty({ required: false, description: 'Total de la factura' })
  @IsNumber() @IsOptional()
  total?: number;

  @ApiProperty({ required: false, description: 'Efectivo recibido' })
  @IsNumber() @IsOptional()
  efectivo_recibido?: number;

  @ApiProperty({ required: false, description: 'Importe de cambio' })
  @IsNumber() @IsOptional()
  importe_cambio?: number;

  @ApiProperty({ required: false, description: 'Días de crédito' })
  @IsNumber() @IsOptional()
  diascredito?: number;

  @ApiProperty({ required: false, description: 'Fecha de vencimiento' })
  @IsString() @IsOptional()
  fechavencimiento?: string;

  @ApiProperty({ description: 'ID de la bodega' })
  @IsNumber() @IsNotEmpty()
  bodegaId: number;

  @ApiProperty({ description: 'ID de la caja' })
  @IsNumber() @IsNotEmpty()
  cajaId: number;

  @ApiProperty({ required: false, description: 'ID del gestor' })
  @IsNumber() @IsOptional()
  gestorId?: number;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Exenta de impuestos' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_excenta?: string;

  @ApiProperty({ required: false, description: 'Número de carnet' })
  @IsString() @IsOptional()
  nrocarnet?: string;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Factura pagada' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_pagada?: string;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Factura anulada' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_anulada?: string;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Factura contabilizada' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_contabilizada?: string;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber() @IsNotEmpty()
  empresaId: number;
}

export class UpdatePosFacMaeDto {
  @ApiProperty({ required: false, description: 'Número de factura' })
  @IsNumber() @IsOptional()
  nrofactura?: number;

  @ApiProperty({ enum: ['E', 'C'], required: false, description: 'Tipo de factura (Electrónica/Contingencia)' })
  @IsEnum(['E', 'C']) @IsOptional()
  tipofactura?: string;

  @ApiProperty({ required: false, description: 'ID del cliente' })
  @IsNumber() @IsOptional()
  clienteId?: number;

  @ApiProperty({ required: false, description: 'Número de cliente' })
  @IsString() @IsOptional()
  nrocliente?: string;

  @ApiProperty({ required: false, description: 'Nombre del cliente' })
  @IsString() @IsOptional()
  nombrecliente?: string;

  @ApiProperty({ required: false, description: 'Dirección del cliente' })
  @IsString() @IsOptional()
  direccion?: string;

  @ApiProperty({ required: false, description: 'Factor de cambio' })
  @IsNumber() @IsOptional()
  factordecambio?: number;

  @ApiProperty({ required: false, description: 'Subtotal de la factura' })
  @IsNumber() @IsOptional()
  subTotal?: number;

  @ApiProperty({ required: false, description: 'Monto de impuesto' })
  @IsNumber() @IsOptional()
  impuesto?: number;

  @ApiProperty({ required: false, description: 'Monto de descuento' })
  @IsNumber() @IsOptional()
  descuento?: number;

  @ApiProperty({ required: false, description: 'Total de la factura' })
  @IsNumber() @IsOptional()
  total?: number;

  @ApiProperty({ required: false, description: 'Efectivo recibido' })
  @IsNumber() @IsOptional()
  efectivo_recibido?: number;

  @ApiProperty({ required: false, description: 'Importe de cambio' })
  @IsNumber() @IsOptional()
  importe_cambio?: number;

  @ApiProperty({ required: false, description: 'Días de crédito' })
  @IsNumber() @IsOptional()
  diascredito?: number;

  @ApiProperty({ required: false, description: 'Fecha de vencimiento' })
  @IsString() @IsOptional()
  fechavencimiento?: string;

  @ApiProperty({ required: false, description: 'ID de la bodega' })
  @IsNumber() @IsOptional()
  bodegaId?: number;

  @ApiProperty({ required: false, description: 'ID de la caja' })
  @IsNumber() @IsOptional()
  cajaId?: number;

  @ApiProperty({ required: false, description: 'ID del gestor' })
  @IsNumber() @IsOptional()
  gestorId?: number;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Exenta de impuestos' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_excenta?: string;

  @ApiProperty({ required: false, description: 'Número de carnet' })
  @IsString() @IsOptional()
  nrocarnet?: string;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Factura pagada' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_pagada?: string;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Factura anulada' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_anulada?: string;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Factura contabilizada' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_contabilizada?: string;
}

export class CreatePosCotMaeDto {
  @ApiProperty({ description: 'Nombre del cliente' })
  @IsString() @IsNotEmpty()
  Nombrecliente: string;

  @ApiProperty({ description: 'Dirección del cliente' })
  @IsString() @IsNotEmpty()
  direccion: string;

  @ApiProperty({ description: 'Nombre de quien atendió' })
  @IsString() @IsNotEmpty()
  atendio: string;

  @ApiProperty({ description: 'ID del gestor' })
  @IsNumber() @IsNotEmpty()
  gestorId: number;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber() @IsNotEmpty()
  empresaId: number;
}

export class UpdatePosCotMaeDto {
  @ApiProperty({ required: false, description: 'Nombre del cliente' })
  @IsString() @IsOptional()
  Nombrecliente?: string;

  @ApiProperty({ required: false, description: 'Dirección del cliente' })
  @IsString() @IsOptional()
  direccion?: string;

  @ApiProperty({ required: false, description: 'Nombre de quien atendió' })
  @IsString() @IsOptional()
  atendio?: string;

  @ApiProperty({ required: false, description: 'ID del gestor' })
  @IsNumber() @IsOptional()
  gestorId?: number;
}

export class CreatePosPedMaeDto {
  @ApiProperty({ description: 'Nombre del cliente' })
  @IsString() @IsNotEmpty()
  nombrecliente: string;

  @ApiProperty({ description: 'Número de teléfono' })
  @IsString() @IsNotEmpty()
  nrotelefono: string;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Envío gratis' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_enviogratis?: string;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Pedido facturado' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_facturado?: string;

  @ApiProperty({ required: false, description: 'ID de la factura asociada' })
  @IsNumber() @IsOptional()
  facturaId?: number;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber() @IsNotEmpty()
  empresaId: number;
}

export class UpdatePosPedMaeDto {
  @ApiProperty({ required: false, description: 'Nombre del cliente' })
  @IsString() @IsOptional()
  nombrecliente?: string;

  @ApiProperty({ required: false, description: 'Número de teléfono' })
  @IsString() @IsOptional()
  nrotelefono?: string;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Envío gratis' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_enviogratis?: string;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Pedido facturado' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_facturado?: string;

  @ApiProperty({ required: false, description: 'ID de la factura asociada' })
  @IsNumber() @IsOptional()
  facturaId?: number;
}

export class CheckoutTiendaDto {
  @ApiProperty({ description: 'ID del carrito (poscotmae)' })
  @IsNumber() @IsNotEmpty()
  poscotmaeId: number;

  @ApiProperty({ description: 'Nombre del cliente' })
  @IsString() @IsNotEmpty()
  nombrecliente: string;

  @ApiProperty({ required: false, description: 'Dirección del cliente' })
  @IsString() @IsOptional()
  direccion?: string;

  @ApiProperty({ description: 'ID de la forma de pago' })
  @IsNumber() @IsNotEmpty()
  formapagoId: number;

  @ApiProperty({ description: 'Efectivo recibido' })
  @IsNumber() @IsOptional()
  efectivo_recibido?: number;

  @ApiProperty({ required: false, description: 'ID de la tarjeta de crédito' })
  @IsNumber() @IsOptional()
  tarjetacreditoId?: number;

  @ApiProperty({ required: false, description: 'Número de tarjeta' })
  @IsString() @IsOptional()
  nrotarjeta?: string;

  @ApiProperty({ required: false, description: 'Número de autorización' })
  @IsString() @IsOptional()
  nroautorizacion?: string;
}

export class CheckoutPedidoDto {
  @ApiProperty({ description: 'ID del pedido (pospedmae)' })
  @IsNumber() @IsNotEmpty()
  pospedmaeId: number;

  @ApiProperty({ description: 'Nombre del cliente' })
  @IsString() @IsNotEmpty()
  nombrecliente: string;

  @ApiProperty({ required: false, description: 'Teléfono del cliente' })
  @IsString() @IsOptional()
  nrotelefono?: string;

  @ApiProperty({ description: 'ID de la forma de pago' })
  @IsNumber() @IsNotEmpty()
  formapagoId: number;

  @ApiProperty({ required: false, description: 'Efectivo recibido' })
  @IsNumber() @IsOptional()
  efectivo_recibido?: number;

  @ApiProperty({ required: false, description: 'ID de la tarjeta de crédito' })
  @IsNumber() @IsOptional()
  tarjetacreditoId?: number;

  @ApiProperty({ required: false, description: 'Número de tarjeta' })
  @IsString() @IsOptional()
  nrotarjeta?: string;

  @ApiProperty({ required: false, description: 'Número de autorización' })
  @IsString() @IsOptional()
  nroautorizacion?: string;

  @ApiProperty({ required: false, description: 'Tipo de pago: T=tarjeta, TR=transferencia, E=efectivo' })
  @IsString() @IsOptional()
  tipopago?: string;
}

```

---

## 📄 src\modules\facturacion\dto\posfaccaja.dto.ts

```typescript
import { IsNumber, IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePosFacCajaDto {
  @ApiProperty({ description: 'ID de la factura' })
  @IsNumber()
  facturaId: number;

  @ApiProperty({ description: 'ID de la forma de pago' })
  @IsNumber()
  formapagoId: number;

  @ApiPropertyOptional({ description: 'ID de la tarjeta de crédito' })
  @IsNumber()
  @IsOptional()
  tarjetacreditoId?: number;

  @ApiPropertyOptional({ description: 'Número de tarjeta' })
  @IsString()
  @IsOptional()
  nrotarjeta?: string;

  @ApiPropertyOptional({ description: 'Número de autorización' })
  @IsString()
  @IsOptional()
  nroautorizacion?: string;

  @ApiPropertyOptional({ description: 'Factor de cambio', default: 0 })
  @IsNumber()
  @IsOptional()
  factordecambio?: number;

  @ApiPropertyOptional({ description: 'Importe en efectivo', default: 0 })
  @IsNumber()
  @IsOptional()
  importe_efectivo?: number;

  @ApiPropertyOptional({ description: 'Importe otros medios de pago', default: 0 })
  @IsNumber()
  @IsOptional()
  importe_otros?: number;

  @ApiPropertyOptional({ description: 'Importe cambio', default: 0 })
  @IsNumber()
  @IsOptional()
  importe_cambio?: number;

  @ApiProperty({ description: 'ID del cajero' })
  @IsNumber()
  cajaId: number;

  @ApiPropertyOptional({ description: 'ID de la empresa' })
  @IsNumber()
  @IsOptional()
  empresaId?: number;

  @ApiPropertyOptional({ description: 'ID de la sucursal' })
  @IsNumber()
  @IsOptional()
  Idsucursal?: number;

  @ApiPropertyOptional({ description: 'Usuario que crea el registro' })
  @IsString()
  @IsOptional()
  usuarioCreated?: string;
}

export class UpdatePosFacCajaDto {
  @ApiPropertyOptional({ description: 'ID de la forma de pago' })
  @IsNumber()
  @IsOptional()
  formapagoId?: number;

  @ApiPropertyOptional({ description: 'ID de la tarjeta de crédito' })
  @IsNumber()
  @IsOptional()
  tarjetacreditoId?: number;

  @ApiPropertyOptional({ description: 'Número de tarjeta' })
  @IsString()
  @IsOptional()
  nrotarjeta?: string;

  @ApiPropertyOptional({ description: 'Número de autorización' })
  @IsString()
  @IsOptional()
  nroautorizacion?: string;

  @ApiPropertyOptional({ description: 'Importe en efectivo', default: 0 })
  @IsNumber()
  @IsOptional()
  importe_efectivo?: number;

  @ApiPropertyOptional({ description: 'Importe otros medios de pago', default: 0 })
  @IsNumber()
  @IsOptional()
  importe_otros?: number;

  @ApiPropertyOptional({ description: 'Importe cambio', default: 0 })
  @IsNumber()
  @IsOptional()
  importe_cambio?: number;

  @ApiPropertyOptional({ description: 'Anulado', enum: ['S', 'N'] })
  @IsEnum(['S', 'N'])
  @IsOptional()
  sn_anulado?: string;
}

```

---

## 📄 src\modules\facturacion\entities\poscbodet.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('poscbodet')
export class TPosCboDet {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'poscbodetId' })
  poscbodetId: number;

  @ApiProperty()
  @Column()
  poscbomaeId: number;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  productoId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  codbarra: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  cantidad: number;

  @ApiProperty({ required: false })
  @Column({ type: 'double', nullable: true })
  precioventa: number;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\facturacion\entities\poscbomae.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('poscbomae')
export class TPosCboMae {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'poscbomaeId' })
  poscbomaeId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fec_vig_desde: Date;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fec_vig_hasta: Date;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\facturacion\entities\poscorrelativos.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('poscorrelativos')
export class TPosCorrelativos {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'poscorrelativosId' })
  poscorrelativosId: number;

  @ApiProperty()
  @Column()
  nrofactura: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 35 })
  TCPIP: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\facturacion\entities\poscotdet.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('poscotdet')
export class TPosCotDet {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'poscotdetId' })
  poscotdetId: number;

  @ApiProperty()
  @Column()
  poscotmaeId: number;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  productoId: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  codbarra: string;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2 })
  cantidad: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  precio: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  subTotal: number;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\facturacion\entities\poscotmae.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('poscotmae')
export class TPosCotMae {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'poscotmaeId' })
  poscotmaeId: number;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @ApiProperty()
  @Column({ type: 'varchar', length: 100 })
  Nombrecliente: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 255 })
  direccion: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 100 })
  atendio: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  gestorId: number;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;

  @ApiProperty({ enum: ['A', 'F', 'X'], required: false, description: 'Estado carrito: A=Activo, F=Facturado, X=Anulado' })
  @Column({ type: 'enum', enum: ['A', 'F', 'X'], default: 'A' })
  sn_estadocarrito: string;
}

```

---

## 📄 src\modules\facturacion\entities\posfaccaja.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('posfaccaja')
export class TPosFacCaja {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'posfaccajaId' })
  posfaccajaId: number;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @ApiProperty()
  @Column()
  facturaId: number;

  @ApiProperty()
  @Column()
  formapagoId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  tarjetacreditoId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  nrotarjeta: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  nroautorizacion: string;

  @ApiProperty({ required: false })
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  factordecambio: number;

  @ApiProperty({ required: false })
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  importe_efectivo: number;

  @ApiProperty({ required: false })
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  importe_otros: number;

  @ApiProperty({ required: false })
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  importe_cambio: number;

  @ApiProperty()
  @Column()
  cajaId: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_anulado: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fec_anulacion: Date;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  Idsucursal: number;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\facturacion\entities\posfacdet.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('posfacdet')
export class TPosFacDet {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'posfacdetId' })
  posfacdetId: number;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  facturaId: number;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  bodegaId: number;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  nrofila: number;

  @ApiProperty()
  @Column()
  productoId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  codbarra: string;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  cantidad: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  precioventa: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  impuesto: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  subTotal: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  descuento: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_anulada: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\facturacion\entities\posfacdetanul.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('posfacdetanul')
export class TPosFacDetAnul {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'posfacdetanulacionId' })
  posfacdetanulacionId: number;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @ApiProperty()
  @Column()
  posfacmaeanulId: number;

  @ApiProperty()
  @Column()
  bodegaId: number;

  @ApiProperty()
  @Column()
  productoId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  codbarra: string;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  cantidad: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  precio: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  subTotal: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  estado: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\facturacion\entities\posfacmae.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('posfacmae')
export class TPosFacMae {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'facturaId' })
  facturaId: number;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @ApiProperty()
  @Column()
  nrofactura: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['E', 'C'], default: 'E' })
  tipofactura: string;

  @ApiProperty()
  @Column()
  clienteId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  nrocliente: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 80, nullable: true })
  nombrecliente: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 120, nullable: true })
  direccion: string;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  factordecambio: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  subTotal: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  impuesto: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  descuento: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  total: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  efectivo_recibido: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  importe_cambio: number;

  @ApiProperty()
  @Column({ default: 0 })
  diascredito: number;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechavencimiento: Date;

  @ApiProperty()
  @Column()
  bodegaId: number;

  @ApiProperty()
  @Column()
  cajaId: number;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  gestorId: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_excenta: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  nrocarnet: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_pagada: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  Hora: Date;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_anulada: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaanulacion: Date;

  @ApiProperty({ required: false })
  @Column({ name: 'anulacionId', nullable: true })
  anulacionId: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_contabilizada: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\facturacion\entities\posfacmaeanul.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('posfacmaeanul')
export class TPosFacMaeAnul {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'posfacmaeanulId' })
  posfacmaeanulId: number;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @ApiProperty()
  @Column()
  facturaId: number;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  bodegaId: number;

  @ApiProperty()
  @Column()
  clienteId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  nrocliente: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_excento: string;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  factordecambio: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  subTotal: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  impuesto: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  descuento: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  total: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 100, nullable: true })
  observacion: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  estado: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\facturacion\entities\pospeddet.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('pospeddet')
export class TPosPedDet {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'pospeddetId' })
  pospeddetId: number;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @ApiProperty()
  @Column()
  pospedmaeId: number;

  @ApiProperty()
  @Column()
  nrofila: number;

  @ApiProperty()
  @Column()
  productoId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  codbarra: string;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  cantidad: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  precioventa: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  subtotal: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  descuento: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  impuesto: number;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\facturacion\entities\pospedmae.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('pospedmae')
export class TPosPedMae {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'pospedmaeId' })
  pospedmaeId: number;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  nombrecliente: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  nrotelefono: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_enviogratis: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_facturado: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  facturaId: number;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\facturacion\entities\tposdescuentos.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('tposdescuentos')
export class TPosDescuentos {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'descuentoId' })
  descuentoId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 50, nullable: true })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  porcentaje: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\facturacion\entities\tpospreciovtas.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('tpospreciovtas')
export class TPosPrecioVtas {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'preciovtaId' })
  preciovtaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

  @ApiProperty({ required: false })
  @Column({ type: 'double', nullable: true })
  porcentaje: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\facturacion\facturacion.controller.ts

```typescript
﻿import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FacturacionService } from './facturacion.service';
import {
  CreatePosFacMaeDto, UpdatePosFacMaeDto,
  CreatePosCotMaeDto, UpdatePosCotMaeDto,
  CreatePosPedMaeDto, UpdatePosPedMaeDto,
  CheckoutTiendaDto,
  CheckoutPedidoDto,
} from './dto/facturacion.dto';
import {
  CreatePosFacCajaDto, UpdatePosFacCajaDto,
} from './dto/posfaccaja.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('FacturaciÃ³n')
@ApiBearerAuth()
@Controller('facturacion')
@UseGuards(JwtAuthGuard)
export class FacturacionController {
  constructor(private readonly service: FacturacionService) {}

  // ===== Correlativos =====

  @Get('correlativos')
  @ApiOperation({ summary: 'Listar correlativos' })
  @ApiResponse({ status: 200, description: 'Lista de correlativos obtenida exitosamente' })
  findAllCorrelativos(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllCorrelativos(empresaId);
  }

  @Get('correlativos/:id')
  @ApiOperation({ summary: 'Obtener correlativo por ID' })
  @ApiResponse({ status: 200, description: 'Correlativo encontrado' })
  @ApiResponse({ status: 404, description: 'Correlativo no encontrado' })
  findCorrelativo(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findCorrelativo(id, empresaId);
  }

  @Post('correlativos')
  @ApiOperation({ summary: 'Crear correlativo' })
  @ApiResponse({ status: 201, description: 'Correlativo creado exitosamente' })
  createCorrelativo(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createCorrelativo(dto, user.usuario);
  }

  @Put('correlativos/:id')
  @ApiOperation({ summary: 'Actualizar correlativo' })
  @ApiResponse({ status: 200, description: 'Correlativo actualizado exitosamente' })
  updateCorrelativo(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateCorrelativo(id, empresaId, dto, user.usuario);
  }

  // ===== Facturas =====

  @Get('facturas')
  @ApiOperation({ summary: 'Listar facturas' })
  @ApiResponse({ status: 200, description: 'Lista de facturas obtenida exitosamente' })
  findAllFacturas(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllFacturas(empresaId);
  }

  @Get('facturas/:id')
  @ApiOperation({ summary: 'Obtener factura por ID' })
  @ApiResponse({ status: 200, description: 'Factura encontrada' })
  @ApiResponse({ status: 404, description: 'Factura no encontrada' })
  findFactura(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findFactura(id, empresaId);
  }

  @Get('facturas/:id/ticket')
  @ApiOperation({ summary: 'Obtener datos completos del ticket de factura' })
  @ApiResponse({ status: 200, description: 'Datos del ticket obtenidos' })
  findFacturaTicket(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findFacturaTicket(id, empresaId);
  }

  @Post('facturas')
  @ApiOperation({ summary: 'Crear factura' })
  @ApiResponse({ status: 201, description: 'Factura creada exitosamente' })
  createFactura(@Body() dto: CreatePosFacMaeDto, @CurrentUser() user: any) {
    return this.service.createFactura(dto, user.usuario);
  }

  @Put('facturas/:id')
  @ApiOperation({ summary: 'Actualizar factura' })
  @ApiResponse({ status: 200, description: 'Factura actualizada exitosamente' })
  updateFactura(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdatePosFacMaeDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateFactura(id, empresaId, dto, user.usuario);
  }

  @Post('facturas/:id/procesar-kardex')
  @ApiOperation({ summary: 'Procesar kardex de una factura (despuÃ©s de guardar detalles)' })
  @ApiResponse({ status: 200, description: 'Kardex procesado exitosamente' })
  procesarKardexFactura(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.service.procesarKardexFactura(id, user.usuario);
  }

  // ===== Facturas Detalle =====

  @Get('facturas-det')
  @ApiOperation({ summary: 'Listar detalle de facturas' })
  @ApiResponse({ status: 200, description: 'Lista de detalle de facturas obtenida exitosamente' })
  findAllFacturaDet(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllFacturaDet(empresaId);
  }

  @Get('facturas-det/factura/:facturaId')
  @ApiOperation({ summary: 'Obtener detalles de factura por facturaId' })
  @ApiResponse({ status: 200, description: 'Detalles de factura encontrados' })
  findFacturaDetByFacturaId(
    @Param('facturaId', ParseIntPipe) facturaId: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findFacturaDetByFacturaId(facturaId, empresaId);
  }

  @Get('facturas-det/:id')
  @ApiOperation({ summary: 'Obtener detalle de factura por ID' })
  @ApiResponse({ status: 200, description: 'Detalle de factura encontrado' })
  @ApiResponse({ status: 404, description: 'Detalle de factura no encontrado' })
  findFacturaDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findFacturaDet(id, empresaId);
  }

  @Post('facturas-det')
  @ApiOperation({ summary: 'Crear detalle de factura' })
  @ApiResponse({ status: 201, description: 'Detalle de factura creado exitosamente' })
  createFacturaDet(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createFacturaDet(dto, user.usuario);
  }

  @Put('facturas-det/:id')
  @ApiOperation({ summary: 'Actualizar detalle de factura' })
  @ApiResponse({ status: 200, description: 'Detalle de factura actualizado exitosamente' })
  updateFacturaDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateFacturaDet(id, empresaId, dto, user.usuario);
  }

  // ===== Facturas Anuladas =====

  @Get('facturas-anul')
  @ApiOperation({ summary: 'Listar facturas anuladas' })
  @ApiResponse({ status: 200, description: 'Lista de facturas anuladas obtenida exitosamente' })
  findAllFacturaAnul(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllFacturaAnul(empresaId);
  }

  @Get('facturas-anul/:id')
  @ApiOperation({ summary: 'Obtener factura anulada por ID' })
  @ApiResponse({ status: 200, description: 'Factura anulada encontrada' })
  @ApiResponse({ status: 404, description: 'Factura anulada no encontrada' })
  findFacturaAnul(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findFacturaAnul(id, empresaId);
  }

  @Post('facturas-anul')
  @ApiOperation({ summary: 'Crear factura anulada' })
  @ApiResponse({ status: 201, description: 'Factura anulada creada exitosamente' })
  createFacturaAnul(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createFacturaAnul(dto, user.usuario);
  }

  @Put('facturas-anul/:id')
  @ApiOperation({ summary: 'Actualizar factura anulada' })
  @ApiResponse({ status: 200, description: 'Factura anulada actualizada exitosamente' })
  updateFacturaAnul(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateFacturaAnul(id, empresaId, dto, user.usuario);
  }

  // ===== Facturas Detalle Anuladas =====

  @Get('facturas-det-anul')
  @ApiOperation({ summary: 'Listar detalle de facturas anuladas' })
  @ApiResponse({ status: 200, description: 'Lista de detalle de facturas anuladas obtenida exitosamente' })
  findAllFacturaDetAnul(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllFacturaDetAnul(empresaId);
  }

  @Get('facturas-det-anul/:id')
  @ApiOperation({ summary: 'Obtener detalle de factura anulada por ID' })
  @ApiResponse({ status: 200, description: 'Detalle de factura anulada encontrado' })
  @ApiResponse({ status: 404, description: 'Detalle de factura anulada no encontrado' })
  findFacturaDetAnul(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findFacturaDetAnul(id, empresaId);
  }

  @Post('facturas-det-anul')
  @ApiOperation({ summary: 'Crear detalle de factura anulada' })
  @ApiResponse({ status: 201, description: 'Detalle de factura anulada creado exitosamente' })
  createFacturaDetAnul(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createFacturaDetAnul(dto, user.usuario);
  }

  @Put('facturas-det-anul/:id')
  @ApiOperation({ summary: 'Actualizar detalle de factura anulada' })
  @ApiResponse({ status: 200, description: 'Detalle de factura anulada actualizado exitosamente' })
  updateFacturaDetAnul(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateFacturaDetAnul(id, empresaId, dto, user.usuario);
  }

  // ===== Cotizaciones =====

  @Get('cotizaciones')
  @ApiOperation({ summary: 'Listar cotizaciones' })
  @ApiResponse({ status: 200, description: 'Lista de cotizaciones obtenida exitosamente' })
  findAllCotizaciones(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllCotizaciones(empresaId);
  }

  @Get('cotizaciones/:id')
  @ApiOperation({ summary: 'Obtener cotizaciÃ³n por ID' })
  @ApiResponse({ status: 200, description: 'CotizaciÃ³n encontrada' })
  @ApiResponse({ status: 404, description: 'CotizaciÃ³n no encontrada' })
  findCotizacion(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findCotizacion(id, empresaId);
  }

  @Post('cotizaciones')
  @ApiOperation({ summary: 'Crear cotizaciÃ³n' })
  @ApiResponse({ status: 201, description: 'CotizaciÃ³n creada exitosamente' })
  createCotizacion(@Body() dto: CreatePosCotMaeDto, @CurrentUser() user: any) {
    return this.service.createCotizacion(dto, user.usuario);
  }

  @Put('cotizaciones/:id')
  @ApiOperation({ summary: 'Actualizar cotizaciÃ³n' })
  @ApiResponse({ status: 200, description: 'CotizaciÃ³n actualizada exitosamente' })
  updateCotizacion(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdatePosCotMaeDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateCotizacion(id, empresaId, dto, user.usuario);
  }

  // ===== Cotizaciones Detalle =====

  @Get('cotizaciones-det')
  @ApiOperation({ summary: 'Listar detalle de cotizaciones' })
  @ApiResponse({ status: 200, description: 'Lista de detalle de cotizaciones obtenida exitosamente' })
  findAllCotizacionDet(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllCotizacionDet(empresaId);
  }

  @Get('cotizaciones-det/:id')
  @ApiOperation({ summary: 'Obtener detalle de cotizaciÃ³n por ID' })
  @ApiResponse({ status: 200, description: 'Detalle de cotizaciÃ³n encontrado' })
  @ApiResponse({ status: 404, description: 'Detalle de cotizaciÃ³n no encontrado' })
  findCotizacionDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findCotizacionDet(id, empresaId);
  }

  @Post('cotizaciones-det')
  @ApiOperation({ summary: 'Crear detalle de cotizaciÃ³n' })
  @ApiResponse({ status: 201, description: 'Detalle de cotizaciÃ³n creado exitosamente' })
  createCotizacionDet(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createCotizacionDet(dto, user.usuario);
  }

  @Put('cotizaciones-det/:id')
  @ApiOperation({ summary: 'Actualizar detalle de cotizaciÃ³n' })
  @ApiResponse({ status: 200, description: 'Detalle de cotizaciÃ³n actualizado exitosamente' })
  updateCotizacionDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateCotizacionDet(id, empresaId, dto, user.usuario);
  }

  // ===== Pedidos =====

  @Get('pedidos')
  @ApiOperation({ summary: 'Listar pedidos' })
  @ApiResponse({ status: 200, description: 'Lista de pedidos obtenida exitosamente' })
  findAllPedidos(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllPedidos(empresaId);
  }

  @Get('pedidos/:id')
  @ApiOperation({ summary: 'Obtener pedido por ID' })
  @ApiResponse({ status: 200, description: 'Pedido encontrado' })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  findPedido(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findPedido(id, empresaId);
  }

  @Post('pedidos')
  @ApiOperation({ summary: 'Crear pedido' })
  @ApiResponse({ status: 201, description: 'Pedido creado exitosamente' })
  createPedido(@Body() dto: CreatePosPedMaeDto, @CurrentUser() user: any) {
    return this.service.createPedido(dto, user.usuario);
  }

  @Put('pedidos/:id')
  @ApiOperation({ summary: 'Actualizar pedido' })
  @ApiResponse({ status: 200, description: 'Pedido actualizado exitosamente' })
  updatePedido(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdatePosPedMaeDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updatePedido(id, empresaId, dto, user.usuario);
  }

  // ===== Pedidos Detalle =====

  @Get('pedidos-det')
  @ApiOperation({ summary: 'Listar detalle de pedidos' })
  @ApiResponse({ status: 200, description: 'Lista de detalle de pedidos obtenida exitosamente' })
  findAllPedidoDet(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllPedidoDet(empresaId);
  }

  @Get('pedidos-det/:id')
  @ApiOperation({ summary: 'Obtener detalle de pedido por ID' })
  @ApiResponse({ status: 200, description: 'Detalle de pedido encontrado' })
  @ApiResponse({ status: 404, description: 'Detalle de pedido no encontrado' })
  findPedidoDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findPedidoDet(id, empresaId);
  }

  @Post('pedidos-det')
  @ApiOperation({ summary: 'Crear detalle de pedido' })
  @ApiResponse({ status: 201, description: 'Detalle de pedido creado exitosamente' })
  createPedidoDet(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createPedidoDet(dto, user.usuario);
  }

  @Put('pedidos-det/:id')
  @ApiOperation({ summary: 'Actualizar detalle de pedido' })
  @ApiResponse({ status: 200, description: 'Detalle de pedido actualizado exitosamente' })
  updatePedidoDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updatePedidoDet(id, empresaId, dto, user.usuario);
  }

  @Get('pedidos-det/pedido/:pedidoId')
  @ApiOperation({ summary: 'Obtener detalles de pedido por maestro' })
  @ApiResponse({ status: 200, description: 'Detalles encontrados' })
  findPedidoDetByPedidoId(
    @Param('pedidoId', ParseIntPipe) pedidoId: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findPedidoDetByPedidoId(pedidoId, empresaId);
  }

  @Delete('pedidos/:id')
  @ApiOperation({ summary: 'Eliminar pedido y sus detalles' })
  @ApiResponse({ status: 200, description: 'Pedido eliminado' })
  deletePedido(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.deletePedido(id, empresaId);
  }

  @Delete('pedidos-det/:id')
  @ApiOperation({ summary: 'Eliminar detalle de pedido' })
  @ApiResponse({ status: 200, description: 'Detalle eliminado' })
  deletePedidoDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.deletePedidoDet(id, empresaId);
  }

  // ===== Combos =====

  @Get('combos')
  @ApiOperation({ summary: 'Listar combos' })
  @ApiResponse({ status: 200, description: 'Lista de combos obtenida exitosamente' })
  findAllCombos(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllComboMae(empresaId);
  }

  @Get('combos/:id')
  @ApiOperation({ summary: 'Obtener combo por ID' })
  @ApiResponse({ status: 200, description: 'Combo encontrado' })
  @ApiResponse({ status: 404, description: 'Combo no encontrado' })
  findCombo(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findComboMae(id, empresaId);
  }

  @Post('combos')
  @ApiOperation({ summary: 'Crear combo' })
  @ApiResponse({ status: 201, description: 'Combo creado exitosamente' })
  createCombo(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createComboMae(dto, user.usuario);
  }

  @Put('combos/:id')
  @ApiOperation({ summary: 'Actualizar combo' })
  @ApiResponse({ status: 200, description: 'Combo actualizado exitosamente' })
  updateCombo(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateComboMae(id, empresaId, dto, user.usuario);
  }

  // ===== Combos Detalle =====

  @Get('combos-det')
  @ApiOperation({ summary: 'Listar detalle de combos' })
  @ApiResponse({ status: 200, description: 'Lista de detalle de combos obtenida exitosamente' })
  findAllComboDet(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllComboDet(empresaId);
  }

  @Get('combos-det/mae/:maeId')
  @ApiOperation({ summary: 'Obtener detalles de combo por maestro' })
  findComboDetByMae(
    @Param('maeId', ParseIntPipe) maeId: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findComboDetByMae(maeId, empresaId);
  }

  @Get('combos-det/:id')
  @ApiOperation({ summary: 'Obtener detalle de combo por ID' })
  @ApiResponse({ status: 200, description: 'Detalle de combo encontrado' })
  @ApiResponse({ status: 404, description: 'Detalle de combo no encontrado' })
  findComboDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findComboDet(id, empresaId);
  }

  @Post('combos-det')
  @ApiOperation({ summary: 'Crear detalle de combo' })
  @ApiResponse({ status: 201, description: 'Detalle de combo creado exitosamente' })
  createComboDet(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createComboDet(dto, user.usuario);
  }

  @Put('combos-det/:id')
  @ApiOperation({ summary: 'Actualizar detalle de combo' })
  @ApiResponse({ status: 200, description: 'Detalle de combo actualizado exitosamente' })
  updateComboDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateComboDet(id, empresaId, dto, user.usuario);
  }

  @Delete('combos-det/:id')
  @ApiOperation({ summary: 'Eliminar detalle de combo' })
  @ApiResponse({ status: 200, description: 'Detalle de combo eliminado exitosamente' })
  removeComboDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeComboDet(id, empresaId);
  }

  @Delete('combos/:id')
  @ApiOperation({ summary: 'Eliminar combo' })
  @ApiResponse({ status: 200, description: 'Combo eliminado exitosamente' })
  removeCombo(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeCombo(id, empresaId);
  }

  // ===== Precios =====

  @Get('precios')
  @ApiOperation({ summary: 'Listar precios' })
  @ApiResponse({ status: 200, description: 'Lista de precios obtenida exitosamente' })
  findAllPrecios(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllPrecios(empresaId);
  }

  @Get('precios/:id')
  @ApiOperation({ summary: 'Obtener precio por ID' })
  @ApiResponse({ status: 200, description: 'Precio encontrado' })
  @ApiResponse({ status: 404, description: 'Precio no encontrado' })
  findPrecio(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findPrecio(id, empresaId);
  }

  @Post('precios')
  @ApiOperation({ summary: 'Crear precio' })
  @ApiResponse({ status: 201, description: 'Precio creado exitosamente' })
  createPrecio(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createPrecio(dto, user.usuario);
  }

  @Put('precios/:id')
  @ApiOperation({ summary: 'Actualizar precio' })
  @ApiResponse({ status: 200, description: 'Precio actualizado exitosamente' })
  updatePrecio(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updatePrecio(id, empresaId, dto, user.usuario);
  }

  // ===== Descuentos =====

  @Get('descuentos')
  @ApiOperation({ summary: 'Listar descuentos' })
  @ApiResponse({ status: 200, description: 'Lista de descuentos obtenida exitosamente' })
  findAllDescuentos(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllDescuentos(empresaId);
  }

  @Get('descuentos/:id')
  @ApiOperation({ summary: 'Obtener descuento por ID' })
  @ApiResponse({ status: 200, description: 'Descuento encontrado' })
  @ApiResponse({ status: 404, description: 'Descuento no encontrado' })
  findDescuento(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findDescuento(id, empresaId);
  }

  @Post('descuentos')
  @ApiOperation({ summary: 'Crear descuento' })
  @ApiResponse({ status: 201, description: 'Descuento creado exitosamente' })
  createDescuento(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createDescuento(dto, user.usuario);
  }

  @Put('descuentos/:id')
  @ApiOperation({ summary: 'Actualizar descuento' })
  @ApiResponse({ status: 200, description: 'Descuento actualizado exitosamente' })
  updateDescuento(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateDescuento(id, empresaId, dto, user.usuario);
  }

  // ===== FacCaja (formas de pago por factura) =====

  @Get('fac-caja')
  @ApiOperation({ summary: 'Listar formas de pago de facturas' })
  @ApiResponse({ status: 200, description: 'Lista obtenida exitosamente' })
  findAllFacCaja(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllFacCaja(empresaId);
  }

  @Get('fac-caja/:id')
  @ApiOperation({ summary: 'Obtener forma de pago por ID' })
  @ApiResponse({ status: 200, description: 'Forma de pago encontrada' })
  @ApiResponse({ status: 404, description: 'No encontrado' })
  findFacCaja(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findFacCaja(id, empresaId);
  }

  @Get('fac-caja/factura/:facturaId')
  @ApiOperation({ summary: 'Obtener formas de pago por factura' })
  @ApiResponse({ status: 200, description: 'Formas de pago de la factura' })
  findFacCajaByFactura(
    @Param('facturaId', ParseIntPipe) facturaId: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findFacCajaByFactura(facturaId, empresaId);
  }

  @Post('fac-caja')
  @ApiOperation({ summary: 'Crear forma de pago' })
  @ApiResponse({ status: 201, description: 'Forma de pago creada exitosamente' })
  createFacCaja(@Body() dto: CreatePosFacCajaDto, @CurrentUser() user: any) {
    return this.service.createFacCaja(dto, user.usuario);
  }

  @Put('fac-caja/:id')
  @ApiOperation({ summary: 'Actualizar forma de pago' })
  @ApiResponse({ status: 200, description: 'Forma de pago actualizada exitosamente' })
  updateFacCaja(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdatePosFacCajaDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateFacCaja(id, empresaId, dto, user.usuario);
  }

  @Delete('fac-caja/:id')
  @ApiOperation({ summary: 'Eliminar forma de pago' })
  @ApiResponse({ status: 200, description: 'Forma de pago eliminada' })
  removeFacCaja(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeFacCaja(id, empresaId);
  }

  // ===== Tienda Virtual =====

  @Post('tienda/checkout')
  @ApiOperation({ summary: 'Checkout de tienda virtual — convierte carrito en factura' })
  @ApiResponse({ status: 201, description: 'Factura creada exitosamente' })
  checkoutTienda(@Body() dto: CheckoutTiendaDto, @CurrentUser() user: any) {
    return this.service.checkoutTienda(dto, user.usuario);
  }

  @Post('pedidos/checkout')
  @ApiOperation({ summary: 'Checkout de pedido — convierte pedido en factura' })
  @ApiResponse({ status: 201, description: 'Factura creada exitosamente' })
  checkoutPedido(@Body() dto: CheckoutPedidoDto, @CurrentUser() user: any) {
    return this.service.checkoutPedido(dto, user.usuario);
  }

  @Get('cotizaciones-det/mae/:maeId')
  @ApiOperation({ summary: 'Obtener detalles de cotizaciÃ³n por maestro' })
  @ApiResponse({ status: 200, description: 'Detalles encontrados' })
  findCotizacionDetByMaeId(
    @Param('maeId', ParseIntPipe) maeId: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findCotizacionDetByMaeId(maeId, empresaId);
  }

  @Delete('cotizaciones/:id')
  @ApiOperation({ summary: 'Eliminar cotizaciÃ³n (carrito) y sus detalles' })
  @ApiResponse({ status: 200, description: 'CotizaciÃ³n eliminada' })
  deleteCotizacion(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.deleteCotizacion(id, empresaId);
  }

  @Delete('cotizaciones-det/:id')
  @ApiOperation({ summary: 'Eliminar detalle de cotizaciÃ³n' })
  @ApiResponse({ status: 200, description: 'Detalle eliminado' })
  deleteCotizacionDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.deleteCotizacionDet(id, empresaId);
  }

  @Post('cotizaciones/:id/enviar-correo')
  @ApiOperation({ summary: 'Enviar cotización por correo electrónico' })
  @ApiResponse({ status: 200, description: 'Correo enviado exitosamente' })
  @ApiResponse({ status: 400, description: 'Error en la solicitud' })
  async enviarCotizacionPorCorreo(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body('email') email: string,
  ) {
    return this.service.enviarCotizacionPorCorreo(id, empresaId, email);
  }

  @Post('facturas/:id/enviar-correo')
  @ApiOperation({ summary: 'Enviar factura por correo electronico' })
  @ApiResponse({ status: 200, description: 'Correo enviado exitosamente' })
  @ApiResponse({ status: 400, description: 'Error en la solicitud' })
  async enviarFacturaPorCorreo(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body('email') email: string,
  ) {
    return this.service.enviarFacturaPorCorreo(id, empresaId, email);
  }
}



```

---

## 📄 src\modules\facturacion\facturacion.module.ts

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TPosCorrelativos } from './entities/poscorrelativos.entity';
import { TPosFacMae } from './entities/posfacmae.entity';
import { TPosFacDet } from './entities/posfacdet.entity';
import { TPosFacMaeAnul } from './entities/posfacmaeanul.entity';
import { TPosFacDetAnul } from './entities/posfacdetanul.entity';
import { TPosCotMae } from './entities/poscotmae.entity';
import { TPosCotDet } from './entities/poscotdet.entity';
import { TPosPedMae } from './entities/pospedmae.entity';
import { TPosPedDet } from './entities/pospeddet.entity';
import { TPosCboMae } from './entities/poscbomae.entity';
import { TPosCboDet } from './entities/poscbodet.entity';
import { TPosPrecioVtas } from './entities/tpospreciovtas.entity';
import { TPosDescuentos } from './entities/tposdescuentos.entity';
import { TPosFacCaja } from './entities/posfaccaja.entity';
import { TCoTipoDocumentoFiscal } from '../contabilidad/entities/tcotipodocumentofiscal.entity';
import { CxcCliente } from '../cxc/entities/cxccliente.entity';
import { CxccClientesDir } from '../cxc/entities/cxccclientesdir.entity';
import { Tempresas } from '../companies/entities/empresa.entity';
import { TempresasDet } from '../companies/entities/empresasdet.entity';
import { TtipoParamFac } from '../parametros/entities/param-fac.entity';
import { Tproducto } from '../inventario/entities/producto.entity';
import { TproductoImg } from '../inventario/entities/producto-img.entity';
import { FacturacionService } from './facturacion.service';
import { FacturacionController } from './facturacion.controller';
import { InventarioModule } from '../inventario/inventario.module';
import { CxcModule } from '../cxc/cxc.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    TypeOrmModule.forFeature([
      TPosCorrelativos,
      TPosFacMae,
      TPosFacDet,
      TPosFacMaeAnul,
      TPosFacDetAnul,
      TPosCotMae,
      TPosCotDet,
      TPosPedMae,
      TPosPedDet,
      TPosCboMae,
      TPosCboDet,
      TPosPrecioVtas,
      TPosDescuentos,
      TPosFacCaja,
      TCoTipoDocumentoFiscal,
      CxcCliente,
      CxccClientesDir,
      Tempresas,
      TempresasDet,
      TtipoParamFac,
      Tproducto,
      TproductoImg,
    ]),
    InventarioModule,
    CxcModule,
  ],
  controllers: [FacturacionController],
  providers: [FacturacionService],
  exports: [FacturacionService],
})
export class FacturacionModule {}

```

---

## 📄 src\modules\facturacion\facturacion.service.ts

```typescript
﻿import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ObjectLiteral } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TPosCorrelativos } from './entities/poscorrelativos.entity';
import { TPosFacMae } from './entities/posfacmae.entity';
import { TPosFacDet } from './entities/posfacdet.entity';
import { TPosFacMaeAnul } from './entities/posfacmaeanul.entity';
import { TPosFacDetAnul } from './entities/posfacdetanul.entity';
import { TPosCotMae } from './entities/poscotmae.entity';
import { TPosCotDet } from './entities/poscotdet.entity';
import { TPosPedMae } from './entities/pospedmae.entity';
import { TPosPedDet } from './entities/pospeddet.entity';
import { TPosCboMae } from './entities/poscbomae.entity';
import { TPosCboDet } from './entities/poscbodet.entity';
import { TPosPrecioVtas } from './entities/tpospreciovtas.entity';
import { TPosDescuentos } from './entities/tposdescuentos.entity';
import { TPosFacCaja } from './entities/posfaccaja.entity';
import { TCoTipoDocumentoFiscal } from '../contabilidad/entities/tcotipodocumentofiscal.entity';
import { CxcCliente } from '../cxc/entities/cxccliente.entity';
import { CxccClientesDir } from '../cxc/entities/cxccclientesdir.entity';
import {
  CreatePosFacMaeDto, UpdatePosFacMaeDto,
  CreatePosCotMaeDto, UpdatePosCotMaeDto,
  CreatePosPedMaeDto, UpdatePosPedMaeDto,
  CheckoutTiendaDto,
  CheckoutPedidoDto,
} from './dto/facturacion.dto';
import { CxcService } from '../cxc/cxc.service';
import { KardexService } from '../inventario/kardex.service';
import { Tempresas } from '../companies/entities/empresa.entity';
import { TempresasDet } from '../companies/entities/empresasdet.entity';
import { TtipoParamFac } from '../parametros/entities/param-fac.entity';
import { Tproducto } from '../inventario/entities/producto.entity';
import { TproductoImg } from '../inventario/entities/producto-img.entity';
import { getTransporter, getMailFrom } from '../../config/mail';

@Injectable()
export class FacturacionService {
  constructor(
    @InjectRepository(TPosCorrelativos) private readonly correlativosRepo: Repository<TPosCorrelativos>,
    @InjectRepository(TPosFacMae) private readonly facMaeRepo: Repository<TPosFacMae>,
    @InjectRepository(TPosFacDet) private readonly facDetRepo: Repository<TPosFacDet>,
    @InjectRepository(TPosFacMaeAnul) private readonly facMaeAnulRepo: Repository<TPosFacMaeAnul>,
    @InjectRepository(TPosFacDetAnul) private readonly facDetAnulRepo: Repository<TPosFacDetAnul>,
    @InjectRepository(TPosCotMae) private readonly cotMaeRepo: Repository<TPosCotMae>,
    @InjectRepository(TPosCotDet) private readonly cotDetRepo: Repository<TPosCotDet>,
    @InjectRepository(TPosPedMae) private readonly pedMaeRepo: Repository<TPosPedMae>,
    @InjectRepository(TPosPedDet) private readonly pedDetRepo: Repository<TPosPedDet>,
    @InjectRepository(TPosCboMae) private readonly cboMaeRepo: Repository<TPosCboMae>,
    @InjectRepository(TPosCboDet) private readonly cboDetRepo: Repository<TPosCboDet>,
    @InjectRepository(TPosPrecioVtas) private readonly precioVtasRepo: Repository<TPosPrecioVtas>,
    @InjectRepository(TPosDescuentos) private readonly descuentosRepo: Repository<TPosDescuentos>,
    @InjectRepository(TPosFacCaja) private readonly facCajaRepo: Repository<TPosFacCaja>,
    @InjectRepository(TCoTipoDocumentoFiscal) private readonly tipoDocFiscalRepo: Repository<TCoTipoDocumentoFiscal>,
    @InjectRepository(CxcCliente) private readonly clienteRepo: Repository<CxcCliente>,
    @InjectRepository(CxccClientesDir) private readonly clienteDirRepo: Repository<CxccClientesDir>,
    @InjectRepository(Tempresas) private readonly empresaRepo: Repository<Tempresas>,
    @InjectRepository(TempresasDet) private readonly empresaDetRepo: Repository<TempresasDet>,
    @InjectRepository(TtipoParamFac) private readonly paramFacRepo: Repository<TtipoParamFac>,
    @InjectRepository(Tproducto) private readonly productoRepo: Repository<Tproducto>,
    @InjectRepository(TproductoImg) private readonly productoImgRepo: Repository<TproductoImg>,
    @Inject(forwardRef(() => CxcService)) private readonly cxcService: CxcService,
    @Inject(forwardRef(() => KardexService)) private readonly kardexService: KardexService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private async findAllByEmpresa<T extends ObjectLiteral>(repo: Repository<T>, empresaId: number) {
    return repo.find({
      where: { empresaId } as unknown as FindOptionsWhere<T>,
    });
  }

  private async findAllByEmpresaOrdered<T extends ObjectLiteral>(repo: Repository<T>, empresaId: number, orderField: string) {
    return repo.find({
      where: { empresaId } as unknown as FindOptionsWhere<T>,
      order: { [orderField]: 'DESC' } as any,
    });
  }

  private async findOneById<T extends ObjectLiteral>(
    repo: Repository<T>,
    idField: string,
    id: number | string,
    empresaId: number,
    entityName: string,
  ) {
    const where = { [idField]: id, empresaId } as unknown as FindOptionsWhere<T>;
    const found = await repo.findOne({ where });
    if (!found) throw new NotFoundException(`${entityName} ${id} no encontrado`);
    return found;
  }

  private async createEntity<T extends ObjectLiteral>(
    repo: Repository<T>,
    dto: any,
    currentUser: string,
  ): Promise<T> {
    const entity = repo.create({
      ...dto,
      usuarioCreated: currentUser,
    });
    const saved = await repo.save(entity);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  private async updateEntity<T extends ObjectLiteral>(
    repo: Repository<T>,
    idField: string,
    id: number | string,
    empresaId: number,
    dto: any,
    currentUser: string,
    entityName: string,
  ) {
    const entity = await this.findOneById(repo, idField, id, empresaId, entityName);
    Object.assign(entity, dto, {
      usuarioUpdated: currentUser,
      fechaUpdated: new Date(),
    });
    return repo.save(entity);
  }

  private async softDelete<T extends ObjectLiteral>(
    repo: Repository<T>,
    idField: string,
    id: number | string,
    empresaId: number,
    entityName: string,
  ) {
    const entity = await this.findOneById(repo, idField, id, empresaId, entityName);
    Object.assign(entity, {
      sn_activo: 'N',
      fechaUpdated: new Date(),
    });
    return repo.save(entity);
  }

  async findAllCorrelativos(empresaId: number) {
    return this.findAllByEmpresa(this.correlativosRepo, empresaId);
  }

  async findCorrelativo(poscorrelativosId: number, empresaId: number) {
    return this.findOneById(this.correlativosRepo, 'poscorrelativosId', poscorrelativosId, empresaId, 'Correlativo');
  }

  async createCorrelativo(dto: any, currentUser: string) {
    return this.createEntity(this.correlativosRepo, dto, currentUser);
  }

  async updateCorrelativo(poscorrelativosId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.correlativosRepo, 'poscorrelativosId', poscorrelativosId, empresaId, dto, currentUser, 'Correlativo');
  }

  async findAllFacturas(empresaId: number) {
    return this.findAllByEmpresaOrdered(this.facMaeRepo, empresaId, 'fecharegistro');
  }

  async findFactura(facturaId: number, empresaId: number) {
    const factura = await this.findOneById(this.facMaeRepo, 'facturaId', facturaId, empresaId, 'Factura');

    if (!factura.nombrecliente && (factura as any).clienteId) {
      const cliente = await this.clienteRepo.findOne({
        where: { clienteId: (factura as any).clienteId, empresaId } as unknown as FindOptionsWhere<CxcCliente>,
      });
      if (cliente) {
        (factura as any).nombrecliente = `${cliente.nombres ?? ''} ${cliente.apellidos ?? ''}`.trim();
      }
    }

    if (!factura.direccion && (factura as any).clienteId) {
      const dirs = await this.clienteDirRepo.find({
        where: { clienteid: (factura as any).clienteId, empresaId, sn_activo: 'S' } as unknown as FindOptionsWhere<CxccClientesDir>,
      });
      (factura as any).direccion = dirs.length > 0 ? dirs[0].descripcion || 'N/A' : 'N/A';
    }

    return factura;
  }

  async findFacturaTicket(facturaId: number, empresaId: number) {
    const factura = await this.findFactura(facturaId, empresaId);
    const detallesRaw = await this.findFacturaDetByFacturaId(facturaId, empresaId);
    const pagos = await this.findFacCajaByFactura(facturaId, empresaId);

    const productoIds = [...new Set(detallesRaw.map((d) => d.productoId).filter(Boolean))];
    const productos = productoIds.length
      ? await this.productoRepo.find({ where: productoIds.map((id) => ({ produtoId: id, empresaId } as any)) })
      : [];
    const productosMap = new Map(productos.map((p) => [p.produtoId, p.descripcion]));

    const detalles = detallesRaw.map((d) => ({
      ...d,
      descripcion: productosMap.get(d.productoId) || d.codbarra || `#${d.productoId}`,
    }));

    const empresa = await this.empresaRepo.findOne({ where: { empresaId } });
    const empresaDet = await this.empresaDetRepo.find({ where: { empresaId, sn_activo: 'S' } });
    const paramFac = await this.paramFacRepo.findOne({ where: { empresaId } });

    const rtn = empresaDet.find((d) => d.tipo === 'RTN')?.descripcion || null;
    const telefono = empresaDet.find((d) => d.tipo === 'TELEFONO')?.descripcion || null;
    const direccion = empresaDet.find((d) => d.tipo === 'DIRECCION')?.descripcion || null;

    return {
      factura,
      detalles,
      pagos,
      empresa: {
        nombre: empresa?.descripcion || 'EMPRESA',
        rtn,
        telefono,
        direccion,
        mensajeFactura: empresa?.msjfactura || paramFac?.mensajeFactura || '',
        mensajeDevolucion: empresa?.msjdevfactura || '',
      },
    };
  }

  async createFactura(dto: CreatePosFacMaeDto, currentUser: string) {
    if (!dto.nrofactura) {
      dto.nrofactura = await this.asignarCorrelativo(dto.empresaId, currentUser);
    }
    const factura = await this.createEntity(this.facMaeRepo, dto, currentUser);

    if (dto.tipofactura === 'C') {
      try {
        await this.cxcService.generarMovimientoDesdeFactura(factura, currentUser);
      } catch (error) {
        console.error('Error generando movimiento CXC:', error);
      }
    }

    this.eventEmitter.emit('factura.creada', { factura, currentUser });

    return factura;
  }

  async procesarKardexFactura(facturaId: number, currentUser: string): Promise<{ procesados: number; errores: string[] }> {
    const detalles = await this.facDetRepo.find({
      where: { facturaId } as FindOptionsWhere<TPosFacDet>,
    });

    console.log(`[procesarKardex] facturaId=${facturaId}, detalles encontrados: ${detalles.length}`);

    let procesados = 0;
    const errores: string[] = [];
    for (const det of detalles) {
      try {
        console.log(`[procesarKardex] producto=${det.productoId}, cantidad=${det.cantidad}, bodega=${det.bodegaId}, empresa=${det.empresaId}`);
        await this.kardexService.registrarSalida({
          bodegaId: Number(det.bodegaId) || 1,
          productoId: Number(det.productoId),
          cantidad: Number(det.cantidad) || 1,
          costoUnitario: Number(det.precioventa) || 0,
          nroreferencia: facturaId.toString(),
          moduloId: 1,
          tipomov: 'S',
          subtipoMov: 'V',
          empresaId: Number(det.empresaId) || 1,
          usuarioCreated: currentUser,
          factordecambio: 1,
          codbarra: det.codbarra || '',
        });
        procesados++;
        console.log(`[procesarKardex] OK producto=${det.productoId}`);
      } catch (error: any) {
        const msg = `Error kardex producto ${det.productoId}: ${error.message || error}`;
        console.error(`[procesarKardex] ${msg}`);
        errores.push(msg);
      }
    }

    console.log(`[procesarKardex] finalizado: procesados=${procesados}, errores=${errores.length}`);
    return { procesados, errores };
  }

  private async asignarCorrelativo(empresaId: number, currentUser: string): Promise<number> {
    const doc = await this.tipoDocFiscalRepo.findOne({
      where: { abreviatura: 'FAC', empresaId } as unknown as FindOptionsWhere<TCoTipoDocumentoFiscal>,
    });
    if (!doc) return 1;
    const actual = Number(doc.nrocorrelativo) || 0;
    doc.nrocorrelativo = actual + 1;
    doc.usuarioUpdated = currentUser;
    doc.fechaUpdated = new Date();
    await this.tipoDocFiscalRepo.save(doc);
    return actual;
  }

  async updateFactura(facturaId: number, empresaId: number, dto: UpdatePosFacMaeDto, currentUser: string) {
    return this.updateEntity(this.facMaeRepo, 'facturaId', facturaId, empresaId, dto, currentUser, 'Factura');
  }

  async findAllFacturaDet(empresaId: number) {
    return this.findAllByEmpresa(this.facDetRepo, empresaId);
  }

  async findFacturaDet(posfacdetId: number, empresaId: number) {
    return this.findOneById(this.facDetRepo, 'posfacdetId', posfacdetId, empresaId, 'Detalle Factura');
  }

  async findFacturaDetByFacturaId(facturaId: number, empresaId: number) {
    return this.facDetRepo.find({
      where: { facturaId, empresaId } as unknown as FindOptionsWhere<TPosFacDet>,
      order: { nrofila: 'ASC' } as any,
    });
  }

  async createFacturaDet(dto: any, currentUser: string) {
    return this.createEntity(this.facDetRepo, dto, currentUser);
  }

  async updateFacturaDet(posfacdetId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.facDetRepo, 'posfacdetId', posfacdetId, empresaId, dto, currentUser, 'Detalle Factura');
  }

  async findAllFacturaAnul(empresaId: number) {
    return this.findAllByEmpresaOrdered(this.facMaeAnulRepo, empresaId, 'fecharegistro');
  }

  async findFacturaAnul(posfacmaeanulId: number, empresaId: number) {
    return this.findOneById(this.facMaeAnulRepo, 'posfacmaeanulId', posfacmaeanulId, empresaId, 'Anulacion Factura');
  }

  async createFacturaAnul(dto: any, currentUser: string) {
    const facturaOriginal = await this.facMaeRepo.findOne({
      where: { facturaId: dto.facturaId, empresaId: dto.empresaId } as FindOptionsWhere<TPosFacMae>,
    });

    if (!facturaOriginal) {
      throw new NotFoundException(`Factura ${dto.facturaId} no encontrada`);
    }

    if (facturaOriginal.sn_anulada === 'S') {
      throw new BadRequestException('La factura ya esta anulada');
    }

    if (facturaOriginal.sn_contabilizada === 'S') {
      throw new BadRequestException('La factura esta contabilizada y no se puede anular');
    }

    if (facturaOriginal.tipofactura === 'C') {
      const pagos = await this.facCajaRepo.find({
        where: { facturaId: dto.facturaId, empresaId: dto.empresaId, sn_anulado: 'N' } as any,
      });
      if (pagos.length > 0) {
        throw new BadRequestException('La factura es al credito y tiene abonos registrados. No se puede anular.');
      }
    }

    const anulacion = await this.createEntity(this.facMaeAnulRepo, dto, currentUser);

    if (facturaOriginal) {
      const detallesOrig = await this.facDetRepo.find({
        where: { facturaId: facturaOriginal.facturaId, empresaId: facturaOriginal.empresaId } as FindOptionsWhere<TPosFacDet>,
      });

      for (const det of detallesOrig) {
        await this.createEntity(this.facDetAnulRepo, {
          posfacmaeanulId: anulacion.posfacmaeanulId,
          bodegaId: det.bodegaId,
          productoId: det.productoId,
          codbarra: det.codbarra,
          cantidad: det.cantidad,
          precio: det.precioventa,
          subTotal: det.subTotal,
          estado: 'S',
          empresaId: facturaOriginal.empresaId,
        }, currentUser);
      }

      facturaOriginal.sn_anulada = 'S';
      facturaOriginal.usuarioUpdated = currentUser;
      facturaOriginal.fechaUpdated = new Date();
      await this.facMaeRepo.save(facturaOriginal);

      try {
        await this.registrarKardexReversa(facturaOriginal, currentUser);
      } catch (error) {
        console.error('Error registrando Kardex reversa:', error);
      }

      try {
        await this.cxcService.anularMovimientoFactura(facturaOriginal.facturaId, facturaOriginal.nrofactura, facturaOriginal.empresaId, currentUser);
      } catch (error) {
        console.error('Error anulando movimiento CXC:', error);
      }

      try {
        await this.cxcService.anularCajaPorFactura(facturaOriginal.facturaId, facturaOriginal.nrofactura, facturaOriginal.empresaId, currentUser);
      } catch (error) {
        console.error('Error anulando Caja por Factura:', error);
      }
    }

    this.eventEmitter.emit('factura.anulada', { factura: facturaOriginal, anulacion, currentUser });

    return anulacion;
  }

  private async registrarKardexReversa(factura: TPosFacMae, currentUser: string): Promise<void> {
    const detalles = await this.facDetRepo.find({
      where: { facturaId: factura.facturaId, empresaId: factura.empresaId } as FindOptionsWhere<TPosFacDet>,
    });

    for (const det of detalles) {
      await this.kardexService.registrarEntrada({
        bodegaId: factura.bodegaId,
        productoId: det.productoId,
        cantidad: det.cantidad,
        costoUnitario: det.precioventa || 0,
        nroreferencia: `ANUL-${factura.nrofactura}`,
        moduloId: 1,
        tipomov: 'E',
        subtipoMov: 'AN',
        empresaId: factura.empresaId,
        usuarioCreated: currentUser,
        factordecambio: factura.factordecambio || 1,
        codbarra: det.codbarra,
      });
    }
  }

  async updateFacturaAnul(posfacmaeanulId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.facMaeAnulRepo, 'posfacmaeanulId', posfacmaeanulId, empresaId, dto, currentUser, 'Anulacion Factura');
  }

  async findAllFacturaDetAnul(empresaId: number) {
    return this.findAllByEmpresa(this.facDetAnulRepo, empresaId);
  }

  async findFacturaDetAnul(posfacdetanulacionId: number, empresaId: number) {
    return this.findOneById(this.facDetAnulRepo, 'posfacdetanulacionId', posfacdetanulacionId, empresaId, 'Detalle Anulacion');
  }

  async createFacturaDetAnul(dto: any, currentUser: string) {
    return this.createEntity(this.facDetAnulRepo, dto, currentUser);
  }

  async updateFacturaDetAnul(posfacdetanulacionId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.facDetAnulRepo, 'posfacdetanulacionId', posfacdetanulacionId, empresaId, dto, currentUser, 'Detalle Anulacion');
  }

  async findAllCotizaciones(empresaId: number) {
    return this.findAllByEmpresaOrdered(this.cotMaeRepo, empresaId, 'fecharegistro');
  }

  async findCotizacion(poscotmaeId: number, empresaId: number) {
    return this.findOneById(this.cotMaeRepo, 'poscotmaeId', poscotmaeId, empresaId, 'Cotizacion');
  }

  async createCotizacion(dto: CreatePosCotMaeDto, currentUser: string) {
    return this.createEntity(this.cotMaeRepo, dto, currentUser);
  }

  async updateCotizacion(poscotmaeId: number, empresaId: number, dto: UpdatePosCotMaeDto, currentUser: string) {
    return this.updateEntity(this.cotMaeRepo, 'poscotmaeId', poscotmaeId, empresaId, dto, currentUser, 'Cotizacion');
  }

  async deleteCotizacion(poscotmaeId: number, empresaId: number) {
    const entity = await this.findOneById(this.cotMaeRepo, 'poscotmaeId', poscotmaeId, empresaId, 'Cotizacion');
    await this.cotDetRepo.delete({ poscotmaeId, empresaId } as any);
    await this.cotMaeRepo.remove(entity);
    return { deleted: true };
  }

  async findCotizacionDetByMaeId(poscotmaeId: number, empresaId: number) {
    return this.cotDetRepo.find({
      where: { poscotmaeId, empresaId } as unknown as FindOptionsWhere<TPosCotDet>,
      order: { poscotdetId: 'ASC' } as any,
    });
  }

  async deleteCotizacionDet(poscotdetId: number, empresaId: number) {
    const entity = await this.findOneById(this.cotDetRepo, 'poscotdetId', poscotdetId, empresaId, 'Detalle Cotizacion');
    await this.cotDetRepo.remove(entity);
    return { deleted: true };
  }

  async checkoutTienda(dto: CheckoutTiendaDto, currentUser: string) {
    const carrito = await this.cotMaeRepo.findOne({
      where: { poscotmaeId: dto.poscotmaeId } as unknown as FindOptionsWhere<TPosCotMae>,
    });
    if (!carrito) throw new NotFoundException('Carrito no encontrado');
    if (carrito.sn_estadocarrito === 'F') throw new NotFoundException('El carrito ya fue facturado');

    const empresaId = carrito.empresaId;

    const detalles = await this.cotDetRepo.find({
      where: { poscotmaeId: dto.poscotmaeId } as unknown as FindOptionsWhere<TPosCotDet>,
    });
    if (detalles.length === 0) throw new NotFoundException('El carrito estÃ¡ vacÃ­o');

    const paramFac = await this.paramFacRepo.findOne({
      where: { empresaId } as unknown as FindOptionsWhere<TtipoParamFac>,
    });
    const bodegaId = paramFac?.bodegaId || 1;
    const cajaId = paramFac?.cajaId || 1;

    let subTotal = 0;
    let impuestoTotal = 0;
    for (const det of detalles) {
      subTotal += Number(det.precio) * Number(det.cantidad);
      impuestoTotal += Number(det.subTotal) - (Number(det.precio) * Number(det.cantidad));
    }
    const total = subTotal + impuestoTotal;

    let clienteTienda = await this.clienteRepo.findOne({
      where: { nrocliente: 'TIENDA', empresaId } as unknown as FindOptionsWhere<CxcCliente>,
    });
    if (!clienteTienda) {
      clienteTienda = await this.clienteRepo.save(this.clienteRepo.create({
        nrocliente: 'TIENDA',
        nombres: 'CLIENTE',
        apellidos: 'TIENDA',
        razonsocial: 'CLIENTE TIENDA',
        dni: '0000000000000',
        sexo: 'M',
        estadocivil: 'S',
        limiteCredito: 0,
        diasplazo: 0,
        interes: 0,
        moratorio: 0,
        sn_activo: 'S',
        categoria: 'A',
        empresaId,
        usuarioCreated: currentUser,
      })) as CxcCliente;
    }

    const nrofactura = await this.asignarCorrelativo(empresaId, currentUser);

    const facturaPayload: any = {
      nrofactura,
      tipofactura: 'E',
      clienteId: clienteTienda.clienteId,
      nrocliente: clienteTienda.nrocliente,
      nombrecliente: dto.nombrecliente,
      direccion: dto.direccion || '',
      factordecambio: 1,
      subTotal,
      impuesto: impuestoTotal,
      descuento: 0,
      total,
      efectivo_recibido: dto.efectivo_recibido || total,
      importe_cambio: (dto.efectivo_recibido || total) - total,
      diascredito: 0,
      bodegaId,
      cajaId,
      gestorId: carrito.gestorId,
      sn_excenta: 'N',
      sn_pagada: 'S',
      sn_anulada: 'N',
      sn_contabilizada: 'N',
      empresaId,
    };

    const factura = await this.createEntity(this.facMaeRepo, facturaPayload, currentUser);

    let nrofila = 1;
    for (const det of detalles) {
      const precio = Number(det.precio);
      const cantidad = Number(det.cantidad);
      const lineaSubTotal = precio * cantidad;

      await this.createEntity(this.facDetRepo, {
        facturaId: factura.facturaId,
        bodegaId,
        nrofila,
        productoId: Number(det.productoId),
        codbarra: det.codbarra,
        cantidad,
        precioventa: precio,
        impuesto: 0,
        subTotal: lineaSubTotal,
        descuento: 0,
        sn_anulada: 'N',
        empresaId,
      }, currentUser);
      nrofila++;
    }

    await this.createEntity(this.facCajaRepo, {
      facturaId: factura.facturaId,
      formapagoId: dto.formapagoId,
      tarjetacreditoId: dto.tarjetacreditoId || null,
      nrotarjeta: dto.nrotarjeta || null,
      nroautorizacion: dto.nroautorizacion || null,
      factordecambio: 1,
      importe_efectivo: dto.efectivo_recibido || total,
      importe_otros: 0,
      importe_cambio: (dto.efectivo_recibido || total) - total,
      cajaId,
      empresaId,
    }, currentUser);

    try {
      await this.procesarKardexFactura(factura.facturaId, currentUser);
    } catch (error) {
      console.error('Error procesando kardex desde tienda:', error);
    }

    carrito.sn_estadocarrito = 'F';
    carrito.Nombrecliente = dto.nombrecliente;
    carrito.direccion = dto.direccion || '';
    carrito.usuarioUpdated = currentUser;
    carrito.fechaUpdated = new Date();
    await this.cotMaeRepo.save(carrito);

    this.eventEmitter.emit('factura.creada', { factura, currentUser });

    return { facturaId: factura.facturaId, nrofactura, total };
  }

  async findAllCotizacionDet(empresaId: number) {
    return this.findAllByEmpresa(this.cotDetRepo, empresaId);
  }

  async findCotizacionDet(poscotdetId: number, empresaId: number) {
    return this.findOneById(this.cotDetRepo, 'poscotdetId', poscotdetId, empresaId, 'Detalle Cotizacion');
  }

  async createCotizacionDet(dto: any, currentUser: string) {
    return this.createEntity(this.cotDetRepo, dto, currentUser);
  }

  async updateCotizacionDet(poscotdetId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.cotDetRepo, 'poscotdetId', poscotdetId, empresaId, dto, currentUser, 'Detalle Cotizacion');
  }

  async findAllPedidos(empresaId: number) {
    return this.findAllByEmpresaOrdered(this.pedMaeRepo, empresaId, 'fecharegistro');
  }

  async findPedido(pospedmaeId: number, empresaId: number) {
    return this.findOneById(this.pedMaeRepo, 'pospedmaeId', pospedmaeId, empresaId, 'Pedido');
  }

  async createPedido(dto: CreatePosPedMaeDto, currentUser: string) {
    return this.createEntity(this.pedMaeRepo, dto, currentUser);
  }

  async updatePedido(pospedmaeId: number, empresaId: number, dto: UpdatePosPedMaeDto, currentUser: string) {
    return this.updateEntity(this.pedMaeRepo, 'pospedmaeId', pospedmaeId, empresaId, dto, currentUser, 'Pedido');
  }

  async findAllPedidoDet(empresaId: number) {
    return this.findAllByEmpresa(this.pedDetRepo, empresaId);
  }

  async findPedidoDet(pospeddetId: number, empresaId: number) {
    return this.findOneById(this.pedDetRepo, 'pospeddetId', pospeddetId, empresaId, 'Detalle Pedido');
  }

  async createPedidoDet(dto: any, currentUser: string) {
    return this.createEntity(this.pedDetRepo, dto, currentUser);
  }

  async updatePedidoDet(pospeddetId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.pedDetRepo, 'pospeddetId', pospeddetId, empresaId, dto, currentUser, 'Detalle Pedido');
  }

  async findPedidoDetByPedidoId(pospedmaeId: number, empresaId: number) {
    const detalles = await this.pedDetRepo.find({
      where: { pospedmaeId } as unknown as FindOptionsWhere<TPosPedDet>,
    });
    return detalles;
  }

  async deletePedido(pospedmaeId: number, empresaId: number) {
    const detalles = await this.pedDetRepo.find({
      where: { pospedmaeId } as unknown as FindOptionsWhere<TPosPedDet>,
    });
    for (const det of detalles) {
      await this.pedDetRepo.remove(det);
    }
    const entity = await this.findOneById(this.pedMaeRepo, 'pospedmaeId', pospedmaeId, empresaId, 'Pedido');
    await this.pedMaeRepo.remove(entity);
    return { deleted: true };
  }

  async deletePedidoDet(pospeddetId: number, empresaId: number) {
    const entity = await this.findOneById(this.pedDetRepo, 'pospeddetId', pospeddetId, empresaId, 'Detalle Pedido');
    await this.pedDetRepo.remove(entity);
    return { deleted: true };
  }

  async checkoutPedido(dto: CheckoutPedidoDto, currentUser: string) {
    const pedido = await this.pedMaeRepo.findOne({
      where: { pospedmaeId: dto.pospedmaeId } as unknown as FindOptionsWhere<TPosPedMae>,
    });
    if (!pedido) throw new NotFoundException('Pedido no encontrado');
    if (pedido.sn_facturado === 'S') throw new BadRequestException('El pedido ya fue facturado');

    const empresaId = pedido.empresaId;

    const detalles = await this.pedDetRepo.find({
      where: { pospedmaeId: dto.pospedmaeId } as unknown as FindOptionsWhere<TPosPedDet>,
    });
    if (detalles.length === 0) throw new BadRequestException('El pedido está vacío');

    const paramFac = await this.paramFacRepo.findOne({
      where: { empresaId } as unknown as FindOptionsWhere<TtipoParamFac>,
    });
    const bodegaId = paramFac?.bodegaId || 1;
    const cajaId = paramFac?.cajaId || 1;

    let subTotal = 0;
    let impuestoTotal = 0;
    let descuentoTotal = 0;
    for (const det of detalles) {
      const precio = Number(det.precioventa);
      const cantidad = Number(det.cantidad);
      const lineaSubTotal = precio * cantidad;
      subTotal += lineaSubTotal;
      impuestoTotal += Number(det.impuesto);
      descuentoTotal += Number(det.descuento);
    }
    const total = subTotal + impuestoTotal - descuentoTotal;

    let clienteTienda = await this.clienteRepo.findOne({
      where: { nrocliente: 'TIENDA', empresaId } as unknown as FindOptionsWhere<CxcCliente>,
    });
    if (!clienteTienda) {
      clienteTienda = await this.clienteRepo.save(this.clienteRepo.create({
        nrocliente: 'TIENDA',
        nombres: 'CLIENTE',
        apellidos: 'TIENDA',
        razonsocial: 'CLIENTE TIENDA',
        dni: '0000000000000',
        sexo: 'M',
        estadocivil: 'S',
        limiteCredito: 0,
        diasplazo: 0,
        interes: 0,
        moratorio: 0,
        sn_activo: 'S',
        categoria: 'A',
        empresaId,
        usuarioCreated: currentUser,
      })) as CxcCliente;
    }

    const nrofactura = await this.asignarCorrelativo(empresaId, currentUser);

    const facturaPayload: any = {
      nrofactura,
      tipofactura: 'E',
      clienteId: clienteTienda.clienteId,
      nrocliente: clienteTienda.nrocliente,
      nombrecliente: dto.nombrecliente,
      direccion: '',
      factordecambio: 1,
      subTotal,
      impuesto: impuestoTotal,
      descuento: descuentoTotal,
      total,
      efectivo_recibido: dto.efectivo_recibido || total,
      importe_cambio: (dto.efectivo_recibido || total) - total,
      diascredito: 0,
      bodegaId,
      cajaId,
      gestorId: null,
      sn_excenta: 'N',
      sn_pagada: 'S',
      sn_anulada: 'N',
      sn_contabilizada: 'N',
      empresaId,
    };

    const factura = await this.createEntity(this.facMaeRepo, facturaPayload, currentUser);

    let nrofila = 1;
    for (const det of detalles) {
      await this.createEntity(this.facDetRepo, {
        facturaId: factura.facturaId,
        bodegaId,
        nrofila,
        productoId: Number(det.productoId),
        codbarra: det.codbarra,
        cantidad: Number(det.cantidad),
        precioventa: Number(det.precioventa),
        impuesto: Number(det.impuesto),
        subTotal: Number(det.subtotal),
        descuento: Number(det.descuento),
        sn_anulada: 'N',
        empresaId,
      }, currentUser);
      nrofila++;
    }

    await this.createEntity(this.facCajaRepo, {
      facturaId: factura.facturaId,
      formapagoId: dto.formapagoId,
      tarjetacreditoId: dto.tarjetacreditoId || null,
      nrotarjeta: dto.nrotarjeta || null,
      nroautorizacion: dto.nroautorizacion || null,
      factordecambio: 1,
      importe_efectivo: dto.efectivo_recibido || total,
      importe_otros: 0,
      importe_cambio: (dto.efectivo_recibido || total) - total,
      cajaId,
      empresaId,
    }, currentUser);

    try {
      await this.procesarKardexFactura(factura.facturaId, currentUser);
    } catch (error) {
      console.error('Error procesando kardex desde pedido:', error);
    }

    pedido.sn_facturado = 'S';
    pedido.facturaId = factura.facturaId;
    pedido.usuarioUpdated = currentUser;
    pedido.fechaUpdated = new Date();
    await this.pedMaeRepo.save(pedido);

    this.eventEmitter.emit('factura.creada', { factura, currentUser });

    return { facturaId: factura.facturaId, nrofactura, total };
  }

  async findAllComboMae(empresaId: number) {
    return this.findAllByEmpresa(this.cboMaeRepo, empresaId);
  }

  async findComboMae(poscbomaeId: number, empresaId: number) {
    return this.findOneById(this.cboMaeRepo, 'poscbomaeId', poscbomaeId, empresaId, 'Combo');
  }

  async createComboMae(dto: any, currentUser: string) {
    return this.createEntity(this.cboMaeRepo, dto, currentUser);
  }

  async updateComboMae(poscbomaeId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.cboMaeRepo, 'poscbomaeId', poscbomaeId, empresaId, dto, currentUser, 'Combo');
  }

  async findAllComboDet(empresaId: number) {
    return this.findAllByEmpresa(this.cboDetRepo, empresaId);
  }

  async findComboDet(poscbodetId: number, empresaId: number) {
    return this.findOneById(this.cboDetRepo, 'poscbodetId', poscbodetId, empresaId, 'Detalle Combo');
  }

  async findComboDetByMae(poscbomaeId: number, empresaId: number) {
    const dets = await this.cboDetRepo.find({
      where: { poscbomaeId, empresaId } as any,
    });
    for (const det of dets) {
      if (det.productoId) {
        try {
          const prod = await this.productoRepo.findOne({
            where: { produtoId: det.productoId, empresaId } as any,
          });
          (det as any).descripcion = prod?.descripcion ?? null;
          const img = await this.productoImgRepo.findOne({
            where: { productoId: det.productoId, empresaId, sn_activo: 'S' } as any,
          });
          (det as any).img = img?.img ?? null;
        } catch {}
      }
    }
    return dets;
  }

  async createComboDet(dto: any, currentUser: string) {
    return this.createEntity(this.cboDetRepo, dto, currentUser);
  }

  async updateComboDet(poscbodetId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.cboDetRepo, 'poscbodetId', poscbodetId, empresaId, dto, currentUser, 'Detalle Combo');
  }

  async removeComboDet(poscbodetId: number, empresaId: number) {
    return this.cboDetRepo.delete({ poscbodetId, empresaId } as any);
  }

  async removeCombo(poscbomaeId: number, empresaId: number) {
    await this.cboDetRepo.delete({ poscbomaeId, empresaId } as any);
    return this.cboMaeRepo.delete({ poscbomaeId, empresaId } as any);
  }

  async findAllPrecios(empresaId: number) {
    return this.findAllByEmpresa(this.precioVtasRepo, empresaId);
  }

  async findPrecio(preciovtaId: number, empresaId: number) {
    return this.findOneById(this.precioVtasRepo, 'preciovtaId', preciovtaId, empresaId, 'Precio Venta');
  }

  async createPrecio(dto: any, currentUser: string) {
    return this.createEntity(this.precioVtasRepo, dto, currentUser);
  }

  async updatePrecio(preciovtaId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.precioVtasRepo, 'preciovtaId', preciovtaId, empresaId, dto, currentUser, 'Precio Venta');
  }

  async removePrecio(preciovtaId: number, empresaId: number) {
    return this.softDelete(this.precioVtasRepo, 'preciovtaId', preciovtaId, empresaId, 'Precio Venta');
  }

  async findAllDescuentos(empresaId: number) {
    return this.findAllByEmpresa(this.descuentosRepo, empresaId);
  }

  async findDescuento(descuentoId: number, empresaId: number) {
    return this.findOneById(this.descuentosRepo, 'descuentoId', descuentoId, empresaId, 'Descuento');
  }

  async createDescuento(dto: any, currentUser: string) {
    return this.createEntity(this.descuentosRepo, dto, currentUser);
  }

  async updateDescuento(descuentoId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.descuentosRepo, 'descuentoId', descuentoId, empresaId, dto, currentUser, 'Descuento');
  }

  async removeDescuento(descuentoId: number, empresaId: number) {
    return this.softDelete(this.descuentosRepo, 'descuentoId', descuentoId, empresaId, 'Descuento');
  }

  // ===== FacCaja (formas de pago por factura) =====

  async findAllFacCaja(empresaId: number) {
    return this.findAllByEmpresa(this.facCajaRepo, empresaId);
  }

  async findFacCaja(id: number, empresaId: number) {
    return this.findOneById(this.facCajaRepo, 'posfaccajaId', id, empresaId, 'FacCaja');
  }

  async findFacCajaByFactura(facturaId: number, empresaId: number) {
    return this.facCajaRepo.find({
      where: { facturaId, empresaId } as unknown as FindOptionsWhere<TPosFacCaja>,
    });
  }

  async createFacCaja(dto: any, currentUser: string) {
    return this.createEntity(this.facCajaRepo, dto, currentUser);
  }

  async updateFacCaja(id: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.facCajaRepo, 'posfaccajaId', id, empresaId, dto, currentUser, 'FacCaja');
  }

  async removeFacCaja(id: number, empresaId: number) {
    return this.softDelete(this.facCajaRepo, 'posfaccajaId', id, empresaId, 'FacCaja');
  }

  async enviarCotizacionPorCorreo(poscotmaeId: number, empresaId: number, email: string) {
    if (!email) throw new BadRequestException('El correo electrónico es requerido');

    const transporter = getTransporter();
    if (!transporter) throw new BadRequestException('Correo no configurado en el servidor');

    const mae = await this.findOneById(this.cotMaeRepo, 'poscotmaeId', poscotmaeId, empresaId, 'Cotización');
    const dets = await this.findCotizacionDetByMaeId(poscotmaeId, empresaId);

    let empresa: any = null;
    try {
      empresa = await this.empresaRepo.findOne({ where: { empresaId } as any });
    } catch {}

    const html = this.generarHtmlCotizacion(mae, dets, empresa);

    await transporter.sendMail({
      from: `"${empresa?.nombre || 'Arcas'}" <${getMailFrom()}>`,
      to: email,
      subject: `Cotización #${poscotmaeId}`,
      html,
    });

    return { success: true, message: `Cotización enviada a ${email}` };
  }

  private generarHtmlCotizacion(mae: any, dets: any[], empresa: any): string {
    const lineas = (dets || []).map((d: any) => `
      <tr>
        <td style="padding:8px;border:1px solid #e2e8f0">${d.codbarra || ''}</td>
        <td style="padding:8px;border:1px solid #e2e8f0">${d.descripcion || d.codbarra || ''}</td>
        <td style="padding:8px;border:1px solid #e2e8f0;text-align:center">${Number(d.cantidad)}</td>
        <td style="padding:8px;border:1px solid #e2e8f0;text-align:right">L ${Number(d.precio).toFixed(2)}</td>
        <td style="padding:8px;border:1px solid #e2e8f0;text-align:right">L ${Number(d.subTotal).toFixed(2)}</td>
      </tr>
    `).join('');

    const subtotal = (dets || []).reduce((s: number, d: any) => s + Number(d.subTotal || 0), 0);
    const isv = subtotal * 0.15;
    const total = subtotal + isv;
    const fecha = mae.fecharegistro ? new Date(mae.fecharegistro).toLocaleDateString('es-HN') : '-';

    return `
      <div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto">
        <h2 style="color:#10b981;margin-bottom:5px">${empresa?.nombre || 'Arcas'}</h2>
        ${empresa?.rtn ? `<p style="color:#64748b;margin:0">RTN: ${empresa.rtn}</p>` : ''}
        <hr style="border:1px solid #e2e8f0">
        <h3 style="margin:10px 0">Cotización #${mae.poscotmaeId}</h3>
        <p><strong>Cliente:</strong> ${mae.Nombrecliente || 'N/A'}</p>
        <p><strong>Dirección:</strong> ${mae.direccion || 'N/A'}</p>
        <p><strong>Atendió:</strong> ${mae.atendio || 'N/A'}</p>
        <p><strong>Fecha:</strong> ${fecha}</p>
        <table style="width:100%;border-collapse:collapse;margin:15px 0">
          <thead>
            <tr style="background:#10b981;color:white">
              <th style="padding:8px;border:1px solid #10b981">Código</th>
              <th style="padding:8px;border:1px solid #10b981">Producto</th>
              <th style="padding:8px;border:1px solid #10b981">Cant</th>
              <th style="padding:8px;border:1px solid #10b981">Precio</th>
              <th style="padding:8px;border:1px solid #10b981">Subtotal</th>
            </tr>
          </thead>
          <tbody>${lineas}</tbody>
        </table>
        <div style="text-align:right">
          <p style="margin:4px 0"><strong>Subtotal:</strong> L ${subtotal.toFixed(2)}</p>
          <p style="margin:4px 0"><strong>ISV 15%:</strong> L ${isv.toFixed(2)}</p>
          <p style="margin:4px 0;font-size:1.2em;color:#10b981"><strong>TOTAL:</strong> L ${total.toFixed(2)}</p>
        </div>
        <hr style="border:1px solid #e2e8f0">
        <p style="color:#64748b;font-size:0.85em;text-align:center">Documento generado electrónicamente</p>
      </div>
    `;
  }

  async enviarFacturaPorCorreo(facturaId: number, empresaId: number, email: string) {
    if (!email) throw new BadRequestException('El correo electronico es requerido');

    const transporter = getTransporter();
    if (!transporter) throw new BadRequestException('Correo no configurado en el servidor');

    const ticket = await this.findFacturaTicket(facturaId, empresaId);
    const html = this.generarHtmlFactura(ticket, facturaId);

    const empName = ticket.empresa?.nombre || 'Arcas';
    const nroFactura = ticket.factura?.nrofactura || facturaId;
    await transporter.sendMail({
      from: empName + " <" + getMailFrom() + ">",
      to: email,
      subject: "Factura #" + nroFactura,
      html,
    });

    return { success: true, message: "Factura enviada a " + email };
  }

  private generarHtmlFactura(ticket: any, fallbackId: number): string {
    const f = ticket.factura;
    const dets = ticket.detalles || [];
    const pagos = ticket.pagos || [];
    const emp = ticket.empresa || {};

    const lineas = dets.map((d: any, i: number) => {
      return '<tr>'
        + '<td style="padding:8px;border:1px solid #e2e8f0;text-align:center">' + (i + 1) + '</td>'
        + '<td style="padding:8px;border:1px solid #e2e8f0">' + (d.descripcion || d.codbarra || '') + '</td>'
        + '<td style="padding:8px;border:1px solid #e2e8f0;text-align:center">' + Number(d.cantidad) + '</td>'
        + '<td style="padding:8px;border:1px solid #e2e8f0;text-align:right">L ' + Number(d.precioventa).toFixed(2) + '</td>'
        + '<td style="padding:8px;border:1px solid #e2e8f0;text-align:right">L ' + Number(d.subTotal).toFixed(2) + '</td>'
        + '</tr>';
    }).join('');

    const pagosHtml = pagos.map((p: any) => {
      return '<p style="margin:2px 0">Efectivo: L ' + Number(p.importe_efectivo || 0).toFixed(2) + ' | Otros: L ' + Number(p.importe_otros || 0).toFixed(2) + '</p>';
    }).join('');

    const fecha = f.fecharegistro ? new Date(f.fecharegistro).toLocaleDateString('es-HN') : '-';
    const tipo = f.tipofactura === 'C' ? 'Credito' : 'Contado';
    const nombre = emp.nombre || 'Arcas';
    const nroFact = f.nrofactura || fallbackId;
    const rtn = emp.rtn || '';
    const dirEmp = emp.direccion || '';
    const tel = emp.telefono || '';
    const cliente = f.nombrecliente || 'N/A';
    const dirCli = f.direccion || 'N/A';
    const sub = Number(f.subTotal || 0).toFixed(2);
    const isv = Number(f.impuesto || 0).toFixed(2);
    const desc = Number(f.descuento || 0).toFixed(2);
    const tot = Number(f.total || 0).toFixed(2);
    const pagosBlock = pagos.length > 0 ? '<hr style="border:1px solid #e2e8f0"><h4>Pagos</h4>' + pagosHtml : '';
    const msjFac = emp.mensajeFactura || '';

    return '<div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto">'
      + '<h2 style="color:#10b981;margin-bottom:5px">' + nombre + '</h2>'
      + (rtn ? '<p style="color:#64748b;margin:0">RTN: ' + rtn + '</p>' : '')
      + (dirEmp ? '<p style="color:#64748b;margin:0">' + dirEmp + '</p>' : '')
      + (tel ? '<p style="color:#64748b;margin:0">Tel: ' + tel + '</p>' : '')
      + '<hr style="border:1px solid #e2e8f0">'
      + '<h3 style="margin:10px 0">Factura #' + nroFact + '</h3>'
      + '<p><strong>Cliente:</strong> ' + cliente + '</p>'
      + '<p><strong>Direccion:</strong> ' + dirCli + '</p>'
      + '<p><strong>Fecha:</strong> ' + fecha + '</p>'
      + '<p><strong>Tipo:</strong> ' + tipo + ' | <strong>Estado:</strong> ' + (f.sn_pagada === 'S' ? 'Pagada' : 'Pendiente') + '</p>'
      + '<table style="width:100%;border-collapse:collapse;margin:15px 0">'
      + '<thead><tr style="background:#10b981;color:white">'
      + '<th style="padding:8px;border:1px solid #10b981">#</th>'
      + '<th style="padding:8px;border:1px solid #10b981">Producto</th>'
      + '<th style="padding:8px;border:1px solid #10b981">Cant</th>'
      + '<th style="padding:8px;border:1px solid #10b981">Precio</th>'
      + '<th style="padding:8px;border:1px solid #10b981">Subtotal</th>'
      + '</tr></thead>'
      + '<tbody>' + lineas + '</tbody></table>'
      + '<div style="text-align:right">'
      + '<p style="margin:4px 0"><strong>Subtotal:</strong> L ' + sub + '</p>'
      + '<p style="margin:4px 0"><strong>ISV 15%:</strong> L ' + isv + '</p>'
      + '<p style="margin:4px 0"><strong>Descuento:</strong> L ' + desc + '</p>'
      + '<p style="margin:4px 0;font-size:1.2em;color:#10b981"><strong>TOTAL:</strong> L ' + tot + '</p>'
      + '</div>'
      + pagosBlock
      + (msjFac ? '<hr style="border:1px solid #e2e8f0"><p style="color:#64748b;font-size:0.85em;text-align:center;font-style:italic">' + msjFac + '</p>' : '')
      + '<p style="color:#64748b;font-size:0.85em;text-align:center">Documento generado electronicamente</p>'
      + '</div>';
  }
}



```

---

## 📄 src\modules\inventario\ajuste-inventario.controller.ts

```typescript
import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AjusteInventarioService } from './ajuste-inventario.service';

@ApiTags('Inventario - Ajuste de Inventario')
@ApiBearerAuth()
@Controller('inventario/ajustes-inventario')
export class AjusteInventarioController {
  constructor(private readonly service: AjusteInventarioService) {}

  @Get()
  @ApiOperation({ summary: 'Listar ajustes de inventario' })
  findAll(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllMae(empresaId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener ajuste por ID' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findOneMae(id, empresaId);
  }

  @Get(':id/det')
  @ApiOperation({ summary: 'Obtener items del ajuste' })
  findDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findDetByMae(id, empresaId);
  }

  @Post()
  @ApiOperation({ summary: 'Crear ajuste de inventario' })
  create(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createMae({ ...dto, empresaId: dto.empresaId || 2 }, user?.usuario || 'admin');
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar ajuste' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateMae(id, empresaId, dto, user?.usuario || 'admin');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar ajuste' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeMae(id, empresaId);
  }

  @Post('det')
  @ApiOperation({ summary: 'Agregar item al ajuste' })
  createDet(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createDet({ ...dto, empresaId: dto.empresaId || 2 }, user?.usuario || 'admin');
  }

  @Put('det/:id')
  @ApiOperation({ summary: 'Actualizar item del ajuste' })
  updateDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateDet(id, empresaId, dto, user?.usuario || 'admin');
  }

  @Delete('det/:id')
  @ApiOperation({ summary: 'Eliminar item del ajuste' })
  removeDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeDet(id, empresaId);
  }

  @Post(':id/procesar')
  @ApiOperation({ summary: 'Procesar ajuste (aplica kardex y existencias)' })
  procesar(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @CurrentUser() user: any,
  ) {
    return this.service.procesar(id, empresaId, user?.usuario || 'admin');
  }
}

```

---

## 📄 src\modules\inventario\ajuste-inventario.service.ts

```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TInvMovMae } from './entities/invmovmae.entity';
import { TInvMovDet } from './entities/invmovdet.entity';
import { Tproducto } from './entities/producto.entity';
import { TinvExistencia } from './entities/existencia.entity';
import { KardexService } from './kardex.service';

@Injectable()
export class AjusteInventarioService {
  constructor(
    @InjectRepository(TInvMovMae) private readonly maeRepo: Repository<TInvMovMae>,
    @InjectRepository(TInvMovDet) private readonly detRepo: Repository<TInvMovDet>,
    @InjectRepository(Tproducto) private readonly productoRepo: Repository<Tproducto>,
    @InjectRepository(TinvExistencia) private readonly existenciaRepo: Repository<TinvExistencia>,
    private readonly kardexService: KardexService,
  ) {}

  async findAllMae(empresaId: number) {
    return this.maeRepo.find({ where: { empresaId } as any, order: { fecharegistro: 'DESC' } as any });
  }

  async findOneMae(invmovmaeid: number, empresaId: number) {
    const mae = await this.maeRepo.findOne({ where: { invmovmaeid, empresaId } as any });
    if (!mae) throw new BadRequestException('Ajuste de inventario no encontrado');
    return mae;
  }

  async findDetByMae(invmovmaeid: number, empresaId: number) {
    return this.detRepo.find({
      where: { invmovmaeid, empresaId } as any,
      order: { nrofila: 'ASC' } as any,
    });
  }

  async createMae(dto: any, usuario: string) {
    const mae = this.maeRepo.create({
      nroajuste: dto.nroajuste || 0,
      bodegaId: dto.bodegaId,
      concepto: dto.concepto || '',
      sn_entrada: dto.sn_entrada || 'S',
      sn_anulado: 'N',
      empresaId: dto.empresaId,
      usuarioCreated: usuario,
    });
    return this.maeRepo.save(mae);
  }

  async updateMae(invmovmaeid: number, empresaId: number, dto: any, usuario: string) {
    const mae = await this.findOneMae(invmovmaeid, empresaId);
    Object.assign(mae, dto, { usuarioUpdated: usuario, fechaUpdated: new Date() });
    return this.maeRepo.save(mae);
  }

  async removeMae(invmovmaeid: number, empresaId: number) {
    await this.detRepo.delete({ invmovmaeid, empresaId } as any);
    return this.maeRepo.delete({ invmovmaeid, empresaId } as any);
  }

  async createDet(dto: any, usuario: string) {
    const maxNro = await this.detRepo.createQueryBuilder('d')
      .select('MAX(d.nrofila)', 'maxNro')
      .where('d.invmovmaeid = :invmovmaeid', { invmovmaeid: dto.invmovmaeid })
      .getRawOne();
    const nrofila = (maxNro?.maxNro || 0) + 1;

    let productoId = 0;
    let descripcion = dto.descripcion || '';
    let costoUnitario = Number(dto.costoUnitario) || 0;

    if (dto.codbarra && dto.empresaId) {
      const prod = await this.productoRepo.findOne({ where: { codbarra: dto.codbarra, empresaId: dto.empresaId } as any });
      if (!prod) {
        throw new BadRequestException(`Producto con codbarra "${dto.codbarra}" no encontrado`);
      }
      productoId = prod.produtoId;
      descripcion = prod.descripcion;
      costoUnitario = Number(prod.cstounit) || 0;
    } else {
      throw new BadRequestException('Codigo de barra es requerido');
    }

    const cantidad = Number(dto.cantidad) || 0;

    const det = this.detRepo.create({
      invmovmaeid: dto.invmovmaeid,
      nrofila,
      bodegaId: dto.bodegaId,
      productoId,
      codbarra: dto.codbarra,
      descripcion,
      cantidad,
      costoUnitario,
      costoTotal: cantidad * costoUnitario,
      verificador: dto.verificador || 0,
      sn_entrada: dto.sn_entrada || 'S',
      sn_anulado: 'N',
      empresaId: dto.empresaId,
      usuarioCreated: usuario,
    });
    return this.detRepo.save(det);
  }

  async updateDet(invmovdetid: number, empresaId: number, dto: any, usuario: string) {
    const det = await this.detRepo.findOne({ where: { invmovdetid, empresaId } as any });
    if (!det) throw new BadRequestException('Detalle no encontrado');
    Object.assign(det, dto, { usuarioUpdated: usuario, fechaUpdated: new Date() });
    return this.detRepo.save(det);
  }

  async removeDet(invmovdetid: number, empresaId: number) {
    return this.detRepo.delete({ invmovdetid, empresaId } as any);
  }

  async procesar(invmovmaeid: number, empresaId: number, usuario: string) {
    const mae = await this.findOneMae(invmovmaeid, empresaId);
    const dets = await this.findDetByMae(invmovmaeid, empresaId);

    if (dets.length === 0) {
      throw new BadRequestException('No hay items para procesar');
    }

    const resultados: any[] = [];

    for (const det of dets) {
      if (det.sn_anulado === 'S') continue;

      const productoId = det.productoId;
      const cantidad = Number(det.cantidad) || 0;
      const costoUnitario = Number(det.costoUnitario) || 0;

      if (cantidad <= 0) continue;

      if (mae.sn_entrada === 'S') {
        await this.kardexService.registrarEntrada({
          bodegaId: mae.bodegaId,
          productoId,
          cantidad,
          costoUnitario,
          nroreferencia: `AJ-${invmovmaeid}`,
          moduloId: 4,
          tipomov: 'E',
          subtipoMov: 'A',
          empresaId,
          usuarioCreated: usuario,
        });
      } else {
        await this.kardexService.registrarSalida({
          bodegaId: mae.bodegaId,
          productoId,
          cantidad,
          costoUnitario,
          nroreferencia: `AJ-${invmovmaeid}`,
          moduloId: 4,
          tipomov: 'S',
          subtipoMov: 'A',
          empresaId,
          usuarioCreated: usuario,
        });
      }

      await this.detRepo.update(det.invmovdetid, {
        verificador: 1,
        usuarioUpdated: usuario,
        fechaUpdated: new Date(),
      } as any);

      resultados.push({
        codbarra: det.codbarra,
        productoId,
        cantidad,
        costoUnitario,
        tipo: mae.sn_entrada === 'S' ? 'Entrada' : 'Salida',
      });
    }

    await this.maeRepo.update(invmovmaeid, {
      sn_anulado: 'N',
      usuarioUpdated: usuario,
      fechaUpdated: new Date(),
    } as any);

    return { message: 'Ajuste procesado', items: resultados };
  }
}

```

---

## 📄 src\modules\inventario\dto\categoria.dto.ts

```typescript
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoriaDto {
  @ApiProperty({ description: 'Descripción de la categoría' })
  @IsString() @IsNotEmpty()
  descripcion: string;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdateCategoriaDto {
  @ApiProperty({ required: false, description: 'Descripción de la categoría' })
  @IsString() @IsOptional()
  descripcion?: string;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Activo (Sí/No)' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;
}

```

---

## 📄 src\modules\inventario\dto\producto.dto.ts

```typescript
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductoDto {
  @ApiProperty({ required: false, description: 'Código de barras del producto' })
  @IsString() @IsOptional()
  codbarra?: string;

  @ApiProperty({ description: 'Descripción del producto' })
  @IsString() @IsNotEmpty()
  descripcion: string;

  @ApiProperty({ required: false, description: 'Descripción corta del producto' })
  @IsString() @IsOptional()
  descripcion_corta?: string;

  @ApiProperty({ required: false, description: 'Costo unitario del producto' })
  @IsNumber() @IsOptional()
  cstounit?: number;

  @ApiProperty({ required: false, description: 'Costo promedio del producto' })
  @IsNumber() @IsOptional()
  cstoprom?: number;

  @ApiProperty({ required: false, description: 'Precio de venta del producto' })
  @IsNumber() @IsOptional()
  precioventa?: number;

  @ApiProperty({ required: false, description: 'Fecha de última compra' })
  @IsDateString() @IsOptional()
  fecUltcom?: string;

  @ApiProperty({ required: false, description: 'Fecha de última venta' })
  @IsDateString() @IsOptional()
  fecUltvta?: string;

  @ApiProperty({ required: false, description: 'Puntos de retorno' })
  @IsNumber() @IsOptional()
  puntoretorno?: number;

  @ApiProperty({ description: 'ID de la categoría' })
  @IsNumber()
  categoriaId: number;
  
  @ApiProperty({ required: false, description: 'ID del impuesto' })
  @IsNumber() @IsOptional()
  impuestoId?: number;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdateProductoDto {
  @ApiProperty({ required: false, description: 'Código de barras del producto' })
  @IsString() @IsOptional()
  codbarra?: string;

  @ApiProperty({ required: false, description: 'Descripción del producto' })
  @IsString() @IsOptional()
  descripcion?: string;

  @ApiProperty({ required: false, description: 'Descripción corta del producto' })
  @IsString() @IsOptional()
  descripcion_corta?: string;

  @ApiProperty({ required: false, description: 'Costo unitario del producto' })
  @IsNumber() @IsOptional()
  cstounit?: number;

  @ApiProperty({ required: false, description: 'Costo promedio del producto' })
  @IsNumber() @IsOptional()
  cstoprom?: number;

  @ApiProperty({ required: false, description: 'Precio de venta del producto' })
  @IsNumber() @IsOptional()
  precioventa?: number;

  @ApiProperty({ required: false, description: 'Fecha de última compra' })
  @IsDateString() @IsOptional()
  fecUltcom?: string;

  @ApiProperty({ required: false, description: 'Fecha de última venta' })
  @IsDateString() @IsOptional()
  fecUltvta?: string;

  @ApiProperty({ required: false, description: 'Puntos de retorno' })
  @IsNumber() @IsOptional()
  puntoretorno?: number;

  @ApiProperty({ required: false, description: 'ID de la categoría' })
  @IsNumber() @IsOptional()
  categoriaId?: number;
  
  @ApiProperty({ required: false, description: 'ID del impuesto' })
  @IsNumber() @IsOptional()
  impuestoId?: number;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Activo (Sí/No)' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;
}

```

---

## 📄 src\modules\inventario\dto\proveedor.dto.ts

```typescript
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProveedorDto {
  @ApiProperty({ description: 'Número de proveedor' })
  @IsString() @IsNotEmpty()
  nroproveedor: string;

  @ApiProperty({ description: 'Nombres del proveedor' })
  @IsString() @IsNotEmpty()
  nombres: string;

  @ApiProperty({ description: 'Apellidos del proveedor' })
  @IsString() @IsNotEmpty()
  apellidos: string;

  @ApiProperty({ required: false, description: 'Razón social del proveedor' })
  @IsString() @IsOptional()
  razonsocial?: string;

  @ApiProperty({ required: false, description: 'DNI del proveedor' })
  @IsString() @IsOptional()
  dni?: string;

  @ApiProperty({ enum: ['M', 'F'], required: false, description: 'Sexo del proveedor' })
  @IsEnum(['M', 'F']) @IsOptional()
  sexo?: string;

  @ApiProperty({ enum: ['S', 'C', 'D', 'V', 'U'], required: false, description: 'Estado civil del proveedor' })
  @IsEnum(['S', 'C', 'D', 'V', 'U']) @IsOptional()
  estadocivil?: string;

  @ApiProperty({ required: false, description: 'RTN del proveedor' })
  @IsString() @IsOptional()
  rtn?: string;

  @ApiProperty({ required: false, description: 'Límite de crédito del proveedor' })
  @IsNumber() @IsOptional()
  limiteCredito?: number;

  @ApiProperty({ required: false, description: 'Días de plazo del proveedor' })
  @IsNumber() @IsOptional()
  diasplazo?: number;

  @ApiProperty({ required: false, description: 'Tasa de interés del proveedor' })
  @IsNumber() @IsOptional()
  interes?: number;

  @ApiProperty({ required: false, description: 'Tasa de moratorio del proveedor' })
  @IsNumber() @IsOptional()
  moratorio?: number;

  @ApiProperty({ enum: ['A', 'B', 'C', 'D', 'E'], required: false, description: 'Categoría del proveedor' })
  @IsEnum(['A', 'B', 'C', 'D', 'E']) @IsOptional()
  categoria?: string;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdateProveedorDto {
  @ApiProperty({ required: false, description: 'Número de proveedor' })
  @IsString() @IsOptional()
  nroproveedor?: string;

  @ApiProperty({ required: false, description: 'Nombres del proveedor' })
  @IsString() @IsOptional()
  nombres?: string;

  @ApiProperty({ required: false, description: 'Apellidos del proveedor' })
  @IsString() @IsOptional()
  apellidos?: string;

  @ApiProperty({ required: false, description: 'Razón social del proveedor' })
  @IsString() @IsOptional()
  razonsocial?: string;

  @ApiProperty({ required: false, description: 'DNI del proveedor' })
  @IsString() @IsOptional()
  dni?: string;

  @ApiProperty({ enum: ['M', 'F'], required: false, description: 'Sexo del proveedor' })
  @IsEnum(['M', 'F']) @IsOptional()
  sexo?: string;

  @ApiProperty({ enum: ['S', 'C', 'D', 'V', 'U'], required: false, description: 'Estado civil del proveedor' })
  @IsEnum(['S', 'C', 'D', 'V', 'U']) @IsOptional()
  estadocivil?: string;

  @ApiProperty({ required: false, description: 'RTN del proveedor' })
  @IsString() @IsOptional()
  rtn?: string;

  @ApiProperty({ required: false, description: 'Límite de crédito del proveedor' })
  @IsNumber() @IsOptional()
  limiteCredito?: number;

  @ApiProperty({ required: false, description: 'Días de plazo del proveedor' })
  @IsNumber() @IsOptional()
  diasplazo?: number;

  @ApiProperty({ required: false, description: 'Tasa de interés del proveedor' })
  @IsNumber() @IsOptional()
  interes?: number;

  @ApiProperty({ required: false, description: 'Tasa de moratorio del proveedor' })
  @IsNumber() @IsOptional()
  moratorio?: number;

  @ApiProperty({ enum: ['A', 'B', 'C', 'D', 'E'], required: false, description: 'Categoría del proveedor' })
  @IsEnum(['A', 'B', 'C', 'D', 'E']) @IsOptional()
  categoria?: string;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Activo (Sí/No)' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;
}

```

---

## 📄 src\modules\inventario\entities\bodega.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('tinvbodegas')
export class TinvBodega {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'bodegaId' })
  bodegaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\inventario\entities\casa.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('tinvcasas')
export class TinvCasa {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'casaId' })
  casaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\inventario\entities\categoria.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('tinvcategoria')
export class TinvCategoria {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'categoriaId' })
  categoriaId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 50, nullable: true })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\inventario\entities\color.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('tinvcolores')
export class TinvColor {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'colorId' })
  colorId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\inventario\entities\embalaje.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('tinvembalajes')
export class TinvEmbalaje {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'embalajeId' })
  embalajeId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\inventario\entities\existencia.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('invexistencias')
export class TinvExistencia {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'invexistenciaId' })
  invexistenciaId: number;

  @ApiProperty()
  @Column()
  bodegaId: number;

  @ApiProperty()
  @Column()
  productoId: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  existencia: number;

  @ApiProperty({ required: false })
  @Column({ type: 'decimal', precision: 18, scale: 4, nullable: true })
  costounitario: number;

  @ApiProperty({ required: false })
  @Column({ type: 'decimal', precision: 18, scale: 4, nullable: true })
  precioventa: number;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fecUltCompra: Date;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fecUltVta: Date;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\inventario\entities\invfisdet.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('invfisdet')
export class TInvFisDet {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'nvfisdetId' })
  nvfisdetId: number;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @ApiProperty()
  @Column()
  invfisId: number;

  @ApiProperty()
  @Column()
  bodegaId: number;

  @ApiProperty()
  @Column()
  nrofila: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  codbarra: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 50, nullable: true })
  descripcion: string;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  existencia: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  fisico: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  ajusteEntrada: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  ajusteSalida: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  costoUnitario: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  costoTotal: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  preciovta: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_posteado: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_aplicado: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\inventario\entities\invfismae.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('invfismae')
export class TInvFisMae {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'invfisId' })
  invfisId: number;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @ApiProperty()
  @Column()
  bodegaId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 100, nullable: true })
  concepto: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_anulado: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_procesado: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\inventario\entities\invmovdet.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('invmovdet')
export class TInvMovDet {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'invmovdetid' })
  invmovdetid: number;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @ApiProperty()
  @Column({ type: 'int' })
  invmovmaeid: number;

  @ApiProperty()
  @Column({ type: 'int' })
  nrofila: number;

  @ApiProperty()
  @Column({ type: 'int' })
  bodegaId: number;

  @ApiProperty()
  @Column({ type: 'int' })
  productoId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  codbarra: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  descripcion: string;


  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  cantidad: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  costoUnitario: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  costoTotal: number;

  @ApiProperty()
  @Column({ type: 'tinyint' })
  verificador: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_entrada: 'S' | 'N';

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_anulado: 'S' | 'N';

  @ApiProperty()
  @Column({ type: 'int' })
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\inventario\entities\invmovmae.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('invmovmae')
export class TInvMovMae {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'invmovmaeid' })
  invmovmaeid: number;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @ApiProperty()
  @Column({ type: 'int' })
  nroajuste: number;

  @ApiProperty()
  @Column({ type: 'int' })
  bodegaId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 100, nullable: true })
  concepto: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_entrada: 'S' | 'N';

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_procesado: string;


  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_anulado: 'S' | 'N';

  @ApiProperty()
  @Column({ type: 'int' })
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\inventario\entities\invreqdet.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('invreqdet')
export class TInvReqDet {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'invreqdetid' })
  invreqdetid: number;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @ApiProperty()
  @Column({ type: 'int' })
  invreqmaeid: number;

  @ApiProperty()
  @Column({ type: 'int' })
  nrofila: number;

  @ApiProperty()
  @Column({ type: 'int' })
  productoId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  codbarra: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 250, nullable: true })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  cantidadSolicitada: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  cantidadEntregada: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['P', 'A', 'R'], default: 'P' })
  sn_estado: 'P' | 'A' | 'R';

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_anulado: 'S' | 'N';

  @ApiProperty()
  @Column({ type: 'int' })
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\inventario\entities\invreqmae.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('invreqmae')
export class TInvReqMae {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'invreqmaeid' })
  invreqmaeid: number;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @ApiProperty()
  @Column({ type: 'int', default: 0 })
  nrorequisicion: number;

  @ApiProperty()
  @Column({ type: 'int' })
  bodegaOrigenId: number;

  @ApiProperty()
  @Column({ type: 'int' })
  bodegaDestinoId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 200, nullable: true })
  concepto: string;

  @ApiProperty({ required: false })
  @Column({ type: 'enum', enum: ['B', 'M', 'A', 'U'], default: 'M', nullable: true })
  prioridad: 'B' | 'M' | 'A' | 'U';

  @ApiProperty({ required: false })
  @Column({ type: 'date', nullable: true })
  fechaEntrega: string | Date | null;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 500, nullable: true })
  observaciones: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['P', 'A', 'R', 'X'], default: 'P' })
  sn_estado: 'P' | 'A' | 'R' | 'X';

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_procesado: string;


  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_anulado: 'S' | 'N';

  @ApiProperty()
  @Column({ type: 'int' })
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\inventario\entities\invtrasladodet.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('invtrasdet')
export class TInvTrasladoDet {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'invtrasladodetId' })
  invtrasladodetId: number;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @ApiProperty()
  @Column({ type: 'int' })
  invtrasladomaeId: number;

  @ApiProperty()
  @Column({ type: 'int' })
  nrofila: number;

  @ApiProperty()
  @Column({ type: 'int' })
  productoId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  codbarra: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 100, nullable: true })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  cantidad: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  costoUnitario: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  costoTotal: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_anulado: string;

  @ApiProperty()
  @Column({ type: 'int' })
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\inventario\entities\invtrasladomae.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('invtrasmae')
export class TInvTrasladoMae {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'invtrasladomaeId' })
  invtrasladomaeId: number;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @ApiProperty()
  @Column({ type: 'int' })
  bodegaOrigenId: number;

  @ApiProperty()
  @Column({ type: 'int' })
  bodegaDestinoId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 30 })
  nroreferencia: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 200, nullable: true })
  observaciones: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_procesado: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_anulado: string;

  @ApiProperty()
  @Column({ type: 'int' })
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\inventario\entities\kardex.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('invkardex')
export class TinvKardex {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'invkardexId' })
  invkardexId: number;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @ApiProperty()
  @Column()
  bodegaId: number;

  @ApiProperty()
  @Column()
  productoId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  codbarra: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  FechaIngreso: Date;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  factordecambio: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  cantidad: number;

  @ApiProperty()
  @Column({ type: 'int' })
  existencia: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  costoUnitario: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  subTotal: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  saldoAnterior: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  saldoActual: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  costoTotal: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  costoUSD: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  subTotalUSD: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  nroreferencia: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['E', 'S'], default: 'E' })
  tipomov: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 2, default: 'O' })
  subtipoMov: string;

  @ApiProperty()
  @Column()
  moduloId: number;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\inventario\entities\marca.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('tinvmarcas')
export class TinvMarca {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'marcaId' })
  marcaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\inventario\entities\modelo.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('tinvmodelos')
export class TinvModelo {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'modeloId' })
  modeloId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\inventario\entities\pasillo.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('tinvpasillos')
export class TinvPasillo {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'pasilloId' })
  pasilloId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\inventario\entities\producto-codbarra.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('productocodbarras')
export class TproductoCodBarra {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  productocodbarrasId: number;

  @ApiProperty()
  @Column({ type: 'int' })
  productoId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  codbarra: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column({ type: 'int' })
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\inventario\entities\producto-det.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('productosdet')
export class TproductoDet {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  productosdetsId: number;

  @ApiProperty()
  @Column({ type: 'int' })
  produtoId: number;

  @ApiProperty()
  @Column({
    type: 'enum',
    enum: ['MARCA', 'MODELO', 'EMBALAJE', 'PASILLO', 'DEPARTAMENTO', 'UBICACION', 'COLOR', 'PESO', 'EQUIVALENCIA', 'CODIGOBARRA', 'TAMAÑO'],
    default: 'MARCA',
  })
  tipo: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 30 })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column({ type: 'int' })
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\inventario\entities\producto-img.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('productoimg')
export class TproductoImg {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  productoimgId: number;

  @ApiProperty()
  @Column({ type: 'int' })
  productoId: number;

  @ApiProperty()
  @Column({ type: 'longtext' })
  img: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column({ type: 'int' })
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\inventario\entities\producto.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { TinvCategoria } from './categoria.entity';

@Entity('productos')
export class Tproducto {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'productoId' })
  produtoId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  codbarra: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 250, nullable: true })
  descripcion: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 50, nullable: true })
  descripcion_corta: string;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  cstounit: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  cstoprom: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  precioventa: number;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fecUltcom: Date;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fecUltvta: Date;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  puntoretorno: number;

  @ApiProperty()
  @Column()
  categoriaId: number;
 
  @ApiProperty()
  @Column() // se agrego para el manejo de impuestos por productos, sin embargo se podra obtener de forma preinicializada 
  // de la ttipoparaminv por medio de impuestoventaId, ya que hay productos que pagan mas impuestos como por ejemplo los licores y cerverza 
  impuestoId: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column()
  empresaId: number;



  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;

  @ApiProperty({ type: () => TinvCategoria })
  @ManyToOne(() => TinvCategoria)
  @JoinColumn({ name: 'categoriaId' })
  categoria: TinvCategoria;
}

```

---

## 📄 src\modules\inventario\entities\proveedor.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('proveedor')
export class Tproveedor {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'proveedorId' })
  proveedorId: number;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  nroproveedor: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  nombres: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  apellidos: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 120, nullable: true })
  razonsocial: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  dni: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['M', 'F'], default: 'M' })
  sexo: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'C', 'D', 'V', 'U'], default: 'S' })
  estadocivil: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 50, nullable: true })
  rtn: string;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  limiteCredito: number;

  @ApiProperty()
  @Column({ type: 'int', default: 0 })
  diasplazo: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  interes: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  moratorio: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['A', 'B', 'C', 'D', 'E'], default: 'A' })
  categoria: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\inventario\entities\tag.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('tinvtags')
export class TinvTag {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'tagsId' })
  tagsId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\inventario\entities\ubicacion.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('tinvubicaciones')
export class TinvUbicacion {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'ubicacionId' })
  ubicacionId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\inventario\entities\unidad-medida.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('tinvunidadmedida')
export class TinvUnidadMedida {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'unidadmedidaId' })
  unidadmedidaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\inventario\inventario.controller.ts

```typescript
import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InventarioService } from './inventario.service';
import { KardexService, KardexEntradaDto, KardexSalidaDto } from './kardex.service';
import { CreateProductoDto, UpdateProductoDto } from './dto/producto.dto';
import { CreateCategoriaDto, UpdateCategoriaDto } from './dto/categoria.dto';
import { CreateProveedorDto, UpdateProveedorDto } from './dto/proveedor.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Inventario')
@ApiBearerAuth()
@Controller('inventario')
@UseGuards(JwtAuthGuard)
export class InventarioController {
  constructor(
    private readonly service: InventarioService,
    private readonly kardexService: KardexService,
  ) {}

  @Get('productos')
  @ApiOperation({ summary: 'Listar productos' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllProductos(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllProductos(empresaId);
  }

  @Get('productos/buscar')
  @ApiOperation({ summary: 'Buscar productos por texto' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  searchProductos(
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Query('q') termino: string,
  ) {
    return this.service.searchProductos(empresaId, termino);
  }

  @Get('tienda/productos')
  @ApiOperation({ summary: 'Productos para tienda virtual (con imagen y existencia)' })
  @ApiResponse({ status: 200, description: 'Productos con imagen y stock' })
  findProductosTienda(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findProductosTienda(empresaId);
  }

  @Get('productos/paginado')
  @ApiOperation({ summary: 'Listar productos paginados' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllProductosPaginated(
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAllProductosPaginated(
      empresaId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 25,
    );
  }

  @Get('productos/:id')
  @ApiOperation({ summary: 'Obtener producto por ID' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findProducto(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findProducto(id, empresaId);
  }

  @Post('productos')
  @ApiOperation({ summary: 'Crear producto' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createProducto(@Body() dto: CreateProductoDto, @CurrentUser() user: any) {
    return this.service.createProducto(dto, user.usuario);
  }

  @Put('productos/:id')
  @ApiOperation({ summary: 'Actualizar producto' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updateProducto(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateProductoDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateProducto(id, empresaId, dto, user.usuario);
  }

  @Get('categorias')
  @ApiOperation({ summary: 'Listar categorías' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllCategorias(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllCategorias(empresaId);
  }

  @Get('categorias/:id')
  @ApiOperation({ summary: 'Obtener categoría' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findCategoria(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findCategoria(id, empresaId);
  }

  @Post('categorias')
  @ApiOperation({ summary: 'Crear categoría' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createCategoria(@Body() dto: CreateCategoriaDto, @CurrentUser() user: any) {
    return this.service.createCategoria(dto, user.usuario);
  }

  @Put('categorias/:id')
  @ApiOperation({ summary: 'Actualizar categoría' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updateCategoria(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateCategoriaDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateCategoria(id, empresaId, dto, user.usuario);
  }

  @Get('marcas')
  @ApiOperation({ summary: 'Listar marcas' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllMarcas(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllMarcas(empresaId);
  }

  @Get('marcas/:id')
  @ApiOperation({ summary: 'Obtener marca' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findMarca(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findMarca(id, empresaId);
  }

  @Post('marcas')
  @ApiOperation({ summary: 'Crear marca' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createMarca(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createMarca(dto, user.usuario);
  }

  @Put('marcas/:id')
  @ApiOperation({ summary: 'Actualizar marca' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updateMarca(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateMarca(id, empresaId, dto, user.usuario);
  }

  @Get('modelos')
  @ApiOperation({ summary: 'Listar modelos' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllModelos(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllModelos(empresaId);
  }

  @Get('modelos/:id')
  @ApiOperation({ summary: 'Obtener modelo' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findModelo(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findModelo(id, empresaId);
  }

  @Post('modelos')
  @ApiOperation({ summary: 'Crear modelo' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createModelo(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createModelo(dto, user.usuario);
  }

  @Put('modelos/:id')
  @ApiOperation({ summary: 'Actualizar modelo' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updateModelo(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateModelo(id, empresaId, dto, user.usuario);
  }

  @Get('colores')
  @ApiOperation({ summary: 'Listar colores' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllColores(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllColores(empresaId);
  }

  @Get('colores/:id')
  @ApiOperation({ summary: 'Obtener color' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findColor(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findColor(id, empresaId);
  }

  @Post('colores')
  @ApiOperation({ summary: 'Crear color' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createColor(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createColor(dto, user.usuario);
  }

  @Put('colores/:id')
  @ApiOperation({ summary: 'Actualizar color' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updateColor(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateColor(id, empresaId, dto, user.usuario);
  }

  @Get('unidades-medida')
  @ApiOperation({ summary: 'Listar unidades de medida' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllUnidadesMedida(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllUnidadesMedida(empresaId);
  }

  @Get('unidades-medida/:id')
  @ApiOperation({ summary: 'Obtener unidad de medida' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findUnidadMedida(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findUnidadMedida(id, empresaId);
  }

  @Post('unidades-medida')
  @ApiOperation({ summary: 'Crear unidad de medida' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createUnidadMedida(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createUnidadMedida(dto, user.usuario);
  }

  @Put('unidades-medida/:id')
  @ApiOperation({ summary: 'Actualizar unidad de medida' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updateUnidadMedida(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateUnidadMedida(id, empresaId, dto, user.usuario);
  }

  @Get('embalajes')
  @ApiOperation({ summary: 'Listar embalajes' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllEmbalajes(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllEmbalajes(empresaId);
  }

  @Get('embalajes/:id')
  @ApiOperation({ summary: 'Obtener embalaje' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findEmbalaje(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findEmbalaje(id, empresaId);
  }

  @Post('embalajes')
  @ApiOperation({ summary: 'Crear embalaje' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createEmbalaje(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createEmbalaje(dto, user.usuario);
  }

  @Put('embalajes/:id')
  @ApiOperation({ summary: 'Actualizar embalaje' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updateEmbalaje(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateEmbalaje(id, empresaId, dto, user.usuario);
  }

  @Get('bodegas')
  @ApiOperation({ summary: 'Listar bodegas' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllBodegas(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllBodegas(empresaId);
  }

  @Get('bodegas/:id')
  @ApiOperation({ summary: 'Obtener bodega' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findBodega(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findBodega(id, empresaId);
  }

  @Post('bodegas')
  @ApiOperation({ summary: 'Crear bodega' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createBodega(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createBodega(dto, user.usuario);
  }

  @Put('bodegas/:id')
  @ApiOperation({ summary: 'Actualizar bodega' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updateBodega(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateBodega(id, empresaId, dto, user.usuario);
  }

  @Get('ubicaciones')
  @ApiOperation({ summary: 'Listar ubicaciones' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllUbicaciones(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllUbicaciones(empresaId);
  }

  @Get('ubicaciones/:id')
  @ApiOperation({ summary: 'Obtener ubicación' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findUbicacion(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findUbicacion(id, empresaId);
  }

  @Post('ubicaciones')
  @ApiOperation({ summary: 'Crear ubicación' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createUbicacion(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createUbicacion(dto, user.usuario);
  }

  @Put('ubicaciones/:id')
  @ApiOperation({ summary: 'Actualizar ubicación' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updateUbicacion(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateUbicacion(id, empresaId, dto, user.usuario);
  }

  @Get('pasillos')
  @ApiOperation({ summary: 'Listar pasillos' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllPasillos(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllPasillos(empresaId);
  }

  @Get('pasillos/:id')
  @ApiOperation({ summary: 'Obtener pasillo' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findPasillo(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findPasillo(id, empresaId);
  }

  @Post('pasillos')
  @ApiOperation({ summary: 'Crear pasillo' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createPasillo(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createPasillo(dto, user.usuario);
  }

  @Put('pasillos/:id')
  @ApiOperation({ summary: 'Actualizar pasillo' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updatePasillo(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updatePasillo(id, empresaId, dto, user.usuario);
  }

  @Get('casas')
  @ApiOperation({ summary: 'Listar casas productoras' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllCasas(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllCasas(empresaId);
  }

  @Get('casas/:id')
  @ApiOperation({ summary: 'Obtener casa' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findCasa(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findCasa(id, empresaId);
  }

  @Post('casas')
  @ApiOperation({ summary: 'Crear casa' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createCasa(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createCasa(dto, user.usuario);
  }

  @Put('casas/:id')
  @ApiOperation({ summary: 'Actualizar casa' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updateCasa(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateCasa(id, empresaId, dto, user.usuario);
  }

  @Get('testantes')
  @ApiOperation({ summary: 'Listar testantes' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllTestantes(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllTestantes(empresaId);
  }

  @Get('testantes/:id')
  @ApiOperation({ summary: 'Obtener testante' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findTestante(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findTestante(id, empresaId);
  }

  @Post('testantes')
  @ApiOperation({ summary: 'Crear testante' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createTestante(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createTestante(dto, user.usuario);
  }

  @Put('testantes/:id')
  @ApiOperation({ summary: 'Actualizar testante' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updateTestante(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateTestante(id, empresaId, dto, user.usuario);
  }

  @Get('tags')
  @ApiOperation({ summary: 'Listar tags' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllTags(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllTags(empresaId);
  }

  @Get('tags/:id')
  @ApiOperation({ summary: 'Obtener tag' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findTag(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findTag(id, empresaId);
  }

  @Post('tags')
  @ApiOperation({ summary: 'Crear tag' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createTag(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createTag(dto, user.usuario);
  }

  @Put('tags/:id')
  @ApiOperation({ summary: 'Actualizar tag' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updateTag(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateTag(id, empresaId, dto, user.usuario);
  }

  @Get('proveedores')
  @ApiOperation({ summary: 'Listar proveedores' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllProveedores(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllProveedores(empresaId);
  }

  @Get('proveedores/:id')
  @ApiOperation({ summary: 'Obtener proveedor' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findProveedor(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findProveedor(id, empresaId);
  }

  @Post('proveedores')
  @ApiOperation({ summary: 'Crear proveedor' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createProveedor(@Body() dto: CreateProveedorDto, @CurrentUser() user: any) {
    return this.service.createProveedor(dto, user.usuario);
  }

  @Put('proveedores/:id')
  @ApiOperation({ summary: 'Actualizar proveedor' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updateProveedor(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateProveedorDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateProveedor(id, empresaId, dto, user.usuario);
  }

  @Get('existencias')
  @ApiOperation({ summary: 'Listar existencias por bodega' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllExistencias(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllExistencias(empresaId);
  }

  @Get('existencias/:id')
  @ApiOperation({ summary: 'Obtener existencia' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findExistencia(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findExistencia(id, empresaId);
  }

  @Get('kardex')
  @ApiOperation({ summary: 'Listar movimientos kardex' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllKardex(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllKardex(empresaId);
  }

  @Get('kardex/:id')
  @ApiOperation({ summary: 'Obtener movimiento kardex' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findKardex(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findKardex(id, empresaId);
  }

  @Get('kardex/consulta')
  @ApiOperation({ summary: 'Consultar kardex con filtros' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  consultarKardex(
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Query('bodegaId') bodegaId?: string,
    @Query('productoId') productoId?: string,
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
    @Query('tipomov') tipomov?: 'E' | 'S',
    @Query('moduloId') moduloId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.kardexService.consultarKardex({
      empresaId,
      bodegaId: bodegaId ? parseInt(bodegaId, 10) : undefined,
      productoId: productoId ? parseInt(productoId, 10) : undefined,
      fechaDesde: fechaDesde ? new Date(fechaDesde) : undefined,
      fechaHasta: fechaHasta ? new Date(fechaHasta) : undefined,
      tipomov,
      moduloId: moduloId ? parseInt(moduloId, 10) : undefined,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }

  @Get('kardex/saldo/:bodegaId/:productoId')
  @ApiOperation({ summary: 'Obtener saldo actual de producto en bodega' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  obtenerSaldo(
    @Param('bodegaId', ParseIntPipe) bodegaId: number,
    @Param('productoId', ParseIntPipe) productoId: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.kardexService.obtenerSaldoActual(bodegaId, productoId, empresaId);
  }

  @Post('kardex/entrada')
  @ApiOperation({ summary: 'Registrar entrada de inventario' })
  @ApiResponse({ status: 201, description: 'Creado' })
  registrarEntrada(@Body() dto: KardexEntradaDto, @CurrentUser() user: any) {
    return this.kardexService.registrarEntrada({ ...dto, usuarioCreated: user.usuario });
  }

  @Post('kardex/salida')
  @ApiOperation({ summary: 'Registrar salida de inventario' })
  @ApiResponse({ status: 201, description: 'Creado' })
  registrarSalida(@Body() dto: KardexSalidaDto, @CurrentUser() user: any) {
    return this.kardexService.registrarSalida({ ...dto, usuarioCreated: user.usuario });
  }

  @Post('kardex/recalcular')
  @ApiOperation({ summary: 'Recalcular existencias desde kardex (herramienta de mantenimiento)' })
  @ApiResponse({ status: 200, description: 'Existencias recalculadas' })
  recalcularExistencias(
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Query('stockInicial') stockInicial?: string,
  ) {
    return this.kardexService.recalcularExistencias(empresaId, stockInicial ? Number(stockInicial) : 100);
  }

  // ===== ProductoCodBarra =====

  @Get('codigos-barras')
  @ApiOperation({ summary: 'Listar códigos de barras' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllCodBarra(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllCodBarra(empresaId);
  }

  @Get('codigos-barras/:id')
  @ApiOperation({ summary: 'Obtener código de barras' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findCodBarra(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findCodBarra(id, empresaId);
  }

  @Post('codigos-barras')
  @ApiOperation({ summary: 'Crear código de barras' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createCodBarra(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createCodBarra(dto, user.usuario);
  }

  @Put('codigos-barras/:id')
  @ApiOperation({ summary: 'Actualizar código de barras' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updateCodBarra(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateCodBarra(id, empresaId, dto, user.usuario);
  }

  @Delete('codigos-barras/:id')
  @ApiOperation({ summary: 'Eliminar código de barras' })
  @ApiResponse({ status: 200, description: 'Eliminado' })
  removeCodBarra(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeCodBarra(id, empresaId);
  }

  // ===== ProductoDet =====

  @Get('productos-det')
  @ApiOperation({ summary: 'Listar detalle de productos' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllProdDet(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllProdDet(empresaId);
  }

  @Get('productos-det/:id')
  @ApiOperation({ summary: 'Obtener detalle de producto' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findProdDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findProdDet(id, empresaId);
  }

  @Post('productos-det')
  @ApiOperation({ summary: 'Crear detalle de producto' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createProdDet(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createProdDet(dto, user.usuario);
  }

  @Put('productos-det/:id')
  @ApiOperation({ summary: 'Actualizar detalle de producto' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updateProdDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateProdDet(id, empresaId, dto, user.usuario);
  }

  @Delete('productos-det/:id')
  @ApiOperation({ summary: 'Eliminar detalle de producto' })
  @ApiResponse({ status: 200, description: 'Eliminado' })
  removeProdDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeProdDet(id, empresaId);
  }

  // ===== ProductoImg =====

  @Get('productos-img')
  @ApiOperation({ summary: 'Listar imágenes de productos' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllProdImg(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllProdImg(empresaId);
  }

  @Get('productos-img/:id')
  @ApiOperation({ summary: 'Obtener imagen de producto' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findProdImg(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findProdImg(id, empresaId);
  }

  @Post('productos-img')
  @ApiOperation({ summary: 'Crear imagen de producto' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createProdImg(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createProdImg(dto, user.usuario);
  }

  @Put('productos-img/:id')
  @ApiOperation({ summary: 'Actualizar imagen de producto' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updateProdImg(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateProdImg(id, empresaId, dto, user.usuario);
  }

  @Delete('productos-img/:id')
  @ApiOperation({ summary: 'Eliminar imagen de producto' })
  @ApiResponse({ status: 200, description: 'Eliminado' })
  removeProdImg(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeProdImg(id, empresaId);
  }

  @Post('ajustes/positivo')
  @ApiOperation({ summary: 'Registrar ajuste positivo de inventario' })
  @ApiResponse({ status: 201, description: 'Creado' })
  registrarAjustePositivo(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.registrarAjustePositivo({ ...dto, usuarioCreated: user.usuario });
  }

  @Post('ajustes/negativo')
  @ApiOperation({ summary: 'Registrar ajuste negativo de inventario' })
  @ApiResponse({ status: 201, description: 'Creado' })
  registrarAjusteNegativo(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.registrarAjusteNegativo({ ...dto, usuarioCreated: user.usuario });
  }

  @Post('traslados')
  @ApiOperation({ summary: 'Registrar traslado entre bodegas' })
  @ApiResponse({ status: 201, description: 'Creado' })
  registrarTraslado(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.registrarTraslado({ ...dto, usuarioCreated: user.usuario });
  }
}

```

---

## 📄 src\modules\inventario\inventario.module.ts

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Tproducto } from './entities/producto.entity';
import { TinvCategoria } from './entities/categoria.entity';
import { TinvMarca } from './entities/marca.entity';
import { TinvModelo } from './entities/modelo.entity';
import { TinvColor } from './entities/color.entity';
import { TinvUnidadMedida } from './entities/unidad-medida.entity';
import { TinvEmbalaje } from './entities/embalaje.entity';
import { TinvBodega } from './entities/bodega.entity';
import { TinvUbicacion } from './entities/ubicacion.entity';
import { TinvPasillo } from './entities/pasillo.entity';
import { TinvCasa } from './entities/casa.entity';
import { TinvTestante } from './entities/testante.entity';
import { TinvTag } from './entities/tag.entity';
import { Tproveedor } from './entities/proveedor.entity';
import { TinvExistencia } from './entities/existencia.entity';
import { TinvKardex } from './entities/kardex.entity';
import { TproductoCodBarra } from './entities/producto-codbarra.entity';
import { TproductoDet } from './entities/producto-det.entity';
import { TproductoImg } from './entities/producto-img.entity';
import { TInvFisMae } from './entities/invfismae.entity';
import { TInvFisDet } from './entities/invfisdet.entity';
import { TInvMovMae } from './entities/invmovmae.entity';
import { TInvMovDet } from './entities/invmovdet.entity';
import { TInvReqMae } from './entities/invreqmae.entity';
import { TInvReqDet } from './entities/invreqdet.entity';
import { TInvTrasladoMae } from './entities/invtrasladomae.entity';
import { TInvTrasladoDet } from './entities/invtrasladodet.entity';
import { InventarioService } from './inventario.service';
import { KardexService } from './kardex.service';
import { TomaInventarioService } from './toma-inventario.service';
import { AjusteInventarioService } from './ajuste-inventario.service';
import { RequisicionInventarioService } from './requisicion-inventario.service';
import { TrasladoInventarioService } from './traslado-inventario.service';
import { InventarioController } from './inventario.controller';
import { TomaInventarioController } from './toma-inventario.controller';
import { AjusteInventarioController } from './ajuste-inventario.controller';
import { RequisicionInventarioController } from './requisicion-inventario.controller';
import { TrasladoInventarioController } from './traslado-inventario.controller';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    TypeOrmModule.forFeature([
      Tproducto,
      TinvCategoria,
      TinvMarca,
      TinvModelo,
      TinvColor,
      TinvUnidadMedida,
      TinvEmbalaje,
      TinvBodega,
      TinvUbicacion,
      TinvPasillo,
      TinvCasa,
      TinvTestante,
      TinvTag,
      Tproveedor,
      TinvExistencia,
      TinvKardex,
      TproductoCodBarra,
      TproductoDet,
      TproductoImg,
      TInvFisMae,
      TInvFisDet,
      TInvMovMae,
      TInvMovDet,
      TInvReqMae,
      TInvReqDet,
      TInvTrasladoMae,
      TInvTrasladoDet,
    ]),
  ],
  controllers: [InventarioController, TomaInventarioController, AjusteInventarioController, RequisicionInventarioController, TrasladoInventarioController],
  providers: [InventarioService, KardexService, TomaInventarioService, AjusteInventarioService, RequisicionInventarioService, TrasladoInventarioService],
  exports: [InventarioService, KardexService, TomaInventarioService, AjusteInventarioService, RequisicionInventarioService, TrasladoInventarioService],
})
export class InventarioModule {}

```

---

## 📄 src\modules\inventario\inventario.service.ts

```typescript
import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ObjectLiteral } from 'typeorm';
import { Tproducto } from './entities/producto.entity';
import { TinvCategoria } from './entities/categoria.entity';
import { TinvMarca } from './entities/marca.entity';
import { TinvModelo } from './entities/modelo.entity';
import { TinvColor } from './entities/color.entity';
import { TinvUnidadMedida } from './entities/unidad-medida.entity';
import { TinvEmbalaje } from './entities/embalaje.entity';
import { TinvBodega } from './entities/bodega.entity';
import { TinvUbicacion } from './entities/ubicacion.entity';
import { TinvPasillo } from './entities/pasillo.entity';
import { TinvCasa } from './entities/casa.entity';
import { TinvTestante } from './entities/testante.entity';
import { TinvTag } from './entities/tag.entity';
import { Tproveedor } from './entities/proveedor.entity';
import { TinvExistencia } from './entities/existencia.entity';
import { TinvKardex } from './entities/kardex.entity';
import { TproductoCodBarra } from './entities/producto-codbarra.entity';
import { TproductoDet } from './entities/producto-det.entity';
import { TproductoImg } from './entities/producto-img.entity';
import { CreateProductoDto, UpdateProductoDto } from './dto/producto.dto';
import { CreateCategoriaDto, UpdateCategoriaDto } from './dto/categoria.dto';
import { CreateProveedorDto, UpdateProveedorDto } from './dto/proveedor.dto';
import { KardexService, KardexEntradaDto, KardexSalidaDto } from './kardex.service';

@Injectable()
export class InventarioService {
  constructor(
    @InjectRepository(Tproducto) private readonly productoRepo: Repository<Tproducto>,
    @InjectRepository(TinvCategoria) private readonly categoriaRepo: Repository<TinvCategoria>,
    @InjectRepository(TinvMarca) private readonly marcaRepo: Repository<TinvMarca>,
    @InjectRepository(TinvModelo) private readonly modeloRepo: Repository<TinvModelo>,
    @InjectRepository(TinvColor) private readonly colorRepo: Repository<TinvColor>,
    @InjectRepository(TinvUnidadMedida) private readonly unidadMedidaRepo: Repository<TinvUnidadMedida>,
    @InjectRepository(TinvEmbalaje) private readonly embalajeRepo: Repository<TinvEmbalaje>,
    @InjectRepository(TinvBodega) private readonly bodegaRepo: Repository<TinvBodega>,
    @InjectRepository(TinvUbicacion) private readonly ubicacionRepo: Repository<TinvUbicacion>,
    @InjectRepository(TinvPasillo) private readonly pasilloRepo: Repository<TinvPasillo>,
    @InjectRepository(TinvCasa) private readonly casaRepo: Repository<TinvCasa>,
    @InjectRepository(TinvTestante) private readonly testanteRepo: Repository<TinvTestante>,
    @InjectRepository(TinvTag) private readonly tagRepo: Repository<TinvTag>,
    @InjectRepository(Tproveedor) private readonly proveedorRepo: Repository<Tproveedor>,
    @InjectRepository(TinvExistencia) private readonly existenciaRepo: Repository<TinvExistencia>,
    @InjectRepository(TinvKardex) private readonly kardexRepo: Repository<TinvKardex>,
    @InjectRepository(TproductoCodBarra) private readonly codBarraRepo: Repository<TproductoCodBarra>,
    @InjectRepository(TproductoDet) private readonly prodDetRepo: Repository<TproductoDet>,
    @InjectRepository(TproductoImg) private readonly prodImgRepo: Repository<TproductoImg>,
    @Inject(forwardRef(() => KardexService)) private readonly kardexService: KardexService,
  ) {}

  private async findAllByEmpresa<T extends ObjectLiteral>(repo: Repository<T>, empresaId: number) {
    return repo.find({
      where: { empresaId } as unknown as FindOptionsWhere<T>,
    });
  }

  private async findOneById<T extends ObjectLiteral>(
    repo: Repository<T>,
    idField: string,
    id: number | string,
    empresaId: number,
    entityName: string,
  ) {
    const where = { [idField]: id, empresaId } as unknown as FindOptionsWhere<T>;
    const found = await repo.findOne({ where });
    if (!found) throw new NotFoundException(`${entityName} ${id} no encontrado`);
    return found;
  }

  private async createEntity<T extends ObjectLiteral>(
    repo: Repository<T>,
    dto: any,
    currentUser: string,
  ): Promise<T> {
    const entity = repo.create({
      ...dto,
      usuarioCreated: currentUser,
    });
    const saved = await repo.save(entity);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  private async updateEntity<T extends ObjectLiteral>(
    repo: Repository<T>,
    idField: string,
    id: number | string,
    empresaId: number,
    dto: any,
    currentUser: string,
    entityName: string,
  ) {
    const entity = await this.findOneById(repo, idField, id, empresaId, entityName);
    Object.assign(entity, dto, {
      usuarioUpdated: currentUser,
      fechaUpdated: new Date(),
    });
    return repo.save(entity);
  }

  private async softDelete<T extends ObjectLiteral>(
    repo: Repository<T>,
    idField: string,
    id: number | string,
    empresaId: number,
    entityName: string,
  ) {
    const entity = await this.findOneById(repo, idField, id, empresaId, entityName);
    Object.assign(entity, {
      sn_activo: 'N',
      fechaUpdated: new Date(),
    });
    return repo.save(entity);
  }

  async findAllProductos(empresaId: number) {
    return this.productoRepo.find({
      where: { empresaId },
      order: { descripcion: 'ASC' },
      relations: ['categoria'],
    });
  }

  async findAllProductosPaginated(empresaId: number, page = 1, limit = 25) {
    const [data, total] = await this.productoRepo.findAndCount({
      where: { empresaId },
      order: { descripcion: 'ASC' },
      relations: ['categoria'],
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async searchProductos(empresaId: number, termino: string) {
    const qb = this.productoRepo.createQueryBuilder('p');
    qb.where('p.empresaId = :empresaId', { empresaId });
    qb.andWhere('(p.descripcion LIKE :t OR p.codbarra LIKE :t)', { t: `%${termino}%` });
    qb.orderBy('p.descripcion', 'ASC');
    qb.leftJoinAndSelect('p.categoria', 'categoria');
    return qb.getMany();
  }

  async findProducto(produtoId: number, empresaId: number) {
    return this.findOneById(this.productoRepo, 'produtoId', produtoId, empresaId, 'Producto');
  }

  async createProducto(dto: CreateProductoDto, currentUser: string) {
    return this.createEntity(this.productoRepo, dto, currentUser);
  }

  async updateProducto(produtoId: number, empresaId: number, dto: UpdateProductoDto, currentUser: string) {
    return this.updateEntity(this.productoRepo, 'produtoId', produtoId, empresaId, dto, currentUser, 'Producto');
  }

  async removeProducto(produtoId: number, empresaId: number) {
    return this.softDelete(this.productoRepo, 'produtoId', produtoId, empresaId, 'Producto');
  }

  async findAllCategorias(empresaId: number) {
    return this.findAllByEmpresa(this.categoriaRepo, empresaId);
  }

  async findCategoria(categoriaId: number, empresaId: number) {
    return this.findOneById(this.categoriaRepo, 'categoriaId', categoriaId, empresaId, 'Categoria');
  }

  async createCategoria(dto: CreateCategoriaDto, currentUser: string) {
    return this.createEntity(this.categoriaRepo, dto, currentUser);
  }

  async updateCategoria(categoriaId: number, empresaId: number, dto: UpdateCategoriaDto, currentUser: string) {
    return this.updateEntity(this.categoriaRepo, 'categoriaId', categoriaId, empresaId, dto, currentUser, 'Categoria');
  }

  async removeCategoria(categoriaId: number, empresaId: number) {
    return this.softDelete(this.categoriaRepo, 'categoriaId', categoriaId, empresaId, 'Categoria');
  }

  async findAllMarcas(empresaId: number) {
    return this.findAllByEmpresa(this.marcaRepo, empresaId);
  }

  async findMarca(marcaId: number, empresaId: number) {
    return this.findOneById(this.marcaRepo, 'marcaId', marcaId, empresaId, 'Marca');
  }

  async createMarca(dto: any, currentUser: string) {
    return this.createEntity(this.marcaRepo, dto, currentUser);
  }

  async updateMarca(marcaId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.marcaRepo, 'marcaId', marcaId, empresaId, dto, currentUser, 'Marca');
  }

  async removeMarca(marcaId: number, empresaId: number) {
    return this.softDelete(this.marcaRepo, 'marcaId', marcaId, empresaId, 'Marca');
  }

  async findAllModelos(empresaId: number) {
    return this.findAllByEmpresa(this.modeloRepo, empresaId);
  }

  async findModelo(modeloId: number, empresaId: number) {
    return this.findOneById(this.modeloRepo, 'modeloId', modeloId, empresaId, 'Modelo');
  }

  async createModelo(dto: any, currentUser: string) {
    return this.createEntity(this.modeloRepo, dto, currentUser);
  }

  async updateModelo(modeloId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.modeloRepo, 'modeloId', modeloId, empresaId, dto, currentUser, 'Modelo');
  }

  async removeModelo(modeloId: number, empresaId: number) {
    return this.softDelete(this.modeloRepo, 'modeloId', modeloId, empresaId, 'Modelo');
  }

  async findAllColores(empresaId: number) {
    return this.findAllByEmpresa(this.colorRepo, empresaId);
  }

  async findColor(colorId: number, empresaId: number) {
    return this.findOneById(this.colorRepo, 'colorId', colorId, empresaId, 'Color');
  }

  async createColor(dto: any, currentUser: string) {
    return this.createEntity(this.colorRepo, dto, currentUser);
  }

  async updateColor(colorId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.colorRepo, 'colorId', colorId, empresaId, dto, currentUser, 'Color');
  }

  async removeColor(colorId: number, empresaId: number) {
    return this.softDelete(this.colorRepo, 'colorId', colorId, empresaId, 'Color');
  }

  async findAllUnidadesMedida(empresaId: number) {
    return this.findAllByEmpresa(this.unidadMedidaRepo, empresaId);
  }

  async findUnidadMedida(unidadmedidaId: number, empresaId: number) {
    return this.findOneById(this.unidadMedidaRepo, 'unidadmedidaId', unidadmedidaId, empresaId, 'Unidad de Medida');
  }

  async createUnidadMedida(dto: any, currentUser: string) {
    return this.createEntity(this.unidadMedidaRepo, dto, currentUser);
  }

  async updateUnidadMedida(unidadmedidaId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.unidadMedidaRepo, 'unidadmedidaId', unidadmedidaId, empresaId, dto, currentUser, 'Unidad de Medida');
  }

  async removeUnidadMedida(unidadmedidaId: number, empresaId: number) {
    return this.softDelete(this.unidadMedidaRepo, 'unidadmedidaId', unidadmedidaId, empresaId, 'Unidad de Medida');
  }

  async findAllEmbalajes(empresaId: number) {
    return this.findAllByEmpresa(this.embalajeRepo, empresaId);
  }

  async findEmbalaje(embalajeId: number, empresaId: number) {
    return this.findOneById(this.embalajeRepo, 'embalajeId', embalajeId, empresaId, 'Embalaje');
  }

  async createEmbalaje(dto: any, currentUser: string) {
    return this.createEntity(this.embalajeRepo, dto, currentUser);
  }

  async updateEmbalaje(embalajeId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.embalajeRepo, 'embalajeId', embalajeId, empresaId, dto, currentUser, 'Embalaje');
  }

  async removeEmbalaje(embalajeId: number, empresaId: number) {
    return this.softDelete(this.embalajeRepo, 'embalajeId', embalajeId, empresaId, 'Embalaje');
  }

  async findAllBodegas(empresaId: number) {
    return this.findAllByEmpresa(this.bodegaRepo, empresaId);
  }

  async findBodega(bodegaId: number, empresaId: number) {
    return this.findOneById(this.bodegaRepo, 'bodegaId', bodegaId, empresaId, 'Bodega');
  }

  async createBodega(dto: any, currentUser: string) {
    return this.createEntity(this.bodegaRepo, dto, currentUser);
  }

  async updateBodega(bodegaId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.bodegaRepo, 'bodegaId', bodegaId, empresaId, dto, currentUser, 'Bodega');
  }

  async removeBodega(bodegaId: number, empresaId: number) {
    return this.softDelete(this.bodegaRepo, 'bodegaId', bodegaId, empresaId, 'Bodega');
  }

  async findAllUbicaciones(empresaId: number) {
    return this.findAllByEmpresa(this.ubicacionRepo, empresaId);
  }

  async findUbicacion(ubicacionId: number, empresaId: number) {
    return this.findOneById(this.ubicacionRepo, 'ubicacionId', ubicacionId, empresaId, 'Ubicacion');
  }

  async createUbicacion(dto: any, currentUser: string) {
    return this.createEntity(this.ubicacionRepo, dto, currentUser);
  }

  async updateUbicacion(ubicacionId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.ubicacionRepo, 'ubicacionId', ubicacionId, empresaId, dto, currentUser, 'Ubicacion');
  }

  async removeUbicacion(ubicacionId: number, empresaId: number) {
    return this.softDelete(this.ubicacionRepo, 'ubicacionId', ubicacionId, empresaId, 'Ubicacion');
  }

  async findAllPasillos(empresaId: number) {
    return this.findAllByEmpresa(this.pasilloRepo, empresaId);
  }

  async findPasillo(pasilloId: number, empresaId: number) {
    return this.findOneById(this.pasilloRepo, 'pasilloId', pasilloId, empresaId, 'Pasillo');
  }

  async createPasillo(dto: any, currentUser: string) {
    return this.createEntity(this.pasilloRepo, dto, currentUser);
  }

  async updatePasillo(pasilloId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.pasilloRepo, 'pasilloId', pasilloId, empresaId, dto, currentUser, 'Pasillo');
  }

  async removePasillo(pasilloId: number, empresaId: number) {
    return this.softDelete(this.pasilloRepo, 'pasilloId', pasilloId, empresaId, 'Pasillo');
  }

  async findAllCasas(empresaId: number) {
    return this.findAllByEmpresa(this.casaRepo, empresaId);
  }

  async findCasa(casaId: number, empresaId: number) {
    return this.findOneById(this.casaRepo, 'casaId', casaId, empresaId, 'Casa');
  }

  async createCasa(dto: any, currentUser: string) {
    return this.createEntity(this.casaRepo, dto, currentUser);
  }

  async updateCasa(casaId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.casaRepo, 'casaId', casaId, empresaId, dto, currentUser, 'Casa');
  }

  async removeCasa(casaId: number, empresaId: number) {
    return this.softDelete(this.casaRepo, 'casaId', casaId, empresaId, 'Casa');
  }

  async findAllTestantes(empresaId: number) {
    return this.findAllByEmpresa(this.testanteRepo, empresaId);
  }

  async findTestante(testanteId: number, empresaId: number) {
    return this.findOneById(this.testanteRepo, 'testanteId', testanteId, empresaId, 'Testante');
  }

  async createTestante(dto: any, currentUser: string) {
    return this.createEntity(this.testanteRepo, dto, currentUser);
  }

  async updateTestante(testanteId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.testanteRepo, 'testanteId', testanteId, empresaId, dto, currentUser, 'Testante');
  }

  async removeTestante(testanteId: number, empresaId: number) {
    return this.softDelete(this.testanteRepo, 'testanteId', testanteId, empresaId, 'Testante');
  }

  async findAllTags(empresaId: number) {
    return this.findAllByEmpresa(this.tagRepo, empresaId);
  }

  async findTag(tagsId: number, empresaId: number) {
    return this.findOneById(this.tagRepo, 'tagsId', tagsId, empresaId, 'Tag');
  }

  async createTag(dto: any, currentUser: string) {
    return this.createEntity(this.tagRepo, dto, currentUser);
  }

  async updateTag(tagsId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.tagRepo, 'tagsId', tagsId, empresaId, dto, currentUser, 'Tag');
  }

  async removeTag(tagsId: number, empresaId: number) {
    return this.softDelete(this.tagRepo, 'tagsId', tagsId, empresaId, 'Tag');
  }

  async findAllProveedores(empresaId: number) {
    return this.findAllByEmpresa(this.proveedorRepo, empresaId);
  }

  async findProveedor(proveedorId: number, empresaId: number) {
    return this.findOneById(this.proveedorRepo, 'proveedorId', proveedorId, empresaId, 'Proveedor');
  }

  async createProveedor(dto: CreateProveedorDto, currentUser: string) {
    return this.createEntity(this.proveedorRepo, dto, currentUser);
  }

  async updateProveedor(proveedorId: number, empresaId: number, dto: UpdateProveedorDto, currentUser: string) {
    return this.updateEntity(this.proveedorRepo, 'proveedorId', proveedorId, empresaId, dto, currentUser, 'Proveedor');
  }

  async removeProveedor(proveedorId: number, empresaId: number) {
    return this.softDelete(this.proveedorRepo, 'proveedorId', proveedorId, empresaId, 'Proveedor');
  }

  async findAllExistencias(empresaId: number) {
    return this.existenciaRepo.find({
      where: { empresaId },
    });
  }

  async findExistencia(invexistenciaId: number, empresaId: number) {
    return this.findOneById(this.existenciaRepo, 'invexistenciaId', invexistenciaId, empresaId, 'Existencia');
  }

  async createExistencia(dto: any, currentUser: string) {
    return this.createEntity(this.existenciaRepo, dto, currentUser);
  }

  async updateExistencia(invexistenciaId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.existenciaRepo, 'invexistenciaId', invexistenciaId, empresaId, dto, currentUser, 'Existencia');
  }

  async findAllKardex(empresaId: number) {
    return this.kardexRepo.find({
      where: { empresaId },
      order: { fecharegistro: 'DESC' },
    });
  }

  async findKardex(invkardexId: number, empresaId: number) {
    return this.findOneById(this.kardexRepo, 'invkardexId', invkardexId, empresaId, 'Kardex');
  }

  async createKardex(dto: any, currentUser: string) {
    return this.createEntity(this.kardexRepo, dto, currentUser);
  }

  // ===== ProductoCodBarra =====

  async findAllCodBarra(empresaId: number) {
    return this.codBarraRepo.find({ where: { empresaId } });
  }

  async findCodBarra(productocodbarrasId: number, empresaId: number) {
    return this.findOneById(this.codBarraRepo, 'productocodbarrasId', productocodbarrasId, empresaId, 'ProductoCodBarra');
  }

  async createCodBarra(dto: any, currentUser: string) {
    return this.createEntity(this.codBarraRepo, dto, currentUser);
  }

  async updateCodBarra(productocodbarrasId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.codBarraRepo, 'productocodbarrasId', productocodbarrasId, empresaId, dto, currentUser, 'ProductoCodBarra');
  }

  async removeCodBarra(productocodbarrasId: number, empresaId: number) {
    return this.softDelete(this.codBarraRepo, 'productocodbarrasId', productocodbarrasId, empresaId, 'ProductoCodBarra');
  }

  // ===== ProductoDet =====

  async findAllProdDet(empresaId: number) {
    return this.prodDetRepo.find({ where: { empresaId } });
  }

  async findProdDet(productosdetsId: number, empresaId: number) {
    return this.findOneById(this.prodDetRepo, 'productosdetsId', productosdetsId, empresaId, 'ProductoDet');
  }

  async createProdDet(dto: any, currentUser: string) {
    return this.createEntity(this.prodDetRepo, dto, currentUser);
  }

  async updateProdDet(productosdetsId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.prodDetRepo, 'productosdetsId', productosdetsId, empresaId, dto, currentUser, 'ProductoDet');
  }

  async removeProdDet(productosdetsId: number, empresaId: number) {
    return this.softDelete(this.prodDetRepo, 'productosdetsId', productosdetsId, empresaId, 'ProductoDet');
  }

  // ===== ProductoImg =====

  async findAllProdImg(empresaId: number) {
    return this.prodImgRepo.find({ where: { empresaId } });
  }

  async findProductosTienda(empresaId: number) {
    const productos = await this.productoRepo.find({
      where: { empresaId, sn_activo: 'S' as any },
      order: { descripcion: 'ASC' },
      relations: ['categoria'],
    });

    const productoIds = productos.map(p => p.produtoId);

    const imagenes = productoIds.length
      ? await this.prodImgRepo.find({
          where: productoIds.map(id => ({ productoId: id, empresaId, sn_activo: 'S' } as any)),
        })
      : [];

    const imagenMap = new Map<number, string>();
    for (const img of imagenes) {
      if (!imagenMap.has(img.productoId)) {
        imagenMap.set(img.productoId, img.img);
      }
    }

    const existencias = productoIds.length
      ? await this.existenciaRepo.find({
          where: productoIds.map(id => ({ productoId: id, empresaId } as any)),
        })
      : [];

    const existenciaMap = new Map<number, number>();
    const costoMap = new Map<number, number>();
    for (const ex of existencias) {
      const total = existenciaMap.get(ex.productoId) || 0;
      existenciaMap.set(ex.productoId, total + Number(ex.existencia));
      if (ex.costounitario && Number(ex.costounitario) > 0) {
        const actual = costoMap.get(ex.productoId) || 0;
        costoMap.set(ex.productoId, actual + Number(ex.costounitario));
      }
    }

    const costoCountMap = new Map<number, number>();
    for (const ex of existencias) {
      if (ex.costounitario && Number(ex.costounitario) > 0) {
        costoCountMap.set(ex.productoId, (costoCountMap.get(ex.productoId) || 0) + 1);
      }
    }

    return productos.map(p => ({
      produtoId: p.produtoId,
      descripcion: p.descripcion,
      descripcion_corta: p.descripcion_corta,
      codbarra: p.codbarra,
      precioventa: Number(p.precioventa),
      preciocosto: costoCountMap.get(p.produtoId) ? Number(costoMap.get(p.produtoId)) / Number(costoCountMap.get(p.produtoId)) : 0,
      imagen: imagenMap.get(p.produtoId) || null,
      existencia: existenciaMap.get(p.produtoId) || 0,
      categoria: p.categoria?.descripcion || null,
      categoriaId: p.categoriaId,
    }));
  }

  async findProdImg(productoimgId: number, empresaId: number) {
    return this.findOneById(this.prodImgRepo, 'productoimgId', productoimgId, empresaId, 'ProductoImg');
  }

  async createProdImg(dto: any, currentUser: string) {
    return this.createEntity(this.prodImgRepo, dto, currentUser);
  }

  async updateProdImg(productoimgId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.prodImgRepo, 'productoimgId', productoimgId, empresaId, dto, currentUser, 'ProductoImg');
  }

  async removeProdImg(productoimgId: number, empresaId: number) {
    return this.softDelete(this.prodImgRepo, 'productoimgId', productoimgId, empresaId, 'ProductoImg');
  }

  async registrarAjustePositivo(dto: {
    bodegaId: number;
    productoId: number;
    cantidad: number;
    costoUnitario: number;
    nroreferencia: string;
    empresaId: number;
    usuarioCreated: string;
    factordecambio?: number;
    codbarra?: string;
  }): Promise<void> {
    await this.kardexService.registrarEntrada({
      ...dto,
      moduloId: 4,
      tipomov: 'E',
      subtipoMov: 'A',
    });
  }

  async registrarAjusteNegativo(dto: {
    bodegaId: number;
    productoId: number;
    cantidad: number;
    costoUnitario: number;
    nroreferencia: string;
    empresaId: number;
    usuarioCreated: string;
    factordecambio?: number;
    codbarra?: string;
  }): Promise<void> {
    await this.kardexService.registrarSalida({
      ...dto,
      moduloId: 4,
      tipomov: 'S',
      subtipoMov: 'A',
    });
  }

  async registrarTraslado(dto: {
    bodegaOrigenId: number;
    bodegaDestinoId: number;
    productoId: number;
    cantidad: number;
    costoUnitario: number;
    nroreferencia: string;
    empresaId: number;
    usuarioCreated: string;
    factordecambio?: number;
    codbarra?: string;
  }): Promise<void> {
    await this.kardexService.registrarSalida({
      bodegaId: dto.bodegaOrigenId,
      productoId: dto.productoId,
      cantidad: dto.cantidad,
      costoUnitario: dto.costoUnitario,
      nroreferencia: dto.nroreferencia,
      moduloId: 4,
      tipomov: 'S',
      subtipoMov: 'T',
      empresaId: dto.empresaId,
      usuarioCreated: dto.usuarioCreated,
      factordecambio: dto.factordecambio,
      codbarra: dto.codbarra,
    });

    await this.kardexService.registrarEntrada({
      bodegaId: dto.bodegaDestinoId,
      productoId: dto.productoId,
      cantidad: dto.cantidad,
      costoUnitario: dto.costoUnitario,
      nroreferencia: dto.nroreferencia,
      moduloId: 4,
      tipomov: 'E',
      subtipoMov: 'T',
      empresaId: dto.empresaId,
      usuarioCreated: dto.usuarioCreated,
      factordecambio: dto.factordecambio,
      codbarra: dto.codbarra,
    });
  }
}

```

---

## 📄 src\modules\inventario\kardex.service.ts

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TinvKardex } from './entities/kardex.entity';
import { TinvExistencia } from './entities/existencia.entity';
import { Tproducto } from './entities/producto.entity';

export interface KardexEntradaDto {
  bodegaId: number;
  productoId: number;
  cantidad: number;
  costoUnitario: number;
  nroreferencia: string;
  moduloId: number;
  tipomov: 'E';
  subtipoMov: 'C' | 'A' | 'T' | 'D' | 'O' | 'AN';
  empresaId: number;
  usuarioCreated: string;
  factordecambio?: number;
  codbarra?: string;
  FechaIngreso?: Date;
}

export interface KardexSalidaDto {
  bodegaId: number;
  productoId: number;
  cantidad: number;
  costoUnitario: number;
  nroreferencia: string;
  moduloId: number;
  tipomov: 'S';
  subtipoMov: 'V' | 'A' | 'T' | 'AN' | 'O';
  empresaId: number;
  usuarioCreated: string;
  factordecambio?: number;
  codbarra?: string;
}

export type KardexMovimientoDto = KardexEntradaDto | KardexSalidaDto;

@Injectable()
export class KardexService {
  constructor(
    @InjectRepository(TinvKardex)
    private readonly kardexRepo: Repository<TinvKardex>,
    @InjectRepository(TinvExistencia)
    private readonly existenciaRepo: Repository<TinvExistencia>,
    @InjectRepository(Tproducto)
    private readonly productoRepo: Repository<Tproducto>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async registrarEntrada(dto: KardexEntradaDto): Promise<TinvKardex> {
    const existencia = await this.obtenerOCrearExistencia(dto.bodegaId, dto.productoId, dto.empresaId, dto.usuarioCreated);
    const saldoAnterior = Number(existencia.existencia) || 0;
    const saldoActual = saldoAnterior + dto.cantidad;
    const costoTotal = dto.cantidad * dto.costoUnitario;

    const kardex = this.kardexRepo.create({
      bodegaId: dto.bodegaId,
      productoId: dto.productoId,
      codbarra: dto.codbarra || '',
      FechaIngreso: dto.FechaIngreso || new Date(),
      factordecambio: dto.factordecambio || 1,
      cantidad: dto.cantidad,
      existencia: saldoActual,
      costoUnitario: dto.costoUnitario,
      subTotal: costoTotal,
      saldoAnterior,
      saldoActual,
      costoTotal,
      costoUSD: dto.factordecambio ? costoTotal / dto.factordecambio : 0,
      subTotalUSD: dto.factordecambio ? costoTotal / dto.factordecambio : 0,
      nroreferencia: dto.nroreferencia,
      tipomov: 'E',
      moduloId: dto.moduloId,
      empresaId: dto.empresaId,
      usuarioCreated: dto.usuarioCreated,
    });

    const saved = await this.kardexRepo.save(kardex);

    await this.actualizarExistencia(dto.bodegaId, dto.productoId, dto.empresaId, saldoActual, dto.costoUnitario, dto.usuarioCreated);

    this.eventEmitter.emit('kardex.entrada.registrada', { kardex: saved, dto });

    return saved;
  }

  async registrarSalida(dto: KardexSalidaDto): Promise<TinvKardex> {
    const existencia = await this.obtenerOCrearExistencia(dto.bodegaId, dto.productoId, dto.empresaId, dto.usuarioCreated);
    const saldoAnterior = Number(existencia.existencia) || 0;
    
    if (saldoAnterior < dto.cantidad) {
      throw new Error(`Stock insuficiente. Disponible: ${saldoAnterior}, Solicitado: ${dto.cantidad}`);
    }

    const saldoActual = saldoAnterior - dto.cantidad;
    const costoTotal = dto.cantidad * dto.costoUnitario;

    const kardex = this.kardexRepo.create({
      bodegaId: dto.bodegaId,
      productoId: dto.productoId,
      codbarra: dto.codbarra || '',
      FechaIngreso: new Date(),
      factordecambio: dto.factordecambio || 1,
      cantidad: dto.cantidad,
      existencia: saldoActual,
      costoUnitario: dto.costoUnitario,
      subTotal: costoTotal,
      saldoAnterior,
      saldoActual,
      costoTotal,
      costoUSD: dto.factordecambio ? costoTotal / dto.factordecambio : 0,
      subTotalUSD: dto.factordecambio ? costoTotal / dto.factordecambio : 0,
      nroreferencia: dto.nroreferencia,
      tipomov: 'S',
      moduloId: dto.moduloId,
      empresaId: dto.empresaId,
      usuarioCreated: dto.usuarioCreated,
    });

    const saved = await this.kardexRepo.save(kardex);

    await this.actualizarExistencia(dto.bodegaId, dto.productoId, dto.empresaId, saldoActual, dto.costoUnitario, dto.usuarioCreated);

    this.eventEmitter.emit('kardex.salida.registrada', { kardex: saved, dto });

    return saved;
  }

  async registrarMovimiento(dto: KardexMovimientoDto): Promise<TinvKardex> {
    if (dto.tipomov === 'E') {
      return this.registrarEntrada(dto as KardexEntradaDto);
    }
    return this.registrarSalida(dto as KardexSalidaDto);
  }

  private async obtenerOCrearExistencia(bodegaId: number, productoId: number, empresaId: number, usuario: string): Promise<TinvExistencia> {
    let existencia = await this.existenciaRepo.findOne({
      where: { bodegaId, productoId, empresaId } as FindOptionsWhere<TinvExistencia>,
    });

    if (!existencia) {
      const producto = await this.productoRepo.findOne({
        where: { produtoId: productoId, empresaId } as FindOptionsWhere<Tproducto>,
      });
      existencia = this.existenciaRepo.create({
        bodegaId,
        productoId,
        empresaId,
        existencia: 0,
        costounitario: (producto as any)?.cstounit || 0,
        precioventa: producto?.precioventa || 0,
        usuarioCreated: usuario,
      });
      await this.existenciaRepo.save(existencia);
    }

    return existencia;
  }

  private async actualizarExistencia(
    bodegaId: number,
    productoId: number,
    empresaId: number,
    nuevaExistencia: number,
    costoUnitario: number,
    usuarioUpdated: string,
  ): Promise<void> {
    await this.existenciaRepo
      .createQueryBuilder()
      .update(TinvExistencia)
      .set({
        existencia: nuevaExistencia,
        costounitario: costoUnitario,
        usuarioUpdated,
        fechaUpdated: new Date() as any,
      })
      .where('bodegaId = :bodegaId AND productoId = :productoId AND empresaId = :empresaId', {
        bodegaId,
        productoId,
        empresaId,
      })
      .execute();
  }

  async consultarKardex(filtros: {
    empresaId: number;
    bodegaId?: number;
    productoId?: number;
    fechaDesde?: Date;
    fechaHasta?: Date;
    tipomov?: 'E' | 'S';
    moduloId?: number;
    page?: number;
    limit?: number;
  }): Promise<{ data: TinvKardex[]; total: number }> {
    const qb = this.kardexRepo.createQueryBuilder('k');
    qb.where('k.empresaId = :empresaId', { empresaId: filtros.empresaId });

    if (filtros.bodegaId) qb.andWhere('k.bodegaId = :bodegaId', { bodegaId: filtros.bodegaId });
    if (filtros.productoId) qb.andWhere('k.productoId = :productoId', { productoId: filtros.productoId });
    if (filtros.fechaDesde) qb.andWhere('k.fecharegistro >= :fechaDesde', { fechaDesde: filtros.fechaDesde });
    if (filtros.fechaHasta) qb.andWhere('k.fecharegistro <= :fechaHasta', { fechaHasta: filtros.fechaHasta });
    if (filtros.tipomov) qb.andWhere('k.tipomov = :tipomov', { tipomov: filtros.tipomov });
    if (filtros.moduloId) qb.andWhere('k.moduloId = :moduloId', { moduloId: filtros.moduloId });

    qb.orderBy('k.fecharegistro', 'DESC');
    qb.addOrderBy('k.invkardexId', 'DESC');

    const page = filtros.page || 1;
    const limit = filtros.limit || 50;
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async obtenerSaldoActual(bodegaId: number, productoId: number, empresaId: number): Promise<number> {
    const existencia = await this.existenciaRepo.findOne({
      where: { bodegaId, productoId, empresaId } as FindOptionsWhere<TinvExistencia>,
    });
    return Number(existencia?.existencia) || 0;
  }

  async recalcularExistencias(empresaId: number, stockInicial: number = 0): Promise<{ productos: number; registros: number; detalle: any[] }> {
    const kardex = await this.kardexRepo.find({
      where: { empresaId } as FindOptionsWhere<TinvKardex>,
      order: { fecharegistro: 'ASC', invkardexId: 'ASC' },
    });

    const mapa = new Map<number, Map<number, { existencia: number; costoUnitario: number; bodegaId: number }>>();

    for (const k of kardex) {
      const prodId = Number(k.productoId);
      const bodegaId = Number(k.bodegaId);

      if (!mapa.has(bodegaId)) mapa.set(bodegaId, new Map());
      const bodegaMap = mapa.get(bodegaId)!;

      if (!bodegaMap.has(prodId)) {
        const initStock = stockInicial > 0 ? stockInicial : 0;
        bodegaMap.set(prodId, { existencia: initStock, costoUnitario: 0, bodegaId });
      }

      const estado = bodegaMap.get(prodId)!;
      const cant = Number(k.cantidad) || 0;
      const saldoAnt = Math.round(estado.existencia);

      if (k.tipomov === 'E') {
        estado.existencia += cant;
      } else {
        estado.existencia -= cant;
      }

      estado.costoUnitario = Number(k.costoUnitario) || 0;

      await this.kardexRepo.createQueryBuilder()
        .update()
        .set({
          saldoAnterior: saldoAnt,
          saldoActual: Math.round(estado.existencia),
          existencia: Math.round(estado.existencia),
        })
        .where('invkardexId = :id', { id: k.invkardexId })
        .execute();
    }

    const detalle: any[] = [];

    for (const [bodegaId, bodegaMap] of mapa) {
      for (const [prodId, estado] of bodegaMap) {
        const exist = await this.existenciaRepo.findOne({
          where: { bodegaId, productoId: prodId, empresaId } as FindOptionsWhere<TinvExistencia>,
        });

        const anterior = exist ? Number(exist.existencia) : 0;
        const nueva = Math.round(estado.existencia);

        if (exist) {
          await this.existenciaRepo.createQueryBuilder()
            .update()
            .set({
              existencia: nueva,
              costounitario: estado.costoUnitario,
              usuarioUpdated: 'admin',
            })
            .where('invexistenciaId = :id', { id: exist.invexistenciaId })
            .execute();
        } else {
          await this.existenciaRepo.save(this.existenciaRepo.create({
            bodegaId,
            productoId: prodId,
            empresaId,
            existencia: nueva,
            costounitario: estado.costoUnitario,
            usuarioCreated: 'admin',
          }));
        }

        detalle.push({ bodegaId, productoId: prodId, anterior, nueva, diferencia: nueva - anterior });
      }
    }

    return { productos: mapa.size, registros: kardex.length, detalle };
  }
}
```

---

## 📄 src\modules\inventario\requisicion-inventario.controller.ts

```typescript
import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequisicionInventarioService } from './requisicion-inventario.service';

@ApiTags('Inventario - Requisiciones')
@ApiBearerAuth()
@Controller('inventario/requisiciones')
export class RequisicionInventarioController {
  constructor(private readonly service: RequisicionInventarioService) {}

  @Get()
  @ApiOperation({ summary: 'Listar requisiciones' })
  findAll(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllMae(empresaId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener requisición por ID' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findOneMae(id, empresaId);
  }

  @Get(':id/det')
  @ApiOperation({ summary: 'Obtener items de la requisición' })
  findDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findDetByMae(id, empresaId);
  }

  @Post()
  @ApiOperation({ summary: 'Crear requisición' })
  create(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createMae({ ...dto, empresaId: dto.empresaId || 2 }, user?.usuario || 'admin');
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar requisición' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateMae(id, empresaId, dto, user?.usuario || 'admin');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar requisición' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeMae(id, empresaId);
  }

  @Post('det')
  @ApiOperation({ summary: 'Agregar item a la requisición' })
  createDet(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createDet({ ...dto, empresaId: dto.empresaId || 2 }, user?.usuario || 'admin');
  }

  @Put('det/:id')
  @ApiOperation({ summary: 'Actualizar item de la requisición' })
  updateDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateDet(id, empresaId, dto, user?.usuario || 'admin');
  }

  @Delete('det/:id')
  @ApiOperation({ summary: 'Eliminar item de la requisición' })
  removeDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeDet(id, empresaId);
  }

  @Post(':id/procesar')
  @ApiOperation({ summary: 'Procesar requisición (aprobar)' })
  procesar(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @CurrentUser() user: any,
  ) {
    return this.service.procesar(id, empresaId, user?.usuario || 'admin');
  }

  @Post(':id/anular')
  @ApiOperation({ summary: 'Anular requisición' })
  anular(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @CurrentUser() user: any,
  ) {
    return this.service.anular(id, empresaId, user?.usuario || 'admin');
  }
}

```

---

## 📄 src\modules\inventario\requisicion-inventario.service.ts

```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TInvReqMae } from './entities/invreqmae.entity';
import { TInvReqDet } from './entities/invreqdet.entity';
import { Tproducto } from './entities/producto.entity';

@Injectable()
export class RequisicionInventarioService {
  constructor(
    @InjectRepository(TInvReqMae) private readonly maeRepo: Repository<TInvReqMae>,
    @InjectRepository(TInvReqDet) private readonly detRepo: Repository<TInvReqDet>,
    @InjectRepository(Tproducto) private readonly productoRepo: Repository<Tproducto>,
  ) {}

  async findAllMae(empresaId: number) {
    return this.maeRepo.find({ where: { empresaId } as any, order: { fecharegistro: 'DESC' } as any });
  }

  async findOneMae(invreqmaeid: number, empresaId: number) {
    const mae = await this.maeRepo.findOne({ where: { invreqmaeid, empresaId } as any });
    if (!mae) throw new BadRequestException('Requisición no encontrada');
    return mae;
  }

  async findDetByMae(invreqmaeid: number, empresaId: number) {
    return this.detRepo.find({ where: { invreqmaeid, empresaId } as any, order: { nrofila: 'ASC' } as any });
  }

  async createMae(dto: any, usuario: string) {
    const mae = this.maeRepo.create({
      nrorequisicion: dto.nrorequisicion || 0,
      bodegaOrigenId: dto.bodegaOrigenId,
      bodegaDestinoId: dto.bodegaDestinoId,
      concepto: dto.concepto || '',
      prioridad: dto.prioridad || 'M',
      fechaEntrega: dto.fechaEntrega ? new Date(dto.fechaEntrega).toISOString().slice(0, 10) : null,
      observaciones: dto.observaciones || '',
      sn_estado: 'P',
      sn_anulado: 'N',
      empresaId: dto.empresaId,
      usuarioCreated: usuario,
    });
    return this.maeRepo.save(mae);
  }

  async updateMae(invreqmaeid: number, empresaId: number, dto: any, usuario: string) {
    const mae = await this.findOneMae(invreqmaeid, empresaId);
    if (dto.fechaEntrega) {
      dto.fechaEntrega = new Date(dto.fechaEntrega).toISOString().slice(0, 10);
    }
    Object.assign(mae, dto, { usuarioUpdated: usuario, fechaUpdated: new Date() });
    return this.maeRepo.save(mae);
  }

  async removeMae(invreqmaeid: number, empresaId: number) {
    const mae = await this.findOneMae(invreqmaeid, empresaId);
    if (mae.sn_estado === 'A') throw new BadRequestException('No se puede eliminar una requisición aprobada');
    await this.detRepo.delete({ invreqmaeid, empresaId } as any);
    return this.maeRepo.delete({ invreqmaeid, empresaId } as any);
  }

  async createDet(dto: any, usuario: string) {
    const maxNro = await this.detRepo.createQueryBuilder('d')
      .select('MAX(d.nrofila)', 'maxNro')
      .where('d.invreqmaeid = :invreqmaeid', { invreqmaeid: dto.invreqmaeid })
      .getRawOne();
    const nrofila = (maxNro?.maxNro || 0) + 1;

    let productoId = 0;
    let descripcion = dto.descripcion || '';

    if (dto.codbarra && dto.empresaId) {
      const prod = await this.productoRepo.findOne({ where: { codbarra: dto.codbarra, empresaId: dto.empresaId } as any });
      if (!prod) throw new BadRequestException(`Producto con codbarra "${dto.codbarra}" no encontrado`);
      productoId = prod.produtoId;
      descripcion = prod.descripcion;
    } else {
      throw new BadRequestException('Código de barra es requerido');
    }

    const cantidadSolicitada = Number(dto.cantidadSolicitada) || 0;

    const det = this.detRepo.create({
      invreqmaeid: dto.invreqmaeid,
      nrofila,
      productoId,
      codbarra: dto.codbarra,
      descripcion,
      cantidadSolicitada,
      cantidadEntregada: 0,
      sn_estado: 'P',
      sn_anulado: 'N',
      empresaId: dto.empresaId,
      usuarioCreated: usuario,
    });
    return this.detRepo.save(det);
  }

  async updateDet(invreqdetid: number, empresaId: number, dto: any, usuario: string) {
    const det = await this.detRepo.findOne({ where: { invreqdetid, empresaId } as any });
    if (!det) throw new BadRequestException('Detalle no encontrado');
    Object.assign(det, dto, { usuarioUpdated: usuario, fechaUpdated: new Date() });
    return this.detRepo.save(det);
  }

  async removeDet(invreqdetid: number, empresaId: number) {
    return this.detRepo.delete({ invreqdetid, empresaId } as any);
  }

  async procesar(invreqmaeid: number, empresaId: number, usuario: string) {
    const mae = await this.findOneMae(invreqmaeid, empresaId);
    if (mae.sn_estado === 'A') throw new BadRequestException('La requisición ya fue procesada');
    if (mae.sn_anulado === 'S') throw new BadRequestException('La requisición está anulada');

    const dets = await this.findDetByMae(invreqmaeid, empresaId);
    if (dets.length === 0) throw new BadRequestException('No hay items para procesar');

    for (const det of dets) {
      if (det.sn_anulado === 'S') continue;
      await this.detRepo.update(det.invreqdetid, {
        sn_estado: 'A',
        usuarioUpdated: usuario,
        fechaUpdated: new Date(),
      } as any);
    }

    await this.maeRepo.update(invreqmaeid, {
      sn_estado: 'A',
      usuarioUpdated: usuario,
      fechaUpdated: new Date(),
    } as any);

    return { message: 'Requisición aprobada' };
  }

  async anular(invreqmaeid: number, empresaId: number, usuario: string) {
    const mae = await this.findOneMae(invreqmaeid, empresaId);
    if (mae.sn_anulado === 'S') throw new BadRequestException('La requisición ya está anulada');

    await this.maeRepo.update(invreqmaeid, {
      sn_anulado: 'S',
      sn_estado: 'X',
      usuarioUpdated: usuario,
      fechaUpdated: new Date(),
    } as any);

    return { message: 'Requisición anulada' };
  }
}

```

---

## 📄 src\modules\inventario\toma-inventario.controller.ts

```typescript
import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TomaInventarioService } from './toma-inventario.service';

@ApiTags('Inventario - Toma de Inventario')
@ApiBearerAuth()
@Controller('inventario/toma-inventario')
export class TomaInventarioController {
  constructor(private readonly service: TomaInventarioService) {}

  @Get()
  @ApiOperation({ summary: 'Listar tomas de inventario' })
  findAll(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllMae(empresaId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener toma de inventario por ID' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findOneMae(id, empresaId);
  }

  @Get(':id/det')
  @ApiOperation({ summary: 'Obtener items de la toma de inventario' })
  findDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findDetByMae(id, empresaId);
  }

  @Post()
  @ApiOperation({ summary: 'Crear toma de inventario' })
  create(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createMae({ ...dto, empresaId: dto.empresaId || 2 }, user?.usuario || 'admin');
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar toma de inventario' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateMae(id, empresaId, dto, user?.usuario || 'admin');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar toma de inventario' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeMae(id, empresaId);
  }

  @Post('det')
  @ApiOperation({ summary: 'Agregar item a la toma de inventario' })
  createDet(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createDet({ ...dto, empresaId: dto.empresaId || 2 }, user?.usuario || 'admin');
  }

  @Put('det/:id')
  @ApiOperation({ summary: 'Actualizar item de toma de inventario' })
  updateDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateDet(id, empresaId, dto, user?.usuario || 'admin');
  }

  @Delete('det/:id')
  @ApiOperation({ summary: 'Eliminar item de toma de inventario' })
  removeDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeDet(id, empresaId);
  }

  @Post(':id/procesar')
  @ApiOperation({ summary: 'Procesar toma de inventario (aplica ajustes)' })
  procesar(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body('bodegaId', ParseIntPipe) bodegaId: number,
    @CurrentUser() user: any,
  ) {
    return this.service.procesarInventario(id, empresaId, bodegaId, user?.usuario || 'admin');
  }

  @Post('det/:id/cargar-existencia')
  @ApiOperation({ summary: 'Cargar existencia del sistema para un item' })
  cargarExistencia(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.cargarExistencia(id, empresaId);
  }

  @Post('importar/:id')
  @ApiOperation({ summary: 'Importar items desde archivo (CSV, Excel, JSON, XML)' })
  importar(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body('items') items: any[],
    @CurrentUser() user: any,
  ) {
    return this.service.importarItems(id, empresaId, items, user?.usuario || 'admin');
  }
}

```

---

## 📄 src\modules\inventario\toma-inventario.service.ts

```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TInvFisMae } from './entities/invfismae.entity';
import { TInvFisDet } from './entities/invfisdet.entity';
import { Tproducto } from './entities/producto.entity';
import { TinvExistencia } from './entities/existencia.entity';
import { KardexService } from './kardex.service';

@Injectable()
export class TomaInventarioService {
  constructor(
    @InjectRepository(TInvFisMae) private readonly maeRepo: Repository<TInvFisMae>,
    @InjectRepository(TInvFisDet) private readonly detRepo: Repository<TInvFisDet>,
    @InjectRepository(Tproducto) private readonly productoRepo: Repository<Tproducto>,
    @InjectRepository(TinvExistencia) private readonly existenciaRepo: Repository<TinvExistencia>,
    private readonly kardexService: KardexService,
  ) {}

  async findAllMae(empresaId: number) {
    return this.maeRepo.find({ where: { empresaId } as any, order: { fecharegistro: 'DESC' } as any });
  }

  async findOneMae(invfisId: number, empresaId: number) {
    const mae = await this.maeRepo.findOne({ where: { invfisId, empresaId } as any });
    if (!mae) throw new BadRequestException('Toma de inventario no encontrada');
    return mae;
  }

  async findDetByMae(invfisId: number, empresaId: number) {
    return this.detRepo.find({ where: { invfisId, empresaId } as any, order: { nrofila: 'ASC' } as any });
  }

  async createMae(dto: any, usuario: string) {
    const mae = this.maeRepo.create({
      bodegaId: dto.bodegaId,
      concepto: dto.concepto || '',
      sn_anulado: 'N',
      empresaId: dto.empresaId,
      usuarioCreated: usuario,
    });
    return this.maeRepo.save(mae);
  }

  async updateMae(invfisId: number, empresaId: number, dto: any, usuario: string) {
    const mae = await this.findOneMae(invfisId, empresaId);
    Object.assign(mae, dto, { usuarioUpdated: usuario, fechaUpdated: new Date() });
    return this.maeRepo.save(mae);
  }

  async removeMae(invfisId: number, empresaId: number) {
    await this.detRepo.delete({ invfisId, empresaId } as any);
    return this.maeRepo.delete({ invfisId, empresaId } as any);
  }

  async createDet(dto: any, usuario: string) {
    const maxNro = await this.detRepo.createQueryBuilder('d')
      .select('MAX(d.nrofila)', 'maxNro')
      .where('d.invfisId = :invfisId', { invfisId: dto.invfisId })
      .getRawOne();
    const nrofila = (maxNro?.maxNro || 0) + 1;

    let existenciaSistema = Number(dto.existencia) || 0;
    let descripcion = dto.descripcion || '';
    let costoUnitario = Number(dto.costoUnitario) || 0;
    let preciovta = Number(dto.preciovta) || 0;

    if (dto.codbarra && dto.bodegaId && dto.empresaId) {
      const prod = await this.productoRepo.findOne({ where: { codbarra: dto.codbarra, empresaId: dto.empresaId } as any });
      if (prod) {
        descripcion = prod.descripcion;
        costoUnitario = Number(prod.cstounit) || 0;
        preciovta = Number(prod.precioventa) || 0;
        const existReg = await this.existenciaRepo.findOne({
          where: { productoId: prod.produtoId, bodegaId: dto.bodegaId, empresaId: dto.empresaId } as any,
        });
        existenciaSistema = existReg ? Number(existReg.existencia) : 0;
      }
    }

    const fisico = Number(dto.fisico) || 0;
    let ajusteEntrada = Number(dto.ajusteEntrada) || 0;
    let ajusteSalida = Number(dto.ajusteSalida) || 0;

    if (!ajusteEntrada && !ajusteSalida) {
      if (existenciaSistema === 0 && fisico > 0) {
        ajusteEntrada = fisico;
      } else if (fisico > existenciaSistema) {
        ajusteEntrada = fisico - existenciaSistema;
      } else if (fisico < existenciaSistema) {
        ajusteSalida = existenciaSistema - fisico;
      }
    }

    const det = this.detRepo.create({
      invfisId: dto.invfisId,
      bodegaId: dto.bodegaId,
      nrofila,
      codbarra: dto.codbarra || '',
      descripcion,
      existencia: existenciaSistema,
      fisico,
      ajusteEntrada,
      ajusteSalida,
      costoUnitario,
      costoTotal: fisico * costoUnitario,
      preciovta,
      sn_posteado: 'S',
      sn_aplicado: 'N',
      empresaId: dto.empresaId,
      usuarioCreated: usuario,
    });
    return this.detRepo.save(det);
  }

  async updateDet(nvfisdetId: number, empresaId: number, dto: any, usuario: string) {
    const det = await this.detRepo.findOne({ where: { nvfisdetId, empresaId } as any });
    if (!det) throw new BadRequestException('Detalle no encontrado');
    Object.assign(det, dto, { usuarioUpdated: usuario, fechaUpdated: new Date() });
    return this.detRepo.save(det);
  }

  async removeDet(nvfisdetId: number, empresaId: number) {
    return this.detRepo.delete({ nvfisdetId, empresaId } as any);
  }

  async procesarInventario(invfisId: number, empresaId: number, bodegaId: number, usuario: string) {
    const mae = await this.findOneMae(invfisId, empresaId);
    const dets = await this.findDetByMae(invfisId, empresaId);

    if (dets.length === 0) {
      throw new BadRequestException('No hay items para procesar');
    }

    const resultados: any[] = [];

    for (const det of dets) {
      const fisico = Number(det.fisico) || 0;
      const sistema = Number(det.existencia) || 0;
      const costoUnitario = Number(det.costoUnitario) || 0;
      const diferencia = fisico - sistema;

      let ajusteEntrada = 0;
      let ajusteSalida = 0;

      if (sistema === 0 && fisico > 0) {
        ajusteEntrada = fisico;
      } else if (diferencia > 0) {
        ajusteEntrada = diferencia;
      } else if (diferencia < 0) {
        ajusteSalida = Math.abs(diferencia);
      }

      const prod = await this.productoRepo.findOne({ where: { codbarra: det.codbarra, empresaId } as any });
      const productoId = prod?.produtoId;

      if (productoId && ajusteEntrada > 0) {
        await this.kardexService.registrarEntrada({
          bodegaId: mae.bodegaId,
          productoId,
          cantidad: ajusteEntrada,
          costoUnitario,
          nroreferencia: `TI-${invfisId}`,
          moduloId: 6,
          tipomov: 'E',
          subtipoMov: 'A',
          empresaId,
          usuarioCreated: usuario,
        });
      }

      if (productoId && ajusteSalida > 0) {
        await this.kardexService.registrarSalida({
          bodegaId: mae.bodegaId,
          productoId,
          cantidad: ajusteSalida,
          costoUnitario,
          nroreferencia: `TI-${invfisId}`,
          moduloId: 6,
          tipomov: 'S',
          subtipoMov: 'A',
          empresaId,
          usuarioCreated: usuario,
        });
      }

      await this.detRepo.update(det.nvfisdetId, {
        ajusteEntrada,
        ajusteSalida,
        costoTotal: Number(fisico) * Number(costoUnitario),
        sn_aplicado: 'S',
        usuarioUpdated: usuario,
        fechaUpdated: new Date(),
      } as any);

      resultados.push({
        codbarra: det.codbarra,
        descripcion: det.descripcion,
        sistema,
        fisico,
        ajusteEntrada,
        ajusteSalida,
      });
    }

    await this.maeRepo.update(invfisId, {
      sn_anulado: 'N',
      usuarioUpdated: usuario,
      fechaUpdated: new Date(),
    } as any);

    return { message: 'Inventario procesado', items: resultados };
  }

  async cargarExistencia(nvfisdetId: number, empresaId: number) {
    const det = await this.detRepo.findOne({ where: { nvfisdetId, empresaId } as any });
    if (!det) throw new BadRequestException('Detalle no encontrado');

    const prod = await this.productoRepo.findOne({ where: { codbarra: det.codbarra, empresaId } as any });
    if (!prod) return det;

    const existencia = await this.existenciaRepo.findOne({
      where: { productoId: prod.produtoId, empresaId } as any,
    });

    det.existencia = existencia ? Number(existencia.existencia) : 0;
    det.costoUnitario = Number(prod.cstounit) || 0;
    det.preciovta = Number(prod.precioventa) || 0;
    det.descripcion = prod.descripcion;

    const fisico = Number(det.fisico) || 0;
    const sistema = det.existencia;
    if (sistema === 0 && fisico > 0) {
      det.ajusteEntrada = fisico;
      det.ajusteSalida = 0;
    } else if (fisico > sistema) {
      det.ajusteEntrada = fisico - sistema;
      det.ajusteSalida = 0;
    } else if (fisico < sistema) {
      det.ajusteEntrada = 0;
      det.ajusteSalida = sistema - fisico;
    } else {
      det.ajusteEntrada = 0;
      det.ajusteSalida = 0;
    }

    await this.detRepo.save(det);
    return det;
  }

  async importarItems(invfisId: number, empresaId: number, items: any[], usuario: string) {
    const mae = await this.findOneMae(invfisId, empresaId);
    const resultados: any[] = [];

    for (const item of items) {
      const fisico = Number(item.existencia) || Number(item.fisico) || 0;

      const det = await this.createDet({
        invfisId,
        bodegaId: mae.bodegaId,
        codbarra: item.codbarra || '',
        descripcion: item.descripcion || '',
        fisico,
        empresaId,
      }, usuario);

      resultados.push(det);
    }

    return resultados;
  }
}

```

---

## 📄 src\modules\inventario\traslado-inventario.controller.ts

```typescript
import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TrasladoInventarioService } from './traslado-inventario.service';

@ApiTags('Inventario - Traslados')
@ApiBearerAuth()
@Controller('inventario/traslados-mae')
export class TrasladoInventarioController {
  constructor(private readonly service: TrasladoInventarioService) {}

  @Get()
  @ApiOperation({ summary: 'Listar traslados' })
  findAll(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllMae(empresaId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener traslado por ID' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findOneMae(id, empresaId);
  }

  @Get(':id/det')
  @ApiOperation({ summary: 'Obtener items del traslado' })
  findDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findDetByMae(id, empresaId);
  }

  @Post()
  @ApiOperation({ summary: 'Crear traslado' })
  create(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createMae({ ...dto, empresaId: dto.empresaId || 2 }, user?.usuario || 'admin');
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar traslado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateMae(id, empresaId, dto, user?.usuario || 'admin');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar traslado' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeMae(id, empresaId);
  }

  @Post('det')
  @ApiOperation({ summary: 'Agregar item al traslado' })
  createDet(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createDet({ ...dto, empresaId: dto.empresaId || 2 }, user?.usuario || 'admin');
  }

  @Delete('det/:id')
  @ApiOperation({ summary: 'Eliminar item del traslado' })
  removeDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeDet(id, empresaId);
  }

  @Post(':id/procesar')
  @ApiOperation({ summary: 'Procesar traslado (kardex salida + entrada)' })
  procesar(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @CurrentUser() user: any,
  ) {
    return this.service.procesar(id, empresaId, user?.usuario || 'admin');
  }

  @Post(':id/anular')
  @ApiOperation({ summary: 'Anular traslado' })
  anular(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @CurrentUser() user: any,
  ) {
    return this.service.anular(id, empresaId, user?.usuario || 'admin');
  }
}

```

---

## 📄 src\modules\inventario\traslado-inventario.service.ts

```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TInvTrasladoMae } from './entities/invtrasladomae.entity';
import { TInvTrasladoDet } from './entities/invtrasladodet.entity';
import { Tproducto } from './entities/producto.entity';
import { TinvExistencia } from './entities/existencia.entity';
import { KardexService } from './kardex.service';

@Injectable()
export class TrasladoInventarioService {
  constructor(
    @InjectRepository(TInvTrasladoMae) private readonly maeRepo: Repository<TInvTrasladoMae>,
    @InjectRepository(TInvTrasladoDet) private readonly detRepo: Repository<TInvTrasladoDet>,
    @InjectRepository(Tproducto) private readonly productoRepo: Repository<Tproducto>,
    @InjectRepository(TinvExistencia) private readonly existenciaRepo: Repository<TinvExistencia>,
    private readonly kardexService: KardexService,
  ) {}

  async findAllMae(empresaId: number) {
    return this.maeRepo.find({ where: { empresaId } as any, order: { fecharegistro: 'DESC' } as any });
  }

  async findOneMae(id: number, empresaId: number) {
    const mae = await this.maeRepo.findOne({ where: { invtrasladomaeId: id, empresaId } as any });
    if (!mae) throw new BadRequestException('Traslado no encontrado');
    return mae;
  }

  async findDetByMae(id: number, empresaId: number) {
    return this.detRepo.find({ where: { invtrasladomaeId: id, empresaId } as any, order: { nrofila: 'ASC' } as any });
  }

  async createMae(dto: any, usuario: string) {
    const nroreferencia = dto.nroreferencia || this.generarNroReferencia();
    const mae = this.maeRepo.create({
      bodegaOrigenId: dto.bodegaOrigenId,
      bodegaDestinoId: dto.bodegaDestinoId,
      nroreferencia,
      observaciones: dto.observaciones || '',
      sn_procesado: 'N',
      sn_anulado: 'N',
      empresaId: dto.empresaId,
      usuarioCreated: usuario,
    });
    return this.maeRepo.save(mae);
  }

  async updateMae(id: number, empresaId: number, dto: any, usuario: string) {
    const mae = await this.findOneMae(id, empresaId);
    if (mae.sn_procesado === 'S') throw new BadRequestException('El traslado ya fue procesado y no se puede modificar');
    if (mae.sn_anulado === 'S') throw new BadRequestException('El traslado está anulado');
    Object.assign(mae, {
      bodegaOrigenId: dto.bodegaOrigenId,
      bodegaDestinoId: dto.bodegaDestinoId,
      observaciones: dto.observaciones,
      usuarioUpdated: usuario,
      fechaUpdated: new Date(),
    });
    return this.maeRepo.save(mae);
  }

  async removeMae(id: number, empresaId: number) {
    const mae = await this.findOneMae(id, empresaId);
    if (mae.sn_procesado === 'S') throw new BadRequestException('El traslado ya fue procesado y no se puede eliminar');
    await this.detRepo.delete({ invtrasladomaeId: id, empresaId } as any);
    return this.maeRepo.delete({ invtrasladomaeId: id, empresaId } as any);
  }

  async createDet(dto: any, usuario: string) {
    const maxNro = await this.detRepo.createQueryBuilder('d')
      .select('MAX(d.nrofila)', 'maxNro')
      .where('d.invtrasladomaeId = :id', { id: dto.invtrasladomaeId })
      .getRawOne();
    const nrofila = (maxNro?.maxNro || 0) + 1;

    let descripcion = dto.descripcion || '';
    let costoUnitario = Number(dto.costoUnitario) || 0;
    let productoId = dto.productoId;

    if (dto.codbarra && dto.empresaId) {
      const prod = await this.productoRepo.findOne({ where: { codbarra: dto.codbarra, empresaId: dto.empresaId } as any });
      if (prod) {
        productoId = prod.produtoId;
        descripcion = prod.descripcion;
        costoUnitario = Number(prod.cstounit) || 0;
      }
    }

    const cantidad = Number(dto.cantidad) || 0;
    const costoTotal = cantidad * costoUnitario;

    const det = this.detRepo.create({
      invtrasladomaeId: dto.invtrasladomaeId,
      nrofila,
      productoId,
      codbarra: dto.codbarra || '',
      descripcion,
      cantidad,
      costoUnitario,
      costoTotal,
      sn_anulado: 'N',
      empresaId: dto.empresaId,
      usuarioCreated: usuario,
    });
    return this.detRepo.save(det);
  }

  async removeDet(id: number, empresaId: number) {
    const det = await this.detRepo.findOne({ where: { invtrasladodetId: id, empresaId } as any });
    if (!det) throw new BadRequestException('Item no encontrado');
    return this.detRepo.delete({ invtrasladodetId: id, empresaId } as any);
  }

  async procesar(id: number, empresaId: number, usuario: string) {
    const mae = await this.findOneMae(id, empresaId);
    if (mae.sn_procesado === 'S') throw new BadRequestException('El traslado ya fue procesado');
    if (mae.sn_anulado === 'S') throw new BadRequestException('El traslado está anulado');

    const detalles = await this.findDetByMae(id, empresaId);
    if (detalles.length === 0) throw new BadRequestException('El traslado no tiene items');

    const ref = mae.nroreferencia;

    for (const det of detalles) {
      if (det.sn_anulado === 'S') continue;

      await this.kardexService.registrarSalida({
        bodegaId: mae.bodegaOrigenId,
        productoId: det.productoId,
        cantidad: Number(det.cantidad),
        costoUnitario: Number(det.costoUnitario),
        nroreferencia: ref,
        moduloId: 1,
        tipomov: 'S',
        subtipoMov: 'T',
        empresaId,
        usuarioCreated: usuario,
        codbarra: det.codbarra,
      });

      await this.kardexService.registrarEntrada({
        bodegaId: mae.bodegaDestinoId,
        productoId: det.productoId,
        cantidad: Number(det.cantidad),
        costoUnitario: Number(det.costoUnitario),
        nroreferencia: ref,
        moduloId: 1,
        tipomov: 'E',
        subtipoMov: 'T',
        empresaId,
        usuarioCreated: usuario,
        codbarra: det.codbarra,
      });
    }

    mae.sn_procesado = 'S';
    mae.usuarioUpdated = usuario;
    mae.fechaUpdated = new Date();
    await this.maeRepo.save(mae);

    return { message: 'Traslado procesado correctamente' };
  }

  async anular(id: number, empresaId: number, usuario: string) {
    const mae = await this.findOneMae(id, empresaId);
    if (mae.sn_anulado === 'S') throw new BadRequestException('El traslado ya está anulado');
    if (mae.sn_procesado === 'S') throw new BadRequestException('El traslado ya fue procesado, no se puede anular');

    mae.sn_anulado = 'S';
    mae.usuarioUpdated = usuario;
    mae.fechaUpdated = new Date();
    await this.maeRepo.save(mae);

    return { message: 'Traslado anulado' };
  }

  private generarNroReferencia(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    const ms = String(now.getMilliseconds()).padStart(3, '0');
    return `${y}${m}${d}${s}${ms}`;
  }
}

```

---

## 📄 src\modules\modules\dto\modulo.dto.ts

```typescript
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateModuloDto {
  @ApiProperty({ description: 'Nombre del módulo' })
  @IsString() @IsNotEmpty()
  descripcion: string;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdateModuloDto {
  @ApiProperty({ required: false, description: 'Nombre del módulo' })
  @IsString() @IsOptional()
  descripcion?: string;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Estado activo' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;
}

```

---

## 📄 src\modules\modules\entities\modulo.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('tmodulos')
export class Tmodulos {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'moduloId' })
  moduloId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\modules\modulos.controller.ts

```typescript
import {
  Controller, Get, Post, Put, Body, Param, Query,
  UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ModulosService } from './modulos.service';
import { CreateModuloDto, UpdateModuloDto } from './dto/modulo.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Módulos')
@ApiBearerAuth()
@Controller('modulos')
@UseGuards(JwtAuthGuard)
export class ModulosController {
  constructor(private readonly service: ModulosService) {}

  @Get()
  @ApiOperation({ summary: 'Listar módulos' })
  @ApiResponse({ status: 200, description: 'Lista de módulos obtenida exitosamente' })
  findAll(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAll(empresaId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener módulo por ID' })
  @ApiResponse({ status: 200, description: 'Módulo encontrado' })
  @ApiResponse({ status: 404, description: 'Módulo no encontrado' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findOne(id, empresaId);
  }

  @Post()
  @ApiOperation({ summary: 'Crear módulo' })
  @ApiResponse({ status: 201, description: 'Módulo creado exitosamente' })
  create(@Body() dto: CreateModuloDto, @CurrentUser() user: any) {
    return this.service.create(dto, user.usuario);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar módulo' })
  @ApiResponse({ status: 200, description: 'Módulo actualizado exitosamente' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateModuloDto,
    @CurrentUser() user: any,
  ) {
    return this.service.update(id, empresaId, dto, user.usuario);
  }
}

```

---

## 📄 src\modules\modules\modulos.module.ts

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tmodulos } from './entities/modulo.entity';
import { ModulosService } from './modulos.service';
import { ModulosController } from './modulos.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Tmodulos])],
  controllers: [ModulosController],
  providers: [ModulosService],
  exports: [ModulosService],
})
export class ModulosModule {}

```

---

## 📄 src\modules\modules\modulos.service.ts

```typescript
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tmodulos } from './entities/modulo.entity';
import { CreateModuloDto, UpdateModuloDto } from './dto/modulo.dto';

@Injectable()
export class ModulosService {
  constructor(
    @InjectRepository(Tmodulos)
    private readonly repo: Repository<Tmodulos>,
  ) {}

  async findAll(empresaId: number) {
    return this.repo.find({
      where: { empresaId },
      order: { descripcion: 'ASC' },
    });
  }

  async findOne(moduloId: number, empresaId: number) {
    const found = await this.repo.findOne({ where: { moduloId, empresaId } });
    if (!found) throw new NotFoundException(`Módulo ${moduloId} no encontrado`);
    return found;
  }

  async create(dto: CreateModuloDto, currentUser: string) {
    const entity = this.repo.create({
      ...dto,
      usuarioCreated: currentUser,
    });
    return this.repo.save(entity);
  }

  async update(moduloId: number, empresaId: number, dto: UpdateModuloDto, currentUser: string) {
    const entity = await this.findOne(moduloId, empresaId);
    Object.assign(entity, dto, {
      usuarioUpdated: currentUser,
      fechaUpdated: new Date(),
    });
    return this.repo.save(entity);
  }
}

```

---

## 📄 src\modules\parametros\dto\gestor.dto.ts

```typescript
import { IsNumber, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGestorDto {
  @ApiProperty({ description: 'ID del módulo' })
  @IsNumber()
  moduloId: number;

  @ApiProperty({ description: 'ID del empleado' })
  @IsNumber()
  empleadoId: number;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Es vendedor' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_vendedor?: string;
}

export class UpdateGestorDto {
  @ApiProperty({ required: false, description: 'ID del módulo' })
  @IsNumber() @IsOptional()
  moduloId?: number;

  @ApiProperty({ required: false, description: 'ID del empleado' })
  @IsNumber() @IsOptional()
  empleadoId?: number;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Estado activo' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Es vendedor' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_vendedor?: string;
}

```

---

## 📄 src\modules\parametros\dto\impuesto.dto.ts

```typescript
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateImpuestoDto {
  @ApiProperty({ description: 'ID del módulo' })
  @IsNumber()
  moduloId: number;

  @ApiProperty({ description: 'Descripción del impuesto' })
  @IsString() @IsNotEmpty()
  descripcion: string;

  @ApiProperty({ description: 'Porcentaje del impuesto' })
  @IsNumber()
  porcentaje: number;
}

export class UpdateImpuestoDto {
  @ApiProperty({ required: false, description: 'ID del módulo' })
  @IsNumber() @IsOptional()
  moduloId?: number;

  @ApiProperty({ required: false, description: 'Descripción del impuesto' })
  @IsString() @IsOptional()
  descripcion?: string;

  @ApiProperty({ required: false, description: 'Porcentaje del impuesto' })
  @IsNumber() @IsOptional()
  porcentaje?: number;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Estado activo' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;
}

```

---

## 📄 src\modules\parametros\dto\moneda.dto.ts

```typescript
import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMonedaDto {
  @ApiProperty({ description: 'Nombre de la moneda' })
  @IsString() @IsNotEmpty()
  descripcion: string;

  @ApiProperty({ description: 'Símbolo de la moneda' })
  @IsString() @IsNotEmpty()
  simbolo: string;
}

export class UpdateMonedaDto {
  @ApiProperty({ required: false, description: 'Nombre de la moneda' })
  @IsString() @IsOptional()
  descripcion?: string;

  @ApiProperty({ required: false, description: 'Símbolo de la moneda' })
  @IsString() @IsOptional()
  simbolo?: string;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Estado activo' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;
}

```

---

## 📄 src\modules\parametros\dto\param-con.dto.ts

```typescript
import { IsOptional, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateParamConDto {
  @ApiProperty({ required: false, description: 'Número de partida' })
  @IsNumber() @IsOptional()
  nropartida?: number;

  @ApiProperty({ required: false, description: 'Período fiscal' })
  @IsNumber() @IsOptional()
  periodofiscal?: number;

  @ApiProperty({ required: false, description: 'Año fiscal' })
  @IsNumber() @IsOptional()
  aniofiscal?: number;

  @ApiProperty({ required: false, description: 'ID de moneda fiscal' })
  @IsNumber() @IsOptional()
  monedafiscalId?: number;

  @ApiProperty({ required: false, description: 'Máscara de cuenta contable' })
  @IsString() @IsOptional()
  mascaracta?: string;

  @ApiProperty({ required: false, description: 'Nombre del contador' })
  @IsString() @IsOptional()
  nombrecontador?: string;

  @ApiProperty({ required: false, description: 'Nombre del gerente' })
  @IsString() @IsOptional()
  nombregerente?: string;

  @ApiProperty({ required: false, description: 'Nombre del auditor' })
  @IsString() @IsOptional()
  nombreauditor?: string;
}

export class UpdateParamConDto extends CreateParamConDto {}

```

---

## 📄 src\modules\parametros\dto\param-cxc.dto.ts

```typescript
import { IsOptional, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateParamCxcDto {
  @ApiProperty({ required: false, description: 'Correlativo de cliente' })
  @IsNumber() @IsOptional()
  nrocliente?: number;

  @ApiProperty({ required: false, description: 'Tasa de interés' })
  @IsNumber() @IsOptional()
  interes?: number;

  @ApiProperty({ required: false, description: 'Tasa de mora' })
  @IsNumber() @IsOptional()
  mora?: number;

  @ApiProperty({ required: false, description: 'Días de plazo' })
  @IsNumber() @IsOptional()
  diasPlazo?: number;

  @ApiProperty({ required: false, description: 'Límite de crédito' })
  @IsNumber() @IsOptional()
  limitecredito?: number;

  @ApiProperty({ required: false, description: 'Cuenta contable' })
  @IsString() @IsOptional()
  ctacontable?: string;
}

export class UpdateParamCxcDto extends CreateParamCxcDto {}

```

---

## 📄 src\modules\parametros\dto\param-cxp.dto.ts

```typescript
import { IsOptional, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateParamCxpDto {
  @ApiProperty({ required: false, description: 'Correlativo de proveedor' })
  @IsNumber() @IsOptional()
  nroproveedor?: number;

  @ApiProperty({ required: false, description: 'Tasa de interés' })
  @IsNumber() @IsOptional()
  interes?: number;

  @ApiProperty({ required: false, description: 'Tasa de mora' })
  @IsNumber() @IsOptional()
  mora?: number;

  @ApiProperty({ required: false, description: 'Días de plazo' })
  @IsNumber() @IsOptional()
  diasPlazo?: number;

  @ApiProperty({ required: false, description: 'Límite de crédito' })
  @IsNumber() @IsOptional()
  limitecredito?: number;

  @ApiProperty({ required: false, description: 'Cuenta contable' })
  @IsString() @IsOptional()
  ctacontable?: string;
}

export class UpdateParamCxpDto extends CreateParamCxpDto {}

```

---

## 📄 src\modules\parametros\dto\param-fac.dto.ts

```typescript
import { IsOptional, IsNumber, IsEnum, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateParamFacDto {
  @ApiProperty({ required: false, description: 'ID de bodega predeterminada' })
  @IsNumber() @IsOptional()
  bodegaId?: number;

  @ApiProperty({ required: false, description: 'Correlativo de factura' })
  @IsNumber() @IsOptional()
  nrofactura?: number;

  @ApiProperty({ required: false, description: 'Correlativo de cotización' })
  @IsNumber() @IsOptional()
  nrocotizacion?: number;

  @ApiProperty({ required: false, description: 'Correlativo de anulación' })
  @IsNumber() @IsOptional()
  nroanulacion?: number;

  @ApiProperty({ required: false, description: 'ID de impuesto' })
  @IsNumber() @IsOptional()
  impuestoId?: number;

  @ApiProperty({ required: false, description: 'ID de caja' })
  @IsNumber() @IsOptional()
  cajaId?: number;

  @ApiProperty({ required: false, description: 'Líneas por factura' })
  @IsNumber() @IsOptional()
  lineasFactura?: number;

  @ApiProperty({ required: false, description: 'Días para devolución' })
  @IsNumber() @IsOptional()
  diasDevolucion?: number;

  @ApiProperty({ required: false, description: 'Porcentaje máximo de devolución' })
  @IsNumber() @IsOptional()
  porcentajeDevolucion?: number;

  @ApiProperty({ required: false, description: 'Correlativo PDA ventas' })
  @IsNumber() @IsOptional()
  nrodpdaventas?: number;

  @ApiProperty({ required: false, description: 'Correlativo PDA devolución' })
  @IsNumber() @IsOptional()
  nropdadevolucion?: number;

  @ApiProperty({ required: false, description: 'Correlativo PDA anulación' })
  @IsNumber() @IsOptional()
  nropdaanulacion?: number;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Integrado con CxC' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_integrado_cxc?: string;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Punto de venta activo' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_puntoventa?: string;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Integrado con caja' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_integrado_caja?: string;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Anticipos activos' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_anticipos?: string;

  @ApiProperty({ required: false, description: 'Mensaje de factura' })
  @IsString() @IsOptional()
  mensajeFactura?: string;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Correlativo único' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_correlativoUnico?: string;

  @ApiProperty({ required: false, description: 'Margen superior (mm)' })
  @IsNumber() @IsOptional()
  mg_t?: number;

  @ApiProperty({ required: false, description: 'Margen inferior (mm)' })
  @IsNumber() @IsOptional()
  mg_b?: number;

  @ApiProperty({ required: false, description: 'Margen izquierdo (mm)' })
  @IsNumber() @IsOptional()
  mg_l?: number;

  @ApiProperty({ required: false, description: 'Margen derecho (mm)' })
  @IsNumber() @IsOptional()
  mg_d?: number;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Múltiples cajeros' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_multiplezcajeros?: string;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Imprime factura' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_imprimefactura?: string;

  @ApiProperty({ required: false, description: 'Impresora de factura' })
  @IsString() @IsOptional()
  ImpresoraFactura?: string;

  @ApiProperty({ required: false, description: 'Impresora de comprobante' })
  @IsString() @IsOptional()
  ImpresoraComprobante?: string;

  @ApiProperty({ required: false, description: 'Impresora de madera' })
  @IsString() @IsOptional()
  ImpresoraMadera?: string;

  @ApiProperty({ required: false, description: 'Impresora de recibo' })
  @IsString() @IsOptional()
  ImpresoraRecibo?: string;

  @ApiProperty({ required: false, description: 'Driver impresora 1' })
  @IsString() @IsOptional()
  DriverImpresora1?: string;

  @ApiProperty({ required: false, description: 'Driver impresora 2' })
  @IsString() @IsOptional()
  DriverImpresora2?: string;

  @ApiProperty({ required: false, description: 'Driver impresora 3' })
  @IsString() @IsOptional()
  DriverImpresora3?: string;

  @ApiProperty({ required: false, description: 'Driver impresora 4' })
  @IsString() @IsOptional()
  DriverImpresora4?: string;

  @ApiProperty({ required: false, description: 'Puerto impresora 1' })
  @IsString() @IsOptional()
  Puerto1?: string;

  @ApiProperty({ required: false, description: 'Puerto impresora 2' })
  @IsString() @IsOptional()
  Puerto2?: string;

  @ApiProperty({ required: false, description: 'Puerto impresora 3' })
  @IsString() @IsOptional()
  Puerto3?: string;

  @ApiProperty({ required: false, description: 'Puerto impresora 4' })
  @IsString() @IsOptional()
  Puerto4?: string;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Múltiples empresas' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_multipleempresa?: string;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Impuesto incluido' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_impuestoincluido?: string;
}

export class UpdateParamFacDto extends CreateParamFacDto {}

```

---

## 📄 src\modules\parametros\dto\param-inv.dto.ts

```typescript
import { IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateParamInvDto {
  @ApiProperty({ required: false, description: 'ID de bodega predeterminada' })
  @IsNumber() @IsOptional()
  bodegaId?: number;

  @ApiProperty({ required: false, description: 'Correlativo de compra' })
  @IsNumber() @IsOptional()
  nrocompra?: number;

  @ApiProperty({ required: false, description: 'Correlativo de traslado' })
  @IsNumber() @IsOptional()
  nrotrasladoo?: number;

  @ApiProperty({ required: false, description: 'Correlativo de ajuste' })
  @IsNumber() @IsOptional()
  nroajuste?: number;

  @ApiProperty({ required: false, description: 'Correlativo físico' })
  @IsNumber() @IsOptional()
  nrofisico?: number;

  @ApiProperty({ required: false, description: 'Correlativo de requisición' })
  @IsNumber() @IsOptional()
  nrorequisicion?: number;

 @ApiProperty({ required: false, description: 'ID de impuesto de compra' })
  @IsNumber() @IsOptional()
  impuestocompraId?: number;


  @ApiProperty({ required: false, description: 'ID de precio de venta' })
  @IsNumber() @IsOptional()
  preciovtaId?: number;

  @ApiProperty({ required: false, description: 'ID de impuesto de venta' })
  @IsNumber() @IsOptional()
  impuestoventaId?: number;

  @ApiProperty({ required: false, description: 'Número de partida' })
  @IsNumber() @IsOptional()
  nropartida?: number;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Requiere lote' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_requirelote?: string;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Modo supermercado' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_supermercado?: string;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Múltiples precios' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_multiplesprecios?: string;
}

export class UpdateParamInvDto extends CreateParamInvDto {}

```

---

## 📄 src\modules\parametros\dto\param-pla.dto.ts

```typescript
import { IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateParamPlaDto {
  @ApiProperty({ required: false, description: 'Número de partida' })
  @IsNumber() @IsOptional()
  nropartida?: number;

  @ApiProperty({ required: false, description: 'Número de planilla' })
  @IsNumber() @IsOptional()
  nroplanilla?: number;

  @ApiProperty({ required: false, description: 'Techo salarial' })
  @IsNumber() @IsOptional()
  techo?: number;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Validar techo' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_validatecho?: string;

  @ApiProperty({ required: false, description: 'Días laborales' })
  @IsNumber() @IsOptional()
  diaslaborales?: number;
}

export class UpdateParamPlaDto extends CreateParamPlaDto {}

```

---

## 📄 src\modules\parametros\dto\param-pres.dto.ts

```typescript
import { IsOptional, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateParamPresDto {
  @ApiProperty({ required: false, description: 'Tasa de interés' })
  @IsNumber() @IsOptional()
  interes?: number;

  @ApiProperty({ required: false, description: 'Tasa de mora' })
  @IsNumber() @IsOptional()
  mora?: number;

  @ApiProperty({ required: false, description: 'Días de plazo' })
  @IsNumber() @IsOptional()
  diasPlazo?: number;

  @ApiProperty({ required: false, description: 'Límite de crédito' })
  @IsNumber() @IsOptional()
  limitecredito?: number;

  @ApiProperty({ required: false, description: 'Cuenta contable' })
  @IsString() @IsOptional()
  ctacontable?: string;
}

export class UpdateParamPresDto extends CreateParamPresDto {}

```

---

## 📄 src\modules\parametros\dto\simple-param.dto.ts

```typescript
import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSimpleParamDto {
  @ApiProperty({ description: 'Descripción del parámetro' })
  @IsString() @IsNotEmpty()
  descripcion: string;
}

export class UpdateSimpleParamDto {
  @ApiProperty({ required: false, description: 'Descripción del parámetro' })
  @IsString() @IsOptional()
  descripcion?: string;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Estado activo' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;
}

```

---

## 📄 src\modules\parametros\entities\depto-empresa.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('ttipodeptoempresa')
export class TtipoDeptoEmpresa {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'departamentostempresasId' })
  departamentostempresasId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  cuentacontableId: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\parametros\entities\depto-pais.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('ttipodeptopais')
export class TtipoDeptoPais {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'ttipodeptopaisId' })
  ttipodeptopaisId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\parametros\entities\direccion.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('ttipodirecciones')
export class TtipoDireccion {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'direccionId' })
  direccionId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\parametros\entities\estado.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('ttipoestado')
export class TtipoEstado {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'estadoId' })
  estadoId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\parametros\entities\forma-pago.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('ttipoformapago')
export class TtipoFormaPago {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'formapagoId' })
  formapagoId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\parametros\entities\gestor.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('ttipogestores')
export class TtipoGestor {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'gestorId' })
  gestorId: number;

  @ApiProperty()
  @Column({ type: 'int' })
  moduloId: number;

  @ApiProperty()
  @Column({ type: 'int' })
  empleadoId: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_vendedor: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  usuarioId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\parametros\entities\impuesto.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('ttipoimpuestos')
export class TtipoImpuesto {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'impuestoId' })
  impuestoId: number;

  @ApiProperty()
  @Column({ type: 'int' })
  moduloId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  porcentaje: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\parametros\entities\moneda.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('ttipomonedas')
export class TtipoMoneda {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'monedaId' })
  monedaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'char', length: 1 })
  simbolo: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\parametros\entities\pais.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('ttipopais')
export class TtipoPais {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'paisId' })
  paisId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\parametros\entities\param-bco.entity.ts

```typescript
import {
  Entity, PrimaryColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('ttipoparambco')
export class TtipoParamBco {
  @ApiProperty()
  @PrimaryColumn({ name: 'empresaId' })
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\parametros\entities\param-con.entity.ts

```typescript
import {
  Entity, PrimaryColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('ttipoparamcon')
export class TtipoParamCon {
  @ApiProperty()
  @PrimaryColumn({ name: 'empresaId' })
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'int', default: 0 })
  nropartida: number;

  @ApiProperty()
  @Column({ type: 'int', default: 0 })
  periodofiscal: number;

  @ApiProperty()
  @Column({ type: 'int', default: 0 })
  aniofiscal: number;

  @ApiProperty()
  @Column({ type: 'int', default: 0 })
  monedafiscalId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  mascaracta: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 50, nullable: true })
  nombrecontador: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 50, nullable: true })
  nombregerente: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 50, nullable: true })
  nombreauditor: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\parametros\entities\param-cxc.entity.ts

```typescript
import {
  Entity, PrimaryColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('ttipoparamcxc')
export class TtipoParamCxc {
  @ApiProperty()
  @PrimaryColumn({ name: 'empresaId' })
  empresaId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  nrocliente: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  interes: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  mora: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  diasPlazo: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  limitecredito: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  ctacontable: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\parametros\entities\param-cxp.entity.ts

```typescript
import {
  Entity, PrimaryColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('ttipoparamcxp')
export class TtipoParamCxp {
  @ApiProperty()
  @PrimaryColumn({ name: 'empresaId' })
  empresaId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  nroproveedor: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  interes: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  mora: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  diasPlazo: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  limitecredito: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  ctacontable: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\parametros\entities\param-fac.entity.ts

```typescript
import {
  Entity, PrimaryColumn, Column, ManyToOne, JoinColumn
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Cxccajero } from '../../cxc/entities/cxccajero.entity';

@Entity('ttipoparamfac')
export class TtipoParamFac {
  @ApiProperty()
  @PrimaryColumn({ name: 'empresaId' })
  empresaId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  bodegaId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  nrofactura: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  nrocotizacion: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  nroanulacion: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  impuestoId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  cajaId: number;

  @ApiProperty({ type: () => Cxccajero, required: false })
  @ManyToOne(() => Cxccajero)
  @JoinColumn({ name: 'cajaId' })
  cajero: Cxccajero;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  lineasFactura: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  diasDevolucion: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  porcentajeDevolucion: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  nrodpdaventas: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  nropdadevolucion: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  nropdaanulacion: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_integrado_cxc: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_puntoventa: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_integrado_caja: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_anticipos: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 50, nullable: true })
  mensajeFactura: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_correlativoUnico: string;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0, name: 'mg-t' })
  mg_t: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0, name: 'mg-b' })
  mg_b: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0, name: 'mg-l' })
  mg_l: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0, name: 'mg-d' })
  mg_d: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_multiplezcajeros: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_imprimefactura: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  ImpresoraFactura: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  ImpresoraComprobante: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  ImpresoraMadera: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  ImpresoraRecibo: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  DriverImpresora1: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  DriverImpresora2: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  DriverImpresora3: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  DriverImpresora4: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 6, nullable: true })
  Puerto1: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 6, nullable: true })
  Puerto2: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 6, nullable: true })
  Puerto3: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 6, nullable: true })
  Puerto4: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_multipleempresa: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_impuestoincluido: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\parametros\entities\param-inv.entity.ts

```typescript
import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { TtipoImpuesto } from "./impuesto.entity";
import { TPosPrecioVtas } from "@/modules/facturacion/entities/tpospreciovtas.entity";

@Entity("ttipoparaminv")
export class TtipoParamInv {
  @ApiProperty()
  @PrimaryColumn({ name: "empresaId" })
  empresaId: number;

  @ApiProperty({ required: false })
  @Column({ type: "int", nullable: true })
  bodegaId: number;

  @ApiProperty({ required: false })
  @Column({ type: "int", nullable: true })
  nrocompra: number;

  @ApiProperty({ required: false })
  @Column({ type: "int", nullable: true })
  nrotrasladoo: number;

  @ApiProperty({ required: false })
  @Column({ type: "int", nullable: true })
  nroajuste: number;

  @ApiProperty({ required: false })
  @Column({ type: "int", nullable: true })
  nrofisico: number;

  @ApiProperty({ required: false })
  @Column({ type: "int", nullable: true })
  nrorequisicion: number;

  @ApiProperty({ required: false })
  @Column({ type: "int", nullable: true })
  impuestocompraId: number;

  @ApiProperty({ type: () => TPosPrecioVtas, required: false })
  @ManyToOne(() => TPosPrecioVtas)
  @JoinColumn({ name: "preciovtaId" })
  preciovtaId: number;

  @ApiProperty({ type: () => TtipoImpuesto, required: false })
  @ManyToOne(() => TtipoImpuesto)
  impuestoCompra: TtipoImpuesto;

  @ApiProperty({ required: false })
  @Column({ type: "int", nullable: true })
  impuestoventaId: number;

  @ApiProperty({ type: () => TtipoImpuesto, required: false })
  @ManyToOne(() => TtipoImpuesto)
  @JoinColumn({ name: "impuestoventaId" })
  impuestoVenta: TtipoImpuesto;

  @ApiProperty()
  @Column({ type: "decimal", precision: 20, scale: 2, default: 0 })
  nropartida: number;

  @ApiProperty()
  @Column({ type: "enum", enum: ["S", "N"], default: "N" })
  sn_requirelote: string;

  @ApiProperty()
  @Column({ type: "enum", enum: ["S", "N"], default: "N" })
  sn_supermercado: string;

  @ApiProperty()
  @Column({ type: "enum", enum: ["S", "N"], default: "N" })
  sn_multiplesprecios: string;

  @ApiProperty()
  @Column({ type: "varchar", length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: "varchar", length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: "datetime", nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\parametros\entities\param-pap.entity.ts

```typescript
import {
  Entity, PrimaryColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('ttipoparampap')
export class TtipoParamPap {
  @ApiProperty()
  @PrimaryColumn({ name: 'empresaId' })
  empresaId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  moduloId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 150, nullable: true })
  proforma: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 150, nullable: true })
  reporte: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\parametros\entities\param-pla.entity.ts

```typescript
import {
  Entity, PrimaryColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('ttipoparampla')
export class TtipoParamPla {
  @ApiProperty()
  @PrimaryColumn({ name: 'empresaId' })
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  nropartida: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  nroplanilla: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  techo: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_validatecho: string;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  diaslaborales: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\parametros\entities\param-pres.entity.ts

```typescript
import {
  Entity, PrimaryColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('ttipoparampres')
export class TtipoParamPres {
  @ApiProperty()
  @PrimaryColumn({ name: 'empresaId' })
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  interes: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  mora: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  diasPlazo: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  limitecredito: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  ctacontable: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\parametros\entities\pasatiempo.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('ttipopasatiempos')
export class TtipoPasatiempo {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'pasatiempoId' })
  pasatiempoId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\parametros\entities\proforma.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('ttipoproforma')
export class TtipoProforma {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'proformaId' })
  proformaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 10 })
  Alto: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 10 })
  bajo: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 10 })
  izquierda: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 10 })
  derecho: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\parametros\entities\tarjeta-credito.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('ttipotarjetacredito')
export class TtipoTarjetaCredito {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'tarjetacreditoId' })
  tarjetacreditoId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\parametros\entities\telefono.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('ttipotelefono')
export class TtipoTelefono {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'telefonoId' })
  telefonoId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\parametros\entities\zona-vta-cob.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('ttipozonasvtacob')
export class TtipoZonaVtaCob {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'ttipozonasvtacobId' })
  ttipozonasvtacobId: number;

  @ApiProperty()
  @Column({ type: 'int' })
  tzonadId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  gestorId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\parametros\entities\zona.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('ttipozonas')
export class TtipoZona {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'tzonadId' })
  tzonadId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\parametros\parametros.controller.ts

```typescript
import {
  Controller, Get, Post, Put, Body, Param, Query,
  UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ParametrosService } from './parametros.service';
import { CreateSimpleParamDto, UpdateSimpleParamDto } from './dto/simple-param.dto';
import { CreateMonedaDto, UpdateMonedaDto } from './dto/moneda.dto';
import { CreateGestorDto, UpdateGestorDto } from './dto/gestor.dto';
import { CreateImpuestoDto, UpdateImpuestoDto } from './dto/impuesto.dto';
import { CreateParamFacDto, UpdateParamFacDto } from './dto/param-fac.dto';
import { CreateParamInvDto, UpdateParamInvDto } from './dto/param-inv.dto';
import { CreateParamConDto, UpdateParamConDto } from './dto/param-con.dto';
import { CreateParamCxcDto, UpdateParamCxcDto } from './dto/param-cxc.dto';
import { CreateParamCxpDto, UpdateParamCxpDto } from './dto/param-cxp.dto';
import { CreateParamPlaDto, UpdateParamPlaDto } from './dto/param-pla.dto';
import { CreateParamPresDto, UpdateParamPresDto } from './dto/param-pres.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Parámetros')
@ApiBearerAuth()
@Controller('parametros')
@UseGuards(JwtAuthGuard)
export class ParametrosController {
  @Get('tcotipodocumentofiscal')
  @ApiOperation({ summary: 'Listar tipos de documento fiscal' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllTiposDocFiscal(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllTiposDocFiscal(empresaId);
  }

  constructor(private readonly service: ParametrosService) {}

  @Get('monedas')
  @ApiOperation({ summary: 'Listar monedas' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllMonedas(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllMonedas(empresaId);
  }

  @Get('monedas/:id')
  @ApiOperation({ summary: 'Obtener moneda' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findMoneda(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findMoneda(id, empresaId);
  }

  @Post('monedas')
  @ApiOperation({ summary: 'Crear moneda' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createMoneda(@Body() dto: CreateMonedaDto, @CurrentUser() user: any) {
    return this.service.createMoneda(dto, user.usuario);
  }

  @Put('monedas/:id')
  @ApiOperation({ summary: 'Actualizar moneda' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updateMoneda(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateMonedaDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateMoneda(id, empresaId, dto, user.usuario);
  }

  @Get('paises')
  @ApiOperation({ summary: 'Listar países' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllPaises(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllPaises(empresaId);
  }

  @Get('paises/:id')
  @ApiOperation({ summary: 'Obtener país' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findPais(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findPais(id, empresaId);
  }

  @Post('paises')
  @ApiOperation({ summary: 'Crear país' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createPais(@Body() dto: CreateSimpleParamDto, @CurrentUser() user: any) {
    return this.service.createPais(dto, user.usuario);
  }

  @Put('paises/:id')
  @ApiOperation({ summary: 'Actualizar país' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updatePais(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateSimpleParamDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updatePais(id, empresaId, dto, user.usuario);
  }

  @Get('departamentos-pais')
  @ApiOperation({ summary: 'Listar departamentos por país' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllDeptoPais(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllDeptoPais(empresaId);
  }

  @Get('departamentos-pais/:id')
  @ApiOperation({ summary: 'Obtener departamento' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findDeptoPais(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findDeptoPais(id, empresaId);
  }

  @Post('departamentos-pais')
  @ApiOperation({ summary: 'Crear departamento' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createDeptoPais(@Body() dto: CreateSimpleParamDto, @CurrentUser() user: any) {
    return this.service.createDeptoPais(dto, user.usuario);
  }

  @Put('departamentos-pais/:id')
  @ApiOperation({ summary: 'Actualizar departamento' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updateDeptoPais(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateSimpleParamDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateDeptoPais(id, empresaId, dto, user.usuario);
  }

  @Get('departamentos-empresa')
  @ApiOperation({ summary: 'Listar departamentos de empresa' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllDeptoEmpresa(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllDeptoEmpresa(empresaId);
  }

  @Get('departamentos-empresa/:id')
  @ApiOperation({ summary: 'Obtener departamento de empresa' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findDeptoEmpresa(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findDeptoEmpresa(id, empresaId);
  }

  @Post('departamentos-empresa')
  @ApiOperation({ summary: 'Crear departamento de empresa' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createDeptoEmpresa(@Body() dto: CreateSimpleParamDto, @CurrentUser() user: any) {
    return this.service.createDeptoEmpresa(dto, user.usuario);
  }

  @Put('departamentos-empresa/:id')
  @ApiOperation({ summary: 'Actualizar departamento de empresa' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updateDeptoEmpresa(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateSimpleParamDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateDeptoEmpresa(id, empresaId, dto, user.usuario);
  }

  @Get('direcciones')
  @ApiOperation({ summary: 'Listar tipos de dirección' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllDirecciones(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllDirecciones(empresaId);
  }

  @Get('direcciones/:id')
  @ApiOperation({ summary: 'Obtener tipo de dirección' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findDireccion(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findDireccion(id, empresaId);
  }

  @Post('direcciones')
  @ApiOperation({ summary: 'Crear tipo de dirección' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createDireccion(@Body() dto: CreateSimpleParamDto, @CurrentUser() user: any) {
    return this.service.createDireccion(dto, user.usuario);
  }

  @Put('direcciones/:id')
  @ApiOperation({ summary: 'Actualizar tipo de dirección' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updateDireccion(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateSimpleParamDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateDireccion(id, empresaId, dto, user.usuario);
  }

  @Get('estados')
  @ApiOperation({ summary: 'Listar estados' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllEstados(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllEstados(empresaId);
  }

  @Get('estados/:id')
  @ApiOperation({ summary: 'Obtener estado' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findEstado(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findEstado(id, empresaId);
  }

  @Post('estados')
  @ApiOperation({ summary: 'Crear estado' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createEstado(@Body() dto: CreateSimpleParamDto, @CurrentUser() user: any) {
    return this.service.createEstado(dto, user.usuario);
  }

  @Put('estados/:id')
  @ApiOperation({ summary: 'Actualizar estado' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updateEstado(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateSimpleParamDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateEstado(id, empresaId, dto, user.usuario);
  }

  @Get('formas-pago')
  @ApiOperation({ summary: 'Listar formas de pago' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllFormasPago(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllFormasPago(empresaId);
  }

  @Get('formas-pago/:id')
  @ApiOperation({ summary: 'Obtener forma de pago' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findFormaPago(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findFormaPago(id, empresaId);
  }

  @Post('formas-pago')
  @ApiOperation({ summary: 'Crear forma de pago' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createFormaPago(@Body() dto: CreateSimpleParamDto, @CurrentUser() user: any) {
    return this.service.createFormaPago(dto, user.usuario);
  }

  @Put('formas-pago/:id')
  @ApiOperation({ summary: 'Actualizar forma de pago' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updateFormaPago(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateSimpleParamDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateFormaPago(id, empresaId, dto, user.usuario);
  }

  @Get('telefonos')
  @ApiOperation({ summary: 'Listar tipos de teléfono' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllTelefonos(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllTelefonos(empresaId);
  }

  @Get('telefonos/:id')
  @ApiOperation({ summary: 'Obtener tipo de teléfono' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findTelefono(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findTelefono(id, empresaId);
  }

  @Post('telefonos')
  @ApiOperation({ summary: 'Crear tipo de teléfono' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createTelefono(@Body() dto: CreateSimpleParamDto, @CurrentUser() user: any) {
    return this.service.createTelefono(dto, user.usuario);
  }

  @Put('telefonos/:id')
  @ApiOperation({ summary: 'Actualizar tipo de teléfono' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updateTelefono(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateSimpleParamDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateTelefono(id, empresaId, dto, user.usuario);
  }

  @Get('tarjetas-credito')
  @ApiOperation({ summary: 'Listar tarjetas de crédito' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllTarjetasCredito(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllTarjetasCredito(empresaId);
  }

  @Get('tarjetas-credito/:id')
  @ApiOperation({ summary: 'Obtener tarjeta de crédito' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findTarjetaCredito(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findTarjetaCredito(id, empresaId);
  }

  @Post('tarjetas-credito')
  @ApiOperation({ summary: 'Crear tarjeta de crédito' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createTarjetaCredito(@Body() dto: CreateSimpleParamDto, @CurrentUser() user: any) {
    return this.service.createTarjetaCredito(dto, user.usuario);
  }

  @Put('tarjetas-credito/:id')
  @ApiOperation({ summary: 'Actualizar tarjeta de crédito' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updateTarjetaCredito(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateSimpleParamDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateTarjetaCredito(id, empresaId, dto, user.usuario);
  }

  @Get('pasatiempos')
  @ApiOperation({ summary: 'Listar pasatiempos' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllPasatiempos() {
    return this.service.findAllPasatiempos();
  }

  @Get('pasatiempos/:id')
  @ApiOperation({ summary: 'Obtener pasatiempo' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findPasatiempo(@Param('id', ParseIntPipe) id: number) {
    return this.service.findPasatiempo(id);
  }

  @Post('pasatiempos')
  @ApiOperation({ summary: 'Crear pasatiempo' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createPasatiempo(@Body() dto: CreateSimpleParamDto, @CurrentUser() user: any) {
    return this.service.createPasatiempo(dto, user.usuario);
  }

  @Put('pasatiempos/:id')
  @ApiOperation({ summary: 'Actualizar pasatiempo' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updatePasatiempo(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSimpleParamDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updatePasatiempo(id, dto, user.usuario);
  }

  @Get('zonas')
  @ApiOperation({ summary: 'Listar zonas' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllZonas(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllZonas(empresaId);
  }

  @Get('zonas/:id')
  @ApiOperation({ summary: 'Obtener zona' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findZona(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findZona(id, empresaId);
  }

  @Post('zonas')
  @ApiOperation({ summary: 'Crear zona' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createZona(@Body() dto: CreateSimpleParamDto, @CurrentUser() user: any) {
    return this.service.createZona(dto, user.usuario);
  }

  @Put('zonas/:id')
  @ApiOperation({ summary: 'Actualizar zona' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updateZona(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateSimpleParamDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateZona(id, empresaId, dto, user.usuario);
  }

  @Get('gestores')
  @ApiOperation({ summary: 'Listar gestores de cobro' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllGestores(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllGestores(empresaId);
  }

  @Get('gestores/:id')
  @ApiOperation({ summary: 'Obtener gestor' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findGestor(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findGestor(id, empresaId);
  }

  @Post('gestores')
  @ApiOperation({ summary: 'Crear gestor' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createGestor(@Body() dto: CreateGestorDto, @CurrentUser() user: any) {
    return this.service.createGestor(dto, user.usuario);
  }

  @Put('gestores/:id')
  @ApiOperation({ summary: 'Actualizar gestor' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updateGestor(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateGestorDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateGestor(id, empresaId, dto, user.usuario);
  }

  @Get('impuestos')
  @ApiOperation({ summary: 'Listar impuestos' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllImpuestos(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllImpuestos(empresaId);
  }

  @Get('impuestos/:id')
  @ApiOperation({ summary: 'Obtener impuesto' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findImpuesto(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findImpuesto(id, empresaId);
  }

  @Post('impuestos')
  @ApiOperation({ summary: 'Crear impuesto' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createImpuesto(@Body() dto: CreateImpuestoDto, @CurrentUser() user: any) {
    return this.service.createImpuesto(dto, user.usuario);
  }

  @Put('impuestos/:id')
  @ApiOperation({ summary: 'Actualizar impuesto' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updateImpuesto(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateImpuestoDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateImpuesto(id, empresaId, dto, user.usuario);
  }

  @Get('proformas')
  @ApiOperation({ summary: 'Listar proformas' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllProformas(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllProformas(empresaId);
  }

  @Get('proformas/:id')
  @ApiOperation({ summary: 'Obtener proforma' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findProforma(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findProforma(id, empresaId);
  }

  @Post('proformas')
  @ApiOperation({ summary: 'Crear proforma' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createProforma(@Body() dto: CreateSimpleParamDto, @CurrentUser() user: any) {
    return this.service.createProforma(dto, user.usuario);
  }

  @Put('proformas/:id')
  @ApiOperation({ summary: 'Actualizar proforma' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updateProforma(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateSimpleParamDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateProforma(id, empresaId, dto, user.usuario);
  }

  @Get('zonas-vta-cob')
  @ApiOperation({ summary: 'Listar zonas venta/cobro' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllZonasVtaCob(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllZonasVtaCob(empresaId);
  }

  @Get('zonas-vta-cob/:id')
  @ApiOperation({ summary: 'Obtener zona venta/cobro' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findZonaVtaCob(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findZonaVtaCob(id, empresaId);
  }

  @Post('zonas-vta-cob')
  @ApiOperation({ summary: 'Crear zona venta/cobro' })
  @ApiResponse({ status: 201, description: 'Creado' })
  createZonaVtaCob(@Body() dto: CreateSimpleParamDto, @CurrentUser() user: any) {
    return this.service.createZonaVtaCob(dto, user.usuario);
  }

  @Put('zonas-vta-cob/:id')
  @ApiOperation({ summary: 'Actualizar zona venta/cobro' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  updateZonaVtaCob(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateSimpleParamDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateZonaVtaCob(id, empresaId, dto, user.usuario);
  }

  @Get('param-bco')
  @ApiOperation({ summary: 'Obtener parámetros bancarios' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findParamBco(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findParamBco(empresaId);
  }

  @Put('param-bco')
  @ApiOperation({ summary: 'Guardar parámetros bancarios' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  upsertParamBco(
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.upsertParamBco(empresaId, dto, user.usuario);
  }

  @Get('param-con')
  @ApiOperation({ summary: 'Obtener parámetros de contabilidad' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findParamCon(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findParamCon(empresaId);
  }

  @Put('param-con')
  @ApiOperation({ summary: 'Guardar parámetros de contabilidad' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  upsertParamCon(
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateParamConDto,
    @CurrentUser() user: any,
  ) {
    return this.service.upsertParamCon(empresaId, dto, user.usuario);
  }

  @Get('param-cxc')
  @ApiOperation({ summary: 'Obtener parámetros de CxC' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findParamCxc(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findParamCxc(empresaId);
  }

  @Put('param-cxc')
  @ApiOperation({ summary: 'Guardar parámetros de CxC' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  upsertParamCxc(
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateParamCxcDto,
    @CurrentUser() user: any,
  ) {
    return this.service.upsertParamCxc(empresaId, dto, user.usuario);
  }

  @Get('param-cxp')
  @ApiOperation({ summary: 'Obtener parámetros de CxP' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findParamCxp(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findParamCxp(empresaId);
  }

  @Put('param-cxp')
  @ApiOperation({ summary: 'Guardar parámetros de CxP' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  upsertParamCxp(
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateParamCxpDto,
    @CurrentUser() user: any,
  ) {
    return this.service.upsertParamCxp(empresaId, dto, user.usuario);
  }

  @Get('param-fac')
  @ApiOperation({ summary: 'Obtener parámetros de facturación' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findParamFac(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findParamFac(empresaId);
  }

  @Put('param-fac')
  @ApiOperation({ summary: 'Guardar parámetros de facturación' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  upsertParamFac(
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateParamFacDto,
    @CurrentUser() user: any,
  ) {
    return this.service.upsertParamFac(empresaId, dto, user.usuario);
  }

  @Get('param-inv')
  @ApiOperation({ summary: 'Obtener parámetros de inventario' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findParamInv(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findParamInv(empresaId);
  }

  @Put('param-inv')
  @ApiOperation({ summary: 'Guardar parámetros de inventario' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  upsertParamInv(
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateParamInvDto,
    @CurrentUser() user: any,
  ) {
    return this.service.upsertParamInv(empresaId, dto, user.usuario);
  }

  @Get('param-pap')
  @ApiOperation({ summary: 'Obtener parámetros de papelería' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findParamPap(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findParamPap(empresaId);
  }

  @Put('param-pap')
  @ApiOperation({ summary: 'Guardar parámetros de papelería' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  upsertParamPap(
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.upsertParamPap(empresaId, dto, user.usuario);
  }

  @Get('param-pla')
  @ApiOperation({ summary: 'Obtener parámetros de planilla' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findParamPla(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findParamPla(empresaId);
  }

  @Put('param-pla')
  @ApiOperation({ summary: 'Guardar parámetros de planilla' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  upsertParamPla(
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateParamPlaDto,
    @CurrentUser() user: any,
  ) {
    return this.service.upsertParamPla(empresaId, dto, user.usuario);
  }

  @Get('param-pres')
  @ApiOperation({ summary: 'Obtener parámetros de presupuesto' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findParamPres(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findParamPres(empresaId);
  }

  @Put('param-pres')
  @ApiOperation({ summary: 'Guardar parámetros de presupuesto' })
  @ApiResponse({ status: 200, description: 'Actualizado' })
  upsertParamPres(
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateParamPresDto,
    @CurrentUser() user: any,
  ) {
    return this.service.upsertParamPres(empresaId, dto, user.usuario);
  }

  @Get('precios-vta')
  @ApiOperation({ summary: 'Listar precios de venta' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findAllPreciosVta(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllPreciosVta(empresaId);
  }

  @Get('precios-vta/:id')
  @ApiOperation({ summary: 'Obtener precio de venta por ID' })
  @ApiResponse({ status: 200, description: 'Exitoso' })
  findPreciosVta(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findPreciosVta(id, empresaId);
  }
}

```

---

## 📄 src\modules\parametros\parametros.module.ts

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TtipoMoneda } from './entities/moneda.entity';
import { TtipoPais } from './entities/pais.entity';
import { TtipoDeptoPais } from './entities/depto-pais.entity';
import { TtipoDeptoEmpresa } from './entities/depto-empresa.entity';
import { TtipoDireccion } from './entities/direccion.entity';
import { TtipoEstado } from './entities/estado.entity';
import { TtipoFormaPago } from './entities/forma-pago.entity';
import { TtipoTelefono } from './entities/telefono.entity';
import { TtipoTarjetaCredito } from './entities/tarjeta-credito.entity';
import { TtipoPasatiempo } from './entities/pasatiempo.entity';
import { TtipoZona } from './entities/zona.entity';
import { TtipoGestor } from './entities/gestor.entity';
import { TtipoImpuesto } from './entities/impuesto.entity';
import { TtipoProforma } from './entities/proforma.entity';
import { TtipoZonaVtaCob } from './entities/zona-vta-cob.entity';
import { TtipoParamBco } from './entities/param-bco.entity';
import { TtipoParamCon } from './entities/param-con.entity';
import { TtipoParamCxc } from './entities/param-cxc.entity';
import { TtipoParamCxp } from './entities/param-cxp.entity';
import { TtipoParamFac } from './entities/param-fac.entity';
import { TtipoParamInv } from './entities/param-inv.entity';
import { TtipoParamPap } from './entities/param-pap.entity';
import { TtipoParamPla } from './entities/param-pla.entity';
import { TtipoParamPres } from './entities/param-pres.entity';
import { TCoTipoDocumentoFiscal } from '../contabilidad/entities/tcotipodocumentofiscal.entity';
import { PlPlEmpleados } from '../planilla/entities/plplempleados.entity';
import { TPosPrecioVtas } from '../facturacion/entities/tpospreciovtas.entity';
import { ParametrosService } from './parametros.service';
import { ParametrosController } from './parametros.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TtipoMoneda,
      TtipoPais,
      TtipoDeptoPais,
      TtipoDeptoEmpresa,
      TtipoDireccion,
      TtipoEstado,
      TtipoFormaPago,
      TtipoTelefono,
      TtipoTarjetaCredito,
      TtipoPasatiempo,
      TtipoZona,
      TtipoGestor,
      TtipoImpuesto,
      TtipoProforma,
      TtipoZonaVtaCob,
      TtipoParamBco,
      TtipoParamCon,
      TtipoParamCxc,
      TtipoParamCxp,
      TtipoParamFac,
      TtipoParamInv,
      TtipoParamPap,
      TtipoParamPla,
      TtipoParamPres,
      TCoTipoDocumentoFiscal,
      PlPlEmpleados,
      TPosPrecioVtas,
    ]),
  ],
  controllers: [ParametrosController],
  providers: [ParametrosService],
  exports: [ParametrosService],
})
export class ParametrosModule {}

```

---

## 📄 src\modules\parametros\parametros.service.ts

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ObjectLiteral } from 'typeorm';
import { TtipoMoneda } from './entities/moneda.entity';
import { TtipoPais } from './entities/pais.entity';
import { TtipoDeptoPais } from './entities/depto-pais.entity';
import { TtipoDeptoEmpresa } from './entities/depto-empresa.entity';
import { TtipoDireccion } from './entities/direccion.entity';
import { TtipoEstado } from './entities/estado.entity';
import { TtipoFormaPago } from './entities/forma-pago.entity';
import { TtipoTelefono } from './entities/telefono.entity';
import { TtipoTarjetaCredito } from './entities/tarjeta-credito.entity';
import { TtipoPasatiempo } from './entities/pasatiempo.entity';
import { TtipoZona } from './entities/zona.entity';
import { TtipoGestor } from './entities/gestor.entity';
import { TtipoImpuesto } from './entities/impuesto.entity';
import { TtipoProforma } from './entities/proforma.entity';
import { TtipoZonaVtaCob } from './entities/zona-vta-cob.entity';
import { TtipoParamBco } from './entities/param-bco.entity';
import { TtipoParamCon } from './entities/param-con.entity';
import { TtipoParamCxc } from './entities/param-cxc.entity';
import { TtipoParamCxp } from './entities/param-cxp.entity';
import { TtipoParamFac } from './entities/param-fac.entity';
import { TtipoParamInv } from './entities/param-inv.entity';
import { TtipoParamPap } from './entities/param-pap.entity';
import { TtipoParamPla } from './entities/param-pla.entity';
import { TtipoParamPres } from './entities/param-pres.entity';
import { TCoTipoDocumentoFiscal } from '../contabilidad/entities/tcotipodocumentofiscal.entity';
import { PlPlEmpleados } from '../planilla/entities/plplempleados.entity';
import { TPosPrecioVtas } from '../facturacion/entities/tpospreciovtas.entity';

@Injectable()
export class ParametrosService {
  constructor(
    @InjectRepository(TtipoMoneda) private readonly monedaRepo: Repository<TtipoMoneda>,
    @InjectRepository(TtipoPais) private readonly paisRepo: Repository<TtipoPais>,
    @InjectRepository(TtipoDeptoPais) private readonly deptoPaisRepo: Repository<TtipoDeptoPais>,
    @InjectRepository(TtipoDeptoEmpresa) private readonly deptoEmpresaRepo: Repository<TtipoDeptoEmpresa>,
    @InjectRepository(TtipoDireccion) private readonly direccionRepo: Repository<TtipoDireccion>,
    @InjectRepository(TtipoEstado) private readonly estadoRepo: Repository<TtipoEstado>,
    @InjectRepository(TtipoFormaPago) private readonly formaPagoRepo: Repository<TtipoFormaPago>,
    @InjectRepository(TtipoTelefono) private readonly telefonoRepo: Repository<TtipoTelefono>,
    @InjectRepository(TtipoTarjetaCredito) private readonly tarjetaCreditoRepo: Repository<TtipoTarjetaCredito>,
    @InjectRepository(TtipoPasatiempo) private readonly pasatiempoRepo: Repository<TtipoPasatiempo>,
    @InjectRepository(TtipoZona) private readonly zonaRepo: Repository<TtipoZona>,
    @InjectRepository(TtipoGestor) private readonly gestorRepo: Repository<TtipoGestor>,
    @InjectRepository(TtipoImpuesto) private readonly impuestoRepo: Repository<TtipoImpuesto>,
    @InjectRepository(TtipoProforma) private readonly proformaRepo: Repository<TtipoProforma>,
    @InjectRepository(TtipoZonaVtaCob) private readonly zonaVtaCobRepo: Repository<TtipoZonaVtaCob>,
    @InjectRepository(TtipoParamBco) private readonly paramBcoRepo: Repository<TtipoParamBco>,
    @InjectRepository(TtipoParamCon) private readonly paramConRepo: Repository<TtipoParamCon>,
    @InjectRepository(TtipoParamCxc) private readonly paramCxcRepo: Repository<TtipoParamCxc>,
    @InjectRepository(TtipoParamCxp) private readonly paramCxpRepo: Repository<TtipoParamCxp>,
    @InjectRepository(TtipoParamFac) private readonly paramFacRepo: Repository<TtipoParamFac>,
    @InjectRepository(TtipoParamInv) private readonly paramInvRepo: Repository<TtipoParamInv>,
    @InjectRepository(TtipoParamPap) private readonly paramPapRepo: Repository<TtipoParamPap>,
    @InjectRepository(TtipoParamPla) private readonly paramPlaRepo: Repository<TtipoParamPla>,
    @InjectRepository(TtipoParamPres) private readonly paramPresRepo: Repository<TtipoParamPres>,
    @InjectRepository(TCoTipoDocumentoFiscal) private readonly tipoDocFiscalRepo: Repository<TCoTipoDocumentoFiscal>,
    @InjectRepository(PlPlEmpleados) private readonly empleadoRepo: Repository<PlPlEmpleados>,
    @InjectRepository(TPosPrecioVtas) private readonly posPrecioVtaRepo: Repository<TPosPrecioVtas>,
  ) {}

  
  findAllTiposDocFiscal(empresaId: number) {
    return this.findAllByEmpresa(this.tipoDocFiscalRepo, empresaId);
  }

  private async findAllByEmpresa<T extends ObjectLiteral>(repo: Repository<T>, empresaId: number) {
    return repo.find({
      where: { empresaId } as unknown as FindOptionsWhere<T>,
    });
  }

  private async findAllSimple<T extends ObjectLiteral>(repo: Repository<T>) {
    return repo.find();
  }

  private async findOneById<T extends ObjectLiteral>(
    repo: Repository<T>,
    idField: string,
    id: number,
    empresaId: number,
    entityName: string,
  ) {
    const where = { [idField]: id, empresaId } as unknown as FindOptionsWhere<T>;
    const found = await repo.findOne({ where });
    if (!found) throw new NotFoundException(`${entityName} ${id} no encontrado`);
    return found;
  }

  private async findOneByEmpresaId<T extends ObjectLiteral>(
    repo: Repository<T>,
    empresaId: number,
    entityName: string,
  ) {
    const where = { empresaId } as unknown as FindOptionsWhere<T>;
    const found = await repo.findOne({ where });
    if (!found) throw new NotFoundException(`${entityName} empresa ${empresaId} no encontrado`);
    return found;
  }

  private async createEntity<T extends ObjectLiteral>(
    repo: Repository<T>,
    dto: any,
    currentUser: string,
  ) {
    const entity = repo.create({
      ...dto,
      usuarioCreated: currentUser,
    });
    return repo.save(entity);
  }

  private async updateEntity<T extends ObjectLiteral>(
    repo: Repository<T>,
    idField: string,
    id: number,
    empresaId: number,
    dto: any,
    currentUser: string,
    entityName: string,
  ) {
    const entity = await this.findOneById(repo, idField, id, empresaId, entityName);
    Object.assign(entity, dto, {
      usuarioUpdated: currentUser,
      fechaUpdated: new Date(),
    });
    return repo.save(entity);
  }

  private async upsertParam<T extends ObjectLiteral>(
    repo: Repository<T>,
    empresaId: number,
    dto: any,
    currentUser: string,
    entityName: string,
  ) {
    const found = await repo.findOne({ where: { empresaId } as unknown as FindOptionsWhere<T> });
    if (found) {
      Object.assign(found, dto, {
        usuarioUpdated: currentUser,
        fechaUpdated: new Date(),
      });
      return repo.save(found);
    }
    const entity = repo.create({
      empresaId,
      ...dto,
      usuarioCreated: currentUser,
    });
    return repo.save(entity);
  }

  private async softDelete<T extends ObjectLiteral>(
    repo: Repository<T>,
    idField: string,
    id: number,
    empresaId: number,
    entityName: string,
  ) {
    const entity = await this.findOneById(repo, idField, id, empresaId, entityName);
    Object.assign(entity, {
      sn_activo: 'N',
      fechaUpdated: new Date(),
    });
    return repo.save(entity);
  }

  async findAllMonedas(empresaId: number) {
    return this.findAllByEmpresa(this.monedaRepo, empresaId);
  }

  async findMoneda(monedaId: number, empresaId: number) {
    return this.findOneById(this.monedaRepo, 'monedaId', monedaId, empresaId, 'Moneda');
  }

  async createMoneda(dto: any, currentUser: string) {
    return this.createEntity(this.monedaRepo, dto, currentUser);
  }

  async updateMoneda(monedaId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.monedaRepo, 'monedaId', monedaId, empresaId, dto, currentUser, 'Moneda');
  }

  async removeMoneda(monedaId: number, empresaId: number) {
    return this.softDelete(this.monedaRepo, 'monedaId', monedaId, empresaId, 'Moneda');
  }

  async findAllPaises(empresaId: number) {
    return this.findAllByEmpresa(this.paisRepo, empresaId);
  }

  async findPais(paisId: number, empresaId: number) {
    return this.findOneById(this.paisRepo, 'paisId', paisId, empresaId, 'Pais');
  }

  async createPais(dto: any, currentUser: string) {
    return this.createEntity(this.paisRepo, dto, currentUser);
  }

  async updatePais(paisId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.paisRepo, 'paisId', paisId, empresaId, dto, currentUser, 'Pais');
  }

  async removePais(paisId: number, empresaId: number) {
    return this.softDelete(this.paisRepo, 'paisId', paisId, empresaId, 'Pais');
  }

  async findAllDeptoPais(empresaId: number) {
    return this.findAllByEmpresa(this.deptoPaisRepo, empresaId);
  }

  async findDeptoPais(ttipodeptopaisId: number, empresaId: number) {
    return this.findOneById(this.deptoPaisRepo, 'ttipodeptopaisId', ttipodeptopaisId, empresaId, 'Depto Pais');
  }

  async createDeptoPais(dto: any, currentUser: string) {
    return this.createEntity(this.deptoPaisRepo, dto, currentUser);
  }

  async updateDeptoPais(ttipodeptopaisId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.deptoPaisRepo, 'ttipodeptopaisId', ttipodeptopaisId, empresaId, dto, currentUser, 'Depto Pais');
  }

  async removeDeptoPais(ttipodeptopaisId: number, empresaId: number) {
    return this.softDelete(this.deptoPaisRepo, 'ttipodeptopaisId', ttipodeptopaisId, empresaId, 'Depto Pais');
  }

  async findAllDeptoEmpresa(empresaId: number) {
    return this.findAllByEmpresa(this.deptoEmpresaRepo, empresaId);
  }

  async findDeptoEmpresa(departamentostempresasId: number, empresaId: number) {
    return this.findOneById(this.deptoEmpresaRepo, 'departamentostempresasId', departamentostempresasId, empresaId, 'Depto Empresa');
  }

  async createDeptoEmpresa(dto: any, currentUser: string) {
    return this.createEntity(this.deptoEmpresaRepo, dto, currentUser);
  }

  async updateDeptoEmpresa(departamentostempresasId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.deptoEmpresaRepo, 'departamentostempresasId', departamentostempresasId, empresaId, dto, currentUser, 'Depto Empresa');
  }

  async removeDeptoEmpresa(departamentostempresasId: number, empresaId: number) {
    return this.softDelete(this.deptoEmpresaRepo, 'departamentostempresasId', departamentostempresasId, empresaId, 'Depto Empresa');
  }

  async findAllDirecciones(empresaId: number) {
    return this.findAllByEmpresa(this.direccionRepo, empresaId);
  }

  async findDireccion(direccionId: number, empresaId: number) {
    return this.findOneById(this.direccionRepo, 'direccionId', direccionId, empresaId, 'Direccion');
  }

  async createDireccion(dto: any, currentUser: string) {
    return this.createEntity(this.direccionRepo, dto, currentUser);
  }

  async updateDireccion(direccionId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.direccionRepo, 'direccionId', direccionId, empresaId, dto, currentUser, 'Direccion');
  }

  async removeDireccion(direccionId: number, empresaId: number) {
    return this.softDelete(this.direccionRepo, 'direccionId', direccionId, empresaId, 'Direccion');
  }

  async findAllEstados(empresaId: number) {
    return this.findAllByEmpresa(this.estadoRepo, empresaId);
  }

  async findEstado(estadoId: number, empresaId: number) {
    return this.findOneById(this.estadoRepo, 'estadoId', estadoId, empresaId, 'Estado');
  }

  async createEstado(dto: any, currentUser: string) {
    return this.createEntity(this.estadoRepo, dto, currentUser);
  }

  async updateEstado(estadoId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.estadoRepo, 'estadoId', estadoId, empresaId, dto, currentUser, 'Estado');
  }

  async removeEstado(estadoId: number, empresaId: number) {
    return this.softDelete(this.estadoRepo, 'estadoId', estadoId, empresaId, 'Estado');
  }

  async findAllFormasPago(empresaId: number) {
    return this.findAllByEmpresa(this.formaPagoRepo, empresaId);
  }

  async findFormaPago(formapagoId: number, empresaId: number) {
    return this.findOneById(this.formaPagoRepo, 'formapagoId', formapagoId, empresaId, 'Forma Pago');
  }

  async createFormaPago(dto: any, currentUser: string) {
    return this.createEntity(this.formaPagoRepo, dto, currentUser);
  }

  async updateFormaPago(formapagoId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.formaPagoRepo, 'formapagoId', formapagoId, empresaId, dto, currentUser, 'Forma Pago');
  }

  async removeFormaPago(formapagoId: number, empresaId: number) {
    return this.softDelete(this.formaPagoRepo, 'formapagoId', formapagoId, empresaId, 'Forma Pago');
  }

  async findAllTelefonos(empresaId: number) {
    return this.findAllByEmpresa(this.telefonoRepo, empresaId);
  }

  async findTelefono(telefonoId: number, empresaId: number) {
    return this.findOneById(this.telefonoRepo, 'telefonoId', telefonoId, empresaId, 'Telefono');
  }

  async createTelefono(dto: any, currentUser: string) {
    return this.createEntity(this.telefonoRepo, dto, currentUser);
  }

  async updateTelefono(telefonoId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.telefonoRepo, 'telefonoId', telefonoId, empresaId, dto, currentUser, 'Telefono');
  }

  async removeTelefono(telefonoId: number, empresaId: number) {
    return this.softDelete(this.telefonoRepo, 'telefonoId', telefonoId, empresaId, 'Telefono');
  }

  async findAllTarjetasCredito(empresaId: number) {
    return this.findAllByEmpresa(this.tarjetaCreditoRepo, empresaId);
  }

  async findTarjetaCredito(tarjetacreditoId: number, empresaId: number) {
    return this.findOneById(this.tarjetaCreditoRepo, 'tarjetacreditoId', tarjetacreditoId, empresaId, 'Tarjeta Credito');
  }

  async createTarjetaCredito(dto: any, currentUser: string) {
    return this.createEntity(this.tarjetaCreditoRepo, dto, currentUser);
  }

  async updateTarjetaCredito(tarjetacreditoId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.tarjetaCreditoRepo, 'tarjetacreditoId', tarjetacreditoId, empresaId, dto, currentUser, 'Tarjeta Credito');
  }

  async removeTarjetaCredito(tarjetacreditoId: number, empresaId: number) {
    return this.softDelete(this.tarjetaCreditoRepo, 'tarjetacreditoId', tarjetacreditoId, empresaId, 'Tarjeta Credito');
  }

  async findAllPasatiempos() {
    return this.findAllSimple(this.pasatiempoRepo);
  }

  async findPasatiempo(pasatiempoId: number) {
    const found = await this.pasatiempoRepo.findOne({ where: { pasatiempoId } });
    if (!found) throw new NotFoundException(`Pasatiempo ${pasatiempoId} no encontrado`);
    return found;
  }

  async createPasatiempo(dto: any, currentUser: string) {
    return this.createEntity(this.pasatiempoRepo, dto, currentUser);
  }

  async updatePasatiempo(pasatiempoId: number, dto: any, currentUser: string) {
    const entity = await this.findPasatiempo(pasatiempoId);
    Object.assign(entity, dto, {
      usuarioUpdated: currentUser,
      fechaUpdated: new Date(),
    });
    return this.pasatiempoRepo.save(entity);
  }

  async removePasatiempo(pasatiempoId: number) {
    const entity = await this.findPasatiempo(pasatiempoId);
    Object.assign(entity, {
      sn_activo: 'N',
      fechaUpdated: new Date(),
    });
    return this.pasatiempoRepo.save(entity);
  }

  async findAllZonas(empresaId: number) {
    return this.findAllByEmpresa(this.zonaRepo, empresaId);
  }

  async findZona(tzonadId: number, empresaId: number) {
    return this.findOneById(this.zonaRepo, 'tzonadId', tzonadId, empresaId, 'Zona');
  }

  async createZona(dto: any, currentUser: string) {
    return this.createEntity(this.zonaRepo, dto, currentUser);
  }

  async updateZona(tzonadId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.zonaRepo, 'tzonadId', tzonadId, empresaId, dto, currentUser, 'Zona');
  }

  async removeZona(tzonadId: number, empresaId: number) {
    return this.softDelete(this.zonaRepo, 'tzonadId', tzonadId, empresaId, 'Zona');
  }

  async findAllGestores(empresaId: number) {
    return this.gestorRepo
      .createQueryBuilder('g')
      .leftJoin(PlPlEmpleados, 'e', 'e.empleadoId = g.empleadoId')
      .addSelect("CONCAT(e.nombres, ' ', e.apellidos)", 'nombre')
      .where('g.empresaId = :empresaId', { empresaId })
      .getRawMany();
  }

  async findGestor(gestorId: number, empresaId: number) {
    return this.findOneById(this.gestorRepo, 'gestorId', gestorId, empresaId, 'Gestor');
  }

  async createGestor(dto: any, currentUser: string) {
    return this.createEntity(this.gestorRepo, dto, currentUser);
  }

  async updateGestor(gestorId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.gestorRepo, 'gestorId', gestorId, empresaId, dto, currentUser, 'Gestor');
  }

  async removeGestor(gestorId: number, empresaId: number) {
    return this.softDelete(this.gestorRepo, 'gestorId', gestorId, empresaId, 'Gestor');
  }

  async findAllImpuestos(empresaId: number) {
    return this.findAllByEmpresa(this.impuestoRepo, empresaId);
  }

  async findImpuesto(impuestoId: number, empresaId: number) {
    return this.findOneById(this.impuestoRepo, 'impuestoId', impuestoId, empresaId, 'Impuesto');
  }

  async createImpuesto(dto: any, currentUser: string) {
    return this.createEntity(this.impuestoRepo, dto, currentUser);
  }

  async updateImpuesto(impuestoId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.impuestoRepo, 'impuestoId', impuestoId, empresaId, dto, currentUser, 'Impuesto');
  }

  async removeImpuesto(impuestoId: number, empresaId: number) {
    return this.softDelete(this.impuestoRepo, 'impuestoId', impuestoId, empresaId, 'Impuesto');
  }

  async findAllProformas(empresaId: number) {
    return this.findAllByEmpresa(this.proformaRepo, empresaId);
  }

  async findProforma(proformaId: number, empresaId: number) {
    return this.findOneById(this.proformaRepo, 'proformaId', proformaId, empresaId, 'Proforma');
  }

  async createProforma(dto: any, currentUser: string) {
    return this.createEntity(this.proformaRepo, dto, currentUser);
  }

  async updateProforma(proformaId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.proformaRepo, 'proformaId', proformaId, empresaId, dto, currentUser, 'Proforma');
  }

  async removeProforma(proformaId: number, empresaId: number) {
    return this.softDelete(this.proformaRepo, 'proformaId', proformaId, empresaId, 'Proforma');
  }

  async findAllZonasVtaCob(empresaId: number) {
    return this.findAllByEmpresa(this.zonaVtaCobRepo, empresaId);
  }

  async findZonaVtaCob(ttipozonasvtacobId: number, empresaId: number) {
    return this.findOneById(this.zonaVtaCobRepo, 'ttipozonasvtacobId', ttipozonasvtacobId, empresaId, 'Zona Vta Cob');
  }

  async createZonaVtaCob(dto: any, currentUser: string) {
    return this.createEntity(this.zonaVtaCobRepo, dto, currentUser);
  }

  async updateZonaVtaCob(ttipozonasvtacobId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.zonaVtaCobRepo, 'ttipozonasvtacobId', ttipozonasvtacobId, empresaId, dto, currentUser, 'Zona Vta Cob');
  }

  async removeZonaVtaCob(ttipozonasvtacobId: number, empresaId: number) {
    return this.softDelete(this.zonaVtaCobRepo, 'ttipozonasvtacobId', ttipozonasvtacobId, empresaId, 'Zona Vta Cob');
  }

  async findParamBco(empresaId: number) {
    return this.findOneByEmpresaId(this.paramBcoRepo, empresaId, 'Param Bco');
  }

  async upsertParamBco(empresaId: number, dto: any, currentUser: string) {
    return this.upsertParam(this.paramBcoRepo, empresaId, dto, currentUser, 'Param Bco');
  }

  async findParamCon(empresaId: number) {
    return this.findOneByEmpresaId(this.paramConRepo, empresaId, 'Param Con');
  }

  async upsertParamCon(empresaId: number, dto: any, currentUser: string) {
    return this.upsertParam(this.paramConRepo, empresaId, dto, currentUser, 'Param Con');
  }

  async findParamCxc(empresaId: number) {
    return this.findOneByEmpresaId(this.paramCxcRepo, empresaId, 'Param Cxc');
  }

  async upsertParamCxc(empresaId: number, dto: any, currentUser: string) {
    return this.upsertParam(this.paramCxcRepo, empresaId, dto, currentUser, 'Param Cxc');
  }

  async findParamCxp(empresaId: number) {
    return this.findOneByEmpresaId(this.paramCxpRepo, empresaId, 'Param Cxp');
  }

  async upsertParamCxp(empresaId: number, dto: any, currentUser: string) {
    return this.upsertParam(this.paramCxpRepo, empresaId, dto, currentUser, 'Param Cxp');
  }

  async findParamFac(empresaId: number) {
    return this.findOneByEmpresaId(this.paramFacRepo, empresaId, 'Param Fac');
  }

  async upsertParamFac(empresaId: number, dto: any, currentUser: string) {
    return this.upsertParam(this.paramFacRepo, empresaId, dto, currentUser, 'Param Fac');
  }

  async findParamInv(empresaId: number) {
    return this.findOneByEmpresaId(this.paramInvRepo, empresaId, 'Param Inv');
  }

  async upsertParamInv(empresaId: number, dto: any, currentUser: string) {
    return this.upsertParam(this.paramInvRepo, empresaId, dto, currentUser, 'Param Inv');
  }

  async findParamPap(empresaId: number) {
    return this.findOneByEmpresaId(this.paramPapRepo, empresaId, 'Param Pap');
  }

  async upsertParamPap(empresaId: number, dto: any, currentUser: string) {
    return this.upsertParam(this.paramPapRepo, empresaId, dto, currentUser, 'Param Pap');
  }

  async findParamPla(empresaId: number) {
    return this.findOneByEmpresaId(this.paramPlaRepo, empresaId, 'Param Pla');
  }

  async upsertParamPla(empresaId: number, dto: any, currentUser: string) {
    return this.upsertParam(this.paramPlaRepo, empresaId, dto, currentUser, 'Param Pla');
  }

  async findParamPres(empresaId: number) {
    return this.findOneByEmpresaId(this.paramPresRepo, empresaId, 'Param Pres');
  }

  async upsertParamPres(empresaId: number, dto: any, currentUser: string) {
    return this.upsertParam(this.paramPresRepo, empresaId, dto, currentUser, 'Param Pres');
  }

  async findAllPreciosVta(empresaId: number) {
    return this.posPrecioVtaRepo.find({
      where: { empresaId, sn_activo: 'S' } as any,
      order: { descripcion: 'ASC' } as any,
    });
  }

  async findPreciosVta(preciovtaId: number, empresaId: number) {
    return this.posPrecioVtaRepo.findOne({
      where: { preciovtaId, empresaId } as any,
    });
  }
}

```

---

## 📄 src\modules\planilla\dto\plepladet.dto.ts

```typescript
import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePlPlaDetDto {
  @ApiProperty({ description: 'ID de la planilla' })
  @IsNumber()
  planillaId: number;

  @ApiProperty({ description: 'ID del empleado' })
  @IsNumber()
  empleadoId: number;

  @ApiProperty({ required: false, description: 'ID del departamento' })
  @IsNumber() @IsOptional()
  departamentoId?: number;

  @ApiProperty({ required: false, description: 'Sueldo bruto' })
  @IsNumber() @IsOptional()
  sueldobruto?: number;

  @ApiProperty({ required: false, description: 'Importe IHSS' })
  @IsNumber() @IsOptional()
  importe_dihss?: number;

  @ApiProperty({ required: false, description: 'Importe Rap' })
  @IsNumber() @IsOptional()
  importe_drap?: number;

  @ApiProperty({ required: false, description: 'Importe RTF' })
  @IsNumber() @IsOptional()
  importe_drtf?: number;

  @ApiProperty({ required: false, description: 'Importe otras deducciones' })
  @IsNumber() @IsOptional()
  importe_dotras?: number;

  @ApiProperty({ required: false, description: 'Importe comisión' })
  @IsNumber() @IsOptional()
  importe_ccomision?: number;

  @ApiProperty({ required: false, description: 'Importe horas extras' })
  @IsNumber() @IsOptional()
  importe_chorasextras?: number;

  @ApiProperty({ required: false, description: 'Importe bonos' })
  @IsNumber() @IsOptional()
  importe_cbonos?: number;

  @ApiProperty({ required: false, description: 'Sueldo neto' })
  @IsNumber() @IsOptional()
  sueldoneto?: number;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdatePlPlaDetDto {
  @ApiProperty({ required: false, description: 'ID de la planilla' })
  @IsNumber() @IsOptional()
  planillaId?: number;

  @ApiProperty({ required: false, description: 'ID del empleado' })
  @IsNumber() @IsOptional()
  empleadoId?: number;

  @ApiProperty({ required: false, description: 'ID del departamento' })
  @IsNumber() @IsOptional()
  departamentoId?: number;

  @ApiProperty({ required: false, description: 'Sueldo bruto' })
  @IsNumber() @IsOptional()
  sueldobruto?: number;

  @ApiProperty({ required: false, description: 'Importe IHSS' })
  @IsNumber() @IsOptional()
  importe_dihss?: number;

  @ApiProperty({ required: false, description: 'Importe Rap' })
  @IsNumber() @IsOptional()
  importe_drap?: number;

  @ApiProperty({ required: false, description: 'Importe RTF' })
  @IsNumber() @IsOptional()
  importe_drtf?: number;

  @ApiProperty({ required: false, description: 'Importe otras deducciones' })
  @IsNumber() @IsOptional()
  importe_dotras?: number;

  @ApiProperty({ required: false, description: 'Importe comisión' })
  @IsNumber() @IsOptional()
  importe_ccomision?: number;

  @ApiProperty({ required: false, description: 'Importe horas extras' })
  @IsNumber() @IsOptional()
  importe_chorasextras?: number;

  @ApiProperty({ required: false, description: 'Importe bonos' })
  @IsNumber() @IsOptional()
  importe_cbonos?: number;

  @ApiProperty({ required: false, description: 'Sueldo neto' })
  @IsNumber() @IsOptional()
  sueldoneto?: number;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Pagar empleado' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_pagar?: string;
}

```

---

## 📄 src\modules\planilla\dto\pleplamae.dto.ts

```typescript
import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePlPlaMaeDto {
  @ApiProperty({ description: 'Período de la planilla' })
  @IsNumber()
  periodo: number;

  @ApiProperty({ description: 'Año de la planilla' })
  @IsNumber()
  anio: number;

  @ApiProperty({ description: 'ID de cuenta bancaria' })
  @IsNumber()
  bcoctasId: number;

  @ApiProperty({ required: false, description: 'Cantidad de ítems' })
  @IsNumber() @IsOptional()
  items?: number;

  @ApiProperty({ required: false, description: 'Total a pagar' })
  @IsNumber() @IsOptional()
  totalapagar?: number;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdatePlPlaMaeDto {
  @ApiProperty({ required: false, description: 'Período de la planilla' })
  @IsNumber() @IsOptional()
  periodo?: number;

  @ApiProperty({ required: false, description: 'Año de la planilla' })
  @IsNumber() @IsOptional()
  anio?: number;

  @ApiProperty({ required: false, description: 'ID de cuenta bancaria' })
  @IsNumber() @IsOptional()
  bcoctasId?: number;

  @ApiProperty({ required: false, description: 'Cantidad de ítems' })
  @IsNumber() @IsOptional()
  items?: number;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Planilla pagada' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_pagada?: string;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Planilla anulada' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_anulada?: string;

  @ApiProperty({ required: false, description: 'Total a pagar' })
  @IsNumber() @IsOptional()
  totalapagar?: number;
}

```

---

## 📄 src\modules\planilla\dto\plplempleados.dto.ts

```typescript
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePlEmpleadosDto {
  @ApiProperty({ description: 'Nombres del empleado' })
  @IsString() @IsNotEmpty()
  nombres: string;

  @ApiProperty({ description: 'Apellidos del empleado' })
  @IsString() @IsNotEmpty()
  apellidos: string;

  @ApiProperty({ description: 'Documento de identidad' })
  @IsString() @IsNotEmpty()
  dni: string;

  @ApiProperty({ required: false, description: 'Fecha de nacimiento' })
  @IsString() @IsOptional()
  fechanacimiento?: string;

  @ApiProperty({ required: false, enum: ['M', 'F', 'T'], description: 'Sexo' })
  @IsEnum(['M', 'F', 'T']) @IsOptional()
  sexo?: string;

  @ApiProperty({ required: false, enum: ['S', 'C', 'V', 'D', 'U'], description: 'Estado civil' })
  @IsEnum(['S', 'C', 'V', 'D', 'U']) @IsOptional()
  estadocivil?: string;

  @ApiProperty({ required: false, description: 'ID del país de origen' })
  @IsNumber() @IsOptional()
  paisorigen?: number;

  @ApiProperty({ required: false, description: 'ID del país de residencia' })
  @IsNumber() @IsOptional()
  paisresidencia?: number;

  @ApiProperty({ required: false, description: 'Número de seguro' })
  @IsString() @IsOptional()
  nroseguro?: string;

  @ApiProperty({ description: 'Teléfono' })
  @IsString() @IsNotEmpty()
  telefono: string;

  @ApiProperty({ description: 'Celular' })
  @IsString() @IsNotEmpty()
  celular: string;

  @ApiProperty({ description: 'Correo electrónico' })
  @IsString() @IsNotEmpty()
  email: string;

  @ApiProperty({ required: false, description: 'ID de profesión' })
  @IsNumber() @IsOptional()
  profesionId?: number;

  @ApiProperty({ required: false, description: 'ID de puesto' })
  @IsNumber() @IsOptional()
  puestoId?: number;

  @ApiProperty({ required: false, description: 'Sueldo bruto' })
  @IsNumber() @IsOptional()
  sueldobruto?: number;

  @ApiProperty({ required: false, description: 'Techo del seguro' })
  @IsNumber() @IsOptional()
  techoseguro?: number;

  @ApiProperty({ required: false, description: 'Cuenta bancaria' })
  @IsString() @IsOptional()
  cuentabancaria?: string;

  @ApiProperty({ required: false, description: 'Lugar de nacimiento' })
  @IsString() @IsOptional()
  lugardenacimiento?: string;

  @ApiProperty({ description: 'ID de tipo de empleado' })
  @IsNumber()
  tipoempId: number;

  @ApiProperty({ description: 'ID de sucursal' })
  @IsNumber()
  Idsucursal: number;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdatePlEmpleadosDto {
  @ApiProperty({ required: false, description: 'Nombres del empleado' })
  @IsString() @IsOptional()
  nombres?: string;

  @ApiProperty({ required: false, description: 'Apellidos del empleado' })
  @IsString() @IsOptional()
  apellidos?: string;

  @ApiProperty({ required: false, description: 'Documento de identidad' })
  @IsString() @IsOptional()
  dni?: string;

  @ApiProperty({ required: false, description: 'Fecha de nacimiento' })
  @IsString() @IsOptional()
  fechanacimiento?: string;

  @ApiProperty({ required: false, enum: ['M', 'F', 'T'], description: 'Sexo' })
  @IsEnum(['M', 'F', 'T']) @IsOptional()
  sexo?: string;

  @ApiProperty({ required: false, enum: ['S', 'C', 'V', 'D', 'U'], description: 'Estado civil' })
  @IsEnum(['S', 'C', 'V', 'D', 'U']) @IsOptional()
  estadocivil?: string;

  @ApiProperty({ required: false, description: 'ID del país de origen' })
  @IsNumber() @IsOptional()
  paisorigen?: number;

  @ApiProperty({ required: false, description: 'ID del país de residencia' })
  @IsNumber() @IsOptional()
  paisresidencia?: number;

  @ApiProperty({ required: false, description: 'Número de seguro' })
  @IsString() @IsOptional()
  nroseguro?: string;

  @ApiProperty({ required: false, description: 'Teléfono' })
  @IsString() @IsOptional()
  telefono?: string;

  @ApiProperty({ required: false, description: 'Celular' })
  @IsString() @IsOptional()
  celular?: string;

  @ApiProperty({ required: false, description: 'Correo electrónico' })
  @IsString() @IsOptional()
  email?: string;

  @ApiProperty({ required: false, description: 'ID de profesión' })
  @IsNumber() @IsOptional()
  profesionId?: number;

  @ApiProperty({ required: false, description: 'ID de puesto' })
  @IsNumber() @IsOptional()
  puestoId?: number;

  @ApiProperty({ required: false, description: 'Sueldo bruto' })
  @IsNumber() @IsOptional()
  sueldobruto?: number;

  @ApiProperty({ required: false, description: 'Techo del seguro' })
  @IsNumber() @IsOptional()
  techoseguro?: number;

  @ApiProperty({ required: false, description: 'Cuenta bancaria' })
  @IsString() @IsOptional()
  cuentabancaria?: string;

  @ApiProperty({ required: false, description: 'Lugar de nacimiento' })
  @IsString() @IsOptional()
  lugardenacimiento?: string;

  @ApiProperty({ required: false, description: 'ID de tipo de empleado' })
  @IsNumber() @IsOptional()
  tipoempId?: number;

  @ApiProperty({ required: false, description: 'ID de sucursal' })
  @IsNumber() @IsOptional()
  Idsucursal?: number;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Estado activo' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;
}

```

---

## 📄 src\modules\planilla\dto\tpldeducciones.dto.ts

```typescript
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTplDeduccionesDto {
  @ApiProperty({ description: 'Descripción del tipo de deducción' })
  @IsString() @IsNotEmpty()
  descripcion: string;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Es porcentual' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_porcentual?: string;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Es obligatoria' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_obligatoria?: string;

  @ApiProperty({ required: false, description: 'Porcentaje' })
  @IsNumber() @IsOptional()
  porcentaje?: number;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdateTplDeduccionesDto {
  @ApiProperty({ required: false, description: 'Descripción del tipo de deducción' })
  @IsString() @IsOptional()
  descripcion?: string;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Es porcentual' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_porcentual?: string;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Es obligatoria' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_obligatoria?: string;

  @ApiProperty({ required: false, description: 'Porcentaje' })
  @IsNumber() @IsOptional()
  porcentaje?: number;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Estado activo' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;
}

```

---

## 📄 src\modules\planilla\dto\tplingresos.dto.ts

```typescript
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTplIngresosDto {
  @ApiProperty({ description: 'Descripción del tipo de ingreso' })
  @IsString() @IsNotEmpty()
  descripcion: string;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Es porcentual' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_porcentual?: string;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Es obligatoria' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_obligatoria?: string;

  @ApiProperty({ required: false, description: 'Porcentaje' })
  @IsNumber() @IsOptional()
  porcentaje?: number;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdateTplIngresosDto {
  @ApiProperty({ required: false, description: 'Descripción del tipo de ingreso' })
  @IsString() @IsOptional()
  descripcion?: string;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Es porcentual' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_porcentual?: string;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Es obligatoria' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_obligatoria?: string;

  @ApiProperty({ required: false, description: 'Porcentaje' })
  @IsNumber() @IsOptional()
  porcentaje?: number;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Estado activo' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;
}

```

---

## 📄 src\modules\planilla\entities\pleasistencia.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('pleasistencia')
export class PlAsistencia {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'plempleadosasistenciaId' })
  plempleadosasistenciaId: number;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @ApiProperty()
  @Column({ type: 'int' })
  empleadoId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  horaentrada: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  horaalmuerzo: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  horaretorno: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  horarealSalida: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  horasalida: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\planilla\entities\plecertificaciones.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('plecertificaciones')
export class PlCertificaciones {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'empcertificacionId' })
  empcertificacionId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  empleadoId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 50, nullable: true })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\planilla\entities\plecomisiones.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('plecomisiones')
export class PlComisiones {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'emplcomId' })
  emplcomId: number;

  @ApiProperty()
  @Column({ type: 'int' })
  empleadoId: number;

  @ApiProperty()
  @Column({ type: 'int' })
  comisionId: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['F', 'P'], default: 'f' })
  tipocomision: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_quincenal: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\planilla\entities\plededucciones.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('plededucciones')
export class PlDeducciones {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'empdeduccionId' })
  empdeduccionId: number;

  @ApiProperty()
  @Column({ type: 'int' })
  empleadoId: number;

  @ApiProperty()
  @Column({ type: 'int' })
  deduccionId: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['F', 'P'], default: 'f' })
  tipodeduccion: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_quincenal: string;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  porcentaje: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\planilla\entities\plepladet.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('plepladet')
export class PlPlaDet {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'plepladetId' })
  plepladetId: number;

  @ApiProperty()
  @Column({ type: 'int' })
  planillaId: number;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @ApiProperty()
  @Column({ type: 'int' })
  empleadoId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  departamentoId: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  sueldobruto: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  importe_dihss: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  importe_drap: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  importe_drtf: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  importe_dotras: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  importe_ccomision: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  importe_chorasextras: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  importe_cbonos: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  sueldoneto: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_pagar: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\planilla\entities\pleplamae.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('pleplamae')
export class PlPlaMae {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'planillaId' })
  planillaId: number;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @ApiProperty()
  @Column({ type: 'int' })
  periodo: number;

  @ApiProperty()
  @Column({ type: 'int' })
  anio: number;

  @ApiProperty()
  @Column({ type: 'int' })
  bcoctasId: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  items: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_pagada: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_anulada: string;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  totalapagar: number;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\planilla\entities\pletitulaciones.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('pletitulaciones')
export class PlEtits {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'emptitulacionId' })
  emptitulacionId: number;

  @ApiProperty()
  @Column({ type: 'int' })
  empleadoId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\planilla\entities\plplempleados.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('plplempleados')
export class PlPlEmpleados {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'empleadoId' })
  empleadoId: number;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  nombres: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  apellidos: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  dni: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechanacimiento: Date;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['M', 'F', 'T'], default: 'M' })
  sexo: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'C', 'V', 'D', 'U'], default: 'S' })
  estadocivil: string;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  paisorigen: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  paisresidencia: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  nroseguro: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  telefono: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  celular: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  email: string;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  profesionId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  puestoId: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  sueldobruto: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  techoseguro: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  cuentabancaria: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 200, nullable: true })
  lugardenacimiento: string;

  @ApiProperty({ required: false })
  @Column({ type: 'longblob', nullable: true })
  foto: Buffer;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column({ type: 'int' })
  tipoempId: number;

  @ApiProperty()
  @Column({ type: 'int' })
  Idsucursal: number;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\planilla\entities\tpldeducciones.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('tpldeducciones')
export class TplDeducciones {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'deduccioneId' })
  deduccioneId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_porcentual: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_obligatoria: string;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  porcentaje: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\planilla\entities\tplingresos.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('tplingresos')
export class TplIngresos {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'tingresoId' })
  tingresoId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_porcentual: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_obligatoria: string;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  porcentaje: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\planilla\entities\tplprofesiones.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('tplprofesiones')
export class TplProfesiones {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'profesionId' })
  profesionId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\planilla\entities\tplpuestos.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('tplpuestos')
export class TplPuestos {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'puestosId' })
  puestosId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\planilla\planilla.controller.ts

```typescript
import {
  Controller, Get, Post, Put, Body, Param, Query,
  UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PlanillaService } from './planilla.service';
import { CreatePlEmpleadosDto, UpdatePlEmpleadosDto } from './dto/plplempleados.dto';
import { CreatePlPlaMaeDto, UpdatePlPlaMaeDto } from './dto/pleplamae.dto';
import { CreatePlPlaDetDto, UpdatePlPlaDetDto } from './dto/plepladet.dto';
import { CreateTplDeduccionesDto, UpdateTplDeduccionesDto } from './dto/tpldeducciones.dto';
import { CreateTplIngresosDto, UpdateTplIngresosDto } from './dto/tplingresos.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Planilla')
@ApiBearerAuth()
@Controller('planilla')
@UseGuards(JwtAuthGuard)
export class PlanillaController {
  constructor(private readonly service: PlanillaService) {}

  @Get('empleados')
  @ApiOperation({ summary: 'Listar empleados' })
  @ApiResponse({ status: 200, description: 'Lista de empleados obtenida exitosamente' })
  findAllEmpleados(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllEmpleados(empresaId);
  }

  @Get('empleados/:id')
  @ApiOperation({ summary: 'Obtener empleado por ID' })
  @ApiResponse({ status: 200, description: 'Empleado encontrado' })
  @ApiResponse({ status: 404, description: 'Empleado no encontrado' })
  findEmpleado(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findEmpleado(id, empresaId);
  }

  @Post('empleados')
  @ApiOperation({ summary: 'Crear empleado' })
  @ApiResponse({ status: 201, description: 'Empleado creado exitosamente' })
  createEmpleado(@Body() dto: CreatePlEmpleadosDto, @CurrentUser() user: any) {
    return this.service.createEmpleado(dto, user.usuario);
  }

  @Put('empleados/:id')
  @ApiOperation({ summary: 'Actualizar empleado' })
  @ApiResponse({ status: 200, description: 'Empleado actualizado exitosamente' })
  updateEmpleado(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdatePlEmpleadosDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateEmpleado(id, empresaId, dto, user.usuario);
  }

  @Get('titulaciones')
  @ApiOperation({ summary: 'Listar titulaciones' })
  @ApiResponse({ status: 200, description: 'Lista de titulaciones obtenida exitosamente' })
  findAllTitulaciones(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllTitulaciones(empresaId);
  }

  @Get('titulaciones/:id')
  @ApiOperation({ summary: 'Obtener titulación por ID' })
  @ApiResponse({ status: 200, description: 'Titulación encontrada' })
  @ApiResponse({ status: 404, description: 'Titulación no encontrada' })
  findTitulacion(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findTitulacion(id, empresaId);
  }

  @Post('titulaciones')
  @ApiOperation({ summary: 'Crear titulación' })
  @ApiResponse({ status: 201, description: 'Titulación creada exitosamente' })
  createTitulacion(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createTitulacion(dto, user.usuario);
  }

  @Put('titulaciones/:id')
  @ApiOperation({ summary: 'Actualizar titulación' })
  @ApiResponse({ status: 200, description: 'Titulación actualizada exitosamente' })
  updateTitulacion(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateTitulacion(id, empresaId, dto, user.usuario);
  }

  @Get('asistencia')
  @ApiOperation({ summary: 'Listar asistencias' })
  @ApiResponse({ status: 200, description: 'Lista de asistencias obtenida exitosamente' })
  findAllAsistencia(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllAsistencia(empresaId);
  }

  @Get('asistencia/:id')
  @ApiOperation({ summary: 'Obtener asistencia por ID' })
  @ApiResponse({ status: 200, description: 'Asistencia encontrada' })
  @ApiResponse({ status: 404, description: 'Asistencia no encontrada' })
  findAsistencia(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findAsistencia(id, empresaId);
  }

  @Post('asistencia')
  @ApiOperation({ summary: 'Crear asistencia' })
  @ApiResponse({ status: 201, description: 'Asistencia creada exitosamente' })
  createAsistencia(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createAsistencia(dto, user.usuario);
  }

  @Put('asistencia/:id')
  @ApiOperation({ summary: 'Actualizar asistencia' })
  @ApiResponse({ status: 200, description: 'Asistencia actualizada exitosamente' })
  updateAsistencia(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateAsistencia(id, empresaId, dto, user.usuario);
  }

  @Get('certificaciones')
  @ApiOperation({ summary: 'Listar certificaciones' })
  @ApiResponse({ status: 200, description: 'Lista de certificaciones obtenida exitosamente' })
  findAllCertificaciones(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllCertificaciones(empresaId);
  }

  @Get('certificaciones/:id')
  @ApiOperation({ summary: 'Obtener certificación por ID' })
  @ApiResponse({ status: 200, description: 'Certificación encontrada' })
  @ApiResponse({ status: 404, description: 'Certificación no encontrada' })
  findCertificacion(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findCertificacion(id, empresaId);
  }

  @Post('certificaciones')
  @ApiOperation({ summary: 'Crear certificación' })
  @ApiResponse({ status: 201, description: 'Certificación creada exitosamente' })
  createCertificacion(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createCertificacion(dto, user.usuario);
  }

  @Put('certificaciones/:id')
  @ApiOperation({ summary: 'Actualizar certificación' })
  @ApiResponse({ status: 200, description: 'Certificación actualizada exitosamente' })
  updateCertificacion(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateCertificacion(id, empresaId, dto, user.usuario);
  }

  @Get('comisiones')
  @ApiOperation({ summary: 'Listar comisiones' })
  @ApiResponse({ status: 200, description: 'Lista de comisiones obtenida exitosamente' })
  findAllComisiones(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllComisiones(empresaId);
  }

  @Get('comisiones/:id')
  @ApiOperation({ summary: 'Obtener comisión por ID' })
  @ApiResponse({ status: 200, description: 'Comisión encontrada' })
  @ApiResponse({ status: 404, description: 'Comisión no encontrada' })
  findComision(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findComision(id, empresaId);
  }

  @Post('comisiones')
  @ApiOperation({ summary: 'Crear comisión' })
  @ApiResponse({ status: 201, description: 'Comisión creada exitosamente' })
  createComision(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createComision(dto, user.usuario);
  }

  @Put('comisiones/:id')
  @ApiOperation({ summary: 'Actualizar comisión' })
  @ApiResponse({ status: 200, description: 'Comisión actualizada exitosamente' })
  updateComision(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateComision(id, empresaId, dto, user.usuario);
  }

  @Get('deducciones-emp')
  @ApiOperation({ summary: 'Listar deducciones de empleado' })
  @ApiResponse({ status: 200, description: 'Lista de deducciones de empleado obtenida exitosamente' })
  findAllDeduccionesEmp(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllDeduccionesEmp(empresaId);
  }

  @Get('deducciones-emp/:id')
  @ApiOperation({ summary: 'Obtener deducción de empleado por ID' })
  @ApiResponse({ status: 200, description: 'Deducción de empleado encontrada' })
  @ApiResponse({ status: 404, description: 'Deducción de empleado no encontrada' })
  findDeduccionEmp(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findDeduccionEmp(id, empresaId);
  }

  @Post('deducciones-emp')
  @ApiOperation({ summary: 'Crear deducción de empleado' })
  @ApiResponse({ status: 201, description: 'Deducción de empleado creada exitosamente' })
  createDeduccionEmp(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createDeduccionEmp(dto, user.usuario);
  }

  @Put('deducciones-emp/:id')
  @ApiOperation({ summary: 'Actualizar deducción de empleado' })
  @ApiResponse({ status: 200, description: 'Deducción de empleado actualizada exitosamente' })
  updateDeduccionEmp(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateDeduccionEmp(id, empresaId, dto, user.usuario);
  }

  @Get('planillas')
  @ApiOperation({ summary: 'Listar planillas' })
  @ApiResponse({ status: 200, description: 'Lista de planillas obtenida exitosamente' })
  findAllPlanillas(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllPlanillas(empresaId);
  }

  @Get('planillas/:id')
  @ApiOperation({ summary: 'Obtener planilla por ID' })
  @ApiResponse({ status: 200, description: 'Planilla encontrada' })
  @ApiResponse({ status: 404, description: 'Planilla no encontrada' })
  findPlanilla(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findPlanilla(id, empresaId);
  }

  @Post('planillas')
  @ApiOperation({ summary: 'Crear planilla' })
  @ApiResponse({ status: 201, description: 'Planilla creada exitosamente' })
  createPlanilla(@Body() dto: CreatePlPlaMaeDto, @CurrentUser() user: any) {
    return this.service.createPlanilla(dto, user.usuario);
  }

  @Put('planillas/:id')
  @ApiOperation({ summary: 'Actualizar planilla' })
  @ApiResponse({ status: 200, description: 'Planilla actualizada exitosamente' })
  updatePlanilla(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdatePlPlaMaeDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updatePlanilla(id, empresaId, dto, user.usuario);
  }

  @Get('planilla-det')
  @ApiOperation({ summary: 'Listar detalle de planilla' })
  @ApiResponse({ status: 200, description: 'Lista de detalle de planilla obtenida exitosamente' })
  findAllPlanillaDet(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllPlanillaDet(empresaId);
  }

  @Get('planilla-det/:id')
  @ApiOperation({ summary: 'Obtener detalle de planilla por ID' })
  @ApiResponse({ status: 200, description: 'Detalle de planilla encontrado' })
  @ApiResponse({ status: 404, description: 'Detalle de planilla no encontrado' })
  findPlanillaDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findPlanillaDet(id, empresaId);
  }

  @Post('planilla-det')
  @ApiOperation({ summary: 'Crear detalle de planilla' })
  @ApiResponse({ status: 201, description: 'Detalle de planilla creado exitosamente' })
  createPlanillaDet(@Body() dto: CreatePlPlaDetDto, @CurrentUser() user: any) {
    return this.service.createPlanillaDet(dto, user.usuario);
  }

  @Put('planilla-det/:id')
  @ApiOperation({ summary: 'Actualizar detalle de planilla' })
  @ApiResponse({ status: 200, description: 'Detalle de planilla actualizado exitosamente' })
  updatePlanillaDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdatePlPlaDetDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updatePlanillaDet(id, empresaId, dto, user.usuario);
  }

  @Get('puestos')
  @ApiOperation({ summary: 'Listar puestos' })
  @ApiResponse({ status: 200, description: 'Lista de puestos obtenida exitosamente' })
  findAllPuestos(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllPuestos(empresaId);
  }

  @Get('puestos/:id')
  @ApiOperation({ summary: 'Obtener puesto por ID' })
  @ApiResponse({ status: 200, description: 'Puesto encontrado' })
  @ApiResponse({ status: 404, description: 'Puesto no encontrado' })
  findPuesto(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findPuesto(id, empresaId);
  }

  @Post('puestos')
  @ApiOperation({ summary: 'Crear puesto' })
  @ApiResponse({ status: 201, description: 'Puesto creado exitosamente' })
  createPuesto(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createPuesto(dto, user.usuario);
  }

  @Put('puestos/:id')
  @ApiOperation({ summary: 'Actualizar puesto' })
  @ApiResponse({ status: 200, description: 'Puesto actualizado exitosamente' })
  updatePuesto(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updatePuesto(id, empresaId, dto, user.usuario);
  }

  @Get('profesiones')
  @ApiOperation({ summary: 'Listar profesiones' })
  @ApiResponse({ status: 200, description: 'Lista de profesiones obtenida exitosamente' })
  findAllProfesiones(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllProfesiones(empresaId);
  }

  @Get('profesiones/:id')
  @ApiOperation({ summary: 'Obtener profesión por ID' })
  @ApiResponse({ status: 200, description: 'Profesión encontrada' })
  @ApiResponse({ status: 404, description: 'Profesión no encontrada' })
  findProfesion(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findProfesion(id, empresaId);
  }

  @Post('profesiones')
  @ApiOperation({ summary: 'Crear profesión' })
  @ApiResponse({ status: 201, description: 'Profesión creada exitosamente' })
  createProfesion(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createProfesion(dto, user.usuario);
  }

  @Put('profesiones/:id')
  @ApiOperation({ summary: 'Actualizar profesión' })
  @ApiResponse({ status: 200, description: 'Profesión actualizada exitosamente' })
  updateProfesion(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateProfesion(id, empresaId, dto, user.usuario);
  }

  @Get('deducciones')
  @ApiOperation({ summary: 'Listar deducciones' })
  @ApiResponse({ status: 200, description: 'Lista de deducciones obtenida exitosamente' })
  findAllDeducciones(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllDeducciones(empresaId);
  }

  @Get('deducciones/:id')
  @ApiOperation({ summary: 'Obtener deducción por ID' })
  @ApiResponse({ status: 200, description: 'Deducción encontrada' })
  @ApiResponse({ status: 404, description: 'Deducción no encontrada' })
  findDeduccion(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findDeduccion(id, empresaId);
  }

  @Post('deducciones')
  @ApiOperation({ summary: 'Crear deducción' })
  @ApiResponse({ status: 201, description: 'Deducción creada exitosamente' })
  createDeduccion(@Body() dto: CreateTplDeduccionesDto, @CurrentUser() user: any) {
    return this.service.createDeduccion(dto, user.usuario);
  }

  @Put('deducciones/:id')
  @ApiOperation({ summary: 'Actualizar deducción' })
  @ApiResponse({ status: 200, description: 'Deducción actualizada exitosamente' })
  updateDeduccion(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateTplDeduccionesDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateDeduccion(id, empresaId, dto, user.usuario);
  }

  @Get('ingresos')
  @ApiOperation({ summary: 'Listar ingresos' })
  @ApiResponse({ status: 200, description: 'Lista de ingresos obtenida exitosamente' })
  findAllIngresos(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllIngresos(empresaId);
  }

  @Get('ingresos/:id')
  @ApiOperation({ summary: 'Obtener ingreso por ID' })
  @ApiResponse({ status: 200, description: 'Ingreso encontrado' })
  @ApiResponse({ status: 404, description: 'Ingreso no encontrado' })
  findIngreso(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findIngreso(id, empresaId);
  }

  @Post('ingresos')
  @ApiOperation({ summary: 'Crear ingreso' })
  @ApiResponse({ status: 201, description: 'Ingreso creado exitosamente' })
  createIngreso(@Body() dto: CreateTplIngresosDto, @CurrentUser() user: any) {
    return this.service.createIngreso(dto, user.usuario);
  }

  @Put('ingresos/:id')
  @ApiOperation({ summary: 'Actualizar ingreso' })
  @ApiResponse({ status: 200, description: 'Ingreso actualizado exitosamente' })
  updateIngreso(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateTplIngresosDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateIngreso(id, empresaId, dto, user.usuario);
  }
}

```

---

## 📄 src\modules\planilla\planilla.module.ts

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlPlEmpleados } from './entities/plplempleados.entity';
import { PlEtits } from './entities/pletitulaciones.entity';
import { PlAsistencia } from './entities/pleasistencia.entity';
import { PlCertificaciones } from './entities/plecertificaciones.entity';
import { PlComisiones } from './entities/plecomisiones.entity';
import { PlDeducciones } from './entities/plededucciones.entity';
import { PlPlaMae } from './entities/pleplamae.entity';
import { PlPlaDet } from './entities/plepladet.entity';
import { TplPuestos } from './entities/tplpuestos.entity';
import { TplProfesiones } from './entities/tplprofesiones.entity';
import { TplDeducciones } from './entities/tpldeducciones.entity';
import { TplIngresos } from './entities/tplingresos.entity';
import { PlanillaService } from './planilla.service';
import { PlanillaController } from './planilla.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PlPlEmpleados,
      PlEtits,
      PlAsistencia,
      PlCertificaciones,
      PlComisiones,
      PlDeducciones,
      PlPlaMae,
      PlPlaDet,
      TplPuestos,
      TplProfesiones,
      TplDeducciones,
      TplIngresos,
    ]),
  ],
  controllers: [PlanillaController],
  providers: [PlanillaService],
  exports: [PlanillaService],
})
export class PlanillaModule {}

```

---

## 📄 src\modules\planilla\planilla.service.ts

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ObjectLiteral } from 'typeorm';
import { PlPlEmpleados } from './entities/plplempleados.entity';
import { PlEtits } from './entities/pletitulaciones.entity';
import { PlAsistencia } from './entities/pleasistencia.entity';
import { PlCertificaciones } from './entities/plecertificaciones.entity';
import { PlComisiones } from './entities/plecomisiones.entity';
import { PlDeducciones } from './entities/plededucciones.entity';
import { PlPlaMae } from './entities/pleplamae.entity';
import { PlPlaDet } from './entities/plepladet.entity';
import { TplPuestos } from './entities/tplpuestos.entity';
import { TplProfesiones } from './entities/tplprofesiones.entity';
import { TplDeducciones } from './entities/tpldeducciones.entity';
import { TplIngresos } from './entities/tplingresos.entity';
import { CreatePlEmpleadosDto, UpdatePlEmpleadosDto } from './dto/plplempleados.dto';
import { CreatePlPlaMaeDto, UpdatePlPlaMaeDto } from './dto/pleplamae.dto';
import { CreatePlPlaDetDto, UpdatePlPlaDetDto } from './dto/plepladet.dto';
import { CreateTplDeduccionesDto, UpdateTplDeduccionesDto } from './dto/tpldeducciones.dto';
import { CreateTplIngresosDto, UpdateTplIngresosDto } from './dto/tplingresos.dto';

@Injectable()
export class PlanillaService {
  constructor(
    @InjectRepository(PlPlEmpleados) private readonly empleadoRepo: Repository<PlPlEmpleados>,
    @InjectRepository(PlEtits) private readonly etitulacionRepo: Repository<PlEtits>,
    @InjectRepository(PlAsistencia) private readonly asistenciaRepo: Repository<PlAsistencia>,
    @InjectRepository(PlCertificaciones) private readonly certificacionRepo: Repository<PlCertificaciones>,
    @InjectRepository(PlComisiones) private readonly comisionRepo: Repository<PlComisiones>,
    @InjectRepository(PlDeducciones) private readonly deduccionEmpRepo: Repository<PlDeducciones>,
    @InjectRepository(PlPlaMae) private readonly plamaeRepo: Repository<PlPlaMae>,
    @InjectRepository(PlPlaDet) private readonly pladetRepo: Repository<PlPlaDet>,
    @InjectRepository(TplPuestos) private readonly puestoRepo: Repository<TplPuestos>,
    @InjectRepository(TplProfesiones) private readonly profesionRepo: Repository<TplProfesiones>,
    @InjectRepository(TplDeducciones) private readonly deduccionRepo: Repository<TplDeducciones>,
    @InjectRepository(TplIngresos) private readonly ingresoRepo: Repository<TplIngresos>,
  ) {}

  private async findAllByEmpresa<T extends ObjectLiteral>(repo: Repository<T>, empresaId: number) {
    return repo.find({
      where: { empresaId } as unknown as FindOptionsWhere<T>,
    });
  }

  private async findAllByEmpresaOrder<T extends ObjectLiteral>(
    repo: Repository<T>,
    empresaId: number,
    orderField: string,
    direction: 'ASC' | 'DESC' = 'DESC',
  ) {
    return repo.find({
      where: { empresaId } as unknown as FindOptionsWhere<T>,
      order: { [orderField]: direction } as any,
    });
  }

  private async findOneById<T extends ObjectLiteral>(
    repo: Repository<T>,
    idField: string,
    id: number | string,
    empresaId: number,
    entityName: string,
  ) {
    const where = { [idField]: id, empresaId } as unknown as FindOptionsWhere<T>;
    const found = await repo.findOne({ where });
    if (!found) throw new NotFoundException(`${entityName} ${id} no encontrado`);
    return found;
  }

  private async createEntity<T extends ObjectLiteral>(
    repo: Repository<T>,
    dto: any,
    currentUser: string,
  ) {
    const entity = repo.create({
      ...dto,
      usuarioCreated: currentUser,
    });
    return repo.save(entity);
  }

  private async updateEntity<T extends ObjectLiteral>(
    repo: Repository<T>,
    idField: string,
    id: number | string,
    empresaId: number,
    dto: any,
    currentUser: string,
    entityName: string,
  ) {
    const entity = await this.findOneById(repo, idField, id, empresaId, entityName);
    Object.assign(entity, dto, {
      usuarioUpdated: currentUser,
      fechaUpdated: new Date(),
    });
    return repo.save(entity);
  }

  private async softDelete<T extends ObjectLiteral>(
    repo: Repository<T>,
    idField: string,
    id: number | string,
    empresaId: number,
    entityName: string,
  ) {
    const entity = await this.findOneById(repo, idField, id, empresaId, entityName);
    Object.assign(entity, {
      sn_activo: 'N',
      fechaUpdated: new Date(),
    });
    return repo.save(entity);
  }

  async findAllEmpleados(empresaId: number) {
    return this.findAllByEmpresa(this.empleadoRepo, empresaId);
  }

  async findEmpleado(empleadoId: number, empresaId: number) {
    return this.findOneById(this.empleadoRepo, 'empleadoId', empleadoId, empresaId, 'Empleado');
  }

  async createEmpleado(dto: CreatePlEmpleadosDto, currentUser: string) {
    return this.createEntity(this.empleadoRepo, dto, currentUser);
  }

  async updateEmpleado(empleadoId: number, empresaId: number, dto: UpdatePlEmpleadosDto, currentUser: string) {
    return this.updateEntity(this.empleadoRepo, 'empleadoId', empleadoId, empresaId, dto, currentUser, 'Empleado');
  }

  async removeEmpleado(empleadoId: number, empresaId: number) {
    return this.softDelete(this.empleadoRepo, 'empleadoId', empleadoId, empresaId, 'Empleado');
  }

  async findAllTitulaciones(empresaId: number) {
    return this.findAllByEmpresa(this.etitulacionRepo, empresaId);
  }

  async findTitulacion(emptitulacionId: number, empresaId: number) {
    return this.findOneById(this.etitulacionRepo, 'emptitulacionId', emptitulacionId, empresaId, 'Titulacion');
  }

  async createTitulacion(dto: any, currentUser: string) {
    return this.createEntity(this.etitulacionRepo, dto, currentUser);
  }

  async updateTitulacion(emptitulacionId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.etitulacionRepo, 'emptitulacionId', emptitulacionId, empresaId, dto, currentUser, 'Titulacion');
  }

  async removeTitulacion(emptitulacionId: number, empresaId: number) {
    return this.softDelete(this.etitulacionRepo, 'emptitulacionId', emptitulacionId, empresaId, 'Titulacion');
  }

  async findAllAsistencia(empresaId: number) {
    return this.findAllByEmpresaOrder(this.asistenciaRepo, empresaId, 'fecharegistro', 'DESC');
  }

  async findAsistencia(plempleadosasistenciaId: number, empresaId: number) {
    return this.findOneById(this.asistenciaRepo, 'plempleadosasistenciaId', plempleadosasistenciaId, empresaId, 'Asistencia');
  }

  async createAsistencia(dto: any, currentUser: string) {
    return this.createEntity(this.asistenciaRepo, dto, currentUser);
  }

  async updateAsistencia(plempleadosasistenciaId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.asistenciaRepo, 'plempleadosasistenciaId', plempleadosasistenciaId, empresaId, dto, currentUser, 'Asistencia');
  }

  async findAllCertificaciones(empresaId: number) {
    return this.findAllByEmpresa(this.certificacionRepo, empresaId);
  }

  async findCertificacion(empcertificacionId: number, empresaId: number) {
    return this.findOneById(this.certificacionRepo, 'empcertificacionId', empcertificacionId, empresaId, 'Certificacion');
  }

  async createCertificacion(dto: any, currentUser: string) {
    return this.createEntity(this.certificacionRepo, dto, currentUser);
  }

  async updateCertificacion(empcertificacionId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.certificacionRepo, 'empcertificacionId', empcertificacionId, empresaId, dto, currentUser, 'Certificacion');
  }

  async removeCertificacion(empcertificacionId: number, empresaId: number) {
    return this.softDelete(this.certificacionRepo, 'empcertificacionId', empcertificacionId, empresaId, 'Certificacion');
  }

  async findAllComisiones(empresaId: number) {
    return this.findAllByEmpresa(this.comisionRepo, empresaId);
  }

  async findComision(emplcomId: number, empresaId: number) {
    return this.findOneById(this.comisionRepo, 'emplcomId', emplcomId, empresaId, 'Comision');
  }

  async createComision(dto: any, currentUser: string) {
    return this.createEntity(this.comisionRepo, dto, currentUser);
  }

  async updateComision(emplcomId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.comisionRepo, 'emplcomId', emplcomId, empresaId, dto, currentUser, 'Comision');
  }

  async removeComision(emplcomId: number, empresaId: number) {
    return this.softDelete(this.comisionRepo, 'emplcomId', emplcomId, empresaId, 'Comision');
  }

  async findAllDeduccionesEmp(empresaId: number) {
    return this.findAllByEmpresa(this.deduccionEmpRepo, empresaId);
  }

  async findDeduccionEmp(empdeduccionId: number, empresaId: number) {
    return this.findOneById(this.deduccionEmpRepo, 'empdeduccionId', empdeduccionId, empresaId, 'Deduccion Empleado');
  }

  async createDeduccionEmp(dto: any, currentUser: string) {
    return this.createEntity(this.deduccionEmpRepo, dto, currentUser);
  }

  async updateDeduccionEmp(empdeduccionId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.deduccionEmpRepo, 'empdeduccionId', empdeduccionId, empresaId, dto, currentUser, 'Deduccion Empleado');
  }

  async removeDeduccionEmp(empdeduccionId: number, empresaId: number) {
    return this.softDelete(this.deduccionEmpRepo, 'empdeduccionId', empdeduccionId, empresaId, 'Deduccion Empleado');
  }

  async findAllPlanillas(empresaId: number) {
    return this.findAllByEmpresaOrder(this.plamaeRepo, empresaId, 'fecharegistro', 'DESC');
  }

  async findPlanilla(planillaId: number, empresaId: number) {
    return this.findOneById(this.plamaeRepo, 'planillaId', planillaId, empresaId, 'Planilla');
  }

  async createPlanilla(dto: CreatePlPlaMaeDto, currentUser: string) {
    return this.createEntity(this.plamaeRepo, dto, currentUser);
  }

  async updatePlanilla(planillaId: number, empresaId: number, dto: UpdatePlPlaMaeDto, currentUser: string) {
    return this.updateEntity(this.plamaeRepo, 'planillaId', planillaId, empresaId, dto, currentUser, 'Planilla');
  }

  async findAllPlanillaDet(empresaId: number) {
    return this.findAllByEmpresa(this.pladetRepo, empresaId);
  }

  async findPlanillaDet(plepladetId: number, empresaId: number) {
    return this.findOneById(this.pladetRepo, 'plepladetId', plepladetId, empresaId, 'Detalle Planilla');
  }

  async createPlanillaDet(dto: CreatePlPlaDetDto, currentUser: string) {
    return this.createEntity(this.pladetRepo, dto, currentUser);
  }

  async updatePlanillaDet(plepladetId: number, empresaId: number, dto: UpdatePlPlaDetDto, currentUser: string) {
    return this.updateEntity(this.pladetRepo, 'plepladetId', plepladetId, empresaId, dto, currentUser, 'Detalle Planilla');
  }

  async findAllPuestos(empresaId: number) {
    return this.findAllByEmpresa(this.puestoRepo, empresaId);
  }

  async findPuesto(puestosId: number, empresaId: number) {
    return this.findOneById(this.puestoRepo, 'puestosId', puestosId, empresaId, 'Puesto');
  }

  async createPuesto(dto: any, currentUser: string) {
    return this.createEntity(this.puestoRepo, dto, currentUser);
  }

  async updatePuesto(puestosId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.puestoRepo, 'puestosId', puestosId, empresaId, dto, currentUser, 'Puesto');
  }

  async findAllProfesiones(empresaId: number) {
    return this.findAllByEmpresa(this.profesionRepo, empresaId);
  }

  async findProfesion(profesionId: number, empresaId: number) {
    return this.findOneById(this.profesionRepo, 'profesionId', profesionId, empresaId, 'Profesion');
  }

  async createProfesion(dto: any, currentUser: string) {
    return this.createEntity(this.profesionRepo, dto, currentUser);
  }

  async updateProfesion(profesionId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.profesionRepo, 'profesionId', profesionId, empresaId, dto, currentUser, 'Profesion');
  }

  async removeProfesion(profesionId: number, empresaId: number) {
    return this.softDelete(this.profesionRepo, 'profesionId', profesionId, empresaId, 'Profesion');
  }

  async findAllDeducciones(empresaId: number) {
    return this.findAllByEmpresa(this.deduccionRepo, empresaId);
  }

  async findDeduccion(deduccioneId: number, empresaId: number) {
    return this.findOneById(this.deduccionRepo, 'deduccioneId', deduccioneId, empresaId, 'Deduccion');
  }

  async createDeduccion(dto: CreateTplDeduccionesDto, currentUser: string) {
    return this.createEntity(this.deduccionRepo, dto, currentUser);
  }

  async updateDeduccion(deduccioneId: number, empresaId: number, dto: UpdateTplDeduccionesDto, currentUser: string) {
    return this.updateEntity(this.deduccionRepo, 'deduccioneId', deduccioneId, empresaId, dto, currentUser, 'Deduccion');
  }

  async removeDeduccion(deduccioneId: number, empresaId: number) {
    return this.softDelete(this.deduccionRepo, 'deduccioneId', deduccioneId, empresaId, 'Deduccion');
  }

  async findAllIngresos(empresaId: number) {
    return this.findAllByEmpresa(this.ingresoRepo, empresaId);
  }

  async findIngreso(tingresoId: number, empresaId: number) {
    return this.findOneById(this.ingresoRepo, 'tingresoId', tingresoId, empresaId, 'Ingreso');
  }

  async createIngreso(dto: CreateTplIngresosDto, currentUser: string) {
    return this.createEntity(this.ingresoRepo, dto, currentUser);
  }

  async updateIngreso(tingresoId: number, empresaId: number, dto: UpdateTplIngresosDto, currentUser: string) {
    return this.updateEntity(this.ingresoRepo, 'tingresoId', tingresoId, empresaId, dto, currentUser, 'Ingreso');
  }

  async removeIngreso(tingresoId: number, empresaId: number) {
    return this.softDelete(this.ingresoRepo, 'tingresoId', tingresoId, empresaId, 'Ingreso');
  }
}

```

---

## 📄 src\modules\sucursales\dto\sucursal.dto.ts

```typescript
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSucursalDto {
  @ApiProperty({ description: 'Nombre de la sucursal' })
  @IsString() @IsNotEmpty()
  descripcion: string;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdateSucursalDto {
  @ApiProperty({ required: false, description: 'Nombre de la sucursal' })
  @IsString() @IsOptional()
  descripcion?: string;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Estado activo' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;
}

```

---

## 📄 src\modules\sucursales\entities\sucursal.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Tempresas } from '../../companies/entities/empresa.entity';

@Entity('tsucursal')
export class Tsucursal {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'Idsucursal' })
  idsucursal: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;

  @ApiProperty({ type: () => Tempresas, required: false })
  @ManyToOne(() => Tempresas, (e) => e.sucursales)
  @JoinColumn({ name: 'empresaId' })
  empresa: Tempresas;
}

```

---

## 📄 src\modules\sucursales\sucursales.controller.ts

```typescript
import {
  Controller, Get, Post, Put, Body, Param, Query,
  UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SucursalesService } from './sucursales.service';
import { CreateSucursalDto, UpdateSucursalDto } from './dto/sucursal.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Sucursales')
@ApiBearerAuth()
@Controller('sucursales')
@UseGuards(JwtAuthGuard)
export class SucursalesController {
  constructor(private readonly service: SucursalesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar sucursales' })
  @ApiResponse({ status: 200, description: 'Lista de sucursales obtenida exitosamente' })
  findAll(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAll(empresaId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener sucursal por ID' })
  @ApiResponse({ status: 200, description: 'Sucursal encontrada' })
  @ApiResponse({ status: 404, description: 'Sucursal no encontrada' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findOne(id, empresaId);
  }

  @Post()
  @ApiOperation({ summary: 'Crear sucursal' })
  @ApiResponse({ status: 201, description: 'Sucursal creada exitosamente' })
  create(@Body() dto: CreateSucursalDto, @CurrentUser() user: any) {
    return this.service.create(dto, user.usuario);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar sucursal' })
  @ApiResponse({ status: 200, description: 'Sucursal actualizada exitosamente' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateSucursalDto,
    @CurrentUser() user: any,
  ) {
    return this.service.update(id, empresaId, dto, user.usuario);
  }
}

```

---

## 📄 src\modules\sucursales\sucursales.module.ts

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tsucursal } from './entities/sucursal.entity';
import { SucursalesService } from './sucursales.service';
import { SucursalesController } from './sucursales.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Tsucursal])],
  controllers: [SucursalesController],
  providers: [SucursalesService],
  exports: [SucursalesService],
})
export class SucursalesModule {}

```

---

## 📄 src\modules\sucursales\sucursales.service.ts

```typescript
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tsucursal } from './entities/sucursal.entity';
import { CreateSucursalDto, UpdateSucursalDto } from './dto/sucursal.dto';

@Injectable()
export class SucursalesService {
  constructor(
    @InjectRepository(Tsucursal)
    private readonly repo: Repository<Tsucursal>,
  ) {}

  async findAll(empresaId: number) {
    return this.repo.find({
      where: { empresaId },
      order: { descripcion: 'ASC' },
    });
  }

  async findOne(idsucursal: number, empresaId: number) {
    const found = await this.repo.findOne({ where: { idsucursal, empresaId } });
    if (!found) throw new NotFoundException(`Sucursal ${idsucursal} no encontrada`);
    return found;
  }

  async create(dto: CreateSucursalDto, currentUser: string) {
    const entity = this.repo.create({
      ...dto,
      usuarioCreated: currentUser,
    });
    return this.repo.save(entity);
  }

  async update(idsucursal: number, empresaId: number, dto: UpdateSucursalDto, currentUser: string) {
    const entity = await this.findOne(idsucursal, empresaId);
    Object.assign(entity, dto, {
      usuarioUpdated: currentUser,
      fechaUpdated: new Date(),
    });
    return this.repo.save(entity);
  }
}

```

---

## 📄 src\modules\users\dto\usuario-modauth.dto.ts

```typescript
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUsuarioModAuthDto {
  @ApiProperty({ description: 'Usuario' })
  @IsString() @IsNotEmpty()
  usuario: string;

  @ApiProperty({ description: 'Descripción', required: false })
  @IsString() @IsOptional()
  descripcion?: string;

  @ApiProperty({ description: 'Autoriza Devoluciones', enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_auth_devoluciones?: string;

  @ApiProperty({ description: 'Autoriza Reversión', enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_auth_reversion?: string;

  @ApiProperty({ description: 'Autoriza Anulaciones', enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_auth_anulaciones?: string;

  @ApiProperty({ description: 'Autoriza Facturación', enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_auth_facturacion?: string;

  @ApiProperty({ description: 'Autoriza Contabilizar', enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_auth_contabilizar?: string;

  @ApiProperty({ description: 'Fecha Operativa', required: false })
  @IsDateString() @IsOptional()
  fechaoperativa?: string;

  @ApiProperty({ description: 'ID de Empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdateUsuarioModAuthDto {
  @ApiProperty({ description: 'Descripción', required: false })
  @IsString() @IsOptional()
  descripcion?: string;

  @ApiProperty({ description: 'Autoriza Devoluciones', enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_auth_devoluciones?: string;

  @ApiProperty({ description: 'Autoriza Reversión', enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_auth_reversion?: string;

  @ApiProperty({ description: 'Autoriza Anulaciones', enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_auth_anulaciones?: string;

  @ApiProperty({ description: 'Autoriza Facturación', enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_auth_facturacion?: string;

  @ApiProperty({ description: 'Autoriza Contabilizar', enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_auth_contabilizar?: string;

  @ApiProperty({ description: 'Fecha Operativa', required: false })
  @IsDateString() @IsOptional()
  fechaoperativa?: string;
}

```

---

## 📄 src\modules\users\dto\usuario.dto.ts

```typescript
import { IsString, IsNotEmpty, IsOptional, IsEmail, IsEnum, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUsuarioDto {
  @ApiProperty({ description: 'Usuario' })
  @IsString() @IsNotEmpty()
  usuario: string;

  @ApiProperty({ description: 'Nombre' })
  @IsString() @IsNotEmpty()
  nombre: string;

  @ApiProperty({ description: 'Contraseña' })
  @IsString() @IsNotEmpty()
  password: string;

  @ApiProperty({ description: 'Email' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'ID de Sucursal' })
  @IsNumber()
  Idsucursal: number;

  @ApiProperty({ description: 'ID de Empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdateUsuarioDto {
  @ApiProperty({ description: 'Nombre', required: false })
  @IsString() @IsOptional()
  nombre?: string;

  @ApiProperty({ description: 'Contraseña', required: false })
  @IsString() @IsOptional()
  password?: string;

  @ApiProperty({ description: 'Email', required: false })
  @IsEmail() @IsOptional()
  email?: string;

  @ApiProperty({ description: 'Activo', enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;

  @ApiProperty({ description: 'ID de Sucursal', required: false })
  @IsNumber() @IsOptional()
  Idsucursal?: number;
}

```

---

## 📄 src\modules\users\dto\usuarios-mnuitem.dto.ts

```typescript
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUsuarioMnuItemDto {
  @ApiProperty({ description: 'ID de Empresa' })
  @IsNumber()
  empresaId: number;

  @ApiProperty({ description: 'ID de Módulo' })
  @IsNumber()
  moduloId: number;

  @ApiProperty({ description: 'Usuario' })
  @IsString() @IsNotEmpty()
  usuario: string;

  @ApiProperty({ description: 'Parent' })
  @IsNumber()
  parent: number;

  @ApiProperty({ description: 'Parent ID' })
  @IsNumber()
  parentId: number;

  @ApiProperty({ description: 'Nivel' })
  @IsNumber()
  levelId: number;

  @ApiProperty({ description: 'Nombre del Parent' })
  @IsString() @IsNotEmpty()
  nameParent: string;

  @ApiProperty({ description: 'Nombre del Item' })
  @IsString() @IsNotEmpty()
  nameItem: string;

  @ApiProperty({ description: 'Label del Item' })
  @IsString() @IsNotEmpty()
  labelItem: string;

  @ApiProperty({ description: 'Icono del Item', required: false })
  @IsString() @IsOptional()
  iconItem?: string;

  @ApiProperty({ description: 'Router Link', required: false })
  @IsString() @IsOptional()
  routerLink?: string;

  @ApiProperty({ description: 'Activo', enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;
}

export class UpdateUsuarioMnuItemDto {
  @ApiProperty({ description: 'Parent', required: false })
  @IsNumber() @IsOptional()
  parent?: number;

  @ApiProperty({ description: 'Parent ID', required: false })
  @IsNumber() @IsOptional()
  parentId?: number;

  @ApiProperty({ description: 'Nivel', required: false })
  @IsNumber() @IsOptional()
  levelId?: number;

  @ApiProperty({ description: 'Nombre del Parent', required: false })
  @IsString() @IsOptional()
  nameParent?: string;

  @ApiProperty({ description: 'Nombre del Item', required: false })
  @IsString() @IsOptional()
  nameItem?: string;

  @ApiProperty({ description: 'Label del Item', required: false })
  @IsString() @IsOptional()
  labelItem?: string;

  @ApiProperty({ description: 'Icono del Item', required: false })
  @IsString() @IsOptional()
  iconItem?: string;

  @ApiProperty({ description: 'Router Link', required: false })
  @IsString() @IsOptional()
  routerLink?: string;

  @ApiProperty({ description: 'Activo', enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;
}

```

---

## 📄 src\modules\users\dto\usuarios-module.dto.ts

```typescript
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUsuariosModuleDto {
  @ApiProperty({ description: 'ID de Empresa' })
  @IsNumber()
  empresaId: number;

  @ApiProperty({ description: 'ID de Módulo' })
  @IsNumber()
  moduloId: number;

  @ApiProperty({ description: 'Usuario' })
  @IsString() @IsNotEmpty()
  usuario: string;

  @ApiProperty({ description: 'Activo', enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;

  @ApiProperty({ description: 'Submenú Datos', enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  submnudatos?: string;

  @ApiProperty({ description: 'Submenú Procesos', enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  submnurocesos?: string;

  @ApiProperty({ description: 'Submenú Exportes', enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  submnueportes?: string;
}

export class UpdateUsuariosModuleDto {
  @ApiProperty({ description: 'Activo', enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;

  @ApiProperty({ description: 'Submenú Datos', enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  submnudatos?: string;

  @ApiProperty({ description: 'Submenú Procesos', enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  submnurocesos?: string;

  @ApiProperty({ description: 'Submenú Exportes', enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  submnueportes?: string;
}

```

---

## 📄 src\modules\users\dto\usuarios-scripts.dto.ts

```typescript
import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUsuariosScriptsDto {
  @ApiProperty({ description: 'Usuario' })
  @IsString() @IsNotEmpty()
  usuario: string;

  @ApiProperty({ description: 'Script' })
  @IsString() @IsNotEmpty()
  script: string;

  @ApiProperty({ description: 'ID de Empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdateUsuariosScriptsDto {
  @ApiProperty({ description: 'Script', required: false })
  @IsString() @IsOptional()
  script?: string;
}

```

---

## 📄 src\modules\users\entities\usuario-modauth.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('usuariomodauth')
export class UsuarioModAuth {
  @PrimaryGeneratedColumn()
  usuariomodauthId: number;

  @Column({ type: 'varchar', length: 12 })
  usuario: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  descripcion: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_auth_devoluciones: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_auth_reversion: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_auth_anulaciones: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_auth_facturacion: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_auth_contabilizar: string;

  @Column({ type: 'datetime', nullable: true })
  fechaoperativa: Date;

  @Column({ type: 'int' })
  empresaId: number;

  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\users\entities\usuario.entity.ts

```typescript
import {
  Entity, PrimaryColumn, Column, ManyToOne, JoinColumn,
} from 'typeorm';
import { Tempresas } from '../../companies/entities/empresa.entity';
import { Tsucursal } from '../../sucursales/entities/sucursal.entity';

@Entity('tusuarios')
export class Tusuarios {
  @PrimaryColumn({ type: 'varchar', length: 12 })
  usuario: string;

  @Column({ type: 'int', unique: true })
  usuarioId: number;

  @Column({ type: 'varchar', length: 80 })
  nombre: string;

  @Column({ type: 'varchar', length: 12 })
  password: string;

  @Column({ type: 'varchar', length: 20 })
  email: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @Column({ type: 'int' })
  Idsucursal: number;

  @Column({ type: 'int' })
  empresaId: number;

  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;

  @ManyToOne(() => Tempresas, (e) => e.usuarios)
  @JoinColumn({ name: 'empresaId' })
  empresa: Tempresas;

  @ManyToOne(() => Tsucursal)
  @JoinColumn({ name: 'Idsucursal' })
  sucursal: Tsucursal;
}

```

---

## 📄 src\modules\users\entities\usuarios-mnuitem.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('tusuariomnuitem')
export class TusuarioMnuItem {
  @PrimaryGeneratedColumn()
  tusuariomnuitemsId: number;

  @Column({ type: 'int' })
  empresaId: number;

  @Column({ type: 'int' })
  moduloId: number;

  @Column({ type: 'varchar', length: 12 })
  usuario: string;

  @Column({ type: 'int' })
  parent: number;

  @Column({ type: 'int' })
  parentId: number;

  @Column({ type: 'int' })
  levelId: number;

  @Column({ type: 'varchar', length: 50 })
  nameParent: string;

  @Column({ type: 'varchar', length: 50 })
  nameItem: string;

  @Column({ type: 'varchar', length: 50 })
  labelItem: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  iconItem: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  routerLink: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\users\entities\usuarios-module.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('tusuariosmodule')
export class TusuariosModule {
  @PrimaryGeneratedColumn()
  tusuariosmoduloId: number;

  @Column({ type: 'int' })
  empresaId: number;

  @Column({ type: 'int' })
  moduloId: number;

  @Column({ type: 'varchar', length: 12 })
  usuario: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  submnudatos: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  submnurocesos: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  submnueportes: string;

  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\users\entities\usuarios-scripts.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('tusuariosscripts')
export class TusuariosScripts {
  @PrimaryGeneratedColumn()
  tusuarioscriptsId: number;

  @Column({ type: 'varchar', length: 12 })
  usuario: string;

  @Column({ type: 'varchar', length: 15 })
  script: string;

  @Column({ type: 'int' })
  empresaId: number;

  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\users\users.controller.ts

```typescript
import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUsuarioDto, UpdateUsuarioDto } from './dto/usuario.dto';
import { CreateUsuariosModuleDto, UpdateUsuariosModuleDto } from './dto/usuarios-module.dto';
import { CreateUsuarioMnuItemDto, UpdateUsuarioMnuItemDto } from './dto/usuarios-mnuitem.dto';
import { CreateUsuariosScriptsDto, UpdateUsuariosScriptsDto } from './dto/usuarios-scripts.dto';
import { CreateUsuarioModAuthDto, UpdateUsuarioModAuthDto } from './dto/usuario-modauth.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Usuarios')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly service: UsersService) {}

  // ===== Usuarios =====

  @Get()
  @ApiOperation({ summary: 'Listar usuarios' })
  @ApiResponse({ status: 200, description: 'Lista de usuarios obtenida exitosamente' })
  findAll(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAll(empresaId);
  }

  @Get(':usuario')
  @ApiOperation({ summary: 'Obtener usuario por ID' })
  @ApiResponse({ status: 200, description: 'Usuario encontrado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  findOne(
    @Param('usuario') usuario: string,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findOne(usuario, empresaId);
  }

  @Post()
  @ApiOperation({ summary: 'Crear usuario' })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente' })
  create(@Body() dto: CreateUsuarioDto, @CurrentUser() user: any) {
    return this.service.create(dto, user.usuario);
  }

  @Put(':usuario')
  @ApiOperation({ summary: 'Actualizar usuario' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado exitosamente' })
  update(
    @Param('usuario') usuario: string,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateUsuarioDto,
    @CurrentUser() user: any,
  ) {
    return this.service.update(usuario, empresaId, dto, user.usuario);
  }

  // ===== UsuariosModule =====

  @Get('modules')
  @ApiOperation({ summary: 'Listar módulos de usuario' })
  @ApiResponse({ status: 200, description: 'Lista de módulos de usuario obtenida exitosamente' })
  findAllModules(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllModules(empresaId);
  }

  @Get('modules/:id')
  @ApiOperation({ summary: 'Obtener módulo de usuario por ID' })
  @ApiResponse({ status: 200, description: 'Módulo de usuario encontrado' })
  @ApiResponse({ status: 404, description: 'Módulo de usuario no encontrado' })
  findModule(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findModule(id, empresaId);
  }

  @Post('modules')
  @ApiOperation({ summary: 'Crear módulo de usuario' })
  @ApiResponse({ status: 201, description: 'Módulo de usuario creado exitosamente' })
  createModule(@Body() dto: CreateUsuariosModuleDto, @CurrentUser() user: any) {
    return this.service.createModule(dto, user.usuario);
  }

  @Put('modules/:id')
  @ApiOperation({ summary: 'Actualizar módulo de usuario' })
  @ApiResponse({ status: 200, description: 'Módulo de usuario actualizado exitosamente' })
  updateModule(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateUsuariosModuleDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateModule(id, empresaId, dto, user.usuario);
  }

  @Delete('modules/:id')
  @ApiOperation({ summary: 'Eliminar módulo de usuario' })
  @ApiResponse({ status: 200, description: 'Módulo de usuario eliminado exitosamente' })
  removeModule(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeModule(id, empresaId);
  }

  // ===== UsuarioMnuItem =====

  @Get('menu-items')
  @ApiOperation({ summary: 'Listar items de menú de usuario' })
  @ApiResponse({ status: 200, description: 'Lista de items de menú obtenida exitosamente' })
  findAllMnuItems(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllMnuItems(empresaId);
  }

  @Get('menu-items/:id')
  @ApiOperation({ summary: 'Obtener item de menú por ID' })
  @ApiResponse({ status: 200, description: 'Item de menú encontrado' })
  @ApiResponse({ status: 404, description: 'Item de menú no encontrado' })
  findMnuItem(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findMnuItem(id, empresaId);
  }

  @Post('menu-items')
  @ApiOperation({ summary: 'Crear item de menú' })
  @ApiResponse({ status: 201, description: 'Item de menú creado exitosamente' })
  createMnuItem(@Body() dto: CreateUsuarioMnuItemDto, @CurrentUser() user: any) {
    return this.service.createMnuItem(dto, user.usuario);
  }

  @Put('menu-items/:id')
  @ApiOperation({ summary: 'Actualizar item de menú' })
  @ApiResponse({ status: 200, description: 'Item de menú actualizado exitosamente' })
  updateMnuItem(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateUsuarioMnuItemDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateMnuItem(id, empresaId, dto, user.usuario);
  }

  @Delete('menu-items/:id')
  @ApiOperation({ summary: 'Eliminar item de menú' })
  @ApiResponse({ status: 200, description: 'Item de menú eliminado exitosamente' })
  removeMnuItem(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeMnuItem(id, empresaId);
  }

  // ===== UsuariosScripts =====

  @Get('scripts')
  @ApiOperation({ summary: 'Listar scripts de usuario' })
  @ApiResponse({ status: 200, description: 'Lista de scripts obtenida exitosamente' })
  findAllScripts(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllScripts(empresaId);
  }

  @Get('scripts/:id')
  @ApiOperation({ summary: 'Obtener script por ID' })
  @ApiResponse({ status: 200, description: 'Script encontrado' })
  @ApiResponse({ status: 404, description: 'Script no encontrado' })
  findScript(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findScript(id, empresaId);
  }

  @Post('scripts')
  @ApiOperation({ summary: 'Crear script' })
  @ApiResponse({ status: 201, description: 'Script creado exitosamente' })
  createScript(@Body() dto: CreateUsuariosScriptsDto, @CurrentUser() user: any) {
    return this.service.createScript(dto, user.usuario);
  }

  @Put('scripts/:id')
  @ApiOperation({ summary: 'Actualizar script' })
  @ApiResponse({ status: 200, description: 'Script actualizado exitosamente' })
  updateScript(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateUsuariosScriptsDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateScript(id, empresaId, dto, user.usuario);
  }

  @Delete('scripts/:id')
  @ApiOperation({ summary: 'Eliminar script' })
  @ApiResponse({ status: 200, description: 'Script eliminado exitosamente' })
  removeScript(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeScript(id, empresaId);
  }

  // ===== UsuarioModAuth =====

  @Get('mod-auth')
  @ApiOperation({ summary: 'Listar autenticaciones de módulo' })
  @ApiResponse({ status: 200, description: 'Lista de autenticaciones de módulo obtenida exitosamente' })
  findAllModAuth(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllModAuth(empresaId);
  }

  @Get('mod-auth/:id')
  @ApiOperation({ summary: 'Obtener autenticación de módulo por ID' })
  @ApiResponse({ status: 200, description: 'Autenticación de módulo encontrada' })
  @ApiResponse({ status: 404, description: 'Autenticación de módulo no encontrada' })
  findModAuth(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findModAuth(id, empresaId);
  }

  @Post('mod-auth')
  @ApiOperation({ summary: 'Crear autenticación de módulo' })
  @ApiResponse({ status: 201, description: 'Autenticación de módulo creada exitosamente' })
  createModAuth(@Body() dto: CreateUsuarioModAuthDto, @CurrentUser() user: any) {
    return this.service.createModAuth(dto, user.usuario);
  }

  @Put('mod-auth/:id')
  @ApiOperation({ summary: 'Actualizar autenticación de módulo' })
  @ApiResponse({ status: 200, description: 'Autenticación de módulo actualizada exitosamente' })
  updateModAuth(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateUsuarioModAuthDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateModAuth(id, empresaId, dto, user.usuario);
  }

  @Delete('mod-auth/:id')
  @ApiOperation({ summary: 'Eliminar autenticación de módulo' })
  @ApiResponse({ status: 200, description: 'Autenticación de módulo eliminada exitosamente' })
  removeModAuth(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeModAuth(id, empresaId);
  }
}

```

---

## 📄 src\modules\users\users.module.ts

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tusuarios } from './entities/usuario.entity';
import { TusuariosModule } from './entities/usuarios-module.entity';
import { TusuarioMnuItem } from './entities/usuarios-mnuitem.entity';
import { TusuariosScripts } from './entities/usuarios-scripts.entity';
import { UsuarioModAuth } from './entities/usuario-modauth.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [TypeOrmModule.forFeature([
    Tusuarios,
    TusuariosModule,
    TusuarioMnuItem,
    TusuariosScripts,
    UsuarioModAuth,
  ])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}

```

---

## 📄 src\modules\users\users.service.ts

```typescript
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ObjectLiteral } from 'typeorm';
import { Tusuarios } from './entities/usuario.entity';
import { TusuariosModule } from './entities/usuarios-module.entity';
import { TusuarioMnuItem } from './entities/usuarios-mnuitem.entity';
import { TusuariosScripts } from './entities/usuarios-scripts.entity';
import { UsuarioModAuth } from './entities/usuario-modauth.entity';
import { CreateUsuarioDto, UpdateUsuarioDto } from './dto/usuario.dto';
import { CreateUsuariosModuleDto, UpdateUsuariosModuleDto } from './dto/usuarios-module.dto';
import { CreateUsuarioMnuItemDto, UpdateUsuarioMnuItemDto } from './dto/usuarios-mnuitem.dto';
import { CreateUsuariosScriptsDto, UpdateUsuariosScriptsDto } from './dto/usuarios-scripts.dto';
import { CreateUsuarioModAuthDto, UpdateUsuarioModAuthDto } from './dto/usuario-modauth.dto';

const SAFE_COLS: (keyof Tusuarios)[] = [
  'usuario', 'usuarioId', 'nombre', 'email', 'sn_activo',
  'Idsucursal', 'empresaId', 'usuarioCreated', 'usuarioUpdated', 'fechaUpdated',
];

function safeUser(u: Tusuarios) {
  const out: any = {};
  for (const k of SAFE_COLS) out[k] = u[k];
  return out;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Tusuarios)
    private readonly repo: Repository<Tusuarios>,
    @InjectRepository(TusuariosModule)
    private readonly modRepo: Repository<TusuariosModule>,
    @InjectRepository(TusuarioMnuItem)
    private readonly mnuRepo: Repository<TusuarioMnuItem>,
    @InjectRepository(TusuariosScripts)
    private readonly scriptsRepo: Repository<TusuariosScripts>,
    @InjectRepository(UsuarioModAuth)
    private readonly authRepo: Repository<UsuarioModAuth>,
  ) {}

  // ===== Generic helpers =====

  private async findAllByEmpresa<T extends ObjectLiteral>(repo: Repository<T>, empresaId: number) {
    return repo.find({
      where: { empresaId } as unknown as FindOptionsWhere<T>,

    });
  }

  private async findOneById<T extends ObjectLiteral>(
    repo: Repository<T>,
    idField: string,
    id: number | string,
    empresaId: number,
    entityName: string,
  ) {
    const where = { [idField]: id, empresaId } as unknown as FindOptionsWhere<T>;
    const found = await repo.findOne({ where });
    if (!found) throw new NotFoundException(`${entityName} ${id} no encontrado`);
    return found;
  }

  private async createEntity<T extends ObjectLiteral>(
    repo: Repository<T>,
    dto: any,
    currentUser: string,
  ) {
    const entity = repo.create({
      ...dto,
      usuarioCreated: currentUser,
    });
    return repo.save(entity);
  }

  private async updateEntity<T extends ObjectLiteral>(
    repo: Repository<T>,
    idField: string,
    id: number | string,
    empresaId: number,
    dto: any,
    currentUser: string,
    entityName: string,
  ) {
    const entity = await this.findOneById(repo, idField, id, empresaId, entityName);
    Object.assign(entity, dto, {
      usuarioUpdated: currentUser,
      fechaUpdated: new Date(),
    });
    return repo.save(entity);
  }

  private async softDelete<T extends ObjectLiteral>(
    repo: Repository<T>,
    idField: string,
    id: number | string,
    empresaId: number,
    entityName: string,
  ) {
    const entity = await this.findOneById(repo, idField, id, empresaId, entityName);
    Object.assign(entity, {
      sn_activo: 'N',
      fechaUpdated: new Date(),
    });
    return repo.save(entity);
  }

  // ===== Usuarios =====

  async findAll(empresaId: number) {
    const users = await this.repo.find({
      where: { empresaId },
      order: { usuario: 'ASC' },
    });
    return users.map(safeUser);
  }

  async findOne(usuario: string, empresaId: number) {
    const found = await this.repo.findOne({ where: { usuario, empresaId } });
    if (!found) throw new NotFoundException(`Usuario ${usuario} no encontrado`);
    return safeUser(found);
  }

  async create(dto: CreateUsuarioDto, currentUser: string) {
    const exists = await this.repo.findOne({
      where: { usuario: dto.usuario },
    });
    if (exists) throw new ConflictException(`Usuario ${dto.usuario} ya existe`);

    const entity = this.repo.create({
      ...dto,
      usuarioCreated: currentUser,
    });
    return this.repo.save(entity);
  }

  async update(usuario: string, empresaId: number, dto: UpdateUsuarioDto, currentUser: string) {
    const entity = await this.findOne(usuario, empresaId);
    Object.assign(entity, dto, {
      usuarioUpdated: currentUser,
      fechaUpdated: new Date(),
    });
    return this.repo.save(entity);
  }

  // ===== UsuariosModule =====

  async findAllModules(empresaId: number) {
    return this.modRepo.find({ where: { empresaId }, order: { usuario: 'ASC' } });
  }

  async findModule(tusuariosmoduloId: number, empresaId: number) {
    return this.findOneById(this.modRepo, 'tusuariosmoduloId', tusuariosmoduloId, empresaId, 'UsuariosModule');
  }

  async createModule(dto: CreateUsuariosModuleDto, currentUser: string) {
    return this.createEntity(this.modRepo, dto, currentUser);
  }

  async updateModule(tusuariosmoduloId: number, empresaId: number, dto: UpdateUsuariosModuleDto, currentUser: string) {
    return this.updateEntity(this.modRepo, 'tusuariosmoduloId', tusuariosmoduloId, empresaId, dto, currentUser, 'UsuariosModule');
  }

  async removeModule(tusuariosmoduloId: number, empresaId: number) {
    return this.softDelete(this.modRepo, 'tusuariosmoduloId', tusuariosmoduloId, empresaId, 'UsuariosModule');
  }

  // ===== UsuarioMnuItem =====

  async findAllMnuItems(empresaId: number) {
    return this.mnuRepo.find({ where: { empresaId }, order: { usuario: 'ASC' } });
  }

  async findMnuItem(tusuariomnuitemsId: number, empresaId: number) {
    return this.findOneById(this.mnuRepo, 'tusuariomnuitemsId', tusuariomnuitemsId, empresaId, 'UsuarioMnuItem');
  }

  async createMnuItem(dto: CreateUsuarioMnuItemDto, currentUser: string) {
    return this.createEntity(this.mnuRepo, dto, currentUser);
  }

  async updateMnuItem(tusuariomnuitemsId: number, empresaId: number, dto: UpdateUsuarioMnuItemDto, currentUser: string) {
    return this.updateEntity(this.mnuRepo, 'tusuariomnuitemsId', tusuariomnuitemsId, empresaId, dto, currentUser, 'UsuarioMnuItem');
  }

  async removeMnuItem(tusuariomnuitemsId: number, empresaId: number) {
    return this.softDelete(this.mnuRepo, 'tusuariomnuitemsId', tusuariomnuitemsId, empresaId, 'UsuarioMnuItem');
  }

  // ===== UsuariosScripts =====

  async findAllScripts(empresaId: number) {
    return this.scriptsRepo.find({ where: { empresaId }, order: { usuario: 'ASC' } });
  }

  async findScript(tusuarioscriptsId: number, empresaId: number) {
    return this.findOneById(this.scriptsRepo, 'tusuarioscriptsId', tusuarioscriptsId, empresaId, 'UsuariosScripts');
  }

  async createScript(dto: CreateUsuariosScriptsDto, currentUser: string) {
    return this.createEntity(this.scriptsRepo, dto, currentUser);
  }

  async updateScript(tusuarioscriptsId: number, empresaId: number, dto: UpdateUsuariosScriptsDto, currentUser: string) {
    return this.updateEntity(this.scriptsRepo, 'tusuarioscriptsId', tusuarioscriptsId, empresaId, dto, currentUser, 'UsuariosScripts');
  }

  async removeScript(tusuarioscriptsId: number, empresaId: number) {
    const entity = await this.findOneById(this.scriptsRepo, 'tusuarioscriptsId', tusuarioscriptsId, empresaId, 'UsuariosScripts');
    return this.scriptsRepo.remove(entity);
  }

  // ===== UsuarioModAuth =====

  async findAllModAuth(empresaId: number) {
    return this.authRepo.find({ where: { empresaId }, order: { usuario: 'ASC' } });
  }

  async findModAuth(usuariomodauthId: number, empresaId: number) {
    return this.findOneById(this.authRepo, 'usuariomodauthId', usuariomodauthId, empresaId, 'UsuarioModAuth');
  }

  async createModAuth(dto: CreateUsuarioModAuthDto, currentUser: string) {
    return this.createEntity(this.authRepo, dto, currentUser);
  }

  async updateModAuth(usuariomodauthId: number, empresaId: number, dto: UpdateUsuarioModAuthDto, currentUser: string) {
    return this.updateEntity(this.authRepo, 'usuariomodauthId', usuariomodauthId, empresaId, dto, currentUser, 'UsuarioModAuth');
  }

  async removeModAuth(usuariomodauthId: number, empresaId: number) {
    const entity = await this.findOneById(this.authRepo, 'usuariomodauthId', usuariomodauthId, empresaId, 'UsuarioModAuth');
    return this.authRepo.remove(entity);
  }
}

```

---

