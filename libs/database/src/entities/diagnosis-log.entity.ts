import {
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DiagnosisHistory } from './diagnosis-history.entity';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

@Entity()
@Index(['diagnosisId', 'createdAt'])
export class DiagnosisLog {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => DiagnosisHistory)
  diagnosis: DiagnosisHistory;

  @Column()
  diagnosisId: number;

  @Column({
    type: 'enum',
    enum: LogLevel,
    default: LogLevel.INFO,
  })
  level: LogLevel;

  @Column()
  message: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
