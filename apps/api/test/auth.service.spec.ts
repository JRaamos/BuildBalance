import { UnauthorizedException } from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../src/auth/auth.service';

describe('AuthService', () => {
  const prisma = { user: { findUnique: jest.fn(), update: jest.fn() } } as any;
  const jwt = { signAsync: jest.fn().mockResolvedValue('token') } as any;
  const config = { getOrThrow: jest.fn().mockReturnValue('secret'), get: jest.fn().mockReturnValue('1d') } as any;
  const service = new AuthService(prisma, jwt, config);

  it('não autentica usuário inativo', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1', name: 'Inativo', email: 'inactive@test.local',
      passwordHash: await bcrypt.hash('password123', 4), role: UserRole.MANAGER, status: UserStatus.INACTIVE
    });
    await expect(service.login({ email: 'inactive@test.local', password: 'password123' })).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('retorna somente usuário seguro e token em login válido', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1', name: 'Gestor', email: 'manager@test.local',
      passwordHash: await bcrypt.hash('password123', 4), role: UserRole.MANAGER, status: UserStatus.ACTIVE
    });
    prisma.user.update.mockResolvedValue({});
    const result = await service.login({ email: 'manager@test.local', password: 'password123' });
    expect(result.accessToken).toBe('token');
    expect(result.user).not.toHaveProperty('passwordHash');
    expect(prisma.user.update).toHaveBeenCalled();
  });
});
