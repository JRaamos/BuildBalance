import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, ResetPasswordDto, UpdateUserDto, UserStatusDto } from './users.dto';

const safeSelect = {
  id: true, name: true, email: true, role: true, status: true,
  lastLoginAt: true, createdAt: true, updatedAt: true,
  _count: { select: { ownedProjects: true, projectAccesses: true } }
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async list(query: Record<string, string | undefined>) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const where: Prisma.UserWhereInput = {
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } }
        ]
      }),
      ...(query.role && { role: query.role as UserRole }),
      ...(query.status && { status: query.status as UserStatus })
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({ where, select: safeSelect, orderBy: { name: 'asc' }, skip: (page - 1) * limit, take: limit }),
      this.prisma.user.count({ where })
    ]);
    return { data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async create(actorId: string, dto: CreateUserDto) {
    const email = dto.email.trim().toLowerCase();
    if (await this.prisma.user.findUnique({ where: { email } })) {
      throw new BadRequestException({ code: 'EMAIL_ALREADY_EXISTS', message: 'E-mail já cadastrado' });
    }
    const user = await this.prisma.user.create({
      data: { name: dto.name.trim(), email, passwordHash: await bcrypt.hash(dto.password, 12), role: dto.role },
      select: safeSelect
    });
    await this.audit.record(actorId, 'USER_CREATED', 'User', user.id, { role: user.role });
    return user;
  }

  async get(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: safeSelect });
    if (!user) throw new NotFoundException({ code: 'USER_NOT_FOUND', message: 'Usuário não encontrado' });
    return user;
  }

  async update(actorId: string, id: string, dto: UpdateUserDto) {
    const before = await this.get(id);
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.email && { email: dto.email.trim().toLowerCase() }),
        ...(dto.name && { name: dto.name.trim() })
      },
      select: safeSelect
    });
    if (dto.role && dto.role !== before.role) {
      await this.audit.record(actorId, 'USER_ROLE_CHANGED', 'User', id, { from: before.role, to: dto.role });
    }
    return user;
  }

  async setStatus(actorId: string, id: string, dto: UserStatusDto) {
    const user = await this.get(id);
    if (user.role === UserRole.ADMIN && user.status === UserStatus.ACTIVE && dto.status === UserStatus.INACTIVE) {
      const activeAdmins = await this.prisma.user.count({ where: { role: UserRole.ADMIN, status: UserStatus.ACTIVE } });
      if (activeAdmins <= 1) {
        throw new BadRequestException({ code: 'LAST_ADMIN_PROTECTED', message: 'O último administrador ativo não pode ser desativado' });
      }
    }
    const updated = await this.prisma.user.update({ where: { id }, data: { status: dto.status }, select: safeSelect });
    await this.audit.record(actorId, 'USER_STATUS_CHANGED', 'User', id, { from: user.status, to: dto.status });
    return updated;
  }

  async resetPassword(actorId: string, id: string, dto: ResetPasswordDto) {
    await this.get(id);
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash: await bcrypt.hash(dto.password, 12) }
    });
    await this.audit.record(actorId, 'USER_PASSWORD_RESET', 'User', id);
    return { message: 'Senha redefinida com sucesso' };
  }
}
