import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
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

  @ManyToOne(() => DiagnosisHistory, (diagnosis) => diagnosis.logs, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'diagnosisId' })
  diagnosis: DiagnosisHistory;

  @Column({ nullable: true })
  diagnosisId: number;

  @Column({
    type: 'enum',
    enum: LogLevel,
    default: LogLevel.INFO,
  })
  level: LogLevel;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
