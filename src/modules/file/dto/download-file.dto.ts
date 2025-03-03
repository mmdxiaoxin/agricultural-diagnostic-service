import { ArrayMinSize, IsArray, IsNotEmpty, IsInt } from 'class-validator';
import { Transform } from 'class-transformer';

export class DownloadFilesDto {
  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(1)
  @Transform(({ value }) => value.map((v: string) => Number(v)), {
    toClassOnly: true,
  })
  @IsInt({ each: true })
  fileIds: number[];
}
