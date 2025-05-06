import { ApiProperty } from '@nestjs/swagger';
import { RemoveServiceConfigDto } from './remote-config.dto';
import { RemoteInterfaceDto } from './remote-interface.dto';

// 远程服务
export class RemoteServiceDto {
  @ApiProperty({
    description: '服务ID',
    example: 5,
  })
  id: number;

  @ApiProperty({
    description: '创建时间',
    example: '2025-03-28T14:50:34.196Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '更新时间',
    example: '2025-03-30T10:37:19.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: '服务名称',
    example: '病害智能诊断服务',
  })
  serviceName: string;

  @ApiProperty({
    description: '服务类型',
    example: 'ai_service',
    enum: ['ai_service'],
  })
  serviceType: string;

  @ApiProperty({
    description: '服务描述',
    example: 'yolo服务',
  })
  description: string;

  @ApiProperty({
    description: '服务状态',
    example: 'active',
    enum: ['active', 'inactive'],
  })
  status: string;

  @ApiProperty({
    description: '服务配置列表',
    type: [RemoveServiceConfigDto],
  })
  configs: RemoveServiceConfigDto[];

  @ApiProperty({
    description: '服务接口列表',
    type: [RemoteInterfaceDto],
  })
  interfaces: RemoteInterfaceDto[];
}
