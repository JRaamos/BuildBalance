import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, ArrowLeft, CheckCircle2, Edit3, Plus, Trash2 } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, NavLink, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import styled from 'styled-components';
import { z } from 'zod';
import {
  Badge, Button, DialogShell, EmptyState, ErrorState, Field, FormGrid, Grid, LoadingState, Metric,
  Page, PageHeader, ProgressFill, ProgressTrack, Section, Split, Surface, Table, TableWrap
} from '../components/ui';
import {
  useCancelExpenseMutation, useCreateExpenseMutation, useCreateScopeMutation, useExpensesQuery,
  useCompleteProjectMutation, useDeleteProjectPermanentlyMutation, useProjectDashboardQuery,
  useProjectQuery, useScopesQuery
} from '../features/api/api';
import type { DashboardData, Expense, Scope } from '../features/api/api';
import { chartPalette, theme } from '../styles/theme';
import { formatDate, formatMoney, statusLabel } from '../utils/format';

const Tabs=styled.nav`display:flex;gap:2px;border-bottom:1px solid var(--line);overflow-x:auto;margin-bottom:28px;a{padding:13px 15px;color:var(--muted);font-size:.88rem;font-weight:700;white-space:nowrap;border-bottom:2px solid transparent}a.active{color:var(--teal);border-color:var(--teal)}`;
const Chart=styled(Surface)`height:330px;padding:20px 12px 8px;`;
const ScopeRow=styled.div`
  display:grid;grid-template-columns:minmax(180px,1fr) repeat(3,minmax(110px,.55fr));gap:20px;align-items:center;padding:18px 20px;border-top:1px solid var(--line);
  &:first-child{border-top:0}strong{display:block}small{color:var(--muted)} @media(max-width:700px){grid-template-columns:1fr 1fr;.optional{display:none}}
`;
const Simulation=styled.div`background:var(--teal-subtle);border:1px solid var(--line);border-radius:14px;padding:14px 16px;display:grid;grid-template-columns:1fr 1fr;gap:10px 12px;span{font-size:.76rem;color:var(--muted)}strong{display:block;margin-top:2px}.danger{color:var(--danger)}`;
const Report=styled.div`display:grid;grid-template-columns:repeat(2,1fr);gap:1px;background:var(--line);border:1px solid var(--line);border-radius:18px;overflow:hidden;box-shadow:var(--shadow-sm);>div{background:var(--surface);padding:22px}span{color:var(--muted);font-size:.8rem}strong{display:block;margin-top:8px;font-size:1.25rem}@media(max-width:560px){grid-template-columns:1fr}`;
const scopeSchema=z.object({name:z.string().min(2,'Informe o nome'),plannedBudget:z.string().regex(/^\d+([.,]\d{1,2})?$/,'Valor inválido'),description:z.string().optional()});
const expenseSchema=z.object({description:z.string().min(2,'Informe a descrição'),amount:z.string().regex(/^\d+([.,]\d{1,2})?$/,'Valor inválido'),scopeId:z.string().optional(),paymentMethod:z.string().optional(),paymentStatus:z.enum(['PENDING','PAID']),documentNumber:z.string().optional()});
type ScopeData=z.infer<typeof scopeSchema>;type ExpenseData=z.infer<typeof expenseSchema>;

