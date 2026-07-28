import { zodResolver } from '@hookform/resolvers/zod';
import { Edit3, Plus, Power } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { z } from 'zod';
import type { AppDispatch, RootState } from '../app/store';
import {
  Badge,
  Button,
  DialogShell,
  EmptyState,
  ErrorState,
  Field,
  FormGrid,
  LoadingState,
  Page,
  PageHeader,
  Table,
  TableWrap
} from '../components/ui';
import {
  type User,
  useCreateUserMutation,
  useSetUserStatusMutation,
  useUpdateUserMutation,
  useUsersQuery
} from '../features/api/api';
import { updateSessionUser } from '../features/auth/authSlice';
import { formatDate, roleLabel } from '../utils/format';

const createUserSchema = z.object({
  name: z.string().trim().min(3).max(120),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['ADMIN', 'MANAGER', 'VIEWER'])
});
const editUserSchema = z.object({
  name: z.string().trim().min(3).max(120)
});

type CreateUserData = z.infer<typeof createUserSchema>;
type EditUserData = z.infer<typeof editUserSchema>;

const ActionGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;

  ${Button} {
    min-height: 39px;
    padding: 0 13px;
  }
`;

export function AdminUsersPage() {
  const { data, isLoading, isError } = useUsersQuery();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [setStatus, { isLoading: changingStatus }] = useSetUserStatusMutation();

  if (isLoading) return <Page><LoadingState /></Page>;
  if (isError) return <Page><ErrorState /></Page>;

  const users = data?.data ?? [];
  const toggleStatus = async (id: string, currentStatus: string) => {
    const action = currentStatus === 'ACTIVE' ? 'Desativar' : 'Ativar';
    if (window.confirm(`${action} este usuário?`)) {
      await setStatus({ id, status: currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' });
    }
  };

  return (
    <Page>
      <PageHeader>
        <div>
          <h1>Usuários</h1>
          <p>Contas criadas pela administração e seus níveis de acesso.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}><Plus size={17} />Novo usuário</Button>
      </PageHeader>

      {users.length ? (
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Perfil</th>
                <th>Status</th>
                <th>Obras próprias</th>
                <th>Compartilhadas</th>
                <th>Criado em</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td><strong>{user.name}</strong><br /><small>{user.email}</small></td>
                  <td>{roleLabel[user.role]}</td>
                  <td>
                    <Badge $tone={user.status === 'ACTIVE' ? 'success' : 'danger'}>
                      {user.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </td>
                  <td>{user._count?.ownedProjects ?? 0}</td>
                  <td>{user._count?.projectAccesses ?? 0}</td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>
                    <ActionGroup>
                      <Button $variant="secondary" onClick={() => setEditingUser(user)}>
                        <Edit3 size={15} />Editar
                      </Button>
                      <Button
                        $variant={user.status === 'ACTIVE' ? 'danger' : 'secondary'}
                        disabled={changingStatus}
                        onClick={() => toggleStatus(user.id, user.status)}
                      >
                        <Power size={15} />{user.status === 'ACTIVE' ? 'Desativar' : 'Ativar'}
                      </Button>
                    </ActionGroup>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      ) : (
        <EmptyState title="Nenhum usuário">Crie a primeira conta operacional.</EmptyState>
      )}

      {createOpen && <CreateUserDialog close={() => setCreateOpen(false)} />}
      {editingUser && <EditUserDialog user={editingUser} close={() => setEditingUser(null)} />}
    </Page>
  );
}

function CreateUserDialog({ close }: { close: () => void }) {
  const [create, { isLoading, error }] = useCreateUserMutation();
  const { register, handleSubmit, formState: { errors } } = useForm<CreateUserData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { role: 'MANAGER' }
  });
  const submit = async (data: CreateUserData) => {
    try {
      await create(data).unwrap();
      close();
    } catch {
      // A mensagem é exibida no formulário.
    }
  };

  return (
    <DialogShell title="Novo usuário" close={close}>
      <form onSubmit={handleSubmit(submit)}>
        <FormGrid>
          <Field>Nome<input {...register('name')} />{errors.name && <em>Informe o nome completo.</em>}</Field>
          <Field>E-mail<input type="email" {...register('email')} />{errors.email && <em>E-mail inválido.</em>}</Field>
          <Field>Senha inicial<input type="password" {...register('password')} />{errors.password && <em>Mínimo de 8 caracteres.</em>}</Field>
          <Field>
            Perfil
            <select {...register('role')}>
              <option value="MANAGER">GLR</option>
              <option value="VIEWER">Visualizador</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </Field>
        </FormGrid>
        {error && <p style={{ color: 'var(--danger)' }}>Não foi possível criar. O e-mail pode já estar em uso.</p>}
        <Button $wide style={{ marginTop: 22 }} disabled={isLoading}>Criar usuário</Button>
      </form>
    </DialogShell>
  );
}

function EditUserDialog({ user, close }: { user: User; close: () => void }) {
  const dispatch = useDispatch<AppDispatch>();
  const sessionUser = useSelector((state: RootState) => state.auth.user);
  const [updateUser, { isLoading, error }] = useUpdateUserMutation();
  const { register, handleSubmit, formState: { errors } } = useForm<EditUserData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: { name: user.name }
  });
  const submit = async ({ name }: EditUserData) => {
    try {
      const updatedUser = await updateUser({ id: user.id, name }).unwrap();
      if (sessionUser?.id === updatedUser.id) {
        dispatch(updateSessionUser({ name: updatedUser.name }));
      }
      close();
    } catch {
      // A mensagem é exibida no formulário.
    }
  };

  return (
    <DialogShell
      title="Editar usuário"
      description={`Atualize o nome exibido para ${user.email}.`}
      close={close}
    >
      <form onSubmit={handleSubmit(submit)}>
        <Field>
          Nome
          <input autoFocus {...register('name')} />
          {errors.name && <em>Use entre 3 e 120 caracteres.</em>}
        </Field>
        {error && <p style={{ color: 'var(--danger)' }}>Não foi possível atualizar o usuário.</p>}
        <Button $wide style={{ marginTop: 22 }} disabled={isLoading}>
          {isLoading ? 'Salvando…' : 'Salvar alterações'}
        </Button>
      </form>
    </DialogShell>
  );
}
