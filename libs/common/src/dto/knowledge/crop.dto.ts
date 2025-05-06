import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from '../base.dto';
// 作物信息
export class CropDto extends BaseDto {
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
}
