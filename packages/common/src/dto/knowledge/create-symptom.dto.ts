import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateSymptomDto {
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({ description: '疾病ID' })
  diseaseId: number;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: '症状描述' })
  description: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '图片URL' })
  imageUrl?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '生长阶段' })
  stage?: string;
}
