import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Disease } from './disease.entity';

@Entity()
export class Symptom extends BaseEntity {
  @ManyToOne(() => Disease, (disease) => disease.id)
  disease: Disease;

  @Column({ type: 'text' })
  description: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ nullable: true })
  stage: string;
}
