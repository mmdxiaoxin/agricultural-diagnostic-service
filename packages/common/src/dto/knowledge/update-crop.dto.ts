import { IsOptional, IsString } from 'class-validator';

export class UpdateCropDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  scientificName?: string;

  @IsOptional()
  @IsString()
  growthStage?: string;
}
