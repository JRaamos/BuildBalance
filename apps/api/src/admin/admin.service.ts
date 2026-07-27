import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { ChangeAccessDto, GrantAccessDto } from './admin.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async projectAccess(projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, archivedAt: null },
      select: {
        id: true,
        name: true,
        owner: { select: { id: true, name: true, email: true } },
        accesses: {
          include: { user: { select: { id: true, name: true, email: true, status: true } } },
          orderBy: { user: { name: 'asc' } }
        }
      }
    });
    if (!project) throw new NotFoundException({ code: 'PROJECT_NOT_FOUND', message: 'Obra não encontrada' });
    return project;
  }

  async grant(actorId: string, projectId: string, dto: GrantAccessDto) {
    const project = await this.prisma.project.findFirst({ where: { id: projectId, archivedAt: null } });
    if (!project) throw new NotFoundException({ code: 'PROJECT_NOT_FOUND', message: 'Obra não encontrada' });
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException({ code: 'USER_NOT_FOUND', message: 'Usuário não encontrado' });
    if (user.status !== UserStatus.ACTIVE) {
      throw new BadRequestException({ code: 'USER_INACTIVE', message: 'Não é possível compartilhar com um usuário inativo' });
    }
    if (project.ownerId === dto.userId) {
      throw new BadRequestException({ code: 'OWNER_ACCESS_IMMUTABLE', message: 'O proprietário já possui acesso total' });
    }
    if (await this.prisma.projectAccess.findUnique({ where: { projectId_userId: { projectId, userId: dto.userId } } })) {
      throw new BadRequestException({ code: 'DUPLICATE_PROJECT_ACCESS', message: 'Este usuário já possui acesso à obra' });
    }
    const access = await this.prisma.projectAccess.create({
      data: { projectId, userId: dto.userId, permission: dto.permission, createdById: actorId },
      include: { user: { select: { id: true, name: true, email: true } } }
    });
    await this.audit.record(actorId, 'PROJECT_ACCESS_GRANTED', 'ProjectAccess', access.id, {
      projectId, userId: dto.userId, permission: dto.permission
    });
    return access;
  }

  async change(actorId: string, projectId: string, accessId: string, dto: ChangeAccessDto) {
    const before = await this.prisma.projectAccess.findFirst({ where: { id: accessId, projectId } });
    if (!before) throw new NotFoundException({ code: 'PROJECT_ACCESS_NOT_FOUND', message: 'Acesso não encontrado' });
    const access = await this.prisma.projectAccess.update({ where: { id: accessId }, data: { permission: dto.permission } });
    await this.audit.record(actorId, 'PROJECT_ACCESS_CHANGED', 'ProjectAccess', accessId, {
      projectId, from: before.permission, to: dto.permission
    });
    return access;
  }

  async remove(actorId: string, projectId: string, accessId: string) {
    const access = await this.prisma.projectAccess.findFirst({ where: { id: accessId, projectId } });
    if (!access) throw new NotFoundException({ code: 'PROJECT_ACCESS_NOT_FOUND', message: 'Acesso não encontrado' });
    await this.prisma.projectAccess.delete({ where: { id: accessId } });
    await this.audit.record(actorId, 'PROJECT_ACCESS_REMOVED', 'ProjectAccess', accessId, {
      projectId, userId: access.userId, permission: access.permission
    });
    return { message: 'Acesso removido com sucesso' };
  }

  async userAccess(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, email: true, status: true,
        ownedProjects: { where: { archivedAt: null }, select: { id: true, name: true, status: true } },
        projectAccesses: {
          include: { project: { select: { id: true, name: true, status: true, owner: { select: { id: true, name: true } } } } }
        }
      }
    });
    if (!user) throw new NotFoundException({ code: 'USER_NOT_FOUND', message: 'Usuário não encontrado' });
    return user;
  }

  listAudit(query: Record<string, string | undefined>) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 30));
    return this.prisma.auditLog.findMany({
      where: {
        ...(query.action && { action: query.action }),
        ...(query.entityType && { entityType: query.entityType })
      },
      include: { actor: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });
  }
}
