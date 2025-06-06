import { CreateDiseaseDto } from '@common/dto/knowledge/create-disease.dto';
import { UpdateDiseaseDto } from '@common/dto/knowledge/update-disease.dto';
import { PageQueryDateDto } from '@common/dto/page-query-date.dto';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { KNOWLEDGE_SERVICE_NAME } from 'config/microservice.config';

@Injectable()
export class DiseaseService {
  constructor(
    @Inject(KNOWLEDGE_SERVICE_NAME) private readonly client: ClientProxy,
  ) {}

  create(createDiseaseDto: CreateDiseaseDto) {
    return this.client.send(
      { cmd: 'disease.create' },
      { dto: createDiseaseDto },
    );
  }

  findAll() {
    return this.client.send({ cmd: 'disease.get' }, {});
  }

  findList(query: PageQueryDateDto) {
    return this.client.send({ cmd: 'disease.get.list' }, { query });
  }

  findOne(id: number) {
    return this.client.send({ cmd: 'disease.get.byId' }, { id });
  }

  findSymptoms(id: number) {
    return this.client.send({ cmd: 'disease.get.symptoms' }, { id });
  }

  update(id: number, updateDiseaseDto: UpdateDiseaseDto) {
    return this.client.send(
      { cmd: 'disease.update' },
      { id, dto: updateDiseaseDto },
    );
  }

  remove(id: number) {
    return this.client.send({ cmd: 'disease.delete' }, { id });
  }
}
