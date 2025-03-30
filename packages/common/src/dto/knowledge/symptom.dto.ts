import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SymptomDto {
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
