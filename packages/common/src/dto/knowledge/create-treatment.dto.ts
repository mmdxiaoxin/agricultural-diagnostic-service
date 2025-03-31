import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { TreatmentType } from '@app/database/entities/treatment.entity';
import { ApiProperty } from '@nestjs/swagger';

export class TreatmentDto {
  @IsNotEmpty()
  @IsEnum(TreatmentType)
  @ApiProperty({ description: '治疗方式类型', required: true })
  type: TreatmentType;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: '治疗方式方法', required: true })
  method: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '推荐产品', required: false })
  recommendedProducts?: string;
}

export class CreateTreatmentDto extends TreatmentDto {
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({ description: '疾病ID', required: true })
  diseaseId: number;
}
