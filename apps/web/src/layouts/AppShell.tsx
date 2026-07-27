import {
  Building2, ClipboardList, FolderKanban, LayoutDashboard, LogOut, Menu,
  ShieldCheck, UserRound, Users, X
} from 'lucide-react';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import type { RootState } from '../app/store';
import { signOut } from '../features/auth/authSlice';
import { roleLabel } from '../utils/format';

const Shell = styled.div`
  min-height: 100vh; display: grid; grid-template-columns: 272px minmax(0, 1fr);
  background: var(--gradient-canvas);
  @media(max-width: 900px){display:block;}
`;
const Sidebar = styled.aside<{ $open: boolean }>`
  position: fixed; inset: 0 auto 0 0; z-index: 30; width: 272px; background: var(--gradient-brand); color: var(--white);
  display: flex; flex-direction: column; padding: 24px 16px 18px; transition: transform .25s ease; overflow: hidden;
  &::before { content: ''; position: absolute; width: 240px; height: 240px; border-radius: 50%; top: -145px; right: -95px; background: var(--teal); opacity: .12; filter: blur(4px); pointer-events: none; }
  > * { position: relative; }
  @media(max-width: 900px){transform: translateX(${({ $open }) => $open ? '0' : '-105%'}); box-shadow: var(--shadow-lg);}
`;
const Brand = styled.div`
  height: 72px; display:flex; align-items:center; padding: 0 8px 20px; border-bottom: 1px solid var(--nav-border);
  img { width: 220px; height: 52px; object-fit: contain; object-position: left center; }
`;
const Navigation = styled.nav`
  display:grid; gap: 5px; margin-top: 20px;
  a {
    position: relative; min-height: 46px; display:flex; align-items:center; gap: 12px; padding: 0 14px; border-radius: 12px;
    color: var(--on-dark-muted); font-weight:650; font-size:.89rem; transition: color .15s ease, background .15s ease, transform .15s ease;
  }
  a:hover { color: var(--white); background: var(--nav-hover); transform: translateX(2px); }
  a.active { background: var(--nav-active); color: var(--white); box-shadow: inset 0 0 0 1px var(--nav-border); }
  a.active::before { content: ''; position: absolute; left: 0; width: 3px; height: 20px; border-radius: 0 4px 4px 0; background: var(--amber); }
  span { margin: 19px 13px 5px; color: var(--on-dark-muted); opacity: .7; font-size: .65rem; text-transform:uppercase; letter-spacing:.14em; font-weight:750; }
`;
const SidebarFooter = styled.div`
  margin-top:auto; border-top:1px solid var(--nav-border); padding-top:14px;
  button { width:100%; min-height:44px; border:0; border-radius:11px; color:var(--on-dark-muted); background:transparent; display:flex; align-items:center; gap:11px; padding:0 13px; cursor:pointer; font-weight:650; transition: .15s ease; }
  button:hover { color: var(--white); background: var(--nav-hover); }
`;
const Main = styled.div`grid-column:2; min-width:0; @media(max-width: 900px){grid-column:auto;}`;
const Topbar = styled.header`
  height: 76px; background: color-mix(in srgb, var(--surface) 88%, transparent); backdrop-filter: blur(18px); border-bottom:1px solid var(--line);
  display:flex; align-items:center; justify-content:space-between; gap:18px; padding:0 40px; position:sticky; top:0; z-index:20;
  @media(max-width:720px){padding:0 18px;}
`;
const MobileButton = styled.button`
  display:none; width:40px; height:40px; border:1px solid var(--line); border-radius:11px; background:var(--surface); color:var(--navy);
  @media(max-width:900px){display:grid; place-items:center;}
`;
const MobileBrand = styled.img`
  display:none; width:170px; height:40px; object-fit:contain; object-position:left center;
  @media(max-width:560px){display:block;}
  @media(max-width:390px){width:145px;}
`;
const PageContext = styled.div`
  min-width: 0;
  small { display:block; color:var(--muted); font-size:.67rem; letter-spacing:.09em; text-transform:uppercase; font-weight:750; }
  strong { display:block; color:var(--navy); margin-top:2px; font:600 1rem/1.2 var(--font-display); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  @media(max-width:560px){display:none;}
`;
const UserBlock = styled.div`
  display:flex; align-items:center; gap:11px; margin-left:auto;
  > div:first-child { text-align:right; } strong { display:block; font-size:.84rem; } span { color:var(--muted); font-size:.72rem; }
  i { width:40px; height:40px; display:grid; place-items:center; border-radius:13px; background:var(--gradient-primary); color:var(--white); box-shadow:var(--shadow-primary); font-style:normal; font-weight:800; }
  @media(max-width:480px){> div:first-child{display:none;}}
`;
const Scrim = styled.div<{ $open: boolean }>`display:none; @media(max-width:900px){display:${({$open})=>$open?'block':'none'};position:fixed;inset:0;z-index:29;background:var(--overlay);backdrop-filter:blur(3px);}`;
const Close = styled.button`display:none; position:absolute; right:12px; top:12px; background:transparent;border:0;color:var(--white); @media(max-width:900px){display:block;}`;

export function AppShell() {
  const [open, setOpen] = useState(false);
  const user = useSelector((state: RootState) => state.auth.user)!;
  const dispatch = useDispatch();
  const location = useLocation();
  const nav = [
    ['/dashboard', 'Dashboard', LayoutDashboard],
    ['/projects', 'Obras', FolderKanban],
    ['/profile', 'Meu perfil', UserRound]
  ] as const;
  const admin = [
    ['/admin/projects', 'Todas as obras', Building2],
    ['/admin/users', 'Usuários', Users],
    ['/admin/project-access', 'Acessos às obras', ShieldCheck],
    ['/admin/audit', 'Auditoria', ClipboardList]
  ] as const;
  const routeTitle = location.pathname.startsWith('/projects/new')
    ? 'Nova obra'
    : location.pathname.startsWith('/projects/')
      ? 'Detalhes da obra'
      : [...nav, ...admin].find(([to]) => location.pathname.startsWith(to))?.[1] ?? 'BuildBalance';
  const close = () => setOpen(false);
  return <Shell>
    <Scrim $open={open} onClick={close} />
    <Sidebar $open={open}>
      <Close onClick={close} aria-label="Fechar menu"><X /></Close>
      <Brand><img src="/brand/buildbalance-logo-light.png" alt="BuildBalance" /></Brand>
      <Navigation>
        {nav.map(([to, label, Icon]) => <NavLink key={to} to={to} onClick={close}><Icon size={18}/>{label}</NavLink>)}
        {user.role === 'ADMIN' && <><span>Administração</span>{admin.map(([to,label,Icon])=><NavLink key={to} to={to} onClick={close}><Icon size={18}/>{label}</NavLink>)}</>}
      </Navigation>
      <SidebarFooter><button onClick={()=>dispatch(signOut())}><LogOut size={18}/>Sair da conta</button></SidebarFooter>
    </Sidebar>
    <Main>
      <Topbar>
        <MobileButton onClick={()=>setOpen(true)} aria-label="Abrir menu"><Menu /></MobileButton>
        <MobileBrand src="/brand/buildbalance-logo-dark.png" alt="BuildBalance" />
        <PageContext><small>Área de trabalho</small><strong>{routeTitle}</strong></PageContext>
        <UserBlock><div><strong>{user.name}</strong><span>{roleLabel[user.role]}</span></div><i>{user.name.charAt(0).toUpperCase()}</i></UserBlock>
      </Topbar>
      <Outlet />
    </Main>
  </Shell>;
}
