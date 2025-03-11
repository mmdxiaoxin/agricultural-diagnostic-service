import { Roles } from '@common/decorator/roles.decorator';
import { Role } from '@shared/enum/role.enum';
import { AuthGuard } from '@common/guards/auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { formatResponse } from '@shared/helpers/response.helper';
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
import { CreatePlantDiseaseKnowledgeDto } from './dto/create-knowledge.dto';
import { UpdatePlantDiseaseKnowledgeDto } from './dto/update-knowledge.dto';
import { KnowledgeService } from './knowledge.service';
import { ApiTags } from '@nestjs/swagger';

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
    await this.KnowledgeService.create(dto);
    return formatResponse(201, null, '病害知识记录创建成功');
  }

  // 获取所有病害知识记录
  @Get()
  async knowledgeGet() {
    const knowledge = await this.KnowledgeService.knowledgeGet();
    return formatResponse(200, knowledge, '病害知识记录获取成功');
  }

  // 获取所有病害知识记录分页
  @Get('list')
  async knowledgeListGet(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('pageSize', ParseIntPipe) pageSize: number = 10,
    @Query('category') category?: string,
  ) {
    const [list, total] = await this.KnowledgeService.knowledgeListGet(
      page,
      pageSize,
      { category },
    );
    return formatResponse(
      200,
      {
        list,
        page,
        pageSize,
        total,
      },
      '病害知识列表获取成功',
    );
  }

  // 获取单个病害知识记录
  @Get(':id')
  async knowledgeDetailGet(@Param('id') id: number) {
    const knowledge = await this.KnowledgeService.findById(id);
    return formatResponse(200, knowledge, '病害知识记录获取成功');
  }

  // 更新病害知识记录
  @Put(':id')
  async knowledgeUpdate(
    @Param('id') id: number,
    @Body() dto: UpdatePlantDiseaseKnowledgeDto,
  ) {
    await this.KnowledgeService.update(id, dto);
    return formatResponse(200, null, '病害知识记录更新成功');
  }

  // 删除病害知识记录
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async knowledgeDelete(@Param('id') id: number) {
    await this.KnowledgeService.remove(id);
  }
}
