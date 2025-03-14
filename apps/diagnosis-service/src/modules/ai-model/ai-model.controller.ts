import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AiModelService } from './ai-model.service';
import { CreateAiModelDto } from './dto/create-ai-model.dto';
import { UpdateAiModelDto } from './dto/update-ai-model.dto';

@ApiTags('病害诊断模型管理模块')
@Controller('ai-model')
export class AiModelController {
  constructor(private readonly aiModelService: AiModelService) {}

  @Post()
  create(@Body() createAiModelDto: CreateAiModelDto) {
    return this.aiModelService.create(createAiModelDto);
  }

  @Get()
  findAll() {
    return this.aiModelService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.aiModelService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAiModelDto: UpdateAiModelDto) {
    return this.aiModelService.update(+id, updateAiModelDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.aiModelService.remove(+id);
  }
}
