import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class TaskCreateDto {
  @IsNotEmpty({ message: '文件名不能为空！' })
  @IsString({ message: '文件名必须为字符串类型！' })
  @ApiProperty({
    description: '文件名',
    example: 'test.jpg',
  })
  fileName: string;

  @IsNotEmpty({ message: '文件大小不能为空！' })
  @IsNumber({}, { message: '文件大小必须为数字类型！' })
  @ApiProperty({
    description: '文件大小',
    example: 1024,
  })
  fileSize: number;

  @IsNotEmpty({ message: '文件类型不能为空！' })
  @IsString({ message: '文件类型必须为字符串类型！' })
  @ApiProperty({
    description: '文件类型',
    example: 'image/jpeg',
  })
  fileType: string;

  @IsNotEmpty({ message: '文件MD5不能为空！' })
  @IsString({ message: '文件MD5必须为字符串类型！' })
  @ApiProperty({
    description: '文件MD5',
    example: 'd41d8cd98f00b204e9800998ecf8427e',
  })
  fileMd5: string;

  @IsNotEmpty({ message: '总块数不能为空！' })
  @IsNumber({}, { message: '总块数必须为数字类型！' })
  @ApiProperty({
    description: '总块数',
    example: 1,
  })
  totalChunks: number;
  userId: number;
}
