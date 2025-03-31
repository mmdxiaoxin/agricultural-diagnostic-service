import { CreateDiagnosisRuleDto } from '@common/dto/knowledge/create-diagnosisRule.dto';
import { PageKeywordsDto } from '@common/dto/knowledge/page-keywords.dto';
import { UpdateDiagnosisRuleDto } from '@common/dto/knowledge/update-diagnosisRule.dto';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { KNOWLEDGE_SERVICE_NAME } from 'config/microservice.config';

@Injectable()
export class DiagnosisRuleService {
  constructor(
    @Inject(KNOWLEDGE_SERVICE_NAME) private readonly client: ClientProxy,
  ) {}

  create(createDiagnosisRuleDto: CreateDiagnosisRuleDto) {
    return this.client.send(
      { cmd: 'diagnosisRule.create' },
      { dto: createDiagnosisRuleDto },
    );
  }

  findAll() {
    return this.client.send({ cmd: 'diagnosisRule.get' }, {});
  }

  findList(query: PageKeywordsDto) {
    return this.client.send({ cmd: 'diagnosisRule.get.list' }, { query });
  }

  findOne(id: number) {
    return this.client.send({ cmd: 'diagnosisRule.get.byId' }, { id });
  }

  update(id: number, updateDiagnosisRuleDto: UpdateDiagnosisRuleDto) {
    return this.client.send(
      { cmd: 'diagnosisRule.update' },
      { id, dto: updateDiagnosisRuleDto },
    );
  }

  remove(id: number) {
    return this.client.send({ cmd: 'diagnosisRule.delete' }, { id });
  }
}
