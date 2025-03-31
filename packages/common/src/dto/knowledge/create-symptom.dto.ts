import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateSymptomDto {
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({ description: '疾病ID', required: true })
  diseaseId: number;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: '症状描述', required: true })
  description: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '图片URL', required: false })
  imageUrl?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '生长阶段', required: false })
  stage?: string;
}
