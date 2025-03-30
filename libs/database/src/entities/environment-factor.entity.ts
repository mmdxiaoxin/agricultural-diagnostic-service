import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Disease } from './disease.entity';

@Entity()
export class EnvironmentFactor extends BaseEntity {
  @ManyToOne(() => Disease, (disease) => disease.id)
  disease: Disease;

  @Column()
  factor: string;

  @Column()
  optimalRange: string;
}
