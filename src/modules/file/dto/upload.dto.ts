import { IsNotEmpty } from 'class-validator';

export class UploadFileDto {
  @IsNotEmpty({ message: '上传文件不能为空' })
  file: Express.Multer.File;
}
