# ERP Arcas - Código Fuente Completo
> Generado automáticamente el 25/8/2026, 10:57:08 p. m.

---

## 📄 .env

```typescript
# ===== Configuracion del Servidor =====
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
    "@nestjs/typeorm": "^11.0.0",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.1",
    "dotenv": "^17.4.2",
    "dotenv-expand": "^1000.0.0",
    "mysql2": "^3.14.0",
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

## 📄 src\main.ts

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.enableCors({ origin: '*' });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Arcas Backend corriendo en http://localhost:${port}`);
}
bootstrap();

```

---

## 📄 src\modules\auth\auth.controller.ts

```typescript
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
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

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  usuario: string;

  @IsString()
  @IsNotEmpty()
  password: string;

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
import { BancosService } from './bancos.service';
import { CreateBancoDto, UpdateBancoDto, CreateBcoCtaDto, UpdateBcoCtaDto } from './dto/banco.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('bancos')
@UseGuards(JwtAuthGuard)
export class BancosController {
  constructor(private readonly service: BancosService) {}

  @Get('bancos')
  findAllBancos(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllBancos(empresaId);
  }

  @Get('bancos/:id')
  findBanco(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findBanco(id, empresaId);
  }

  @Post('bancos')
  createBanco(@Body() dto: CreateBancoDto, @CurrentUser() user: any) {
    return this.service.createBanco(dto, user.usuario);
  }

  @Put('bancos/:id')
  updateBanco(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateBancoDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateBanco(id, empresaId, dto, user.usuario);
  }

  @Get('cuentas')
  findAllCtas(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllCtas(empresaId);
  }

  @Get('cuentas/:id')
  findCta(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findCta(id, empresaId);
  }

  @Post('cuentas')
  createCta(@Body() dto: CreateBcoCtaDto, @CurrentUser() user: any) {
    return this.service.createCta(dto, user.usuario);
  }

  @Put('cuentas/:id')
  updateCta(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateBcoCtaDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateCta(id, empresaId, dto, user.usuario);
  }

  @Get('conciliaciones')
  findAllConciliaciones(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllConciliaciones(empresaId);
  }

  @Get('conciliaciones/:id')
  findConciliacion(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findConciliacion(id, empresaId);
  }

  @Get('direcciones')
  findAllDirecciones(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllDirecciones(empresaId);
  }

  @Get('telefonos')
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

export class CreateBancoDto {
  @IsString() @IsNotEmpty()
  descripcion: string;

  @IsNumber() @IsOptional()
  Idsucursal?: number;

  @IsNumber()
  empresaId: number;
}

export class UpdateBancoDto {
  @IsString() @IsOptional()
  descripcion?: string;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;

  @IsNumber() @IsOptional()
  Idsucursal?: number;
}

export class CreateBcoCtaDto {
  @IsNumber()
  bancoId: number;

  @IsString() @IsNotEmpty()
  nrocuenta: string;

  @IsNumber()
  monedaId: number;

  @IsNumber()
  empresaId: number;
}

export class UpdateBcoCtaDto {
  @IsNumber() @IsOptional()
  bancoId?: number;

  @IsString() @IsOptional()
  nrocuenta?: string;

  @IsNumber() @IsOptional()
  monedaId?: number;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;

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

@Entity('bcos')
export class Tbanco {
  @PrimaryGeneratedColumn({ name: 'bancoId' })
  bancoId: number;

  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

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

## 📄 src\modules\bancos\entities\bco-conciliacion-det.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('bcosccdet')
export class TbcoConciliacionDet {
  @PrimaryGeneratedColumn({ name: 'bcosdetconciliacionId' })
  bcosdetconciliacionId: number;

  @Column({ type: 'int', nullable: true })
  bcoconcilacionId: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @Column({ type: 'datetime', nullable: true })
  fecmovbco: Date;

  @Column({ type: 'varchar', length: 20 })
  nrorefencia: string;

  @Column({ type: 'varchar', length: 150 })
  concepto: string;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  importe: number;

  @Column({ type: 'enum', enum: ['D', 'C'], default: 'D' })
  naturaleza: string;

  @Column()
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

## 📄 src\modules\bancos\entities\bco-conciliacion.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('bcosccmae')
export class TbcoConciliacion {
  @PrimaryGeneratedColumn({ name: 'bcoconcilacionId' })
  bcoconcilacionId: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @Column({ type: 'int', nullable: true })
  ctabcoId: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  importe: number;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_conciliado: string;

  @Column()
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

## 📄 src\modules\bancos\entities\bco-cta.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('bcosctas')
export class TbcoCta {
  @PrimaryGeneratedColumn({ name: 'bcoctasId' })
  bcoctasId: number;

  @Column()
  bancoId: number;

  @Column({ type: 'varchar', length: 20 })
  nrocuenta: string;

  @Column()
  monedaId: number;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

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

## 📄 src\modules\bancos\entities\bco-direccion.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('bcosdir')
export class TbcoDireccion {
  @PrimaryGeneratedColumn({ name: 'bcosdireccionid' })
  bcosdireccionid: number;

  @Column()
  bancoId: number;

  @Column({ type: 'int', nullable: true })
  direccionId: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  descripcion: string;

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

## 📄 src\modules\bancos\entities\bco-telefono.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('bcostel')
export class TbcoTelefono {
  @PrimaryGeneratedColumn({ name: 'bancotelefonoId' })
  bancotelefonoId: number;

  @Column()
  bancoId: number;

  @Column({ type: 'int', nullable: true })
  telefonoId: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
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

## 📄 src\modules\companies\companies.controller.ts

```typescript
import {
  Controller, Get, Post, Put, Body, Param,
  UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateEmpresaDto, UpdateEmpresaDto } from './dto/empresa.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('companies')
@UseGuards(JwtAuthGuard)
export class CompaniesController {
  constructor(private readonly service: CompaniesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateEmpresaDto, @CurrentUser() user: any) {
    return this.service.create(dto, user.usuario);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEmpresaDto,
    @CurrentUser() user: any,
  ) {
    return this.service.update(id, dto, user.usuario);
  }
}

```

---

## 📄 src\modules\companies\companies.module.ts

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tempresas } from './entities/empresa.entity';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Tempresas])],
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
import { CreateEmpresaDto, UpdateEmpresaDto } from './dto/empresa.dto';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Tempresas)
    private readonly repo: Repository<Tempresas>,
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
}

```

---

## 📄 src\modules\companies\dto\empresa.dto.ts

```typescript
import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export class CreateEmpresaDto {
  @IsString() @IsNotEmpty()
  descripcion: string;

  @IsString() @IsOptional()
  msjfactura?: string;

  @IsString() @IsOptional()
  msjdevfactura?: string;
}

export class UpdateEmpresaDto {
  @IsString() @IsOptional()
  descripcion?: string;

  @IsString() @IsOptional()
  msjfactura?: string;

  @IsString() @IsOptional()
  msjdevfactura?: string;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;
}

```

---

## 📄 src\modules\companies\entities\empresa.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToMany,
} from 'typeorm';
import { Tsucursal } from '../../sucursales/entities/sucursal.entity';
import { Tusuarios } from '../../users/entities/usuario.entity';

@Entity('tempresas')
export class Tempresas {
  @PrimaryGeneratedColumn({ name: 'empresaId' })
  empresaId: number;

  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

  @Column({ type: 'datetime' })
  fechasistema: Date;

  @Column({ type: 'varchar', length: 200, default: 'LA FACTURA ES BENEFICIO DE TODOS' })
  msjfactura: string;

  @Column({ type: 'varchar', length: 200, default: 'NO SE ACEPTAN DEVOLUCIONES O CAMBIOS DESPUES DE 15 DIAS' })
  msjdevfactura: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;

  @OneToMany(() => Tsucursal, (s) => s.empresa)
  sucursales: Tsucursal[];

  @OneToMany(() => Tusuarios, (u) => u.empresa)
  usuarios: Tusuarios[];
}

```

---

## 📄 src\modules\contabilidad\contabilidad.controller.ts

```typescript
import {
  Controller, Get, Post, Put, Body, Param, Query,
  UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { ContabilidadService } from './contabilidad.service';
import {
  CreateTcoctacontablesDto, UpdateTcoctacontablesDto,
  CreateCopdamaeDto, UpdateCopdamaeDto,
  CreateCopdadetDto, UpdateCopdadetDto,
} from './dto/contabilidad.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('contabilidad')
@UseGuards(JwtAuthGuard)
export class ContabilidadController {
  constructor(private readonly service: ContabilidadService) {}

  @Get('ctacontables')
  findAllCtacontables(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllCtacontables(empresaId);
  }

  @Get('ctacontables/:id')
  findCtacontable(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findCtacontable(id, empresaId);
  }

  @Post('ctacontables')
  createCtacontable(@Body() dto: CreateTcoctacontablesDto, @CurrentUser() user: any) {
    return this.service.createCtacontable(dto, user.usuario);
  }

  @Put('ctacontables/:id')
  updateCtacontable(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateTcoctacontablesDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateCtacontable(id, empresaId, dto, user.usuario);
  }

  @Put('ctacontables/:id/remove')
  removeCtacontable(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeCtacontable(id, empresaId);
  }

  @Get('grupocontable')
  findAllGrupocontable(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllGrupocontable(empresaId);
  }

  @Get('grupocontable/:id')
  findGrupocontable(@Param('id', ParseIntPipe) id: number) {
    return this.service.findGrupocontable(id);
  }

  @Post('grupocontable')
  createGrupocontable(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createGrupocontable(dto, user.usuario);
  }

  @Put('grupocontable/:id')
  updateGrupocontable(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateGrupocontable(id, dto, user.usuario);
  }

  @Put('grupocontable/:id/remove')
  removeGrupocontable(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeGrupocontable(id);
  }

  @Get('plantillapdamae')
  findAllPlantillapdamae(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllPlantillapdamae(empresaId);
  }

  @Get('plantillapdamae/:id')
  findPlantillapdamae(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findPlantillapdamae(id, empresaId);
  }

  @Post('plantillapdamae')
  createPlantillapdamae(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createPlantillapdamae(dto, user.usuario);
  }

  @Put('plantillapdamae/:id')
  updatePlantillapdamae(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updatePlantillapdamae(id, empresaId, dto, user.usuario);
  }

  @Put('plantillapdamae/:id/remove')
  removePlantillapdamae(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removePlantillapdamae(id, empresaId);
  }

  @Get('plantillapdadet')
  findAllPlantillapdadet(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllPlantillapdadet(empresaId);
  }

  @Get('plantillapdadet/:id')
  findPlantillapdadet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findPlantillapdadet(id, empresaId);
  }

  @Post('plantillapdadet')
  createPlantillapdadet(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createPlantillapdadet(dto, user.usuario);
  }

  @Put('plantillapdadet/:id')
  updatePlantillapdadet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updatePlantillapdadet(id, empresaId, dto, user.usuario);
  }

  @Put('plantillapdadet/:id/remove')
  removePlantillapdadet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removePlantillapdadet(id, empresaId);
  }

  @Get('saldoscta')
  findAllSaldoscta(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllSaldoscta(empresaId);
  }

  @Get('saldoscta/:id')
  findSaldoscta(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findSaldoscta(id, empresaId);
  }

  @Post('saldoscta')
  createSaldoscta(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createSaldoscta(dto, user.usuario);
  }

  @Put('saldoscta/:id')
  updateSaldoscta(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateSaldoscta(id, empresaId, dto, user.usuario);
  }

  @Get('cierrectable')
  findAllCierrectable(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllCierrectable(empresaId);
  }

  @Get('cierrectable/:id')
  findCierrectable(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findCierrectable(id, empresaId);
  }

  @Post('cierrectable')
  createCierrectable(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createCierrectable(dto, user.usuario);
  }

  @Put('cierrectable/:id')
  updateCierrectable(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateCierrectable(id, empresaId, dto, user.usuario);
  }

  @Put('cierrectable/:id/remove')
  removeCierrectable(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeCierrectable(id, empresaId);
  }

  @Get('repliquidez')
  findAllRepliquidez(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllRepliquidez(empresaId);
  }

  @Get('repliquidez/:id')
  findRepliquidez(@Param('id', ParseIntPipe) id: number) {
    return this.service.findRepliquidez(id);
  }

  @Post('repliquidez')
  createRepliquidez(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createRepliquidez(dto, user.usuario);
  }

  @Put('repliquidez/:id')
  updateRepliquidez(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateRepliquidez(id, dto, user.usuario);
  }

  @Put('repliquidez/:id/remove')
  removeRepliquidez(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeRepliquidez(id);
  }

  @Get('factordecambio')
  findAllFactordecambio(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllFactordecambio(empresaId);
  }

  @Get('factordecambio/:id')
  findFactordecambio(@Param('id', ParseIntPipe) id: number) {
    return this.service.findFactordecambio(id);
  }

  @Post('factordecambio')
  createFactordecambio(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createFactordecambio(dto, user.usuario);
  }

  @Put('factordecambio/:id')
  updateFactordecambio(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateFactordecambio(id, dto, user.usuario);
  }

  @Get('plantillabalancesmae')
  findAllPlantillabalancesmae(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllPlantillabalancesmae(empresaId);
  }

  @Get('plantillabalancesmae/:id')
  findPlantillabalancesmae(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findPlantillabalancesmae(id, empresaId);
  }

  @Post('plantillabalancesmae')
  createPlantillabalancesmae(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createPlantillabalancesmae(dto, user.usuario);
  }

  @Put('plantillabalancesmae/:id')
  updatePlantillabalancesmae(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updatePlantillabalancesmae(id, empresaId, dto, user.usuario);
  }

  @Put('plantillabalancesmae/:id/remove')
  removePlantillabalancesmae(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removePlantillabalancesmae(id, empresaId);
  }

  @Get('plantillabalancesdet')
  findAllPlantillabalancesdet(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllPlantillabalancesdet(empresaId);
  }

  @Get('plantillabalancesdet/:id')
  findPlantillabalancesdet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findPlantillabalancesdet(id, empresaId);
  }

  @Post('plantillabalancesdet')
  createPlantillabalancesdet(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createPlantillabalancesdet(dto, user.usuario);
  }

  @Put('plantillabalancesdet/:id')
  updatePlantillabalancesdet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updatePlantillabalancesdet(id, empresaId, dto, user.usuario);
  }

  @Put('plantillabalancesdet/:id/remove')
  removePlantillabalancesdet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removePlantillabalancesdet(id, empresaId);
  }

  @Get('repdiarios')
  findAllRepdiarios(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllRepdiarios(empresaId);
  }

  @Get('repdiarios/:id')
  findRepdiarios(@Param('id', ParseIntPipe) id: number) {
    return this.service.findRepdiarios(id);
  }

  @Post('repdiarios')
  createRepdiarios(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createRepdiarios(dto, user.usuario);
  }

  @Put('repdiarios/:id')
  updateRepdiarios(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateRepdiarios(id, dto, user.usuario);
  }

  @Put('repdiarios/:id/remove')
  removeRepdiarios(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeRepdiarios(id);
  }

  @Get('repbalances')
  findAllRepbalances(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllRepbalances(empresaId);
  }

  @Get('repbalances/:id')
  findRepbalances(@Param('id', ParseIntPipe) id: number) {
    return this.service.findRepbalances(id);
  }

  @Post('repbalances')
  createRepbalances(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createRepbalances(dto, user.usuario);
  }

  @Put('repbalances/:id')
  updateRepbalances(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateRepbalances(id, dto, user.usuario);
  }

  @Get('periodoctable')
  findAllPeriodoctable(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllPeriodoctable(empresaId);
  }

  @Get('periodoctable/:id')
  findPeriodoctable(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findPeriodoctable(id, empresaId);
  }

  @Post('periodoctable')
  createPeriodoctable(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createPeriodoctable(dto, user.usuario);
  }

  @Put('periodoctable/:id')
  updatePeriodoctable(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updatePeriodoctable(id, empresaId, dto, user.usuario);
  }

  @Put('periodoctable/:id/remove')
  removePeriodoctable(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removePeriodoctable(id, empresaId);
  }

  @Get('copdamae')
  findAllCopdamae(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllCopdamae(empresaId);
  }

  @Get('copdamae/:id')
  findCopdamae(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findCopdamae(id, empresaId);
  }

  @Post('copdamae')
  createCopdamae(@Body() dto: CreateCopdamaeDto, @CurrentUser() user: any) {
    return this.service.createCopdamae(dto, user.usuario);
  }

  @Put('copdamae/:id')
  updateCopdamae(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateCopdamaeDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateCopdamae(id, empresaId, dto, user.usuario);
  }

  @Put('copdamae/:id/remove')
  removeCopdamae(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeCopdamae(id, empresaId);
  }

  @Get('copdadet')
  findAllCopdadet(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllCopdadet(empresaId);
  }

  @Get('copdadet/:id')
  findCopdadet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findCopdadet(id, empresaId);
  }

  @Post('copdadet')
  createCopdadet(@Body() dto: CreateCopdadetDto, @CurrentUser() user: any) {
    return this.service.createCopdadet(dto, user.usuario);
  }

  @Put('copdadet/:id')
  updateCopdadet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateCopdadetDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateCopdadet(id, empresaId, dto, user.usuario);
  }

  @Put('copdadet/:id/remove')
  removeCopdadet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeCopdadet(id, empresaId);
  }

  @Get('movcta')
  findAllMovcta(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllMovcta(empresaId);
  }

  @Get('movcta/:id')
  findMovcta(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findMovcta(id, empresaId);
  }

  @Post('movcta')
  createMovcta(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createMovcta(dto, user.usuario);
  }

  @Put('movcta/:id')
  updateMovcta(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateMovcta(id, empresaId, dto, user.usuario);
  }

  @Get('nivelcta')
  findAllNivelcta(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllNivelcta(empresaId);
  }

  @Get('nivelcta/:id')
  findNivelcta(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findNivelcta(id, empresaId);
  }

  @Post('nivelcta')
  createNivelcta(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createNivelcta(dto, user.usuario);
  }

  @Put('nivelcta/:id')
  updateNivelcta(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateNivelcta(id, empresaId, dto, user.usuario);
  }

  @Put('nivelcta/:id/remove')
  removeNivelcta(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeNivelcta(id, empresaId);
  }

  @Get('naturalezacta')
  findAllNaturalezacta(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllNaturalezacta(empresaId);
  }

  @Get('naturalezacta/:id')
  findNaturalezacta(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findNaturalezacta(id, empresaId);
  }

  @Post('naturalezacta')
  createNaturalezacta(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createNaturalezacta(dto, user.usuario);
  }

  @Put('naturalezacta/:id')
  updateNaturalezacta(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateNaturalezacta(id, empresaId, dto, user.usuario);
  }

  @Get('impuestovecinal')
  findAllImpuestovecinal(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllImpuestovecinal(empresaId);
  }

  @Get('impuestovecinal/:id')
  findImpuestovecinal(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findImpuestovecinal(id, empresaId);
  }

  @Post('impuestovecinal')
  createImpuestovecinal(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createImpuestovecinal(dto, user.usuario);
  }

  @Put('impuestovecinal/:id')
  updateImpuestovecinal(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateImpuestovecinal(id, empresaId, dto, user.usuario);
  }

  @Put('impuestovecinal/:id/remove')
  removeImpuestovecinal(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeImpuestovecinal(id, empresaId);
  }

  @Get('tipos-doc-fiscal')
  findAllTipoDocFiscal(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllTipoDocFiscal(empresaId);
  }

  @Get('tipos-doc-fiscal/:id')
  findTipoDocFiscal(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findTipoDocFiscal(id, empresaId);
  }

  @Post('tipos-doc-fiscal')
  createTipoDocFiscal(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createTipoDocFiscal(dto, user.usuario);
  }

  @Put('tipos-doc-fiscal/:id')
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

export class CreateTcoctacontablesDto {
  @IsString() @IsNotEmpty()
  ctacontable: string;

  @IsString() @IsNotEmpty()
  descripcion: string;

  @IsEnum(['D', 'C']) @IsOptional()
  naturaleza?: string;

  @IsNumber()
  nivel: number;

  @IsString() @IsOptional()
  padre?: string;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_operable?: string;

  @IsNumber()
  tcogrupocontableId: number;

  @IsNumber()
  empresaId: number;

  @IsNumber() @IsOptional()
  Idsucursal?: number;
}

export class UpdateTcoctacontablesDto {
  @IsString() @IsOptional()
  ctacontable?: string;

  @IsString() @IsOptional()
  descripcion?: string;

  @IsEnum(['D', 'C']) @IsOptional()
  naturaleza?: string;

  @IsNumber() @IsOptional()
  nivel?: number;

  @IsString() @IsOptional()
  padre?: string;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_operable?: string;

  @IsNumber() @IsOptional()
  tcogrupocontableId?: number;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;

  @IsNumber() @IsOptional()
  Idsucursal?: number;
}

export class CreateCopdamaeDto {
  @IsNumber()
  periodo: number;

  @IsNumber()
  anio: number;

  @IsNumber()
  moduloId: number;

  @IsNumber()
  documentoId: number;

  @IsNumber() @IsOptional()
  factordecambio?: number;

  @IsString() @IsNotEmpty()
  nroreferencia: string;

  @IsString() @IsNotEmpty()
  descripcion: string;

  @IsNumber()
  nropartida: number;

  @IsNumber()
  Idsucursal: number;

  @IsNumber()
  empresaId: number;
}

export class UpdateCopdamaeDto {
  @IsNumber() @IsOptional()
  periodo?: number;

  @IsNumber() @IsOptional()
  anio?: number;

  @IsNumber() @IsOptional()
  moduloId?: number;

  @IsNumber() @IsOptional()
  documentoId?: number;

  @IsNumber() @IsOptional()
  factordecambio?: number;

  @IsString() @IsOptional()
  nroreferencia?: string;

  @IsString() @IsOptional()
  descripcion?: string;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;

  @IsNumber() @IsOptional()
  nropartida?: number;

  @IsNumber() @IsOptional()
  Idsucursal?: number;
}

export class CreateCopdadetDto {
  @IsNumber()
  copdamaeId: number;

  @IsNumber() @IsOptional()
  periodo?: number;

  @IsNumber() @IsOptional()
  anio?: number;

  @IsNumber() @IsOptional()
  nropartida?: number;

  @IsNumber()
  moduloId: number;

  @IsNumber() @IsOptional()
  nrofila?: number;

  @IsString() @IsOptional()
  ctacontable?: string;

  @IsString() @IsOptional()
  descripcion?: string;

  @IsNumber() @IsOptional()
  debito?: number;

  @IsNumber() @IsOptional()
  credito?: number;

  @IsNumber() @IsOptional()
  factordecambio?: number;

  @IsNumber()
  Idsucursal: number;

  @IsNumber()
  empresaId: number;
}

export class UpdateCopdadetDto {
  @IsNumber() @IsOptional()
  copdamaeId?: number;

  @IsNumber() @IsOptional()
  periodo?: number;

  @IsNumber() @IsOptional()
  anio?: number;

  @IsNumber() @IsOptional()
  nropartida?: number;

  @IsNumber() @IsOptional()
  moduloId?: number;

  @IsNumber() @IsOptional()
  nrofila?: number;

  @IsString() @IsOptional()
  ctacontable?: string;

  @IsString() @IsOptional()
  descripcion?: string;

  @IsNumber() @IsOptional()
  debito?: number;

  @IsNumber() @IsOptional()
  credito?: number;

  @IsNumber() @IsOptional()
  factordecambio?: number;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;

  @IsNumber() @IsOptional()
  Idsucursal?: number;
}

```

---

## 📄 src\modules\contabilidad\entities\cocierrectable.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('cocierrectable')
export class Cocierrectable {
  @PrimaryGeneratedColumn({ name: 'cierrectableId' })
  cierrectableId: number;

