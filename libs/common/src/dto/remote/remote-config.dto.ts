import { ApiProperty } from '@nestjs/swagger';

// 服务配置
export class RemoveServiceConfigDto {
  @ApiProperty({
    description: '配置ID',
    example: 113,
  })
  id: number;

  @ApiProperty({
    description: '创建时间',
    example: '2025-05-04T05:25:02.562Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '更新时间',
    example: '2025-05-04T05:25:18.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: '配置名称',
    example: '番茄检测(yolo_v5s)',
  })
  name: string;

  @ApiProperty({
    description: '配置描述',
    example: '检测配置，接口顺序为detect_common->delay->detect_get',
  })
  description: string;

  @ApiProperty({
    description: '配置内容',
    type: Object,
  })
  config: object;

  @ApiProperty({
    description: '配置状态',
    example: 'active',
    enum: ['active', 'inactive'],
  })
  status: string;

  @ApiProperty({
    description: '服务ID',
    example: 5,
  })
  serviceId: number;
}
