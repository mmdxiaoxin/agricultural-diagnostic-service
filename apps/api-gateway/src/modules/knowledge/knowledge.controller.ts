import { Roles } from '@common/decorator/roles.decorator';
import { AuthGuard } from '@common/guards/auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '@shared/enum/role.enum';
import { KnowledgeService } from './knowledge.service';
import { CreateKnowledgeDto } from '@common/dto/knowledge/create-knowledge.dto';
import { UpdateKnowledgeDto } from '@common/dto/knowledge/update-knowledge.dto';

@ApiTags('病害知识库管理')
@Controller('knowledge')
@Roles(Role.Admin, Role.Expert)
@UseGuards(AuthGuard, RolesGuard)
export class KnowledgeController {
  constructor(private readonly KnowledgeService: KnowledgeService) {}

  @Get()
  findAll() {
    return this.KnowledgeService.findAll();
  }

  @Get('list')
  findList() {
    return this.KnowledgeService.findList();
  }

  @Post()
  create(@Body() createKnowledgeDto: CreateKnowledgeDto) {
    return this.KnowledgeService.create(createKnowledgeDto);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateKnowledgeDto: UpdateKnowledgeDto,
  ) {
    return this.KnowledgeService.update(id, updateKnowledgeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.KnowledgeService.remove(id);
  }
}
