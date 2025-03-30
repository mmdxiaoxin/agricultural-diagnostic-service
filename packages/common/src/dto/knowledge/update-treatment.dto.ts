import { TreatmentType } from '@app/database/entities/treatment.entity';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateTreatmentDto {
  @IsOptional()
  @IsNumber()
  @ApiProperty({ description: '疾病ID' })
  diseaseId?: number;

  @IsOptional()
  @IsEnum(TreatmentType)
  @ApiProperty({ description: '治疗方式类型' })
  type?: TreatmentType;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '治疗方式方法' })
  method?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '推荐产品' })
  recommendedProducts?: string;
}
