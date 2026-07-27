import { Injectable, NotFoundException } from '@nestjs/common';
import { PaymentStatus, Prisma, ScopeStatus } from '@prisma/client';
import { AuthUser } from '../common/auth.types';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectAuthorizationService } from '../projects/project-authorization.service';
import { CreateScopeDto, UpdateScopeDto } from './scopes.dto';

@Injectable()
export class ScopesService {
  constructor(private readonly prisma: PrismaService, private readonly authorization: ProjectAuthorizationService) {}

  async create(user: AuthUser, projectId: string, dto: CreateScopeDto) {
    await this.authorization.assertEdit(user, projectId);
    return this.prisma.scope.create({
      data: {
        projectId,
        name: dto.name.trim(),
        description: dto.description?.trim(),
        plannedBudget: new Prisma.Decimal(dto.plannedBudget),
        displayOrder: dto.displayOrder ?? 0
      }
    });
  }

  async list(user: AuthUser, projectId: string) {
    await this.authorization.assertView(user, projectId);
    const scopes = await this.prisma.scope.findMany({
      where: { projectId },
      include: {
        expenses: { where: { paymentStatus: { not: PaymentStatus.CANCELLED } }, select: { amount: true } }
      },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }]
    });
    return scopes.map(({ expenses, ...scope }) => {
      const planned = Number(scope.plannedBudget);
      const total = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
      return {
        ...scope,
        plannedBudget: planned.toFixed(2),
        totalExpenses: total.toFixed(2),
        remainingBudget: (planned - total).toFixed(2),
        usagePercentage: planned > 0 ? Number(((total / planned) * 100).toFixed(2)) : 0,
        isOverBudget: total > planned
      };
    });
  }

  private async find(id: string) {
    const scope = await this.prisma.scope.findUnique({ where: { id } });
    if (!scope) throw new NotFoundException({ code: 'SCOPE_NOT_FOUND', message: 'Escopo não encontrado' });
    return scope;
  }

  async update(user: AuthUser, id: string, dto: UpdateScopeDto) {
    const scope = await this.find(id);
    await this.authorization.assertEdit(user, scope.projectId);
    return this.prisma.scope.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.name && { name: dto.name.trim() }),
        ...(dto.plannedBudget && { plannedBudget: new Prisma.Decimal(dto.plannedBudget) })
      }
    });
  }

  async cancel(user: AuthUser, id: string) {
    const scope = await this.find(id);
    await this.authorization.assertEdit(user, scope.projectId);
    await this.prisma.scope.update({ where: { id }, data: { status: ScopeStatus.CANCELLED } });
    return { message: 'Escopo cancelado; os gastos vinculados foram preservados' };
  }
}
