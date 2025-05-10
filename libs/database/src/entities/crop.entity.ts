import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Disease } from './disease.entity';

@Entity()
export class Crop extends BaseEntity {
  @Column({ unique: true, comment: '作物名称', length: 50 })
  name: string;

  @Column({ nullable: true, comment: '学名', length: 100 })
  scientificName: string;

  @Column({ nullable: true, comment: '生长阶段', length: 50 })
  growthStage: string;

  @Column({ nullable: true, comment: '作物类型', length: 50 })
  cropType: string;

  @Column({ nullable: true, comment: '作物图片', length: 255 })
  imageUrl: string;

  @Column({ nullable: true, comment: '作物别名', length: 100 })
  alias: string;

  @Column({ nullable: true, comment: '作物描述', length: 1000 })
  description: string;

  @Column({ nullable: true, comment: '产地', length: 100 })
  origin: string;

  @Column({ nullable: true, comment: '作物生长习性', length: 500 })
  growthHabits: string;

  @Column({ nullable: true, comment: '作物生长周期', length: 100 })
  growthCycle: string;

  @Column({ nullable: true, comment: '适宜种植区域', length: 200 })
  suitableArea: string;

  @Column({ nullable: true, comment: '适宜种植季节', length: 100 })
  suitableSeason: string;

  @Column({ nullable: true, comment: '适宜种植土壤', length: 200 })
  suitableSoil: string;

  @OneToMany(() => Disease, (disease) => disease.crop, { cascade: true })
  diseases: Disease[];
}
