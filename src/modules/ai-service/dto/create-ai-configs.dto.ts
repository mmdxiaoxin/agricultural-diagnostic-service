import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

// 定义单个配置项的数据结构
class ConfigDto {
  @IsString({ message: '配置项键名必须是字符串' })
  @IsNotEmpty({ message: '配置项键名不能为空' })
  @Type(() => String)
  @ApiProperty({
    description: '配置项键名',
    example: 'model_path',
  })
  configKey: string;

  @IsString({ message: '配置项值必须是字符串' })
  @IsNotEmpty({ message: '配置项值不能为空' })
  @Type(() => String)
  @ApiProperty({
    description: '配置项值',
    example: '/path/to/model',
  })
  configValue: string;
}

// 创建 AI 配置的 DTO
export class CreateAiConfigsDto {
  @ApiProperty({
    description: '配置项列表',
    type: [ConfigDto],
    example: [
      {
        configKey: 'model_path',
        configValue: '/path/to/model',
      },
    ],
  })
  @IsNotEmpty({ message: '配置项列表不能为空' })
  @IsArray({ message: '配置项列表必须是数组' })
  @Type(() => ConfigDto)
  configs: ConfigDto[];
}
