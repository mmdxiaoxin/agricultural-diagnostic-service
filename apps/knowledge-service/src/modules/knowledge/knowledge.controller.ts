import { CropDto } from '@common/dto/knowledge/crop.dto';
import { DiseaseDto } from '@common/dto/knowledge/disease.dto';
import { SymptomDto } from '@common/dto/knowledge/symptom.dto';
import { TreatmentDto } from '@common/dto/knowledge/treatment.dto';
import { EnvironmentFactorDto } from '@common/dto/knowledge/environment-factor.dto';
import { DiagnosisRuleDto } from '@common/dto/knowledge/diagnosis-rule.dto';
import { UpdateKnowledgeDto } from '@common/dto/knowledge/update-knowledge.dto';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { KnowledgeService } from './knowledge.service';

@Controller()
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  // 作物相关接口
  @MessagePattern({ cmd: 'crop.create' })
  async createCrop(@Payload() payload: { dto: CropDto }) {
    return this.knowledgeService.createCrop(payload.dto);
  }

  @MessagePattern({ cmd: 'crop.findAll' })
  async findAllCrops() {
    return this.knowledgeService.findAllCrops();
  }

  // 病害相关接口
  @MessagePattern({ cmd: 'disease.create' })
  async createDisease(@Payload() payload: { dto: DiseaseDto }) {
    return this.knowledgeService.createDisease(payload.dto);
  }

  @MessagePattern({ cmd: 'disease.findAll' })
  async findAllDiseases() {
    return this.knowledgeService.findAllDiseases();
  }

  @MessagePattern({ cmd: 'disease.findById' })
  async findDiseaseById(@Payload() payload: { id: number }) {
    return this.knowledgeService.findDiseaseById(payload.id);
  }

  @MessagePattern({ cmd: 'disease.update' })
  async updateDisease(
    @Payload() payload: { id: number; dto: UpdateKnowledgeDto },
  ) {
    return this.knowledgeService.updateDisease(payload.id, payload.dto);
  }

  @MessagePattern({ cmd: 'disease.delete' })
  async removeDisease(@Payload() payload: { id: number }) {
    return this.knowledgeService.removeDisease(payload.id);
  }

  // 症状相关接口
  @MessagePattern({ cmd: 'symptom.create' })
  async createSymptom(@Payload() payload: { dto: SymptomDto }) {
    return this.knowledgeService.createSymptom(payload.dto);
  }

  // 治疗方案相关接口
  @MessagePattern({ cmd: 'treatment.create' })
  async createTreatment(@Payload() payload: { dto: TreatmentDto }) {
    return this.knowledgeService.createTreatment(payload.dto);
  }

  // 环境因素相关接口
  @MessagePattern({ cmd: 'environmentFactor.create' })
  async createEnvironmentFactor(
    @Payload() payload: { dto: EnvironmentFactorDto },
  ) {
    return this.knowledgeService.createEnvironmentFactor(payload.dto);
  }

  // 诊断规则相关接口
  @MessagePattern({ cmd: 'diagnosisRule.create' })
  async createDiagnosisRule(@Payload() payload: { dto: DiagnosisRuleDto }) {
    return this.knowledgeService.createDiagnosisRule(payload.dto);
  }

  // 诊断相关接口
  @MessagePattern({ cmd: 'disease.diagnose' })
  async diagnoseDisease(@Payload() payload: { symptomIds: string[] }) {
    return this.knowledgeService.diagnoseDisease(payload.symptomIds);
  }
}
