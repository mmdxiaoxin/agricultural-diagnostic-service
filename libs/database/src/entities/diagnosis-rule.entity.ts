import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Disease } from './disease.entity';

@Entity()
export class DiagnosisRule extends BaseEntity {
  @ManyToOne(() => Disease, (disease) => disease.id)
  disease: Disease;

  @Column({ type: 'text' })
  symptomIds: string;

  @Column('float')
  probability: number;

  @Column({ type: 'text' })
  recommendedAction: string;
}
