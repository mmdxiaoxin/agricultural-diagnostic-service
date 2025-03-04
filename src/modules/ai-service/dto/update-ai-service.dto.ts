import { IsString, IsOptional, IsEnum } from 'class-validator';

export class UpdateAiServiceDto {
  @IsOptional()
  @IsString()
  serviceName?: string; // 服务名称

  @IsOptional()
  @IsString()
  serviceType?: string; // 服务类型

  @IsOptional()
  @IsString()
  description?: string; // 服务描述

  @IsOptional()
  @IsEnum(['active', 'inactive', 'under_maintenance'])
  status?: 'active' | 'inactive' | 'under_maintenance'; // 服务状态

  @IsOptional()
  @IsString()
  endpointUrl?: string; // 服务的访问URL
}
