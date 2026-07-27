import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const raw = exception instanceof HttpException ? exception.getResponse() : null;
    const body = typeof raw === 'object' && raw ? raw as Record<string, unknown> : {};
    const suppliedMessage = body.message ?? (exception instanceof Error ? exception.message : 'Erro inesperado');
    const details = Array.isArray(suppliedMessage) ? suppliedMessage : [];
    const message = Array.isArray(suppliedMessage)
      ? 'Dados inválidos'
      : status === 500 ? 'Não foi possível concluir a operação' : String(suppliedMessage);

    response.status(status).json({
      statusCode: status,
      code: String(body.code ?? (status === 400 ? 'VALIDATION_ERROR' : 'REQUEST_ERROR')),
      message,
      details
    });
  }
}
