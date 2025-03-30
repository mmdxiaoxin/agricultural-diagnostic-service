import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { EnvironmentFactorService } from './environment-factor.service';
import { CreateEnvironmentFactorDto } from './dto/create-environment-factor.dto';
import { UpdateEnvironmentFactorDto } from './dto/update-environment-factor.dto';

@Controller('environment-factor')
export class EnvironmentFactorController {
  constructor(private readonly environmentFactorService: EnvironmentFactorService) {}

  @Post()
  create(@Body() createEnvironmentFactorDto: CreateEnvironmentFactorDto) {
    return this.environmentFactorService.create(createEnvironmentFactorDto);
  }

  @Get()
  findAll() {
    return this.environmentFactorService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.environmentFactorService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEnvironmentFactorDto: UpdateEnvironmentFactorDto) {
    return this.environmentFactorService.update(+id, updateEnvironmentFactorDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.environmentFactorService.remove(+id);
  }
}
