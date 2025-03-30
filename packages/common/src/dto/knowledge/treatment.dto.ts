import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class TreatmentDto {
  @IsNotEmpty()
  type: 'chemical' | 'biological' | 'physical' | 'cultural';

  @IsNotEmpty()
  @IsString()
  method: string;

  @IsOptional()
  @IsString()
  recommendedProducts?: string;
}
