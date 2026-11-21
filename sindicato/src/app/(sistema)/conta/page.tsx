import { Campo } from '@/components/Campos';
import { Form } from '@/components/Form';
import { Cabecalho, Cartao, Dados } from '@/components/Ui';
import { PAPEL } from '@/lib/rotulos';
import { usuarioAtual } from '@/lib/sessao';
import { trocarSenha } from '../configuracoes/acoes';

export const metadata = { title: 'Minha conta' };

export default async function Conta() {
  const u = await usuarioAtual();
  return (
    <>
      <Cabecalho titulo="Minha conta" />
      <div className="grade-2">
        <Cartao titulo="Dados">
          <Dados itens={[['Nome', u.nome], ['E-mail', u.email], ['Perfil', PAPEL[u.papel]], ['Sindicato', u.sindicato.nome]]} />
        </Cartao>
        <Cartao titulo="Alterar senha">
          <Form acao={trocarSenha} rotulo="Alterar senha">
            <div className="grade-campos">
              <Campo nome="atual" rotulo="Senha atual" tipo="password" obrigatorio largura="cheia" autoComplete="current-password" />
              <Campo nome="nova" rotulo="Nova senha" tipo="password" obrigatorio minLength={8} largura="cheia" autoComplete="new-password" />
            </div>
          </Form>
        </Cartao>
      </div>
    </>
  );
}
