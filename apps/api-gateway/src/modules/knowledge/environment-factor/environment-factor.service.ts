import { CreateEnvironmentFactorDto } from '@common/dto/knowledge/create-environmentFactor.dto';
import { PageQueryKeywordsDto } from '@common/dto/knowledge/page-query-keywords.dto';
import { UpdateEnvironmentFactorDto } from '@common/dto/knowledge/update-environmentFactor.dto';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { KNOWLEDGE_SERVICE_NAME } from 'config/microservice.config';

@Injectable()
export class EnvironmentFactorService {
  constructor(
    @Inject(KNOWLEDGE_SERVICE_NAME) private readonly client: ClientProxy,
  ) {}

  create(createEnvironmentFactorDto: CreateEnvironmentFactorDto) {
    return this.client.send(
      { cmd: 'environmentFactor.create' },
      { dto: createEnvironmentFactorDto },
    );
  }

  findAll() {
    return this.client.send({ cmd: 'environmentFactor.get' }, {});
  }

  findList(query: PageQueryKeywordsDto) {
    return this.client.send({ cmd: 'environmentFactor.get.list' }, { query });
  }

  findOne(id: number) {
    return this.client.send({ cmd: 'environmentFactor.get.byId' }, { id });
  }

  update(id: number, updateEnvironmentFactorDto: UpdateEnvironmentFactorDto) {
    return this.client.send(
      { cmd: 'environmentFactor.update' },
      { id, dto: updateEnvironmentFactorDto },
    );
  }

  remove(id: number) {
    return this.client.send({ cmd: 'environmentFactor.delete' }, { id });
  }
}
