import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { TreatmentType } from '@app/database/entities/treatment.entity';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTreatmentDto {
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({ description: '疾病ID' })
  diseaseId: number;

  @IsNotEmpty()
  @IsEnum(TreatmentType)
  @ApiProperty({ description: '治疗方式类型' })
  type: TreatmentType;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: '治疗方式方法' })
  method: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '推荐产品' })
  recommendedProducts?: string;
}
