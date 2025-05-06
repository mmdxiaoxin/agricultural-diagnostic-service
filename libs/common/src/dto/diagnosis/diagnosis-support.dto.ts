import { ApiProperty } from '@nestjs/swagger';

class SupportValueDto {
  @ApiProperty({ description: '诊断支持配置ID' })
  configId: number;

  @ApiProperty({ description: '诊断支持服务ID' })
  serviceId: number;
}

export class DiagnosisSupportDto {
  @ApiProperty({ description: '诊断支持ID' })
  id: number;

  @ApiProperty({ description: '诊断支持名称' })
  key: string;

  @ApiProperty({ description: '诊断支持描述' })
  description: string;

  @ApiProperty({ description: '诊断支持值' })
  value: SupportValueDto;

  @ApiProperty({ description: '诊断支持创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '诊断支持更新时间' })
  updatedAt: Date;
}
