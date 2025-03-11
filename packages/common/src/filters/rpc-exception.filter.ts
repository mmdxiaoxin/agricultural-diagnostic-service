import {
  ArgumentsHost,
  Catch,
  HttpStatus,
  RpcExceptionFilter,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';

@Catch(RpcException)
export class CustomRpcExceptionFilter
  implements RpcExceptionFilter<RpcException>
{
  catch(exception: RpcException, host: ArgumentsHost): Observable<any> {
    let errorResponse:
      | { code?: number; message?: string; data?: any }
      | string = exception.getError();

    // 兼容 `string` 和 `object` 两种异常返回格式
    if (typeof errorResponse === 'string') {
      errorResponse = {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: errorResponse,
        data: null,
      };
    }

    const formattedError = {
      code: errorResponse.code || HttpStatus.INTERNAL_SERVER_ERROR,
      message: errorResponse.message || 'Internal server error',
      data: errorResponse.data || null,
    };

    return throwError(() => formattedError);
  }
}
