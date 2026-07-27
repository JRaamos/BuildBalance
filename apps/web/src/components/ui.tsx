import { AlertTriangle, CheckCircle2, LoaderCircle, X } from 'lucide-react';
import { PropsWithChildren, ReactNode } from 'react';
import styled, { css, keyframes } from 'styled-components';

const pageIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

export const Page = styled.main`
  width: 100%;
  max-width: 1480px;
  margin: 0 auto;
  padding: 36px 40px 72px;
  animation: ${pageIn} .38s ease;
  @media (max-width: 720px) { padding: 22px 18px 92px; }
`;
export const PageHeader = styled.header`
  display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; margin-bottom: 32px;
  h1 { margin: 0; font-size: clamp(2rem, 3vw, 2.75rem); line-height: 1.02; color: var(--navy); font-weight: 650; }
  p { color: var(--muted); margin: 9px 0 0; line-height: 1.6; }
  @media (max-width: 620px) { align-items: stretch; flex-direction: column; }
`;
export const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' | 'ghost'; $wide?: boolean }>`
  appearance: none; border: 1px solid transparent; border-radius: 12px; min-height: 45px; padding: 0 18px; font-weight: 700;
  display: inline-flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer;
  transition: transform .18s ease, background .18s ease, border-color .18s ease, box-shadow .18s ease;
  background: var(--gradient-primary); color: var(--white); box-shadow: var(--shadow-primary);
  ${({ $variant }) => $variant === 'secondary' && css`
    background: var(--teal-soft); color: var(--teal-hover); box-shadow: none;
  `}
  ${({ $variant }) => $variant === 'danger' && css`
    background: var(--danger-soft); color: var(--danger); box-shadow: none;
  `}
  ${({ $variant }) => $variant === 'ghost' && css`
    background: transparent; color: var(--ink); box-shadow: none;
  `}
  ${({ $wide }) => $wide && css`width: 100%;`}
  &:hover:not(:disabled) { transform: translateY(-1px); filter: saturate(1.05); box-shadow: var(--shadow-md); }
  &:active:not(:disabled) { transform: translateY(0); }
  &:disabled { opacity: .55; cursor: not-allowed; }
`;
export const Grid = styled.div<{ $cols?: number }>`
  display: grid; grid-template-columns: repeat(${({ $cols }) => $cols ?? 4}, minmax(0, 1fr)); gap: 14px;
  @media (max-width: 1000px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 560px) { grid-template-columns: 1fr; }
`;
export const Metric = styled.div`
  position: relative; overflow: hidden; background: var(--surface); border: 1px solid var(--line);
  border-radius: 18px; padding: 22px 24px; min-height: 138px; box-shadow: var(--shadow-xs);
  transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
  &::after { content: ''; position: absolute; inset: auto 0 0; height: 3px; background: var(--gradient-primary); opacity: 0; transition: opacity .2s ease; }
  &:hover { transform: translateY(-2px); border-color: var(--line-strong); box-shadow: var(--shadow-sm); }
  &:hover::after { opacity: 1; }
  span { color: var(--muted); font-size: .82rem; font-weight: 650; }
  strong { display: block; margin-top: 16px; color: var(--navy); font: 650 clamp(1.4rem, 2.5vw, 2.05rem)/1 var(--font-display); letter-spacing: -.04em; }
  small { display: block; margin-top: 10px; color: var(--muted); }
`;
export const Section = styled.section`
  margin-top: 38px;
  > header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 15px; }
  h2 { margin: 0; color: var(--navy); font-size: 1.18rem; letter-spacing: -.015em; font-weight: 650; }
  > header > a { color: var(--teal-hover); font-weight: 700; font-size: .88rem; }
`;
export const Surface = styled.div`
  background: var(--surface); border: 1px solid var(--line); border-radius: 18px; overflow: hidden;
  box-shadow: var(--shadow-sm);
`;
export const TableWrap = styled(Surface)`overflow-x: auto;`;
export const Table = styled.table`
  width: 100%; border-collapse: collapse; min-width: 720px;
  th { text-align: left; padding: 14px 18px; color: var(--muted); background: var(--surface-muted); font-size: .73rem; letter-spacing: .055em; text-transform: uppercase; }
  td { padding: 17px 18px; border-top: 1px solid var(--line); vertical-align: middle; }
  tbody tr { transition: background .15s ease; }
  tbody tr:hover { background: var(--teal-subtle); }
`;
export const Badge = styled.span<{ $tone?: 'success' | 'warning' | 'danger' | 'neutral' }>`
  display: inline-flex; align-items: center; gap: 5px; padding: 6px 10px; border-radius: 999px; font-size: .74rem; font-weight: 750;
  color: var(--muted); background: var(--canvas-deep);
  ${({ $tone }) => $tone === 'success' && css`color: var(--success); background: var(--success-soft);`}
  ${({ $tone }) => $tone === 'warning' && css`color: var(--warning); background: var(--warning-soft);`}
  ${({ $tone }) => $tone === 'danger' && css`color: var(--danger); background: var(--danger-soft);`}
`;
export const ProgressTrack = styled.div`
  height: 7px; background: var(--canvas-deep); border-radius: 999px; overflow: hidden; margin-top: 14px;
