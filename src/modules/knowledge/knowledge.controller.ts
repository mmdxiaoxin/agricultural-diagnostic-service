import { Roles } from '@/common/decorator/roles.decorator';
import { Role } from '@/common/enum/role.enum';
import { AuthGuard } from '@/common/guards/auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
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
  UseGuards,
} from '@nestjs/common';
import { CreatePlantDiseaseKnowledgeDto } from './dto/create-knowledge.dto';
import { UpdatePlantDiseaseKnowledgeDto } from './dto/update-knowledge.dto';
import { KnowledgeManageService } from './services/knowledge-manage.service';

@Controller('knowledge')
@Roles(Role.Admin, Role.Expert)
@UseGuards(AuthGuard, RolesGuard)
export class KnowledgeController {
  constructor(private readonly manageService: KnowledgeManageService) {}

  // 创建病害知识记录
  @Post()
  @HttpCode(HttpStatus.CREATED)
  knowledgeCreate(@Body() dto: CreatePlantDiseaseKnowledgeDto) {
    this.manageService.knowledgeCreate(dto);
  }

  // 获取所有病害知识记录
  @Get('list')
  knowledgeListGet() {
    return this.manageService.knowledgeListGet();
  }

  // 获取单个病害知识记录
  @Get(':id')
  knowledgeDetailGet(@Param('id') id: number) {
    return this.manageService.knowledgeDetailGet(id);
  }

  // 更新病害知识记录
  @Put(':id')
  knowledgeUpdate(
    @Param('id') id: number,
    @Body() dto: UpdatePlantDiseaseKnowledgeDto,
  ) {
    return this.manageService.knowledgeUpdate(id, dto);
  }

  // 删除病害知识记录
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  knowledgeDelete(@Param('id') id: number) {
    return this.manageService.knowledgeDelete(id);
  }
}
