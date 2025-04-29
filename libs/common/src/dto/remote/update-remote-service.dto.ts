import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateRemoteServiceDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: '服务名称',
    example: '病害智能诊断服务',
    required: false,
  })
  serviceName?: string; // 服务名称

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: '服务类型',
    example: 'diagnosis',
    required: false,
  })
  serviceType?: string; // 服务类型

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: '服务描述',
    example: '用于病害智能诊断的服务',
    required: false,
  })
  description?: string; // 服务描述

  @IsEnum(['active', 'inactive', 'under_maintenance'])
  @IsOptional()
  @ApiProperty({
    description: '服务状态',
    example: 'active',
    required: false,
  })
  status?: 'active' | 'inactive' | 'under_maintenance'; // 服务状态

  @IsOptional()
  @IsArray()
  @ApiProperty({
    description: '远程服务配置',
    example: [
      {
        name: 'config1',
        value: 'value1',
      },
      {
        name: 'config2',
        value: 'value2',
      },
    ],
    required: false,
  })
  configs?: Record<string, any>[];
}
