import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from '../base.dto';

export class SymptomDto extends BaseDto {
  @ApiProperty({
    type: String,
    description: '症状描述',
    required: true,
    example: '叶片上出现黄色或橙色的锈斑，后期病斑扩大并产生锈色孢子',
  })
  description: string;

  @ApiProperty({
    description: '图片URL',
    example: 'https://example.com/image.jpg',
    required: false,
    nullable: true,
    type: String,
  })
  imageUrl?: string;

  @ApiProperty({
    description: '生长阶段',
    example: '发芽期、幼苗期、分枝期、开花期、结荚期、鼓粒期和成熟期',
    required: true,
    type: String,
  })
  stage: string;
}
