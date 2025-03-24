import { Roles } from '@common/decorator/roles.decorator';
import { AuthGuard } from '@common/guards/auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '@shared/enum/role.enum';
import { formatResponse } from '@shared/helpers/response.helper';
import { USER_SERVICE_NAME } from 'config/microservice.config';
import { defaultIfEmpty, lastValueFrom } from 'rxjs';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@ApiTags('角色模块')
@Controller('role')
@UseGuards(AuthGuard)
export class RoleController {
  constructor(
    @Inject(USER_SERVICE_NAME) private readonly userClient: ClientProxy,
  ) {}

  @Get('dict')
  async dict() {
    const dict = await lastValueFrom(
      this.userClient.send({ cmd: 'role.dict' }, {}),
    );
    return formatResponse(200, dict, '角色字典获取成功');
  }

  @Get()
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  async findAll() {
    const roles = await lastValueFrom(
      this.userClient.send({ cmd: 'role.findAll' }, {}),
    );
    return formatResponse(200, roles, '获取角色列表成功');
  }

  @Get(':id')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  async findOne(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
  ) {
    const role = await lastValueFrom(
      this.userClient.send({ cmd: 'role.findOne' }, { id }),
    );
    return formatResponse(200, role, '获取角色成功');
  }

  @Post()
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RolesGuard)
  async create(@Body() dto: CreateRoleDto) {
    await lastValueFrom(
      this.userClient
        .send({ cmd: 'role.create' }, { dto })
        .pipe(defaultIfEmpty(null)),
    );
    return formatResponse(201, null, '角色创建成功');
  }

  @Put(':id')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  async update(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
    @Body() dto: UpdateRoleDto,
  ) {
    const updatedRole = await lastValueFrom(
      this.userClient.send({ cmd: 'role.update' }, { id, dto }),
    );
    return formatResponse(200, updatedRole, '角色更新成功');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  async remove(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
  ) {
    return await lastValueFrom(
      this.userClient
        .send({ cmd: 'role.remove' }, { id })
        .pipe(defaultIfEmpty(null)),
    );
  }
}
