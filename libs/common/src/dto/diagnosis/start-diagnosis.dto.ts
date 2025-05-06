import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class StartDiagnosisDto {
  @IsNotEmpty({ message: 'serviceId 不能为空' })
  @Transform(({ value }) => Number(value))
  @IsNumber({}, { message: 'serviceId 必须为数字' })
  @ApiProperty({
    description: '服务ID',
    type: Number,
    example: 5,
  })
  serviceId: number;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    description: '配置ID',
    type: Number,
    example: 107,
  })
  configId: number;
}
