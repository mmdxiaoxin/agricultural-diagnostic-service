import { ApiProperty } from '@nestjs/swagger';

export class UploadSingleDto {
  @ApiProperty()
  fileMeta: Pick<Express.Multer.File, 'originalname' | 'mimetype' | 'size'>;

  @ApiProperty()
  fileData: string;

  @ApiProperty()
  userId: number;
}
