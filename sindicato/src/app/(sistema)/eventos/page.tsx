import Link from 'next/link';
import { Cabecalho, Cartao, Vazio } from '@/components/Ui';
import { db } from '@/lib/db';
import { formatarDataHora } from '@/lib/formato';
import { TIPO_EVENTO } from '@/lib/rotulos';
import { usuarioAtual } from '@/lib/sessao';

export const metadata = { title: 'Eventos e assembleias' };

export default async function Eventos() {
  const { sindicatoId } = await usuarioAtual();
  const agora = new Date();
  const [proximos, passados] = await Promise.all([
    db.evento.findMany({ where: { sindicatoId, inicio: { gte: agora } }, orderBy: { inicio: 'asc' }, include: { _count: { select: { presencas: true } } } }),
    db.evento.findMany({ where: { sindicatoId, inicio: { lt: agora } }, orderBy: { inicio: 'desc' }, take: 50, include: { _count: { select: { presencas: true } } } }),
  ]);
  const lista = (eventos: typeof proximos) =>
    eventos.length === 0 ? (
      <Vazio>Nenhum evento.</Vazio>
    ) : (
      <table className="tabela">
        <thead>
          <tr>
            <th>Data</th>
            <th>Evento</th>
            <th>Tipo</th>
            <th>Local</th>
            <th className="num">Presentes</th>
          </tr>
        </thead>
        <tbody>
          {eventos.map((e) => (
            <tr key={e.id}>
              <td>{formatarDataHora(e.inicio)}</td>
              <td>
                <Link href={`/eventos/${e.id}`}>{e.titulo}</Link>
              </td>
              <td>{TIPO_EVENTO[e.tipo]}</td>
              <td>{e.local ?? '—'}</td>
              <td className="num">{e._count.presencas}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  return (
    <>
      <Cabecalho
        titulo="Eventos e assembleias"
        acoes={
          <Link href="/eventos/novo" className="btn btn-primario">
            + Novo evento
          </Link>
        }
      />
      <Cartao titulo="Próximos">{lista(proximos)}</Cartao>
      <Cartao titulo="Realizados">{lista(passados)}</Cartao>
    </>
  );
}
