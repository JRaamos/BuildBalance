import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Eye, EyeOff, HardHat } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { z } from 'zod';
import type { RootState } from '../app/store';
import { Button, Field } from '../components/ui';
import { useLoginMutation } from '../features/api/api';
import { setCredentials } from '../features/auth/authSlice';

const formIn = keyframes`
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Screen = styled.main`
  min-height:100svh; display:grid; grid-template-columns:minmax(420px,.92fr) minmax(500px,1.08fr); background:var(--surface);
  @media(max-width:900px){grid-template-columns:1fr;}
`;
const Art = styled.section`
  position:relative; overflow:hidden; background:var(--gradient-login); color:var(--white); padding:52px clamp(34px,5vw,72px);
  display:flex; flex-direction:column; justify-content:space-between;
  &::before {
    content:''; position:absolute; inset:0; opacity:.18;
    background-image:linear-gradient(var(--nav-border) 1px,transparent 1px),linear-gradient(90deg,var(--nav-border) 1px,transparent 1px);
    background-size:42px 42px; mask-image:linear-gradient(to bottom,transparent 4%,var(--white) 36%,transparent 96%);
    transform:perspective(600px) rotateX(58deg) scale(1.8) translateY(18%);
  }
  &::after { content:''; position:absolute; width:280px; height:280px; right:-110px; bottom:-90px; border-radius:50%; background:var(--amber); opacity:.08; filter:blur(3px); }
  img { position:relative; width:min(330px,82%); height:78px; object-fit:contain; object-position:left center; }
  > div { position:relative; max-width:570px; z-index:1; }
  h1 { font-size:clamp(3rem,5vw,5.6rem); font-weight:600; line-height:.92; margin:0 0 28px; text-wrap:balance; }
  p { color:var(--on-dark-muted); font-size:1.06rem; line-height:1.75; max-width:490px; }
  small { position:relative; display:flex; align-items:center; gap:8px; color:var(--on-dark-muted); font-weight:650; }
  @media(max-width:900px){min-height:330px;padding:30px;gap:45px;h1{font-size:2.8rem;margin-bottom:15px;}img{height:55px;width:245px;}}
`;
const LoginPanel = styled.section`
  display:grid; place-items:center; padding:40px; background:var(--gradient-canvas);
  @media(max-width:560px){padding:28px 20px;}
`;
const Form = styled.form`
  width:min(460px,100%); padding:clamp(28px,4vw,44px); border:1px solid var(--line); border-radius:24px;
  background:color-mix(in srgb,var(--surface) 94%,transparent); box-shadow:var(--shadow-md); animation:${formIn} .5s .1s ease both;
  h2{font-size:2.35rem;font-weight:650;color:var(--navy);margin-bottom:8px;}
  >p{color:var(--muted);margin-bottom:32px;line-height:1.55;}
  >small{display:block;color:var(--teal-hover);font-size:.69rem;letter-spacing:.1em;text-transform:uppercase;font-weight:800;margin-bottom:10px;}
  label{margin-top:18px;}
  >button{margin-top:26px;}
  .password{position:relative}.password input{padding-right:48px}.password button{position:absolute;right:7px;bottom:5px;margin:0;padding:8px;background:transparent;color:var(--muted);box-shadow:none;min-height:auto;border:0;}
`;
const Error = styled.div`margin-top:18px;padding:12px 14px;border-radius:11px;background:var(--danger-soft);color:var(--danger);font-size:.85rem;`;
const schema = z.object({ email:z.string().email('Informe um e-mail válido'), password:z.string().min(8,'A senha possui ao menos 8 caracteres') });
type FormData = z.infer<typeof schema>;

export function LoginPage(){
  const auth=useSelector((s:RootState)=>s.auth); const dispatch=useDispatch(); const navigate=useNavigate(); const location=useLocation();
  const [visible,setVisible]=useState(false); const [login,{isLoading,error}]=useLoginMutation();
  const {register,handleSubmit,formState:{errors}}=useForm<FormData>({resolver:zodResolver(schema)});
  if(auth.accessToken) return <Navigate to="/dashboard" replace/>;
  const submit=async(data:FormData)=>{try{const result=await login(data).unwrap();dispatch(setCredentials(result));navigate((location.state as {from?:{pathname:string}})?.from?.pathname??'/dashboard',{replace:true});}catch{ /* exibido abaixo */ }};
  return <Screen><Art><img src="/brand/buildbalance-logo-light.png" alt="BuildBalance"/><div><h1>Obra sob controle.</h1><p>Orçamentos, escopos e gastos no mesmo nível — do primeiro planejamento à última entrega.</p></div><small><HardHat size={15}/> Gestão financeira de reformas</small></Art>
    <LoginPanel><Form onSubmit={handleSubmit(submit)}><small>Acesso seguro</small><h2>Bem-vindo</h2><p>Entre para acompanhar suas obras e decisões financeiras.</p>
      <Field>E-mail<input type="email" autoComplete="email" placeholder="voce@empresa.com" {...register('email')}/>{errors.email&&<em>{errors.email.message}</em>}</Field>
      <Field>Senha<div className="password"><input type={visible?'text':'password'} autoComplete="current-password" placeholder="Sua senha" {...register('password')}/><button type="button" onClick={()=>setVisible(!visible)} aria-label="Mostrar senha">{visible?<EyeOff size={18}/>:<Eye size={18}/>}</button></div>{errors.password&&<em>{errors.password.message}</em>}</Field>
      {error&&<Error>E-mail ou senha inválidos. Verifique os dados e tente novamente.</Error>}
      <Button $wide disabled={isLoading}>{isLoading?'Entrando…':<>Entrar <ArrowRight size={18}/></>}</Button>
    </Form></LoginPanel></Screen>;
}
