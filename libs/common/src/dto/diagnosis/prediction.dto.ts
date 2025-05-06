import { ApiProperty } from '@nestjs/swagger';

// 预测框信息
export class BoundingBoxDto {
  @ApiProperty({
    description: 'x坐标',
    example: 15,
  })
  x: number;

  @ApiProperty({
    description: 'y坐标',
    example: 4,
  })
  y: number;

  @ApiProperty({
    description: '宽度',
    example: 152,
  })
  width: number;

  @ApiProperty({
    description: '高度',
    example: 124,
  })
  height: number;
}

// 预测结果
export class PredictionDto {
  @ApiProperty({
    description: '区域面积',
    example: 18848,
  })
  area: number;

  @ApiProperty({
    description: '边界框',
    type: BoundingBoxDto,
  })
  bbox: BoundingBoxDto;

  @ApiProperty({
    description: '检测类型',
    example: 'detect',
  })
  type: string;

  @ApiProperty({
    description: '类别ID',
    example: 1,
  })
  class_id: number;

  @ApiProperty({
    description: '类别名称',
    example: 'Soybean___Rust',
  })
  class_name: string;

  @ApiProperty({
    description: '置信度',
    example: 0.57666015625,
  })
  confidence: number;
}
