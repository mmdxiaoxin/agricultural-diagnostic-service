import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Disease } from './disease.entity';

@Entity()
export class Crop extends BaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  scientificName: string;

  @Column({ nullable: true })
  growthStage: string;

  @OneToMany(() => Disease, (disease) => disease.crop)
  diseases: Disease[];
}
