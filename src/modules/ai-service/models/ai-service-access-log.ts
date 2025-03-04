import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AiService } from './ai-service.entity';

@Entity('ai_service_access_logs')
export class AiServiceAccessLog {
  @PrimaryGeneratedColumn()
  accessId: number; // 访问记录ID

  @ManyToOne(() => AiService, (aiService) => aiService.aiServiceAccessLogs)
  @JoinColumn({ name: 'serviceId' })
  service: AiService; // 外键，关联AI服务表

  @Column({ name: 'userId' })
  userId: number; // 用户ID（如果需要）

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  accessTime: Date; // 访问时间

  @Column({ type: 'int' })
  responseTime: number; // 响应时间（毫秒）

  @Column({ type: 'int' })
  statusCode: number; // HTTP 状态码
}
