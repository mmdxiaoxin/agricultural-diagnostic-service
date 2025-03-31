import { Roles } from '@common/decorator/roles.decorator';
import { CreateDiseaseDto } from '@common/dto/knowledge/create-disease.dto';
import { UpdateDiseaseDto } from '@common/dto/knowledge/update-disease.dto';
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
import { DiseaseService } from './disease.service';
import { PageQueryDateDto } from '@common/dto/page-query-date.dto';

@ApiTags('疾病管理')
@Controller('disease')
@Roles(Role.Admin, Role.Expert)
@UseGuards(AuthGuard, RolesGuard)
export class DiseaseController {
  constructor(private readonly diseaseService: DiseaseService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createDiseaseDto: CreateDiseaseDto) {
    return this.diseaseService.create(createDiseaseDto);
  }

  @Get()
  findAll() {
    return this.diseaseService.findAll();
  }

  @Get('list')
  findList(@Query() query: PageQueryDateDto) {
    return this.diseaseService.findList(query);
  }

  @Get(':id')
  findOne(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
  ) {
    return this.diseaseService.findOne(id);
  }

  @Get(':id/symptoms')
  findSymptoms(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
  ) {
    return this.diseaseService.findSymptoms(id);
  }

  @Patch(':id')
  update(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
    @Body() updateDiseaseDto: UpdateDiseaseDto,
  ) {
    return this.diseaseService.update(id, updateDiseaseDto);
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
    return this.diseaseService.remove(id);
  }
}
