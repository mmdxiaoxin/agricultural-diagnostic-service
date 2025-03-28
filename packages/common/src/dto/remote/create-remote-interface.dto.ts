import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsString } from 'class-validator';

export class CreateRemoteInterfaceDto {
  @IsString()
  @ApiProperty({
    description: '接口名称',
    example: '病害智能诊断接口',
  })
  name: string;

  @IsString()
  @ApiProperty({
    description: '接口描述',
    example: '病害智能诊断接口描述',
  })
  description: string;

  @IsString()
  @ApiProperty({
    description: '接口类型',
    example: '病害智能诊断接口类型',
  })
  type: string;

  @IsString()
  @ApiProperty({
    description: '接口地址',
    example: '病害智能诊断接口地址',
  })
  url: string;

  @IsObject()
  @ApiProperty({
    description: '接口配置',
    example: '病害智能诊断接口配置',
  })
  config: object;
}
