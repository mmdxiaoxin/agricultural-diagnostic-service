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
}
