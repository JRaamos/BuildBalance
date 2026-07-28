import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PaymentStatus, Prisma, ProjectStatus, UserRole } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../common/auth.types';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectAuthorizationService } from './project-authorization.service';
import { CreateProjectDto, DeleteProjectDto, UpdateProjectDto } from './projects.dto';

const activeExpense = { paymentStatus: { not: PaymentStatus.CANCELLED } };
const number = (value: Prisma.Decimal | number | string) => Number(value);
const money = (value: number) => value.toFixed(2);

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorization: ProjectAuthorizationService,
    private readonly audit: AuditService
  ) {}

  async create(user: AuthUser, dto: CreateProjectDto) {
    const project = await this.prisma.project.create({
      data: {
        ownerId: user.id,
        name: dto.name.trim(),
        description: dto.description?.trim(),
        totalBudget: new Prisma.Decimal(dto.totalBudget),
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        expectedEndDate: dto.expectedEndDate ? new Date(dto.expectedEndDate) : undefined,
        status: dto.status ?? ProjectStatus.PLANNING,
        notes: dto.notes?.trim()
      },
      include: { owner: { select: { id: true, name: true } } }
    });
    await this.audit.record(user.id, 'PROJECT_CREATED', 'Project', project.id, { totalBudget: dto.totalBudget });
    return project;
  }

  async list(user: AuthUser, query: Record<string, string | undefined>) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const accessWhere: Prisma.ProjectWhereInput = user.role === UserRole.ADMIN
      ? query.view === 'all' ? {} : { ownerId: user.id }
      : { OR: [{ ownerId: user.id }, { accesses: { some: { userId: user.id } } }] };
    const where: Prisma.ProjectWhereInput = {
      archivedAt: null,
      ...accessWhere,
      ...(query.search && { name: { contains: query.search, mode: 'insensitive' } }),
      ...(query.status && { status: query.status as ProjectStatus }),
      ...(user.role === UserRole.ADMIN && query.ownerId && { ownerId: query.ownerId })
    };
    const [projects, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where,
        include: {
          owner: { select: { id: true, name: true, email: true } },
          accesses: { where: { userId: user.id }, select: { permission: true } },
          expenses: { where: activeExpense, select: { amount: true } }
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      this.prisma.project.count({ where })
    ]);
    return {
      data: projects.map((project) => {
        const totalExpenses = project.expenses.reduce((sum, item) => sum + number(item.amount), 0);
        const budget = number(project.totalBudget);
        const permission = project.ownerId === user.id ? 'OWNER' : user.role === UserRole.ADMIN ? 'VIEW' : project.accesses[0]?.permission;
        const { expenses, accesses, ...rest } = project;
        void expenses;
        void accesses;
        return {
          ...rest,
          access: { isOwner: project.ownerId === user.id, permission },
          financialSummary: {
            totalBudget: money(budget),
            totalExpenses: money(totalExpenses),
            remainingBudget: money(budget - totalExpenses),
            usagePercentage: budget > 0 ? Number(((totalExpenses / budget) * 100).toFixed(2)) : 0
          }
        };
      }),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    };
  }

  async get(user: AuthUser, id: string) {
    const permission = await this.authorization.assertView(user, id);
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        expenses: { where: activeExpense, select: { amount: true } },
        scopes: { where: { status: { not: 'CANCELLED' } }, select: { plannedBudget: true } }
      }
    });
    if (!project) throw new NotFoundException({ code: 'PROJECT_NOT_FOUND', message: 'Obra não encontrada' });
    const totalExpenses = project.expenses.reduce((sum, item) => sum + number(item.amount), 0);
    const totalBudget = number(project.totalBudget);
    const planned = project.scopes.reduce((sum, item) => sum + number(item.plannedBudget), 0);
    const { expenses, scopes, ...rest } = project;
    void expenses;
    void scopes;
    return {
      ...rest,
      access: { isOwner: project.ownerId === user.id, permission },
      financialSummary: {
        totalBudget: money(totalBudget),
        totalExpenses: money(totalExpenses),
        remainingBudget: money(totalBudget - totalExpenses),
        usagePercentage: totalBudget > 0 ? Number(((totalExpenses / totalBudget) * 100).toFixed(2)) : 0,
        plannedScopeBudget: money(planned),
        unallocatedBudget: money(totalBudget - planned)
      }
    };
  }

  async update(user: AuthUser, id: string, dto: UpdateProjectDto) {
    await this.authorization.assertEdit(user, id);
    const before = await this.prisma.project.findUniqueOrThrow({ where: { id } });
    const project = await this.prisma.project.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.name && { name: dto.name.trim() }),
        ...(dto.totalBudget && { totalBudget: new Prisma.Decimal(dto.totalBudget) }),
        ...(dto.startDate && { startDate: new Date(dto.startDate) }),
        ...(dto.expectedEndDate && { expectedEndDate: new Date(dto.expectedEndDate) })
      }
    });
    if (dto.totalBudget && dto.totalBudget !== before.totalBudget.toFixed(2)) {
      await this.audit.record(user.id, 'PROJECT_BUDGET_CHANGED', 'Project', id, {
        from: before.totalBudget.toFixed(2), to: dto.totalBudget
      });
    }
    return project;
  }

  async archive(user: AuthUser, id: string) {
    await this.authorization.assertDelete(user, id);
    await this.prisma.project.update({ where: { id }, data: { archivedAt: new Date() } });
    await this.audit.record(user.id, 'PROJECT_ARCHIVED', 'Project', id);
    return { message: 'Obra arquivada com sucesso' };
  }

  async complete(user: AuthUser, id: string) {
    await this.authorization.assertDelete(user, id);
    const current = await this.prisma.project.findUniqueOrThrow({ where: { id } });
    if (current.status === ProjectStatus.COMPLETED) return current;

    const project = await this.prisma.project.update({
      where: { id },
      data: { status: ProjectStatus.COMPLETED }
    });
    await this.audit.record(user.id, 'PROJECT_COMPLETED', 'Project', id);
    return project;
  }

  async deletePermanently(user: AuthUser, id: string, dto: DeleteProjectDto) {
    await this.authorization.assertDelete(user, id);
    const project = await this.prisma.project.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        accesses: { select: { id: true } },
        expenses: { select: { id: true } }
      }
    });
    if (!project) throw new NotFoundException({ code: 'PROJECT_NOT_FOUND', message: 'Obra não encontrada' });
    if (dto.confirmation.trim() !== project.name) {
      throw new BadRequestException({
        code: 'PROJECT_CONFIRMATION_MISMATCH',
        message: 'Digite o nome exato da obra para confirmar a exclusão'
      });
    }

    const accessIds = project.accesses.map(({ id: accessId }) => accessId);
    const expenseIds = project.expenses.map(({ id: expenseId }) => expenseId);

    await this.prisma.$transaction(async (transaction) => {
      await transaction.auditLog.deleteMany({
        where: {
          OR: [
            { entityType: 'Project', entityId: id },
            ...(accessIds.length ? [{ entityType: 'ProjectAccess', entityId: { in: accessIds } }] : []),
            ...(expenseIds.length ? [{ entityType: 'Expense', entityId: { in: expenseIds } }] : []),
            { metadata: { path: ['projectId'], equals: id } }
          ]
        }
      });
      await transaction.projectAccess.deleteMany({ where: { projectId: id } });
      await transaction.expense.deleteMany({ where: { projectId: id } });
      await transaction.scope.deleteMany({ where: { projectId: id } });
      await transaction.project.delete({ where: { id } });
    });

    return { message: 'Obra e registros excluídos permanentemente' };
  }
}
