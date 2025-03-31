import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateSymptomDto {
  @IsOptional()
  @IsNumber()
  @ApiProperty({ description: '疾病ID', required: true })
  diseaseId: number;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '症状描述', required: false })
  description?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '图片URL', required: false })
  imageUrl?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '生长阶段', required: false })
  stage?: string;
}
