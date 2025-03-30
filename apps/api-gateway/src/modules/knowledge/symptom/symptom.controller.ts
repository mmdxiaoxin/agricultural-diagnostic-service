import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SymptomService } from './symptom.service';
import { CreateSymptomDto } from './dto/create-symptom.dto';
import { UpdateSymptomDto } from './dto/update-symptom.dto';

@Controller('symptom')
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