const ExpenseForm=styled.form`display:grid;gap:16px;${FormGrid}{gap:12px 16px}`;
const ModalSection=styled.section`
  display:grid;gap:10px;
  >h3{margin:0;color:var(--navy);font-size:.77rem;font-family:var(--font-body);letter-spacing:.08em;text-transform:uppercase}
`;
const WideField=styled(Field)`grid-column:1/-1`;
const ModalActions=styled.footer`
  position:sticky;bottom:-24px;z-index:2;margin:0 -24px -24px;padding:16px 24px 20px;
  display:flex;align-items:center;justify-content:flex-end;gap:14px;background:color-mix(in srgb,var(--surface) 94%,transparent);
  border-top:1px solid var(--line);backdrop-filter:blur(12px);
  button{min-width:190px}
  p{margin:0 auto 0 0;color:var(--danger);font-size:.82rem}
  @media(max-width:640px){bottom:-20px;margin:0 -20px -20px;padding:14px 20px 18px;button{width:100%}}
`;
const HeaderActions=styled.div`
  display:flex;align-items:center;justify-content:flex-end;gap:10px;flex-wrap:wrap;
  @media(max-width:620px){justify-content:stretch;>button,>a{flex:1}}
`;
const ConfirmationNotice=styled.div<{ $danger?: boolean }>`
  display:grid;grid-template-columns:auto 1fr;gap:12px;align-items:start;margin-bottom:20px;padding:15px 16px;
  color:${({$danger})=>$danger?'var(--danger)':'var(--teal-hover)'};
  background:${({$danger})=>$danger?'var(--danger-soft)':'var(--teal-subtle)'};
  border:1px solid ${({$danger})=>$danger?'color-mix(in srgb,var(--danger) 24%,transparent)':'var(--line)'};
  border-radius:14px;
  svg{margin-top:1px}strong{display:block;color:var(--navy);margin-bottom:4px}p{margin:0;font-size:.86rem;line-height:1.55;color:var(--muted)}
`;
const ConfirmationActions=styled.div`
  display:flex;justify-content:flex-end;gap:10px;margin-top:22px;padding-top:18px;border-top:1px solid var(--line);
  @media(max-width:520px){flex-direction:column-reverse;button{width:100%}}
`;