  @Column({ type: 'int', nullable: true })
  periodo: number;

  @Column({ type: 'int', nullable: true })
  anio: number;

  @Column({ type: 'datetime' })
  fechacierre: Date;

  @Column({ type: 'varchar', length: 20, nullable: true })
  observacion: string;

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

## 📄 src\modules\contabilidad\entities\cofactordecambios.entity.ts

```typescript
import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('cofactordecambios')
export class Cofactordecambios {
  @PrimaryColumn({ name: 'factordecambioId' })
  factordecambioId: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  preciocompra: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  precioventa: number;

  @Column({ type: 'enum', enum: ['D', 'E', 'Y'], default: 'D' })
  tipomoneda: string;

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

## 📄 src\modules\contabilidad\entities\comovcta.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('comovcta')
export class Comovcta {
  @PrimaryGeneratedColumn({ name: 'movctascontablesId' })
  movctascontablesId: number;

  @Column()
  monedaId: number;

  @Column({ type: 'varchar', length: 20 })
  ctacontable: string;

  @Column()
  anio: number;

  @Column()
  periodo: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  sacum: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  debe: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  haber: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  saldo: number;

  @Column({ type: 'datetime', nullable: true })
  fecultmov: Date;

  @Column({ type: 'int', nullable: true })
  ultnropda: number;

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

## 📄 src\modules\contabilidad\entities\copdadet.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('copdadet')
export class Copdadet {
  @PrimaryGeneratedColumn({ name: 'copdadetId' })
  copdadetId: number;

  @Column()
  copdamaeId: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @Column({ type: 'int', nullable: true })
  periodo: number;

  @Column({ type: 'int', nullable: true })
  anio: number;

  @Column({ type: 'int', nullable: true })
  nropartida: number;

  @Column()
  moduloId: number;

  @Column({ type: 'int', nullable: true })
  nrofila: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  ctacontable: string;

  @Column({ type: 'varchar', length: 70, nullable: true })
  descripcion: string;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  debito: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  credito: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  factordecambio: number;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @Column()
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

## 📄 src\modules\contabilidad\entities\copdamae.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('copdamae')
export class Copdamae {
  @PrimaryGeneratedColumn({ name: 'copdamaeId' })
  copdamaeId: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @Column()
  periodo: number;

  @Column()
  anio: number;

  @Column()
  moduloId: number;

  @Column()
  documentoId: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fechadocumento: Date;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  factordecambio: number;

  @Column({ type: 'varchar', length: 70 })
  nroreferencia: string;

  @Column({ type: 'varchar', length: 70 })
  descripcion: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @Column()
  nropartida: number;

  @Column()
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

## 📄 src\modules\contabilidad\entities\coperiodoctable.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('coperiodoctable')
export class Coperiodoctable {
  @PrimaryGeneratedColumn({ name: 'periodoscontableId' })
  periodoscontableId: number;

  @Column()
  nroanio: number;

  @Column()
  nromes: number;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_abierto: string;

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

## 📄 src\modules\contabilidad\entities\cosaldoscta.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('cosaldoscta')
export class Cosaldoscta {
  @PrimaryGeneratedColumn({ name: 'cosaldosctaId' })
  cosaldosctaId: number;

  @Column({ type: 'int', nullable: true })
  anio: number;

  @Column({ type: 'varchar', length: 20 })
  ctacontable: string;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  saldoanterior: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  enero: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  febrero: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  marzo: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  abril: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  mayo: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  junio: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  julio: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  agosto: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  septiembre: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  octubre: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  noviembre: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  diciembre: number;

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

## 📄 src\modules\contabilidad\entities\tcoctacontables.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('tcoctacontables')
export class Tcoctacontables {
  @PrimaryGeneratedColumn({ name: 'cuentacontablesId' })
  cuentacontablesId: number;

  @Column({ type: 'varchar', length: 20 })
  ctacontable: string;

  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

  @Column({ type: 'enum', enum: ['D', 'C'], default: 'D' })
  naturaleza: string;

  @Column({ type: 'int' })
  nivel: number;

  @Column({ type: 'varchar', length: 12, nullable: true })
  padre: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_operable: string;

  @Column()
  tcogrupocontableId: number;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @Column()
  empresaId: number;

  @Column()
  Idsucursal: number;

  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\contabilidad\entities\tcogrupocontable.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('tcogrupocontable')
export class Tcogrupocontable {
  @PrimaryGeneratedColumn({ name: 'tcogrupocontableId' })
  tcogrupocontableId: number;

  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

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

## 📄 src\modules\contabilidad\entities\tcoimpuestovecinal.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('tcoimpuestovecinal')
export class Tcoimpuestovecinal {
  @PrimaryGeneratedColumn({ name: 'impvecinalId' })
  impvecinalId: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  descripcion: string;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  del: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  al: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  importe: number;

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

## 📄 src\modules\contabilidad\entities\tconaturalezacta.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('tconaturalezacta')
export class Tconaturalezacta {
  @PrimaryGeneratedColumn({ name: 'naturalezaCtaId' })
  naturalezaCtaId: number;

  @Column({ type: 'enum', enum: ['D', 'C'], default: 'D' })
  descripcion: string;

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

## 📄 src\modules\contabilidad\entities\tconivelcta.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('tconivelcta')
export class Tconivelcta {
  @PrimaryGeneratedColumn({ name: 'nivelcontableId' })
  nivelcontableId: number;

  @Column({ type: 'enum', enum: ['1', '2', '3', '4', '5', '6', '7', '8'], default: '1' })
  nivel: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_diario: string;

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

## 📄 src\modules\contabilidad\entities\tcoplantillabalancesdet.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('tcoplantillabalancesdet')
export class Tcoplantillabalancesdet {
  @PrimaryGeneratedColumn({ name: 'tcoplantillabalancesdetid' })
  tcoplantillabalancesdetid: number;

  @Column()
  cocdefbalmaId: number;

  @Column({ type: 'varchar', length: 1, nullable: true })
  tipo: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  ctacontable: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  descripcion: string;

  @Column({ type: 'int', nullable: true })
  columna: number;

  @Column({ type: 'int', nullable: true })
  renglon: number;

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

## 📄 src\modules\contabilidad\entities\tcoplantillabalancesmae.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('tcoplantillabalancesmae')
export class Tcoplantillabalancesmae {
  @PrimaryGeneratedColumn({ name: 'cocdefbalmaId' })
  cocdefbalmaId: number;

  @Column({ type: 'varchar', length: 50 })
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

## 📄 src\modules\contabilidad\entities\tcoplantillapdadet.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('tcoplantillapdadet')
export class Tcoplantillapdadet {
  @PrimaryGeneratedColumn({ name: 'tcoplantillapdadetId' })
  tcoplantillapdadetId: number;

  @Column()
  tcoplantillapdamaeId: number;

  @Column()
  nrofila: number;

  @Column({ type: 'varchar', length: 20 })
  ctacontable: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  descripcion: string;

  @Column({ type: 'int', nullable: true })
  moduloId: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ctamayorId: string;

  @Column({ type: 'enum', enum: ['D', 'C'], default: 'D' })
  naturaleza: string;

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

## 📄 src\modules\contabilidad\entities\tcoplantillapdamae.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('tcoplantillapdamae')
export class Tcoplantillapdamae {
  @PrimaryGeneratedColumn({ name: 'tcoplantillapdamaeId' })
  tcoplantillapdamaeId: number;

  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

  @Column()
  moduloId: number;

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

## 📄 src\modules\contabilidad\entities\tcorepbalances.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('tcorepbalances')
export class Tcorepbalances {
  @PrimaryGeneratedColumn({ name: 'balcomId' })
  balcomId: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  ctacontable: string;

  @Column()
  periodoA: number;

  @Column()
  anioA: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  saldoA: number;

  @Column()
  periodoB: number;

  @Column()
  anioB: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  saldoB: number;

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

## 📄 src\modules\contabilidad\entities\tcorepdiarios.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('tcorepdiarios')
export class Tcorepdiarios {
  @PrimaryGeneratedColumn({ name: 'tcorepdiariosId' })
  tcorepdiariosId: number;

  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

  @Column({ type: 'varchar', length: 50 })
  reporte: string;

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

## 📄 src\modules\contabilidad\entities\tcorepliquidez.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('tcorepliquidez')
export class Tcorepliquidez {
  @PrimaryGeneratedColumn({ name: 'tcorepliquidezId' })
  tcorepliquidezId: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  descripcion: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  objetivo: string;

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

## 📄 src\modules\contabilidad\entities\tcotipodocumentofiscal.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('tcotipodocumentofiscal')
export class TCoTipoDocumentoFiscal {
  @PrimaryGeneratedColumn({ name: 'tipodocumentofiscalId' })
  tipodocumentofiscalId: number;

  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

  @Column({ type: 'varchar', length: 10 })
  abreviatura: string;

  @Column({ type: 'enum', enum: ['D', 'C'], default: 'D' }) // La naturaleza del documento fiscal, si es de tipo Debito o Credito 
  naturaleza: string;

  @Column() // va ser para vincular los documentos fiscales por modulo
  moduloId: number;

  @Column()  // va ser para vincular la cuenta contable que va afectar el documento
  cuentacontableId: number;

  @Column() // en el caso de las facturacion, se puede usar ticket para llever un correlativo de preregistro
  nrocorrelativo: number;

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

## 📄 src\modules\cxc\cxc.controller.ts

```typescript
import {
  Controller, Get, Post, Put, Body, Param, Query,
  UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { CxcService } from './cxc.service';
import {
  CreateCxcClienteDto, UpdateCxcClienteDto,
  CreateCxcMovimientoDto, UpdateCxcMovimientoDto,
  CreateCxcPrestamoDto, UpdateCxcPrestamoDto,
} from './dto/cxc.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('cxc')
@UseGuards(JwtAuthGuard)
export class CxcController {
  constructor(private readonly service: CxcService) {}

  @Get('clientes')
  findAllClientes(
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string
  ) {
    return this.service.findAllClientes(empresaId, page ? Number(page) : 1, limit ? Number(limit) : 10, q);
  }

  @Get('clientes/:id')
  findCliente(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findCliente(id, empresaId);
  }

  @Post('clientes')
  createCliente(@Body() dto: CreateCxcClienteDto, @CurrentUser() user: any) {
    return this.service.createCliente(dto, user.usuario);
  }

  @Put('clientes/:id')
  updateCliente(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateCxcClienteDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateCliente(id, empresaId, dto, user.usuario);
  }

  @Get('clientes-dir')
  findAllClientesDir(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllClientesDir(empresaId);
  }

  @Get('clientes-dir/:id')
  findClienteDir(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findClienteDir(id, empresaId);
  }

  @Post('clientes-dir')
  createClienteDir(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createClienteDir(dto, user.usuario);
  }

  @Put('clientes-dir/:id')
  updateClienteDir(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateClienteDir(id, empresaId, dto, user.usuario);
  }

  @Get('clientes-tel')
  findAllClientesTel(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllClientesTel(empresaId);
  }

  @Get('clientes-tel/:id')
  findClienteTel(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findClienteTel(id, empresaId);
  }

  @Post('clientes-tel')
  createClienteTel(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createClienteTel(dto, user.usuario);
  }

  @Put('clientes-tel/:id')
  updateClienteTel(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateClienteTel(id, empresaId, dto, user.usuario);
  }

  @Get('clientes-ref')
  findAllClientesRef(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllClientesRef(empresaId);
  }

  @Get('clientes-ref/cliente/:clienteId')
  findClientesRefByCliente(
    @Param('clienteId', ParseIntPipe) clienteId: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findClientesRefByCliente(clienteId, empresaId);
  }

  @Get('clientes-ref/:id')
  findClienteRef(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findClienteRef(id, empresaId);
  }

  @Post('clientes-ref')
  createClienteRef(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createClienteRef(dto, user.usuario);
  }

  @Put('clientes-ref/:id')
  updateClienteRef(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateClienteRef(id, empresaId, dto, user.usuario);
  }

  @Get('cajeros')
  findAllCajeros(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllCajeros(empresaId);
  }

  @Get('cajeros/:id')
  findCajero(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findCajero(id, empresaId);
  }

  @Post('cajeros')
  createCajero(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createCajero(dto, user.usuario);
  }

  @Put('cajeros/:id')
  updateCajero(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateCajero(id, empresaId, dto, user.usuario);
  }

  @Get('caja-mae')
  findAllCajaMae(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllCajaMae(empresaId);
  }

  @Get('caja-mae/:id')
  findCajaMae(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findCajaMae(id, empresaId);
  }

  @Post('caja-mae')
  createCajaMae(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createCajaMae(dto, user.usuario);
  }

  @Put('caja-mae/:id')
  updateCajaMae(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateCajaMae(id, empresaId, dto, user.usuario);
  }

  @Get('caja-det')
  findAllCajaDet(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllCajaDet(empresaId);
  }

  @Get('caja-det/:id')
  findCajaDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findCajaDet(id, empresaId);
  }

  @Post('caja-det')
  createCajaDet(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createCajaDet(dto, user.usuario);
  }

  @Put('caja-det/:id')
  updateCajaDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateCajaDet(id, empresaId, dto, user.usuario);
  }

  @Get('movimientos')
  findAllMovimientos(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllMovimientos(empresaId);
  }

  @Get('movimientos/cliente/:clienteId')
  findMovimientosByCliente(
    @Param('clienteId', ParseIntPipe) clienteId: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findMovimientosByCliente(clienteId, empresaId);
  }

  @Get('movimientos/:id')
  findMovimiento(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findMovimiento(id, empresaId);
  }

  @Post('movimientos')
  createMovimiento(@Body() dto: CreateCxcMovimientoDto, @CurrentUser() user: any) {
    return this.service.createMovimiento(dto, user.usuario);
  }

  @Put('movimientos/:id')
  updateMovimiento(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateCxcMovimientoDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateMovimiento(id, empresaId, dto, user.usuario);
  }

  @Get('historico')
  findAllHistoro(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllHistoro(empresaId);
  }

  @Get('historico/cliente/:clienteId')
  findHistoricoByCliente(
    @Param('clienteId', ParseIntPipe) clienteId: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findHistoricoByCliente(clienteId, empresaId);
  }

  @Get('historico/:id')
  findHistoro(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findHistoro(id, empresaId);
  }

  @Post('historico')
  createHistoro(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createHistoro(dto, user.usuario);
  }

  @Put('historico/:id')
  updateHistoro(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateHistoro(id, empresaId, dto, user.usuario);
  }

  @Get('saldo-favor')
  findAllSalFav(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllSalFav(empresaId);
  }

  @Get('saldo-favor/:id')
  findSalFav(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findSalFav(id, empresaId);
  }

  @Post('saldo-favor')
  createSalFav(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createSalFav(dto, user.usuario);
  }

  @Put('saldo-favor/:id')
  updateSalFav(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateSalFav(id, empresaId, dto, user.usuario);
  }

  @Get('dias-cobro')
  findAllDiasCobro(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllDiasCobro(empresaId);
  }

  @Get('dias-cobro/:id')
  findDiasCobro(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findDiasCobro(id, empresaId);
  }

  @Post('dias-cobro')
  createDiasCobro(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createDiasCobro(dto, user.usuario);
  }

  @Put('dias-cobro/:id')
  updateDiasCobro(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateDiasCobro(id, empresaId, dto, user.usuario);
  }

  @Get('prestamos')
  findAllPrestamos(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllPrestamos(empresaId);
  }

  @Get('prestamos/cliente/:clienteId')
  findPrestamosByCliente(
    @Param('clienteId', ParseIntPipe) clienteId: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findPrestamosByCliente(clienteId, empresaId);
  }

  @Get('prestamos/:id')
  findPrestamo(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findPrestamo(id, empresaId);
  }

  @Post('prestamos')
  createPrestamo(@Body() dto: CreateCxcPrestamoDto, @CurrentUser() user: any) {
    return this.service.createPrestamo(dto, user.usuario);
  }

  @Put('prestamos/:id')
  updatePrestamo(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateCxcPrestamoDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updatePrestamo(id, empresaId, dto, user.usuario);
  }

  @Get('prestamo-pp')
  findAllPrestamoPP(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllPrestamoPP(empresaId);
  }

