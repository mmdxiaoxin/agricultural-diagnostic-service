import { Roles } from '@common/decorator/roles.decorator';
import { AuthGuard } from '@common/guards/auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@shared/enum/role.enum';
import { DiseaseService } from './disease.service';
import { CreateDiseaseDto } from './dto/create-disease.dto';
import { UpdateDiseaseDto } from './dto/update-disease.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('疾病管理')
@Controller('disease')
@Roles(Role.Admin, Role.Expert)
@UseGuards(AuthGuard, RolesGuard)
export class DiseaseController {
  constructor(private readonly diseaseService: DiseaseService) {}

  @Post()
  create(@Body() createDiseaseDto: CreateDiseaseDto) {
    return this.diseaseService.create(createDiseaseDto);
  }

  @Get()
  findAll() {
    return this.diseaseService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.diseaseService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDiseaseDto: UpdateDiseaseDto) {
    return this.diseaseService.update(+id, updateDiseaseDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.diseaseService.remove(+id);
  }
}
