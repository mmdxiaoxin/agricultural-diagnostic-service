import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { AIModel } from '../../ai-model/models/ai-model.entity';

@Entity('plants')
export class Plant {
  @PrimaryGeneratedColumn('increment')
  id: number; // 主键ID

  @Column({ type: 'varchar', length: 255 })
  name: string; // 模型名称

  @Column({ type: 'varchar', length: 255 })
  description: string; // 模型描述

  @ManyToMany(() => AIModel, (model) => model.supportPlants)
  supportModels: AIModel[] | null; // 支持的模型

  @Column({
    type: 'datetime',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date; // 创建时间

  @Column({
    type: 'datetime',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date; // 更新时间
}