  @Get('prestamo-pp/:id')
  findPrestamoPP(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findPrestamoPP(id, empresaId);
  }

  @Post('prestamo-pp')
  createPrestamoPP(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createPrestamoPP(dto, user.usuario);
  }

  @Put('prestamo-pp/:id')
  updatePrestamoPP(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updatePrestamoPP(id, empresaId, dto, user.usuario);
  }

  @Get('parientes')
  findAllParientes(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllParientes(empresaId);
  }

  @Get('parientes/cliente/:clienteId')
  findParientesByCliente(
    @Param('clienteId', ParseIntPipe) clienteId: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findParientesByCliente(clienteId, empresaId);
  }

  @Get('parientes/:id')
  findPariente(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findPariente(id, empresaId);
  }

  @Post('parientes')
  createPariente(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createPariente(dto, user.usuario);
  }

  @Put('parientes/:id')
  updatePariente(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updatePariente(id, empresaId, dto, user.usuario);
  }

  @Get('antiguedad-saldos')
  getAntiguedadSaldos(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.getAntiguedadSaldos(empresaId);
  }

  @Get('clientes-con-saldo')
  getClientesConSaldo(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.getClientesConSaldo(empresaId);
  }

  @Get('documentos-pendientes/cliente/:clienteId')
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
    return this.createEntity(this.clienteRepo, dto, currentUser);
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
    const cajaDet = await this.createEntity<CxccajaDet>(this.cajaDetRepo, dto, currentUser);

    const cajaMae = await this.cajaMaeRepo.findOne({
      where: { cxccajaId: dto.cxccajaId, empresaId: dto.empresaId } as FindOptionsWhere<CxccajaMae>,
    });