export function ProjectDetailPage(){
  const {projectId}=useParams<{projectId:string}>();const id=projectId!;const location=useLocation();const navigate=useNavigate();const path=location.pathname;const tracking=new URLSearchParams(location.search).get('tracking')==='1';const trackingQuery=tracking?'?tracking=1':'';
  const tab=path.endsWith('/scopes')?'scopes':path.endsWith('/expenses')?'expenses':path.endsWith('/reports')?'reports':'overview';
  const {data:project,isLoading:projectLoading,isError:projectError}=useProjectQuery(id);
  const {data:dashboard,isLoading:dashLoading,isError:dashError}=useProjectDashboardQuery(id);
  const {data:scopes=[]}=useScopesQuery(id);const {data:expenses}=useExpensesQuery(id);
  const [scopeOpen,setScopeOpen]=useState(false);const [expenseOpen,setExpenseOpen]=useState(false);
  const [projectAction,setProjectAction]=useState<'complete'|'delete'|null>(null);
  const canEdit=!tracking&&project?.access?.permission!=='VIEW';const isOwner=!tracking&&project?.access?.isOwner===true;const completed=project?.status==='COMPLETED';const s=dashboard?.summary;
  if(projectLoading||dashLoading)return <Page><LoadingState/></Page>;if(projectError||dashError||!project||!dashboard||!s)return <Page><ErrorState/></Page>;
  return <Page><PageHeader><div><Button as={Link} to={tracking?'/admin/projects':'/projects'} $variant="ghost"><ArrowLeft size={17}/>{tracking?'Todas as obras':'Obras'}</Button><h1>{project.name}</h1><p>{project.owner.name} · {statusLabel[project.status]??project.status} · {tracking?'Somente acompanhamento':statusLabel[project.access?.permission??'']??project.access?.permission}</p></div>{canEdit&&<HeaderActions><Button as={Link} to={`/projects/${id}/edit`} $variant="secondary"><Edit3 size={17}/>Editar obra</Button>{isOwner&&!completed&&<Button type="button" $variant="secondary" onClick={()=>setProjectAction('complete')}><CheckCircle2 size={17}/>Finalizar</Button>}{isOwner&&<Button type="button" $variant="danger" onClick={()=>setProjectAction('delete')}><Trash2 size={17}/>Excluir</Button>}</HeaderActions>}</PageHeader>
    <Tabs><NavLink end to={`/projects/${id}${trackingQuery}`}>Visão geral</NavLink><NavLink to={`/projects/${id}/scopes${trackingQuery}`}>Escopos</NavLink><NavLink to={`/projects/${id}/expenses${trackingQuery}`}>Gastos</NavLink><NavLink to={`/projects/${id}/reports${trackingQuery}`}>Relatórios</NavLink></Tabs>
    {tab==='overview'&&<Overview dashboard={dashboard}/>}
    {tab==='scopes'&&<><Section><header><div><h2>Distribuição por escopos</h2><p style={{color:'var(--muted)',margin:'5px 0 0'}}>Planejado: {formatMoney(s.plannedScopeBudget)} · não distribuído: {formatMoney(s.unallocatedBudget)}</p></div>{canEdit&&<Button onClick={()=>setScopeOpen(true)}><Plus size={17}/>Novo escopo</Button>}</header><Surface>{scopes.length?scopes.map(scope=><ScopeRow key={scope.id}><div><strong>{scope.name}</strong><small>{statusLabel[scope.status]??scope.status}</small><ProgressTrack><ProgressFill $value={scope.usagePercentage} $danger={scope.isOverBudget}/></ProgressTrack></div><div><small>Planejado</small><strong>{formatMoney(scope.plannedBudget)}</strong></div><div><small>Gasto</small><strong>{formatMoney(scope.totalExpenses)}</strong></div><div className="optional"><small>Saldo</small><strong style={{color:scope.isOverBudget?'var(--danger)':undefined}}>{formatMoney(scope.remainingBudget)}</strong></div></ScopeRow>):<EmptyState title="Sem escopos">Separe a reforma em áreas para acompanhar cada orçamento.</EmptyState>}</Surface></Section>{scopeOpen&&<ScopeDialog projectId={id} close={()=>setScopeOpen(false)}/>}</>}
    {tab==='expenses'&&<><Section><header><div><h2>Lançamentos</h2><p style={{color:'var(--muted)',margin:'5px 0 0'}}>Gastos cancelados permanecem no histórico e não entram nos cálculos.</p></div>{canEdit&&<Button onClick={()=>setExpenseOpen(true)}><Plus size={17}/>Novo gasto</Button>}</header><ExpensesTable items={expenses?.data??[]} editable={canEdit}/></Section>{expenseOpen&&<ExpenseDialog projectId={id} scopes={scopes} currentBalance={Number(s.remainingBudget)} close={()=>setExpenseOpen(false)}/>}</>}
    {tab==='reports'&&<Reports dashboard={dashboard}/>}
    {projectAction==='complete'&&<CompleteProjectDialog projectId={id} projectName={project.name} close={()=>setProjectAction(null)}/>}
    {projectAction==='delete'&&<DeleteProjectDialog projectId={id} projectName={project.name} close={()=>setProjectAction(null)} deleted={()=>navigate('/projects',{replace:true})}/>}
  </Page>;
}

function CompleteProjectDialog({projectId,projectName,close}:{projectId:string;projectName:string;close:()=>void}){
  const [complete,{isLoading,error}]=useCompleteProjectMutation();
  const submit=async()=>{try{await complete(projectId).unwrap();close();}catch{/* exibido */}};
  return <DialogShell title="Finalizar obra" description={`Confirme a conclusão de “${projectName}”.`} close={close}>
    <ConfirmationNotice><CheckCircle2 size={21}/><div><strong>O histórico será preservado</strong><p>A obra passará para o status concluída. Orçamento, escopos, gastos e relatórios continuarão disponíveis para consulta.</p></div></ConfirmationNotice>
    {error&&<p style={{color:'var(--danger)'}}>Não foi possível finalizar a obra.</p>}
    <ConfirmationActions><Button type="button" $variant="ghost" onClick={close}>Voltar</Button><Button type="button" disabled={isLoading} onClick={submit}>{isLoading?'Finalizando…':'Finalizar obra'}</Button></ConfirmationActions>
  </DialogShell>;
}

