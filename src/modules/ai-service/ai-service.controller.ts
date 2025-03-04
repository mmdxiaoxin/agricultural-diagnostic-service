import { Roles } from '@/common/decorator/roles.decorator';
import { Role } from '@/common/enum/role.enum';
import { AuthGuard } from '@/common/guards/auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreateAiServiceDto } from './dto/create-ai-service.dto';
import { UpdateAiServiceDto } from './dto/update-ai-service.dto';
import { AiService } from './models/ai-service.entity';
import { AiServiceService } from './services/ai-service.service';

@Controller('ai-service')
@Roles(Role.Admin, Role.Expert)
@UseGuards(AuthGuard, RolesGuard)
export class AiServiceController {
  constructor(private readonly aiServiceService: AiServiceService) {}

  // 创建AI服务
  @Post()
  async create(@Body() dto: CreateAiServiceDto): Promise<AiService> {
    return this.aiServiceService.create(dto);
  }

  // 获取全部AI服务
  @Get()
  async findAll(): Promise<AiService[]> {
    return this.aiServiceService.findAll();
  }

  // 分页查询AI服务
  @Get('list')
  async findPaginated(
    @Query('page') page: number,
    @Query('pageSize') pageSize: number,
  ): Promise<AiService[]> {
    return this.aiServiceService.findPaginated(page, pageSize);
  }

  // 获取单个AI服务
  @Get(':serviceId')
  async findOne(@Param('serviceId') serviceId: number) {
    return this.aiServiceService.findOne(serviceId);
  }

  // 更新AI服务
  @Put(':serviceId')
  async update(
    @Param('serviceId') serviceId: number,
    @Body() updateAiServiceDto: UpdateAiServiceDto,
  ): Promise<AiService> {
    return this.aiServiceService.update(serviceId, updateAiServiceDto);
  }

  // 删除AI服务
  @Delete(':serviceId')
  async remove(@Param('serviceId') serviceId: number): Promise<void> {
    return this.aiServiceService.remove(serviceId);
  }
}
