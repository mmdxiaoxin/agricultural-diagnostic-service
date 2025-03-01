// response.dto.ts
export class ResponseDto<T> {
  code: number;
  data: T;
  message: string;
}
