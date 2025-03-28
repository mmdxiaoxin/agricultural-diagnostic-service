import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateRemoteServiceDto {
  @IsString()
  @ApiProperty({
    description: '服务名称',
    example: '病害智能诊断服务',
  })
  @IsNotEmpty()
  serviceName: string; // 服务名称

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: '服务类型',
    example: 'diagnosis',
  })
  serviceType?: string; // 服务类型

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: '服务描述',
    example: '用于病害智能诊断的服务',
  })
  description?: string; // 服务描述

  @IsEnum(['active', 'inactive', 'under_maintenance'])
  @IsOptional()
  @ApiProperty({
    description: '服务状态',
    example: 'active',
  })
  status?: 'active' | 'inactive' | 'under_maintenance'; // 服务状态

  @IsOptional()
  @IsObject()
  @ApiProperty({
    description: '远程服务配置',
    example: {},
  })
  config?: Record<string, any>;
}
