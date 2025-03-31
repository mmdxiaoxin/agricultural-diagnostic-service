import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Disease } from './disease.entity';

@Entity()
export class DiagnosisRule extends BaseEntity {
  @ManyToOne(() => Disease, (disease) => disease.diagnosisRules)
  @JoinColumn({ name: 'diseaseId' })
  disease: Disease;

  @Column({ type: 'int' })
  diseaseId: number;

  @Column({ type: 'text' })
  symptomIds: string;

  @Column('float')
  probability: number;

  @Column({ type: 'text' })
  recommendedAction: string;
}
