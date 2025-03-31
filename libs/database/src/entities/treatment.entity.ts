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
  @ManyToOne(() => Disease, (disease) => disease.treatments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'diseaseId' })
  disease: Disease;

  @Column({ type: 'int' })
  diseaseId: number;

  @Column({
    type: 'enum',
    enum: TreatmentType,
    comment: '防治措施类型',
  })
  type: TreatmentType;

  @Column({ type: 'text', comment: '防治措施' })
  method: string;

  @Column({ type: 'text', nullable: true, comment: '推荐产品' })
  recommendedProducts: string;

  @Column({ type: 'text', nullable: true, comment: '注意事项' })
  precautions: string;
}
