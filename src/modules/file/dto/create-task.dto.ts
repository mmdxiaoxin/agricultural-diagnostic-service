import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateTaskDto {
  @IsNotEmpty({ message: '文件名不能为空！' })
  @IsString({ message: '文件名必须为字符串类型！' })
  fileName: string;

  @IsNotEmpty({ message: '文件大小不能为空！' })
  @IsNumber({}, { message: '文件大小必须为数字类型！' })
  fileSize: number;

  @IsNotEmpty({ message: '文件类型不能为空！' })
  @IsString({ message: '文件类型必须为字符串类型！' })
  fileType: string;

  @IsNotEmpty({ message: '文件MD5不能为空！' })
  @IsString({ message: '文件MD5必须为字符串类型！' })
  fileMd5: string;

  @IsNotEmpty({ message: '总块数不能为空！' })
  @IsNumber({}, { message: '总块数必须为数字类型！' })
  totalChunks: number;
}
