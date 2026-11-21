import Link from 'next/link';
import { AreaTexto, Selecao } from '@/components/Campos';
import { Form } from '@/components/Form';
import { Cabecalho, Cartao, Dados, Etiqueta, Vazio } from '@/components/Ui';
import { db } from '@/lib/db';
import { formatarDataHora } from '@/lib/formato';
import { STATUS_ATENDIMENTO, TIPO_ATENDIMENTO } from '@/lib/rotulos';
import { usuarioAtual } from '@/lib/sessao';
import { garantir } from '@/lib/tenant';
import { registrarAndamento } from '../acoes';

export default async function FichaAtendimento({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sindicatoId } = await usuarioAtual();
  const [a, usuarios] = await Promise.all([
    db.atendimento
      .findFirst({
        where: { id, sindicatoId },
        include: {
          filiado: { select: { id: true, nome: true, matricula: true, telefone: true } },
          empresa: { select: { id: true, razaoSocial: true } },
          responsavel: { select: { nome: true } },
          andamentos: { include: { autor: { select: { nome: true } } }, orderBy: { criadoEm: 'desc' } },
        },
      })
      .then(garantir),
    db.usuario.findMany({ where: { sindicatoId, ativo: true }, select: { id: true, nome: true }, orderBy: { nome: 'asc' } }),
  ]);

  return (
    <>
      <Cabecalho
        titulo={`#${a.protocolo} · ${a.assunto}`}
        subtitulo={
          <>
            {TIPO_ATENDIMENTO[a.tipo]} · <Etiqueta valor={a.status}>{STATUS_ATENDIMENTO[a.status]}</Etiqueta>
          </>
        }
        voltar={{ href: '/atendimentos', rotulo: 'Atendimentos' }}
      />
      <div className="grade-2">
        <Cartao titulo="Dados">
          <Dados
            itens={[
              ['Solicitante', a.filiado ? <Link href={`/filiados/${a.filiado.id}`}>{a.filiado.nome} (#{a.filiado.matricula})</Link> : a.solicitante],
              ['Telefone', a.filiado?.telefone],
              ['Empresa', a.empresa ? <Link href={`/empresas/${a.empresa.id}`}>{a.empresa.razaoSocial}</Link> : null],
              ['Responsável', a.responsavel?.nome],
              ['Aberto em', formatarDataHora(a.abertoEm)],
              ['Concluído em', a.concluidoEm ? formatarDataHora(a.concluidoEm) : null],
            ]}
          />
          {a.descricao && <div className="texto-longo">{a.descricao}</div>}
        </Cartao>
        <Cartao titulo="Registrar andamento">
          <Form acao={registrarAndamento.bind(null, id)} rotulo="Registrar">
            <div className="grade-campos">
              <Selecao nome="status" rotulo="Situação" opcoes={STATUS_ATENDIMENTO} padrao={a.status} />
              <Selecao nome="responsavelId" rotulo="Responsável" padrao={a.responsavelId} opcoes={usuarios.map((u) => ({ valor: u.id, rotulo: u.nome }))} />
              <AreaTexto nome="texto" rotulo="Andamento" linhas={4} />
            </div>
          </Form>
        </Cartao>
      </div>
      <Cartao titulo="Histórico">
        {a.andamentos.length === 0 ? (
          <Vazio>Nenhum andamento registrado.</Vazio>
        ) : (
          <ol className="linha-tempo">
            {a.andamentos.map((n) => (
              <li key={n.id}>
                <small>
                  {formatarDataHora(n.criadoEm)} · {n.autor?.nome ?? 'Usuário removido'}
                </small>
                <div className="texto-longo">{n.texto}</div>
              </li>
            ))}
          </ol>
        )}
      </Cartao>
    </>
  );
}