function DeleteProjectDialog({projectId,projectName,close,deleted}:{projectId:string;projectName:string;close:()=>void;deleted:()=>void}){
  const [confirmation,setConfirmation]=useState('');const [remove,{isLoading,error}]=useDeleteProjectPermanentlyMutation();const valid=confirmation.trim()===projectName;
  const submit=async(e:FormEvent)=>{e.preventDefault();if(!valid)return;try{await remove({id:projectId,confirmation}).unwrap();deleted();}catch{/* exibido */}};
  return <DialogShell title="Excluir obra permanentemente" description="Esta operação não pode ser desfeita." close={close}><form onSubmit={submit}>
    <ConfirmationNotice $danger><AlertTriangle size={21}/><div><strong>Todos os registros desta obra serão apagados</strong><p>Escopos, gastos, acessos compartilhados e o histórico de auditoria vinculado à obra serão removidos permanentemente.</p></div></ConfirmationNotice>
    <Field>Digite <strong>{projectName}</strong> para confirmar<input autoFocus autoComplete="off" value={confirmation} onChange={e=>setConfirmation(e.target.value)} placeholder={projectName}/></Field>
    {error&&<p style={{color:'var(--danger)'}}>Não foi possível excluir a obra. Verifique a confirmação e tente novamente.</p>}
    <ConfirmationActions><Button type="button" $variant="ghost" onClick={close}>Cancelar</Button><Button type="submit" $variant="danger" disabled={!valid||isLoading}><Trash2 size={17}/>{isLoading?'Excluindo…':'Excluir definitivamente'}</Button></ConfirmationActions>
  </form></DialogShell>;
}

function Overview({dashboard}:{dashboard:DashboardData}){
  const s=dashboard.summary;return <><Grid $cols={3}><Metric><span>Orçamento total</span><strong>{formatMoney(s.totalBudget)}</strong><small>{s.usagePercentage}% utilizado</small></Metric><Metric><span>Total gasto</span><strong>{formatMoney(s.totalExpenses)}</strong><small>{formatMoney(s.paidExpenses)} pagos</small></Metric><Metric><span>Saldo geral</span><strong style={{color:s.isOverBudget?'var(--danger)':undefined}}>{formatMoney(s.remainingBudget)}</strong><small>{formatMoney(s.pendingExpenses)} pendentes</small></Metric><Metric><span>Gasto sem escopo</span><strong>{formatMoney(s.unscopedExpenses)}</strong><small>gastos gerais da obra</small></Metric><Metric><span>Planejado nos escopos</span><strong>{formatMoney(s.plannedScopeBudget)}</strong><small>{formatMoney(s.unallocatedBudget)} não distribuídos</small></Metric><Metric><span>Utilização</span><strong>{s.usagePercentage}%</strong><ProgressTrack><ProgressFill $value={s.usagePercentage??0} $danger={s.isOverBudget}/></ProgressTrack></Metric></Grid>
    <Split><Section><header><h2>Evolução mensal</h2></header><Chart><ResponsiveContainer width="100%" height="100%"><AreaChart data={dashboard.expensesByMonth}><defs><linearGradient id="spend" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={theme.colors.primary} stopOpacity=".35"/><stop offset="1" stopColor={theme.colors.primary} stopOpacity="0"/></linearGradient></defs><CartesianGrid vertical={false} stroke={theme.colors.chartGrid}/><XAxis dataKey="month" axisLine={false} tickLine={false}/><YAxis tickFormatter={(v)=>`${v/1000}k`} axisLine={false} tickLine={false}/><Tooltip formatter={(v)=>formatMoney(Number(v))}/><Area dataKey="value" name="Gasto" type="monotone" stroke={theme.colors.primary} strokeWidth={2.5} fill="url(#spend)"/></AreaChart></ResponsiveContainer></Chart></Section><Section><header><h2>Por escopo</h2></header><Chart><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={dashboard.expensesByScope} dataKey="value" nameKey="name" innerRadius="54%" outerRadius="78%" paddingAngle={3}>{dashboard.expensesByScope?.map((_,i)=><Cell key={i} fill={chartPalette[i%chartPalette.length]}/>)}</Pie><Tooltip formatter={(v)=>formatMoney(Number(v))}/></PieChart></ResponsiveContainer></Chart></Section></Split>
    <Section><header><h2>Últimos gastos</h2></header><ExpensesTable items={dashboard.recentExpenses} editable={false}/></Section></>;
}

