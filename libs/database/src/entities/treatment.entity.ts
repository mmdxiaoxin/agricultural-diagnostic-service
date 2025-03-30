import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Disease } from './disease.entity';

@Entity()
export class Treatment extends BaseEntity {
  @ManyToOne(() => Disease, (disease) => disease.id)
  disease: Disease;

  @Column({
    type: 'enum',
    enum: ['chemical', 'biological', 'physical', 'cultural'],
  })
  type: string;

  @Column({ type: 'text' })
  method: string;

  @Column({ type: 'text', nullable: true })
  recommendedProducts: string;
}
