import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TreatmentService } from './treatment.service';
import { CreateTreatmentDto } from './dto/create-treatment.dto';
import { UpdateTreatmentDto } from './dto/update-treatment.dto';

@Controller('treatment')
export class TreatmentController {
  constructor(private readonly treatmentService: TreatmentService) {}

  @Post()
  create(@Body() createTreatmentDto: CreateTreatmentDto) {
    return this.treatmentService.create(createTreatmentDto);
  }

  @Get()
  findAll() {
    return this.treatmentService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.treatmentService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTreatmentDto: UpdateTreatmentDto) {
    return this.treatmentService.update(+id, updateTreatmentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.treatmentService.remove(+id);
  }
}
