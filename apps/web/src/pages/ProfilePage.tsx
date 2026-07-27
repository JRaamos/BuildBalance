import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSelector } from 'react-redux';
import { z } from 'zod';
import type { RootState } from '../app/store';
import { Button, Field, FormSurface, Page, PageHeader } from '../components/ui';
import { useChangePasswordMutation } from '../features/api/api';
import { roleLabel } from '../utils/format';
const schema=z.object({currentPassword:z.string().min(8),newPassword:z.string().min(8),confirm:z.string()}).refine(d=>d.newPassword===d.confirm,{message:'As senhas não coincidem',path:['confirm']});type Data=z.infer<typeof schema>;
export function ProfilePage(){const user=useSelector((s:RootState)=>s.auth.user)!;const [change,{isLoading,error}]=useChangePasswordMutation();const [success,setSuccess]=useState(false);const {register,handleSubmit,reset,formState:{errors}}=useForm<Data>({resolver:zodResolver(schema)});const submit=async({currentPassword,newPassword}:Data)=>{setSuccess(false);try{await change({currentPassword,newPassword}).unwrap();setSuccess(true);reset()}catch{/* exibido */}};return <Page><PageHeader><div><h1>Meu perfil</h1><p>{user.name} · {user.email} · {roleLabel[user.role]}</p></div></PageHeader><FormSurface onSubmit={handleSubmit(submit)}><h2>Alterar senha</h2><p style={{color:'var(--muted)'}}>Use ao menos 8 caracteres e evite senhas reutilizadas.</p><Field>Senha atual<input type="password" autoComplete="current-password" {...register('currentPassword')}/>{errors.currentPassword&&<em>Informe sua senha atual.</em>}</Field><Field style={{marginTop:16}}>Nova senha<input type="password" autoComplete="new-password" {...register('newPassword')}/>{errors.newPassword&&<em>Mínimo de 8 caracteres.</em>}</Field><Field style={{marginTop:16}}>Confirmar nova senha<input type="password" autoComplete="new-password" {...register('confirm')}/>{errors.confirm&&<em>{errors.confirm.message}</em>}</Field>{error&&<p style={{color:'var(--danger)'}}>Senha atual incorreta ou sessão inválida.</p>}{success&&<p style={{color:'var(--success)'}}>Senha alterada com sucesso.</p>}<footer><Button disabled={isLoading}><Save size={17}/>Salvar nova senha</Button></footer></FormSurface></Page>}
