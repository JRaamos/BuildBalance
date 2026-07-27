import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/auth.types';
import { ChangePasswordDto, LoginDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService
  ) {}

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS', message: 'E-mail ou senha inválidos' });
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException({ code: 'USER_INACTIVE', message: 'Usuário inativo' });
    }
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    const safeUser: AuthUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    return {
      accessToken: await this.jwt.signAsync(
        { sub: user.id, role: user.role },
        {
          secret: this.config.getOrThrow('JWT_SECRET'),
          expiresIn: this.config.get('JWT_EXPIRES_IN', '1d') as any
        }
      ),
      user: safeUser
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!(await bcrypt.compare(dto.currentPassword, user.passwordHash))) {
      throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS', message: 'Senha atual incorreta' });
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await bcrypt.hash(dto.newPassword, 12) }
    });
    return { message: 'Senha alterada com sucesso' };
  }
}
