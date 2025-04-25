import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Disease } from './disease.entity';
import { DiagnosisRuleConfig } from '@common/types/knowledge/rule';

@Entity()
export class DiagnosisRule extends BaseEntity {
  @ManyToOne(() => Disease, (disease) => disease.diagnosisRules, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'diseaseId' })
  disease: Disease;

  @Column({ type: 'int' })
  diseaseId: number;

  @Column({ type: 'json', comment: '诊断规则配置' })
  config: DiagnosisRuleConfig;

  @Column({ type: 'int', default: 1, comment: '规则权重' })
  weight: number;
}
