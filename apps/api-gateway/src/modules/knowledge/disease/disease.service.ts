import { Inject, Injectable } from '@nestjs/common';
import { CreateDiseaseDto } from './dto/create-disease.dto';
import { UpdateDiseaseDto } from './dto/update-disease.dto';
import { KNOWLEDGE_SERVICE_NAME } from 'config/microservice.config';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class DiseaseService {
  constructor(
    @Inject(KNOWLEDGE_SERVICE_NAME) private readonly client: ClientProxy,
  ) {}

  create(createDiseaseDto: CreateDiseaseDto) {
    return 'This action adds a new disease';
  }

  findAll() {
    return `This action returns all disease`;
  }

  findOne(id: number) {
    return `This action returns a #${id} disease`;
  }

  update(id: number, updateDiseaseDto: UpdateDiseaseDto) {
    return `This action updates a #${id} disease`;
  }

  remove(id: number) {
    return `This action removes a #${id} disease`;
  }
}
