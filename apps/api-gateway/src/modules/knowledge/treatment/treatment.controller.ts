import { Roles } from '@common/decorator/roles.decorator';
import { CreateTreatmentDto } from '@common/dto/knowledge/create-treatment.dto';
import { UpdateTreatmentDto } from '@common/dto/knowledge/update-treatment.dto';
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
import { TreatmentService } from './treatment.service';
import { PageQueryKeywordsDto } from '@common/dto/knowledge/page-query-keywords.dto';

@ApiTags('治疗方式管理')
@Controller('treatment')
@Roles(Role.Admin, Role.Expert)
@UseGuards(AuthGuard, RolesGuard)
export class TreatmentController {
  constructor(private readonly treatmentService: TreatmentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createTreatmentDto: CreateTreatmentDto) {
    return this.treatmentService.create(createTreatmentDto);
  }

  @Get()
  findAll() {
    return this.treatmentService.findAll();
  }

  @Get('list')
  findList(@Query() query: PageQueryKeywordsDto) {
    return this.treatmentService.findList(query);
  }

  @Get(':id(\\d+)')
  findOne(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
  ) {
    return this.treatmentService.findOne(id);
  }

  @Patch(':id(\\d+)')
  update(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
    @Body() updateTreatmentDto: UpdateTreatmentDto,
  ) {
    return this.treatmentService.update(id, updateTreatmentDto);
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
    return this.treatmentService.remove(id);
  }
}
