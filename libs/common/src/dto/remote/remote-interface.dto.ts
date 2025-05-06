import { ApiProperty } from '@nestjs/swagger';

export class RemoteInterfaceDto {
  @ApiProperty({
    description: '接口ID',
  })
  id: number;

  @ApiProperty({
    description: '接口名称',
  })
  name: string;

  @ApiProperty({
    description: '接口描述',
  })
  description: string;

  @ApiProperty({
    description: '接口类型',
  })
  type: string;

  @ApiProperty({
    description: '接口访问地址',
  })
  url: string;

  @ApiProperty({
    description: '接口配置',
  })
  config: object;
}
