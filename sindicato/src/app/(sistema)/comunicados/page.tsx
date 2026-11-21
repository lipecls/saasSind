import { AreaTexto, Campo } from '@/components/Campos';
import { BotaoAcao, Form } from '@/components/Form';
import { Cabecalho, Cartao, Vazio } from '@/components/Ui';
import { db } from '@/lib/db';
import { formatarDataHora } from '@/lib/formato';
import { usuarioAtual } from '@/lib/sessao';
import { excluirComunicado, publicarComunicado } from './acoes';

export const metadata = { title: 'Comunicados' };

export default async function Comunicados() {
  const { sindicatoId } = await usuarioAtual();
  const comunicados = await db.comunicado.findMany({
    where: { sindicatoId },
    include: { autor: { select: { nome: true } } },
    orderBy: { publicadoEm: 'desc' },
    take: 50,
  });
  return (
    <>
      <Cabecalho titulo="Comunicados" subtitulo="Avisos e informes à categoria" />
      <Cartao titulo="Novo comunicado">
        <Form acao={publicarComunicado} rotulo="Publicar">
          <div className="grade-campos">
            <Campo nome="titulo" rotulo="Título" obrigatorio largura="cheia" />
            <AreaTexto nome="conteudo" rotulo="Conteúdo" obrigatorio linhas={5} />
          </div>
        </Form>
      </Cartao>
      {comunicados.length === 0 ? (
        <Vazio>Nenhum comunicado publicado.</Vazio>
      ) : (
        comunicados.map((c) => (
          <Cartao
            key={c.id}
            titulo={c.titulo}
            acoes={<BotaoAcao acao={excluirComunicado} rotulo="Excluir" variante="perigo" campos={{ id: c.id }} confirmar="Excluir comunicado?" />}
          >
            <small>
              {formatarDataHora(c.publicadoEm)} · {c.autor?.nome ?? '—'}
            </small>
            <div className="texto-longo">{c.conteudo}</div>
          </Cartao>
        ))
      )}
    </>
  );
}
