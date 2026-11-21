import { AreaTexto, Campo, Grupo, Selecao } from '@/components/Campos';
import { Form } from '@/components/Form';
import { Cabecalho } from '@/components/Ui';
import { db } from '@/lib/db';
import { TIPO_ATENDIMENTO } from '@/lib/rotulos';
import { usuarioAtual } from '@/lib/sessao';
import { criarAtendimento } from '../acoes';

export const metadata = { title: 'Novo atendimento' };

export default async function NovoAtendimento({ searchParams }: { searchParams: Promise<{ filiado?: string }> }) {
  const usuario = await usuarioAtual();
  const { sindicatoId } = usuario;
  const { filiado } = await searchParams;
  const [filiados, empresas, usuarios] = await Promise.all([
    db.filiado.findMany({ where: { sindicatoId }, select: { id: true, nome: true, matricula: true }, orderBy: { nome: 'asc' } }),
    db.empresa.findMany({ where: { sindicatoId }, select: { id: true, razaoSocial: true }, orderBy: { razaoSocial: 'asc' } }),
    db.usuario.findMany({ where: { sindicatoId, ativo: true }, select: { id: true, nome: true }, orderBy: { nome: 'asc' } }),
  ]);
  return (
    <>
      <Cabecalho titulo="Novo atendimento" voltar={{ href: '/atendimentos', rotulo: 'Atendimentos' }} />
      <Form acao={criarAtendimento} rotulo="Abrir atendimento">
        <Grupo titulo="Solicitante">
          <Selecao
            nome="filiadoId"
            rotulo="Filiado"
            largura="cheia"
            vazio="— Não é filiado —"
            padrao={filiado}
            opcoes={filiados.map((f) => ({ valor: f.id, rotulo: `${f.nome} (#${f.matricula})` }))}
          />
          <Campo nome="solicitante" rotulo="Nome do solicitante (se não for filiado)" largura="cheia" />
          <Selecao
            nome="empresaId"
            rotulo="Empresa envolvida"
            largura="cheia"
            vazio="— A do filiado / nenhuma —"
            opcoes={empresas.map((e) => ({ valor: e.id, rotulo: e.razaoSocial }))}
          />
        </Grupo>
        <Grupo titulo="Atendimento">
          <Selecao nome="tipo" rotulo="Tipo" obrigatorio opcoes={TIPO_ATENDIMENTO} />
          <Selecao nome="responsavelId" rotulo="Responsável" padrao={usuario.id} opcoes={usuarios.map((u) => ({ valor: u.id, rotulo: u.nome }))} />
          <Campo nome="assunto" rotulo="Assunto" obrigatorio largura="cheia" placeholder="Ex.: Horas extras não pagas, homologação de rescisão…" />
          <AreaTexto nome="descricao" rotulo="Relato" linhas={6} />
        </Grupo>
      </Form>
    </>
  );
}
