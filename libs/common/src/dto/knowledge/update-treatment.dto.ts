import { TreatmentType } from '@app/database/entities/treatment.entity';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateTreatmentDto {
  @IsOptional()
  @IsNumber()
  @ApiProperty({ description: '疾病ID', required: true })
  diseaseId: number;

  @IsOptional()
  @IsEnum(TreatmentType)
  @ApiProperty({ description: '治疗方式类型', required: false })
  type?: TreatmentType;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '治疗方式方法', required: false })
  method?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '推荐产品', required: false })
  recommendedProducts?: string;
}
