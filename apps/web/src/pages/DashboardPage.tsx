import {
  ArrowUpRight,
  Building2,
  CircleDollarSign,
  Gauge,
  TriangleAlert
} from 'lucide-react';
import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import styled, { keyframes } from 'styled-components';
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Grid,
  LoadingState,
  Metric,
  Page,
  PageHeader,
  Surface
} from '../components/ui';
import type { DashboardData } from '../features/api/api';
import { useDashboardQuery, useProjectDashboardQuery } from '../features/api/api';
import { theme } from '../styles/theme';
import { formatDate, formatMoney, statusLabel } from '../utils/format';

const reveal = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;

const growBar = keyframes`
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
`;

const ProjectToolbar = styled(Surface)`
  display: grid;
  grid-template-columns: minmax(280px, 1.15fr) minmax(250px, 1fr) auto;
  align-items: center;
  gap: 24px;
  padding: 18px 20px;
  margin-bottom: 22px;
  overflow: visible;

  @media (max-width: 920px) {
    grid-template-columns: 1fr auto;
  }

  @media (max-width: 620px) {
    grid-template-columns: 1fr;
    align-items: stretch;
  }
`;

const ProjectSelector = styled.label`
  display: grid;
  gap: 7px;
  color: var(--muted);
  font-size: .72rem;
  font-weight: 750;
  letter-spacing: .055em;
  text-transform: uppercase;

  select {
    width: 100%;
    min-height: 48px;
    padding: 0 42px 0 14px;
    border: 1px solid var(--line-strong);
    border-radius: 12px;
    background: var(--surface);
    color: var(--navy);
    font: 700 .96rem var(--font-body);
    outline: none;
    cursor: pointer;
    transition: border-color .15s ease, box-shadow .15s ease;
  }

  select:focus {
    border-color: var(--teal);
    box-shadow: 0 0 0 4px var(--focus-ring);
  }
`;

const ProjectContext = styled.div`
  min-width: 0;

  span {
    display: block;
    color: var(--muted);
    font-size: .72rem;
    font-weight: 700;
    letter-spacing: .04em;
    text-transform: uppercase;
  }

  strong {
    display: block;
    margin-top: 6px;
    color: var(--navy);
    font-size: .94rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  small {
    display: block;
    margin-top: 4px;
    color: var(--muted);
  }

  @media (max-width: 920px) {
    grid-column: 1 / -1;
    grid-row: 2;
  }
`;

const DashboardContent = styled.div`
  animation: ${reveal} .28s ease both;
`;

const MetricHead = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;

  svg {
    color: var(--teal);
  }
`;

const ProjectMetricName = styled.strong`
  max-width: 100%;
  font-size: clamp(1.25rem, 2vw, 1.7rem) !important;
  line-height: 1.08 !important;
  overflow-wrap: anywhere;
`;

const AnalyticsGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(300px, .8fr);
  gap: 22px;
  margin-top: 38px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const Panel = styled(Surface)`
  min-width: 0;
  padding: 22px;

  > header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 18px;
  }

  h2 {
    margin: 0;
    color: var(--navy);
    font-size: 1.08rem;
  }

  header p {
    margin: 5px 0 0;
    color: var(--muted);
    font-size: .8rem;
    line-height: 1.5;
  }
`;

const ChartFrame = styled.div`
  width: 100%;
  height: 292px;
`;

const BudgetValue = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  margin-top: 4px;

  strong {
    color: var(--navy);
    font: 650 clamp(2.4rem, 5vw, 3.7rem)/1 var(--font-display);
    letter-spacing: -.055em;
  }

  span {
    color: var(--muted);
    font-size: .78rem;
    text-align: right;
  }
`;

const BudgetRail = styled.div`
  height: 12px;
  margin: 22px 0;
  overflow: hidden;
  border-radius: 999px;
  background: var(--canvas-deep);
  box-shadow: inset 0 1px 2px color-mix(in srgb, var(--navy) 8%, transparent);
`;

