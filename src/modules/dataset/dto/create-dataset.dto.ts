import { IsString, IsOptional } from 'class-validator';

export class CreateDatasetDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
