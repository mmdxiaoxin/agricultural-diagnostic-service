import { ApiProperty } from '@nestjs/swagger';

// 作物信息
export class CropDto {
  @ApiProperty({
    description: '作物ID',
    example: 4,
  })
  id: number;

  @ApiProperty({
    description: '作物名称',
    example: '大豆',
  })
  name: string;

  @ApiProperty({
    description: '作物别名',
    example: null,
    nullable: true,
  })
  alias: string | null;

  @ApiProperty({
    description: '生长周期',
    example: null,
    nullable: true,
  })
  growthCycle: string | null;

  @ApiProperty({
    description: '生长阶段',
    example: '发芽期、幼苗期、分枝期、开花期、结荚期、鼓粒期和成熟期',
  })
  growthStage: string;

  @ApiProperty({
    description: '生长习性',
    example: null,
    nullable: true,
  })
  growthHabits: string | null;

  @ApiProperty({
    description: '适宜区域',
    example: null,
    nullable: true,
  })
  suitableArea: string | null;

  @ApiProperty({
    description: '适宜土壤',
    example: null,
    nullable: true,
  })
  suitableSoil: string | null;

  @ApiProperty({
    description: '学名',
    example: 'Glycine max',
  })
  scientificName: string;

  @ApiProperty({
    description: '适宜季节',
    example: null,
    nullable: true,
  })
  suitableSeason: string | null;

  @ApiProperty({
    description: '创建时间',
    example: '2025-03-31T06:39:15.169Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '更新时间',
    example: '2025-03-31T06:39:15.169Z',
  })
  updatedAt: Date;
}
