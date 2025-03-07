import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Plant } from '../../plant/models/plant.entity';
import { AiService } from '@/modules/ai-service/models/ai-service.entity';

@Entity('ai_model')
export class AIModel {
  @PrimaryGeneratedColumn('increment')
  id: number; // 主键ID

  @Column({ type: 'varchar', length: 255 })
  name: string; // 模型名称

  @Column({ type: 'varchar', length: 255 })
  version: string; // 模型版本

  @Column({ type: 'varchar', length: 255 })
  description: string; // 模型描述

  @ManyToMany(() => Plant, (plant) => plant.supportModels)
  @JoinTable({
    name: 'models_plants',
    joinColumn: { name: 'modelId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'plantId', referencedColumnName: 'id' },
  })
  supportPlants: Plant[] | null; // 支持的植物

  @ManyToMany(() => AiService, (service) => service.supportModels, {
    nullable: true,
  })
  @JoinTable({
    name: 'models_aiServices',
    joinColumn: { name: 'modelId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'serviceId', referencedColumnName: 'serviceId' },
  })
  supportServices: AiService[] | null; // 支持的服务

  @Column({ type: 'int' })
  createdBy: number; // 创建者

  @Column({ type: 'int' })
  updatedBy: number; // 更新者

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
