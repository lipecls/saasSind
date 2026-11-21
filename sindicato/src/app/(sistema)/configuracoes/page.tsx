import { Campo, Grupo, Selecao } from '@/components/Campos';
import { BotaoAcao, Form } from '@/components/Form';
import { Cabecalho, Cartao, Etiqueta } from '@/components/Ui';
import { db } from '@/lib/db';
import { centavosParaInput, formatarCnpj } from '@/lib/formato';
import { PAPEL, UFS } from '@/lib/rotulos';
import { exigirAdmin } from '@/lib/sessao';
import { alternarUsuario, criarUsuario, salvarSindicato } from './acoes';

export const metadata = { title: 'Configurações' };

export default async function Configuracoes() {
  const admin = await exigirAdmin();
  const s = admin.sindicato;
  const usuarios = await db.usuario.findMany({ where: { sindicatoId: s.id }, orderBy: { nome: 'asc' } });
  return (
    <>
      <Cabecalho titulo="Configurações" subtitulo={`CNPJ ${formatarCnpj(s.cnpj)}`} />
      <Cartao titulo="Dados do sindicato">
        <Form acao={salvarSindicato}>
          <Grupo titulo="Identificação">
            <Campo nome="nome" rotulo="Nome" obrigatorio largura="cheia" padrao={s.nome} />
            <Campo nome="sigla" rotulo="Sigla" padrao={s.sigla} />
            <Campo nome="categoria" rotulo="Categoria profissional" padrao={s.categoria} />
            <Campo nome="email" rotulo="E-mail" tipo="email" padrao={s.email} />
            <Campo nome="telefone" rotulo="Telefone" padrao={s.telefone} />
            <Campo nome="endereco" rotulo="Endereço" largura="cheia" padrao={s.endereco} />
            <Campo nome="cidade" rotulo="Cidade" padrao={s.cidade} />
            <Selecao nome="uf" rotulo="UF" opcoes={UFS} vazio="—" padrao={s.uf} />
          </Grupo>
          <Grupo titulo="Cobrança">
            <Campo nome="mensalidade" rotulo="Mensalidade padrão (R$)" inputMode="decimal" padrao={centavosParaInput(s.mensalidadeCentavos)} />
            <Campo nome="diaVencimento" rotulo="Dia de vencimento" tipo="number" min={1} max={31} padrao={s.diaVencimento} />
          </Grupo>
        </Form>
      </Cartao>
      <Cartao titulo="Usuários do sistema">
          <table className="tabela">
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td>
                    {u.nome}
                    <small className="bloco">{u.email}</small>
                  </td>
                  <td>{PAPEL[u.papel]}</td>
                  <td>
                    <Etiqueta valor={u.ativo ? 'ATIVO' : 'CANCELADA'}>{u.ativo ? 'Ativo' : 'Inativo'}</Etiqueta>
                  </td>
                  <td className="acoes">
                    {u.id !== admin.id && <BotaoAcao acao={alternarUsuario} campos={{ id: u.id }} rotulo={u.ativo ? 'Desativar' : 'Reativar'} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <details className="expansivel">
            <summary>+ Adicionar usuário</summary>
            <Form acao={criarUsuario} rotulo="Criar usuário">
              <div className="grade-campos">
                <Campo nome="nome" rotulo="Nome" obrigatorio />
                <Campo nome="email" rotulo="E-mail" tipo="email" obrigatorio />
                <Campo nome="senha" rotulo="Senha inicial" tipo="password" obrigatorio minLength={8} />
                <Selecao nome="papel" rotulo="Perfil" opcoes={PAPEL} padrao="OPERADOR" />
              </div>
            </Form>
          </details>
        </Cartao>
    </>
  );
}
