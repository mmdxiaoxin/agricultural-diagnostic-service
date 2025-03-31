import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Disease } from './disease.entity';

export enum TreatmentType {
  CHEMICAL = 'chemical',
  BIOLOGICAL = 'biological',
  PHYSICAL = 'physical',
  CULTURAL = 'cultural',
}

@Entity()
export class Treatment extends BaseEntity {
  @ManyToOne(() => Disease, (disease) => disease.treatments)
  @JoinColumn({ name: 'diseaseId' })
  disease: Disease;

  @Column({ type: 'int' })
  diseaseId: number;

  @Column({
    type: 'enum',
    enum: TreatmentType,
  })
  type: TreatmentType;

  @Column({ type: 'text' })
  method: string;

  @Column({ type: 'text', nullable: true })
  recommendedProducts: string;
}
