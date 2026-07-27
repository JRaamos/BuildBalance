import { PaymentStatus, Prisma, ProjectStatus, ScopeStatus, UserRole } from '@prisma/client';
import { DashboardService } from '../src/dashboard/dashboard.service';

describe('DashboardService', () => {
  const prisma = { project: { findUniqueOrThrow: jest.fn() } } as any;
  const authorization = { assertView: jest.fn() } as any;
  const service = new DashboardService(prisma, authorization);
  const user = { id: 'owner', name: 'Gestor', email: 'gestor@test.local', role: UserRole.MANAGER };

  it('calcula gastos válidos, pendências, fora de escopo e excesso sem persistir totais', async () => {
    prisma.project.findUniqueOrThrow.mockResolvedValue({
      id: 'project-1',
      name: 'Reforma',
      status: ProjectStatus.IN_PROGRESS,
      totalBudget: new Prisma.Decimal('1000.00'),
      scopes: [{
        id: 'scope-1',
        name: 'Elétrica',
        status: ScopeStatus.ACTIVE,
        plannedBudget: new Prisma.Decimal('400.00'),
        expenses: [{ amount: new Prisma.Decimal('450.00') }]
      }],
      expenses: [
        { id: 'e1', amount: new Prisma.Decimal('450.00'), paymentStatus: PaymentStatus.PAID, scopeId: 'scope-1', expenseDate: new Date('2026-01-10') },
        { id: 'e2', amount: new Prisma.Decimal('100.00'), paymentStatus: PaymentStatus.PENDING, scopeId: null, expenseDate: new Date('2026-01-12') }
      ]
    });
    const result = await service.project(user, 'project-1');
    expect(result.summary.totalExpenses).toBe('550.00');
    expect(result.summary.paidExpenses).toBe('450.00');
    expect(result.summary.pendingExpenses).toBe('100.00');
    expect(result.summary.unscopedExpenses).toBe('100.00');
    expect(result.summary.remainingBudget).toBe('450.00');
    expect(result.scopes[0].isOverBudget).toBe(true);
  });
});
