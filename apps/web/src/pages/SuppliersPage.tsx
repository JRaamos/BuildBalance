import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button, DialogShell, EmptyState, ErrorState, Field, FormGrid, LoadingState, Page, PageHeader, Table, TableWrap } from '../components/ui';
import { useCreateSupplierMutation, useSuppliersQuery } from '../features/api/api';

const schema=z.object({name:z.string().min(2),document:z.string().optional(),phone:z.string().optional(),email:z.union([z.string().email(),z.literal('')]).optional(),notes:z.string().optional()});type Data=z.infer<typeof schema>;
export function SuppliersPage(){
  const {data=[],isLoading,isError}=useSuppliersQuery();const [open,setOpen]=useState(false);
  if(isLoading)return <Page><LoadingState/></Page>;if(isError)return <Page><ErrorState/></Page>;
  return <Page><PageHeader><div><h1>Fornecedores</h1><p>Cadastros próprios disponíveis nos lançamentos.</p></div><Button onClick={()=>setOpen(true)}><Plus size={17}/>Novo fornecedor</Button></PageHeader>{data.length?<TableWrap><Table><thead><tr><th>Nome</th><th>Documento</th><th>Telefone</th><th>E-mail</th></tr></thead><tbody>{data.map(s=><tr key={s.id}><td><strong>{s.name}</strong></td><td>{s.document??'—'}</td><td>{s.phone??'—'}</td><td>{s.email??'—'}</td></tr>)}</tbody></Table></TableWrap>:<EmptyState title="Nenhum fornecedor">Cadastre quem fornece materiais ou serviços para suas obras.</EmptyState>}{open&&<SupplierDialog close={()=>setOpen(false)}/>}</Page>;
}
function SupplierDialog({close}:{close:()=>void}){const [create,{isLoading,error}]=useCreateSupplierMutation();const {register,handleSubmit}=useForm<Data>({resolver:zodResolver(schema)});const submit=async(data:Data)=>{try{await create(data).unwrap();close();}catch{/* exibido */}};return <DialogShell title="Novo fornecedor" close={close}><form onSubmit={handleSubmit(submit)}><FormGrid><Field>Nome<input {...register('name')}/></Field><Field>CPF/CNPJ<input {...register('document')}/></Field><Field>Telefone<input {...register('phone')}/></Field><Field>E-mail<input type="email" {...register('email')}/></Field></FormGrid><Field style={{marginTop:16}}>Observações<textarea {...register('notes')}/></Field>{error&&<p style={{color:'var(--danger)'}}>Não foi possível cadastrar.</p>}<Button $wide style={{marginTop:20}} disabled={isLoading}>Salvar fornecedor</Button></form></DialogShell>}
