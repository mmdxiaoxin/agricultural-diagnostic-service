import { Inject, Injectable } from '@nestjs/common';
import { CreateDiagnosisRuleDto } from './dto/create-diagnosis-rule.dto';
import { UpdateDiagnosisRuleDto } from './dto/update-diagnosis-rule.dto';
import { KNOWLEDGE_SERVICE_NAME } from 'config/microservice.config';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class DiagnosisRuleService {
  constructor(
    @Inject(KNOWLEDGE_SERVICE_NAME) private readonly client: ClientProxy,
  ) {}

  create(createDiagnosisRuleDto: CreateDiagnosisRuleDto) {
    return 'This action adds a new diagnosisRule';
  }

  findAll() {
    return `This action returns all diagnosisRule`;
  }

  findOne(id: number) {
    return `This action returns a #${id} diagnosisRule`;
  }

  update(id: number, updateDiagnosisRuleDto: UpdateDiagnosisRuleDto) {
    return `This action updates a #${id} diagnosisRule`;
  }

  remove(id: number) {
    return `This action removes a #${id} diagnosisRule`;
  }
}
