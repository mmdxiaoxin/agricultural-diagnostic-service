import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class DiseaseDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: '疾病名称', required: true })
  name: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '别名', required: false })
  alias?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '发病原因', required: false })
  cause?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '传播方式', required: false })
  transmission?: string;
}

export class CreateDiseaseDto extends DiseaseDto {
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({ description: '作物ID', required: true })
  cropId: number;
}
