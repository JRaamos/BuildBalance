import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PaymentMethod, PaymentStatus, Prisma, UserRole } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../common/auth.types';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectAuthorizationService } from '../projects/project-authorization.service';
import { CreateExpenseDto, UpdateExpenseDto } from './expenses.dto';

@Injectable()
export class ExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorization: ProjectAuthorizationService,
    private readonly audit: AuditService
  ) {}

  private async validateRelations(user: AuthUser, projectId: string, scopeId?: string, categoryId?: string, supplierId?: string) {
    if (scopeId) {
      const scope = await this.prisma.scope.findUnique({ where: { id: scopeId }, select: { projectId: true } });
      if (!scope || scope.projectId !== projectId) {
        throw new BadRequestException({ code: 'INVALID_PROJECT_SCOPE', message: 'O escopo não pertence a esta obra' });
      }
    }
    if (categoryId && !(await this.prisma.category.findFirst({ where: { id: categoryId, active: true } }))) {
      throw new BadRequestException({ code: 'CATEGORY_NOT_FOUND', message: 'Categoria não encontrada' });
    }
    if (supplierId) {
      const supplier = await this.prisma.supplier.findUnique({ where: { id: supplierId } });
      if (!supplier || (user.role !== UserRole.ADMIN && supplier.ownerId !== user.id)) {
        throw new BadRequestException({ code: 'SUPPLIER_NOT_FOUND', message: 'Fornecedor não encontrado' });
      }
    }
  }

  async create(user: AuthUser, projectId: string, dto: CreateExpenseDto) {
    await this.authorization.assertEdit(user, projectId);
    await this.validateRelations(user, projectId, dto.scopeId, dto.categoryId, dto.supplierId);
    const expense = await this.prisma.expense.create({
      data: {
        projectId,
        scopeId: dto.scopeId,
        description: dto.description.trim(),
        amount: new Prisma.Decimal(dto.amount),
        expenseDate: new Date(dto.expenseDate),
        categoryId: dto.categoryId,
        supplierId: dto.supplierId,
        paymentMethod: dto.paymentMethod,
        paymentStatus: dto.paymentStatus,
        documentNumber: dto.documentNumber?.trim(),
        notes: dto.notes?.trim(),
        createdById: user.id
      },
      include: { scope: true, category: true, supplier: true }
    });
    await this.audit.record(user.id, 'EXPENSE_CREATED', 'Expense', expense.id, { projectId, amount: dto.amount });
    return expense;
  }

  async list(user: AuthUser, projectId: string, query: Record<string, string | undefined>) {
    await this.authorization.assertView(user, projectId);
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const orderField = ['expenseDate', 'amount', 'description', 'createdAt'].includes(query.sortBy ?? '') ? query.sortBy! : 'expenseDate';
    const where: Prisma.ExpenseWhereInput = {
      projectId,
      ...(query.search && { description: { contains: query.search, mode: 'insensitive' } }),
      ...(query.scopeId === 'none' ? { scopeId: null } : query.scopeId ? { scopeId: query.scopeId } : {}),
      ...(query.categoryId && { categoryId: query.categoryId }),
      ...(query.supplierId && { supplierId: query.supplierId }),
      ...(query.paymentStatus && { paymentStatus: query.paymentStatus as PaymentStatus }),
      ...(query.paymentMethod && { paymentMethod: query.paymentMethod as PaymentMethod }),
      ...((query.startDate || query.endDate) && {
        expenseDate: {
          ...(query.startDate && { gte: new Date(query.startDate) }),
          ...(query.endDate && { lte: new Date(query.endDate) })
        }
      })
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.expense.findMany({
        where,
        include: {
          scope: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
          supplier: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } }
        },
        orderBy: { [orderField]: query.sortOrder === 'asc' ? 'asc' : 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      this.prisma.expense.count({ where })
    ]);
    return { data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  private async find(id: string) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
      include: { scope: true, category: true, supplier: true }
    });
    if (!expense) throw new NotFoundException({ code: 'EXPENSE_NOT_FOUND', message: 'Gasto não encontrado' });
    return expense;
  }

  async get(user: AuthUser, id: string) {
    const expense = await this.find(id);
    await this.authorization.assertView(user, expense.projectId);
    return expense;
  }

  async update(user: AuthUser, id: string, dto: UpdateExpenseDto) {
    const expense = await this.find(id);
    await this.authorization.assertEdit(user, expense.projectId);
    await this.validateRelations(user, expense.projectId, dto.scopeId, dto.categoryId, dto.supplierId);
    const updated = await this.prisma.expense.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.description && { description: dto.description.trim() }),
        ...(dto.amount && { amount: new Prisma.Decimal(dto.amount) }),
        ...(dto.expenseDate && { expenseDate: new Date(dto.expenseDate) }),
        updatedById: user.id
      },
      include: { scope: true, category: true, supplier: true }
    });
    await this.audit.record(user.id, 'EXPENSE_UPDATED', 'Expense', id, { projectId: expense.projectId });
    return updated;
  }

  async cancel(user: AuthUser, id: string) {
    const expense = await this.find(id);
    await this.authorization.assertEdit(user, expense.projectId);
    await this.prisma.expense.update({
      where: { id },
      data: { paymentStatus: PaymentStatus.CANCELLED, updatedById: user.id }
    });
    await this.audit.record(user.id, 'EXPENSE_CANCELLED', 'Expense', id, { projectId: expense.projectId });
    return { message: 'Gasto cancelado e removido dos cálculos financeiros' };
  }
}
