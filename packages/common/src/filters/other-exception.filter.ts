import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Response } from 'express';

@Catch()
export class OtherExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    if (exception instanceof HttpException) {
      throw exception;
    }

    if (exception instanceof RpcException) {
      throw exception;
    }

    // 如果是处理好的 RpcException
    if (exception?.code || exception?.message || exception?.data) {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();

      let code = exception.code || HttpStatus.INTERNAL_SERVER_ERROR;
      let message = exception.message || 'Internal server error';
      let data = exception.data || null;

      // 返回统一的 JSON 格式
      response.status(code).json({ code, message, data });
      return;
    } else {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();

      let code = HttpStatus.INTERNAL_SERVER_ERROR;
      let message =
        exception instanceof Error
          ? exception.message
          : 'Internal server error';
      let data = null;

      // 返回统一的 JSON 格式
      response.status(code).json({ code, message, data });
    }
  }
}