`;
export const ProgressFill = styled.div<{ $value: number; $danger?: boolean }>`
  height: 100%; width: ${({ $value }) => Math.min(100, Math.max(0, $value))}%;
  background: ${({ $danger }) => $danger ? 'var(--danger)' : 'var(--gradient-primary)'};
  border-radius: inherit; transition: width .7s cubic-bezier(.2,.8,.2,1);
`;
export const Field = styled.label`
  display: grid; gap: 8px; color: var(--ink); font-size: .82rem; font-weight: 700;
  input, select, textarea {
    width: 100%; border: 1px solid var(--line-strong); border-radius: 12px; background: var(--surface); min-height: 48px;
    padding: 11px 13px; color: var(--ink); outline: none; transition: border .15s, box-shadow .15s, background .15s;
  }
  textarea { min-height: 100px; resize: vertical; }
  input:hover, select:hover, textarea:hover { border-color: var(--teal); }
  input:focus, select:focus, textarea:focus { border-color: var(--teal); box-shadow: 0 0 0 4px var(--focus-ring); }
  em { font-style: normal; color: var(--danger); font-weight: 500; }
`;
export const FormGrid = styled.div`
  display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px;
  @media (max-width: 640px) { grid-template-columns: 1fr; }
`;
export const FormSurface = styled.form`
  max-width: 820px; background: var(--surface); border: 1px solid var(--line); border-radius: 18px; padding: 28px; box-shadow: var(--shadow-sm);
  footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; }
`;
export const InlineForm = styled.form`
  display: flex; align-items: end; gap: 12px; flex-wrap: wrap;
  > label { flex: 1 1 180px; }
`;

const spin = keyframes`to { transform: rotate(360deg); }`;
const SpinningLoader = styled(LoaderCircle)`
  animation: ${spin} .8s linear infinite;
`;
const StateBox = styled.div`
  min-height: 220px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;
  color: var(--muted); padding: 30px; gap: 10px;
  h3 { color: var(--navy); margin: 4px 0 0; }
`;
export function LoadingState() {
  return <StateBox><SpinningLoader size={30} /><span>Carregando dados…</span></StateBox>;
}
export function EmptyState({ title, children }: PropsWithChildren<{ title: string }>) {
  return <StateBox><CheckCircle2 size={30} /><h3>{title}</h3><span>{children}</span></StateBox>;
}
export function ErrorState({ message = 'Não foi possível carregar os dados.' }: { message?: string }) {
  return <StateBox><AlertTriangle size={30} /><h3>Algo saiu do previsto</h3><span>{message}</span></StateBox>;
}
export const Split = styled.div`
  display: grid; grid-template-columns: minmax(0, 1.65fr) minmax(280px, .9fr); gap: 22px; align-items: start;
  @media (max-width: 980px) { grid-template-columns: 1fr; }
`;
export const DialogBackdrop = styled.div`
  position: fixed; inset: 0; z-index: 50; background: var(--overlay); backdrop-filter: blur(7px);
  display: grid; place-items: center; padding: 28px; animation: ${fadeIn} .2s ease both;
  @media (max-width: 640px) { place-items: end center; padding: 0; }
`;
export const Dialog = styled.div`
  width: min(720px, 100%); max-height: calc(100svh - 56px); overflow: hidden; display: flex; flex-direction: column;
  background: var(--surface); border: 1px solid var(--line); border-radius: 22px; box-shadow: var(--shadow-lg);
  > header {
    flex: 0 0 auto; display: flex; justify-content: space-between; gap: 20px; align-items: flex-start;
    padding: 22px 24px 20px; border-bottom: 1px solid var(--line); background: var(--surface);
  }
  h2 { margin: 0; color: var(--navy); font-size: 1.45rem; line-height: 1.2; }
  header p { margin: 5px 0 0; color: var(--muted); font-size: .84rem; line-height: 1.45; }
  @media (max-width: 640px) {
    width: 100%; max-height: 92svh; border-radius: 22px 22px 0 0; border-bottom: 0;
    > header { padding: 20px 20px 17px; }
  }
`;
const DialogBody = styled.div`
  min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 24px;
  scrollbar-gutter: stable;
  @media (max-width: 640px) { padding: 20px; }
`;
const DialogClose = styled.button`
  flex: 0 0 auto; width: 38px; height: 38px; display: grid; place-items: center; border: 1px solid var(--line);
  border-radius: 11px; background: var(--surface-muted); color: var(--muted); cursor: pointer; transition: .15s ease;
  &:hover { color: var(--navy); border-color: var(--line-strong); background: var(--teal-subtle); }
`;
export function DialogShell({ title, description, close, children }: { title: string; description?: string; close: () => void; children: ReactNode }) {
  return <DialogBackdrop onMouseDown={close}><Dialog role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.stopPropagation()}>
    <header><div><h2>{title}</h2>{description&&<p>{description}</p>}</div><DialogClose type="button" onClick={close} aria-label="Fechar modal"><X size={19}/></DialogClose></header>
    <DialogBody>{children}</DialogBody>
  </Dialog></DialogBackdrop>;
}
