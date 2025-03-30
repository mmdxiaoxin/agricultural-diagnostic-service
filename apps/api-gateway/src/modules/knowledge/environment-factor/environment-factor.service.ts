import { Injectable } from '@nestjs/common';
import { CreateEnvironmentFactorDto } from './dto/create-environment-factor.dto';
import { UpdateEnvironmentFactorDto } from './dto/update-environment-factor.dto';

@Injectable()
export class EnvironmentFactorService {
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
