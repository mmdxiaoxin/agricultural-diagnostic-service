import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { RemoteService } from './remote.entity';

@Entity('remote_service_config')
export class RemoteConfig extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string; // 配置名称

  @Column({ type: 'text', nullable: true })
  description: string; // 配置描述

  @Column({ type: 'json' })
  config: {
    endpointUrl: string;
    interfaceConfigs: Array<{
      interfaceId: number;
      order: number;
      callType: 'single' | 'polling';
      interval?: number;
      maxAttempts?: number;
      timeout?: number;
      retryCount?: number;
      retryDelay?: number;
    }>;
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
