import { Inject, Injectable } from '@nestjs/common';
import { CreateEnvironmentFactorDto } from './dto/create-environment-factor.dto';
import { UpdateEnvironmentFactorDto } from './dto/update-environment-factor.dto';
import { KNOWLEDGE_SERVICE_NAME } from 'config/microservice.config';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class EnvironmentFactorService {
  constructor(
    @Inject(KNOWLEDGE_SERVICE_NAME) private readonly client: ClientProxy,
  ) {}

  create(createEnvironmentFactorDto: CreateEnvironmentFactorDto) {
    return 'This action adds a new environmentFactor';
  }

  findAll() {
    return `This action returns all environmentFactor`;
  }

  findOne(id: number) {
    return `This action returns a #${id} environmentFactor`;
  }

  update(id: number, updateEnvironmentFactorDto: UpdateEnvironmentFactorDto) {
    return `This action updates a #${id} environmentFactor`;
  }

  remove(id: number) {
    return `This action removes a #${id} environmentFactor`;
  }
}
