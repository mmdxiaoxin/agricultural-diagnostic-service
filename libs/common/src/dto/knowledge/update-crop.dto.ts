import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateCropDto {
  @IsOptional()
  @IsString()
  @ApiProperty({ description: '作物名称', required: false })
  name?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '学名', required: false })
  scientificName?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '生长阶段', required: false })
  growthStage?: string;
}
