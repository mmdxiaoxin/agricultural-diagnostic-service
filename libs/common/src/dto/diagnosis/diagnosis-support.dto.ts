import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class DiagnosisSupportDto {
  @ApiProperty({ description: '配置项' })
  @IsNotEmpty()
  @IsString()
  key: string;

  @ApiProperty({ description: '配置值' })
  @IsNotEmpty()
  @IsObject()
  value: { serviceId: number; configId: number };

  @ApiProperty({ description: '配置描述' })
  @IsOptional()
  @IsString()
  description: string;
}