function ExpensesTable({items,editable}:{items:Expense[];editable:boolean}){
  const [cancel,{isLoading}]=useCancelExpenseMutation();const remove=async(id:string)=>{if(window.confirm('Cancelar este gasto? Ele deixará de compor os cálculos.'))await cancel(id);};
  if(!items.length)return <EmptyState title="Nenhum gasto lançado">Use “Novo gasto” para registrar a primeira movimentação.</EmptyState>;
  return <TableWrap><Table><thead><tr><th>Data</th><th>Descrição</th><th>Escopo</th><th>Status</th><th>Valor</th>{editable&&<th>Ações</th>}</tr></thead><tbody>{items.map(e=><tr key={e.id}><td>{formatDate(e.expenseDate)}</td><td><strong>{e.description}</strong></td><td>{e.scope?.name??'Gasto geral'}</td><td><Badge $tone={e.paymentStatus==='PAID'?'success':e.paymentStatus==='CANCELLED'?'danger':'warning'}>{statusLabel[e.paymentStatus]}</Badge></td><td><strong>{formatMoney(e.amount)}</strong></td>{editable&&<td>{e.paymentStatus!=='CANCELLED'&&<Button disabled={isLoading} $variant="danger" onClick={()=>remove(e.id)} aria-label="Cancelar gasto"><Trash2 size={16}/></Button>}</td>}</tr>)}</tbody></Table></TableWrap>;
}

function ScopeDialog({projectId,close}:{projectId:string;close:()=>void}){
  const [create,{isLoading,error}]=useCreateScopeMutation();const {register,handleSubmit,formState:{errors}}=useForm<ScopeData>({resolver:zodResolver(scopeSchema)});
  const submit=async(data:ScopeData)=>{try{await create({projectId,body:{...data,plannedBudget:data.plannedBudget.replace(',','.')}}).unwrap();close();}catch{/* exibido */}};
  return <DialogShell title="Novo escopo" close={close}><form onSubmit={handleSubmit(submit)}><Field>Nome<input placeholder="Ex.: Elétrica" {...register('name')}/>{errors.name&&<em>{errors.name.message}</em>}</Field><Field style={{marginTop:16}}>Orçamento planejado<input inputMode="decimal" placeholder="20000,00" {...register('plannedBudget')}/>{errors.plannedBudget&&<em>{errors.plannedBudget.message}</em>}</Field><Field style={{marginTop:16}}>Descrição<textarea {...register('description')}/></Field>{error&&<p style={{color:'var(--danger)'}}>Não foi possível criar o escopo.</p>}<Button style={{marginTop:22}} $wide disabled={isLoading}>Criar escopo</Button></form></DialogShell>;
}

