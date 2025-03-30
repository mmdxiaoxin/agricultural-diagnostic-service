import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CropDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  scientificName?: string;

  @IsOptional()
  @IsString()
  growthStage?: string;
}
