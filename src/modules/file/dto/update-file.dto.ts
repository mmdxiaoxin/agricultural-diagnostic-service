import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class UpdateFileDto {
  @IsNotEmpty()
  @IsInt()
  fileId: number;

  @IsOptional()
  @IsString()
  @Length(5, 255, {
    message: '文件名称应该过短或者过长',
  })
  originalFileName?: string;

  @IsOptional()
  @IsString()
  @IsIn(['public', 'private'], {
    message: '请使用 "public" 或者 "private" 来设置权限',
  })
  access?: string;
}
