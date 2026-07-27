import { Link } from 'react-router-dom';
import { Button, Page } from '../components/ui';
export function NotFoundPage(){return <Page style={{display:'grid',placeItems:'center',minHeight:'70vh',textAlign:'center'}}><div><h1>Página não encontrada</h1><p>O endereço informado não existe ou não está disponível para sua conta.</p><Button as={Link} to="/dashboard">Voltar ao dashboard</Button></div></Page>}
