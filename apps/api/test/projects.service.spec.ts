import { BadRequestException } from '@nestjs/common';
import { ProjectStatus, UserRole } from '@prisma/client';
import { ProjectsService } from '../src/projects/projects.service';

describe('ProjectsService lifecycle', () => {
  const transaction = {
    auditLog: { deleteMany: jest.fn() },
    projectAccess: { deleteMany: jest.fn() },
    expense: { deleteMany: jest.fn() },
    scope: { deleteMany: jest.fn() },
    project: { delete: jest.fn() }
  };
  const prisma = {
    project: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn()
    },
    $transaction: jest.fn()
  } as any;
  const authorization = { assertDelete: jest.fn() } as any;
  const audit = { record: jest.fn() } as any;
  const service = new ProjectsService(prisma, authorization, audit);
  const user = {
    id: 'owner-1',
    name: 'Proprietário',
    email: 'owner@test.local',
    role: UserRole.MANAGER
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation((callback: (client: typeof transaction) => unknown) => callback(transaction));
  });

  it('finaliza a obra preservando os dados existentes', async () => {
    const current = { id: 'project-1', status: ProjectStatus.IN_PROGRESS };
    const completed = { ...current, status: ProjectStatus.COMPLETED };
    prisma.project.findUniqueOrThrow.mockResolvedValue(current);
    prisma.project.update.mockResolvedValue(completed);

    await expect(service.complete(user, 'project-1')).resolves.toEqual(completed);

    expect(authorization.assertDelete).toHaveBeenCalledWith(user, 'project-1');
    expect(prisma.project.update).toHaveBeenCalledWith({
      where: { id: 'project-1' },
      data: { status: ProjectStatus.COMPLETED }
    });
    expect(audit.record).toHaveBeenCalledWith(user.id, 'PROJECT_COMPLETED', 'Project', 'project-1');
  });

  it('exige o nome exato antes da exclusão permanente', async () => {
    prisma.project.findUnique.mockResolvedValue({
      id: 'project-1',
      name: 'Reforma da cozinha',
      accesses: [],
      expenses: []
    });

    await expect(
      service.deletePermanently(user, 'project-1', { confirmation: 'Outro nome' })
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('apaga somente os registros vinculados à obra dentro de uma transação', async () => {
    prisma.project.findUnique.mockResolvedValue({
      id: 'project-1',
      name: 'Reforma da cozinha',
      accesses: [{ id: 'access-1' }],
      expenses: [{ id: 'expense-1' }]
    });

    await expect(
      service.deletePermanently(user, 'project-1', { confirmation: 'Reforma da cozinha' })
    ).resolves.toEqual({ message: 'Obra e registros excluídos permanentemente' });

    expect(transaction.auditLog.deleteMany).toHaveBeenCalled();
    expect(transaction.projectAccess.deleteMany).toHaveBeenCalledWith({ where: { projectId: 'project-1' } });
    expect(transaction.expense.deleteMany).toHaveBeenCalledWith({ where: { projectId: 'project-1' } });
    expect(transaction.scope.deleteMany).toHaveBeenCalledWith({ where: { projectId: 'project-1' } });
    expect(transaction.project.delete).toHaveBeenCalledWith({ where: { id: 'project-1' } });
  });
});
