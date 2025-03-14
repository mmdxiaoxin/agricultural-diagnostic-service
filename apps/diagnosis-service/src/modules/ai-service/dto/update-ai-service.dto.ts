import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';

export class UpdateAiServiceDto {
  @IsString()
  @ApiProperty({
    description: '服务名称',
    example: '病害智能诊断服务',
  })
  @IsOptional()
  serviceName?: string; // 服务名称

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
  @IsString()
  @ApiProperty({
    description: '服务的访问URL',
    example: 'http://localhost:5001',
  })
  endpointUrl?: string; // 服务的访问URL
}
