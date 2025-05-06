import { ApiProperty } from '@nestjs/swagger';

export class StringDictDto {
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

export class NumberDictDto {
  @ApiProperty({
    description: '字典ID',
    example: 1,
    type: Number,
  })
  key: number;

  @ApiProperty({
    description: '字典值',
    example: '管理员',
    type: String,
  })
  value: string;
}
