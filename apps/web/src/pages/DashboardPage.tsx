import { ArrowUpRight, Building2, CircleDollarSign, Gauge, TriangleAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { Badge, EmptyState, ErrorState, Grid, LoadingState, Metric, Page, PageHeader, ProgressFill, ProgressTrack, Section, Split, Surface } from '../components/ui';
import { useDashboardQuery } from '../features/api/api';
import { formatDate, formatMoney, statusLabel } from '../utils/format';

const MetricHead=styled.header`display:flex;align-items:center;justify-content:space-between; svg{color:var(--teal)}`;
const ProjectList=styled(Surface)`
  a{display:grid;grid-template-columns:minmax(180px,1.3fr) repeat(3,minmax(110px,.7fr)) 44px;align-items:center;gap:18px;padding:18px 20px;border-top:1px solid var(--line);transition:.15s}
  a:first-child{border-top:0} a:hover{background:var(--teal-subtle)}.name strong{display:block}.name span{font-size:.78rem;color:var(--muted)}
  small{display:block;color:var(--muted);margin-bottom:4px} b{font-size:.9rem}
  @media(max-width:800px){a{grid-template-columns:1fr 44px}.hide{display:none}}
`;
const RecentList=styled(Surface)`div{display:flex;justify-content:space-between;gap:20px;padding:15px 18px;border-top:1px solid var(--line)}div:first-child{border-top:0}strong{font-size:.88rem}span{font-size:.78rem;color:var(--muted)}b{white-space:nowrap}`;
const growBar=keyframes`from{transform:scaleX(0)}to{transform:scaleX(1)}`;
const BudgetChart=styled(Surface)`padding:4px 22px`;
const BudgetRow=styled.div`
  padding:18px 0;border-top:1px solid var(--line);
  &:first-child{border-top:0}
  header,.values{display:flex;align-items:center;justify-content:space-between;gap:14px}
  header strong{font-size:.9rem;color:var(--navy)}
  header span{font-size:.74rem;font-weight:750;color:var(--teal-hover)}
  .values{margin:9px 0 10px;color:var(--muted);font-size:.72rem}
`;
const BudgetRail=styled.div`
  position:relative;height:13px;border-radius:999px;background:var(--canvas-deep);overflow:hidden;
  box-shadow:inset 0 1px 2px color-mix(in srgb,var(--navy) 8%,transparent);
`;
const BudgetFill=styled.div<{ $value:number; $danger:boolean }>`
  width:${({$value})=>Math.min(100,Math.max(0,$value))}%;height:100%;border-radius:inherit;transform-origin:left;
  background:${({$danger})=>$danger?'var(--danger)':'var(--gradient-primary)'};
  animation:${growBar} .7s cubic-bezier(.2,.8,.2,1) both;
`;

export function DashboardPage(){
  const {data,isLoading,isError}=useDashboardQuery();
  if(isLoading)return <Page><LoadingState/></Page>; if(isError||!data)return <Page><ErrorState/></Page>;
  const s=data.summary; const chart=(data.projects??[]).slice(0,6).map(p=>({id:p.id,name:p.name,budget:Number(p.totalBudget),spent:Number(p.totalExpenses),usage:p.usagePercentage??0}));
  return <Page><PageHeader><div><h1>Visão geral</h1><p>Posição financeira das obras que você pode acessar.</p></div><Badge $tone="success">Atualizado agora</Badge></PageHeader>
    <Grid><Metric key="active-projects"><div><MetricHead><span>Obras ativas</span><Building2 size={20}/></MetricHead><strong>{s.activeProjects}</strong><small>em planejamento ou execução</small></div></Metric>
      <Metric key="total-budget"><div><MetricHead><span>Orçamento total</span><CircleDollarSign size={20}/></MetricHead><strong>{formatMoney(s.totalBudget)}</strong><small>somatório das obras acessíveis</small></div></Metric>
      <Metric key="remaining-budget"><div><MetricHead><span>Saldo disponível</span><Gauge size={20}/></MetricHead><strong>{formatMoney(s.remainingBudget)}</strong><small>{formatMoney(s.totalExpenses)} já comprometidos</small></div></Metric>
      <Metric key="over-budget"><div><MetricHead><span>Escopos acima do limite</span><TriangleAlert size={20}/></MetricHead><strong>{s.overBudgetScopes??0}</strong><small>exigem atenção no orçamento</small></div></Metric>
    </Grid>
    {(data.projects?.length??0)===0?<EmptyState title="Nenhuma obra cadastrada">Crie sua primeira obra para começar a acompanhar o orçamento.</EmptyState>:<>
      <Section><header><h2>Obras acessíveis</h2><Link to="/projects">Ver todas</Link></header><ProjectList>{data.projects!.slice(0,6).map(p=><Link key={p.id} to={`/projects/${p.id}`}><div className="name"><strong>{p.name}</strong><span>{p.owner.name} · {statusLabel[p.permission??'']??p.permission}</span><ProgressTrack><ProgressFill $value={p.usagePercentage??0} $danger={(p.usagePercentage??0)>100}/></ProgressTrack></div><div className="hide"><small>Orçamento</small><b>{formatMoney(p.totalBudget)}</b></div><div className="hide"><small>Gasto</small><b>{formatMoney(p.totalExpenses)}</b></div><div className="hide"><small>Saldo</small><b>{formatMoney(p.remainingBudget)}</b></div><ArrowUpRight size={19}/></Link>)}</ProjectList></Section>
      <Split><Section key="project-budget-chart"><header><div><h2>Utilização do orçamento</h2><p style={{color:'var(--muted)',margin:'5px 0 0',fontSize:'.82rem'}}>Gasto acumulado em relação ao valor aprovado.</p></div></header><BudgetChart>{chart.map(item=><BudgetRow key={item.id}><header key="heading"><strong>{item.name}</strong><span>{item.usage.toFixed(1)}% utilizado</span></header><div key="values" className="values"><span>Gasto {formatMoney(item.spent)}</span><span>Orçamento {formatMoney(item.budget)}</span></div><BudgetRail key="rail"><BudgetFill $value={item.usage} $danger={item.usage>100}/></BudgetRail></BudgetRow>)}</BudgetChart></Section>
      <Section key="recent-expenses"><header><h2>Gastos recentes</h2></header><RecentList>{data.recentExpenses.length?data.recentExpenses.map(e=><div key={e.id}><span><strong>{e.description}</strong><br/>{e.projectName} · {formatDate(e.expenseDate)}</span><b>{formatMoney(e.amount)}</b></div>):<EmptyState title="Sem lançamentos">Os gastos aparecerão aqui.</EmptyState>}</RecentList></Section></Split>
    </>}
  </Page>;
}
