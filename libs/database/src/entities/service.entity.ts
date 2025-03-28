import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { ServiceInterface } from './service-interface.entity';

@Entity('service')
export class RemoteService extends BaseEntity {
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

  @Column({ type: 'json' })
  config: object;

  @OneToMany(
    () => ServiceInterface,
    (serviceInterface) => serviceInterface.service,
  )
  interfaces: ServiceInterface[];
}
