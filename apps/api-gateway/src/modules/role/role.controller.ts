import {
  ApiErrorResponse,
  ApiNullResponse,
  ApiResponse,
} from '@common/decorator/api-response.decorator';
import { Roles } from '@common/decorator/roles.decorator';
import { DictDto } from '@common/dto/dict.dto';
import { CreateRoleDto } from '@common/dto/role/create-role.dto';
import { RoleDto } from '@common/dto/role/role.dto';
import { UpdateRoleDto } from '@common/dto/role/update-role.dto';
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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@shared/enum/role.enum';
import { formatResponse } from '@shared/helpers/response.helper';
import { USER_SERVICE_NAME } from 'config/microservice.config';
import { defaultIfEmpty, lastValueFrom } from 'rxjs';

@ApiTags('角色模块')
@Controller('role')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class RoleController {
  constructor(
    @Inject(USER_SERVICE_NAME) private readonly userClient: ClientProxy,
  ) {}

  @Get('dict')
  @ApiOperation({
    summary: '获取角色字典',
    description: '获取系统中所有角色的字典数据',
  })
  @ApiResponse(HttpStatus.OK, '获取成功', DictDto, true)
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  async dict() {
    const dict = await lastValueFrom(
      this.userClient.send({ cmd: 'role.dict' }, {}),
    );
    return formatResponse(200, dict, '角色字典获取成功');
  }

  @Get()
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: '获取角色列表',
    description: '获取系统中所有角色的列表（仅管理员可访问）',
  })
  @ApiResponse(HttpStatus.OK, '获取成功', RoleDto, true)
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  async findAll() {
    const roles = await lastValueFrom(
      this.userClient.send({ cmd: 'role.findAll' }, {}),
    );
    return formatResponse(200, roles, '获取角色列表成功');
  }

  @Get(':id')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: '获取角色详情',
    description: '获取指定角色的详细信息（仅管理员可访问）',
  })
  @ApiParam({ name: 'id', description: '角色ID', type: 'number' })
  @ApiResponse(HttpStatus.OK, '获取成功', RoleDto)
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '角色不存在')
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
  @ApiOperation({
    summary: '创建角色',
    description: '创建新的角色（仅管理员可访问）',
  })
  @ApiResponse(HttpStatus.CREATED, '创建成功', RoleDto)
  @ApiErrorResponse(HttpStatus.BAD_REQUEST, '请求参数错误')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
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
  @ApiOperation({
    summary: '更新角色',
    description: '更新指定角色的信息（仅管理员可访问）',
  })
  @ApiParam({ name: 'id', description: '角色ID', type: 'number' })
  @ApiResponse(HttpStatus.OK, '更新成功', RoleDto)
  @ApiErrorResponse(HttpStatus.BAD_REQUEST, '请求参数错误')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '角色不存在')
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
  @ApiOperation({
    summary: '删除角色',
    description: '删除指定的角色（仅管理员可访问）',
  })
  @ApiParam({ name: 'id', description: '角色ID', type: 'number' })
  @ApiNullResponse(HttpStatus.NO_CONTENT, '删除成功')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '角色不存在')
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
