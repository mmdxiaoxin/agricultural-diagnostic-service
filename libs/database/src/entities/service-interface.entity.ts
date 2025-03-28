import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { RemoteService } from './service.entity';

@Entity('service_interface')
export class ServiceInterface extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  endpointUrl: string; // 接口访问地址

  @Column({ type: 'json' })
  config: object; // 接口配置

  @ManyToOne(() => RemoteService, (service) => service.interfaces)
  @JoinColumn({ name: 'serviceId' })
  service: RemoteService;

  @Column({ type: 'int' })
  serviceId: number; // 关联的服务ID
}
