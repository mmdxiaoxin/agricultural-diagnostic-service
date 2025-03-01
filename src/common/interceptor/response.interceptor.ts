// response.interceptor.ts
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ResponseDto } from '../dto/response.dto';

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ResponseDto<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseDto<T>> {
    const request = context.switchToHttp().getRequest();
    const isError = request.statusCode >= 400; // 判断是否为错误响应

    return next.handle().pipe(
      map((data) => {
        // 判断是否有自定义 code
        let code = 200;
        let message = 'Success';

        if (isError) {
          code = request.statusCode || 500; // 使用 HTTP 状态码作为默认的 code
          message = data?.message || 'An error occurred';
        } else if (data?.code) {
          // 如果响应数据中包含 code 字段，则使用它
          code = data.code;
          message = data.message || 'Success';
        }

        return {
          code,
          data: data?.data || data, // 如果有嵌套数据，确保取出它
          message,
        };
      }),
    );
  }
}
