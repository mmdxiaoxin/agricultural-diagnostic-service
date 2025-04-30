import { Roles } from '@common/decorator/roles.decorator';
import { CreateKnowledgeDto } from '@common/dto/knowledge/create-knowledge.dto';
import { MatchKnowledgeDto } from '@common/dto/knowledge/match-knowledge.dto';
import { PageQueryKnowledgeDto } from '@common/dto/knowledge/page-query-knowledge.dto';
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

@ApiTags('病害知识库管理')
@Controller('knowledge')
@UseGuards(AuthGuard, RolesGuard)
export class KnowledgeController {
  constructor(private readonly KnowledgeService: KnowledgeService) {}

  @Get()
  @Roles(Role.Admin, Role.Expert, Role.User)
  findAll() {
    return this.KnowledgeService.findAll();
  }

  @Get('list')
  @Roles(Role.Admin, Role.Expert, Role.User)
  findList(@Query() query: PageQueryKnowledgeDto) {
    return this.KnowledgeService.findList(query);
  }

  @Get('match')
  @Roles(Role.Admin, Role.Expert, Role.User)
  matchKnowledge(@Query() query: MatchKnowledgeDto) {
    return this.KnowledgeService.match(query);
  }

  @Post()
  @Roles(Role.Admin, Role.Expert)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createKnowledgeDto: CreateKnowledgeDto) {
    return this.KnowledgeService.create(createKnowledgeDto);
  }

  @Put(':id')
  @Roles(Role.Admin, Role.Expert)
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
  @Roles(Role.Admin, Role.Expert)
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
