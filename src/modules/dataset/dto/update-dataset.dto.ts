import { IsString, IsOptional, IsArray } from 'class-validator';

export class UpdateDatasetDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray({
    message: 'fileIds must be an array of numbers',
  })
  fileIds?: number[];
}
