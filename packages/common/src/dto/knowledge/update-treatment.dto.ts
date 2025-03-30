import { TreatmentType } from '@app/database/entities/treatment.entity';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateTreatmentDto {
  @IsOptional()
  @IsNumber()
  diseaseId?: number;

  @IsOptional()
  @IsEnum(TreatmentType)
  type?: TreatmentType;

  @IsOptional()
  @IsString()
  method?: string;

  @IsOptional()
  @IsString()
  recommendedProducts?: string;
}
