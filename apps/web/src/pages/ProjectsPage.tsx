import { ArrowUpRight, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { Badge, Button, EmptyState, ErrorState, LoadingState, Page, PageHeader, ProgressFill, ProgressTrack } from '../components/ui';
import { useProjectsQuery } from '../features/api/api';
import { formatMoney, statusLabel } from '../utils/format';

const List=styled.div`border-top:1px solid var(--line)`;
const Row=styled(Link)`
  display:grid;grid-template-columns:minmax(240px,1.4fr) minmax(130px,.7fr) minmax(130px,.7fr) minmax(130px,.7fr) 42px;
  align-items:center;gap:22px;padding:22px 10px;border-bottom:1px solid var(--line);transition:padding .2s,background .2s;
  &:hover{padding-left:18px;padding-right:18px;background:var(--surface)}.title strong{display:block;font-size:1.05rem;color:var(--navy)}
  small{display:block;color:var(--muted);margin-bottom:5px}b{font-size:.92rem}
  @media(max-width:780px){grid-template-columns:1fr 36px;padding:18px 4px;.cell{display:none}}
`;
const Meta=styled.div`display:flex;align-items:center;gap:7px;flex-wrap:wrap;color:var(--muted);font-size:.78rem;margin-top:6px`;

export function ProjectsPage({ all = false }: { all?: boolean }){
  const {data,isLoading,isError}=useProjectsQuery(all);
  if(isLoading)return <Page><LoadingState/></Page>;if(isError)return <Page><ErrorState/></Page>;
  const projects=data?.data??[];
  return <Page><PageHeader><div><h1>{all?'Todas as obras':'Obras'}</h1><p>{all?'Acompanhe as obras de todos os usuários sem alterar seus lançamentos.':'Orçamento, execução e acessos em um só lugar.'}</p></div>{!all&&<Button as={Link} to="/projects/new"><Plus size={18}/>Nova obra</Button>}</PageHeader>
    {!projects.length?<EmptyState title={all?'Nenhuma obra cadastrada':'Sua lista de obras está vazia'}>{all?'As obras criadas pelos usuários aparecerão aqui.':'Crie uma obra ou aguarde um compartilhamento do administrador.'}</EmptyState>:<List>{projects.map(p=><Row key={p.id} to={`/projects/${p.id}${all?'?tracking=1':''}`}><div className="title"><strong>{p.name}</strong><Meta><span>{p.owner.name}{all&&p.owner.email?` · ${p.owner.email}`:''}</span><Badge>{statusLabel[p.status]??p.status}</Badge>{all&&<Badge>Somente acompanhamento</Badge>}</Meta><ProgressTrack><ProgressFill $value={p.financialSummary?.usagePercentage??0} $danger={(p.financialSummary?.usagePercentage??0)>100}/></ProgressTrack></div><div className="cell"><small>Orçamento</small><b>{formatMoney(p.financialSummary?.totalBudget)}</b></div><div className="cell"><small>Gasto</small><b>{formatMoney(p.financialSummary?.totalExpenses)}</b></div><div className="cell"><small>Saldo</small><b>{formatMoney(p.financialSummary?.remainingBudget)}</b></div><ArrowUpRight size={20}/></Row>)}</List>}
  </Page>;
}
