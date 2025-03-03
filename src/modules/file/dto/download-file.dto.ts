import { ArrayMinSize, IsArray, IsNotEmpty, IsInt } from 'class-validator';
import { Transform } from 'class-transformer';

export class DownloadFilesDto {
  @IsNotEmpty({ message: 'fileIds 参数不能为空！' })
  @IsArray({ message: 'fileIds 参数必须是数组！' })
  @ArrayMinSize(1, { message: 'fileIds 参数必须存在！' })
  @Transform(({ value }) => value.map((v: string) => Number(v)), {
    toClassOnly: true,
  })
  @IsInt({ each: true })
  fileIds: number[];
}
