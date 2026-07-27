import { Injectable, NotFoundException } from '@nestjs/common';
import { ProjectPermission, UserRole } from '@prisma/client';
import { AuthUser } from '../common/auth.types';
import { PrismaService } from '../prisma/prisma.service';

export type EffectivePermission = 'OWNER' | ProjectPermission;

@Injectable()
export class ProjectAuthorizationService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserProjectPermission(user: AuthUser, projectId: string): Promise<EffectivePermission | null> {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, archivedAt: null },
      select: { ownerId: true, accesses: { where: { userId: user.id }, select: { permission: true } } }
    });
    if (!project) return null;
    if (project.ownerId === user.id) return 'OWNER';
    if (user.role === UserRole.ADMIN) return ProjectPermission.VIEW;
    return project.accesses[0]?.permission ?? null;
  }

  async assertView(user: AuthUser, projectId: string) {
    const permission = await this.getUserProjectPermission(user, projectId);
    if (!permission) {
      throw new NotFoundException({ code: 'PROJECT_NOT_FOUND', message: 'Obra não encontrada' });
    }
    return permission;
  }

  async assertEdit(user: AuthUser, projectId: string) {
    const permission = await this.assertView(user, projectId);
    if (permission === ProjectPermission.VIEW) {
      throw new NotFoundException({ code: 'PROJECT_NOT_FOUND', message: 'Obra não encontrada' });
    }
    return permission;
  }

  async assertDelete(user: AuthUser, projectId: string) {
    const permission = await this.assertView(user, projectId);
    if (permission !== 'OWNER') {
      throw new NotFoundException({ code: 'PROJECT_NOT_FOUND', message: 'Obra não encontrada' });
    }
  }
}
