import { Roles } from '@common/decorator/roles.decorator';
import { CreateEnvironmentFactorDto } from '@common/dto/knowledge/create-environmentFactor.dto';
import { UpdateEnvironmentFactorDto } from '@common/dto/knowledge/update-environmentFactor.dto';
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
import { EnvironmentFactorService } from './environment-factor.service';
import { PageQueryKeywordsDto } from '@common/dto/knowledge/page-query-keywords.dto';

@ApiTags('环境因素管理')
@Controller('environment-factor')
@Roles(Role.Admin, Role.Expert)
@UseGuards(AuthGuard, RolesGuard)
export class EnvironmentFactorController {
  constructor(
    private readonly environmentFactorService: EnvironmentFactorService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createEnvironmentFactorDto: CreateEnvironmentFactorDto) {
    return this.environmentFactorService.create(createEnvironmentFactorDto);
  }

  @Get()
  findAll() {
    return this.environmentFactorService.findAll();
  }

  @Get('list')
  findList(@Query() query: PageQueryKeywordsDto) {
    return this.environmentFactorService.findList(query);
  }

  @Get(':id')
  findOne(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
  ) {
    return this.environmentFactorService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
    @Body() updateEnvironmentFactorDto: UpdateEnvironmentFactorDto,
  ) {
    return this.environmentFactorService.update(id, updateEnvironmentFactorDto);
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
    return this.environmentFactorService.remove(id);
  }
}
