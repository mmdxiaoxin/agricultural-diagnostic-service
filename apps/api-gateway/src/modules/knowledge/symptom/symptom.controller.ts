import { Roles } from '@common/decorator/roles.decorator';
import { CreateSymptomDto } from '@common/dto/knowledge/create-symptom.dto';
import { UpdateSymptomDto } from '@common/dto/knowledge/update-symptom.dto';
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
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '@shared/enum/role.enum';
import { SymptomService } from './symptom.service';
import { PageQueryKeywordsDto } from '@common/dto/knowledge/page-query-keywords.dto';

@ApiTags('症状管理')
@Controller('symptom')
@Roles(Role.Admin, Role.Expert)
@UseGuards(AuthGuard, RolesGuard)
export class SymptomController {
  constructor(private readonly symptomService: SymptomService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createSymptomDto: CreateSymptomDto) {
    return this.symptomService.create(createSymptomDto);
  }

  @Get()
  findAll() {
    return this.symptomService.findAll();
  }

  @Get('list')
  findList(@Query() query: PageQueryKeywordsDto) {
    return this.symptomService.findList(query);
  }

  @Get(':id(\\d+)')
  findOne(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
  ) {
    return this.symptomService.findOne(id);
  }

  @Patch(':id(\\d+)')
  update(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
    @Body() updateSymptomDto: UpdateSymptomDto,
  ) {
    return this.symptomService.update(id, updateSymptomDto);
  }

  @Delete(':id(\\d+)')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
  ) {
    return this.symptomService.remove(id);
  }
}
