import { Roles } from '@common/decorator/roles.decorator';
import { CreateRemoteConfigDto } from '@common/dto/remote/create-remote-config.dto';
import { CreateRemoteConfigsDto } from '@common/dto/remote/create-remote-configs.dto';
import { CreateRemoteServiceDto } from '@common/dto/remote/create-remote-service.dto';
import { UpdateAiConfigsDto } from '@common/dto/remote/update-remote-configs.dto';
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
import { AiServiceService } from './ai-service.service';

@ApiTags('AI服务模块')
@Controller('ai-service')
@Roles(Role.Admin, Role.Expert)
@UseGuards(AuthGuard, RolesGuard)
export class AiServiceController {
  constructor(private readonly aiService: AiServiceService) {}

  // 创建AI服务
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateRemoteServiceDto) {
    return this.aiService.createAi(dto);
  }

  // 获取全部AI服务
  @Get()
  async findAll() {
    return this.aiService.getAi();
  }

  // 分页查询AI服务
  @Get('list')
  async findPaginated(
    @Query('page') page: number,
    @Query('pageSize') pageSize: number,
  ) {
    return this.aiService.getAiList(page, pageSize);
  }

  // 获取单个AI服务
  @Get(':serviceId')
  async findOne(
    @Param(
      'serviceId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    serviceId: number,
  ) {
    return this.aiService.getAiById(serviceId);
  }

  // 更新AI服务
  @Put(':serviceId')
  async update(
    @Param(
      'serviceId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    serviceId: number,
    @Body() updateAiServiceDto: UpdateRemoteServiceDto,
  ) {
    return this.aiService.updateAi(serviceId, updateAiServiceDto);
  }

  // 删除AI服务
  @Delete(':serviceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param(
      'serviceId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    serviceId: number,
  ) {
    return this.aiService.removeAi(serviceId);
  }

  // 复制AI服务
  @Post(':serviceId/copy')
  @HttpCode(HttpStatus.CREATED)
  async copy(
    @Param(
      'serviceId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    serviceId: number,
  ) {
    return this.aiService.copyAi(serviceId);
  }

  // 增加AI服务配置
  @Post(':serviceId/config')
  @HttpCode(HttpStatus.CREATED)
  async addConfig(
    @Param(
      'serviceId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    serviceId: number,
    @Body() dto: CreateRemoteConfigDto,
  ) {
    return this.aiService.addAiConfig(serviceId, dto);
  }

  // 批量增加AI服务配置
  @Post(':serviceId/configs')
  @HttpCode(HttpStatus.CREATED)
  async addConfigs(
    @Param(
      'serviceId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    serviceId: number,
    @Body() dto: CreateRemoteConfigsDto,
  ) {
    return this.aiService.addAiConfigs(serviceId, dto);
  }

  // 获取服务配置
  @Get(':serviceId/config')
  async findServiceConfigs(
    @Param(
      'serviceId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    serviceId: number,
  ) {
    return this.aiService.getAiConfigs(serviceId);
  }

  // 更新AI服务配置
  @Put(':serviceId/config/:configId')
  async updateConfig(
    @Param(
      'serviceId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    _: number,
    @Param(
      'configId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    configId: number,
    @Body() dto: CreateRemoteConfigDto,
  ) {
    return this.aiService.updateAiConfig(configId, dto);
  }

  // 批量更新AI服务配置
  @Put(':serviceId/configs')
  async updateConfigs(
    @Param(
      'serviceId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    serviceId: number,
    @Body() dto: UpdateAiConfigsDto,
  ) {
    return this.aiService.updateAiConfigs(serviceId, dto);
  }

  // 删除AI服务配置
  @Delete(':serviceId/config/:configId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeConfig(
    @Param(
      'serviceId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    serviceId: number,
    @Param(
      'configId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    configId: number,
  ) {
    return this.aiService.removeAiConfig(serviceId, configId);
  }
}
