import {
  ApiErrorResponse,
  ApiNullResponse,
  ApiResponse,
} from '@common/decorator/api-response.decorator';
import { Roles } from '@common/decorator/roles.decorator';
import { createPageResponseDto } from '@common/dto/page-response.dto';
import { CallRemoteInterfaceDto } from '@common/dto/remote/call-remote-interface.dto';
import { CreateRemoteInterfaceDto } from '@common/dto/remote/create-remote-interface.dto';
import { CreateRemoteServiceDto } from '@common/dto/remote/create-remote-service.dto';
import { RemoveServiceConfigDto } from '@common/dto/remote/remote-config.dto';
import { RemoteInterfaceDto } from '@common/dto/remote/remote-interface.dto';
import { RemoteServiceDto } from '@common/dto/remote/remote-service.dto';
import { UpdateRemoteInterfaceDto } from '@common/dto/remote/update-remote-interface.dto';
import { UpdateRemoteServiceDto } from '@common/dto/remote/update-remote-service.dto';
import { AuthGuard } from '@common/guards/auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@shared/enum/role.enum';
import { Request } from 'express';
import { RemoteService } from './remote.service';

@ApiTags('远程服务模块')
@Controller('remote')
@Roles(Role.Admin, Role.Expert)
@UseGuards(AuthGuard, RolesGuard)
@ApiBearerAuth()
export class RemoteController {
  constructor(private readonly remoteService: RemoteService) {}

  @Get()
  @ApiOperation({
    summary: '获取全部远程服务',
    description: '获取系统中所有的远程服务列表',
  })
  @ApiResponse(HttpStatus.OK, '获取成功', RemoteServiceDto, true)
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  async getRemote() {
    return this.remoteService.getRemote();
  }

  @Get('list')
  @ApiOperation({
    summary: '分页查询远程服务',
    description: '分页获取远程服务列表',
  })
  @ApiQuery({ name: 'page', description: '页码', type: 'number' })
  @ApiQuery({ name: 'pageSize', description: '每页数量', type: 'number' })
  @ApiResponse(
    HttpStatus.OK,
    '获取成功',
    createPageResponseDto(RemoteServiceDto),
  )
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  async getRemoteList(
    @Query('page') page: number,
    @Query('pageSize') pageSize: number,
  ) {
    return this.remoteService.getRemoteList(page, pageSize);
  }

