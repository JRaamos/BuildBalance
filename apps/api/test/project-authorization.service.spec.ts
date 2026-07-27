import { NotFoundException } from '@nestjs/common';
import { ProjectPermission, UserRole } from '@prisma/client';
import { ProjectAuthorizationService } from '../src/projects/project-authorization.service';

describe('ProjectAuthorizationService', () => {
  const prisma = { project: { findFirst: jest.fn() } } as any;
  const service = new ProjectAuthorizationService(prisma);
  const manager = { id: 'user-1', name: 'Gestor', email: 'gestor@test.local', role: UserRole.MANAGER };

  beforeEach(() => jest.clearAllMocks());

  it('nega sem vazar a existência da obra quando o usuário não possui acesso', async () => {
    prisma.project.findFirst.mockResolvedValue({ ownerId: 'other', accesses: [] });
    await expect(service.assertView(manager, 'project-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('permite visualização, mas nega edição para compartilhamento VIEW', async () => {
    prisma.project.findFirst.mockResolvedValue({ ownerId: 'other', accesses: [{ permission: ProjectPermission.VIEW }] });
    await expect(service.assertView(manager, 'project-1')).resolves.toBe(ProjectPermission.VIEW);
    await expect(service.assertEdit(manager, 'project-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('permite edição para proprietário e para compartilhamento EDIT', async () => {
    prisma.project.findFirst.mockResolvedValueOnce({ ownerId: manager.id, accesses: [] });
    await expect(service.assertEdit(manager, 'project-1')).resolves.toBe('OWNER');
    prisma.project.findFirst.mockResolvedValueOnce({ ownerId: 'other', accesses: [{ permission: ProjectPermission.EDIT }] });
    await expect(service.assertEdit(manager, 'project-1')).resolves.toBe(ProjectPermission.EDIT);
  });

  it('administrador acompanha obras de terceiros sem poder alterá-las', async () => {
    prisma.project.findFirst.mockResolvedValue({ ownerId: 'other', accesses: [] });
    const admin = { ...manager, role: UserRole.ADMIN };
    await expect(service.assertView(admin, 'project-1')).resolves.toBe(ProjectPermission.VIEW);
    await expect(service.assertEdit(admin, 'project-1')).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.assertDelete(admin, 'project-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('administrador pode gerenciar as obras das quais é proprietário', async () => {
    prisma.project.findFirst.mockResolvedValue({ ownerId: manager.id, accesses: [] });
    await expect(service.assertEdit({ ...manager, role: UserRole.ADMIN }, 'project-1')).resolves.toBe('OWNER');
  });
});
