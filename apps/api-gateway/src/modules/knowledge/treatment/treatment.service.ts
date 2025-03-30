import { Injectable } from '@nestjs/common';
import { CreateTreatmentDto } from './dto/create-treatment.dto';
import { UpdateTreatmentDto } from './dto/update-treatment.dto';

@Injectable()
export class TreatmentService {
  create(createTreatmentDto: CreateTreatmentDto) {
    return 'This action adds a new treatment';
  }

  findAll() {
    return `This action returns all treatment`;
  }

  findOne(id: number) {
    return `This action returns a #${id} treatment`;
  }

  update(id: number, updateTreatmentDto: UpdateTreatmentDto) {
    return `This action updates a #${id} treatment`;
  }

  remove(id: number) {
    return `This action removes a #${id} treatment`;
  }
}
