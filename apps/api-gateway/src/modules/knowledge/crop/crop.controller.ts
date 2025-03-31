import { Roles } from '@common/decorator/roles.decorator';
import { CreateCropDto } from '@common/dto/knowledge/create-crop.dto';
import { UpdateCropDto } from '@common/dto/knowledge/update-crop.dto';
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
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '@shared/enum/role.enum';
import { CropService } from './crop.service';
import { PageQueryDto } from '@common/dto/page-query.dto';
import { PageKeywordsDto } from '@common/dto/knowledge/page-keywords.dto';

@ApiTags('作物管理')
@Controller('crop')
@Roles(Role.Admin, Role.Expert)
@UseGuards(AuthGuard, RolesGuard)
export class CropController {
  constructor(private readonly cropService: CropService) {}

  @Post()
  create(@Body() createCropDto: CreateCropDto) {
    return this.cropService.create(createCropDto);
  }

  @Get()
  findAll() {
    return this.cropService.findAll();
  }

  @Get('list')
  findList(@Query() query: PageKeywordsDto) {
    return this.cropService.findList(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cropService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCropDto: UpdateCropDto) {
    return this.cropService.update(+id, updateCropDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cropService.remove(+id);
  }
}
