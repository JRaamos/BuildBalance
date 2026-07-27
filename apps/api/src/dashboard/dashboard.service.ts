import { Injectable } from '@nestjs/common';
import { PaymentStatus, Prisma, ScopeStatus, UserRole } from '@prisma/client';
import { AuthUser } from '../common/auth.types';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectAuthorizationService } from '../projects/project-authorization.service';

const money = (value: number) => value.toFixed(2);

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService, private readonly authorization: ProjectAuthorizationService) {}

  async project(user: AuthUser, projectId: string) {
    await this.authorization.assertView(user, projectId);
    const project = await this.prisma.project.findUniqueOrThrow({
      where: { id: projectId },
      include: {
        scopes: {
          orderBy: { displayOrder: 'asc' },
          include: {
            expenses: { where: { paymentStatus: { not: PaymentStatus.CANCELLED } }, select: { amount: true } }
          }
        },
        expenses: {
          where: { paymentStatus: { not: PaymentStatus.CANCELLED } },
          include: {
            scope: { select: { id: true, name: true } },
            category: { select: { name: true } },
            supplier: { select: { name: true } }
          },
          orderBy: { expenseDate: 'desc' }
        }
      }
    });
    const totalBudget = Number(project.totalBudget);
    const totalExpenses = project.expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
    const paidExpenses = project.expenses.filter((e) => e.paymentStatus === PaymentStatus.PAID)
      .reduce((sum, expense) => sum + Number(expense.amount), 0);
    const pendingExpenses = totalExpenses - paidExpenses;
    const activeScopes = project.scopes.filter((scope) => scope.status !== ScopeStatus.CANCELLED);
    const plannedScopeBudget = activeScopes.reduce((sum, scope) => sum + Number(scope.plannedBudget), 0);
    const unscopedExpenses = project.expenses.filter((expense) => !expense.scopeId)
      .reduce((sum, expense) => sum + Number(expense.amount), 0);
    const scopes = project.scopes.map((scope) => {
      const planned = Number(scope.plannedBudget);
      const spent = scope.expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
      return {
        id: scope.id,
        name: scope.name,
        status: scope.status,
        plannedBudget: money(planned),
        totalExpenses: money(spent),
        remainingBudget: money(planned - spent),
        usagePercentage: planned > 0 ? Number(((spent / planned) * 100).toFixed(2)) : 0,
        isOverBudget: spent > planned
      };
    });
    const monthly = new Map<string, number>();
    for (const expense of project.expenses) {
      const key = expense.expenseDate.toISOString().slice(0, 7);
      monthly.set(key, (monthly.get(key) ?? 0) + Number(expense.amount));
    }
    return {
      project: { id: project.id, name: project.name, status: project.status },
      summary: {
        totalBudget: money(totalBudget),
        totalExpenses: money(totalExpenses),
        paidExpenses: money(paidExpenses),
        pendingExpenses: money(pendingExpenses),
        remainingBudget: money(totalBudget - totalExpenses),
        usagePercentage: totalBudget > 0 ? Number(((totalExpenses / totalBudget) * 100).toFixed(2)) : 0,
        plannedScopeBudget: money(plannedScopeBudget),
        unallocatedBudget: money(totalBudget - plannedScopeBudget),
        scopedExpenses: money(totalExpenses - unscopedExpenses),
        unscopedExpenses: money(unscopedExpenses),
        isOverBudget: totalExpenses > totalBudget,
        isScopePlanOverBudget: plannedScopeBudget > totalBudget
      },
      scopes,
      recentExpenses: project.expenses.slice(0, 8),
      expensesByScope: scopes.map((scope) => ({ name: scope.name, value: scope.totalExpenses })),
      expensesByMonth: [...monthly.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, value]) => ({
        month,
        value: money(value)
      }))
    };
  }

  async general(user: AuthUser) {
    const where: Prisma.ProjectWhereInput = {
      archivedAt: null,
      ...(user.role === UserRole.ADMIN ? {} : { OR: [{ ownerId: user.id }, { accesses: { some: { userId: user.id } } }] })
    };
    const projects = await this.prisma.project.findMany({
      where,
      include: {
        owner: { select: { name: true } },
        accesses: { where: { userId: user.id }, select: { permission: true } },
        expenses: { where: { paymentStatus: { not: PaymentStatus.CANCELLED } }, select: { amount: true, expenseDate: true, description: true } },
        scopes: {
          where: { status: { not: ScopeStatus.CANCELLED } },
          include: { expenses: { where: { paymentStatus: { not: PaymentStatus.CANCELLED } }, select: { amount: true } } }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
    const totalBudget = projects.reduce((sum, project) => sum + Number(project.totalBudget), 0);
    const totalExpenses = projects.flatMap((project) => project.expenses).reduce((sum, expense) => sum + Number(expense.amount), 0);
    const overBudgetScopes = projects.flatMap((project) => project.scopes).filter((scope) => {
      const spent = scope.expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
      return spent > Number(scope.plannedBudget);
    }).length;
    return {
      summary: {
        activeProjects: projects.filter((project) => ['PLANNING', 'IN_PROGRESS', 'PAUSED'].includes(project.status)).length,
        totalBudget: money(totalBudget),
        totalExpenses: money(totalExpenses),
        remainingBudget: money(totalBudget - totalExpenses),
        overBudgetScopes
      },
      projects: projects.map((project) => {
        const spent = project.expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
        const budget = Number(project.totalBudget);
        return {
          id: project.id,
          name: project.name,
          owner: project.owner,
          status: project.status,
          totalBudget: money(budget),
          totalExpenses: money(spent),
          remainingBudget: money(budget - spent),
          usagePercentage: budget > 0 ? Number(((spent / budget) * 100).toFixed(2)) : 0,
          permission: user.role === UserRole.ADMIN ? 'ADMIN' : project.ownerId === user.id ? 'OWNER' : project.accesses[0]?.permission
        };
      }),
      recentExpenses: projects.flatMap((project) => project.expenses.map((expense) => ({ ...expense, projectName: project.name })))
        .sort((a, b) => b.expenseDate.getTime() - a.expenseDate.getTime())
        .slice(0, 8)
    };
  }
}
