import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AiService } from './ai-service.entity';

@Entity('ai_service_configs')
export class AiServiceConfig {
  @PrimaryGeneratedColumn()
  configId: number; // 配置ID

  @ManyToOne(() => AiService, (aiService) => aiService.aiServiceConfigs)
  @JoinColumn({ name: 'serviceId' })
  service: AiService; // 外键，关联AI服务表

  @Column({ type: 'varchar', length: 255 })
  configKey: string; // 配置项键名

  @Column({ type: 'text' })
  configValue: string; // 配置项值

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date; // 创建时间

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date; // 更新时间
}
