import { Roles } from '@common/decorator/roles.decorator';
import { TypeormFilter } from '@common/filters/typeorm.filter';
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
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@shared/enum/role.enum';
import { AiServiceService } from './ai-service.service';
import { CreateAiServiceDto } from '@common/dto/ai-service/create-ai-service.dto';
import { formatResponse } from '@shared/helpers/response.helper';

@Controller('ai-service')
@Roles(Role.Admin, Role.Expert)
@UseGuards(AuthGuard, RolesGuard)
@UseFilters(TypeormFilter)
export class AiServiceController {
  constructor(private readonly aiServiceService: AiServiceService) {}

  // 创建AI服务
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateAiServiceDto) {
    await this.aiServiceService.create(dto);
    return formatResponse(201, null, '创建成功');
  }

  // 获取全部AI服务
  @Get()
  async findAll() {
    const services = await this.aiServiceService.findAll();
    return formatResponse(200, services, '获取成功');
  }

  // 分页查询AI服务
  @Get('list')
  async findPaginated(
    @Query('page') page: number,
    @Query('pageSize') pageSize: number,
  ) {
    const [list, total] = await this.aiServiceService.findPaginated(
      page,
      pageSize,
    );
    return formatResponse(200, { list, total, page, pageSize }, '获取成功');
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
    const service = await this.aiServiceService.findOne(serviceId);
    return formatResponse(200, service, '获取成功');
  }

  // 更新AI服务
  @Put(':serviceId')
  async update(
    @Param(
      'serviceId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    serviceId: number,
    @Body() updateAiServiceDto: UpdateAiServiceDto,
  ) {
    await this.aiServiceService.update(serviceId, updateAiServiceDto);
    return formatResponse(200, null, '更新成功');
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
    await this.aiServiceService.remove(serviceId);
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
    @Body() dto: CreateAiConfigDto,
  ) {
    await this.aiConfigsService.addConfig(serviceId, dto);
    return formatResponse(201, null, '创建成功');
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
    @Body() dto: CreateAiConfigsDto,
  ) {
    await this.aiConfigsService.addConfigs(serviceId, dto);
    return formatResponse(201, null, '创建成功');
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
    const configs = await this.aiServiceService.findServiceConfigs(serviceId);
    return formatResponse(200, configs, '获取成功');
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
    @Body() dto: CreateAiConfigDto,
  ) {
    await this.aiServiceService.updateConfig(configId, dto);
    return formatResponse(200, null, '更新成功');
  }

  // 删除AI服务配置
  @Delete(':serviceId/config/:configId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeConfig(
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
  ) {
    await this.aiServiceService.removeConfig(configId);
  }
}
