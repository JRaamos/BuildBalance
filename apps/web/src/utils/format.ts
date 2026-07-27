export const formatMoney = (value?: string | number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value ?? 0));
export const formatDate = (value?: string) =>
  value ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(value)) : '—';
export const roleLabel: Record<string, string> = { ADMIN: 'Administrador', MANAGER: 'Gestor', VIEWER: 'Visualizador' };
export const statusLabel: Record<string, string> = {
  PLANNING: 'Planejamento', IN_PROGRESS: 'Em andamento', PAUSED: 'Pausada', COMPLETED: 'Concluída',
  ACTIVE: 'Ativo', INACTIVE: 'Inativo', PAID: 'Pago', PENDING: 'Pendente', CANCELLED: 'Cancelado',
  VIEW: 'Visualização', EDIT: 'Edição', OWNER: 'Proprietário', ADMIN: 'Administrador'
};
