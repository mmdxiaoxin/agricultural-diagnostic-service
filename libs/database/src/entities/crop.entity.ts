import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity()
export class Crop extends BaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  scientificName: string;

  @Column({ nullable: true })
  growthStage: string;
}
