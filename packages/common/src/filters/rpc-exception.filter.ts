import {
  ArgumentsHost,
  Catch,
  HttpStatus,
  RpcExceptionFilter,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { RpcException } from '@nestjs/microservices';

@Catch()
export class CustomRpcExceptionFilter implements RpcExceptionFilter<any> {
  catch(exception: any, host: ArgumentsHost): Observable<any> {
    let errorResponse: { code: number; message: string; data: any } = {
      code: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      data: null,
    };

    // 如果异常是 RpcException，调用 getError() 获取信息
    if (exception instanceof RpcException) {
      const rpcError: any = exception.getError();
      if (typeof rpcError === 'string') {
        errorResponse = {
          code: HttpStatus.INTERNAL_SERVER_ERROR,
          message: rpcError,
          data: null,
        };
      } else if (typeof rpcError === 'object' && rpcError !== null) {
        errorResponse = {
          code: rpcError?.code || HttpStatus.INTERNAL_SERVER_ERROR,
          message: rpcError?.message || 'Internal server error',
          data: rpcError?.data || null,
        };
      }
    }
    // 如果异常是 HttpException 或其他 Error 类型
    else if (exception instanceof Error) {
      errorResponse = {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: exception.message,
        data: null,
      };
    }
    // 如果异常为字符串或其他类型
    else if (typeof exception === 'string') {
      errorResponse = {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: exception,
        data: null,
      };
    } else {
      errorResponse = {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Unknown error',
        data: exception,
      };
    }

    return throwError(() => errorResponse);
  }
}
