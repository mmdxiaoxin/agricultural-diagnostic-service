import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { RemoteInterface } from './remote-interface.entity';
import { RemoteConfig } from './remote-config.entity';

@Entity('remote_service')
export class RemoteService extends BaseEntity {
  @Column({ type: 'varchar', length: 100, comment: '服务名称' })
  serviceName: string; // 服务名称

  @Column({ type: 'varchar', length: 50, nullable: true, comment: '服务类型' })
  serviceType: string; // 服务类型

  @Column({ type: 'text', nullable: true })
  description: string; // 服务描述

  @Column({
    type: 'enum',
    enum: ['active', 'inactive', 'under_maintenance'],
    default: 'active',
  })
  status: 'active' | 'inactive' | 'under_maintenance'; // 服务状态

  @OneToMany(() => RemoteConfig, (config) => config.service)
  configs: RemoteConfig[];

  @OneToMany(
    () => RemoteInterface,
    (serviceInterface) => serviceInterface.service,
  )
  interfaces: RemoteInterface[];
}
