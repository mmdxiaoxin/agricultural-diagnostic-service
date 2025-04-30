import { Roles } from '@common/decorator/roles.decorator';
import { CreateDiseaseDto } from '@common/dto/knowledge/create-disease.dto';
import { UpdateDiseaseDto } from '@common/dto/knowledge/update-disease.dto';
import { PageQueryDateDto } from '@common/dto/page-query-date.dto';
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

@ApiTags('疾病管理')
@Controller('disease')
@UseGuards(AuthGuard, RolesGuard)
export class DiseaseController {
  constructor(private readonly diseaseService: DiseaseService) {}

  @Post()
  @Roles(Role.Admin, Role.Expert)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createDiseaseDto: CreateDiseaseDto) {
    return this.diseaseService.create(createDiseaseDto);
  }

  @Get()
  @Roles(Role.Admin, Role.Expert, Role.User)
  findAll() {
    return this.diseaseService.findAll();
  }

  @Get('list')
  @Roles(Role.Admin, Role.Expert, Role.User)
  findList(@Query() query: PageQueryDateDto) {
    return this.diseaseService.findList(query);
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Expert, Role.User)
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
  @Roles(Role.Admin, Role.Expert, Role.User)
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
  @Roles(Role.Admin, Role.Expert)
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
  @Roles(Role.Admin, Role.Expert)
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
