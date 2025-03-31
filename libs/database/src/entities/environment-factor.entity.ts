import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Disease } from './disease.entity';

@Entity()
export class EnvironmentFactor extends BaseEntity {
  @ManyToOne(() => Disease, (disease) => disease.environmentFactors, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'diseaseId' })
  disease: Disease;

  @Column({ type: 'int' })
  diseaseId: number;

  @Column()
  factor: string;

  @Column()
  optimalRange: string;
}
