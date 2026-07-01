import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * 🌐 LINGUA-ENG — Global Http Exception Filter
 * 
 * File này: Chuẩn hóa toàn bộ cấu trúc lỗi phản hồi từ Server về phía Client.
 * Đảm bảo tất cả các lỗi (400, 401, 403, 404, 500,...) đều chung một format JSON.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string = 'Lỗi hệ thống không xác định!';

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const msgProp = (exceptionResponse as any).message;
        if (Array.isArray(msgProp)) {
          // Xử lý các lỗi Validation từ ValidationPipe (thường là một mảng các lỗi)
          message = msgProp.join(', ');
        } else if (typeof msgProp === 'string') {
          message = msgProp;
        } else {
          message = JSON.stringify(exceptionResponse);
        }
      } else if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Log lỗi để dễ debug trên server (không in stack trace cho các lỗi 4xx thông thường)
    if (status >= 500) {
      console.error('❌ INTERNAL SERVER ERROR:', exception);
    } else {
      console.warn(`⚠️ HTTP ${status} Warning: [${request.method}] ${request.url} - ${message}`);
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
