import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext) {
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()])) {
      return true;
    }
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string>; user?: unknown }>();
    const token = request.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) throw new UnauthorizedException({ code: 'AUTH_REQUIRED', message: 'Sessão necessária' });
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string }>(token, {
        secret: this.config.getOrThrow<string>('JWT_SECRET')
      });
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user || user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException({ code: 'USER_INACTIVE', message: 'Usuário inativo' });
      }
      request.user = { id: user.id, name: user.name, email: user.email, role: user.role };
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException({ code: 'TOKEN_INVALID', message: 'Sessão inválida ou expirada' });
    }
  }
}
