import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export class UpdateRemoteConfigDto {
  @IsString({ message: '配置项键名必须是字符串' })
  @IsOptional()
  @Type(() => String)
  @ApiProperty({
    description: '配置项键名',
    example: 'model_path',
  })
  configKey?: string;

  @IsString({ message: '配置项值必须是字符串' })
  @IsOptional()
  @Type(() => String)
  @ApiProperty({
    description: '配置项值',
    example: '/path/to/model',
  })
  configValue?: string;
}
