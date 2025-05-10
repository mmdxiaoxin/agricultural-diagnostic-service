import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCropDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: '作物名称', required: true })
  name: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '学名', required: false })
  scientificName?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '生长阶段', required: false })
  growthStage?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '作物类型', required: false })
  cropType?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '作物图片', required: false })
  imageUrl?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '作物别名', required: false })
  alias?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '作物描述', required: false })
  description?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '产地', required: false })
  origin?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '作物生长习性', required: false })
  growthHabits?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '作物生长周期', required: false })
  growthCycle?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '适宜种植区域', required: false })
  suitableArea?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '适宜种植季节', required: false })
  suitableSeason?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '适宜种植土壤', required: false })
  suitableSoil?: string;
}
