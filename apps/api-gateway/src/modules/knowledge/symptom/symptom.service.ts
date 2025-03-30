import { Inject, Injectable } from '@nestjs/common';
import { CreateSymptomDto } from './dto/create-symptom.dto';
import { UpdateSymptomDto } from './dto/update-symptom.dto';
import { KNOWLEDGE_SERVICE_NAME } from 'config/microservice.config';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class SymptomService {
  constructor(
    @Inject(KNOWLEDGE_SERVICE_NAME) private readonly client: ClientProxy,
  ) {}

  create(createSymptomDto: CreateSymptomDto) {
    return 'This action adds a new symptom';
  }

  findAll() {
    return `This action returns all symptom`;
  }

  findOne(id: number) {
    return `This action returns a #${id} symptom`;
  }

  update(id: number, updateSymptomDto: UpdateSymptomDto) {
    return `This action updates a #${id} symptom`;
  }

  remove(id: number) {
    return `This action removes a #${id} symptom`;
  }
}
