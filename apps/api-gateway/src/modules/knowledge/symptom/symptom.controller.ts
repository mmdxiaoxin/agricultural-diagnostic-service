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
import { CreateSymptomDto } from './dto/create-symptom.dto';
import { UpdateSymptomDto } from './dto/update-symptom.dto';
import { SymptomService } from './symptom.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('症状管理')
@Controller('symptom')
@Roles(Role.Admin, Role.Expert)
@UseGuards(AuthGuard, RolesGuard)
export class SymptomController {
  constructor(private readonly symptomService: SymptomService) {}

  @Post()
  create(@Body() createSymptomDto: CreateSymptomDto) {
    return this.symptomService.create(createSymptomDto);
  }

  @Get()
  findAll() {
    return this.symptomService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.symptomService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSymptomDto: UpdateSymptomDto) {
    return this.symptomService.update(+id, updateSymptomDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.symptomService.remove(+id);
  }
}
