import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { Button, ErrorState, Field, FormGrid, FormSurface, LoadingState, Page, PageHeader } from '../components/ui';
import { useCreateProjectMutation, useProjectQuery, useUpdateProjectMutation } from '../features/api/api';

const schema=z.object({
  name:z.string().min(3,'Informe ao menos 3 caracteres').max(140),
  totalBudget:z.string().regex(/^\d+([.,]\d{1,2})?$/,'Informe um valor válido'),
  status:z.enum(['PLANNING','IN_PROGRESS','PAUSED','COMPLETED']),
  description:z.string().max(600).optional(),startDate:z.string().optional(),expectedEndDate:z.string().optional(),notes:z.string().max(2000).optional()
});
type Data=z.infer<typeof schema>;
export function ProjectFormPage(){
  const {projectId}=useParams();const editing=Boolean(projectId);const nav=useNavigate();
  const {data:project,isLoading:isProjectLoading,isError}=useProjectQuery(projectId!,{skip:!editing});
  const [create,{isLoading:createLoading,error:createError}]=useCreateProjectMutation();const [update,{isLoading:updateLoading,error:updateError}]=useUpdateProjectMutation();
  const {register,handleSubmit,reset,formState:{errors}}=useForm<Data>({resolver:zodResolver(schema),defaultValues:{status:'PLANNING'}});
  useEffect(()=>{if(project)reset({name:project.name,totalBudget:String(project.financialSummary?.totalBudget??''),status:project.status as Data['status'],description:project.description??''});},[project,reset]);
  if(editing&&isProjectLoading)return <Page><LoadingState/></Page>;if(isError)return <Page><ErrorState/></Page>;
  const submit=async(data:Data)=>{const body={...data,totalBudget:data.totalBudget.replace(',','.'),startDate:data.startDate||undefined,expectedEndDate:data.expectedEndDate||undefined};try{const result=editing?await update({id:projectId!,body}).unwrap():await create(body).unwrap();nav(`/projects/${result.id}`);}catch{/* erro exibido */}};
  return <Page><PageHeader><div><Button as={Link} to={editing?`/projects/${projectId}`:'/projects'} $variant="ghost"><ArrowLeft size={17}/>Voltar</Button><h1>{editing?'Editar obra':'Nova obra'}</h1><p>Defina o orçamento e as informações centrais da reforma.</p></div></PageHeader>
    <FormSurface onSubmit={handleSubmit(submit)}><FormGrid><Field>Nome da obra<input placeholder="Ex.: Reforma apartamento Centro" {...register('name')}/>{errors.name&&<em>{errors.name.message}</em>}</Field><Field>Orçamento total<input inputMode="decimal" placeholder="150000,00" {...register('totalBudget')}/>{errors.totalBudget&&<em>{errors.totalBudget.message}</em>}</Field><Field>Status<select {...register('status')}><option value="PLANNING">Planejamento</option><option value="IN_PROGRESS">Em andamento</option><option value="PAUSED">Pausada</option><option value="COMPLETED">Concluída</option></select></Field><Field>Data de início<input type="date" {...register('startDate')}/></Field><Field>Previsão de término<input type="date" {...register('expectedEndDate')}/></Field></FormGrid><Field style={{marginTop:18}}>Descrição<textarea placeholder="Resumo da reforma" {...register('description')}/></Field><Field style={{marginTop:18}}>Observações<textarea placeholder="Informações adicionais" {...register('notes')}/></Field>{(createError||updateError)&&<p style={{color:'var(--danger)',marginTop:16}}>Não foi possível salvar. Revise os dados informados.</p>}<footer><Button disabled={createLoading||updateLoading}><Save size={18}/>{createLoading||updateLoading?'Salvando…':'Salvar obra'}</Button></footer></FormSurface>
  </Page>;
}
