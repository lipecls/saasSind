import { redirect } from 'next/navigation';
import { Form } from '@/components/Form';
import { Campo } from '@/components/Campos';
import { entrar, sistemaInstalado } from '../acoes';

export const metadata = { title: 'Entrar' };

export default async function Login({ searchParams }: { searchParams: Promise<{ voltar?: string }> }) {
  if (!(await sistemaInstalado())) redirect('/instalacao');
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
    </div>
  );
}
