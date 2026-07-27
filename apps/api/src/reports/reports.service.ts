import { Injectable } from '@nestjs/common';
import { PaymentStatus, Prisma } from '@prisma/client';
import { AuthUser } from '../common/auth.types';
import { DashboardService } from '../dashboard/dashboard.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectAuthorizationService } from '../projects/project-authorization.service';

@Injectable()
export class ReportsService {
  constructor(
    private readonly dashboard: DashboardService,
    private readonly prisma: PrismaService,
    private readonly authorization: ProjectAuthorizationService
  ) {}

  financial(user: AuthUser, projectId: string) {
    return this.dashboard.project(user, projectId);
  }

  async byScope(user: AuthUser, projectId: string) {
    const data = await this.dashboard.project(user, projectId);
    return { project: data.project, scopes: data.scopes, unscopedExpenses: data.summary.unscopedExpenses };
  }

  async byPeriod(user: AuthUser, projectId: string, startDate?: string, endDate?: string) {
    await this.authorization.assertView(user, projectId);
    const where: Prisma.ExpenseWhereInput = {
      projectId,
      paymentStatus: { not: PaymentStatus.CANCELLED },
      ...((startDate || endDate) && {
        expenseDate: {
          ...(startDate && { gte: new Date(`${startDate}T00:00:00.000Z`) }),
          ...(endDate && { lte: new Date(`${endDate}T23:59:59.999Z`) })
        }
      })
    };
    const expenses = await this.prisma.expense.findMany({
      where,
      include: {
        scope: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } }
      },
      orderBy: { expenseDate: 'desc' }
    });
    const total = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
    return { period: { startDate, endDate }, total: total.toFixed(2), expenses };
  }
}
