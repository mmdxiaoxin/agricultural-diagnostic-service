//
import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { QueryFailedError, TypeORMError } from 'typeorm';

@Catch(TypeORMError)
export class TypeormFilter implements ExceptionFilter {
  catch(exception: TypeORMError, host: ArgumentsHost) {
    // 获取请求对象
    const request = host.switchToHttp().getRequest();
    const ctx = host.switchToHttp();
    let code = 500;
    if (exception instanceof QueryFailedError) {
      code = exception.driverError.errno;
    }
    // 响应 请求对象
    const response = ctx.getResponse();
    response.status(500).json({
      code: code,
      data: {
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
      },
      message: exception.message,
    });
  }
}
