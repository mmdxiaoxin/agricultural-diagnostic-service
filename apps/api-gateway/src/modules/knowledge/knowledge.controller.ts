import { Roles } from '@common/decorator/roles.decorator';
import { CreateKnowledgeDto } from '@common/dto/knowledge/create-knowledge.dto';
import { UpdateKnowledgeDto } from '@common/dto/knowledge/update-knowledge.dto';
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
import { PageQueryKnowledgeDto } from '@common/dto/knowledge/page-query-knowledge.dto';

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
  findList(@Query() query: PageQueryKnowledgeDto) {
    return this.KnowledgeService.findList(query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createKnowledgeDto: CreateKnowledgeDto) {
    return this.KnowledgeService.create(createKnowledgeDto);
  }

  @Put(':id')
  update(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
    @Body() updateKnowledgeDto: UpdateKnowledgeDto,
  ) {
    return this.KnowledgeService.update(id, updateKnowledgeDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
  ) {
    return this.KnowledgeService.remove(id);
  }
}
