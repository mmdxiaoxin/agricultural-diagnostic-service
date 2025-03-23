import { Roles } from '@common/decorator/roles.decorator';
import { CreatePlantDiseaseKnowledgeDto } from '@common/dto/knowledge/create-knowledge.dto';
import { UpdatePlantDiseaseKnowledgeDto } from '@common/dto/knowledge/update-knowledge.dto';
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
import { KnowledgeService } from './knowledge.service';

@ApiTags('病害知识库管理')
@Controller('knowledge')
@Roles(Role.Admin, Role.Expert)
@UseGuards(AuthGuard, RolesGuard)
export class KnowledgeController {
  constructor(private readonly KnowledgeService: KnowledgeService) {}

  // 创建病害知识记录
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async knowledgeCreate(@Body() dto: CreatePlantDiseaseKnowledgeDto) {
    return this.KnowledgeService.create(dto);
  }

  // 获取所有病害知识记录
  @Get()
  async knowledgeGet() {
    return this.KnowledgeService.knowledgeGet();
  }

  // 获取所有病害知识记录分页
  @Get('list')
  async knowledgeListGet(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('pageSize', ParseIntPipe) pageSize: number = 10,
    @Query('category') category?: string,
  ) {
    return this.KnowledgeService.knowledgeListGet(page, pageSize, { category });
  }

  // 获取单个病害知识记录
  @Get(':id')
  async knowledgeDetailGet(@Param('id') id: number) {
    return this.KnowledgeService.knowledgeGetById(id);
  }

  // 更新病害知识记录
  @Put(':id')
  async knowledgeUpdate(
    @Param('id') id: number,
    @Body() dto: UpdatePlantDiseaseKnowledgeDto,
  ) {
    return this.KnowledgeService.knowledgeUpdate(id, dto);
  }

  // 删除病害知识记录
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async knowledgeDelete(@Param('id') id: number) {
    await this.KnowledgeService.knowledgeRemove(id);
  }
}
