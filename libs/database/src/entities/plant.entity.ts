import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { AIModel } from './ai-model.entity';
import { BaseEntity } from './base.entity';

@Entity('plants')
export class Plant extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string; // 模型名称

  @Column({ type: 'varchar', length: 255 })
  description: string; // 模型描述

  @ManyToMany(() => AIModel, (model) => model.supportPlants)
  supportModels: AIModel[] | null; // 支持的模型
}
