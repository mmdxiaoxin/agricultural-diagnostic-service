import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { RemoteService } from './remote.entity';

@Entity('remote_service_interface')
export class RemoteInterface extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string; // 接口名称

  @Column({ type: 'varchar', length: 255 })
  description: string; // 接口描述

  @Column({ type: 'varchar', length: 255 })
  type: string; // 接口类型

  @Column({ type: 'varchar', length: 255 })
  url: string; // 接口访问地址

  @Column({ type: 'json' })
  config: object; // 接口配置

  @ManyToOne(() => RemoteService, (service) => service.interfaces)
  @JoinColumn({ name: 'serviceId' })
  service: RemoteService;

  @Column({ type: 'int' })
  serviceId: number; // 关联的服务ID
}
