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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@shared/enum/role.enum';
import { KnowledgeService } from './knowledge.service';

@ApiTags('病害知识库管理')
@Controller('knowledge')
@UseGuards(AuthGuard, RolesGuard)
@ApiBearerAuth()
export class KnowledgeController {
  constructor(private readonly KnowledgeService: KnowledgeService) {}

  @Get()
  @Roles(Role.Admin, Role.Expert, Role.User)
  @ApiOperation({
    summary: '获取所有知识',
    description: '获取病害知识库中的所有知识条目',
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  findAll() {
    return this.KnowledgeService.findAll();
  }

  @Get('list')
  @Roles(Role.Admin, Role.Expert, Role.User)
  @ApiOperation({
    summary: '分页获取知识列表',
    description: '分页获取病害知识库中的知识条目',
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  findList(@Query() query: PageQueryKnowledgeDto) {
    return this.KnowledgeService.findList(query);
  }

  @Get('match')
  @Roles(Role.Admin, Role.Expert, Role.User)
  @ApiOperation({
    summary: '匹配知识',
    description: '根据查询条件匹配相关的病害知识',
  })
  @ApiResponse({ status: 200, description: '匹配成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  matchKnowledge(@Query() query: MatchKnowledgeDto) {
    return this.KnowledgeService.match(query);
  }

  @Post()
  @Roles(Role.Admin, Role.Expert)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '创建知识',
    description: '创建新的病害知识条目（仅管理员和专家可访问）',
  })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  create(@Body() createKnowledgeDto: CreateKnowledgeDto) {
    return this.KnowledgeService.create(createKnowledgeDto);
  }

  @Put(':id')
  @Roles(Role.Admin, Role.Expert)
  @ApiOperation({
    summary: '更新知识',
    description: '更新指定病害知识条目的信息（仅管理员和专家可访问）',
  })
  @ApiParam({ name: 'id', description: '知识条目ID', type: 'number' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '知识条目不存在' })
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
  @ApiOperation({
    summary: '删除知识',
    description: '删除指定的病害知识条目（仅管理员和专家可访问）',
  })
  @ApiParam({ name: 'id', description: '知识条目ID', type: 'number' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '知识条目不存在' })
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
