import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCropDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: '作物名称' })
  name: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '学名' })
  scientificName?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '生长阶段' })
  growthStage?: string;
}
