import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Disease } from './disease.entity';

@Entity()
export class Symptom extends BaseEntity {
  @ManyToOne(() => Disease, (disease) => disease.symptoms, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'diseaseId' })
  disease: Disease;

  @Column({ type: 'int' })
  diseaseId: number;

  @Column({ type: 'text', comment: '症状描述' })
  description: string;

  @Column({ nullable: true, comment: '症状图片' })
  imageUrl: string;

  @Column({ nullable: true, comment: '症状阶段' })
  stage: string;
}
