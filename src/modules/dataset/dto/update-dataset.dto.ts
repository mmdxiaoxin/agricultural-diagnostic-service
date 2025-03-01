import { IsString, IsOptional } from 'class-validator';

export class UpdateDatasetDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
