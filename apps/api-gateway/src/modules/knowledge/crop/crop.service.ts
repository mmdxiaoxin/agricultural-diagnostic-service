import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { KNOWLEDGE_SERVICE_NAME } from 'config/microservice.config';
import { CreateCropDto } from './dto/create-crop.dto';
import { UpdateCropDto } from './dto/update-crop.dto';

@Injectable()
export class CropService {
  constructor(
    @Inject(KNOWLEDGE_SERVICE_NAME) private readonly client: ClientProxy,
  ) {}

  create(createCropDto: CreateCropDto) {
    return 'This action adds a new crop';
  }

  findAll() {
    return `This action returns all crop`;
  }

  findOne(id: number) {
    return `This action returns a #${id} crop`;
  }

  update(id: number, updateCropDto: UpdateCropDto) {
    return `This action updates a #${id} crop`;
  }

  remove(id: number) {
    return `This action removes a #${id} crop`;
  }
}
