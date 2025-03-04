// 格式化响应 DTO
export class FormatResponseDto<T = any> {
  code: number;
  data: T;
  message: string;
}
