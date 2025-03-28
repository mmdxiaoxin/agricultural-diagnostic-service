import { IsNotEmpty, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';

export class StartDiagnosisDto {
  @IsNotEmpty({ message: 'serviceId 不能为空' })
  @Transform(({ value }) => Number(value))
  @IsNumber({}, { message: 'serviceId 必须为数字' })
  serviceId: number;
}
