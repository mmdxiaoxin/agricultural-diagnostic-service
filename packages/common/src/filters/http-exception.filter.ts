// http-exception.filter.ts
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const responseBody = exception.getResponse() as any;

    // 可以通过传递的错误对象设置不同的 code 和 message
    const code = responseBody.code || status; // 如果没有自定义 code，就使用 HTTP 状态码
    const message = responseBody.message || 'An error occurred';

    response.status(status).json({
      code, // 错误代码（可以根据需要自定义）
      data: null, // 错误时数据为 null
      message,
    });
  }
}
