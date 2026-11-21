import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import { Cabecalho, Etiqueta, Paginacao, paginaAtual, Vazio } from '@/components/Ui';
import { db } from '@/lib/db';
import { formatarDataHora } from '@/lib/formato';
import { chaves, STATUS_ATENDIMENTO, TIPO_ATENDIMENTO } from '@/lib/rotulos';
import { usuarioAtual } from '@/lib/sessao';

export const metadata = { title: 'Atendimentos' };
const POR_PAGINA = 30;

type Busca = { status?: string; tipo?: string; meus?: string; q?: string; pagina?: string };

export default async function Atendimentos({ searchParams }: { searchParams: Promise<Busca> }) {
  const usuario = await usuarioAtual();
  const p = await searchParams;
  const pagina = paginaAtual(p.pagina);
  const where: Prisma.AtendimentoWhereInput = { sindicatoId: usuario.sindicatoId };
  if (p.status === 'abertos' || !p.status) where.status = { in: ['ABERTO', 'EM_ANDAMENTO'] };
  else if (chaves(STATUS_ATENDIMENTO).includes(p.status as never)) where.status = p.status as never;
  if (chaves(TIPO_ATENDIMENTO).includes(p.tipo as never)) where.tipo = p.tipo as never;
  if (p.meus) where.responsavelId = usuario.id;
  const q = p.q?.trim();
  if (q) {
    where.OR = [
      { assunto: { contains: q, mode: 'insensitive' } },
      { solicitante: { contains: q, mode: 'insensitive' } },
      { filiado: { nome: { contains: q, mode: 'insensitive' } } },
      ...(/^\d+$/.test(q) ? [{ protocolo: Number(q) }] : []),
    ];
  }

  const [atendimentos, total] = await Promise.all([
    db.atendimento.findMany({
      where,
      include: { filiado: { select: { nome: true } }, responsavel: { select: { nome: true } }, empresa: { select: { razaoSocial: true } } },
      orderBy: { abertoEm: 'desc' },
      skip: (pagina - 1) * POR_PAGINA,
      take: POR_PAGINA,
    }),
    db.atendimento.count({ where }),
  ]);

  return (
    <>
      <Cabecalho
        titulo="Atendimentos"
        subtitulo="Jurídico, homologações, denúncias e orientações"
        acoes={
          <Link href="/atendimentos/novo" className="btn btn-primario">
            + Novo atendimento
          </Link>
        }
      />
      <form className="filtros">
        <input name="q" placeholder="Protocolo, assunto ou nome" defaultValue={q} />
        <select name="status" defaultValue={p.status ?? 'abertos'}>
          <option value="abertos">Em aberto</option>
          <option value="todos">Todas as situações</option>
          {Object.entries(STATUS_ATENDIMENTO).map(([v, r]) => (
            <option key={v} value={v}>
              {r}
            </option>
          ))}
        </select>
        <select name="tipo" defaultValue={p.tipo ?? ''}>
          <option value="">Todos os tipos</option>
          {Object.entries(TIPO_ATENDIMENTO).map(([v, r]) => (
            <option key={v} value={v}>
              {r}
            </option>
          ))}
        </select>
        <label className="check">
          <input type="checkbox" name="meus" value="1" defaultChecked={!!p.meus} /> Só os meus
        </label>
        <button className="btn btn-secundario">Filtrar</button>
      </form>
      {atendimentos.length === 0 ? (
        <Vazio>Nenhum atendimento encontrado.</Vazio>
      ) : (
        <div className="tabela-wrap">
          <table className="tabela">
            <thead>
              <tr>
                <th>Protocolo</th>
                <th>Assunto</th>
                <th>Solicitante</th>
                <th>Tipo</th>
                <th>Responsável</th>
                <th>Aberto em</th>
                <th>Situação</th>
              </tr>
            </thead>
            <tbody>
              {atendimentos.map((a) => (
                <tr key={a.id}>
                  <td className="num">#{a.protocolo}</td>
                  <td>
                    <Link href={`/atendimentos/${a.id}`}>{a.assunto}</Link>
                    {a.empresa && <small className="bloco">{a.empresa.razaoSocial}</small>}
                  </td>
                  <td>{a.filiado?.nome ?? a.solicitante ?? '—'}</td>
                  <td>{TIPO_ATENDIMENTO[a.tipo]}</td>
                  <td>{a.responsavel?.nome ?? '—'}</td>
                  <td>{formatarDataHora(a.abertoEm)}</td>
                  <td>
                    <Etiqueta valor={a.status}>{STATUS_ATENDIMENTO[a.status]}</Etiqueta>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Paginacao pagina={pagina} total={total} porPagina={POR_PAGINA} params={{ status: p.status, tipo: p.tipo, meus: p.meus, q }} />
    </>
  );
}
