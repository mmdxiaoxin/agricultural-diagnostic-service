import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Disease } from './disease.entity';

@Entity()
export class DiagnosisRule extends BaseEntity {
  @ManyToOne(() => Disease, (disease) => disease.diagnosisRules, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'diseaseId' })
  disease: Disease;

  @Column({ type: 'int' })
  diseaseId: number;

  @Column({ type: 'text', comment: '症状ID列表' })
  symptomIds: string;

  @Column({ type: 'float', comment: '概率' })
  probability: number;

  @Column({ type: 'text', comment: '推荐措施' })
  recommendedAction: string;
}
