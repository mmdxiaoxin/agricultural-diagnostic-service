import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { TreatmentType } from '@app/database/entities/treatment.entity';

export class TreatmentDto {
  @IsNotEmpty()
  @IsNumber()
  diseaseId: number;

  @IsNotEmpty()
  @IsEnum(TreatmentType)
  type: TreatmentType;

  @IsNotEmpty()
  @IsString()
  method: string;

  @IsOptional()
  @IsString()
  recommendedProducts?: string;
}