function ExpenseDialog({projectId,scopes,currentBalance,close}:{projectId:string;scopes:Scope[]|undefined;currentBalance:number;close:()=>void}){
  const [create,{isLoading,error}]=useCreateExpenseMutation();
  const {register,handleSubmit,watch,formState:{errors}}=useForm<ExpenseData>({resolver:zodResolver(expenseSchema),defaultValues:{paymentStatus:'PENDING',scopeId:'',paymentMethod:'PIX'}});
  const amount=Number((watch('amount')??'0').replace(',','.'));const scopeId=watch('scopeId');const scope=useMemo(()=>scopes?.find(s=>s.id===scopeId),[scopes,scopeId]);const scopeAfter=scope?Number(scope.remainingBudget)-amount:null;const projectAfter=currentBalance-amount;
  const submit=async(data:ExpenseData)=>{if((projectAfter<0||(scopeAfter??0)<0)&&!window.confirm('O lançamento ultrapassa um saldo disponível. Deseja continuar?'))return;const now=new Date();const expenseDate=new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,10);const clean={...data,expenseDate,amount:data.amount.replace(',','.'),scopeId:data.scopeId||undefined,paymentMethod:data.paymentMethod||undefined};try{await create({projectId,body:clean}).unwrap();close();}catch{/* exibido */}};
  return <DialogShell title="Registrar gasto" description="Preencha os dados essenciais da movimentação." close={close}><ExpenseForm onSubmit={handleSubmit(submit)}>
    <ModalSection><h3>Dados do gasto</h3><FormGrid><Field>Descrição<input autoFocus placeholder="Ex.: Compra de materiais" {...register('description')}/>{errors.description&&<em>{errors.description.message}</em>}</Field><Field>Valor<input inputMode="decimal" placeholder="0,00" {...register('amount')}/>{errors.amount&&<em>{errors.amount.message}</em>}</Field><WideField>Escopo<select {...register('scopeId')}><option value="">Gasto geral da obra</option>{scopes?.filter(s=>s.status!=='CANCELLED').map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></WideField></FormGrid></ModalSection>
    <ModalSection><h3>Pagamento</h3><FormGrid><Field>Forma de pagamento<select {...register('paymentMethod')}><option value="PIX">Pix</option><option value="CASH">Dinheiro</option><option value="DEBIT_CARD">Cartão de débito</option><option value="CREDIT_CARD">Cartão de crédito</option><option value="BANK_TRANSFER">Transferência</option><option value="BOLETO">Boleto</option><option value="OTHER">Outro</option></select></Field><Field>Status<select {...register('paymentStatus')}><option value="PENDING">Pendente</option><option value="PAID">Pago</option></select></Field><Field>Nº do documento<input placeholder="Opcional" {...register('documentNumber')}/></Field></FormGrid></ModalSection>
    <Simulation><div><span>Saldo atual da obra</span><strong>{formatMoney(currentBalance)}</strong></div><div><span>Após o gasto</span><strong className={projectAfter<0?'danger':''}>{formatMoney(projectAfter)}</strong></div>{scope?<><div><span>Saldo atual de {scope.name}</span><strong>{formatMoney(scope.remainingBudget)}</strong></div><div><span>Escopo após o gasto</span><strong className={(scopeAfter??0)<0?'danger':''}>{formatMoney(scopeAfter??0)}</strong></div></>:<div style={{gridColumn:'1/-1'}}><span>O lançamento será tratado como gasto geral da obra.</span></div>}</Simulation>
    <ModalActions>{error&&<p>Não foi possível salvar o gasto.</p>}<Button disabled={isLoading}>{isLoading?'Registrando…':'Registrar gasto'}</Button></ModalActions>
  </ExpenseForm></DialogShell>;
}

function Reports({dashboard}:{dashboard:DashboardData}){
  const s=dashboard.summary;return <Section><header><div><h2>Resumo financeiro</h2><p style={{color:'var(--muted)',margin:'5px 0 0'}}>Valores calculados diretamente a partir dos lançamentos válidos.</p></div></header><Report><div><span>Orçamento aprovado</span><strong>{formatMoney(s.totalBudget)}</strong></div><div><span>Total comprometido</span><strong>{formatMoney(s.totalExpenses)}</strong></div><div><span>Total pago</span><strong>{formatMoney(s.paidExpenses)}</strong></div><div><span>Total pendente</span><strong>{formatMoney(s.pendingExpenses)}</strong></div><div><span>Gastos com escopo</span><strong>{formatMoney(s.scopedExpenses)}</strong></div><div><span>Gastos gerais</span><strong>{formatMoney(s.unscopedExpenses)}</strong></div></Report><Section><header><h2>Escopos acima do orçamento</h2></header>{dashboard.scopes?.some(s=>s.isOverBudget)?<Surface>{dashboard.scopes.filter(s=>s.isOverBudget).map(s=><ScopeRow key={s.id}><div><strong>{s.name}</strong><small>{s.usagePercentage}% utilizado</small></div><div><small>Excesso</small><strong style={{color:'var(--danger)'}}>{formatMoney(Math.abs(Number(s.remainingBudget)))}</strong></div></ScopeRow>)}</Surface>:<EmptyState title="Nenhum escopo excedido">Todos os escopos estão dentro do orçamento planejado.</EmptyState>}</Section></Section>;
}
