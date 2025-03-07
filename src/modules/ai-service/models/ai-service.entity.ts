import {
  Column,
  Entity,
  Index,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AiServiceAccessLog } from './ai-service-access-log.entity';
import { AiServiceConfig } from './ai-service-config.entity';
import { AiServiceLog } from './ai-service-log.entity';
import { AIModel } from '@/modules/ai-model/models/ai-model.entity';

@Entity('ai_services')
@Index('serviceNameIdx', ['serviceName'], { unique: true }) // 为 serviceName 添加索引（可选）
export class AiService {
  @PrimaryGeneratedColumn()
  serviceId: number; // 服务ID

  @Column({ type: 'varchar', length: 255 })
  serviceName: string; // 服务名称

  @Column({ type: 'varchar', length: 100, nullable: true })
  serviceType: string; // 服务类型

  @Column({ type: 'text', nullable: true })
  description: string; // 服务描述

  @Column({
    type: 'enum',
    enum: ['active', 'inactive', 'under_maintenance'],
    default: 'active',
  })
  status: 'active' | 'inactive' | 'under_maintenance'; // 服务状态

  @Column({ type: 'varchar', length: 255, nullable: true })
  endpointUrl: string; // 服务的访问URL

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date; // 创建时间

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date; // 更新时间

  @ManyToMany(() => AIModel, (model) => model.supportServices, {
    nullable: true,
  })
  supportModels: AIModel[] | null; // 支持的模型

  @OneToMany(() => AiServiceLog, (aiServiceLog) => aiServiceLog.service)
  aiServiceLogs: AiServiceLog[]; // 一对多关系

  @OneToMany(
    () => AiServiceConfig,
    (aiServiceConfig) => aiServiceConfig.service,
  )
  aiServiceConfigs: AiServiceConfig[]; // 一对多关系

  @OneToMany(
    () => AiServiceAccessLog,
    (aiServiceAccessLog) => aiServiceAccessLog.service,
  )
  aiServiceAccessLogs: AiServiceAccessLog[]; // 一对多关系
}