  @Get(':serviceId')
  @ApiOperation({
    summary: '获取单个远程服务',
    description: '获取指定远程服务的详细信息',
  })
  @ApiParam({ name: 'serviceId', description: '服务ID', type: 'number' })
  @ApiResponse(HttpStatus.OK, '获取成功', RemoteServiceDto)
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '服务不存在')
  async getRemoteById(
    @Param(
      'serviceId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    serviceId: number,
  ) {
    return this.remoteService.getRemoteById(serviceId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建远程服务', description: '创建新的远程服务' })
  @ApiResponse(HttpStatus.CREATED, '创建成功')
  @ApiErrorResponse(HttpStatus.BAD_REQUEST, '请求参数错误')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  async createRemote(@Body() dto: CreateRemoteServiceDto) {
    return this.remoteService.createRemote(dto);
  }

  @Put(':serviceId')
  @ApiOperation({
    summary: '更新远程服务',
    description: '更新指定远程服务的信息',
  })
  @ApiParam({ name: 'serviceId', description: '服务ID', type: 'number' })
  @ApiResponse(HttpStatus.OK, '更新成功')
  @ApiErrorResponse(HttpStatus.BAD_REQUEST, '请求参数错误')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '服务不存在')
  async updateRemote(
    @Param(
      'serviceId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    serviceId: number,
    @Body() dto: UpdateRemoteServiceDto,
  ) {
    return this.remoteService.updateRemote(serviceId, dto);
  }

  @Delete(':serviceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除远程服务', description: '删除指定的远程服务' })
  @ApiParam({ name: 'serviceId', description: '服务ID', type: 'number' })
  @ApiNullResponse(HttpStatus.NO_CONTENT, '删除成功')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '服务不存在')
  async removeRemote(
    @Param(
      'serviceId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    serviceId: number,
  ) {
    return this.remoteService.removeRemote(serviceId);
  }

  @Post(':serviceId/copy')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '复制远程服务', description: '复制指定的远程服务' })
  @ApiParam({ name: 'serviceId', description: '服务ID', type: 'number' })
  @ApiResponse(HttpStatus.CREATED, '复制成功')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '服务不存在')
  async copyRemote(
    @Param(
      'serviceId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    serviceId: number,
  ) {
    return this.remoteService.copyRemote(serviceId);
  }

  @Post(':serviceId/interface')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '创建远程服务接口',
    description: '为指定服务创建新的接口',
  })
  @ApiParam({ name: 'serviceId', description: '服务ID', type: 'number' })
  @ApiResponse(HttpStatus.CREATED, '创建成功')
  @ApiErrorResponse(HttpStatus.BAD_REQUEST, '请求参数错误')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '服务不存在')
  async createRemoteInterface(
    @Param(
      'serviceId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    serviceId: number,
    @Body() dto: CreateRemoteInterfaceDto,
  ) {
    return this.remoteService.createRemoteInterface(serviceId, dto);
  }

  @Get(':serviceId/interface')
  @ApiOperation({
    summary: '获取远程服务接口列表',
    description: '获取指定服务的所有接口',
  })
  @ApiParam({ name: 'serviceId', description: '服务ID', type: 'number' })
  @ApiResponse(HttpStatus.OK, '获取成功', RemoteInterfaceDto, true)
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '服务不存在')
  async getRemoteInterfaces(
    @Param(
      'serviceId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    serviceId: number,
  ) {
    return this.remoteService.getRemoteInterfaces(serviceId);
  }

  @Get(':serviceId/interface/list')
  @ApiOperation({
    summary: '分页获取远程服务接口列表',
    description: '分页获取指定服务的接口列表',
  })
  @ApiParam({ name: 'serviceId', description: '服务ID', type: 'number' })
  @ApiQuery({ name: 'page', description: '页码', type: 'number' })
  @ApiQuery({ name: 'pageSize', description: '每页数量', type: 'number' })
  @ApiResponse(
    HttpStatus.OK,
    '获取成功',
    createPageResponseDto(RemoteInterfaceDto),
  )
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '服务不存在')
  async getRemoteInterfaceList(
    @Param(
      'serviceId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    serviceId: number,
    @Query('page') page: number,
    @Query('pageSize') pageSize: number,
  ) {
    return this.remoteService.getRemoteInterfaceList(serviceId, page, pageSize);
  }

  @Get(':serviceId/interface/:interfaceId')
  @ApiOperation({
    summary: '获取单个远程服务接口',
    description: '获取指定接口的详细信息',
  })
  @ApiParam({ name: 'serviceId', description: '服务ID', type: 'number' })
  @ApiParam({ name: 'interfaceId', description: '接口ID', type: 'number' })
  @ApiResponse(HttpStatus.OK, '获取成功', RemoteInterfaceDto)
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '接口不存在')
  async getRemoteInterfaceById(
    @Param(
      'interfaceId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    interfaceId: number,
  ) {
    return this.remoteService.getRemoteInterfaceById(interfaceId);
  }

  @Put(':serviceId/interface/:interfaceId')
  @ApiOperation({
    summary: '更新远程服务接口',
    description: '更新指定接口的信息',
  })
  @ApiParam({ name: 'serviceId', description: '服务ID', type: 'number' })
  @ApiParam({ name: 'interfaceId', description: '接口ID', type: 'number' })
  @ApiResponse(HttpStatus.OK, '更新成功')
  @ApiErrorResponse(HttpStatus.BAD_REQUEST, '请求参数错误')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '接口不存在')
  async updateRemoteInterface(
    @Param(
      'interfaceId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    interfaceId: number,
    @Body() dto: UpdateRemoteInterfaceDto,
  ) {
    return this.remoteService.updateRemoteInterface(interfaceId, dto);
  }

  @Delete(':serviceId/interface/:interfaceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除远程服务接口', description: '删除指定的接口' })
  @ApiParam({ name: 'serviceId', description: '服务ID', type: 'number' })
  @ApiParam({ name: 'interfaceId', description: '接口ID', type: 'number' })
  @ApiNullResponse(HttpStatus.NO_CONTENT, '删除成功')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '接口不存在')
  async removeRemoteInterface(
    @Param(
      'interfaceId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    interfaceId: number,
  ) {
    return this.remoteService.removeRemoteInterface(interfaceId);
  }

  @Get(':serviceId/config')
  @ApiOperation({
    summary: '获取服务的所有配置',
    description: '获取指定服务的所有配置信息',
  })
  @ApiParam({ name: 'serviceId', description: '服务ID', type: 'number' })
  @ApiResponse(HttpStatus.OK, '获取成功', RemoveServiceConfigDto, true)
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '服务不存在')
  async getRemoteConfigs(
    @Param(
      'serviceId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    serviceId: number,
  ) {
    return this.remoteService.getRemoteConfigs(serviceId);
  }

  @Get(':serviceId/config/list')
  @ApiOperation({
    summary: '分页获取服务的配置',
    description: '分页获取指定服务的配置列表',
  })
  @ApiParam({ name: 'serviceId', description: '服务ID', type: 'number' })
  @ApiQuery({ name: 'page', description: '页码', type: 'number' })
  @ApiQuery({ name: 'pageSize', description: '每页数量', type: 'number' })
  @ApiResponse(
    HttpStatus.OK,
    '获取成功',
    createPageResponseDto(RemoveServiceConfigDto),
  )
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '服务不存在')
  async getRemoteConfigList(
    @Param(
      'serviceId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    serviceId: number,
    @Query('page') page: number,
    @Query('pageSize') pageSize: number,
  ) {
    return this.remoteService.getRemoteConfigList(serviceId, page, pageSize);
  }

  @Get(':serviceId/config/:configId')
  @ApiOperation({
    summary: '获取单个配置',
    description: '获取指定配置的详细信息',
  })
  @ApiParam({ name: 'serviceId', description: '服务ID', type: 'number' })
  @ApiParam({ name: 'configId', description: '配置ID', type: 'number' })
  @ApiResponse(HttpStatus.OK, '获取成功', RemoveServiceConfigDto)
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '配置不存在')
  async getRemoteConfigById(
    @Param(
      'configId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    configId: number,
  ) {
    return this.remoteService.getRemoteConfigById(configId);
  }

  @Post(':serviceId/config')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建配置', description: '为指定服务创建新的配置' })
  @ApiParam({ name: 'serviceId', description: '服务ID', type: 'number' })
  @ApiResponse(HttpStatus.CREATED, '创建成功')
  @ApiErrorResponse(HttpStatus.BAD_REQUEST, '请求参数错误')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '服务不存在')
  async createRemoteConfig(
    @Param(
      'serviceId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    serviceId: number,
    @Body() config: any,
  ) {
    return this.remoteService.createRemoteConfig(serviceId, config);
  }

  @Put(':serviceId/config/:configId')
  @ApiOperation({ summary: '更新配置', description: '更新指定配置的信息' })
  @ApiParam({ name: 'serviceId', description: '服务ID', type: 'number' })
  @ApiParam({ name: 'configId', description: '配置ID', type: 'number' })
  @ApiResponse(HttpStatus.OK, '更新成功')
  @ApiErrorResponse(HttpStatus.BAD_REQUEST, '请求参数错误')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '配置不存在')
  async updateRemoteConfig(
    @Param(
      'configId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    configId: number,
    @Body() config: any,
  ) {
    return this.remoteService.updateRemoteConfig(configId, config);
  }

  @Delete(':serviceId/config/:configId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除配置', description: '删除指定的配置' })
  @ApiParam({ name: 'serviceId', description: '服务ID', type: 'number' })
  @ApiParam({ name: 'configId', description: '配置ID', type: 'number' })
  @ApiNullResponse(HttpStatus.NO_CONTENT, '删除成功')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '配置不存在')
  async removeRemoteConfig(
    @Param(
      'configId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    configId: number,
  ) {
    return this.remoteService.removeRemoteConfig(configId);
  }

  @Post(':serviceId/config/:configId/copy')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '复制配置', description: '复制指定的配置' })
  @ApiParam({ name: 'serviceId', description: '服务ID', type: 'number' })
  @ApiParam({ name: 'configId', description: '配置ID', type: 'number' })
  @ApiResponse(HttpStatus.CREATED, '复制成功')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '配置不存在')
  async copyRemoteConfig(
    @Param(
      'configId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    configId: number,
  ) {
    return this.remoteService.copyRemoteConfig(configId);
  }

  @Post(':serviceId/interface/:interfaceId/copy')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '复制接口', description: '复制指定的接口' })
  @ApiParam({ name: 'serviceId', description: '服务ID', type: 'number' })
  @ApiParam({ name: 'interfaceId', description: '接口ID', type: 'number' })
  @ApiResponse(HttpStatus.CREATED, '复制成功')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '接口不存在')
  async copyRemoteInterface(
    @Param(
      'interfaceId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    interfaceId: number,
  ) {
    return this.remoteService.copyRemoteInterface(interfaceId);
  }

  @Post(':serviceId/interface/:interfaceId/call')
  @ApiOperation({
    summary: '调用远程服务接口',
    description: '调用指定的远程服务接口',
  })
  @ApiParam({ name: 'serviceId', description: '服务ID', type: 'number' })
  @ApiParam({ name: 'interfaceId', description: '接口ID', type: 'number' })
  @ApiResponse(HttpStatus.OK, '调用成功')
  @ApiErrorResponse(HttpStatus.BAD_REQUEST, '请求参数错误')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '接口不存在')
  async callRemoteInterface(
    @Param(
      'interfaceId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    interfaceId: number,
    @Req() req: Request,
    @Body() dto: CallRemoteInterfaceDto,
  ) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('未提供认证令牌');
    }
    return this.remoteService.callRemoteInterface(interfaceId, token, dto);
  }
}
