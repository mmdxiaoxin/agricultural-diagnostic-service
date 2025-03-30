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
import { CreateEnvironmentFactorDto } from './dto/create-environment-factor.dto';
import { UpdateEnvironmentFactorDto } from './dto/update-environment-factor.dto';
import { EnvironmentFactorService } from './environment-factor.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('环境因素管理')
@Controller('environment-factor')
@Roles(Role.Admin, Role.Expert)
@UseGuards(AuthGuard, RolesGuard)
export class EnvironmentFactorController {
  constructor(
    private readonly environmentFactorService: EnvironmentFactorService,
  ) {}

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
  update(
    @Param('id') id: string,
    @Body() updateEnvironmentFactorDto: UpdateEnvironmentFactorDto,
  ) {
    return this.environmentFactorService.update(
      +id,
      updateEnvironmentFactorDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.environmentFactorService.remove(+id);
  }
}
