import { ApiProperty } from '@nestjs/swagger';

export class UploadSingleDto {
  @ApiProperty()
  fileMeta: Express.Multer.File;

  @ApiProperty()
  fileData: Buffer;

  @ApiProperty()
  userId: number;
}
