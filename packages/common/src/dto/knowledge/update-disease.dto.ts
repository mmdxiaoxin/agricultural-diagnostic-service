import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateDiseaseDto {
  @IsOptional()
  @IsString()
  @ApiProperty({ description: '疾病名称', required: false })
  name?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '别名', required: false })
  alias?: string;

  @IsOptional()
  @IsNumber()
  @ApiProperty({ description: '作物ID', required: false })
  cropId?: number;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '发病原因', required: false })
  cause?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '传播方式', required: false })
  transmission?: string;
}
