import { ApiProperty } from '@nestjs/swagger';

export class DictDto {
  @ApiProperty({
    description: '字典ID',
    example: 1,
  })
  key: string;

  @ApiProperty({
    description: '字典值',
    example: '管理员',
  })
  value: string;
}
