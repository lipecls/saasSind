import Link from 'next/link';
import { Form } from '@/components/Form';
import { Campo } from '@/components/Campos';
import { entrar } from '../acoes';

export const metadata = { title: 'Entrar' };

export default async function Login({ searchParams }: { searchParams: Promise<{ voltar?: string }> }) {
  const { voltar } = await searchParams;
  return (
    <div className="caixa-publica">
      <h1>Entrar</h1>
      <Form acao={entrar} rotulo="Entrar">
        <input type="hidden" name="voltar" value={voltar ?? ''} />
        <div className="grade-campos">
          <Campo nome="email" rotulo="E-mail" tipo="email" obrigatorio largura="cheia" autoComplete="email" />
          <Campo nome="senha" rotulo="Senha" tipo="password" obrigatorio largura="cheia" autoComplete="current-password" />
        </div>
      </Form>
      <p className="rodape-publico">
        Sindicato novo por aqui? <Link href="/cadastro">Cadastre seu sindicato</Link>
      </p>
    </div>
  );
}
