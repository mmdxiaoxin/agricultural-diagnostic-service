import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateDiseaseDto {
  @IsOptional()
  @IsString()
  @ApiProperty({ description: '疾病名称' })
  name?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '别名' })
  alias?: string;

  @IsOptional()
  @IsNumber()
  @ApiProperty({ description: '作物ID' })
  cropId?: number;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '发病原因' })
  cause?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '传播方式' })
  transmission?: string;
}
