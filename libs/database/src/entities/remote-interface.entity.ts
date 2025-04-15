import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { RemoteService } from './remote.entity';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
export type ContentType =
  | 'application/json'
  | 'multipart/form-data'
  | 'application/x-www-form-urlencoded';

export interface RemoteInterfaceConfig {
  method?: HttpMethod;
  prefix?: string;
  path?: string;
  headers?: Record<string, string>;
  timeout?: number;
  validateStatus?: (status: number) => boolean;
  contentType?: ContentType;
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer';
  maxContentLength?: number;
  maxBodyLength?: number;
  maxRedirects?: number;
  withCredentials?: boolean;
}

@Entity('remote_service_interface')
export class RemoteInterface extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string; // 接口名称

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string; // 接口描述

  @Column({ type: 'varchar', length: 255 })
  type: string; // 接口类型

  @Column({ type: 'varchar', length: 255 })
  url: string; // 接口访问地址

  @Column({ type: 'json' })
  config: RemoteInterfaceConfig;

  @ManyToOne(() => RemoteService, (service) => service.interfaces)
  @JoinColumn({ name: 'serviceId' })
  service: RemoteService;

  @Column({ type: 'int' })
  serviceId: number; // 关联的服务ID
}
