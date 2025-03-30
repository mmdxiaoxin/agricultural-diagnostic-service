import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateSymptomDto {
  @IsNotEmpty()
  @IsNumber()
  diseaseId: number;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  stage?: string;
}