const BudgetFill = styled.div<{ $value: number; $danger: boolean }>`
  width: ${({ $value }) => Math.min(100, Math.max(0, $value))}%;
  height: 100%;
  border-radius: inherit;
  transform-origin: left;
  background: ${({ $danger }) => $danger ? 'var(--danger)' : 'var(--gradient-primary)'};
  animation: ${growBar} .7s cubic-bezier(.2, .8, .2, 1) both;
`;

const BudgetDetails = styled.dl`
  display: grid;
  gap: 0;
  margin: 0;

  div {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    padding: 13px 0;
    border-top: 1px solid var(--line);
  }

  dt {
    color: var(--muted);
    font-size: .8rem;
  }

  dd {
    margin: 0;
    color: var(--ink);
    font-size: .86rem;
    font-weight: 750;
  }
`;

const ScopeList = styled.div`
  display: grid;
  gap: 18px;
`;

const ScopeItem = styled.div`
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 9px;
  }

  strong {
    color: var(--ink);
    font-size: .86rem;
  }

  span {
    color: var(--muted);
    font-size: .75rem;
    font-weight: 700;
  }
`;

const ScopeRail = styled.div`
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--canvas-deep);
`;

const ScopeFill = styled.div<{ $value: number; $danger: boolean }>`
  width: ${({ $value }) => Math.min(100, Math.max(0, $value))}%;
  height: 100%;
  border-radius: inherit;
  transform-origin: left;
  background: ${({ $danger }) => $danger ? 'var(--danger)' : 'var(--teal)'};
  animation: ${growBar} .65s cubic-bezier(.2, .8, .2, 1) both;
`;

const RecentList = styled.div`
  margin: 0 -22px -22px;

  a {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 18px;
    padding: 15px 22px;
    border-top: 1px solid var(--line);
    transition: background .15s ease;
  }

  a:hover {
    background: var(--teal-subtle);
  }

  strong {
    display: block;
    color: var(--ink);
    font-size: .86rem;
  }

  small {
    display: block;
    margin-top: 4px;
    color: var(--muted);
  }

  b {
    color: var(--navy);
    font-size: .88rem;
    white-space: nowrap;
  }
`;

const monthFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit' });
const formatMonth = (month: string) => monthFormatter.format(new Date(`${month}-01T12:00:00`));

export function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    data: portfolio,
    isLoading: portfolioLoading,
    isError: portfolioError
  } = useDashboardQuery();

  const projects = portfolio?.projects ?? [];
  const requestedProjectId = searchParams.get('project');
  const selectedProject = projects.find((project) => project.id === requestedProjectId) ?? projects[0];
  const selectedProjectId = selectedProject?.id ?? '';

  const {
    data: dashboard,
    isLoading: dashboardLoading,
    isFetching: dashboardFetching,
    isError: dashboardError
  } = useProjectDashboardQuery(selectedProjectId, { skip: !selectedProjectId });

  useEffect(() => {
    if (selectedProjectId && requestedProjectId !== selectedProjectId) {
      setSearchParams({ project: selectedProjectId }, { replace: true });
    }
  }, [requestedProjectId, selectedProjectId, setSearchParams]);

  if (portfolioLoading) return <Page><LoadingState /></Page>;
  if (portfolioError || !portfolio) return <Page><ErrorState /></Page>;

  if (!projects.length) {
    return (
      <Page>
        <PageHeader>
          <div>
            <h1>Dashboard da obra</h1>
            <p>Escolha uma obra para acompanhar orçamento, escopos e gastos.</p>
          </div>
        </PageHeader>
        <EmptyState title="Nenhuma obra disponível">
          Crie sua primeira obra ou solicite acesso para começar o acompanhamento.
        </EmptyState>
      </Page>
    );
  }

  const changeProject = (projectId: string) => {
    setSearchParams({ project: projectId }, { replace: true });
  };

  const projectStatus = statusLabel[selectedProject.status] ?? selectedProject.status;
  const projectPermission = statusLabel[selectedProject.permission ?? ''] ?? selectedProject.permission;
  const tracking = selectedProject.permission === 'ADMIN';
  const trackingQuery = tracking ? '?tracking=1' : '';

  return (
    <Page>
      <PageHeader>
        <div>
          <h1>Dashboard da obra</h1>
          <p>Valores e indicadores exibidos somente para a obra selecionada.</p>
        </div>
        <Badge $tone={dashboardFetching ? 'neutral' : 'success'}>
          {dashboardFetching ? 'Atualizando…' : 'Atualizado agora'}
        </Badge>
      </PageHeader>

      <ProjectToolbar>
        <ProjectSelector>
          Obra em análise
          <select
            value={selectedProjectId}
            onChange={(event) => changeProject(event.target.value)}
            aria-label="Selecionar obra da dashboard"
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
        </ProjectSelector>
        <ProjectContext>
          <span>Contexto atual</span>
          <strong>{selectedProject.owner.name} · {projectStatus}</strong>
          <small>{projectPermission ? `Acesso: ${projectPermission}` : 'Obra sob sua responsabilidade'}</small>
        </ProjectContext>
        <Button as={Link} to={`/projects/${selectedProjectId}${trackingQuery}`} $variant="secondary">
          Abrir obra <ArrowUpRight size={17} />
        </Button>
      </ProjectToolbar>

      {dashboardError ? (
        <ErrorState message="Não foi possível carregar os indicadores desta obra." />
      ) : dashboardLoading || !dashboard ? (
        <LoadingState />
      ) : (
        <DashboardContent key={selectedProjectId}>
          <ProjectDashboard
            dashboard={dashboard}
            projectName={selectedProject.name}
            ownerName={selectedProject.owner.name}
            projectStatus={projectStatus}
            projectId={selectedProjectId}
            tracking={tracking}
          />
        </DashboardContent>
      )}
    </Page>
  );
}

