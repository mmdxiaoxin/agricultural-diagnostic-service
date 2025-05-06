import { ApiProperty } from '@nestjs/swagger';

export class DownloadTokenDto {
  @ApiProperty({
    description: '下载令牌',
    example: '1234567890',
  })
  token: string;
}