    if (cajaMae && cajaMae.tipomov === 'C') {
      try {
        await this.generarMovimientoDesdeCajaDet(cajaDet, cajaMae, currentUser);
      } catch (error) {
        console.error('Error generando movimiento CXC desde Caja Det:', error);
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
      moduloId: 3,
      documentoId: caja.cxccajaId,
      tipomov: 'A',
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
      moduloId: 3,
      documentoId: cajaMae.cxccajaId,
      tipomov: 'A',
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

  async findAllPrestamoPP(empresaId: number) {
    return this.findAllByEmpresa(this.prestamoPPRepo, empresaId);
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
      moduloId: 1,
      documentoId: factura.facturaId,
      tipomov: 'C',
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

  async anularMovimientoFactura(facturaId: number, empresaId: number, currentUser: string): Promise<void> {
    const movimientos = await this.movimientoRepo.find({
      where: { documentoId: facturaId, moduloId: 1, empresaId } as FindOptionsWhere<CxcMovimiento>,
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

  async anularCajaPorFactura(facturaId: number, empresaId: number, currentUser: string): Promise<void> {
    const cajas = await this.cajaMaeRepo.find({
      where: { documentoId: facturaId, moduloId: 1, empresaId } as FindOptionsWhere<CxccajaMae>,
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
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsDateString } from 'class-validator';

export class CreateCxcClienteDto {
  @IsString() @IsNotEmpty()
  nrocliente: string;

  @IsDateString()
  fecharegistro: string;

  @IsDateString()
  fechanacimiento: string;

  @IsString() @IsNotEmpty()
  nombres: string;

  @IsString() @IsNotEmpty()
  apellidos: string;

  @IsString() @IsNotEmpty()
  razonsocial: string;

  @IsString() @IsNotEmpty()
  dni: string;

  @IsEnum(['M', 'F']) @IsOptional()
  sexo?: string;

  @IsEnum(['S', 'C', 'D', 'V', 'U']) @IsOptional()
  estadocivil?: string;

  @IsString() @IsOptional()
  rtn?: string;

  @IsNumber() @IsOptional()
  limiteCredito?: number;

  @IsNumber()
  diasplazo: number;

  @IsNumber()
  interes: number;

  @IsNumber()
  moratorio: number;

  @IsEnum(['A', 'B', 'C', 'D', 'E']) @IsOptional()
  categoria?: string;

  @IsNumber()
  empresaId: number;
}

export class UpdateCxcClienteDto {
  @IsString() @IsOptional()
  nrocliente?: string;

  @IsDateString() @IsOptional()
  fechanacimiento?: string;

  @IsString() @IsOptional()
  nombres?: string;

  @IsString() @IsOptional()
  apellidos?: string;

  @IsString() @IsOptional()
  razonsocial?: string;

  @IsString() @IsOptional()
  dni?: string;

  @IsEnum(['M', 'F']) @IsOptional()
  sexo?: string;

  @IsEnum(['S', 'C', 'D', 'V', 'U']) @IsOptional()
  estadocivil?: string;

  @IsString() @IsOptional()
  rtn?: string;

  @IsNumber() @IsOptional()
  limiteCredito?: number;

  @IsNumber() @IsOptional()
  diasplazo?: number;

  @IsNumber() @IsOptional()
  interes?: number;

  @IsNumber() @IsOptional()
  moratorio?: number;

  @IsEnum(['A', 'B', 'C', 'D', 'E']) @IsOptional()
  categoria?: string;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;
}

export class CreateCxcMovimientoDto {
  @IsDateString()
  fecharegistro: string;

  @IsNumber()
  clienteId: number;

  @IsString() @IsNotEmpty()
  nrocliente: string;

  @IsNumber()
  moduloId: number;

  @IsNumber()
  documentoId: number;

  @IsEnum(['D', 'C']) @IsOptional()
  tipomov?: string;

  @IsString() @IsOptional()
  nroreferencia?: string;

  @IsNumber() @IsOptional()
  factordecambio?: number;

  @IsNumber() @IsOptional()
  importe?: number;

  @IsString() @IsOptional()
  concepto?: string;

  @IsNumber()
  empresaId: number;
}

export class UpdateCxcMovimientoDto {
  @IsEnum(['D', 'C']) @IsOptional()
  tipomov?: string;

  @IsString() @IsOptional()
  nroreferencia?: string;

  @IsNumber() @IsOptional()
  factordecambio?: number;

  @IsNumber() @IsOptional()
  importe?: number;

  @IsString() @IsOptional()
  concepto?: string;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_cotabilizada?: string;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_doc_anulado?: string;
}

export class CreateCxcPrestamoDto {
  @IsDateString()
  fecharegistro: string;

  @IsString()
  nroprestamo: string;

  @IsNumber()
  clienteId: number;

  @IsNumber() @IsOptional()
  capital?: number;

  @IsNumber() @IsOptional()
  prima?: number;

  @IsNumber() @IsOptional()
  capitalneto?: number;

  @IsNumber() @IsOptional()
  tasa?: number;

  @IsNumber() @IsOptional()
  cuotas?: number;

  @IsNumber() @IsOptional()
  diascuotas?: number;

  @IsNumber() @IsOptional()
  moratorio?: number;

  @IsNumber() @IsOptional()
  gestorId?: number;

  @IsNumber() @IsOptional()
  monedaId?: number;

  @IsNumber() @IsOptional()
  gracia?: number;

  @IsString() @IsOptional()
  sn_activo?: string;

  @IsString() @IsOptional()
  sn_contabilizado?: string;

  @IsNumber()
  empresaId: number;
}

export class UpdateCxcPrestamoDto {
  @IsNumber() @IsOptional()
  capital?: number;

  @IsNumber() @IsOptional()
  prima?: number;

  @IsNumber() @IsOptional()
  capitalneto?: number;

  @IsNumber() @IsOptional()
  tasa?: number;

  @IsNumber() @IsOptional()
  cuotas?: number;

  @IsNumber() @IsOptional()
  diascuotas?: number;

  @IsNumber() @IsOptional()
  moratorio?: number;

  @IsNumber() @IsOptional()
  gestorId?: number;

  @IsNumber() @IsOptional()
  monedaId?: number;

  @IsNumber() @IsOptional()
  gracia?: number;

  @IsNumber() @IsOptional()
  ultcuotapagada?: number;

  @IsString() @IsOptional()
  sn_activo?: string;

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

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
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

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_cotabilizada: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
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
  Controller, Get, Post, Put, Body, Param, Query,
  UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { CxpService } from './cxp.service';
import { CreateProveedorDto, UpdateProveedorDto } from './dto/proveedor.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('cxp')
@UseGuards(JwtAuthGuard)
export class CxpController {
  constructor(private readonly service: CxpService) {}

  @Get('proveedores')
  findAllProveedores(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllProveedores(empresaId);
  }

  @Get('proveedores/:id')
  findProveedor(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findProveedor(id, empresaId);
  }

  @Post('proveedores')
  createProveedor(@Body() dto: CreateProveedorDto, @CurrentUser() user: any) {
    return this.service.createProveedor(dto, user.usuario);
  }

  @Put('proveedores/:id')
  updateProveedor(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateProveedorDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateProveedor(id, empresaId, dto, user.usuario);
  }

  @Get('proveedores-dir')
  findAllProveedorDirs(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllProveedorDirs(empresaId);
  }

  @Get('proveedores-tel')
  findAllProveedorTels(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllProveedorTels(empresaId);
  }

  @Get('compras')
  findAllCompras(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllCompras(empresaId);
  }

  @Get('compras/:id')
  findCompra(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findCompra(id, empresaId);
  }

  @Get('compras-det')
  findAllComprasDet(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllComprasDet(empresaId);
  }

  @Get('movimientos')
  findAllMovimientos(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllMovimientos(empresaId);
  }

  @Get('historicos')
  findAllHistoricos(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllHistoricos(empresaId);
  }

  @Get('saldos-av')
  findAllSaldosAv(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllSaldosAv(empresaId);
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
import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
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
    const compra = await this.createEntity<TCxpCompraMae>(this.compraMaeRepo, dto, currentUser);

    try {
      await this.registrarKardexEntrada(compra, currentUser);
    } catch (error) {
      console.error('Error registrando Kardex entrada compra:', error);
    }

    this.eventEmitter.emit('compra.creada', { compra, currentUser });

    return compra;
  }

  private async registrarKardexEntrada(compra: TCxpCompraMae, currentUser: string): Promise<void> {
    const detalles = await this.compraDetRepo.find({
      where: { compraId: compra.compraId, empresaId: compra.empresaId } as FindOptionsWhere<TCxpCompraDet>,
    });

    for (const det of detalles) {
      await this.kardexService.registrarEntrada({
        bodegaId: det.bodegaId,
        productoId: det.cxpcomprasdetId,
        cantidad: det.cantidad,
        costoUnitario: det.precio,
        nroreferencia: compra.compraId.toString(),
        moduloId: 2,
        tipomov: 'E',
        subtipoMov: 'C',
        empresaId: compra.empresaId,
        usuarioCreated: currentUser,
        factordecambio: compra.factorcambio || 1,
        codbarra: det.codbarra,
      });
    }
  }

  async updateCompra(compraId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.compraMaeRepo, 'compraId', compraId, empresaId, dto, currentUser, 'Compra');
  }

  async findAllComprasDet(empresaId: number) {
    return this.findAllByEmpresa(this.compraDetRepo, empresaId);
  }

  async findCompraDet(cxpcomprasdetId: number, empresaId: number) {
    return this.findOneById(this.compraDetRepo, 'cxpcomprasdetId', cxpcomprasdetId, empresaId, 'Detalle Compra');
  }

  async createCompraDet(dto: any, currentUser: string) {
    return this.createEntity(this.compraDetRepo, dto, currentUser);
  }

  async updateCompraDet(cxpcomprasdetId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.compraDetRepo, 'cxpcomprasdetId', cxpcomprasdetId, empresaId, dto, currentUser, 'Detalle Compra');
  }

  async findAllMovimientos(empresaId: number) {
    return this.findAllByEmpresa(this.movimientoRepo, empresaId);
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

export class CreateProveedorDto {
  @IsString() @IsNotEmpty()
  nroproveedor: string;

  @IsString() @IsNotEmpty()
  nombres: string;

  @IsString() @IsNotEmpty()
  apellidos: string;

  @IsString() @IsOptional()
  razonsocial?: string;

  @IsString() @IsOptional()
  dni?: string;

  @IsEnum(['M', 'F']) @IsOptional()
  sexo?: string;

  @IsEnum(['S', 'C', 'D', 'V', 'U']) @IsOptional()
  estadocivil?: string;

  @IsString() @IsOptional()
  rtn?: string;

  @IsNumber() @IsOptional()
  limiteCredito?: number;

  @IsNumber()
  diasplazo: number;

  @IsNumber()
  interes: number;

  @IsNumber()
  moratorio: number;

  @IsEnum(['A', 'B', 'C', 'D', 'E']) @IsOptional()
  categoria?: string;

  @IsNumber()
  empresaId: number;
}

export class UpdateProveedorDto {
  @IsString() @IsOptional()
  nroproveedor?: string;

  @IsString() @IsOptional()
  nombres?: string;

  @IsString() @IsOptional()
  apellidos?: string;

  @IsString() @IsOptional()
  razonsocial?: string;

  @IsString() @IsOptional()
  dni?: string;

  @IsEnum(['M', 'F']) @IsOptional()
  sexo?: string;

  @IsEnum(['S', 'C', 'D', 'V', 'U']) @IsOptional()
  estadocivil?: string;

  @IsString() @IsOptional()
  rtn?: string;

  @IsNumber() @IsOptional()
  limiteCredito?: number;

  @IsNumber() @IsOptional()
  diasplazo?: number;

  @IsNumber() @IsOptional()
  interes?: number;

  @IsNumber() @IsOptional()
  moratorio?: number;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;

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

@Entity('cxpcomprasdet')
export class TCxpCompraDet {
  @PrimaryGeneratedColumn({ name: 'cxpcomprasdetId' })
  cxpcomprasdetId: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @Column()
  compraId: number;

  @Column()
  bodegaId: number;

  @Column()
  nrofila: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  codbarra: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  descripcion: string;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  cantidad: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  precio: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  subtotal: number;

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

## 📄 src\modules\cxp\entities\compra-mae.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('cxpcomprasmae')
export class TCxpCompraMae {
  @PrimaryGeneratedColumn({ name: 'compraId' })
  compraId: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @Column({ type: 'enum', enum: ['F', 'O'], default: 'F' })
  TipoCompra: string;

  @Column()
  bodegaId: number;

  @Column()
  proveedorId: number;

  @Column({ type: 'int', nullable: true })
  documentoId: number;

  @Column({ type: 'int', nullable: true })
  monedaId: number;

  @Column({ type: 'decimal', precision: 18, scale: 4, nullable: true })
  factorcambio: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  nroreferencia: string;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  descuento: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  impuesto: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  total: number;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_pagada: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_cotabilizada: string;

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

## 📄 src\modules\cxp\entities\historico.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('cxphisto')
export class TCxpHistorico {
  @PrimaryGeneratedColumn({ name: 'cxphistoId' })
  cxphistoId: number;

  @Column()
  anio: number;

  @Column()
  periodo: number;

  @Column()
  proveedorId: number;

  @Column({ type: 'varchar', length: 20 })
  codproveedor: string;

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

## 📄 src\modules\cxp\entities\movimiento.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('cxpmovimientos')
export class TCxpMovimiento {
  @PrimaryGeneratedColumn({ name: 'bcomovId' })
  bcomovId: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @Column()
  bcoctasId: number;

  @Column()
  moduloId: number;

  @Column()
  documentoId: number;

  @Column()
  proveedorId: number;

  @Column({ type: 'varchar', length: 20 })
  codproveedor: string;

  @Column({ type: 'enum', enum: ['D', 'C'], default: 'D' })
  tipomov: string;

  @Column({ type: 'varchar', length: 20 })
  nroreferencia: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  descripcion1: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  descripcion2: string;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  importe: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  nrochq: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_chq: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_chq_anulado: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_conciliado: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_contabilizado: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
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

## 📄 src\modules\cxp\entities\proveedor.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('proveedor')
export class TCxpProveedor {
  @PrimaryGeneratedColumn({ name: 'proveedorId' })
  proveedorId: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @Column({ type: 'varchar', length: 20 })
  nroproveedor: string;

  @Column({ type: 'varchar', length: 50 })
  nombres: string;

  @Column({ type: 'varchar', length: 50 })
  apellidos: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  razonsocial: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  dni: string;

  @Column({ type: 'enum', enum: ['M', 'F'], default: 'M' })
  sexo: string;

  @Column({ type: 'enum', enum: ['S', 'C', 'D', 'V', 'U'], default: 'S' })
  estadocivil: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  rtn: string;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  limiteCredito: number;

  @Column({ type: 'int' })
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

## 📄 src\modules\cxp\entities\proveedordir.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('proveedordir')
export class TCxpProveedorDir {
  @PrimaryGeneratedColumn({ name: 'proveedordireccionId' })
  proveedordireccionId: number;

  @Column()
  proveedorId: number;

  @Column({ type: 'int' })
  direccionId: number;

  @Column({ type: 'varchar', length: 10, nullable: true })
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

## 📄 src\modules\cxp\entities\proveedortel.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('proveedortel')
export class TCxpProveedorTel {
  @PrimaryGeneratedColumn({ name: 'proveedorestelefonosId' })
  proveedorestelefonosId: number;

  @Column()
  proveedorId: number;

  @Column({ type: 'int' })
  telefonoId: number;

  @Column({ type: 'varchar', length: 10, nullable: true })
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

## 📄 src\modules\cxp\entities\saldoav.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('cxpsalfav')
export class TCxpSaldoAv {
  @PrimaryGeneratedColumn({ name: 'cxpsalfavId' })
  cxpsalfavId: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @Column()
  anio: number;

  @Column()
  periodo: number;

  @Column()
  proveedorId: number;

  @Column({ type: 'varchar', length: 20 })
  codproveedor: string;

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

## 📄 src\modules\facturacion\dto\facturacion.dto.ts

```typescript
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';

export class CreatePosFacMaeDto {
  @IsNumber() @IsOptional()
  nrofactura?: number;

  @IsEnum(['E', 'C']) @IsOptional()
  tipofactura?: string;

  @IsNumber() @IsNotEmpty()
  clienteId: number;

  @IsString() @IsNotEmpty()
  nrocliente: string;

  @IsString() @IsOptional()
  nombrecliente?: string;

  @IsString() @IsOptional()
  direccion?: string;

  @IsNumber() @IsOptional()
  factordecambio?: number;

  @IsNumber() @IsOptional()
  subTotal?: number;

  @IsNumber() @IsOptional()
  impuesto?: number;

  @IsNumber() @IsOptional()
  descuento?: number;

  @IsNumber() @IsOptional()
  total?: number;

  @IsNumber() @IsOptional()
  efectivo_recibido?: number;

  @IsNumber() @IsOptional()
  importe_cambio?: number;

  @IsNumber() @IsOptional()
  diascredito?: number;

  @IsString() @IsOptional()
  fechavencimiento?: string;

  @IsNumber() @IsNotEmpty()
  bodegaId: number;

  @IsNumber() @IsNotEmpty()
  cajaId: number;

  @IsNumber() @IsNotEmpty()
  gestorId: number;

  @IsNumber() @IsNotEmpty()
  formapagoId: number;

  @IsNumber() @IsOptional()
  tarjetacreditoId?: number;

  @IsString() @IsOptional()
  nrotarjeta?: string;

  @IsString() @IsOptional()
  nroreferencia?: string;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_excenta?: string;

  @IsString() @IsOptional()
  nrocarnet?: string;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_pagada?: string;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_anulada?: string;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_contabilizada?: string;

  @IsNumber() @IsNotEmpty()
  empresaId: number;
}

export class UpdatePosFacMaeDto {
  @IsNumber() @IsOptional()
  nrofactura?: number;

  @IsEnum(['E', 'C']) @IsOptional()
  tipofactura?: string;

  @IsNumber() @IsOptional()
  clienteId?: number;

  @IsString() @IsOptional()
  nrocliente?: string;

  @IsString() @IsOptional()
  nombrecliente?: string;

  @IsString() @IsOptional()
  direccion?: string;

  @IsNumber() @IsOptional()
  factordecambio?: number;

  @IsNumber() @IsOptional()
  subTotal?: number;

  @IsNumber() @IsOptional()
  impuesto?: number;

  @IsNumber() @IsOptional()
  descuento?: number;

  @IsNumber() @IsOptional()
  total?: number;

  @IsNumber() @IsOptional()
  efectivo_recibido?: number;

  @IsNumber() @IsOptional()
  importe_cambio?: number;

  @IsNumber() @IsOptional()
  diascredito?: number;

  @IsString() @IsOptional()
  fechavencimiento?: string;

  @IsNumber() @IsOptional()
  bodegaId?: number;

  @IsNumber() @IsOptional()
  cajaId?: number;

  @IsNumber() @IsOptional()
  gestorId?: number;

  @IsNumber() @IsOptional()
  formapagoId?: number;

  @IsNumber() @IsOptional()
  tarjetacreditoId?: number;

  @IsString() @IsOptional()
  nrotarjeta?: string;

  @IsString() @IsOptional()
  nroreferencia?: string;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_excenta?: string;

  @IsString() @IsOptional()
  nrocarnet?: string;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_pagada?: string;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_anulada?: string;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_contabilizada?: string;
}

export class CreatePosCotMaeDto {
  @IsString() @IsNotEmpty()
  Nombrecliente: string;

  @IsString() @IsNotEmpty()
  direccion: string;

  @IsString() @IsNotEmpty()
  atendio: string;

  @IsNumber() @IsNotEmpty()
  gestorId: number;

  @IsNumber() @IsNotEmpty()
  empresaId: number;
}

export class UpdatePosCotMaeDto {
  @IsString() @IsOptional()
  Nombrecliente?: string;

  @IsString() @IsOptional()
  direccion?: string;

  @IsString() @IsOptional()
  atendio?: string;

  @IsNumber() @IsOptional()
  gestorId?: number;
}

export class CreatePosPedMaeDto {
  @IsString() @IsNotEmpty()
  nombrecliente: string;

  @IsString() @IsNotEmpty()
  nrotelefono: string;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_enviogratis?: string;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_facturado?: string;

  @IsNumber() @IsOptional()
  facturaId?: number;

  @IsNumber() @IsNotEmpty()
  empresaId: number;
}

export class UpdatePosPedMaeDto {
  @IsString() @IsOptional()
  nombrecliente?: string;

  @IsString() @IsOptional()
  nrotelefono?: string;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_enviogratis?: string;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_facturado?: string;

  @IsNumber() @IsOptional()
  facturaId?: number;
}

```

---

## 📄 src\modules\facturacion\entities\poscbodet.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('poscbodet')
export class TPosCboDet {
  @PrimaryGeneratedColumn({ name: 'poscbodetId' })
  poscbodetId: number;

  @Column()
  poscbomaeId: number;

  @Column({ nullable: true })
  productoId: number;

  @Column({ type: 'varchar', length: 20 })
  codbarra: string;

  @Column({ nullable: true })
  cantidad: number;

  @Column({ type: 'double', nullable: true })
  precioventa: number;

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

## 📄 src\modules\facturacion\entities\poscbomae.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('poscbomae')
export class TPosCboMae {
  @PrimaryGeneratedColumn({ name: 'poscbomaeId' })
  poscbomaeId: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  descripcion: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fec_vig_desde: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fec_vig_hasta: Date;

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

## 📄 src\modules\facturacion\entities\poscorrelativos.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('poscorrelativos')
export class TPosCorrelativos {
  @PrimaryGeneratedColumn({ name: 'poscorrelativosId' })
  poscorrelativosId: number;

  @Column()
  nrofactura: number;

  @Column({ type: 'varchar', length: 35 })
  TCPIP: string;

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

## 📄 src\modules\facturacion\entities\poscotdet.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('poscotdet')
export class TPosCotDet {
  @PrimaryGeneratedColumn({ name: 'poscotdetId' })
  poscotdetId: number;

  @Column()
  poscotmaeId: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @Column({ type: 'varchar', length: 20, nullable: true })
  productoId: string;

  @Column({ type: 'varchar', length: 20 })
  codbarra: string;

  @Column({ type: 'decimal', precision: 20, scale: 2 })
  cantidad: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  precio: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  subTotal: number;

  @Column({ nullable: true })
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

## 📄 src\modules\facturacion\entities\poscotmae.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('poscotmae')
export class TPosCotMae {
  @PrimaryGeneratedColumn({ name: 'poscotmaeId' })
  poscotmaeId: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @Column({ type: 'varchar', length: 100 })
  Nombrecliente: string;

  @Column({ type: 'varchar', length: 255 })
  direccion: string;

  @Column({ type: 'varchar', length: 100 })
  atendio: string;

  @Column()
  gestorId: number;

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

## 📄 src\modules\facturacion\entities\posfacdet.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('posfacdet')
export class TPosFacDet {
  @PrimaryGeneratedColumn({ name: 'posfacdetId' })
  posfacdetId: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @Column({ nullable: true })
  facturaId: number;

  @Column({ nullable: true })
  bodegaId: number;

  @Column({ nullable: true })
  nrofila: number;

  @Column()
  productoId: number;

  @Column({ type: 'varchar', length: 20 })
  codbarra: string;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  cantidad: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  precioventa: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  impuesto: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  subTotal: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  descuento: number;

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

## 📄 src\modules\facturacion\entities\posfacdetanul.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('posfacdetanul')
export class TPosFacDetAnul {
  @PrimaryGeneratedColumn({ name: 'posfacdetanulacionId' })
  posfacdetanulacionId: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @Column()
  posfacmaeanulId: number;

  @Column()
  bodegaId: number;

  @Column()
  productoId: number;

  @Column({ type: 'varchar', length: 20 })
  codbarra: string;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  cantidad: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  precio: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  subTotal: number;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  estado: string;

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

## 📄 src\modules\facturacion\entities\posfacmae.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('posfacmae')
export class TPosFacMae {
  @PrimaryGeneratedColumn({ name: 'facturaId' })
  facturaId: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @Column()
  nrofactura: number;

  @Column({ type: 'enum', enum: ['E', 'C'], default: 'E' })
  tipofactura: string;

  @Column()
  clienteId: number;

  @Column({ type: 'varchar', length: 20 })
  nrocliente: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  nombrecliente: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  direccion: string;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  factordecambio: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  subTotal: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  impuesto: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  descuento: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  total: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  efectivo_recibido: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  importe_cambio: number;

  @Column({ default: 0 })
  diascredito: number;

  @Column({ type: 'datetime', nullable: true })
  fechavencimiento: Date;

  @Column()
  bodegaId: number;

  @Column()
  cajaId: number;

  @Column()
  gestorId: number;

  @Column()
  formapagoId: number;

  @Column({ nullable: true })
  tarjetacreditoId: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  nrotarjeta: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  nroreferencia: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_excenta: string;

  @Column({ type: 'varchar', length: 12, nullable: true })
  nrocarnet: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_pagada: string;

  @Column({ type: 'datetime', nullable: true })
  Hora: Date;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_anulada: string;

  @Column({ type: 'datetime', nullable: true })
  fechaanulacion: Date;

  @Column({ nullable: true })
  anulaciond: number;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_contabilizada: string;

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

## 📄 src\modules\facturacion\entities\posfacmaeanul.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('posfacmaeanul')
export class TPosFacMaeAnul {
  @PrimaryGeneratedColumn({ name: 'posfacmaeanulId' })
  posfacmaeanulId: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @Column()
  facturaId: number;

  @Column({ nullable: true })
  bodegaId: number;

  @Column()
  clienteId: number;

  @Column({ type: 'varchar', length: 20 })
  nrocliente: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_excento: string;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  factordecambio: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  subTotal: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  impuesto: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  descuento: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  total: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  observacion: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  estado: string;

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

## 📄 src\modules\facturacion\entities\pospeddet.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('pospeddet')
export class TPosPedDet {
  @PrimaryGeneratedColumn({ name: 'pospeddetId' })
  pospeddetId: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @Column()
  pospedmaeId: number;

  @Column()
  nrofila: number;

  @Column()
  productoId: number;

  @Column({ type: 'varchar', length: 20 })
  codbarra: string;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  cantidad: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  precioventa: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  descuento: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  impuesto: number;

  @Column({ nullable: true })
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

## 📄 src\modules\facturacion\entities\pospedmae.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('pospedmae')
export class TPosPedMae {
  @PrimaryGeneratedColumn({ name: 'pospedmaeId' })
  pospedmaeId: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @Column({ type: 'varchar', length: 50 })
  nombrecliente: string;

  @Column({ type: 'varchar', length: 20 })
  nrotelefono: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_enviogratis: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_facturado: string;

  @Column({ nullable: true })
  facturaId: number;

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

## 📄 src\modules\facturacion\entities\tposdescuentos.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('tposdescuentos')
export class TPosDescuentos {
  @PrimaryGeneratedColumn({ name: 'descuentoId' })
  descuentoId: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  descripcion: string;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  porcentaje: number;

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

## 📄 src\modules\facturacion\entities\tpospreciovtas.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('tpospreciovtas')
export class TPosPrecioVtas {
  @PrimaryGeneratedColumn({ name: 'preciovtaId' })
  preciovtaId: number;

  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

  @Column({ type: 'double', nullable: true })
  porcentaje: number;

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

## 📄 src\modules\facturacion\facturacion.controller.ts

```typescript
import {
  Controller, Get, Post, Put, Body, Param, Query,
  UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { FacturacionService } from './facturacion.service';
import {
  CreatePosFacMaeDto, UpdatePosFacMaeDto,
  CreatePosCotMaeDto, UpdatePosCotMaeDto,
  CreatePosPedMaeDto, UpdatePosPedMaeDto,
} from './dto/facturacion.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('facturacion')
@UseGuards(JwtAuthGuard)
export class FacturacionController {
  constructor(private readonly service: FacturacionService) {}

  @Get('correlativos')
  findAllCorrelativos(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllCorrelativos(empresaId);
  }

  @Get('correlativos/:id')
  findCorrelativo(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findCorrelativo(id, empresaId);
  }

  @Post('correlativos')
  createCorrelativo(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createCorrelativo(dto, user.usuario);
  }

  @Put('correlativos/:id')
  updateCorrelativo(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateCorrelativo(id, empresaId, dto, user.usuario);
  }

  @Get('facturas')
  findAllFacturas(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllFacturas(empresaId);
  }

  @Get('facturas/:id')
  findFactura(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findFactura(id, empresaId);
  }

  @Post('facturas')
  createFactura(@Body() dto: CreatePosFacMaeDto, @CurrentUser() user: any) {
    return this.service.createFactura(dto, user.usuario);
  }

  @Put('facturas/:id')
  updateFactura(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdatePosFacMaeDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateFactura(id, empresaId, dto, user.usuario);
  }

  @Get('facturas-det')
  findAllFacturaDet(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllFacturaDet(empresaId);
  }

  @Get('facturas-det/:id')
  findFacturaDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findFacturaDet(id, empresaId);
  }

  @Post('facturas-det')
  createFacturaDet(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createFacturaDet(dto, user.usuario);
  }

  @Put('facturas-det/:id')
  updateFacturaDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateFacturaDet(id, empresaId, dto, user.usuario);
  }

  @Get('facturas-anul')
  findAllFacturaAnul(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllFacturaAnul(empresaId);
  }

  @Get('facturas-anul/:id')
  findFacturaAnul(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findFacturaAnul(id, empresaId);
  }

  @Post('facturas-anul')
  createFacturaAnul(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createFacturaAnul(dto, user.usuario);
  }

  @Put('facturas-anul/:id')
  updateFacturaAnul(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateFacturaAnul(id, empresaId, dto, user.usuario);
  }

  @Get('facturas-det-anul')
  findAllFacturaDetAnul(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllFacturaDetAnul(empresaId);
  }

  @Get('facturas-det-anul/:id')
  findFacturaDetAnul(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findFacturaDetAnul(id, empresaId);
  }

  @Post('facturas-det-anul')
  createFacturaDetAnul(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createFacturaDetAnul(dto, user.usuario);
  }

  @Put('facturas-det-anul/:id')
  updateFacturaDetAnul(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateFacturaDetAnul(id, empresaId, dto, user.usuario);
  }

  @Get('cotizaciones')
  findAllCotizaciones(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllCotizaciones(empresaId);
  }

  @Get('cotizaciones/:id')
  findCotizacion(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findCotizacion(id, empresaId);
  }

  @Post('cotizaciones')
  createCotizacion(@Body() dto: CreatePosCotMaeDto, @CurrentUser() user: any) {
    return this.service.createCotizacion(dto, user.usuario);
  }

  @Put('cotizaciones/:id')
  updateCotizacion(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdatePosCotMaeDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateCotizacion(id, empresaId, dto, user.usuario);
  }

  @Get('cotizaciones-det')
  findAllCotizacionDet(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllCotizacionDet(empresaId);
  }

  @Get('cotizaciones-det/:id')
  findCotizacionDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findCotizacionDet(id, empresaId);
  }

  @Post('cotizaciones-det')
  createCotizacionDet(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createCotizacionDet(dto, user.usuario);
  }

  @Put('cotizaciones-det/:id')
  updateCotizacionDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateCotizacionDet(id, empresaId, dto, user.usuario);
  }

  @Get('pedidos')
  findAllPedidos(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllPedidos(empresaId);
  }

  @Get('pedidos/:id')
  findPedido(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findPedido(id, empresaId);
  }

  @Post('pedidos')
  createPedido(@Body() dto: CreatePosPedMaeDto, @CurrentUser() user: any) {
    return this.service.createPedido(dto, user.usuario);
  }

  @Put('pedidos/:id')
  updatePedido(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdatePosPedMaeDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updatePedido(id, empresaId, dto, user.usuario);
  }

  @Get('pedidos-det')
  findAllPedidoDet(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllPedidoDet(empresaId);
  }

  @Get('pedidos-det/:id')
  findPedidoDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findPedidoDet(id, empresaId);
  }

  @Post('pedidos-det')
  createPedidoDet(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createPedidoDet(dto, user.usuario);
  }

  @Put('pedidos-det/:id')
  updatePedidoDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updatePedidoDet(id, empresaId, dto, user.usuario);
  }

  @Get('combos')
  findAllCombos(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllComboMae(empresaId);
  }

  @Get('combos/:id')
  findCombo(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findComboMae(id, empresaId);
  }

  @Post('combos')
  createCombo(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createComboMae(dto, user.usuario);
  }

  @Put('combos/:id')
  updateCombo(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateComboMae(id, empresaId, dto, user.usuario);
  }

  @Get('combos-det')
  findAllComboDet(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllComboDet(empresaId);
  }

  @Get('combos-det/:id')
  findComboDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findComboDet(id, empresaId);
  }

  @Post('combos-det')
  createComboDet(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createComboDet(dto, user.usuario);
  }

  @Put('combos-det/:id')
  updateComboDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateComboDet(id, empresaId, dto, user.usuario);
  }

  @Get('precios')
  findAllPrecios(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllPrecios(empresaId);
  }

  @Get('precios/:id')
  findPrecio(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findPrecio(id, empresaId);
  }

  @Post('precios')
  createPrecio(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createPrecio(dto, user.usuario);
  }

  @Put('precios/:id')
  updatePrecio(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updatePrecio(id, empresaId, dto, user.usuario);
  }

  @Get('descuentos')
  findAllDescuentos(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllDescuentos(empresaId);
  }

  @Get('descuentos/:id')
  findDescuento(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findDescuento(id, empresaId);
  }

  @Post('descuentos')
  createDescuento(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createDescuento(dto, user.usuario);
  }

  @Put('descuentos/:id')
  updateDescuento(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateDescuento(id, empresaId, dto, user.usuario);
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
import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
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
import {
  CreatePosFacMaeDto, UpdatePosFacMaeDto,
  CreatePosCotMaeDto, UpdatePosCotMaeDto,
  CreatePosPedMaeDto, UpdatePosPedMaeDto,
} from './dto/facturacion.dto';
import { CxcService } from '../cxc/cxc.service';
import { KardexService } from '../inventario/kardex.service';

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
    return this.findOneById(this.facMaeRepo, 'facturaId', facturaId, empresaId, 'Factura');
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

    try {
      await this.registrarKardexSalida(factura, currentUser);
    } catch (error) {
      console.error('Error registrando Kardex:', error);
    }

    this.eventEmitter.emit('factura.creada', { factura, currentUser });

    return factura;
  }

  private async registrarKardexSalida(factura: any, currentUser: string): Promise<void> {
    const detalles = await this.facDetRepo.find({
      where: { facturaId: factura.facturaId, empresaId: factura.empresaId } as FindOptionsWhere<TPosFacDet>,
    });

    for (const det of detalles) {
      await this.kardexService.registrarSalida({
        bodegaId: factura.bodegaId,
        productoId: det.productoId,
        cantidad: det.cantidad,
        costoUnitario: det.precioventa || 0,
        nroreferencia: factura.nrofactura.toString(),
        moduloId: 1,
        tipomov: 'S',
        subtipoMov: 'V',
        empresaId: factura.empresaId,
        usuarioCreated: currentUser,
        factordecambio: factura.factordecambio || 1,
        codbarra: det.codbarra,
      });
    }
  }

  private async asignarCorrelativo(empresaId: number, currentUser: string): Promise<number> {
    const corr = await this.correlativosRepo.findOne({
      where: { empresaId } as unknown as FindOptionsWhere<TPosCorrelativos>,
      order: { poscorrelativosId: 'ASC' } as any,
    });
    if (!corr) return 1;
    const actual = Number(corr.nrofactura) || 0;
    corr.nrofactura = actual + 1;
    corr.usuarioUpdated = currentUser;
    corr.fechaUpdated = new Date();
    await this.correlativosRepo.save(corr);
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
    const anulacion = await this.createEntity(this.facMaeAnulRepo, dto, currentUser);

    const facturaOriginal = await this.facMaeRepo.findOne({
      where: { facturaId: dto.facturaId, empresaId: dto.empresaId } as FindOptionsWhere<TPosFacMae>,
    });

    if (facturaOriginal) {
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
        await this.cxcService.anularMovimientoFactura(facturaOriginal.facturaId, facturaOriginal.empresaId, currentUser);
      } catch (error) {
        console.error('Error anulando movimiento CXC:', error);
      }

      try {
        await this.cxcService.anularCajaPorFactura(facturaOriginal.facturaId, facturaOriginal.empresaId, currentUser);
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

  async createComboDet(dto: any, currentUser: string) {
    return this.createEntity(this.cboDetRepo, dto, currentUser);
  }

  async updateComboDet(poscbodetId: number, empresaId: number, dto: any, currentUser: string) {
    return this.updateEntity(this.cboDetRepo, 'poscbodetId', poscbodetId, empresaId, dto, currentUser, 'Detalle Combo');
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
}

```

---

## 📄 src\modules\inventario\dto\categoria.dto.ts

```typescript
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';

export class CreateCategoriaDto {
  @IsString() @IsNotEmpty()
  descripcion: string;

  @IsNumber()
  empresaId: number;
}

export class UpdateCategoriaDto {
  @IsString() @IsOptional()
  descripcion?: string;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;
}

```

---

## 📄 src\modules\inventario\dto\producto.dto.ts

```typescript
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsDateString } from 'class-validator';

export class CreateProductoDto {
  @IsString() @IsOptional()
  codbarra?: string;

  @IsString() @IsNotEmpty()
  descripcion: string;

  @IsString() @IsOptional()
  descripcion_corta?: string;

  @IsNumber() @IsOptional()
  cstounit?: number;

  @IsNumber() @IsOptional()
  cstoprom?: number;

  @IsNumber() @IsOptional()
  precioventa?: number;

  @IsDateString() @IsOptional()
  fecUltcom?: string;

  @IsDateString() @IsOptional()
  fecUltvta?: string;

  @IsNumber() @IsOptional()
  puntoretorno?: number;

  @IsNumber()
  categoriaId: number;
  
  @IsNumber() @IsOptional()
  impuestoId?: number;

  @IsNumber()
  empresaId: number;
}

export class UpdateProductoDto {
  @IsString() @IsOptional()
  codbarra?: string;

  @IsString() @IsOptional()
  descripcion?: string;

  @IsString() @IsOptional()
  descripcion_corta?: string;

  @IsNumber() @IsOptional()
  cstounit?: number;

  @IsNumber() @IsOptional()
  cstoprom?: number;

  @IsNumber() @IsOptional()
  precioventa?: number;

  @IsDateString() @IsOptional()
  fecUltcom?: string;

  @IsDateString() @IsOptional()
  fecUltvta?: string;

  @IsNumber() @IsOptional()
  puntoretorno?: number;

  @IsNumber() @IsOptional()
  categoriaId?: number;
  
  @IsNumber() @IsOptional()
  impuestoId?: number;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;
}
```

---

## 📄 src\modules\inventario\dto\proveedor.dto.ts

```typescript
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsDateString } from 'class-validator';

export class CreateProveedorDto {
  @IsString() @IsNotEmpty()
  nroproveedor: string;

  @IsString() @IsNotEmpty()
  nombres: string;

  @IsString() @IsNotEmpty()
  apellidos: string;

  @IsString() @IsOptional()
  razonsocial?: string;

  @IsString() @IsOptional()
  dni?: string;

  @IsEnum(['M', 'F']) @IsOptional()
  sexo?: string;

  @IsEnum(['S', 'C', 'D', 'V', 'U']) @IsOptional()
  estadocivil?: string;

  @IsString() @IsOptional()
  rtn?: string;

  @IsNumber() @IsOptional()
  limiteCredito?: number;

  @IsNumber() @IsOptional()
  diasplazo?: number;

  @IsNumber() @IsOptional()
  interes?: number;

  @IsNumber() @IsOptional()
  moratorio?: number;

  @IsEnum(['A', 'B', 'C', 'D', 'E']) @IsOptional()
  categoria?: string;

  @IsNumber()
  empresaId: number;
}

export class UpdateProveedorDto {
  @IsString() @IsOptional()
  nroproveedor?: string;

  @IsString() @IsOptional()
  nombres?: string;

  @IsString() @IsOptional()
  apellidos?: string;

  @IsString() @IsOptional()
  razonsocial?: string;

  @IsString() @IsOptional()
  dni?: string;

  @IsEnum(['M', 'F']) @IsOptional()
  sexo?: string;

  @IsEnum(['S', 'C', 'D', 'V', 'U']) @IsOptional()
  estadocivil?: string;

  @IsString() @IsOptional()
  rtn?: string;

  @IsNumber() @IsOptional()
  limiteCredito?: number;

  @IsNumber() @IsOptional()
  diasplazo?: number;

  @IsNumber() @IsOptional()
  interes?: number;

  @IsNumber() @IsOptional()
  moratorio?: number;

  @IsEnum(['A', 'B', 'C', 'D', 'E']) @IsOptional()
  categoria?: string;

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

@Entity('tinvbodegas')
export class TinvBodega {
  @PrimaryGeneratedColumn({ name: 'bodegaId' })
  bodegaId: number;

  @Column({ type: 'varchar', length: 50 })
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

## 📄 src\modules\inventario\entities\casa.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('tinvcasas')
export class TinvCasa {
  @PrimaryGeneratedColumn({ name: 'casaId' })
  casaId: number;

  @Column({ type: 'varchar', length: 50 })
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

## 📄 src\modules\inventario\entities\categoria.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('tinvcategoria')
export class TinvCategoria {
  @PrimaryGeneratedColumn({ name: 'categoriaId' })
  categoriaId: number;

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

## 📄 src\modules\inventario\entities\color.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('tinvcolores')
export class TinvColor {
  @PrimaryGeneratedColumn({ name: 'colorId' })
  colorId: number;

  @Column({ type: 'varchar', length: 50 })
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

## 📄 src\modules\inventario\entities\embalaje.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('tinvembalajes')
export class TinvEmbalaje {
  @PrimaryGeneratedColumn({ name: 'embalajeId' })
  embalajeId: number;

  @Column({ type: 'varchar', length: 50 })
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

## 📄 src\modules\inventario\entities\existencia.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('invexistencias')
export class TinvExistencia {
  @PrimaryGeneratedColumn({ name: 'invexistenciaId' })
  invexistenciaId: number;

  @Column()
  bodegaId: number;

  @Column()
  productoId: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  existencia: number;

  @Column({ type: 'decimal', precision: 18, scale: 4, nullable: true })
  costounitario: number;

  @Column({ type: 'decimal', precision: 18, scale: 4, nullable: true })
  precioventa: number;

  @Column({ type: 'datetime', nullable: true })
  fecUltCompra: Date;

  @Column({ type: 'datetime', nullable: true })
  fecUltVta: Date;

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

## 📄 src\modules\inventario\entities\kardex.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('invkardex')
export class TinvKardex {
  @PrimaryGeneratedColumn({ name: 'invkardexId' })
  invkardexId: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @Column()
  bodegaId: number;

  @Column()
  productoId: number;

  @Column({ type: 'varchar', length: 20 })
  codbarra: string;

  @Column({ type: 'datetime', nullable: true })
  FechaIngreso: Date;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  factordecambio: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  cantidad: number;

  @Column({ type: 'int' })
  existencia: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  costoUnitario: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  subTotal: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  saldoAnterior: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  saldoActual: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  costoTotal: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  costoUSD: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  subTotalUSD: number;

  @Column({ type: 'varchar', length: 20 })
  nroreferencia: string;

  @Column({ type: 'enum', enum: ['E', 'S'], default: 'E' })
  tipomov: string;

  @Column({ type: 'varchar', length: 2, default: 'O' })
  subtipoMov: string;

  @Column()
  moduloId: number;

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

## 📄 src\modules\inventario\entities\marca.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('tinvmarcas')
export class TinvMarca {
  @PrimaryGeneratedColumn({ name: 'marcaId' })
  marcaId: number;

  @Column({ type: 'varchar', length: 50 })
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

## 📄 src\modules\inventario\entities\modelo.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('tinvmodelos')
export class TinvModelo {
  @PrimaryGeneratedColumn({ name: 'modeloId' })
  modeloId: number;

  @Column({ type: 'varchar', length: 50 })
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

## 📄 src\modules\inventario\entities\pasillo.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('tinvpasillos')
export class TinvPasillo {
  @PrimaryGeneratedColumn({ name: 'pasilloId' })
  pasilloId: number;

  @Column({ type: 'varchar', length: 50 })
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

## 📄 src\modules\inventario\entities\producto-codbarra.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('productocodbarras')
export class TproductoCodBarra {
  @PrimaryGeneratedColumn()
  productocodbarrasId: number;

  @Column({ type: 'int' })
  productoId: number;

  @Column({ type: 'varchar', length: 20 })
  codbarra: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

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

## 📄 src\modules\inventario\entities\producto-det.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('productosdet')
export class TproductoDet {
  @PrimaryGeneratedColumn()
  productosdetsId: number;

  @Column({ type: 'int' })
  produtoId: number;

  @Column({
    type: 'enum',
    enum: ['MARCA', 'MODELO', 'EMBALAJE', 'PASILLO', 'DEPARTAMENTO', 'UBICACION', 'COLOR', 'PESO', 'EQUIVALENCIA', 'CODIGOBARRA', 'TAMAÑO'],
    default: 'MARCA',
  })
  tipo: string;

  @Column({ type: 'varchar', length: 30 })
  descripcion: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

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

## 📄 src\modules\inventario\entities\producto-img.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('productoimg')
export class TproductoImg {
  @PrimaryGeneratedColumn()
  productoimgId: number;

  @Column({ type: 'int' })
  productoId: number;

  @Column({ type: 'longtext' })
  img: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

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

## 📄 src\modules\inventario\entities\producto.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TinvCategoria } from './categoria.entity';

@Entity('productos')
export class Tproducto {
  @PrimaryGeneratedColumn({ name: 'produtoId' })
  produtoId: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  codbarra: string;

  @Column({ type: 'varchar', length: 250, nullable: true })
  descripcion: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  descripcion_corta: string;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  cstounit: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  cstoprom: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  precioventa: number;

  @Column({ type: 'datetime', nullable: true })
  fecUltcom: Date;

  @Column({ type: 'datetime', nullable: true })
  fecUltvta: Date;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  puntoretorno: number;

  @Column()
  categoriaId: number;
 
  @Column() // se agrego para el manejo de impuestos por productos, sin embargo se podra obtener de forma preinicializada 
  // de la ttipoparaminv por medio de impuestoventaId, ya que hay productos que pagan mas impuestos como por ejemplo los licores y cerverza 
  impuestoId: number;

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

@Entity('proveedor')
export class Tproveedor {
  @PrimaryGeneratedColumn({ name: 'proveedorId' })
  proveedorId: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @Column({ type: 'varchar', length: 20 })
  nroproveedor: string;

  @Column({ type: 'varchar', length: 50 })
  nombres: string;

  @Column({ type: 'varchar', length: 50 })
  apellidos: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  razonsocial: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  dni: string;

  @Column({ type: 'enum', enum: ['M', 'F'], default: 'M' })
  sexo: string;

  @Column({ type: 'enum', enum: ['S', 'C', 'D', 'V', 'U'], default: 'S' })
  estadocivil: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  rtn: string;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  limiteCredito: number;

  @Column({ type: 'int', default: 0 })
  diasplazo: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  interes: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
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

## 📄 src\modules\inventario\entities\tag.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('tinvtags')
export class TinvTag {
  @PrimaryGeneratedColumn({ name: 'tagsId' })
  tagsId: number;

  @Column({ type: 'varchar', length: 50 })
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

## 📄 src\modules\inventario\entities\ubicacion.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('tinvubicaciones')
export class TinvUbicacion {
  @PrimaryGeneratedColumn({ name: 'ubicacionId' })
  ubicacionId: number;

  @Column({ type: 'varchar', length: 50 })
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

## 📄 src\modules\inventario\entities\unidad-medida.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('tinvunidadmedida')
export class TinvUnidadMedida {
  @PrimaryGeneratedColumn({ name: 'unidadmedidaId' })
  unidadmedidaId: number;

  @Column({ type: 'varchar', length: 50 })
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

## 📄 src\modules\inventario\inventario.controller.ts

```typescript
import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { InventarioService } from './inventario.service';
import { KardexService, KardexEntradaDto, KardexSalidaDto } from './kardex.service';
import { CreateProductoDto, UpdateProductoDto } from './dto/producto.dto';
import { CreateCategoriaDto, UpdateCategoriaDto } from './dto/categoria.dto';
import { CreateProveedorDto, UpdateProveedorDto } from './dto/proveedor.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('inventario')
@UseGuards(JwtAuthGuard)
export class InventarioController {
  constructor(
    private readonly service: InventarioService,
    private readonly kardexService: KardexService,
  ) {}

  @Get('productos')
  findAllProductos(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllProductos(empresaId);
  }

  @Get('productos/buscar')
  searchProductos(
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Query('q') termino: string,
  ) {
    return this.service.searchProductos(empresaId, termino);
  }

  @Get('productos/paginado')
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
  findProducto(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findProducto(id, empresaId);
  }

  @Post('productos')
  createProducto(@Body() dto: CreateProductoDto, @CurrentUser() user: any) {
    return this.service.createProducto(dto, user.usuario);
  }

  @Put('productos/:id')
  updateProducto(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateProductoDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateProducto(id, empresaId, dto, user.usuario);
  }

  @Get('categorias')
  findAllCategorias(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllCategorias(empresaId);
  }

  @Get('categorias/:id')
  findCategoria(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findCategoria(id, empresaId);
  }

  @Post('categorias')
  createCategoria(@Body() dto: CreateCategoriaDto, @CurrentUser() user: any) {
    return this.service.createCategoria(dto, user.usuario);
  }

  @Put('categorias/:id')
  updateCategoria(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateCategoriaDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateCategoria(id, empresaId, dto, user.usuario);
  }

  @Get('marcas')
  findAllMarcas(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllMarcas(empresaId);
  }

  @Get('marcas/:id')
  findMarca(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findMarca(id, empresaId);
  }

  @Post('marcas')
  createMarca(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createMarca(dto, user.usuario);
  }

  @Put('marcas/:id')
  updateMarca(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateMarca(id, empresaId, dto, user.usuario);
  }

  @Get('modelos')
  findAllModelos(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllModelos(empresaId);
  }

  @Get('modelos/:id')
  findModelo(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findModelo(id, empresaId);
  }

  @Post('modelos')
  createModelo(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createModelo(dto, user.usuario);
  }

  @Put('modelos/:id')
  updateModelo(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateModelo(id, empresaId, dto, user.usuario);
  }

  @Get('colores')
  findAllColores(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllColores(empresaId);
  }

  @Get('colores/:id')
  findColor(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findColor(id, empresaId);
  }

  @Post('colores')
  createColor(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createColor(dto, user.usuario);
  }

  @Put('colores/:id')
  updateColor(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateColor(id, empresaId, dto, user.usuario);
  }

  @Get('unidades-medida')
  findAllUnidadesMedida(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllUnidadesMedida(empresaId);
  }

  @Get('unidades-medida/:id')
  findUnidadMedida(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findUnidadMedida(id, empresaId);
  }

  @Post('unidades-medida')
  createUnidadMedida(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createUnidadMedida(dto, user.usuario);
  }

  @Put('unidades-medida/:id')
  updateUnidadMedida(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateUnidadMedida(id, empresaId, dto, user.usuario);
  }

  @Get('embalajes')
  findAllEmbalajes(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllEmbalajes(empresaId);
  }

  @Get('embalajes/:id')
  findEmbalaje(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findEmbalaje(id, empresaId);
  }

  @Post('embalajes')
  createEmbalaje(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createEmbalaje(dto, user.usuario);
  }

  @Put('embalajes/:id')
  updateEmbalaje(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateEmbalaje(id, empresaId, dto, user.usuario);
  }

  @Get('bodegas')
  findAllBodegas(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllBodegas(empresaId);
  }

  @Get('bodegas/:id')
  findBodega(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findBodega(id, empresaId);
  }

  @Post('bodegas')
  createBodega(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createBodega(dto, user.usuario);
  }

  @Put('bodegas/:id')
  updateBodega(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateBodega(id, empresaId, dto, user.usuario);
  }

  @Get('ubicaciones')
  findAllUbicaciones(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllUbicaciones(empresaId);
  }

  @Get('ubicaciones/:id')
  findUbicacion(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findUbicacion(id, empresaId);
  }

  @Post('ubicaciones')
  createUbicacion(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createUbicacion(dto, user.usuario);
  }

  @Put('ubicaciones/:id')
  updateUbicacion(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateUbicacion(id, empresaId, dto, user.usuario);
  }

  @Get('pasillos')
  findAllPasillos(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllPasillos(empresaId);
  }

  @Get('pasillos/:id')
  findPasillo(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findPasillo(id, empresaId);
  }

  @Post('pasillos')
  createPasillo(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createPasillo(dto, user.usuario);
  }

  @Put('pasillos/:id')
  updatePasillo(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updatePasillo(id, empresaId, dto, user.usuario);
  }

  @Get('casas')
  findAllCasas(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllCasas(empresaId);
  }

  @Get('casas/:id')
  findCasa(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findCasa(id, empresaId);
  }

  @Post('casas')
  createCasa(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createCasa(dto, user.usuario);
  }

  @Put('casas/:id')
  updateCasa(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateCasa(id, empresaId, dto, user.usuario);
  }

  @Get('testantes')
  findAllTestantes(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllTestantes(empresaId);
  }

  @Get('testantes/:id')
  findTestante(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findTestante(id, empresaId);
  }

  @Post('testantes')
  createTestante(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createTestante(dto, user.usuario);
  }

  @Put('testantes/:id')
  updateTestante(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateTestante(id, empresaId, dto, user.usuario);
  }

  @Get('tags')
  findAllTags(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllTags(empresaId);
  }

  @Get('tags/:id')
  findTag(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findTag(id, empresaId);
  }

  @Post('tags')
  createTag(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createTag(dto, user.usuario);
  }

  @Put('tags/:id')
  updateTag(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateTag(id, empresaId, dto, user.usuario);
  }

  @Get('proveedores')
  findAllProveedores(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllProveedores(empresaId);
  }

  @Get('proveedores/:id')
  findProveedor(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findProveedor(id, empresaId);
  }

  @Post('proveedores')
  createProveedor(@Body() dto: CreateProveedorDto, @CurrentUser() user: any) {
    return this.service.createProveedor(dto, user.usuario);
  }

  @Put('proveedores/:id')
  updateProveedor(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateProveedorDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateProveedor(id, empresaId, dto, user.usuario);
  }

  @Get('existencias')
  findAllExistencias(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllExistencias(empresaId);
  }

  @Get('existencias/:id')
  findExistencia(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findExistencia(id, empresaId);
  }

  @Get('kardex')
  findAllKardex(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllKardex(empresaId);
  }

  @Get('kardex/:id')
  findKardex(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findKardex(id, empresaId);
  }

  @Get('kardex/consulta')
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
  obtenerSaldo(
    @Param('bodegaId', ParseIntPipe) bodegaId: number,
    @Param('productoId', ParseIntPipe) productoId: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.kardexService.obtenerSaldoActual(bodegaId, productoId, empresaId);
  }

  @Post('kardex/entrada')
  registrarEntrada(@Body() dto: KardexEntradaDto, @CurrentUser() user: any) {
    return this.kardexService.registrarEntrada({ ...dto, usuarioCreated: user.usuario });
  }

  @Post('kardex/salida')
  registrarSalida(@Body() dto: KardexSalidaDto, @CurrentUser() user: any) {
    return this.kardexService.registrarSalida({ ...dto, usuarioCreated: user.usuario });
  }

  // ===== ProductoCodBarra =====

  @Get('codigos-barras')
  findAllCodBarra(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllCodBarra(empresaId);
  }

  @Get('codigos-barras/:id')
  findCodBarra(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findCodBarra(id, empresaId);
  }

  @Post('codigos-barras')
  createCodBarra(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createCodBarra(dto, user.usuario);
  }

  @Put('codigos-barras/:id')
  updateCodBarra(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateCodBarra(id, empresaId, dto, user.usuario);
  }

  @Delete('codigos-barras/:id')
  removeCodBarra(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeCodBarra(id, empresaId);
  }

  // ===== ProductoDet =====

  @Get('productos-det')
  findAllProdDet(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllProdDet(empresaId);
  }

  @Get('productos-det/:id')
  findProdDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findProdDet(id, empresaId);
  }

  @Post('productos-det')
  createProdDet(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createProdDet(dto, user.usuario);
  }

  @Put('productos-det/:id')
  updateProdDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateProdDet(id, empresaId, dto, user.usuario);
  }

  @Delete('productos-det/:id')
  removeProdDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeProdDet(id, empresaId);
  }

  // ===== ProductoImg =====

  @Get('productos-img')
  findAllProdImg(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllProdImg(empresaId);
  }

  @Get('productos-img/:id')
  findProdImg(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findProdImg(id, empresaId);
  }

  @Post('productos-img')
  createProdImg(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createProdImg(dto, user.usuario);
  }

  @Put('productos-img/:id')
  updateProdImg(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateProdImg(id, empresaId, dto, user.usuario);
  }

  @Delete('productos-img/:id')
  removeProdImg(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeProdImg(id, empresaId);
  }

  @Post('ajustes/positivo')
  registrarAjustePositivo(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.registrarAjustePositivo({ ...dto, usuarioCreated: user.usuario });
  }

  @Post('ajustes/negativo')
  registrarAjusteNegativo(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.registrarAjusteNegativo({ ...dto, usuarioCreated: user.usuario });
  }

  @Post('traslados')
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
import { InventarioService } from './inventario.service';
import { KardexService } from './kardex.service';
import { InventarioController } from './inventario.controller';

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
    ]),
  ],
  controllers: [InventarioController],
  providers: [InventarioService, KardexService],
  exports: [InventarioService, KardexService],
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
    const existencia = await this.obtenerOCrearExistencia(dto.bodegaId, dto.productoId, dto.empresaId);
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

    await this.actualizarExistencia(dto.bodegaId, dto.productoId, dto.empresaId, saldoActual, dto.costoUnitario);

    this.eventEmitter.emit('kardex.entrada.registrada', { kardex: saved, dto });

    return saved;
  }

  async registrarSalida(dto: KardexSalidaDto): Promise<TinvKardex> {
    const existencia = await this.obtenerOCrearExistencia(dto.bodegaId, dto.productoId, dto.empresaId);
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

    await this.actualizarExistencia(dto.bodegaId, dto.productoId, dto.empresaId, saldoActual, dto.costoUnitario);

    this.eventEmitter.emit('kardex.salida.registrada', { kardex: saved, dto });

    return saved;
  }

  async registrarMovimiento(dto: KardexMovimientoDto): Promise<TinvKardex> {
    if (dto.tipomov === 'E') {
      return this.registrarEntrada(dto as KardexEntradaDto);
    }
    return this.registrarSalida(dto as KardexSalidaDto);
  }

  private async obtenerOCrearExistencia(bodegaId: number, productoId: number, empresaId: number): Promise<TinvExistencia> {
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
        usuarioCreated: 'SYSTEM',
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
  ): Promise<void> {
    await this.existenciaRepo.update(
      { bodegaId, productoId, empresaId } as FindOptionsWhere<TinvExistencia>,
      {
        existencia: nuevaExistencia,
        costounitario: costoUnitario,
        usuarioUpdated: 'SYSTEM',
        fechaUpdated: new Date(),
      },
    );
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
}
```

---

## 📄 src\modules\modules\dto\modulo.dto.ts

```typescript
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';

export class CreateModuloDto {
  @IsString() @IsNotEmpty()
  descripcion: string;

  @IsNumber()
  empresaId: number;
}

export class UpdateModuloDto {
  @IsString() @IsOptional()
  descripcion?: string;

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

@Entity('tmodulos')
export class Tmodulos {
  @PrimaryGeneratedColumn({ name: 'moduloId' })
  moduloId: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
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

## 📄 src\modules\modules\modulos.controller.ts

```typescript
import {
  Controller, Get, Post, Put, Body, Param, Query,
  UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { ModulosService } from './modulos.service';
import { CreateModuloDto, UpdateModuloDto } from './dto/modulo.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('modulos')
@UseGuards(JwtAuthGuard)
export class ModulosController {
  constructor(private readonly service: ModulosService) {}

  @Get()
  findAll(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAll(empresaId);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findOne(id, empresaId);
  }

  @Post()
  create(@Body() dto: CreateModuloDto, @CurrentUser() user: any) {
    return this.service.create(dto, user.usuario);
  }

  @Put(':id')
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

export class CreateGestorDto {
  @IsNumber()
  moduloId: number;

  @IsNumber()
  empleadoId: number;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_vendedor?: string;
}

export class UpdateGestorDto {
  @IsNumber() @IsOptional()
  moduloId?: number;

  @IsNumber() @IsOptional()
  empleadoId?: number;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_vendedor?: string;
}

```

---

## 📄 src\modules\parametros\dto\impuesto.dto.ts

```typescript
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';

export class CreateImpuestoDto {
  @IsNumber()
  moduloId: number;

  @IsString() @IsNotEmpty()
  descripcion: string;

  @IsNumber()
  porcentaje: number;
}

export class UpdateImpuestoDto {
  @IsNumber() @IsOptional()
  moduloId?: number;

  @IsString() @IsOptional()
  descripcion?: string;

  @IsNumber() @IsOptional()
  porcentaje?: number;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;
}

```

---

## 📄 src\modules\parametros\dto\moneda.dto.ts

```typescript
import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export class CreateMonedaDto {
  @IsString() @IsNotEmpty()
  descripcion: string;

  @IsString() @IsNotEmpty()
  simbolo: string;
}

export class UpdateMonedaDto {
  @IsString() @IsOptional()
  descripcion?: string;

  @IsString() @IsOptional()
  simbolo?: string;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;
}

```

---

## 📄 src\modules\parametros\dto\param-con.dto.ts

```typescript
import { IsOptional, IsNumber, IsString } from 'class-validator';

export class CreateParamConDto {
  @IsNumber() @IsOptional()
  nropartida?: number;

  @IsNumber() @IsOptional()
  periodofiscal?: number;

  @IsNumber() @IsOptional()
  aniofiscal?: number;

  @IsNumber() @IsOptional()
  monedafiscalId?: number;

  @IsString() @IsOptional()
  mascaracta?: string;

  @IsString() @IsOptional()
  nombrecontador?: string;

  @IsString() @IsOptional()
  nombregerente?: string;

  @IsString() @IsOptional()
  nombreauditor?: string;
}

export class UpdateParamConDto extends CreateParamConDto {}

```

---

## 📄 src\modules\parametros\dto\param-cxc.dto.ts

```typescript
import { IsOptional, IsNumber, IsString } from 'class-validator';

export class CreateParamCxcDto {
  @IsNumber() @IsOptional()
  nrocliente?: number;

  @IsNumber() @IsOptional()
  interes?: number;

  @IsNumber() @IsOptional()
  mora?: number;

  @IsNumber() @IsOptional()
  diasPlazo?: number;

  @IsNumber() @IsOptional()
  limitecredito?: number;

  @IsString() @IsOptional()
  ctacontable?: string;
}

export class UpdateParamCxcDto extends CreateParamCxcDto {}

```

---

## 📄 src\modules\parametros\dto\param-cxp.dto.ts

```typescript
import { IsOptional, IsNumber, IsString } from 'class-validator';

export class CreateParamCxpDto {
  @IsNumber() @IsOptional()
  nroproveedor?: number;

  @IsNumber() @IsOptional()
  interes?: number;

  @IsNumber() @IsOptional()
  mora?: number;

  @IsNumber() @IsOptional()
  diasPlazo?: number;

  @IsNumber() @IsOptional()
  limitecredito?: number;

  @IsString() @IsOptional()
  ctacontable?: string;
}

export class UpdateParamCxpDto extends CreateParamCxpDto {}

```

---

## 📄 src\modules\parametros\dto\param-fac.dto.ts

```typescript
import { IsOptional, IsNumber, IsEnum, IsString } from 'class-validator';

export class CreateParamFacDto {
  @IsNumber() @IsOptional()
  bodegaId?: number;

  @IsNumber() @IsOptional()
  nrofactura?: number;

  @IsNumber() @IsOptional()
  nrocotizacion?: number;

  @IsNumber() @IsOptional()
  nroanulacion?: number;

  @IsNumber() @IsOptional()
  impuestoId?: number;

  @IsNumber() @IsOptional()
  cajaId?: number;

  @IsNumber() @IsOptional()
  lineasFactura?: number;

  @IsNumber() @IsOptional()
  diasDevolucion?: number;

  @IsNumber() @IsOptional()
  porcentajeDevolucion?: number;

  @IsNumber() @IsOptional()
  nrodpdaventas?: number;

  @IsNumber() @IsOptional()
  nropdadevolucion?: number;

  @IsNumber() @IsOptional()
  nropdaanulacion?: number;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_integrado_cxc?: string;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_puntoventa?: string;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_integrado_caja?: string;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_anticipos?: string;

  @IsString() @IsOptional()
  mensajeFactura?: string;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_correlativoUnico?: string;

  @IsNumber() @IsOptional()
  mg_t?: number;

  @IsNumber() @IsOptional()
  mg_b?: number;

  @IsNumber() @IsOptional()
  mg_l?: number;

  @IsNumber() @IsOptional()
  mg_d?: number;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_multiplezcajeros?: string;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_imprimefactura?: string;

  @IsString() @IsOptional()
  ImpresoraFactura?: string;

  @IsString() @IsOptional()
  ImpresoraComprobante?: string;

  @IsString() @IsOptional()
  ImpresoraMadera?: string;

  @IsString() @IsOptional()
  ImpresoraRecibo?: string;

  @IsString() @IsOptional()
  DriverImpresora1?: string;

  @IsString() @IsOptional()
  DriverImpresora2?: string;

  @IsString() @IsOptional()
  DriverImpresora3?: string;

  @IsString() @IsOptional()
  DriverImpresora4?: string;

  @IsString() @IsOptional()
  Puerto1?: string;

  @IsString() @IsOptional()
  Puerto2?: string;

  @IsString() @IsOptional()
  Puerto3?: string;

  @IsString() @IsOptional()
  Puerto4?: string;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_multipleempresa?: string;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_impuestoincluido?: string;
}

export class UpdateParamFacDto extends CreateParamFacDto {}

```

---

## 📄 src\modules\parametros\dto\param-inv.dto.ts

```typescript
import { IsOptional, IsNumber, IsEnum } from 'class-validator';

export class CreateParamInvDto {
  @IsNumber() @IsOptional()
  bodegaId?: number;

  @IsNumber() @IsOptional()
  nrocompra?: number;

  @IsNumber() @IsOptional()
  nrotrasladoo?: number;

  @IsNumber() @IsOptional()
  nroajuste?: number;

  @IsNumber() @IsOptional()
  nrofisico?: number;

  @IsNumber() @IsOptional()
  nrorequisicion?: number;

  @IsNumber() @IsOptional()
  impuestocompraId?: number;

  @IsNumber() @IsOptional()
  impuestoventaId?: number;

  @IsNumber() @IsOptional()
  nropartida?: number;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_requirelote?: string;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_supermercado?: string;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_multiplesprecios?: string;
}

export class UpdateParamInvDto extends CreateParamInvDto {}
```

---

## 📄 src\modules\parametros\dto\param-pla.dto.ts

```typescript
import { IsOptional, IsNumber, IsEnum } from 'class-validator';

export class CreateParamPlaDto {
  @IsNumber() @IsOptional()
  nropartida?: number;

  @IsNumber() @IsOptional()
  nroplanilla?: number;

  @IsNumber() @IsOptional()
  techo?: number;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_validatecho?: string;

  @IsNumber() @IsOptional()
  diaslaborales?: number;
}

export class UpdateParamPlaDto extends CreateParamPlaDto {}

```

---

## 📄 src\modules\parametros\dto\param-pres.dto.ts

```typescript
import { IsOptional, IsNumber, IsString } from 'class-validator';

export class CreateParamPresDto {
  @IsNumber() @IsOptional()
  interes?: number;

  @IsNumber() @IsOptional()
  mora?: number;

  @IsNumber() @IsOptional()
  diasPlazo?: number;

  @IsNumber() @IsOptional()
  limitecredito?: number;

  @IsString() @IsOptional()
  ctacontable?: string;
}

export class UpdateParamPresDto extends CreateParamPresDto {}

```

---

## 📄 src\modules\parametros\dto\simple-param.dto.ts

```typescript
import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export class CreateSimpleParamDto {
  @IsString() @IsNotEmpty()
  descripcion: string;
}

export class UpdateSimpleParamDto {
  @IsString() @IsOptional()
  descripcion?: string;

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

@Entity('ttipodeptoempresa')
export class TtipoDeptoEmpresa {
  @PrimaryGeneratedColumn({ name: 'departamentostempresasId' })
  departamentostempresasId: number;

  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

  @Column({ type: 'int', nullable: true })
  cuentacontableId: number;

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

## 📄 src\modules\parametros\entities\depto-pais.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('ttipodeptopais')
export class TtipoDeptoPais {
  @PrimaryGeneratedColumn({ name: 'ttipodeptopaisId' })
  ttipodeptopaisId: number;

  @Column({ type: 'varchar', length: 50 })
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

## 📄 src\modules\parametros\entities\direccion.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('ttipodirecciones')
export class TtipoDireccion {
  @PrimaryGeneratedColumn({ name: 'direccionId' })
  direccionId: number;

  @Column({ type: 'varchar', length: 50 })
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

## 📄 src\modules\parametros\entities\estado.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('ttipoestado')
export class TtipoEstado {
  @PrimaryGeneratedColumn({ name: 'estadoId' })
  estadoId: number;

  @Column({ type: 'varchar', length: 50 })
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

## 📄 src\modules\parametros\entities\forma-pago.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('ttipoformapago')
export class TtipoFormaPago {
  @PrimaryGeneratedColumn({ name: 'formapagoId' })
  formapagoId: number;

  @Column({ type: 'varchar', length: 50 })
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

## 📄 src\modules\parametros\entities\gestor.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('ttipogestores')
export class TtipoGestor {
  @PrimaryGeneratedColumn({ name: 'gestorId' })
  gestorId: number;

  @Column({ type: 'int' })
  moduloId: number;

  @Column({ type: 'int' })
  empleadoId: number;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_vendedor: string;

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

## 📄 src\modules\parametros\entities\impuesto.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('ttipoimpuestos')
export class TtipoImpuesto {
  @PrimaryGeneratedColumn({ name: 'impuestoId' })
  impuestoId: number;

  @Column({ type: 'int' })
  moduloId: number;

  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  porcentaje: number;

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

## 📄 src\modules\parametros\entities\moneda.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('ttipomonedas')
export class TtipoMoneda {
  @PrimaryGeneratedColumn({ name: 'monedaId' })
  monedaId: number;

  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

  @Column({ type: 'char', length: 1 })
  simbolo: string;

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

## 📄 src\modules\parametros\entities\pais.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('ttipopais')
export class TtipoPais {
  @PrimaryGeneratedColumn({ name: 'paisId' })
  paisId: number;

  @Column({ type: 'varchar', length: 50 })
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

## 📄 src\modules\parametros\entities\param-bco.entity.ts

```typescript
import {
  Entity, PrimaryColumn, Column,
} from 'typeorm';

@Entity('ttipoparambco')
export class TtipoParamBco {
  @PrimaryColumn({ name: 'empresaId' })
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

## 📄 src\modules\parametros\entities\param-con.entity.ts

```typescript
import {
  Entity, PrimaryColumn, Column,
} from 'typeorm';

@Entity('ttipoparamcon')
export class TtipoParamCon {
  @PrimaryColumn({ name: 'empresaId' })
  empresaId: number;

  @Column({ type: 'int', default: 0 })
  nropartida: number;

  @Column({ type: 'int', default: 0 })
  periodofiscal: number;

  @Column({ type: 'int', default: 0 })
  aniofiscal: number;

  @Column({ type: 'int', default: 0 })
  monedafiscalId: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  mascaracta: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  nombrecontador: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  nombregerente: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  nombreauditor: string;

  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

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

@Entity('ttipoparamcxc')
export class TtipoParamCxc {
  @PrimaryColumn({ name: 'empresaId' })
  empresaId: number;

  @Column({ type: 'int', nullable: true })
  nrocliente: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  interes: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  mora: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  diasPlazo: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  limitecredito: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  ctacontable: string;

  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

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

@Entity('ttipoparamcxp')
export class TtipoParamCxp {
  @PrimaryColumn({ name: 'empresaId' })
  empresaId: number;

  @Column({ type: 'int', nullable: true })
  nroproveedor: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  interes: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  mora: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  diasPlazo: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  limitecredito: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  ctacontable: string;

  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

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
import { Cxccajero } from '../../cxc/entities/cxccajero.entity';

@Entity('ttipoparamfac')
export class TtipoParamFac {
  @PrimaryColumn({ name: 'empresaId' })
  empresaId: number;

  @Column({ type: 'int', nullable: true })
  bodegaId: number;

  @Column({ type: 'int', nullable: true })
  nrofactura: number;

  @Column({ type: 'int', nullable: true })
  nrocotizacion: number;

  @Column({ type: 'int', nullable: true })
  nroanulacion: number;

  @Column({ type: 'int', nullable: true })
  impuestoId: number;

  @Column({ type: 'int', nullable: true }) // agregado para el manejo de caja en cxccajeros
  cajaId: number;

  @ManyToOne(() => Cxccajero)
  @JoinColumn({ name: 'cajaId' })
  cajero: Cxccajero;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  lineasFactura: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  diasDevolucion: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  porcentajeDevolucion: number;

  @Column({ type: 'int', nullable: true })
  nrodpdaventas: number;

  @Column({ type: 'int', nullable: true })
  nropdadevolucion: number;

  @Column({ type: 'int', nullable: true })
  nropdaanulacion: number;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_integrado_cxc: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_puntoventa: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_integrado_caja: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_anticipos: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  mensajeFactura: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_correlativoUnico: string;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0, name: 'mg-t' })
  mg_t: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0, name: 'mg-b' })
  mg_b: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0, name: 'mg-l' })
  mg_l: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0, name: 'mg-d' })
  mg_d: number;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_multiplezcajeros: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_imprimefactura: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  ImpresoraFactura: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  ImpresoraComprobante: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  ImpresoraMadera: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  ImpresoraRecibo: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  DriverImpresora1: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  DriverImpresora2: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  DriverImpresora3: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  DriverImpresora4: string;

  @Column({ type: 'varchar', length: 6, nullable: true })
  Puerto1: string;

  @Column({ type: 'varchar', length: 6, nullable: true })
  Puerto2: string;

  @Column({ type: 'varchar', length: 6, nullable: true })
  Puerto3: string;

  @Column({ type: 'varchar', length: 6, nullable: true })
  Puerto4: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_multipleempresa: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_impuestoincluido: string;

  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\parametros\entities\param-inv.entity.ts

```typescript
import {
  Entity, PrimaryColumn, Column, ManyToOne, JoinColumn
} from 'typeorm';
import { TtipoImpuesto } from './impuesto.entity';

@Entity('ttipoparaminv')
export class TtipoParamInv {
  @PrimaryColumn({ name: 'empresaId' })
  empresaId: number;

  @Column({ type: 'int', nullable: true })
  bodegaId: number;

  @Column({ type: 'int', nullable: true })
  nrocompra: number;

  @Column({ type: 'int', nullable: true })
  nrotrasladoo: number;

  @Column({ type: 'int', nullable: true })
  nroajuste: number;

  @Column({ type: 'int', nullable: true })
  nrofisico: number;

  @Column({ type: 'int', nullable: true })
  nrorequisicion: number;

  @Column({ type: 'int', nullable: true }) // este campo se va a relacionar con la ttipoimpuestos
  impuestocompraId: number;

  @ManyToOne(() => TtipoImpuesto)
  @JoinColumn({ name: 'impuestocompraId' })
  impuestoCompra: TtipoImpuesto;

  @Column({ type: 'int', nullable: true }) // este campo se va a relacionar con la ttipoimpuestos
  impuestoventaId: number;

  @ManyToOne(() => TtipoImpuesto)
  @JoinColumn({ name: 'impuestoventaId' })
  impuestoVenta: TtipoImpuesto;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  nropartida: number;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_requirelote: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_supermercado: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_multiplesprecios: string;

  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}

```

---

## 📄 src\modules\parametros\entities\param-pap.entity.ts

```typescript
import {
  Entity, PrimaryColumn, Column,
} from 'typeorm';

@Entity('ttipoparampap')
export class TtipoParamPap {
  @PrimaryColumn({ name: 'empresaId' })
  empresaId: number;

  @Column({ type: 'int', nullable: true })
  moduloId: number;

  @Column({ type: 'varchar', length: 150, nullable: true })
  proforma: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  reporte: string;

  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

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

@Entity('ttipoparampla')
export class TtipoParamPla {
  @PrimaryColumn({ name: 'empresaId' })
  empresaId: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  nropartida: number;

  @Column({ type: 'int', nullable: true })
  nroplanilla: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  techo: number;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_validatecho: string;

  @Column({ type: 'int', nullable: true })
  diaslaborales: number;

  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

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

@Entity('ttipoparampres')
export class TtipoParamPres {
  @PrimaryColumn({ name: 'empresaId' })
  empresaId: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  interes: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  mora: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  diasPlazo: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  limitecredito: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  ctacontable: string;

  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

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

@Entity('ttipopasatiempos')
export class TtipoPasatiempo {
  @PrimaryGeneratedColumn({ name: 'pasatiempoId' })
  pasatiempoId: number;

  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

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

## 📄 src\modules\parametros\entities\proforma.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('ttipoproforma')
export class TtipoProforma {
  @PrimaryGeneratedColumn({ name: 'proformaId' })
  proformaId: number;

  @Column({ type: 'varchar', length: 10 })
  Alto: string;

  @Column({ type: 'varchar', length: 10 })
  bajo: string;

  @Column({ type: 'varchar', length: 10 })
  izquierda: string;

  @Column({ type: 'varchar', length: 10 })
  derecho: string;

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

## 📄 src\modules\parametros\entities\tarjeta-credito.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('ttipotarjetacredito')
export class TtipoTarjetaCredito {
  @PrimaryGeneratedColumn({ name: 'tarjetacreditoId' })
  tarjetacreditoId: number;

  @Column({ type: 'varchar', length: 50 })
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

## 📄 src\modules\parametros\entities\telefono.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('ttipotelefono')
export class TtipoTelefono {
  @PrimaryGeneratedColumn({ name: 'telefonoId' })
  telefonoId: number;

  @Column({ type: 'varchar', length: 50 })
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

## 📄 src\modules\parametros\entities\zona-vta-cob.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('ttipozonasvtacob')
export class TtipoZonaVtaCob {
  @PrimaryGeneratedColumn({ name: 'ttipozonasvtacobId' })
  ttipozonasvtacobId: number;

  @Column({ type: 'int' })
  tzonadId: number;

  @Column({ type: 'int', nullable: true })
  gestorId: number;

  @Column({ type: 'varchar', length: 50 })
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

## 📄 src\modules\parametros\entities\zona.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('ttipozonas')
export class TtipoZona {
  @PrimaryGeneratedColumn({ name: 'tzonadId' })
  tzonadId: number;

  @Column({ type: 'varchar', length: 50 })
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

## 📄 src\modules\parametros\parametros.controller.ts

```typescript
import {
  Controller, Get, Post, Put, Body, Param, Query,
  UseGuards, ParseIntPipe,
} from '@nestjs/common';
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

@Controller('parametros')
@UseGuards(JwtAuthGuard)
export class ParametrosController {
  @Get('tcotipodocumentofiscal')
  findAllTiposDocFiscal(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllTiposDocFiscal(empresaId);
  }

  constructor(private readonly service: ParametrosService) {}

  @Get('monedas')
  findAllMonedas(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllMonedas(empresaId);
  }

  @Get('monedas/:id')
  findMoneda(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findMoneda(id, empresaId);
  }

  @Post('monedas')
  createMoneda(@Body() dto: CreateMonedaDto, @CurrentUser() user: any) {
    return this.service.createMoneda(dto, user.usuario);
  }

  @Put('monedas/:id')
  updateMoneda(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateMonedaDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateMoneda(id, empresaId, dto, user.usuario);
  }

  @Get('paises')
  findAllPaises(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllPaises(empresaId);
  }

  @Get('paises/:id')
  findPais(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findPais(id, empresaId);
  }

  @Post('paises')
  createPais(@Body() dto: CreateSimpleParamDto, @CurrentUser() user: any) {
    return this.service.createPais(dto, user.usuario);
  }

  @Put('paises/:id')
  updatePais(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateSimpleParamDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updatePais(id, empresaId, dto, user.usuario);
  }

  @Get('departamentos-pais')
  findAllDeptoPais(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllDeptoPais(empresaId);
  }

  @Get('departamentos-pais/:id')
  findDeptoPais(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findDeptoPais(id, empresaId);
  }

  @Post('departamentos-pais')
  createDeptoPais(@Body() dto: CreateSimpleParamDto, @CurrentUser() user: any) {
    return this.service.createDeptoPais(dto, user.usuario);
  }

  @Put('departamentos-pais/:id')
  updateDeptoPais(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateSimpleParamDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateDeptoPais(id, empresaId, dto, user.usuario);
  }

  @Get('departamentos-empresa')
  findAllDeptoEmpresa(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllDeptoEmpresa(empresaId);
  }

  @Get('departamentos-empresa/:id')
  findDeptoEmpresa(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findDeptoEmpresa(id, empresaId);
  }

  @Post('departamentos-empresa')
  createDeptoEmpresa(@Body() dto: CreateSimpleParamDto, @CurrentUser() user: any) {
    return this.service.createDeptoEmpresa(dto, user.usuario);
  }

  @Put('departamentos-empresa/:id')
  updateDeptoEmpresa(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateSimpleParamDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateDeptoEmpresa(id, empresaId, dto, user.usuario);
  }

  @Get('direcciones')
  findAllDirecciones(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllDirecciones(empresaId);
  }

  @Get('direcciones/:id')
  findDireccion(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findDireccion(id, empresaId);
  }

  @Post('direcciones')
  createDireccion(@Body() dto: CreateSimpleParamDto, @CurrentUser() user: any) {
    return this.service.createDireccion(dto, user.usuario);
  }

  @Put('direcciones/:id')
  updateDireccion(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateSimpleParamDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateDireccion(id, empresaId, dto, user.usuario);
  }

  @Get('estados')
  findAllEstados(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllEstados(empresaId);
  }

  @Get('estados/:id')
  findEstado(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findEstado(id, empresaId);
  }

  @Post('estados')
  createEstado(@Body() dto: CreateSimpleParamDto, @CurrentUser() user: any) {
    return this.service.createEstado(dto, user.usuario);
  }

  @Put('estados/:id')
  updateEstado(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateSimpleParamDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateEstado(id, empresaId, dto, user.usuario);
  }

  @Get('formas-pago')
  findAllFormasPago(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllFormasPago(empresaId);
  }

  @Get('formas-pago/:id')
  findFormaPago(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findFormaPago(id, empresaId);
  }

  @Post('formas-pago')
  createFormaPago(@Body() dto: CreateSimpleParamDto, @CurrentUser() user: any) {
    return this.service.createFormaPago(dto, user.usuario);
  }

  @Put('formas-pago/:id')
  updateFormaPago(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateSimpleParamDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateFormaPago(id, empresaId, dto, user.usuario);
  }

  @Get('telefonos')
  findAllTelefonos(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllTelefonos(empresaId);
  }

  @Get('telefonos/:id')
  findTelefono(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findTelefono(id, empresaId);
  }

  @Post('telefonos')
  createTelefono(@Body() dto: CreateSimpleParamDto, @CurrentUser() user: any) {
    return this.service.createTelefono(dto, user.usuario);
  }

  @Put('telefonos/:id')
  updateTelefono(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateSimpleParamDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateTelefono(id, empresaId, dto, user.usuario);
  }

  @Get('tarjetas-credito')
  findAllTarjetasCredito(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllTarjetasCredito(empresaId);
  }

  @Get('tarjetas-credito/:id')
  findTarjetaCredito(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findTarjetaCredito(id, empresaId);
  }

  @Post('tarjetas-credito')
  createTarjetaCredito(@Body() dto: CreateSimpleParamDto, @CurrentUser() user: any) {
    return this.service.createTarjetaCredito(dto, user.usuario);
  }

  @Put('tarjetas-credito/:id')
  updateTarjetaCredito(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateSimpleParamDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateTarjetaCredito(id, empresaId, dto, user.usuario);
  }

  @Get('pasatiempos')
  findAllPasatiempos() {
    return this.service.findAllPasatiempos();
  }

  @Get('pasatiempos/:id')
  findPasatiempo(@Param('id', ParseIntPipe) id: number) {
    return this.service.findPasatiempo(id);
  }

  @Post('pasatiempos')
  createPasatiempo(@Body() dto: CreateSimpleParamDto, @CurrentUser() user: any) {
    return this.service.createPasatiempo(dto, user.usuario);
  }

  @Put('pasatiempos/:id')
  updatePasatiempo(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSimpleParamDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updatePasatiempo(id, dto, user.usuario);
  }

  @Get('zonas')
  findAllZonas(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllZonas(empresaId);
  }

  @Get('zonas/:id')
  findZona(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findZona(id, empresaId);
  }

  @Post('zonas')
  createZona(@Body() dto: CreateSimpleParamDto, @CurrentUser() user: any) {
    return this.service.createZona(dto, user.usuario);
  }

  @Put('zonas/:id')
  updateZona(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateSimpleParamDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateZona(id, empresaId, dto, user.usuario);
  }

  @Get('gestores')
  findAllGestores(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllGestores(empresaId);
  }

  @Get('gestores/:id')
  findGestor(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findGestor(id, empresaId);
  }

  @Post('gestores')
  createGestor(@Body() dto: CreateGestorDto, @CurrentUser() user: any) {
    return this.service.createGestor(dto, user.usuario);
  }

  @Put('gestores/:id')
  updateGestor(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateGestorDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateGestor(id, empresaId, dto, user.usuario);
  }

  @Get('impuestos')
  findAllImpuestos(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllImpuestos(empresaId);
  }

  @Get('impuestos/:id')
  findImpuesto(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findImpuesto(id, empresaId);
  }

  @Post('impuestos')
  createImpuesto(@Body() dto: CreateImpuestoDto, @CurrentUser() user: any) {
    return this.service.createImpuesto(dto, user.usuario);
  }

  @Put('impuestos/:id')
  updateImpuesto(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateImpuestoDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateImpuesto(id, empresaId, dto, user.usuario);
  }

  @Get('proformas')
  findAllProformas(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllProformas(empresaId);
  }

  @Get('proformas/:id')
  findProforma(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findProforma(id, empresaId);
  }

  @Post('proformas')
  createProforma(@Body() dto: CreateSimpleParamDto, @CurrentUser() user: any) {
    return this.service.createProforma(dto, user.usuario);
  }

  @Put('proformas/:id')
  updateProforma(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateSimpleParamDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateProforma(id, empresaId, dto, user.usuario);
  }

  @Get('zonas-vta-cob')
  findAllZonasVtaCob(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllZonasVtaCob(empresaId);
  }

  @Get('zonas-vta-cob/:id')
  findZonaVtaCob(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findZonaVtaCob(id, empresaId);
  }

  @Post('zonas-vta-cob')
  createZonaVtaCob(@Body() dto: CreateSimpleParamDto, @CurrentUser() user: any) {
    return this.service.createZonaVtaCob(dto, user.usuario);
  }

  @Put('zonas-vta-cob/:id')
  updateZonaVtaCob(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateSimpleParamDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateZonaVtaCob(id, empresaId, dto, user.usuario);
  }

  @Get('param-bco')
  findParamBco(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findParamBco(empresaId);
  }

  @Put('param-bco')
  upsertParamBco(
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.upsertParamBco(empresaId, dto, user.usuario);
  }

  @Get('param-con')
  findParamCon(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findParamCon(empresaId);
  }

  @Put('param-con')
  upsertParamCon(
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateParamConDto,
    @CurrentUser() user: any,
  ) {
    return this.service.upsertParamCon(empresaId, dto, user.usuario);
  }

  @Get('param-cxc')
  findParamCxc(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findParamCxc(empresaId);
  }

  @Put('param-cxc')
  upsertParamCxc(
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateParamCxcDto,
    @CurrentUser() user: any,
  ) {
    return this.service.upsertParamCxc(empresaId, dto, user.usuario);
  }

  @Get('param-cxp')
  findParamCxp(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findParamCxp(empresaId);
  }

  @Put('param-cxp')
  upsertParamCxp(
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateParamCxpDto,
    @CurrentUser() user: any,
  ) {
    return this.service.upsertParamCxp(empresaId, dto, user.usuario);
  }

  @Get('param-fac')
  findParamFac(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findParamFac(empresaId);
  }

  @Put('param-fac')
  upsertParamFac(
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateParamFacDto,
    @CurrentUser() user: any,
  ) {
    return this.service.upsertParamFac(empresaId, dto, user.usuario);
  }

  @Get('param-inv')
  findParamInv(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findParamInv(empresaId);
  }

  @Put('param-inv')
  upsertParamInv(
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateParamInvDto,
    @CurrentUser() user: any,
  ) {
    return this.service.upsertParamInv(empresaId, dto, user.usuario);
  }

  @Get('param-pap')
  findParamPap(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findParamPap(empresaId);
  }

  @Put('param-pap')
  upsertParamPap(
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.upsertParamPap(empresaId, dto, user.usuario);
  }

  @Get('param-pla')
  findParamPla(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findParamPla(empresaId);
  }

  @Put('param-pla')
  upsertParamPla(
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateParamPlaDto,
    @CurrentUser() user: any,
  ) {
    return this.service.upsertParamPla(empresaId, dto, user.usuario);
  }

  @Get('param-pres')
  findParamPres(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findParamPres(empresaId);
  }

  @Put('param-pres')
  upsertParamPres(
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateParamPresDto,
    @CurrentUser() user: any,
  ) {
    return this.service.upsertParamPres(empresaId, dto, user.usuario);
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
    return this.findAllByEmpresa(this.gestorRepo, empresaId);
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
}

```

---

## 📄 src\modules\planilla\dto\plepladet.dto.ts

```typescript
import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';

export class CreatePlPlaDetDto {
  @IsNumber()
  planillaId: number;

  @IsNumber()
  empleadoId: number;

  @IsNumber() @IsOptional()
  departamentoId?: number;

  @IsNumber() @IsOptional()
  sueldobruto?: number;

  @IsNumber() @IsOptional()
  importe_dihss?: number;

  @IsNumber() @IsOptional()
  importe_drap?: number;

  @IsNumber() @IsOptional()
  importe_drtf?: number;

  @IsNumber() @IsOptional()
  importe_dotras?: number;

  @IsNumber() @IsOptional()
  importe_ccomision?: number;

  @IsNumber() @IsOptional()
  importe_chorasextras?: number;

  @IsNumber() @IsOptional()
  importe_cbonos?: number;

  @IsNumber() @IsOptional()
  sueldoneto?: number;

  @IsNumber()
  empresaId: number;
}

export class UpdatePlPlaDetDto {
  @IsNumber() @IsOptional()
  planillaId?: number;

  @IsNumber() @IsOptional()
  empleadoId?: number;

  @IsNumber() @IsOptional()
  departamentoId?: number;

  @IsNumber() @IsOptional()
  sueldobruto?: number;

  @IsNumber() @IsOptional()
  importe_dihss?: number;

  @IsNumber() @IsOptional()
  importe_drap?: number;

  @IsNumber() @IsOptional()
  importe_drtf?: number;

  @IsNumber() @IsOptional()
  importe_dotras?: number;

  @IsNumber() @IsOptional()
  importe_ccomision?: number;

  @IsNumber() @IsOptional()
  importe_chorasextras?: number;

  @IsNumber() @IsOptional()
  importe_cbonos?: number;

  @IsNumber() @IsOptional()
  sueldoneto?: number;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_pagar?: string;
}

```

---

## 📄 src\modules\planilla\dto\pleplamae.dto.ts

```typescript
import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';

export class CreatePlPlaMaeDto {
  @IsNumber()
  periodo: number;

  @IsNumber()
  anio: number;

  @IsNumber()
  bcoctasId: number;

  @IsNumber() @IsOptional()
  items?: number;

  @IsNumber() @IsOptional()
  totalapagar?: number;

  @IsNumber()
  empresaId: number;
}

export class UpdatePlPlaMaeDto {
  @IsNumber() @IsOptional()
  periodo?: number;

  @IsNumber() @IsOptional()
  anio?: number;

  @IsNumber() @IsOptional()
  bcoctasId?: number;

  @IsNumber() @IsOptional()
  items?: number;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_pagada?: string;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_anulada?: string;

  @IsNumber() @IsOptional()
  totalapagar?: number;
}

```

---

## 📄 src\modules\planilla\dto\plplempleados.dto.ts

```typescript
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';

export class CreatePlEmpleadosDto {
  @IsString() @IsNotEmpty()
  nombres: string;

  @IsString() @IsNotEmpty()
  apellidos: string;

  @IsString() @IsNotEmpty()
  dni: string;

  @IsString() @IsOptional()
  fechanacimiento?: string;

  @IsEnum(['M', 'F', 'T']) @IsOptional()
  sexo?: string;

  @IsEnum(['S', 'C', 'V', 'D', 'U']) @IsOptional()
  estadocivil?: string;

  @IsNumber() @IsOptional()
  paisorigen?: number;

  @IsNumber() @IsOptional()
  paisresidencia?: number;

  @IsString() @IsOptional()
  nroseguro?: string;

  @IsString() @IsNotEmpty()
  telefono: string;

  @IsString() @IsNotEmpty()
  celular: string;

  @IsString() @IsNotEmpty()
  email: string;

  @IsNumber() @IsOptional()
  profesionId?: number;

  @IsNumber() @IsOptional()
  puestoId?: number;

  @IsNumber() @IsOptional()
  sueldobruto?: number;

  @IsNumber() @IsOptional()
  techoseguro?: number;

  @IsString() @IsOptional()
  cuentabancaria?: string;

  @IsString() @IsOptional()
  lugardenacimiento?: string;

  @IsNumber()
  tipoempId: number;

  @IsNumber()
  Idsucursal: number;

  @IsNumber()
  empresaId: number;
}

export class UpdatePlEmpleadosDto {
  @IsString() @IsOptional()
  nombres?: string;

  @IsString() @IsOptional()
  apellidos?: string;

  @IsString() @IsOptional()
  dni?: string;

  @IsString() @IsOptional()
  fechanacimiento?: string;

  @IsEnum(['M', 'F', 'T']) @IsOptional()
  sexo?: string;

  @IsEnum(['S', 'C', 'V', 'D', 'U']) @IsOptional()
  estadocivil?: string;

  @IsNumber() @IsOptional()
  paisorigen?: number;

  @IsNumber() @IsOptional()
  paisresidencia?: number;

  @IsString() @IsOptional()
  nroseguro?: string;

  @IsString() @IsOptional()
  telefono?: string;

  @IsString() @IsOptional()
  celular?: string;

  @IsString() @IsOptional()
  email?: string;

  @IsNumber() @IsOptional()
  profesionId?: number;

  @IsNumber() @IsOptional()
  puestoId?: number;

  @IsNumber() @IsOptional()
  sueldobruto?: number;

  @IsNumber() @IsOptional()
  techoseguro?: number;

  @IsString() @IsOptional()
  cuentabancaria?: string;

  @IsString() @IsOptional()
  lugardenacimiento?: string;

  @IsNumber() @IsOptional()
  tipoempId?: number;

  @IsNumber() @IsOptional()
  Idsucursal?: number;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;
}

```

---

## 📄 src\modules\planilla\dto\tpldeducciones.dto.ts

```typescript
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';

export class CreateTplDeduccionesDto {
  @IsString() @IsNotEmpty()
  descripcion: string;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_porcentual?: string;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_obligatoria?: string;

  @IsNumber() @IsOptional()
  porcentaje?: number;

  @IsNumber()
  empresaId: number;
}

export class UpdateTplDeduccionesDto {
  @IsString() @IsOptional()
  descripcion?: string;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_porcentual?: string;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_obligatoria?: string;

  @IsNumber() @IsOptional()
  porcentaje?: number;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;
}

```

---

## 📄 src\modules\planilla\dto\tplingresos.dto.ts

```typescript
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';

export class CreateTplIngresosDto {
  @IsString() @IsNotEmpty()
  descripcion: string;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_porcentual?: string;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_obligatoria?: string;

  @IsNumber() @IsOptional()
  porcentaje?: number;

  @IsNumber()
  empresaId: number;
}

export class UpdateTplIngresosDto {
  @IsString() @IsOptional()
  descripcion?: string;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_porcentual?: string;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_obligatoria?: string;

  @IsNumber() @IsOptional()
  porcentaje?: number;

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

@Entity('pleasistencia')
export class PlAsistencia {
  @PrimaryGeneratedColumn({ name: 'plempleadosasistenciaId' })
  plempleadosasistenciaId: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @Column({ type: 'int' })
  empleadoId: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  horaentrada: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  horaalmuerzo: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  horaretorno: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  horarealSalida: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  horasalida: string;

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

## 📄 src\modules\planilla\entities\plecertificaciones.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('plecertificaciones')
export class PlCertificaciones {
  @PrimaryGeneratedColumn({ name: 'empcertificacionId' })
  empcertificacionId: number;

  @Column({ type: 'int', nullable: true })
  empleadoId: number;

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

## 📄 src\modules\planilla\entities\plecomisiones.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('plecomisiones')
export class PlComisiones {
  @PrimaryGeneratedColumn({ name: 'emplcomId' })
  emplcomId: number;

  @Column({ type: 'int' })
  empleadoId: number;

  @Column({ type: 'int' })
  comisionId: number;

  @Column({ type: 'enum', enum: ['F', 'P'], default: 'f' })
  tipocomision: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_quincenal: string;

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

## 📄 src\modules\planilla\entities\plededucciones.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('plededucciones')
export class PlDeducciones {
  @PrimaryGeneratedColumn({ name: 'empdeduccionId' })
  empdeduccionId: number;

  @Column({ type: 'int' })
  empleadoId: number;

  @Column({ type: 'int' })
  deduccionId: number;

  @Column({ type: 'enum', enum: ['F', 'P'], default: 'f' })
  tipodeduccion: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_quincenal: string;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  porcentaje: number;

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

## 📄 src\modules\planilla\entities\plepladet.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('plepladet')
export class PlPlaDet {
  @PrimaryGeneratedColumn({ name: 'plepladetId' })
  plepladetId: number;

  @Column({ type: 'int' })
  planillaId: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @Column({ type: 'int' })
  empleadoId: number;

  @Column({ type: 'int', nullable: true })
  departamentoId: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  sueldobruto: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  importe_dihss: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  importe_drap: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  importe_drtf: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  importe_dotras: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  importe_ccomision: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  importe_chorasextras: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  importe_cbonos: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  sueldoneto: number;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_pagar: string;

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

## 📄 src\modules\planilla\entities\pleplamae.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('pleplamae')
export class PlPlaMae {
  @PrimaryGeneratedColumn({ name: 'planillaId' })
  planillaId: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @Column({ type: 'int' })
  periodo: number;

  @Column({ type: 'int' })
  anio: number;

  @Column({ type: 'int' })
  bcoctasId: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  items: number;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_pagada: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_anulada: string;

  @Column({ type: 'int', nullable: true })
  totalapagar: number;

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

## 📄 src\modules\planilla\entities\pletitulaciones.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('pletitulaciones')
export class PlEtits {
  @PrimaryGeneratedColumn({ name: 'emptitulacionId' })
  emptitulacionId: number;

  @Column({ type: 'int' })
  empleadoId: number;

  @Column({ type: 'varchar', length: 50 })
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

## 📄 src\modules\planilla\entities\plplempleados.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('plplempleados')
export class PlPlEmpleados {
  @PrimaryGeneratedColumn({ name: 'empleadoId' })
  empleadoId: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @Column({ type: 'varchar', length: 50 })
  nombres: string;

  @Column({ type: 'varchar', length: 50 })
  apellidos: string;

  @Column({ type: 'varchar', length: 20 })
  dni: string;

  @Column({ type: 'datetime', nullable: true })
  fechanacimiento: Date;

  @Column({ type: 'enum', enum: ['M', 'F', 'T'], default: 'M' })
  sexo: string;

  @Column({ type: 'enum', enum: ['S', 'C', 'V', 'D', 'U'], default: 'S' })
  estadocivil: string;

  @Column({ type: 'int', nullable: true })
  paisorigen: number;

  @Column({ type: 'int', nullable: true })
  paisresidencia: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  nroseguro: string;

  @Column({ type: 'varchar', length: 20 })
  telefono: string;

  @Column({ type: 'varchar', length: 20 })
  celular: string;

  @Column({ type: 'varchar', length: 20 })
  email: string;

  @Column({ type: 'int', nullable: true })
  profesionId: number;

  @Column({ type: 'int', nullable: true })
  puestoId: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  sueldobruto: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  techoseguro: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  cuentabancaria: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  lugardenacimiento: string;

  @Column({ type: 'longblob', nullable: true })
  foto: Buffer;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @Column({ type: 'int' })
  tipoempId: number;

  @Column({ type: 'int' })
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

## 📄 src\modules\planilla\entities\tpldeducciones.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('tpldeducciones')
export class TplDeducciones {
  @PrimaryGeneratedColumn({ name: 'deduccioneId' })
  deduccioneId: number;

  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_porcentual: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_obligatoria: string;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  porcentaje: number;

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

## 📄 src\modules\planilla\entities\tplingresos.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('tplingresos')
export class TplIngresos {
  @PrimaryGeneratedColumn({ name: 'tingresoId' })
  tingresoId: number;

  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_porcentual: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_obligatoria: string;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  porcentaje: number;

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

## 📄 src\modules\planilla\entities\tplprofesiones.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('tplprofesiones')
export class TplProfesiones {
  @PrimaryGeneratedColumn({ name: 'profesionId' })
  profesionId: number;

  @Column({ type: 'varchar', length: 50 })
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

## 📄 src\modules\planilla\entities\tplpuestos.entity.ts

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('tplpuestos')
export class TplPuestos {
  @PrimaryGeneratedColumn({ name: 'puestosId' })
  puestosId: number;

  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

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

## 📄 src\modules\planilla\planilla.controller.ts

```typescript
import {
  Controller, Get, Post, Put, Body, Param, Query,
  UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { PlanillaService } from './planilla.service';
import { CreatePlEmpleadosDto, UpdatePlEmpleadosDto } from './dto/plplempleados.dto';
import { CreatePlPlaMaeDto, UpdatePlPlaMaeDto } from './dto/pleplamae.dto';
import { CreatePlPlaDetDto, UpdatePlPlaDetDto } from './dto/plepladet.dto';
import { CreateTplDeduccionesDto, UpdateTplDeduccionesDto } from './dto/tpldeducciones.dto';
import { CreateTplIngresosDto, UpdateTplIngresosDto } from './dto/tplingresos.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('planilla')
@UseGuards(JwtAuthGuard)
export class PlanillaController {
  constructor(private readonly service: PlanillaService) {}

  @Get('empleados')
  findAllEmpleados(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllEmpleados(empresaId);
  }

  @Get('empleados/:id')
  findEmpleado(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findEmpleado(id, empresaId);
  }

  @Post('empleados')
  createEmpleado(@Body() dto: CreatePlEmpleadosDto, @CurrentUser() user: any) {
    return this.service.createEmpleado(dto, user.usuario);
  }

  @Put('empleados/:id')
  updateEmpleado(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdatePlEmpleadosDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateEmpleado(id, empresaId, dto, user.usuario);
  }

  @Get('titulaciones')
  findAllTitulaciones(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllTitulaciones(empresaId);
  }

  @Get('titulaciones/:id')
  findTitulacion(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findTitulacion(id, empresaId);
  }

  @Post('titulaciones')
  createTitulacion(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createTitulacion(dto, user.usuario);
  }

  @Put('titulaciones/:id')
  updateTitulacion(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateTitulacion(id, empresaId, dto, user.usuario);
  }

  @Get('asistencia')
  findAllAsistencia(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllAsistencia(empresaId);
  }

  @Get('asistencia/:id')
  findAsistencia(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findAsistencia(id, empresaId);
  }

  @Post('asistencia')
  createAsistencia(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createAsistencia(dto, user.usuario);
  }

  @Put('asistencia/:id')
  updateAsistencia(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateAsistencia(id, empresaId, dto, user.usuario);
  }

  @Get('certificaciones')
  findAllCertificaciones(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllCertificaciones(empresaId);
  }

  @Get('certificaciones/:id')
  findCertificacion(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findCertificacion(id, empresaId);
  }

  @Post('certificaciones')
  createCertificacion(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createCertificacion(dto, user.usuario);
  }

  @Put('certificaciones/:id')
  updateCertificacion(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateCertificacion(id, empresaId, dto, user.usuario);
  }

  @Get('comisiones')
  findAllComisiones(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllComisiones(empresaId);
  }

  @Get('comisiones/:id')
  findComision(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findComision(id, empresaId);
  }

  @Post('comisiones')
  createComision(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createComision(dto, user.usuario);
  }

  @Put('comisiones/:id')
  updateComision(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateComision(id, empresaId, dto, user.usuario);
  }

  @Get('deducciones-emp')
  findAllDeduccionesEmp(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllDeduccionesEmp(empresaId);
  }

  @Get('deducciones-emp/:id')
  findDeduccionEmp(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findDeduccionEmp(id, empresaId);
  }

  @Post('deducciones-emp')
  createDeduccionEmp(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createDeduccionEmp(dto, user.usuario);
  }

  @Put('deducciones-emp/:id')
  updateDeduccionEmp(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateDeduccionEmp(id, empresaId, dto, user.usuario);
  }

  @Get('planillas')
  findAllPlanillas(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllPlanillas(empresaId);
  }

  @Get('planillas/:id')
  findPlanilla(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findPlanilla(id, empresaId);
  }

  @Post('planillas')
  createPlanilla(@Body() dto: CreatePlPlaMaeDto, @CurrentUser() user: any) {
    return this.service.createPlanilla(dto, user.usuario);
  }

  @Put('planillas/:id')
  updatePlanilla(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdatePlPlaMaeDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updatePlanilla(id, empresaId, dto, user.usuario);
  }

  @Get('planilla-det')
  findAllPlanillaDet(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllPlanillaDet(empresaId);
  }

  @Get('planilla-det/:id')
  findPlanillaDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findPlanillaDet(id, empresaId);
  }

  @Post('planilla-det')
  createPlanillaDet(@Body() dto: CreatePlPlaDetDto, @CurrentUser() user: any) {
    return this.service.createPlanillaDet(dto, user.usuario);
  }

  @Put('planilla-det/:id')
  updatePlanillaDet(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdatePlPlaDetDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updatePlanillaDet(id, empresaId, dto, user.usuario);
  }

  @Get('puestos')
  findAllPuestos(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllPuestos(empresaId);
  }

  @Get('puestos/:id')
  findPuesto(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findPuesto(id, empresaId);
  }

  @Post('puestos')
  createPuesto(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createPuesto(dto, user.usuario);
  }

  @Put('puestos/:id')
  updatePuesto(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updatePuesto(id, empresaId, dto, user.usuario);
  }

  @Get('profesiones')
  findAllProfesiones(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllProfesiones(empresaId);
  }

  @Get('profesiones/:id')
  findProfesion(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findProfesion(id, empresaId);
  }

  @Post('profesiones')
  createProfesion(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createProfesion(dto, user.usuario);
  }

  @Put('profesiones/:id')
  updateProfesion(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateProfesion(id, empresaId, dto, user.usuario);
  }

  @Get('deducciones')
  findAllDeducciones(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllDeducciones(empresaId);
  }

  @Get('deducciones/:id')
  findDeduccion(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findDeduccion(id, empresaId);
  }

  @Post('deducciones')
  createDeduccion(@Body() dto: CreateTplDeduccionesDto, @CurrentUser() user: any) {
    return this.service.createDeduccion(dto, user.usuario);
  }

  @Put('deducciones/:id')
  updateDeduccion(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateTplDeduccionesDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateDeduccion(id, empresaId, dto, user.usuario);
  }

  @Get('ingresos')
  findAllIngresos(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllIngresos(empresaId);
  }

  @Get('ingresos/:id')
  findIngreso(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findIngreso(id, empresaId);
  }

  @Post('ingresos')
  createIngreso(@Body() dto: CreateTplIngresosDto, @CurrentUser() user: any) {
    return this.service.createIngreso(dto, user.usuario);
  }

  @Put('ingresos/:id')
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

export class CreateSucursalDto {
  @IsString() @IsNotEmpty()
  descripcion: string;

  @IsNumber()
  empresaId: number;
}

export class UpdateSucursalDto {
  @IsString() @IsOptional()
  descripcion?: string;

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
import { Tempresas } from '../../companies/entities/empresa.entity';

@Entity('tsucursal')
export class Tsucursal {
  @PrimaryGeneratedColumn({ name: 'Idsucursal' })
  idsucursal: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
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
import { SucursalesService } from './sucursales.service';
import { CreateSucursalDto, UpdateSucursalDto } from './dto/sucursal.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('sucursales')
@UseGuards(JwtAuthGuard)
export class SucursalesController {
  constructor(private readonly service: SucursalesService) {}

  @Get()
  findAll(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAll(empresaId);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findOne(id, empresaId);
  }

  @Post()
  create(@Body() dto: CreateSucursalDto, @CurrentUser() user: any) {
    return this.service.create(dto, user.usuario);
  }

  @Put(':id')
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

export class CreateUsuarioModAuthDto {
  @IsString() @IsNotEmpty()
  usuario: string;

  @IsString() @IsOptional()
  descripcion?: string;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_auth_devoluciones?: string;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_auth_reversion?: string;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_auth_anulaciones?: string;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_auth_facturacion?: string;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_auth_contabilizar?: string;

  @IsDateString() @IsOptional()
  fechaoperativa?: string;

  @IsNumber()
  empresaId: number;
}

export class UpdateUsuarioModAuthDto {
  @IsString() @IsOptional()
  descripcion?: string;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_auth_devoluciones?: string;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_auth_reversion?: string;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_auth_anulaciones?: string;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_auth_facturacion?: string;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_auth_contabilizar?: string;

  @IsDateString() @IsOptional()
  fechaoperativa?: string;
}

```

---

## 📄 src\modules\users\dto\usuario.dto.ts

```typescript
import { IsString, IsNotEmpty, IsOptional, IsEmail, IsEnum, IsNumber } from 'class-validator';

export class CreateUsuarioDto {
  @IsString() @IsNotEmpty()
  usuario: string;

  @IsString() @IsNotEmpty()
  nombre: string;

  @IsString() @IsNotEmpty()
  password: string;

  @IsEmail()
  email: string;

  @IsNumber()
  Idsucursal: number;

  @IsNumber()
  empresaId: number;
}

export class UpdateUsuarioDto {
  @IsString() @IsOptional()
  nombre?: string;

  @IsString() @IsOptional()
  password?: string;

  @IsEmail() @IsOptional()
  email?: string;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;

  @IsNumber() @IsOptional()
  Idsucursal?: number;
}

```

---

## 📄 src\modules\users\dto\usuarios-mnuitem.dto.ts

```typescript
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';

export class CreateUsuarioMnuItemDto {
  @IsNumber()
  empresaId: number;

  @IsNumber()
  moduloId: number;

  @IsString() @IsNotEmpty()
  usuario: string;

  @IsNumber()
  parent: number;

  @IsNumber()
  parentId: number;

  @IsNumber()
  levelId: number;

  @IsString() @IsNotEmpty()
  nameParent: string;

  @IsString() @IsNotEmpty()
  nameItem: string;

  @IsString() @IsNotEmpty()
  labelItem: string;

  @IsString() @IsOptional()
  iconItem?: string;

  @IsString() @IsOptional()
  routerLink?: string;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;
}

export class UpdateUsuarioMnuItemDto {
  @IsNumber() @IsOptional()
  parent?: number;

  @IsNumber() @IsOptional()
  parentId?: number;

  @IsNumber() @IsOptional()
  levelId?: number;

  @IsString() @IsOptional()
  nameParent?: string;

  @IsString() @IsOptional()
  nameItem?: string;

  @IsString() @IsOptional()
  labelItem?: string;

  @IsString() @IsOptional()
  iconItem?: string;

  @IsString() @IsOptional()
  routerLink?: string;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;
}

```

---

## 📄 src\modules\users\dto\usuarios-module.dto.ts

```typescript
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';

export class CreateUsuariosModuleDto {
  @IsNumber()
  empresaId: number;

  @IsNumber()
  moduloId: number;

  @IsString() @IsNotEmpty()
  usuario: string;

  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;

  @IsEnum(['S', 'N']) @IsOptional()
  submnudatos?: string;

  @IsEnum(['S', 'N']) @IsOptional()
  submnurocesos?: string;

  @IsEnum(['S', 'N']) @IsOptional()
  submnueportes?: string;
}

export class UpdateUsuariosModuleDto {
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;

  @IsEnum(['S', 'N']) @IsOptional()
  submnudatos?: string;

  @IsEnum(['S', 'N']) @IsOptional()
  submnurocesos?: string;

  @IsEnum(['S', 'N']) @IsOptional()
  submnueportes?: string;
}

```

---

## 📄 src\modules\users\dto\usuarios-scripts.dto.ts

```typescript
import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateUsuariosScriptsDto {
  @IsString() @IsNotEmpty()
  usuario: string;

  @IsString() @IsNotEmpty()
  script: string;

  @IsNumber()
  empresaId: number;
}

export class UpdateUsuariosScriptsDto {
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
import { UsersService } from './users.service';
import { CreateUsuarioDto, UpdateUsuarioDto } from './dto/usuario.dto';
import { CreateUsuariosModuleDto, UpdateUsuariosModuleDto } from './dto/usuarios-module.dto';
import { CreateUsuarioMnuItemDto, UpdateUsuarioMnuItemDto } from './dto/usuarios-mnuitem.dto';
import { CreateUsuariosScriptsDto, UpdateUsuariosScriptsDto } from './dto/usuarios-scripts.dto';
import { CreateUsuarioModAuthDto, UpdateUsuarioModAuthDto } from './dto/usuario-modauth.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly service: UsersService) {}

  // ===== Usuarios =====

  @Get()
  findAll(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAll(empresaId);
  }

  @Get(':usuario')
  findOne(
    @Param('usuario') usuario: string,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findOne(usuario, empresaId);
  }

  @Post()
  create(@Body() dto: CreateUsuarioDto, @CurrentUser() user: any) {
    return this.service.create(dto, user.usuario);
  }

  @Put(':usuario')
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
  findAllModules(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllModules(empresaId);
  }

  @Get('modules/:id')
  findModule(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findModule(id, empresaId);
  }

  @Post('modules')
  createModule(@Body() dto: CreateUsuariosModuleDto, @CurrentUser() user: any) {
    return this.service.createModule(dto, user.usuario);
  }

  @Put('modules/:id')
  updateModule(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateUsuariosModuleDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateModule(id, empresaId, dto, user.usuario);
  }

  @Delete('modules/:id')
  removeModule(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeModule(id, empresaId);
  }

  // ===== UsuarioMnuItem =====

  @Get('menu-items')
  findAllMnuItems(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllMnuItems(empresaId);
  }

  @Get('menu-items/:id')
  findMnuItem(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findMnuItem(id, empresaId);
  }

  @Post('menu-items')
  createMnuItem(@Body() dto: CreateUsuarioMnuItemDto, @CurrentUser() user: any) {
    return this.service.createMnuItem(dto, user.usuario);
  }

  @Put('menu-items/:id')
  updateMnuItem(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateUsuarioMnuItemDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateMnuItem(id, empresaId, dto, user.usuario);
  }

  @Delete('menu-items/:id')
  removeMnuItem(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeMnuItem(id, empresaId);
  }

  // ===== UsuariosScripts =====

  @Get('scripts')
  findAllScripts(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllScripts(empresaId);
  }

  @Get('scripts/:id')
  findScript(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findScript(id, empresaId);
  }

  @Post('scripts')
  createScript(@Body() dto: CreateUsuariosScriptsDto, @CurrentUser() user: any) {
    return this.service.createScript(dto, user.usuario);
  }

  @Put('scripts/:id')
  updateScript(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateUsuariosScriptsDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateScript(id, empresaId, dto, user.usuario);
  }

  @Delete('scripts/:id')
  removeScript(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.removeScript(id, empresaId);
  }

  // ===== UsuarioModAuth =====

  @Get('mod-auth')
  findAllModAuth(@Query('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.findAllModAuth(empresaId);
  }

  @Get('mod-auth/:id')
  findModAuth(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.service.findModAuth(id, empresaId);
  }

  @Post('mod-auth')
  createModAuth(@Body() dto: CreateUsuarioModAuthDto, @CurrentUser() user: any) {
    return this.service.createModAuth(dto, user.usuario);
  }

  @Put('mod-auth/:id')
  updateModAuth(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateUsuarioModAuthDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateModAuth(id, empresaId, dto, user.usuario);
  }

  @Delete('mod-auth/:id')
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

