import { Roles } from '@common/decorator/roles.decorator';
import { CreateCropDto } from '@common/dto/knowledge/create-crop.dto';
import { PageQueryKeywordsDto } from '@common/dto/knowledge/page-query-keywords.dto';
import { UpdateCropDto } from '@common/dto/knowledge/update-crop.dto';
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
import { CropService } from './crop.service';

@ApiTags('作物管理')
@Controller('crop')
@Roles(Role.Admin, Role.Expert)
@UseGuards(AuthGuard, RolesGuard)
export class CropController {
  constructor(private readonly cropService: CropService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createCropDto: CreateCropDto) {
    return this.cropService.create(createCropDto);
  }

  @Get()
  findAll() {
    return this.cropService.findAll();
  }

  @Get('list')
  findList(@Query() query: PageQueryKeywordsDto) {
    return this.cropService.findList(query);
  }

  @Get(':id(\\d+)')
  findOne(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
  ) {
    return this.cropService.findOne(id);
  }

  @Patch(':id(\\d+)')
  update(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
    @Body() updateCropDto: UpdateCropDto,
  ) {
    return this.cropService.update(id, updateCropDto);
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
    return this.cropService.remove(id);
  }
}
