import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AiService } from './ai-service.entity';

@Entity('ai_service_logs')
export class AiServiceLog {
  @PrimaryGeneratedColumn()
  logId: number; // 日志ID

  @ManyToOne(() => AiService, (aiService) => aiService.aiServiceLogs)
  @JoinColumn({ name: 'serviceId' })
  service: AiService; // 外键，关联AI服务表

  @Column({
    type: 'enum',
    enum: ['info', 'error', 'warning'],
    default: 'info',
  })
  logType: 'info' | 'error' | 'warning'; // 日志类型

  @Column({ type: 'text' })
  message: string; // 日志信息

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date; // 日志生成时间
}
