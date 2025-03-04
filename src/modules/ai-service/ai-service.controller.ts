import { Roles } from '@/common/decorator/roles.decorator';
import { Role } from '@/common/enum/role.enum';
import { AuthGuard } from '@/common/guards/auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { formatResponse } from '@/common/helpers/response.helper';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreateAiServiceDto } from './dto/create-ai-service.dto';
import { UpdateAiServiceDto } from './dto/update-ai-service.dto';
import { AiServiceService } from './services/ai-service.service';

@Controller('ai-service')
@Roles(Role.Admin, Role.Expert)
@UseGuards(AuthGuard, RolesGuard)
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
    const [list, count] = await this.aiServiceService.findPaginated(
      page,
      pageSize,
    );
    return formatResponse(200, { list, count, page, pageSize }, '获取成功');
  }

  // 获取单个AI服务
  @Get(':serviceId')
  async findOne(@Param('serviceId') serviceId: number) {
    const service = await this.aiServiceService.findOne(serviceId);
    return formatResponse(200, service, '获取成功');
  }

  // 更新AI服务
  @Put(':serviceId')
  async update(
    @Param('serviceId') serviceId: number,
    @Body() updateAiServiceDto: UpdateAiServiceDto,
  ) {
    await this.aiServiceService.update(serviceId, updateAiServiceDto);
    return formatResponse(200, null, '更新成功');
  }

  // 删除AI服务
  @Delete(':serviceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('serviceId') serviceId: number) {
    await this.aiServiceService.remove(serviceId);
  }
}
