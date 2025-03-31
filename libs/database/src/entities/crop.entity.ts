import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Disease } from './disease.entity';

@Entity()
export class Crop extends BaseEntity {
  @Column({ unique: true, comment: '作物名称' })
  name: string;

  @Column({ nullable: true, comment: '学名' })
  scientificName: string;

  @Column({ nullable: true, comment: '生长阶段' })
  growthStage: string;

  @Column({ nullable: true, comment: '作物类型' })
  cropType: string;

  @Column({ nullable: true, comment: '作物图片' })
  imageUrl: string;

  @Column({ nullable: true, comment: '作物别名' })
  alias: string;

  @Column({ nullable: true, comment: '作物描述' })
  description: string;

  @Column({ nullable: true, comment: '产地' })
  origin: string;

  @Column({ nullable: true, comment: '作物生长习性' })
  growthHabits: string;

  @Column({ nullable: true, comment: '作物生长周期' })
  growthCycle: string;

  @Column({ nullable: true, comment: '适宜种植区域' })
  suitableArea: string;

  @Column({ nullable: true, comment: '适宜种植季节' })
  suitableSeason: string;

  @Column({ nullable: true, comment: '适宜种植土壤' })
  suitableSoil: string;

  @OneToMany(() => Disease, (disease) => disease.crop, { cascade: true })
  diseases: Disease[];
}
