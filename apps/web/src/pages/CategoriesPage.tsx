import { Plus, Tag } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../app/store';
import { Badge, Button, EmptyState, ErrorState, Field, InlineForm, LoadingState, Page, PageHeader, Surface } from '../components/ui';
import { useCategoriesQuery, useCreateCategoryMutation } from '../features/api/api';
import styled from 'styled-components';

const CategoryList=styled(Surface)`div{display:flex;align-items:center;justify-content:space-between;padding:17px 20px;border-top:1px solid var(--line)}div:first-child{border-top:0}strong{display:flex;align-items:center;gap:10px}`;
export function CategoriesPage(){const user=useSelector((s:RootState)=>s.auth.user)!;const {data=[],isLoading,isError}=useCategoriesQuery();const [name,setName]=useState('');const [create,{isLoading:saving}]=useCreateCategoryMutation();if(isLoading)return <Page><LoadingState/></Page>;if(isError)return <Page><ErrorState/></Page>;const submit=async(e:FormEvent)=>{e.preventDefault();if(!name.trim())return;await create({name:name.trim()});setName('')};return <Page><PageHeader><div><h1>Categorias</h1><p>Classificação padronizada para os gastos.</p></div></PageHeader>{user.role==='ADMIN'&&<InlineForm onSubmit={submit} style={{marginBottom:24}}><Field>Nova categoria<input value={name} onChange={e=>setName(e.target.value)} placeholder="Ex.: Acabamentos"/></Field><Button disabled={saving}><Plus size={17}/>Adicionar</Button></InlineForm>}{data.length?<CategoryList>{data.map(c=><div key={c.id}><strong><Tag size={17}/>{c.name}</strong><Badge $tone={c.active?'success':'neutral'}>{c.active?'Ativa':'Inativa'}</Badge></div>)}</CategoryList>:<EmptyState title="Sem categorias">As categorias iniciais são criadas pelo seed.</EmptyState>}</Page>}
