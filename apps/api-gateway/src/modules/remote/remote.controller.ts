import { Roles } from '@common/decorator/roles.decorator';
import { CreateRemoteInterfaceDto } from '@common/dto/remote/create-remote-interface.dto';
import { CreateRemoteServiceDto } from '@common/dto/remote/create-remote-service.dto';
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
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '@shared/enum/role.enum';
import { RemoteService } from './remote.service';

@ApiTags('远程服务模块')
@Controller('remote')
@Roles(Role.Admin, Role.Expert)
@UseGuards(AuthGuard, RolesGuard)
export class RemoteController {
  constructor(private readonly remoteService: RemoteService) {}

  // 获取全部远程服务
  @Get()
  async getRemote() {
    return this.remoteService.getRemote();
  }

  // 分页查询远程服务
  @Get('list')
  async getRemoteList(
    @Query('page') page: number,
    @Query('pageSize') pageSize: number,
  ) {
    return this.remoteService.getRemoteList(page, pageSize);
  }

  // 获取单个远程服务
  @Get(':serviceId')
  async getRemoteById(
    @Param(
      'serviceId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    serviceId: number,
  ) {
    return this.remoteService.getRemoteById(serviceId);
  }

  // 创建远程服务
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createRemote(@Body() dto: CreateRemoteServiceDto) {
    return this.remoteService.createRemote(dto);
  }

  // 更新远程服务
  @Put(':serviceId')
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

  // 删除远程服务
  @Delete(':serviceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeRemote(
    @Param(
      'serviceId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    serviceId: number,
  ) {
    return this.remoteService.removeRemote(serviceId);
  }

  // 复制远程服务
  @Post(':serviceId/copy')
  @HttpCode(HttpStatus.CREATED)
  async copyRemote(
    @Param(
      'serviceId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    serviceId: number,
  ) {
    return this.remoteService.copyRemote(serviceId);
  }

  // 创建远程服务接口
  @Post(':serviceId/interface')
  @HttpCode(HttpStatus.CREATED)
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

  // 获取远程服务接口列表
  @Get(':serviceId/interface')
  async getRemoteInterfaces(
    @Param(
      'serviceId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    serviceId: number,
  ) {
    return this.remoteService.getRemoteInterfaces(serviceId);
  }

  // 分页获取远程服务接口列表
  @Get(':serviceId/interface/list')
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

  // 获取单个远程服务接口
  @Get(':serviceId/interface/:interfaceId')
  async getRemoteInterfaceById(
    @Param(
      'interfaceId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    interfaceId: number,
  ) {
    return this.remoteService.getRemoteInterfaceById(interfaceId);
  }

  // 更新远程服务接口
  @Put(':serviceId/interface/:interfaceId')
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

  // 删除远程服务接口
  @Delete(':serviceId/interface/:interfaceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeRemoteInterface(
    @Param(
      'interfaceId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    interfaceId: number,
  ) {
    return this.remoteService.removeRemoteInterface(interfaceId);
  }

  // 获取服务的所有配置
  @Get(':serviceId/config')
  async getRemoteConfigs(
    @Param(
      'serviceId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    serviceId: number,
  ) {
    return this.remoteService.getRemoteConfigs(serviceId);
  }

  // 分页获取服务的配置
  @Get(':serviceId/config/list')
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

  // 获取单个配置
  @Get(':serviceId/config/:configId')
  async getRemoteConfigById(
    @Param(
      'configId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    configId: number,
  ) {
    return this.remoteService.getRemoteConfigById(configId);
  }

  // 创建配置
  @Post(':serviceId/config')
  @HttpCode(HttpStatus.CREATED)
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

  // 更新配置
  @Put(':serviceId/config/:configId')
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

  // 删除配置
  @Delete(':serviceId/config/:configId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeRemoteConfig(
    @Param(
      'configId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    configId: number,
  ) {
    return this.remoteService.removeRemoteConfig(configId);
  }
}
