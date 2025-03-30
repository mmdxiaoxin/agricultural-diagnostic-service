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
import { CreateTreatmentDto } from './dto/create-treatment.dto';
import { UpdateTreatmentDto } from './dto/update-treatment.dto';
import { TreatmentService } from './treatment.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('治疗方式管理')
@Controller('treatment')
@Roles(Role.Admin, Role.Expert)
@UseGuards(AuthGuard, RolesGuard)
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
  update(
    @Param('id') id: string,
    @Body() updateTreatmentDto: UpdateTreatmentDto,
  ) {
    return this.treatmentService.update(+id, updateTreatmentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.treatmentService.remove(+id);
  }
}
