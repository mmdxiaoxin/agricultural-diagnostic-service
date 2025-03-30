import { CreateSymptomDto } from '@common/dto/knowledge/create-symptom.dto';
import { UpdateSymptomDto } from '@common/dto/knowledge/update-symptom.dto';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { KNOWLEDGE_SERVICE_NAME } from 'config/microservice.config';

@Injectable()
export class SymptomService {
  constructor(
    @Inject(KNOWLEDGE_SERVICE_NAME) private readonly client: ClientProxy,
  ) {}

  create(createSymptomDto: CreateSymptomDto) {
    return this.client.send(
      { cmd: 'symptom.create' },
      { dto: createSymptomDto },
    );
  }

  findAll() {
    return this.client.send({ cmd: 'symptom.get' }, {});
  }

  findOne(id: number) {
    return this.client.send({ cmd: 'symptom.get.byId' }, { id });
  }

  update(id: number, updateSymptomDto: UpdateSymptomDto) {
    return this.client.send(
      { cmd: 'symptom.update' },
      { id, dto: updateSymptomDto },
    );
  }

  remove(id: number) {
    return this.client.send({ cmd: 'symptom.delete' }, { id });
  }
}
