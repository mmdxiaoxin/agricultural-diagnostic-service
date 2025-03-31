import { CreateTreatmentDto } from '@common/dto/knowledge/create-treatment.dto';
import { PageKeywordsDto } from '@common/dto/knowledge/page-keywords.dto';
import { UpdateTreatmentDto } from '@common/dto/knowledge/update-treatment.dto';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { KNOWLEDGE_SERVICE_NAME } from 'config/microservice.config';

@Injectable()
export class TreatmentService {
  constructor(
    @Inject(KNOWLEDGE_SERVICE_NAME) private readonly client: ClientProxy,
  ) {}

  create(createTreatmentDto: CreateTreatmentDto) {
    return this.client.send(
      { cmd: 'treatment.create' },
      { dto: createTreatmentDto },
    );
  }

  findAll() {
    return this.client.send({ cmd: 'treatment.get' }, {});
  }

  findList(query: PageKeywordsDto) {
    return this.client.send({ cmd: 'treatment.get.list' }, { query });
  }

  findOne(id: number) {
    return this.client.send({ cmd: 'treatment.get.byId' }, { id });
  }

  update(id: number, updateTreatmentDto: UpdateTreatmentDto) {
    return this.client.send(
      { cmd: 'treatment.update' },
      { id, dto: updateTreatmentDto },
    );
  }

  remove(id: number) {
    return this.client.send({ cmd: 'treatment.delete' }, { id });
  }
}
