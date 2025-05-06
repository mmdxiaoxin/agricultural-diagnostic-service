import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from '../base.dto';
class SupportValueDto {
  @ApiProperty({ description: '诊断支持配置ID' })
  configId: number;

  @ApiProperty({ description: '诊断支持服务ID' })
  serviceId: number;
}

export class DiagnosisSupportDto extends BaseDto {
  @ApiProperty({ description: '诊断支持名称', example: '大豆锈病' })
  key: string;

  @ApiProperty({ description: '诊断支持描述', example: '大豆锈病诊断配置' })
  description: string;

  @ApiProperty({
    description: '诊断支持值',
    example: {
      configId: 5,
      serviceId: 107,
    },
  })
  value: SupportValueDto;
}