function ProjectDashboard({
  dashboard,
  projectName,
  ownerName,
  projectStatus,
  projectId,
  tracking
}: {
  dashboard: DashboardData;
  projectName: string;
  ownerName: string;
  projectStatus: string;
  projectId: string;
  tracking: boolean;
}) {
  const summary = dashboard.summary;
  const usagePercentage = summary.usagePercentage ?? 0;
  const overBudgetScopes = dashboard.scopes?.filter((scope) => scope.isOverBudget).length ?? 0;
  const monthlyExpenses = (dashboard.expensesByMonth ?? []).map((item) => ({
    month: formatMonth(item.month),
    value: Number(item.value)
  }));

  return (
    <>
      <Grid>
        <Metric>
          <div>
            <MetricHead><span>Obra selecionada</span><Building2 size={20} /></MetricHead>
            <ProjectMetricName>{projectName}</ProjectMetricName>
            <small>{ownerName} · {projectStatus}</small>
          </div>
        </Metric>
        <Metric>
          <div>
            <MetricHead><span>Orçamento da obra</span><CircleDollarSign size={20} /></MetricHead>
            <strong>{formatMoney(summary.totalBudget)}</strong>
            <small>{usagePercentage.toFixed(1)}% já comprometido</small>
          </div>
        </Metric>
        <Metric>
          <div>
            <MetricHead><span>Saldo disponível</span><Gauge size={20} /></MetricHead>
            <strong style={{ color: summary.isOverBudget ? 'var(--danger)' : undefined }}>
              {formatMoney(summary.remainingBudget)}
            </strong>
            <small>{formatMoney(summary.totalExpenses)} em gastos válidos</small>
          </div>
        </Metric>
        <Metric>
          <div>
            <MetricHead><span>Escopos acima do limite</span><TriangleAlert size={20} /></MetricHead>
            <strong>{overBudgetScopes}</strong>
            <small>de {dashboard.scopes?.length ?? 0} escopos acompanhados</small>
          </div>
        </Metric>
      </Grid>

      <AnalyticsGrid>
        <Panel>
          <header>
            <div>
              <h2>Evolução mensal dos gastos</h2>
              <p>Somente lançamentos válidos da obra {projectName}.</p>
            </div>
          </header>
          {monthlyExpenses.length ? (
            <ChartFrame>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyExpenses} margin={{ top: 12, right: 12, left: 6, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dashboard-spend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor={theme.colors.primary} stopOpacity=".32" />
                      <stop offset="1" stopColor={theme.colors.primary} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke={theme.colors.chartGrid} strokeDasharray="4 5" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: theme.colors.textMuted, fontSize: 12 }}
                  />
                  <YAxis
                    width={68}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: theme.colors.textMuted, fontSize: 12 }}
                    tickFormatter={(value) => `${Math.round(Number(value) / 1000)} mil`}
                  />
                  <Tooltip
                    formatter={(value) => [formatMoney(Number(value)), 'Gasto']}
                    contentStyle={{
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: 12,
                      boxShadow: theme.shadows.sm
                    }}
                  />
                  <Area
                    dataKey="value"
                    name="Gasto"
                    type="monotone"
                    stroke={theme.colors.primary}
                    strokeWidth={3}
                    fill="url(#dashboard-spend)"
                    activeDot={{ r: 5, strokeWidth: 3, stroke: theme.colors.surface }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartFrame>
          ) : (
            <EmptyState title="Sem histórico mensal">
              Os lançamentos desta obra formarão o gráfico automaticamente.
            </EmptyState>
          )}
        </Panel>

        <Panel>
          <header>
            <div>
              <h2>Situação do orçamento</h2>
              <p>Quanto do valor aprovado já está comprometido.</p>
            </div>
          </header>
          <BudgetValue>
            <strong>{usagePercentage.toFixed(1)}%</strong>
            <span>{summary.isOverBudget ? 'Orçamento excedido' : 'do orçamento utilizado'}</span>
          </BudgetValue>
          <BudgetRail>
            <BudgetFill $value={usagePercentage} $danger={Boolean(summary.isOverBudget)} />
          </BudgetRail>
          <BudgetDetails>
            <div><dt>Orçamento aprovado</dt><dd>{formatMoney(summary.totalBudget)}</dd></div>
            <div><dt>Total comprometido</dt><dd>{formatMoney(summary.totalExpenses)}</dd></div>
            <div><dt>Total pago</dt><dd>{formatMoney(summary.paidExpenses)}</dd></div>
            <div><dt>Total pendente</dt><dd>{formatMoney(summary.pendingExpenses)}</dd></div>
          </BudgetDetails>
        </Panel>
      </AnalyticsGrid>

      <AnalyticsGrid>
        <Panel>
          <header>
            <div>
              <h2>Uso do orçamento por escopo</h2>
              <p>Percentual consumido em cada frente da obra selecionada.</p>
            </div>
          </header>
          {dashboard.scopes?.length ? (
            <ScopeList>
              {dashboard.scopes.map((scope) => (
                <ScopeItem key={scope.id}>
                  <header>
                    <strong>{scope.name}</strong>
                    <span>
                      {scope.usagePercentage.toFixed(1)}% · {formatMoney(scope.totalExpenses)}
                    </span>
                  </header>
                  <ScopeRail>
                    <ScopeFill $value={scope.usagePercentage} $danger={scope.isOverBudget} />
                  </ScopeRail>
                </ScopeItem>
              ))}
            </ScopeList>
          ) : (
            <EmptyState title="Nenhum escopo cadastrado">
              Crie escopos para acompanhar cada parte do orçamento.
            </EmptyState>
          )}
        </Panel>

        <Panel>
          <header>
            <div>
              <h2>Gastos recentes</h2>
              <p>Últimas movimentações registradas nesta obra.</p>
            </div>
          </header>
          {dashboard.recentExpenses.length ? (
            <RecentList>
              {dashboard.recentExpenses.map((expense) => (
                <Link key={expense.id} to={`/projects/${projectId}/expenses${tracking ? '?tracking=1' : ''}`}>
                  <span>
                    <strong>{expense.description}</strong>
                    <small>{expense.scope?.name ?? 'Gasto geral'} · {formatDate(expense.expenseDate)}</small>
                  </span>
                  <b>{formatMoney(expense.amount)}</b>
                </Link>
              ))}
            </RecentList>
          ) : (
            <EmptyState title="Nenhum gasto lançado">
              Os lançamentos desta obra aparecerão aqui.
            </EmptyState>
          )}
        </Panel>
      </AnalyticsGrid>
    </>
  );
}
