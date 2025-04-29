import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateRemoteInterfaceDto {
  @IsOptional()
  @IsString()
  @ApiProperty({
    description: '接口名称',
    example: '病害智能诊断接口',
    required: false,
  })
  name?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: '接口描述',
    example: '病害智能诊断接口描述',
    required: false,
  })
  description?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: '接口类型',
    example: '病害智能诊断接口类型',
    required: false,
  })
  type?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: '接口地址',
    example: '病害智能诊断接口地址',
    required: false,
  })
  url?: string;

  @IsOptional()
  @IsObject()
  @ApiProperty({
    description: '接口配置',
    example: '病害智能诊断接口配置',
    required: false,
  })
  config?: object;
}
