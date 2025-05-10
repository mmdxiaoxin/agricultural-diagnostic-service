import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { RemoteService } from './remote.entity';

/**
 * 轮询条件操作符
 */
export enum PollingOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'notEquals',
  CONTAINS = 'contains',
  GREATER_THAN = 'greaterThan',
  LESS_THAN = 'lessThan',
  EXISTS = 'exists',
  NOT_EXISTS = 'notExists',
}

/**
 * 轮询条件配置
 */
export interface PollingCondition {
  field: string;
  operator: PollingOperator;
  value?: any;
}

/**
 * 请求配置
 */
export interface RequestConfig {
  id: number;
  order: number;
  type: 'single' | 'polling';
  interval?: number;
  maxAttempts?: number;
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
  delay?: number;
  next?: number[];
  params?: Record<string, any>;
  pollingCondition?: PollingCondition;
}

@Entity('remote_service_config')
export class RemoteConfig extends BaseEntity {
  @Column({ type: 'varchar', length: 100, comment: '配置名称' })
  name: string; // 配置名称

  @Column({ type: 'text', nullable: true })
  description: string; // 配置描述

  @Column({ type: 'json' })
  config: {
    requests: Array<RequestConfig>;
  };

  @Column({
    type: 'enum',
    enum: ['active', 'inactive'],
    default: 'active',
  })
  status: 'active' | 'inactive'; // 配置状态

  @ManyToOne(() => RemoteService, (service) => service.configs)
  @JoinColumn({ name: 'serviceId' })
  service: RemoteService;

  @Column({ type: 'int' })
  serviceId: number; // 关联的服务ID
}
